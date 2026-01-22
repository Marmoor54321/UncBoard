<template>
  <div class="container-fluid vh-100 d-flex flex-column p-0" style="background-color: #1d1e20">
    <Header />
    
    <div class="flex-grow-1 d-flex overflow-hidden">
      
      <Sidebar
       />

      <main
        ref="scrollContainer"
        class="flex-grow-1 p-4 overflow-hidden d-flex flex-column position-relative" 
        style="scrollbar-color: #303236 #1d1e20; min-width: 0"
      >
        <TheAlerts />

        <KanbanBoard
          :scrollContainer="scrollContainer"
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
import TheAlerts from '@/components/Alerts/TheAlerts.vue'

// API & Composables
import { addIssue } from './api/issues.js'
import { useAuth } from '@/composables/useAuth.js'
import { useGroups } from '@/composables/useGroups.js'
import { useKanban } from '@/composables/useKanban.js'

const route = useRoute()
const router = useRouter()
const scrollContainer = ref(null)

// UI State
const showAddIssue = ref(false)
const targetColumn = ref(null)

// --- COMPOSABLES ---
const { user, loadUser } = useAuth()
const { loadGroups } = useGroups(user)
const {
  repos, 
  selectedRepo, 
  issuesByColumn, 
  repoData, 
  loadRepos, 
  selectRepo, 
  addIssueToBoard, 
  updateIssue
} = useKanban()


// --- COMPUTED: Selected Issue z URL ---
const selectedIssue = computed(() => {
  const issueId = route.params.issueId
  if (!issueId || !issuesByColumn.value) return null

  for (const colId in issuesByColumn.value) {
    const found = issuesByColumn.value[colId].find((i) => i.number == issueId)
    if (found) return found
  }
  return null
})


// --- HANDLERS ---

function closeIssuePanel() {
  router.push({
    name: 'repo-board',
    params: { owner: route.params.owner, repo: route.params.repo },
  })
}

// Logika modala
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

async function handleIssueUpdate({ number, updates }) {
  try {
    await updateIssue(number, updates)
  } catch (error) {
    console.error('Issue update failed locally', error)
  }
}

// --- INITIALIZATION & SYNC ---

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