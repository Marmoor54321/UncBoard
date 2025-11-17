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
      <h6 class="text-white mt-4">Your Groups</h6>

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

  <!-- 📌 MENU ⋮ (TELEPORT) -->
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
        >
          Delete
        </div>
      </template>
    </div>
  </Teleport>

  <!-- 📌 PICKER (TELEPORT) -->
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

const emit = defineEmits(["addRepoToGroup", "deleteRepoFromGroup"]);

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

.list-group-item {
  background: #303236 !important;
  border: none !important;
}
</style>
