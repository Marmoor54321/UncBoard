import { ref } from 'vue'
import axios from 'axios'

export function useAuth() {
  const user = ref(null)

  function loginWithGithub() {
    window.location.href = 'http://localhost:3000/auth/github'
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