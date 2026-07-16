import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Pagination from './components/Pagination';

const socket = io('http://localhost:3000');

export default function AdminLogs() {
  const [token] = useState(() => localStorage.getItem('token'));
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [auditProfile, setAuditProfile] = useState<any[]>([]);
  const [auditAttendance, setAuditAttendance] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const [profilePage, setProfilePage] = useState(1);
  const [profileTotalPages, setProfileTotalPages] = useState(1);
  
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceTotalPages, setAttendanceTotalPages] = useState(1);
  
  const [limit] = useState(10);

  useEffect(() => {
    if (token) fetchEmployees();
  }, [token]);

  useEffect(() => {
    if (token) fetchProfileLogs();
  }, [token, profilePage]);

  useEffect(() => {
    if (token) fetchAttendanceLogs();
  }, [token, attendancePage]);

  useEffect(() => {
    socket.on('connect', () => console.log('WS AdminLogs Connected'));
    socket.on('ProfileUpdated', () => { 
      fetchEmployees(); 
      setTimeout(() => fetchProfileLogs(), 500); 
    });
    socket.on('AttendanceLogged', () => { 
      fetchEmployees(); 
      setTimeout(() => fetchAttendanceLogs(), 500); 
    });

    return () => {
      socket.off('connect');
      socket.off('ProfileUpdated');
      socket.off('AttendanceLogged');
    };
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch('http://localhost:3000/admin/employees?limit=1000', { headers: { 'Authorization': `Bearer ${token}` } });
    if(res.ok) {
      const result = await res.json();
      setEmployees(result.data || []);
    }
  };

  const fetchProfileLogs = async () => {
    const res = await fetch(`http://localhost:3000/audit-log/profile?page=${profilePage}&limit=${limit}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if(res.ok) {
      const result = await res.json();
      setAuditProfile(result.data);
      setProfileTotalPages(result.meta.totalPages);
    }
  };

  const fetchAttendanceLogs = async () => {
    const res = await fetch(`http://localhost:3000/audit-log/attendance?page=${attendancePage}&limit=${limit}`, { headers: { 'Authorization': `Bearer ${token}` } });
    if(res.ok) {
      const result = await res.json();
      setAuditAttendance(result.data);
      setAttendanceTotalPages(result.meta.totalPages);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>MongoDB Audit Logs</h1>

      <div className="responsive-grid-1-1">
        <div className="card">
          <h2>Profile Updates</h2>
          <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
          <Pagination page={profilePage} totalPages={profileTotalPages} onPageChange={setProfilePage} />
        </div>

        <div className="card">
          <h2>Attendance</h2>
          <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
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
          <Pagination page={attendancePage} totalPages={attendanceTotalPages} onPageChange={setAttendancePage} />
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
