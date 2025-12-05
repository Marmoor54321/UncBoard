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
      <button class="btn btn-dark" @click="openAddColumnModal">Add column</button>
    </div>

    <div class="kanban-board pb-3">
      <KanbanColumn
        v-for="column in columns"
        :key="column._id || column.id"
        :column="column"
        :issues-by-column="issuesByColumn"
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
import { ref } from 'vue'
import KanbanColumn from './KanbanColumn.vue'
import BaseModal from '../Modals/BaseModal.vue'

const props = defineProps({
  selectedRepo: Object,
  columns: Array,
  issuesByColumn: Object,
  scrollContainer: Object,
  groups: Object,
  onDragEnd: Function,
  openIssue: Function,
  onMoveLeft: Function,
  onMoveRight: Function,
  // Funkcje API przekazywane z góry
  deleteColumn: Function,
  editColumn: Function,
  addColumn: Function,
})

const emit = defineEmits(['add-issue'])

const activeColumn = ref(null) 

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
  if (!name) return
  props.addColumn(props.selectedRepo.id, name, null)
  closeAddColumnModal()
}

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
    props.editColumn(activeColumn.value.id || activeColumn.value._id, trimmedName)
  }
  closeRenameModal()
}

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
    props.deleteColumn(activeColumn.value)
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
</style>