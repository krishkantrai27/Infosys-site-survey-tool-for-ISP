import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main style={{ flex: 1, marginLeft: 260, padding: '24px 32px', minHeight: '100vh', background: 'var(--color-bg)' }}>
                {/* Mobile header */}
                <div className="md:hidden" style={{ marginBottom: 16 }}>
                    <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                        <Menu size={24} />
                    </button>
                </div>

                <div className="page-enter">
                    <Outlet />
                </div>
            </main>

            <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; padding: 16px !important; }
        }
      `}</style>
        </div>
    )
}
