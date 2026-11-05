import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { useViewFilter } from '../../context/hooks/useFilterByView';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient.js';
import { isAnyAIConfigured, getModelConfig, streamChatWithAI, chatWithAI } from '../../engine/multiProviderCoach';
import { isLoaded } from '../../data/clubSettings';
import { analyzeMatch } from '../../engine/matchAnalyzer';
import { getActivePlan } from '../../engine/trainingPlanService';
import { useToast } from '../../context/ToastContext';

export function useAIChatState() {
  const { activeTeam, players, fixtures, schedule, championships, futureFixtures } = useContext(ClubContext);
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const messagesEndRef = useRef(null);
  const filterByView = useViewFilter();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined' || !user?.id) return [];
    try {
      const cached = window.localStorage.getItem(`orcos_chat_history_${user.id}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingProvider, setStreamingProvider] = useState(null);
  const [chatMode, setChatMode] = useState('general');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('ai_chat_history').select('messages').eq('user_id', user.id).single().then(({ data }) => {
      if (data?.messages) {
        try {
          const parsed = typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(`orcos_chat_history_${user.id}`, JSON.stringify(parsed));
            }
          }
        } catch { /* ignore */ }
      }
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(`orcos_chat_history_${user.id}`, JSON.stringify(messages));
      } catch { /* ignore */ }
    }
    const timer = setTimeout(async () => {
      try {
        await supabase.from('ai_chat_history').upsert({
          user_id: user.id,
          messages: messages.slice(-50),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch { /* silencioso */ }
    }, 1000);
    return () => clearTimeout(timer);
  }, [messages, user?.id]);

  const player = (players || []).find(p => {
    if (profile?.display_name && p.name.toLowerCase() === profile.display_name.toLowerCase()) return true;
    if (user?.email && p.contacto?.email === user.email) return true;
    return false;
  });

  useEffect(() => {
    if (!player?.id) return;
    getActivePlan(player.id).then(setActivePlan).catch(() => {});
  }, [player?.id]);

  const [settingsReady, setSettingsReady] = useState(isLoaded());
  useEffect(() => {
    if (settingsReady) return;
    const check = setInterval(() => {
      if (isLoaded()) { setSettingsReady(true); clearInterval(check); }
    }, 500);
    return () => clearInterval(check);
  }, [settingsReady]);

  const configured = settingsReady ? isAnyAIConfigured() : false;
  const modelConfig = settingsReady ? getModelConfig() : { activeProviderId: 'auto', available: [] };
  const activeProvId = modelConfig.activeProviderId;
  const activeProvInfo = configured
    ? (activeProvId !== 'auto' ? modelConfig.current : modelConfig.available[0])
    : null;

  const teamFixtures = filterByView(fixtures)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastFixture = teamFixtures[0];
  const nextUpcoming = filterByView(futureFixtures || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const opponent = nextUpcoming[0]?.opponent || lastFixture?.opponent || '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const PROFILE_KEYWORDS = ['perfil', 'profile', 'datos', 'cómo estoy', 'como estoy', 'cómo soy', 'como soy', 'mis stats', 'mis atributos', 'mis datos'];

  function isProfileQuery(text) {
    const lower = text.toLowerCase();
    return PROFILE_KEYWORDS.some(k => lower.includes(k));
  }

  function buildProfileResponse(p) {
    if (!p) return 'No se encontró tu perfil de jugador. Contacta al staff.';
    const attrs = p.attributes || {};
    const gym = p.gymStats || {};
    const att = p.attendance || {};
    const injury = p.injuryLog?.[0];
    const lines = [];

    lines.push(`**${p.name}**${p.apodo ? ` "${p.apodo}"` : ''}`);
    lines.push(`#${p.camiseta || '—'} · ${p.posicion || '—'}`);
    lines.push(`Rol: ${p.systemRole || 'jugador'} · Equipo: ${p.teamCategory || '—'}`);
    lines.push(`Estado: **${p.estado === 'activo' ? '✅ Activo' : p.estado === 'lesionado' ? '🩹 Lesionado' : p.estado === 'suspendido' ? '🔴 Suspendido' : p.estado || '—'}**`);

    lines.push('');
    lines.push('**Atributos de Batalla:**');
    lines.push(`• Fuerza: ${attrs.force || 50}/100`);
    lines.push(`• Velocidad: ${attrs.speed || 50}/100`);
    lines.push(`• Resistencia: ${attrs.stamina || 50}/100`);
    lines.push(`• Técnica: ${attrs.technique || 50}/100`);

    if (gym.squat || gym.bench || gym.deadlift) {
      lines.push('');
      lines.push('**Rendimiento Físico:**');
      lines.push(`• Sentadilla: ${gym.squat || 0}kg`);
      lines.push(`• Press Banca: ${gym.bench || 0}kg`);
      lines.push(`• Peso Muerto: ${gym.deadlift || 0}kg`);
      if (p.weight) {
        const rel = ((gym.squat + gym.bench + gym.deadlift) / p.weight).toFixed(1);
        lines.push(`• Fuerza Relativa: ${rel}x PC`);
      }
    }

    if (injury) {
      lines.push('');
      lines.push(`🩹 **Lesión Activa:** ${injury.diagnosis || 'N/A'}`);
      lines.push(`Fase ${injury.phase || 1}/4 de recuperación`);
    }

    const totalAtt = att.total || 0;
    if (totalAtt > 0) {
      const pct = Math.round((att.present || 0) / totalAtt * 100);
      lines.push('');
      lines.push(`**Asistencia:** ${pct}% (${att.present || 0}/${totalAtt} presentes)`);
    }

    return lines.join('\n');
  }

  const buildContext = useCallback(() => {
    const ctx = {
      activeTeam,
      opponentName: opponent,
      players,
      schedule,
      championships,
      fixtures,
      mode: chatMode,
    };
    if (player) {
      ctx.playerProfile = `Nombre: ${player.name}, Posición: ${player.posicion || '—'}, Equipo: ${player.teamCategory || '—'}`;
    }
    if (activePlan) {
      const total = Object.values(activePlan.plan || {}).reduce((s, list) => s + list.length, 0);
      ctx.activePlan = `Plan activo: ${total} ejercicios esta semana (${activePlan.source.toUpperCase()})`;
    }
    return ctx;
  }, [activeTeam, opponent, players, schedule, championships, fixtures, futureFixtures, chatMode, activePlan, player]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', text: q, time: new Date().toISOString(), mode: chatMode };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    // Profile query: responder desde estado local, sin IA
    if (isProfileQuery(q) && player) {
      const profileText = buildProfileResponse(player);
      const profileMsg = {
        role: 'ai', text: profileText, time: new Date().toISOString(),
        mode: chatMode, provider: 'local', isError: false,
      };
      setMessages(prev => [...prev, profileMsg]);
      return;
    }

    setLoading(true);
    setStreamingText('');
    setStreamingProvider(null);

    if (configured) {
      let fullResponse = '';
      let usedProvider = null;
      let hadError = false;

      const streamCtx = { mode: chatMode };
      if (player) {
        streamCtx.playerProfile = `Nombre: ${player.name}, Posición: ${player.posicion || '—'}, Equipo: ${player.teamCategory || '—'}`;
      }
      if (activePlan) {
        const total = Object.values(activePlan.plan || {}).reduce((s, list) => s + list.length, 0);
        streamCtx.activePlan = `Plan activo: ${total} ejercicios esta semana (${activePlan.source.toUpperCase()})`;
      }
      await streamChatWithAI(
        q,
        (chunk) => {
          if (chunk.error) {
            hadError = true;
            fullResponse = 'Error: ' + chunk.error;
            setStreamingText(fullResponse);
          } else if (chunk.done) {
            fullResponse = chunk.fullText || fullResponse;
            if (!chunk.error && !chunk.empty) {
              const aiMsg = {
                role: 'ai',
                text: fullResponse,
                time: new Date().toISOString(),
                mode: chatMode,
                provider: chunk.provider || usedProvider || 'unknown',
                isError: false
              };
              setMessages(prev => [...prev, aiMsg]);
            }
            setStreamingText('');
            setStreamingProvider(null);
          } else {
            if (chunk.provider) usedProvider = chunk.provider;
            setStreamingText(chunk.fullText || chunk.text);
            setStreamingProvider(chunk.provider || null);
          }
        },
        streamCtx
      );

      if (!streamingText && !fullResponse && !hadError) {
        const aiMsg = {
          role: 'ai',
          text: 'El servicio de IA no generó respuesta. Intenta de nuevo con otra pregunta.',
          time: new Date().toISOString(),
          mode: chatMode,
          isError: true
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } else {
      const result = await chatWithAI(q, buildContext());
      const aiMsg = {
        role: 'ai',
        text: result.error || result.text,
        time: new Date().toISOString(),
        mode: chatMode,
        provider: result.provider,
        isError: !!result.error
      };
      setMessages(prev => [...prev, aiMsg]);
    }

    setLoading(false);
  }, [input, loading, messages, chatMode, configured, buildContext, player]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClear = useCallback(async () => {
    setMessages([]);
    if (typeof window !== 'undefined' && user?.id) {
      try {
        window.localStorage.removeItem(`orcos_chat_history_${user.id}`);
        await supabase.from('ai_chat_history').upsert({
          user_id: user.id,
          messages: [],
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } catch { /* ignore */ }
    }
    showToast('Chat limpiado y reiniciado.', 'info');
  }, [user?.id, showToast]);

  const handleAnalyzeLastMatch = useCallback(async () => {
    if (teamFixtures.length === 0) {
      showToast('No hay partidos registrados para analizar.', 'warning');
      return;
    }
    setShowAnalysis(true);
    setAnalyzingMatch(true);
    setAnalysisResult(null);

    const lastFixture = teamFixtures[0];
    const result = await analyzeMatch(lastFixture, players, activeTeam);
    setAnalysisResult(result);
    setAnalyzingMatch(false);
  }, [teamFixtures, players, activeTeam, showToast]);

  const handleQuickQuestion = useCallback((question) => {
    setInput(question);
  }, []);

  return {
    input, setInput,
    messages, setMessages,
    loading, setLoading,
    streamingText, setStreamingText,
    streamingProvider, setStreamingProvider,
    chatMode, setChatMode,
    showAnalysis, setShowAnalysis,
    analysisResult, setAnalysisResult,
    analyzingMatch, setAnalyzingMatch,
    messagesEndRef,
    configured,
    settingsReady,
    activeProvInfo,
    teamFixtures,
    teamSchedule: schedule,
    teamFutureFixtures: futureFixtures,
    opponent,
    handleSend,
    handleKeyDown,
    handleClear,
    handleAnalyzeLastMatch,
    handleQuickQuestion,
    buildContext
  };
}
