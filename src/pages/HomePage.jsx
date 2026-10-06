import { Link } from 'react-router-dom'
import { Heart, Droplet, Shield, MapPin, Bell, Printer, Activity, Phone } from 'lucide-react'

const FEATURES = [
  { icon: <Droplet className="w-5 h-5" />, label: 'Blood Donor Registry' },
  { icon: <Heart className="w-5 h-5" />, label: 'Organ Donation Pledge' },
  { icon: <Shield className="w-5 h-5" />, label: 'Health Insurance Info' },
  { icon: <MapPin className="w-5 h-5" />, label: 'Share Live Location' },
  { icon: <Bell className="w-5 h-5" />, label: 'Emergency SOS Alert' },
  { icon: <Activity className="w-5 h-5" />, label: 'Nearby Hospitals & Police' },
  { icon: <Printer className="w-5 h-5" />, label: 'Printable ID Card + QR' },
  { icon: <Phone className="w-5 h-5" />, label: 'One-tap Emergency Call' },
]

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1c0a0a 0%,#3b0d0d 50%,#1c1917 100%)' }}>
      <nav style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#c8102e', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-display text-white text-xl font-bold">EmergencyQR</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" className="btn-ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>Sign in</Link>
          <Link to="/register" className="btn-red">Get Started</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,16,46,.2)', border: '1px solid rgba(200,16,46,.4)', borderRadius: 20, padding: '6px 14px', marginBottom: 24 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ff8080', textTransform: 'uppercase', letterSpacing: '.06em' }}>🇮🇳 Made for India · Free & Open Source</span>
        </div>

        <h1 className="font-display" style={{ fontSize: 52, color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
          Your Emergency Info,<br />
          <span style={{ color: '#ff6b6b' }}>One Scan Away</span>
        </h1>

        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 18, lineHeight: 1.7, marginBottom: 40 }}>
          Create a QR-linked emergency ID with medical data, contacts, blood &amp; organ donation status,
          health insurance, nearby hospitals — ready for any crisis.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <Link to="/register" className="btn-red" style={{ padding: '14px 28px', fontSize: 16, gap: 8 }}>
            <Heart className="w-5 h-5 fill-white" /> Create Free ID Card
          </Link>
          <Link to="/login" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 16, color: '#fff', borderColor: 'rgba(255,255,255,.3)' }}>
            Sign in
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 14 }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '18px 14px', border: '1px solid rgba(255,255,255,.1)', textAlign: 'center' }}>
              <div style={{ color: '#ff6b6b', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{f.icon}</div>
              <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: 500 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
