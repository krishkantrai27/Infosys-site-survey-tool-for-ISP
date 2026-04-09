import { useState, useEffect } from 'react'
import api from '../api/axios'
import { Plus, Pencil, Trash2, X, Cable } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CABLE_MEDIUMS = ['COPPER', 'FIBER', 'COAX', 'POWER']

export default function CablePaths() {
    const [cablePaths, setCablePaths] = useState([])
    const [properties, setProperties] = useState([])
    const [allSpaces, setAllSpaces] = useState([])
    const [modal, setModal] = useState(null)
    const [form, setForm] = useState({ 
        propertyId: '', fromSpaceId: '', toSpaceId: '', 
        medium: 'FIBER', lengthM: '', slackLoops: '0', notes: '' 
    })
    const [loading, setLoading] = useState(true)
    const { isAdmin, user } = useAuth()
    
    const canEdit = isAdmin() || user?.roles?.includes('ROLE_ENGINEER') || user?.role === 'engineer' || user?.role === 'admin'

    const fetchData = async () => {
        setLoading(true)
        try {
            const [cpRes, propRes, spaceRes] = await Promise.all([
                api.get('/cable-paths'),
                api.get('/properties'),
                api.get('/spaces')
            ])
            setCablePaths(cpRes.data || [])
            setProperties(propRes.data?.data || [])
            setAllSpaces(spaceRes.data?.data || [])
        } catch (err) {
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const openCreate = () => {
        const firstPropId = properties[0]?.id || ''
        setForm({ propertyId: firstPropId, fromSpaceId: '', toSpaceId: '', medium: 'FIBER', lengthM: '', slackLoops: '0', notes: '' })
        setModal('create')
    }

    const openEdit = (cp) => {
        setForm({ ...cp, propertyId: cp.propertyId || '', fromSpaceId: cp.fromSpaceId || '', toSpaceId: cp.toSpaceId || '' })
        setModal(cp)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const payload = { 
            ...form, 
            propertyId: Number(form.propertyId),
            fromSpaceId: Number(form.fromSpaceId),
            toSpaceId: Number(form.toSpaceId),
            lengthM: form.lengthM ? Number(form.lengthM) : null,
            slackLoops: form.slackLoops ? Number(form.slackLoops) : 0
        }
        
        try {
            if (modal === 'create') {
                await api.post(`/cable-paths`, payload)
                toast.success('Cable Path created')
            } else {
                await api.put(`/cable-paths/${modal.id}`, payload)
                toast.success('Cable Path updated')
            }
            setModal(null)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this cable path?')) return
        try {
            await api.delete(`/cable-paths/${id}`)
            toast.success('Deleted')
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete')
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>Cable Paths</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Physical cable routing between spaces</p>
                </div>
                {canEdit && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Route Cable</button>}
            </div>

            {loading ? <p>Loading routes...</p> : cablePaths.length === 0 ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                    <Cable size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 16, fontWeight: 600 }}>No cable paths mapped</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Medium</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Property</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Route (Spaces)</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cablePaths.map(cp => {
                                const propName = properties.find(p => p.id === cp.propertyId)?.name || `ID ${cp.propertyId}`;
                                const fromName = allSpaces.find(s => s.id === cp.fromSpaceId)?.name || `ID ${cp.fromSpaceId}`;
                                const toName = allSpaces.find(s => s.id === cp.toSpaceId)?.name || `ID ${cp.toSpaceId}`;
                                return (
                                    <tr key={cp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '12px 16px' }}><span className="badge badge-success">{cp.medium}</span></td>
                                        <td style={{ padding: '12px 16px' }}>{propName}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{fromName} → {toName}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                {canEdit && <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={() => openEdit(cp)}><Pencil size={14} /></button>}
                                                {isAdmin() && <button className="btn btn-danger" style={{ padding: '6px 8px' }} onClick={() => handleDelete(cp.id)}><Trash2 size={14} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{modal === 'create' ? 'Route Cable Path' : 'Edit Cable Path'}</h2>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Select Property *</label>
                                <select className="input-field" value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })} required>
                                    <option value="">Choose Property...</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>From Space *</label>
                                    <select className="input-field" value={form.fromSpaceId} onChange={e => setForm({ ...form, fromSpaceId: e.target.value })} required>
                                        <option value="">Starting Space...</option>
                                        {allSpaces.map(s => <option key={s.id} value={s.id}>{s.name} (Floor: {s.floorName})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>To Space *</label>
                                    <select className="input-field" value={form.toSpaceId} onChange={e => setForm({ ...form, toSpaceId: e.target.value })} required>
                                        <option value="">Destination Space...</option>
                                        {allSpaces.map(s => <option key={s.id} value={s.id}>{s.name} (Floor: {s.floorName})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Medium *</label>
                                    <select className="input-field" value={form.medium} onChange={e => setForm({ ...form, medium: e.target.value })} required>
                                        {CABLE_MEDIUMS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Length (m)</label>
                                    <input type="number" step="any" className="input-field" value={form.lengthM} onChange={e => setForm({ ...form, lengthM: e.target.value })} />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{modal === 'create' ? 'Route' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
