<template>
  <div class="container-fluid vh-100 d-flex flex-column p-0" style="background-color: #1d1e20">
    <!-- HEADER -->
    <header
      class="text-white p-3 d-flex justify-content-between align-items-center"
      style="background-color: #303236"
    >
      <button
        class="btn btn-dark d-lg-none"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarOffcanvas"
        aria-controls="sidebarOffcanvas"
      >
        <i class="bi bi-list"></i>
      </button>

      <h1 class="m-0 fs-3">uncBoard</h1>

    </header>

    <div class="flex-grow-1 d-flex overflow-hidden">
      <!-- LEWY PANEL -->
      <aside
        class="border-end p-3 offcanvas-lg offcanvas-start"
        style="
          background-color: #1d1e20;
          width: 20%;
          min-width: 250px;
          max-width: 350px;
          overflow-y: auto;
          scrollbar-color: #303236 #1d1e20;
        "
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

      <!-- PRAWA CZĘŚĆ (KANBAN BOARD) -->
      <main
        ref="scrollContainer"
        class="flex-grow-1 p-4 overflow-auto"
        style="scrollbar-color: #303236 #1d1e20; min-width: 0"
      >
        <div v-if="!selectedRepo" class="text-center text-white mt-5">
          <h4>Select a repository to view its issues</h4>
        </div>

        <div v-else>
          <h3 class="mb-4 text-white">
            Issues for <span class="text-primary">{{ selectedRepo.name }}</span>
          </h3>
            <!--Kanban board-->
            <div class="row row-cols-1 row-cols-lg-2 row-cols-xl-4 g-3">
              <div v-for="col in columns" :key="col._id" class="col">
                <div class="card h-100" style="border: 1px solid #aa50e7">
                  <div class="card-header bg-dark text-white text-uppercase small">
                    {{ col.name }}
                  </div>
                  <div class="card-body rounded-bottom-1" style="background-color: #303236">
                    <draggable
                      v-model="issuesByColumn[col.name]"
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
                    >
                      <template #item="{ element }">
                        <div
                          class="issuebox mb-2 p-2 rounded "
                          :data-item-id="element.id"
                          @click="openIssue(element)"
                        >
                          <div class="issuetitle"
>
                            <strong>{{ element.title }}</strong>
                          </div>
                          <div class="issuebody small">{{ element.body }}</div>
                        </div>
                      </template>
                    </draggable>
                  </div>
                </div>
              </div>
            </div>

        </div>
       

        <!-- PANEL SZCZEGÓŁÓW -->
        <transition name="slide">
          <IssueDetails
            v-if="selectedIssue"
            :issue="selectedIssue"
            @close="selectedIssue = null"
            class="details-panel"
          />
        </transition>
      </main>
    </div>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import { useGithubBoard } from '@/composables/useGithubBoard.js'
import IssueDetails from '@/components/IssueDetails.vue'
import { ref } from 'vue'

const {
  user,
  repos,
  selectedRepo,
  scrollContainer,
  columns,
  issuesByColumn,
  loginWithGithub,
  selectRepo,
  onDragEnd,
  groups
} = useGithubBoard()

const selectedIssue = ref(null)
function openIssue(issue) {
  selectedIssue.value = issue
}



</script>

<style scoped>
/* Animacja pojawiania się panelu */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Panel szczegółów */
.details-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 67%;
  height: 100%;
  z-index: 10;
  box-shadow: -3px 0 10px rgba(0,0,0,0.5);
}

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
}

.custom-list .list-group-item.active {
  border: 2px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}
</style>
