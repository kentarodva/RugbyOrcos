import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../supabaseClient.js';

function Login() {
  const { signIn, signUp, checkFirstRun } = useAuth();
  const [credential, setCredential] = useState('');
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
    if (!credential.trim() || !password.trim()) { setError('Completa todos los campos.'); return; }

    setLoading(true);
    let email = credential.trim();

    if (!email.includes('@')) {
      const { data: player } = await supabase
        .from('players')
        .select('username, email')
        .eq('username', email)
        .maybeSingle();

      if (!player) {
        setError('Usuario no encontrado. Verifica tu usuario o contacta a tu Comandante.');
        setLoading(false);
        return;
      }

      email = player.email || `${player.username}@orcos.local`;
    }

    const { error: err } = await signIn(email, password);
    setLoading(false);

    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Usuario o contrasena incorrectos.'
        : err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!credential.trim() || !password.trim() || !displayName.trim()) { setError('Completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contrasena debe tener al menos 6 caracteres.'); return; }
    if (!credential.includes('@')) { setError('Para fundar el Reino necesitas un email valido.'); return; }

    setLoading(true);
    const { error: err } = await signUp(credential.trim(), password, displayName.trim());
    setLoading(false);

    if (err) {
      if (err.message.includes('already registered')) setError('Este email ya esta registrado.');
      else setError(err.message);
    } else {
      setShowRegister(false);
      setIsFirstRun(false);
      await signIn(credential.trim(), password);
    }
  };

  const isEmail = credential.includes('@');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-root)', padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '440px', padding: '40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px',
        borderRadius: 'var(--radius-lg)'
      }}>
        <img src="/assets/orcos_logo.png" alt="Rugby Orcos Negros"
          style={{ width: '90px', height: '90px', objectFit: 'contain',
            filter: 'drop-shadow(0 0 15px var(--color-primary-glow))', animation: 'pulseGlow 3s infinite ease-in-out' }} />

        <div style={{ textAlign: 'center' }}>
          <h1 className="neon-text-primary" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            RUGBY ORCOS NEGROS
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gold)', marginTop: '5px', fontWeight: 600 }}>
            {showRegister ? 'Fundar un Nuevo Reino' : 'Reino Manager v4.0'}
          </p>
        </div>

        <div style={{ width: '100%', height: '1px',
          background: `linear-gradient(90deg, transparent, ${showRegister ? 'var(--color-gold)' : 'var(--border-glass)'}, transparent)` }} />

        <form onSubmit={showRegister ? handleRegister : handleLogin}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>

          {showRegister && (
            <div className="form-group">
              <label style={labelS}>Nombre en el Reino</label>
              <input type="text" value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
                placeholder="Tu nombre de batalla" style={inputS(!!(error && !displayName))} disabled={loading} />
            </div>
          )}

          <div className="form-group">
            <label style={labelS}>
              {showRegister ? 'Email' : 'Usuario o Email'}
            </label>
            <input
              type={showRegister ? 'email' : 'text'}
              value={credential}
              onChange={(e) => { setCredential(e.target.value); setError(''); }}
              placeholder={showRegister ? 'tu@email.com' : 'Email o nombre de usuario'}
              style={inputS(!!(error && !credential))}
              autoFocus disabled={loading} />
            {!showRegister && !isEmail && credential.trim() && (
              <p style={{ fontSize: '0.7rem', color: 'var(--color-blue)', marginTop: '4px' }}>
                Ingresando como Guerrero
              </p>
            )}
          </div>

          <div className="form-group">
            <label style={labelS}>Contrasena</label>
            <input type="password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Tu contrasena secreta" style={inputS(!!(error && !password))} disabled={loading} />
          </div>

          {error && (
            <p style={{ color: 'var(--color-red)', fontSize: '0.8rem', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-neon" disabled={loading} style={{
            width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', fontWeight: 800,
            opacity: loading ? 0.7 : 1,
            background: showRegister ? 'linear-gradient(135deg, var(--color-gold), #e6a200)' : undefined
          }}>
            {loading ? (showRegister ? 'Forjando el Reino...' : 'Abriendo las puertas...')
              : (showRegister ? 'Fundar el Reino' : 'Entrar al Reino')}
          </button>
        </form>

        {!showRegister && (
          <button onClick={() => setShowRegister(true)}
            className="btn-outline" style={{
              width: '100%', justifyContent: 'center', padding: '12px',
              fontSize: '0.9rem', fontWeight: 700, borderColor: 'var(--color-gold)', color: 'var(--color-gold)'
            }}>
            Fundar un Nuevo Reino
          </button>
        )}

        {showRegister && (
          <button onClick={() => { setShowRegister(false); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
            Volver al inicio de sesion
          </button>
        )}

        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: '1.5' }}>
          {isFirstRun
            ? 'Ningun Arquitecto ha reclamado el Reino. Se el primero.'
            : 'Staff: usa tu email. Guerrero: usa tu nombre de usuario.'}
        </p>
      </div>
    </div>
  );
}

const labelS = { fontSize: '0.8rem', color: 'var(--color-gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'block', textAlign: 'center' };
const inputS = (hasError) => ({ textAlign: 'center', fontSize: '1rem', padding: '14px', width: '100%', boxSizing: 'border-box',
  background: 'var(--bg-input)', border: `1px solid ${hasError ? 'var(--color-red)' : 'var(--border-glass)'}`,
  borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', outline: 'none' });

export default Login;
