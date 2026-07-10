import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';

let onAuthChangeCb;

const mockAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn((cb) => {
    onAuthChangeCb = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }),
  updateUser: vi.fn(),
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
};

function mockBuilder(terminalResult = { data: null, error: null }) {
  const b = {
    select: vi.fn(() => b),
    eq: vi.fn(() => b),
    or: vi.fn(() => b),
    neq: vi.fn(() => b),
    limit: vi.fn(() => b),
    update: vi.fn(() => b),
    maybeSingle: vi.fn(() => Promise.resolve(terminalResult)),
    upsert: vi.fn(() => Promise.resolve(terminalResult)),
    insert: vi.fn(() => Promise.resolve(terminalResult)),
  };
  return b;
}
const mockFrom = vi.fn(() => mockBuilder());

vi.mock('../../supabaseClient.js', () => ({
  supabase: { auth: mockAuth, from: mockFrom },
}));

const { AuthProvider, useAuth } = await import('../../context/AuthContext.jsx');

function TestComponent() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="authenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="user-email">{auth.user?.email || 'null'}</div>
      <div data-testid="profile-name">{auth.profile?.display_name || 'null'}</div>
      <div data-testid="require-pw-change">{String(auth.requirePasswordChange)}</div>
      <button data-testid="btn-signin" onClick={() => auth.signIn('a@b.com', 'pw')}>Sign In</button>
      <button data-testid="btn-signout" onClick={() => auth.signOut()}>Sign Out</button>
      <button data-testid="btn-force-admin" onClick={() => auth.forceAdmin()}>Force Admin</button>
    </div>
  );
}

function setup() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
}

describe('AuthProvider — sesión', () => {
  beforeEach(() => { vi.clearAllMocks(); onAuthChangeCb = null; });

  it('inicia sin sesión cuando no hay session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('null');
    });
  });

  it('restaura sesión existente al montar', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com', user_metadata: {} };
    mockAuth.getSession.mockResolvedValue({ data: { session: { user: fakeUser } }, error: null });
    const b = mockBuilder({ data: { id: 'p1', display_name: 'Alpha', user_id: 'u1' }, error: null });
    mockFrom.mockReturnValue(b);
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Alpha');
    });
    expect(b.select).toHaveBeenCalledWith('*');
    expect(b.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(b.maybeSingle).toHaveBeenCalled();
  });

  it('detecta temp_password en user_metadata', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com', user_metadata: { temp_password: true } };
    mockAuth.getSession.mockResolvedValue({ data: { session: { user: fakeUser } }, error: null });
    mockFrom.mockReturnValue(mockBuilder({ data: null, error: null }));
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('require-pw-change')).toHaveTextContent('true');
    });
  });
});

describe('AuthProvider — signIn / signUp / signOut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthChangeCb = null;
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('signIn exitoso', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com' };
    mockAuth.signInWithPassword.mockResolvedValue({ data: { user: fakeUser, session: { user: fakeUser } }, error: null });
    const b = mockBuilder({ data: { id: 'p1', display_name: 'Alpha', user_id: 'u1' }, error: null });
    mockFrom.mockReturnValue(b);

    setup();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    await act(async () => {
      screen.getByTestId('btn-signin').click();
      if (onAuthChangeCb) onAuthChangeCb('SIGNED_IN', { user: { ...fakeUser } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
  });

  it('signIn con error retorna error', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: null, error: new Error('Invalid credentials') });
    mockFrom.mockReturnValue(mockBuilder());
    setup();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    const before = screen.getByTestId('authenticated').textContent;
    expect(before).toBe('false');
  });

  it('signOut limpia sesión y perfil', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com', user_metadata: {} };
    mockAuth.getSession.mockResolvedValue({ data: { session: { user: fakeUser } }, error: null });
    const b = mockBuilder({ data: { id: 'p1', display_name: 'Alpha', user_id: 'u1' }, error: null });
    mockFrom.mockReturnValue(b);
    setup();
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    await act(async () => {
      screen.getByTestId('btn-signout').click();
      if (onAuthChangeCb) onAuthChangeCb('SIGNED_OUT', null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('profile-name')).toHaveTextContent('null');
    });
    expect(mockAuth.signOut).toHaveBeenCalled();
  });
});

describe('AuthProvider — signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthChangeCb = null;
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('signUp crea auth + perfil', async () => {
    const newUser = { id: 'u2', email: 'n@b.com' };
    mockAuth.signUp.mockResolvedValue({ data: { user: newUser }, error: null });
    const b = mockBuilder();
    const upsertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    b.upsert = upsertSpy;
    mockFrom.mockReturnValue(b);

    const SignUpTest = () => {
      const auth = useAuth();
      return <button data-testid="btn-do-signup" onClick={async () => { await auth.signUp('n@b.com', 'pw123', 'Nuevo Usuario'); }}>Do SignUp</button>;
    };
    render(<AuthProvider><SignUpTest /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('btn-do-signup')).toBeTruthy());
    await act(async () => { screen.getByTestId('btn-do-signup').click(); });
    expect(mockAuth.signUp).toHaveBeenCalledWith({ email: 'n@b.com', password: 'pw123' });
    expect(upsertSpy).toHaveBeenCalledWith({
      user_id: 'u2', display_name: 'Nuevo Usuario', system_role: 'desarrollador',
      club_scope: null, division_scope: null, is_active: true,
    }, { onConflict: 'user_id' });
  });

  it('signUp con error de auth no crea perfil', async () => {
    mockAuth.signUp.mockResolvedValue({ data: null, error: new Error('Email exists') });
    const b = mockBuilder();
    const upsertSpy = vi.fn();
    b.upsert = upsertSpy;
    mockFrom.mockReturnValue(b);

    const SignUpTest = () => {
      const auth = useAuth();
      return <button data-testid="btn-do-signup2" onClick={async () => { await auth.signUp('x@b.com', 'pw123', 'X'); }}>Do SignUp2</button>;
    };
    render(<AuthProvider><SignUpTest /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('btn-do-signup2')).toBeTruthy());
    await act(async () => { screen.getByTestId('btn-do-signup2').click(); });
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});

describe('AuthProvider — repairProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthChangeCb = null;
    mockAuth.getUser.mockResolvedValue({ data: { user: { email: 'a@b.com' } }, error: null });
  });

  it('busca perfil huérfano por display_name cuando falla user_id', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com', user_metadata: {} };
    mockAuth.getSession.mockResolvedValue({ data: { session: { user: fakeUser } }, error: null });
    const b = mockBuilder();
    b.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const orphanProfile = { id: 'p1', display_name: 'Alpha', user_id: 'other-id' };
    const step4 = vi.fn().mockResolvedValue({ data: orphanProfile, error: null });
    const step3 = vi.fn(() => ({ maybeSingle: step4 }));
    const step2 = vi.fn(() => ({ limit: step3 }));
    const step1 = vi.fn(() => ({ neq: step2 }));
    b.or = step1;
    b.neq = vi.fn();
    b.limit = vi.fn();
    b.maybeSingle.mockResolvedValueOnce({ data: { ...orphanProfile, user_id: 'u1' }, error: null });
    const updateSpy = vi.fn(() => b);
    b.update = updateSpy;
    mockFrom.mockReturnValue(b);

    setup();
    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Alpha');
    });
    expect(step1).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });
});

describe('AuthProvider — checkFirstRun / forceAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthChangeCb = null;
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('checkFirstRun retorna true sin perfiles', async () => {
    const CheckTest = () => {
      const auth = useAuth();
      const [result, setResult] = React.useState(null);
      return <div><button data-testid="btn-check" onClick={async () => setResult(await auth.checkFirstRun())}>Check</button><span data-testid="check-result">{String(result)}</span></div>;
    };
    const countResult = { count: 0, error: null, data: null };
    const b = mockBuilder();
    b.select = vi.fn(() => countResult);
    mockFrom.mockReturnValue(b);

    render(<AuthProvider><CheckTest /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('btn-check')).toBeTruthy());
    await act(async () => { screen.getByTestId('btn-check').click(); });
    await waitFor(() => expect(screen.getByTestId('check-result')).toHaveTextContent('true'));
  });

  it('forceAdmin upserts perfil con role desarrollador', async () => {
    const fakeUser = { id: 'u1', email: 'a@b.com', user_metadata: {} };
    mockAuth.getSession.mockResolvedValue({ data: { session: { user: fakeUser } }, error: null });
    const b = mockBuilder({ data: { id: 'p1', display_name: 'Alpha', user_id: 'u1' }, error: null });
    const upsertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    b.upsert = upsertSpy;
    mockFrom.mockReturnValue(b);

    setup();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    act(() => { screen.getByTestId('btn-force-admin').click(); });
    await waitFor(() => {
      expect(upsertSpy).toHaveBeenCalled();
    });
    const upsertCall = upsertSpy.mock.calls[0][0];
    expect(upsertCall.system_role).toBe('desarrollador');
    expect(upsertCall.user_id).toBe('u1');
  });
});
