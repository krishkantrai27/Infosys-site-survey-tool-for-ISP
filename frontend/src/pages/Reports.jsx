import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { FileText, Download, Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'

export default function Reports() {
    const { isAdmin } = useAuth()
    const [properties, setProperties] = useState([])
    const [selectedPropertyId, setSelectedPropertyId] = useState('')
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState('')

    // Form toggles
    const [options, setOptions] = useState({
        includeFloorPlans: true,
        includeChecklists: true,
        includeEquipment: true,
        includeRf: true
    })

    // Fetch properties on mount
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await api.get('/properties')
                setProperties(res.data.data || [])
            } catch (err) {
                console.error('Failed to fetch properties:', err)
            }
        }
        fetchProperties()
    }, [])

    // Fetch reports when property changes or periodically
    const fetchReports = async () => {
        try {
            const url = selectedPropertyId ? `/reports?propertyId=${selectedPropertyId}` : '/reports'
            const res = await api.get(url)
            setReports(res.data.data || [])
            setError('')
        } catch (err) {
            console.error('Failed to fetch reports:', err)
            setError('Failed to load reports')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        fetchReports()
    }, [selectedPropertyId])

    // Poll for status updates if any report is PENDING or GENERATING
    useEffect(() => {
        const hasInProgress = reports.some(r => r.status === 'PENDING' || r.status === 'GENERATING')
        if (hasInProgress) {
            const interval = setInterval(fetchReports, 5000)
            return () => clearInterval(interval)
        }
    }, [reports, selectedPropertyId])

    const handleGenerate = async (e) => {
        e.preventDefault()
        if (!selectedPropertyId) {
            setError('Please select a property first')
            return
        }

        setGenerating(true)
        setError('')
        try {
            await api.post('/reports/generate', {
                propertyId: parseInt(selectedPropertyId),
                ...options
            })
            // Refresh to see the new PENDING report
            await fetchReports()
        } catch (err) {
            console.error('Failed to generate report:', err)
            setError(err.response?.data?.message || 'Failed to generate report')
        } finally {
            setGenerating(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this report?')) return

        try {
            await api.delete(`/reports/${id}`)
            setReports(reports.filter(r => r.id !== id))
        } catch (err) {
            console.error('Failed to delete report:', err)
            alert('Failed to delete report')
        }
    }

    const handleDownload = async (id, filename) => {
        try {
            const res = await api.get(`/reports/${id}/download`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            console.error('Download failed:', err)
            alert('Failed to download PDF')
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'DONE':
                return <span className="badge badge-success"><CheckCircle2 size={14} className="mr-1" /> Done</span>
            case 'PENDING':
                return <span className="badge badge-warning"><Clock size={14} className="mr-1" /> Pending</span>
            case 'GENERATING':
                return <span className="badge badge-primary"><Loader2 size={14} className="mr-1 spin" /> Generating</span>
            case 'FAILED':
                return <span className="badge badge-danger"><AlertCircle size={14} className="mr-1" /> Failed</span>
            default:
                return <span className="badge">{status}</span>
        }
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>PDF Reports</h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Generate and download site survey reports</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 24, alignItems: 'start' }}>
                
                {/* Generator Form */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={20} color="var(--color-primary)" />
                        Generate Report
                    </h2>
                    
                    <form onSubmit={handleGenerate}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Select Property</label>
                            <select 
                                className="input-field" 
                                value={selectedPropertyId} 
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                required
                            >
                                <option value="">-- Choose a property --</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Include Sections</label>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {Object.entries({
                                    includeFloorPlans: 'Floor Plans & Layouts',
                                    includeChecklists: 'Checklist Summaries',
                                    includeEquipment: 'Equipment Inventories',
                                    includeRf: 'RF Scan Heatmaps'
                                }).map(([key, label]) => (
                                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={options[key]}
                                            onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                                            style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ width: '100%' }}
                            disabled={generating || !selectedPropertyId}
                        >
                            {generating ? <Loader2 size={18} className="spin" /> : <FileText size={18} />}
                            {generating ? 'Queuing...' : 'Generate New PDF'}
                        </button>
                    </form>
                </div>

                {/* Reports List */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Generated Reports</h2>
                        <button onClick={fetchReports} className="btn" style={{ padding: '6px 12px', fontSize: 13, background: 'transparent', border: '1px solid var(--color-border)' }}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>Loading reports...</div>
                    ) : reports.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
                            No reports generated yet.{selectedPropertyId ? ' Generate one using the form.' : ''}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Property</th>
                                        <th>Status</th>
                                        <th>Requested By</th>
                                        <th>Date</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report.id}>
                                            <td style={{ fontWeight: 500 }}>{report.propertyName}</td>
                                            <td>{getStatusBadge(report.status)}</td>
                                            <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{report.requestedByUsername}</td>
                                            <td style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                                                {new Date(report.createdAt).toLocaleString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                    <button 
                                                        className="btn btn-secondary" 
                                                        style={{ padding: '6px 10px', fontSize: 12 }}
                                                        disabled={report.status !== 'DONE'}
                                                        title={report.status === 'DONE' ? 'Download PDF' : 'Wait for completion'}
                                                        onClick={() => handleDownload(report.id, `SiteSurveyReport_${report.propertyName.replace(/\s+/g, '_')}.pdf`)}
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                    {isAdmin() && (
                                                        <button 
                                                            className="btn" 
                                                            style={{ padding: '6px 10px', background: '#FEF2F2', color: '#DC2626' }}
                                                            onClick={() => handleDelete(report.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .mr-1 { margin-right: 4px; }
            `}</style>
        </div>
    )
}
