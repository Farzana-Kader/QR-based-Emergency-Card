import axios from 'axios'

// User API instance
const api = axios.create({ baseURL: '/api', timeout: 15000 })

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('eqr_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const path = window.location.pathname
      if (!path.startsWith('/admin') && !path.includes('/login') && !path.includes('/register')) {
        localStorage.removeItem('eqr_token')
        localStorage.removeItem('eqr_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Admin API instance — reads eqr_admin_token, never the user token
const adminApi = axios.create({ baseURL: '/api', timeout: 15000 })

adminApi.interceptors.request.use(cfg => {
  const t = localStorage.getItem('eqr_admin_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

adminApi.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eqr_admin_token')
      if (window.location.pathname.startsWith('/admin/dashboard')) {
        window.location.href = '/admin'
      }
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register:       (d) => api.post('/auth/register', d),
  login:          (d) => api.post('/auth/login', d),
  me:             ()  => api.get('/auth/me'),
  updateProfile:  (d) => api.put('/auth/profile', d),
  uploadPhoto:    (f) => {
    const fd = new FormData()
    fd.append('photo', f)
    return api.post('/auth/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  changePassword: (d) => api.put('/auth/password', d),

  // Admin login — plain axios, zero interceptors, zero tokens
  adminLogin: (d) => axios.post('/api/auth/admin/login', d, { timeout: 15000 }),

  // Admin data — uses adminApi with eqr_admin_token
  adminUsers: () => adminApi.get('/auth/admin/users'),
  adminStats: () => adminApi.get('/auth/admin/stats'),
}

export const profileApi = {
  get:          (token) => api.get(`/profile/${token}`),
  sendLocation: (token, loc) => api.post(`/profile/${token}/location`, { location: loc }),
}

export const scanApi = {
  history: (page = 1) => api.get(`/scan/history?page=${page}`),
}

export default api