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
                  :key="repoId"
                  class="list-group-item nested-item"
                  @click.stop="selectRepo(getRepoById(repoId))"
                >
                  {{ getRepoById(repoId)?.name || 'Unknown repo' }}
                </li>
              </ul>
            </li>

          </ul>
          <h6 class="text-white">Your Repositories</h6>
          <ul class="list-group custom-list">
            <li
              v-for="repo in repos"
              :key="repo.id"
              @click="selectRepo(repo)"
              class="list-group-item list-group-item-action"
              :class="{ active: selectedRepo && selectedRepo.id === repo.id }"
            >
              {{ repo.name }}
            </li>
          </ul>
        </div>
      </aside>
</template>

<script setup>
defineProps({
  user: Object,
  repos: Array,
  selectedRepo: Object,
  loginWithGithub: Function,
  selectRepo: Function,
  groupsList: Array,
  expandedGroups: Object,
  getRepoById: Function
})
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
.sidebar-container{
  background-color: #1d1e20;
  width: 20%;
  min-width: 250px;
  max-width: 350px;
  overflow-y: auto;
  scrollbar-color: #303236 #1d1e20;
}
</style>