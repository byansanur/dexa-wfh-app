import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Pagination from './components/Pagination';

const socket = io('http://localhost:3000');

export default function AdminEmployees() {
  const [token] = useState(() => localStorage.getItem('token'));
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [attendanceType, setAttendanceType] = useState('SINGLE');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    if (token) fetchEmployees();
  }, [token, page, searchQuery, statusFilter]);

  useEffect(() => {
    socket.on('ProfileUpdated', () => fetchEmployees());
    socket.on('AttendanceLogged', () => fetchEmployees());

    return () => {
      socket.off('connect');
      socket.off('ProfileUpdated');
      socket.off('AttendanceLogged');
    };
  }, [token]);

  const fetchEmployees = async () => {
    let url = `http://localhost:3000/admin/employees?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`;
    
    // Status mapping backend vs frontend
    if (statusFilter === 'PRESENT') url += '&status=Hadir';
    else if (statusFilter === 'COMPLETED') url += '&status=Selesai';
    else if (statusFilter === 'ABSENT') url += '&status=Belum Absen';

    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if(res.ok) {
      const result = await res.json();
      setEmployees(result.data);
      setTotalPages(result.meta.totalPages);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('http://localhost:3000/admin/employee', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, attendanceType })
    });
    alert('Karyawan Berhasil Ditambahkan!');
    setName(''); setEmail(''); setAttendanceType('SINGLE');
    fetchEmployees();
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    const formData = new FormData();
    formData.append('file', csvFile);
    await fetch('http://localhost:3000/admin/employee/bulk', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    alert('Bulk Import Sukses!');
    fetchEmployees();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset page on search
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset page on filter
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Manajemen Karyawan</h1>

      <div className="responsive-grid-2-3">
        <div className="card">
          <h2>Tambah Karyawan (Single)</h2>
          <form onSubmit={handleAddEmployee}>
            <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Nama</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Tipe Absensi</label>
                <select value={attendanceType} onChange={e => setAttendanceType(e.target.value)}>
                  <option value="SINGLE">Single-Shift (1x per Hari)</option>
                  <option value="MULTI">Multi-Shift (Lebih dari 1x)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Simpan Karyawan</button>
          </form>

          <h2 style={{ marginTop: '2rem' }}>Bulk Upload (CSV)</h2>
          <p className="helper-text">Format CSV: <code>email,name,attendanceType</code></p>
          <form onSubmit={handleBulkUpload}>
            <div className="form-group"><label>File CSV</label><input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} required /></div>
            <button className="btn btn-success" type="submit">Import CSV</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Daftar Karyawan (Live Status)</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
              <input 
                type="text" 
                placeholder="Cari Nama / Email..." 
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <select 
                value={statusFilter} 
                onChange={handleStatusChange}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white' }}
              >
                <option value="ALL">Semua Status</option>
                <option value="PRESENT">Hadir (Sesi Aktif)</option>
                <option value="COMPLETED">Selesai (Pulang)</option>
                <option value="ABSENT">Belum Hadir</option>
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
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
