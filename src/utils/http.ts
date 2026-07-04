import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

class Http {
  instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: 'http://localhost:5086/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
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