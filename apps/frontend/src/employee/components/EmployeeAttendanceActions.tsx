import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface EmployeeAttendanceActionsProps {
  currentTime: Date;
  onAttendance: (type: 'clock-in' | 'clock-out', location?: string) => void;
}

export function EmployeeAttendanceActions({ currentTime, onAttendance }: EmployeeAttendanceActionsProps) {
  const handleLocationAndAttend = (type: 'clock-in' | 'clock-out') => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung fitur lokasi (GPS).');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude},${longitude}`;
        onAttendance(type, locationString);
      },
      (error) => {
        alert('Anda harus mengizinkan akses lokasi untuk melakukan absensi.');
        console.error('Geolocation Error:', error);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <Card>
      <h3 style={{ marginBottom: 'var(--sp-4)' }}>Absensi Hari Ini</h3>
      <div className="flex gap-3 flex-wrap" style={{ marginBottom: 'var(--sp-3)' }}>
        <Button 
          variant="success"
          size="lg"
          style={{ flex: 1, border: 'none' }} 
          onClick={() => handleLocationAndAttend('clock-in')}
        >
          Clock In
        </Button>
        <Button 
          variant="destructive"
          size="lg"
          style={{ flex: 1 }} 
          onClick={() => handleLocationAndAttend('clock-out')}
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
