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

  useEffect(() => {
    if (!token || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    
    fetchEmployees();
    fetchLogs();

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
          <h2>Daftar Karyawan (Live Status)</h2>
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
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2>MongoDB Audit Logs: Profile Updates</h2>
          <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead><tr><th>Waktu</th><th>User ID</th><th>Perubahan HP</th></tr></thead>
              <tbody>
                {auditProfile.map(log => (
                  <tr key={log._id}><td>{new Date(log._receivedAt).toLocaleString()}</td><td>{log.userId}</td><td>{log.changes?.phone || '-'}</td></tr>
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
                  <tr key={log._id}><td>{new Date(log._receivedAt).toLocaleString()}</td><td>{log.userId}</td><td>{log.action}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
