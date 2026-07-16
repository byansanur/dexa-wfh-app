import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Pagination from './components/Pagination';
import { apiFetch } from '../utils/api';

const socket = io(`${import.meta.env.VITE_API_URL}`);

export default function AdminDashboard() {
  const [token] = useState(() => localStorage.getItem('token'));
  
  // Dashboard Stats State
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    topPunctual: [] as any[]
  });

  // Table State
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL_ATTENDED');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchEmployees();
    }
  }, [token, page, searchQuery, statusFilter]);

  useEffect(() => {
    socket.on('connect', () => console.log('WS AdminDashboard Connected'));
    socket.on('ProfileUpdated', () => { fetchStats(); fetchEmployees(); });
    socket.on('AttendanceLogged', () => { fetchStats(); fetchEmployees(); });

    return () => {
      socket.off('connect');
      socket.off('ProfileUpdated');
      socket.off('AttendanceLogged');
    };
  }, []);

  const fetchStats = async () => {
    const res = await apiFetch('/admin/dashboard-stats');
    if (res.ok) setStats(await res.json());
  };

  const fetchEmployees = async () => {
    let url = `${import.meta.env.VITE_API_URL}/admin/employees?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`;
    if (statusFilter === 'PRESENT') url += '&status=Hadir';
    else if (statusFilter === 'COMPLETED') url += '&status=Selesai';
    else if (statusFilter === 'ABSENT') url += '&status=Belum Absen';
    else if (statusFilter === 'ALL_ATTENDED') url += '&status=Semua Hadir';

    const res = await apiFetch(url);
    if(res.ok) {
      const result = await res.json();
      setEmployees(result.data);
      setTotalPages(result.meta.totalPages);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Dasbor Utama</h1>

      {/* Stats Widgets */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Widget 1: Total Employees */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '3rem', background: '#e0e7ff', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>👥</div>
          <div>
            <div style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>Total Karyawan</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{stats.totalEmployees}</div>
          </div>
        </div>

        {/* Widget 2: Absent Today */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '3rem', background: '#fee2e2', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>⚠️</div>
          <div>
            <div style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500 }}>Belum Hadir Hari Ini</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{stats.absentToday}</div>
          </div>
        </div>

        {/* Widget 3: Top 3 Punctual */}
        <div className="card" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 500, marginBottom: '1rem' }}>Top 3 Hadir Paling Awal 🏆</div>
          {stats.topPunctual.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Belum ada karyawan yang hadir hari ini.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.topPunctual.map((emp, idx) => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)', width: '20px' }}>#{idx + 1}</div>
                  <img src={emp.photoUrl || 'https://ui-avatars.com/api/?name=' + emp.name} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', fontWeight: 500 }}>{emp.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>{new Date(emp.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Status Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Daftar Karyawan (Live Status)</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
            <input 
              type="text" 
              placeholder="Cari Nama / Email..." 
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', flex: '1 1 200px' }}
            />
            <select 
              value={statusFilter} 
              onChange={handleStatusChange}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', flex: '1 1 150px' }}
            >
              <option value="ALL_ATTENDED">Semua Hadir (Hari Ini)</option>
              <option value="PRESENT">Sedang Bekerja (Aktif)</option>
              <option value="COMPLETED">Selesai (Pulang)</option>
              <option value="ALL">Semua Karyawan (+ Belum Hadir)</option>
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nama</th>
                <th>Email</th>
                <th>No. HP</th>
                <th>Tipe Absen</th>
                <th>Jam Masuk (Sesi Terakhir)</th>
                <th>Jam Keluar (Sesi Terakhir)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <img src={emp.photoUrl || 'https://ui-avatars.com/api/?name=' + emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                  </td>
                  <td><span style={{ fontWeight: 500 }}>{emp.name}</span></td>
                  <td>{emp.email}</td>
                  <td>{emp.phone || '-'}</td>
                  <td>{emp.attendanceType === 'MULTI' ? 'Multi-Shift' : 'Single-Shift'}</td>
                  <td>{emp.clockIn ? new Date(emp.clockIn).toLocaleTimeString() : '-'}</td>
                  <td>{emp.clockOut ? new Date(emp.clockOut).toLocaleTimeString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${!emp.clockIn ? 'status-absent' : emp.clockOut ? 'status-completed' : 'status-present'}`}>
                      {!emp.clockIn ? 'Absent' : emp.clockOut ? 'Completed' : 'Present'}
                    </span>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Data tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
