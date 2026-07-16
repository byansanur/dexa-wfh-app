import { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (token) fetchReport();
  }, [token]);

  const fetchReport = async () => {
    let url = 'http://localhost:3000/admin/reports/attendance';
    const params = new URLSearchParams();
    if (reportStartDate) params.append('startDate', reportStartDate);
    if (reportEndDate) params.append('endDate', reportEndDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setReportData(await res.json());
  };

  const filteredReport = reportData.filter(r => {
    if (!reportSearchQuery) return true;
    const q = reportSearchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.attendanceType?.toLowerCase().includes(q)
    );
  });

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
            </div>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto' }} onClick={fetchReport}>Terapkan Filter</button>
            <input 
              type="text" 
              placeholder="Pencarian Global (Nama, Email)..." 
              value={reportSearchQuery}
              onChange={e => setReportSearchQuery(e.target.value)}
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
              {filteredReport.map(r => (
                <tr key={r.id}>
                  <td><strong>{new Date(r.date).toLocaleDateString()}</strong></td>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.attendanceType === 'MULTI' ? 'Multi-Shift' : 'Single-Shift'}</td>
                  <td>{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '-'}</td>
                  <td>{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '-'}</td>
                </tr>
              ))}
              {filteredReport.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Tidak ada riwayat absensi yang ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
