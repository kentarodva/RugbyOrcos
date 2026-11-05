import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoanList } from '../../components/MakgoraHub/LoanList';

const teams = [
  { id: 'cuervos', name: 'Cuervos', rpg_name: 'Cuervos', is_active: true },
  { id: 'trolls', name: 'Trolls', rpg_name: 'Trolls', is_active: true },
  { id: 'orcos', name: 'Orcos', rpg_name: 'Orcos', is_active: true },
];
const players = [
  { id: 'a', name: 'Ana', posicion: 'Ala', makgora_team_id: 'cuervos' },
  { id: 'b', name: 'Beto', posicion: 'Pilar', makgora_team_id: 'trolls' },
];
// Trolls asks Cuervos for Ana.
const loan = { id: 'l1', status: 'pending', from_team_id: 'cuervos', to_team_id: 'trolls', start_date: '2026-11-05', end_date: '2026-11-12', players: { first_name: 'Ana', last_name: 'R' } };

const base = { loans: [loan], players, teams, showLoanForm: false, loanForm: { playerId: '', toTeamId: '', reason: '', days: 7 },
  setLoanForm: vi.fn(), onToggleForm: vi.fn(), onSubmit: vi.fn(), onApprove: vi.fn(), onReject: vi.fn(), onReturn: vi.fn(), onCancel: vi.fn() };

describe('Permisos de préstamos', () => {
  it('jugador sin clan a cargo: solo mira', () => {
    render(<LoanList {...base} />);
    expect(screen.queryByRole('button', { name: /solicitar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /aprobar/i })).toBeNull();
  });

  it('jefe del clan que PRESTA (Cuervos) aprueba o rechaza', () => {
    render(<LoanList {...base} myClanIds={['cuervos']} />);
    expect(screen.getByRole('button', { name: /aprobar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument();
  });

  it('jefe del clan que PIDE (Trolls) no se aprueba a sí mismo, pero puede cancelar', () => {
    render(<LoanList {...base} myClanIds={['trolls']} />);
    expect(screen.queryByRole('button', { name: /aprobar/i })).toBeNull();
    expect(screen.getByRole('button', { name: /cancelar solicitud/i })).toBeInTheDocument();
  });

  it('jefe de un tercer clan (Orcos) no ve acciones sobre ese préstamo', () => {
    render(<LoanList {...base} myClanIds={['orcos']} />);
    expect(screen.queryByRole('button', { name: /aprobar|rechazar|cancelar solicitud/i })).toBeNull();
    expect(screen.getByRole('button', { name: /solicitar préstamo/i })).toBeInTheDocument();
  });

  it('el formulario del jefe solo ofrece su clan como destino y jugadores de otros clanes', () => {
    render(<LoanList {...base} showLoanForm myClanIds={['trolls']} />);
    const selects = screen.getAllByRole('combobox');
    const playerOpts = [...selects[0].options].map(o => o.value).filter(Boolean);
    const teamOpts = [...selects[1].options].map(o => o.value).filter(Boolean);
    expect(playerOpts).toEqual(['a']);
    expect(teamOpts).toEqual(['trolls']);
  });

  it('staff ve todas las acciones', () => {
    render(<LoanList {...base} isStaff />);
    expect(screen.getByRole('button', { name: /aprobar/i })).toBeInTheDocument();
  });
});
