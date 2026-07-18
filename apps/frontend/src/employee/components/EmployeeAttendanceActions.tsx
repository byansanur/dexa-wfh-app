import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface EmployeeAttendanceActionsProps {
  currentTime: Date;
  onAttendance: (type: 'clock-in' | 'clock-out') => void;
}

export function EmployeeAttendanceActions({ currentTime, onAttendance }: EmployeeAttendanceActionsProps) {
  return (
    <Card>
      <h3 style={{ marginBottom: 'var(--sp-4)' }}>Absensi Hari Ini</h3>
      <div className="flex gap-3 flex-wrap" style={{ marginBottom: 'var(--sp-3)' }}>
        <Button 
          variant="success"
          size="lg"
          style={{ flex: 1, border: 'none' }} 
          onClick={() => onAttendance('clock-in')}
        >
          Clock In
        </Button>
        <Button 
          variant="destructive"
          size="lg"
          style={{ flex: 1 }} 
          onClick={() => onAttendance('clock-out')}
        >
          Clock Out
        </Button>
      </div>
      <div className="text-center text-secondary" style={{ fontSize: '14px' }}>
        {currentTime.toLocaleDateString('id-ID')} - {currentTime.toLocaleTimeString('id-ID')}
      </div>
    </Card>
  );
}
