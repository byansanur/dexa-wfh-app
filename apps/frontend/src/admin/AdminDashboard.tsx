import { useState, useEffect, useRef } from 'react';
import { socket } from '../utils/socket';
import Pagination from './components/Pagination';
import { apiFetch } from '../utils/api';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Input } from '../components/ui/Input';

export default function AdminDashboard() {
  const [isAuthenticated] = useState(() => !!localStorage.getItem('user'));
  
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
    if (isAuthenticated) {
      fetchStats();
      if (searchQuery.length === 0 || searchQuery.length >= 3) {
        fetchEmployees();
      }
    }
  }, [isAuthenticated, page, searchQuery, statusFilter]);

  const fetchStatsRef = useRef<any>(null);
  const fetchEmployeesRef = useRef<any>(null);

  useEffect(() => {
    fetchStatsRef.current = fetchStats;
    fetchEmployeesRef.current = fetchEmployees;
  });

  useEffect(() => {
    socket.on('connect', () => console.log('WS AdminDashboard Connected'));
    
    const handleUpdate = () => {
      if (fetchStatsRef.current) fetchStatsRef.current();
      if (fetchEmployeesRef.current) fetchEmployeesRef.current();
    };

    socket.on('ProfileUpdated', handleUpdate);
    socket.on('AttendanceLogged', handleUpdate);

    return () => {
      socket.off('connect');
      socket.off('ProfileUpdated', handleUpdate);
      socket.off('AttendanceLogged', handleUpdate);
    };
  }, []);

  const fetchStats = async () => {
    const res = await apiFetch('/admin/dashboard-stats');
    if (res.ok) setStats(await res.json());
  };

  const fetchEmployees = async () => {
    let url = `/admin/employees?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`;
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
      <div className="dashboard-grid" style={{ marginBottom: 'var(--sp-4)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--sp-3)' }}>
        
        {/* Widget 1: Total Employees */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ fontSize: '32px', background: 'var(--surface-sunken)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>👥</div>
          <div>
            <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 500 }}>Total Karyawan</div>
            <div style={{ fontSize: '32px', fontWeight: 300, color: 'var(--stone)' }}>{stats.totalEmployees}</div>
          </div>
        </Card>

        {/* Widget 2: Absent Today */}
        <Card style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{ fontSize: '32px', background: 'rgba(220, 38, 38, 0.08)', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>⚠️</div>
          <div>
            <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 500 }}>Belum Hadir Hari Ini</div>
            <div style={{ fontSize: '32px', fontWeight: 300, color: 'var(--error)' }}>{stats.absentToday}</div>
          </div>
        </Card>

        {/* Widget 3: Top 3 Punctual */}
        <Card style={{ padding: 'var(--sp-3) var(--sp-4)' }}>
          <div className="text-secondary" style={{ fontSize: '13px', fontWeight: 500, marginBottom: 'var(--sp-2)' }}>Top 3 Hadir Paling Awal 🏆</div>
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
        </Card>
      </div>

      {/* Live Status Table */}
      <Card>
        <div className="flex justify-between items-center gap-3" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--sp-2)', marginBottom: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Daftar Karyawan (Live Status)</h2>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <Input 
              type="text" 
              placeholder="Cari Nama / Email..." 
              value={searchQuery}
              onChange={handleSearchChange}
              containerStyle={{ marginBottom: 0, flex: '1 1 200px', maxWidth: '300px' }}
            />
            <select 
              value={statusFilter} 
              onChange={handleStatusChange}
              style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-sunken)', flex: '1 1 150px', maxWidth: '200px', fontSize: '15px' }}
            >
              <option value="ALL_ATTENDED">Hadir (Hari Ini)</option>
              <option value="PRESENT">Bekerja (Aktif)</option>
              <option value="COMPLETED">Selesai (Pulang)</option>
              <option value="ALL">Semua Karyawan</option>
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
                <th>Lokasi (In)</th>
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
                    {emp.clockInLocation ? (
                      <a href={`https://maps.google.com/?q=${emp.clockInLocation}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
                        📍 Peta
                      </a>
                    ) : '-'}
                  </td>
                  <td>
                    <Chip 
                      type="status" 
                      status={!emp.clockIn ? 'absent' : emp.clockOut ? 'completed' : 'present'}
                    >
                      {!emp.clockIn ? 'Absent' : emp.clockOut ? 'Completed' : 'Present'}
                    </Chip>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Data tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
    </div>
  );
}
