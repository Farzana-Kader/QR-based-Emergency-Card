import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import HomePage     from './pages/HomePage'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard    from './pages/Dashboard'
import ScanPage     from './pages/ScanPage'
import AdminLogin   from './pages/AdminLogin'
import AdminPanel   from './pages/AdminPanel'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return !user ? children : <Navigate to="/dashboard" replace />
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-blood animate-spin" />
        <p className="text-stone-400 text-sm font-medium">Loading…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: 12, fontWeight: 600, fontSize: 14 } }} />
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/login"      element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"   element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/scan/:token" element={<ScanPage />} />
          <Route path="/admin"      element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminPanel />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
