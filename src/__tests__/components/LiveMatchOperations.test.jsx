import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchDelayModal, { DELAY_REASONS } from '../../components/Calendario/FixtureTab/LiveMatch/MatchDelayModal';
import MatchHeader from '../../components/Calendario/FixtureTab/LiveMatch/MatchHeader';
import LiveScorer from '../../components/Calendario/FixtureTab/LiveMatch/LiveScorer';

describe('MatchDelayModal & Sucre/Corozal Delay Realities', () => {
  it('renders delay reasons including transport and emergency response', () => {
    const onSetDelay = vi.fn();
    const onConfirmKickoff = vi.fn();
    const onClose = vi.fn();

    render(
      <MatchDelayModal
        isOpen={true}
        onClose={onClose}
        status="delayed"
        onSetDelay={onSetDelay}
        onConfirmKickoff={onConfirmKickoff}
      />
    );

    expect(screen.getByText(/Protocolo de Retraso de Partido/i)).toBeInTheDocument();
    expect(screen.getByText(/Sincelejo \/ Montería \/ Barranquilla/i)).toBeInTheDocument();
    expect(screen.getByText(/paramédico \/ primeros auxilios en cancha Corozal/i)).toBeInTheDocument();
  });

  it('allows applying delay reason', () => {
    const onSetDelay = vi.fn();
    const onConfirmKickoff = vi.fn();
    const onClose = vi.fn();

    render(
      <MatchDelayModal
        isOpen={true}
        onClose={onClose}
        status="delayed"
        onSetDelay={onSetDelay}
        onConfirmKickoff={onConfirmKickoff}
      />
    );

    const applyBtn = screen.getByText(/Establecer Partido en Espera/i);
    fireEvent.click(applyBtn);

    expect(onSetDelay).toHaveBeenCalledWith(DELAY_REASONS[0].label);
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers kickoff confirmation button when delayed', () => {
    const onSetDelay = vi.fn();
    const onConfirmKickoff = vi.fn();
    const onClose = vi.fn();

    render(
      <MatchDelayModal
        isOpen={true}
        onClose={onClose}
        status="delayed"
        onSetDelay={onSetDelay}
        onConfirmKickoff={onConfirmKickoff}
      />
    );

    const kickoffBtn = screen.getByText(/¡Pitazo de Kickoff Confirmado!/i);
    fireEvent.click(kickoffBtn);

    expect(onConfirmKickoff).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe('MatchHeader — Delayed State & Orcos Iconography', () => {
  it('renders delayed banner when match status is delayed', () => {
    const liveMatch = {
      id: 'm-1',
      status: 'delayed',
      delay_reason: 'Espera de ambulancia en cancha Corozal',
      opponent_name: 'Toros Sincelejo',
      orcos_score: 0,
      opponent_score: 0,
    };

    render(
      <MatchHeader
        liveMatch={liveMatch}
        liveEvents={[]}
        onPause={vi.fn()}
        onResume={vi.fn()}
      />
    );

    expect(screen.getByText(/PARTIDO EN ESPERA EN COROZAL, SUCRE/i)).toBeInTheDocument();
    expect(screen.getByText(/Espera de ambulancia en cancha Corozal/i)).toBeInTheDocument();
    expect(screen.getByText(/¡Pitazo Inicial Real!/i)).toBeInTheDocument();
  });
});

describe('LiveScorer — Designated Scorer & Spectator Guardrail', () => {
  const players = [
    { id: 'p-1', name: 'Carlos Ramos', camiseta: 10, rol: 'Titular' },
    { id: 'p-2', name: 'Mateo Zuluaga', camiseta: 8, rol: 'Titular' },
  ];

  it('allows scoring freely when no designated scorer is locked', () => {
    const onAddEvent = vi.fn();
    const liveMatch = {
      status: 'live',
      designated_scorer_name: null,
      scorer_locked: false,
    };

    render(
      <LiveScorer
        players={players}
        liveMatch={liveMatch}
        onAddEvent={onAddEvent}
        getElapsed={() => 120}
        canManageMatch={true}
      />
    );

    expect(screen.getByText(/Sin asignar \(Cualquiera en mesa puede anotar\)/i)).toBeInTheDocument();
    const tryBtn = screen.getByText(/Try Orcos/i);
    fireEvent.click(tryBtn);

    expect(onAddEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'try',
      team: 'orcos',
      minute: 120,
    }));
  });

  it('disables scoring in spectator mode when locked to someone else', () => {
    const onAddEvent = vi.fn();
    const liveMatch = {
      status: 'live',
      designated_scorer_name: 'Juez FCR Roberto',
      scorer_locked: true,
    };

    render(
      <LiveScorer
        players={players}
        liveMatch={liveMatch}
        onAddEvent={onAddEvent}
        getElapsed={() => 60}
        currentUser={{ email: 'espectador@orcos.com' }}
        currentProfile={{ display_name: 'Espectador Juan' }}
        canManageMatch={false}
      />
    );

    expect(screen.getByText(/Modo Espectador:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Juez FCR Roberto/i).length).toBeGreaterThanOrEqual(1);

    const tryBtn = screen.getByText(/Try Orcos/i);
    fireEvent.click(tryBtn);
    expect(onAddEvent).not.toHaveBeenCalled();
  });
});
