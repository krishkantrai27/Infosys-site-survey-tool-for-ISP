import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #E2E8F0', borderTop: '3px solid #4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />
    if (adminOnly && !user.roles?.includes('ROLE_ADMIN')) return <Navigate to="/dashboard" replace />

    return children
}
