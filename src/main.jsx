import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { ClubProvider } from './context/ClubContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

localStorage.setItem('orcos_badge_count', '0');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ClubProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ClubProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
