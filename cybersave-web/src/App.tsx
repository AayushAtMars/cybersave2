import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import IdentityServices from './pages/IdentityServices';
import ServiceApplication from './pages/ServiceApplication';
import ApplicationStatus from './pages/ApplicationStatus';
import ApplicationDetail from './pages/ApplicationDetail';
import DocumentDetail from './pages/DocumentDetail';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import HelpCenter from './pages/HelpCenter';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes inside Dashboard Layout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/identity" element={<IdentityServices />} />
        
        {/* Dynamic Application & Tracking Routes */}
        <Route path="/services/apply/:serviceId" element={<ServiceApplication />} />
        <Route path="/services/identity/:serviceId" element={<ServiceApplication />} />
        <Route path="/application-status/:id" element={<ApplicationStatus />} />
        <Route path="/applications/:appId" element={<ApplicationDetail />} />
        <Route path="/documents/:docId" element={<DocumentDetail />} />

        <Route path="/wallet" element={<Wallet />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help" element={<HelpCenter />} />
      </Route>
      
      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
