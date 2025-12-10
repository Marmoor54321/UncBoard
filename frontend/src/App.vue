<template>
  <div class="container-fluid vh-100 d-flex flex-column p-0" style="background-color: #1d1e20">
    <Header />
    <div class="flex-grow-1 d-flex overflow-hidden">
      
      <Sidebar
        :user="user"
        :loginWithGithub="loginWithGithub"
        
        :repos="repos"
        :selectedRepo="selectedRepo"
        :getRepoById="getRepoById"
        :selectRepo="handleRepoSelect"
        
        :groupsList="groupsList"
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
          :groups="dragOptions"
          :repoData="repoData"
          
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
            class="details-panel"
            :issue="selectedIssue"
            :repo-data="repoData"
            @close="closeIssuePanel"
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Components
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import KanbanBoard from './components/Kanban/KanbanBoard.vue'
import IssueDetails from '@/components/Issues/IssueDetails.vue'
import AddIssueModal from './components/Issues/AddIssueModal.vue'

// API & Composables
import { addIssue } from './api/issues.js'
import { useAuth } from '@/composables/useAuth.js'
import { useGroups } from '@/composables/useGroups.js'
import { useKanban } from '@/composables/useKanban.js'

// --- SETUP COMPOSABLES ---
const route = useRoute()
const router = useRouter()

// 1. Auth & User
const { user, loginWithGithub, loadUser } = useAuth()

// 2. Groups (Dependent on User)
const { 
  groupsList, loadGroups, 
  handleAddGroup, handleDeleteGroup, 
  handleAddRepoToGroup, handleDeleteRepoFromGroup 
} = useGroups(user)

// 3. Kanban & Repos
const {
  repos, selectedRepo, columns, issuesByColumn, repoData, 
  groups: dragOptions, 
  loadRepos, selectRepo, getRepoById,
  onDragEnd, onMoveLeft, onMoveRight, 
  addColumn, deleteColumn, editColumn, 
  addIssueToBoard, updateIssue
} = useKanban()

// --- UI STATE ---
const scrollContainer = ref(null)
const showAddIssue = ref(false)
const targetColumn = ref(null)

// --- COMPUTED: URL SYNC ---
const selectedIssue = computed(() => {
  const issueId = route.params.issueId
  if (!issueId || !issuesByColumn.value) return null

  for (const colId in issuesByColumn.value) {
    const found = issuesByColumn.value[colId].find((i) => i.number == issueId)
    if (found) return found
  }
  return null
})

// --- ACTIONS ---

// Navigation
function openIssue(issue) {
  router.push({
    name: 'issue-details',
    params: { owner: route.params.owner, repo: route.params.repo, issueId: issue.number },
  })
}

function closeIssuePanel() {
  router.push({
    name: 'repo-board',
    params: { owner: route.params.owner, repo: route.params.repo },
  })
}

const handleRepoSelect = (repo) => {
  router.push({
    name: 'repo-board',
    params: { owner: repo.owner.login, repo: repo.name },
  })
}

// Issue Management
async function handleIssueUpdate({ number, updates }) {
  try {
    await updateIssue(number, updates)
  } catch (error) {
    alert('Failed to update issue')
  }
}

function showAddIssueModal(column) {
  targetColumn.value = column
  showAddIssue.value = true
}

function handleAddIssueSubmit(data) {
  addIssue(selectedRepo, data, targetColumn)
    .then((newIssue) => {
      if (newIssue) addIssueToBoard(newIssue)
    })
    .catch((error) => console.error('Failed to add issue:', error))
    .finally(() => {
      showAddIssue.value = false
      targetColumn.value = null
    })
}

// --- INITIALIZATION & WATCHERS ---

const syncStateWithUrl = () => {
  if (!repos.value.length) return
  const { owner, repo } = route.params
  if (!owner || !repo) return

  const repoFromUrl = repos.value.find((r) => r.owner.login === owner && r.name === repo)
  
  // Only select if it's different to prevent loops/re-renders
  if (repoFromUrl && selectedRepo.value?.id !== repoFromUrl.id) {
    selectRepo(repoFromUrl)
  }
}

onMounted(async () => {
  await loadUser()
  if (user.value) {
    await Promise.all([loadRepos(), loadGroups()])
  }
})

// Watch for URL changes to switch repo
watch(() => [route.params.owner, route.params.repo], syncStateWithUrl)

// Watch for Repo load to sync initial URL
watch(repos, (newRepos) => {
  if (newRepos.length > 0) syncStateWithUrl()
})

</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; }

.details-panel {
  position: absolute; right: 0; top: 0; width: 67%; height: 100%;
  z-index: 10; box-shadow: -3px 0 10px rgba(0, 0, 0, 0.5);
  background-color: #1d1e20;
}

.modal-pop-enter-active, .modal-pop-leave-active { transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-pop-enter-from, .modal-pop-leave-to { opacity: 0; }
.modal-pop-enter-active :deep(.modal-window), .modal-pop-leave-active :deep(.modal-window) { transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-pop-enter-from :deep(.modal-window), .modal-pop-leave-to :deep(.modal-window) { transform: scale(0.96); }
</style>