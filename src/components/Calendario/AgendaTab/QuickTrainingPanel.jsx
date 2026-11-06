import React, { useState, useMemo, useEffect } from 'react';
import { EVENT_TYPES } from '../../../utils/eventTypes';
import { getSetting, setSetting, loadSettings } from '../../../data/clubSettings';

const DAYS = [
  { num: 1, label: 'Lun', title: 'Lunes' },
  { num: 2, label: 'Mar', title: 'Martes' },
  { num: 3, label: 'Mie', title: 'Miercoles' },
  { num: 4, label: 'Jue', title: 'Jueves' },
  { num: 5, label: 'Vie', title: 'Viernes' },
  { num: 6, label: 'Sab', title: 'Sabado' },
  { num: 7, label: 'Dom', title: 'Domingo' },
];

const HOURS = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];

const FIXED_LOCATIONS = [
  { name: 'San Francisco 🏟️', mapsLink: 'https://maps.app.goo.gl/9KQxbwjxTzz3z9pL7' },
  { name: 'Morroa 🏟️', mapsLink: 'https://maps.app.goo.gl/h9cZdw3FCGetcvqU8' },
];

function QuickTrainingPanel({ onCreate, existingLocations, currentTeamCategory, makgoraTeams }) {
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
  const [hour, setHour] = useState('19:00');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [weeks, setWeeks] = useState(4);
  const [creating, setCreating] = useState(false);
  const [customLocations, setCustomLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('qtp_custom_locations');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    loadSettings().then(() => {
      const dbLocations = getSetting('custom_locations');
      if (dbLocations) {
        try {
          const parsed = typeof dbLocations === 'string' ? JSON.parse(dbLocations) : dbLocations;
          if (Array.isArray(parsed)) {
            setCustomLocations(prev => {
              const merged = [...new Set([...prev, ...parsed])];
              localStorage.setItem('qtp_custom_locations', JSON.stringify(merged));
              return merged;
            });
          }
        } catch {
          // ignore parse error
        }
      }
    }).catch(() => {});
  }, []);
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState('entrenamiento');
  const [customNotes, setCustomNotes] = useState('');
  const [scopeType, setScopeType] = useState('division');
  const [scopeMakgoraTeamId, setScopeMakgoraTeamId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleDay = (dayNum) => {
    setSelectedDays(prev => {
      const next = prev.includes(dayNum)
        ? prev.filter(d => d !== dayNum)
        : [...prev, dayNum].sort((a, b) => a - b);
      return next;
    });
  };

  const setPreset = (days) => {
    setSelectedDays(days);
  };

  const handleHourChange = (e) => {
    setHour(e.target.value);
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setLocation('__custom__');
    } else {
      setLocation(val);
    }
  };

  const handleCustomLocationSave = () => {
    if (customLocation.trim()) {
      const trimmed = customLocation.trim();
      setLocation(trimmed);
      setCustomLocations(prev => {
        const next = [...new Set([...prev, trimmed])];
        localStorage.setItem('qtp_custom_locations', JSON.stringify(next));
        setSetting('custom_locations', JSON.stringify(next)).catch(() => {});
        return next;
      });
      setCustomLocation('');
    }
  };

  const handleWeeksChange = (e) => {
    setWeeks(Number(e.target.value));
  };

  const previewDates = useMemo(() => {
    if (selectedDays.length === 0) return [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dates = [];
    for (let w = 0; w < weeks; w++) {
      for (const dayNum of selectedDays) {
        const target = new Date(startDate);
        target.setDate(startDate.getDate() + (w * 7));
        const currentDay = target.getDay();
        const targetDay = dayNum === 7 ? 0 : dayNum;
        const diff = (targetDay - currentDay + 7) % 7;
        target.setDate(target.getDate() + diff);
        if (target >= startDate) {
          dates.push(target);
        }
      }
    }
    return [...new Set(dates.map(d => d.toISOString().split('T')[0]))].sort();
  }, [selectedDays, weeks]);

  const previewText = useMemo(() => {
    if (previewDates.length === 0) return '';
    const dayLabels = selectedDays.map(d => DAYS.find(x => x.num === d)?.label || '').filter(Boolean).join('-');
    return `${previewDates.length} eventos (${dayLabels}, ${weeks} sem)`;
  }, [previewDates, selectedDays, weeks]);

  const fixedNames = FIXED_LOCATIONS.map(f => f.name);
  const locations = [...fixedNames, ...new Set([...(existingLocations?.filter(Boolean) || []), ...customLocations])];
  if (location && location !== '__custom__' && !locations.includes(location)) {
    locations.push(location);
  }
  const resolvedLocation = location === '__custom__' ? customLocation : location;

  const getMapsLink = (loc) => {
    const fixed = FIXED_LOCATIONS.find(f => f.name === loc);
    if (fixed) return fixed.mapsLink;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  };

  const handleCreate = async () => {
    if (selectedDays.length === 0 || !resolvedLocation) return;
    if (scopeType === 'makgora_team' && !scopeMakgoraTeamId) return;
    setCreating(true);
    await onCreate({
      recurrenceDays: selectedDays,
      recurrenceWeeks: weeks,
      date: new Date().toISOString().split('T')[0],
      time: hour,
      location: resolvedLocation,
      title: customTitle || 'Entrenamiento',
      type: customType,
      notes: customNotes || null,
      mapsLink: getMapsLink(resolvedLocation),
      teamCategory: currentTeamCategory,
      scopeType,
      scopeValue: scopeType === 'makgora_team' ? { makgora_team_id: scopeMakgoraTeamId } : {},
    });
    setCreating(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
        🏋️ Entreno Rapido
      </h3>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Dias</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button type="button" onClick={() => setPreset([1,2,3,4,5])} className="btn-outline"
              style={{ padding: '2px 6px', fontSize: '0.6rem' }}>L-V</button>
            <button type="button" onClick={() => setPreset([1,3,5])} className="btn-outline"
              style={{ padding: '2px 6px', fontSize: '0.6rem' }}>L-M-V</button>
            <button type="button" onClick={() => setPreset([6])} className="btn-outline"
              style={{ padding: '2px 6px', fontSize: '0.6rem' }}>Sab</button>
            <button type="button" onClick={() => setPreset([])} className="btn-outline"
              style={{ padding: '2px 6px', fontSize: '0.6rem', color: 'var(--color-red)', borderColor: 'rgba(255, 92, 77,0.2)' }}>Ninguno</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {DAYS.map(day => {
            const active = selectedDays.includes(day.num);
            return (
              <button
                key={day.num}
                type="button"
                onClick={() => toggleDay(day.num)}
                title={day.title}
                className={active ? 'btn-neon' : 'btn-outline'}
                style={{
                  padding: '5px 0', fontSize: '0.72rem', minWidth: '38px',
                  opacity: active ? 1 : 0.45, fontWeight: active ? 700 : 500,
                  justifyContent: 'center',
                }}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Hora</label>
          <select value={hour} onChange={handleHourChange} className="form-select" style={{ padding: '6px 8px', fontSize: '0.78rem' }}>
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.72rem' }}>Semanas</label>
          <select value={weeks} onChange={handleWeeksChange} className="form-select" style={{ padding: '6px 8px', fontSize: '0.78rem' }}>
            {[1, 2, 3, 4, 6, 8].map(w => (
              <option key={w} value={w}>{w} sem{w > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label style={{ fontSize: '0.72rem' }}>Lugar</label>
        <select value={location} onChange={handleLocationChange} className="form-select" style={{ padding: '6px 8px', fontSize: '0.78rem' }}>
          <option value="">Seleccionar lugar...</option>
          {locations.map((loc, i) => (
            <option key={i} value={loc}>{loc}</option>
          ))}
          <option value="__custom__">+ Nuevo lugar...</option>
        </select>
        {location === '__custom__' && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input
              type="text"
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              placeholder="Nombre del lugar"
              className="form-input"
              style={{ flex: 1, padding: '5px 8px', fontSize: '0.75rem' }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCustomLocationSave(); } }}
            />
            <button type="button" onClick={handleCustomLocationSave} className="btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.72rem', color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
              OK
            </button>
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-outline"
          style={{ width: '100%', padding: '4px', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}
        >
          {showAdvanced ? 'Ocultar opciones avanzadas ▲' : 'Opciones avanzadas ▼'}
        </button>
        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem' }}>Titulo personalizado</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ej. Entrenamiento Scrum (dejar vacio = 'Entrenamiento')"
                className="form-input"
                style={{ padding: '5px 8px', fontSize: '0.75rem' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem' }}>Tipo</label>
              <select value={customType} onChange={(e) => setCustomType(e.target.value)} className="form-select" style={{ padding: '5px 8px', fontSize: '0.75rem' }}>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem' }}>👁️ Visible para</label>
              <select value={scopeType} onChange={(e) => { setScopeType(e.target.value); setScopeMakgoraTeamId(''); }} className="form-select" style={{ padding: '5px 8px', fontSize: '0.75rem' }}>
                <option value="division">Solo esta división</option>
                <option value="all">Todo el club</option>
                <option value="makgora_team">Equipo Mak'Gora específico</option>
              </select>
              {scopeType === 'makgora_team' && makgoraTeams && makgoraTeams.length > 0 && (
                <select value={scopeMakgoraTeamId} onChange={(e) => setScopeMakgoraTeamId(e.target.value)} className="form-select" style={{ marginTop: '6px', padding: '5px 8px', fontSize: '0.75rem' }}>
                  <option value="">Seleccionar equipo...</option>
                  {makgoraTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.rpg_name || t.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '0.72rem' }}>Notas (opcional)</label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Instrucciones para los jugadores..."
                className="form-input"
                rows={2}
                style={{ padding: '5px 8px', fontSize: '0.75rem', resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>

      {previewText && (
        <div style={{
          fontSize: '0.68rem', color: 'var(--color-gold)',
          background: 'rgba(232, 185, 49,0.05)', padding: '6px 10px',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(232, 185, 49,0.1)',
        }}>
          {previewText}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={creating || selectedDays.length === 0 || !resolvedLocation}
        className="btn-neon"
        style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.85rem', fontWeight: 700 }}
      >
        {creating ? 'Creando...' : `Crear ${previewDates.length || 0} Entrenos`}
      </button>
    </div>
  );
}

export default QuickTrainingPanel;
