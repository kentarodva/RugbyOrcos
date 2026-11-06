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
    color: '#2EE57A',
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
    color: '#FF5C4D',
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
    color: '#5AA9FF',
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
    if (readiness >= 80) return { label: 'Óptimo para Batalla', color: '#2EE57A', bg: 'rgba(46, 229, 122, 0.12)', border: '#2EE57A', msg: 'Tu cuerpo está en plenitud para rendir en el partido y los entrenamientos pesados.' };
    if (readiness >= 60) return { label: 'Cuidado / Fatiga Moderada', color: 'var(--color-gold)', bg: 'rgba(255, 215, 64, 0.12)', border: 'var(--color-gold)', msg: 'Rendimiento aceptable, pero monitorea hidratación y elongación tras el choque.' };
    return { label: 'Sobrecarga / Riesgo de Lesión', color: '#FF5C4D', bg: 'rgba(255, 92, 77, 0.12)', border: '#FF5C4D', msg: 'Alerta de sobreentrenamiento o golpes acumulados. Notifica al entrenador.' };
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
      {/* Readiness summary */}
      <section className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HeartPulse size={18} color="var(--color-text-muted)" aria-hidden="true" />
          <h2 className="section-title">Estado físico</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <span className="stat-number" style={{ fontSize: '2.25rem', color: readinessStatus.color }}>{readiness}%</span>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{readinessStatus.label}</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          {readinessStatus.msg}
          {lastWellness && <> Último control: <strong style={{ color: 'var(--color-text-soft)' }}>{lastWellness.date}</strong>.</>}
        </p>
        <details style={{ fontSize: '0.8125rem', color: 'var(--color-text-subtle)' }}>
          <summary style={{ cursor: 'pointer', minHeight: '32px', display: 'flex', alignItems: 'center' }}>¿Para qué sirve?</summary>
          <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
            El choque en melés, tackles y rucks exige recuperarse bien. Este chequeo le avisa al cuerpo técnico si estás
            en plenitud para el partido o si acumulas sobrecarga, para prevenir desgarros y lesiones.
          </p>
        </details>
      </section>

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
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PillarIcon size={18} color="var(--color-text-muted)" aria-hidden="true" />
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                    {pillar.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {pillar.descriptions[currentVal - 1]}
                </div>
              </div>

              {/* 1 to 5 Score Selector Buttons */}
              <div role="group" aria-label={pillar.title} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 44px))', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(num => {
                  const isSelected = currentVal === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setScores(prev => ({ ...prev, [pillar.key]: num }))}
                      style={{
                        height: '44px',
                        borderRadius: 'var(--radius-sm)',
                        border: `1px solid ${isSelected ? 'var(--color-text)' : 'var(--border-strong)'}`,
                        background: isSelected ? 'var(--color-text)' : 'transparent',
                        color: isSelected ? 'var(--bg-root)' : 'var(--color-text-muted)',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        cursor: 'pointer',
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
        type="button"
        style={{ width: '100%' }}
      >
        Enviar reporte
      </button>
    </div>
  );
}

export default PlayerWellnessTab;
