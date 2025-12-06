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
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

// Importujemy nasze małe klocki
import IssueHeader from './IssueHeader.vue'
import IssueDescription from './IssueDescription.vue'
import IssueTimeline from './IssueTimeline.vue'
import NewCommentForm from './NewCommentForm.vue'
import IssueSidebar from './IssueSidebar.vue' // Zakładam, że kod z poprzedniej odpowiedzi wkleiłeś tutaj

const props = defineProps({
  issue: { type: Object, required: true },
  repoData: { type: Object, required: true }
})

const emit = defineEmits(['close', 'update-issue'])

const timeline = ref([])
const loadingTimeline = ref(false)
const submittingComment = ref(false)

// --- API LOGIC ---

const fetchTimeline = async () => {
  loadingTimeline.value = true
  timeline.value = []
  try {
    const parts = props.issue.url.split('/')
    const owner = parts[4]
    const repo = parts[5]
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
    const parts = props.issue.url.split('/')
    const owner = parts[4]
    const repo = parts[5]
    
    const res = await axios.post(
      `http://localhost:3000/api/github/issues/${owner}/${repo}/${props.issue.number}/comments`,
      { body },
      { withCredentials: true }
    )
    // Dodaj nowy komentarz do listy lokalnie
    timeline.value.push(res.data)
  } catch (error) {
    console.error('Comment error:', error)
    alert('Failed to post comment')
  } finally {
    submittingComment.value = false
  }
}

// --- UPDATERS (Wrappery na emit) ---

const updateTitle = (newTitle) => {
  emit('update-issue', { number: props.issue.number, updates: { title: newTitle } })
}

const updateBody = (newBody) => {
  emit('update-issue', { number: props.issue.number, updates: { body: newBody } })
}

// Logika sidebaru przekazuje całą tablicę obiektów, musimy wyciągnąć loginy/nazwy
const updateAssignees = (assigneesObjects) => {
  const logins = assigneesObjects.map(u => u.login)
  emit('update-issue', { number: props.issue.number, updates: { assignees: logins } })
}

const updateLabels = (labelsObjects) => {
  const names = labelsObjects.map(l => l.name)
  emit('update-issue', { number: props.issue.number, updates: { labels: names } })
}

// --- INIT ---

watch(() => props.issue.id, () => {
  fetchTimeline()
}, { immediate: true })

</script>