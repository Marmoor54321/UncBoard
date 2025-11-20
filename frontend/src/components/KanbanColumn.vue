<template>
  <div class="col">
    <div class="card h-100" style="border: 1px solid #aa50e7">
      <div class="card-header bg-dark text-white text-uppercase small d-flex justify-content-between align-items-center">
        <span v-if="!editing">{{ column.name }}</span>
        <input
          v-else
          ref="inputRef"
          v-model="newName"
          class="rename-input"
          @keyup.enter="saveEdit"
          @blur="saveEdit"
        />


        <div class="dropdown position-relative">
          <button
            class="btn btn-sm text-white"
            @click="toggleMenu"
            style="background: transparent; border: none;"
          >
            ⋮
          </button>

          <div v-if="showMenu" class="menu shadow">
            <button class="menu-item" @click="onMoveLeft(column), toggleMenu()">Move left</button>
            <button class="menu-item" @click="onMoveRight(column), toggleMenu()">Move right</button>
            <button class="menu-item" @click="startEdit(column), toggleMenu()">Rename</button>
            <button class="menu-item" @click="deleteColumn(column), toggleMenu()">Delete</button>

          </div>
        </div>
      </div>

      <div class="card-body rounded-bottom-1" style="background-color: #303236">
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
          :delete-column="deleteColumn"
          :edit-column="editColumn"

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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"
import draggable from "vuedraggable"

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
  editColumn: Function
})


const inputRef = ref(null)
const showMenu = ref(false)
function toggleMenu() {
  showMenu.value = !showMenu.value
}

function handleClickOutside(e) {
  if (!e.target.closest(".dropdown")) {
    showMenu.value = false
  }

  if (editing.value) {
    const isClickInsideInput = inputRef.value && inputRef.value.contains(e.target)
    const isRenameButton = e.target.textContent.trim() === 'Rename'

    if (!isClickInsideInput && !isRenameButton) {
        saveEdit()
    }
  }
}
const editing = ref(false)
const newName = ref("")

function startEdit() {
  editing.value = true
  newName.value = props.column.name
}

function saveEdit() {
  editing.value = false

  if (!newName.value.trim() || newName.value === props.column.name) return

  props.editColumn(props.column.id || props.column._id, newName.value.trim())
}


onMounted(() => document.addEventListener("click", handleClickOutside))
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside))


</script>

<style scoped>
.dropzone {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
}

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

</style>
