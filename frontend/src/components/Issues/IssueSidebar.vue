<template>
  <div class="bg-dark rounded p-3">
    <h6 class="border-bottom border-secondary pb-2 mb-3">Details</h6>
    
    <p class="mb-2"><strong>ID:</strong> {{ issue.id }}</p>
    <p class="mb-2"><strong>Status:</strong> {{ issue.state }}</p>
    <p class="mb-2">
      <strong>Author:</strong> {{ issue.user.login }}
      <img :src="issue.user.avatar_url" width="20" class="rounded-circle ms-1" />
    </p>
    <p class="mb-2"><strong>Created:</strong> {{ new Date(issue.created_at).toLocaleString() }}</p>

    <div class="mb-3 border-bottom border-secondary pb-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <UniversalDropdown
          placement="bottom-end"
          class="w-100"
        >
          <template #trigger>
            <div class="sidebar-trigger d-flex justify-content-between align-items-center w-100">
              <strong>Assignees</strong>
              <i class="bi bi-gear text-secondary gear-icon"></i>
            </div>
          </template>

          <template #header>
            <DropdownSearch 
              v-model="searchQueries.assignee" 
              placeholder="Filter people..." 
            />
          </template>

          <DropdownList
            :items="filteredAssignees"
            :selected="issue.assignees"
            :multiple="true"
            id-key="id"
            label-key="login"
            @select="toggleAssignee"
          >
            <template #item="{ item }">
              <div class="dropdown-row">
                <img :src="item.avatar_url" class="avatar" />
                <span>{{ item.login }}</span>
              </div>
            </template>
          </DropdownList>
        </UniversalDropdown>
      </div>

      <div class="d-flex flex-column gap-1 mt-1">
        <span v-if="issue.assignees.length === 0" class="text-secondary small">
          No one assigned
        </span>
        <div 
          v-for="(a, i) in issue.assignees" 
          :key="i" 
          class="d-flex align-items-center justify-content-between mt-1"
          style="font-size: 0.9rem;"
        >
          <div class="d-flex align-items-center">
             <img :src="a.avatar_url" width="20" height="20" class="rounded-circle me-2" />
             <span class="text-white fw-bold">{{ a.login }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-3 border-bottom border-secondary pb-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
         <UniversalDropdown
          placement="bottom-end"
          class="w-100"
        >
          <template #trigger>
             <div class="sidebar-trigger d-flex justify-content-between align-items-center w-100">
              <strong>Labels</strong>
              <i class="bi bi-gear text-secondary gear-icon"></i>
            </div>
          </template>

          <template #header>
            <DropdownSearch 
              v-model="searchQueries.labels" 
              placeholder="Filter labels..." 
            />
          </template>

          <DropdownList
            :items="filteredLabels"
            :selected="issue.labels"
            :multiple="true"
            id-key="id"
            label-key="name"
            @select="toggleLabel"
          >
            <template #item="{ item }">
              <div class="dropdown-row">
                <span class="color-dot" :style="{ backgroundColor: '#' + item.color }"></span>
                <span>{{ item.name }}</span>
              </div>
            </template>
          </DropdownList>
        </UniversalDropdown>
      </div>

      <div class="d-flex flex-wrap gap-1 mt-2">
        <span v-if="issue.labels.length === 0" class="text-secondary small">
          No labels
        </span>
        <span
          v-for="(label, i) in issue.labels"
          :key="i"
          class="badge border border-secondary"
          :style="{ backgroundColor: '#' + label.color, color: getContrastColor(label.color) }"
        >
          {{ label.name }}
        </span>
      </div>
    </div>


    <div class="mb-3 border-bottom border-secondary pb-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
         <UniversalDropdown
          placement="bottom-end"
          class="w-100"
        >
          <template #trigger>
             <div class="sidebar-trigger d-flex justify-content-between align-items-center w-100">
              <strong>Milestone</strong>
              <i class="bi bi-gear text-secondary gear-icon"></i>
            </div>
          </template>

          <template #header>
            <DropdownSearch 
              v-model="searchQueries.milestone" 
              placeholder="Filter milestones..." 
            />
          </template>

          <DropdownList
            :items="filteredMilestones"
            :selected="issue.milestone ? [issue.milestone] : []"
            :multiple="false"
            id-key="id"
            label-key="title"
            @select="toggleMilestone"
          >
            <template #item="{ item }">
              <div class="dropdown-row">
                <span>{{ item.title }}</span>
              </div>
            </template>
          </DropdownList>
        </UniversalDropdown>
      </div>

      <div class="mt-2">
        <span v-if="!issue.milestone" class="text-secondary small">
          No milestone
        </span>
        <div v-else>
          <div class="fw-bold mb-1" style="font-size: 0.9rem;">
              {{ issue.milestone.title }}
          </div>

          <div class="progress" style="height: 8px;">
            <div 
              class="progress-bar bg-success" 
              role="progressbar" 
              :style="{ width: getMilestoneProgress(issue.milestone) + '%' }"
            ></div>
          </div>
          
          <div class="d-flex justify-content-between align-items-center mt-1">
            <small class="text-secondary" style="font-size: 0.75rem;">
              {{ getMilestoneProgress(issue.milestone) }}% complete
            </small>

            <small 
              v-if="issue.milestone.due_on" 
              :class="isPastDue(issue.milestone.due_on) ? 'text-danger' : 'text-secondary'" 
              style="font-size: 0.75rem;"
            >
              <i class="bi me-1"></i>
              Due by: {{ formatDate(issue.milestone.due_on) }}
            </small>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

// Zakładam, że dropdowny są w folderze wyżej w strukturze (np. components/Dropdown)
// Dostosuj ścieżkę, jeśli struktura folderów jest inna
import UniversalDropdown from '../Dropdown/UniversalDropdown.vue'
import DropdownSearch from '../Dropdown/DropdownSearch.vue'
import DropdownList from '../Dropdown/DropdownList.vue'

const props = defineProps({
  issue: { type: Object, required: true },
  repoData: { type: Object, required: true }
})

// Emitujemy eventy, a Rodzic (Parent) zajmuje się wysłaniem do API
const emit = defineEmits(['update-assignees', 'update-labels', 'update-milestone'])

// --- Search Logic ---
const searchQueries = reactive({
  assignee: '',
  labels: '',
  milestone: ''
})

const filteredAssignees = computed(() => {
  const q = searchQueries.assignee.toLowerCase()
  return (props.repoData.collaborators || []).filter((u) => u.login.toLowerCase().includes(q))
})

const filteredLabels = computed(() => {
  const q = searchQueries.labels.toLowerCase()
  return (props.repoData.labels || []).filter((l) => l.name.toLowerCase().includes(q))
})

const filteredMilestones = computed(() => {
  const q = searchQueries.milestone.toLowerCase()
  return (props.repoData.milestones || []).filter((m) => m.title.toLowerCase().includes(q))
})

// --- Assignee Handler ---
const toggleAssignee = (user) => {
  const currentAssignees = [...props.issue.assignees]
  const index = currentAssignees.findIndex(u => u.id === user.id)
  
  if (index !== -1) {
    currentAssignees.splice(index, 1)
  } else {
    currentAssignees.push(user)
  }
  
  // Wysyłamy całą nową tablicę obiektów do rodzica
  emit('update-assignees', currentAssignees)
}

// --- Label Handler ---
const toggleLabel = (label) => {
  const currentLabels = [...props.issue.labels]
  const index = currentLabels.findIndex(l => l.id === label.id)
  
  if (index !== -1) {
    currentLabels.splice(index, 1)
  } else {
    currentLabels.push(label)
  }

  // Wysyłamy całą nową tablicę obiektów do rodzica
  emit('update-labels', currentLabels)
}

// --- Milestone Handler ---
const toggleMilestone = (milestone) => {
  // Sprawdź, czy kliknięto milestone, który jest już ustawiony
  if (props.issue.milestone && props.issue.milestone.id === milestone.id) {
    // Jeśli tak, odznaczamy go (wysyłamy null)
    emit('update-milestone', null)
  } else {
    // Jeśli nie, odznaczamy nowy
    emit('update-milestone', milestone)
  }
  
}

// --- Utils ---
function getContrastColor(hexcolor) {
  hexcolor = hexcolor.replace("#", "");
  var r = parseInt(hexcolor.substr(0, 2), 16);
  var g = parseInt(hexcolor.substr(2, 2), 16);
  var b = parseInt(hexcolor.substr(4, 2), 16);
  var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}

// Obliczanie postępu milestone (na podstawie zwroconych open_issues i closed_issues)
const getMilestoneProgress = (milestone) => {
  if (!milestone) return 0
  const open = milestone.open_issues || 0
  const closed = milestone.closed_issues || 0
  const total = open + closed
  if (total === 0) return 0
  
  return Math.round((closed / total) * 100)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString() 
}

// Sprawdzenie czy data minęła (dla koloru czerwonego)
const isPastDue = (dateString) => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}
</script>

<style scoped>
/* Te style są specyficzne tylko dla tego Sidebara i Dropdownów w nim */
.sidebar-trigger {
  cursor: pointer;
  padding: 4px 0;
  transition: opacity 0.2s;
}
.sidebar-trigger:hover .gear-icon {
  color: #58a6ff !important;
}

.gear-icon { 
  transition: color 0.2s; 
  cursor: pointer; 
}

.dropdown-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}
</style>