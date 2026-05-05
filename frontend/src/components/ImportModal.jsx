import { useState } from 'react'
import { X, Upload, CheckCircle, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ImportModal = ({ type, parentId, onClose, onSuccess }) => {
    const [step, setStep] = useState(1) // 1: Upload, 2: Preview
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [previewData, setPreviewData] = useState(null)

    const handleFileChange = (e) => {
        setFile(e.target.files[0])
    }

    const handleUpload = async () => {
        if (!file) return

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        const endpoint = type === 'spaces'
            ? `/import/spaces/preview?floorId=${parentId}`
            : `/import/buildings/preview?propertyId=${parentId}`

        try {
            const res = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setPreviewData(res.data.data)
            setStep(2)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to parse file')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        setLoading(true)
        const endpoint = type === 'spaces' ? '/import/spaces/confirm' : '/import/buildings/confirm'
        try {
            await api.post(endpoint, { sessionToken: previewData.sessionToken })
            toast.success('Import completed successfully')
            onSuccess()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Import failed')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        if (previewData?.sessionToken) {
            const endpoint = type === 'spaces' ? '/import/spaces/cancel' : '/import/buildings/cancel'
            api.post(endpoint, { sessionToken: previewData.sessionToken })
        }
        onClose()
    }

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="import-bg-slate" style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0' }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileSpreadsheet size={20} color="var(--color-primary)" />
                            Import {type === 'spaces' ? 'Spaces' : 'Buildings'}
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            {step === 1 ? 'Upload a CSV or XLSX file to begin' : 'Review parsed data before confirming'}
                        </p>
                    </div>
                    <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8 }}>
                        <X size={20} color="var(--color-text-muted)" />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
                    {step === 1 ? (
                        <div className="import-bg-slate" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', border: '2px dashed var(--color-border)', borderRadius: 12, position: 'relative' }}>
                            {!file && (
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".csv,.xlsx"
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 5 }}
                                />
                            )}
                            <div className="import-bg-indigo" style={{ padding: 16, borderRadius: '50%', marginBottom: 16 }}>
                                <Upload size={32} color="var(--color-primary)" />
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                                {file ? file.name : 'Click or drag file to upload'}
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                Supported formats: CSV, XLSX
                            </p>
                            {file && (
                                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="btn btn-secondary"
                                        style={{ padding: '8px 16px' }}
                                    >
                                        Change File
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                        disabled={loading}
                                        className="btn btn-primary"
                                        style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10 }}
                                    >
                                        {loading ? <Loader2 size={16} className="spin" /> : 'Process File'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {/* Summary Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                                <div className="import-bg-green" style={{ padding: 16, borderRadius: 12, border: '1px solid', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <CheckCircle size={24} color="#16A34A" />
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valid</p>
                                        <p style={{ fontSize: 22, fontWeight: 700, color: '#14532D' }}>{previewData.validCount}</p>
                                    </div>
                                </div>
                                <div className="import-bg-red" style={{ padding: 16, borderRadius: 12, border: '1px solid', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <AlertTriangle size={24} color="#DC2626" />
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Errors</p>
                                        <p style={{ fontSize: 22, fontWeight: 700, color: '#7F1D1D' }}>{previewData.errorCount}</p>
                                    </div>
                                </div>
                                <div className="import-bg-slate" style={{ padding: 16, borderRadius: 12, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <FileSpreadsheet size={24} color="var(--color-primary)" />
                                    <div>
                                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</p>
                                        <p style={{ fontSize: 22, fontWeight: 700 }}>{previewData.totalRows}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Valid Rows Table */}
                            {previewData.valid.length > 0 && (
                                <div style={{ marginBottom: 20 }}>
                                    <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle size={14} color="#16A34A" />
                                        Valid Rows to be Imported
                                    </h4>
                                    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                            <thead>
                                                <tr className="import-table-header">
                                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Row</th>
                                                    {Object.keys(previewData.valid[0]).filter(k => k !== 'rowNumber').map(key => (
                                                        <th key={key} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.valid.map((row, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                        <td style={{ padding: '8px 12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>{row.rowNumber}</td>
                                                        {Object.entries(row).filter(([k]) => k !== 'rowNumber').map(([k, v], i) => (
                                                            <td key={i} style={{ padding: '8px 12px' }}>{v?.toString() || '—'}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Error Rows Table */}
                            {previewData.errors.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <AlertTriangle size={14} />
                                        Validation Errors
                                    </h4>
                                    <div className="import-bg-red" style={{ border: '1px solid', borderRadius: 8, overflow: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                            <thead>
                                                <tr className="import-table-header-error">
                                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Row</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Field</th>
                                                    <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#991B1B', textTransform: 'uppercase' }}>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.errors.map((error, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #FECACA' }}>
                                                        <td style={{ padding: '8px 12px', fontWeight: 600, color: '#991B1B' }}>{error.rowNumber}</td>
                                                        <td style={{ padding: '8px 12px', fontWeight: 500, color: '#B91C1C' }}>{error.field}</td>
                                                        <td style={{ padding: '8px 12px', color: '#DC2626' }}>{error.message}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="import-bg-slate" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 12, borderRadius: '0 0 16px 16px' }}>
                    <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                    {step === 2 && (
                        <button
                            className="btn btn-primary"
                            onClick={handleConfirm}
                            disabled={loading || previewData.validCount === 0}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            {loading ? <Loader2 size={16} className="spin" /> : `Confirm Import (${previewData.validCount} rows)`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ImportModal
