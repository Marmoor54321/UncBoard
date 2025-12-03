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
  const repoData = ref({  collaborators: [],
  labels: [],
  milestones: []
})

  const groups = { name: 'issues', pull: true, put: true }

  function loginWithGithub() {
    window.location.href = 'http://localhost:3000/auth/github'
  }
  

  async function loadUser() {
    try {
      const res = await axios.get('http://localhost:3000/api/github/user', { withCredentials: true})
      user.value = res.data ?? null
      await loadRepos()
      await loadGroups();
    } catch(e) {
      console.error('Not logged in',e)
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
    const res = await axios.get('http://localhost:3000/api/github/repos', { withCredentials: true })
    repos.value = res?.data ?? null
    }
    catch(e){
      console.error('Error loading repos:', e)
    }
  }

  async function selectRepo(repo) {
  try {
    await axios.post(
      "http://localhost:3000/api/statuses/default",
      { repo_id: repo.id },
      { withCredentials: true }
    );

    const statusesRes = await axios.get(
      `http://localhost:3000/api/statuses/${repo.id}`,
      { withCredentials: true }
    );

    const statuses = statusesRes.data;
    console.log("Repo statuses:", statuses);

    const [issuesRes, collaboratorsRes, labelsRes, milestonesRes] =
      await Promise.all([
        axios.get(
          `http://localhost:3000/api/github/issues/${repo.owner.login}/${repo.name}?repo_id=${repo.id}`,
          { withCredentials: true }
        ),
        axios.get(
          `http://localhost:3000/api/github/repos/collaborators?owner=${repo.owner.login}&repo=${repo.name}`,
          { withCredentials: true }
        ),
        axios.get(
          `http://localhost:3000/api/github/repos/labels?owner=${repo.owner.login}&repo=${repo.name}`,
          { withCredentials: true }
        ),
        axios.get(
          `http://localhost:3000/api/github/repos/milestones?owner=${repo.owner.login}&repo=${repo.name}`,
          { withCredentials: true }
        ),
      ]);

     const issues = issuesRes.data;
     repoData.value.collaborators = collaboratorsRes.data;
     console.log(repoData);
     repoData.value.labels = labelsRes.data;
     repoData.value.milestones = milestonesRes.data;

    columns.value = statuses.map(s => ({
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
    if (!newStatus) return

    await axios.put("http://localhost:3000/api/issue-status", {
      issue_id: parseInt(issueId),
      repo_id: selectedRepo.value.id,
      status_id: newStatus.id
    }, { withCredentials: true })

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

async function addColumn(repoId, name, userId) {
  try {
    const res = await axios.post(
      "http://localhost:3000/api/statuses",
      {
        repo_id: repoId,
        name,
        user_id: userId
      },
      { withCredentials: true }
    );

    const newStatus = res.data;

    columns.value.push({
      id: newStatus._id,
      name: newStatus.name,
      repo_id: newStatus.repo_id,
      order: newStatus.order
    });

    issuesByColumn.value[newStatus.name] = [];

    return newStatus;

  } catch (err) {
    if (err.response?.status === 400 && err.response?.data === "A status with this name already exists") {
      alert("This status column name already exists. Please choose another name.");
      return;
    }

    console.error("Error creating column:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error creating column");
  }
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

async function handleDeleteRepoFromGroup({ repoId, groupId }) {
  console.log("Deleting repo", repoId, "from group", groupId);
  await fetch(`http://localhost:3000/api/group/${groupId}/remove-repo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id: repoId })
  });

  // odśwież grupy
  await loadGroups();
}


async function handleAddGroup({ name, created_by }) {
  console.log("Creating group", name, "by", created_by);
  await fetch(`http://localhost:3000/api/group/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name, created_by: created_by })
  });

  // odśwież grupy
  await loadGroups();
}


async function handleDeleteGroup({ groupId }) {
  console.log("Deleting group", groupId);
  await fetch(`http://localhost:3000/api/group/${groupId}/delete`, {
    method: "DELETE"
  });

  // odśwież grupy
  await loadGroups();
}

function addIssueToBoard(newIssue) {
  const statusName = newIssue.status;
  
  if (issuesByColumn.value[statusName]) {
    issuesByColumn.value[statusName].unshift(newIssue);
  } else {
    console.error(`Status column not found for: ${statusName}`);
  }
}


async function updateIssue(issueNumber, updates) {
  if (!selectedRepo.value) return;

  const { owner, name } = selectedRepo.value;
  
  try {
    // 1. Send data to Backend
    const res = await axios.patch(
      `http://localhost:3000/api/github/issues/${owner.login}/${name}/${issueNumber}`,
      updates,
      { withCredentials: true }
    );

    const updatedIssueData = res.data;

    // 2. Update local state (issuesByColumn) so the UI refreshes instantly
    // We need to find the issue in the nested arrays
    for (const colName in issuesByColumn.value) {
      const index = issuesByColumn.value[colName].findIndex(i => i.number === issueNumber);
      if (index !== -1) {
        // We merge the new data into the existing object to preserve reactivity
        Object.assign(issuesByColumn.value[colName][index], updatedIssueData);
        break;
      }
    }

    return updatedIssueData;

  } catch (err) {
    console.error("Error updating issue:", err);
    throw err;
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
    editColumn,
    addColumn,
    groupsList,
    expandedGroups,
    getRepoById,
    handleAddRepoToGroup,
    handleDeleteRepoFromGroup,
    handleAddGroup,
    handleDeleteGroup,
    repoData,
    addIssueToBoard,
    updateIssue
  }
}
