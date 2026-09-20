import { useState } from 'react';
import { SmsLog, School } from '../types';
import { MessageSquare, Send, CheckCircle2, Clock, AlertTriangle, X, Smartphone } from 'lucide-react';

interface SmsModuleModalProps {
  school: School;
  smsLogs: SmsLog[];
  onSendSms: (phone: string, recipientName: string, message: string, category: SmsLog['category']) => Promise<void>;
  onClose: () => void;
}

export const SmsModuleModal = ({ school, smsLogs, onSendSms, onClose }: SmsModuleModalProps) => {
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'templates'>('send');
  const [recipientPhone, setRecipientPhone] = useState('+243 82 444 9901');
  const [recipientName, setRecipientName] = useState('Jean Musang');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<SmsLog['category']>('information');
  const [isSending, setIsSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const templates = [
    {
      title: 'Alerte Absence Immédiate',
      category: 'absence' as const,
      text: `${school.name}: Votre enfant est absent ce jour au cours. Merci de contacter la direction de discipline.`,
    },
    {
      title: 'Alerte Retard Important',
      category: 'retard' as const,
      text: `${school.name}: Votre enfant est arrivé avec un retard non justifié à 07h50. Une ponctualité stricte est requise.`,
    },
    {
      title: 'Rappel Échéance Frais Scolaires',
      category: 'frais' as const,
      text: `${school.name}: Rappel amical concernant le paiement du Minerval du trimestre en cours. Les guichets M-Pesa / Caisse sont ouverts.`,
    },
    {
      title: 'Disponibilité des Bulletins',
      category: 'bulletin' as const,
      text: `${school.name}: Les bulletins de la 2ème Période sont disponibles sur l'espace parents ou au secrétariat de l'école.`,
    },
    {
      title: 'Convocation Parentale',
      category: 'discipline' as const,
      text: `${school.name}: Vous êtes prié(e) de vous présenter au bureau de la discipline ce vendredi à 10h00 pour un entretien.`,
    },
  ];

  const handleApplyTemplate = (tpl: typeof templates[0]) => {
    setMessage(tpl.text);
    setCategory(tpl.category);
    setActiveTab('send');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || !message.trim()) return;

    setIsSending(true);
    await onSendSms(recipientPhone, recipientName, message, category);
    setIsSending(false);
    setSuccessNotice(true);
    setMessage('');
    setTimeout(() => setSuccessNotice(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Passerelle SMS RDC — {school.name}</h3>
              <p className="text-xs text-slate-400">Réseaux pris en charge: Vodacom, Airtel, Orange, Africell RDC</p>
            </div>
          </div>
          <button
            id="btn-close-sms-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 text-xs font-semibold">
          <button
            id="tab-sms-send"
            onClick={() => setActiveTab('send')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              activeTab === 'send'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Envoyer un SMS
          </button>
          <button
            id="tab-sms-templates"
            onClick={() => setActiveTab('templates')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Modèles de SMS ({templates.length})
          </button>
          <button
            id="tab-sms-history"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Historique & Coûts ({smsLogs.length})
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SMS transmis avec succès à la passerelle mobile (Délivré au destinataire).</span>
            </div>
          )}

          {activeTab === 'send' && (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de téléphone du Parent (RDC)
                  </label>
                  <input
                    id="input-sms-phone"
                    type="text"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+243 81 000 0000"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Format: +243 (Vodacom, Airtel, Orange)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom du Destinataire
                  </label>
                  <input
                    id="input-sms-name"
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ex: Jean Musang"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie d'alerte
                </label>
                <select
                  id="select-sms-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="information">Information générale</option>
                  <option value="absence">Alerte d'absence</option>
                  <option value="retard">Alerte de retard</option>
                  <option value="frais">Rappel de frais scolaires</option>
                  <option value="discipline">Notification disciplinaire</option>
                  <option value="bulletin">Publication des bulletins</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Message SMS
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {message.length} / 160 caractères ({Math.ceil(message.length / 160) || 1} SMS)
                  </span>
                </div>
                <textarea
                  id="textarea-sms-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Saisissez votre message ici..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Coût estimé: <strong className="text-slate-800">0.025 USD</strong> / SMS
                </span>
                <button
                  id="btn-submit-sms-send"
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Envoi en cours...' : 'Envoyer immédiatement'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Cliquez sur un modèle préconfiguré pour l'insérer directement dans le formulaire d'envoi.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {templates.map((tpl, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 transition-colors flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <span>{tpl.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-mono">{tpl.text}</p>
                    </div>
                    <button
                      id={`btn-apply-template-${idx}`}
                      onClick={() => handleApplyTemplate(tpl)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition-colors shadow-xs"
                    >
                      Utiliser
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>Total SMS envoyés : <strong className="text-slate-900">{smsLogs.length}</strong></div>
                <div>Coût global cumulé : <strong className="text-slate-900">${(smsLogs.length * 0.025).toFixed(3)} USD</strong></div>
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {smsLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-white text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900 font-semibold">{log.recipientName} ({log.recipientPhone})</strong>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{log.status}</span>
                      </span>
                    </div>
                    <p className="text-slate-600 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                      {log.message}
                    </p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Catégorie: {log.category}</span>
                      <span>{new Date(log.sentAt).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
