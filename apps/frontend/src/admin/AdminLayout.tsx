import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(`${import.meta.env.VITE_API_URL}`);

export default function AdminLayout() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<{id: number, message: string}[]>([]);

  useEffect(() => {
    const handleProfileUpdated = (user: any) => {
      addNotification(`🔔 ${user.name || 'Seseorang'} memperbarui profilnya!`);
    };
    
    const handleAttendanceLogged = (attendance: any) => {
      const isClockIn = !attendance.clockOut;
      addNotification(`🕒 Karyawan melakukan ${isClockIn ? 'Clock-In' : 'Clock-Out'}!`);
    };

    socket.on('ProfileUpdated', handleProfileUpdated);
    socket.on('AttendanceLogged', handleAttendanceLogged);

    return () => {
      socket.off('ProfileUpdated', handleProfileUpdated);
      socket.off('AttendanceLogged', handleAttendanceLogged);
    };
  }, []);

  const addNotification = (message: string) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <h2>DEXA WFH Admin</h2>
        
        <NavLink 
          to="/admin/dashboard" 
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
        >
          <span>📈</span> Dasbor Utama
        </NavLink>
        
        <NavLink 
          to="/admin/employees" 
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
        >
          <span>🏠</span> Manajemen Karyawan
        </NavLink>
        
        <NavLink 
          to="/admin/reports" 
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
        >
          <span>📊</span> Laporan Absensi
        </NavLink>
        
        <NavLink 
          to="/admin/logs" 
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
        >
          <span>🛡️</span> MongoDB Audit Logs
        </NavLink>

        <div style={{ flex: 1 }}></div>

        <button 
          className="btn btn-danger" 
          style={{ width: '100%', marginTop: 'auto' }} 
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div className="admin-main-content">
        <Outlet />
      </div>

      {/* Floating Notifications */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 1000, pointerEvents: 'none' }}>
        {notifications.map(n => (
          <div key={n.id} className="notification-toast" style={{ position: 'relative', bottom: 'auto', right: 'auto' }}>
            {n.message}
          </div>
        ))}
      </div>
    </div>
  );
}
