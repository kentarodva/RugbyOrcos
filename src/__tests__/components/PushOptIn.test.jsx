import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const status = vi.fn();
const register = vi.fn();
vi.mock('../../utils/pushNotifications', () => ({
  getWebPushStatus: () => status(),
  registerWebPush: () => register(),
}));

import PushOptIn from '../../components/common/PushOptIn';

beforeEach(() => { status.mockReset(); register.mockReset(); globalThis.Notification = { permission: 'default' }; });

describe('PushOptIn', () => {
  it('ofrece activar cuando hay soporte y no está suscrito; al activar desaparece', async () => {
    status.mockResolvedValue({ supported: true, subscribed: false });
    register.mockResolvedValue({ success: true });
    render(<PushOptIn />);
    fireEvent.click(await screen.findByRole('button', { name: 'Activar' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: /activar notificaciones/i })).toBeNull());
  });

  it('no aparece si ya está suscrito', async () => {
    status.mockResolvedValue({ supported: true, subscribed: true });
    const { container } = render(<PushOptIn />);
    await waitFor(() => expect(status).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el error real si no se pudo guardar el dispositivo', async () => {
    status.mockResolvedValue({ supported: true, subscribed: false });
    register.mockResolvedValue({ success: false, error: 'Tu cuenta no está vinculada a una ficha de jugador.' });
    render(<PushOptIn />);
    fireEvent.click(await screen.findByRole('button', { name: 'Activar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no está vinculada/);
  });
});
