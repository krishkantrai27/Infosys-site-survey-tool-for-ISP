import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { UserCheck, UserX, Trash2, Shield, Building2, Search, Clock, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UserManagement() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [orgs, setOrgs] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('pending') // 'pending' | 'active' | 'inactive'
    const [search, setSearch] = useState('')

    const fetchData = async () => {
        try {
            const [usersRes, orgsRes] = await Promise.all([
                api.get('/admin/users?size=100&sort=createdAt,desc'),
                api.get('/organizations?all=true')
            ])
            // Backend returns Page<UserResponse>, users are in .content
            const usersData = usersRes.data?.data
            const usersList = usersData?.content || usersData || []
            setUsers(Array.isArray(usersList) ? usersList : [])
            const orgsData = orgsRes.data?.data
            setOrgs(Array.isArray(orgsData) ? orgsData : [])
        } catch (err) {
            console.error('Failed to load data', err)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => { fetchData() }, [])

    // Show ALL users including admins (except the current logged-in admin themselves)
    const pendingUsers = users.filter(u => !u.isActive && u.id !== currentUser?.id)
    const activeUsers = users.filter(u => u.isActive)
    const inactiveUsers = users.filter(u => !u.isActive && u.id !== currentUser?.id)

    // Check if a user is the current admin (to prevent self-modification)
    const isSelf = (userId) => userId === currentUser?.id

    const filtered = (list) => list.filter(u =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.organizationName?.toLowerCase().includes(search.toLowerCase())
    )

    const handleApprove = async (userId) => {
        try {
            await api.put(`/admin/users/${userId}/toggle-active`)
            toast.success('User approved & activated')
            fetchData()
        } catch (err) { toast.error('Approval failed') }
    }

    const handleToggleActive = async (userId, isActive) => {
        try {
            await api.put(`/admin/users/${userId}/toggle-active`)
            toast.success(isActive ? 'User deactivated' : 'User activated')
            fetchData()
        } catch (err) { toast.error('Failed to toggle status') }
    }

    const handleChangeRole = async (userId, newRole) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole })
            toast.success('Role updated')
            fetchData()
        } catch (err) { toast.error('Failed to change role') }
    }

    const handleAssignOrg = async (userId, orgId) => {
        if (!orgId) return
        try {
            await api.put(`/admin/users/${userId}/organization/${orgId}`)
            toast.success('Organization assigned')
            fetchData()
        } catch (err) { toast.error('Failed to assign organization') }
    }

    const handleDelete = async (userId, username) => {
        if (!confirm(`Permanently delete user "${username}"? This cannot be undone.`)) return
        try {
            await api.delete(`/admin/users/${userId}`)
            toast.success('User deleted')
            fetchData()
        } catch (err) { toast.error('Failed to delete user') }
    }

    const getRoleLabel = (roles) => {
        const role = roles?.[0]?.replace('ROLE_', '') || 'N/A'
        return role
    }

    const getRoleBadgeStyle = (roles) => {
        const role = roles?.[0]?.replace('ROLE_', '')
        const styles = {
            ADMIN: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' },
            ENGINEER: { background: '#dbeafe', color: '#2563eb', border: '1px solid #93c5fd' },
            CUSTOMER: { background: '#d1fae5', color: '#059669', border: '1px solid #6ee7b7' },
        }
        return styles[role] || { background: '#f3f4f6', color: '#6b7280' }
    }

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading users...</div>

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>User Management</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Manage users, assign organizations & roles</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            className="input-field"
                            placeholder="Search users..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 36, width: 240 }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="glass-card" style={{
                    padding: '16px 20px', cursor: 'pointer',
                    border: tab === 'pending' ? '2px solid #f59e0b' : '2px solid transparent',
                    transition: 'all 0.2s'
                }} onClick={() => setTab('pending')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={20} color="#f59e0b" />
                        </div>
                        <div>
                            <p style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{pendingUsers.length}</p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Pending Approval</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{
                    padding: '16px 20px', cursor: 'pointer',
                    border: tab === 'active' ? '2px solid #10b981' : '2px solid transparent',
                    transition: 'all 0.2s'
                }} onClick={() => setTab('active')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={20} color="#10b981" />
                        </div>
                        <div>
                            <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{activeUsers.length}</p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Active Users</p>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{
                    padding: '16px 20px', cursor: 'pointer',
                    border: tab === 'inactive' ? '2px solid #ef4444' : '2px solid transparent',
                    transition: 'all 0.2s'
                }} onClick={() => setTab('inactive')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserX size={20} color="#ef4444" />
                        </div>
                        <div>
                            <p style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{inactiveUsers.length}</p>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Deactivated</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PENDING APPROVAL SECTION */}
            {tab === 'pending' && (
                <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderBottom: '1px solid #fcd34d', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertCircle size={20} color="#92400e" />
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#92400e' }}>Pending Registration Requests ({pendingUsers.length})</h2>
                    </div>
                    {filtered(pendingUsers).length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <CheckCircle size={40} style={{ marginBottom: 8, opacity: 0.4 }} />
                            <p style={{ fontWeight: 600 }}>No pending requests</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Registered</th>
                                    <th>Assign Organization</th>
                                    <th>Assign Role</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered(pendingUsers).map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontWeight: 700, fontSize: 13
                                                }}>
                                                    {user.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{user.username}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{user.email}</td>
                                        <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <select
                                                className="input-field"
                                                style={{ padding: '6px 10px', fontSize: 13, minWidth: 160 }}
                                                value={user.organizationId || ''}
                                                onChange={e => handleAssignOrg(user.id, e.target.value)}
                                            >
                                                <option value="">— Select Org —</option>
                                                {orgs.map(org => (
                                                    <option key={org.id} value={org.id}>{org.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className="input-field"
                                                style={{ padding: '6px 10px', fontSize: 13, minWidth: 130 }}
                                                value={getRoleLabel(user.roles)}
                                                onChange={e => handleChangeRole(user.id, e.target.value)}
                                            >
                                                <option value="CUSTOMER">CUSTOMER</option>
                                                <option value="ENGINEER">ENGINEER</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                <button
                                                    className="btn"
                                                    onClick={() => handleApprove(user.id)}
                                                    title="Approve & Activate"
                                                    style={{
                                                        padding: '6px 14px', fontSize: 12, fontWeight: 700,
                                                        background: '#10b981', color: 'white', border: 'none',
                                                        borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                                    }}
                                                >
                                                    <UserCheck size={14} /> Approve
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={() => handleDelete(user.id, user.username)}
                                                    title="Reject & Delete"
                                                    style={{
                                                        padding: '6px 14px', fontSize: 12, fontWeight: 700,
                                                        background: '#ef4444', color: 'white', border: 'none',
                                                        borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                                                    }}
                                                >
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ACTIVE USERS SECTION */}
            {tab === 'active' && (
                <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderBottom: '1px solid #6ee7b7', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Users size={20} color="#065f46" />
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#065f46' }}>Active Users ({activeUsers.length})</h2>
                    </div>
                    {filtered(activeUsers).length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <p style={{ fontWeight: 600 }}>No active users found</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Organization</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered(activeUsers).map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 8,
                                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontWeight: 700, fontSize: 13
                                                }}>
                                                    {user.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{user.username}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{user.email}</td>
                                        <td>
                                            <select
                                                className="input-field"
                                                style={{ padding: '4px 8px', fontSize: 12, fontWeight: 600, minWidth: 120 }}
                                                value={getRoleLabel(user.roles)}
                                                onChange={e => handleChangeRole(user.id, e.target.value)}
                                            >
                                                <option value="CUSTOMER">CUSTOMER</option>
                                                <option value="ENGINEER">ENGINEER</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className="input-field"
                                                style={{ padding: '4px 8px', fontSize: 12, minWidth: 160 }}
                                                value={user.organizationId || ''}
                                                onChange={e => handleAssignOrg(user.id, e.target.value)}
                                            >
                                                <option value="">— No Organization —</option>
                                                {orgs.map(org => (
                                                    <option key={org.id} value={org.id}>{org.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                                background: '#d1fae5', color: '#059669'
                                            }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                                                Active
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleToggleActive(user.id, user.isActive)}
                                                    title="Deactivate user"
                                                    style={{
                                                        padding: '5px 10px', background: '#fef3c7', color: '#92400e',
                                                        border: '1px solid #fcd34d', borderRadius: 6, cursor: 'pointer',
                                                        fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                                                    }}
                                                >
                                                    <UserX size={13} /> Deactivate
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id, user.username)}
                                                    title="Delete user permanently"
                                                    style={{
                                                        padding: '5px 10px', background: '#fee2e2', color: '#dc2626',
                                                        border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer',
                                                        fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                                                    }}
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* DEACTIVATED USERS SECTION */}
            {tab === 'inactive' && (
                <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', borderBottom: '1px solid #fca5a5', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UserX size={20} color="#991b1b" />
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b' }}>Deactivated Users ({inactiveUsers.length})</h2>
                    </div>
                    {filtered(inactiveUsers).length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <p style={{ fontWeight: 600 }}>No deactivated users</p>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Organization</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered(inactiveUsers).map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: 8,
                                                    background: '#e5e7eb',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#6b7280', fontWeight: 700, fontSize: 13
                                                }}>
                                                    {user.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 600, color: '#9ca3af' }}>{user.username}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: '#9ca3af', fontSize: 13 }}>{user.email}</td>
                                        <td>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                                ...getRoleBadgeStyle(user.roles)
                                            }}>
                                                {getRoleLabel(user.roles)}
                                            </span>
                                        </td>
                                        <td style={{ color: '#9ca3af', fontSize: 13 }}>{user.organizationName || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleToggleActive(user.id, user.isActive)}
                                                    title="Re-activate user"
                                                    style={{
                                                        padding: '5px 12px', background: '#d1fae5', color: '#059669',
                                                        border: '1px solid #6ee7b7', borderRadius: 6, cursor: 'pointer',
                                                        fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                                                    }}
                                                >
                                                    <UserCheck size={13} /> Re-activate
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id, user.username)}
                                                    title="Delete permanently"
                                                    style={{
                                                        padding: '5px 10px', background: '#fee2e2', color: '#dc2626',
                                                        border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer',
                                                        fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                                                    }}
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    )
}
