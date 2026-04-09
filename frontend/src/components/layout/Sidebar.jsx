import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Building2, Users, Settings, LogOut, MapPin, Network, FolderOpen, ClipboardList, Cpu, Cable, FileText } from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout, isAdmin } = useAuth()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const links = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/properties', icon: MapPin, label: 'Properties' },
        { to: '/equipment', icon: Cpu, label: 'Equipment' },
        { to: '/cable-paths', icon: Cable, label: 'Cable Paths' },
        { to: '/checklists', icon: ClipboardList, label: 'Checklists' },
        { to: '/reports', icon: FileText, label: 'Reports' },
        { to: '/organizations', icon: Building2, label: 'Organizations' },
        ...(isAdmin() ? [{ to: '/users', icon: Users, label: 'User Management' }] : []),
        { to: '/profile', icon: Settings, label: 'Profile' },
    ]

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="gradient-primary" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Network size={22} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Site Survey</h1>
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>ISP Tool</p>
                        </div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
                    {links.map(link => (
                        <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                            <link.icon size={18} />
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                <div style={{ padding: '16px 12px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', marginBottom: 8 }}>
                        <div className="gradient-accent" style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</p>
                            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{user?.roles?.[0]?.replace('ROLE_', '')}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>
        </>
    )
}
