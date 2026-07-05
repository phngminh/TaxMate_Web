import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { me, type AuthResponse, type User } from '../apis/auth.api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (auth: AuthResponse) => void
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    )
  }

  return context
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)

    localStorage.removeItem('token')
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token')

      if (!savedToken) {
        setIsLoading(false)
        return
      }

      setToken(savedToken)

      try {
        const response = await me()
        setUser(response)
      } catch {
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [logout])

  const login = useCallback((auth: AuthResponse) => {
      setToken(auth.accessToken)
      setUser(auth.user)

      localStorage.setItem('token', auth.accessToken)
    },
    []
  )

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}