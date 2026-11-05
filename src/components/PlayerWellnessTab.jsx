import React, { useState, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { HeartPulse, Moon, Zap, ShieldAlert, Brain, Droplets } from 'lucide-react';

const WELLNESS_PILLARS = [
  {
    key: 'sleep',
    title: 'Calidad de Sueño y Descanso',
    Icon: Moon,
    color: '#38bdf8',
    descriptions: [
      '1 - Pésimo, insomnio o menos de 5 horas',
      '2 - Interrumpido, poco reparador',
      '3 - Aceptable, descanso normal (6-7h)',
      '4 - Buen sueño, reparador (7-8h)',
      '5 - Sueño óptimo y profundo (8h+)',
    ],
  },
  {
    key: 'energy',
    title: 'Nivel de Energía y Vitalidad',
    Icon: Zap,
    color: '#00e676',
    descriptions: [
      '1 - Agotado, sin energía para entrenar',
      '2 - Cuerpo pesado, baja reacción',
      '3 - Nivel normal para el día a día',
      '4 - Energético, ágil y despierto',
      '5 - ¡Máxima potencia de combate!',
    ],
  },
  {
    key: 'soreness',
    title: 'Dolor Muscular y Golpes (Tackle/Scrum)',
    Icon: ShieldAlert,
    color: '#ff5252',
    descriptions: [
      '1 - Dolor severo por choque o golpes fuertes',
      '2 - Mucha rigidez y dolor en articulaciones',
      '3 - Agujetas moderadas esperadas',
      '4 - Leve tirantez, cuerpo reactivo',
      '5 - Cuerpo suelto, sin dolor alguno',
    ],
  },
  {
    key: 'stress',
    title: 'Estrés y Claridad Mental',
    Icon: Brain,
    color: '#b388ff',
    descriptions: [
      '1 - Estrés muy alto o disperso',
      '2 - Preocupado o con sobrecarga laboral/personal',
      '3 - Estado mental neutro',
      '4 - Tranquilo y con buena concentración',
      '5 - Enfoque total, motivado al 100%',
    ],
  },
  {
    key: 'hydration',
    title: 'Hidratación y Recuperación',
    Icon: Droplets,
    color: '#00b0ff',
    descriptions: [
      '1 - Muy deshidratado, calambres frecuentes',
      '2 - Poca ingesta de agua durante el día',
      '3 - Hidratación promedio estándar',
      '4 - Buena hidratación previa y posterior',
      '5 - Hidratación y electrolitos al 100%',
    ],
  },
];

function PlayerWellnessTab({ player, recordWellness }) {
  const { showToast } = useToast();
  const [scores, setScores] = useState({
    sleep: 3,
    energy: 4,
    soreness: 3,
    stress: 4,
    hydration: 4,
  });

  const lastWellness = (player?.wellnessLogs || []).slice(-1)[0];

  // Overall Readiness Score (0 to 100%)
  const readiness = useMemo(() => {
    const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
    return Math.round((total / 25) * 100);
  }, [scores]);

  const readinessStatus = useMemo(() => {
    if (readiness >= 80) return { label: 'Óptimo para Batalla', color: '#00e676', bg: 'rgba(0, 230, 118, 0.12)', border: '#00e676', msg: 'Tu cuerpo está en plenitud para rendir en el partido y los entrenamientos pesados.' };
    if (readiness >= 60) return { label: 'Cuidado / Fatiga Moderada', color: 'var(--color-gold)', bg: 'rgba(255, 215, 64, 0.12)', border: 'var(--color-gold)', msg: 'Rendimiento aceptable, pero monitorea hidratación y elongación tras el choque.' };
    return { label: 'Sobrecarga / Riesgo de Lesión', color: '#ff5252', bg: 'rgba(255, 23, 68, 0.12)', border: '#ff1744', msg: 'Alerta de sobreentrenamiento o golpes acumulados. Notifica al entrenador.' };
  }, [readiness]);

  const handleSubmit = () => {
    recordWellness(player.id, {
      date: new Date().toISOString().split('T')[0],
      sleep: scores.sleep,
      soreness: scores.soreness,
      stress: scores.stress,
      energy: scores.energy,
      hydration: scores.hydration,
      readiness,
    });
    showToast('Reporte de estado físico y recuperación enviado con éxito.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Educational Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '22px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(0, 176, 255, 0.08) 0%, rgba(10, 20, 32, 0.95) 100%)',
          border: '1px solid rgba(0, 176, 255, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <HeartPulse size={24} color="#00b0ff" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'Outfit', color: '#fff', margin: 0 }}>
              Control de Estado Físico & Fatiga de Combate
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              <strong>¿Para qué sirve?</strong> En el rugby de alto contacto, el choque físico en melés, tackles y rucks exige una recuperación inteligente. Este chequeo le avisa a los entrenadores si estás en plenitud física para el partido o si tu cuerpo acumula sobrecarga para evitar desgarros y lesiones graves.
            </p>
          </div>
        </div>

        {/* Readiness Index Card */}
        <div
          style={{
            marginTop: '16px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: readinessStatus.bg,
            border: `1px solid ${readinessStatus.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: readinessStatus.color }}>
              Índice de Recuperación de Combate
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'Outfit', color: '#fff' }}>
              {readiness}% &middot; {readinessStatus.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {readinessStatus.msg}
            </div>
          </div>

          {lastWellness && (
            <div style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Último control registrado:<br />
              <strong style={{ color: '#fff' }}>{lastWellness.date}</strong>
            </div>
          )}
        </div>
      </div>

      {/* 5 Evaluation Pillars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {WELLNESS_PILLARS.map(pillar => {
          const PillarIcon = pillar.Icon;
          const currentVal = scores[pillar.key];

          return (
            <div
              key={pillar.key}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                borderRadius: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(10, 18, 28, 0.65)',
              }}
            >
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PillarIcon size={18} color={pillar.color} />
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#fff' }}>
                    {pillar.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: pillar.color, marginTop: '4px', fontWeight: 600 }}>
                  {pillar.descriptions[currentVal - 1]}
                </div>
              </div>

              {/* 1 to 5 Score Selector Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(num => {
                  const isSelected = currentVal === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setScores(prev => ({ ...prev, [pillar.key]: num }))}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        border: `1px solid ${isSelected ? pillar.color : 'rgba(255, 255, 255, 0.12)'}`,
                        background: isSelected ? `${pillar.color}25` : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? '#fff' : 'var(--color-text-muted)',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        boxShadow: isSelected ? `0 0 12px ${pillar.color}50` : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '14px',
          fontSize: '0.9rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        ⚔️ Registrar Reporte de Estado Físico
      </button>
    </div>
  );
}

export default PlayerWellnessTab;
