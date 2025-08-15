import React, { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated, sidebarCollapsed, theme } = useAppStore()
  
  // Don't show layout on auth pages
  const isAuthPage = location.pathname.startsWith('/auth')
  
  // Apply theme to document
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  if (isAuthPage || !isAuthenticated) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <div className="flex">
          <Sidebar />
          
          <main className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}>
            <div className="pt-16"> {/* Account for fixed header */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout