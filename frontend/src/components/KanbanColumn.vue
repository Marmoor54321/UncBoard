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
            <div
              class="issuebox mb-2 p-2 rounded"
              :data-item-id="element.id"
              @click="openIssue(element)"
            >
              <div class="issuetitle">
                <strong>{{ element.title }}</strong>
              </div>
              <div class="issuebody small">{{ element.body }}</div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="showModalRenameColumn" class="modal-backdrop" @click.self="closeRenameModal">
      <div class="modal-card animate-modal">
        <h4 class="modal-title">Rename column</h4>

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

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeRenameModal">Cancel</button>
          <button class="btn-create" @click="confirmRename">Rename</button>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="showModalDeleteColumn" class="modal-backdrop" @click.self="closeDeleteModal">
      <div class="modal-card animate-modal">
        <h4 class="modal-title text-danger">Delete column?</h4>

        <p class="text-white-50 mb-4">
          Are you sure you want to delete the column
          <span class="text-white">"{{ columnToDeleteName }}"</span>? <br />
          All issues inside will be moved to the next available column.
        </p>

        <div class="modal-actions">
          <button class="btn-cancel" @click="closeDeleteModal">Cancel</button>
          <button class="btn-delete" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
  flex: 0 0 auto;       /* Nie kurcz się, nie rozciągaj automatycznie */
  width: 320px;         /* Stała szerokość kolumny */
  height: 100%; /* DODANE: Kolumna musi być pełnej wysokości */
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
  
flex-grow: 1;           /* Zajmij całą wolną przestrzeń w karcie */
  overflow-y: auto;       /* Scrolluj tylko ten element */
  min-height: 0;          /* Zapobiega wypychaniu kontenera flex */
  height: 0;              /* Hack dla flexboxa, żeby scroll działał poprawnie */

  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  
  scrollbar-width: thin;
  scrollbar-color: #2b2d31;}


.issuebox {
  background-color: #3b3e42;
  color: white;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
}
.issuebox:hover {
  background-color: #50545b;
}
.chosen {
  background-color: #aa50e7 !important;
  transform: scale(1.05);
}
.ghost {
  opacity: 1;
}
.issuebody {
  margin-top: 5px;
  font-size: 14px;
  color: #d1d1d1;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: break-word;
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

.modal-backdrop {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* Card  */
.modal-card {
  background: #2b2d31;
  padding: 24px;
  width: 360px;
  border-radius: 14px;
  border: 1px solid #444;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45);
  color: white;
}

/* Animacja */
.animate-modal {
  animation: popupShow 0.18s ease;
}

@keyframes popupShow {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Tytuł */
.modal-title {
  font-size: 20px;
  margin-bottom: 16px;
}

/* Pole */
.modal-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;
}

.modal-field label {
  font-size: 14px;
  margin-bottom: 6px;
  color: #cfcfcf;
}

/* Input */
.modal-input {
  background: #1f2023;
  border: 1px solid #555;
  color: white;
  padding: 10px 12px;
  border-radius: 8px;
  transition: 0.15s;
}

.modal-input:focus {
  border-color: #aa50e7;
  outline: none;
  box-shadow: 0 0 4px rgba(170, 80, 231, 0.4);
}

/* Przyciski */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background: transparent;
  color: #ccc;
  border: 1px solid #555;
  padding: 8px 16px;
  border-radius: 8px;
  transition: 0.15s;
}

.btn-cancel:hover {
  background: #3a3b3f;
  border-color: #777;
}

.btn-create {
  background: #aa50e7;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: 0.15s;
}

.btn-create:hover {
  background: #b964f1;
}

.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: 0.15s;
}

.btn-delete:hover {
  background: #bb2d3b;
}
</style>
