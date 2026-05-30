import React, { useState, useRef, useEffect, useContext } from 'react';
import { ClubContext, EQUIPOS_LABELS } from '../context/ClubContext';
import { isGeminiConfigured, getModelConfig, streamChatWithGemini, chatWithGemini, PROVIDERS } from '../engine/multiProviderCoach';
import { analyzeMatch } from '../engine/matchAnalyzer';
import { CHAT_MODES } from '../engine/aiConfig';
import { sanitizeAndFormatAI } from '../engine/contentFilter';
import { useToast } from '../context/ToastContext';

function AIChat() {
  const { activeTeam, players, fixtures, schedule, championships } = useContext(ClubContext);
  const { showToast } = useToast();
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
  const messagesEndRef = useRef(null);
  const configured = isGeminiConfigured();
  const modelConfig = getModelConfig();
  const activeProvId = modelConfig.activeProviderId;
  const activeProvInfo = activeProvId !== 'auto' ? PROVIDERS[activeProvId] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  useEffect(() => {
    localStorage.setItem('orcos_ai_chat', JSON.stringify(messages.slice(-20)));
  }, [messages]);

  const teamFixtures = fixtures
    .filter(f => f.teamCategory === activeTeam)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const nextFixture = teamFixtures[0];
  const opponent = nextFixture?.opponent || '';

  const buildContext = () => ({
    activeTeam,
    opponentName: opponent,
    players,
    schedule,
    championships,
    fixtures,
    mode: chatMode
  });

  const handleSend = async () => {
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

      await streamChatWithGemini(
        q,
        (chunk) => {
          if (chunk.error) {
            fullResponse = `Error: ${chunk.error}`;
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
          text: 'No se pudo obtener respuesta de ningún proveedor.',
          time: new Date().toISOString(),
          mode: chatMode,
          isError: true
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } else {
      const result = await chatWithGemini(q, buildContext());
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
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem('orcos_ai_chat');
    showToast('Chat limpiado.', 'info');
  };

  const handleAnalyzeLastMatch = async () => {
    if (teamFixtures.length === 0) {
      showToast('No hay partidos registrados para analizar.', 'warning');
      return;
    }
    setShowAnalysis(true);
    setAnalyzingMatch(true);
    setAnalysisResult(null);

    const lastFixture = teamFixtures[0];
    const teamLabel = EQUIPOS_LABELS[activeTeam] || '';

    const result = await analyzeMatch(lastFixture, players, teamLabel);
    setAnalysisResult(result);
    setAnalyzingMatch(false);
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  const examples = {
    general: [
      '¿Es offside si el medio melé pasa la línea del ruck?',
      '¿Cómo defender un lineout a 5 metros del rival?',
      'Recomiéndame una rutina de gimnasio para forwards'
    ],
    tactico: [
      '¿Cómo organizar una defensa drift contra ataque profundo?',
      '¿Qué formación usar cuando hay viento en contra?',
      'Estrategia para ganar metros desde la salida de 22m'
    ],
    reglas: [
      'Explícame la Ley 15 del ruck en detalle',
      '¿Cuándo se cobra un scrum en lugar de penal?',
      '¿Qué dice la regla sobre el tackle alto?'
    ]
  };

  const getProviderBadge = (providerId) => {
    const p = PROVIDERS[providerId];
    if (!p) return null;
    return { icon: p.icon, name: p.name, color: 'var(--color-gold)' };
  };

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }} className="neon-text-primary">
            🧠 Chat Táctico
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {configured
              ? (activeProvInfo
                ? `${activeProvInfo.icon} ${activeProvInfo.name} — ${activeProvInfo.desc}`
                : '🤖 Auto — Multi-proveedor con fallback')
              : '🔴 Sin proveedores configurados'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {teamFixtures.length > 0 && (
            <button
              onClick={handleAnalyzeLastMatch}
              disabled={analyzingMatch || !configured}
              className="btn-outline"
              style={{ padding: '5px 12px', fontSize: '0.7rem' }}
            >
              {analyzingMatch ? '⏳ Analizando...' : '📊 Analizar Partido'}
            </button>
          )}
          {messages.length > 0 && (
            <button onClick={handleClear} className="btn-outline" style={{ padding: '5px 12px', fontSize: '0.7rem' }}>
              🗑️ Limpiar
            </button>
          )}
        </div>
      </div>

      {!configured && (
        <div className="glass-panel" style={{
          padding: '15px 20px',
          borderLeft: '4px solid var(--color-gold)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '1.3rem' }}>🔑</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Ningún proveedor IA configurado. Ve a <strong>Configuración (⚙️)</strong> y agrega al menos una API key (Groq, DeepSeek o Gemini).
          </p>
        </div>
      )}

      {/* Chat Mode Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
        {Object.values(CHAT_MODES).map(mode => (
          <button
            key={mode.id}
            onClick={() => setChatMode(mode.id)}
            className={`tab-btn ${chatMode === mode.id ? 'active' : ''}`}
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>

      {/* Analysis Panel */}
      {showAnalysis && (
        <div className="glass-panel animated-slide" style={{
          padding: '20px',
          borderLeft: '4px solid var(--color-gold)',
          position: 'relative'
        }}>
          <button
            onClick={() => { setShowAnalysis(false); setAnalysisResult(null); }}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: '1rem'
            }}
          >
            ✕
          </button>
          {analyzingMatch ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <span style={{ fontSize: '2rem' }}>⏳</span>
              <p style={{ marginTop: '10px', color: 'var(--color-text-muted)' }}>Analizando último partido con IA...</p>
            </div>
          ) : analysisResult ? (
            analysisResult.error ? (
              <p style={{ color: 'var(--color-red)', fontSize: '0.85rem' }}>{analysisResult.error}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                  📊 Análisis: {analysisResult.fixture.opponent} ({analysisResult.fixture.score})
                </h3>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--color-text)' }}>
                  <strong>Resumen:</strong> {analysisResult.resumen}
                </div>
                {analysisResult.puntosFuertes.length > 0 && (
                  <div>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '0.8rem' }}>✅ Puntos Fuertes:</strong>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {analysisResult.puntosFuertes.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {analysisResult.areasMejora.length > 0 && (
                  <div>
                    <strong style={{ color: 'var(--color-red)', fontSize: '0.8rem' }}>⚠️ Áreas de Mejora:</strong>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {analysisResult.areasMejora.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {analysisResult.recomendacionTactica && (
                  <div style={{
                    background: 'rgba(0, 230, 118, 0.05)',
                    border: '1px solid rgba(0, 230, 118, 0.15)',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem'
                  }}>
                    <strong style={{ color: 'var(--color-primary)' }}>💡 Recomendación Táctica:</strong>
                    <p style={{ marginTop: '4px', color: 'var(--color-text)' }}>{analysisResult.recomendacionTactica}</p>
                  </div>
                )}
              </div>
            )
          ) : null}
        </div>
      )}

      {/* Chat Messages */}
      <div className="glass-panel" style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        minHeight: '350px',
        maxHeight: '55vh',
        overflowY: 'auto',
        flex: 1
      }}>
        {messages.length === 0 && !streamingText ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', height: '100%', padding: '30px 0' }}>
            <span style={{ fontSize: '3rem' }}>🏉</span>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
              {CHAT_MODES[chatMode].icon} Coach de Rugby IA — {CHAT_MODES[chatMode].label}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '450px' }}>
              {chatMode === 'general' && 'Pregúntame sobre reglas de World Rugby, táctica de juego, cómo contrarrestar al rival o ejercicios específicos para tus jugadores.'}
              {chatMode === 'tactico' && 'Modo táctico: consulta estrategias, formaciones, jugadas ensayadas o cómo explotar debilidades del rival.'}
              {chatMode === 'reglas' && 'Modo reglas: pregúntame sobre el reglamento oficial de World Rugby, leyes específicas y sus interpretaciones.'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
              {(examples[chatMode] || examples.general).map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(ex)}
                  className="btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.7rem', borderColor: 'var(--border-glass)', cursor: 'pointer' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const pBadge = msg.provider ? getProviderBadge(msg.provider) : null;
              return (
                <div
                  key={i}
                  className="animated-fade"
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-gold)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    flexShrink: 0,
                    color: '#000',
                    fontWeight: 800
                  }}>
                    {msg.role === 'user' ? '👤' : '🏉'}
                  </div>
                  <div style={{
                    padding: '12px 15px',
                    borderRadius: 'var(--radius-md)',
                    background: msg.isError ? 'rgba(255, 61, 0, 0.05)' : msg.role === 'user' ? 'rgba(0, 230, 118, 0.05)' : 'var(--bg-surface-solid)',
                    border: `1px solid ${msg.isError ? 'var(--color-red)' : msg.role === 'user' ? 'rgba(0, 230, 118, 0.2)' : 'var(--border-glass)'}`,
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    color: msg.isError ? 'var(--color-red)' : 'var(--color-text)'
                  }}>
                    <span dangerouslySetInnerHTML={{ __html: sanitizeAndFormatAI(msg.text) }} />
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginTop: '6px', textAlign: 'right', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{msg.mode ? CHAT_MODES[msg.mode]?.icon : ''} {pBadge ? `${pBadge.icon} ${pBadge.name}` : ''}</span>
                      <span>{new Date(msg.time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {streamingText && (
              <div className="animated-fade" style={{
                display: 'flex',
                gap: '10px',
                alignSelf: 'flex-start',
                maxWidth: '85%'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--color-gold)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  flexShrink: 0,
                  color: '#000',
                  fontWeight: 800
                }}>
                  🏉
                </div>
                <div style={{
                  padding: '12px 15px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-solid)',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  color: 'var(--color-text)'
                }}>
                  <span dangerouslySetInnerHTML={{ __html: sanitizeAndFormatAI(streamingText) }} />
                  <span className="blink" style={{ color: 'var(--color-primary)' }}>▌</span>
                  {streamingProvider && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--color-gold)', marginTop: '2px' }}>
                      {getProviderBadge(streamingProvider)?.icon} {getProviderBadge(streamingProvider)?.name}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={CHAT_MODES[chatMode].placeholder}
          className="form-textarea"
          rows="2"
          disabled={!configured || loading}
          style={{
            flex: 1,
            resize: 'none',
            fontSize: '0.82rem',
            opacity: configured && !loading ? 1 : 0.5
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading || !configured}
          className="btn-neon"
          style={{
            padding: '10px 20px',
            justifyContent: 'center',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            opacity: input.trim() && configured && !loading ? 1 : 0.5
          }}
        >
          {loading ? '⏳ ...' : 'Enviar ➤'}
        </button>
      </div>
    </div>
  );
}

export default AIChat;
