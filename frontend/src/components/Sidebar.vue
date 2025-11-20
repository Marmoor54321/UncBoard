<template>
  <aside 
    class="sidebar-container border-end p-3 offcanvas-lg offcanvas-start"
    tabindex="-1"
    id="sidebarOffcanvas"
    aria-labelledby="sidebarOffcanvasLabel"
    style="scrollbar-color: #303236 #1d1e20"
  >
    <div v-if="!user" class="text-center mt-4 text-white">
      <button class="btn btn-dark" @click="loginWithGithub">
        <i class="bi bi-github me-2"></i> Login with GitHub
      </button>
    </div>

    <div v-else>

      <!-- USER -->
      <div class="text-center mb-4 text-white">
        <img :src="user.avatar_url" class="rounded-circle mb-2" width="80" />
        <h5>{{ user.login }}</h5>
      </div>

      <!-- GROUPS -->
      <div class="d-flex justify-content-between align-items-center mt-4">
        <h6 class="text-white m-0">Your Groups</h6>
        <button 
          class="add-group-btn"
          @click="showModalCreateGroup = true"
        >
          <i class="bi bi-plus-lg"></i>
        </button>

      </div>
      <!-- ADD GROUP MODAL -->
      <Teleport to="body">
        <div v-if="showModalCreateGroup" class="modal-backdrop" @click.self="closeModalCreateGroup">
          <div class="modal-card animate-modal">
            <h4 class="modal-title">Create new group</h4>

            <div class="modal-field">
              <label>Group name</label>
              <input
                v-model="groupName"
                type="text"
                placeholder="e.g. Frontend"
                class="modal-input"
              />
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" @click="closeModalCreateGroup">Cancel</button>
              <button class="btn-create" @click="onCreateGroup">Create</button>
            </div>
          </div>

        </div>
      </Teleport>
 <!-- DELETE GROUP MODAL -->
      <Teleport to="body">
        <div v-if="showModalDeleteGroup" class="modal-backdrop" @click.self="closeModalDeleteGroup">
          <div class="modal-card animate-modal">
            <h4 class="modal-title text-danger">Delete group?</h4>
            
            <p class="text-white-50 mb-4">
              Are you sure you want to delete this group? <br>
              Repositories inside will not be deleted.
            </p>

            <div class="modal-actions">
              <button class="btn-cancel" @click="closeModalDeleteGroup">Cancel</button>
              <button class="btn-delete" @click="onConfirmDeleteGroup">Delete</button>
            </div>
          </div>
        </div>
      </Teleport>

      
      <ul class="list-group custom-list">
        <li
          v-for="group in groupsList"
          :key="group._id"
          class="list-group-item"
          :class="{ expanded: expandedGroups[group._id] }"
        >
          <div
            class="d-flex justify-content-between align-items-center"
            @click="expandedGroups[group._id] = !expandedGroups[group._id]"
          >
            {{ group.name }}
            <i class="bi" :class="expandedGroups[group._id] ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
          </div>

          <!-- REPOS INSIDE GROUP -->
          <transition name="slide">
            <ul 
              v-if="expandedGroups[group._id]" 
              class="list-group nested-repo-list"
            >


            <li
              v-for="repoId in group.repo_ids"
              :key="repoId"
              class="list-group-item nested-item d-flex justify-content-between align-items-center group-repo-item"
              :class="{ active: selectedRepo && selectedRepo.id === repoId }"
              @click="selectRepo(repoMap[repoId])"
            >
              <span>
                {{ repoMap[repoId]?.name || 'Unknown repo' }}
              </span>

              <!-- ⋮ BUTTON -->
              <i
                class="bi bi-three-dots-vertical text-white ms-2"
                @click.stop="toggleMenu(`group-${group._id}-${repoId}`, $event)"
              ></i>
            </li>
            <!-- DELETE GROUP BUTTON -->
            <div 
              class="delete-group-btn d-flex align-items-center text-danger mt-2"   
            >
              <i class="bi bi-trash ms-auto"
              @click.stop="openDeleteGroupModal(group._id)"></i>
            </div>
 
          </ul>
          </transition>

        </li>
      </ul>

      <!-- REPOSITORIES -->
      <h6 class="text-white mt-4">Your Repositories</h6>

      <ul class="list-group custom-list">

        <li
          v-for="repo in repos"
          :key="repo.id"
          class="list-group-item d-flex justify-content-between align-items-center repo-item"
          :class="{ active: selectedRepo && selectedRepo.id === repo.id }"
          @click="selectRepo(repo)"
        >
          <span>{{ repo.name }}</span>

          <!-- ⋮ -->
          <i
            class="bi bi-three-dots-vertical text-white ms-2"
            @click.stop="toggleMenu(`repo-${repo.id}`, $event)"
          ></i>
        </li>
      </ul>
    </div>
  </aside>

  <!-- MENU ⋮ (TELEPORT) -->
  <Teleport to="body">
    <div
      v-if="activeMenu"
      class="dropdown-menu-custom popup"
      :style="menuStyle"
    >
      <!-- REPO MENU -->
      <template v-if="activeMenu.startsWith('repo-')">
        <div
          class="dropdown-item-custom"
          @mouseenter="openPickerFromMenu"
        >
          Add to group
        </div>
      </template>

      <!-- GROUP -> REPO MENU -->
      <template v-else>
        <div
          class="dropdown-item-custom"
          @mouseenter="openPickerFromMenu"
        >
          Add to group
        </div>

        <div
          class="dropdown-item-custom"
          @click="onDeleteFromGroupForMenu"
          @mouseenter="closePicker"
        >
          Delete
        </div>
      </template>
    </div>
  </Teleport>

  <!-- PICKER (TELEPORT) -->
  <Teleport to="body">
    <div
      v-if="activePicker"
      class="group-picker-menu popup"
      :style="pickerStyle"
      @mouseenter="keepPickerOpen"
      @mouseleave="closePicker"
    >
      <h6 class="text-white mb-2">Add to group</h6>
      <ul class="list-group">
        <li
          v-for="g in groupsList"
          :key="g._id"
          class="list-group-item list-group-item-action text-white"
          @click="onPickerSelect(g._id)"
        >
          {{ g.name }}
        </li>
      </ul>
    </div>
  </Teleport>

</template>



<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits(["addRepoToGroup", "deleteRepoFromGroup", "addGroup", "deleteGroup"]);

const props = defineProps({
  user: Object,
  repos: Array,
  selectedRepo: Object,
  loginWithGithub: Function,
  selectRepo: Function,
  groupsList: Array,
  expandedGroups: Object
});

// MAP REPOS
const repoMap = computed(() =>
  Object.fromEntries(props.repos.map(r => [r.id, r]))
);

// STATE FOR MENUS
const activeMenu = ref(null);
const activePicker = ref(null);

const menuRepoId = ref(null);
const menuGroupId = ref(null);

// MODALS STATE

const showModalCreateGroup = ref(false);
const groupName = ref('')

const showModalDeleteGroup = ref(false);
const groupToDeleteId = ref(null);

// MODAL FUNCTIONS

function closeModalCreateGroup() {
  showModalCreateGroup.value = false
  groupName.value = ''
}

function openDeleteGroupModal(groupId) {
  groupToDeleteId.value = groupId;
  showModalDeleteGroup.value = true;
}

function closeModalDeleteGroup() {
  showModalDeleteGroup.value = false;
  groupToDeleteId.value = null;
}

function onConfirmDeleteGroup() {
  if (groupToDeleteId.value) {
    emit("deleteGroup", { groupId: groupToDeleteId.value });
  }
  closeModalDeleteGroup();
}



function onCreateGroup() {
  if (!groupName.value.trim()) return
  console.log(groupName.value);
  emit("addGroup", {
    name: groupName.value,
    created_by: props.user._id

  });

  
  closeModalCreateGroup()
}
function onDeleteGroup(groupId) {
  emit("deleteGroup", {groupId: groupId});

  // schowaj rozwinięcie grupy
  //props.expandedGroups[groupId] = false;
}


// MENU POSITION
const menuStyle = ref({
  top: "0px",
  left: "0px",
  position: "fixed",
  zIndex: 9999
});

// PICKER POSITION
const pickerRepo = ref(null);
const pickerGroup = ref(null);

const pickerStyle = ref({
  top: "0px",
  left: "0px",
  position: "fixed",
  zIndex: 9999
});


// ------------------------------
// OPEN / CLOSE MENU
// ------------------------------
function toggleMenu(id, event) {
  if (activeMenu.value === id) {
    activeMenu.value = null;
    activePicker.value = null;
    return;
  }

  activeMenu.value = id;
  activePicker.value = null;

  const rect = event.target.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const estimatedMenuHeight = 120; 
  const spaceBelow = windowHeight - rect.bottom;

  let newStyle = {
    position: "fixed",
    left: rect.right + 12 + "px",
    zIndex: 9999,
    top: rect.top + "px",
    bottom: "auto"
  };

  if (spaceBelow < estimatedMenuHeight) {
    newStyle.top = "auto";
    newStyle.bottom = (windowHeight - rect.top) + "px"; 
  }

  menuStyle.value = newStyle;

  // extract repoId & groupId
  if (id.startsWith("repo-")) {
    menuRepoId.value = parseInt(id.split("-")[1]);
    menuGroupId.value = null;
  } else {
    const parts = id.split("-");
    menuGroupId.value = parts[1];
    menuRepoId.value = parts[2];
  }
}

function keepMenuOpen() {}
function closeMenu() {
  activeMenu.value = null;
}


// ------------------------------
// OPEN PICKER
// ------------------------------
function openPickerFromMenu(event) {
  activePicker.value = "picker";

  pickerRepo.value = menuRepoId.value;
  pickerGroup.value = menuGroupId.value;

  const rect = event.target.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // Szacowana wysokość pickera 
  const estimatedPickerHeight = 250; 
  const spaceBelow = windowHeight - rect.top;

  // Domyślny styl 
  let newStyle = {
    position: "fixed",
    left: rect.right + 8 + "px",
    zIndex: 9999,
    top: rect.top + "px",
    bottom: "auto" 
  };
  if (spaceBelow < estimatedPickerHeight) {
    newStyle.top = "auto"; 
    newStyle.bottom = (windowHeight - rect.bottom) + "px"; 
  }

  pickerStyle.value = newStyle;
}

function keepPickerOpen() {}
function closePicker() {
  activePicker.value = null;
}


// ------------------------------
// MENU ACTIONS
// ------------------------------
function onPickerSelect(groupId) {
  emit("addRepoToGroup", { repoId: pickerRepo.value, groupId });
  activePicker.value = null;
  activeMenu.value = null;
}

function onDeleteFromGroupForMenu() {
  emit("deleteRepoFromGroup", {
    repoId: menuRepoId.value,
    groupId: menuGroupId.value
  });
  activeMenu.value = null;
  activePicker.value = null;
}


// ------------------------------
// CLICK OUTSIDE
// ------------------------------
function handleClickOutside(e) {
  if (!e.target.closest(".popup")) {
    activeMenu.value = null;
    activePicker.value = null;
  }
}

onMounted(() =>
  document.addEventListener("click", handleClickOutside)
);

onBeforeUnmount(() =>
  document.removeEventListener("click", handleClickOutside)
);

</script>



<style scoped>
/* Ogólny hover na ⋮ w repo i grupach */
.list-group .group-repo-item i.bi-three-dots-vertical,
.list-group .repo-item i.bi-three-dots-vertical,
.list-group .nested-item i.bi-three-dots-vertical {
  opacity: 0 !important;
  transition: opacity 0.1s ease;
}


.repo-item:hover i.bi-three-dots-vertical,
.group-repo-item:hover i.bi-three-dots-vertical,
.nested-item:hover i.bi-three-dots-vertical {
  opacity: 1 !important;
}



/* SIDEBAR */
.sidebar-container {
  background-color: #1d1e20;
  height: 94vh;
  min-width: 300px;
  max-width: 350px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Aktywne repo — główna lista */
.list-group-item.repo-item.active {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}

/* Aktywne repo — w grupach */
.list-group-item.group-repo-item.active,
.list-group-item.nested-item.active {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}

/* Kursor najechania na repozytoria */
.repo-item,
.group-repo-item,
.nested-item {
  cursor: pointer;
}



/* LISTY */
.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: none !important;
}

.custom-list .list-group-item:hover {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}

.custom-list .list-group-item.expanded {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}

/* Popup */
.popup {
  position: fixed !important;
  z-index: 9999;
}

/* MENU */
.dropdown-menu-custom {
  background: #222;
  border: 1px solid #444;
  padding: 6px;
  border-radius: 6px;
  width: 150px;
}

.dropdown-item-custom {
  padding: 6px;
  color: #fff;
  cursor: pointer;
  border-radius: 4px;
}

.dropdown-item-custom:hover {
  background: #444;
  border: 1px solid #aa50e7;
}

/* PICKER */
.group-picker-menu {
  background: #222;
  border: 1px solid #444;
  padding: 10px;
  border-radius: 6px;
  width: 200px;
  max-height: 200px;  
  overflow-y: auto;     
  scrollbar-color: #303236 #1d1e20; 
}

.group-picker-menu .list-group-item:hover {
  background: #444 !important;
  border: 1px solid #aa50e7 !important;
  border-radius: 4px;
}

/* Usuń border dla listy */
.list-group-item {
  background: #303236 !important;
  border: none !important;
}

/* Animacja rozwijania */
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
  opacity: 1;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

/* ADD GROUP BUTTON */
.add-group-btn {
  background: none;
  color: white;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.15s ease;
}

.add-group-btn:hover {
  transform: scale(1.08);
}

.add-group-btn i {
  font-size: 16px;
}


/* ---------------------------- */
/*  MODAL (SCALONE STYLE)       */
/* ---------------------------- */

/* Backdrop – jedna wersja zamiast dwóch */
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

/* Card */
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
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
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
