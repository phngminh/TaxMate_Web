import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { getMockTimeIso, getMockTimeString } from './mockTime'

class Http {
  instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5086/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    })

    // REQUEST INTERCEPTOR
    this.instance.interceptors.request.use(
      this.handleRequest.bind(this),
      (error) => Promise.reject(error)
    )

    // RESPONSE INTERCEPTOR
    this.instance.interceptors.response.use(
      (response) => response,
      this.handleResponseError
    )
  }

  private handleRequest(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const mockTimeIso = getMockTimeIso()
    const mockTimeLocal = getMockTimeString()
    if (mockTimeIso && config.headers) {
      config.headers['X-Mock-Time'] = mockTimeIso
      config.headers['X-Custom-Time'] = mockTimeIso
      config.headers['X-Current-Time'] = mockTimeIso
      if (mockTimeLocal) {
        config.headers['X-Mock-Local-Time'] = mockTimeLocal
      }
    }
    return config
  }

  private handleResponseError(error: any) {
    if (error?.response?.status === 401) {
      const hasToken = !!localStorage.getItem('token')
      if (hasToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('businesses')
        localStorage.removeItem('currentBusiness')

        window.dispatchEvent(new Event('logout'))
      }
    }

    return Promise.reject(error)
  }
}

const http = new Http().instance

export default http