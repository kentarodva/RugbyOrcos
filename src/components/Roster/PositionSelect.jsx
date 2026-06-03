import React, { useState, useEffect } from 'react';
import { fetchRugbyPositions } from '../../data/supabaseApi.js';

const FALLBACK_POSITIONS = [
  { id: 1, name_es: 'Pilar Izquierdo', abbreviation: 'PIL' },
  { id: 2, name_es: 'Talonador', abbreviation: 'TAL' },
  { id: 3, name_es: 'Pilar Derecho', abbreviation: 'PIL' },
  { id: 4, name_es: 'Segunda Línea', abbreviation: '2L' },
  { id: 5, name_es: 'Segunda Línea', abbreviation: '2L' },
  { id: 6, name_es: 'Ala (Flanker)', abbreviation: 'ALA' },
  { id: 7, name_es: 'Ala (Flanker)', abbreviation: 'ALA' },
  { id: 8, name_es: 'Octavo / N8', abbreviation: 'N8' },
  { id: 9, name_es: 'Medio Scrum', abbreviation: 'MS' },
  { id: 10, name_es: 'Apertura', abbreviation: 'AP' },
  { id: 11, name_es: 'Wing Izquierdo', abbreviation: 'W' },
  { id: 12, name_es: 'Centro Interior', abbreviation: 'CI' },
  { id: 13, name_es: 'Centro Exterior', abbreviation: 'CE' },
  { id: 14, name_es: 'Wing Derecho', abbreviation: 'W' },
  { id: 15, name_es: 'Zaguero', abbreviation: 'ZAG' },
];

function PositionSelect({ value, onChange, className, style, id }) {
  const [positions, setPositions] = useState(FALLBACK_POSITIONS);

  useEffect(() => {
    let cancelled = false;
    fetchRugbyPositions().then(data => {
      if (!cancelled && data && data.length > 0) {
        setPositions(data);
      }
    }).catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[PositionSelect] Failed to fetch positions from Supabase, using fallback:', err.message);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const deduped = [];
  const seen = new Set();
  for (const p of positions) {
    const key = `${p.name_es}_${p.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(p);
    }
  }

  const handleChange = (e) => {
    const posId = e.target.value ? Number(e.target.value) : null;
    const pos = deduped.find(p => p.id === posId);
    if (onChange) {
      onChange({
        position_id: posId,
        position_name: pos ? pos.name_es : '',
      });
    }
  };

  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={handleChange}
      className={className || 'form-select'}
      style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-glass)',
        color: 'var(--color-text)',
        fontWeight: '600',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        fontSize: '0.8rem',
        ...style,
      }}
    >
      <option value="">-- Sin posición --</option>
      {deduped.map(p => (
        <option key={p.id} value={p.id}>
          {p.name_es} ({p.abbreviation})
        </option>
      ))}
    </select>
  );
}

export default PositionSelect;
