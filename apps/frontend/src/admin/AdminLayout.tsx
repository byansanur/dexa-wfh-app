import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { Button } from '../components/ui/Button';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<{id: number, message: string}[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    socket.connect(); // Mulai koneksi saat Admin masuk

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
      socket.disconnect(); // Putus koneksi saat keluar dari admin
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
      {/* Mobile Header for Hamburger */}
      <div className="admin-mobile-header">
        <h2 style={{ margin: 0 }}>DEXA WFH Admin</h2>
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          ☰
        </button>
      </div>

      {/* Sidebar */}
      <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header desktop-only">
          <h2>DEXA WFH Admin</h2>
        </div>
        
        <NavLink 
          to="/admin/dashboard" 
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
        >
          Dasbor Utama
        </NavLink>
        
        <NavLink 
          to="/admin/employees" 
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
        >
          Manajemen Karyawan
        </NavLink>
        
        <NavLink 
          to="/admin/reports" 
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
        >
          Laporan Absensi
        </NavLink>
        
        <NavLink 
          to="/admin/logs" 
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
        >
          MongoDB Audit Logs
        </NavLink>

        <div style={{ flex: 1 }} className="desktop-only"></div>

        <Button 
          variant="destructive" 
          fullWidth
          style={{ marginTop: 'auto' }} 
          onClick={() => { setIsSidebarOpen(false); handleLogout(); }}
        >
          Logout
        </Button>
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
