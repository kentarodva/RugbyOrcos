import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

function Login() {
  const { signIn, signUp, checkFirstRun } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFirstRun().then(setIsFirstRun);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos.');
      return;
    }

    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);

    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contrasena incorrectos.'
        : err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim() || !displayName.trim()) {
      setError('Completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email.trim(), password, displayName.trim());
    setLoading(false);

    if (err) {
      if (err.message.includes('already registered') || err.message.includes('already exists')) {
        setError('Este email ya esta registrado. Intenta iniciar sesion.');
      } else {
        setError(err.message);
      }
    } else {
      setError('');
      setShowRegister(false);
      setIsFirstRun(false);
      await signIn(email.trim(), password);
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
        maxWidth: '440px',
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
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gold)', marginTop: '5px', fontWeight: 600 }}>
            {showRegister ? 'Fundar un Nuevo Reino' : 'Reino Manager v4.0'}
          </p>
        </div>

        <div style={{
          width: '100%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, ' +
            (showRegister ? 'var(--color-gold)' : 'var(--border-glass)') +
            ', transparent)'
        }} />

        <form onSubmit={showRegister ? handleRegister : handleLogin} style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {showRegister && (
            <div className="form-group">
              <label style={labelStyle}>
                Nombre en el Reino
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                placeholder="Tu nombre de batalla"
                style={inputStyle(error && !displayName)}
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label style={labelStyle}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="tu@email.com"
              style={inputStyle(error && !email)}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label style={labelStyle}>
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Tu contrasena secreta"
              style={inputStyle(error && !password)}
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
              opacity: loading ? 0.7 : 1,
              background: showRegister
                ? 'linear-gradient(135deg, var(--color-gold), #e6a200)'
                : undefined
            }}
          >
            {loading
              ? (showRegister ? 'Forjando el Reino...' : 'Abriendo las puertas...')
              : (showRegister ? 'Fundar el Reino' : 'Entrar al Reino')}
          </button>
        </form>

        {(isFirstRun || showRegister) && !showRegister && (
          <button
            onClick={() => setShowRegister(true)}
            className="btn-outline"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              fontSize: '0.9rem',
              fontWeight: 700,
              borderColor: 'var(--color-gold)',
              color: 'var(--color-gold)'
            }}
          >
            Fundar un Nuevo Reino
          </button>
        )}

        {showRegister && (
          <button
            onClick={() => { setShowRegister(false); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              textDecoration: 'underline'
            }}
          >
            Volver al inicio de sesion
          </button>
        )}

        <p style={{
          fontSize: '0.7rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          {isFirstRun
            ? 'Ningun Arquitecto ha reclamado el Reino. Se el primero.'
            : 'El Reino te reclama. Ingresa tus credenciales de batalla.'}
        </p>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: '0.8rem',
  color: 'var(--color-gold)',
  fontWeight: 700,
  textTransform: 'uppercase',
  marginBottom: '8px',
  display: 'block',
  textAlign: 'center'
};

const inputStyle = (hasError) => ({
  textAlign: 'center',
  fontSize: '1rem',
  padding: '14px',
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--bg-input)',
  border: `1px solid ${hasError ? 'var(--color-red)' : 'var(--border-glass)'}`,
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text)',
  outline: 'none'
});

export default Login;
