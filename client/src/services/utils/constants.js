export const ROLES = {
  ADMIN: 'admin',
  RECEPTION: 'reception',
  STOCK: 'stock',
  DISPATCH: 'dispatch',
  MARKETING: 'marketing'
};

export const DASHBOARD_ROUTES = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.RECEPTION]: '/reception/dashboard',
  [ROLES.STOCK]: '/stock/dashboard',
  [ROLES.DISPATCH]: '/dispatch/dashboard',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    PROFILE: '/admin/profile',
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders/create',
    PENDING: '/orders/pending',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users/create',
  },
  PRODUCTS: {
    LIST: '/products',
    CREATE: '/products/create',
  },
  STOCK: {
    LIST: '/stock',
    ADD: '/stock/add',
  },
  ATTENDANCE: {
    ADMIN: '/attendance/admin',
    RECEPTION: '/attendance/reception',
    STOCK: '/attendance/stock',
    DISPATCH: '/attendance/dispatch',
  },
  DISPATCH: {
    LIST: '/dispatch',
    HISTORY: '/dispatch/history',
  },
}; 