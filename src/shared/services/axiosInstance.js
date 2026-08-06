import axios from 'axios'
import { useAuthStore } from '../../features/auth/store/authStore'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send the httpOnly refresh cookie
})

axiosInstance.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('cravo-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      const token = parsed?.state?.user?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch {
    // no stored auth yet — request goes out without a token
  }
  return config
})

let isRefreshing = false
let pendingQueue = []

function resolveQueue(newToken) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (newToken) {
      config.headers.Authorization = `Bearer ${newToken}`
      resolve(axiosInstance(config))
    } else {
      reject(new Error('Session expired.'))
    }
  })
  pendingQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const backendMessage = error.response?.data?.message
    if (backendMessage) {
      error.message = backendMessage
    }

    const originalConfig = error.config
    const isAuthEndpoint = originalConfig?.url?.includes('/auth/')

    if (error.response?.status === 401 && !isAuthEndpoint && !originalConfig._retried) {
      originalConfig._retried = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, config: originalConfig })
        })
      }

      isRefreshing = true
      try {
        const { data } = await axiosInstance.post('/auth/refresh')
        const current = useAuthStore.getState().user
        useAuthStore.getState().login({ ...current, ...data })
        resolveQueue(data.token)
        originalConfig.headers.Authorization = `Bearer ${data.token}`
        return axiosInstance(originalConfig)
      } catch (refreshErr) {
        resolveQueue(null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance