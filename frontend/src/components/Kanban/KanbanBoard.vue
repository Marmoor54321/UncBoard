<template>
  <div v-if="!selectedRepo" class="text-center text-white mt-5">
    <h4>Select a repository to view its issues</h4>
  </div>

  <div v-else class="flex-grow-1 d-flex flex-column overflow-hidden">
    
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="text-white">
        Issues for
        <span class="text-primary">
          <a :href="selectedRepo.html_url" target="_blank" rel="noopener noreferrer">
            {{ selectedRepo.name }}
          </a>
        </span>
      </h3>
      
      <div class="d-flex gap-2">
        
        <UniversalDropdown placement="bottom-end">
          <template #trigger>
            <button class="btn btn-dark d-flex align-items-center gap-2">
              Milestones
              <span v-if="selectedMilestones.length > 0" class="badge bg-primary rounded-pill">
                {{ selectedMilestones.length }}
              </span>
            </button>
          </template>

          <template #header>
            <DropdownSearch 
              v-model="milestoneSearch" 
              placeholder="Filter milestones..." 
            />
          </template>

          <DropdownList
            :items="filteredDropdownMilestones"
            :selected="selectedMilestones"
            :multiple="true"
            id-key="id"
            label-key="title"
            @select="toggleMilestoneFilter"
          >
            <template #item="{ item }">
              <div class="dropdown-row d-flex align-items-center gap-2">
                <span>{{ item.title }}</span>
              </div>
            </template>
          </DropdownList>
        </UniversalDropdown>
        
        <UniversalDropdown placement="bottom-end">
          <template #trigger>
            <button class="btn btn-dark d-flex align-items-center gap-2">
              Labels
              <span v-if="selectedLabels.length > 0" class="badge bg-primary rounded-pill">
                {{ selectedLabels.length }}
              </span>
            </button>
          </template>

          <template #header>
            <DropdownSearch 
              v-model="labelSearch" 
              placeholder="Filter labels..." 
            />
          </template>

          <DropdownList
            :items="filteredDropdownLabels"
            :selected="selectedLabels"
            :multiple="true"
            id-key="id"
            label-key="name"
            @select="toggleLabelFilter"
          >
            <template #item="{ item }">
              <div class="dropdown-row d-flex align-items-center gap-2">
                <span class="color-dot" :style="{ backgroundColor: '#' + item.color }"></span>
                <span>{{ item.name }}</span>
              </div>
            </template>
          </DropdownList>
        </UniversalDropdown>

        <button class="btn btn-dark" @click="openAddColumnModal">Add column</button> 
      </div>
    </div>

    <div class="kanban-board pb-3">
      <KanbanColumn
        v-for="column in columns"
        :key="column._id || column.id"
        :column="column"
        :issues-by-column="filteredIssuesByColumn"
        :scroll-container="scrollContainer"
        :groups="groups"
        :on-drag-end="onDragEnd"
        :open-issue="openIssue"
        :on-move-left="onMoveLeft"
        :on-move-right="onMoveRight"
        @add-issue="handleAddIssue"
        @request-rename="openRenameModal"
        @request-delete="openDeleteModal"
      />
    </div>

    <Teleport to="body">
      <BaseModal
        :show="showModalAddColumn"
        default-title="Add new column"
        @close="closeAddColumnModal"
        @confirm="confirmAddColumn"
      >
        <div class="modal-field">
          <label>Column name</label>
          <input
            v-model="newColumnName"
            type="text"
            placeholder="e.g. In Progress"
            class="modal-input"
            @keyup.enter="confirmAddColumn"
          />
        </div>
      </BaseModal>

      <BaseModal
        :show="showModalRename"
        default-title="Rename column"
        @close="closeRenameModal"
        @confirm="confirmRename"
      >
        <div class="modal-field">
          <label>New name</label>
          <input
            v-model="renameColumnName"
            type="text"
            class="modal-input"
            @keyup.enter="confirmRename"
          />
        </div>
      </BaseModal>

      <BaseModal
        :show="showModalDelete"
        default-title="Delete column?"
        :is-delete="true"
        @close="closeDeleteModal"
        @confirm="confirmDelete"
      >
        <p class="text-white-50 mb-4">
          Are you sure you want to delete the column
          <span class="text-white">"{{ activeColumn?.name }}"</span>? <br />
          All issues inside will be moved to the next available column.
        </p>
      </BaseModal>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useKanban } from '@/composables/useKanban.js'

// Komponenty
import KanbanColumn from './KanbanColumn.vue'
import BaseModal from '../Modals/BaseModal.vue'
import UniversalDropdown from '../Dropdown/UniversalDropdown.vue'
import DropdownSearch from '../Dropdown/DropdownSearch.vue'
import DropdownList from '../Dropdown/DropdownList.vue'

const { 
  selectedRepo, 
  columns, 
  issuesByColumn, 
  repoData,
  groups, 
  onDragEnd, 
  onMoveLeft, 
  onMoveRight, 
  addColumn, 
  deleteColumn, 
  editColumn 
} = useKanban()

const router = useRouter()
const route = useRoute()

// --- PROPS ---
defineProps({
  scrollContainer: Object,
})

const emit = defineEmits(['add-issue'])

// --- NAVIGATION ---
function openIssue(issue) {
  router.push({
    name: 'issue-details',
    params: { owner: route.params.owner, repo: route.params.repo, issueId: issue.number },
  })
}

// --- FILTROWANIE (Milestones) ---
const milestoneSearch = ref('')
const selectedMilestones = ref([])

const filteredDropdownMilestones = computed(() => {
  const q = milestoneSearch.value.toLowerCase()
  return (repoData.value.milestones || []).filter(m => m.title.toLowerCase().includes(q))
})

const toggleMilestoneFilter = (milestone) => {
  const index = selectedMilestones.value.findIndex(m => m.id === milestone.id)
  if (index !== -1) {
    selectedMilestones.value.splice(index, 1)
  } else {
    selectedMilestones.value.push(milestone)
  }
}

// --- FILTROWANIE (Labels) ---
const labelSearch = ref('')
const selectedLabels = ref([])

const filteredDropdownLabels = computed(() => {
  const q = labelSearch.value.toLowerCase()
  return (repoData.value.labels || []).filter(l => l.name.toLowerCase().includes(q))
})

const toggleLabelFilter = (label) => {
  const index = selectedLabels.value.findIndex(l => l.id === label.id)
  if (index !== -1) {
    selectedLabels.value.splice(index, 1)
  } else {
    selectedLabels.value.push(label)
  }
}

// --- LOGIKA FILTROWANIA ISSUE ---
const filteredIssuesByColumn = computed(() => {
  const hasMilestoneFilter = selectedMilestones.value.length > 0
  const hasLabelFilter = selectedLabels.value.length > 0

  if (!hasMilestoneFilter && !hasLabelFilter) {
    return issuesByColumn.value
  }

  const result = {}
  
  Object.keys(issuesByColumn.value).forEach(colKey => {
    const issues = issuesByColumn.value[colKey]
    
    result[colKey] = issues.filter(issue => {
      const matchesMilestone = !hasMilestoneFilter || (
        issue.milestone && selectedMilestones.value.some(m => m.id === issue.milestone.id)
      )
      const matchesLabel = !hasLabelFilter || (
        issue.labels && 
        issue.labels.some(issueLabel => selectedLabels.value.some(sel => sel.id === issueLabel.id))
      )
      return matchesMilestone && matchesLabel
    })
  })

  return result
})

// --- ZARZĄDZANIE KOLUMNAMI (Modale) ---
const activeColumn = ref(null) 

// Add Column
const showModalAddColumn = ref(false)
const newColumnName = ref('')

function openAddColumnModal() {
  newColumnName.value = ''
  showModalAddColumn.value = true
}
function closeAddColumnModal() {
  showModalAddColumn.value = false
}
function confirmAddColumn() {
  const name = newColumnName.value.trim()
  if (!name || !selectedRepo.value) return
  addColumn(selectedRepo.value.id, name, null)
  closeAddColumnModal()
}

// Rename Column
const showModalRename = ref(false)
const renameColumnName = ref('')

function openRenameModal(column) {
  activeColumn.value = column
  renameColumnName.value = column.name
  showModalRename.value = true
}
function closeRenameModal() {
  showModalRename.value = false
  activeColumn.value = null
}
function confirmRename() {
  const trimmedName = renameColumnName.value.trim()
  if (trimmedName && activeColumn.value) {
    editColumn(activeColumn.value.id || activeColumn.value._id, trimmedName)
  }
  closeRenameModal()
}

// Delete Column
const showModalDelete = ref(false)

function openDeleteModal(column) {
  activeColumn.value = column
  showModalDelete.value = true
}
function closeDeleteModal() {
  showModalDelete.value = false
  activeColumn.value = null
}
function confirmDelete() {
  if (activeColumn.value) {
    deleteColumn(activeColumn.value)
  }
  closeDeleteModal()
}

function handleAddIssue(column) {
  emit('add-issue', column)
}
</script>

<style>
.kanban-board {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 1rem;
  align-items: stretch;
  flex-grow: 1;
  min-height: 0;
  padding-bottom: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #2b2d31 transparent;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}
</style>