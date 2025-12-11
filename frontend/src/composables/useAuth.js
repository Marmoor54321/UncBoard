import { ref } from 'vue'
import axios from 'axios'

const user = ref(null)

export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
}


export function useAuth() {
  const apiBase = getApiBaseUrl()

  function loginWithGithub() {
    window.location.href = `${apiBase}/auth/github`
  }
  async function loadUser() {
    try {
      const res = await axios.get('http://localhost:3000/api/github/user', { withCredentials: true })
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