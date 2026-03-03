import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  username: string
}

interface AuthState {
  accessToken: string | null
  user: User | null
  setAuth: (accessToken: string, user?: User) => void
  setUser: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
}

const STORAGE_KEY = 'fa-auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => {
        if (accessToken) localStorage.setItem('access_token', accessToken)
        set({ accessToken, user: user ?? get().user })
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('access_token')
        set({ accessToken: null, user: null })
      },
      isAuthenticated: () => !!get().accessToken || !!localStorage.getItem('access_token'),
    }),
    { name: STORAGE_KEY, partialize: (s) => ({ accessToken: s.accessToken, user: s.user }) }
  )
)
