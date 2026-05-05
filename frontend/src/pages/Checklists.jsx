import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { ClipboardList, Plus, Trash2, Send, Save, ChevronDown, ChevronRight, Eye, FileText, CheckCircle2, AlertCircle, X, GripVertical, User } from 'lucide-react'

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes / No' },
    { value: 'select', label: 'Dropdown' },
]

const SCOPES = ['SPACE', 'FLOOR', 'BUILDING']

// ─── Cascading Entity Picker with "All" option ───
function EntityPicker({ scope, value, onChange }) {
    const [properties, setProperties] = useState([])
    const [buildings, setBuildings] = useState([])
    const [floors, setFloors] = useState([])
    const [spaces, setSpaces] = useState([])
    const [selectedProperty, setSelectedProperty] = useState('')
    const [selectedBuilding, setSelectedBuilding] = useState('')
    const [selectedFloor, setSelectedFloor] = useState('')
    const [loadingStep, setLoadingStep] = useState('')

    // Load properties on mount
    useEffect(() => {
        setLoadingStep('properties')
        api.get('/properties')
            .then(r => {
                const data = r.data?.data || r.data || []
                setProperties(Array.isArray(data) ? data : [])
            })
            .catch(() => setProperties([]))
            .finally(() => setLoadingStep(''))
    }, [])

    // Load buildings when property changes
    useEffect(() => {
        setBuildings([]); setSelectedBuilding(''); setFloors([]); setSelectedFloor(''); setSpaces([])
        onChange('')
        if (!selectedProperty) return
        setLoadingStep('buildings')
        api.get(`/properties/${selectedProperty}/buildings`)
            .then(r => {
                const data = r.data?.data || r.data || []
                setBuildings(Array.isArray(data) ? data : [])
            })
            .catch(() => setBuildings([]))
            .finally(() => setLoadingStep(''))
    }, [selectedProperty])

    // When building changes
    useEffect(() => {
        setFloors([]); setSelectedFloor(''); setSpaces([])
        if (!selectedBuilding) { onChange(''); return }
        // "All" selected at building level → use property ID, stop cascade
        if (selectedBuilding === 'all') { onChange(`all_property_${selectedProperty}`); return }
        // If template scope is BUILDING → use building ID directly
        if (scope === 'BUILDING') { onChange(selectedBuilding); return }
        // Otherwise load floors
        setLoadingStep('floors')
        api.get(`/buildings/${selectedBuilding}/floors`)
            .then(r => {
                const data = r.data?.data || r.data || []
                setFloors(Array.isArray(data) ? data : [])
            })
            .catch(() => setFloors([]))
            .finally(() => setLoadingStep(''))
    }, [selectedBuilding])

    // When floor changes
    useEffect(() => {
        setSpaces([])
        if (!selectedFloor) { if (scope !== 'BUILDING') onChange(''); return }
        // "All" selected at floor level → use building ID, stop cascade
        if (selectedFloor === 'all') { onChange(`all_building_${selectedBuilding}`); return }
        // If template scope is FLOOR → use floor ID directly
        if (scope === 'FLOOR') { onChange(selectedFloor); return }
        // Otherwise load spaces (try both endpoints for reliability)
        setLoadingStep('spaces')
        api.get(`/spaces/floor/${selectedFloor}`)
            .then(r => {
                const data = r.data?.data || r.data || []
                setSpaces(Array.isArray(data) ? data : [])
            })
            .catch(() => {
                // Fallback to nested endpoint
                api.get(`/floors/${selectedFloor}/spaces`)
                    .then(r => {
                        const data = r.data?.data || r.data || []
                        setSpaces(Array.isArray(data) ? data : [])
                    })
                    .catch(() => setSpaces([]))
            })
            .finally(() => setLoadingStep(''))
    }, [selectedFloor])

    const ss = { padding: '8px 12px', fontSize: 13, minWidth: 150 }
    const allStyle = { fontWeight: 'bold', color: '#7C3AED' }

    // Check if cascade should stop (user selected "All")
    const buildingIsAll = selectedBuilding === 'all'
    const floorIsAll = selectedFloor === 'all'

    return (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Property */}
            <div>
                <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--color-text-muted)' }}>Property</label>
                <select className="input-field" style={ss} value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}>
                    <option value="">{loadingStep === 'properties' ? 'Loading...' : 'Select property...'}</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            {/* Building */}
            {selectedProperty && (
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--color-text-muted)' }}>Building</label>
                    <select className="input-field" style={ss} value={selectedBuilding}
                        onChange={e => setSelectedBuilding(e.target.value)}>
                        <option value="">{loadingStep === 'buildings' ? 'Loading...' : `Select building (${buildings.length})...`}</option>
                        <option value="all" style={allStyle}>── All Buildings ──</option>
                        {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            )}

            {/* "All selected" badge */}
            {buildingIsAll && (
                <div style={{ padding: '8px 16px', background: 'var(--color-bg)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', alignSelf: 'flex-end', border: '1px solid var(--color-border)' }}>
                    ✓ Applies to all buildings in this property
                </div>
            )}

            {/* Floor (show when building is specific and scope is FLOOR or SPACE) */}
            {selectedBuilding && !buildingIsAll && scope !== 'BUILDING' && (
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--color-text-muted)' }}>Floor</label>
                    <select className="input-field" style={ss} value={selectedFloor}
                        onChange={e => setSelectedFloor(e.target.value)}>
                        <option value="">{loadingStep === 'floors' ? 'Loading...' : `Select floor (${floors.length})...`}</option>
                        <option value="all" style={allStyle}>── All Floors ──</option>
                        {floors.map(f => <option key={f.id} value={f.id}>{f.levelLabel || f.name || `Floor #${f.id}`}</option>)}
                    </select>
                </div>
            )}

            {/* "All floors" badge */}
            {floorIsAll && !buildingIsAll && (
                <div style={{ padding: '8px 16px', background: 'var(--color-bg)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', alignSelf: 'flex-end', border: '1px solid var(--color-border)' }}>
                    ✓ Applies to all floors in this building
                </div>
            )}

            {/* Space (show when floor is specific and scope is SPACE) */}
            {selectedFloor && !floorIsAll && !buildingIsAll && scope === 'SPACE' && (
                <div>
                    <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block', color: 'var(--color-text-muted)' }}>Space</label>
                    <select className="input-field" style={ss} value={value || ''}
                        onChange={e => onChange(e.target.value)}>
                        <option value="">{loadingStep === 'spaces' ? 'Loading...' : `Select space (${spaces.length})...`}</option>
                        <option value={`all_floor_${selectedFloor}`} style={allStyle}>── All Spaces ──</option>
                        {spaces.map(s => <option key={s.id} value={s.id}>{s.name || s.label || `Space #${s.id}`} ({s.type || 'N/A'})</option>)}
                    </select>
                </div>
            )}
        </div>
    )
}

// ─── Schema Builder ───
function SchemaBuilder({ schema, onChange }) {
    const addField = () => {
        onChange([...schema, { fieldId: `f_${Date.now()}`, label: '', type: 'text', required: false, options: [] }])
    }
    const updateField = (idx, key, val) => {
        const copy = schema.map((f, i) => i === idx ? { ...f, [key]: val } : f)
        onChange(copy)
    }
    const removeField = (idx) => onChange(schema.filter((_, i) => i !== idx))

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)' }}>Schema Fields</h4>
                <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={addField}>
                    <Plus size={14} /> Add Field
                </button>
            </div>
            {schema.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)', fontSize: 14, border: '2px dashed var(--color-border)', borderRadius: 12 }}>
                    No fields yet. Click "Add Field" to build your checklist.
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {schema.map((field, idx) => (
                    <div key={field.fieldId} className="glass-card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <GripVertical size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                            <input className="input-field" placeholder="Question label" value={field.label}
                                onChange={e => updateField(idx, 'label', e.target.value)} style={{ padding: '8px 12px', flex: 1, minWidth: 180 }} />
                            <select className="input-field" value={field.type} onChange={e => updateField(idx, 'type', e.target.value)} style={{ padding: '8px 12px', width: 130 }}>
                                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                <input type="checkbox" checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} /> Required
                            </label>
                            <button onClick={() => removeField(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                        {field.type === 'select' && (
                            <div style={{ marginTop: 10, paddingLeft: 26 }}>
                                <input className="input-field" placeholder="Options (comma-separated, e.g. Good, Fair, Poor)" style={{ padding: '8px 12px', fontSize: 13 }}
                                    value={(field.options || []).join(', ')}
                                    onChange={e => updateField(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Dynamic Response Form ───
function ResponseForm({ schemaFields, answers, onChange }) {
    const update = (fieldId, val) => onChange({ ...answers, [fieldId]: val })

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {schemaFields.map(field => (
                <div key={field.fieldId}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        {field.label} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                    </label>
                    {field.type === 'text' && (
                        <input className="input-field" value={answers[field.fieldId] || ''}
                            onChange={e => update(field.fieldId, e.target.value)} placeholder="Enter text..." />
                    )}
                    {field.type === 'number' && (
                        <input className="input-field" type="number" value={answers[field.fieldId] || ''}
                            onChange={e => update(field.fieldId, e.target.value)} placeholder="Enter number..." />
                    )}
                    {field.type === 'boolean' && (
                        <div style={{ display: 'flex', gap: 12 }}>
                            {['Yes', 'No'].map(opt => (
                                <button key={opt} className={`btn ${answers[field.fieldId] === opt ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ padding: '8px 24px' }} onClick={() => update(field.fieldId, opt)}>{opt}</button>
                            ))}
                        </div>
                    )}
                    {field.type === 'select' && (
                        <select className="input-field" value={answers[field.fieldId] || ''} onChange={e => update(field.fieldId, e.target.value)}>
                            <option value="">Select...</option>
                            {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Target Label Helper ───
function getTargetLabel(targetType, targetId, entityName) {
    const name = entityName || `#${targetId}`
    switch (targetType) {
        case 'ALL_BUILDINGS': return `All Buildings in Property ${name}`
        case 'ALL_FLOORS':    return `All Floors in Building ${name}`
        case 'ALL_SPACES':    return `All Spaces in Floor ${name}`
        case 'BUILDING':      return `Building ${name}`
        case 'FLOOR':         return `Floor ${name}`
        case 'SPACE':         return `Space ${name}`
        default:              return `${targetType} ${name}`
    }
}

// ─── Response Card ───
function ResponseCard({ resp, templates, isExpanded, onToggle, canSubmit, onSubmit, isAdmin, onDelete }) {
    const [entityName, setEntityName] = useState(null)
    let answers = {}
    try { answers = JSON.parse(resp.answersJson) } catch { }
    const tmpl = templates.find(t => t.id === resp.templateId)
    let schemaFields = []
    try { if (tmpl) schemaFields = JSON.parse(tmpl.schemaJson) } catch { }
    const getLabel = (fieldId) => {
        const f = schemaFields.find(sf => sf.fieldId === fieldId)
        return f ? f.label : fieldId
    }

    // Lazy-fetch the actual entity name when expanded
    useEffect(() => {
        if (!isExpanded || entityName !== null) return
        const { targetType, targetId } = resp
        let endpoint = null
        let nameKey = 'name'

        if (targetType === 'BUILDING') { endpoint = `/buildings/${targetId}`; nameKey = 'name' }
        else if (targetType === 'FLOOR') { endpoint = `/floors/${targetId}`; nameKey = 'levelLabel' }
        else if (targetType === 'SPACE') { endpoint = `/spaces/${targetId}`; nameKey = 'name' }
        else if (targetType === 'ALL_FLOORS') { endpoint = `/buildings/${targetId}`; nameKey = 'name' }
        else if (targetType === 'ALL_SPACES') { endpoint = `/floors/${targetId}`; nameKey = 'levelLabel' }
        else if (targetType === 'ALL_BUILDINGS') { endpoint = `/properties/${targetId}`; nameKey = 'name' }

        if (!endpoint) return
        api.get(endpoint)
            .then(r => {
                const data = r.data?.data || r.data
                setEntityName(data?.[nameKey] || data?.name || `#${targetId}`)
            })
            .catch(() => setEntityName(`#${targetId}`))
    }, [isExpanded])

    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={onToggle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                            {tmpl ? tmpl.name : `Template #${resp.templateId}`}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                            {getTargetLabel(resp.targetType, resp.targetId, entityName)}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {resp.submittedAt ? (
                        <span className="badge badge-success"><CheckCircle2 size={12} style={{ marginRight: 4 }} /> Submitted</span>
                    ) : (
                        <>
                            <span className="badge badge-warning">Draft</span>
                            {canSubmit && (
                                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }}
                                    onClick={e => { e.stopPropagation(); onSubmit(resp.id) }}>
                                    <Send size={12} /> Submit
                                </button>
                            )}
                        </>
                    )}
                    {isAdmin && (
                        <>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 12, marginLeft: 8 }}
                                onClick={e => { e.stopPropagation(); onDelete(resp.id) }} title="Delete Response">
                                <Trash2 size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>
            {isExpanded && (
                <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ paddingTop: 12 }}>
                        <h5 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 10 }}>Answers</h5>
                        {Object.keys(answers).length === 0 ? (
                            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No answers yet.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {Object.entries(answers).map(([key, val]) => (
                                    <div key={key} style={{ padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 8 }}>
                                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{getLabel(key)}</span>
                                        <p style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{String(val)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: 'var(--color-text-muted)' }}>
                            <span>Created: {new Date(resp.createdAt).toLocaleString()}</span>
                            {resp.submittedAt && <span>Submitted: {new Date(resp.submittedAt).toLocaleString()}</span>}
                            <span>By {resp.submitterName || `user #${resp.submittedBy}`} ({resp.submitterOrganization || 'No Organization'})</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Main Page ───
export default function Checklists() {
    const { isAdmin, isEngineer } = useAuth()
    const admin = isAdmin()
    const engineer = isEngineer()
    const [tab, setTab] = useState(admin ? 'templates' : 'fill')
    const [templates, setTemplates] = useState([])
    const [responses, setResponses] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Template form
    const [showTemplateForm, setShowTemplateForm] = useState(false)
    const [templateForm, setTemplateForm] = useState({ name: '', scope: 'SPACE', schema: [], organizationId: '' })
    const [editingTemplateId, setEditingTemplateId] = useState(null)
    const [organizations, setOrganizations] = useState([])

    // Response form
    const [showResponseForm, setShowResponseForm] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [responseTargetId, setResponseTargetId] = useState('')
    const [responseAnswers, setResponseAnswers] = useState({})

    const [expandedResponse, setExpandedResponse] = useState(null)

    const flash = (msg, type = 'success') => {
        if (type === 'success') { setSuccess(msg); setError('') }
        else { setError(msg); setSuccess('') }
        setTimeout(() => { setSuccess(''); setError('') }, 4000)
    }

    // ── Fetch templates ──
    const fetchTemplates = useCallback(async () => {
        try {
            const res = await api.get('/checklist-templates')
            setTemplates(res.data?.data || [])
        } catch (e) { flash(e.response?.data?.message || 'Failed to load templates', 'error') }
    }, [])

    // ── Fetch responses ──
    const fetchResponses = useCallback(async () => {
        setLoading(true)
        try {
            // Admin sees ALL responses, Engineer sees only their own
            const endpoint = admin ? '/checklist-responses/all' : '/checklist-responses/my'
            const res = await api.get(endpoint)
            setResponses(res.data?.data || [])
        } catch (e) { flash(e.response?.data?.message || 'Failed to load responses', 'error') }
        finally { setLoading(false) }
    }, [admin])

    const fetchOrganizations = useCallback(async () => {
        if (!admin) return
        try {
            const res = await api.get('/organizations')
            setOrganizations(res.data?.data || [])
        } catch (e) { console.error('Failed to fetch orgs', e) }
    }, [admin])

    useEffect(() => { fetchTemplates() }, [fetchTemplates])
    useEffect(() => { fetchOrganizations() }, [fetchOrganizations])
    useEffect(() => { if (tab === 'responses') fetchResponses() }, [tab, fetchResponses])

    // ── Template CRUD ──
    const handleSaveTemplate = async () => {
        if (!templateForm.name.trim() || templateForm.schema.length === 0) {
            flash('Template needs a name and at least one field', 'error'); return
        }
        if (admin && !templateForm.organizationId && !editingTemplateId) {
            flash('Admin must select an organization', 'error'); return
        }
        try {
            const payload = { 
                name: templateForm.name, 
                scope: templateForm.scope, 
                schemaJson: JSON.stringify(templateForm.schema),
                organizationId: admin && templateForm.organizationId ? parseInt(templateForm.organizationId) : null
            }
            if (editingTemplateId) {
                await api.put(`/checklist-templates/${editingTemplateId}`, payload)
                flash('Template updated (new version created)')
            } else {
                await api.post('/checklist-templates', payload)
                flash('Template created')
            }
            setShowTemplateForm(false)
            setTemplateForm({ name: '', scope: 'SPACE', schema: [], organizationId: '' })
            setEditingTemplateId(null)
            fetchTemplates()
        } catch (e) { flash(e.response?.data?.message || 'Failed to save template', 'error') }
    }

    const handleEditTemplate = (tmpl) => {
        setEditingTemplateId(tmpl.id)
        let schema = []
        try { schema = JSON.parse(tmpl.schemaJson) } catch { }
        setTemplateForm({ name: tmpl.name, scope: tmpl.scope, schema, organizationId: tmpl.organizationId || '' })
        setShowTemplateForm(true)
    }

    const handleDeactivateTemplate = async (id) => {
        if (!confirm('Deactivate this template?')) return
        try {
            await api.delete(`/checklist-templates/${id}`)
            flash('Template deactivated')
            fetchTemplates()
        } catch (e) { flash(e.response?.data?.message || 'Failed to deactivate', 'error') }
    }

    // ── Response CRUD ──
    const handleStartResponse = (tmpl) => {
        setSelectedTemplate(tmpl)
        setResponseTargetId('')
        setResponseAnswers({})
        setShowResponseForm(true)
    }

    const handleSaveResponse = async (submit = false) => {
        if (!responseTargetId) { flash('Please select a target from the dropdowns', 'error'); return }
        try {
            // Parse "all_" prefix values: all_property_1, all_building_2, all_floor_3
            let targetType = selectedTemplate.scope || 'SPACE'
            let targetId = parseInt(responseTargetId)

            if (String(responseTargetId).startsWith('all_')) {
                const parts = responseTargetId.split('_')
                // e.g. all_property_1 → targetType = "ALL_BUILDINGS", targetId = 1 (property id)
                // e.g. all_building_2 → targetType = "ALL_FLOORS", targetId = 2 (building id)
                // e.g. all_floor_3 → targetType = "ALL_SPACES", targetId = 3 (floor id)
                const parentLevel = parts[1] // property, building, floor
                targetId = parseInt(parts[2])
                if (parentLevel === 'property') targetType = 'ALL_BUILDINGS'
                else if (parentLevel === 'building') targetType = 'ALL_FLOORS'
                else if (parentLevel === 'floor') targetType = 'ALL_SPACES'
            }

            const payload = {
                templateId: selectedTemplate.id,
                targetType,
                targetId,
                answersJson: JSON.stringify(responseAnswers)
            }
            await api.post(`/checklist-responses?submit=${submit}`, payload)
            flash(submit ? 'Response submitted!' : 'Draft saved')
            setShowResponseForm(false)
            setSelectedTemplate(null)
            if (tab === 'responses') fetchResponses()
        } catch (e) { flash(e.response?.data?.message || 'Failed to save response', 'error') }
    }

    const handleSubmitExisting = async (id) => {
        try {
            await api.post(`/checklist-responses/${id}/submit`)
            flash('Response submitted')
            fetchResponses()
        } catch (e) { flash(e.response?.data?.message || 'Failed to submit', 'error') }
    }

    const handleDeleteResponse = async (id) => {
        if (!confirm('Are you sure you want to delete this response?')) return
        try {
            await api.delete(`/checklist-responses/${id}`)
            flash('Response deleted')
            fetchResponses()
        } catch (e) { flash(e.response?.data?.message || 'Failed to delete response', 'error') }
    }

    // ── Tabs ──
    // Admin: Templates + All Submissions (NO fill)
    // Engineer: Fill Checklist + My Responses
    const tabs = admin
        ? [
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'responses', label: 'All Submissions', icon: Eye },
        ]
        : [
            { id: 'fill', label: 'Fill Checklist', icon: ClipboardList },
            { id: 'responses', label: 'My Responses', icon: User },
        ]

    return (
        <div className="page-enter" style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Checklists</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
                    {admin ? 'Create templates & review engineer submissions' : 'Fill checklists assigned by admin & track your responses'}
                </p>
            </div>

            {/* Toast */}
            {(success || error) && (
                <div style={{
                    padding: '12px 16px', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500,
                    background: success ? '#ECFDF5' : '#FEF2F2', color: success ? '#059669' : '#DC2626',
                    border: `1px solid ${success ? '#A7F3D0' : '#FECACA'}`, animation: 'slideUp 0.3s ease'
                }}>
                    {success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {success || error}
                </div>
            )}

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--color-surface)', borderRadius: 14, marginBottom: 24, width: 'fit-content', border: '1px solid var(--color-border)' }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s ease',
                        background: tab === t.id ? 'var(--color-bg)' : 'transparent',
                        color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    }}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {/* ═══════════ TEMPLATES TAB (Admin only) ═══════════ */}
            {tab === 'templates' && admin && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Active Templates</h3>
                        <button className="btn btn-primary" onClick={() => { setShowTemplateForm(true); setEditingTemplateId(null); setTemplateForm({ name: '', scope: 'SPACE', schema: [] }) }}>
                            <Plus size={16} /> Create Template
                        </button>
                    </div>

                    {templates.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
                            <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p>No templates yet. Create your first checklist template.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {templates.map(tmpl => {
                                let fields = []
                                try { fields = JSON.parse(tmpl.schemaJson) } catch { }
                                return (
                                    <div key={tmpl.id} className="glass-card" style={{ padding: 20 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                                    <h4 style={{ fontSize: 16, fontWeight: 600 }}>{tmpl.name}</h4>
                                                    <span className="badge badge-primary">v{tmpl.version}</span>
                                                    <span className="badge badge-success">{tmpl.scope}</span>
                                                </div>
                                                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                                                    {fields.length} question{fields.length !== 1 ? 's' : ''} · Created {new Date(tmpl.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => handleEditTemplate(tmpl)}>Edit</button>
                                                <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => handleDeactivateTemplate(tmpl.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        {fields.length > 0 && (
                                            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {fields.slice(0, 5).map((f, i) => (
                                                    <span key={i} style={{ fontSize: 12, padding: '4px 10px', background: 'var(--color-bg)', borderRadius: 8, color: 'var(--color-text-muted)' }}>
                                                        {f.label || 'Untitled'} ({f.type})
                                                    </span>
                                                ))}
                                                {fields.length > 5 && <span style={{ fontSize: 12, padding: '4px 10px', color: 'var(--color-primary)' }}>+{fields.length - 5} more</span>}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ FILL CHECKLIST TAB (Engineer only) ═══════════ */}
            {tab === 'fill' && !admin && (
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Select a Template to Fill</h3>
                    {templates.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
                            <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p>No active templates available. Ask an admin to create one.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {templates.map(tmpl => {
                                let fields = []
                                try { fields = JSON.parse(tmpl.schemaJson) } catch { }
                                return (
                                    <div key={tmpl.id} className="glass-card" style={{ padding: 20, cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                                        onClick={() => handleStartResponse(tmpl)}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)' }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary)' }}>
                                                <ClipboardList size={18} color="var(--color-bg)" />
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: 15, fontWeight: 600 }}>{tmpl.name}</h4>
                                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{fields.length} questions · {tmpl.scope}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>Fill Out →</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ RESPONSES TAB (auto-loaded) ═══════════ */}
            {tab === 'responses' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                            {admin ? 'All Engineer Submissions' : 'My Responses'}
                        </h3>
                        <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={fetchResponses}>
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>Loading...</div>
                    ) : responses.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
                            <Eye size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p>{admin ? 'No submissions yet. Engineers need to fill and submit checklists.' : 'You haven\'t filled any checklists yet. Go to "Fill Checklist" to get started.'}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {responses.map(resp => (
                                <ResponseCard
                                    key={resp.id}
                                    resp={resp}
                                    templates={templates}
                                    isExpanded={expandedResponse === resp.id}
                                    onToggle={() => setExpandedResponse(expandedResponse === resp.id ? null : resp.id)}
                                    canSubmit={engineer && !resp.submittedAt}
                                    onSubmit={handleSubmitExisting}
                                    isAdmin={admin}
                                    onDelete={handleDeleteResponse}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════ TEMPLATE FORM MODAL ═══════════ */}
            {showTemplateForm && (
                <div className="modal-overlay" onClick={() => setShowTemplateForm(false)}>
                    <div className="modal-content" style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{editingTemplateId ? 'Edit Template' : 'Create Template'}</h3>
                            <button onClick={() => setShowTemplateForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Template Name</label>
                                <input className="input-field" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                                    placeholder="e.g. Electrical Safety Checklist" />
                            </div>
                            {admin && (
                                <div>
                                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Assign to Organization</label>
                                    <select className="input-field" value={templateForm.organizationId} onChange={e => setTemplateForm({ ...templateForm, organizationId: e.target.value })}>
                                        <option value="">Select Organization</option>
                                        {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Scope</label>
                                <select className="input-field" value={templateForm.scope} onChange={e => setTemplateForm({ ...templateForm, scope: e.target.value })}>
                                    {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <SchemaBuilder schema={templateForm.schema} onChange={schema => setTemplateForm({ ...templateForm, schema })} />
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button className="btn btn-secondary" onClick={() => setShowTemplateForm(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleSaveTemplate}>
                                    <Save size={16} /> {editingTemplateId ? 'Update (New Version)' : 'Create Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ RESPONSE FORM MODAL (Engineer only) ═══════════ */}
            {showResponseForm && selectedTemplate && (
                <div className="modal-overlay" onClick={() => setShowResponseForm(false)}>
                    <div className="modal-content" style={{ maxWidth: 650, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{selectedTemplate.name}</h3>
                                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>v{selectedTemplate.version} · Scope: {selectedTemplate.scope}</p>
                            </div>
                            <button onClick={() => setShowResponseForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
                        </div>

                        {/* Cascading entity picker */}
                        <div style={{ marginBottom: 20, padding: 16, background: 'var(--color-bg)', borderRadius: 12 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                                Select the {selectedTemplate.scope.toLowerCase()} to apply this checklist to
                            </h4>
                            <EntityPicker scope={selectedTemplate.scope} value={responseTargetId} onChange={setResponseTargetId} />
                        </div>

                        {/* Questions */}
                        <ResponseForm
                            schemaFields={(() => { try { return JSON.parse(selectedTemplate.schemaJson) } catch { return [] } })()}
                            answers={responseAnswers}
                            onChange={setResponseAnswers}
                        />

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setShowResponseForm(false)}>Cancel</button>
                            <button className="btn btn-secondary" onClick={() => handleSaveResponse(false)}>
                                <Save size={16} /> Save Draft
                            </button>
                            <button className="btn btn-primary" onClick={() => handleSaveResponse(true)}>
                                <Send size={16} /> Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
