import { ref } from 'vue'
import axios from 'axios'

const groupsList = ref([])

export function useGroups(user) {

  async function loadGroups() {
    if (!user.value) return
    try {
      const res = await axios.get(`http://localhost:3000/api/groups/${user.value._id}`, { withCredentials: true })
      groupsList.value = res.data
    } catch (e) {
      console.error("Error loading groups:", e)
    }
  }

  async function handleAddRepoToGroup({ repoId, groupId }) {
    await fetch(`http://localhost:3000/api/group/${groupId}/add-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId })
    })
    await loadGroups()
  }

  async function handleDeleteRepoFromGroup({ repoId, groupId }) {
    await fetch(`http://localhost:3000/api/group/${groupId}/remove-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId })
    })
    await loadGroups()
  }

  async function handleAddGroup({ name, created_by }) {
    await fetch(`http://localhost:3000/api/group/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, created_by })
    })
    await loadGroups()
  }

  async function handleDeleteGroup({ groupId }) {
    await fetch(`http://localhost:3000/api/group/${groupId}/delete`, { method: "DELETE" })
    await loadGroups()
  }

  return {
    groupsList,
    loadGroups,
    handleAddRepoToGroup,
    handleDeleteRepoFromGroup,
    handleAddGroup,
    handleDeleteGroup
  }
}