import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Employee() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  
  const [phone, setPhone] = useState(user.phone || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const getFirstDayOfMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };
  const getToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());

  useEffect(() => {
    if (!token || user.role !== 'EMPLOYEE') {
      navigate('/login');
      return;
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      let url = 'http://localhost:3000/employee/attendance/history';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      if (photoFile) formData.append('photo', photoFile);

      const res = await fetch('http://localhost:3000/employee/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setPhone(updatedUser.phone || '');
        alert('Profil Berhasil Diperbarui!');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      alert('Gagal update profile.');
    }
  };

  const handleAttendance = async (type: 'clock-in' | 'clock-out') => {
    try {
      const res = await fetch(`http://localhost:3000/attendance/${type}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal menyimpan absensi');
      }
      alert(`Berhasil ${type === 'clock-in' ? 'Clock In' : 'Clock Out'}`);
      fetchHistory();
    } catch (error: any) {
      alert(`Gagal melakukan ${type}: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)' }}>Karyawan: {user.name}</h1>
        <button className="btn btn-danger" style={{ width: 'auto' }} onClick={() => { localStorage.clear(); navigate('/login') }}>Logout</button>
      </div>
      
      <div className="dashboard-grid">
        <div className="card">
          <h2>Absensi Harian</h2>
          <div className="btn-group">
            <button className="btn btn-success" onClick={() => handleAttendance('clock-in')}>Clock In</button>
            <button className="btn btn-danger" onClick={() => handleAttendance('clock-out')}>Clock Out</button>
          </div>
          
          <h2 style={{ marginTop: '2rem' }}>Update Profil</h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>Nomor Telepon</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Ganti Foto (MinIO)</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
            <button className="btn" type="submit">Simpan Profil</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Riwayat Absensi Anda</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="date" max={getToday()} value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <span>-</span>
              <input type="date" max={getToday()} value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto' }} onClick={fetchHistory}>Filter</button>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                </tr>
              </thead>
              <tbody>
                {history.map(att => (
                  <tr key={att.id}>
                    <td>{new Date(att.date).toLocaleDateString()}</td>
                    <td>{att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : '-'}</td>
                    <td>{att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
