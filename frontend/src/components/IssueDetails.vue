<template>
  <div
    class="issue-details text-white p-4"
    style="background-color: #232427; height: 100vh; overflow-y: auto;"
  >
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ issue.title }}</h2>
      <button class="btn btn-outline-light btn-sm" @click="$emit('close')">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <hr class="border-secondary" />

    <div class="row">
      <div class="col-lg-8 col-md-7 col-sm-12 mb-4">
        <div class="bg-dark rounded p-3 mb-4">
          <h5>Description</h5>
          <div
            v-html="issue.body || '<em>No description provided</em>'"
            class="markdown-body"
            style="background:#303236; padding:1rem; border-radius:8px; overflow-wrap: break-word;"
          ></div>
        </div>

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
            <div 
              v-for="item in timeline" 
              :key="item.id" 
            >
              <div 
                v-if="item.event" 
                class="d-flex align-items-center text-secondary ms-4 py-1"
                style="font-size: 0.9rem;"
              >
                <span 
                  class="me-2 d-flex align-items-center justify-content-center rounded-circle"
                  style="width: 28px; height: 28px; background-color: #303236; border: 1px solid #444;"
                >
                  <i :class="getEventIcon(item.event)"></i>
                </span>

                <span>
                  <strong class="text-white">{{ item.event=="assigned" || item.event=="unassigned" ? item.assigner.login : item.actor.login }}</strong>
                  {{ getEventText(item) }}
                  <span class="text-muted ms-1" style="font-size: 0.8rem;">
                    {{ formatDate(item.created_at) }}
                  </span>
                </span>
              </div>

              <div v-else class="comment-box border border-secondary rounded">
                <div 
                  class="comment-header d-flex align-items-center p-2 border-bottom border-secondary"
                  style="background-color: #3a3b40; border-top-left-radius: 6px; border-top-right-radius: 6px;"
                >
                  <img 
                    :src="item.user.avatar_url" 
                    width="24" height="24" 
                    class="rounded-circle me-2"
                  />
                  <span class="fw-bold me-2" style="font-size: 0.9rem;">{{ item.user.login }}</span>
                  <span class="text-secondary" style="font-size: 0.85rem;">
                    commented on {{ formatDate(item.created_at) }}
                  </span>
                  
                  <span 
                    v-if="item.author_association === 'OWNER'" 
                    class="badge border border-secondary text-secondary ms-auto"
                    style="font-size: 0.7rem;"
                  >
                    Author
                  </span>
                </div>

                <div 
                  class="comment-body p-3"
                  style="background-color: #303236; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; overflow-wrap: break-word;"
                  v-html="item.body" 
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4 col-md-5 col-sm-12">
        <div class="bg-dark rounded p-3">
          <h6 class="border-bottom border-secondary pb-2 mb-3">Details</h6>
          <p><strong>ID:</strong> {{ issue.id }}</p>
          <p><strong>Status:</strong> {{ issue.state }}</p>
          <p>
            <strong>Author:</strong>
            {{ issue.user.login }}
            <img :src="issue.user.avatar_url" width="20" class="rounded-circle ms-1" />
          </p>
          <p><strong>Created:</strong> {{ new Date(issue.created_at).toLocaleString() }}</p>
          
          <p>
            <strong>Assignees:</strong>
            <span v-if="issue.assignees.length === 0" class="text-secondary">None</span>
            <span v-for="(a, i) in issue.assignees" :key="i" class="badge bg-secondary ms-1">
              {{ a.login }}
            </span>
          </p>

          <p>
            <strong>Labels:</strong>
            <span v-if="issue.labels.length === 0" class="text-secondary">None</span>
            <span
              v-for="(label, i) in issue.labels"
              :key="i"
              class="badge me-1"
              :style="{ backgroundColor: '#' + label.color }"
            >
              {{ label.name }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  issue: { type: Object, required: true }
})

defineEmits(['close'])

const timeline = ref([])
const loading = ref(false)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// Mapowanie ikon (Bootstrap Icons) dla różnych typów zdarzeń
const getEventIcon = (eventType) => {
  const map = {
    closed: 'bi-check-circle-fill text-danger', // czerwony
    reopened: 'bi-dot text-success',           // zielony
    labeled: 'bi-tag-fill text-info',
    unlabeled: 'bi-tag text-secondary',
    assigned: 'bi-person-plus-fill text-warning',
    unassigned: 'bi-person-dash text-secondary',
    locked: 'bi-lock-fill text-white',
    unlocked: 'bi-unlock text-white',
    referenced: 'bi-bookmark-fill text-secondary',
    renamed: 'bi-pencil text-secondary'
  }
  return map[eventType] || 'bi-circle text-secondary' // domyślna
}

// Generowanie tekstu dla zdarzenia
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

// Pobieranie i łączenie danych
const fetchTimelineData = async () => {
  loading.value = true
  timeline.value = []

  try {
    // 1. Pobieramy komentarze i eventy równolegle (Promise.all)
    const [commentsRes, eventsRes] = await Promise.all([
      fetch(props.issue.comments_url),
      fetch(props.issue.events_url)
    ])

    const comments = commentsRes.ok ? await commentsRes.json() : []
    const events = eventsRes.ok ? await eventsRes.json() : []

    // 2. Łączymy tablice
    // Komentarze nie mają pola 'event', a eventy je mają.
    const combined = [...comments, ...events]

    // 3. Sortujemy chronologicznie
    combined.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    console.log(timeline)
    timeline.value = combined
  } catch (error) {
    console.error('Error fetching timeline:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTimelineData()
})

watch(() => props.issue.id, () => {
  fetchTimelineData()
})
</script>

<style scoped>
.bg-dark {
  background-color: #2c2d31 !important;
}

/* Style komentarza (jak poprzednio) */
.comment-box {
  transition: all 0.2s ease-in-out;
}
.comment-header {
  color: #c9d1d9;
}
.comment-body {
  color: #e6edf3;
  line-height: 1.5;
}
.comment-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}
</style>