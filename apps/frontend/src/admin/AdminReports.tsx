import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import Pagination from './components/Pagination';

export default function AdminReports() {
  const [token] = useState(() => localStorage.getItem('token'));
  
  const getFirstDayOfMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  };
  const getToday = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const [reportStartDate, setReportStartDate] = useState(getFirstDayOfMonth());
  const [reportEndDate, setReportEndDate] = useState(getToday());
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    if (token) fetchReport();
  }, [token, page]); // Only refetch automatically when page or token changes

  const fetchReport = async () => {
    let url = `${import.meta.env.VITE_API_URL}/admin/reports/attendance`;
    const params = new URLSearchParams();
    if (reportStartDate) params.append('startDate', reportStartDate);
    if (reportEndDate) params.append('endDate', reportEndDate);
    if (reportSearchQuery) params.append('search', reportSearchQuery);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    url += `?${params.toString()}`;
    
    const res = await apiFetch(url);
    if(res.ok) {
      const result = await res.json();
      setReportData(result.data);
      setTotalPages(result.meta.totalPages);
    }
  };

  const handleFilterSubmit = () => {
    setPage(1); // Reset page on filter
    fetchReport();
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Laporan Riwayat Absensi (Agregat)</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Dari:</label>
              <input type="date" max={getToday()} value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Sampai:</label>
              <input type="date" max={getToday()} value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto' }} onClick={handleFilterSubmit}>Terapkan Filter</button>
            <input 
              type="text" 
              placeholder="Pencarian Global (Nama, Email)..." 
              value={reportSearchQuery}
              onChange={e => setReportSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFilterSubmit()}
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
              {reportData.map(r => (
                <tr key={r.id}>
                  <td><strong>{new Date(r.date).toLocaleDateString()}</strong></td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.attendanceType === 'MULTI' ? 'Multi-Shift' : 'Single-Shift'}</td>
                  <td>{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '-'}</td>
                  <td>{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '-'}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Tidak ada riwayat absensi yang ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
