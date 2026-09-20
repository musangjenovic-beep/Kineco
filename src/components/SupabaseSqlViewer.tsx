import { useState, useEffect } from 'react';
import { Database, Copy, Check, Download, X, ShieldAlert, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface SupabaseSqlViewerProps {
  onClose: () => void;
}

export const SupabaseSqlViewer = ({ onClose }: SupabaseSqlViewerProps) => {
  const [sqlContent, setSqlContent] = useState<string>('-- Chargement du schéma SQL...');
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    loading: boolean;
    checked: boolean;
    connected: boolean;
    url?: string;
    error?: string;
    tablesFound?: string[];
  }>({
    loading: false,
    checked: false,
    connected: false,
  });
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/export-supabase-sql')
      .then((res) => res.text())
      .then((text) => setSqlContent(text))
      .catch((err) => setSqlContent(`-- Erreur lors de la récupération: ${err.message}`));

    checkConnection();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      setConnectionStatus({
        loading: false,
        checked: true,
        connected: Boolean(data.connected),
        url: data.url,
        error: data.error,
        tablesFound: data.tablesFound,
      });
    } catch (err: any) {
      setConnectionStatus({
        loading: false,
        checked: true,
        connected: false,
        error: err.message,
      });
    }
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedMessage(null);
    try {
      const res = await fetch('/api/supabase/seed', { method: 'POST' });
      const data = await res.json();
      setSeedMessage(data.message || (data.success ? 'Données synchronisées !' : 'Erreur lors de la synchronisation'));
    } catch (err: any) {
      setSeedMessage(`Erreur: ${err.message}`);
    } finally {
      setSeedLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supabase_schema_edukin_rdc.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight flex items-center gap-2">
                <span>Base de données Supabase PostgreSQL & RLS</span>
                {connectionStatus.checked && (
                  connectionStatus.connected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Connecté
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800 font-semibold">
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      En attente de clés
                    </span>
                  )
                )}
              </h3>
              <p className="text-xs text-slate-400">
                18 Tables normalisées, contraintes multi-écoles (school_id), index & RLS policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-sql"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier le SQL'}</span>
            </button>
            <button
              id="btn-download-sql-file"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger (.sql)</span>
            </button>
            <button
              id="btn-close-supabase-modal"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status & Connection Control Bar */}
        <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-200">
            {connectionStatus.connected ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>Connexion active</strong> : Tables prêtes sur Supabase ({connectionStatus.url || 'Supabase Cloud'}).
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  {connectionStatus.error ? `Statut: ${connectionStatus.error}` : 'Script exécuté dans le SQL Editor Supabase.'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-check-supabase-status"
              onClick={checkConnection}
              disabled={connectionStatus.loading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus.loading ? 'animate-spin' : ''}`} />
              <span>Tester la connexion</span>
            </button>

            {connectionStatus.connected && (
              <button
                id="btn-seed-supabase-data"
                onClick={handleSeed}
                disabled={seedLoading}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{seedLoading ? 'Synchronisation...' : 'Synchroniser les données démo'}</span>
              </button>
            )}
          </div>
        </div>

        {seedMessage && (
          <div className="bg-indigo-950/60 border-b border-indigo-800 px-6 py-2 text-xs text-indigo-200 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{seedMessage}</span>
          </div>
        )}

        {/* Code Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-emerald-300">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {sqlContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400">
          Ce schéma est conforme à la directive de sécurité : Ne jamais exposer de clé <code>service_role</code> côté client.
        </div>
      </div>
    </div>
  );
};
