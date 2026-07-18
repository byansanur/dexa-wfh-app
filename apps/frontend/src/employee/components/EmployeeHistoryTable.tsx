import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Chip } from '../../components/ui/Chip';

interface EmployeeHistoryTableProps {
  history: any[];
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onFilter: () => void;
  maxDate: string;
}

export function EmployeeHistoryTable({
  history, startDate, endDate, onStartDateChange, onEndDateChange, onFilter, maxDate
}: EmployeeHistoryTableProps) {
  return (
    <Card>
      <div className="flex justify-between items-center gap-3 flex-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
        <h3 style={{ margin: 0 }}>Riwayat Absensi Anda</h3>
        <div className="flex gap-2 items-center flex-wrap">
          <div>
            <label className="text-secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Start Date</label>
            <Input 
              type="date" 
              max={maxDate} 
              value={startDate} 
              onChange={e => {
                onStartDateChange(e.target.value);
                if (endDate && e.target.value > endDate) onEndDateChange(e.target.value);
              }} 
              containerStyle={{ marginBottom: 0 }} 
            />
          </div>
          <div>
            <label className="text-secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>End Date</label>
            <Input 
              type="date" 
              min={startDate}
              max={maxDate} 
              value={endDate} 
              onChange={e => {
                onEndDateChange(e.target.value);
                if (startDate && e.target.value < startDate) onStartDateChange(e.target.value);
              }} 
              containerStyle={{ marginBottom: 0 }} 
            />
          </div>
          <Button onClick={onFilter} style={{ height: '44px', alignSelf: 'flex-end' }}>Filter</Button>
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
  );
}
