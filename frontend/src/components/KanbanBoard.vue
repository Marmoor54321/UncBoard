<template>
  <div v-if="!selectedRepo" class="text-center text-white mt-5">
    <h4>Select a repository to view its issues</h4>
  </div>

  <div v-else>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="text-white">
        Issues for <span class="text-primary">{{ selectedRepo.name }}</span>
      </h3>

      <button class="btn btn-dark" @click="showModalAddColumn = true">Add column</button>

        <Teleport to="body">
          <BaseModal
            :show="showModalAddColumn"
            default-title="Add new column"
            @close="closeModalAddColumn"
            @confirm="onAddColumn"
          >
            <div class="modal-field">
              <label>Column name</label>
                <input
                  v-model="newColumnName"
                  type="text"
                  placeholder="e.g. In Progress"
                  class="modal-input"
              />
            </div>
          </BaseModal>
        </Teleport>
      </div>

    <!-- Kanban board -->
    <div class="row row-cols-1 row-cols-lg-2 row-cols-xl-4 g-3">
      <kanban-column
        v-for="column in columns"
        :key="column._id"
        :column="column"
        :issues-by-column="issuesByColumn"
        :scroll-container="scrollContainer"
        :groups="groups"
        :on-drag-end="onDragEnd"
        :open-issue="openIssue"
        :on-move-left="onMoveLeft"
        :on-move-right="onMoveRight"
        :delete-column="deleteColumn"
        :edit-column="editColumn"
        @add-issue="handleAddIssue"
      />
    </div>
  </div>
</template>

<script setup>
import KanbanColumn from './KanbanColumn.vue'
import BaseModal from './Modals/BaseModal.vue'
import { ref } from 'vue'

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
  deleteColumn: Function,
  editColumn: Function,
  addColumn: Function,
})
const emit = defineEmits(['add-issue'])
const showModalAddColumn = ref(false)
const newColumnName = ref('')

// Funkcja zamykająca modal
function closeModalAddColumn() {
  showModalAddColumn.value = false
  newColumnName.value = ''
}

// Funkcja tworząca kolumnę
function onAddColumn() {
  const name = newColumnName.value.trim()
  if (!name) return

  props.addColumn(props.selectedRepo.id, name, null)
  closeModalAddColumn()
}
function handleAddIssue(column) {
  emit('add-issue', column)
}
</script>

<style>



</style>
