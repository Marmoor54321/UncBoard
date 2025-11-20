<template>
  <div v-if="!selectedRepo" class="text-center text-white mt-5">
    <h4>Select a repository to view its issues</h4>
  </div>

  <div v-else>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="text-white">
        Issues for <span class="text-primary">{{ selectedRepo.name }}</span>
      </h3>

      <button class="btn btn-success" @click="handleAddColumn">
        Add column
      </button>
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
      />
    </div>

  </div>
</template>

<script setup>
import KanbanColumn from './KanbanColumn.vue'



defineProps({
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
  addColumn: Function
})

function handleAddColumn() {
  const name = prompt("Enter column name:")
  if (!name || !name.trim()) return

  props.addColumn(props.selectedRepo.id, name.trim(), null)
}
</script>