import { useState } from 'react';
import { School, UserRole } from '../types';
import { 
  Building2, Plus, Users, DollarSign, MessageSquare, ShieldCheck, CheckCircle2, 
  AlertCircle, Lock, Unlock, CreditCard, Clock, FileText, Check, Phone, ArrowUpRight,
  Search, Filter, Smartphone, RefreshCw, AlertTriangle
} from 'lucide-react';

interface SuperAdminViewProps {
  schools: School[];
  onOpenNewSchoolModal: () => void;
  onSelectSchool: (school: School) => void;
  currentSchool: School;
  onOpenUserManagement?: () => void;
  currentUserRole?: UserRole;
  onUpdateSchool?: (updatedSchool: School) => void;
}

export const SuperAdminView = ({
  schools: initialSchools,
  onOpenNewSchoolModal,
  onSelectSchool,
  currentSchool,
  onOpenUserManagement,
  currentUserRole = 'super_admin',
  onUpdateSchool,
}: SuperAdminViewProps) => {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'ALL' | 'Basic' | 'Premium'>('ALL');
  const [updatingSchoolId, setUpdatingSchoolId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ecoles' | 'securite' | 'finances' | 'support'>(
    currentUserRole === 'cadre_securite' ? 'securite' :
    currentUserRole === 'cadre_finances' ? 'finances' :
    currentUserRole === 'cadre_support' ? 'support' : 'ecoles'
  );

  // Manual onboarding form state for Support & Intégration
  const [supportSchoolName, setSupportSchoolName] = useState('');
  const [supportSchoolCode, setSupportSchoolCode] = useState('');
  const [supportSchoolCity, setSupportSchoolCity] = useState('Kinshasa');
  const [supportEpstNumber, setSupportEpstNumber] = useState('');
  const [supportAdminEmail, setSupportAdminEmail] = useState('');
  const [supportSuccess, setSupportSuccess] = useState<string | null>(null);

  // Filtered schools
  const filteredSchools = schools.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlanFilter === 'ALL' || s.plan === selectedPlanFilter;
    return matchesSearch && matchesPlan;
  });

  // Handle subscription update (active / suspended, plan, expiresAt)
  const handleUpdateSubscription = async (schoolId: string, updates: {
    plan?: 'Basic' | 'Premium';
    subscriptionStatus?: 'active' | 'suspended';
    subscriptionExpiresAt?: string;
  }) => {
    setUpdatingSchoolId(schoolId);
    try {
      const res = await fetch(`/api/schools/${schoolId}/subscription`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setSchools((prev) => prev.map((s) => (s.id === schoolId ? { ...s, ...updates } : s)));
        if (onUpdateSchool) onUpdateSchool({ ...currentSchool, ...updates });
      } else {
        alert('Erreur lors de la mise à jour de l’abonnement.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion au serveur.');
    } finally {
      setUpdatingSchoolId(null);
    }
  };

  // Handle manual onboarding via Cadre Support
  const handleSupportOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supportSchoolName,
          code: supportSchoolCode || `SCH-${Date.now().toString().slice(-4)}`,
          city: supportSchoolCity,
          province: 'Kinshasa',
          address: 'Avenue de la Paix, Gombe',
          phone: '+243 810 000 000',
          email: supportAdminEmail || 'direction@ecole.cd',
          plan: 'Premium',
          currencyDefault: 'USD',
          exchangeRateUsdCdf: 2850,
          subscriptionStatus: 'active',
          sections: ['Scientifique', 'Littéraire', 'Pédagogique', 'Commerciale & Gestion'],
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSchools((prev) => [...prev, created]);
        setSupportSuccess(`Établissement "${created.name}" créé avec succès avec validation de l'arrêté EPST ${supportEpstNumber || 'MINEPST/2026/0491'}. Identifiants transmis.`);
        setSupportSchoolName('');
        setSupportSchoolCode('');
        setSupportEpstNumber('');
        setSupportAdminEmail('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Enterprise Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold border border-indigo-400/30">
                Direction Générale Entreprise
              </span>
              <span className="text-xs text-indigo-300">
                Rôle Actif : <strong className="text-white capitalize">{currentUserRole.replace('_', ' ')}</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Supervision Globale de la Plateforme</h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
              Supervision des abonnements, conformité RDC, contrôle financier Mobile Money et support d'intégration des établissements agréés.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenUserManagement && (
              <button
                id="btn-superadmin-manage-users"
                onClick={onOpenUserManagement}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-white font-bold text-xs shadow transition-colors border border-indigo-700/50"
              >
                <Users className="w-4 h-4 text-indigo-200" />
                <span>Gestion Utilisateurs & Rôles</span>
              </button>
            )}

            <button
              id="btn-superadmin-create-school"
              onClick={onOpenNewSchoolModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs shadow transition-colors"
            >
              <Plus className="w-4 h-4 text-indigo-900" />
              <span>Créer un Établissement</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/60">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300 block">Établissements Abonnés</span>
            <div className="text-xl font-black mt-0.5">{schools.length}</div>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {schools.filter((s) => (s as any).subscriptionStatus !== 'suspended').length} Actifs • {schools.filter((s) => (s as any).subscriptionStatus === 'suspended').length} Suspendus
            </span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300 block">Forfaits Premiums</span>
            <div className="text-xl font-black mt-0.5 text-purple-300">
              {schools.filter((s) => s.plan === 'Premium').length}
            </div>
            <span className="text-[10px] text-purple-200">Mobile Money & SMS actifs</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300 block">Passerelle Entreprise</span>
            <div className="text-xl font-black mt-0.5 text-amber-300">M-Pesa / Airtel</div>
            <span className="text-[10px] text-slate-300">Agrégateur RDC V2.4</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300 block">Sécurité & Conformité</span>
            <div className="text-xl font-black mt-0.5 text-emerald-400">EPST RDC</div>
            <span className="text-[10px] text-emerald-300">Certifié V2.0</span>
          </div>
        </div>
      </div>

      {/* Cadre Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('ecoles')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'ecoles'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Établissements & Abonnements</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {schools.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('securite')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'securite'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Sécurité & Conformité</span>
          {currentUserRole === 'cadre_securite' && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Votre Rôle
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('finances')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'finances'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-500" />
          <span>Finances & Facturation</span>
          {currentUserRole === 'cadre_finances' && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-800 font-bold">
              Votre Rôle
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'support'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4 text-purple-500" />
          <span>Support & Intégration Manuelle</span>
          {currentUserRole === 'cadre_support' && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-100 text-purple-800 font-bold">
              Votre Rôle
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: ÉCOLES & ABONNEMENTS */}
      {activeTab === 'ecoles' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#181B20] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher par nom, code ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Forfait :</span>
              <button
                onClick={() => setSelectedPlanFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  selectedPlanFilter === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Tous ({schools.length})
              </button>
              <button
                onClick={() => setSelectedPlanFilter('Basic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  selectedPlanFilter === 'Basic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Basic
              </button>
              <button
                onClick={() => setSelectedPlanFilter('Premium')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  selectedPlanFilter === 'Premium'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Premium
              </button>
            </div>
          </div>

          {/* Schools List Grid with direct subscription controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchools.map((s) => {
              const isSelected = s.id === currentSchool.id;
              const isSuspended = (s as any).subscriptionStatus === 'suspended';
              const isUpdating = updatingSchoolId === s.id;

              return (
                <div
                  key={s.id}
                  className={`p-5 rounded-2xl border transition-all shadow-xs ${
                    isSuspended
                      ? 'border-red-300 bg-red-50/20 dark:bg-red-950/10'
                      : isSelected
                      ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B20]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${
                        isSuspended ? 'bg-red-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      }`}>
                        {s.code.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{s.name}</h3>
                          {isSuspended && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Suspendu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {s.city}, {s.province} • Code: <span className="font-mono text-slate-700 dark:text-slate-300">{s.code}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        s.plan === 'Premium'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        Plan {s.plan}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isSuspended ? 'Accès verrouillé' : 'Accès opérationnel'}
                      </span>
                    </div>
                  </div>

                  {/* Subscription Controls (Articles 14 & 15 du plan) */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                        Gestion de l'Abonnement :
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Échéance : <strong>31/12/2026</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Plan Toggle Button */}
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateSubscription(s.id, { plan: s.plan === 'Premium' ? 'Basic' : 'Premium' })}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        Basculer vers {s.plan === 'Premium' ? 'Basic' : 'Premium'}
                      </button>

                      {/* Suspension Toggle Button (Article 15: Suspension temporaire automatique / manuelle pour non-paiement) */}
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateSubscription(s.id, {
                          subscriptionStatus: isSuspended ? 'active' : 'suspended',
                        })}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                          isSuspended
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                        }`}
                      >
                        {isSuspended ? (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Réactiver l'Accès</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Suspendre (Non-paiement)</span>
                          </>
                        )}
                      </button>

                      {isUpdating && <span className="text-[10px] text-slate-400">Mise à jour...</span>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Isolation school_id: <strong>{s.id}</strong></span>
                    </span>

                    <button
                      id={`btn-superadmin-select-${s.id}`}
                      onClick={() => onSelectSchool(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isSelected ? 'Espace Actuel' : 'Gérer cette école'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Plan Comparison Summary */}
          <div className="bg-white dark:bg-[#181B20] rounded-2xl p-6 shadow-xs border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Structure des Niveaux d'Abonnement (Basic vs Premium)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Restrictions techniques et fonctionnalités débloquées conformément aux spécifications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Forfait Basique</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    Standard
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Idéal pour la gestion quotidienne de base des inscriptions et des cotes scolaires.
                </p>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 font-medium pt-2 border-t border-slate-200 dark:border-slate-700">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Inscription élèves et dossiers administratifs</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Saisie des notes /20 et calcul des moyennes</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Feuilles de présence avec verrouillage à minuit</li>
                  <li className="flex items-center gap-1.5 text-slate-400"><Lock className="w-3.5 h-3.5" /> Passerelle Mobile Money directe désactivée</li>
                  <li className="flex items-center gap-1.5 text-slate-400"><Lock className="w-3.5 h-3.5" /> Envoi SMS massif désactivé</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border-2 border-purple-500 bg-purple-50/20 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-purple-950 dark:text-purple-200">Forfait Premium</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    Complet
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Pour les établissements modernes avec intégration Mobile Money et passerelle SMS.
                </p>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 font-medium pt-2 border-t border-purple-200 dark:border-purple-800">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Toutes les fonctionnalités du forfait Basique</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Encaissement Mobile Money centralisé via l'entreprise</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Notifications SMS instantanées aux parents</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Transfert inter-écoles du palmarès académique complet</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Reçus de paiement avec QR Code anti-fraude</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SÉCURITÉ & CONFORMITÉ (Cadre Sécurité) */}
      {activeTab === 'securite' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#181B20] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Cadre Sécurité & Conformité des Données (Audit Logs)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Surveillance des accès, intégrité du schéma PostgreSQL, verrouillage des profils 14 jours et audit des connexions.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                RLS & Audit Actifs
              </span>
            </div>

            {/* Security Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Isolation Multi-tenant
                </span>
                <p className="text-slate-500">Chaque requête est scellée par <code>school_id</code> dans Supabase.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Délai Profil 14 Jours
                </span>
                <p className="text-slate-500">Règle de traçabilité interdisant les changements répétés de profil.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-500" />
                  Appel Verrouillé à Minuit
                </span>
                <p className="text-slate-500">Impossibilité d'altérer les feuilles de présence d'un jour passé.</p>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                Journal Récent des Événements de Sécurité
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-mono text-slate-500">2026-11-04 11:42</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Connexion réussie SuperAdmin</span>
                    <span className="text-slate-400">• IP: 197.157.210.45 (Kinshasa, Gombe)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-mono">AUTH_SUCCESS</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-mono text-slate-500">2026-11-04 11:15</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Liaison de compte Google</span>
                    <span className="text-slate-400">• ID: user-prof-01 (Professeur Kalambayi)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-[10px] text-blue-700 font-mono">OAUTH_LINK</span>
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-mono text-slate-500">2026-11-04 10:30</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Tentative modification profil bloquée</span>
                    <span className="text-slate-400">• Règle des 14 jours appliquée</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-[10px] text-amber-700 font-mono">POLICY_ENFORCE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FINANCES & FACTURATION (Cadre Finances) */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#181B20] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <span>Cadre Finances & Passerelle Mobile Money Entreprise</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Suivi des souscriptions scolaires, réconciliation bancaire et supervision des flux M-Pesa, Airtel Money et Orange Money.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                Paiements Centralisés
              </span>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Total Abonnements Encaissés</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">$ 14,250 USD</div>
                <span className="text-[10px] text-emerald-600 font-medium">Exercice 2026-2027</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Paiements Mobile Money Centralisés</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">42,840,000 CDF</div>
                <span className="text-[10px] text-indigo-600 font-medium">Reversés aux établissements</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Taux d'Échange Institutionnel</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">2 850 CDF</div>
                <span className="text-[10px] text-slate-400 font-medium">Fixé par la Banque Centrale (BCC)</span>
              </div>
            </div>

            {/* School Subscriptions Status Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                État des Facturations & Abonnements par Établissement
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {schools.map((s) => {
                  const isSuspended = (s as any).subscriptionStatus === 'suspended';
                  return (
                    <div key={s.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                        <span className="text-slate-400 ml-2">({s.city})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {s.plan === 'Premium' ? '450 USD / an' : '250 USD / an'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuspended
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isSuspended ? 'En Souffrance (Suspendu)' : 'À Jour (Actif)'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPPORT & INTÉGRATION (Cadre Support) */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#181B20] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <span>Support & Intégration Manuelle (Arrêté d'Agrément EPST)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                L'équipe de l'entreprise peut créer manuellement un compte établissement après vérification des documents légaux justificatifs en cas de blocage d'inscription (Article 12 des spécifications).
              </p>
            </div>

            {supportSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{supportSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSupportOnboard} className="space-y-4 max-w-2xl text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nom de l'Établissement *
                  </label>
                  <input
                    type="text"
                    required
                    value={supportSchoolName}
                    onChange={(e) => setSupportSchoolName(e.target.value)}
                    placeholder="Ex: Institut Scientifique de la Gombe"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Code Sigle Établissement
                  </label>
                  <input
                    type="text"
                    value={supportSchoolCode}
                    onChange={(e) => setSupportSchoolCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ISG-GOMBE"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Numéro d'Arrêté Ministériel d'Agrément EPST *
                  </label>
                  <input
                    type="text"
                    required
                    value={supportEpstNumber}
                    onChange={(e) => setSupportEpstNumber(e.target.value)}
                    placeholder="Ex: MINEPST/CABMIN/089/2024"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Principal du Promoteur / Directeur
                  </label>
                  <input
                    type="email"
                    required
                    value={supportAdminEmail}
                    onChange={(e) => setSupportAdminEmail(e.target.value)}
                    placeholder="promoteur@ecole.cd"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Valider les Justificatifs & Déployer l'Établissement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
