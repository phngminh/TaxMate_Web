import { useRoutes, Navigate } from 'react-router-dom'
import path from '../constants/path'
import ProtectedRoute from './ProtectedRoute'
import BusinessOwnerLoginPage from '../pages/auth/BusinessOwnerLoginPage'
import BusinessOwnerRegisterPage from '../pages/auth/BusinessOwnerRegisterPage'
import Home from '../pages/businessOwner/home'
import Product from '../pages/businessOwner/product/productList'
import ProductCategoryPage from '../pages/businessOwner/product/categoryList'
import OwnerLayout from '../components/owner/ownerLayout'
import LandingPage from '../pages/landingPage/LandingPage'
import Ingredient from '../pages/businessOwner/ingredient'
import InventoryControlPage from '../pages/businessOwner/inventory/inventoryControl'
import Order from '../pages/businessOwner/order'
import POS from '../pages/businessOwner/pos'
import AdminLayout from '../components/admin/AdminLayout'
import Dashboard from '../pages/admin/dashboard'
import UserList from '../pages/admin/user/user'
import UserDetail from '../pages/admin/user/userDetail'
import Subscription from '../pages/admin/user/subscription'
import LegalDocuments from '../pages/admin/document/document'
import TaxPolicyPage from '../pages/admin/taxPolicy/taxPolicy'
import SubscriptionPage from '../pages/landingPage/subscription'
import BusinessList from '../pages/admin/user/business'
import Expense from '../pages/businessOwner/expense/expense'
import ExpenseCategoryPage from '../pages/businessOwner/expense/expenseCategory'
import Purchase from '../pages/businessOwner/purchase'
import BankConfig from '../pages/businessOwner/bankConfig'
import EInvoiceConfig from '../pages/businessOwner/einvoiceConfig'
import OwnerSubscription from '../pages/businessOwner/ownerSubscription'
import Report from '../pages/businessOwner/report/ownerReport'
import { useAuth } from './AuthContext'
import TaxDashboard from '../pages/businessOwner/taxDashboard'
import TaxPeriodDetailPage from '../pages/businessOwner/taxPeriod/taxPeriodDetail'
import TaxPeriodPreviewPage from '../pages/businessOwner/taxPeriod/taxPeriodPreview'
import S2bBookPage from '../pages/businessOwner/taxBook/s2bBook'
import S2cBookPage from '../pages/businessOwner/taxBook/s2cBook'
import S2dBookPage from '../pages/businessOwner/taxBook/s2dBook'
import S2eBookPage from '../pages/businessOwner/taxBook/s2eBook'
import QttPage from '../pages/businessOwner/taxBook/qtt'

import TaxCalculationPage from '../pages/businessOwner/taxPeriod/taxCalculation'

import TaxDeclarationPage from '../pages/businessOwner/taxPeriod/taxDeclaration'
import TknTaxPeriodDetailPage from '../pages/businessOwner/taxPeriod/tknTaxPeriodDetail'
import TknTaxPeriodPreviewPage from '../pages/businessOwner/taxPeriod/tknTaxPeriodPreview'

export default function useRouteElements() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const routeElements = useRoutes([
    { path: path.home, element: <LandingPage /> },
    { path: path.subscription, element: <SubscriptionPage /> },
    {
      path: path.BUSINESS_OWNER_LOGIN,
      element: isLoading
        ? null
        : isAuthenticated
          ? (
              <Navigate
                to={user?.role === 'Admin'
                  ? path.ADMIN_DASHBOARD
                  : path.BUSINESS_OWNER_HOME}
                replace
              />
            )
          : (
              <BusinessOwnerLoginPage />
            )
    },
    {
      path: path.BUSINESS_OWNER_REGISTER,
      element: isLoading
        ? null
        : isAuthenticated
          ? (
              <Navigate
                to={user?.role === 'Admin'
                  ? path.ADMIN_DASHBOARD
                  : path.BUSINESS_OWNER_HOME}
                replace
              />
            )
          : (
              <BusinessOwnerRegisterPage />
            )
    },
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
            { path: path.BUSINESS_OWNER_PRODUCT_CATEGORIES, element: <ProductCategoryPage /> },
            { path: path.BUSINESS_OWNER_INGREDIENTS, element: <Ingredient /> },
            { path: path.BUSINESS_OWNER_INVENTORY, element: <InventoryControlPage /> },
            { path: path.BUSINESS_OWNER_ORDERS, element: <Order /> },
            { path: path.BUSINESS_OWNER_EXPENSES, element: <Expense /> },
            { path: path.BUSINESS_OWNER_EXPENSE_CATEGORIES, element: <ExpenseCategoryPage /> },
            { path: path.BUSINESS_OWNER_PURCHASE_EXPENSES, element: <Purchase /> },
            { path: path.BUSINESS_OWNER_SUPPLIER, element: <Purchase /> },
            { path: path.BUSINESS_OWNER_REPORTS, element: <Report /> },
            { path: path.BUSINESS_OWNER_TAX, element: <TaxDashboard /> },
            { path: path.BUSINESS_OWNER_S2B_BOOK, element: <S2bBookPage /> },
            { path: path.BUSINESS_OWNER_S2C_BOOK, element: <S2cBookPage /> },
            { path: path.BUSINESS_OWNER_S2D_BOOK, element: <S2dBookPage /> },
            { path: path.BUSINESS_OWNER_S2E_BOOK, element: <S2eBookPage /> },
            { path: path.BUSINESS_OWNER_QTT, element: <QttPage /> },
            { path: path.BUSINESS_OWNER_TAX_PERIOD, element: <TaxPeriodDetailPage /> },
            {
              path:
                path.BUSINESS_OWNER_TAX_PERIOD_PREVIEW,
              element:
                <TaxPeriodPreviewPage />
            },

            {
              path:
                path.BUSINESS_OWNER_TAX_PERIOD_CALCULATION,
              element:
                <TaxCalculationPage />
            },

            {
              path:
                path.BUSINESS_OWNER_TAX_PERIOD_DECLARATION,
              element:
                <TaxDeclarationPage />
            },
            {
              path: path.BUSINESS_OWNER_TKN_TAX_PERIOD,
              element: <TknTaxPeriodDetailPage />
            },
            {
              path: path.BUSINESS_OWNER_TKN_TAX_PERIOD_PREVIEW,
              element: <TknTaxPeriodPreviewPage />
            },
            { path: path.BUSINESS_OWNER_BANK_CONFIG, element: <BankConfig /> },
            { path: path.BUSINESS_OWNER_EINVOICE_CONFIG, element: <EInvoiceConfig /> },
            { path: path.BUSINESS_OWNER_SUBSCRIPTION, element: <OwnerSubscription /> }
          ]
        },
        { 
          path: path.BUSINESS_OWNER_POS, 
          element: <POS />
        },
      ]
    },
    //================ Admin routes ================
    {
      path: path.BASE_ADMIN,
      element: (
        <ProtectedRoute
          allowedRoles={['Admin']}
          redirectTo={path.BUSINESS_OWNER_LOGIN}
        />
      ),
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
            { path: path.ADMIN_TAX_POLICY, element: <TaxPolicyPage /> },
          ]
        }
      ]
    }
  ])
  return routeElements
}
