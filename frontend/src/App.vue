<template>
  <div class="container-fluid vh-100 d-flex flex-column p-0" style="background-color: #1d1e20">
    <Header />
    <div class="flex-grow-1 d-flex overflow-hidden">
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
      <AddIssueModal />
        <KanbanBoard
          :selectedRepo="selectedRepo"
          :columns="columns"
          :issuesByColumn="issuesByColumn"
          :scrollContainer="scrollContainer"
          :groups="groups"
          :onDragEnd="onDragEnd"
          :openIssue="openIssue"
          :onMoveLeft="onMoveLeft"
          :onMoveRight="onMoveRight"
        />
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
import { useGithubBoard } from '@/composables/useGithubBoard.js'
import IssueDetails from '@/components/IssueDetails.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { ref } from 'vue'
import KanbanBoard from './components/KanbanBoard.vue'
import AddIssueModal from './components/Issues/AddIssueModal.vue'

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
  groups,
  onMoveLeft,      
  onMoveRight
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
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {

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
</style>
