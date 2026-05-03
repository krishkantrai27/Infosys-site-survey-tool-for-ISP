import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Plus, Pencil, Trash2, X, ArrowLeft, Building, Layers, Box, Upload, FileSpreadsheet, LayoutGrid, Download, Image, FileText, Eye, MapPinned } from 'lucide-react'
import toast from 'react-hot-toast'
import ImportModal from '../components/ImportModal'

export default function PropertyDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isAdmin, isEngineer } = useAuth()
    const [property, setProperty] = useState(null)
    const [buildings, setBuildings] = useState([])
    const [floors, setFloors] = useState({})      // { buildingId: [floors] }
    const [spaces, setSpaces] = useState({})       // { floorId: [spaces] }
    const [expanded, setExpanded] = useState({})    // { buildingId: true }
    const [expandedFloor, setExpandedFloor] = useState({})
    const [modal, setModal] = useState(null)        // { type, context, data }
    const [importModal, setImportModal] = useState(null) // { type, parentId }
    const [form, setForm] = useState({})
    const [error, setError] = useState(null)

    useEffect(() => {
        api.get(`/properties/${id}`).then(r => setProperty(r.data.data))
            .catch(err => {
                const status = err.response?.status
                if (status === 403 || status === 404) {
                    setError('You do not have access to this property or it does not exist.')
                } else {
                    setError('Failed to load property details.')
                }
            })
        api.get(`/buildings/property/${id}`).then(r => {
            const blds = r.data.data || []
            setBuildings(blds)
            // Auto-expand all buildings and load their floors
            const expandMap = {}
            blds.forEach(b => {
                expandMap[b.id] = true
                api.get(`/floors/building/${b.id}`).then(floorRes => {
                    setFloors(prev => ({ ...prev, [b.id]: floorRes.data.data || [] }))
                }).catch(() => { })
            })
            setExpanded(expandMap)
        }).catch(() => { })
    }, [id])

    const loadFloors = async (buildingId) => {
        if (floors[buildingId]) return
        const res = await api.get(`/floors/building/${buildingId}`)
        setFloors(prev => ({ ...prev, [buildingId]: res.data.data || [] }))
    }

    const loadSpaces = async (floorId) => {
        if (spaces[floorId]) return
        const res = await api.get(`/spaces/floor/${floorId}`)
        setSpaces(prev => ({ ...prev, [floorId]: res.data.data || [] }))
    }

    const toggleBuilding = (bid) => {
        setExpanded(p => ({ ...p, [bid]: !p[bid] }))
        loadFloors(bid)
    }

    const toggleFloor = (fid) => {
        setExpandedFloor(p => ({ ...p, [fid]: !p[fid] }))
        loadSpaces(fid)
    }

    // CRUD Handlers
    const openModal = (type, context = {}, data = null) => {
        if (type === 'building') setForm({ name: data?.name || '', totalFloors: data?.totalFloors || '', propertyId: id })
        else if (type === 'floor') setForm({ levelLabel: data?.levelLabel || '', elevationM: data?.elevationM || '', buildingId: context.buildingId })
        else if (type === 'space') setForm({ name: data?.name || '', type: data?.type || '', area: data?.area || '', description: data?.description || '', floorId: context.floorId })
        setModal({ type, context, data })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const { type, data } = modal
        const isEdit = !!data

        try {
            let payload = {}
            if (type === 'building') {
                payload = {
                    name: form.name,
                    totalFloors: form.totalFloors ? Number(form.totalFloors) : null,
                    propertyId: Number(id)
                }
                if (isEdit) await api.put(`/buildings/${data.id}`, payload)
                else await api.post('/buildings', payload)
                const res = await api.get(`/buildings/property/${id}`)
                setBuildings(res.data.data || [])
            } else if (type === 'floor') {
                payload = {
                    levelLabel: form.levelLabel,
                    elevationM: form.elevationM ? Number(form.elevationM) : null,
                    buildingId: Number(form.buildingId)
                }
                if (isEdit) await api.put(`/floors/${data.id}`, payload)
                else await api.post('/floors', payload)
                const res = await api.get(`/floors/building/${form.buildingId}`)
                setFloors(prev => ({ ...prev, [form.buildingId]: res.data.data || [] }))
                // Also refresh buildings to update floor count badge
                const bRes = await api.get(`/buildings/property/${id}`); setBuildings(bRes.data.data || [])
            } else if (type === 'space') {
                payload = {
                    name: form.name,
                    type: form.type,
                    area: form.area ? Number(form.area) : null,
                    description: form.description,
                    floorId: Number(form.floorId)
                }
                if (isEdit) await api.put(`/spaces/${data.id}`, payload)
                else await api.post('/spaces', payload)
                const res = await api.get(`/spaces/floor/${form.floorId}`)
                setSpaces(prev => ({ ...prev, [form.floorId]: res.data.data || [] }))
            }
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${isEdit ? 'updated' : 'created'}`)
            setModal(null)
        } catch (err) {
            const fieldErrors = err.response?.data?.data
            if (fieldErrors && typeof fieldErrors === 'object') {
                Object.entries(fieldErrors).forEach(([field, msg]) => toast.error(`${field}: ${msg}`))
            } else {
                toast.error(err.response?.data?.message || 'Operation failed')
            }
        }
    }

    const handleDelete = async (type, itemId, parentId) => {
        if (!confirm(`Delete this ${type}?`)) return
        try {
            await api.delete(`/${type}s/${itemId}`)
            toast.success('Deleted')
            if (type === 'building') {
                const res = await api.get(`/buildings/property/${id}`); setBuildings(res.data.data || [])
            } else if (type === 'floor') {
                const res = await api.get(`/floors/building/${parentId}`); setFloors(p => ({ ...p, [parentId]: res.data.data || [] }))
                // Also refresh buildings to update floor count badge
                const bRes = await api.get(`/buildings/property/${id}`); setBuildings(bRes.data.data || [])
            } else if (type === 'space') {
                const res = await api.get(`/spaces/floor/${parentId}`); setSpaces(p => ({ ...p, [parentId]: res.data.data || [] }))
            }
        } catch (err) { toast.error('Failed') }
    }

    const handleFileUpload = async (floorId, type, buildingId) => {
        if (type === 'import') {
            setImportModal({ type: 'spaces', parentId: floorId })
            return
        }

        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.jpg,.jpeg,.png,.webp,.bmp,.pdf'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            const fd = new FormData()
            fd.append('file', file)
            try {
                await api.post(`/files/upload-floorplan/${floorId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                toast.success('Floor plan uploaded!')
                // Refresh floor data to show the uploaded plan
                if (buildingId) {
                    const res = await api.get(`/floors/building/${buildingId}`)
                    setFloors(prev => ({ ...prev, [buildingId]: res.data.data || [] }))
                }
            } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
        }
        input.click()
    }

    const handleDownloadPlan = async (planFileId, fileName) => {
        try {
            const res = await api.get(`/files/floor-plan/${planFileId}/download`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.download = fileName || 'floor-plan'
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) { toast.error('Download failed') }
    }

    const handleViewPlan = async (planFileId) => {
        try {
            const res = await api.get(`/files/floor-plan/${planFileId}/download`, { responseType: 'blob' })
            const contentType = res.headers['content-type'] || 'image/jpeg'
            const url = window.URL.createObjectURL(new Blob([res.data], { type: contentType }))
            window.open(url, '_blank')
        } catch (err) { toast.error('Could not open file') }
    }

    const handleDeletePlan = async (planFileId, buildingId) => {
        if (!confirm('Delete this floor plan?')) return
        try {
            await api.delete(`/files/floor-plan/${planFileId}`)
            toast.success('Floor plan deleted')
            const res = await api.get(`/floors/building/${buildingId}`)
            setFloors(prev => ({ ...prev, [buildingId]: res.data.data || [] }))
        } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return ''
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / 1048576).toFixed(1) + ' MB'
    }

    const refreshData = () => {
        api.get(`/buildings/property/${id}`).then(r => {
            setBuildings(r.data.data || [])
            r.data.data?.forEach(b => {
                api.get(`/floors/building/${b.id}`).then(floorRes => {
                    setFloors(prev => ({ ...prev, [b.id]: floorRes.data.data || [] }))
                })
            })
        })
    }

    const refreshSpaces = (floorId) => {
        api.get(`/spaces/floor/${floorId}`).then(res => {
            setSpaces(prev => ({ ...prev, [floorId]: res.data.data || [] }))
        })
    }

    if (error) return (
        <div>
            <button className="btn btn-secondary" onClick={() => navigate('/properties')} style={{ marginBottom: 16 }}><ArrowLeft size={16} /> Back</button>
            <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                <Building size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                <p style={{ fontWeight: 600, fontSize: 16 }}>{error}</p>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 8 }}>Please go back and select a property you have access to.</p>
            </div>
        </div>
    )

    if (!property) return <p style={{ padding: 24, color: 'var(--color-text-muted)' }}>Loading property details...</p>

    return (
        <div>
            <button className="btn btn-secondary" onClick={() => navigate('/properties')} style={{ marginBottom: 16 }}><ArrowLeft size={16} /> Back</button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>{property.name}</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{property.type?.replace('_', ' ')} • {property.address || 'No address'}</p>
                </div>
                {isAdmin() && (
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary" onClick={() => setImportModal({ type: 'buildings', parentId: id })}><FileSpreadsheet size={16} /> Import Buildings</button>
                        <button className="btn btn-primary" onClick={() => openModal('building')}><Plus size={16} /> Add Building</button>
                    </div>
                )}
            </div>

            {/* Hierarchy tree */}
            {buildings.length === 0 ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
                    <Building size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
                    <p style={{ fontWeight: 600, fontSize: 16 }}>No buildings yet</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Add your first building</p>
                </div>
            ) : buildings.map(b => (
                <div key={b.id} className="glass-card" style={{ marginBottom: 12, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expanded[b.id] ? 'var(--color-bg)' : '' }} onClick={() => toggleBuilding(b.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Building size={18} color="var(--color-primary)" />
                            <span style={{ fontWeight: 600 }}>{b.name}</span>
                            {b.totalFloors && <span className="badge badge-primary">{b.totalFloors} floors</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                            {isAdmin() && (
                                <>
                                    <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => openModal('floor', { buildingId: b.id })}><Plus size={12} /> Floor</button>
                                    <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => openModal('building', {}, b)}><Pencil size={12} /></button>
                                    <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete('building', b.id)}><Trash2 size={12} /></button>
                                </>
                            )}
                        </div>
                    </div>

                    {expanded[b.id] && floors[b.id] && (
                        <div style={{ paddingLeft: 32 }}>
                            {floors[b.id].map(f => (
                                <div key={f.id}>
                                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleFloor(f.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <Layers size={16} color="#D97706" />
                                            <span style={{ fontWeight: 500, fontSize: 14 }}>{f.levelLabel}</span>
                                            {f.elevationM != null && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Meters: {f.elevationM}</span>}
                                            {f.planFileId ? (
                                                <span className="badge badge-success" style={{ fontSize: 10 }}>📎 Plan uploaded</span>
                                            ) : (
                                                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-bg)', padding: '2px 6px', borderRadius: 4 }}>No plan</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                                            {(isAdmin() || isEngineer()) && (
                                                <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => handleFileUpload(f.id, 'floorplan', b.id)} title="Upload floor plan"><Upload size={12} /></button>
                                            )}
                                            {isAdmin() && (
                                                <>
                                                    <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => handleFileUpload(f.id, 'import')} title="Import spaces"><FileSpreadsheet size={12} /></button>
                                                    <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => openModal('space', { floorId: f.id })}><Plus size={12} /></button>
                                                    <button className="btn btn-secondary" style={{ padding: '4px 6px' }} onClick={() => openModal('floor', { buildingId: b.id }, f)}><Pencil size={12} /></button>
                                                    <button className="btn btn-danger" style={{ padding: '4px 6px' }} onClick={() => handleDelete('floor', f.id, b.id)}><Trash2 size={12} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Floor Plan Display — visible to ALL roles */}
                                    {f.planFileId && (
                                        <div style={{ padding: '10px 16px 10px 42px', background: 'var(--color-surface)', borderTop: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                            {f.planFileType?.startsWith('image/') ? (
                                                <Image size={18} color="#059669" />
                                            ) : (
                                                <FileText size={18} color="#2563EB" />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.planFileName}</p>
                                                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                    {formatFileSize(f.planFileSize)}
                                                    {f.planUploadedBy && <> • Uploaded by <strong>{f.planUploadedBy}</strong></>}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => navigate(`/floors/${f.id}/canvas`)} title="Open Canvas"><MapPinned size={12} /> Open Canvas</button>
                                                <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => handleViewPlan(f.planFileId)} title="View"><Eye size={12} /></button>
                                                <button className="btn btn-secondary" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => handleDownloadPlan(f.planFileId, f.planFileName)} title="Download"><Download size={12} /></button>
                                                {isAdmin() && (
                                                    <button className="btn btn-danger" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => handleDeletePlan(f.planFileId, b.id)} title="Delete plan"><Trash2 size={12} /></button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {expandedFloor[f.id] && spaces[f.id] && (
                                        <div style={{ paddingLeft: 32, paddingBottom: 8 }}>
                                            {spaces[f.id].length === 0 ? <p style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '8px 0' }}>No spaces yet</p>
                                                : spaces[f.id].map(s => (
                                                    <div key={s.id} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Box size={14} color="#059669" />
                                                            <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                                                            {s.type && <span className="badge badge-success" style={{ fontSize: 11 }}>{s.type}</span>}
                                                            {s.area && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.area} sqft</span>}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            {isAdmin() && (
                                                                <>
                                                                    <button className="btn btn-secondary" style={{ padding: '3px 6px' }} onClick={() => openModal('space', { floorId: f.id }, s)}><Pencil size={11} /></button>
                                                                    <button className="btn btn-danger" style={{ padding: '3px 6px' }} onClick={() => handleDelete('space', s.id, f.id)}><Trash2 size={11} /></button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {floors[b.id].length === 0 && <p style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>No floors yet</p>}
                        </div>
                    )}
                </div>
            ))}

            {/* Unified modal */}
            {modal && (
                <div className="modal-overlay" onClick={() => setModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{modal.data ? 'Edit' : 'New'} {modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}</h2>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Name *</label>
                                <input className="input-field" value={modal.type === 'floor' ? form.levelLabel : form.name} onChange={e => setForm({ ...form, [modal.type === 'floor' ? 'levelLabel' : 'name']: e.target.value })} required />
                            </div>

                            {modal.type === 'building' && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total Floors</label>
                                    <input className="input-field" type="number" value={form.totalFloors} onChange={e => setForm({ ...form, totalFloors: e.target.value })} />
                                </div>
                            )}

                            {modal.type === 'floor' && (
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Elevation (Meters)</label>
                                    <input className="input-field" type="number" value={form.elevationM} onChange={e => setForm({ ...form, elevationM: e.target.value })} />
                                </div>
                            )}

                            {modal.type === 'space' && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Type</label>
                                            <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                                <option value="">Select type...</option>
                                                <option value="ROOM">Room</option>
                                                <option value="OFFICE">Office</option>
                                                <option value="CONFERENCE">Conference</option>
                                                <option value="LOBBY">Lobby</option>
                                                <option value="HALLWAY">Hallway</option>
                                                <option value="STAIRCASE">Staircase</option>
                                                <option value="ELEVATOR">Elevator</option>
                                                <option value="OPEN_AREA">Open Area</option>
                                                <option value="UTILITY">Utility</option>
                                                <option value="STORAGE">Storage</option>
                                                <option value="BATHROOM">Bathroom</option>
                                                <option value="KITCHEN">Kitchen</option>
                                                <option value="LAB">Lab</option>
                                                <option value="CAFETERIA">Cafeteria</option>
                                                <option value="PARKING">Parking</option>
                                                <option value="SERVER_ROOM">Server Room</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Area (sqft)</label>
                                            <input className="input-field" type="number" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description</label>
                                        <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{modal.data ? 'Save' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Bulk Import Modal */}
            {importModal && (
                <ImportModal
                    type={importModal.type}
                    parentId={importModal.parentId}
                    onClose={() => setImportModal(null)}
                    onSuccess={() => {
                        if (importModal.type === 'buildings') refreshData()
                        else refreshSpaces(importModal.parentId)
                    }}
                />
            )}
        </div>
    )
}
