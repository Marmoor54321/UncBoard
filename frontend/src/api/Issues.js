import axios from 'axios'

async function addIssue(selectedRepo, data, column) {
  if (!selectedRepo.value) {
    throw new Error("No repository selected")
  }

  try {
    const response = await axios.post(
      `http://localhost:3000/api/github/issues/${selectedRepo.value.owner.login}/${selectedRepo.value.name}`,
      {
        title: data.title.trim(),
        body: data.description?.trim() || "",
        repo_id: selectedRepo.value.id,
        status_id: column.value.id,
        assignees: data.assignees || [],
        labels: data.labels || [],
        milestone: data.milestone || null
      },
      { withCredentials: true }
    )
    return response.data
  } catch (e) {
    console.error('Error adding issue:', e.response?.data || e.message)
    throw e
  }
}
async function loadRepoData(repo) {
  const response = await fetch(`/api/github/repo-data?owner=${repo.owner.login}&repo=${repo.name}`);
  const data = await response.json();

  store.collaborators = data.collaborators;
  store.labels = data.labels;
  store.milestones = data.milestones;
  
  return data;
}

export { addIssue, loadRepoData }