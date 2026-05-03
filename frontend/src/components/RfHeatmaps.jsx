import { useState, useEffect } from 'react'
import { Plus, Wifi, Layers, Loader2, Play, Image as ImageIcon, Map, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function RfHeatmaps({ floorId, propertyId, activeOverlays, onToggleOverlay }) {
    const { isAdmin, isEngineer } = useAuth()
    const canEdit = isAdmin() || isEngineer()

    const [scans, setScans] = useState([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(true)
    
    // Upload state
    const [showUpload, setShowUpload] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [file, setFile] = useState(null)
    const [tool, setTool] = useState('VISTUMBLER')
    
    // Process state
    const [processingId, setProcessingId] = useState(null)

    useEffect(() => {
        loadScans()
    }, [floorId, propertyId])

    const loadScans = async () => {
        try {
            setLoading(true)
            const res = await api.get(`/rf-scans?propertyId=${propertyId}&floorId=${floorId}`)
            setScans(res.data.data || [])
        } catch (err) {
            toast.error('Failed to load RF scans')
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!file) return toast.error('Please select a trace file')

        const formData = new FormData()
        formData.append('file', file)
        formData.append('propertyId', propertyId)
        formData.append('floorId', floorId)
        formData.append('tool', tool)

        try {
            setUploading(true)
            const res = await api.post('/rf-scans/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success('Scan uploaded successfully')
            setScans([...scans, res.data.data])
            setShowUpload(false)
            setFile(null)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const handleProcess = async (id) => {
        try {
            setProcessingId(id)
            const processRes = await api.post(`/rf-scans/${id}/process`)
            toast.success('Parsed RF data. Generating heatmap...')
            
            const heatmapRes = await api.post(`/rf-scans/${id}/heatmap`)
            toast.success('Heatmap generated!')
            
            setScans(scans.map(s => s.id === id ? heatmapRes.data.data : s))
        } catch (err) {
            toast.error(err.response?.data?.message || 'Processing failed')
        } finally {
            setProcessingId(null)
        }
    }

    const handleGenerateHeatmap = async (id) => {
        try {
            setProcessingId(id)
            const heatmapRes = await api.post(`/rf-scans/${id}/heatmap`)
            toast.success('Heatmap generated!')
            setScans(scans.map(s => s.id === id ? heatmapRes.data.data : s))
        } catch (err) {
            toast.error(err.response?.data?.message || 'Heatmap generation failed')
        } finally {
            setProcessingId(null)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this RF scan?')) return;
        try {
            setProcessingId(id)
            await api.delete(`/rf-scans/${id}`)
            toast.success('Scan deleted!')
            setScans(scans.filter(s => s.id !== id))
            if (activeOverlays && activeOverlays.has(id)) {
                onToggleOverlay(id)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed')
        } finally {
            setProcessingId(null)
        }
    }

    return (
        <div style={{
            background: 'var(--color-surface)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            marginTop: 16,
            overflow: 'hidden'
        }}>
            <div 
                className="surface-alt"
                style={{ 
                    padding: '12px 16px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {expanded ? <ChevronDown size={16} color="#64748B" /> : <ChevronRight size={16} color="#64748B" />}
                    <Wifi size={16} color="#3B82F6" />
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>RF Overlays</span>
                    <span style={{ background: 'var(--color-border)', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700, color: 'var(--color-text)' }}>
                        {scans.length}
                    </span>
                </div>
            </div>

            {expanded && (
                <div style={{ padding: 16 }}>
                    {canEdit && (
                        <div style={{ marginBottom: 16 }}>
                            {!showUpload ? (
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ width: '100%', fontSize: 13, padding: '6px 12px' }}
                                    onClick={() => setShowUpload(true)}
                                >
                                    <Plus size={14} /> Upload RF Scan
                                </button>
                            ) : (
                                <form onSubmit={handleUpload} className="surface-alt" style={{ padding: 12, borderRadius: 8 }}>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Tool Format</label>
                                        <select 
                                            className="input-field" 
                                            style={{ fontSize: 12, padding: '6px 10px' }}
                                            value={tool}
                                            onChange={e => setTool(e.target.value)}
                                        >
                                            <option value="VISTUMBLER">Vistumbler (CSV)</option>
                                            <option value="KISMET">Kismet (CSV)</option>
                                            <option value="SPLAT">SPLAT (TXT)</option>
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: 12 }}>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#475569' }}>Log File</label>
                                        <input 
                                            type="file" 
                                            className="input-field" 
                                            style={{ fontSize: 12, padding: '4px' }}
                                            onChange={e => setFile(e.target.files[0])}
                                            accept=".csv,.txt,.tsv"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: 12, padding: '6px' }} disabled={uploading}>
                                            {uploading ? <Loader2 size={14} className="spin" /> : 'Upload'}
                                        </button>
                                        <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '6px' }} onClick={() => setShowUpload(false)}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 16 }}>
                            <Loader2 size={24} className="spin" color="#94A3B8" style={{ margin: '0 auto' }} />
                        </div>
                    ) : scans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 0', color: '#94A3B8' }}>
                            <Wifi size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                            <p style={{ fontSize: 12 }}>No RF scans available for this floor.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {scans.map(scan => {
                                const isParsed = scan.parsedJson && scan.parsedJson.length > 0
                                const hasHeatmap = !!scan.heatmapFileId
                                const isActive = activeOverlays.has(scan.id)
                                const isProcessing = processingId === scan.id

                                return (
                                    <div key={scan.id} style={{ 
                                        border: `1px solid ${isActive ? '#3B82F6' : '#E2E8F0'}`, 
                                        borderRadius: 8, 
                                        padding: 12,
                                        background: isActive ? 'var(--color-bg)' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <span style={{ 
                                                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, 
                                                        background: '#DBEAFE', color: '#1D4ED8', letterSpacing: '0.05em'
                                                    }}>
                                                        {scan.tool}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: '#64748B' }}>
                                                        {new Date(scan.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {isParsed ? (
                                                    <p style={{ fontSize: 11, color: '#059669', margin: 0, fontWeight: 500 }}>
                                                        • {scan.parsedJson.length} points parsed
                                                    </p>
                                                ) : (
                                                    <p style={{ fontSize: 11, color: '#D97706', margin: 0, fontWeight: 500 }}>
                                                        • Requires processing
                                                    </p>
                                                )}
                                            </div>

                                            <label style={{ display: 'flex', alignItems: 'center', cursor: hasHeatmap ? 'pointer' : 'not-allowed', opacity: hasHeatmap ? 1 : 0.5 }}>
                                                <div style={{ 
                                                    width: 36, height: 20, background: isActive ? '#3B82F6' : '#CBD5E1', 
                                                    borderRadius: 20, position: 'relative', transition: '0.2s'
                                                }}>
                                                    <div style={{ 
                                                        position: 'absolute', top: 2, left: isActive ? 18 : 2, 
                                                        width: 16, height: 16, background: '#fff', borderRadius: '50%', 
                                                        transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                                    }} />
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isActive} 
                                                    disabled={!hasHeatmap}
                                                    onChange={() => onToggleOverlay(scan.id)} 
                                                    style={{ display: 'none' }} 
                                                />
                                            </label>
                                        </div>

                                        {(canEdit && !hasHeatmap) || isAdmin() ? (
                                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                                {canEdit && !hasHeatmap && (
                                                    <>
                                                        {!isParsed ? (
                                                            <button 
                                                                className="btn btn-primary" 
                                                                style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
                                                                onClick={() => handleProcess(scan.id)}
                                                                disabled={isProcessing}
                                                            >
                                                                {isProcessing ? <Loader2 size={12} className="spin" /> : <Play size={12} />}
                                                                Process Log
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                className="btn btn-secondary" 
                                                                style={{ flex: 1, fontSize: 11, padding: '4px 8px' }}
                                                                onClick={() => handleGenerateHeatmap(scan.id)}
                                                                disabled={isProcessing}
                                                            >
                                                                {isProcessing ? <Loader2 size={12} className="spin" /> : <ImageIcon size={12} />}
                                                                Create Heatmap
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                                {isAdmin() && (
                                                    <button 
                                                        className="btn btn-danger" 
                                                        style={{ flex: canEdit && !hasHeatmap ? 0.3 : 1, fontSize: 11, padding: '4px 8px' }}
                                                        onClick={() => handleDelete(scan.id)}
                                                        disabled={isProcessing}
                                                        title="Delete Scan"
                                                    >
                                                        {isProcessing ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                                                        {(!canEdit || hasHeatmap) && <span style={{ marginLeft: 4 }}>Delete</span>}
                                                    </button>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
