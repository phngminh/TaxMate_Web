import { useRoutes, Navigate, useNavigate } from 'react-router-dom'
import path from '../constants/path'
import ProtectedRoute from './ProtectedRoute'
import { toast } from 'react-toastify'
import BusinessOwnerLoginPage from '../pages/auth/BusinessOwnerLoginPage'
import BusinessOwnerRegisterPage from '../pages/auth/BusinessOwnerRegisterPage'

export default function useRouteElements() {
  const navigate = useNavigate()
  const routeElements = useRoutes([
    { path: path.home, element: <></> },
    { path: path.callback, element: <></> },
    { path: path.BUSINESS_OWNER_LOGIN, element: <BusinessOwnerLoginPage /> },
    { path: path.BUSINESS_OWNER_REGISTER, element: <BusinessOwnerRegisterPage /> },
    //================ Business Owner routes ================
    {
      path: path.BASE_BUSINESS_OWNER,
      element: <ProtectedRoute allowedRoles={['business-owner']} />,
      children: [
        { index: true, element: <Navigate to='rental-requests' replace /> },
        {
          element: <></>,
          children: [
            { path: 'account', element: <></> },
          ]
        },
        { path: 'chat/:rentalId', element: <></> },
      ]
    },
    //================ Admin routes ================
    {
      path: path.BASE_ADMIN,
      element: <ProtectedRoute allowedRoles={['admin']} />,
      children: [
        { index: true, element: <Navigate to='dashboard' replace /> },
        {
          element: <></>,
          children: [
            { path: 'dashboard', element: <></> },
            { path: 'accounts', element: <></> },
          ]
        }
      ]
    }
  ])
  return routeElements
}