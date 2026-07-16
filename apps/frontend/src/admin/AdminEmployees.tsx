import { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import Pagination from './components/Pagination';
import { apiFetch } from '../utils/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function AdminEmployees() {
  const [token] = useState(() => localStorage.getItem('token'));
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [attendanceType, setAttendanceType] = useState('SINGLE');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    if (token) fetchEmployees();
  }, [token, page, searchQuery]);

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
    let url = `/admin/employees?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`;

    const res = await apiFetch(url);
    if(res.ok) {
      const result = await res.json();
      setEmployees(result.data);
      setTotalPages(result.meta.totalPages);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/admin/employee', {
      method: 'POST',
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
    await apiFetch('/admin/employee/bulk', {
      method: 'POST',
      body: formData
    });
    alert('Bulk Import Sukses!');
    fetchEmployees();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset page on search
  };

  const handleEditClick = (emp: any) => {
    setEditingEmployee({ ...emp });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    await apiFetch(`/admin/employee/${editingEmployee.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: editingEmployee.name,
        email: editingEmployee.email,
        phone: editingEmployee.phone,
        attendanceType: editingEmployee.attendanceType,
        role: 'EMPLOYEE'
      })
    });
    alert('Data Karyawan Berhasil Diperbarui!');
    setEditingEmployee(null);
    fetchEmployees();
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '2rem' }}>Manajemen Karyawan</h1>

      <div className="responsive-grid-1-1" style={{ marginBottom: 'var(--sp-4)' }}>
        {/* Card 1: Tambah Single */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: 0 }}>Tambah Karyawan (Single)</h2>
          <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Input 
              label="Email"
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <Input 
              label="Nama Lengkap"
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--sage)', marginBottom: '6px' }}>Tipe Absensi</label>
              <select 
                value={attendanceType} 
                onChange={e => setAttendanceType(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-sunken)', width: '100%', fontSize: '15px' }}
              >
                <option value="SINGLE">Single-Shift (1x per Hari)</option>
                <option value="MULTI">Multi-Shift (Lebih dari 1x)</option>
              </select>
            </div>
            <Button type="submit" variant="primary" style={{ marginTop: 'auto' }}>Simpan Karyawan</Button>
          </form>
        </Card>

        {/* Card 2: Bulk Upload */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: 0 }}>Bulk Upload (CSV)</h2>
          <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>Unggah file CSV untuk mengimpor banyak karyawan sekaligus secara instan.</p>
          <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--sage)' }}>Format Header CSV:</span><br/>
            <code style={{ fontSize: '13px', color: 'var(--stone)' }}>email,name,attendanceType</code>
          </div>
          <form onSubmit={handleBulkUpload} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Input 
              label="Pilih File CSV"
              type="file" 
              accept=".csv" 
              onChange={e => setCsvFile(e.target.files?.[0] || null)} 
              required 
            />
            <Button variant="primary" type="submit" style={{ marginTop: 'auto' }}>Import CSV Sekarang</Button>
          </form>
        </Card>
      </div>

      {/* Card Tabel Karyawan di bawah */}
      <Card>
        <div className="flex justify-between items-center gap-3" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--sp-2)', marginBottom: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Daftar Karyawan Terdaftar</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '300px' }}>
            <Input 
              type="text" 
              placeholder="Cari Nama / Email..." 
              value={searchQuery}
              onChange={handleSearchChange}
              containerStyle={{ marginBottom: 0 }}
            />
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
                <th>Aksi</th>
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
                  <td>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleEditClick(emp)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Data karyawan tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="modal-overlay" onClick={() => setEditingEmployee(null)}>
          <Card elevated onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: 'var(--sp-4)' }}>
            <h2 style={{ marginTop: 0 }}>Edit Karyawan</h2>
            <form onSubmit={handleEditSubmit}>
              <Input 
                label="Email"
                type="email" 
                value={editingEmployee.email} 
                onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})} 
                required 
              />
              <Input 
                label="Nama Lengkap"
                type="text" 
                value={editingEmployee.name} 
                onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} 
                required 
              />
              <Input 
                label="Nomor HP"
                type="text" 
                value={editingEmployee.phone || ''} 
                onChange={e => setEditingEmployee({...editingEmployee, phone: e.target.value})} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '1rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--sage)', marginBottom: '6px' }}>Tipe Absensi</label>
                <select 
                  value={editingEmployee.attendanceType} 
                  onChange={e => setEditingEmployee({...editingEmployee, attendanceType: e.target.value})}
                  style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-sunken)', width: '100%', fontSize: '15px' }}
                >
                  <option value="SINGLE">Single-Shift (1x per Hari)</option>
                  <option value="MULTI">Multi-Shift (Lebih dari 1x)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <Button type="button" variant="ghost" onClick={() => setEditingEmployee(null)}>Batal</Button>
                <Button type="submit" variant="primary">Simpan Perubahan</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
