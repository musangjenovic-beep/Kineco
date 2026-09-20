import { useState } from 'react';
import { School } from '../types';
import { Building2, X, Check, Globe } from 'lucide-react';

interface NewSchoolModalProps {
  onCreateSchool: (schoolData: Omit<School, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

export const NewSchoolModal = ({ onCreateSchool, onClose }: NewSchoolModalProps) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('Kinshasa');
  const [province, setProvince] = useState('Kinshasa');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+243 ');
  const [email, setEmail] = useState('');
  const [currencyDefault, setCurrencyDefault] = useState<'USD' | 'CDF'>('USD');
  const [exchangeRateUsdCdf, setExchangeRateUsdCdf] = useState(2850);
  const [plan, setPlan] = useState<'Basic' | 'Standard' | 'Premium'>('Standard');
  const [directorName, setDirectorName] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');
  const [directorPhone, setDirectorPhone] = useState('+243 ');
  const [directorPassword, setDirectorPassword] = useState('directeur123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    setIsSubmitting(true);
    await onCreateSchool({
      name,
      code: code.toUpperCase().trim(),
      city,
      province,
      address,
      phone,
      email,
      currencyDefault,
      exchangeRateUsdCdf,
      plan,
      active: true,
      ...(directorName.trim() && directorEmail.trim() ? {
        director: {
          fullName: directorName.trim(),
          email: directorEmail.trim(),
          phone: directorPhone.trim(),
          password: directorPassword.trim() || 'directeur123',
        }
      } : {}),
    } as any);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Créer un Nouvel Établissement Scolaire</h3>
              <p className="text-xs text-slate-400">Architecture Multi-Tenant — Données totalement isolées</p>
            </div>
          </div>
          <button
            id="btn-close-new-school-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nom de l'Établissement *
              </label>
              <input
                id="input-school-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Institut Saint-Pierre"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Code Unique / Sigle *
              </label>
              <input
                id="input-school-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: ISP-LUB"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ville (RDC)
              </label>
              <input
                id="input-school-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kinshasa, Lubumbashi, Goma..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Province Éducationnelle
              </label>
              <input
                id="input-school-province"
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Kinshasa-Ouest, Haut-Katanga, Nord-Kivu..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Adresse physique complète
            </label>
            <input
              id="input-school-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Avenue, Quartier, Commune"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Téléphone de contact
              </label>
              <input
                id="input-school-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+243 81 000 0000"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email officiel
              </label>
              <input
                id="input-school-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="direction@ecole.cd"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Devise Principale
              </label>
              <select
                id="select-school-currency"
                value={currencyDefault}
                onChange={(e) => setCurrencyDefault(e.target.value as 'USD' | 'CDF')}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="USD">Dollar Américain (USD)</option>
                <option value="CDF">Franc Congolais (CDF)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Taux de change (1 USD = X CDF)
              </label>
              <input
                id="input-school-exchange-rate"
                type="number"
                value={exchangeRateUsdCdf}
                onChange={(e) => setExchangeRateUsdCdf(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Formule d'Abonnement
              </label>
              <select
                id="select-school-plan"
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Basic">Basic (Élèves & Notes)</option>
                <option value="Standard">Standard (+ Parents & Bulletins)</option>
                <option value="Premium">Premium (+ Mobile Money & SMS)</option>
              </select>
            </div>
          </div>

          {/* Section: Compte Directeur / Gestionnaire (Exigence: l'entreprise crée l'école et son gestionnaire) */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider border border-indigo-100">
                Compte Responsable
              </span>
              <span className="font-bold text-slate-800 text-xs">Directeur / Gestionnaire de l'Établissement</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              L'entreprise attribue le compte principal du directeur afin qu'il puisse à son tour administrer son personnel et ses élèves.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Nom Complet du Directeur *
                </label>
                <input
                  type="text"
                  value={directorName}
                  onChange={(e) => {
                    setDirectorName(e.target.value);
                    if (!directorEmail && code) {
                      setDirectorEmail(`direction@${code.toLowerCase()}.cd`);
                    }
                  }}
                  placeholder="Ex: Abbé Richard Malu"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Email / Identifiant du Directeur *
                </label>
                <input
                  type="email"
                  value={directorEmail}
                  onChange={(e) => setDirectorEmail(e.target.value)}
                  placeholder="direction@ecole.cd"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Téléphone du Directeur
                </label>
                <input
                  type="tel"
                  value={directorPhone}
                  onChange={(e) => setDirectorPhone(e.target.value)}
                  placeholder="+243 81..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Mot de Passe Initial
                </label>
                <input
                  type="text"
                  value={directorPassword}
                  onChange={(e) => setDirectorPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              id="btn-cancel-new-school"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="btn-submit-new-school"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Création en cours...' : 'Créer l’Établissement'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
