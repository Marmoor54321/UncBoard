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
        @openChat="handleOpenChat"
      />

      <main
        ref="scrollContainer"
        class="flex-grow-1 p-4 overflow-hidden d-flex flex-column position-relative" 
        style="scrollbar-color: #303236 #1d1e20; min-width: 0"
      >
        <transition name="alert-fade">
          <div v-if="alert.show" class="custom-alert" :class="`alert-${alert.type}`">
            <div class="alert-content">
              <span v-if="alert.type === 'error'" class="alert-icon">⚠️</span>
              <span v-else class="alert-icon">✅</span>
              
              <span class="alert-message">{{ alert.message }}</span>
            </div>
            <button class="alert-close" @click="closeAlert">&times;</button>
          </div>
        </transition>
        <KanbanBoard
          :selectedRepo="selectedRepo"
          :columns="columns"
          :issuesByColumn="issuesByColumn"
          :milestones="repoData.milestones"
          :labels="repoData.labels"
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

        <transition name="slide">
          <OrgChat
            v-if="selectedOrgChat"
            class="details-panel"
            :org="selectedOrgChat"
            :user="user"
            @close="closeOrgChat"
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
import OrgChat from '@/components/Organization/OrgChat.vue'

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

// 2. Groups
const { 
  groupsList, loadGroups, 
  handleAddGroup, handleDeleteGroup, 
  handleAddRepoToGroup, handleDeleteRepoFromGroup 
} = useGroups(user)

// 3. Kanban & Repos
const {
  repos, selectedRepo, columns, issuesByColumn, repoData, 
  groups: dragOptions, 
  alert,         
  closeAlert,    
  loadRepos, selectRepo, getRepoById,
  onDragEnd, onMoveLeft, onMoveRight, 
  addColumn, deleteColumn, editColumn, 
  addIssueToBoard, updateIssue
} = useKanban()

const selectedOrgChat = ref(null)

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

// 3. Funkcja otwierająca czat
function handleOpenChat(org) {
  // Jeśli otwarte są detale issue, zamknij je (przekierowując router)
  if (selectedIssue.value) {
    closeIssuePanel()
  }
  selectedOrgChat.value = org
}

// 4. Funkcja zamykająca czat
function closeOrgChat() {
  selectedOrgChat.value = null
}

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

async function handleIssueUpdate({ number, updates }) {
  try {
    await updateIssue(number, updates)
  } catch (error) {
    console.error('Issue update failed locally', error)
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

watch(() => [route.params.owner, route.params.repo], syncStateWithUrl)

watch(repos, (newRepos) => {
  if (newRepos.length > 0) syncStateWithUrl()
})

</script>

<style scoped>
/* --- STYL ALERTA --- */
.custom-alert {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  min-width: 300px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-error {
  background-color: rgba(220, 53, 69, 0.9); 
  color: white;
  border: 1px solid #b02a37;
}

.alert-success {
  background-color: rgba(25, 135, 84, 0.9); 
  color: white;
  border: 1px solid #146c43;
}

.alert-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0 0 0 15px;
  line-height: 1;
  opacity: 0.8;
}

.alert-close:hover {
  opacity: 1;
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.3s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

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