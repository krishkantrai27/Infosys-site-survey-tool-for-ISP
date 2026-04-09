import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { Plus, Pencil, Trash2, X, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Organizations() {
    const [orgs, setOrgs] = useState([])
    const [modal, setModal] = useState(null) // null | 'create' | org object (edit)
    const [form, setForm] = useState({ name: '', address: '', contactEmail: '', contactPhone: '' })
    const [loading, setLoading] = useState(true)
    const { isAdmin } = useAuth()

    const fetchOrgs = () => {
        api.get('/organizations').then(res => { setOrgs(res.data.data || []); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(fetchOrgs, [])

    const openCreate = () => { setForm({ name: '', address: '', contactEmail: '', contactPhone: '' }); setModal('create') }
    const openEdit = (org) => { setForm({ name: org.name, address: org.address || '', contactEmail: org.contactEmail || '', contactPhone: org.contactPhone || '' }); setModal(org) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (modal === 'create') {
                await api.post('/organizations', form)
                toast.success('Organization created')
            } else {
                await api.put(`/organizations/${modal.id}`, form)
                toast.success('Organization updated')
            }
            setModal(null); fetchOrgs()
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this organization?')) return
        try { await api.delete(`/organizations/${id}`); toast.success('Deleted'); fetchOrgs() }
        catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>Organizations</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Manage ISP organizations</p>
                </div>
                {isAdmin() && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Organization</button>}
            </div>

            {loading ? <p>Loading...</p> : orgs.length === 0 ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                    <Building2 size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 16, fontWeight: 600 }}>No organizations yet</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>Create your first organization to get started</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th>{isAdmin() && <th>Actions</th>}</tr></thead>
                        <tbody>
                            {orgs.map(org => (
                                <tr key={org.id}>
                                    <td style={{ fontWeight: 600 }}>{org.name}</td>
                                    <td>{org.contactEmail || '—'}</td>
                                    <td>{org.contactPhone || '—'}</td>
                                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.address || '—'}</td>
                                    {isAdmin() && <td>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => openEdit(org)}><Pencil size={14} /></button>
                                            <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(org.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{modal === 'create' ? 'New Organization' : 'Edit Organization'}</h2>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Name *</label>
                                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email</label>
                                <input className="input-field" type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Phone</label>
                                <input className="input-field" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
                            </div>
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Address</label>
                                <textarea className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{modal === 'create' ? 'Create' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
