import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const showToast = vi.fn();
vi.mock('../../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../../context/ToastContext', () => ({ useToast: () => ({ showToast }) }));

const uploadCrest = vi.fn();
vi.mock('../../utils/crests', async (orig) => ({ ...(await orig()), uploadCrest: (...a) => uploadCrest(...a) }));

// Chainable Supabase stub: reads resolve to fixtures; writes go through rpc() and are recorded.
const rpcCalls = [];
let rpcError = null;
const players = [
  { id: 'p1', first_name: 'Kennent', last_name: 'Vergara', position_id: 1, jersey_number: 1 },
  { id: 'p2', first_name: 'Ana', last_name: 'Ruiz', position: 'Ala Izquierdo (Wing)' },
  { id: 'p3', first_name: 'Luis', last_name: 'Silva' },
];
vi.mock('../../supabaseClient.js', () => {
  const builder = (table) => {
    const q = {
      select: () => q, eq: () => q, order: () => q, limit: () => q,
      then: (res) => Promise.resolve(res({ data: table === 'players' ? players : [], error: null })),
    };
    return q;
  };
  return {
    supabase: {
      from: builder,
      rpc: (fn, args) => { rpcCalls.push({ fn, args }); return Promise.resolve({ data: null, error: rpcError }); },
    },
  };
});

import { TeamDetailModal, positionLine } from '../../components/MakgoraHub/TeamDetailModal';

const team = { id: 't1', name: 'Cuervos', rpg_name: 'Cuervos de la Tormenta', emblem_color: '#424242', crest_url: null, motto: null };

beforeEach(() => { rpcCalls.length = 0; rpcError = null; showToast.mockClear(); uploadCrest.mockReset(); });

describe('positionLine', () => {
  it('usa position_id (1-8 delanteros, 9-15 tres cuartos) y luego el texto', () => {
    expect(positionLine({ position_id: 1 })).toBe('forward');
    expect(positionLine({ position_id: 12 })).toBe('back');
    expect(positionLine({ position: 'Pilar izquierdo' })).toBe('forward');
    expect(positionLine({ position: 'Apertura' })).toBe('back');
    expect(positionLine({})).toBeNull();
  });
  it('"Ala" es el wing (tres cuartos), no un delantero', () => {
    expect(positionLine({ position: 'Ala Izquierdo (Wing)' })).toBe('back');
    expect(positionLine({ position: 'Flanker Abierto' })).toBe('forward');
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

  it('un jugador no ve controles de edición ni puede tocar guerreros', async () => {
    render(<TeamDetailModal team={team} onClose={() => {}} />);
    await screen.findByText(/DELANTEROS/);
    expect(screen.queryByRole('button', { name: /subir escudo/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /lema y color/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /editar posición/i })).toBeNull();
  });

  it('el jefe ve su insignia', () => {
    render(<TeamDetailModal team={team} canEdit isChief onClose={() => {}} />);
    expect(screen.getByText(/Eres jefe de este clan/)).toBeInTheDocument();
  });

  it('subir escudo guarda vía makgora_update_clan y refresca', async () => {
    uploadCrest.mockResolvedValue('https://x/storage/v1/object/public/crests/clans/t1-1.png');
    const onChanged = vi.fn();
    const { container } = render(<TeamDetailModal team={team} canEdit onChanged={onChanged} onClose={() => {}} />);
    const file = new File(['x'], 'escudo.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(rpcCalls).toContainEqual({ fn: 'makgora_update_clan', args: { p_team: 't1', p_changes: { crest_url: 'https://x/storage/v1/object/public/crests/clans/t1-1.png' } } });
    expect(showToast).toHaveBeenCalledWith('Escudo actualizado.', 'success');
  });

  it('editar lema y color', async () => {
    const onChanged = vi.fn();
    render(<TeamDetailModal team={team} canEdit onChanged={onChanged} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /lema y color/i }));
    fireEvent.change(screen.getByPlaceholderText(/Sangre y trueno/), { target: { value: 'Graznido y acero' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(rpcCalls[0]).toEqual({ fn: 'makgora_update_clan', args: { p_team: 't1', p_changes: { motto: 'Graznido y acero', emblem_color: '#424242' } } });
  });

  it('si el servidor rechaza (no es jefe de ese clan), avisa y no refresca', async () => {
    rpcError = { message: 'Solo el staff o el jefe de este clan puede editarlo.' };
    const onChanged = vi.fn();
    render(<TeamDetailModal team={team} canEdit onChanged={onChanged} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /lema y color/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringMatching(/jefe de este clan/), 'error'));
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('asignar posición y dorsal a un guerrero', async () => {
    render(<TeamDetailModal team={team} canEdit onClose={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: /editar posición y dorsal de Luis Silva/i }));
    fireEvent.change(screen.getByLabelText('Posición'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Dorsal'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar guerrero' }));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith('Luis Silva actualizado', 'success'));
    expect(rpcCalls).toContainEqual({ fn: 'makgora_update_player', args: { p_player: 'p3', p_position_id: 10, p_jersey: 10 } });
  });
});
