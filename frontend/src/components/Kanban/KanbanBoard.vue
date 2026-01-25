<template>
  <div v-if="!selectedRepo" class="text-center text-white mt-5">
    <h4>Select a repository to view its issues</h4>
  </div>

  <div v-else class="flex-grow-1 d-flex flex-column overflow-hidden">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="text-white">
        Issues for
        <span>
          <a
            :href="selectedRepo.html_url"
            target="_blank"
            rel="noopener noreferrer"
            style="color: #aa50e7; text-decoration: none; font-weight: bold"
          >
            {{ selectedRepo.name }}
          </a>
        </span>
      </h3>

      <div class="d-flex gap-2">
        <UniversalDropdown placement="bottom-end">
          <template #trigger>
            <button class="btn btn-dark d-flex align-items-center gap-2">
              Milestones
              <span
                v-if="selectedMilestones.length > 0"
                class="badge rounded-pill"
                style="background-color: #aa50e7 !important"
              >
                {{ selectedMilestones.length }}
              </span>
            </button>
          </template>

          <template #header>
            <DropdownSearch v-model="milestoneSearch" placeholder="Filter milestones..." />
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
              <span
                v-if="selectedMilestones.length > 0"
                class="badge rounded-pill"
                style="background-color: #aa50e7 !important"
              >
                {{ selectedLabels.length }}
              </span>
            </button>
          </template>

          <template #header>
            <DropdownSearch v-model="labelSearch" placeholder="Filter labels..." />
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

    <div class="kanban-board pb-3" ref="boardRef">
      <KanbanColumn
        v-for="column in columns"
        :key="column._id || column.id"
        :column="column"
        :issues-by-column="filteredIssuesByColumn"
        :scroll-container="scrollContainer"
        :groups="groups"
        :on-drag-start="handleBoardDragStart"
        :on-drag-end="handleBoardDragEnd"
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useKanban } from '@/composables/useKanban.js'
import { useKanbanFilters } from '@/composables/useKanbanFilters.js'

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
  editColumn,
} = useKanban()

const {
  milestoneSearch,
  selectedMilestones,
  filteredDropdownMilestones,
  toggleMilestoneFilter,

  labelSearch,
  selectedLabels,
  filteredDropdownLabels,
  toggleLabelFilter,

  filteredIssuesByColumn,
} = useKanbanFilters(repoData, issuesByColumn)

const router = useRouter()
const route = useRoute()

defineProps({
  scrollContainer: Object,
})

const emit = defineEmits(['add-issue'])

function openIssue(issue) {
  router.push({
    name: 'issue-details',
    params: { owner: route.params.owner, repo: route.params.repo, issueId: issue.number },
  })
}

// --- ZARZĄDZANIE KOLUMNAMI  ---
const activeColumn = ref(null)

// dodaj kolumnę
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

// Zmień nazwę kolumny
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

// Usuń kolumnę
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

// --- AUTO-SCROLL ---
const boardRef = ref(null)

const scrollState = {
  direction: 0,
  interval: null,
}

const updateScrollInterval = () => {
  if (scrollState.direction !== 0 && !scrollState.interval) {
    scrollState.interval = setInterval(() => {
      if (boardRef.value) {
        const speed = 20
        boardRef.value.scrollLeft += scrollState.direction * speed
      }
    }, 16)
  } else if (scrollState.direction === 0 && scrollState.interval) {
    clearInterval(scrollState.interval)
    scrollState.interval = null
  }
}

const handleBoardDragStart = () => {}

const stopAutoScroll = () => {
  scrollState.direction = 0
  updateScrollInterval()
}

const handleBoardDragEnd = () => {
  stopAutoScroll()
}

const handleDragAutoScroll = (e) => {
  if (!boardRef.value) return

  e.preventDefault()

  const { clientX } = e
  const { innerWidth } = window
  const threshold = 150

  if (clientX > innerWidth - threshold) {
    scrollState.direction = 1
  } else if (clientX < threshold) {
    scrollState.direction = -1
  } else {
    scrollState.direction = 0
  }

  updateScrollInterval()
}

onMounted(() => {
  window.addEventListener('dragover', handleDragAutoScroll, true)
  window.addEventListener('dragend', stopAutoScroll, true)
  window.addEventListener('drop', stopAutoScroll, true)
})

onUnmounted(() => {
  window.removeEventListener('dragover', handleDragAutoScroll, true)
  window.removeEventListener('dragend', stopAutoScroll, true)
  window.removeEventListener('drop', stopAutoScroll, true)
  stopAutoScroll()
})
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
