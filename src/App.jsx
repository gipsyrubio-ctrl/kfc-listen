import { Routes, Route, Navigate } from 'react-router-dom'
import Survey from './pages/Survey.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import { useAuth } from './hooks/useAuth.js'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF5F0]">
      <div className="text-center">
        <div className="text-3xl mb-3">🍗</div>
        <div className="text-sm text-[#9C8680]">Cargando KFC Listen...</div>
      </div>
    </div>
  )

  return (
    <Routes>
      {/* Encuesta — acceso público para colaboradores */}
      <Route path="/" element={<Survey />} />

      {/* Login del dashboard */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

      {/* Dashboard — solo para usuarios autenticados */}
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />

      {/* Ruta no encontrada */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
