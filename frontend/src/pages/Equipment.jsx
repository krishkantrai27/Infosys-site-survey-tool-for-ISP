import { useState, useEffect } from 'react'
import api from '../api/axios'
import { Plus, Pencil, Trash2, X, Cpu, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const EQUIPMENT_TYPES = ['ACCESS_POINT', 'SWITCH', 'ROUTER', 'ONT', 'ANTENNA', 'CABINET', 'UPS', 'OTHER']

export default function Equipment() {
    const [equipment, setEquipment] = useState([])
    const [properties, setProperties] = useState([])
    const [allSpaces, setAllSpaces] = useState([])
    const [modal, setModal] = useState(null)
    const [form, setForm] = useState({ 
        type: 'SWITCH', model: '', vendor: '', 
        powerWatts: '', heatLoadBtuh: '', mounting: '', 
        serialNumber: '', spaceId: '', propertyId: '', buildingId: '', floorId: ''
    })
    const [buildings, setBuildings] = useState([])
    const [floors, setFloors] = useState([])
    const [loading, setLoading] = useState(true)
    const { isAdmin, user } = useAuth()
    
    const canEdit = isAdmin() || user?.roles?.includes('ROLE_ENGINEER') || user?.role === 'engineer' || user?.role === 'admin'

    const fetchData = async () => {
        setLoading(true)
        try {
            const [eqRes, propRes, spaceRes] = await Promise.all([
                api.get('/equipment'),
                api.get('/properties'),
                api.get('/spaces')
            ])
            setEquipment(eqRes.data || [])
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

    useEffect(() => {
        if (form.propertyId) {
            api.get(`/buildings/property/${form.propertyId}`).then(res => setBuildings(res.data.data)).catch(err => console.error(err))
        } else {
            setBuildings([])
            setFloors([])
        }
    }, [form.propertyId])

    useEffect(() => {
        if (form.buildingId) {
            api.get(`/floors/building/${form.buildingId}`).then(res => setFloors(res.data.data)).catch(err => console.error(err))
        } else {
            setFloors([])
        }
    }, [form.buildingId])

    const availableSpaces = form.floorId ? allSpaces.filter(s => s.floorId === Number(form.floorId)) : []

    const openCreate = () => {
        setForm({ type: 'SWITCH', model: '', vendor: '', powerWatts: '', heatLoadBtuh: '', mounting: '', serialNumber: '', spaceId: '', propertyId: '', buildingId: '', floorId: '' })
        setModal('create')
    }

    const openEdit = (e) => {
        const space = allSpaces.find(s => s.id === e.spaceId)
        setForm({ 
            ...e, 
            spaceId: e.spaceId || '', 
            propertyId: space?.propertyId || '',
            buildingId: space?.buildingId || '',
            floorId: space?.floorId || ''
        })
        setModal(e)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const payload = { 
            ...form, 
            powerWatts: form.powerWatts ? Number(form.powerWatts) : null,
            heatLoadBtuh: form.heatLoadBtuh ? Number(form.heatLoadBtuh) : null,
            spaceId: Number(form.spaceId)
        }
        
        try {
            if (modal === 'create') {
                await api.post(`/spaces/${payload.spaceId}/equipment`, payload)
                toast.success('Equipment added successfully')
            } else {
                await api.put(`/equipment/${modal.id}`, payload)
                toast.success('Equipment updated successfully')
            }
            setModal(null)
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this equipment?')) return
        try {
            await api.delete(`/equipment/${id}`)
            toast.success('Equipment deleted')
            fetchData()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete')
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>Network Equipment</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Inventory of installed hardware across all spaces</p>
                </div>
                {canEdit && (
                    <button className="btn btn-primary" onClick={openCreate}>
                        <Plus size={16} /> Add Equipment
                    </button>
                )}
            </div>

            {loading ? <p>Loading inventory...</p> : equipment.length === 0 ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                    <Cpu size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 16, fontWeight: 600 }}>No equipment found</p>
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Vendor / Model</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>Space</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map(e => {
                                const spaceName = allSpaces.find(s => s.id === e.spaceId)?.name || `ID ${e.spaceId}`;
                                return (
                                    <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '12px 16px' }}><span className="badge badge-primary">{e.type}</span></td>
                                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{e.vendor} {e.model}</td>
                                        <td style={{ padding: '12px 16px' }}>{spaceName}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                {canEdit && <button className="btn btn-secondary" style={{ padding: '6px 8px' }} onClick={() => openEdit(e)}><Pencil size={14} /></button>}
                                                {isAdmin() && <button className="btn btn-danger" style={{ padding: '6px 8px' }} onClick={() => handleDelete(e.id)}><Trash2 size={14} /></button>}
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
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{modal === 'create' ? 'Add Equipment' : 'Edit Equipment'}</h2>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Property Hierarchy *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <select className="input-field" value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value, buildingId: '', floorId: '', spaceId: '' })}>
                                        <option value="">Select Property...</option>
                                        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <select className="input-field" value={form.buildingId} onChange={e => setForm({ ...form, buildingId: e.target.value, floorId: '', spaceId: '' })} disabled={!form.propertyId}>
                                        <option value="">Select Building...</option>
                                        {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <select className="input-field" value={form.floorId} onChange={e => setForm({ ...form, floorId: e.target.value, spaceId: '' })} disabled={!form.buildingId}>
                                        <option value="">Select Floor...</option>
                                        {floors.map(f => <option key={f.id} value={f.id}>{f.levelLabel || `Floor ${f.id}`}</option>)}
                                    </select>
                                    <select className="input-field" value={form.spaceId} onChange={e => setForm({ ...form, spaceId: e.target.value })} disabled={!form.floorId} required>
                                        <option value="">Select Space...</option>
                                        {availableSpaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '20px 0' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Type *</label>
                                    <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                                        {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Vendor *</label>
                                    <input className="input-field" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} required />
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Model *</label>
                                    <input className="input-field" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Serial Number</label>
                                    <input className="input-field" value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{modal === 'create' ? 'Add' : 'Save'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
