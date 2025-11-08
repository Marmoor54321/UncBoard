<template>
  <div class="container-fluid vh-100 d-flex flex-column p-0" style="background-color: #1d1e20">
    <Header />
    <div class="flex-grow-1 d-flex overflow-hidden">
      <!-- LEWY PANEL -->
      
      <Sidebar
        :user="user"
        :repos="repos"
        :selectedRepo="selectedRepo"
        :loginWithGithub="loginWithGithub"
        :selectRepo="selectRepo"
      />
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
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
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
</style>
