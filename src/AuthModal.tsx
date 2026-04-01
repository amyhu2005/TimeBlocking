import React, { useState } from 'react';
import { useTimeBlockingStore } from './store';

interface AuthModalProps {
  store: ReturnType<typeof useTimeBlockingStore>;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ store, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user || !pass) {
      setError('Please enter both username and password');
      return;
    }
    
    if (mode === 'signup') {
      const res = await store.signup(user, pass);
      if (!res.success) setError(res.message || 'Signup failed');
      else onClose();
    } else {
      const res = await store.login(user, pass);
      if (!res.success) setError(res.message || 'Login failed');
      else onClose();
    }
  };

  return (
    <div className="tb-modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="tb-modal" onClick={e => e.stopPropagation()} style={{ 
        maxWidth: '420px', 
        width: '90%', 
        borderRadius: '28px', 
        padding: '2.5rem',
        background: 'white', 
        color: '#1E293B',
        boxShadow: '0 30px 60px rgba(15, 23, 42, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'var(--tb-text)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem auto', fontSize: '1.5rem', fontWeight: 800 }}>TB</div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 850, letterSpacing: '-0.5px' }}>
            {mode === 'login' ? 'Welcome Back' : 'Join TimeBlock'}
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 500 }}>
            {mode === 'login' ? 'Sign in to sync your schedule' : 'Create an account to start socializing'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="tb-input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.5px' }}>Username</label>
            <input 
              type="text" 
              placeholder="@yourhandle" 
              value={user} 
              onChange={e => setUser(e.target.value)}
              className="tb-input"
              style={{ width: '100%', fontSize: '1rem', padding: '0.9rem 1.2rem', borderRadius: '14px', border: '1.5px solid #F1F5F9', background: '#F8FAFC', transition: 'border-color 0.2s' }}
            />
          </div>

          <div className="tb-input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.5px' }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={pass} 
              onChange={e => setPass(e.target.value)}
              className="tb-input"
              style={{ width: '100%', fontSize: '1rem', padding: '0.9rem 1.2rem', borderRadius: '14px', border: '1.5px solid #F1F5F9', background: '#F8FAFC' }}
            />
          </div>

          {error && <div style={{ color: '#EF4444', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>{error}</div>}

          <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', padding: '1rem', borderRadius: '14px', marginTop: '0.5rem' }}>
             <p style={{ margin: 0, fontSize: '0.75rem', color: '#9A3412', lineHeight: 1.4, fontWeight: 600 }}>
               ⚠️ <strong>IMPORTANT:</strong> Take a screenshot of your password now! We cannot recover passwords at this stage of the PWA development.
             </p>
          </div>

          <button 
            type="submit"
            className="tb-btn tb-btn-primary" 
            style={{ width: '100%', padding: '1.1rem', borderRadius: '16px', fontSize: '1rem', fontWeight: 800, marginTop: '0.5rem', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.2)' }}
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#64748B' }}>
          {mode === 'login' ? "Don't have an account?" : "Already have an account?"} {' '}
          <button 
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--tb-text)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
          >
            {mode === 'login' ? 'Join Now' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
