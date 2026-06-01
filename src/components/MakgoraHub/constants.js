export const LOAN_STATUS_COLORS = {
  pending: '#ffb300',
  approved: '#00e676',
  rejected: '#ff3d00',
  returned: '#9e9e9e',
  cancelled: '#9e9e9e'
};

export const LOAN_STATUS_LABELS = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  returned: 'Devuelto',
  cancelled: 'Cancelado'
};

export const TOURNAMENT_STATUS_MAP = {
  proximo: { label: 'Proximo', color: '#9e9e9e' },
  en_curso: { label: 'En Curso', color: '#ffb300' },
  finalizado: { label: 'Finalizado', color: '#00e676' }
};

export const STYLE = {
  lbl: { fontSize: '0.75rem', color: 'var(--color-gold)', fontWeight: 700, marginBottom: '6px', display: 'block' },
  inp: { width: '100%', boxSizing: 'border-box', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text)', padding: '10px', fontSize: '0.85rem', outline: 'none', textAlign: 'center' },
  th: { padding: '8px', color: 'var(--color-gold)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' },
  td: { padding: '10px 8px', color: 'var(--color-text)', fontSize: '0.8rem' },
  btnSm: { padding: '4px 10px', background: 'var(--color-primary)', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }
};

export const TABS = [
  { id: 'teams', label: 'Equipos' },
  { id: 'tournaments', label: 'Torneos' },
  { id: 'loans', label: 'Prestamos' }
];
