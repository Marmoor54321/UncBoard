import { ref } from 'vue'
import axios from 'axios'
import { getApiBaseUrl } from '../api/getApiBaseUrl.js'
const user = ref(null)



export function useAuth() {
  const apiBase = getApiBaseUrl()

  function loginWithGithub() {
    window.location.href = `${apiBase}/auth/github`
  }

  async function loadUser() {
    try {
      const res = await axios.get(`${apiBase}/api/github/user`, { withCredentials: true })
      user.value = res.data ?? null
      return user.value
    } catch (e) {
      console.error('Not logged in', e)
      return null
    }
  }

  return {
    user,
    loginWithGithub,
    loadUser
  }
}