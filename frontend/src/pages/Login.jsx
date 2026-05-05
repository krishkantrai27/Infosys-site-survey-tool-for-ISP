import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Eye, EyeOff, Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'
import AnimatedGlobe from '../components/AnimatedGlobe'
import CircuitBorder from '../components/CircuitBorder'

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const isDark = theme === 'dark'

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
        <div style={{ minHeight: '100vh', display: 'flex', background: isDark ? '#0D0D0D' : undefined }}>
            {/* Left side - Globe + branding */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 64px',
                color: 'white', position: 'relative', overflow: 'hidden',
                background: isDark ? '#0A0A0A' : 'var(--color-bg)'
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
                    <h2 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.02em', color: isDark ? '#E8E8E8' : 'var(--color-text)' }}>Plan. Survey.<br />Deploy.</h2>
                    <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.85, maxWidth: 420, color: isDark ? '#888' : 'var(--color-text-muted)' }}>
                        Streamline your network infrastructure planning with intelligent site surveys for MDUs, commercial buildings, and campuses — powered by ProbeLink.
                    </p>
                </div>
            </div>

            {/* Right side - login form with circuit border */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: isDark ? '#0D0D0D' : 'var(--color-surface)', overflow: 'visible' }}>
                <div style={{ width: '100%', maxWidth: 420, position: 'relative', overflow: 'visible' }}>
                    {/* Circuit border wrapper */}
                    <div style={{ position: 'relative', overflow: 'visible' }}>
                        <CircuitBorder borderRadius={20} />
                        <div style={{
                            position: 'relative', zIndex: 1, padding: '36px 32px',
                            borderRadius: 20,
                            background: isDark ? '#141414' : 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(12px)',
                        }}>
                            <button 
                                type="button" 
                                onClick={toggleTheme}
                                style={{
                                    position: 'absolute',
                                    top: 24,
                                    right: 24,
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: isDark ? '#E8E8E8' : '#1E293B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 8,
                                    borderRadius: '50%',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                                }}
                                aria-label="Toggle theme"
                            >
                                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em', color: isDark ? '#E8E8E8' : '#1E293B' }}>Welcome back</h2>
                            <p style={{ color: isDark ? '#888' : 'var(--color-text-muted)', marginBottom: 32 }}>Sign in to your account to continue</p>

                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: isDark ? '#888' : 'var(--color-text-muted)' }}>Username</label>
                                    <input className="input-field" type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required
                                        style={isDark ? { background: '#1A1A1A', borderColor: '#2A2A2A', color: '#E8E8E8' } : {}} />
                                </div>

                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: isDark ? '#888' : 'var(--color-text-muted)' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="input-field" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required
                                            style={isDark ? { paddingRight: 44, background: '#1A1A1A', borderColor: '#2A2A2A', color: '#E8E8E8' } : { paddingRight: 44 }} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#666' : 'var(--color-text-muted)' }}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={loading}
                                    style={isDark
                                        ? { width: '100%', padding: '14px', fontSize: 15, background: '#E8E8E8', color: '#0D0D0D' }
                                        : { width: '100%', padding: '14px', fontSize: 15 }
                                    }>
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </form>

                            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: isDark ? '#888' : 'var(--color-text-muted)' }}>
                                Don't have an account? <Link to="/register" style={{ color: isDark ? '#E8E8E8' : 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`@media (max-width: 768px) { div:first-child > div:first-child { display: none !important; } }`}</style>
        </div>
    )
}
