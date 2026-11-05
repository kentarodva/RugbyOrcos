import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const showToast = vi.fn();
vi.mock('../../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast }) }));

const uploadCrest = vi.fn();
vi.mock('../../utils/crests', async (orig) => ({ ...(await orig()), uploadCrest: (...a) => uploadCrest(...a) }));

// Chainable Supabase stub: every query resolves to `result[table]`; updates are recorded.
const updates = [];
let updateRows = [{ id: 't1' }];
const players = [
  { id: 'p1', first_name: 'Kennent', last_name: 'Vergara', position_id: 1, jersey_number: 1 },
  { id: 'p2', first_name: 'Ana', last_name: 'Ruiz', position: 'Apertura' },
  { id: 'p3', first_name: 'Luis', last_name: 'Silva' },
];
vi.mock('../../supabaseClient.js', () => {
  const builder = (table) => {
    let op = 'select';
    const q = {
      select: () => q, eq: () => q, order: () => q, limit: () => q,
      update: (vals) => { op = 'update'; updates.push({ table, vals }); return q; },
      then: (res) => Promise.resolve(res(
        op === 'update' ? { data: updateRows, error: null }
          : { data: table === 'players' ? players : [], error: null },
      )),
    };
    return q;
  };
  return { supabase: { from: builder } };
});

import { TeamDetailModal, positionLine } from '../../components/MakgoraHub/TeamDetailModal';

const team = { id: 't1', name: 'Cuervos', rpg_name: 'Cuervos de la Tormenta', emblem_color: '#424242', crest_url: null, motto: null };

beforeEach(() => { updates.length = 0; updateRows = [{ id: 't1' }]; showToast.mockClear(); uploadCrest.mockReset(); });

describe('positionLine', () => {
  it('usa position_id (1-8 delanteros, 9-15 tres cuartos) y luego el texto', () => {
    expect(positionLine({ position_id: 1 })).toBe('forward');
    expect(positionLine({ position_id: 12 })).toBe('back');
    expect(positionLine({ position: 'Pilar izquierdo' })).toBe('forward');
    expect(positionLine({ position: 'Apertura' })).toBe('back');
    expect(positionLine({})).toBeNull();
  });
});

describe('TeamDetailModal', () => {
  it('es un panel con fondo y agrupa el plantel por línea', async () => {
    render(<TeamDetailModal team={team} onClose={() => {}} />);
    const dialog = screen.getByRole('dialog', { name: /Cuervos de la Tormenta/ });
    expect(dialog.className).toContain('glass-panel');
    expect(await screen.findByText(/DELANTEROS · 1/)).toBeInTheDocument();
    expect(screen.getByText(/TRES CUARTOS · 1/)).toBeInTheDocument();
    expect(screen.getByText(/SIN POSICIÓN ASIGNADA · 1/)).toBeInTheDocument();
  });

  it('un jugador no ve controles de edición', () => {
    render(<TeamDetailModal team={team} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /subir escudo/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /lema y color/i })).toBeNull();
  });

  it('staff sube un escudo: se guarda crest_url y se refresca', async () => {
    uploadCrest.mockResolvedValue('https://x/crests/clans/t1.png');
    const onChanged = vi.fn();
    const { container } = render(<TeamDetailModal team={team} canEdit onChanged={onChanged} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /subir escudo/i })).toBeInTheDocument();
    const file = new File(['x'], 'escudo.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(updates).toContainEqual({ table: 'makgora_teams', vals: { crest_url: 'https://x/crests/clans/t1.png' } });
    expect(showToast).toHaveBeenCalledWith('Escudo actualizado.', 'success');
  });

  it('staff edita lema y color', async () => {
    const onChanged = vi.fn();
    render(<TeamDetailModal team={team} canEdit onChanged={onChanged} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /lema y color/i }));
    fireEvent.change(screen.getByPlaceholderText(/Sangre y trueno/), { target: { value: 'Graznido y acero' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(updates[0].vals).toEqual({ motto: 'Graznido y acero', emblem_color: '#424242' });
  });

  it('si la base de datos no guarda ninguna fila, avisa y no finge éxito', async () => {
    updateRows = [];
    const onChanged = vi.fn();
    render(<TeamDetailModal team={team} canEdit onChanged={onChanged} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /lema y color/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/permiso/), 'error'));
    expect(onChanged).not.toHaveBeenCalled();
  });
});
