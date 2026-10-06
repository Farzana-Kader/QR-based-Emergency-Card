import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, MapPin, AlertCircle, Heart, Activity,
  Pill, User, Loader2, CheckCircle, Siren, Shield, Droplet
} from 'lucide-react'
import toast from 'react-hot-toast'
import { profileApi } from '../services/api'

const bloodColor = { 'O+':'#c8102e','O-':'#8b0a1e','A+':'#b45309','A-':'#92400e','B+':'#be185d','B-':'#9d174d','AB+':'#6d28d9','AB-':'#5b21b6','Unknown':'#57534e' }

export default function ScanPage() {
  const { token } = useParams()
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [tab, setTab]             = useState('info')
  const [location, setLocation]   = useState(null)
  const [locShared, setLocShared] = useState(false)
  const [alertSent, setAlertSent] = useState(false)
  const [alertLoading, setAlertLoading] = useState(false)

  useEffect(() => {
    if (!token) { setError('Invalid QR code'); setLoading(false); return }
    profileApi.get(token)
      .then(r => { setProfile(r.data); requestLocation() })
      .catch(e => setError(e?.response?.data?.error || 'Profile not found'))
      .finally(() => setLoading(false))
  }, [token])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }
      setLocation(loc); setLocShared(true)
      profileApi.sendLocation(token, loc).catch(() => {})
    }, () => {})
  }, [token])

  const handleShareLocation = () => {
    if (!navigator.geolocation) { toast.error('Location not supported'); return }
    toast.loading('Getting location…', { id: 'loc' })
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }
      setLocation(loc); setLocShared(true)
      profileApi.sendLocation(token, loc).catch(() => {})
      toast.success('Location shared with emergency contacts!', { id: 'loc' })
    }, () => toast.error('Location permission denied', { id: 'loc' }))
  }

  const handleEmergencyAlert = async () => {
    if (alertSent) return
    setAlertLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setAlertSent(true)
    setAlertLoading(false)
    toast.success('🚨 Emergency alert sent to all contacts!', { duration: 5000 })
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full border-4 border-stone-200 border-t-blood animate-spin mx-auto mb-4" />
        <p className="text-stone-500 text-sm font-medium">Loading emergency profile…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-5">
      <div className="text-center max-w-xs">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-blood" />
        </div>
        <h2 className="font-display text-xl font-bold text-stone-900 mb-2">Profile Not Found</h2>
        <p className="text-stone-500 text-sm">{error}</p>
        <Link to="/" className="btn-ghost mt-5 mx-auto">← Go Home</Link>
      </div>
    </div>
  )

  if (!profile) return null

  const bgColor = bloodColor[profile.bloodGroup] || '#c8102e'
  const age     = profile.age || (profile.dateOfBirth ? Math.floor((Date.now()-new Date(profile.dateOfBirth))/31557600000) : null)

  const TABS = [
    { id:'info',     label:'Info'         },
    { id:'medical',  label:'Medical'      },
    { id:'contacts', label:'Contacts'     },
    { id:'donor',    label:'Donor & Insurance' },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="text-white text-center pb-8 pt-6 px-4" style={{ background:`linear-gradient(160deg,${bgColor} 0%,${bgColor}cc 100%)` }}>
        <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">🚨 Emergency Medical Profile</div>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-3 border-2 border-white/30"
          style={{ background: 'rgba(255,255,255,.2)' }}>
          {profile.fullName?.charAt(0)}
        </div>
        <div className="font-display text-3xl font-bold mb-1">{profile.fullName}</div>
        {age && <div className="opacity-80 text-sm mb-1">{age} years{profile.gender ? ` · ${profile.gender}` : ''}</div>}
        {profile.bloodGroup && (
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-6 py-2 mt-3">
            <span className="text-2xl">🩸</span>
            <span className="font-display font-black text-4xl">{profile.bloodGroup}</span>
          </div>
        )}
      </div>

      {/* SOS + Location Buttons */}
      <div className="px-4 -mt-1 pb-0 flex gap-3 pt-5">
        <button onClick={handleEmergencyAlert} disabled={alertSent}
          className={`flex-1 py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all ${
            alertSent ? 'bg-green-500' : 'bg-blood hover:bg-blood-dark shadow-lg shadow-blood/30 animate-beat'
          }`}>
          {alertLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : alertSent ? <CheckCircle className="w-5 h-5" /> : <Siren className="w-5 h-5" />}
          {alertLoading ? 'Sending…' : alertSent ? 'Alert Sent!' : '🚨 Send Emergency Alert'}
        </button>
        <button onClick={handleShareLocation}
          className={`px-5 py-4 rounded-2xl font-bold text-sm flex items-center gap-2 border-2 transition-all ${
            locShared ? 'bg-green-500 text-white border-transparent' : 'bg-white text-stone-700 border-stone-200 hover:border-blood'
          }`}>
          {locShared ? <CheckCircle className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          {locShared ? 'Shared' : 'Location'}
        </button>
      </div>

      {/* Location map link */}
      {location && (
        <div className="mx-4 mt-3">
          <a href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 font-medium no-underline">
            <MapPin className="w-4 h-4" /> Location shared — tap to view on Google Maps
          </a>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={tab===t.id ? { background:bgColor } : {}}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
              tab===t.id ? 'text-white border-transparent' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.15}}>

            {tab === 'info' && (
              <div className="space-y-3">
                {profile.phone && (
                  <div className="card-p flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-stone-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold uppercase text-stone-400 tracking-wider">Phone</div>
                      <a href={`tel:${profile.phone}`} className="font-semibold text-blood">{profile.phone}</a>
                    </div>
                  </div>
                )}
                {profile.address && (
                  <div className="card-p flex items-center gap-4">
                    <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase text-stone-400 tracking-wider">Address</div>
                      <div className="font-semibold text-sm">{profile.address}, {profile.city}{profile.state?', '+profile.state:''}</div>
                    </div>
                  </div>
                )}
                {profile.specialNeeds && (
                  <div className="card-p">
                    <div className="text-xs font-bold uppercase text-stone-400 tracking-wider mb-1">Special Needs</div>
                    <div className="font-semibold text-sm">{profile.specialNeeds}</div>
                  </div>
                )}
              </div>
            )}

            {tab === 'medical' && (
              <div className="space-y-3">
                {profile.allergies && (
                  <div className="rounded-2xl p-4 border-2 border-orange-300 bg-orange-50">
                    <div className="text-xs font-black uppercase tracking-widest text-orange-600 mb-1">⚠️ ALLERGIES — CRITICAL</div>
                    <div className="font-bold text-orange-900 text-base">{profile.allergies}</div>
                  </div>
                )}
                {profile.medicalHistory && (
                  <div className="card-p">
                    <div className="text-xs font-bold uppercase text-stone-400 tracking-wider mb-1 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Medical History</div>
                    <div className="font-semibold text-sm">{profile.medicalHistory}</div>
                  </div>
                )}
                {profile.medications && (
                  <div className="card-p">
                    <div className="text-xs font-bold uppercase text-stone-400 tracking-wider mb-1 flex items-center gap-1"><Pill className="w-3.5 h-3.5" /> Current Medications</div>
                    <div className="font-semibold text-sm">{profile.medications}</div>
                  </div>
                )}
                {!profile.allergies && !profile.medicalHistory && !profile.medications && (
                  <div className="card-p text-center text-stone-400 py-8">No medical information provided</div>
                )}
              </div>
            )}

            {tab === 'contacts' && (
              <div className="space-y-3">
                {profile.emergencyContacts?.length > 0 ? profile.emergencyContacts.map((c,i) => (
                  <div key={i} className="card-p flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-stone-900">{c.name}</div>
                      <div className="text-sm text-stone-500">{c.relationship} · {c.phone}</div>
                    </div>
                    <a href={`tel:${c.phone}`} className="btn-teal text-sm py-2.5 px-5">
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  </div>
                )) : (
                  <div className="card-p text-center text-stone-400 py-8">No emergency contacts set</div>
                )}
              </div>
            )}

            {tab === 'donor' && (
              <div className="space-y-3">
                {profile.isBloodDonor && (
                  <div className="card-p border-blood/20 bg-blood/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Droplet className="w-5 h-5 text-blood" />
                      <span className="font-bold text-blood text-sm uppercase tracking-wide">Registered Blood Donor</span>
                    </div>
                    <div className="font-bold text-lg">Blood Group: {profile.bloodGroup}</div>
                    {profile.bloodDonorLastDonated && <div className="text-sm text-stone-500 mt-1">Last donated: {profile.bloodDonorLastDonated}</div>}
                  </div>
                )}
                {profile.isOrganDonor && (
                  <div className="card-p border-safe/20 bg-safe/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Heart className="w-5 h-5 text-safe" />
                      <span className="font-bold text-safe text-sm uppercase tracking-wide">Organ Donor</span>
                    </div>
                    {profile.organDonationConsent?.length > 0 && (
                      <div className="text-sm text-stone-600">Pledged organs: {profile.organDonationConsent.join(', ')}</div>
                    )}
                  </div>
                )}
                {profile.healthInsurance?.provider && (
                  <div className="card-p border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-blue-700 text-sm uppercase tracking-wide">Health Insured</span>
                    </div>
                    <div className="font-bold text-stone-900">{profile.healthInsurance.provider}</div>
                    <div className="text-sm text-stone-500">Policy: {profile.healthInsurance.policyNo}</div>
                    {profile.healthInsurance.emergencyHelpline && (
                      <a href={`tel:${profile.healthInsurance.emergencyHelpline}`} className="btn-ghost text-xs py-2 px-3 mt-3">
                        <Phone className="w-3.5 h-3.5" /> Insurance Helpline: {profile.healthInsurance.emergencyHelpline}
                      </a>
                    )}
                  </div>
                )}
                {!profile.isBloodDonor && !profile.isOrganDonor && !profile.healthInsurance?.provider && (
                  <div className="card-p text-center text-stone-400 py-8">No donor or insurance info available</div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4 pb-8 mt-4">
        <Link to="/" className="btn-ghost w-full justify-center text-sm">
          Powered by EmergencyQR · Create your free ID →
        </Link>
      </div>
    </div>
  )
}
