import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Router Error Element component wrapper
export function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error("Router caught error:", error);

  const errorMessage = 
    typeof error === 'string' 
      ? error 
      : error?.statusText || error?.message || (error && typeof error === 'object' ? JSON.stringify(error) : "An unexpected error occurred.");

  return (
    <ErrorDisplay 
      error={errorMessage} 
      onRetry={() => window.location.reload()} 
      onGoHome={() => navigate('/')} 
    />
  );
}

// React Class Error Boundary for catching render-phase crashes
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const errorMessage = typeof err === 'string' 
        ? err 
        : err?.message || (err && typeof err === 'object' ? JSON.stringify(err) : "An unexpected error occurred.");

      return (
        <ErrorDisplay 
          error={errorMessage} 
          onRetry={() => this.setState({ hasError: false, error: null })} 
          onGoHome={this.handleReset} 
        />
      );
    }

    return this.props.children;
  }
}

// Shared UI Presentation Component
function ErrorDisplay({ error, onRetry, onGoHome }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-inter relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-100/60 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-lg w-full bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-200/50 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
          <AlertTriangle size={32} />
        </div>

        <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
          Oops! Something went wrong
        </h1>
        
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          We encountered an unexpected application error. If your backend server is not running or deployed, some operations might fail.
        </p>

        {error && (
          <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 mb-6 text-left overflow-auto max-h-36">
            <div className="text-xs font-mono text-slate-600 break-words">
              {String(error)}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl h-11 px-5 shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </Button>

          <Button 
            variant="outline"
            onClick={onGoHome}
            className="border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl h-11 px-5 flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
