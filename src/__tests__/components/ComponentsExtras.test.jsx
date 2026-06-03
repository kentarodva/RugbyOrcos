import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Invitaciones from '../../components/Invitaciones';
import Settings from '../../components/Settings';
import Header from '../../components/Header';

vi.mock('../../supabaseClient', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('../../context/ClubContext', () => ({
  ClubContext: React.createContext(),
  CLUBS: [],
  CLUBS_LABELS: {},
  SYSTEM_ROLES: {},
  SYSTEM_ROLES_LABELS: {},
  RPG_ROLES: {
    desarrollador: { tier: 0, title: 'Arquitecto del Reino', icon: '\u{1F3F0}', color: '#e040fb' },
    presidente: { tier: 1, title: 'Senor de la Guerra', icon: '\u{2694}\u{FE0F}', color: '#ffb300' },
    jugador: { tier: 4, title: 'Guerrero', icon: '\u{1F479}', color: '#9e9e9e' },
  },
  SUPER_ROLES: ['desarrollador', 'presidente'],
  DIVISIONES: [],
  DIVISIONES_LABELS: {},
  EQUIPOS: {},
  EQUIPOS_LABELS: {},
  MAKGORA_TEAMS: [],
  getRpgRole: function () { return { tier: 4, title: 'Guerrero' }; },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: function () {
    return {
      user: { email: 'admin@orcos.com', id: 'u1' },
      profile: { system_role: 'desarrollador', display_name: 'Admin', club_scope: null, is_active: true },
      session: {},
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      checkFirstRun: vi.fn().mockResolvedValue(false),
      fetchProfile: vi.fn(),
    };
  },
  AuthProvider: function ({ children }) { return React.createElement(React.Fragment, null, children); },
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: function () { return { showToast: vi.fn() }; },
  ToastProvider: function ({ children }) { return React.createElement(React.Fragment, null, children); },
}));

vi.mock('../../engine/multiProviderCoach', () => ({
  isGeminiConfigured: function () { return false; },
  getModelConfig: function () { return { activeProviderId: 'auto', current: {}, available: [] }; },
  getActiveProvider: function () { return 'auto'; },
  setProviderKey: vi.fn(),
  setSelectedModel: vi.fn(),
  getRateLimitInfo: function () { return { used: 0, limit: 999 }; },
  getRateLimitInfoAll: function () { return { groq: { used: 0, limit: 14400 }, deepseek: { used: 0, limit: 500 }, gemini: { used: 0, limit: 1500 } }; },
  debugAIConnection: vi.fn().mockResolvedValue({ error: false }),
  debugProviderConnection: vi.fn().mockResolvedValue({ error: false }),
  DEFAULT_PROVIDER_ORDER: ['groq', 'deepseek', 'gemini'],
  PROVIDERS: {
    groq: { id: 'groq', name: 'Groq', icon: '\u26A1', desc: 'Gratis, rapido', priority: 1, apiKeyStorage: 'orcos_groq_key', endpoint: 'https://api.groq.com', defaultModel: 'llama3_70b', models: { llama3_70b: { id: 'llama3-70b-8192', label: 'Llama 3 70B', maxTokens: 2048, timeout: 10000, dailyLimit: 14400 } } },
    deepseek: { id: 'deepseek', name: 'DeepSeek', icon: '\u{1F50D}', desc: '500 req/dia', priority: 2, apiKeyStorage: 'orcos_deepseek_key', endpoint: 'https://api.deepseek.com', defaultModel: 'deepseek_chat', models: { deepseek_chat: { id: 'deepseek-chat', label: 'DeepSeek V3', maxTokens: 2048, timeout: 20000, dailyLimit: 500 } } },
    gemini: { id: 'gemini', name: 'Gemini', icon: '\u{1F9E0}', desc: '1500 req/dia', priority: 3, apiKeyStorage: 'orcos_gemini_key', endpoint: 'https://generativelanguage.googleapis.com', defaultModel: 'flash', models: { flash: { id: 'gemini-2.5-flash', label: 'Gemini Flash', maxTokens: 2048, timeout: 30000, dailyLimit: 1500 } } },
  },
}));

vi.mock('../../components/NavBar', () => ({
  default: function () { return React.createElement('div', null); },
}));

vi.mock('../../components/Notifications/NotificationsButton', () => ({
  default: function () { return React.createElement('div', null); },
}));

const { ClubContext } = await import('../../context/ClubContext');

function wrapInClubContext(ui, contextValue) {
  return React.createElement(
    ClubContext.Provider,
    {
      value: {
        matchInvitations: [],
        createInvitation: vi.fn(),
        cancelInvitation: vi.fn(),
        deleteInvitation: vi.fn(),
        futureFixtures: [],
        players: [],
        currentUser: { email: 'test@test.com' },
        isSuperRole: false,
        syncStatus: 'online',
        hasPermission: function () { return true; },
        userRole: 'desarrollador',
        userTier: 0,
        activeTeam: 'orcos_masculina_mayor',
        viewMode: 'general',
        divisionView: 'all',
        setViewMode: vi.fn(),
        setDivisionView: vi.fn(),
        ...(contextValue || {}),
      },
    },
    ui,
  );
}

describe('Invitaciones — renderizado', function () {
  it('renderiza el boton de Nueva Invitacion', function () {
    render(wrapInClubContext(React.createElement(Invitaciones)));
    expect(screen.getByText('+ Nueva Invitacion')).toBeDefined();
  });

  it('renderiza los filtros de Activas / Historial / Todas', function () {
    render(wrapInClubContext(React.createElement(Invitaciones)));
    expect(screen.getByText(/Activas/)).toBeDefined();
    expect(screen.getByText(/Historial/)).toBeDefined();
    expect(screen.getByText(/Todas/)).toBeDefined();
  });

  it('muestra mensaje sin invitaciones activas', function () {
    render(wrapInClubContext(React.createElement(Invitaciones)));
    expect(screen.getByText(/No hay invitaciones activas/)).toBeDefined();
  });
});

describe('Settings — renderizado', function () {
  it('renderiza la configuracion de IA', function () {
    render(wrapInClubContext(React.createElement(Settings, {
      onClose: vi.fn(),
      apiKeys: { groq: '', deepseek: '', gemini: '' },
      onChangeKey: vi.fn(),
    })));
    expect(screen.getByText(/Proveedor Activo/)).toBeDefined();
  });
});

describe('Header — renderizado', function () {
  var headerProps = {
    activeTab: 'dashboard',
    setActiveTab: vi.fn(),
    sidebarOpen: false,
    setSidebarOpen: vi.fn(),
    profile: { system_role: 'desarrollador', display_name: 'Admin' },
    syncStatus: 'online',
    viewMode: 'general',
    setViewMode: vi.fn(),
    divisionView: 'all',
    setDivisionView: vi.fn(),
    makgoraTeamId: null,
    setMakgoraTeamId: vi.fn(),
    makgoraTeams: [],
    hasPermission: function () { return true; },
    showAdminPanel: false,
    setShowAdminPanel: vi.fn(),
    _showSettings: false,
    setShowSettings: vi.fn(),
    _showImportCSV: false,
    setShowImportCSV: vi.fn(),
    fileInputRef: { current: null },
    handleImportFileChange: vi.fn(),
    triggerImportClick: vi.fn(),
    handleLogout: vi.fn(),
    exportData: vi.fn(),
  };

  it('muestra los botones principales', function () {
    render(wrapInClubContext(React.createElement(Header, headerProps)));
    expect(screen.getByText(/Respaldar/)).toBeDefined();
    expect(screen.getByText(/Cargar/)).toBeDefined();
  });
});
