import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async () => {
    if (!form.username || !form.password) { setErr('Please fill in all fields'); return }
    setLoading(true); setErr('')
    try {
      const r = await authApi.login(form)
      login(r.data.token, r.data.user)
      toast.success(`Welcome back, ${r.data.user.fullName?.split(' ')[0]}!`)
      nav('/dashboard')
    } catch (e) {
      setErr(e?.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-5">
      <div className="card-p w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-12 h-12 bg-blood rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blood/30">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h2 className="font-display text-2xl text-stone-900">Sign in</h2>
          <p className="text-stone-400 text-sm mt-1">Emergency QR · Secure Access</p>
        </div>
        {err && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">{err}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input className="input" value={form.username} onChange={e=>set('username',e.target.value)} placeholder="rajesh.kumar" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={e=>set('password',e.target.value)}
              placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&submit()} />
          </div>
          <button className="btn-red w-full justify-center py-3" onClick={submit} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-sm text-stone-500">
            No account? <Link to="/register" className="text-blood font-semibold hover:underline">Create one</Link>
          </p>
          <div className="border-t border-stone-100 pt-3 text-center">
            <Link to="/admin" className="flex items-center justify-center gap-2 text-xs text-stone-400 hover:text-stone-700 transition-colors">
              <Shield className="w-3.5 h-3.5" /> Admin login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
