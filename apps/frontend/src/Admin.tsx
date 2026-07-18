import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminEmployees from './admin/AdminEmployees';
import AdminReports from './admin/AdminReports';
import AdminLogs from './admin/AdminLogs';
import NotFound from './pages/NotFound';

export default function Admin() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
