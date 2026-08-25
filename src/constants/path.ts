const path = {
  //============= Public ==============
  home: '/',
  subscription: '/subscription',
  callback: '/callback',

  //============ Business Owner ============
  BUSINESS_OWNER_LOGIN: '/login',
  BUSINESS_OWNER_REGISTER: '/register',
  BASE_BUSINESS_OWNER: '/business-owner',
  BUSINESS_OWNER_HOME: '/business-owner/home',
  BUSINESS_OWNER_POS: '/business-owner/pos',
  BUSINESS_OWNER_PROFILE: '/business-owner/profile',
  BUSINESS_OWNER_PRODUCTS: '/business-owner/products',
  BUSINESS_OWNER_PRODUCT_CATEGORIES: '/business-owner/product-categories',
  BUSINESS_OWNER_INGREDIENTS: '/business-owner/ingredients',
  BUSINESS_OWNER_INVENTORY: '/business-owner/inventory',
  BUSINESS_OWNER_ORDERS: '/business-owner/orders',
  BUSINESS_OWNER_EXPENSES: '/business-owner/expenses',
  BUSINESS_OWNER_EXPENSE_CATEGORIES: '/business-owner/expense-categories',
  BUSINESS_OWNER_PURCHASE_EXPENSES: '/business-owner/purchase-expenses',
  BUSINESS_OWNER_SUPPLIER: '/business-owner/supplier',
  BUSINESS_OWNER_REPORTS: '/business-owner/reports',
  BUSINESS_OWNER_TAX: '/business-owner/tax',
  BUSINESS_OWNER_S2B_BOOK: '/business-owner/tax-books/s2b',
  BUSINESS_OWNER_S2C_BOOK: '/business-owner/tax-books/s2c',
  BUSINESS_OWNER_S2D_BOOK: '/business-owner/tax-books/s2d',
  BUSINESS_OWNER_S2E_BOOK: '/business-owner/tax-books/s2e',
  BUSINESS_OWNER_QTT: '/business-owner/tax-books/qtt',
  BUSINESS_OWNER_TAX_PERIOD: '/business-owner/tax-period/:taxPeriodId',
  BUSINESS_OWNER_TAX_PERIOD_PREVIEW: '/business-owner/tax-period/:taxPeriodId/preview',
  BUSINESS_OWNER_TAX_PERIOD_CALCULATION: '/business-owner/tax-period/:taxPeriodId/calculation',
  BUSINESS_OWNER_TAX_PERIOD_DECLARATION: '/business-owner/tax-period/:taxPeriodId/declaration',
  BUSINESS_OWNER_SUBSCRIPTION: '/business-owner/subscription',
  BUSINESS_OWNER_BANK_CONFIG: '/business-owner/bank-config',
  BUSINESS_OWNER_INCOME: '/business-owner/expenses/income',
  BUSINESS_OWNER_EINVOICE_CONFIG: '/business-owner/einvoice-config',

  //============= Admin ============
  BASE_ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS_LIST: '/admin/users/list',
  ADMIN_USERS_DETAIL: '/admin/users/:id',
  ADMIN_BUSINESSES_LIST: '/admin/businesses/list',
  ADMIN_USERS_SUBSCRIPTIONS: '/admin/users/subscriptions',
  ADMIN_LEGAL_DOCUMENTS: '/admin/legal/documents',
  ADMIN_TAX_POLICY: '/admin/tax-policy',

}

export function getHomePathForRole(role: string | undefined): string {
  if ((role ?? '').toLowerCase() === 'admin') {
    return path.ADMIN_DASHBOARD
  }

  return path.BUSINESS_OWNER_HOME
}

export default path
