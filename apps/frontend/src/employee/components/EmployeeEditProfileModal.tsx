import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface EmployeeEditProfileModalProps {
  user: any;
  phone: string;
  setPhone: (val: string) => void;
  photoFile: File | null;
  setPhotoFile: (val: File | null) => void;
  
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EmployeeEditProfileModal(props: EmployeeEditProfileModalProps) {
  const {
    user, phone, setPhone, photoFile, setPhotoFile,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    onClose, onSubmit
  } = props;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <Card style={{ width: '100%', maxWidth: '600px', margin: '0 var(--sp-3)', padding: 'var(--sp-4)' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: 'var(--sp-4)' }}>Edit Profile and Password</h2>
        
        <form onSubmit={onSubmit}>
          <h4 style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--sp-2)' }}>Profile Information</h4>
          
          <div className="flex gap-4" style={{ marginBottom: 'var(--sp-4)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '90px', height: '90px', marginBottom: 'var(--sp-2)' }}>
                {photoFile ? (
                    <img src={URL.createObjectURL(photoFile)} alt="Preview" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : user.photoUrl ? (
                  <img src={user.photoUrl} alt="Profil" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sage)', fontSize: '28px' }}>
                    {user.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <label style={{ color: '#2563EB', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                Change Photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <Input 
                label="Phone Number (Nomor Handphone)"
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} 
                pattern="^[0-9]{10,15}$"
                title="Nomor HP harus berupa angka dengan panjang 10 hingga 15 karakter."
              />
            </div>
          </div>
          
          <h4 style={{ marginBottom: 'var(--sp-3)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--sp-2)' }}>Change Password</h4>
          
          <div className="flex gap-3" style={{ marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <Input label="Current Password" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <Input label="New Password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <Input label="Confirm New Password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          
          <div className="flex justify-between" style={{ justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
