import { useCallback, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { api } from './api/client'
import BackendDown from './components/BackendDown'
import Citizen from './pages/Citizen'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [healthy, setHealthy] = useState<boolean | null>(null)

  const checkHealth = useCallback(() => {
    api.health().then(() => setHealthy(true)).catch(() => setHealthy(false))
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  if (healthy === false) {
    return <BackendDown onRetry={checkHealth} />
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/citizen" element={<Citizen />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  )
}
