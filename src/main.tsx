import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { DataProvider } from './state/DataContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouterProvider } from './router'
import './styles.css'

registerSW({ onNeedRefresh() { window.dispatchEvent(new CustomEvent('netplan:update-ready')) } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider><DataProvider><App /></DataProvider></RouterProvider>
    </ErrorBoundary>
  </StrictMode>
)
