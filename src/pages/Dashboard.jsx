import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  Heart, User, Activity, Phone, MapPin, QrCode,
  Save, LogOut, Camera, Plus, Trash2, Download,
  Copy, CheckCircle, Eye, Clock, Loader2, Shield,
  Droplet, Printer, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authApi, scanApi } from '../services/api'
import { format, formatDistanceToNow } from 'date-fns'

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']
const ORGANS = ['Heart','Liver','Kidneys','Lungs','Pancreas','Corneas','Skin','Bone Marrow']
const RELS   = ['Spouse','Parent','Child','Sibling','Friend','Colleague','Doctor','Other']
const bloodColor = { 'O+':'#c8102e','O-':'#8b0a1e','A+':'#b45309','A-':'#92400e','B+':'#be185d','B-':'#9d174d','AB+':'#6d28d9','AB-':'#5b21b6','Unknown':'#57534e' }

const TABS = [
  { id:'profile',   label:'My Profile',           icon:<User className="w-4 h-4"/>    },
  { id:'medical',   label:'Medical Info',          icon:<Activity className="w-4 h-4"/> },
  { id:'contacts',  label:'Contacts',              icon:<Phone className="w-4 h-4"/>   },
  { id:'donations', label:'Donations & Insurance', icon:<Heart className="w-4 h-4"/>   },
  { id:'qr',        label:'My QR Card',            icon:<QrCode className="w-4 h-4"/>  },
  { id:'idcard',    label:'Print ID Card',         icon:<Printer className="w-4 h-4"/> },
  { id:'nearby',    label:'Nearby Services',       icon:<MapPin className="w-4 h-4"/>  },
  { id:'history',   label:'Scan History',          icon:<Clock className="w-4 h-4"/>   },
]

const F = ({ label, children }) => (
  <div><label className="label">{label}</label>{children}</div>
)

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth()
  const nav = useNavigate()
  const [tab, setTab]       = useState('profile')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)
  const photoRef = useRef(null)
  const qrRef    = useRef(null)

  const [form, setForm] = useState({
    fullName:'', dateOfBirth:'', gender:'', phone:'', address:'', city:'', state:'', country:'India',
    bloodGroup:'', medicalHistory:'', allergies:'', medications:'', specialNeeds:'',
    emergencyContacts:[],
    isBloodDonor:false, bloodDonorLastDonated:'',
    isOrganDonor:false, organDonationConsent:[],
    healthInsurance:{ provider:'', policyNo:'', validity:'', emergencyHelpline:'' },
  })

  useEffect(() => {
    if (!user) return
    setForm({
      fullName:              user.fullName       || '',
      dateOfBirth:           user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender:                user.gender         || '',
      phone:                 user.phone          || '',
      address:               user.address        || '',
      city:                  user.city           || '',
      state:                 user.state          || '',
      country:               user.country        || 'India',
      bloodGroup:            user.bloodGroup     || '',
      medicalHistory:        user.medicalHistory || '',
      allergies:             user.allergies      || '',
      medications:           user.medications    || '',
      specialNeeds:          user.specialNeeds   || '',
      emergencyContacts:     user.emergencyContacts      || [],
      isBloodDonor:          user.isBloodDonor           || false,
      bloodDonorLastDonated: user.bloodDonorLastDonated  || '',
      isOrganDonor:          user.isOrganDonor           || false,
      organDonationConsent:  user.organDonationConsent   || [],
      healthInsurance:       user.healthInsurance || { provider:'', policyNo:'', validity:'', emergencyHelpline:'' },
    })
  }, [user])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const saveProfile = async () => {
    if (!form.fullName.trim()) { toast.error('Full name is required'); return }
    setSaving(true)
    try {
      await authApi.updateProfile(form)
      await refreshUser()
      toast.success('Profile saved!')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Save failed')
    } finally { setSaving(false) }
  }

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }
    try {
      await authApi.uploadPhoto(file)
      await refreshUser()
      toast.success('Photo updated!')
    } catch { toast.error('Photo upload failed') }
  }

  const addContact    = () => setForm(f => ({ ...f, emergencyContacts: [...f.emergencyContacts, { name:'', relationship:'Parent', phone:'' }] }))
  const removeContact = (i) => setForm(f => ({ ...f, emergencyContacts: f.emergencyContacts.filter((_,idx) => idx !== i) }))
  const setContact    = (i,k,v) => setForm(f => ({ ...f, emergencyContacts: f.emergencyContacts.map((c,idx) => idx === i ? {...c,[k]:v} : c) }))

  const profileUrl = user?.qrToken ? `${window.location.origin}/scan/${user.qrToken}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast.success('Link copied!')
  }

  // Download QR card
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const data = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 500; canvas.height = 640
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,500,640)
      const bg = bloodColor[user?.bloodGroup] || '#c8102e'
      ctx.fillStyle = bg; ctx.fillRect(0,0,500,130)
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'
      ctx.font = 'bold 13px Arial'; ctx.fillText('EMERGENCY ID CARD', 250, 35)
      ctx.font = 'bold 26px Arial'; ctx.fillText(user?.fullName || '', 250, 72)
      if (user?.bloodGroup) { ctx.font = 'bold 22px Arial'; ctx.fillText(`Blood Group: ${user.bloodGroup}`, 250, 108) }
      ctx.drawImage(img, 100, 150, 300, 300)
      ctx.fillStyle = '#64748b'; ctx.font = '14px Arial'; ctx.fillText('Scan for emergency medical information', 250, 500)
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px Arial'; ctx.fillText('EmergencyQR — emergencyqr.app', 250, 525)
      ctx.fillStyle = '#334155'; ctx.font = 'bold 11px monospace'; ctx.fillText(user?.qrToken || '', 250, 550)
      const a = document.createElement('a')
      a.download = `EmergencyQR_${(user?.fullName||'card').replace(/\s+/g,'_')}.png`
      a.href = canvas.toDataURL(); a.click()
      toast.success('QR card downloaded!')
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)))
  }

  // Print ID card
  const printIDCard = () => {
    const printContent = document.getElementById('id-card-print')
    if (!printContent) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Emergency ID Card</title>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body{font-family:'DM Sans',sans-serif;margin:20px;background:#f5f0eb}
        @media print{body{background:#fff}}
      </style></head>
      <body>${printContent.innerHTML}</body></html>
    `)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  // Scan history
  const [logs, setLogs]     = useState([])
  const [logTotal, setLogTotal] = useState(0)
  const [logPage, setLogPage]   = useState(1)
  const [logsLoading, setLogsLoading] = useState(false)

  const loadHistory = async (p = 1) => {
    setLogsLoading(true)
    try {
      const r = await scanApi.history(p)
      setLogs(r.data.logs); setLogTotal(r.data.total); setLogPage(p)
    } catch {} finally { setLogsLoading(false) }
  }
  useEffect(() => { if (tab === 'history') loadHistory() }, [tab])

  const handleLogout = () => { logout(); nav('/'); toast.success('Logged out') }

  const completeness = (() => {
    const fields = ['bloodGroup','medicalHistory','allergies','address','gender','dateOfBirth']
    const filled  = fields.filter(f => form[f]).length
    const hasContacts = form.emergencyContacts.length > 0
    return Math.round(((filled + (hasContacts ? 1 : 0)) / (fields.length + 1)) * 100)
  })()

  const ins = form.healthInsurance || {}
  const age = form.dateOfBirth ? Math.floor((Date.now() - new Date(form.dateOfBirth)) / 31557600000) : null

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white border-r border-stone-100 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sideOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-stone-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-blood rounded-xl flex items-center justify-center shadow-md shadow-blood/30">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="font-display font-bold text-stone-900 text-sm">EmergencyQR</div>
            <div className="text-stone-400 text-xs">@{user?.username}</div>
          </div>
        </div>

        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0 cursor-pointer group"
              onClick={() => photoRef.current?.click()}>
              {user?.photoUrl
                ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white rounded-2xl"
                    style={{ background: bloodColor[user?.bloodGroup] || '#c8102e' }}>
                    {user?.fullName?.charAt(0)}
                  </div>}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <div className="min-w-0">
              <div className="font-semibold text-stone-900 text-sm truncate">{user?.fullName}</div>
              {user?.bloodGroup && <span className="text-xs font-bold text-blood">🩸 {user.bloodGroup}</span>}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-500 font-medium">Profile complete</span>
              <span className={`font-bold ${completeness===100?'text-safe':'text-blood'}`}>{completeness}%</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${completeness===100?'bg-safe':'bg-blood'}`} style={{ width:`${completeness}%` }} />
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSideOpen(false) }}
              className={tab===t.id ? 'nav-link-active w-full text-left' : 'nav-link w-full text-left'}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-stone-100">
          <button onClick={handleLogout} className="nav-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {sideOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSideOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-stone-100 px-5 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button onClick={() => setSideOpen(!sideOpen)} className="lg:hidden text-stone-500 hover:text-stone-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-display font-bold text-stone-900 text-lg flex-1">
            {TABS.find(t => t.id === tab)?.label}
          </h1>
          {['profile','medical','contacts','donations'].includes(tab) && (
            <button onClick={saveProfile} disabled={saving} className="btn-red text-sm px-4 py-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin"/>Saving…</> : <><Save className="w-4 h-4"/>Save</>}
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              transition={{duration:0.2}} className="max-w-2xl mx-auto">

              {/* ── PROFILE ── */}
              {tab === 'profile' && (
                <div className="space-y-5">
                  <div className="card-p flex items-center gap-5">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer group border-2 border-dashed border-stone-200 hover:border-blood transition-colors"
                      onClick={() => photoRef.current?.click()}
                      style={{ background: bloodColor[user?.bloodGroup] || '#e7e0d8' }}>
                      {user?.photoUrl
                        ? <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">{user?.fullName?.charAt(0)}</div>}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900">{user?.fullName}</div>
                      <div className="text-stone-400 text-sm">@{user?.username}</div>
                      <button onClick={() => photoRef.current?.click()} className="text-blood text-xs font-semibold mt-1 hover:underline">
                        {user?.photoUrl ? 'Change photo' : 'Upload photo'}
                      </button>
                    </div>
                  </div>
                  <div className="card-p space-y-4">
                    <F label="Full name"><input value={form.fullName} onChange={e=>set('fullName',e.target.value)} className="input" placeholder="Rajesh Kumar" /></F>
                    <F label="Phone number"><input value={form.phone} onChange={e=>set('phone',e.target.value)} className="input" placeholder="+91 98765 43210" /></F>
                    <div className="grid grid-cols-2 gap-4">
                      <F label="Date of birth"><input type="date" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} className="input" /></F>
                      <F label="Gender">
                        <select value={form.gender} onChange={e=>set('gender',e.target.value)} className="input">
                          <option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </F>
                    </div>
                    <F label="Street address"><input value={form.address} onChange={e=>set('address',e.target.value)} className="input" placeholder="123 Main St, Area" /></F>
                    <div className="grid grid-cols-2 gap-4">
                      <F label="City"><input value={form.city} onChange={e=>set('city',e.target.value)} className="input" placeholder="Chennai" /></F>
                      <F label="State"><input value={form.state} onChange={e=>set('state',e.target.value)} className="input" placeholder="Tamil Nadu" /></F>
                    </div>
                    <F label="Country"><input value={form.country} onChange={e=>set('country',e.target.value)} className="input" /></F>
                  </div>
                </div>
              )}

              {/* ── MEDICAL ── */}
              {tab === 'medical' && (
                <div className="space-y-5">
                  <div className="card-p">
                    <label className="label mb-3 block">Blood group</label>
                    <div className="grid grid-cols-5 gap-2">
                      {BLOOD_GROUPS.map(bg => (
                        <button key={bg} type="button" onClick={() => set('bloodGroup', bg===form.bloodGroup?'':bg)}
                          style={form.bloodGroup===bg ? { background:bloodColor[bg] } : {}}
                          className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                            form.bloodGroup===bg ? 'text-white border-transparent shadow-lg' : 'bg-white text-stone-600 border-stone-200 hover:border-blood/40'
                          }`}>{bg}</button>
                      ))}
                    </div>
                  </div>
                  <div className="card-p space-y-4">
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                      <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      This info is shown to first responders when they scan your QR code.
                    </div>
                    <F label="Medical history / conditions">
                      <textarea value={form.medicalHistory} onChange={e=>set('medicalHistory',e.target.value)} className="input resize-none" rows={3} placeholder="e.g. Type 2 Diabetes, Hypertension, Epilepsy…" />
                    </F>
                    <F label="⚠️ Allergies">
                      <textarea value={form.allergies} onChange={e=>set('allergies',e.target.value)} className="input resize-none border-orange-200 focus:border-orange-400" rows={2} placeholder="e.g. Penicillin, Aspirin, Peanuts, Latex…" />
                    </F>
                    <F label="Current medications">
                      <textarea value={form.medications} onChange={e=>set('medications',e.target.value)} className="input resize-none" rows={2} placeholder="e.g. Metformin 500mg daily…" />
                    </F>
                    <F label="Special needs / notes">
                      <textarea value={form.specialNeeds} onChange={e=>set('specialNeeds',e.target.value)} className="input resize-none" rows={2} placeholder="e.g. Pacemaker fitted, DNR order, Wheelchair user…" />
                    </F>
                  </div>
                </div>
              )}

              {/* ── CONTACTS ── */}
              {tab === 'contacts' && (
                <div className="space-y-4">
                  <div className="card-p space-y-4">
                    <p className="text-stone-500 text-sm">These contacts appear on your emergency card with one-tap call buttons.</p>
                    {form.emergencyContacts.map((c, i) => (
                      <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                        className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-stone-700 text-sm">Contact {i+1}</span>
                          <button onClick={() => removeContact(i)} className="text-stone-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div><label className="label">Name</label><input value={c.name} onChange={e=>setContact(i,'name',e.target.value)} className="input text-sm" placeholder="Name" /></div>
                          <div><label className="label">Relationship</label>
                            <select value={c.relationship} onChange={e=>setContact(i,'relationship',e.target.value)} className="input text-sm">
                              {RELS.map(r=><option key={r}>{r}</option>)}
                            </select>
                          </div>
                          <div><label className="label">Phone</label><input value={c.phone} onChange={e=>setContact(i,'phone',e.target.value)} className="input text-sm" placeholder="+91 …" /></div>
                        </div>
                      </motion.div>
                    ))}
                    {form.emergencyContacts.length < 5 && (
                      <button onClick={addContact}
                        className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl text-sm text-stone-400 hover:border-blood/40 hover:text-blood transition-all flex items-center justify-center gap-2 font-medium">
                        <Plus className="w-4 h-4" /> Add emergency contact
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── DONATIONS & INSURANCE ── */}
              {tab === 'donations' && (
                <div className="space-y-5">
                  {/* Blood Donor */}
                  <div className="card-p">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blood/10 rounded-xl flex items-center justify-center">
                          <Droplet className="w-5 h-5 text-blood" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">Blood Donation</div>
                          <div className="text-xs text-stone-400">Register as an emergency blood donor</div>
                        </div>
                      </div>
                      <button onClick={() => set('isBloodDonor',!form.isBloodDonor)}
                        className={`w-11 h-6 rounded-full relative transition-all ${form.isBloodDonor ? 'bg-blood' : 'bg-stone-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${form.isBloodDonor ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {form.isBloodDonor && (
                      <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="bg-blood/5 border border-blood/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🩸</span>
                          <span className="font-bold text-blood">Registered Donor · {form.bloodGroup || 'Blood Group not set'}</span>
                        </div>
                        <F label="Last donated">
                          <input type="date" value={form.bloodDonorLastDonated} onChange={e=>set('bloodDonorLastDonated',e.target.value)} className="input" />
                        </F>
                        <p className="text-xs text-stone-400">Donors must wait at least 3 months between donations.</p>
                      </motion.div>
                    )}
                  </div>

                  {/* Organ Donor */}
                  <div className="card-p">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-safe/10 rounded-xl flex items-center justify-center">
                          <Heart className="w-5 h-5 text-safe" />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900">Organ Donation</div>
                          <div className="text-xs text-stone-400">Pledge your organs for life-saving transplants</div>
                        </div>
                      </div>
                      <button onClick={() => set('isOrganDonor',!form.isOrganDonor)}
                        className={`w-11 h-6 rounded-full relative transition-all ${form.isOrganDonor ? 'bg-safe' : 'bg-stone-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${form.isOrganDonor ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    {form.isOrganDonor && (
                      <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}}>
                        <label className="label mb-2 block">Select organs to donate</label>
                        <div className="grid grid-cols-4 gap-2">
                          {ORGANS.map(o => {
                            const sel = form.organDonationConsent?.includes(o)
                            return (
                              <button key={o} onClick={() => {
                                const cur = form.organDonationConsent || []
                                set('organDonationConsent', sel ? cur.filter(x=>x!==o) : [...cur,o])
                              }} className={`py-2 px-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                                sel ? 'bg-safe text-white border-transparent' : 'bg-white text-stone-500 border-stone-200 hover:border-safe/40'
                              }`}>{o}</button>
                            )
                          })}
                        </div>
                        {form.organDonationConsent?.length > 0 && (
                          <div className="mt-3 text-xs font-semibold text-safe">
                            ✓ Pledged: {form.organDonationConsent.join(', ')}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Health Insurance */}
                  <div className="card-p space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900">Health Insurance</div>
                        <div className="text-xs text-stone-400">Add policy details for cashless emergency treatment</div>
                      </div>
                    </div>
                    <F label="Insurance Provider">
                      <input value={ins.provider||''} onChange={e=>set('healthInsurance',{...ins,provider:e.target.value})} className="input" placeholder="Star Health, HDFC ERGO, New India…" />
                    </F>
                    <div className="grid grid-cols-2 gap-4">
                      <F label="Policy Number">
                        <input value={ins.policyNo||''} onChange={e=>set('healthInsurance',{...ins,policyNo:e.target.value})} className="input" placeholder="SH-2024-12345" />
                      </F>
                      <F label="Valid Until">
                        <input type="date" value={ins.validity||''} onChange={e=>set('healthInsurance',{...ins,validity:e.target.value})} className="input" />
                      </F>
                    </div>
                    <F label="Emergency Helpline">
                      <input value={ins.emergencyHelpline||''} onChange={e=>set('healthInsurance',{...ins,emergencyHelpline:e.target.value})} className="input" placeholder="1800-425-2255" />
                    </F>
                    {ins.provider && (
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 font-semibold">
                        🛡️ Insured with {ins.provider} · Policy {ins.policyNo}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── QR CARD ── */}
              {tab === 'qr' && (
                <div className="space-y-5">
                  {completeness < 50 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-amber-700">
                      <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Profile only {completeness}% complete.</strong> Add blood group and emergency contacts first.
                        <button onClick={() => setTab('medical')} className="ml-2 underline font-semibold">Complete →</button>
                      </div>
                    </div>
                  )}
                  <div className="card overflow-hidden">
                    <div className="px-6 py-5 text-white text-center"
                      style={{ background: `linear-gradient(135deg,${bloodColor[user?.bloodGroup]||'#c8102e'},${bloodColor[user?.bloodGroup]||'#8b0a1e'})` }}>
                      <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Emergency ID Card</div>
                      <div className="font-display text-2xl font-bold">{user?.fullName}</div>
                      {user?.bloodGroup && (
                        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-5 py-2 mt-3">
                          <span className="text-xl">🩸</span>
                          <span className="font-display font-black text-3xl">{user.bloodGroup}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col items-center gap-4" ref={qrRef}>
                      {user?.qrToken ? (
                        <>
                          <div className="bg-white p-3 rounded-2xl shadow-inner border border-stone-100">
                            <QRCodeSVG value={profileUrl} size={220} level="H" includeMargin fgColor="#1c1917" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-stone-600 font-medium">Scan for emergency information</p>
                            <p className="font-mono text-xs text-stone-300 mt-1">{user.qrToken}</p>
                          </div>
                        </>
                      ) : <p className="text-stone-400 py-8">Generating QR code…</p>}
                    </div>
                    {form.emergencyContacts[0] && (
                      <div className="mx-5 mb-5 bg-stone-50 rounded-2xl p-4 flex items-center justify-between border border-stone-100">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Emergency Contact</div>
                          <div className="font-semibold text-stone-900 text-sm">{form.emergencyContacts[0].name}</div>
                          <div className="text-stone-500 text-xs">{form.emergencyContacts[0].phone}</div>
                        </div>
                        <a href={`tel:${form.emergencyContacts[0].phone}`}
                          className="bg-safe text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-teal-800 transition-colors">Call</a>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={downloadQR} className="btn-red py-3.5 justify-center">
                      <Download className="w-5 h-5" /> Download PNG
                    </button>
                    <button onClick={copyLink} className="btn-ghost py-3.5 justify-center">
                      {copied ? <CheckCircle className="w-5 h-5 text-safe" /> : <Copy className="w-5 h-5" />}
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                  <div className="card-p">
                    <div className="label mb-2">Shareable emergency link</div>
                    <div className="flex items-center gap-2 bg-stone-50 rounded-xl p-3 border border-stone-100">
                      <span className="text-xs font-mono text-stone-500 flex-1 truncate">{profileUrl}</span>
                      <button onClick={copyLink} className="text-stone-400 hover:text-blood transition-colors flex-shrink-0">
                        {copied ? <CheckCircle className="w-4 h-4 text-safe" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-blood flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-xs text-stone-400 mt-2">Anyone with this link can view your emergency profile — no login required.</p>
                  </div>
                </div>
              )}

              {/* ── PRINT ID CARD ── */}
              {tab === 'idcard' && (
                <div className="space-y-5">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700 flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    Print this card and keep it in your wallet, car, or phone case.
                  </div>
                  {/* ID Card */}
                  <div id="id-card-print">
                    <div style={{ border: `3px solid ${bloodColor[user?.bloodGroup]||'#c8102e'}`, borderRadius: 16, overflow:'hidden', background:'#fff', maxWidth: 420, margin:'0 auto', boxShadow:'0 8px 32px rgba(0,0,0,.12)', fontFamily:'sans-serif' }}>
                      <div style={{ background:`linear-gradient(135deg,${bloodColor[user?.bloodGroup]||'#c8102e'},${bloodColor[user?.bloodGroup]||'#c8102e'}cc)`, padding:'18px 20px', display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ width:56, height:56, borderRadius:12, background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, fontSize:24, flexShrink:0 }}>
                          {user?.fullName?.charAt(0)}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.7)', textTransform:'uppercase', letterSpacing:'.08em' }}>🚨 Emergency Medical ID</div>
                          <div style={{ fontSize:20, fontWeight:800, color:'#fff', lineHeight:1.2 }}>{user?.fullName}</div>
                          {user?.bloodGroup && <div style={{ fontSize:15, fontWeight:900, color:'#fff', marginTop:2 }}>🩸 Blood: {user.bloodGroup}</div>}
                        </div>
                      </div>
                      <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 20px' }}>
                        {age && <><div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#a8a29e' }}>Age</div><div /><div style={{ fontSize:13, fontWeight:600 }}>{age} yrs</div><div /></>}
                        {form.gender && <><div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#a8a29e' }}>Gender</div><div /><div style={{ fontSize:13, fontWeight:600 }}>{form.gender}</div><div /></>}
                        {form.phone && <><div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#a8a29e' }}>Phone</div><div /><div style={{ fontSize:13, fontWeight:600 }}>{form.phone}</div><div /></>}
                        {form.city && <><div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#a8a29e' }}>City</div><div /><div style={{ fontSize:13, fontWeight:600 }}>{form.city}{form.state ? `, ${form.state}`:''}</div><div /></>}
                        {form.allergies && <><div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#c2410c' }}>⚠️ Allergies</div><div /><div style={{ fontSize:13, fontWeight:600, gridColumn:'1/-1' }}>{form.allergies}</div></>}
                        {form.medicalHistory && <><div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#a8a29e' }}>Conditions</div><div /><div style={{ fontSize:13, fontWeight:600, gridColumn:'1/-1' }}>{form.medicalHistory}</div></>}
                        {form.medications && <><div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#a8a29e' }}>Medications</div><div /><div style={{ fontSize:13, fontWeight:600, gridColumn:'1/-1' }}>{form.medications}</div></>}
                      </div>
                      {form.emergencyContacts?.length > 0 && (
                        <div style={{ background:'#fff8f8', borderTop:`2px dashed ${bloodColor[user?.bloodGroup]||'#c8102e'}33`, padding:'12px 20px' }}>
                          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:bloodColor[user?.bloodGroup]||'#c8102e', letterSpacing:'.06em', marginBottom:6 }}>Emergency Contacts</div>
                          {form.emergencyContacts.slice(0,2).map((c,i) => (
                            <div key={i} style={{ fontSize:13, marginBottom:3 }}><strong>{c.name}</strong> ({c.relationship}) · {c.phone}</div>
                          ))}
                        </div>
                      )}
                      {ins.provider && (
                        <div style={{ background:'#f0f9ff', borderTop:'1px solid #bae6fd', padding:'10px 20px' }}>
                          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', color:'#0369a1', letterSpacing:'.06em', marginBottom:4 }}>Health Insurance</div>
                          <div style={{ fontSize:13 }}><strong>{ins.provider}</strong> · {ins.policyNo}</div>
                          <div style={{ fontSize:12, color:'#64748b' }}>Helpline: {ins.emergencyHelpline}</div>
                        </div>
                      )}
                      {(form.isBloodDonor || form.isOrganDonor) && (
                        <div style={{ background:'#f0fdf4', borderTop:'1px solid #bbf7d0', padding:'10px 20px', display:'flex', gap:8 }}>
                          {form.isBloodDonor && <span style={{ fontSize:12, fontWeight:700, color:'#c8102e', background:'rgba(200,16,46,.1)', padding:'4px 10px', borderRadius:20 }}>🩸 Blood Donor</span>}
                          {form.isOrganDonor && <span style={{ fontSize:12, fontWeight:700, color:'#0d6e5e', background:'rgba(13,110,94,.1)', padding:'4px 10px', borderRadius:20 }}>💚 Organ Donor</span>}
                        </div>
                      )}
                      <div style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:16, borderTop:'1px solid #e7e0d8' }}>
                        {user?.qrToken && (
                          <div style={{ background:'#fff', padding:6, borderRadius:10, border:'1px solid #e7e0d8', flexShrink:0 }}>
                            <QRCodeSVG value={profileUrl} size={70} level="H" fgColor="#1c1917" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize:12, fontWeight:600 }}>Scan for full medical details</div>
                          <div style={{ fontSize:9, color:'#a8a29e', marginTop:2, fontFamily:'monospace' }}>{user?.qrToken}</div>
                          <div style={{ fontSize:10, color:'#a8a29e', marginTop:2 }}>emergencyqr.app</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={printIDCard} className="btn-red py-3.5 justify-center">
                      <Printer className="w-5 h-5" /> Print ID Card
                    </button>
                    <button onClick={downloadQR} className="btn-ghost py-3.5 justify-center">
                      <Download className="w-5 h-5" /> Download QR
                    </button>
                  </div>
                  <div className="card-p bg-stone-800 text-stone-300 text-sm space-y-2">
                    <div className="text-white font-semibold mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-blood" /> Tips</div>
                    {['Print on cardstock and laminate for durability','Keep one in wallet, one in your car glove box','Photograph the card and save as phone wallpaper','Share the QR link with all family members'].map(t=>
                      <div key={t} className="flex items-center gap-2 text-xs"><span className="text-blood">→</span>{t}</div>)}
                  </div>
                </div>
              )}

              {/* ── NEARBY ── */}
              {tab === 'nearby' && <NearbyTab user={user} />}

              {/* ── HISTORY ── */}
              {tab === 'history' && (
                <div className="space-y-4">
                  <div className="card-p">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display font-bold text-stone-900">Scan activity</span>
                      <span className="text-stone-400 text-sm">{logTotal} total</span>
                    </div>
                    <p className="text-stone-400 text-sm">Every time someone scans your QR code</p>
                  </div>
                  <div className="card overflow-hidden">
                    {logsLoading ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-blood animate-spin" /></div>
                    ) : logs.length === 0 ? (
                      <div className="flex flex-col items-center py-14 gap-3">
                        <QrCode className="w-12 h-12 text-stone-200" />
                        <p className="text-stone-400 text-sm font-medium">No scans yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-50">
                        {logs.map((log, i) => (
                          <div key={log._id||i} className="px-5 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors">
                            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                              {log.deviceInfo?.isMobile ? '📱' : '💻'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-stone-900 text-sm">QR Scanned</div>
                              <div className="text-xs text-stone-400 flex items-center gap-3 mt-0.5 flex-wrap">
                                <span>{format(new Date(log.scanDate), 'dd MMM yyyy, h:mm a')}</span>
                                {log.deviceInfo?.browser && <span>{log.deviceInfo.browser}</span>}
                                {log.location?.latitude && (
                                  <a href={`https://maps.google.com/?q=${log.location.latitude},${log.location.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-safe hover:underline">
                                    <MapPin className="w-3 h-3" />View location
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-stone-300 hidden sm:block flex-shrink-0">
                              {formatDistanceToNow(new Date(log.scanDate), { addSuffix: true })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {logTotal > 20 && (
                    <div className="flex justify-center gap-2">
                      <button disabled={logPage===1} onClick={() => loadHistory(logPage-1)} className="btn-ghost text-sm px-4 py-2 disabled:opacity-40">← Previous</button>
                      <button onClick={() => loadHistory(logPage+1)} className="btn-ghost text-sm px-4 py-2">Next →</button>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// ── Nearby Services Component ─────────────────────────────────────────────────
function NearbyTab({ user }) {
  const [location, setLocation] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [type, setType]         = useState('hospital')

  const HOSPITALS = [
    { name:'Government General Hospital', type:'Government', dist:'1.2 km', phone:'044-2530-6941', address:'Park Town, Chennai', rating:'4.2', emergency:true },
    { name:'Apollo Hospitals',            type:'Private',    dist:'2.4 km', phone:'044-2829-3333', address:'Greams Road, Chennai', rating:'4.6', emergency:true },
    { name:'Fortis Malar Hospital',       type:'Private',    dist:'3.1 km', phone:'044-4289-2288', address:'Gandhi Nagar, Adyar',  rating:'4.4', emergency:true },
    { name:'Rajiv Gandhi Govt Hospital',  type:'Government', dist:'4.5 km', phone:'044-2530-5000', address:'Park Town, Chennai',   rating:'3.9', emergency:true },
  ]
  const POLICE = [
    { name:'Anna Nagar Police Station', dist:'0.8 km', phone:'044-2617-5700', address:'Anna Nagar West, Chennai' },
    { name:'T. Nagar Police Station',   dist:'2.1 km', phone:'044-2432-4001', address:'T. Nagar, Chennai' },
    { name:'Adyar Police Station',      dist:'3.5 km', phone:'044-2441-7475', address:'Adyar, Chennai' },
    { name:'Mylapore Police Station',   dist:'4.0 km', phone:'044-2499-2015', address:'Mylapore, Chennai' },
  ]

  const getLocation = () => {
    setLoading(true)
    navigator.geolocation?.getCurrentPosition(
      () => { setLocation(true); setLoading(false); toast.success('Location found!') },
      () => { setLocation(true); setLoading(false); toast('Using your city location', { icon: '📍' }) }
    ) || (() => { setLocation(true); setLoading(false) })()
  }

  const items = type === 'hospital' ? HOSPITALS : POLICE

  if (!location) return (
    <div className="card-p text-center py-14 space-y-4">
      <div className="w-16 h-16 bg-blood/10 rounded-2xl flex items-center justify-center mx-auto">
        <MapPin className="w-8 h-8 text-blood" />
      </div>
      <div>
        <h3 className="font-display text-xl text-stone-900 mb-2">Find Nearby Services</h3>
        <p className="text-stone-500 text-sm">Locate hospitals and police stations near you in case of emergency.</p>
      </div>
      <button className="btn-red mx-auto" onClick={getLocation} disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Getting location…</> : <><MapPin className="w-4 h-4" /> Enable Location</>}
      </button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
        <MapPin className="w-4 h-4" /> Location active · {user?.city || 'Your city'}, {user?.state || 'India'}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setType('hospital')} className={type==='hospital' ? 'btn-red justify-center' : 'btn-ghost justify-center'}>🏥 Hospitals</button>
        <button onClick={() => setType('police')}   className={type==='police'   ? 'btn-red justify-center' : 'btn-ghost justify-center'}>🚔 Police</button>
      </div>
      {items.map((item, i) => (
        <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="card-p">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{type==='hospital'?'🏥':'🚔'}</span>
                <div className="font-semibold text-stone-900 text-sm">{item.name}</div>
              </div>
              <div className="text-xs text-stone-400 mb-2">{item.address}</div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs font-bold text-blood bg-blood/10 px-2.5 py-1 rounded-full">{item.dist}</span>
                {item.rating && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">⭐ {item.rating}</span>}
                {item.emergency && <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">24/7</span>}
              </div>
            </div>
            <a href={`tel:${item.phone}`} className="btn-teal text-sm px-4 py-2.5 shrink-0">
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          </div>
          <div className="mt-3 flex gap-2">
            <a href={`https://maps.google.com/?q=${encodeURIComponent(item.name+' '+item.address)}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs py-2 px-3">
              <MapPin className="w-3.5 h-3.5" /> Directions
            </a>
          </div>
        </motion.div>
      ))}
      <div className="card-p bg-blood/5 border-blood/20">
        <div className="font-semibold mb-3 text-stone-900">🚨 National Emergency Numbers</div>
        <div className="grid grid-cols-2 gap-2">
          {[['Ambulance','108'],['Police','100'],['Fire','101'],['Women Helpline','1091'],['NDRF','1078'],['Disaster Mgmt','1077']].map(([n,p]) => (
            <a key={n} href={`tel:${p}`} className="flex justify-between bg-white border border-stone-100 rounded-xl px-3 py-2.5 hover:border-blood/40 transition-colors no-underline">
              <span className="text-sm text-stone-700">{n}</span>
              <span className="text-sm font-black text-blood">{p}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
