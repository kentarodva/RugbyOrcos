import React, { useState, useMemo } from 'react';

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

function QuickTrainingPanel({ onCreate, existingLocations, currentTeamCategory }) {
  const [selectedDays, setSelectedDays] = useState(() => {
    try {
      const saved = localStorage.getItem('orcos_quick_days');
      return saved ? JSON.parse(saved) : [1, 2, 3, 4, 5];
    } catch { return [1, 2, 3, 4, 5]; }
  });
  const [hour, setHour] = useState(() => localStorage.getItem('orcos_quick_hour') || '19:00');
  const [location, setLocation] = useState(() => localStorage.getItem('orcos_quick_location') || '');
  const [customLocation, setCustomLocation] = useState('');
  const [weeks, setWeeks] = useState(() => Number(localStorage.getItem('orcos_quick_weeks') || 4));
  const [creating, setCreating] = useState(false);

  const toggleDay = (dayNum) => {
    setSelectedDays(prev => {
      const next = prev.includes(dayNum)
        ? prev.filter(d => d !== dayNum)
        : [...prev, dayNum].sort((a, b) => a - b);
      localStorage.setItem('orcos_quick_days', JSON.stringify(next));
      return next;
    });
  };

  const setPreset = (days) => {
    setSelectedDays(days);
    localStorage.setItem('orcos_quick_days', JSON.stringify(days));
  };

  const handleHourChange = (e) => {
    setHour(e.target.value);
    localStorage.setItem('orcos_quick_hour', e.target.value);
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setLocation('__custom__');
    } else {
      setLocation(val);
      localStorage.setItem('orcos_quick_location', val);
    }
  };

  const handleCustomLocationSave = () => {
    if (customLocation.trim()) {
      const trimmed = customLocation.trim();
      setLocation(trimmed);
      localStorage.setItem('orcos_quick_location', trimmed);
      setCustomLocation('');
    }
  };

  const handleWeeksChange = (e) => {
    const val = Number(e.target.value);
    setWeeks(val);
    localStorage.setItem('orcos_quick_weeks', val);
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

  const locations = [...new Set(existingLocations?.filter(Boolean) || [])];
  if (location && location !== '__custom__' && !locations.includes(location)) {
    locations.push(location);
  }
  const resolvedLocation = location === '__custom__' ? customLocation : location;

  const handleCreate = async () => {
    if (selectedDays.length === 0 || !resolvedLocation) return;
    setCreating(true);
    await onCreate({
      recurrenceDays: selectedDays,
      recurrenceWeeks: weeks,
      date: new Date().toISOString().split('T')[0],
      time: hour,
      location: resolvedLocation,
      title: 'Entrenamiento',
      type: 'entrenamiento',
      mapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolvedLocation)}`,
      teamCategory: currentTeamCategory,
    });
    setCreating(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--color-primary)' }}>
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
              style={{ padding: '2px 6px', fontSize: '0.6rem', color: 'var(--color-red)', borderColor: 'rgba(255,61,0,0.2)' }}>Ninguno</button>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

      {previewText && (
        <div style={{
          fontSize: '0.68rem', color: 'var(--color-gold)',
          background: 'rgba(255,179,0,0.05)', padding: '6px 10px',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,179,0,0.1)',
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
