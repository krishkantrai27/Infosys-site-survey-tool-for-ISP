import React, { useState, useEffect } from 'react'
import { X, ClipboardList, Server, Info, Plus, FileText, CheckCircle2, ChevronRight, PenTool } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import ResponseForm from './ResponseForm'

export default function SpaceDetailsPanel({ space, onClose, onSpaceUpdated }) {
    const { isAdmin, isEngineer } = useAuth()
    const [tab, setTab] = useState('info')
    
    // Data state
    const [equipment, setEquipment] = useState([])
    const [responses, setResponses] = useState([])
    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(false)

    // Form states
    const [showEquipForm, setShowEquipForm] = useState(false)
    const [equipForm, setEquipForm] = useState({ type: 'ACCESS_POINT', model: '', vendor: '', serialNumber: '' })
    
    // Checklist Form states
    const [showChecklistForm, setShowChecklistForm] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [responseAnswers, setResponseAnswers] = useState({})
    
    // Fetch data
    useEffect(() => {
        if (!space) return
        setLoading(true)
        
        const fetches = [
            api.get(`/spaces/${space.id}/equipment`).then(r => setEquipment(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => setEquipment([])),
            api.get(`/checklist-responses?targetType=SPACE&targetId=${space.id}`).then(r => setResponses(r.data?.data || [])).catch(() => setResponses([])),
            api.get('/checklist-templates').then(r => setTemplates(r.data?.data || [])).catch(() => setTemplates([]))
        ]
        
        Promise.all(fetches).finally(() => setLoading(false))
    }, [space])

    const handleSaveEquipment = async () => {
        try {
            await api.post(`/spaces/${space.id}/equipment`, equipForm)
            toast.success('Equipment added')
            setShowEquipForm(false)
            setEquipForm({ type: 'ACCESS_POINT', model: '', vendor: '', serialNumber: '' })
            // Refresh
            const res = await api.get(`/spaces/${space.id}/equipment`)
            setEquipment(Array.isArray(res.data) ? res.data : res.data?.data || [])
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add equipment')
        }
    }

    const handleStartChecklist = (tmpl) => {
        setSelectedTemplate(tmpl)
        setResponseAnswers({})
        setShowChecklistForm(true)
    }

    const handleSaveResponse = async (submit = false) => {
        try {
            const payload = {
                templateId: selectedTemplate.id,
                targetType: 'SPACE',
                targetId: space.id,
                answersJson: JSON.stringify(responseAnswers)
            }
            await api.post(`/checklist-responses?submit=${submit}`, payload)
            toast.success(submit ? 'Checklist submitted!' : 'Draft saved')
            setShowChecklistForm(false)
            setSelectedTemplate(null)
            
            // Refresh
            const res = await api.get(`/checklist-responses?targetType=SPACE&targetId=${space.id}`)
            setResponses(res.data?.data || [])
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save response')
        }
    }

    if (!space) return null

    return (
        <div style={{
            width: 400, background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column', height: '100%', zIndex: 20,
            animation: 'slideLeft 0.3s ease', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)'
        }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{space.name}</h3>
                    <span className="badge badge-primary" style={{ marginTop: 6, display: 'inline-block' }}>{space.type}</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: '#F8FAFC' }}>
                {[
                    { id: 'info', icon: Info, label: 'Info' },
                    { id: 'equipment', icon: Server, label: `Equipment (${equipment.length})` },
                    { id: 'checklists', icon: ClipboardList, label: `Checklists (${responses.length})` }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            flex: 1, padding: '12px 0', border: 'none', background: 'transparent',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                            transition: 'all 0.2s'
                        }}
                    >
                        <t.icon size={16} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Loading...</div>
                ) : (
                    <>
                        {/* INFO TAB */}
                        {tab === 'info' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="glass-card" style={{ padding: 16 }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-muted)' }}>Space Details</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                                        <div>
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: 12, display: 'block' }}>ID</span>
                                            <strong>#{space.id}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: 12, display: 'block' }}>Area</span>
                                            <strong>{space.areaSqM ? `${space.areaSqM} m²` : 'N/A'}</strong>
                                        </div>
                                        <div>
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: 12, display: 'block' }}>Type</span>
                                            <strong>{space.type}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EQUIPMENT TAB */}
                        {tab === 'equipment' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600 }}>Network Equipment</h4>
                                    {(isAdmin() || isEngineer()) && (
                                        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowEquipForm(!showEquipForm)}>
                                            <Plus size={14} /> Add
                                        </button>
                                    )}
                                </div>

                                {showEquipForm && (
                                    <div className="glass-card" style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 12, fontWeight: 600 }}>Type</label>
                                            <select className="input-field" value={equipForm.type} onChange={e => setEquipForm({...equipForm, type: e.target.value})} style={{ padding: '6px', fontSize: 13 }}>
                                                {['ACCESS_POINT', 'SWITCH', 'ROUTER', 'ONT', 'ANTENNA', 'CABINET', 'UPS', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 12, fontWeight: 600 }}>Model</label>
                                            <input className="input-field" value={equipForm.model} onChange={e => setEquipForm({...equipForm, model: e.target.value})} style={{ padding: '6px', fontSize: 13 }} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 12, fontWeight: 600 }}>Vendor</label>
                                            <input className="input-field" value={equipForm.vendor} onChange={e => setEquipForm({...equipForm, vendor: e.target.value})} style={{ padding: '6px', fontSize: 13 }} />
                                        </div>
                                        <button className="btn btn-primary" style={{ width: '100%', padding: '8px' }} onClick={handleSaveEquipment}>Save Equipment</button>
                                    </div>
                                )}

                                {equipment.length === 0 && !showEquipForm && (
                                    <div style={{ textAlign: 'center', padding: 32, border: '2px dashed var(--color-border)', borderRadius: 12, color: 'var(--color-text-muted)' }}>
                                        <Server size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                        <p style={{ fontSize: 13 }}>No equipment installed here yet.</p>
                                    </div>
                                )}

                                {equipment.map(eq => (
                                    <div key={eq.id} className="glass-card" style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <h5 style={{ fontSize: 14, fontWeight: 600 }}>{eq.model || 'Unknown Model'}</h5>
                                            <span className="badge badge-secondary" style={{ fontSize: 11 }}>{eq.type}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                            {eq.vendor && <span>Vendor: {eq.vendor}</span>}
                                            {eq.serialNumber && <span> • S/N: {eq.serialNumber}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CHECKLISTS TAB */}
                        {tab === 'checklists' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600 }}>Space Checklists</h4>
                                </div>

                                {showChecklistForm ? (
                                    <div className="glass-card" style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <div>
                                                <h5 style={{ fontSize: 15, fontWeight: 600 }}>{selectedTemplate?.name}</h5>
                                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Fill checklist for this space</span>
                                            </div>
                                            <button onClick={() => setShowChecklistForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={16}/></button>
                                        </div>
                                        
                                        <ResponseForm 
                                            schemaFields={(() => { try { return JSON.parse(selectedTemplate?.schemaJson || '[]') } catch { return [] } })()}
                                            answers={responseAnswers}
                                            onChange={setResponseAnswers}
                                        />

                                        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
                                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleSaveResponse(false)}>Save Draft</button>
                                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSaveResponse(true)}>Submit</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Available templates for SPACE */}
                                        {isEngineer() && templates.filter(t => t.scope === 'SPACE').length > 0 && (
                                            <div style={{ marginBottom: 16 }}>
                                                <h5 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>Available Checklists</h5>
                                                <div style={{ display: 'grid', gap: 8 }}>
                                                    {templates.filter(t => t.scope === 'SPACE').map(tmpl => (
                                                        <div key={tmpl.id} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleStartChecklist(tmpl)}>
                                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{tmpl.name}</span>
                                                            <Plus size={16} color="var(--color-primary)" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <h5 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>Filled Checklists</h5>

                                {responses.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 32, border: '2px dashed var(--color-border)', borderRadius: 12, color: 'var(--color-text-muted)' }}>
                                        <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                        <p style={{ fontSize: 13 }}>No checklists filled for this space.</p>
                                        <p style={{ fontSize: 12, marginTop: 4 }}>Go to the Checklists page to start one.</p>
                                    </div>
                                ) : (
                                    responses.map(resp => {
                                        const tmpl = templates.find(t => t.id === resp.templateId);
                                        return (
                                            <div key={resp.id} className="glass-card" style={{ padding: 16 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <span style={{ fontSize: 14, fontWeight: 600 }}>{tmpl ? tmpl.name : `Template #${resp.templateId}`}</span>
                                                    {resp.submittedAt || resp.status === 'SUBMITTED' ? (
                                                        <span className="badge badge-success" style={{ fontSize: 11 }}>Submitted</span>
                                                    ) : (
                                                        <span className="badge badge-warning" style={{ fontSize: 11 }}>Draft</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                                    Created: {new Date(resp.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
            
            <style>{`
                @keyframes slideLeft {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
