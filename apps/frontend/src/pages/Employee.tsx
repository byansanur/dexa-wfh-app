import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/ui/Header';
import { socket } from '../utils/socket';
import { EmployeeProfileCard } from '../employee/components/EmployeeProfileCard';
import { EmployeeAttendanceActions } from '../employee/components/EmployeeAttendanceActions';
import { EmployeeHistoryTable } from '../employee/components/EmployeeHistoryTable';
import { EmployeeEditProfileModal } from '../employee/components/EmployeeEditProfileModal';

export default function Employee() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  
  const [phone, setPhone] = useState(user?.phone || '');
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
    if (!user || user.role !== 'EMPLOYEE') {
      navigate('/login');
      return;
    }
    
    socket.connect();
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
      socket.disconnect();
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

  const handleAttendance = async (type: 'clock-in' | 'clock-out', location?: string) => {
    try {
      const res = await apiFetch(`/attendance/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
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

  if (!user || user.role !== 'EMPLOYEE') return null;

  return (
    <div className="container">
      <Header userName={user.name} />
      
      <div className="dashboard-grid">
        <div className="flex-col gap-4" style={{ display: 'flex' }}>
          <EmployeeProfileCard 
            user={user} 
            onEditClick={() => setIsEditingProfile(true)} 
          />
        </div>

        <div className="flex-col gap-4" style={{ display: 'flex' }}>
          <EmployeeAttendanceActions 
            currentTime={currentTime} 
            onAttendance={handleAttendance} 
          />
          <EmployeeHistoryTable 
            history={history}
            startDate={startDate}
            endDate={endDate}
            maxDate={getToday()}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onFilter={fetchHistory}
          />
        </div>
      </div>

      {isEditingProfile && (
        <EmployeeEditProfileModal 
          user={user}
          phone={phone}
          setPhone={setPhone}
          photoFile={photoFile}
          setPhotoFile={setPhotoFile}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          onClose={() => {
            setIsEditingProfile(false);
            setPhone(user.phone || '');
            setPhotoFile(null);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}
          onSubmit={handleUpdateProfile}
        />
      )}
    </div>
  );
}
