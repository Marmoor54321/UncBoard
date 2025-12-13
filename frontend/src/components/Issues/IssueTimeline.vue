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
          <span class="text-muted ms-1" style="font-size: 0.8rem">
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

          <div class="ms-auto position-relative">
            <i 
              class="bi bi-three-dots-vertical text-secondary cursor-pointer three-dots-icon"
              @click.stop="toggleMenu(item.id)"
            ></i>

            <div v-if="activeMenuId === item.id" class="dropdown-menu-custom" v-click-outside="closeMenu">
              <div class="dropdown-item-custom" @click="startEdit(item)">
                <i class="bi bi-pencil me-2"></i> Edit
              </div>
              <div class="dropdown-item-custom text-danger" @click="openDeleteModal(item.id)">
                <i class="bi bi-trash me-2"></i> Delete
              </div>
            </div>
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
              <button class="btn btn-sm btn-primary" @click="saveEdit(item.id)">Update comment</button>
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

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event, el);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent);
  }
};

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: Boolean
})

const emit = defineEmits(['edit-comment', 'delete-comment'])

const { renderMarkdown } = useMarkdown()

// --- Stan Menu i Edycji ---
const activeMenuId = ref(null)
const editingId = ref(null)
const editContent = ref('')

const showDeleteModal = ref(false)
const commentToDeleteId = ref(null)

// --- Metody Menu ---
const toggleMenu = (id) => {
  activeMenuId.value = activeMenuId.value === id ? null : id
}

const closeMenu = () => {
  activeMenuId.value = null
}

// --- Metody Edycji ---
const startEdit = (item) => {
  editingId.value = item.id
  editContent.value = item.body
  closeMenu()
}

const cancelEdit = () => {
  editingId.value = null
  editContent.value = ''
}

const saveEdit = (id) => {
  emit('edit-comment', { id, body: editContent.value })
  editingId.value = null // Zamknij edycję (aktualizacja przyjdzie z propsów po chwili, ale UI od razu reaguje)
}

//usuwanie komentarza
const openDeleteModal = (id) => {
  commentToDeleteId.value = id
  showDeleteModal.value = true
  closeMenu()
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

// --- Helpery (Formatowanie daty i ikony) ---
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

/* --- Menu Rozwijane --- */
.dropdown-menu-custom {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #25262a;
  border: 1px solid #444;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  z-index: 1000;
  min-width: 120px;
  overflow: hidden;
  margin-top: 4px;
}

.dropdown-item-custom {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #e6edf3;
  transition: background-color 0.2s;
}

.dropdown-item-custom:hover {
  background-color: #aa50e7; 
  color: white;
}
</style>