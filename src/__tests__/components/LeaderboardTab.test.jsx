import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardTab } from '../../components/Estadisticas/LeaderboardTab';

describe('LeaderboardTab', () => {
  const mockPlayers = [
    {
      id: 'p-1',
      name: 'Esteban',
      last_name: 'Zuluaga',
      camiseta: 11,
      posicion: 'Wing',
      tries: 7,
      partidos_jugados: 12,
      makgora_xp: 2400,
      teamCategory: 'masculina_mayor'
    },
    {
      id: 'p-2',
      name: 'Mateo',
      last_name: 'Arango',
      camiseta: 10,
      posicion: 'Apertura',
      puntos_pie: 45,
      partidos_jugados: 10,
      makgora_xp: 1800,
      teamCategory: 'masculina_mayor'
    }
  ];

  it('renderiza podios de Tryman de Oro, Botín de Oro y Escudo de Hierro', () => {
    render(<LeaderboardTab players={mockPlayers} />);
    expect(screen.getByText(/TRYMAN \/ TRYWOMAN DE ORO/i)).toBeInTheDocument();
    expect(screen.getByText(/BOTÍN DE ORO/i)).toBeInTheDocument();
    expect(screen.getByText(/ESCUDO DE HIERRO/i)).toBeInTheDocument();
    expect(screen.getByText(/CAMPEÓN MAKGORA/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Esteban Zuluaga/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mateo Arango/i).length).toBeGreaterThan(0);
  });
});
