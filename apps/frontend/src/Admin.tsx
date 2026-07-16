import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

export default function Admin() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem('token'));
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [auditProfile, setAuditProfile] = useState<any[]>([]);
  const [auditAttendance, setAuditAttendance] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [attendanceType, setAttendanceType] = useState('SINGLE');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Filter States (Live Status)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Date Helpers
  const getFirstDayOfMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };
  const getToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // Filter States (Report)
  const [reportStartDate, setReportStartDate] = useState(getFirstDayOfMonth());
  const [reportEndDate, setReportEndDate] = useState(getToday());
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  useEffect(() => {
    if (!token || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    
    fetchEmployees();
    fetchLogs();
    fetchReport();

    socket.on('connect', () => console.log('WS Admin Connected'));
    socket.on('ProfileUpdated', () => { 
      fetchEmployees(); 
      setTimeout(fetchLogs, 500); 
    });
    socket.on('AttendanceLogged', () => { 
      fetchEmployees(); 
      setTimeout(fetchLogs, 500); 
    });

    return () => {
      socket.off('connect');
      socket.off('ProfileUpdated');
      socket.off('AttendanceLogged');
    };
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch('http://localhost:3000/admin/employees', { headers: { 'Authorization': `Bearer ${token}` } });
    if(res.ok) setEmployees(await res.json());
  };

  const fetchLogs = async () => {
    const resP = await fetch('http://localhost:3000/audit-log/profile', { headers: { 'Authorization': `Bearer ${token}` } });
    if(resP.ok) setAuditProfile(await resP.json());
    
    const resA = await fetch('http://localhost:3000/audit-log/attendance', { headers: { 'Authorization': `Bearer ${token}` } });
    if(resA.ok) setAuditAttendance(await resA.json());
  };

  const fetchReport = async () => {
    let url = 'http://localhost:3000/admin/reports/attendance';
    const params = new URLSearchParams();
    if (reportStartDate) params.append('startDate', reportStartDate);
    if (reportEndDate) params.append('endDate', reportEndDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setReportData(await res.json());
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

  // Filter Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'PRESENT') matchesStatus = emp.clockIn && !emp.clockOut;
    else if (statusFilter === 'COMPLETED') matchesStatus = emp.clockIn && emp.clockOut;
    else if (statusFilter === 'ABSENT') matchesStatus = !emp.clockIn;

    return matchesSearch && matchesStatus;
  });

  const filteredReport = reportData.filter(r => {
    if (!reportSearchQuery) return true;
    const q = reportSearchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.attendanceType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)' }}>HR Admin Portal</h1>
        <button className="btn btn-danger" style={{ width: 'auto' }} onClick={() => { localStorage.clear(); navigate('/login') }}>Logout</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
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
          <p className="helper-text">Format CSV: <code>email,name,attendanceType</code> (opsional SINGLE/MULTI)</p>
          <form onSubmit={handleBulkUpload}>
            <div className="form-group"><label>File CSV</label><input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} required /></div>
            <button className="btn btn-success" type="submit">Import CSV</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Daftar Karyawan (Live Status)</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Cari Nama / Email..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
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
                {filteredEmployees.map(emp => (
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
        </div>
      </div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Laporan Riwayat Absensi (Agregat)</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Dari:</label>
              <input type="date" max={getToday()} value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Sampai:</label>
              <input type="date" max={getToday()} value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto' }} onClick={fetchReport}>Terapkan Filter</button>
            <input 
              type="text" 
              placeholder="Pencarian Global (Nama, Email)..." 
              value={reportSearchQuery}
              onChange={e => setReportSearchQuery(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', minWidth: '250px' }}
            />
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Karyawan</th>
                <th>Email</th>
                <th>Tipe Absen</th>
                <th>Jam Masuk</th>
                <th>Jam Keluar</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.map(r => (
                <tr key={r.id}>
                  <td><strong>{new Date(r.date).toLocaleDateString()}</strong></td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.attendanceType === 'MULTI' ? 'Multi-Shift' : 'Single-Shift'}</td>
                  <td>{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '-'}</td>
                  <td>{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '-'}</td>
                </tr>
              ))}
              {filteredReport.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Tidak ada riwayat absensi yang ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2>MongoDB Audit Logs: Profile Updates</h2>
          <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>User ID</th>
                  <th>Detail Perubahan</th>
                </tr>
              </thead>
              <tbody>
                {auditProfile.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log._receivedAt).toLocaleString()}</td>
                    <td>
                      <strong>{employees.find(e => e.id === log.userId)?.name || 'Unknown User'}</strong><br/>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.userId.split('-')[0]}...</span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto' }}
                        onClick={() => setSelectedLog(log)}
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>MongoDB Audit Logs: Attendance</h2>
          <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead><tr><th>Waktu</th><th>User ID</th><th>Aksi</th></tr></thead>
              <tbody>
                {auditAttendance.map(log => (
                  <tr key={log._id}>
                    <td>{new Date(log._receivedAt).toLocaleString()}</td>
                    <td>
                      <strong>{employees.find(e => e.id === log.userId)?.name || 'Unknown User'}</strong><br/>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.userId.split('-')[0]}...</span>
                    </td>
                    <td>{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Popup Detail Perubahan */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedLog(null)}>&times;</button>
            <h2 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '1.5rem' }}>Detail Perubahan Profil</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.1rem' }}>
              <div>
                <strong>Nama Karyawan:</strong><br />
                {employees.find(e => e.id === selectedLog.userId)?.name || 'Unknown User'}
                <br />
                <code style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', marginTop: '0.25rem', display: 'inline-block' }}>{selectedLog.userId}</code>
              </div>
              
              <div>
                <strong>Perubahan Nomor HP:</strong><br />
                {selectedLog.changes?.phone ? (
                  <span>📱 {selectedLog.changes.phone}</span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Tidak ada perubahan</span>
                )}
              </div>

              <div>
                <strong>Perubahan Foto Profil:</strong><br />
                {selectedLog.changes?.photoUrl ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img 
                      src={selectedLog.changes.photoUrl} 
                      alt="New Avatar" 
                      style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #cbd5e1' }} 
                    />
                    <br />
                    <a href={selectedLog.changes.photoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                      Buka Tautan Asli (MinIO)
                    </a>
                  </div>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Tidak ada perubahan</span>
                )}
              </div>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => setSelectedLog(null)}>Tutup</button>
          </div>
        </div>
      )}

    </div>
  );
}
