import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' }
})

// Attach access token to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// On 401, try to refresh the token
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config
        const isAuthPage = ['/login', '/register'].includes(window.location.pathname)

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthPage) {
            originalRequest._retry = true
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
                try {
                    const res = await axios.post('/api/auth/refresh-token', { refreshToken })
                    const { accessToken } = res.data.data
                    localStorage.setItem('accessToken', accessToken)
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`
                    return api(originalRequest)
                } catch {
                    localStorage.clear()
                    window.location.href = '/login'
                }
            } else {
                localStorage.clear()
                window.location.href = '/login'
            }
        } else if (error.response && error.response.status !== 401) {
            const msg = error.response.data?.message || 'An unexpected error occurred'
            toast.error(msg)
        } else if (!error.response) {
            toast.error('Network error or server is down')
        }
        return Promise.reject(error)
    }
)

export default api
