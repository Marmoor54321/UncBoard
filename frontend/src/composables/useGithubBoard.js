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
  try {
    // Utwórz domyślne statusy
    await axios.post("http://localhost:3000/api/statuses/default", {
      repo_id: repo.id,
    }, { withCredentials: true });

    // Pobierz statusy repo
    const statuses = await axios.get(`http://localhost:3000/api/statuses/${repo.id}`, {
      withCredentials: true
    });

    console.log("📋 Repo statuses:", statuses.data);

    // Pobierz issue (z przypisanymi statusami)
    const issuesRes = await axios.get(
      `http://localhost:3000/api/github/issues/${repo.owner.login}/${repo.name}?repo_id=${repo.id}`,
      { withCredentials: true }
    );

    const issues = issuesRes.data;

    // Utwórz kolumny (nazwy statusów)
    columns.value = statuses.data.map(s => s.name);
    issuesByColumn.value = {};

    columns.value.forEach(col => {
      issuesByColumn.value[col] = issues.filter(issue => issue.status === col);
    });

    selectedRepo.value = repo;

    console.log("✅ Issues by column:", issuesByColumn.value);

  } catch (error) {
    console.error("❌ Error selecting repo:", error.response?.data || error.message);
  }
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
