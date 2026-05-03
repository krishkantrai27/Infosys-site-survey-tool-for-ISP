import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import api from '../api/axios'
import AnimatedGlobe from '../components/AnimatedGlobe'
import CircuitBorder from '../components/CircuitBorder'

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', organizationId: '' })
    const [orgs, setOrgs] = useState([])
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const { theme } = useTheme()
    const navigate = useNavigate()
    const isDark = theme === 'dark'

    useEffect(() => {
        api.get('/organizations').then(res => setOrgs(res.data.data || [])).catch(() => { })
    }, [])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const payload = { ...form, organizationId: form.organizationId ? Number(form.organizationId) : null, roles: ['CUSTOMER'] }
            await register(payload)
            toast.success('Account created! Awaiting admin approval.')
            navigate('/login')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed')
        } finally { setLoading(false) }
    }

    const inputStyle = isDark ? { background: '#1A1A1A', borderColor: '#2A2A2A', color: '#E8E8E8' } : {}
    const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: isDark ? '#888' : 'inherit' }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: isDark ? '#0D0D0D' : undefined }}>
            {/* Left side - Globe + branding */}
            <div className="register-globe-panel" style={{
                flex: '0 0 42%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px',
                position: 'relative', overflow: 'hidden', background: isDark ? '#0A0A0A' : 'var(--color-bg)'
            }}>
                <AnimatedGlobe opacity={isDark ? 0.9 : 0.7} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                        <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src="/logo.png" alt="ProbeLink" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: isDark ? '#E8E8E8' : 'var(--color-text)' }}>ProbeLink</h1>
                            <p style={{ opacity: 0.8, fontSize: 14, color: isDark ? '#888' : 'var(--color-text-muted)' }}>ISP Network Planning</p>
                        </div>
                    </div>
                    <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em', color: isDark ? '#E8E8E8' : 'var(--color-text)' }}>Join the<br />Network.</h2>
                    <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.85, maxWidth: 420, color: isDark ? '#888' : 'var(--color-text-muted)' }}>
                        Create your account and start planning smarter network infrastructure with ProbeLink's collaborative site survey tools.
                    </p>
                </div>
            </div>

            {/* Right side - register form with circuit border */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 48px', background: isDark ? '#0D0D0D' : 'var(--color-surface)', overflowY: 'auto', overflow: 'visible' }}>
                <div style={{ width: '100%', maxWidth: 460, position: 'relative', overflow: 'visible' }}>
                    <div style={{ position: 'relative', overflow: 'visible' }}>
                        <CircuitBorder borderRadius={20} />
                        <div style={{
                            position: 'relative', zIndex: 1, padding: '32px 28px',
                            borderRadius: 20,
                            background: isDark ? '#141414' : 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(12px)',
                        }}>
                            <div style={{ marginBottom: 24 }}>
                                <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.02em', color: isDark ? '#E8E8E8' : '#1E293B' }}>Create Account</h2>
                                <p style={{ color: isDark ? '#888' : 'var(--color-text-muted)', fontSize: 14 }}>Join the ProbeLink platform</p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <div><label style={labelStyle}>First Name</label><input className="input-field" name="firstName" value={form.firstName} onChange={handleChange} style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Last Name</label><input className="input-field" name="lastName" value={form.lastName} onChange={handleChange} style={inputStyle} /></div>
                                </div>
                                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Username *</label><input className="input-field" name="username" value={form.username} onChange={handleChange} required style={inputStyle} /></div>
                                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Email *</label><input className="input-field" name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} /></div>
                                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Password *</label><input className="input-field" name="password" type="password" value={form.password} onChange={handleChange} required style={inputStyle} /></div>
                                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Organization</label>
                                    <select className="input-field" name="organizationId" value={form.organizationId} onChange={handleChange} style={inputStyle}>
                                        <option value="">Select...</option>
                                        {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 12 }}><label style={labelStyle}>Phone</label><input className="input-field" name="phone" value={form.phone} onChange={handleChange} style={inputStyle} /></div>

                                <div style={{ marginBottom: 16, padding: 12, background: isDark ? 'rgba(21,128,61,0.1)' : '#F0FDF4', borderRadius: 8, fontSize: 13, color: isDark ? '#4ADE80' : '#15803D', border: isDark ? '1px solid rgba(21,128,61,0.2)' : 'none' }}>
                                    <strong>Note:</strong> New accounts are created with the <strong>Customer</strong> role. Admin can update your role after registration.
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 14, fontSize: 15, ...(isDark ? { background: '#E8E8E8', color: '#0D0D0D' } : {}) }}>
                                    {loading ? 'Creating...' : 'Create Account'}
                                </button>
                            </form>

                            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
                                Already have an account? <Link to="/login" style={{ color: isDark ? '#E8E8E8' : 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`@media (max-width: 768px) { .register-globe-panel { display: none !important; } }`}</style>
        </div>
    )
}
