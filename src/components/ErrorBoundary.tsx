import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EduKin Uncaught React Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              EduKin RDC — Récupération d'affichage
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Une erreur d'affichage temporaire a été interceptée. Cliquez sur le bouton ci-dessous pour recharger l'interface en toute sécurité.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-lg text-left text-xs font-mono text-red-300 overflow-x-auto border border-slate-800 max-h-36">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2">
              <button
                id="btn-error-boundary-reload"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser la plateforme
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
