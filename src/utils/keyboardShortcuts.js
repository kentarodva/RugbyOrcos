import { useEffect, useCallback } from 'react';

const handlers = {
  focusSearch: null,
  addPlayer: null,
};

export function useRegisterSearchHandler(fn) {
  useEffect(() => {
    handlers.focusSearch = fn;
    return () => { handlers.focusSearch = null; };
  }, [fn]);
}

export function useRegisterAddPlayerHandler(fn) {
  useEffect(() => {
    handlers.addPlayer = fn;
    return () => { handlers.addPlayer = null; };
  }, [fn]);
}

export function useGlobalShortcuts(activeTab, setActiveTab) {
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (activeTab !== 'roster' && activeTab !== 'estadisticas') {
        setActiveTab('roster');
      }
      setTimeout(() => handlers.focusSearch?.(), 50);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      if (activeTab !== 'roster') {
        setActiveTab('roster');
      }
      setTimeout(() => handlers.addPlayer?.(), 50);
    }
  }, [activeTab, setActiveTab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
