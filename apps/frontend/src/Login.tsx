import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './utils/api';
import { Card } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    } catch (err) {
      alert('Login Gagal. Pastikan email dan password benar.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <Card>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--sp-4)' }}>Masuk ke Portal WFH</h2>
        <form onSubmit={handleLogin}>
          <Input 
            label="Email Address"
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <Input 
            label="Password"
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <Button type="submit" fullWidth style={{ marginTop: 'var(--sp-2)' }}>
            Log In
          </Button>
        </form>
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--stone)', textAlign: 'center' }}>
          Portal Absensi WFH Dexa Group. Harap hubungi Admin jika Anda belum memiliki akun atau lupa kata sandi.
        </p>
      </Card>
    </div>
  );
}
