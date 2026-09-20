import { School, UserRole } from '../types';
import { Building2, Plus, Users, DollarSign, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface SuperAdminViewProps {
  schools: School[];
  onOpenNewSchoolModal: () => void;
  onSelectSchool: (school: School) => void;
  currentSchool: School;
}

export const SuperAdminView = ({
  schools,
  onOpenNewSchoolModal,
  onSelectSchool,
  currentSchool,
}: SuperAdminViewProps) => {
  return (
    <div className="space-y-6">
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-purple-800/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-400/20 text-purple-200 text-xs font-semibold border border-purple-400/30">
                Espace Entreprise — Super Administrateur
              </span>
              <span className="text-xs text-purple-300">RDC</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Supervision Globale de la Plateforme</h1>
            <p className="text-xs text-purple-200 mt-1 max-w-xl">
              Gestion centralisée des établissements abonnés, isolation stricte des données par <code>school_id</code> et monitoring des passerelles RDC.
            </p>
          </div>

          <button
            id="btn-superadmin-create-school"
            onClick={onOpenNewSchoolModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-purple-950 hover:bg-purple-50 font-bold text-xs shadow transition-colors"
          >
            <Plus className="w-4 h-4 text-purple-900" />
            <span>Créer un Établissement</span>
          </button>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-800/80">
          <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-800/40">
            <span className="text-[11px] text-purple-300 block">Établissements Actifs</span>
            <div className="text-xl font-black mt-0.5">{schools.length}</div>
            <span className="text-[10px] text-emerald-400">100% opérationnels</span>
          </div>

          <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-800/40">
            <span className="text-[11px] text-purple-300 block">Élèves Hébergés</span>
            <div className="text-xl font-black mt-0.5">1 240+</div>
            <span className="text-[10px] text-purple-300">Kinshasa & Provinces</span>
          </div>

          <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-800/40">
            <span className="text-[11px] text-purple-300 block">Passerelle SMS RDC</span>
            <div className="text-xl font-black mt-0.5 text-amber-300">Connectée</div>
            <span className="text-[10px] text-purple-300">Vodacom • Airtel • Orange</span>
          </div>

          <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-800/40">
            <span className="text-[11px] text-purple-300 block">Sécurité & Isolation</span>
            <div className="text-xl font-black mt-0.5 text-emerald-400">RLS Actif</div>
            <span className="text-[10px] text-emerald-300">PostgreSQL Schema V2</span>
          </div>
        </div>
      </div>

      {/* Schools Directory */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Établissements Enregistrés</h2>
            <p className="text-xs text-slate-500">Sélectionnez une école pour inspecter ou administrer son espace</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {schools.length} Écoles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schools.map((s) => {
            const isSelected = s.id === currentSchool.id;
            return (
              <div
                key={s.id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                      {s.code.substring(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{s.name}</h3>
                      <p className="text-xs text-slate-500">{s.city}, {s.province} • Code: <span className="font-mono text-slate-700">{s.code}</span></p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    s.plan === 'Premium'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {s.plan}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Devise par défaut</span>
                    <span className="font-medium text-slate-800">{s.currencyDefault} (1 USD = {(s.exchangeRateUsdCdf || 2850).toLocaleString()} CDF)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact</span>
                    <span className="font-medium text-slate-800 truncate block">{s.phone}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Données isolées (school_id: {s.id})</span>
                  </span>

                  <button
                    id={`btn-superadmin-select-${s.id}`}
                    onClick={() => onSelectSchool(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isSelected ? 'Espace Actuel' : 'Gérer cette école'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscription Plans Configuration (Article 55 du cahier des charges) */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-900 mb-1">Formules d'Abonnement Disponibles</h2>
        <p className="text-xs text-slate-500 mb-4">Fonctionnement multi-plans configurable sans coder les tarifs en dur</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="font-bold text-sm text-slate-800">Plan Basic</div>
            <p className="text-slate-500">Pour les petites structures débutantes.</p>
            <ul className="space-y-1 text-slate-700 font-medium pt-2 border-t border-slate-200">
              <li>✓ Gestion élèves & inscriptions</li>
              <li>✓ Classes & matières</li>
              <li>✓ Présences quotidiennes</li>
              <li>✓ Notes & moyennes</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/30 space-y-2 relative">
            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
              Recommandé RDC
            </span>
            <div className="font-bold text-sm text-blue-950">Plan Standard</div>
            <p className="text-slate-500">Pour collèges et lycées conventionnés.</p>
            <ul className="space-y-1 text-slate-700 font-medium pt-2 border-t border-blue-200">
              <li>✓ Tout le contenu Basic</li>
              <li>✓ Espace Parents multi-enfants</li>
              <li>✓ Bulletins officiels RDC (EPST)</li>
              <li>✓ Module discipline & sanctions</li>
              <li>✓ Notifications in-app</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-purple-300 bg-purple-50/30 space-y-2">
            <div className="font-bold text-sm text-purple-950">Plan Premium</div>
            <p className="text-slate-500">Établissements modernes à forte connectivité.</p>
            <ul className="space-y-1 text-slate-700 font-medium pt-2 border-t border-purple-200">
              <li>✓ Tout le contenu Standard</li>
              <li>✓ Paiements Mobile Money (M-Pesa, Airtel, Orange)</li>
              <li>✓ Reçus numérotés avec QR Code</li>
              <li>✓ Passerelle SMS autonome</li>
              <li>✓ Statistiques avancées & Audit log</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
