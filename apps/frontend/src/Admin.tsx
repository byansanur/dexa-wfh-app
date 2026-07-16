import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminEmployees from './admin/AdminEmployees';
import AdminReports from './admin/AdminReports';
import AdminLogs from './admin/AdminLogs';

export default function Admin() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem('token'));
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    if (!token || user.role !== 'ADMIN') {
      navigate('/login');
    }
  }, [token, user, navigate]);

  if (!token || user.role !== 'ADMIN') return null;

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>
    </Routes>
  );
}
