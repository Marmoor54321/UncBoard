// src/composables/useGithubBoard.js
import { ref, onMounted } from 'vue'
import axios from 'axios'

export function useGithubBoard() {
  const user = ref(null)
  const repos = ref([])
  const selectedRepo = ref(null)
  const scrollContainer = ref(null)
  const currentProjectId = ref(null)
  const fieldOptionsMap = ref({})
  const statusFieldId = ref(null)
  const columns = ref([])
  const issuesByColumn = ref({})

  const groups = { name: 'issues', pull: true, put: true }

  function loginWithGithub() {
    window.location.href = 'http://localhost:3000/auth/github'
  }

  async function loadUser() {
    try {
      const res = await axios.get('http://localhost:3000/api/github/user', { withCredentials: true })
      user.value = res.data
      await loadRepos()
    } catch {
      console.log('Not logged in')
    }
  }

  async function loadRepos() {
    const res = await axios.get('http://localhost:3000/api/github/repos', { withCredentials: true })
    repos.value = res.data
  }

  async function selectRepo(repo) {
  selectedRepo.value = repo

  // 🔵 Pobierz issues z backendu (REST)
  const res = await axios.get(
    `http://localhost:3000/api/github/issues/${repo.owner.login}/${repo.name}`,
    { withCredentials: true }
  )

  const issues = res.data

  // 🔵 Kanban: jedna kolumna = wszystkie issues
  columns.value = ["All Issues"]
  issuesByColumn.value = { "All Issues": issues }
}


  async function onDragEnd(event) {
    //
  }

  onMounted(loadUser)

  return {
    user,
    repos,
    selectedRepo,
    scrollContainer,
    columns,
    issuesByColumn,
    loginWithGithub,
    selectRepo,
    onDragEnd,
    groups
  }
}
