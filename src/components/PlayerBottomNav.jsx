import { useState } from 'react';
import { Calendar, Dumbbell, HeartPulse, MoreHorizontal, TrendingUp, Wallet, Bot, LogOut, X } from 'lucide-react';
import { OrcosTackleShieldIcon } from './common/OrcosIcons';

export const PRIMARY_TABS = [
  { id: 'agenda', Icon: Calendar, label: 'Partidos' },
  { id: 'entreno', Icon: Dumbbell, label: 'Entreno' },
  { id: 'bienestar', Icon: HeartPulse, label: 'Físico' },
  { id: 'perfil', Icon: OrcosTackleShieldIcon, label: 'Ficha' },
];

export const MORE_TABS = [
  { id: 'progreso', Icon: TrendingUp, label: 'Fuerza & Rendimiento' },
  { id: 'finanzas', Icon: Wallet, label: 'Membresía & Cuotas' },
  { id: 'ia', Icon: Bot, label: 'Coach Táctico IA' },
];

const itemBase = {
  flex: 1, minHeight: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: '3px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.66rem', fontWeight: 700,
  letterSpacing: '0.2px', position: 'relative', WebkitTapHighlightColor: 'transparent',
};

/** Phone navigation: 4 primary destinations + "Más" sheet. Replaces the sidebar under 768px. */
export default function PlayerBottomNav({ activeTab, onTabChange, onSignOut }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_TABS.some(t => t.id === activeTab);

  const go = (id) => { onTabChange(id); setMoreOpen(false); };

  return (
    <>
      {moreOpen && (
        <div role="presentation" onClick={() => setMoreOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 940, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}>
          <div role="dialog" aria-modal="true" aria-label="Más secciones" onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 16px calc(84px + env(safe-area-inset-bottom, 0px))',
              background: '#0e1824', borderTop: '1px solid rgba(0,230,118,0.25)', borderRadius: '20px 20px 0 0',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.6)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 10px' }}>
              <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>Más</span>
              <button type="button" aria-label="Cerrar menú" onClick={() => setMoreOpen(false)}
                style={{ width: '44px', height: '44px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {MORE_TABS.map(({ id, Icon, label }) => {
                const active = activeTab === id;
                return (
                  <button key={id} type="button" onClick={() => go(id)} aria-current={active ? 'page' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', minHeight: '52px', padding: '0 14px', borderRadius: '14px',
                      border: `1px solid ${active ? 'rgba(0,230,118,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      background: active ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)',
                      color: active ? '#00e676' : '#e6edf5', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', textAlign: 'left',
                    }}>
                    <Icon size={20} color="currentColor" /> {label}
                  </button>
                );
              })}
              {onSignOut && (
                <button type="button" onClick={onSignOut}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '52px', padding: '0 14px', marginTop: '6px', borderRadius: '14px', border: '1px solid rgba(255,82,82,0.3)', background: 'rgba(255,82,82,0.08)', color: '#ff5252', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
                  <LogOut size={20} /> Cerrar sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <nav aria-label="Navegación principal"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 950, display: 'flex',
          padding: '4px 6px calc(4px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(10,15,24,0.96)', backdropFilter: 'blur(14px)', borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
        {PRIMARY_TABS.map(({ id, Icon, label }) => {
          const active = activeTab === id;
          return (
            <button key={id} type="button" onClick={() => go(id)} aria-current={active ? 'page' : undefined}
              style={{ ...itemBase, color: active ? '#00e676' : '#8fa0b5' }}>
              {active && <span aria-hidden="true" style={{ position: 'absolute', top: 0, width: '28px', height: '3px', borderRadius: '0 0 3px 3px', background: '#00e676', boxShadow: '0 0 10px #00e676' }} />}
              <Icon size={22} color="currentColor" />
              {label}
            </button>
          );
        })}
        <button type="button" onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen} aria-haspopup="dialog"
          style={{ ...itemBase, color: moreActive || moreOpen ? '#00e676' : '#8fa0b5' }}>
          {moreActive && <span aria-hidden="true" style={{ position: 'absolute', top: 0, width: '28px', height: '3px', borderRadius: '0 0 3px 3px', background: '#00e676' }} />}
          <MoreHorizontal size={22} />
          Más
        </button>
      </nav>
    </>
  );
}
