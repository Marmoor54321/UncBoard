<template>
  <div class="kanban-col-wrapper">
    <div class="card h-100 d-flex flex-column" style="border: 1px solid #aa50e7">
      <div
        class="card-header bg-dark text-white text-uppercase small d-flex justify-content-between align-items-center"
      >
        <span>{{ column.name }}</span>

        <div class="btn-container">
          <button class="primary-btn btn btn-sm text-white" @click="toggleAddIssue">+</button>

          <div class="dropdown position-relative">
            <button class="primary-btn btn btn-sm text-white" @click="toggleMenu">⋮</button>
            <div v-if="showMenu" class="menu shadow">
              <button class="menu-item" @click="(onMoveLeft(column), toggleMenu())">
                Move left
              </button>
              <button class="menu-item" @click="(onMoveRight(column), toggleMenu())">
                Move right
              </button>
              <button class="menu-item" @click="(openRenameModal(column), toggleMenu())">
                Rename
              </button>
              <button class="menu-item" @click="(openDeleteModal(column), toggleMenu())">
                Delete
              </button>
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
          ~~
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

  <Teleport to="body">
    <BaseModal
      :show="showModalRenameColumn"
      default-title="Rename column"
      @close="closeRenameModal"
      @confirm="confirmRename"
    >
      <div class="modal-field">
        <label>New name</label>
        <input
          v-model="newName"
          type="text"
          placeholder="e.g. Done"
          class="modal-input"
          @keyup.enter="confirmRename"
        />
      </div>
    </BaseModal>
  </Teleport>

    <Teleport to="body">
    <BaseModal
      :show="showModalDeleteColumn"
      default-title="Delete column?"
      :is-delete="true"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    >
      <p class="text-white-50 mb-4">
        Are you sure you want to delete the column
        <span class="text-white">"{{ columnToDeleteName }}"</span>? <br />
        All issues inside will be moved to the next available column.
      </p>
    </BaseModal>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import BaseModal from './Modals/BaseModal.vue'
import KanbanTaskCard from './KanbanIssueCard.vue'
import draggable from 'vuedraggable'

const props = defineProps({
  column: Object,
  issuesByColumn: Object,
  scrollContainer: Object,
  groups: Object,
  onDragEnd: Function,
  openIssue: Function,
  onMoveLeft: Function,
  onMoveRight: Function,
  deleteColumn: Function,
  editColumn: Function,
})
const emit = defineEmits(['add-issue'])
const showMenu = ref(false)
function toggleMenu() {
  showMenu.value = !showMenu.value
}

// Obsługa kliknięcia poza menu i poza modalem
function handleClickOutside(e) {
  if (!e.target.closest('.dropdown')) {
    showMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

// rename modal
const showModalRenameColumn = ref(false)
const newName = ref('')

function openRenameModal(column) {
  newName.value = column.name
  showModalRenameColumn.value = true
}

function closeRenameModal() {
  showModalRenameColumn.value = false
  newName.value = ''
}

function confirmRename() {
  const trimmedName = newName.value.trim()

  if (!trimmedName || trimmedName === props.column.name) {
    closeRenameModal()
    return
  }

  props.editColumn(props.column.id || props.column._id, trimmedName) // Używamy _id lub id, zależnie od backendu
  closeRenameModal()
}

// delete modal
const showModalDeleteColumn = ref(false)
const columnToDeleteName = ref('')
const columnToDeleteId = ref(null)
const columnToDeleteObject = ref(null)

function openDeleteModal(column) {
  columnToDeleteName.value = column.name
  columnToDeleteId.value = column.id || column._id
  columnToDeleteObject.value = column
  showModalDeleteColumn.value = true
}
function closeDeleteModal() {
  showModalDeleteColumn.value = false
  columnToDeleteName.value = ''
  columnToDeleteId.value = null
  columnToDeleteObject.value = null
}

function confirmDelete() {
  if (columnToDeleteObject.value) {
    props.deleteColumn(columnToDeleteObject.value)
  }
  closeDeleteModal()
}
function toggleAddIssue() {
  emit('add-issue', props.column)
}
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
.btn-container .primary-btn {
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
.btn-container button:hover {
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
  scrollbar-color: #2b2d31;}


.chosen {
  background-color: #aa50e7 !important;
  transform: scale(1.05);
}
.ghost {
  opacity: 1;
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
  z-index: 10;
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
.rename-input {
  width: 100%;
  padding: 4px 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background-color: #3b3e42;
  border: 1px solid #aa50e7;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s ease-in-out;
  box-sizing: border-box;
}

.rename-input:focus {
  background-color: #50545b;
  border-color: #d16aff;
  box-shadow: 0 0 4px rgba(170, 80, 231, 0.6);
}

</style>
