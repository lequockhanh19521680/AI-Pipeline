import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from './store/appStore'
import AppRouter from './components/AppRouter'

function App() {
  const location = useLocation()
  const { setCurrentPath, token, setUser, setToken } = useAppStore()

  // Update current path in store
  useEffect(() => {
    setCurrentPath(location.pathname)
  }, [location.pathname, setCurrentPath])

  // Check for auth token in URL (from OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tokenFromUrl = urlParams.get('token')
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
      // Remove token from URL
      window.history.replaceState({}, document.title, location.pathname)
      
      // Fetch user details
      fetchUserDetails(tokenFromUrl)
    }
  }, [location.search, setToken])

  // Fetch user details if we have a token but no user
  useEffect(() => {
    if (token && !useAppStore.getState().user) {
      fetchUserDetails(token)
    }
  }, [token])

  const fetchUserDetails = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error)
    }
  }

  return <AppRouter />
}

export default App