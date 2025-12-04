<template>
  <div class="container-fluid vh-100 d-flex flex-column p-0" style="background-color: #1d1e20">
    <Header />
    <div class="flex-grow-1 d-flex overflow-hidden">
      <Sidebar
        :user="user"
        :repos="repos"
        :selectedRepo="selectedRepo"
        :loginWithGithub="loginWithGithub"
        :selectRepo="handleRepoSelect"
        :groupsList="groupsList"
        :expandedGroups="expandedGroups"
        :getRepoById="getRepoById"
        @addRepoToGroup="handleAddRepoToGroup"
        @deleteRepoFromGroup="handleDeleteRepoFromGroup"
        @addGroup="handleAddGroup"
        @deleteGroup="handleDeleteGroup"
      />
      <main
        ref="scrollContainer"
        class="flex-grow-1 p-4 overflow-hidden d-flex flex-column"
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
          :delete-column="deleteColumn"
          :edit-column="editColumn"
          :add-column="addColumn"
          @add-issue="showAddIssueModal"
        />

        <transition name="slide">
          <IssueDetails
            v-if="selectedIssue"
            :issue="selectedIssue"
            :repo-data="repoData"
            @close="closeIssuePanel"
            class="details-panel"
            @update-issue="handleIssueUpdate"
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
import IssueDetails from '@/components/Issues/IssueDetails.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import { ref, computed, watch } from 'vue' // Dodano computed i watch
import { useRoute, useRouter } from 'vue-router' // Import routera
import KanbanBoard from './components/Kanban/KanbanBoard.vue'
import AddIssueModal from './components/Issues/AddIssueModal.vue'
import { addIssue } from './api/issues.js'

async function handleIssueUpdate({ number, updates }) {
  try {
    await updateIssue(number, updates)
    // The 'issue' prop passed to IssueDetails is reactive,
    // so updating the store inside updateIssue() will automatically
    // update the modal content and the card on the board.
  } catch (error) {
    alert('Failed to update issue')
  }
}
// Inicjalizacja Routera
const route = useRoute()
const router = useRouter()

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
  deleteColumn,
  editColumn,
  addColumn,
  groupsList,
  expandedGroups,
  getRepoById,
  handleAddRepoToGroup,
  handleDeleteRepoFromGroup,
  handleAddGroup,
  handleDeleteGroup,
  repoData,
  addIssueToBoard,
  updateIssue,
} = useGithubBoard()

const showAddIssue = ref(false)
const targetColumn = ref(null)

// 1. Computed property, która szuka issue na podstawie URL
const selectedIssue = computed(() => {
  const issueId = route.params.issueId
  if (!issueId || !issuesByColumn.value) return null

  for (const colId in issuesByColumn.value) {
    const issues = issuesByColumn.value[colId]
    const found = issues.find((i) => i.number == issueId)
    if (found) return found
  }
  return null
})

// 2. Funkcja otwierająca - teraz zmienia URL
function openIssue(issue) {
  router.push({
    name: 'issue-details',
    params: {
      owner: route.params.owner,
      repo: route.params.repo,
      issueId: issue.number,
    },
  })
}

// 3. Funkcja zamykająca - czyści URL
function closeIssuePanel() {
  router.push({
    name: 'repo-board',
    params: {
      owner: route.params.owner,
      repo: route.params.repo,
    },
  })
}

const syncStateWithUrl = () => {
  // Jeśli nie ma listy repozytoriów, nie mamy czego szukać. Czekamy.
  if (!repos.value || repos.value.length === 0) return

  const { owner, repo, issueId } = route.params

  // Jeśli w URL nie ma parametrów repozytorium, nic nie robimy
  if (!owner || !repo) return

  // Szukamy repozytorium pasującego do URL
  const repoFromUrl = repos.value.find((r) => r.owner.login === owner && r.name === repo)

  // Jeśli znaleźliśmy repo i nie jest ono obecnie wybrane -> wybieramy je
  if (repoFromUrl && selectedRepo.value?.id !== repoFromUrl.id) {
    console.log('Synchronizacja: Ustawiam repo z URL:', repoFromUrl.full_name)
    selectRepo(repoFromUrl)
  }
}
watch(
  () => [route.params.owner, route.params.repo],
  () => {
    syncStateWithUrl()
  },
)
watch(
  repos,
  (newRepos) => {
    if (newRepos && newRepos.length > 0) {
      syncStateWithUrl()
    }
  },
  { immediate: true },
)
const handleRepoSelect = (repo) => {
  router.push({
    name: 'repo-board',
    params: {
      owner: repo.owner.login,
      repo: repo.name,
    },
  })
}

function showAddIssueModal(column) {
  targetColumn.value = column
  showAddIssue.value = true
}

function handleAddIssueSubmit(data) {
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
/* Twoje style bez zmian */
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
  background-color: #1d1e20; /* Ważne: tło musi być nieprzezroczyste */
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
