import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transfer from './components/Transfer';
import Rewards from './components/Rewards';
import Profile from './components/Profile';
import History from './components/History';
import Login from './components/Login';
import Register from './components/Register';
import { Loader2 } from 'lucide-react';

// Private Route Wrapper Component
const PrivateRoute = () => {
  const auth = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  const { user, loading } = auth;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
        <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p style={{ fontFamily: 'var(--font-title)', fontWeight: 500 }}>Initializing Session...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Redirect to login if user context is empty
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Public Route Wrapper Component (Redirects already authenticated users to dashboard)
const PublicRoute = () => {
  const auth = useAuth();
  if (!auth) return <Outlet />;
  const { user, loading } = auth;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
        <Loader2 className="animate-spin" style={{ width: '2.5rem', height: '2.5rem', color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
        <p style={{ fontFamily: 'var(--font-title)', fontWeight: 500 }}>Initializing Session...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  // Redirect to dashboard if logged in
  return !user ? <Outlet /> : <Navigate to="/" replace />;
};

// Layout component containing sidebar and page views
const PrivateLayout = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <Outlet />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (Accessible only when logged out) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes (Accessible only when logged in) */}
          <Route element={<PrivateRoute />}>
            <Route element={<PrivateLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/history" element={<History />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
