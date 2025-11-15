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
          <div class="text-center mb-4 text-white">
            <img :src="user.avatar_url" class="rounded-circle mb-2" width="80" />
            <h5>{{ user.login }}</h5>
          </div>
          <h6 class="text-white mt-4">Your Groups</h6>
          <ul class="list-group custom-list">

            <li 
              v-for="group in groupsList"
              :key="group._id"
              class="list-group-item"
              @click="expandedGroups[group._id] = !expandedGroups[group._id]"
            >
              <div class="d-flex justify-content-between align-items-center">
                {{ group.name }}
                <i class="bi" :class="expandedGroups[group._id] ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
              </div>
              

              <!-- rozwinięta lista repozytoriów -->
              <ul 
                v-if="expandedGroups[group._id]"
                class="list-group nested-repo-list"
              >
<li
  v-for="repoId in group.repo_ids"
  :key="repoId + '_' + group._id"
  class="list-group-item nested-item group-repo-item d-flex justify-content-between align-items-center"
>
  <span @click.stop="selectRepo(getRepoById(repoId))">
    {{ getRepoById(repoId)?.name || 'Unknown repo' }}
  </span>

  <!-- wrapper -->
  <div 
    class="group-dropdown-wrapper"
    @mouseenter="groupShowPickerForRepo = repoId + '_' + group._id"
    @mouseleave="groupShowPickerForRepo = null"
  >
    <!-- menu ⋮ -->
    <div
      v-if="groupMenuOpenRepoId === repoId + '_' + group._id"
      class="group-dropdown-menu-custom"
    >
      <div 
        class="dropdown-item-custom"
        @mouseenter="groupShowPickerForRepo = repoId + '_' + group._id"
      >
        Add to group
      </div>
    </div>

    <!-- picker grup -->
    <div
      v-if="groupShowPickerForRepo === repoId + '_' + group._id"
      class="group-picker-menu"
      @mouseenter="groupShowPickerForRepo = repoId + '_' + group._id"
      @mouseleave="groupShowPickerForRepo = null"
    >
      <h6 class="text-white mb-2">Add to group</h6>

      <ul class="list-group">
        <li
          v-for="g in groupsList"
          :key="g._id"
          class="list-group-item list-group-item-action"
          @click="
            emit('addRepoToGroup', { repoId: repoId, groupId: g._id });
            groupShowPickerForRepo = null;
            groupMenuOpenRepoId = null;
          "
        >
          {{ g.name }}
        </li>
      </ul>
    </div>
  </div>

  <!-- ⋮ button -->
  <i
    class="bi bi-three-dots-vertical text-white ms-2"
    @click.stop="
      groupMenuOpenRepoId =
        groupMenuOpenRepoId === repoId + '_' + group._id
          ? null
          : repoId + '_' + group._id
    "
    style="cursor: pointer;"
  ></i>
</li>



              </ul>
            </li>

          </ul>








          <h6 class="text-white">Your Repositories</h6>
          <ul class="list-group custom-list">
  <li
    v-for="repo in repos"
    :key="repo.id"
    class="list-group-item list-group-item-action d-flex justify-content-between align-items-center repo-item"
    :class="{ active: selectedRepo && selectedRepo.id === repo.id }"

    
  >
    <span @click="selectRepo(repo)">
      {{ repo.name }}
    </span>

<div 
  class="dropdown-wrapper" 
  @mouseenter="showGroupPickerForRepo = repo.id" 
  @mouseleave="handleMouseLeave"
  
>
  <!-- menu po kliknięciu ⋮ -->
  <div
    v-if="menuOpenRepoId === repo.id"
    class="dropdown-menu-custom"
  >
    <div class="dropdown-item-custom" @mouseenter="showGroupPickerForRepo = repo.id ">
      Add to group
    </div>
  </div>

  <!-- popup z wyborem grup -->
  <div 
    v-if="showGroupPickerForRepo === repo.id"
    class="group-picker-menu"
    @mouseenter="showGroupPickerForRepo = repo.id"
    @mouseleave="showGroupPickerForRepo = null"
  >
    <h6 class="text-white mb-2">Add to group</h6>

    <ul class="list-group">
      <li 
        v-for="group in groupsList"
        :key="group._id"
        class="list-group-item list-group-item-action"
        @click="emit('addRepoToGroup', { repoId: repo.id, groupId: group._id }); showGroupPickerForRepo = null; menuOpenRepoId = null;"
      >
        {{ group.name }}
      </li>
    </ul>
  </div>
</div>
  <!-- ⋮ button -->
  <i 
    class="bi bi-three-dots-vertical text-white ms-2"
    @click.stop="menuOpenRepoId = menuOpenRepoId === repo.id ? null : repo.id"
    style="cursor: pointer;"
  ></i>


  </li>
</ul>

        </div>
      </aside>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const menuOpenRepoId = ref(null);
const showGroupPickerForRepo = ref(null);
const groupMenuOpenRepoId = ref(null);
const groupShowPickerForRepo = ref(null);


const emit = defineEmits(["addRepoToGroup"]);

defineProps({
  user: Object,
  repos: Array,
  selectedRepo: Object,
  loginWithGithub: Function,
  selectRepo: Function,
  groupsList: Array,
  expandedGroups: Object,
  getRepoById: Function,
  handleAddRepoToGroup: Function
})


function handleClickOutside(event) {
  if (
    !event.target.closest('.repo-item') &&
    !event.target.closest('.dropdown-menu-custom') &&
    !event.target.closest('.group-picker-menu') &&
    !event.target.closest('.group-repo-item') &&
    !event.target.closest('.group-dropdown-menu-custom') &&
    !event.target.closest('.group-picker-menu')
  ) {
    menuOpenRepoId.value = null;
    showGroupPickerForRepo.value = null;

    groupMenuOpenRepoId.value = null;
    groupShowPickerForRepo.value = null;
  }
}


onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>


<style scoped>
.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: none !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-list .list-group-item:hover {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
  color: white;
  cursor: pointer;
}

.custom-list .list-group-item.active {
  border: 2px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}
.sidebar-container {
  background-color: #1d1e20;
  width: 20%;
  min-width: 250px;
  max-width: 350px;
  overflow-y: visible; /* zmienione z auto */
  scrollbar-color: #303236 #1d1e20;
  position: relative;
}

/* Każde repo posiada własną pozycję dla dropdownów */
.repo-item {
  position: relative;
  overflow: visible !important;  /* UMOŻLIWIA wysuwanie popupu */
}

/* Menu po kliknięciu ⋮ */
.dropdown-menu-custom {
  position: absolute;
  right: 0;
  top: 100%;
  background: #222;
  border: 1px solid #444;
  padding: 5px;
  width: 150px;
  border-radius: 6px;
  z-index: 9999;
}

.dropdown-item-custom {
  color: white;
  padding: 6px 10px;
  cursor: pointer;
  
}

.dropdown-item-custom:hover {
  background: #333;
}

/* Panel wyboru grup (Spotify style) */
.group-picker-menu {
  position: absolute;
  left: 100%;
  top: 0;
  background: #222;
  border: 1px solid #444;
  padding: 10px;
  width: 200px;
  border-radius: 6px;
  z-index: 10000;
}

.group-repo-item {
  position: relative;
  overflow: visible !important;
}

.group-dropdown-menu-custom {
  position: absolute;
  right: 0;
  top: 100%;
  background: #222;
  border: 1px solid #444;
  padding: 5px;
  width: 150px;
  border-radius: 6px;
  z-index: 9999;
}

.list-group-item {
  overflow: visible !important;
}

</style>