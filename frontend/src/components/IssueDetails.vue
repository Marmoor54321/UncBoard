<template>
  <div
    class="issue-details text-white p-4"
    style="background-color: #232427; height: 100vh; overflow-y: auto;"
  >
    <!-- HEADER -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ issue.title }}</h2>
      <button class="btn btn-outline-light btn-sm" @click="$emit('close')">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <hr class="border-secondary" />

    <div class="row">
      <!-- LEFT SIDE -->
      <div class="col-lg-8 col-md-7 col-sm-12 mb-4">
        <!-- DESCRIPTION -->
        <div class="bg-dark rounded p-3 mb-4">
          <h5>Description</h5>

          <div
            v-html="issue.body || '<em>No description provided</em>'"
            style="background:#303236; padding:1rem; border-radius:8px; overflow-wrap: break-word;"
          ></div>
        </div>

        <!-- COMMENTS (REST only gives count) -->
        <div class="bg-dark rounded p-3">
          <h5>Comments</h5>

          <p v-if="issue.comments === 0" class="text-secondary">No comments.</p>

          <p v-else class="text-light">
            This issue has <strong>{{ issue.comments }}</strong> comments.
            <br />
            (Fetching full comment list requires a second API call –
            mogę dodać! ✅)
          </p>
        </div>
      </div>

      <!-- RIGHT SIDE -->
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
            <span
              v-if="issue.assignees.length === 0"
              class="text-secondary"
            >
              None
            </span>

            <span
              v-for="(a, i) in issue.assignees"
              :key="i"
              class="badge bg-secondary ms-1"
            >
              {{ a.login }}
            </span>
          </p>

          <p>
            <strong>Labels:</strong>

            <span
              v-if="issue.labels.length === 0"
              class="text-secondary"
            >
              None
            </span>

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
defineProps({
  issue: { type: Object, required: true }
})
defineEmits(['close'])
</script>

<style scoped>
.bg-dark {
  background-color: #2c2d31 !important;
}
</style>
