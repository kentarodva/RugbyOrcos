import React from 'react';
import { useAIChatState } from './useAIChatState';
import { ChatHeader } from './ChatHeader';
import { ConfigWarning } from './ConfigWarning';
import { ModeTabs } from './ModeTabs';
import { AnalysisPanel } from './AnalysisPanel';
import ProactiveSuggestions from './ProactiveSuggestions';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

function AIChat() {
  const state = useAIChatState();

  return (
    <div className="animated-fade" style={{ display: 'flex', flexDirection: 'column', gap: '15px', height: '100%' }}>
      <ChatHeader
        configured={state.configured}
        activeProvInfo={state.activeProvInfo}
        teamFixtures={state.teamFixtures}
        analyzingMatch={state.analyzingMatch}
        onAnalyze={state.handleAnalyzeLastMatch}
        onClear={state.handleClear}
        messagesCount={state.messages.length}
      />

      {!state.configured && <ConfigWarning />}

      <ModeTabs chatMode={state.chatMode} setChatMode={state.setChatMode} />

      <AnalysisPanel
        showAnalysis={state.showAnalysis}
        analyzingMatch={state.analyzingMatch}
        analysisResult={state.analysisResult}
        onClose={() => { state.setShowAnalysis(false); state.setAnalysisResult(null); }}
      />

      {state.configured && state.messages.length === 0 && (
        <ProactiveSuggestions
          fixtures={state.teamFixtures}
          schedule={state.teamSchedule}
          futureFixtures={state.teamFutureFixtures}
          onQuickQuestion={state.handleQuickQuestion}
        />
      )}
      <MessageList
        messages={state.messages}
        streamingText={state.streamingText}
        streamingProvider={state.streamingProvider}
        chatMode={state.chatMode}
        onQuickQuestion={state.handleQuickQuestion}
        messagesEndRef={state.messagesEndRef}
      />

      <ChatInput
        input={state.input}
        setInput={state.setInput}
        onSend={state.handleSend}
        onKeyDown={state.handleKeyDown}
        configured={state.configured}
        loading={state.loading}
        chatMode={state.chatMode}
      />
    </div>
  );
}

export default AIChat;
