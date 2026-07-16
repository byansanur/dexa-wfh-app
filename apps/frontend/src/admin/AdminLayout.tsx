import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();

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
    </div>
  );
}
