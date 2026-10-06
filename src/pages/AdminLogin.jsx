import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const submit = async () => {
    if (!form.username || !form.password) { toast.error('Please enter credentials'); return }
    setLoading(true)
    try {
      const r = await authApi.adminLogin(form)
      localStorage.setItem('eqr_admin_token', r.data.token)
      toast.success('Welcome, Admin!')
      nav('/admin/dashboard')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-stone-800 rounded-2xl p-8 border border-stone-700">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blood rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blood/30">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-2xl text-white font-bold">Admin Login</h2>
          <p className="text-stone-400 text-sm mt-1">EmergencyQR Control Panel</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label text-stone-400">Username</label>
            <input className="w-full bg-stone-700 border border-stone-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blood placeholder:text-stone-500"
              value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} placeholder="admin" />
          </div>
          <div>
            <label className="label text-stone-400">Password</label>
            <input type="password" className="w-full bg-stone-700 border border-stone-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blood placeholder:text-stone-500"
              value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))}
              placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <button onClick={submit} disabled={loading}
            className="w-full btn-red py-3 justify-center text-base">
            {loading ? 'Signing in…' : <><Lock className="w-4 h-4" /> Sign in to Admin Panel</>}
          </button>
          <button onClick={() => nav('/login')} className="w-full text-center text-stone-500 text-sm hover:text-stone-300 transition-colors mt-2">
            ← Back to user login
          </button>
        </div>
        <p className="text-stone-600 text-xs text-center mt-6">Default: admin / admin@123</p>
      </div>
    </div>
  )
}