import axios from 'axios';
import { reportCache, metadataCache, cacheMonitor } from './cacheManager';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Guarded redirect to avoid reload loop when many requests get 401
const redirectToLoginOnce = () => {
  try {
    const key = 'app_redirect_to_login';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    if (window.location.pathname !== '/login') {
      window.location.replace('/login');
    }
  } catch (e) {
    if (window.location.pathname !== '/login') window.location.replace('/login');
  }
};

// Attach response interceptor if not already present
api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;
    if (status === 401) {
      redirectToLoginOnce();
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  verifyToken: () => api.get('/auth/verify'),
};

// Accounts API
export const accountsAPI = {
  getAll: (params) => api.get('/accounts', { params }),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
  getSummary: () => api.get('/accounts/summary'),
  getDebtSummary: () => api.get('/accounts/debt-summary'),
  getTransactions: (id, params) => api.get(`/accounts/${id}/transactions`, { params }),
  addIncome: (id, data) => api.post(`/accounts/${id}/income`, data),
  addExpense: (id, data) => api.post(`/accounts/${id}/expense`, data),
  transfer: (data) => api.post('/accounts/transfer', data),
  updateBalance: (id, data) => api.put(`/accounts/${id}/balance`, data),
};

// Credit Cards API
export const creditCardsAPI = {
  getAll: (params) => api.get('/credit-cards', { params }),
  getById: (id) => api.get(`/credit-cards/${id}`),
  create: (data) => api.post('/credit-cards', data),
  update: (id, data) => api.put(`/credit-cards/${id}`, data),
  delete: (id) => api.delete(`/credit-cards/${id}`),
  recordPayment: (id, data) => api.post(`/credit-cards/${id}/payment`, data),
  addExpense: (id, data) => api.post(`/credit-cards/${id}/expense`, data),
  getTransactions: (id, params) => api.get(`/credit-cards/${id}/transactions`, { params }),
  calculateInterest: (id, params) => api.get(`/credit-cards/${id}/calculate-interest`, { params }),
  getPaymentSchedule: (id, params) => api.get(`/credit-cards/${id}/payment-schedule`, { params }),
  compareScenarios: (id, data) => api.post(`/credit-cards/${id}/compare-scenarios`, data),
  getInterestSavings: (id, params) => api.get(`/credit-cards/${id}/interest-savings`, { params }),
  getUpcomingPayments: (params) => api.get('/credit-cards/payments/upcoming', { params }),
  getPaymentReminders: () => api.get('/credit-cards/payments/reminders'),
  getPaymentCalendar: (params) => api.get('/credit-cards/payments/calendar', { params }),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getRecent: (params) => api.get('/transactions/recent', { params }),
  search: (params) => api.get('/transactions/search', { params }),
  getCategories: (params) => api.get('/transactions/categories', { params }),
  getStatistics: (params) => api.get('/transactions/statistics', { params }),
  getMonthlySummary: (params) => api.get('/transactions/summary/monthly', { params }),
  getCategoryBreakdown: (params) => api.get('/transactions/analysis/category-breakdown', { params }),
  getSpendingTrends: (params) => api.get('/transactions/analysis/spending-trends', { params }),
  bulkDelete: (data) => api.delete('/transactions/bulk/delete', { data }),
  
  // Yeni chart endpoint'leri
  getCategoryExpenses: (params) => {
    // Mock data for now - gerçek API endpoint'i eklenene kadar
    return Promise.resolve({
      data: {
        data: [
          { category: 'Yemek', amount: 1500 },
          { category: 'Ulaşım', amount: 800 },
          { category: 'Eğlence', amount: 600 },
          { category: 'Alışveriş', amount: 1200 },
          { category: 'Sağlık', amount: 400 },
          { category: 'Faturalar', amount: 900 }
        ]
      }
    });
  },
  
  getFinancialTrend: (params) => {
    // Mock data for now - gerçek API endpoint'i eklenene kadar
    const months = ['Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım'];
    return Promise.resolve({
      data: {
        data: months.map((month, index) => ({
          month,
          income: 5000 + (Math.random() * 1000),
          expense: 3500 + (Math.random() * 800),
        }))
      }
    });
  },
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        // Validation errors
        if (data.errors && Array.isArray(data.errors)) {
          return data.errors.map(err => err.message).join(', ');
        }
        return data.message || 'Geçersiz veri girişi';
      
      case 401:
        return 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın';
      
      case 403:
        return 'Bu işlem için yetkiniz bulunmuyor';
      
      case 404:
        return 'Aranan kaynak bulunamadı';
      
      case 409:
        return data.message || 'Çakışma hatası oluştu';
      
      case 422:
        return data.message || 'İşlenemeyen veri';
      
      case 429:
        return 'Çok fazla istek gönderildi, lütfen bekleyin';
      
      case 500:
        return 'Sunucu hatası oluştu, lütfen tekrar deneyin';
      
      case 502:
      case 503:
      case 504:
        return 'Sunucu geçici olarak kullanılamıyor';
      
      default:
        return data.message || `Sunucu hatası (${status})`;
    }
  } else if (error.request) {
    // Request was made but no response received
    if (error.code === 'ECONNABORTED') {
      return 'İstek zaman aşımına uğradı';
    }
    return 'Sunucuya bağlanılamadı, internet bağlantınızı kontrol edin';
  } else {
    // Something else happened
    return error.message || 'Beklenmeyen bir hata oluştu';
  }
};

// Helper function to format currency
export const formatCurrency = (amount, currency = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Helper function to create API call with loading state
export const createApiCall = async (apiFunction, setLoading, errorHandler) => {
  try {
    if (setLoading) setLoading(true);
    const result = await apiFunction();
    return result;
  } catch (error) {
    if (errorHandler) {
      errorHandler(handleApiError(error));
    } else {
      throw error;
    }
  } finally {
    if (setLoading) setLoading(false);
  }
};

// Helper function to format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

// Helper function to format short date
export const formatShortDate = (date) => {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

// Fixed Payments API
export const fixedPaymentsAPI = {
  getAll: (params) => api.get('/fixed-payments', { params }),
  getById: (id) => api.get(`/fixed-payments/${id}`),
  create: (data) => api.post('/fixed-payments', data),
  update: (id, data) => api.put(`/fixed-payments/${id}`, data),
  delete: (id) => api.delete(`/fixed-payments/${id}`),
  getMonthlySchedule: (params) => api.get('/fixed-payments/schedule', { params }),
  getPaymentsDueThisMonth: () => api.get('/fixed-payments/due-this-month'),
  getOverduePayments: () => api.get('/fixed-payments/overdue'),
  getTotalMonthlyAmount: () => api.get('/fixed-payments/total-monthly'),
  getCategories: () => api.get('/fixed-payments/categories'),
  getByCategory: (category) => api.get(`/fixed-payments/category/${category}`),
  
  // Payment History endpoints
  getMonthlyStatusWithHistory: (params) => api.get('/fixed-payments/history/monthly-status', { params }),
  getPaymentStatistics: (params) => api.get('/fixed-payments/history/statistics', { params }),
  getUnpaidPayments: (params) => api.get('/fixed-payments/history/unpaid', { params }),
  getPaidPayments: (params) => api.get('/fixed-payments/history/paid', { params }),
  getOverduePaymentsWithHistory: (params) => api.get('/fixed-payments/history/overdue', { params }),
  getPaymentHistory: (id, params) => api.get(`/fixed-payments/${id}/history`, { params }),
  markAsPaid: (id, data) => api.post(`/fixed-payments/${id}/mark-paid`, data),
  markAsUnpaid: (id, data) => api.post(`/fixed-payments/${id}/mark-unpaid`, data),
};

// Installment Payments API
export const installmentPaymentsAPI = {
  getAll: (params) => api.get('/installment-payments', { params }),
  getById: (id) => api.get(`/installment-payments/${id}`),
  create: (data) => api.post('/installment-payments', data),
  update: (id, data) => api.put(`/installment-payments/${id}`, data),
  delete: (id) => api.delete(`/installment-payments/${id}`),
  recordPayment: (id, data) => api.post(`/installment-payments/${id}/payment`, data),
  getPaymentHistory: (id) => api.get(`/installment-payments/${id}/history`),
  getUpcomingPayments: (params) => api.get('/installment-payments/upcoming', { params }),
  getOverduePayments: () => api.get('/installment-payments/overdue'),
  getSummary: () => api.get('/installment-payments/summary'),
  getCategories: () => api.get('/installment-payments/categories'),
  getByCategory: (category) => api.get(`/installment-payments/category/${category}`),
};

// Reports API - Enhanced for new reporting system with caching
export const reportsAPI = {
  // Legacy endpoints (keeping for backward compatibility)
  getFinancialOverview: (params) => api.get('/reports/financial-overview', { params }),
  getCategoryBreakdown: (params) => api.get('/reports/category-breakdown', { params }),
  getMonthlyTrends: (params) => api.get('/reports/monthly-trends', { params }),
  getInstallmentsOverview: () => api.get('/reports/installments-overview'),
  getNetWorthHistory: (params) => api.get('/reports/net-worth-history', { params }),
  exportData: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  
  // New enhanced reporting endpoints with caching
  generateReport: async (filters) => {
    // Check cache first
    const cachedData = reportCache.getReport(filters);
    if (cachedData) {
      console.log('Report data served from cache');
      return { data: { data: cachedData, fromCache: true } };
    }

    // Check memory usage before generating new data
    cacheMonitor.forceCleanupIfNeeded();

    // Generate new data (mock implementation)
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = generateMockReportData(filters);
        
        // Cache the result
        reportCache.setReport(filters, mockData);
        
        resolve({ data: { data: mockData, fromCache: false } });
      }, 1000);
    });
  },
  
  aggregateData: (filters) => {
    // Mock implementation for data aggregation
    return new Promise((resolve) => {
      setTimeout(() => {
        const aggregatedData = aggregateMockData(filters);
        resolve({ data: { data: aggregatedData } });
      }, 800);
    });
  },
  
  getAvailableCategories: async () => {
    // Check metadata cache first
    const cachedCategories = metadataCache.getCategories();
    if (cachedCategories) {
      console.log('Categories served from cache');
      return Promise.resolve({
        data: { data: cachedCategories, fromCache: true }
      });
    }

    // Mock categories - will be replaced with actual backend call
    const categories = [
      'Gıda', 'Ulaşım', 'Eğlence', 'Faturalar', 'Alışveriş', 
      'Sağlık', 'Eğitim', 'Teknoloji', 'Ev & Yaşam', 'Diğer'
    ];

    // Cache the categories
    metadataCache.setCategories(categories);

    return Promise.resolve({
      data: { data: categories, fromCache: false }
    });
  },
  
  exportToPDF: (reportData, template = 'standard') => {
    // Mock PDF export - will be implemented later
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            success: true, 
            downloadUrl: '/mock-pdf-download',
            filename: `report_${Date.now()}.pdf`
          } 
        });
      }, 2000);
    });
  },
  
  exportToExcel: (reportData) => {
    // Mock Excel export - will be implemented later
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            success: true, 
            downloadUrl: '/mock-excel-download',
            filename: `report_${Date.now()}.xlsx`
          } 
        });
      }, 1500);
    });
  },

  // Cache management endpoints
  getCacheStats: () => {
    return Promise.resolve({
      data: {
        data: {
          reportCache: reportCache.getStats(),
          memoryUsage: cacheMonitor.getMemoryUsage(),
          isMemoryHigh: cacheMonitor.isMemoryUsageHigh()
        }
      }
    });
  },

  clearCache: () => {
    reportCache.clearReports();
    metadataCache.clearCategories();
    return Promise.resolve({
      data: { success: true, message: 'Cache cleared successfully' }
    });
  },

  // Force cache refresh for a specific report
  refreshReport: async (filters) => {
    // Clear existing cache for this report
    const cacheKey = reportCache.generateCacheKey ? reportCache.generateCacheKey(filters) : null;
    if (cacheKey) {
      reportCache.clearReports(); // For now, clear all - can be more specific later
    }

    // Generate fresh data
    return reportsAPI.generateReport(filters);
  },
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getFinancialOverview: () => api.get('/admin/financial-overview'),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  updateUserRole: (userId, data) => api.put(`/admin/users/${userId}/role`, data),
  resetUserPassword: (userId, data) => api.put(`/admin/users/${userId}/reset-password`, data),
  generateUserPassword: (userId) => api.post(`/admin/users/${userId}/generate-password`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  createAdmin: (data) => api.post('/admin/create-admin', data),
};

// Mock data generators for reporting system
const generateMockReportData = (filters) => {
  const { dateRange, categories, reportType } = filters;
  
  // Generate mock transactions for analysis
  const mockTransactions = generateMockTransactions(dateRange, categories);
  
  // Calculate summary from mock transactions
  const totalIncome = mockTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(mockTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const netIncome = totalIncome - totalExpense;
  
  const summary = {
    totalIncome,
    totalExpense,
    netIncome,
    transactionCount: mockTransactions.length,
    period: dateRange || { 
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    }
  };
  
  // Analyze categories from mock transactions
  const categoryGroups = {};
  mockTransactions.filter(t => t.amount < 0).forEach(transaction => {
    const category = transaction.category;
    if (!categoryGroups[category]) {
      categoryGroups[category] = { amount: 0, count: 0 };
    }
    categoryGroups[category].amount += Math.abs(transaction.amount);
    categoryGroups[category].count += 1;
  });
  
  const categoryAnalysis = Object.entries(categoryGroups).map(([category, data]) => ({
    category,
    amount: data.amount,
    percentage: totalExpense > 0 ? parseFloat(((data.amount / totalExpense) * 100).toFixed(1)) : 0,
    transactionCount: data.count,
    trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)]
  })).sort((a, b) => b.amount - a.amount);
  
  // Generate trend analysis
  const trendAnalysis = {
    monthly: [],
    weekly: []
  };
  
  // Generate 6 months of trend data
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toISOString().slice(0, 7);
    
    trendAnalysis.monthly.push({
      month: monthStr,
      income: totalIncome / 6 + (Math.random() * 2000 - 1000),
      expense: totalExpense / 6 + (Math.random() * 1500 - 750)
    });
  }
  
  // Calculate financial metrics
  const financialMetrics = {
    savingsRate: totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0,
    expenseRatio: totalIncome > 0 ? ((totalExpense / totalIncome) * 100) : 0,
    healthScore: calculateSimpleHealthScore(totalIncome, totalExpense, netIncome)
  };
  
  return {
    summary,
    categoryAnalysis,
    trendAnalysis,
    financialMetrics,
    reportType: reportType || 'summary',
    generatedAt: new Date().toISOString()
  };
};

// Helper function to generate mock transactions
const generateMockTransactions = (dateRange, categories) => {
  const transactions = [];
  const allCategories = ['Gıda', 'Ulaşım', 'Eğlence', 'Faturalar', 'Alışveriş', 'Sağlık', 'Eğitim', 'Teknoloji'];
  const selectedCategories = categories && categories.length > 0 ? categories : allCategories;
  
  // Generate transactions for the last 90 days
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();
  const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const transactionCount = Math.floor(daysDiff * 2.5); // ~2.5 transactions per day
  
  for (let i = 0; i < transactionCount; i++) {
    // Random date within range
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate - startDate));
    
    // Random category
    const category = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
    
    // Random amount (80% expenses, 20% income)
    const isIncome = Math.random() < 0.2;
    const baseAmount = isIncome ? 
      Math.floor(Math.random() * 5000) + 1000 : // Income: 1000-6000
      -(Math.floor(Math.random() * 800) + 50);   // Expense: -50 to -850
    
    transactions.push({
      id: i + 1,
      date: randomDate.toISOString().split('T')[0],
      amount: baseAmount,
      category: category,
      description: `Mock ${isIncome ? 'income' : 'expense'} for ${category}`,
      type: isIncome ? 'income' : 'expense'
    });
  }
  
  return transactions;
};

// Simple health score calculation
const calculateSimpleHealthScore = (income, expense, netIncome) => {
  if (income <= 0) return 0;
  
  let score = 50; // Base score
  
  if (netIncome > 0) {
    score += Math.min(30, (netIncome / income) * 100);
  } else {
    score -= Math.min(30, Math.abs(netIncome / income) * 100);
  }
  
  const expenseRatio = expense / income;
  if (expenseRatio < 0.5) {
    score += 20;
  } else if (expenseRatio < 0.8) {
    score += 10;
  } else if (expenseRatio > 1) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
};

const aggregateMockData = (filters) => {
  // Mock data aggregation logic
  const { dateRange, categories } = filters;
  
  return {
    totalTransactions: Math.floor(Math.random() * 1000) + 500,
    totalAccounts: Math.floor(Math.random() * 10) + 3,
    totalCategories: categories ? categories.length : 10,
    dateRange: dateRange || {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    processedAt: new Date().toISOString()
  };
};

// Email API
export const emailAPI = {
  getPreferences: () => api.get('/email/preferences'),
  updatePreferences: (data) => api.put('/email/preferences', data),
  testEmail: () => api.post('/email/test'),
};

// AI API
export const aiAPI = {
  // Health check
  healthCheck: () => api.get('/ai/health'),
  
  // Categorization
  categorizeTransaction: (data) => api.post('/ai/categorize', data),
  sendCategorizationFeedback: (data) => api.post('/ai/categorize/feedback', data),
  getCategorizationStats: () => api.get('/ai/categorize/stats'),
  getCategorySuggestions: (description) => api.get('/ai/categorize/suggestions', { 
    params: { description } 
  }),
  batchCategorize: (transactions) => api.post('/ai/categorize/batch', { transactions }),
  clearLearningData: (category) => api.delete('/ai/categorize/learning', { 
    params: { category } 
  }),
  
  // Natural Language Query
  processQuery: (query, language = 'tr') => api.post('/ai/query', { query, language }),
  
  // Insights and Recommendations
  getInsights: (timeframe = 'monthly') => api.get('/ai/insights', { 
    params: { timeframe } 
  }),
  getRecommendations: (includeInvestments = false) => api.get('/ai/recommendations', { 
    params: { includeInvestments } 
  }),
  
  // Rate Limit and Cache
  getRateLimitStatus: () => api.get('/ai/rate-limit'),
  getCacheStats: () => api.get('/ai/cache/stats'),
  clearCache: () => api.delete('/ai/cache'),
  
  // Stats
  getStats: () => api.get('/ai/stats'),
};

export default api;