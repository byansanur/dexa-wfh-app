import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Pagination from './components/Pagination';
import { apiFetch } from '../utils/api';

const socket = io(`${import.meta.env.VITE_API_URL}`);

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

      <div className="responsive-grid-1-1" style={{ marginBottom: '2rem' }}>
        {/* Card 1: Tambah Single */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: 0 }}>Tambah Karyawan (Single)</h2>
          <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>Simpan Karyawan</button>
          </form>
        </div>

        {/* Card 2: Bulk Upload */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginTop: 0 }}>Bulk Upload (CSV)</h2>
          <p className="helper-text" style={{ marginBottom: '1.5rem' }}>Unggah file CSV untuk mengimpor banyak karyawan sekaligus secara instan.</p>
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>Format Header CSV:</span><br/>
            <code style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>email,name,attendanceType</code>
          </div>
          <form onSubmit={handleBulkUpload} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="form-group">
              <label>Pilih File CSV</label>
              <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} required />
            </div>
            <button className="btn btn-success" type="submit" style={{ width: '100%', marginTop: 'auto' }}>Import CSV Sekarang</button>
          </form>
        </div>
      </div>

      {/* Card Tabel Karyawan di bawah */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Daftar Karyawan Terdaftar</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
            <input 
              type="text" 
              placeholder="Cari Nama / Email..." 
              value={searchQuery}
              onChange={handleSearchChange}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', maxWidth: '300px' }}
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
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                      onClick={() => handleEditClick(emp)}
                    >
                      Edit
                    </button>
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
      </div>

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="modal-overlay" onClick={() => setEditingEmployee(null)}>
          <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '500px', margin: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Edit Karyawan</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={editingEmployee.email} 
                  onChange={e => setEditingEmployee({...editingEmployee, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editingEmployee.name} 
                  onChange={e => setEditingEmployee({...editingEmployee, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Nomor HP</label>
                <input 
                  type="text" 
                  value={editingEmployee.phone || ''} 
                  onChange={e => setEditingEmployee({...editingEmployee, phone: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Tipe Absensi</label>
                <select 
                  value={editingEmployee.attendanceType} 
                  onChange={e => setEditingEmployee({...editingEmployee, attendanceType: e.target.value})}
                >
                  <option value="SINGLE">Single-Shift (1x per Hari)</option>
                  <option value="MULTI">Multi-Shift (Lebih dari 1x)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-danger" onClick={() => setEditingEmployee(null)}>Batal</button>
                <button type="submit" className="btn btn-success">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
