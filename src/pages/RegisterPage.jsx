import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']
const bloodColor = { 'O+':'#c8102e','O-':'#8b0a1e','A+':'#b45309','A-':'#92400e','B+':'#be185d','B-':'#9d174d','AB+':'#6d28d9','AB-':'#5b21b6','Unknown':'#57534e' }

export default function RegisterPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ username:'', password:'', fullName:'', bloodGroup:'', phone:'' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async () => {
    if (!form.fullName || !form.username || !form.password) { setErr('Please fill all required fields'); return }
    if (form.password.length < 6) { setErr('Password must be at least 6 characters'); return }
    setLoading(true); setErr('')
    try {
      const r = await authApi.register(form)
      login(r.data.token, r.data.user)
      toast.success(`Welcome, ${r.data.user.fullName?.split(' ')[0]}! Your Emergency ID is ready.`)
      nav('/dashboard')
    } catch (e) {
      setErr(e?.response?.data?.error || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-5">
      <div className="card-p w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-12 h-12 bg-blood rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blood/30">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h2 className="font-display text-2xl">Create your Emergency ID</h2>
          <p className="text-stone-400 text-sm mt-1">Free · Instant · Life-saving</p>
        </div>
        {err && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm mb-4">{err}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="Rajesh Kumar" />
          </div>
          <div>
            <label className="label">Username *</label>
            <input className="input" value={form.username} onChange={e=>set('username',e.target.value)} placeholder="rajesh.kumar" />
          </div>
          <div>
            <label className="label">Password *</label>
            <input className="input" type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="label">Blood Group</label>
            <div className="grid grid-cols-5 gap-2">
              {BLOOD_GROUPS.map(bg => (
                <button key={bg} type="button" onClick={() => set('bloodGroup', bg === form.bloodGroup ? '' : bg)}
                  style={form.bloodGroup === bg ? { background: bloodColor[bg], borderColor: 'transparent' } : {}}
                  className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                    form.bloodGroup === bg ? 'text-white' : 'bg-white text-stone-500 border-stone-200 hover:border-blood/40'
                  }`}>{bg}</button>
              ))}
            </div>
          </div>
          <button className="btn-red w-full justify-center py-3" onClick={submit} disabled={loading}>
            {loading ? 'Creating…' : 'Create Emergency ID'}
          </button>
          <p className="text-center text-sm text-stone-500">
            Already have an account? <Link to="/login" className="text-blood font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
