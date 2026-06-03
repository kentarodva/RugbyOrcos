import React, { useState, useMemo } from 'react';

const DAYS = [
  { num: 1, label: 'Lun' },
  { num: 2, label: 'Mar' },
  { num: 3, label: 'Mie' },
  { num: 4, label: 'Jue' },
  { num: 5, label: 'Vie' },
  { num: 6, label: 'Sab' },
  { num: 7, label: 'Dom' },
];

function AgendaForm({ initialData, onClose, onSave }) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    location: initialData?.location || '',
    maps: initialData?.maps || '',
    type: initialData?.type || 'entrenamiento',
    recurrence: initialData?.recurrence || 'none',
    recurrenceDays: initialData?.recurrenceDays || [1, 2, 3, 4, 5],
    recurrenceWeeks: initialData?.recurrenceWeeks || 4,
    linkedRoutine: initialData?.linkedRoutine || '',
  });

  const isEditing = !!initialData;
  const isCustom = form.recurrence === 'custom';

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleDay = (dayNum) => {
    setForm(prev => {
      const days = prev.recurrenceDays.includes(dayNum)
        ? prev.recurrenceDays.filter(d => d !== dayNum)
        : [...prev.recurrenceDays, dayNum].sort((a, b) => a - b);
      return { ...prev, recurrenceDays: days };
    });
  };

  const previewDates = useMemo(() => {
    if (!isCustom || !form.date || form.recurrenceDays.length === 0) return [];
    const startDate = new Date(form.date + 'T00:00:00');
    const weeks = form.recurrenceWeeks || 4;
    const dates = [];
    for (let w = 0; w < weeks; w++) {
      for (const dayNum of form.recurrenceDays) {
        const target = new Date(startDate);
        target.setDate(startDate.getDate() + (w * 7));
        const currentDay = target.getDay();
        const targetDay = dayNum === 7 ? 0 : dayNum;
        const diff = (targetDay - currentDay + 7) % 7;
        target.setDate(target.getDate() + diff);
        if (target >= startDate) {
          dates.push(target.toISOString().split('T')[0]);
        }
      }
    }
    return [...new Set(dates)].sort();
  }, [form.date, form.recurrenceDays, form.recurrenceWeeks, isCustom]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.location) return;
    if (isCustom && form.recurrenceDays.length === 0) return;

    const finalMapsLink = form.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`;

    onSave({
      title: form.title,
      date: form.date,
      time: form.time,
      location: form.location,
      mapsLink: finalMapsLink,
      type: form.type,
      recurrence: form.recurrence,
      recurrenceDays: isCustom ? form.recurrenceDays : undefined,
      recurrenceWeeks: isCustom ? form.recurrenceWeeks : undefined,
      linkedRoutine: form.linkedRoutine || null
    });
  };

  return (
    <div className="glass-panel animated-slide" style={{ padding: '25px' }}>
      <h3 className="neon-text-primary" style={{ marginBottom: '20px', fontFamily: 'Outfit' }}>
        {isEditing ? 'Editar Sesion' : 'Programar Sesion'}
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div className="form-group">
          <label>Nombre de la Actividad</label>
          <input
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder="Ej. Entrenamiento Scrum, Practica General, Partido vs Toros"
            className="form-input"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={form.date} onChange={set('date')} className="form-input" required />
          </div>
          <div className="form-group">
            <label>Hora</label>
            <input type="time" value={form.time} onChange={set('time')} className="form-input" required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Tipo de Evento</label>
            <select value={form.type} onChange={set('type')} className="form-select">
              <option value="entrenamiento">Entrenamiento</option>
              <option value="partido">Partido</option>
              <option value="reunion">Reunion</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label>Recurrencia</label>
            <select value={form.recurrence} onChange={set('recurrence')} className="form-select">
              <option value="none">Sin repeticion</option>
              <option value="semanal">Cada semana (x4)</option>
              <option value="quincenal">Cada 2 semanas (x2)</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        {isCustom && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
            padding: '15px', borderRadius: 'var(--radius-md)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Dias de la semana</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DAYS.map(day => {
                  const active = form.recurrenceDays.includes(day.num);
                  return (
                    <button
                      key={day.num}
                      type="button"
                      onClick={() => toggleDay(day.num)}
                      className={active ? 'btn-neon' : 'btn-outline'}
                      style={{
                        padding: '6px 12px', fontSize: '0.75rem', minWidth: '44px',
                        opacity: active ? 1 : 0.5,
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>Semanas</label>
              <select value={form.recurrenceWeeks} onChange={set('recurrenceWeeks')} className="form-select">
                {[1, 2, 3, 4, 6, 8].map(w => (
                  <option key={w} value={w}>{w} semana{w > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {previewDates.length > 0 && (
              <div style={{
                fontSize: '0.7rem', color: 'var(--color-gold)',
                background: 'rgba(255,179,0,0.05)', padding: '8px 10px',
                borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,179,0,0.1)',
              }}>
                <strong>{previewDates.length} eventos:</strong>{' '}
                {previewDates.slice(0, 6).map(d => {
                  const dt = new Date(d + 'T00:00:00');
                  return dt.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                }).join(', ')}
                {previewDates.length > 6 && `, +${previewDates.length - 6} mas`}
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Lugar / Complejo Deportivo</label>
          <input
            type="text"
            value={form.location}
            onChange={set('location')}
            placeholder="Ej. Cancha de Rugby Timiza"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label>Enlace de Google Maps (Opcional)</label>
          <input
            type="url"
            value={form.maps}
            onChange={set('maps')}
            placeholder="https://maps.google.com/?q=..."
            className="form-input"
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Si se deja vacio, la app generara un enlace de busqueda automatico con el nombre del lugar.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn-outline">Cancelar</button>
          <button type="submit" className="btn-neon">{isEditing ? 'Actualizar Evento' : 'Guardar en Agenda'}</button>
        </div>
      </form>
    </div>
  );
}

export default AgendaForm;
