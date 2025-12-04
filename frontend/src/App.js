import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { performStartupChecks, checkApiConnectivity } from './utils/startup';
import { ThemeProvider } from './contexts/ThemeContext';
import './i18n/config'; // Initialize i18n
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AIProvider } from './contexts/AIContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import DashboardNew from './pages/DashboardNew';
import AccountsPage from './pages/accounts/AccountsPage';
import OverdraftsPage from './pages/overdrafts/OverdraftsPage';
import CreditCardsDashboard from './pages/creditCards/CreditCardsDashboard';
import TransactionsPage from './pages/transactions/TransactionsPage';
import ReportsPage from './pages/reports/ReportsPage';
import ProfilePage from './pages/profile/ProfilePage';
import FixedPaymentsPage from './pages/fixedPayments/FixedPaymentsPage';
import InstallmentPaymentsPage from './pages/installmentPayments/InstallmentPaymentsPage';
import PaymentCalendarPage from './pages/calendar/PaymentCalendarPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SystemHealthIndicator from './components/common/SystemHealthIndicator';
import PublicRoute from './components/auth/PublicRoute';

function App() {
  // Perform startup checks
  useEffect(() => {
    const runStartupChecks = async () => {
      // Environment validation
      performStartupChecks();
      
      // API connectivity check (non-blocking)
      setTimeout(() => {
        checkApiConnectivity();
      }, 1000);
    };
    
    runStartupChecks();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AIProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Landing Page */}
                <Route path="/landing" element={<LandingPage />} />
              
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="dashboard-new" element={<DashboardNew />} />
                  <Route path="accounts" element={<AccountsPage />} />
                  <Route path="overdrafts" element={<OverdraftsPage />} />
                  <Route path="credit-cards" element={<CreditCardsDashboard />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="fixed-payments" element={<FixedPaymentsPage />} />
                  <Route path="installment-payments" element={<InstallmentPaymentsPage />} />
                  <Route path="payment-calendar" element={<PaymentCalendarPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  
                  {/* Admin Routes */}
                  <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
                </Route>
              
                {/* Redirect unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            
              {/* System Health Indicator - only show in development or when issues occur */}
              <SystemHealthIndicator 
                position="bottom-left"
                autoHide={process.env.NODE_ENV === 'production'}
              />
            </Router>
          </AIProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;