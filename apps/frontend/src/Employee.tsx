import { useState, useEffect } from 'react';
import { apiFetch } from './utils/api';
import { useNavigate } from 'react-router-dom';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Chip } from './components/ui/Chip';
import { Header } from './components/ui/Header';
import { socket } from './utils/socket';

export default function Employee() {
  const navigate = useNavigate();
  const [token] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  
  const [phone, setPhone] = useState(user.phone || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    
    socket.on('connect', () => console.log('WS Employee Connected'));
    socket.on('AutoClockOut', (data: any) => {
      const currentProfile = JSON.parse(localStorage.getItem('user') || '{}');
      if (data.userId === currentProfile.id) {
        alert('Sistem telah melakukan Clock Out otomatis karena pergantian hari. Silakan Clock In kembali jika Anda sedang bekerja lembur/overtime.');
        fetchHistory();
      }
    });

    fetchProfile();
    fetchHistory();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      socket.off('connect');
      socket.off('AutoClockOut');
    };
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

      // Password Validation if user intends to change password
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          alert('Mohon isi semua kolom kata sandi untuk mengubah kata sandi.');
          return;
        }
        if (newPassword !== confirmPassword) {
          alert('Kata sandi baru dan konfirmasi kata sandi tidak cocok!');
          return;
        }
        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
      }

      const res = await apiFetch('/employee/profile', {
        method: 'PUT',
        body: formData,
      });
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setPhone(updatedUser.phone || '');
        
        // Reset password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        setIsEditingProfile(false);
        alert('Profil Berhasil Diperbarui!');
      } else {
        const errObj = await res.json();
        throw new Error(errObj.message || 'Update profile failed');
      }
    } catch (error: any) {
      alert(`Gagal menyimpan perubahan: ${error.message || 'Error tidak diketahui'}`);
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
      <Header userName={user.name} />
      
      {/* Grid Layout */}
      <div className="dashboard-grid">
        
        {/* Left Column: Profile */}
        <div className="flex-col gap-4" style={{ display: 'flex' }}>
          <Card>
            <h3 style={{ marginBottom: 'var(--sp-4)' }}>Profil Anda</h3>
            
            <div className="flex-col items-center text-center" style={{ display: 'flex' }}>
              {user.photoUrl ? (
                <img src={user.photoUrl} alt="Profil" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: 'var(--sp-3)', border: '2px solid var(--border-default)' }} />
              ) : (
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--surface-sunken)', border: '2px solid var(--border-default)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sage)', fontSize: '40px' }}>
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              
              <h3 style={{ margin: '0 0 var(--sp-1) 0' }}>{user.name}</h3>
              <p className="text-secondary" style={{ marginBottom: 'var(--sp-3)' }}>{user.role === 'EMPLOYEE' ? 'Karyawan' : user.role}</p>
              
              <div style={{ width: '100%', marginBottom: 'var(--sp-4)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{user.email}</p>
                <p style={{ margin: 0, fontSize: '14px' }}>{user.phone || '-'}</p>
              </div>
              
              <Button fullWidth variant="primary" onClick={() => setIsEditingProfile(true)}>Edit Profil</Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Attendance */}
        <div className="flex-col gap-4" style={{ display: 'flex' }}>
          
          <Card>
            <h3 style={{ marginBottom: 'var(--sp-4)' }}>Absensi Hari Ini</h3>
            <div className="flex gap-3 flex-wrap" style={{ marginBottom: 'var(--sp-3)' }}>
              <Button 
                variant="success"
                size="lg"
                style={{ flex: 1, border: 'none' }} 
                onClick={() => handleAttendance('clock-in')}
              >
                Clock In
              </Button>
              <Button 
                variant="destructive"
                size="lg"
                style={{ flex: 1 }} 
                onClick={() => handleAttendance('clock-out')}
              >
                Clock Out
              </Button>
            </div>
            <div className="text-center text-secondary" style={{ fontSize: '14px' }}>
              {currentTime.toLocaleDateString('id-ID')} - {currentTime.toLocaleTimeString('id-ID')}
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-center gap-3 flex-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
              <h3 style={{ margin: 0 }}>Riwayat Absensi Anda</h3>
              <div className="flex gap-2 items-center flex-wrap">
                <div>
                  <label className="text-secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Start Date</label>
                  <Input 
                    type="date" 
                    max={getToday()} 
                    value={startDate} 
                    onChange={e => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                    }} 
                    containerStyle={{ marginBottom: 0 }} 
                  />
                </div>
                <div>
                  <label className="text-secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>End Date</label>
                  <Input 
                    type="date" 
                    min={startDate}
                    max={getToday()} 
                    value={endDate} 
                    onChange={e => {
                      setEndDate(e.target.value);
                      if (startDate && e.target.value < startDate) setStartDate(e.target.value);
                    }} 
                    containerStyle={{ marginBottom: 0 }} 
                  />
                </div>
                <Button onClick={fetchHistory} style={{ height: '44px', alignSelf: 'flex-end' }}>Filter</Button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(att => (
                    <tr key={att.id}>
                      <td><strong>{new Date(att.date).toLocaleDateString()}</strong></td>
                      <td>{att.clockIn ? new Date(att.clockIn).toLocaleTimeString() : '-'}</td>
                      <td>{att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : '-'}</td>
                      <td>
                        {att.clockOut ? (
                           <Chip type="status" status="present">Selesai</Chip>
                        ) : (
                           <Chip type="status" status="draft">Hadir</Chip>
                        )}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 'var(--sp-4)', color: 'var(--sage)' }}>Tidak ada data riwayat absensi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <Card style={{ width: '100%', maxWidth: '600px', margin: '0 var(--sp-3)', padding: 'var(--sp-4)' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: 'var(--sp-4)' }}>Edit Profile and Password</h2>
            
            <form onSubmit={handleUpdateProfile}>
              <h4 style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--sp-2)' }}>Profile Information</h4>
              
              <div className="flex gap-4" style={{ marginBottom: 'var(--sp-4)', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: 'var(--sp-2)' }}>
                    {photoFile ? (
                       <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : user.photoUrl ? (
                      <img src={user.photoUrl} alt="Profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sage)', fontSize: '28px' }}>
                        {user.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <label style={{ color: '#2563EB', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                    Change Photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Input 
                    label="Phone Number (Nomor Handphone)"
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} 
                    pattern="^[0-9]{10,15}$"
                    title="Nomor HP harus berupa angka dengan panjang 10 hingga 15 karakter."
                  />
                </div>
              </div>
              
              <h4 style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--sp-2)' }}>Change Password</h4>
              
              <div className="flex gap-3" style={{ marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <Input label="Current Password" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <Input label="New Password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: '130px' }}>
                  <Input label="Confirm New Password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              
              <div className="flex justify-between" style={{ justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                <Button type="button" variant="secondary" onClick={() => {
                  setIsEditingProfile(false);
                  setPhone(user.phone || '');
                  setPhotoFile(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}>Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
