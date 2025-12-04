<template>
  <div
    class="issue-details text-white p-4"
    style="background-color: #232427; height: 100vh; overflow-y: auto"
  >
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div v-if="!isEditingTitle" class="d-flex align-items-center flex-grow-1 me-3">
        <h2 class="mb-0 me-3">
          <a :href="issue.html_url" target="_blank" rel="noopener noreferrer">
            {{ issue.title }}
          </a>          
        </h2>        
        <button class="btn btn-sm btn-link text-secondary p-0" @click="startEditTitle">
          <i class="bi bi-pencil-fill"></i>
        </button>
      </div>

      <div v-else class="flex-grow-1 me-3">
        <input
          v-model="tempTitle"
          type="text"
          class="form-control bg-dark text-white border-secondary mb-2"
        />
        <div class="d-flex gap-2">
          <button class="btn-save" @click="saveTitle">Save</button>
          <button class="btn-cancel" @click="cancelEditTitle">Cancel</button>
        </div>
      </div>

      <button class="btn btn-outline-light btn-sm ms-2" @click="$emit('close')">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <hr class="border-secondary" />

    <div class="row">
      <div class="col-lg-8 col-md-7 col-sm-12 mb-4">
        
        <div class="bg-dark rounded p-3 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h5 class="mb-0">Description</h5>
            <button
              v-if="!isEditingBody"
              class="btn btn-sm btn-link text-secondary text-decoration-none"
              @click="startEditBody"
            >
              Edit
            </button>
          </div>

          <div
            v-if="!isEditingBody"
            v-html="issue.body ? renderMarkdown(issue.body) : '<em class=\'text-secondary\'>No description provided</em>'"       class="markdown-body"
            style="background: #303236; padding: 1rem; border-radius: 8px; overflow-wrap: break-word;"
          ></div>

          <div v-else>
            <textarea
              v-model="tempBody"
              class="form-control bg-dark text-white border-secondary mb-2"
              rows="6"
              style="background-color: #303236 !important"
            ></textarea>
            <div class="d-flex gap-2">
              <button class="btn-save" @click="saveBody">Save</button>
              <button class="btn-cancel" @click="cancelEditBody">Cancel</button>
            </div>
          </div>
        </div>

        <div class="bg-dark rounded p-3">
          <h5 class="mb-3">Discussion & Timeline</h5>

          <div v-if="loading" class="text-center py-3 text-secondary">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading timeline...
          </div>

          <div v-else class="d-flex flex-column gap-3 position-relative mb-4">
            <div v-if="timeline.length === 0" class="text-secondary mb-3">
              No activity yet.
            </div>

            <div v-for="item in timeline" :key="item.id">
              <div v-if="item.event" class="d-flex align-items-center text-secondary ms-4 py-1" style="font-size: 0.9rem">
                <span
                  class="me-2 d-flex align-items-center justify-content-center rounded-circle"
                  style="width: 28px; height: 28px; background-color: #303236; border: 1px solid #444;"
                >
                  <i :class="getEventIcon(item.event)"></i>
                </span>
                <span>
                  <strong class="text-white">
                    {{ item.event == "assigned" || item.event == "unassigned" ? item.assigner.login : item.actor.login }}
                  </strong>
                  {{ getEventText(item) }}
                  <span class="text-muted ms-1" style="font-size: 0.8rem">
                    {{ formatDate(item.created_at) }}
                  </span>
                </span>
              </div>

              <div v-else class="comment-box border border-secondary rounded">
                <div
                  class="comment-header d-flex align-items-center p-2 border-bottom border-secondary"
                  style="background-color: #3a3b40; border-top-left-radius: 6px; border-top-right-radius: 6px;"
                >
                  <img :src="item.user.avatar_url" width="24" height="24" class="rounded-circle me-2" />
                  <span class="fw-bold me-2" style="font-size: 0.9rem">{{ item.user.login }}</span>
                  <span class="text-secondary" style="font-size: 0.85rem">
                    commented on {{ formatDate(item.created_at) }}
                  </span>
                  <span
                    v-if="item.author_association === 'OWNER'"
                    class="badge border border-secondary text-secondary ms-auto"
                    style="font-size: 0.7rem"
                  >
                    Author
                  </span>
                </div>
                <div
                  class="comment-body p-3"
                  style="background-color: #303236; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; overflow-wrap: break-word;"
                  v-html="renderMarkdown(item.body)"
                >
                </div>
              </div>
            </div>
          </div>

          <div class="border-top border-secondary pt-3 mt-3">
            <h6 class="mb-2 text-secondary">Add a comment</h6>
            <textarea
              v-model="newCommentBody"
              class="form-control bg-dark text-white border-secondary mb-2"
              rows="4"
              placeholder="Leave a comment"
              style="background-color: #303236 !important"
            ></textarea>
            <div class="d-flex justify-content-end gap-2">
               <button 
                class="btn-save d-flex align-items-center gap-2" 
                @click="submitComment" 
                :disabled="isSubmitting || !newCommentBody.trim()"
              >
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
                Comment
              </button>
            </div>
          </div>

        </div>
      </div>

      <div class="col-lg-4 col-md-5 col-sm-12">
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
                ref="assigneeDropdownRef"
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
                ref="labelsDropdownRef"
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
                class="badge text-white border border-secondary"
                :style="{ backgroundColor: '#' + label.color, color: getContrastColor(label.color) }"
              >
                {{ label.name }}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, reactive, computed } from 'vue'
import axios from 'axios'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import 'github-markdown-css/github-markdown-dark.css'

// Import komponentów dropdown (tak jak w AddIssueModal)
import UniversalDropdown from './Dropdown/UniversalDropdown.vue'
import DropdownSearch from './Dropdown/DropdownSearch.vue'
import DropdownList from './Dropdown/DropdownList.vue'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
const renderMarkdown = (text) => {
  if (!text) return ''
  const rawHtml = md.render(text)
  return DOMPurify.sanitize(rawHtml)
}
const props = defineProps({
  issue: { type: Object, required: true },
  repoData: { type: Object, required: true }
})

const emit = defineEmits(['close', 'update-issue'])

const timeline = ref([])
const loading = ref(false)

// --- Refs for Dropdowns ---
const assigneeDropdownRef = ref(null)
const labelsDropdownRef = ref(null)

// --- Editing State ---
const isEditingTitle = ref(false)
const tempTitle = ref('')
const isEditingBody = ref(false)
const tempBody = ref('')

// --- New Comment State ---
const newCommentBody = ref('')
const isSubmitting = ref(false)

// --- Search Logic for Dropdowns (Nowe) ---
const searchQueries = reactive({
  assignee: '',
  labels: ''
})

const filteredAssignees = computed(() => {
  const q = searchQueries.assignee.toLowerCase()
  return (props.repoData.collaborators || []).filter((u) => u.login.toLowerCase().includes(q))
})

const filteredLabels = computed(() => {
  const q = searchQueries.labels.toLowerCase()
  return (props.repoData.labels || []).filter((l) => l.name.toLowerCase().includes(q))
})

// Pobieranie danych timeline
const fetchTimelineData = async () => {
  loading.value = true
  timeline.value = []
  
  try {
    const urlParts = props.issue.url.split('/')
    const owner = urlParts[4]
    const repo = urlParts[5]
    const number = props.issue.number

    const res = await axios.get(
      `http://localhost:3000/api/github/issues/${owner}/${repo}/${number}/timeline`,
      { withCredentials: true } 
    )

    timeline.value = res.data

  } catch (error) {
    console.error('Error fetching timeline:', error)
  } finally {
    loading.value = false
  }
}

watch(() => props.issue, (newVal) => {
  if (newVal) {
    fetchTimelineData()
    tempTitle.value = newVal.title
    tempBody.value = newVal.body || ''
  }
}, { immediate: true })

// --- Comment Logic ---
const submitComment = async () => {
  if (!newCommentBody.value.trim()) return

  isSubmitting.value = true
  try {
    const urlParts = props.issue.url.split('/')
    const owner = urlParts[4]
    const repo = urlParts[5]
    const number = props.issue.number

    const res = await axios.post(
      `http://localhost:3000/api/github/issues/${owner}/${repo}/${number}/comments`,
      { body: newCommentBody.value },
      { withCredentials: true }
    )

    const newComment = res.data
    timeline.value.push(newComment)
    newCommentBody.value = ''

  } catch (error) {
    console.error('Error submitting comment:', error)
    alert('Failed to post comment')
  } finally {
    isSubmitting.value = false
  }
}

// --- Title Handlers ---
const startEditTitle = () => { tempTitle.value = props.issue.title; isEditingTitle.value = true }
const cancelEditTitle = () => { isEditingTitle.value = false; tempTitle.value = props.issue.title }
const saveTitle = () => {
  if (!tempTitle.value.trim()) return
  emit('update-issue', { number: props.issue.number, updates: { title: tempTitle.value } })
  isEditingTitle.value = false
}

// --- Body Handlers ---
const startEditBody = () => { tempBody.value = props.issue.body || ''; isEditingBody.value = true }
const cancelEditBody = () => { isEditingBody.value = false; tempBody.value = props.issue.body || '' }
const saveBody = () => {
  emit('update-issue', { number: props.issue.number, updates: { body: tempBody.value } })
  isEditingBody.value = false
}

// --- Assignee Logic ---
const toggleAssignee = (user) => {
  // Reset search query
  // searchQueries.assignee = '' (opcjonalnie, jeśli chcesz czyścić po wyborze)
  
  const currentAssignees = [...props.issue.assignees]
  const index = currentAssignees.findIndex(u => u.id === user.id)
  if (index !== -1) {
    currentAssignees.splice(index, 1)
  } else {
    currentAssignees.push(user)
  }
  const assigneesLogins = currentAssignees.map(u => u.login)
  emit('update-issue', {
    number: props.issue.number,
    updates: { assignees: assigneesLogins }
  })
}

// --- Label Logic ---
const toggleLabel = (label) => {
  // Reset search query
  // searchQueries.labels = ''
  
  const currentLabels = [...props.issue.labels]
  const index = currentLabels.findIndex(l => l.id === label.id)
  if (index !== -1) {
    currentLabels.splice(index, 1)
  } else {
    currentLabels.push(label)
  }
  const labelNames = currentLabels.map(l => l.name)
  emit('update-issue', {
    number: props.issue.number,
    updates: { labels: labelNames }
  })
}

// --- Utils ---
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const getEventIcon = (eventType) => {
  const map = {
    closed: 'bi-check-circle-fill text-danger',
    reopened: 'bi-dot text-success',
    labeled: 'bi-tag-fill text-info',
    unlabeled: 'bi-tag text-secondary',
    assigned: 'bi-person-plus-fill text-warning',
    unassigned: 'bi-person-dash text-secondary',
    locked: 'bi-lock-fill text-white',
    unlocked: 'bi-unlock text-white',
    referenced: 'bi-bookmark-fill text-secondary',
    renamed: 'bi-pencil text-secondary'
  }
  return map[eventType] || 'bi-circle text-secondary'
}

const getEventText = (item) => {
  switch (item.event) {
    case 'closed': return `closed this issue`
    case 'reopened': return `reopened this issue`
    case 'labeled': return `added the "${item.label?.name || 'label'}" label`
    case 'unlabeled': return `removed the "${item.label?.name || 'label'}" label`
    case 'assigned': return `assigned ${item.assignee?.login || 'someone'}`
    case 'unassigned': return `unassigned ${item.assignee?.login || 'someone'}`
    case 'referenced': return `referenced this issue`
    case 'renamed': return `changed the title`
    default: return item.event.replace('_', ' ')
  }
}

const getContrastColor = (hex) => {
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return yiq >= 128 ? 'black' : 'white'
}

onMounted(() => {
  fetchTimelineData()
})
</script>

<style scoped>
.bg-dark {
  background-color: #2c2d31 !important;
}

.comment-box { transition: all 0.2s ease-in-out; }
.comment-header { color: #c9d1d9; }
.comment-body { color: #e6edf3; line-height: 1.5; }
.comment-body :deep(img) { max-width: 100%; height: auto; border-radius: 4px; }
.btn-cancel { background: transparent; color: #ccc; border: 1px solid #555; padding: 5px 8px; border-radius: 8px; font-size: small;}
.btn-save { background: #aa50e7; color: white; border: none; padding: 5px 8px; border-radius: 8px; font-size: small;}
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* Sidebar Trigger Styling */
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

/* Dropdown Internal Styling (Imported from AddIssueModal) */
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