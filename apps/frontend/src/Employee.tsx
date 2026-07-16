import { useState, useEffect } from 'react';
import { apiFetch } from './utils/api';
import { useNavigate } from 'react-router-dom';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';

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
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/employee/profile');
      if (res.ok) {
        const latestUser = await res.json();
        localStorage.setItem('user', JSON.stringify(latestUser));
        setUser(latestUser);
        setPhone(latestUser.phone || '');
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const url = `/employee/attendance/history?${params.toString()}`;
      const res = await apiFetch(url);
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

      const res = await apiFetch('/employee/profile', {
        method: 'PUT',
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
      const res = await apiFetch(`/attendance/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="flex justify-between items-center gap-3 flex-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
        <h1 style={{ margin: 0 }}>Karyawan: {user.name}</h1>
        <Button variant="destructive" onClick={() => { localStorage.clear(); navigate('/login') }}>Logout</Button>
      </div>
      
      <div className="dashboard-grid">
        <Card>
          <h2>Absensi Harian</h2>
          <div className="flex gap-2" style={{ marginBottom: 'var(--sp-4)' }}>
            <Button variant="primary" onClick={() => handleAttendance('clock-in')}>Clock In</Button>
            <Button variant="destructive" onClick={() => handleAttendance('clock-out')}>Clock Out</Button>
          </div>
          
          <h2>Update Profil</h2>
          <form onSubmit={handleUpdateProfile}>
            <Input 
              label="Nomor Telepon"
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
            {user.photoUrl && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--sage)', display: 'block', marginBottom: '6px' }}>Foto Saat Ini</label>
                <img src={user.photoUrl} alt="Profil" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
              </div>
            )}
            <Input 
              label="Ganti Foto (MinIO)"
              type="file" 
              accept="image/*" 
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} 
            />
            <Button type="submit">Simpan Profil</Button>
          </form>
        </Card>

        <Card>
          <div className="flex justify-between items-center gap-3 flex-wrap" style={{ marginBottom: 'var(--sp-3)' }}>
            <h2 style={{ margin: 0 }}>Riwayat Absensi Anda</h2>
            <div className="flex gap-2 items-center flex-wrap">
              <Input type="date" max={getToday()} value={startDate} onChange={e => setStartDate(e.target.value)} containerStyle={{ marginBottom: 0 }} />
              <span>-</span>
              <Input type="date" max={getToday()} value={endDate} onChange={e => setEndDate(e.target.value)} containerStyle={{ marginBottom: 0 }} />
              <Button onClick={fetchHistory} style={{ height: '44px' }}>Filter</Button>
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
        </Card>
      </div>
    </div>
  );
}
