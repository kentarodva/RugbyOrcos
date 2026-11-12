import React, { useState, useEffect } from 'react';
import {
  formatHeightInputDisplay,
  parseHeightToCanonical,
  formatWeightInputDisplay,
  parseWeightToCanonical,
  formatCopInputDisplay,
  parseCopToCanonical,
  JERSEY_SHORTS_SIZES,
  SOCKS_SIZES,
} from '../../utils/inputFormatters';

const badgeStyle = {
  position: 'absolute',
  right: '8px',
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: '0.66rem',
  fontWeight: 800,
  letterSpacing: '0.04em',
  padding: '2px 5px',
  borderRadius: '4px',
  background: 'rgba(46, 229, 122, 0.12)',
  color: 'var(--color-primary)',
  border: '1px solid rgba(46, 229, 122, 0.25)',
  pointerEvents: 'none',
  fontFamily: 'var(--font-display)',
};

/**
 * Input de Altura con formato "1,85" y sufijo visual "M".
 * Si el usuario escribe "185" lo convierte automáticamente a "1,85".
 * Emite el valor numérico canónico (ej. "1.85") en e.target.value.
 */
export function HeightInput({
  value,
  onChange,
  placeholder = '1,85',
  className = 'form-input tabular-nums',
  style = {},
  required = false,
  disabled = false,
  ...rest
}) {
  const [display, setDisplay] = useState(() => formatHeightInputDisplay(value));

  useEffect(() => {
    const currentCanonical = parseHeightToCanonical(display);
    const propCanonical = parseHeightToCanonical(value);
    if (propCanonical !== currentCanonical) {
      setDisplay(formatHeightInputDisplay(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const formatted = formatHeightInputDisplay(raw);
    const canonical = parseHeightToCanonical(formatted);
    setDisplay(formatted);
    if (onChange) {
      onChange({ target: { value: canonical } });
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: style.width || '100%' }}>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        style={{ ...style, width: '100%', paddingRight: '34px' }}
        required={required}
        disabled={disabled}
        {...rest}
      />
      <span style={badgeStyle}>M</span>
    </div>
  );
}

/**
 * Input de Peso / Kilos con formato "85,5" y sufijo visual "KG".
 * Emite el valor numérico canónico (ej. "85.5") en e.target.value.
 */
export function WeightInput({
  value,
  onChange,
  unit = 'KG',
  placeholder = '85',
  className = 'form-input tabular-nums',
  style = {},
  required = false,
  disabled = false,
  ...rest
}) {
  const [display, setDisplay] = useState(() => formatWeightInputDisplay(value));

  useEffect(() => {
    const currentCanonical = parseWeightToCanonical(display);
    const propCanonical = parseWeightToCanonical(value);
    if (propCanonical !== currentCanonical) {
      setDisplay(formatWeightInputDisplay(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const formatted = formatWeightInputDisplay(raw);
    const canonical = parseWeightToCanonical(formatted);
    setDisplay(formatted);
    if (onChange) {
      onChange({ target: { value: canonical } });
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: style.width || '100%' }}>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        style={{ ...style, width: '100%', paddingRight: '38px' }}
        required={required}
        disabled={disabled}
        {...rest}
      />
      <span style={badgeStyle}>{unit}</span>
    </div>
  );
}

/**
 * Input de Dinero Colombiano ($ 120.000 COP) con separador de miles en vivo.
 * Emite el entero limpio ("120000") en e.target.value.
 */
export function CopInput({
  value,
  onChange,
  placeholder = '50.000',
  className = 'form-input tabular-nums',
  style = {},
  required = false,
  disabled = false,
  ...rest
}) {
  const display = formatCopInputDisplay(value);

  const handleChange = (e) => {
    const canonical = parseCopToCanonical(e.target.value);
    if (onChange) {
      onChange({ target: { value: canonical } });
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: style.width || '100%' }}>
      <span
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.82rem',
          fontWeight: 800,
          color: 'var(--color-gold)',
          pointerEvents: 'none',
          fontFamily: 'var(--font-display)',
        }}
      >
        $
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        style={{ ...style, width: '100%', paddingLeft: '24px', paddingRight: '46px' }}
        required={required}
        disabled={disabled}
        {...rest}
      />
      <span
        style={{
          ...badgeStyle,
          background: 'rgba(232, 185, 49, 0.14)',
          color: 'var(--color-gold)',
          border: '1px solid rgba(232, 185, 49, 0.28)',
        }}
      >
        COP
      </span>
    </div>
  );
}

/**
 * Selector estandarizado de tallas de uniforme (Camiseta, Pantaloneta, Medias)
 */
export function SizeSelect({
  kind = 'jersey',
  value,
  onChange,
  className = 'form-select',
  style = {},
  ...rest
}) {
  const baseOptions = kind === 'socks' ? SOCKS_SIZES : JERSEY_SHORTS_SIZES;
  const currentVal = value ? String(value).trim() : '';
  const options = currentVal && !baseOptions.includes(currentVal)
    ? [currentVal, ...baseOptions]
    : baseOptions;

  return (
    <select
      value={currentVal || (kind === 'socks' ? '40-42' : 'M')}
      onChange={onChange}
      className={className}
      style={style}
      {...rest}
    >
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
