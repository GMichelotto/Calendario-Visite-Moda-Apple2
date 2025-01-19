import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import './index.css';

// ErrorBoundary per catturare errori nei componenti React
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log dell'errore su un servizio di error tracking
    console.error('React error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <h1>Qualcosa è andato storto.</h1>
          <details>
            <summary>Dettagli errore</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            className="error-boundary-retry"
          >
            Ricarica applicazione
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Gestore errori globale
const handleGlobalError = (event: ErrorEvent) => {
  console.error('Errore globale:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });

  // Mostra un messaggio di errore all'utente
  const errorNotification = document.createElement('div');
  errorNotification.className = 'error-notification';
  errorNotification.innerHTML = `
    <div class="error-content">
      <h3>Si è verificato un errore</h3>
      <p>L'applicazione ha riscontrato un problema. Prova a ricaricare la pagina.</p>
      <button onclick="window.location.reload()">Ricarica</button>
    </div>
  `;
  document.body.appendChild(errorNotification);

  // Rimuovi la notifica dopo 10 secondi
  setTimeout(() => {
    errorNotification.remove();
  }, 10000);
};

// Gestore promise non gestite
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Promise non gestita:', {
    reason: event.reason,
    promise: event.promise
  });

  // Mostra una notifica meno intrusiva per le promise non gestite
  const rejectionNotification = document.createElement('div');
  rejectionNotification.className = 'rejection-notification';
  rejectionNotification.innerHTML = `
    <div class="notification-content">
      <p>Si è verificato un errore durante un'operazione asincrona.</p>
    </div>
  `;
  document.body.appendChild(rejectionNotification);

  // Rimuovi la notifica dopo 5 secondi
  setTimeout(() => {
    rejectionNotification.remove();
  }, 5000);
};

// Gestore chiusura applicazione
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  // Controlla se ci sono modifiche non salvate o operazioni in corso
  const hasUnsavedChanges = window.electronAPI?.hasUnsavedChanges?.() || false;
  
  if (hasUnsavedChanges) {
    // Mostra un messaggio di conferma
    event.preventDefault();
    event.returnValue = 'Ci sono modifiche non salvate. Sei sicuro di voler chiudere l\'applicazione?';
    return event.returnValue;
  }
};

// Registrazione dei gestori di eventi
window.addEventListener('error', handleGlobalError);
window.addEventListener('unhandledrejection', handleUnhandledRejection);
window.addEventListener('beforeunload', handleBeforeUnload);

// Stili per le notifiche di errore
const styles = document.createElement('style');
styles.textContent = `
  .error-notification,
  .rejection-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  }

  .error-notification {
    border-left: 4px solid #ef4444;
  }

  .rejection-notification {
    border-left: 4px solid #f59e0b;
  }

  .error-boundary-fallback {
    padding: 20px;
    text-align: center;
  }

  .error-boundary-retry {
    margin-top: 16px;
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styles);

// Inizializzazione dell'applicazione
console.log('React app starting...');

const container = document.getElementById('root');

if (!container) {
  throw new Error(
    'Failed to find root element. Please ensure there is a DOM element with id "root".'
  );
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

console.log('React app rendered');
