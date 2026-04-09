import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { Plus, Pencil, Trash2, X, MapPin, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const PROPERTY_TYPES = ['RESIDENTIAL_MDU', 'COMMERCIAL_MTU', 'CAMPUS', 'PUBLIC_AREA']
const TYPE_LABELS = { RESIDENTIAL_MDU: 'Residential MDU', COMMERCIAL_MTU: 'Commercial MTU', CAMPUS: 'Campus', PUBLIC_AREA: 'Public Area' }
const TYPE_COLORS = { RESIDENTIAL_MDU: 'badge-primary', COMMERCIAL_MTU: 'badge-success', CAMPUS: 'badge-warning', PUBLIC_AREA: 'badge-danger' }

export default function Properties() {
    const [properties, setProperties] = useState([])
    const [orgs, setOrgs] = useState([])
    const [engineers, setEngineers] = useState([])
    const [modal, setModal] = useState(null)
    const [form, setForm] = useState({ name: '', type: 'RESIDENTIAL_MDU', address: '', latitude: '', longitude: '', organizationId: '', assignedEngineerId: '' })
    const [loading, setLoading] = useState(true)
    const { isAdmin } = useAuth()
    const navigate = useNavigate()

    const fetchData = () => {
        const promises = [api.get('/properties'), api.get('/organizations')];
        
        // This fails if the backend isn't started or we aren't admin, so we catch it
        if (isAdmin()) {
            promises.push(api.get('/admin/users?size=100').catch(() => ({ data: { data: { content: [] } } })));
        }
        
        Promise.all(promises).then(([p, o, u]) => {
            setProperties(p.data.data || []); 
            setOrgs(o.data.data || []); 
            if (isAdmin() && u) {
                const allUsers = u.data?.data?.content || [];
                setEngineers(allUsers.filter(user => user.roles?.includes('ROLE_ENGINEER')));
            }
            setLoading(false)
        }).catch(() => setLoading(false))
    }
    useEffect(fetchData, [])

    const openCreate = () => {
        setForm({ name: '', type: 'RESIDENTIAL_MDU', address: '', latitude: '', longitude: '', organizationId: orgs[0]?.id || '', assignedEngineerId: '' })
        setModal('create')
    }
    const openEdit = (p) => {
        setForm({ name: p.name, type: p.type, address: p.address || '', latitude: p.latitude || '', longitude: p.longitude || '', organizationId: p.organizationId, assignedEngineerId: p.assignedEngineerId || '' })
        setModal(p)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const payload = { 
            ...form, 
            organizationId: Number(form.organizationId), 
            assignedEngineerId: form.assignedEngineerId ? Number(form.assignedEngineerId) : null,
            latitude: form.latitude ? Number(form.latitude) : null, 
            longitude: form.longitude ? Number(form.longitude) : null 
        }
        try {
            if (modal === 'create') { await api.post('/properties', payload); toast.success('Property created') }
            else { await api.put(`/properties/${modal.id}`, payload); toast.success('Property updated') }
            setModal(null); fetchData()
        } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this property and all its buildings/floors?')) return
        try { await api.delete(`/properties/${id}`); toast.success('Deleted'); fetchData() }
        catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>Properties</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Manage survey sites and campuses</p>
                </div>
                {isAdmin() && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Property</button>}
            </div>

            {loading ? <p>Loading...</p> : properties.length === 0 ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                    <MapPin size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 16, fontWeight: 600 }}>No properties yet</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>Create your first property to start surveying</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                    {properties.map(p => (
                        <div key={p.id} className="glass-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                <div>
                                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
                                    <span className={`badge ${TYPE_COLORS[p.type]}`} style={{ marginTop: 6, display: 'inline-block' }}>{TYPE_LABELS[p.type]}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={() => navigate(`/properties/${p.id}`)}><Eye size={14} /></button>
                                    {isAdmin() && (
                                        <>
                                            <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={() => openEdit(p)}><Pencil size={14} /></button>
                                            <button className="btn btn-danger" style={{ padding: '6px 8px' }} onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                            {p.address && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>{p.address}</p>}
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                <span>Org: {p.organizationName}</span>
                                {p.assignedEngineerName && <span> • Assigned: {p.assignedEngineerName}</span>}
                                {p.createdByUsername && !p.assignedEngineerName && <span> • By: {p.createdByUsername}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{modal === 'create' ? 'New Property' : 'Edit Property'}</h2>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Name *</label>
                                <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Type *</label>
                                    <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Organization *</label>
                                    <select className="input-field" value={form.organizationId} onChange={e => setForm({ ...form, organizationId: e.target.value })} required>
                                        <option value="">Select...</option>
                                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Address</label>
                                <input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                            </div>
                            {isAdmin() && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Assigned Engineer (Optional)</label>
                                    <select className="input-field" value={form.assignedEngineerId} onChange={e => setForm({ ...form, assignedEngineerId: e.target.value })}>
                                        <option value="">-- Unassigned --</option>
                                        {engineers.map(e => <option key={e.id} value={e.id}>{e.username} ({e.email})</option>)}
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Latitude</label>
                                    <input className="input-field" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Longitude</label>
                                    <input className="input-field" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
                                </div>
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
