import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Save, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Profile() {
    const { user } = useAuth()
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/users/me').then(res => {
            const d = res.data.data
            setForm({ firstName: d.firstName || '', lastName: d.lastName || '', email: d.email || '', phone: d.phone || '' })
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.put('/users/me', form)
            toast.success('Profile updated')
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    }

    if (loading) return <p>Loading...</p>

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Profile</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Manage your account settings</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
                {/* Profile card */}
                <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', color: 'var(--color-bg)', fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>@{user?.username}</h3>
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {user?.roles?.map(r => <span key={r} className="badge badge-primary">{r.replace('ROLE_', '')}</span>)}
                    </div>
                </div>

                {/* Edit form */}
                <div className="glass-card" style={{ padding: 32 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Edit Profile</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>First Name</label>
                                <input className="input-field" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Last Name</label>
                                <input className="input-field" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email</label>
                            <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Phone</label>
                            <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary"><Save size={16} /> Save Changes</button>
                    </form>
                </div>
            </div>
        </div>
    )
}
