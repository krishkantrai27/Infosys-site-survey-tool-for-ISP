import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'
import DataFlowBackground from '../DataFlowBackground'
import { useTheme } from '../../context/ThemeContext'

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main style={{ flex: 1, marginLeft: 260, minHeight: '100vh', background: 'var(--color-bg)', position: 'relative' }}>
                {/* Data flow watermark — inside main, behind content */}
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 260,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 0,
                    overflow: 'hidden',
                }}>
                    <DataFlowBackground opacity={isDark ? 0.18 : 0.25} />
                </div>

                <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px' }}>
                    {/* Mobile header */}
                    <div className="md:hidden" style={{ marginBottom: 16 }}>
                        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                            <Menu size={24} />
                        </button>
                    </div>

                    <div className="page-enter">
                        <Outlet />
                    </div>
                </div>
            </main>

            <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; }
          main > div:first-of-type { left: 0 !important; }
          main > div:last-child { padding: 16px !important; }
        }
      `}</style>
        </div>
    )
}
