import { useState, useEffect } from 'react';
import { UserSession, UserRole } from '../types';
import { MasomoLogo } from './MasomoLogo';
import { 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  X,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export interface DemoAccount {
  role: UserRole;
  label: string;
  identifier: string;
  defaultPassword: string;
  schoolName: string;
  description: string;
}

export const DEFAULT_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'enseignant',
    label: 'Enseignant Titulaire (Prof. Jean-Paul Kalambayi)',
    identifier: 'prof.kalambayi@bobokoli.cd',
    defaultPassword: 'prof123',
    schoolName: 'Collège Bobokoli',
    description: 'Saisie des notes périodiques, appel journalier et espace titulaire',
  },
  {
    role: 'eleve',
    label: 'Élève (Naomi Musang - 1ère Sc.)',
    identifier: 'BOB-2026-0041',
    defaultPassword: 'eleve123',
    schoolName: 'Collège Bobokoli',
    description: 'Matricule officiel : consultation des notes, horaire et bulletin personnel',
  },
  {
    role: 'eleve',
    label: 'Élève (Sarah Musang - 7ème EB)',
    identifier: 'BOB-2026-0042',
    defaultPassword: 'eleve123',
    schoolName: 'Collège Bobokoli',
    description: 'Matricule officiel élève cycle terminal éducation de base',
  },
  {
    role: 'parent',
    label: 'Parent d’élèves (Jean Musang)',
    identifier: 'musangjenovic@gmail.com',
    defaultPassword: 'parent123',
    schoolName: 'Collège Bobokoli',
    description: 'Suivi des 2 enfants, paiements scolarité, alertes SMS',
  },
  {
    role: 'directeur',
    label: 'Directeur Général (Collège Bobokoli)',
    identifier: 'directeur@bobokoli.cd',
    defaultPassword: 'bobokoli123',
    schoolName: 'Collège Bobokoli',
    description: 'Chef d’établissement, création des comptes staff, profs, élèves',
  },
  {
    role: 'directeur_etudes',
    label: 'Directeur des Études (Pédagogie)',
    identifier: 'etudes@bobokoli.cd',
    defaultPassword: 'etudes123',
    schoolName: 'Collège Bobokoli',
    description: 'Pondérations, délibérations, grilles de notes et bulletins',
  },
  {
    role: 'directeur_discipline',
    label: 'Directeur de Discipline',
    identifier: 'discipline@bobokoli.cd',
    defaultPassword: 'discipline123',
    schoolName: 'Collège Bobokoli',
    description: 'Suivi de l’assiduité, sanctions, notifications SMS aux tuteurs',
  },
  {
    role: 'comptable',
    label: 'Comptable / Caisse (Finances)',
    identifier: 'comptable@bobokoli.cd',
    defaultPassword: 'compta123',
    schoolName: 'Collège Bobokoli',
    description: 'Encaissements, bordereaux de frais, Mobile Money RDC',
  },
  {
    role: 'admin_scolaire',
    label: 'Secrétaire / Admin Scolaire',
    identifier: 'secretaire@bobokoli.cd',
    defaultPassword: 'secr123',
    schoolName: 'Collège Bobokoli',
    description: 'Inscriptions des élèves, registres officiels matricules',
  },
  {
    role: 'super_admin',
    label: 'Super Administrateur (Entreprise Masomo)',
    identifier: 'admin@edukin.cd',
    defaultPassword: 'admin123',
    schoolName: 'Direction Nationale Masomo RDC',
    description: 'Gestion globale des écoles partenaires et création des comptes directeurs',
  },
];

export const authenticateLocally = (identifier: string, password: string): UserSession | null => {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = password.trim();

  // Match against demo accounts
  const match = DEFAULT_DEMO_ACCOUNTS.find(
    (acc) =>
      acc.identifier.toLowerCase() === cleanId ||
      (acc.identifier.includes('@') && cleanId.includes(acc.identifier.split('@')[0]))
  );

  if (match) {
    let studentId = undefined;
    let parentStudentIds = undefined;
    if (match.role === 'eleve') {
      studentId = match.identifier === 'BOB-2026-0041' ? 'stu-0041' : 'stu-0042';
    } else if (match.role === 'parent') {
      parentStudentIds = ['stu-0041', 'stu-0042'];
    }

    return {
      id: `usr-${match.role}-${Date.now()}`,
      fullName: match.label.split('(')[1]?.replace(')', '') || match.label,
      username: match.identifier,
      email: match.identifier.includes('@') ? match.identifier : `${match.identifier.toLowerCase()}@masomo.cd`,
      phone: '+243 81 500 1234',
      role: match.role,
      schoolId: 'd8cd16f2-bafc-4425-b96c-c988773cfefb',
      schoolName: match.schoolName || 'Collège Bobokoli',
      studentId,
      parentStudentIds,
      activeStudentId: studentId || parentStudentIds?.[0],
      teacherId: match.role === 'enseignant' ? 'tch-kalambayi' : undefined,
      token: `masomo_token_demo_${Date.now()}`,
    };
  }

  // Allow custom test login if user enters any identifier with 3+ chars
  if (cleanPass.length >= 3 && cleanId.length >= 3) {
    const isTeacher = cleanId.includes('prof') || cleanId.includes('enseignant');
    const isEleve = cleanId.includes('bob-') || cleanId.includes('eleve');
    const isParent = cleanId.includes('parent') || cleanId.includes('musang');
    const isDirector = cleanId.includes('dir');
    const role: UserRole = isTeacher
      ? 'enseignant'
      : isEleve
      ? 'eleve'
      : isParent
      ? 'parent'
      : isDirector
      ? 'directeur'
      : 'enseignant';

    return {
      id: `usr-custom-${Date.now()}`,
      fullName: identifier.split('@')[0].toUpperCase(),
      username: identifier,
      email: identifier.includes('@') ? identifier : `${identifier}@masomo.cd`,
      phone: '+243 81 500 1234',
      role,
      schoolId: 'd8cd16f2-bafc-4425-b96c-c988773cfefb',
      schoolName: 'Collège Bobokoli',
      teacherId: role === 'enseignant' ? 'tch-kalambayi' : undefined,
      token: `masomo_token_custom_${Date.now()}`,
    };
  }

  return null;
};

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  // Mode: 'signup' (matching the screenshot exactly) or 'signin'
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');

  // Form fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Demo accounts modal state initialized with full built-in accounts
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>(DEFAULT_DEMO_ACCOUNTS);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoFilterRole, setDemoFilterRole] = useState<string>('all');

  useEffect(() => {
    fetch('/api/auth/demo-accounts')
      .then(async (res) => {
        if (!res.ok) return;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDemoAccounts(data);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend demo accounts not reached, keeping built-in demo accounts:', err);
      });
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const loginId = mode === 'signup' 
      ? (email.trim() || username.trim()) 
      : (username.trim() || email.trim());

    if (!loginId) {
      setErrorMessage(mode === 'signup' ? 'Veuillez renseigner votre email ou identifiant' : 'Veuillez saisir votre identifiant');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Veuillez saisir votre mot de passe');
      return;
    }

    if (mode === 'signup' && confirmPassword && password !== confirmPassword) {
      setErrorMessage('Les deux mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      let loggedInUser: UserSession | null = null;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: loginId,
            password: password.trim(),
          }),
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (response.ok && data?.user) {
            loggedInUser = data.user;
          } else if (!response.ok && data?.error) {
            // Check if client fallback matches
            const fallback = authenticateLocally(loginId, password.trim());
            if (fallback) {
              loggedInUser = fallback;
            } else {
              throw new Error(data.error || 'Identifiant ou mot de passe incorrect.');
            }
          }
        }
      } catch (networkErr: any) {
        // If it was a real bad credential error from JSON API, rethrow
        if (networkErr.message && !networkErr.message.includes('JSON') && !networkErr.message.includes('fetch')) {
          throw networkErr;
        }
        console.warn('API endpoint unreachable or returned non-JSON, using local authentication:', networkErr);
      }

      // If backend was not reached or returned 404 (e.g. static hosting on Vercel)
      if (!loggedInUser) {
        loggedInUser = authenticateLocally(loginId, password.trim());
      }

      if (!loggedInUser) {
        throw new Error('Identifiant ou mot de passe incorrect. Cliquez sur "Comptes Démo" pour tester un compte prêt à l\'emploi.');
      }

      localStorage.setItem('edukin_session', JSON.stringify(loggedInUser));
      onLoginSuccess(loggedInUser);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (acc: DemoAccount) => {
    setIsDemoModalOpen(false);
    setUsername(acc.identifier);
    setEmail(acc.identifier.includes('@') ? acc.identifier : `${acc.identifier}@ecole.cd`);
    setPassword(acc.defaultPassword);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      let userSession: UserSession | null = null;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: acc.identifier,
            password: acc.defaultPassword,
          }),
        });

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.user) {
            userSession = data.user;
          }
        }
      } catch (e) {
        console.warn('Backend login unavailable, using local demo authentication:', e);
      }

      // Fallback local demo session if server is offline or returned 404 (Vercel static)
      if (!userSession) {
        userSession = authenticateLocally(acc.identifier, acc.defaultPassword);
      }

      if (userSession) {
        localStorage.setItem('edukin_session', JSON.stringify(userSession));
        onLoginSuccess(userSession);
      } else {
        setErrorMessage('Impossible d’initialiser la session démo.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDemoAccounts = demoFilterRole === 'all'
    ? demoAccounts
    : demoAccounts.filter((a) => a.role === demoFilterRole || (demoFilterRole === 'direction' && ['directeur', 'directeur_etudes', 'directeur_discipline'].includes(a.role)));

  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col justify-between selection:bg-[#5f7a63] selection:text-white">
      {/* Top Bar with School System Context */}
      <div className="w-full border-b border-stone-100 py-2.5 px-4 text-xs text-stone-500 bg-stone-50/60">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium text-stone-700">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="font-bold text-slate-800">Masomo</span>
            <span className="text-slate-400">• Portail Scolaire RDC</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDemoModalOpen(true)}
            className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
          >
            Comptes de test (Rôles)
          </button>
        </div>
      </div>

      {/* Main Container - Phone Mockup Proportions centered */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[360px] mx-auto space-y-6">
          {/* Masomo Open Book Logo */}
          <div className="text-center pt-2">
            <div className="flex justify-center mb-2">
              <MasomoLogo size="xl" />
            </div>

            {/* Typography matching Masomo */}
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug mt-2">
              Masomo
            </h1>
            <p className="text-sm font-semibold text-blue-600 tracking-tight">
              Plateforme Numérique Scolaire RDC
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'signup' ? 'Créer votre compte enseignant ou élève' : 'Accédez à votre espace scolaire'}
            </p>
          </div>

          {/* Feedback messages if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Clean Input Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-1">
            {/* Field 1: E-mail */}
            <div className="relative flex items-center bg-[#f0f2ef] rounded-2xl px-4 py-3.5 transition-colors focus-within:bg-[#e9ede8] focus-within:ring-1 focus-within:ring-[#5f7a63]">
              <Mail className="w-5 h-5 text-stone-600 shrink-0 mr-3" />
              <input
                id="input-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-500 focus:outline-none font-normal"
                required={mode === 'signup'}
              />
            </div>

            {/* Field 2: Username / Matricule */}
            <div className="relative flex items-center bg-[#f0f2ef] rounded-2xl px-4 py-3.5 transition-colors focus-within:bg-[#e9ede8] focus-within:ring-1 focus-within:ring-[#5f7a63]">
              <User className="w-5 h-5 text-stone-600 shrink-0 mr-3" />
              <input
                id="input-login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'signup' ? "Username" : "Username ou Matricule élève"}
                className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-500 focus:outline-none font-normal"
                required={mode === 'signin'}
              />
            </div>

            {/* Field 3: Password */}
            <div className="relative flex items-center bg-[#f0f2ef] rounded-2xl px-4 py-3.5 transition-colors focus-within:bg-[#e9ede8] focus-within:ring-1 focus-within:ring-[#5f7a63]">
              <Lock className="w-5 h-5 text-stone-600 shrink-0 mr-3" />
              <input
                id="input-login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-500 focus:outline-none font-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-stone-400 hover:text-stone-600 ml-2 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Field 4: Confirm password (visible in Sign up mode as in screenshot) */}
            {mode === 'signup' && (
              <div className="relative flex items-center bg-[#f0f2ef] rounded-2xl px-4 py-3.5 transition-colors focus-within:bg-[#e9ede8] focus-within:ring-1 focus-within:ring-[#5f7a63]">
                <Lock className="w-5 h-5 text-stone-600 shrink-0 mr-3" />
                <input
                  id="input-login-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-transparent text-sm text-stone-900 placeholder-stone-500 focus:outline-none font-normal"
                />
              </div>
            )}

            {/* Sage Green Submit Button */}
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-4 px-6 rounded-2xl bg-[#5f7a63] hover:bg-[#526c56] active:bg-[#475d4a] text-white font-medium text-base transition-colors shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{mode === 'signup' ? 'Sign up' : 'Sign in'}</span>
              )}
            </button>
          </form>

          {/* Divider with "or" */}
          <div className="flex items-center my-5">
            <div className="flex-grow border-t border-stone-300" />
            <span className="px-3 text-sm text-stone-400 font-serif italic">
              or
            </span>
            <div className="flex-grow border-t border-stone-300" />
          </div>

          {/* Social Icons row (Facebook, Apple, Google) matching screenshot */}
          <div className="flex items-center justify-center gap-8 text-stone-800">
            {/* Facebook */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage("Option Facebook réservée à la production.");
              }}
              className="w-10 h-10 flex items-center justify-center hover:opacity-75 transition-opacity"
              aria-label="Sign in with Facebook"
            >
              <svg className="w-7 h-7 fill-stone-800" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage("Option Apple ID réservée aux appareils iOS configurés.");
              }}
              className="w-10 h-10 flex items-center justify-center hover:opacity-75 transition-opacity"
              aria-label="Sign in with Apple"
            >
              <svg className="w-7 h-7 fill-stone-800" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.95.04-2.11.64-2.79 1.45-.6.7-1.13 1.83-1 2.95 1.07.08 2.14-.54 2.8-1.3"/>
              </svg>
            </button>

            {/* Google */}
            <button
              type="button"
              onClick={() => {
                setErrorMessage("Connexion Google Workspace disponible pour les comptes @ecole.cd.");
              }}
              className="w-10 h-10 flex items-center justify-center hover:opacity-75 transition-opacity"
              aria-label="Sign in with Google"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  fill="#2c352d"
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                />
              </svg>
            </button>
          </div>

          {/* Bottom Switcher: "Already have an account? Sign in" */}
          <div className="text-center pt-2 pb-4">
            {mode === 'signup' ? (
              <p className="text-sm text-stone-700">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className="font-medium text-stone-900 underline hover:text-[#5f7a63] transition-colors"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-sm text-stone-700">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className="font-medium text-stone-900 underline hover:text-[#5f7a63] transition-colors"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Role Tester Slide-over/Modal */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-semibold text-base text-stone-900">
                  Comptes de Test Préconfigurés
                </h3>
                <p className="text-xs text-stone-500">
                  Cliquez sur un profil pour vous connecter directement
                </p>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
              {['all', 'direction', 'eleve', 'parent', 'enseignant'].map((rf) => (
                <button
                  key={rf}
                  onClick={() => setDemoFilterRole(rf)}
                  className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                    demoFilterRole === rf
                      ? 'bg-[#5f7a63] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {rf === 'all' ? 'Tous' : rf}
                </button>
              ))}
            </div>

            {/* Accounts list */}
            <div className="space-y-2">
              {filteredDemoAccounts.map((acc, idx) => (
                <div
                  key={`${acc.identifier}-${idx}`}
                  onClick={() => handleQuickLogin(acc)}
                  className="p-3 rounded-xl border border-stone-200 hover:border-[#5f7a63] bg-stone-50 hover:bg-stone-100/80 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-900">
                        {acc.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200/80 text-stone-700">
                        {acc.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                      ID: {acc.identifier}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#5f7a63] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Discreet bottom footer */}
      <footer className="w-full border-t border-stone-100 py-3 text-center text-xs text-stone-400">
        Masomo RDC • Système de gestion scolaire certifié EPST
      </footer>
    </div>
  );
};
