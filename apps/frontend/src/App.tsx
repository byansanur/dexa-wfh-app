import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './index.css';

const socket = io('http://localhost:3000');

function App() {
  const [phone, setPhone] = useState('08123456789');
  const [photoUrl, setPhotoUrl] = useState('http://example.com/photo.jpg');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Admin Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:3000/admin/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (e) {
      console.error("Failed to fetch employees", e);
    }
  };

  useEffect(() => {
    fetchEmployees();

    socket.on('connect', () => console.log('WebSocket Connected'));

    socket.on('ProfileUpdated', (user) => {
      showToast(`User ${user.name || user.id} updated their profile!`);
      fetchEmployees(); // Refresh data
    });

    socket.on('AttendanceLogged', (attendance) => {
      showToast(`User ${attendance.user?.name || attendance.userId} just clocked ${attendance.clockOut ? 'out' : 'in'}.`);
      fetchEmployees(); // Refresh data
    });

    return () => {
      socket.off('connect');
      socket.off('ProfileUpdated');
      socket.off('AttendanceLogged');
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      if (photoFile) {
        formData.append('photo', photoFile);
      } else {
        formData.append('photoUrl', photoUrl);
      }

      const response = await fetch('http://localhost:3000/employee/profile', {
        method: 'PUT',
        body: formData, // fetch will automatically set the correct multipart boundary headers
      });
      if (!response.ok) throw new Error('API Error');
    } catch (error) {
      alert('Gagal update profile.');
    }
  };

  const handleClockIn = async () => {
    try {
      await fetch('http://localhost:3000/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (error) {
      alert('Gagal Clock In');
    }
  };

  const handleClockOut = async () => {
    try {
      await fetch('http://localhost:3000/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (error) {
      alert('Gagal Clock Out');
    }
  };

  return (
    <div className="container">
      <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Dexa WFH Portal</h1>
      <div className="dashboard-grid">
        
        {/* Kolom Karyawan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h2>🧑‍💻 Employee: Actions</h2>
            <div className="btn-group" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              <button className="btn btn-success" onClick={handleClockIn}>Clock In</button>
              <button className="btn btn-danger" onClick={handleClockOut}>Clock Out</button>
            </div>
            
            <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '1rem', color: '#64748b' }}>Update Profile</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Upload New Photo (MinIO)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} 
                />
              </div>
              <button className="btn" type="submit">Save Profile</button>
            </form>
          </div>
        </div>

        {/* Kolom HR/Admin */}
        <div className="card">
          <h2>👑 HR Admin: Live Dashboard</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Phone</th>
                  <th>Status (Today)</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No data available</td>
                  </tr>
                )}
                {employees.map((emp) => {
                  const todayAtt = emp.Attendances?.[0];
                  const hasClockedIn = !!todayAtt?.clockIn;
                  
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img 
                            src={emp.photoUrl || 'https://ui-avatars.com/api/?name=' + emp.name} 
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                            alt="" 
                          />
                          <span style={{ fontWeight: 500 }}>{emp.name}</span>
                        </div>
                      </td>
                      <td>{emp.phone || '-'}</td>
                      <td>
                        <span className={`status-badge ${hasClockedIn ? 'status-present' : 'status-absent'}`}>
                          {hasClockedIn ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td>{todayAtt?.clockIn ? new Date(todayAtt.clockIn).toLocaleTimeString() : '-'}</td>
                      <td>{todayAtt?.clockOut ? new Date(todayAtt.clockOut).toLocaleTimeString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {toast && (
        <div className="notification-toast">
          🔔 {toast}
        </div>
      )}
    </div>
  );
}

export default App;
