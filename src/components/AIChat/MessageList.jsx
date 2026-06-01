import React from 'react';
import { CHAT_MODES } from '../../engine/aiConfig';
import { ChatMessage } from './ChatMessage';
import { StreamingMessage } from './StreamingMessage';
import { CHAT_EXAMPLES } from './constants';

export function MessageList({ messages, streamingText, streamingProvider, chatMode, onQuickQuestion, messagesEndRef }) {
  const examples = CHAT_EXAMPLES[chatMode] || CHAT_EXAMPLES.general;

  return (
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
          <span style={{ fontSize: '3rem' }}>??</span>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
            {CHAT_MODES[chatMode].icon} Coach de Rugby IA � {CHAT_MODES[chatMode].label}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '450px' }}>
            {chatMode === 'general' && 'Preguntame sobre reglas de World Rugby, tactica de juego, como contrarrestar al rival o ejercicios especificos para tus jugadores.'}
            {chatMode === 'tactico' && 'Modo tactico: consulta estrategias, formaciones, jugadas ensayadas o como explotar debilidades del rival.'}
            {chatMode === 'reglas' && 'Modo reglas: preguntame sobre el reglamento oficial de World Rugby, leyes especificas y sus interpretaciones.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => onQuickQuestion(ex)}
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
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}
          {streamingText && (
            <StreamingMessage streamingText={streamingText} streamingProvider={streamingProvider} />
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
