import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext.jsx';

import LoginPage    from './pages/login/LoginPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import BookingsPage  from './pages/bookings/BookingsPage.jsx';
import ReportsPage   from './pages/reports/ReportsPage.jsx';
import BillingPage   from './pages/billing/BillingPage.jsx';

/** Ruta protegida: redirige a /login si no hay sesión activa. */
const PrivateRoute = ({ children }) => {
  const { currentUser, isLoading } = useAppContext();
  if (isLoading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: 'var(--color-gray-500)', fontSize: 'var(--font-size-sm)' }}>Cargando sistema…</p>
    </div>
  );
  return currentUser ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { currentUser } = useAppContext();

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/bookings"  element={<PrivateRoute><BookingsPage /></PrivateRoute>} />
      <Route path="/reports"   element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
      <Route path="/billing"   element={<PrivateRoute><BillingPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
