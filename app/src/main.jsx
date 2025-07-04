import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AdminDashboard from './AdminDashboard'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminDashboard />
  </StrictMode>,
)
