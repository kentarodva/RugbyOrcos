import React, { useState, useMemo, useCallback } from 'react';

const DAYS = [
  { num: 1, label: 'Lun' },
  { num: 2, label: 'Mar' },
  { num: 3, label: 'Mie' },
  { num: 4, label: 'Jue' },
  { num: 5, label: 'Vie' },
  { num: 6, label: 'Sab' },
  { num: 7, label: 'Dom' },
];

function AgendaForm({ initialData, onClose, onSave, existingEvents, currentTeamCategory, makgoraTeams }) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    date: initialData?.date || '',
    endDate: initialData?.endDate || '',
    time: initialData?.time || '',
    location: initialData?.location || '',
    maps: initialData?.maps || '',
    type: initialData?.type || 'entrenamiento',
    recurrence: initialData?.recurrence || 'none',
    recurrenceDays: initialData?.recurrenceDays || [1, 2, 3, 4, 5],
    recurrenceWeeks: initialData?.recurrenceWeeks || 4,
    linkedRoutine: initialData?.linkedRoutine || '',
    notes: initialData?.notes || '',
    scopeType: initialData?.scopeType || 'division',
    scopeValue: initialData?.scopeValue || {},
  });

  const [conflicts, setConflicts] = useState([]);

  const isEditing = !!initialData;
  const isCustom = form.recurrence === 'custom';
  const isMultiDay = form.endDate && form.endDate > form.date;

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const toggleDay = (dayNum) => {
    setForm(prev => {
      const days = prev.recurrenceDays.includes(dayNum)
        ? prev.recurrenceDays.filter(d => d !== dayNum)
        : [...prev.recurrenceDays, dayNum].sort((a, b) => a - b);
      return { ...prev, recurrenceDays: days };
    });
  };

  const checkConflicts = useCallback((date, time, teamCat) => {
    if (!existingEvents || !date || !time) return [];
    return existingEvents.filter(e =>
      e.date === date && e.time === time && e.teamCategory === teamCat && e.id !== initialData?.id
    );
  }, [existingEvents, initialData?.id]);

  const computedEvents = useMemo(() => {
    if (!form.date || !form.time) return [{ date: form.date, time: form.time }];
    if (form.recurrence !== 'custom' || form.recurrenceDays.length === 0) {
      return [{ date: form.date, time: form.time }];
    }
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
          dates.push({ date: target.toISOString().split('T')[0], time: form.time });
        }
      }
    }
    return [...new Set(dates.map(d => JSON.stringify(d)))].map(s => JSON.parse(s));
  }, [form.date, form.time, form.recurrenceDays, form.recurrenceWeeks, isCustom]);

  const previewDates = useMemo(() => {
    return computedEvents.map(e => e.date);
  }, [computedEvents]);

  const conflictWarning = useMemo(() => {
    if (!currentTeamCategory) return null;
    const found = [];
    computedEvents.forEach(e => {
      const hits = checkConflicts(e.date, e.time, currentTeamCategory);
      if (hits.length > 0) {
        found.push({ date: e.date, count: hits.length, titles: hits.map(h => h.title) });
      }
    });
    return found.length > 0 ? found : null;
  }, [computedEvents, currentTeamCategory, checkConflicts]);

  const handleScopeTypeChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({
      ...prev,
      scopeType: val,
      scopeValue: val === 'makgora_team'
        ? { makgora_team_id: '' }
        : val === 'players' ? { player_ids: [] } : {},
    }));
  };

  const handleScopeMakgoraTeam = (e) => {
    setForm(prev => ({ ...prev, scopeValue: { makgora_team_id: e.target.value } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.location) return;
    if (isCustom && form.recurrenceDays.length === 0) return;
    if (form.scopeType === 'makgora_team' && !form.scopeValue?.makgora_team_id) return;

    const finalMapsLink = form.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`;

    onSave({
      title: form.title,
      date: form.date,
      endDate: form.endDate || null,
      time: form.time,
      location: form.location,
      mapsLink: finalMapsLink,
      type: form.type,
      recurrence: form.recurrence,
      recurrenceDays: isCustom ? form.recurrenceDays : undefined,
      recurrenceWeeks: isCustom ? form.recurrenceWeeks : undefined,
      linkedRoutine: form.linkedRoutine || null,
      notes: form.notes || null,
      scopeType: form.scopeType,
      scopeValue: form.scopeValue,
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

        {conflictWarning && (
          <div style={{
            background: 'rgba(255,61,0,0.08)', border: '1px solid rgba(255,61,0,0.3)',
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem', color: 'var(--color-red)'
          }}>
            <strong>Conflictos detectados:</strong>
            {conflictWarning.slice(0, 3).map((c, i) => (
              <div key={i} style={{ marginTop: '4px' }}>
                {c.date} — {c.count} evento(s): {c.titles.slice(0, 2).join(', ')}
                {c.titles.length > 2 && ` +${c.titles.length - 2} mas`}
              </div>
            ))}
            {conflictWarning.length > 3 && <div style={{ marginTop: '4px' }}>...y {conflictWarning.length - 3} fechas mas</div>}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label>Fecha Fin (opcional)</label>
            <input type="date" value={form.endDate} onChange={set('endDate')} className="form-input" min={form.date} />
            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
              Para eventos multi-dia (torneos, campamentos)
            </span>
          </div>
          <div className="form-group">
            <label>Rutina Vinculada</label>
            <input type="text" value={form.linkedRoutine} onChange={set('linkedRoutine')} placeholder="Ej. Plan pretemporada" className="form-input" />
          </div>
        </div>

        <div className="form-group">
          <label>Notas / Instrucciones</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="Indicaciones para los jugadores, material necesario, objetivos del entrenamiento..."
            className="form-input"
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.8rem' }}
          />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)',
          padding: '15px', borderRadius: 'var(--radius-md)',
          display: 'flex', flexDirection: 'column', gap: '10px'
        }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 600 }}>👁️ Visibilidad del evento</label>
          <select value={form.scopeType} onChange={handleScopeTypeChange} className="form-select" style={{ fontSize: '0.78rem' }}>
            <option value="division">Solo esta división</option>
            <option value="all">Todo el club</option>
            <option value="makgora_team">Equipo Mak'Gora específico</option>
          </select>
          {form.scopeType === 'makgora_team' && makgoraTeams && makgoraTeams.length > 0 && (
            <select value={form.scopeValue?.makgora_team_id || ''} onChange={handleScopeMakgoraTeam} className="form-select" style={{ fontSize: '0.78rem' }}>
              <option value="">Seleccionar equipo...</option>
              {makgoraTeams.map(t => (
                <option key={t.id} value={t.id}>{t.rpg_name || t.name}</option>
              ))}
            </select>
          )}
        </div>

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
