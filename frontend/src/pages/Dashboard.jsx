import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { Building2, Users, MapPin, CheckSquare, Settings, CheckCircle2, AlertCircle, RefreshCw, Cpu, Cable, Radio, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [overview, setOverview] = useState([])
    const [completion, setCompletion] = useState([])
    const [checklists, setChecklists] = useState([])
    const [equipment, setEquipment] = useState([])
    const [rfscans, setRfscans] = useState([])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const [overviewRes, compRes, checksRes, equipRes, rfRes] = await Promise.all([
                api.get('/dashboard/properties-overview'),
                api.get('/dashboard/survey-completion'),
                api.get('/dashboard/checklist-status'),
                api.get('/dashboard/equipment-count'),
                api.get('/dashboard/rf-scan-coverage')
            ])

            setOverview(overviewRes.data.data || [])
            setCompletion(compRes.data.data || [])
            setChecklists(checksRes.data.data || [])
            setEquipment(equipRes.data.data || [])
            setRfscans(rfRes.data.data || [])
        } catch (err) {
            console.error('Failed to fetch dashboard data', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    // Aggregate stats from overview
    const stats = overview.reduce((acc, curr) => ({
        properties: acc.properties + 1,
        spaces: acc.spaces + curr.spaceCount,
        equipment: acc.equipment + curr.equipmentCount,
        cables: acc.cables + curr.cablePathCount,
        rfscans: acc.rfscans + curr.rfScanCount
    }), { properties: 0, spaces: 0, equipment: 0, cables: 0, rfscans: 0 })

    const cards = [
        { icon: MapPin, label: 'Properties', value: stats.properties, color: '#4F46E5', bg: '#EEF2FF', link: '/properties' },
        { icon: Building2, label: 'Total Spaces', value: stats.spaces, color: '#059669', bg: '#ECFDF5', link: '/properties' },
        { icon: Cpu, label: 'Equipment', value: stats.equipment, color: '#D97706', bg: '#FFFBEB', link: '/equipment' },
        { icon: Cable, label: 'Cable Paths', value: stats.cables, color: '#7C3AED', bg: '#F5F3FF', link: '/cable-paths' },
        { icon: Radio, label: 'RF Scans', value: stats.rfscans, color: '#DC2626', bg: '#FEF2F2', link: '/properties' }
    ]

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
                        Dashboard Overview
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Welcome back, {user?.username}. Here's your workspace status.</p>
                </div>
                <button onClick={fetchDashboardData} className="btn btn-secondary">
                    <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                {cards.map((card, i) => (
                    <div key={i} className="glass-card" style={{ padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => navigate(card.link)}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <card.icon size={20} color={card.color} />
                            </div>
                        </div>
                        <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{loading ? '-' : card.value}</p>
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8, fontWeight: 500 }}>{card.label}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 32 }}>
                {/* Survey Completion Progress */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldCheck size={18} color="var(--color-accent)" /> Survey Completion
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {loading ? <p className="text-muted">Loading...</p> : completion.length === 0 ? <p className="text-muted">No properties found.</p> : completion.map((comp) => (
                            <div key={comp.propertyId}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                                    <span style={{ fontWeight: 500 }}>{comp.propertyName}</span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>{comp.completionPercent}% ({comp.surveyedSpaces}/{comp.totalSpaces})</span>
                                </div>
                                <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        background: comp.completionPercent === 100 ? 'var(--color-accent)' : 'var(--color-primary)', 
                                        width: `${comp.completionPercent}%`,
                                        transition: 'width 1s ease-in-out'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Checklist Status Breakdown */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckSquare size={18} color="var(--color-primary)" /> Checklist Distribution
                    </h3>
                    {loading ? <p className="text-muted">Loading...</p> : checklists.length === 0 ? <p className="text-muted">No checklists found.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {checklists.map((chk) => (
                                <div key={chk.templateId} style={{ padding: 12, background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 8 }}>{chk.templateName}</div>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                            <CheckCircle2 size={14} color="var(--color-accent)" /> 
                                            <span style={{ fontWeight: 600 }}>{chk.submittedCount}</span> Submitted
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                                            <AlertCircle size={14} color="#D97706" /> 
                                            <span style={{ fontWeight: 600 }}>{chk.draftCount}</span> Drafts
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RF Scan Coverage */}
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Radio size={18} color="#DC2626" /> RF Scan Coverage
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {loading ? <p className="text-muted">Loading...</p> : rfscans.length === 0 ? <p className="text-muted">No RF scan data.</p> : rfscans.map((rf) => (
                            <div key={rf.propertyId}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                                    <span style={{ fontWeight: 500 }}>{rf.propertyName}</span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>{rf.coveragePercent}% Floors Scanned</span>
                                </div>
                                <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ 
                                        height: '100%', 
                                        background: 'linear-gradient(90deg, #F59E0B, #EF4444)', 
                                        width: `${rf.coveragePercent}%`,
                                        transition: 'width 1s ease-in-out'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Properties Detail Table */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={18} color="var(--color-primary-dark)" /> Properties Overview
                </h3>
                {loading ? <p className="text-muted">Loading...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Property Name</th>
                                    <th>Buildings</th>
                                    <th>Floors</th>
                                    <th>Spaces</th>
                                    <th>Equipment</th>
                                    <th>Cables</th>
                                    <th>Checklists</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overview.length === 0 ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No properties registered yet.</td></tr>
                                ) : overview.map((prop) => (
                                    <tr key={prop.propertyId}>
                                        <td style={{ fontWeight: 500 }}>{prop.propertyName}</td>
                                        <td>{prop.buildingCount}</td>
                                        <td>{prop.floorCount}</td>
                                        <td>{prop.spaceCount}</td>
                                        <td>{prop.equipmentCount}</td>
                                        <td>{prop.cablePathCount}</td>
                                        <td>{prop.checklistResponseCount}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 60, height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ width: `${prop.surveyCompletionPercent}%`, height: '100%', background: prop.surveyCompletionPercent === 100 ? 'var(--color-accent)' : 'var(--color-primary)' }} />
                                                </div>
                                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{prop.surveyCompletionPercent}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style>{`
                .text-muted { color: var(--color-text-muted); font-size: 14px; }
            `}</style>
        </div>
    )
}
