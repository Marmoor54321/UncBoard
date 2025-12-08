<template>
  <div v-if="loading" class="text-center py-3 text-secondary">
    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
    Loading timeline...
  </div>

  <div v-else class="d-flex flex-column gap-3 position-relative mb-4">
    <div v-if="items.length === 0" class="text-secondary mb-3">
      No activity yet.
    </div>

    <div v-for="item in items" :key="item.id">
      
      <div v-if="item.event" class="d-flex align-items-center text-secondary ms-4 py-1" style="font-size: 0.9rem">
        <span
          class="me-2 d-flex align-items-center justify-content-center rounded-circle"
          style="width: 28px; height: 28px; background-color: #303236; border: 1px solid #444;"
        >
          <i :class="getEventIcon(item.event)"></i>
        </span>
        <span>
          <strong class="text-white">
            {{ item.event == "assigned" || item.event == "unassigned" ? item.assigner?.login : item.actor?.login }}
          </strong>
          {{ getEventText(item) }}
          <span class="text-muted ms-1" style="font-size: 0.8rem">
            {{ formatDate(item.created_at) }}
          </span>
        </span>
      </div>

      <div v-else class="comment-box border border-secondary rounded">
        <div class="comment-header d-flex align-items-center p-2 border-bottom border-secondary">
          <img :src="item.user.avatar_url" width="24" height="24" class="rounded-circle me-2" />
          <span class="fw-bold me-2" style="font-size: 0.9rem">{{ item.user.login }}</span>
          <span class="text-secondary" style="font-size: 0.85rem">
            commented on {{ formatDate(item.created_at) }}
          </span>
          <span v-if="item.author_association === 'OWNER'" class="badge border border-secondary text-secondary ms-auto" style="font-size: 0.7rem">
            Author
          </span>
        </div>
        <div class="comment-body p-3" v-html="renderMarkdown(item.body)"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useMarkdown } from '../../composables/useMarkdown'

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: Boolean
})

const { renderMarkdown } = useMarkdown()

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

// Logika ikon przeniesiona tutaj - tylko ten komponent jej potrzebuje
const getEventIcon = (eventType) => {
  const map = {
    closed: 'bi-check-circle-fill text-danger',
    reopened: 'bi-dot text-success',
    labeled: 'bi-tag-fill text-info',
    unlabeled: 'bi-tag text-secondary',
    assigned: 'bi-person-plus-fill text-warning',
    unassigned: 'bi-person-dash text-secondary',
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
    case 'renamed': return `changed the title`
    default: return item.event.replace('_', ' ')
  }
}
</script>

<style scoped>
.comment-header { background-color: #3a3b40; border-top-left-radius: 6px; border-top-right-radius: 6px; color: #c9d1d9; }
.comment-body { background-color: #303236; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; color: #e6edf3; overflow-wrap: break-word; }
.comment-body :deep(img) { max-width: 100%; }
</style>