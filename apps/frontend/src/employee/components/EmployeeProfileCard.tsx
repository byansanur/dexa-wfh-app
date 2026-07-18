import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface EmployeeProfileCardProps {
  user: any;
  onEditClick: () => void;
}

export function EmployeeProfileCard({ user, onEditClick }: EmployeeProfileCardProps) {
  return (
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
          <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{user.phone || '-'}</p>
          <p style={{ margin: 0, fontSize: '14px' }}><strong>Jam Masuk:</strong> {user.officeHourStart || '08:00'}</p>
        </div>
        
        <Button fullWidth variant="primary" onClick={onEditClick}>Edit Profil</Button>
      </div>
    </Card>
  );
}
