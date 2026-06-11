import React from 'react';
import { Icon } from './icons';
import { CHAT_MODES } from '../../engine/aiConfig';

export function ChatInput({ input, setInput, onSend, onKeyDown, configured, loading, chatMode }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
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
        onClick={onSend}
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
        {loading ? <><Icon name="loading" size={16} className="ai-icon-spin" /> Enviando...</> : <><Icon name="send" size={16} /> Enviar</>}
      </button>
    </div>
  );
}
