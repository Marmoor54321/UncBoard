<template>
  <div
    class="issue-details text-white p-4"
    style="background-color: #232427; height: 100vh; overflow-y: auto"
  >
    <!-- HEADER (TITLE) -->
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
      <!-- LEFT COLUMN -->
      <div class="col-lg-8 col-md-7 col-sm-12 mb-4">
        <!-- DESCRIPTION -->
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

        <!-- TIMELINE -->
        <div class="bg-dark rounded p-3">
          <h5 class="mb-3">Discussion & Timeline</h5>

          <div v-if="loading" class="text-center py-3 text-secondary">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            Loading timeline...
          </div>

          <div v-else-if="timeline.length === 0" class="text-secondary">
            No activity yet.
          </div>

          <div v-else class="d-flex flex-column gap-3 position-relative">
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
        </div>
      </div>

      <!-- RIGHT COLUMN (DETAILS & SETTINGS) -->
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

          <!-- ASSIGNEES SECTION -->
          <div class="mb-2">
            <UniversalDropdown
              :items="repoData.collaborators || []"
              :selected="issue.assignees"
              :multiple="true"
              label-key="login"
              search-key="login"
              id-key="id"
              placement="bottom"
              @select="toggleAssignee"
            >
              <!-- TRIGGER SLOT: To co klikasz, żeby otworzyć dropdown -->
              <template #trigger>
                <div class="dropdown-trigger">
                  <strong>Assignees</strong>
                  
                </div>
              </template>

              <!-- ITEM SLOT: Wygląd pojedynczej opcji na liście -->
              <template #item="{ item }">
                <div class="d-flex align-items-center">
                  <img :src="item.avatar_url" width="20" height="20" class="rounded-circle me-2" />
                  {{ item.login }}
                </div>
              </template>
            </UniversalDropdown>

            <!-- WYŚWIETLANIE WYBRANYCH -->
            <div class="d-flex flex-wrap gap-1 mt-1">
              <span v-if="issue.assignees.length === 0" class="text-secondary small">No assignees</span>
              <span v-for="(a, i) in issue.assignees" :key="i" class="badge bg-secondary d-flex align-items-center">
                <img :src="a.avatar_url" width="16" class="rounded-circle me-1" />
                {{ a.login }}
              </span>
            </div>
          </div>

          <!-- LABELS SECTION -->
          <div class="mb-2">
            <UniversalDropdown
              :items="repoData.labels || []"
              :selected="issue.labels"
              :multiple="true"
              label-key="name"
              search-key="name"
              id-key="id"
              placement="bottom"
              @select="toggleLabel"
            >
              <!-- TRIGGER SLOT -->
              <template #trigger>
                <div class="dropdown-trigger">
                  <strong>Labels</strong>
                  
                </div>
              </template>

              <!-- ITEM SLOT -->
              <template #item="{ item }">
                <span
                  class="rounded-circle d-inline-block me-2"
                  :style="{ width: '10px', height: '10px', backgroundColor: '#' + item.color }"
                ></span>
                {{ item.name }}
              </template>
            </UniversalDropdown>

            <!-- WYŚWIETLANIE WYBRANYCH -->
            <div class="d-flex flex-wrap gap-1 mt-1">
              <span v-if="issue.labels.length === 0" class="text-secondary small">No labels</span>
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
import { ref, onMounted, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import 'github-markdown-css/github-markdown-dark.css'
// Upewnij się, że ścieżka do UniversalDropdown jest poprawna
import UniversalDropdown from './UniversalDropdown.vue' 
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
const renderMarkdown = (text) => {
  if (!text) return ''
  // 1. Parsowanie Markdown do HTML
  const rawHtml = md.render(text)
  // 2. Czyszczenie HTML (sanityzacja) dla bezpieczeństwa
  return DOMPurify.sanitize(rawHtml)
}
const props = defineProps({
  issue: { type: Object, required: true },
  repoData: { type: Object, required: true }
})

const emit = defineEmits(['close', 'update-issue'])

const timeline = ref([])
const loading = ref(false)

// --- Editing State ---
const isEditingTitle = ref(false)
const tempTitle = ref('')
const isEditingBody = ref(false)
const tempBody = ref('')

// Pobieranie danych timeline
const fetchTimelineData = async () => {
  loading.value = true
  timeline.value = []
  try {
    const [commentsRes, eventsRes] = await Promise.all([
      fetch(props.issue.comments_url),
      fetch(props.issue.events_url)
    ])
    const comments = commentsRes.ok ? await commentsRes.json() : []
    const events = eventsRes.ok ? await eventsRes.json() : []
    const combined = [...comments, ...events]
    combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    timeline.value = combined
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

// --- Assignee Logic (Dodałem, bo brakowało w Twoim kodzie) ---
const toggleAssignee = (user) => {
  const currentAssignees = [...props.issue.assignees]
  const index = currentAssignees.findIndex(u => u.id === user.id)

  if (index !== -1) {
    currentAssignees.splice(index, 1)
  } else {
    currentAssignees.push(user)
  }

  // API GitHuba oczekuje tablicy loginów
  const assigneesLogins = currentAssignees.map(u => u.login)

  emit('update-issue', {
    number: props.issue.number,
    updates: { assignees: assigneesLogins }
  })
}

// --- Label Logic ---
const toggleLabel = (label) => {
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

/* Style dla nagłówka sekcji z zębatką */
.section-header {
  cursor: pointer; /* To sprawia, że kursor zmienia się w łapkę */
}
.section-header:hover .gear-icon {
  color: #fff !important; /* Rozjaśnij zębatkę po najechaniu */
}
.gear-icon {
  transition: color 0.2s;
  cursor: pointer;
}
.dropdown-trigger {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #555;
  border-radius: 6px;
  background: #333;
  cursor: pointer;
  color: #c9d1d9;
  margin-bottom: 2px;

  display: inline-flex;
  align-items: center;
  width: auto;
  max-width: 220px;

  gap: 8px;
  font-size: 13px;
  user-select: none;
  transition: all 0.2s;
}

.dropdown-trigger:hover {
  border-color: #aa50e7;
}
</style>