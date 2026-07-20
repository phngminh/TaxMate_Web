const path = {
  //============= Public ==============
  home: '/',
  callback: '/callback',

  //============ Business Owner ============
  BUSINESS_OWNER_LOGIN: '/login',
  BUSINESS_OWNER_REGISTER: '/register',
  BASE_BUSINESS_OWNER: '/business-owner',
  BUSINESS_OWNER_HOME: '/business-owner/home',
  BUSINESS_OWNER_POS: '/business-owner/pos',
  BUSINESS_OWNER_PROFILE: '/business-owner/profile',
  BUSINESS_OWNER_PRODUCTS: '/business-owner/products',
  BUSINESS_OWNER_INGREDIENTS: '/business-owner/ingredients',
  BUSINESS_OWNER_ORDERS: '/business-owner/orders',
  BUSINESS_OWNER_EXPENSES: '/business-owner/expenses',
  BUSINESS_OWNER_REPORTS: '/business-owner/reports',
  BUSINESS_OWNER_SUBSCRIPTION: '/business-owner/subscription',
  BUSINESS_OWNER_BANK_CONFIG: '/business-owner/bank-config',
  BUSINESS_OWNER_EINVOICE_CONFIG: '/business-owner/einvoice-config',

  //============= Admin ============
  BASE_ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS_LIST: '/admin/users/list',
  ADMIN_USERS_DETAIL: '/admin/users/:id',
  ADMIN_BUSINESSES_LIST: '/admin/businesses/list',
  ADMIN_USERS_SUBSCRIPTIONS: '/admin/users/subscriptions',
  ADMIN_LEGAL_DOCUMENTS: '/admin/legal/documents',
}

export function getHomePathForRole(role: string | undefined): string {
  if ((role ?? '').toLowerCase() === 'admin') {
    return path.ADMIN_DASHBOARD
  }

  return path.BUSINESS_OWNER_HOME
}

export default path
