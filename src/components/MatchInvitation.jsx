import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

function MatchInvitation() {
  const [invitation, setInvitation] = useState(null);
  const [fixture, setFixture] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', number: '', position: '', notes: '' });

  useEffect(() => {
    const path = window.location.pathname;
    const raw = path.split('/invitacion/')[1] || path.split('/invitation/')[1] || '';
    const t = raw.replace(/[/?#].*$/, '').trim();
    if (!t) { setError('Link invalido.'); setLoading(false); return; }
    const ref = { value: false };
    loadInvitation(t, ref);
    return () => { ref.value = true; };
  }, []);

  const loadInvitation = async (t, ref = { value: false }) => {
    const check = () => ref.value;
    setLoading(true);
    const { data: inv } = await supabase
      .from('match_invitations')
      .select('*, future_fixtures(*)')
      .eq('token', t)
      .maybeSingle();

    if (!inv) { if (check()) return; setError('Invitacion no encontrada o expirada.'); setLoading(false); return; }
    if (inv.status === 'expired') { if (check()) return; setError('Esta invitacion ha expirado.'); setLoading(false); return; }
    if (inv.status === 'completed') { if (check()) return; setError('Este partido ya fue jugado.'); setLoading(false); return; }

    const expDate = new Date(inv.expires_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expDate < today) {
      try { await supabase.from('match_invitations').update({ status: 'expired' }).eq('id', inv.id); } catch { /* RLS bloquea a guests, ignorar */ }
      if (check()) { setError('Esta invitacion ha expirado (el partido ya paso).'); setLoading(false); }
      return;
    }

    if (check()) return;
    setInvitation(inv);
    if (check()) return;
    setFixture(inv.future_fixtures);

    const { data: g } = await supabase.from('guest_players').select('*').eq('invitation_id', inv.id).order('created_at');
    if (check()) return;
    setGuests(g || []);
    setLoading(false);
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const { data, error: err } = await supabase.from('guest_players').insert({
      invitation_id: invitation.id,
      name: form.name.trim(),
      number: form.number ? parseInt(form.number) : null,
      position: form.position || null,
      notes: form.notes || null,
    }).select().single();

    setSaving(false);
    if (err) { setError('Error al registrar: ' + err.message); return; }
    setGuests(prev => [...prev, data]);
    setForm({ name: '', number: '', position: '', notes: '' });
  };

  const handleRemoveGuest = async (id) => {
    const { error } = await supabase.from('guest_players').delete().eq('id', id);
    if (error) { setError('Error al eliminar: ' + error.message); return; }
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-root)', padding: '20px' }}>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando invitacion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-root)', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🛡️</div>
          <h2 style={{ color: 'var(--color-red)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '10px' }}>
            Invitacion no disponible
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{error}</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '20px' }}>
            Contacta a Rugby Orcos Negros si crees que esto es un error.
          </p>
        </div>
      </div>
    );
  }

  const fixtureDate = fixture ? new Date(fixture.date + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : '';

  const positions = ['Pilar','Talonador','Segunda Línea','Ala','Octavo','Medio Melé','Apertura','Centro','Wing','Zaguero'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-root)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '30px' }}>
        <div className="glass-panel" style={{ padding: '25px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <img src="/assets/orcos_logo.png" alt="Rugby Orcos Negros"
            style={{ width: '70px', height: '70px', objectFit: 'contain', filter: 'drop-shadow(0 0 12px var(--color-primary-glow))', marginBottom: '10px' }} />
          <h1 className="neon-text-primary" style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>
            Has sido invitado por Rugby Orcos Negros
          </h1>
          {invitation?.rival_name && (
            <p style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: '1rem', marginTop: '8px' }}>
              vs {invitation.rival_name}
            </p>
          )}
        </div>

        {fixture && (
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ color: 'var(--color-gold)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', fontFamily: 'Outfit' }}>
              Datos del Partido
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
              <p><strong>Fecha:</strong> {fixtureDate}</p>
              {fixture.time && <p><strong>Hora:</strong> {fixture.time}</p>}
              {fixture.location && <p><strong>Lugar:</strong> {fixture.location}</p>}
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '15px', fontFamily: 'Outfit' }}>
            Registra tus Guerreros
          </h3>

          <form onSubmit={handleAddGuest} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del jugador"
                className="form-input"
                style={{ fontSize: '0.85rem' }}
                required
              />
              <input
                type="number"
                value={form.number}
                onChange={e => setForm({ ...form, number: e.target.value })}
                placeholder="#"
                className="form-input"
                style={{ fontSize: '0.85rem', textAlign: 'center' }}
                min="1" max="99"
              />
              <select
                value={form.position}
                onChange={e => setForm({ ...form, position: e.target.value })}
                className="form-select"
                style={{ fontSize: '0.82rem', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', color: 'var(--color-text)', borderRadius: 'var(--radius-sm)', padding: '8px' }}
              >
                <option value="">Posicion</option>
                {positions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-neon" disabled={saving}
              style={{ padding: '10px', fontSize: '0.85rem', justifyContent: 'center' }}>
              {saving ? 'Registrando...' : '+ Agregar Guerrero'}
            </button>
          </form>

          {guests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {guests.map(g => (
                <div key={g.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', background: 'rgba(0, 230, 118, 0.03)',
                  border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                      {g.number ? `#${g.number}` : '—'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>{g.name}</span>
                    {g.position && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '10px' }}>
                        {g.position}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleRemoveGuest(g.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 6px' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              No hay jugadores registrados aun.
            </p>
          )}

          {guests.length > 0 && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                {guests.length} guerrero(s) registrado(s)
              </p>
            </div>
          )}
        </div>

        <footer style={{ textAlign: 'center', padding: '15px', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
          Rugby Orcos Negros 2026. Fuerza, Honor y Tercer Tiempo.
        </footer>
      </div>
    </div>
  );
}

export default MatchInvitation;
