<template>
  <div class="kanban-col-wrapper">
    <div class="card h-100 d-flex flex-column" style="border: 1px solid #aa50e7">
      <div class="card-header bg-dark text-white text-uppercase small d-flex justify-content-between align-items-center">
        <span>{{ column.name }}</span>

        <div class="btn-container">
          <button class="primary-btn btn btn-sm text-white" @click="$emit('add-issue', column)">+</button>

          <div class="dropdown position-relative">
            <button class="primary-btn btn btn-sm text-white" @click.stop="toggleMenu">⋮</button>
            
            <div v-if="showMenu" class="menu shadow">
              <button class="menu-item" @click="handleAction(() => onMoveLeft(column))">Move left</button>
              <button class="menu-item" @click="handleAction(() => onMoveRight(column))">Move right</button>
              <button class="menu-item" @click="handleAction(() => $emit('request-rename', column))">Rename</button>
              <button class="menu-item" @click="handleAction(() => $emit('request-delete', column))">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-body rounded-bottom-1 d-flex flex-column p-0" style="background-color: #303236; overflow: hidden;">
        <draggable
          v-model="issuesByColumn[column.name]"
          :group="groups"
          item-key="id"
          animation="200"
          ghost-class="ghost"
          chosen-class="chosen"
          @end="onDragEnd"
          class="dropzone"
          :scroll="scrollContainer"
          :scrollSensitivity="100"
          :scrollSpeed="15"
          :on-move-left="onMoveLeft"
          :on-move-right="onMoveRight"
        >
          <template #item="{ element }">
            <KanbanTaskCard 
              :title="element.title"
              :body="element.body"
              :data-item-id="element.id"
              @click="openIssue(element)"
            />
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import draggable from 'vuedraggable'
import KanbanTaskCard from './KanbanIssueCard.vue' // Pamiętaj o imporcie

const props = defineProps({
  column: Object,
  issuesByColumn: Object,
  scrollContainer: Object,
  groups: Object,
  onDragEnd: Function,
  openIssue: Function,
  onMoveLeft: Function,
  onMoveRight: Function,
})

const emit = defineEmits(['add-issue', 'request-rename', 'request-delete'])

const showMenu = ref(false)

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function handleAction(actionCallback) {
  actionCallback()
  showMenu.value = false
}

function handleClickOutside(e) {
  if (!e.target.closest('.dropdown')) {
    showMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.kanban-col-wrapper {
  flex: 0 0 auto;
  width: 320px;
  height: 100%;
}

.btn-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-btn {
  background-color: #2b2d31;
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  margin-left: 5px;
  border-radius: 4px;
  font-size: 18px;
  line-height: 18px;
  padding: 0;
}

.primary-btn:hover {
  background-color: #3f4146;
}

.dropzone {
  flex-grow: 1;
  overflow-y: auto;
  min-height: 0;
  height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #2b2d31 transparent;
}

.menu {
  position: absolute;
  right: 0;
  top: 1.5rem;
  background: #2b2d31;
  border-radius: 6px;
  padding: 0.25rem 0;
  display: flex;
  flex-direction: column;
  min-width: 120px;
  z-index: 100; 
}

.menu-item {
  background: transparent;
  color: #e0e0e0;
  border: none;
  text-align: left;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
}

.menu-item:hover {
  background-color: #3b3e42;
  color: white;
}

.ghost { opacity: 1; }
.chosen {
  background-color: #aa50e7 !important;
  transform: scale(1.05);
}
</style>