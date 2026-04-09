import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import { Toaster } from 'react-hot-toast'
import Organizations from './pages/Organizations'
import UserManagement from './pages/UserManagement'
import Profile from './pages/Profile'
import Properties from './pages/Properties'
import PropertyDetail from './pages/PropertyDetail'
import Checklists from './pages/Checklists'
import FloorPlanCanvas from './pages/FloorPlanCanvas'
import Equipment from './pages/Equipment'
import CablePaths from './pages/CablePaths'
import Reports from './pages/Reports'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
    return (
        <ErrorBoundary>
            <Toaster position="top-right" />
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="properties" element={<Properties />} />
                <Route path="properties/:id" element={<PropertyDetail />} />
                <Route path="floors/:floorId/canvas" element={<FloorPlanCanvas />} />
                <Route path="equipment" element={<Equipment />} />
                <Route path="cable-paths" element={<CablePaths />} />
                <Route path="organizations" element={<Organizations />} />
                <Route path="users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
                <Route path="profile" element={<Profile />} />
                <Route path="checklists" element={<Checklists />} />
                <Route path="reports" element={<Reports />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ErrorBoundary>
    )
}
