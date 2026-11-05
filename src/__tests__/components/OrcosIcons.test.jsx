import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  OrcosRugbyBallIcon,
  OrcosBattleAxeHPostsIcon,
  OrcosTackleShieldIcon,
  OrcosThirdTimeHornIcon,
  OrcosWhistleIcon,
  OrcosDelayClockIcon,
  OrcosCardIcon,
  OrcosWarBannerIcon
} from '../../components/common/OrcosIcons';

describe('OrcosIcons — Iconografía Bélica & Rugby', () => {
  it('renderiza todos los iconos SVG sin errores', () => {
    const { container: c1 } = render(<OrcosRugbyBallIcon size={32} />);
    expect(c1.querySelector('svg')).toBeInTheDocument();

    const { container: c2 } = render(<OrcosBattleAxeHPostsIcon size={32} />);
    expect(c2.querySelector('svg')).toBeInTheDocument();

    const { container: c3 } = render(<OrcosTackleShieldIcon size={32} />);
    expect(c3.querySelector('svg')).toBeInTheDocument();

    const { container: c4 } = render(<OrcosThirdTimeHornIcon size={32} />);
    expect(c4.querySelector('svg')).toBeInTheDocument();

    const { container: c5 } = render(<OrcosWhistleIcon size={32} />);
    expect(c5.querySelector('svg')).toBeInTheDocument();

    const { container: c6 } = render(<OrcosDelayClockIcon size={32} />);
    expect(c6.querySelector('svg')).toBeInTheDocument();

    const { container: c7 } = render(<OrcosCardIcon type="yellow" size={32} />);
    expect(c7.querySelector('svg')).toBeInTheDocument();

    const { container: c8 } = render(<OrcosWarBannerIcon size={32} />);
    expect(c8.querySelector('svg')).toBeInTheDocument();
  });
});
