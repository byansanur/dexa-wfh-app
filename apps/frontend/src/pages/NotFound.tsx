import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface)',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid var(--border)'
      }}>
        <h1 style={{ color: 'var(--stone)', fontSize: '64px', margin: '0 0 16px 0', fontWeight: 'bold' }}>
          404
        </h1>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-main)' }}>
          Halaman Tidak Ditemukan
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.5' }}>
          Halaman yang Anda cari mungkin telah dihapus, diubah namanya, atau tidak pernah ada.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button onClick={() => navigate(-1)} variant="secondary">
            Kembali
          </Button>
          <Button onClick={() => navigate('/')} variant="primary">
            Ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
