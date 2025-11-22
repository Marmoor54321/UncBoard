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
    } catch(e) {
      console.error('Not logged in',e)
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
     repoData.value.labels = labelsRes.data;
     repoData.value.milestones = milestonesRes.data;

    columns.value = statuses.map(s => ({
      id: s._id,
      name: s.name,
      repo_id: repo.id
    }));

    issuesByColumn.value = {};

    columns.value.forEach(col => {
      issuesByColumn.value[col.name] = issues.filter(
        issue => issue.status === col.name
      );
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
      { withCredentials: true }
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

function addIssueToBoard(newIssue) {
  const statusName = newIssue.status;
  
  if (issuesByColumn.value[statusName]) {
    issuesByColumn.value[statusName].unshift(newIssue);
  } else {
    console.error(`Status column not found for: ${statusName}`);
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
    repoData,
    addIssueToBoard
  }
}
