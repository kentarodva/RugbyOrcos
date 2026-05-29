import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function Login() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Ingresa un email valido.');
      return;
    }

    setLoading(true);
    const { error: err } = await sendMagicLink(email.trim());
    setLoading(false);

    if (err) {
      setError(err.message || 'Error al enviar el enlace magico.');
    } else {
      setSent(true);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-root)',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '25px',
        borderRadius: 'var(--radius-lg)'
      }}>
        <img
          src="/assets/orcos_logo.png"
          alt="Rugby Orcos Negros"
          style={{
            width: '90px',
            height: '90px',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 15px var(--color-primary-glow))',
            animation: 'pulseGlow 3s infinite ease-in-out'
          }}
        />

        <div style={{ textAlign: 'center' }}>
          <h1 className="neon-text-primary" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            RUGBY ORCOS NEGROS
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>
            Club Manager v3.0
          </p>
        </div>

        <div style={{
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--border-glass), transparent)'
        }} />

        {sent ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{
              fontSize: '2.5rem', marginBottom: '15px'
            }}>
              ✉️
            </div>
            <h2 style={{
              color: 'var(--color-primary)',
              fontSize: '1.1rem',
              fontWeight: 700,
              marginBottom: '10px'
            }}>
              Enlace magico enviado
            </h2>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}>
              Revisa <strong style={{ color: 'var(--color-gold)' }}>{email}</strong>.
              Te enviamos un enlace de acceso sin contrasena.
              Haz clic en el para ingresar al club.
            </p>
            <p style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic'
            }}>
              Si no lo encuentras, revisa la carpeta de spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div className="form-group">
              <label style={{
                fontSize: '0.8rem',
                color: 'var(--color-gold)',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '8px',
                display: 'block',
                textAlign: 'center'
              }}>
                Ingresa tu email para acceder
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="tu@email.com"
                className="form-input"
                style={{
                  textAlign: 'center',
                  fontSize: '1rem',
                  padding: '14px',
                  borderColor: error ? 'var(--color-red)' : 'var(--border-glass)'
                }}
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <p style={{
                color: 'var(--color-red)',
                fontSize: '0.8rem',
                textAlign: 'center',
                fontWeight: 600
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-neon"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 800,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Enviando...' : 'Recibir enlace magico'}
            </button>
          </form>
        )}

        <p style={{
          fontSize: '0.7rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          Sin contrasenas que olvidar. Ingresa con tu email
          y recibe un enlace magico seguro.
        </p>
      </div>
    </div>
  );
}

export default Login;
