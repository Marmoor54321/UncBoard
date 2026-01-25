import { ref } from 'vue'
import axios from 'axios'
import { getApiBaseUrl } from '../api/getApiBaseUrl.js' 

const orgsList = ref([])

export function useOrganizations(user) {
  const apiBase = getApiBaseUrl()
  // Prefiks zgodny z routerem w backendzie
  const apiPath = `${apiBase}/api/orgs`

  async function loadOrganizations() {
    // Sprawdzamy czy user jest zalogowany i posiada _id z MongoDB
    if (!user.value || !user.value._id) return
    try {
      // Backend: GET /api/organizations/user/:userId
      const res = await axios.get(`${apiPath}/user/${user.value._id}`, { withCredentials: true })
      orgsList.value = res.data
    } catch (e) {
      console.error("Error loading organizations:", e)
    }
  }

  async function createOrganization({ name, description }) {
    try {
      // Backend: POST /api/organizations/create
      await axios.post(`${apiPath}/create`, 
        { 
          name, 
          description, 
          created_by: user.value._id // Przekazujemy ID twórcy
        }, 
        { withCredentials: true }
      )
      await loadOrganizations()
    } catch (e) {
      console.error("Error creating organization:", e)
    }
  }


    async function deleteOrganization(orgId) {
  try {
    if (!user.value?._id) return;

    await axios.delete(`${apiPath}/${orgId}`, { 
      data: { user_id: user.value._id }, // Przekazujemy kto chce usunąć
      withCredentials: true 
    });

    await loadOrganizations();
  } catch (e) {
    console.error("Error deleting organization:", e);
    // Tutaj możesz dodać powiadomienie dla użytkownika, np. "Brak uprawnień"
  }
}

  // Zarządzanie repozytoriami
  async function addRepoToOrganization({ repoId, orgId }) {
    try {
      // Backend: POST /api/organizations/:orgId/repos/add
      await axios.post(`${apiPath}/${orgId}/repos/add`, 
        { repo_id: repoId }, 
        { withCredentials: true }
      )
      await loadOrganizations()
    } catch (e) {
      console.error("Error adding repo:", e)
    }
  }

  async function removeRepoFromOrganization({ repoId, orgId }) {
    try {
      // Backend: POST /api/organizations/:orgId/repos/remove
      await axios.post(`${apiPath}/${orgId}/repos/remove`, 
        { repo_id: repoId }, 
        { withCredentials: true }
      )
      await loadOrganizations()
    } catch (e) {
      console.error("Error removing repo:", e)
    }
  }

  // Zarządzanie członkami
    async function addMemberToOrganization({ orgId, userLogin, role = 'member' }) {
    try {
        // Wysyłamy user_login zamiast userId
        await axios.post(`${apiPath}/${orgId}/members/add`,
        { user_login: userLogin, role },
        { withCredentials: true }
        )
        await loadOrganizations()
    } catch (e) {
        // Warto dodać alert, jeśli użytkownik nie istnieje
        alert(e.response?.data?.message || "Error adding member")
        console.error("Error adding member:", e)
    }
    }
  async function removeMemberFromOrganization({ orgId, userId }) {
    try {
      // Backend: POST /api/organizations/:orgId/members/remove
      await axios.post(`${apiPath}/${orgId}/members/remove`,
        { user_id: userId },
        { withCredentials: true }
      )
      await loadOrganizations()
    } catch (e) {
      console.error("Error removing member:", e)
    }
  }

  return {
    orgsList,
    loadOrganizations,
    createOrganization,
    addRepoToOrganization,
    removeRepoFromOrganization,
    addMemberToOrganization,
    removeMemberFromOrganization,
    deleteOrganization
  }
}