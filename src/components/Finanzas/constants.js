export const MENSUALIDAD_BASE = 10000;
export const ABONOS_RAPIDOS = [2000, 5000, 10000];

export const FINANCE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'mensualidad', label: 'Mensualidad' },
  { value: 'pro_fondos', label: 'Pro-fondos (rifas, ventas)' },
  { value: 'eventualidad', label: 'Eventualidad (árbitro, cancha, ambulancia)' },
  { value: 'implementos', label: 'Implementos deportivos' },
  { value: 'tercer_tiempo', label: 'Tercer Tiempo' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'reunion', label: 'Reunión / Evento Social' },
  { value: 'hotel', label: 'Hotel / Alojamiento' },
  { value: 'prestamo', label: 'Préstamo / Deuda' },
  { value: 'alimentacion', label: 'Alimentación (comidas, hidratación)' },
  { value: 'otro', label: 'Otro' }
];

export const CATEGORY_LABELS = {
  eventualidad: 'Eventualidad',
  mensualidad: 'Mensualidad',
  pro_fondos: 'Pro-fondos',
  implementos: 'Implementos',
  tercer_tiempo: 'Tercer Tiempo',
  transporte: 'Transporte',
  reunion: 'Reunión',
  hotel: 'Hotel',
  prestamo: 'Préstamo',
  alimentacion: 'Alimentación',
  general: 'General'
};

export const MEMBERSHIP_STATUS = {
  alDia: { label: 'AL DÍA', color: 'var(--color-primary)', bg: 'rgba(46, 229, 122, 0.08)' },
  parcial: { label: 'PAGO PARCIAL', color: 'var(--color-gold)', bg: 'rgba(232, 185, 49, 0.08)' },
  casiAlDia: { label: 'CASI AL DÍA', color: 'var(--color-blue)', bg: 'rgba(64, 196, 255, 0.08)' },
  moroso: { label: 'MOROSO', color: 'var(--color-red)', bg: 'rgba(255, 92, 77, 0.06)' }
};

export const INVENTORY_STATUSES = ['Excelente', 'Bueno', 'Completo', 'Requiere Reposicion'];

export const INVENTORY_STATUS_OPTIONS = [
  { value: 'Excelente', label: 'Excelente' },
  { value: 'Bueno', label: 'Bueno' },
  { value: 'Completo', label: 'Completo' },
  { value: 'Requiere Reposicion', label: 'Requiere Reposicion' },
];

export const INVENTORY_CATEGORIES = [
  { value: 'equipamiento', label: 'Equipamiento' },
  { value: 'indumentaria', label: 'Indumentaria' },
  { value: 'medico', label: 'Medico' },
  { value: 'entrenamiento', label: 'Entrenamiento' },
  { value: 'otro', label: 'Otro' },
];

export const FINANCE_SUB_TABS = [
  { id: 'caja', label: 'Caja chica' },
  { id: 'membresias', label: 'Membresías' }
];

export const MAIN_SUB_TABS = [
  { id: 'finances', label: 'Caja y cuotas', activeColor: 'var(--color-primary)' },
  { id: 'fundraising', label: 'Ventas y rifas', activeColor: 'var(--color-gold)' },
  { id: 'inventory', label: 'Inventario', activeColor: 'var(--color-blue)' },
];
