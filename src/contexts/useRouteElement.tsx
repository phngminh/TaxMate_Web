import { useRoutes, Navigate, useNavigate } from 'react-router-dom'
import path from '../constants/path'
import ProtectedRoute from './ProtectedRoute'
import BusinessOwnerLoginPage from '../pages/auth/BusinessOwnerLoginPage'
import BusinessOwnerRegisterPage from '../pages/auth/BusinessOwnerRegisterPage'
import Home from '../pages/businessOwner/home'
import Product from '../pages/businessOwner/product'
import OwnerLayout from '../components/owner/ownerLayout'
import LandingPage from '../pages/landingPage/LandingPage'
import Ingredient from '../pages/businessOwner/ingredient'

export default function useRouteElements() {
  const navigate = useNavigate()
  const routeElements = useRoutes([
    { path: path.home, element: <LandingPage /> },
    { path: path.callback, element: <></> },
    { path: path.BUSINESS_OWNER_LOGIN, element: <BusinessOwnerLoginPage /> },
    { path: path.BUSINESS_OWNER_REGISTER, element: <BusinessOwnerRegisterPage /> },
    //================ Business Owner routes ================
    {
      path: path.BASE_BUSINESS_OWNER,
      // element: <ProtectedRoute allowedRoles={['Owner']} />,
      children: [
        {
          element: <OwnerLayout />,
          children: [
            { index: true, element: <Navigate to={path.BUSINESS_OWNER_HOME} replace /> },
            { path: 'home', element: <Home /> },
            { path: 'home', element: <Home /> },
            { path: 'products', element: <Product /> },
            { path: 'ingredients', element: <Ingredient /> },
            { path: 'orders', element: <Home /> },
            { path: 'customers', element: <Home /> },
            { path: 'expenses', element: <Home /> },
            { path: 'reports', element: <Home /> }
          ]
        }
      ]
    },
    //================ Admin routes ================
    {
      path: path.BASE_ADMIN,
      element: <ProtectedRoute allowedRoles={['Admin']} />,
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