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
        <button class="btn btn-sm btn-outline-light" @click="showModalCreateGroup=true">Add</button>
      </div>
      <!-- ADD GROUP -->
      <Teleport to="body">
        <div v-if="showModalCreateGroup" class="modal-backdrop" @click.self="closeModalCreateGroup">
          <div class="modal-content-box">
            <h5 class="mb-3">Create Group</h5>

            <input
              v-model="groupName"
              type="text"
              class="form-control mb-3"
              placeholder="Group name..."
            />

            <div class="d-flex justify-content-end gap-2">
              <button class="btn btn-secondary" @click="closeModalCreateGroup">Cancel</button>
              <button class="btn btn-primary" @click="onCreateGroup">Create</button>
            </div>
          </div>
        </div>
      </Teleport>

      
      <ul class="list-group custom-list">
        <li
          v-for="group in groupsList"
          :key="group._id"
          class="list-group-item"
        >
          <div
            class="d-flex justify-content-between align-items-center"
            @click="expandedGroups[group._id] = !expandedGroups[group._id]"
          >
            {{ group.name }}
            <i class="bi" :class="expandedGroups[group._id] ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
          </div>

          <!-- REPOS INSIDE GROUP -->
          <ul v-if="expandedGroups[group._id]" class="list-group nested-repo-list">

            <li
              v-for="repoId in group.repo_ids"
              :key="repoId"
              class="list-group-item nested-item d-flex justify-content-between align-items-center group-repo-item"
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
              @click.stop="onDeleteGroup(group._id)"></i>
            </div>
 
          </ul>
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

const showModalCreateGroup = ref(false);
const groupName = ref('')


function closeModalCreateGroup() {
  showModalCreateGroup.value = false
  groupName.value = ''
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
    activePicker.value=null;
    return;
  }

  activeMenu.value = id;
  activePicker.value = null;

  const rect = event.target.getBoundingClientRect();

  menuStyle.value = {
    position: "fixed",
    top: rect.top + "px",
    left: rect.right + 12 + "px",  // ➜ przesunięcie w prawo
    zIndex: 9999
  };

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

  pickerStyle.value = {
    position: "fixed",
    top: rect.top + "px",
    left: rect.right + 8 + "px",
    zIndex: 9999
  };
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
.repo-item i.bi-three-dots-vertical,
.group-repo-item i.bi-three-dots-vertical {
  opacity: 0;
  transition: opacity 0.1s;
}

.repo-item:hover i.bi-three-dots-vertical,
.group-repo-item:hover i.bi-three-dots-vertical {
  opacity: 1;
}


.sidebar-container {
  background-color: #1d1e20;
  height: 94vh;
  min-width: 300px;
  max-width: 350px;
  overflow-y: auto;
  overflow-x: hidden;
}

.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: none !important;
}
.custom-list .list-group-item:hover {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}

/* Popup */
.popup {
  position: fixed !important;
  z-index: 9999;
}

/* Menu */
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
}
.dropdown-item-custom:hover {
  background: #444;
}

/* Picker */
.group-picker-menu {
  background: #222;
  border: 1px solid #444;
  padding: 10px;
  border-radius: 6px;
  width: 200px;
}
/* Ramka po najechaniu na dropdown items */
.dropdown-item-custom:hover {
  background: #444;
  border: 1px solid #aa50e7;
  border-radius: 4px;
}

/* Ramka po najechaniu na elementy pickera */
.group-picker-menu .list-group-item:hover {
  background: #444 !important;
  border: 1px solid #aa50e7 !important;
  border-radius: 4px;
}

.list-group-item {
  background: #303236 !important;
  border: none !important;
}

/*Modal create group*/
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content-box {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  width: 320px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.bi-trash {
  cursor: pointer;
}
</style>
