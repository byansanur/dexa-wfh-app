import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { apiFetch } from '../../utils/api';

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    }
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="flex justify-between items-center gap-3 flex-wrap" style={{ 
      marginBottom: 'var(--sp-4)', 
      background: 'var(--surface-raised)',
      padding: 'var(--sp-2) var(--sp-3)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-default)'
    }}>
      <div className="flex items-center gap-3">
        <div style={{ 
          width: '36px', height: '36px', background: 'var(--stone)', borderRadius: '50%', 
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontWeight: 'bold', fontSize: '18px' 
        }}>
          D
        </div>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Karyawan: {userName}</h2>
      </div>
      <Button variant="destructive" onClick={handleLogout}>Logout</Button>
    </header>
  );
}
