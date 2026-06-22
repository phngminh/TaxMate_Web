import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'

interface ProtectedRouteProps {
  children?: React.ReactNode
  allowedRoles?: ('Admin' | 'Owner')[]
  redirectTo?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/'
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-taxmate-red' />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.map(r => r.toLowerCase()).includes((user.role || '').toLowerCase())) {
    return <Navigate to='/' replace />
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute