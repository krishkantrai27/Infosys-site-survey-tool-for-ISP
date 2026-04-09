import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Network } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '', organizationId: '' })
    const [orgs, setOrgs] = useState([])
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        api.get('/organizations').then(res => setOrgs(res.data.data || [])).catch(() => { })
    }, [])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const payload = {
                ...form,
                organizationId: form.organizationId ? Number(form.organizationId) : null,
                roles: ['CUSTOMER']
            }
            await register(payload)
            toast.success('Account created! Awaiting admin approval.')
            navigate('/login')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed')
        } finally { setLoading(false) }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EEF2FF, #F8FAFC)', padding: 24 }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: 480, padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div className="gradient-primary" style={{ width: 48, height: 48, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Network size={24} color="white" />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Create Account</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Join the Site Survey platform</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>First Name</label>
                            <input className="input-field" name="firstName" value={form.firstName} onChange={handleChange} placeholder="John" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Last Name</label>
                            <input className="input-field" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe" />
                        </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Username *</label>
                        <input className="input-field" name="username" value={form.username} onChange={handleChange} placeholder="johndoe" required />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email *</label>
                        <input className="input-field" name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Password *</label>
                        <input className="input-field" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Organization</label>
                        <select className="input-field" name="organizationId" value={form.organizationId} onChange={handleChange}>
                            <option value="">Select...</option>
                            {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Phone</label>
                        <input className="input-field" name="phone" value={form.phone} onChange={handleChange} placeholder="+1-555-0100" />
                    </div>

                    <div style={{ marginBottom: 16, padding: 12, background: '#F0FDF4', borderRadius: 8, fontSize: 13, color: '#15803D' }}>
                        <strong>Note:</strong> New accounts are created with the <strong>Customer</strong> role. The System Administrator can update your role after registration.
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: 14, fontSize: 15, marginTop: 8 }}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--color-text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>
        </div>
    )
}
