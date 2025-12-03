<template>
  <div v-if="!selectedRepo" class="text-center text-white mt-5">
    <h4>Select a repository to view its issues</h4>
  </div>

  <div v-else>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="text-white">
        Issues for 
        <span class="text-primary">
            <a :href="selectedRepo.html_url" target="_blank" rel="noopener noreferrer">
              {{ selectedRepo.name }}
            </a>          
        </span>
      </h3>
      <button class="btn btn-dark" @click="showModalAddColumn = true">Add column</button>

      <Teleport to="body">
        <div v-if="showModalAddColumn" class="modal-backdrop" @click.self="closeModalAddColumn">
          <div class="modal-card animate-modal">
            <h4 class="modal-title">Add new column</h4>

            <div class="modal-field">
              <label>Column name</label>
              <input
                v-model="newColumnName"
                type="text"
                placeholder="e.g. In Progress"
                class="modal-input"
              />
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" @click="closeModalAddColumn">Cancel</button>
              <button class="btn-create" @click="onAddColumn">Add</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- Kanban board -->
    <div class="kanban-board pb-3">
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
/* ---------------------------- */
/* MODAL (UJEDNOLICONE STYLE)  */
/* ---------------------------- */

/* Backdrop – Ujednolicony styl z rozmyciem */
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

/* Card - Ujednolicony styl */
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

.kanban-board {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 1rem;
  
  /* ZMIANA 1: Rozciągnij kolumny do pełnej wysokości kontenera */
  align-items: stretch; 
  
  /* ZMIANA 2: Wymuś 100% wysokości dostępnej w rodzicu */
  height: 100%;
  
  padding-bottom: 1rem;
  scrollbar-width: thin;
  scrollbar-color: #2b2d31;
}
.kanban-board::-webkit-scrollbar {
  height: 8px;
}

.kanban-board::-webkit-scrollbar-track {
  background: #2b2d31;
  border-radius: 4px;
}

.kanban-board::-webkit-scrollbar-thumb {
  background-color: #aa50e7;
  border-radius: 4px;
}
</style>
