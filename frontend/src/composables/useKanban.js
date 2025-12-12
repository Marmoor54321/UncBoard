import { ref, computed } from 'vue'
import axios from 'axios'
import { getApiBaseUrl } from '../api/getApiBaseUrl.js'

const repos = ref([])
const selectedRepo = ref(null)
const columns = ref([])
const issuesByColumn = ref({})
const repoData = ref({ collaborators: [], labels: [], milestones: [] })

const alert = ref({
  show: false,
  message: '',
  type: 'error'
})

export function useKanban() {
  const apiBase = getApiBaseUrl()

  function triggerAlert(message, type = 'error', timeout = 5000) {
    alert.value = { show: true, message, type }
    if (timeout) {
      setTimeout(() => {
        if (alert.value.message === message) {
          closeAlert()
        }
      }, timeout)
    }
  }

  function closeAlert() {
    alert.value.show = false
    alert.value.message = ''
  }

  const groups = { name: 'issues', pull: true, put: true }

  function getRepoById(id) {
    return repos.value.find(r => r.id === id)
  }

  async function loadRepos() {
    try {
      const res = await axios.get(`${apiBase}/api/github/repos`, { withCredentials: true })
      repos.value = res?.data ?? []
    } catch (e) {
      console.error('Error loading repos:', e)
      triggerAlert('Nie udało się pobrać repozytoriów', 'error')
    }
  }

  async function selectRepo(repo) {
    try {
      await axios.post(`${apiBase}/api/statuses/default`, { repo_id: repo.id }, { withCredentials: true })

      const [statusesRes, issuesRes, collaboratorsRes, labelsRes, milestonesRes] = await Promise.all([
        axios.get(`${apiBase}/api/statuses/${repo.id}`, { withCredentials: true }),
        axios.get(`${apiBase}/api/github/issues/${repo.owner.login}/${repo.name}?repo_id=${repo.id}`, { withCredentials: true }),
        axios.get(`${apiBase}/api/github/repos/collaborators?owner=${repo.owner.login}&repo=${repo.name}`, { withCredentials: true }),
        axios.get(`${apiBase}/api/github/repos/labels?owner=${repo.owner.login}&repo=${repo.name}`, { withCredentials: true }),
        axios.get(`${apiBase}/api/github/repos/milestones?owner=${repo.owner.login}&repo=${repo.name}`, { withCredentials: true }),
      ])

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

      const rawIssuesByColumn = {}
      for (const s of statusesRes.data) {
        rawIssuesByColumn[s.name] = issuesRes.data.filter(issue => issue.status === s.order)
      }
      
      issuesByColumn.value = rawIssuesByColumn
      selectedRepo.value = repo
    } catch (error) {
      console.error("Error selecting repo:", error)
      triggerAlert('Błąd podczas wybierania repozytorium', 'error')
    }
  }


  async function addColumn(repoId, name, userId) {
    try {
      const res = await axios.post(`${apiBase}/api/statuses`, { repo_id: repoId, name, user_id: userId }, { withCredentials: true })
      const newStatus = res.data

      columns.value.push({ id: newStatus._id, name: newStatus.name, repo_id: newStatus.repo_id, order: newStatus.order })
      issuesByColumn.value[newStatus.name] = []
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Nie udało się utworzyć kolumny";
      triggerAlert(message, 'error'); 
    }
  }

  async function deleteColumn(column) {
    try {
      const res = await axios.delete(`${apiBase}/api/statuses/${column.id}`, {
        data: { repo_id: column.repo_id }, withCredentials: true
      })
      
      const { targetStatusId } = res.data
      const targetCol = columns.value.find(c => c.id === targetStatusId)
      
       if (targetCol) {
        issuesByColumn.value[targetCol.name] ??= []
        const issuesToMove = issuesByColumn.value[column.name] ?? []
        issuesByColumn.value[targetCol.name].push(...issuesToMove)
      }
      
      delete issuesByColumn.value[column.name]
      columns.value = columns.value.filter(c => c.id !== column.id)
    } catch (err) {
      const msg = err.response?.data.message || "Error deleting column";
      triggerAlert(msg, 'error');
    }
  }

  async function editColumn(columnId, newName) {
    try {
      await axios.put(`${apiBase}/api/statuses/${columnId}`, { name: newName }, { withCredentials: true })
      if (selectedRepo.value) await selectRepo(selectedRepo.value) 
    } catch (err) {
      console.error(err)
      triggerAlert('Nie udało się edytować kolumny', 'error')
    }
  }

  async function moveColumn(column, direction) {
    try {
      await axios.put(`${apiBase}/api/statuses/${column.repo_id}/${column.id}/move`, { direction }, { withCredentials: true })
      if (selectedRepo.value) await selectRepo(selectedRepo.value)
    } catch (err) {
      console.error("Error moving column", err)
    }
  }


  async function onDragEnd(event) {
    const { item, to } = event
    const issueId = item.dataset.itemId
    const newStatusName = to.closest(".card").querySelector(".card-header span").textContent.trim()
    
    const newStatus = columns.value.find(c => c.name === newStatusName)
    if (!newStatus) return

    try {
      await axios.put(`${apiBase}/api/issue-status`, {
        issue_id: parseInt(issueId),
        repo_id: selectedRepo.value.id,
        status_id: newStatus.id
      }, { withCredentials: true })
    } catch (err) {
      console.error("Drag sync error", err)
      triggerAlert('Błąd synchronizacji statusu zadania', 'error')
    }
  }

  function addIssueToBoard(newIssue) {
    issuesByColumn.value[newIssue.status]?.unshift(newIssue)
  }

  async function updateIssue(issueNumber, updates) {
    if (!selectedRepo.value) return
    const { owner, name } = selectedRepo.value
    
    try {
      const res = await axios.patch(`${apiBase}/api/github/issues/${owner.login}/${name}/${issueNumber}`, updates, { withCredentials: true })
      
      for (const col of Object.values(issuesByColumn.value)) {
        const issue = col.find(i => i.number === issueNumber)
        if (!issue) continue
        
        Object.assign(issue, res.data)
        break
      }
    } catch (err) {
      triggerAlert('Nie udało się zaktualizować zadania', 'error')
      throw err
    }
  }

  return {
    repos,
    selectedRepo,
    columns,
    issuesByColumn,
    repoData,
    groups,
    alert, 
    closeAlert, 
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