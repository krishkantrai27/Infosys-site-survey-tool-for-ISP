import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        const storedUser = localStorage.getItem('user')
        if (token && storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password })
        const data = res.data.data
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        const userData = { id: data.id, username: data.username, email: data.email, roles: data.roles, profilePicture: data.profilePicture || null }
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return userData
    }

    const register = async (formData) => {
        const res = await api.post('/auth/register', formData)
        return res.data
    }

    const logout = async () => {
        try { await api.post('/auth/logout') } catch { }
        localStorage.clear()
        setUser(null)
    }

    const isAdmin = () => user?.roles?.includes('ROLE_ADMIN')
    const isEngineer = () => user?.roles?.includes('ROLE_ENGINEER')

    const updateUser = (newData) => {
        const updated = { ...user, ...newData }
        setUser(updated)
        localStorage.setItem('user', JSON.stringify(updated))
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isEngineer, updateUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
