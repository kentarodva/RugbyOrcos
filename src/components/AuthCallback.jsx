import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

function AuthCallback() {
  const [error] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        window.location.href = '/';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-root)', padding: '20px'
      }}>
        <div className="glass-panel" style={{
          width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center',
          borderRadius: 'var(--radius-lg)'
        }}>
          <h2 style={{ color: 'var(--color-red)', marginBottom: '15px' }}>Error de autenticacion</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>{error}</p>
          <a href="/" className="btn-neon" style={{ textDecoration: 'none', padding: '12px 24px', display: 'inline-block' }}>
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-root)', padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div className="neon-text-primary" style={{ fontSize: '2rem', marginBottom: '15px' }}>
          Verificando...
        </div>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Completando el ingreso al club.
        </p>
      </div>
    </div>
  );
}

export default AuthCallback;
