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
      const res = await axios.get('http://localhost:3000/api/github/user', { withCredentials: true, timeout: 5000 })
      user.value = res.data ?? null
      await loadRepos()
      await loadGroups();
    } catch(e) {
      console.log('Not logged in',e)
    }
  }

  const groupsList = ref([]);
  const expandedGroups = ref({}); // do rozwijania/zamykania dropdownów
  function getRepoById(id) {
  return repos.value.find(r => r.id === id);
}

  async function loadGroups() {
    if (!user.value) return;

    try {
      const res = await axios.get(
        `http://localhost:3000/api/groups/${user.value._id}`,
        { withCredentials: true }
      );

      groupsList.value = res.data;

    } catch (e) {
      console.error("Error loading groups:", e);
    }
  }



  async function loadRepos() {
    try{
    const res = await axios.get('http://localhost:3000/api/github/repos', { withCredentials: true, timeout: 5000 })
    repos.value = res?.data ?? null
    }
    catch(e){
      console.error('Error loading repos:', e)
    }
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

    console.log("Repo statuses:", statuses.data);

    // Pobierz issue (z przypisanymi statusami)
    const issuesRes = await axios.get(
      `http://localhost:3000/api/github/issues/${repo.owner.login}/${repo.name}?repo_id=${repo.id}`,
      { withCredentials: true }
    );

    const issues = issuesRes.data;

    // Utwórz kolumny (nazwy statusów)
    console.log("Issues with statuses:", statuses.data);
    columns.value = statuses.data.map(s => ({
      id: s._id,
      name:s.name,
      repo_id: repo.id
    }));
    issuesByColumn.value = {};

    columns.value.forEach(col => {
      issuesByColumn.value[col.name] = issues.filter(issue => issue.status === col.name);
    });

    selectedRepo.value = repo;

    console.log("Issues by column:", issuesByColumn.value);

  } catch (error) {
    console.error("Error selecting repo:", error.response?.data || error.message);
  }
}



  async function onDragEnd(event) {
  const { item, to } = event
  const issueId = item.dataset.itemId
  const newStatusName = to.closest(".card").querySelector(".card-header span").textContent.trim();
  console.log( "dragend", issueId, newStatusName, typeof(newStatusName));

  try {
    const newStatus = columns.value.find(c => c.name === newStatusName)
    console.log( newStatus);
    if (!newStatus) return
    console.log("🔹 Found new status:", newStatus)
    console.log(issueId, typeof(issueId));
    console.log(selectedRepo.value.id, typeof(selectedRepo.value.id));
    console.log(newStatus.id, typeof(newStatus.id));

    await axios.put("http://localhost:3000/api/issue-status", {
      issue_id: parseInt(issueId),
      repo_id: selectedRepo.value.id,
      status_id: newStatus.id
    }, { withCredentials: true })

    console.log(`Updated issue ${issueId} → ${newStatus.name}`)
  } catch (err) {
    console.error("Error updating issue status:", err.response?.data || err.message)
  }
}

async function moveColumn(repoId, statusId, direction) {
  try {
    const res = await axios.put(
      `http://localhost:3000/api/statuses/${repoId}/${statusId}/move`,
      { direction },
      { withCredentials: true }
    );

    console.log(`Column moved ${direction}:`, res.data);

    if (selectedRepo.value) {
      await selectRepo(selectedRepo.value);
    }

  } catch (err) {
    console.error("Error moving column:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error moving column");
  }
}

function onMoveLeft(column) {
  moveColumn(column.repo_id, column.id, "left");

}

function onMoveRight(column) {
  moveColumn(column.repo_id, column.id, "right");

}

async function handleAddRepoToGroup({ repoId, groupId }) {
  console.log("Adding repo", repoId, "to group", groupId);
  await fetch(`http://localhost:3000/api/group/${groupId}/add-repo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id: repoId })
  });

  // odśwież grupy
  await loadGroups();
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
    groups,
    onMoveLeft,
    onMoveRight,
    groupsList,
    expandedGroups,
    getRepoById,
    handleAddRepoToGroup
  }
}
