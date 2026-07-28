import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

class Http {
  instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: 'https://1461-2a09-bac1-6540-8-00-278-54.ngrok-free.app/api',
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

    return config
  }

  private handleResponseError(error: any) {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
    }

    return Promise.reject(error)
  }
}

const http = new Http().instance

export default http