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
    } catch(e) {
      console.log('Not logged in',e)
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
      order: s.order,
      repo_id: repo.id
    }));
    issuesByColumn.value = {};

    columns.value.forEach(col => {
      issuesByColumn.value[col.name] = issues.filter(issue => issue.status === col.order);
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
      { withCredentials: true },
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
async function deleteColumn(column){
  console.log(column)
  try{
    const res = await axios.delete(
      `http://localhost:3000/api/statuses/${column.id}`,
      {
        data: { repo_id: column.repo_id },   
        withCredentials: true      
      }
    );
    columns.value = columns.value.filter(c => c.id !== column.id);
    const { targetStatusId } = res.data;
    console.log(res.data);
    
    const fromColName = column.name;
    const targetCol = columns.value.find(c => c.id === targetStatusId);
    console.log(targetCol);
    const targetColName = targetCol.name;

    // przenieś całą zawartość kolumny do nowej kolumny
    const movedIssues = issuesByColumn.value[fromColName];

    if (!issuesByColumn.value[targetColName]) {
      issuesByColumn.value[targetColName] = [];
    }

    issuesByColumn.value[targetColName].push(...movedIssues);

    // usuń starą kolumnę
    delete issuesByColumn.value[fromColName];

  }
  catch (err) {

    if (err.response?.status === 400) {
      alert(err.response.data); // komunikat dla uzytkownika
      return;
    }

    console.error("Error deleting column:", err.response?.data || err.message);
  }
}

async function editColumn(columnId, newName) {
  try {
    const res = await axios.put(
      `http://localhost:3000/api/statuses/${columnId}`,
      { name: newName },
      { withCredentials: true }
    );

    console.log("Updated column:", res.data.status);

    // odśwież repo
    if (selectedRepo.value) {
      await selectRepo(selectedRepo.value);
    }

  } catch (err) {
    console.error("Error updating column name:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error updating column");
  }
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
    deleteColumn,
    editColumn
  }
}
