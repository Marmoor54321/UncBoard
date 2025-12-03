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
        style="scrollbar-color: #303236 #1d1e20; min-width: 0"      >
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
            @close="selectedIssue = null"
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
import IssueDetails from '@/components/IssueDetails.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import { ref, computed, watch } from 'vue' // Dodano computed i watch
import { useRoute, useRouter } from 'vue-router' // Import routera
import KanbanBoard from './components/KanbanBoard.vue'
import AddIssueModal from './components/Issues/AddIssueModal.vue'
import { addIssue } from './api/issues.js'


async function handleIssueUpdate({ number, updates }) {
  try {
    await updateIssue(number, updates)
    // The 'issue' prop passed to IssueDetails is reactive, 
    // so updating the store inside updateIssue() will automatically 
    // update the modal content and the card on the board.
  } catch (error) {
    alert("Failed to update issue")
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
  updateIssue
} = useGithubBoard()

const showAddIssue = ref(false)
const targetColumn = ref(null)

// --- ZMIANA: Logic dla selectedIssue oparta na URL ---

// 1. Computed property, która szuka issue na podstawie URL
const selectedIssue = computed(() => {
  const issueId = route.params.issueId
  if (!issueId) return null

  // Musimy przeszukać issuesByColumn, aby znaleźć obiekt issue pasujący do ID (lub number) z URL
  // issuesByColumn to zazwyczaj obiekt { colId: [issues], colId2: [issues] }
  for (const colId in issuesByColumn.value) {
    const issues = issuesByColumn.value[colId]
    // Porównujemy jako String, bo param z URL to string, a issue.number to zazwyczaj int
    const found = issues.find((i) => String(i.number) === String(issueId))
    if (found) return found
  }
  return null
})

// 2. Funkcja otwierająca - teraz zmienia URL
function openIssue(issue) {
  // Zamiast ustawiać zmienną, pushujemy nowy stan do routera
  // Zakładam, że issue.number to unikalny numer issue na GitHubie
  router.push({ name: 'issue-details', params: { issueId: issue.number } })
}

// 3. Funkcja zamykająca - czyści URL
function closeIssuePanel() {
  // Wracamy do głównego widoku (bez parametrów)
  router.push({ name: 'board' })
}

// --- Koniec zmian Routingowych ---

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
