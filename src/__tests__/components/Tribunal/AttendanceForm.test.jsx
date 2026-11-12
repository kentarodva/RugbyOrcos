import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AttendanceForm from '../../../components/Tribunal/AttendanceForm.jsx';

vi.mock('../../../components/PlayerPhoto', () => ({ PlayerPhoto: () => null }));

const players = [
  { id: 'p1', name: 'Juan Pérez', apodo: 'Toro' },
  { id: 'p2', name: 'Luis Gómez' },
  { id: 'p3', name: 'Ana Ruiz' },
];

function renderForm(overrides = {}) {
  const props = {
    selectedEventId: 'e1', onEventChange: vi.fn(),
    teamEvents: [{ id: 'e1', date: '2026-11-13', time: '19:30', title: 'Entreno', type: 'entrenamiento' }],
    attendanceState: {}, rsvpMap: { p1: 'not_going', p2: 'maybe' },
    onMarkConfirmedPresent: vi.fn(), teamPlayers: players,
    onAttendanceChange: vi.fn(), onSave: vi.fn(e => e.preventDefault()),
    ...overrides,
  };
  render(<AttendanceForm {...props} />);
  return props;
}

describe('AttendanceForm — quién avisó que no va', () => {
  it('Given a player said he is not going, When the coach takes attendance, Then he sees it before marking', () => {
    renderForm();
    const summary = screen.getByTestId('rsvp-summary');
    expect(summary.textContent).toContain('Avisaron que no van: Toro');
    expect(summary.textContent).toContain('Tal vez: Luis Gómez');
    expect(summary.textContent).toContain('1 sin responder');
  });

  it('the coach can justify in one tap the absences of those who warned', () => {
    const props = renderForm();
    fireEvent.click(screen.getByRole('button', { name: /falta justificada a quienes avisaron \(1\)/ }));
    expect(props.onAttendanceChange).toHaveBeenCalledWith('p1', 'falta_justificada');
    expect(props.onAttendanceChange).toHaveBeenCalledTimes(1);
  });

  it('without a linked event there is nothing to compare, so no summary', () => {
    renderForm({ selectedEventId: '' });
    expect(screen.queryByTestId('rsvp-summary')).toBeNull();
  });
});
