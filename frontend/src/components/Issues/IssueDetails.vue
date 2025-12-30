<template>
  <div class="issue-details text-white p-4" style="background-color: #232427; height: 100vh; overflow-y: auto">
    
    <IssueHeader 
      :title="issue.title"
      :url="issue.html_url"
      @update-title="updateTitle"
      @close="$emit('close')"
    />

    <hr class="border-secondary" />

    <div class="row">
      <div class="col-lg-8 col-md-7 col-sm-12 mb-4">
        
        <IssueDescription 
          :body="issue.body"
          @update-body="updateBody"
        />

        <div class="bg-dark rounded p-3">
          <h5 class="mb-3">Discussion & Timeline</h5>
          
          <IssueTimeline 
            :items="timeline"
            :loading="loadingTimeline"
            @edit-comment="handleEditComment"
            @delete-comment="handleDeleteComment"
          />

          <NewCommentForm 
            :loading="submittingComment"
            @submit="postComment"
          />
        </div>
      </div>

      <div class="col-lg-4 col-md-5 col-sm-12">
        <IssueSidebar 
          :issue="issue"
          :repo-data="repoData"
          @update-assignees="updateAssignees"
          @update-labels="updateLabels"
          @update-milestone="updateMilestone"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

import IssueHeader from './IssueHeader.vue'
import IssueDescription from './IssueDescription.vue'
import IssueTimeline from './IssueTimeline.vue'
import NewCommentForm from './NewCommentForm.vue'
import IssueSidebar from './IssueSidebar.vue'

const props = defineProps({
  issue: { type: Object, required: true },
  repoData: { type: Object, required: true }
})

const emit = defineEmits(['close', 'update-issue'])

const timeline = ref([])
const loadingTimeline = ref(false)
const submittingComment = ref(false)

// Helper do wyciągania owner/repo
const getRepoInfo = () => {
  const parts = props.issue.url.split('/')
  return { owner: parts[4], repo: parts[5] }
}

const fetchTimeline = async () => {
  loadingTimeline.value = true
  timeline.value = []
  try {
    const { owner, repo } = getRepoInfo()
    const res = await axios.get(
      `http://localhost:3000/api/github/issues/${owner}/${repo}/${props.issue.number}/timeline`,
      { withCredentials: true }
    )
    timeline.value = res.data
  } catch (error) {
    console.error('Timeline error:', error)
  } finally {
    loadingTimeline.value = false
  }
}

const postComment = async (body) => {
  submittingComment.value = true
  try {
    const { owner, repo } = getRepoInfo()
    const res = await axios.post(
      `http://localhost:3000/api/github/issues/${owner}/${repo}/${props.issue.number}/comments`,
      { body },
      { withCredentials: true }
    )
    timeline.value.push(res.data)
  } catch (error) {
    console.error('Comment error:', error)
    alert('Failed to post comment')
  } finally {
    submittingComment.value = false
  }
}

const handleEditComment = async ({ id, body }) => {
  try {
    const { owner, repo } = getRepoInfo()
    
    // 1. API Call
    const res = await axios.patch(
      `http://localhost:3000/api/github/issues/${owner}/${repo}/comments/${id}`,
      { body },
      { withCredentials: true }
    )
    
    // 2. Aktualizacja lokalna (bez odświeżania całej listy)
    const index = timeline.value.findIndex(item => item.id === id)
    if (index !== -1) {
      // Zastępujemy stary obiekt nowym z serwera (ma zaktualizowany body i updated_at)
      timeline.value[index] = res.data
    }
  } catch (error) {
    console.error('Edit error:', error)
    alert('Failed to edit comment')
  }
}

const handleDeleteComment = async (id) => {
  try {
    const { owner, repo } = getRepoInfo()
    
    // 1. API Call
    await axios.delete(
      `http://localhost:3000/api/github/issues/${owner}/${repo}/comments/${id}`,
      { withCredentials: true }
    )
    
    // 2. Usunięcie z listy lokalnej
    timeline.value = timeline.value.filter(item => item.id !== id)
  } catch (error) {
    console.error('Delete error:', error)
    alert('Failed to delete comment')
  }
}

// --- UPDATERS (Wrappery na emit) ---

const updateTitle = (newTitle) => {
  emit('update-issue', { number: props.issue.number, updates: { title: newTitle } })
}

const updateBody = (newBody) => {
  emit('update-issue', { number: props.issue.number, updates: { body: newBody } })
}

const updateAssignees = (assigneesObjects) => {
  const logins = assigneesObjects.map(u => u.login)
  emit('update-issue', { number: props.issue.number, updates: { assignees: logins } })
}

const updateLabels = (labelsObjects) => {
  const names = labelsObjects.map(l => l.name)
  emit('update-issue', { number: props.issue.number, updates: { labels: names } })
}

const updateMilestone = (milestoneObject) => {
  const milestoneNumber = milestoneObject ? milestoneObject.number : null
  emit('update-issue', { number: props.issue.number, updates: { milestone: milestoneNumber } })
}

// --- INIT ---

watch(() => props.issue.id, () => {
  fetchTimeline()
}, { immediate: true })

</script>