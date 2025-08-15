import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import Layout from '../layouts/Layout'
import LoadingSpinner from './LoadingSpinner'
import ErrorBoundary from './ErrorBoundary'

// Lazy load micro-frontends
const AuthApp = lazy(() => import('authApp/AuthApp'))
const ProjectApp = lazy(() => import('projectApp/ProjectApp'))
const WorkspaceApp = lazy(() => import('workspaceApp/WorkspaceApp'))

// Local components for routes not yet migrated
const Dashboard = lazy(() => import('./Dashboard'))
const NotFound = lazy(() => import('./NotFound'))

const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAppStore()

  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route 
              path="/auth/*" 
              element={
                !isAuthenticated ? (
                  <AuthApp />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <Dashboard />
                ) : (
                  <Navigate to="/auth/login" replace />
                )
              }
            />
            
            <Route
              path="/projects/*"
              element={
                isAuthenticated ? (
                  <ProjectApp />
                ) : (
                  <Navigate to="/auth/login" replace />
                )
              }
            />
            
            <Route
              path="/workspace/*"
              element={
                isAuthenticated ? (
                  <WorkspaceApp />
                ) : (
                  <Navigate to="/auth/login" replace />
                )
              }
            />
            
            {/* Default routes */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/auth/login" replace />
                )
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  )
}

export default AppRouter