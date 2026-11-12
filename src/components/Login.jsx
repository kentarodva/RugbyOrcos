import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, RotateCcw, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../supabaseClient.js';
import { parseSupabaseError } from '../utils/errorHandler.js';

function Login() {
  const { signIn, signUp, checkFirstRun } = useAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState('');
  const [retryable, setRetryable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFirstRun().then(setIsFirstRun);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setErrorType('');
    setRetryable(false);
    if (!credential.trim() || !password.trim()) {
      setError('Completa todos los campos.');
      return;
    }

    setLoading(true);
    let email = credential.trim();

    if (!email.includes('@')) {
      const userQuery = email.toLowerCase().trim();
      let players;
      try {
        if (typeof supabase.rpc === 'function') {
          const rpcRes = await supabase.rpc('resolve_player_login', { p_query: userQuery });
          if (rpcRes && !rpcRes.error && Array.isArray(rpcRes.data)) {
            players = rpcRes.data;
          }
        }
        if (!players) {
          const { data } = await supabase
            .from('players')
            .select('first_name, middle_name, last_name, second_last_name, username, nickname, email')
            .or(
              `username.ilike.%${userQuery}%,username.eq.${userQuery},nickname.ilike.%${userQuery}%,nickname.eq.${userQuery},email.ilike.%${userQuery}%`
            )
            .not('username', 'is', null)
            .limit(10);
          players = data;
        }
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
        player = players.find(
          (p) => p.username === userQuery || p.nickname === userQuery || p.email === `${userQuery}@orcos.club`
        );
        if (!player) {
          const lev = (a, b) => {
            const m = a.length,
              n = b.length;
            if (Math.abs(m - n) > 1) return 99;
            const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
            for (let i = 0; i <= m; i++) dp[i][0] = i;
            for (let j = 0; j <= n; j++) dp[0][j] = j;
            for (let i = 1; i <= m; i++) {
              for (let j = 1; j <= n; j++) {
                dp[i][j] =
                  a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
              }
            }
            return dp[m][n];
          };
          const fuzzy = players.find((p) => p.username && lev(p.username, userQuery) <= 1);
          if (fuzzy) {
            player = fuzzy;
            suggestion = fuzzy.username;
          }
        }
        if (!player && players.length === 1) player = players[0];
      }

      // El servidor solo entrega el email con el usuario exacto (migración 95): una
      // coincidencia sin email es una sugerencia, no un inicio de sesión.
      if (player && !player.email) {
        setError(`Guerrero no encontrado. ¿Quisiste decir "${player.username}"? Escríbelo exacto.`);
        setLoading(false);
        return;
      }

      if (!player) {
        setError(
          'Guerrero no encontrado. Verifica tu nombre de usuario o contacta a tu Comandante de Horda para que te cree credenciales en Roster.'
        );
        setLoading(false);
        return;
      }

      if (!player.email) {
        setError(
          'Tu perfil de Guerrero no tiene email vinculado. Pide a tu Comandante de Horda que complete tus datos de contacto en Roster → Editar Jugador.'
        );
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
    setError('');
    setErrorType('');
    setRetryable(false);
    if (!credential.trim() || !password.trim() || !displayName.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!credential.includes('@')) {
      setError('Para fundar el Reino necesitas un email válido.');
      return;
    }

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

  const handleRecovery = async (e) => {
    e.preventDefault();
    setError('');
    setRecoveryStatus('');
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(recoveryEmail.trim(), {
        redirectTo: window.location.origin,
      });
      if (resetErr) throw resetErr;
      setRecoveryStatus('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.');
    } catch (err) {
      setError(parseSupabaseError(err).message || 'No se pudo enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const isEmail = credential.includes('@');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        position: 'relative',
      }}
    >
      <div
        className="glass-panel animated-slide"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '38px 34px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '22px',
          borderRadius: '22px',
          border: '1px solid rgba(46, 229, 122, 0.18)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(46, 229, 122, 0.06)',
        }}
      >
        {/* Emblem + Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '24px',
              background: 'radial-gradient(circle, rgba(46, 229, 122, 0.14) 0%, rgba(24, 27, 25, 0.4) 75%)',
              border: '1px solid rgba(46, 229, 122, 0.22)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/assets/orcos_crest_light.png"
              alt="Rugby Orcos Negros"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 14px var(--color-primary-glow))',
              }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 className="neon-text-primary" style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '0.8px' }}>
              ORCOS RUGBY CLUB
            </h1>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'rgba(232, 185, 49, 0.12)',
                border: '1px solid rgba(232, 185, 49, 0.28)',
                fontSize: '0.73rem',
                color: 'var(--color-gold)',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              <Shield size={12} />
              {showRecovery
                ? 'Recuperar Acceso'
                : showRegister
                  ? 'Fundar un Nuevo Reino'
                  : 'Reino Manager v5.0'}
            </div>
          </div>
        </div>

        <div
          style={{
            width: '100%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${
              showRegister || showRecovery ? 'var(--color-gold)' : 'rgba(46, 229, 122, 0.25)'
            }, transparent)`,
          }}
        />

        {showRecovery ? (
          <form
            onSubmit={handleRecovery}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <label style={labelS}>Correo Electrónico de Recuperación</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => {
                    setRecoveryEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="tu@email.com"
                  style={inputWithIconS(!!error)}
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            {error && <p style={{ color: 'var(--color-red)', fontSize: '0.8rem', fontWeight: 600 }}>{error}</p>}
            {recoveryStatus && (
              <p
                style={{
                  color: 'var(--color-primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: 'rgba(46, 229, 122, 0.08)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(46, 229, 122, 0.25)',
                }}
              >
                {recoveryStatus}
              </p>
            )}

            <button
              type="submit"
              className="btn-gold"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.92rem' }}
            >
              <KeyRound size={17} />
              {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRecovery(false);
                setError('');
                setRecoveryStatus('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        ) : (
          <form
            onSubmit={showRegister ? handleRegister : handleLogin}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            {showRegister && (
              <div>
                <label style={labelS}>Nombre en el Reino</label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setError('');
                    }}
                    placeholder="Tu nombre de batalla"
                    style={inputWithIconS(!!(error && !displayName))}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ ...labelS, marginBottom: 0 }}>
                  {showRegister ? 'Email' : 'Usuario o Email'}
                </label>
                {!showRegister && credential.trim() && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: isEmail ? 'var(--color-gold)' : 'var(--color-blue)',
                    }}
                  >
                    {isEmail ? 'Modo Staff' : 'Modo Guerrero'}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                {isEmail || showRegister ? (
                  <Mail
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                ) : (
                  <User
                    size={17}
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-text-muted)',
                    }}
                  />
                )}
                <input
                  type={showRegister ? 'email' : 'text'}
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    setError('');
                  }}
                  placeholder={showRegister ? 'tu@email.com' : 'Usuario o email'}
                  style={inputWithIconS(!!(error && !credential))}
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label style={labelS}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Tu contraseña secreta"
                  style={{ ...inputWithIconS(!!(error && !password)), paddingRight: '42px' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Mostrar u ocultar contraseña"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  textAlign: 'center',
                  background: 'rgba(255, 92, 77, 0.08)',
                  border: '1px solid rgba(255, 92, 77, 0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                }}
              >
                <p
                  style={{
                    color: 'var(--color-red)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: errorType === 'server_offline' ? '4px' : 0,
                  }}
                >
                  {error}
                </p>
                {errorType === 'server_offline' && (
                  <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Supabase hiberna proyectos inactivos en free tier. Revisa{' '}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-gold)' }}
                    >
                      supabase.com/dashboard
                    </a>{' '}
                    y haz clic en &quot;Resume project&quot;.
                  </p>
                )}
                {retryable && (
                  <button
                    type="button"
                    onClick={showRegister ? handleRegister : handleLogin}
                    style={{
                      marginTop: '8px',
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      background: 'none',
                      border: '1px solid var(--color-gold)',
                      borderRadius: '6px',
                      color: 'var(--color-gold)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RotateCcw size={13} /> Reintentar
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="btn-neon"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '13px',
                fontSize: '0.96rem',
                fontWeight: 800,
                opacity: loading ? 0.7 : 1,
                background: showRegister ? 'linear-gradient(135deg, var(--color-gold), #e6a200)' : undefined,
              }}
            >
              {loading
                ? showRegister
                  ? 'Forjando el Reino...'
                  : 'Abriendo las puertas...'
                : showRegister
                  ? 'Fundar el Reino'
                  : 'Entrar al Reino'}
              {!loading && <ArrowRight size={17} />}
            </button>
          </form>
        )}

        {!showRegister && !showRecovery && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
            {isFirstRun && (
              <button
                onClick={() => setShowRegister(true)}
                className="btn-outline"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderColor: 'rgba(232, 185, 49, 0.35)',
                  color: 'var(--color-gold)',
                }}
              >
                Fundar un Nuevo Reino
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowRecovery(true);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        {showRegister && !showRecovery && (
          <button
            onClick={() => {
              setShowRegister(false);
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            ← Volver al inicio de sesión
          </button>
        )}

        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          {isFirstRun
            ? 'Ningún Arquitecto ha reclamado el Reino. Sé el primero.'
            : 'Staff: ingresa con tu email · Guerrero: ingresa con tu usuario asignado en Roster.'}
        </p>
      </div>
    </div>
  );
}

const labelS = {
  fontSize: '0.74rem',
  color: 'var(--color-text-muted)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
  marginBottom: '6px',
  display: 'block',
};

const inputWithIconS = (hasError) => ({
  fontSize: '0.92rem',
  padding: '12px 14px 12px 40px',
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--bg-input)',
  border: `1px solid ${hasError ? 'var(--color-red)' : 'var(--border-glass)'}`,
  borderRadius: '10px',
  color: 'var(--color-text)',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
});

export default Login;
