import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  _id: string
  username: string
  email: string
  role: 'user' | 'admin'
  profile?: {
    firstName?: string
    lastName?: string
    avatar?: string
  }
  preferences?: {
    theme: 'light' | 'dark'
    notifications: boolean
  }
}

interface AppState {
  // Authentication
  user: User | null
  token: string | null
  isAuthenticated: boolean
  
  // UI State
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  
  // Navigation
  currentPath: string
  
  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCurrentPath: (path: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      theme: 'light',
      sidebarCollapsed: false,
      currentPath: '/',
      
      // Actions
      setUser: (user: User) => set({ 
        user, 
        isAuthenticated: true,
        theme: user.preferences?.theme || 'light'
      }),
      
      setToken: (token: string) => set({ token }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
      
      setTheme: (theme: 'light' | 'dark') => set({ theme }),
      
      setSidebarCollapsed: (collapsed: boolean) => set({ 
        sidebarCollapsed: collapsed 
      }),
      
      setCurrentPath: (path: string) => set({ currentPath: path }),
    }),
    {
      name: 'ai-pipeline-shell',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)