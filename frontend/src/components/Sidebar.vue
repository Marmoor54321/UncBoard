<template>
  <aside 
    class="sidebar-container border-end p-3 offcanvas-lg offcanvas-start"
    tabindex="-1"
    id="sidebarOffcanvas"
    aria-labelledby="sidebarOffcanvasLabel"
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

          <!-- EXPANDED GROUP REPOS -->
          <ul v-if="expandedGroups[group._id]" class="list-group nested-repo-list">
            <li
              v-for="repoId in group.repo_ids"
              :key="repoId"
              class="list-group-item nested-item d-flex justify-content-between align-items-center group-repo-item"
              @click="selectRepo(repoMap[repoId])"
            >
              <span >
                {{ repoMap[repoId]?.name || 'Unknown repo' }}
              </span>

              <!-- ⋮ BUTTON -->
              <i
                class="bi bi-three-dots-vertical text-white ms-2"
                @click.stop="toggleMenu(`group-${group._id}-${repoId}`)"
                style="cursor:pointer"
              ></i>

              <!-- MENU -->
              <div
                v-if="activeMenu === `group-${group._id}-${repoId}`"
                class="dropdown-menu-custom popup"
              >
                <div
                  class="dropdown-item-custom"
                  @mouseenter="activePicker = `group-${group._id}-${repoId}`"
                >
                  Add to group
                </div>

                <div
                  class="dropdown-item-custom"
                  @click="onDeleteFromGroup(repoId, group._id)"
                >
                  Delete
                </div>
              </div>

              <!-- PICKER -->
              <div
                v-if="activePicker === `group-${group._id}-${repoId}`"
                class="group-picker-menu popup"
                @mouseenter="activePicker = `group-${group._id}-${repoId}`"
                @mouseleave="activePicker = null"
              >
                <h6 class="text-white mb-2">Add to group</h6>

                <ul class="list-group">
                  <li
                    v-for="g in groupsList"
                    :key="g._id"
                    class="list-group-item list-group-item-action text-white"
                    @click="onAddToGroup(repoId, g._id)"
                  >
                    {{ g.name }}
                  </li>
                </ul>
              </div>
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
            @click.stop="toggleMenu(`repo-${repo.id}`)"
            style="cursor:pointer"
          ></i>

          <!-- MENU -->
          <div
            v-if="activeMenu === `repo-${repo.id}`"
            class="dropdown-menu-custom popup"
          >
            <div
              class="dropdown-item-custom"
              @mouseenter="activePicker = `repo-${repo.id}`"
            >
              Add to group
            </div>
          </div>

          <!-- PICKER -->
          <div
            v-if="activePicker === `repo-${repo.id}`"
            class="group-picker-menu popup"
            @mouseenter="activePicker = `repo-${repo.id}`"
            @mouseleave="activePicker = null"
          >
            <h6 class="text-white mb-2">Add to group</h6>

            <ul class="list-group">
              <li
                v-for="g in groupsList"
                :key="g._id"
                class="list-group-item list-group-item-action text-white"
                @click="onAddToGroup(repo.id, g._id)"
              >
                {{ g.name }}
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </aside>
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

//
// REPO MAP (szybszy dostęp)
//
const repoMap = computed(() =>
  Object.fromEntries(props.repos.map(r => [r.id, r]))
);

//
// POPUPY
//
const activeMenu = ref(null);   // dropdown
const activePicker = ref(null); // picker

function toggleMenu(id) {
  activeMenu.value = activeMenu.value === id ? null : id;
  activePicker.value = null;
}

//
// EMIT HANDLERS
//
function onAddToGroup(repoId, groupId) {
  emit("addRepoToGroup", { repoId, groupId });
  activeMenu.value = null;
  activePicker.value = null;
}

function onDeleteFromGroup(repoId, groupId) {
  emit("deleteRepoFromGroup", { repoId, groupId });
  activeMenu.value = null;
  activePicker.value = null;
}

//
// CLICK OUTSIDE
//
function handleClickOutside(e) {
  if (!e.target.closest(".popup")) {
    activeMenu.value = null;
    activePicker.value = null;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() =>
  document.removeEventListener("click", handleClickOutside)
);
</script>

<style scoped>
.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: none !important;
}
.custom-list .list-group-item:hover {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}

.sidebar-container {
  background-color: #1d1e20;
  height: 100vh;
  min-width: 250px;
  max-width: 350px;
}

/* MENU */
.popup {
  position: absolute;
  z-index: 9999;
}

.dropdown-menu-custom {
  background: #222;
  border: 1px solid #444;
  padding: 5px;
  border-radius: 6px;
  right: 0;
  top: 100%;
  width: 150px;
}

.dropdown-item-custom {
  padding: 6px 10px;
  cursor: pointer;
}
.dropdown-item-custom:hover {
  background: #333;
}

/* PICKER */
.group-picker-menu {
  background: #222;
  border: 1px solid #444;
  padding: 10px;
  border-radius: 6px;
  left: 100%;
  top: 0;
  width: 200px;
}
</style>
