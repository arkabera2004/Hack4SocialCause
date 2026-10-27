import { Route, Routes } from 'react-router-dom'
import Citizen from './pages/Citizen'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/citizen" element={<Citizen />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  )
}
