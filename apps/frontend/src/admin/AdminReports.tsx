import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import Pagination from './components/Pagination';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

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
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (token) {
      if (reportSearchQuery.length === 0 || reportSearchQuery.length >= 3) {
        fetchReport();
      }
    }
  }, [token, page, limit, reportSearchQuery]);

  const fetchReport = async () => {
    let url = `/admin/reports/attendance`;
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
      <Card style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="flex justify-between items-center gap-3" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--sp-2)', marginBottom: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <h2 style={{ borderBottom: 'none', paddingBottom: 0, margin: 0 }}>Laporan Riwayat Absensi (Agregat)</h2>
          <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2">
              <label className="text-secondary" style={{ fontSize: '13px' }}>Dari:</label>
              <Input type="date" max={getToday()} value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} containerStyle={{ marginBottom: 0 }} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-secondary" style={{ fontSize: '13px' }}>Sampai:</label>
              <Input type="date" max={getToday()} value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} containerStyle={{ marginBottom: 0 }} />
              <select 
                value={limit} 
                onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} 
                style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-sunken)', fontSize: '15px' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <Button variant="primary" style={{ height: '44px' }} onClick={handleFilterSubmit}>Terapkan Filter</Button>
            <Input 
              type="text" 
              placeholder="Pencarian Global (Nama, Email)..." 
              value={reportSearchQuery}
              onChange={e => {
                setReportSearchQuery(e.target.value);
                setPage(1);
              }}
              onKeyDown={e => e.key === 'Enter' && handleFilterSubmit()}
              containerStyle={{ marginBottom: 0, minWidth: '250px' }}
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
      </Card>
    </div>
  );
}
