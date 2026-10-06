import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('eqr_token')
    if (!token) { setLoading(false); return }
    authApi.me()
      .then(r => setUser(r.data))
      .catch(() => { localStorage.removeItem('eqr_token'); localStorage.removeItem('eqr_user') })
      .finally(() => setLoading(false))
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('eqr_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('eqr_token')
    localStorage.removeItem('eqr_user')
    setUser(null)
  }

  const refreshUser = async () => {
    try { const r = await authApi.me(); setUser(r.data) } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
