/**
 * Utilidades de formato para entradas numéricas del Club (Altura, Peso/Kilos, Dinero COP, Tallas).
 */

/**
 * Convierte un valor numérico o texto de altura (ej. 1.85, "1,85", "185") en texto visual con coma: "1,85"
 */
export function formatHeightInputDisplay(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const str = String(raw).trim();
  if (!str) return '';

  // Permitir mientras el usuario escribe "1," o "1."
  if (/^[12][,.]$/.test(str)) {
    return str.replace('.', ',');
  }

  // Si escribió 3 dígitos seguidos sin coma ni punto (ej. "185" cm -> "1,85")
  const digitsOnly = str.replace(/[^0-9]/g, '');
  if (/^[12]\d{2}$/.test(str)) {
    return `${digitsOnly[0]},${digitsOnly.slice(1, 3)}`;
  }

  // Si tiene separador decimal
  const normalized = str.replace(',', '.');
  const match = normalized.match(/^(\d)(?:\.(\d{0,2}))?/);
  if (match) {
    const intPart = match[1];
    const decPart = match[2];
    if (decPart !== undefined) {
      return `${intPart},${decPart}`;
    }
    return intPart;
  }

  return digitsOnly.slice(0, 3);
}

/**
 * Convierte el texto visual de altura ("1,85" o "185") al valor numérico estándar para BD ("1.85")
 */
export function parseHeightToCanonical(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const str = String(raw).trim();
  if (!str) return '';

  if (/^[12]\d{2}$/.test(str)) {
    return `${str[0]}.${str.slice(1, 3)}`;
  }

  const clean = str.replace(',', '.').replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`;
  }
  if (parts.length === 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return clean;
}

/**
 * Formatea una altura para visualización de lectura: 1.85 -> "1,85M"
 */
export function formatHeightM(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(num) || num <= 0) return '—';
  const fixed = num > 3 ? (num / 100).toFixed(2) : num.toFixed(2);
  return `${fixed.replace('.', ',')}M`;
}

/**
 * Formatea peso/kilos para input visual con coma decimal opcional ("85,5")
 */
export function formatWeightInputDisplay(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const str = String(raw).trim();
  if (!str) return '';
  if (str.endsWith(',') || str.endsWith('.')) {
    return str.slice(0, -1).replace(/[^0-9]/g, '') + ',';
  }
  const normalized = str.replace(',', '.').replace(/[^0-9.]/g, '');
  const [intPart = '', decPart] = normalized.split('.');
  const cleanInt = intPart.slice(0, 3);
  if (decPart !== undefined) {
    return `${cleanInt},${decPart.slice(0, 1)}`;
  }
  return cleanInt;
}

/**
 * Convierte peso con coma ("85,5") a valor numérico canónico ("85.5")
 */
export function parseWeightToCanonical(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const str = String(raw).trim().replace(',', '.').replace(/[^0-9.]/g, '');
  if (!str) return '';
  const [intPart = '', decPart] = str.split('.');
  if (decPart !== undefined) {
    return decPart.length > 0 ? `${intPart.slice(0, 3)}.${decPart.slice(0, 1)}` : `${intPart.slice(0, 3)}.`;
  }
  return intPart.slice(0, 3);
}

/**
 * Formatea peso en lectura: 85.5 -> "85,5 KG"
 */
export function formatWeightKg(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(num) || num <= 0) return '—';
  const formatted = Number.isInteger(num) ? String(num) : num.toFixed(1).replace('.', ',');
  return `${formatted} KG`;
}

/**
 * Formatea un número entero en formato miles colombiano para inputs: 120000 -> "120.000"
 */
export function formatCopInputDisplay(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  const digits = String(raw).replace(/[^0-9]/g, '');
  if (!digits) return '';
  const num = Number(digits);
  if (!Number.isFinite(num)) return '';
  return num.toLocaleString('es-CO');
}

/**
 * Extrae el valor numérico limpio desde un input COP formateado: "120.000" -> "120000"
 */
export function parseCopToCanonical(raw) {
  if (raw === null || raw === undefined || raw === '') return '';
  return String(raw).replace(/[^0-9]/g, '');
}

/**
 * Formatea un monto en lectura: 120000 -> "$120.000 COP"
 */
export function formatCOP(value, includeSuffix = true) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return includeSuffix ? '$0 COP' : '$0';
  return `$${num.toLocaleString('es-CO')}${includeSuffix ? ' COP' : ''}`;
}

export const JERSEY_SHORTS_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const SOCKS_SIZES = ['S (35-38)', 'M (38-40)', '40-42', 'L (43-45)', 'XL (46+)'];
