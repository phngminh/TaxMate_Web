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

  //============= Admin ============
  BASE_ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS_LIST: '/admin/users/list',
  ADMIN_USERS_DETAIL: '/admin/users/:id',
  ADMIN_USERS_BUSINESSES: '/admin/users/businesses',
  ADMIN_USERS_SUBSCRIPTIONS: '/admin/users/subscriptions',
  ADMIN_USERS_CATEGORIES: '/admin/users/categories',
  ADMIN_USERS_COMPLIANCE: '/admin/users/compliance',
  ADMIN_LEGAL_DOCUMENTS: '/admin/legal/documents',
  ADMIN_LEGAL_UPDATE: '/admin/legal/update',
  ADMIN_LEGAL_METADATA: '/admin/legal/metadata',
  ADMIN_LEGAL_QUALITY: '/admin/legal/quality',
  ADMIN_TEMPLATES_UPLOAD: '/admin/templates/upload',
  ADMIN_TEMPLATES_VERSIONS: '/admin/templates/versions',
  ADMIN_TEMPLATES_MANAGE: '/admin/templates/manage',
  ADMIN_COMPLIANCE_THRESHOLDS: '/admin/compliance/thresholds',
  ADMIN_COMPLIANCE_SETTINGS: '/admin/compliance/settings',
  ADMIN_INVOICES_MONITORING: '/admin/invoices/monitoring',
  ADMIN_INVOICES_STATUS: '/admin/invoices/status',
  ADMIN_NOTIFICATIONS_SYSTEM: '/admin/notifications/system',
  ADMIN_NOTIFICATIONS_COMPLIANCE: '/admin/notifications/compliance',
  ADMIN_NOTIFICATIONS_REVENUE: '/admin/notifications/revenue',
}

export function getHomePathForRole(role: string | undefined): string {
  if ((role ?? '').toLowerCase() === 'admin') {
    return path.ADMIN_DASHBOARD
  }

  return path.BUSINESS_OWNER_HOME
}

export default path
