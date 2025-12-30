import { ref, reactive } from 'vue'
import axios from 'axios'
import { getApiBaseUrl } from '../api/getApiBaseUrl.js'

// Stan globalny dla organizacji (żeby nie pobierać w kółko tego samego)
const organizations = ref([])
// Mapa: klucz to login organizacji, wartość to tablica repozytoriów
const orgRepos = reactive({}) 

export function useOrganizations() {
  const apiBase = getApiBaseUrl()

  // 1. Pobierz listę organizacji użytkownika
  async function loadOrganizations() {
    try {
      const res = await axios.get(`${apiBase}/api/github/user/orgs`, { withCredentials: true })
      organizations.value = res.data
    } catch (e) {
      console.error("Error loading organizations:", e)
    }
  }

  // 2. Pobierz repozytoria dla konkretnej organizacji (tylko jeśli jeszcze ich nie mamy)
  async function loadOrgRepos(orgName) {
    // Jeśli już mamy repozytoria dla tej org, nie pobieraj ponownie (opcjonalnie można dodać force refresh)
    if (orgRepos[orgName] && orgRepos[orgName].length > 0) return

    try {
      const res = await axios.get(`${apiBase}/api/github/orgs/repos?org=${orgName}`, { withCredentials: true })
      orgRepos[orgName] = res.data
    } catch (e) {
      console.error(`Error loading repos for org ${orgName}:`, e)
    }
  }

  return {
    organizations,
    orgRepos,
    loadOrganizations,
    loadOrgRepos
  }
}