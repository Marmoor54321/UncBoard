import { ref, computed } from 'vue'
import axios from 'axios'

export function useKanban() {
  const repos = ref([])
  const selectedRepo = ref(null)
  const columns = ref([])
  const issuesByColumn = ref({})
  const repoData = ref({ collaborators: [], labels: [], milestones: [] })
  
  // Drag and drop settings
  const groups = { name: 'issues', pull: true, put: true }

  function getRepoById(id) {
    return repos.value.find(r => r.id === id)
  }

  async function loadRepos() {
    try {
      const res = await axios.get('http://localhost:3000/api/github/repos', { withCredentials: true })
      repos.value = res?.data ?? []
    } catch (e) {
      console.error('Error loading repos:', e)
    }
  }

  async function selectRepo(repo) {
    try {
      // 1. Ensure default statuses exist
      await axios.post("http://localhost:3000/api/statuses/default", { repo_id: repo.id }, { withCredentials: true })

      // 2. Fetch all necessary data in parallel
      const [statusesRes, issuesRes, collaboratorsRes, labelsRes, milestonesRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/statuses/${repo.id}`, { withCredentials: true }),
        axios.get(`http://localhost:3000/api/github/issues/${repo.owner.login}/${repo.name}?repo_id=${repo.id}`, { withCredentials: true }),
        axios.get(`http://localhost:3000/api/github/repos/collaborators?owner=${repo.owner.login}&repo=${repo.name}`, { withCredentials: true }),
        axios.get(`http://localhost:3000/api/github/repos/labels?owner=${repo.owner.login}&repo=${repo.name}`, { withCredentials: true }),
        axios.get(`http://localhost:3000/api/github/repos/milestones?owner=${repo.owner.login}&repo=${repo.name}`, { withCredentials: true }),
      ])

      // 3. Update State
      repoData.value = {
        collaborators: collaboratorsRes.data,
        labels: labelsRes.data,
        milestones: milestonesRes.data
      }

      columns.value = statusesRes.data.map(s => ({
        id: s._id,
        name: s.name,
        order: s.order,
        repo_id: repo.id
      }))

      issuesByColumn.value = {}
      columns.value.forEach(col => {
        issuesByColumn.value[col.name] = issuesRes.data.filter(issue => issue.status === col.order)
      })

      selectedRepo.value = repo
    } catch (error) {
      console.error("Error selecting repo:", error)
    }
  }

  // --- COLUMN ACTIONS ---

  async function addColumn(repoId, name, userId) {
    try {
      const res = await axios.post("http://localhost:3000/api/statuses", { repo_id: repoId, name, user_id: userId }, { withCredentials: true })
      const newStatus = res.data
      
      columns.value.push({ id: newStatus._id, name: newStatus.name, repo_id: newStatus.repo_id, order: newStatus.order })
      issuesByColumn.value[newStatus.name] = []
    } catch (err) {
      alert(err.response?.data?.message || "Error creating column")
    }
  }

  async function deleteColumn(column) {
    try {
      const res = await axios.delete(`http://localhost:3000/api/statuses/${column.id}`, {
        data: { repo_id: column.repo_id }, withCredentials: true
      })
      
      // Update UI: Move issues locally
      const { targetStatusId } = res.data
      const targetCol = columns.value.find(c => c.id === targetStatusId)
      
      if (targetCol) {
        if (!issuesByColumn.value[targetCol.name]) issuesByColumn.value[targetCol.name] = []
        issuesByColumn.value[targetCol.name].push(...(issuesByColumn.value[column.name] || []))
      }
      
      delete issuesByColumn.value[column.name]
      columns.value = columns.value.filter(c => c.id !== column.id)
    } catch (err) {
      alert(err.response?.data || "Error deleting column")
    }
  }

  async function editColumn(columnId, newName) {
    try {
      await axios.put(`http://localhost:3000/api/statuses/${columnId}`, { name: newName }, { withCredentials: true })
      if (selectedRepo.value) await selectRepo(selectedRepo.value) // Refresh to be safe or update local state
    } catch (err) {
      console.error(err)
    }
  }

  async function moveColumn(column, direction) {
    try {
      await axios.put(`http://localhost:3000/api/statuses/${column.repo_id}/${column.id}/move`, { direction }, { withCredentials: true })
      if (selectedRepo.value) await selectRepo(selectedRepo.value)
    } catch (err) {
      console.error("Error moving column", err)
    }
  }

  // --- ISSUE ACTIONS ---

  async function onDragEnd(event) {
    const { item, to } = event
    const issueId = item.dataset.itemId
    const newStatusName = to.closest(".card").querySelector(".card-header span").textContent.trim()
    
    const newStatus = columns.value.find(c => c.name === newStatusName)
    if (!newStatus) return

    try {
      await axios.put("http://localhost:3000/api/issue-status", {
        issue_id: parseInt(issueId),
        repo_id: selectedRepo.value.id,
        status_id: newStatus.id
      }, { withCredentials: true })
    } catch (err) {
      console.error("Drag sync error", err)
    }
  }

  function addIssueToBoard(newIssue) {
    if (issuesByColumn.value[newIssue.status]) {
      issuesByColumn.value[newIssue.status].unshift(newIssue)
    }
  }

  async function updateIssue(issueNumber, updates) {
    if (!selectedRepo.value) return
    const { owner, name } = selectedRepo.value
    
    try {
      const res = await axios.patch(`http://localhost:3000/api/github/issues/${owner.login}/${name}/${issueNumber}`, updates, { withCredentials: true })
      
      // Update local state reactivity
      for (const colName in issuesByColumn.value) {
        const index = issuesByColumn.value[colName].findIndex(i => i.number === issueNumber)
        if (index !== -1) {
          Object.assign(issuesByColumn.value[colName][index], res.data)
          break
        }
      }
    } catch (err) {
      throw err
    }
  }

  return {
    repos,
    selectedRepo,
    columns,
    issuesByColumn,
    repoData,
    groups, // draggable options
    loadRepos,
    selectRepo,
    getRepoById,
    addColumn,
    deleteColumn,
    editColumn,
    onMoveLeft: (col) => moveColumn(col, "left"),
    onMoveRight: (col) => moveColumn(col, "right"),
    onDragEnd,
    addIssueToBoard,
    updateIssue
  }
}