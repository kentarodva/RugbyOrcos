import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { ClubProvider } from './context/ClubContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Catch Vite chunk loading errors when a new deployment invalidates old asset hashes
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[Vite] Preload error detected, reloading page for latest version...', event);
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ClubProvider>
            <App />
          </ClubProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
