import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center p-6 text-[#06402B]">
          <div className="max-w-md w-full bg-white border border-[#E2D9C8] rounded-xl p-8 shadow-xl">
             <h1 className="text-2xl font-serif font-bold mb-4 text-[#9F1239]">System Interruption</h1>
             <p className="text-sm mb-4 opacity-80">The Sovereign OS encountered a critical rendering error.</p>
             <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-6 overflow-auto max-h-40">
                <code className="text-xs text-red-800 font-mono break-all">{this.state.error?.message}</code>
             </div>
             <button 
                onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                }}
                className="w-full py-3 bg-[#06402B] text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-[#0F766E] transition-colors"
             >
                Hard Reset System
             </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);