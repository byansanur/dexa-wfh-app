import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './Login';
import Employee from './pages/Employee';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import './index.css';

const RootRedirect = () => {
  const raw = localStorage.getItem('user');
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
      if (user.role === 'EMPLOYEE') return <Navigate to="/employee" replace />;
    } catch (e) {}
  }
  return <Navigate to="/login" replace />;
};

export default function App() {
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        alert('Sesi telah diubah di tab lain. Aplikasi akan dimuat ulang untuk sinkronisasi.');
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/employee/*" element={<Employee />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
