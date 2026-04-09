import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Network, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await login(username, password)
            toast.success('Welcome back!')
            navigate('/dashboard')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex' }}>
            {/* Left side - branding */}
            <div className="gradient-primary" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Network size={28} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>Site Survey Tool</h1>
                            <p style={{ opacity: 0.8, fontSize: 14 }}>ISP Network Planning</p>
                        </div>
                    </div>
                    <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em' }}>Plan. Survey.<br />Deploy.</h2>
                    <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.85, maxWidth: 420 }}>
                        Streamline your network infrastructure planning with intelligent site surveys for MDUs, commercial buildings, and campuses.
                    </p>
                </div>
            </div>

            {/* Right side - login form */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
                <div style={{ width: '100%', maxWidth: 400 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome back</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>Sign in to your account to continue</p>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>Username</label>
                            <input className="input-field" type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-muted)' }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--color-text-muted)' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
                    </p>

                    <div style={{ marginTop: 32, padding: 16, background: '#F8FAFC', borderRadius: 12, fontSize: 13 }}>
                        <p style={{ fontWeight: 600, marginBottom: 4 }}>Demo Credentials</p>
                        <p style={{ color: 'var(--color-text-muted)' }}>Username: <code>admin</code> &nbsp;|&nbsp; Password: <code>admin123</code></p>
                    </div>
                </div>
            </div>

            <style>{`@media (max-width: 768px) { div:first-child > div:first-child { display: none !important; } }`}</style>
        </div>
    )
}
