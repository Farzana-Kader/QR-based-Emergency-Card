import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Users, Activity, Droplet, Heart,
  LogOut, Eye, BarChart2, Search, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'

const bloodColor = {
  'O+':'#c8102e','O-':'#8b0a1e','A+':'#b45309','A-':'#92400e',
  'B+':'#be185d','B-':'#9d174d','AB+':'#6d28d9','AB-':'#5b21b6','Unknown':'#57534e'
}

export default function AdminPanel() {
  const nav = useNavigate()
  const [tab, setTab]           = useState('dashboard')
  const [users, setUsers]       = useState([])
  const [stats, setStats]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    const token = localStorage.getItem('eqr_admin_token')
    if (!token) {
      toast.error('Admin session not found. Please log in.')
      nav('/admin')
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([
        authApi.adminUsers(),
        authApi.adminStats(),
      ])
      setUsers(usersRes.data.users || [])
      setStats(statsRes.data || {})
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to load admin data'
      toast.error(msg)
      if (err?.response?.status === 401) {
        localStorage.removeItem('eqr_admin_token')
        nav('/admin')
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('eqr_admin_token')
    toast.success('Logged out')
    nav('/admin')
  }

  const filtered = users.filter(u =>
    (u.fullName   || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username   || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.city       || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.bloodGroup || '').toLowerCase().includes(search.toLowerCase())
  )

  const STAT_CARDS = [
    { label: 'Total Users',    value: stats.totalUsers   || 0, color: '#60a5fa', icon: <Users className="w-5 h-5" />    },
    { label: 'Blood Donors',   value: stats.bloodDonors  || 0, color: '#f87171', icon: <Droplet className="w-5 h-5" />  },
    { label: 'Organ Donors',   value: stats.organDonors  || 0, color: '#4ade80', icon: <Heart className="w-5 h-5" />    },
    { label: 'Total QR Scans', value: stats.totalScans   || 0, color: '#fb923c', icon: <Activity className="w-5 h-5" /> },
  ]

  const SIDEBAR_TABS = [
    { id: 'dashboard', label: 'Dashboard',    icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'users',     label: 'Manage Users', icon: <Users className="w-4 h-4" />     },
  ]

  return (
    <div className="min-h-screen bg-stone-900 flex">

      {/* Sidebar */}
      <aside className="w-60 bg-stone-800 border-r border-stone-700 flex flex-col shrink-0">
        <div className="p-5 border-b border-stone-700 flex items-center gap-3">
          <div className="w-9 h-9 bg-blood rounded-xl flex items-center justify-center shadow-md shadow-blood/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm">Admin Panel</div>
            <div className="text-stone-500 text-xs">EmergencyQR v2.0</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {SIDEBAR_TABS.map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); setSelectedUser(null) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-blood/20 text-red-400'
                  : 'text-stone-400 hover:bg-stone-700 hover:text-white'
              }`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-stone-700">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/20 transition-all">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-stone-800 border-b border-stone-700 px-6 py-4">
          <h1 className="text-white font-display font-bold text-xl">
            {tab === 'dashboard'
              ? '📊 Dashboard Overview'
              : selectedUser
                ? `👤 ${selectedUser.fullName}`
                : '👥 User Management'}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
            </div>
          )}

          {/* DASHBOARD TAB */}
          {!loading && tab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map(s => (
                  <div key={s.label} className="bg-stone-800 border border-stone-700 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3" style={{ color: s.color }}>
                      {s.icon}
                      <span className="text-xs font-semibold text-stone-400">{s.label}</span>
                    </div>
                    <div className="text-4xl font-black" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-700 flex items-center justify-between">
                  <h3 className="text-white font-semibold">All Registered Users</h3>
                  <span className="text-stone-500 text-sm">{users.length} total</span>
                </div>
                <div className="divide-y divide-stone-700/50">
                  {users.length === 0 && (
                    <div className="px-6 py-10 text-center text-stone-500">No users registered yet</div>
                  )}
                  {users.slice(0, 10).map((u, i) => (
                    <div key={u._id || u.id || i}
                      className="px-6 py-3 flex items-center gap-4 hover:bg-stone-700/30 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                        style={{ background: bloodColor[u.bloodGroup] || '#64748b' }}>
                        {(u.fullName || '?').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate">{u.fullName}</div>
                        <div className="text-stone-500 text-xs">@{u.username} · {u.city || '—'}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {u.bloodGroup && (
                          <span className="text-xs font-bold text-red-400 bg-red-900/20 px-2.5 py-1 rounded-full">
                            🩸 {u.bloodGroup}
                          </span>
                        )}
                        {u.isBloodDonor && (
                          <span className="text-xs font-semibold text-red-300 bg-red-900/10 px-2 py-1 rounded-full">Donor</span>
                        )}
                      </div>
                      <span className="text-stone-500 text-xs shrink-0">{u.totalScans || 0} scans</span>
                      <button
                        onClick={() => { setSelectedUser(u); setTab('users') }}
                        className="text-xs bg-stone-700 hover:bg-stone-600 text-stone-300 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB — LIST */}
          {!loading && tab === 'users' && !selectedUser && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-stone-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, username, city, blood group…"
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blood placeholder:text-stone-500"
                />
              </div>

              <div className="bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden">
                <div className="px-6 py-3 border-b border-stone-700 grid gap-4 text-xs font-bold uppercase tracking-wider text-stone-500"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 80px 80px' }}>
                  <span>Name</span><span>City</span><span>Blood</span><span>Scans</span><span>Action</span>
                </div>
                <div className="divide-y divide-stone-700/50">
                  {filtered.length === 0 && (
                    <div className="px-6 py-12 text-center text-stone-500">No users match your search</div>
                  )}
                  {filtered.map((u, i) => (
                    <div key={u._id || u.id || i}
                      className="px-6 py-3 grid gap-4 items-center hover:bg-stone-700/30 transition-colors"
                      style={{ gridTemplateColumns: '2fr 1fr 1fr 80px 80px' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0"
                          style={{ background: bloodColor[u.bloodGroup] || '#64748b' }}>
                          {(u.fullName || '?').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white text-sm font-medium truncate">{u.fullName}</div>
                          <div className="text-stone-500 text-xs">@{u.username}</div>
                        </div>
                      </div>
                      <span className="text-stone-400 text-sm truncate">{u.city || '—'}</span>
                      <span className="text-sm font-bold" style={{ color: u.bloodGroup ? '#f87171' : '#475569' }}>
                        {u.bloodGroup || '—'}
                      </span>
                      <span className="text-stone-400 text-sm">{u.totalScans || 0}</span>
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="flex items-center gap-1.5 text-xs bg-stone-700 hover:bg-stone-600 text-stone-300 px-3 py-1.5 rounded-lg transition-colors">
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB — DETAIL */}
          {!loading && tab === 'users' && selectedUser && (
            <div className="space-y-4 max-w-2xl">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex items-center gap-2 text-stone-400 hover:text-white text-sm transition-colors">
                ← Back to Users
              </button>

              <div className="bg-stone-800 border border-stone-700 rounded-2xl overflow-hidden">
                <div className="p-6 flex items-center gap-5"
                  style={{ background: `linear-gradient(135deg,${bloodColor[selectedUser.bloodGroup] || '#c8102e'},${bloodColor[selectedUser.bloodGroup] || '#c8102e'}99)` }}>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl shrink-0">
                    {(selectedUser.fullName || '?').charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-display font-bold text-xl">{selectedUser.fullName}</div>
                    <div className="text-white/60 text-sm">@{selectedUser.username}</div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedUser.bloodGroup && (
                        <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full">🩸 {selectedUser.bloodGroup}</span>
                      )}
                      {selectedUser.isBloodDonor && (
                        <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full">Blood Donor</span>
                      )}
                      {selectedUser.isOrganDonor && (
                        <span className="text-xs font-bold text-white bg-white/20 px-3 py-1 rounded-full">Organ Donor</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black text-white">{selectedUser.totalScans || 0}</div>
                    <div className="text-white/50 text-xs">QR Scans</div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    ['Phone',           selectedUser.phone],
                    ['Gender',          selectedUser.gender],
                    ['City',            selectedUser.city],
                    ['State',           selectedUser.state],
                    ['Country',         selectedUser.country],
                    ['Date of Birth',   selectedUser.dateOfBirth ? selectedUser.dateOfBirth.split('T')[0] : null],
                    ['Medical History', selectedUser.medicalHistory],
                    ['Allergies',       selectedUser.allergies],
                    ['Medications',     selectedUser.medications],
                    ['Special Needs',   selectedUser.specialNeeds],
                    ['Insurance',       selectedUser.healthInsurance?.provider
                      ? `${selectedUser.healthInsurance.provider} · ${selectedUser.healthInsurance.policyNo}`
                      : null],
                    ['Joined',          selectedUser.createdAt ? selectedUser.createdAt.split('T')[0] : null],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">{k}</div>
                      <div className="text-stone-200 text-sm">{v}</div>
                    </div>
                  ))}
                </div>

                {selectedUser.emergencyContacts?.length > 0 && (
                  <div className="px-6 pb-5 border-t border-stone-700 pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">Emergency Contacts</div>
                    {selectedUser.emergencyContacts.map((c, i) => (
                      <div key={i} className="text-stone-300 text-sm mb-2">
                        <strong className="text-stone-200">{c.name}</strong>
                        <span className="text-stone-500"> ({c.relationship})</span>
                        {' · '}{c.phone}
                      </div>
                    ))}
                  </div>
                )}

                {selectedUser.organDonationConsent?.length > 0 && (
                  <div className="px-6 pb-5 border-t border-stone-700 pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Organ Donation Pledged</div>
                    <div className="text-stone-300 text-sm">{selectedUser.organDonationConsent.join(', ')}</div>
                  </div>
                )}

                <div className="px-6 pb-6 border-t border-stone-700 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">QR Token</div>
                  <code className="text-red-400 bg-red-900/10 text-xs px-3 py-2 rounded-lg block font-mono break-all">
                    {selectedUser.qrToken}
                  </code>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}