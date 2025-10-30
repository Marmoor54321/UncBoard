<template>
  <div
    class="issue-details text-white p-4"
    style="background-color: #232427; height: 100vh; overflow-y: auto;"
  >
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ issue.title }}</h2>
      <button class="btn btn-outline-light btn-sm" @click="$emit('close')">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <hr class="border-secondary" />

    <!-- Layout: two columns -->
    <div class="row">
      <!-- Left side: main content -->
      <div class="col-lg-8 col-md-7 col-sm-12 mb-4">
        <div class="bg-dark rounded p-3 mb-4">
          <h5>Description</h5>
          <div
            v-html="issue.body || '<em>No description provided</em>'"
            style="background:#303236; padding:1rem; border-radius:8px; overflow-wrap: break-word;"
          ></div>
        </div>

        <div class="bg-dark rounded p-3 mb-4">
          <h5>Comments</h5>
          <div class="px-2 pt-1 mb-2" style="border: 0.1px solid; border-color: #aa50e7; border-radius: 5px;" v-for="(a, i) in issue.comments.nodes" :key="i" >
            <p class="mb-0"><strong>  {{ a.author.login }} <img :src="a.author.avatarUrl" class="rounded-circle" width="20"/> </strong></p>  
        
            <p style="overflow-wrap: break-word;" > {{ a.body }} </p> 
          </div>
        </div>

        <div class="bg-dark rounded p-3">
  <h5 class="text-light mb-3">Changes</h5>

  <div
    v-if="issue.timelineItems && issue.timelineItems.nodes.length"
    class="d-flex flex-column gap-2"
  >
    <div
      v-for="(event, i) in issue.timelineItems.nodes"
      :key="i"
      class="px-2 pt-1 mb-2 d-flex align-items-start"
      style="border: 0.1px solid; border-color: #aa50e7; border-radius: 5px;"
    >
      <!-- Ikona i typ eventu -->
      <div class="me-2">
        <i
          v-if="event.__typename === 'LabeledEvent'"
          class="bi bi-tag-fill text-warning"
        ></i>
        <i
          v-else-if="event.__typename === 'UnlabeledEvent'"
          class="bi bi-tag text-secondary"
        ></i>
        <i
          v-else-if="event.__typename === 'AssignedEvent'"
          class="bi bi-person-plus text-info"
        ></i>
        <i
          v-else-if="event.__typename === 'UnassignedEvent'"
          class="bi bi-person-dash text-muted"
        ></i>
        <i
          v-else-if="event.__typename === 'ClosedEvent'"
          class="bi bi-x-circle-fill text-danger"
        ></i>
        <i
          v-else-if="event.__typename === 'ReopenedEvent'"
          class="bi bi-arrow-repeat text-success"
        ></i>
      </div>

      <!-- Treść eventu -->
      <div class="flex-grow-1 text-light p">
        <p class="mb-0">
          <strong>{{ event.actor?.login }}</strong>
          <span class="text-secondary">
            <template v-if="event.__typename === 'LabeledEvent'">
              added label
              <span
                class="badge ms-1"
                :style="{ backgroundColor: '#' + event.label.color, color: 'black' }"
              >
                {{ event.label.name }}
              </span>
            </template>
            <template v-else-if="event.__typename === 'UnlabeledEvent'">
              removed label
              <span
                class="badge ms-1"
                :style="{ backgroundColor: '#' + event.label.color, color: 'black' }"
              >
                {{ event.label.name }}
              </span>
            </template>
            <template v-else-if="event.__typename === 'AssignedEvent'">
              assigned <strong>{{ event.assignee?.login }}</strong>
            </template>
            <template v-else-if="event.__typename === 'UnassignedEvent'">
              unassigned <strong>{{ event.assignee?.login }}</strong>
            </template>
            <template v-else-if="event.__typename === 'ClosedEvent'">
              closed the issue
            </template>
            <template v-else-if="event.__typename === 'ReopenedEvent'">
              reopened the issue
            </template>
          </span>
        </p>

        <small class="text-light">
          {{ new Date(event.createdAt).toLocaleString() }}
        </small>
      </div>
    </div>
  </div>

  <div v-else class="text-secondary">No recent changes.</div>
</div>

      </div>

      <!-- Right side: metadata -->
      <div class="col-lg-4 col-md-5 col-sm-12">
        <div class="bg-dark rounded p-3">
          <h6 class="border-bottom border-secondary pb-2 mb-3">Details</h6>
          <p><strong>ID:</strong> {{ issue.id }}</p>
          <p><strong>Status:</strong> {{ issue.status || 'Unknown' }}</p>
          <p><strong>Author:</strong> {{ issue.author.login }}</p>
          <p><strong>Created:</strong> {{ new Date(issue.createdAt).toLocaleString() }}</p>

          <p >
            <strong>Assignees:</strong>
            <span v-for="(a, i) in issue.assignees.nodes" :key="i" class="badge bg-secondary ms-1">{{ a.login }}</span>
          </p>

          <p >
            <strong>Labels:</strong>
            <span
              v-for="(label, i) in issue.labels.nodes"
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
defineProps({
  issue: { type: Object, required: true }
})
defineEmits(['close'])
</script>

<style scoped>
.issue-details {
  font-size: 0.95rem;
}
.bg-dark {
  background-color: #2c2d31 !important;
}
</style>
