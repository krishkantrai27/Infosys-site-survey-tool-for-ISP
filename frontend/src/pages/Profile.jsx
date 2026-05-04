import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Save, User } from 'lucide-react'
import toast from 'react-hot-toast'
import AvatarUploadModal from '../components/AvatarUploadModal'
import AvatarActionMenu from '../components/AvatarActionMenu'

export default function Profile() {
    const { user, updateUser } = useAuth()
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
    const [loading, setLoading] = useState(true)

    // Avatar state
    const [showActionMenu, setShowActionMenu] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [imageSrc, setImageSrc] = useState(null)

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

    const onFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.addEventListener('load', () => {
            setImageSrc(reader.result)
            setShowUploadModal(true)
            setShowActionMenu(false)
        })
        reader.readAsDataURL(file)
        e.target.value = '' // Reset input
    }

    const handleSaveAvatar = async (croppedFile) => {
        const formData = new FormData()
        formData.append('file', croppedFile)

        const loadingId = toast.loading('Uploading avatar...')
        try {
            const res = await api.post('/users/me/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success('Avatar updated successfully', { id: loadingId })
            
            const updatedProfilePicture = res.data.data.profilePicture
            setForm(prev => ({ ...prev, profilePicture: updatedProfilePicture }))
            updateUser({ profilePicture: updatedProfilePicture })
            setShowUploadModal(false)
            setImageSrc(null)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to upload avatar', { id: loadingId })
        }
    }

    const handleRemoveAvatar = async () => {
        const loadingId = toast.loading('Removing avatar...')
        try {
            await api.delete('/users/me/avatar')
            toast.success('Avatar removed', { id: loadingId })
            setForm(prev => ({ ...prev, profilePicture: null }))
            updateUser({ profilePicture: null })
            setShowActionMenu(false)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove avatar', { id: loadingId })
        }
    }

    if (loading) return <p>Loading...</p>

    const avatarUrl = user?.profilePicture ? `http://localhost:8080${user.profilePicture}` : null;

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Profile</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Manage your account settings</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
                {/* Profile card */}
                <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 16px' }}>
                        <div style={{ 
                            width: 80, height: 80, borderRadius: 20, display: 'inline-flex', 
                            alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)', 
                            color: 'var(--color-bg)', fontSize: 32, fontWeight: 700, overflow: 'hidden'
                        }}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                user?.username?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <button 
                            onClick={() => setShowActionMenu(true)}
                            style={{
                                position: 'absolute', bottom: -8, right: -8, background: 'var(--color-bg)', 
                                border: '1px solid var(--color-border)', borderRadius: '50%', padding: 6,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} 
                            title="Change profile photo"
                        >
                            <User size={14} style={{ color: 'var(--color-primary)' }} />
                        </button>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>@{user?.username}</h3>
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {user?.roles?.map(r => <span key={r} className="badge badge-primary">{r.replace('ROLE_', '')}</span>)}
                    </div>
                </div>

                {/* Modals and File Input */}
                <input 
                    id="avatar-upload-input"
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    style={{ display: 'none' }} 
                    onChange={onFileChange} 
                />

                {showActionMenu && (
                    <AvatarActionMenu 
                        hasExistingPhoto={!!user?.profilePicture}
                        onClose={() => setShowActionMenu(false)}
                        onRemoveClick={handleRemoveAvatar}
                        onUploadClick={() => document.getElementById('avatar-upload-input').click()}
                    />
                )}

                {showUploadModal && imageSrc && (
                    <AvatarUploadModal 
                        imageSrc={imageSrc}
                        onClose={() => {
                            setShowUploadModal(false)
                            setImageSrc(null)
                        }}
                        onSave={handleSaveAvatar}
                    />
                )}

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
