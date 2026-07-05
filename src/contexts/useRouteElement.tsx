import { useRoutes, Navigate } from 'react-router-dom'
import path from '../constants/path'
import ProtectedRoute from './ProtectedRoute'
import BusinessOwnerLoginPage from '../pages/auth/BusinessOwnerLoginPage'
import BusinessOwnerRegisterPage from '../pages/auth/BusinessOwnerRegisterPage'
import Home from '../pages/businessOwner/home'
import Product from '../pages/businessOwner/product'
import OwnerLayout from '../components/owner/ownerLayout'
import LandingPage from '../pages/landingPage/LandingPage'
import Ingredient from '../pages/businessOwner/ingredient'
import Order from '../pages/businessOwner/order'
import POS from '../pages/businessOwner/pos'
import AdminLayout from '../components/admin/AdminLayout'
import PlaceholderPage from '../components/admin/PlaceholderPage'
import Dashboard from '../pages/admin/dashboard'
import UserList from '../pages/admin/userList'
import UserDetail from '../pages/admin/userDetail'
import BusinessProfiles from '../pages/admin/businessProfiles'
import SubscriptionManagement from '../pages/admin/subscriptionManagement'
import LegalDocuments from '../pages/admin/legalDocuments'
import UploadLegalDocuments from '../pages/admin/uploadLegalDocuments'

export default function useRouteElements() {
  const routeElements = useRoutes([
    { path: path.home, element: <LandingPage /> },
    { path: path.callback, element: <></> },
    { path: path.BUSINESS_OWNER_LOGIN, element: <BusinessOwnerLoginPage /> },
    { path: path.BUSINESS_OWNER_REGISTER, element: <BusinessOwnerRegisterPage /> },
    //================ Business Owner routes ================
    {
      path: path.BASE_BUSINESS_OWNER,
      element: <ProtectedRoute allowedRoles={['Owner']} />,
      children: [
        {
          element: <OwnerLayout />,
          children: [
            { index: true, element: <Navigate to={path.BUSINESS_OWNER_HOME} replace /> },
            { path: path.BUSINESS_OWNER_HOME, element: <Home /> },
            { path: path.BUSINESS_OWNER_PRODUCTS, element: <Product /> },
            { path: path.BUSINESS_OWNER_INGREDIENTS, element: <Ingredient /> },
            { path: path.BUSINESS_OWNER_ORDERS, element: <Order /> },
            { path: path.BUSINESS_OWNER_EXPENSES, element: <Home /> },
            { path: path.BUSINESS_OWNER_REPORTS, element: <Home /> }
          ]
        },
        { path: path.BUSINESS_OWNER_POS, element: <POS /> },
      ]
    },
    //================ Admin routes ================
    {
      path: path.BASE_ADMIN,
      element: <ProtectedRoute allowedRoles={['Admin']} />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            { index: true, element: <Navigate to='dashboard' replace /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'users/list', element: <UserList /> },
            { path: 'users/:id', element: <UserDetail /> },
            { path: 'users/businesses', element: <BusinessProfiles /> },
            { path: 'users/subscriptions', element: <SubscriptionManagement /> },
            { path: 'users/categories', element: <PlaceholderPage title='Business Categories' /> },
            { path: 'users/compliance', element: <PlaceholderPage title='Compliance Status' /> },
            { path: 'legal/documents', element: <LegalDocuments /> },
            { path: 'legal/update', element: <UploadLegalDocuments /> },
            { path: 'legal/metadata', element: <PlaceholderPage title='Metadata Configuration' /> },
            { path: 'legal/quality', element: <PlaceholderPage title='Retrieval Quality Monitoring' /> },
            { path: 'templates/upload', element: <PlaceholderPage title='Upload Tax Declaration Template' /> },
            { path: 'templates/versions', element: <PlaceholderPage title='Template Versions' /> },
            { path: 'templates/manage', element: <PlaceholderPage title='Template Management' /> },
            { path: 'compliance/thresholds', element: <PlaceholderPage title='Revenue Threshold Management' /> },
            { path: 'compliance/settings', element: <PlaceholderPage title='Compliance Settings' /> },
            { path: 'invoices/monitoring', element: <PlaceholderPage title='Invoice Monitoring' /> },
            { path: 'invoices/status', element: <PlaceholderPage title='Invoice Status Management' /> },
            { path: 'notifications/system', element: <PlaceholderPage title='System Notifications' /> },
            { path: 'notifications/compliance', element: <PlaceholderPage title='Compliance Notifications' /> },
            { path: 'notifications/revenue', element: <PlaceholderPage title='Revenue Monitoring Alerts' /> },
          ]
        }
      ]
    }
  ])
  return routeElements
}
