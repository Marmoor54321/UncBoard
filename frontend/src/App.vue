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
      <main
        ref="scrollContainer"
        class="flex-grow-1 p-4 overflow-auto"
        style="scrollbar-color: #303236 #1d1e20; min-width: 0"
      >
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
          @add-issue="showAddIssueModal"
        />

        <transition name="slide">
          <IssueDetails
            v-if="selectedIssue"
            :issue="selectedIssue"
            @close="selectedIssue = null"
            class="details-panel"
          />
        </transition>

        <transition name="modal-pop">
          <AddIssueModal
            v-if="showAddIssue"
            :repoData="repoData"
            @close="showAddIssue = false"
            @submit="handleAddIssueSubmit"
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
import { addIssue } from './api/issues.js'

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
  onMoveRight,
  repoData,
  addIssueToBoard,
} = useGithubBoard()

const showAddIssue = ref(false)
const targetColumn = ref(null)

const selectedIssue = ref(null)
function openIssue(issue) {
  selectedIssue.value = issue
}

function showAddIssueModal(column) {
  targetColumn.value = column
  showAddIssue.value = true
  console.log('', repoData)
}
function handleAddIssueSubmit(data) {
  console.log('Nowe issue:', data, 'dla kolumny:', targetColumn.value.id)
  addIssue(selectedRepo, data, targetColumn)
    .then((newIssue) => {
      if (newIssue) {
        addIssueToBoard(newIssue)
      }
    })
    .catch((error) => {
      console.error('Failed to add issue to board:', error)
    })
    .finally(() => {
      showAddIssue.value = false
      targetColumn.value = null
    })
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}

.details-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 67%;
  height: 100%;
  z-index: 10;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.5);
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
}

.modal-pop-enter-active :deep(.modal-window),
.modal-pop-leave-active :deep(.modal-window) {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-pop-enter-from :deep(.modal-window),
.modal-pop-leave-to :deep(.modal-window) {
  transform: scale(0.96);
}
</style>
