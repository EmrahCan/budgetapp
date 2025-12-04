# Frontend Detaylı Dokümantasyon

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Proje Yapısı](#proje-yapısı)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Routing](#routing)
7. [API Integration](#api-integration)
8. [Styling](#styling)
9. [i18n](#i18n)
10. [Performance](#performance)

---

## Genel Bakış

Frontend, React 18 ve Material-UI kullanılarak geliştirilmiş modern bir Single Page Application (SPA)'dir.

### Temel Bilgiler
```
Framework:      React 18.2.0
UI Library:     Material-UI 5.14.20
Build Tool:     Create React App
Port:           3000
Language:       JavaScript (ES6+)
Package Manager: npm
```

### Özellikler
- ✅ Single Page Application (SPA)
- ✅ Responsive design (mobile-first)
- ✅ Material Design components
- ✅ Context API for state management
- ✅ React Router for navigation
- ✅ Axios for HTTP requests
- ✅ i18next for internationalization
- ✅ Chart.js for data visualization
- ✅ Form validation with react-hook-form
- ✅ PDF & Excel export
- ✅ Dark/Light theme support
- ✅ Drag & drop functionality

---

## Teknoloji Stack

### Core Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.1",
  "axios": "^1.6.2"
}
```

### UI & Styling
```json
{
  "@mui/material": "^5.14.20",
  "@mui/icons-material": "^5.14.19",
  "@emotion/react": "^11.11.1",
  "@emotion/styled": "^11.11.0"
}
```

### Forms & Validation
```json
{
  "react-hook-form": "^7.48.2",
  "yup": "^1.3.3",
  "@hookform/resolvers": "^3.3.2"
}
```

### Charts & Visualization
```json
{
  "chart.js": "^4.5.1",
  "react-chartjs-2": "^5.3.0",
  "recharts": "^3.3.0"
}
```

### Internationalization
```json
{
  "i18next": "^25.6.2",
  "react-i18next": "^16.3.3",
  "i18next-browser-languagedetector": "^8.2.0"
}
```

### Export & File Handling
```json
{
  "jspdf": "^3.0.3",
  "exceljs": "^4.4.0",
  "html2canvas": "^1.4.1"
}
```

### Drag & Drop
```json
{
  "react-dnd": "^16.0.1",
  "react-dnd-html5-backend": "^16.0.1",
  "react-dnd-touch-backend": "^16.0.1"
}
```

### Date Handling
```json
{
  "@mui/x-date-pickers": "^6.18.2",
  "date-fns": "^2.30.0"
}
```

---

## Proje Yapısı

```
frontend/
├── public/
│   ├── index.html              # HTML template
│   ├── favicon.ico             # Favicon
│   └── manifest.json           # PWA manifest
│
├── src/
│   ├── components/             # Reusable components
│   │   ├── auth/              # Authentication components
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── ProtectedRoute.js
│   │   │   └── AdminRoute.js
│   │   │
│   │   ├── layout/            # Layout components
│   │   │   ├── Layout.js
│   │   │   ├── Header.js
│   │   │   ├── Sidebar.js
│   │   │   └── Footer.js
│   │   │
│   │   ├── common/            # Common components
│   │   │   ├── LoadingSkeleton.js
│   │   │   ├── ErrorBoundary.js
│   │   │   ├── SystemHealthIndicator.js
│   │   │   └── QuickActionsFab.js
│   │   │
│   │   ├── dashboard/         # Dashboard components
│   │   │   ├── SummaryCard.js
│   │   │   ├── RecentTransactions.js
│   │   │   └── QuickActions.js
│   │   │
│   │   ├── charts/            # Chart components
│   │   │   ├── IncomeExpenseChart.js
│   │   │   ├── CategoryChart.js
│   │   │   └── TrendChart.js
│   │   │
│   │   ├── transactions/      # Transaction components
│   │   │   ├── TransactionList.js
│   │   │   ├── TransactionForm.js
│   │   │   └── TransactionFilter.js
│   │   │
│   │   ├── notifications/     # Notification components
│   │   │   ├── NotificationList.js
│   │   │   └── NotificationItem.js
│   │   │
│   │   └── reports/           # Report components
│   │       ├── ReportGenerator.js
│   │       ├── PDFExport.js
│   │       └── ExcelExport.js
│   │
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.js     # Authentication state
│   │   ├── ThemeContext.js    # Theme state
│   │   ├── NotificationContext.js # Notifications
│   │   └── AIContext.js       # AI features
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useAuth.js         # Authentication hook
│   │   ├── useAI.js           # AI features hook
│   │   ├── usePagination.js   # Pagination hook
│   │   ├── useSystemHealth.js # Health check hook
│   │   ├── useResponsiveLayout.js # Responsive hook
│   │   ├── useTouchGestures.js # Touch gestures
│   │   ├── useMemoryManagement.js # Memory management
│   │   ├── useMobileOptimization.js # Mobile optimization
│   │   └── usePerformanceMonitor.js # Performance monitoring
│   │
│   ├── i18n/                  # Internationalization
│   │   ├── config.js          # i18n configuration
│   │   └── locales/           # Translation files
│   │       ├── tr.json        # Turkish
│   │       └── en.json        # English
│   │
│   ├── pages/                 # Page components
│   │   ├── Dashboard.js       # Main dashboard
│   │   ├── DashboardNew.js    # New dashboard
│   │   │
│   │   ├── accounts/          # Account pages
│   │   │   └── AccountsPage.js
│   │   │
│   │   ├── creditCards/       # Credit card pages
│   │   │   └── CreditCardsDashboard.js
│   │   │
│   │   ├── transactions/      # Transaction pages
│   │   │   └── TransactionsPage.js
│   │   │
│   │   ├── fixedPayments/     # Fixed payment pages
│   │   │   └── FixedPaymentsPage.js
│   │   │
│   │   ├── installmentPayments/ # Installment pages
│   │   │   └── InstallmentPaymentsPage.js
│   │   │
│   │   ├── calendar/          # Calendar pages
│   │   │   └── PaymentCalendarPage.js
│   │   │
│   │   ├── reports/           # Report pages
│   │   │   └── ReportsPage.js
│   │   │
│   │   ├── profile/           # Profile pages
│   │   │   └── ProfilePage.js
│   │   │
│   │   ├── admin/             # Admin pages
│   │   │   ├── AdminDashboard.js
│   │   │   └── UserManagement.js
│   │   │
│   │   └── overdrafts/        # Overdraft pages
│   │       └── OverdraftsPage.js
│   │
│   ├── services/              # API services
│   │   ├── api.js             # Axios instance
│   │   ├── cacheManager.js    # Cache management
│   │   ├── memoryGuard.js     # Memory management
│   │   ├── pdfGenerator.js    # PDF generation
│   │   ├── pdfTemplates.js    # PDF templates
│   │   ├── excelGenerator.js  # Excel generation
│   │   ├── excelFormatter.js  # Excel formatting
│   │   └── reportAnalytics.js # Report analytics
│   │
│   ├── utils/                 # Utility functions
│   │   ├── environment.js     # Environment utils
│   │   └── startup.js         # Startup checks
│   │
│   ├── config/                # Configuration
│   │   └── environment.js     # Environment config
│   │
│   ├── data/                  # Static data
│   │   └── turkishBanks.js    # Turkish banks data
│   │
│   ├── App.js                 # Main app component
│   ├── index.js               # Entry point
│   ├── index.css              # Global styles
│   └── setupTests.js          # Test setup
│
├── .env                       # Environment variables
├── Dockerfile                 # Docker image
├── package.json               # Dependencies
└── README.md                  # Documentation
```

---

## Component Architecture

### Component Hierarchy

```
App
├── ThemeProvider
│   ├── AuthProvider
│   │   ├── NotificationProvider
│   │   │   ├── AIProvider
│   │   │   │   ├── Router
│   │   │   │   │   ├── Public Routes
│   │   │   │   │   │   ├── LoginPage
│   │   │   │   │   │   └── RegisterPage
│   │   │   │   │   │
│   │   │   │   │   └── Protected Routes
│   │   │   │   │       ├── Layout
│   │   │   │   │       │   ├── Header
│   │   │   │   │       │   ├── Sidebar
│   │   │   │   │       │   └── Outlet (Page Content)
│   │   │   │   │       │       ├── Dashboard
│   │   │   │   │       │       ├── AccountsPage
│   │   │   │   │       │       ├── TransactionsPage
│   │   │   │   │       │       ├── ReportsPage
│   │   │   │   │       │       └── ...
│   │   │   │   │       │
│   │   │   │   │       └── Admin Routes
│   │   │   │   │           ├── AdminDashboard
│   │   │   │   │           └── UserManagement
│   │   │   │   │
│   │   │   │   └── SystemHealthIndicator
```

### Component Types

#### 1. Page Components
Tam sayfa görünümleri, route'lara bağlı
```javascript
// pages/Dashboard.js
import React from 'react';
import { Box, Grid } from '@mui/material';
import SummaryCard from '../components/dashboard/SummaryCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';

const Dashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SummaryCard />
        </Grid>
        <Grid item xs={12}>
          <RecentTransactions />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
```

#### 2. Layout Components
Sayfa düzeni ve navigasyon
```javascript
// components/layout/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
```

#### 3. Feature Components
Belirli özelliklere ait component'ler
```javascript
// components/transactions/TransactionList.js
import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';

const TransactionList = ({ transactions }) => {
  return (
    <List>
      {transactions.map((transaction) => (
        <ListItem key={transaction.id}>
          <ListItemText
            primary={transaction.description}
            secondary={`${transaction.amount} TRY`}
          />
        </ListItem>
      ))}
    </List>
  );
};

export default TransactionList;
```

#### 4. Common Components
Yeniden kullanılabilir genel component'ler
```javascript
// components/common/LoadingSkeleton.js
import React from 'react';
import { Skeleton, Box } from '@mui/material';

const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <Box>
      {[...Array(count)].map((_, index) => (
        <Skeleton key={index} height={60} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
};

export default LoadingSkeleton;
```

---

## State Management

### Context API Structure

#### AuthContext
```javascript
// contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user } = response.data.data;
    
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### ThemeContext
```javascript
// contexts/ThemeContext.js
import React, { createContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(
    localStorage.getItem('theme') || 'light'
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      }),
    [mode]
  );

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme', newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
```

#### NotificationContext
```javascript
// contexts/NotificationContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.data);
      setUnreadCount(response.data.data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    refresh: fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
```

### Custom Hooks

#### useAuth Hook
```javascript
// hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};
```

#### usePagination Hook
```javascript
// hooks/usePagination.js
import { useState } from 'react';

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page
  };

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    handlePageChange,
    handleLimitChange
  };
};
```

---

## Routing

### Route Configuration
```javascript
// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import AccountsPage from './pages/accounts/AccountsPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            
            {/* Admin routes */}
            <Route path="admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
          </Route>
          
          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

### Protected Route Component
```javascript
// components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSkeleton from '../common/LoadingSkeleton';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### Admin Route Component
```javascript
// components/auth/AdminRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
```

---

## API Integration

### Axios Configuration
```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API Service Examples
```javascript
// Example: Account Service
import api from './api';

export const accountService = {
  getAll: () => api.get('/accounts'),
  
  getById: (id) => api.get(`/accounts/${id}`),
  
  create: (data) => api.post('/accounts', data),
  
  update: (id, data) => api.put(`/accounts/${id}`, data),
  
  delete: (id) => api.delete(`/accounts/${id}`)
};

// Example: Transaction Service
export const transactionService = {
  getAll: (params) => api.get('/transactions', { params }),
  
  create: (data) => api.post('/transactions', data),
  
  update: (id, data) => api.put(`/transactions/${id}`, data),
  
  delete: (id) => api.delete(`/transactions/${id}`)
};
```

---

## Styling

### Material-UI Theme
```javascript
// Custom theme configuration
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#f50057',
      dark: '#c51162',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
```

### Responsive Design
```javascript
// Using MUI breakpoints
import { useTheme, useMediaQuery } from '@mui/material';

const MyComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box sx={{
      padding: isMobile ? 2 : 3,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row'
    }}>
      {/* Content */}
    </Box>
  );
};
```

---

## i18n (Internationalization)

### Configuration
```javascript
// i18n/config.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import tr from './locales/tr.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en }
    },
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### Usage
```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('tr')}>Türkçe</button>
    </div>
  );
};
```

---

## Performance

### Code Splitting
```javascript
import React, { lazy, Suspense } from 'react';
import LoadingSkeleton from './components/common/LoadingSkeleton';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AccountsPage = lazy(() => import('./pages/accounts/AccountsPage'));

function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<AccountsPage />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization
```javascript
import React, { useMemo, useCallback } from 'react';

const ExpensiveComponent = ({ data, onUpdate }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      calculated: item.value * 2
    }));
  }, [data]);

  // Memoize callbacks
  const handleUpdate = useCallback((id) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleUpdate(item.id)}>
          {item.calculated}
        </div>
      ))}
    </div>
  );
};

export default React.memo(ExpensiveComponent);
```

---

**Hazırlayan:** Kiro AI  
**Tarih:** 2 Aralık 2024  
**Versiyon:** 1.0
