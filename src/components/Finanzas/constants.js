export const MENSUALIDAD_BASE = 10000;
export const ABONOS_RAPIDOS = [2000, 5000, 10000];

export const FINANCE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'mensualidad', label: 'Mensualidad' },
  { value: 'eventualidad', label: 'Eventualidad (árbitro, cancha, ambulancia)' },
  { value: 'implementos', label: 'Implementos deportivos' },
  { value: 'tercer_tiempo', label: 'Tercer Tiempo' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'otro', label: 'Otro' }
];

export const CATEGORY_LABELS = {
  eventualidad: '🔴 Eventualidad',
  mensualidad: '👑 Mensualidad',
  implementos: '📦 Implementos',
  tercer_tiempo: '🍻 Tercer Tiempo',
  transporte: '🚌 Transporte'
};

export const MEMBERSHIP_STATUS = {
  alDia: { label: 'AL DÍA', color: 'var(--color-primary)', bg: 'rgba(0, 230, 118, 0.08)' },
  parcial: { label: 'PAGO PARCIAL', color: 'var(--color-gold)', bg: 'rgba(255, 179, 0, 0.08)' },
  casiAlDia: { label: 'CASI AL DÍA', color: 'var(--color-blue)', bg: 'rgba(64, 196, 255, 0.08)' },
  moroso: { label: 'MOROSO', color: 'var(--color-red)', bg: 'rgba(255, 61, 0, 0.06)' }
};

export const INVENTORY_STATUSES = ['Excelente', 'Bueno', 'Completo', 'Requiere Reposición'];

export const FINANCE_SUB_TABS = [
  { id: 'caja', label: '💰 Caja Chica' },
  { id: 'membresias', label: '👑 Membresías ($10.000)' }
];

export const MAIN_SUB_TABS = [
  { id: 'finances', label: '💰 Caja Chica y Membresías', activeColor: 'var(--color-primary)' },
  { id: 'inventory', label: '📦 Inventario', activeColor: 'var(--color-gold)' }
];
