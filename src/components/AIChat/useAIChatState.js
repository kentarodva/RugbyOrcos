import { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { ClubContext } from '../../context/ClubContext';
import { isAnyAIConfigured, getModelConfig, streamChatWithAI, chatWithAI } from '../../engine/multiProviderCoach';
import { analyzeMatch } from '../../engine/matchAnalyzer';
import { useToast } from '../../context/ToastContext';

export function useAIChatState() {
  const { activeTeam, players, fixtures, schedule, championships } = useContext(ClubContext);
  const { showToast } = useToast();
  const messagesEndRef = useRef(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('orcos_ai_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingProvider, setStreamingProvider] = useState(null);
  const [chatMode, setChatMode] = useState('general');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzingMatch, setAnalyzingMatch] = useState(false);

  const configured = isAnyAIConfigured();
  const modelConfig = getModelConfig();
  const activeProvId = modelConfig.activeProviderId;
  const activeProvInfo = configured
    ? (activeProvId !== 'auto' ? modelConfig.current : modelConfig.available[0])
    : null;

  const teamFixtures = fixtures
    .filter(f => f.teamCategory === activeTeam)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const nextFixture = teamFixtures[0];
  const opponent = nextFixture?.opponent || '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  useEffect(() => {
    localStorage.setItem('orcos_ai_chat', JSON.stringify(messages.slice(-20)));
  }, [messages]);

  const buildContext = useCallback(() => ({
    activeTeam,
    opponentName: opponent,
    players,
    schedule,
    championships,
    fixtures,
    mode: chatMode
  }), [activeTeam, opponent, players, schedule, championships, fixtures, chatMode]);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', text: q, time: new Date().toISOString(), mode: chatMode };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStreamingText('');
    setStreamingProvider(null);

    if (configured) {
      let fullResponse = '';
      let usedProvider = null;

      await streamChatWithAI(
        q,
        (chunk) => {
          if (chunk.error) {
            fullResponse = 'Error: ' + chunk.error;
            setStreamingText(fullResponse);
          } else if (chunk.done) {
            fullResponse = chunk.fullText || fullResponse;
            if (!chunk.error) {
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
        { mode: chatMode }
      );

      if (!streamingText && !fullResponse) {
        const aiMsg = {
          role: 'ai',
          text: 'No se pudo obtener respuesta de ningun proveedor.',
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
  }, [input, loading, messages, chatMode, configured, buildContext]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClear = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('orcos_ai_chat');
    showToast('Chat limpiado.', 'info');
  }, [showToast]);

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
    activeProvInfo,
    teamFixtures,
    opponent,
    handleSend,
    handleKeyDown,
    handleClear,
    handleAnalyzeLastMatch,
    handleQuickQuestion,
    buildContext
  };
}
