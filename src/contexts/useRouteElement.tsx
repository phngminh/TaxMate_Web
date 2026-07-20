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
import Dashboard from '../pages/admin/dashboard'
import UserList from '../pages/admin/user/user'
import UserDetail from '../pages/admin/user/userDetail'
import Subscription from '../pages/admin/user/subscription'
import LegalDocuments from '../pages/admin/document/document'
import SubscriptionPage from '../pages/landingPage/subscription'
import { BusinessProvider } from './BusinessContext'
import BusinessList from '../pages/admin/user/business'
import Expense from '../pages/businessOwner/expense'
import BankConfig from '../pages/businessOwner/bankConfig'
import EInvoiceConfig from '../pages/businessOwner/einvoiceConfig'
import OwnerSubscription from '../pages/businessOwner/ownerSubscription'
import Report from '../pages/businessOwner/report'

export default function useRouteElements() {
  const routeElements = useRoutes([
    { path: path.home, element: <LandingPage /> },
    { path: path.subscription, element: <SubscriptionPage /> },
    { path: path.BUSINESS_OWNER_LOGIN, element: <BusinessOwnerLoginPage /> },
    { path: path.BUSINESS_OWNER_REGISTER, element: <BusinessOwnerRegisterPage /> },
    //================ Business Owner routes ================
    {
      path: path.BASE_BUSINESS_OWNER,
      element: <ProtectedRoute allowedRoles={['Owner']} />,
      children: [
        {
          element: (
            <BusinessProvider>
              <OwnerLayout />
            </BusinessProvider>
          ),
          children: [
            { index: true, element: <Navigate to={path.BUSINESS_OWNER_HOME} replace /> },
            { path: path.BUSINESS_OWNER_HOME, element: <Home /> },
            { path: path.BUSINESS_OWNER_PRODUCTS, element: <Product /> },
            { path: path.BUSINESS_OWNER_INGREDIENTS, element: <Ingredient /> },
            { path: path.BUSINESS_OWNER_ORDERS, element: <Order /> },
            { path: path.BUSINESS_OWNER_EXPENSES, element: <Expense /> },
            { path: path.BUSINESS_OWNER_REPORTS, element: <Report /> },
            { path: path.BUSINESS_OWNER_BANK_CONFIG, element: <BankConfig /> },
            { path: path.BUSINESS_OWNER_EINVOICE_CONFIG, element: <EInvoiceConfig /> },
            { path: path.BUSINESS_OWNER_SUBSCRIPTION, element: <OwnerSubscription /> }
          ]
        },
        { 
          path: path.BUSINESS_OWNER_POS, 
          element: 
            <BusinessProvider>
              <POS />
            </BusinessProvider>
        },
      ]
    },
    //================ Admin routes ================
    {
      path: path.BASE_ADMIN,
      // element: <ProtectedRoute allowedRoles={['Admin']} />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            { index: true, element: <Navigate to={path.ADMIN_DASHBOARD} replace /> },
            { path: path.ADMIN_DASHBOARD, element: <Dashboard /> },
            { path: path.ADMIN_USERS_LIST, element: <UserList /> },
            { path: path.ADMIN_USERS_DETAIL, element: <UserDetail /> },
            { path: path.ADMIN_BUSINESSES_LIST, element: <BusinessList /> },
            { path: path.ADMIN_USERS_SUBSCRIPTIONS, element: <Subscription /> },
            { path: path.ADMIN_LEGAL_DOCUMENTS, element: <LegalDocuments /> },
          ]
        }
      ]
    }
  ])
  return routeElements
}
