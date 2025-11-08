<template>
    <div v-if="!selectedRepo" class="text-center text-white mt-5">
          <h4>Select a repository to view its issues</h4>
        </div>

        <div v-else>
          <h3 class="mb-4 text-white">
            Issues for <span class="text-primary">{{ selectedRepo.name }}</span>
          </h3>
            <!--Kanban board-->
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
                />
            </div>

        </div>
</template>

<script setup>
// import KanbanColumn from './KanbanColumn.vue'
import KanbanColumn from './KanbanColumn.vue'

defineProps({
  selectedRepo: Object,
  columns: Array,
  issuesByColumn: Object,
  scrollContainer: Object,
  groups: Object,
  onDragEnd: Function,
  openIssue: Function
})
</script>