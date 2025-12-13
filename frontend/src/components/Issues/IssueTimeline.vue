<template>
  <div v-if="loading" class="text-center py-3 text-secondary">
    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
    Loading timeline...
  </div>

  <div v-else class="d-flex flex-column gap-3 position-relative mb-4">
    <div v-if="items.length === 0" class="text-secondary mb-3">
      No activity yet.
    </div>

    <div v-for="item in items" :key="item.id">
      
      <div v-if="item.event" class="d-flex align-items-center text-secondary ms-4 py-1" style="font-size: 0.9rem">
        <span class="me-2 d-flex align-items-center justify-content-center rounded-circle"
          style="width: 28px; height: 28px; background-color: #303236; border: 1px solid #444;">
          <i :class="getEventIcon(item.event)"></i>
        </span>
        <span>
          <strong class="text-white">
            {{ item.event == "assigned" || item.event == "unassigned" ? item.assigner?.login : item.actor?.login }}
          </strong>
          {{ getEventText(item) }}
          <span class=" text-white ms-1" style="font-size: 0.8rem">
            {{ formatDate(item.created_at) }}
          </span>
        </span>
      </div>

      <div v-else class="comment-box border border-secondary rounded">
        
        <div class="comment-header d-flex align-items-center p-2 border-bottom border-secondary position-relative">
          <img :src="item.user.avatar_url" width="24" height="24" class="rounded-circle me-2" />
          <span class="fw-bold me-2" style="font-size: 0.9rem">{{ item.user.login }}</span>
          <span class="text-secondary" style="font-size: 0.85rem">
            commented on {{ formatDate(item.created_at) }}
          </span>
          <span v-if="item.author_association === 'OWNER'" class="badge border border-secondary text-secondary ms-2" style="font-size: 0.7rem">
            Author
          </span>

          <div class="ms-auto">
            <UniversalDropdown 
              placement="bottom" 
              class="action-dropdown"
              :ref="(el) => setDropdownRef(el, item.id)"
            >
              <template #trigger>
                <i class="bi bi-three-dots-vertical text-secondary cursor-pointer three-dots-icon"></i>
              </template>

              <div class="d-flex flex-column py-1">
                <div class="dropdown-item-custom" @click="startEdit(item)">
                  <i class="bi bi-pencil me-2"></i> Edit
                </div>
                <div class="dropdown-item-custom text-danger" @click="openDeleteModal(item.id)">
                  <i class="bi bi-trash me-2"></i> Delete
                </div>
              </div>
            </UniversalDropdown>
          </div>
          </div>

        <div class="comment-body p-3">
          <div v-if="editingId === item.id">
            <textarea 
              v-model="editContent" 
              class="form-control bg-dark text-white border-secondary mb-2" 
              rows="4"
            ></textarea>
            <div class="d-flex gap-2 justify-content-end">
              <button class="btn btn-sm btn-outline-secondary" @click="cancelEdit">Cancel</button>
              <button class="btn-update" @click="saveEdit(item.id)">Update comment</button>
            </div>
          </div>
          <div v-else v-html="renderMarkdown(item.body)"></div>
        </div>
      </div>

    </div>
  </div>

  <Teleport to="body">
    <BaseModal
      :show="showDeleteModal"
      default-title="Delete comment?"
      :is-delete="true"
      @close="closeDeleteModal"
      @confirm="handleDeleteConfirm"
    >
      <p class="text-white-50 mb-4">
        Are you sure you want to delete this comment? <br />
        This action cannot be undone.
      </p>
    </BaseModal>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useMarkdown } from '../../composables/useMarkdown'
import BaseModal from '../Modals/BaseModal.vue'
import UniversalDropdown from '../Dropdown/UniversalDropdown.vue' // Upewnij się co do ścieżki

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: Boolean
})

const emit = defineEmits(['edit-comment', 'delete-comment'])

const { renderMarkdown } = useMarkdown()

// --- Refs dla Dropdownów ---
const dropdownRefs = ref(new Map())

const setDropdownRef = (el, id) => {
  if (el) {
    dropdownRefs.value.set(id, el)
  } else {
    dropdownRefs.value.delete(id)
  }
}

// Funkcja pomocnicza do zamykania konkretnego dropdowna
const closeDropdown = (id) => {
  const dropdown = dropdownRefs.value.get(id)
  if (dropdown && dropdown.close) {
    dropdown.close()
  }
}

// --- Stan Edycji ---
const editingId = ref(null)
const editContent = ref('')

// --- Stan Modala ---
const showDeleteModal = ref(false)
const commentToDeleteId = ref(null)

// --- Metody Edycji ---
const startEdit = (item) => {
  editingId.value = item.id
  editContent.value = item.body
  closeDropdown(item.id) 
}

const cancelEdit = () => {
  editingId.value = null
  editContent.value = ''
}

const saveEdit = (id) => {
  emit('edit-comment', { id, body: editContent.value })
  editingId.value = null
}

// --- Metody Usuwania ---
const openDeleteModal = (id) => {
  commentToDeleteId.value = id
  showDeleteModal.value = true
  closeDropdown(id) 
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  commentToDeleteId.value = null
}

const handleDeleteConfirm = () => {
  if (commentToDeleteId.value) {
    emit('delete-comment', commentToDeleteId.value)
  }
  closeDeleteModal()
}

// --- Helpery ---
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const getEventIcon = (eventType) => {
  const map = {
    closed: 'bi-check-circle-fill text-danger',
    reopened: 'bi-dot text-success',
    labeled: 'bi-tag-fill text-info',
    unlabeled: 'bi-tag text-secondary',
    assigned: 'bi-person-plus-fill text-warning',
    unassigned: 'bi-person-dash text-secondary',
    referenced: 'bi-bookmark-fill text-secondary',
    renamed: 'bi-pencil text-secondary'
  }
  return map[eventType] || 'bi-circle text-secondary'
}

const getEventText = (item) => {
  switch (item.event) {
    case 'closed': return `closed this issue`
    case 'reopened': return `reopened this issue`
    case 'labeled': return `added the "${item.label?.name || 'label'}" label`
    case 'unlabeled': return `removed the "${item.label?.name || 'label'}" label`
    case 'assigned': return `assigned ${item.assignee?.login || 'someone'}`
    case 'unassigned': return `unassigned ${item.assignee?.login || 'someone'}`
    case 'renamed': return `changed the title`
    default: return item.event.replace('_', ' ')
  }
}
</script>

<style scoped>
.comment-header { background-color: #3a3b40; border-top-left-radius: 6px; border-top-right-radius: 6px; color: #c9d1d9; }
.comment-body { background-color: #303236; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; color: #e6edf3; overflow-wrap: break-word; }
.comment-body :deep(img) { max-width: 100%; }

/* --- Ikona Trzech Kropek --- */
.three-dots-icon {
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  padding: 4px;
  cursor: pointer;
}
.comment-header:hover .three-dots-icon, 
.three-dots-icon:hover {
  opacity: 1;
}
.three-dots-icon:hover {
  color: white !important;
}

/* --- Style dla Dropdown Items --- */
.dropdown-item-custom {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #e6edf3;
  transition: all 0.2s ease;
  border: 1px solid transparent; 
  border-radius: 4px; 
  margin: 2px 4px;    
}

.dropdown-item-custom:hover {
  background-color: #3b3e42; 
  border-color: #aa50e7;    
  color: white;
}

.action-dropdown :deep(.dropdown-panel) {
  width: 140px !important; 
  right: 0 !important;    
  left: auto !important;   
}

.btn-update { background: #aa50e7; color: white; border: none; padding: 5px 8px; border-radius: 8px; font-size: small;}
</style>