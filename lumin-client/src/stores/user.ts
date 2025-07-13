import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'

export interface IUser {
  id: number
  username: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem("token"))
  const user = ref<IUser | null>()
  const isLogin = ref(false)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem("token", newToken)
  }

  function logout() {
    token.value = null
    user.value = null
    isLogin.value = false

    localStorage.removeItem("token")
  }

  function login(newUser: IUser) {
    user.value = newUser
    isLogin.value = true
  }

  return { token, user, isLogin, setToken, logout, login }
})
