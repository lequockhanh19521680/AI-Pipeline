import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        authApp: 'http://localhost:3101/assets/remoteEntry.js',
        projectApp: 'http://localhost:3102/assets/remoteEntry.js',
        workspaceApp: 'http://localhost:3103/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'react-router-dom', 'zustand']
    })
  ],
  server: {
    port: 5173,
    cors: true
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})