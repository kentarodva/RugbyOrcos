import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../supabaseClient.js';
import { parseSupabaseError } from '../utils/errorHandler.js';

function Login() {
  const { signIn, signUp, checkFirstRun } = useAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [retryable, setRetryable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFirstRun().then(setIsFirstRun);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setErrorType(''); setRetryable(false);
    if (!credential.trim() || !password.trim()) { setError('Completa todos los campos.'); return; }

    setLoading(true);
    let email = credential.trim();

    if (!email.includes('@')) {
      const userQuery = email.toLowerCase().trim();
      let players;
      try {
        const { data } = await supabase
          .from('players')
          .select('first_name, middle_name, last_name, second_last_name, username, nickname, email')
          .or(`username.ilike.%${userQuery}%,username.eq.${userQuery},nickname.ilike.%${userQuery}%,nickname.eq.${userQuery},email.ilike.%${userQuery}%`)
          .not('username', 'is', null)
          .limit(10);
        players = data;
      } catch (fetchErr) {
        const parsed = parseSupabaseError(fetchErr);
        setError(parsed.message);
        setErrorType(parsed.type);
        setRetryable(parsed.retryable);
        setLoading(false);
        return;
      }

      let player = null;
      let suggestion = null;
      if (players?.length > 0) {
        player = players.find(p =>
          p.username === userQuery ||
          p.nickname === userQuery ||
          p.email === `${userQuery}@orcos.club`
        );
        if (!player) {
          const lev = (a, b) => {
            const m = a.length, n = b.length;
            if (Math.abs(m - n) > 1) return 99;
            const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
            for (let i = 0; i <= m; i++) dp[i][0] = i;
            for (let j = 0; j <= n; j++) dp[0][j] = j;
            for (let i = 1; i <= m; i++) {
              for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i-1] === b[j-1]
                  ? dp[i-1][j-1]
                  : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
              }
            }
            return dp[m][n];
          };
          const fuzzy = players.find(p => p.username && lev(p.username, userQuery) <= 1);
          if (fuzzy) {
            player = fuzzy;
            suggestion = fuzzy.username;
          }
        }
        if (!player && players.length === 1) player = players[0];
      }

      if (!player) {
        setError('Guerrero no encontrado. Verifica tu nombre de usuario o contacta a tu Comandante de Horda para que te cree credenciales en Roster.');
        setLoading(false);
        return;
      }

      if (!player.email) {
        setError('Tu perfil de Guerrero no tiene email vinculado. Pide a tu Comandante de Horda que complete tus datos de contacto en Roster → Editar Jugador.');
        setLoading(false);
        return;
      }

      if (suggestion) {
        setError(`¿Quisiste decir "${suggestion}"?`);
        setLoading(false);
        return;
      }

      email = player.email;
    }

    const { error: err } = await signIn(email, password);
    setLoading(false);

    if (err) {
      const parsed = parseSupabaseError(err);
      setError(parsed.message);
      setErrorType(parsed.type);
      setRetryable(parsed.retryable);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setErrorType(''); setRetryable(false);
    if (!credential.trim() || !password.trim() || !displayName.trim()) { setError('Completa todos los campos.'); return; }
    if (password.length < 6) { setError('La contrasena debe tener al menos 6 caracteres.'); return; }
    if (!credential.includes('@')) { setError('Para fundar el Reino necesitas un email valido.'); return; }

    setLoading(true);
    const { error: err } = await signUp(credential.trim(), password, displayName.trim());
    setLoading(false);

    if (err) {
      const parsed = parseSupabaseError(err);
      setError(parsed.message);
      setErrorType(parsed.type);
      setRetryable(parsed.retryable);
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
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-red)', fontSize: '0.8rem', fontWeight: 600, marginBottom: errorType === 'server_offline' ? '4px' : 0 }}>
                {error}
              </p>
              {errorType === 'server_offline' && (
                <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Supabase hiberna proyectos inactivos en free tier. Revisa{' '}
                  <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-gold)' }}>supabase.com/dashboard</a>
                  {' '}y haz clic en "Resume project".
                </p>
              )}
              {retryable && (
                <button onClick={showRegister ? handleRegister : handleLogin} style={{
                  marginTop: '8px', padding: '6px 14px', fontSize: '0.78rem',
                  background: 'none', border: '1px solid var(--color-gold)', borderRadius: '6px',
                  color: 'var(--color-gold)', cursor: 'pointer', fontWeight: 700
                }}>
                  🔄 Reintentar
                </button>
              )}
            </div>
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
          <>
          <button onClick={() => setShowRegister(true)}
            className="btn-outline" style={{
              width: '100%', justifyContent: 'center', padding: '12px',
              fontSize: '0.9rem', fontWeight: 700, borderColor: 'var(--color-gold)', color: 'var(--color-gold)'
            }}>
            Fundar un Nuevo Reino
          </button>
          <button onClick={async () => {
            const email = prompt('Ingresa tu email para recuperar tu contrasena:');
            if (!email || !email.includes('@')) return;
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
              });
              if (error) throw error;
              alert('Si el email esta registrado, recibiras un link para restablecer tu contrasena.');
            } catch (err) {
              alert('Error al enviar el correo de recuperacion. Verifica tu conexion e intenta de nuevo.');
            }
          }}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline', marginTop: '8px' }}>
            ¿Olvidaste tu contrasena?
          </button>
          </>
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
            : 'Staff: usa tu email. Guerrero: usa tu nombre de usuario (el que te asignaron en Roster).'}
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
