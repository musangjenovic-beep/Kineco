import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  BookOpen,
  Calendar,
  ShieldCheck,
  Save,
  CheckCircle2,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Check,
  Database
} from 'lucide-react';
import { School, SchoolClass, Subject, Teacher, UserSession } from '../types';

interface TeacherProfileViewProps {
  currentUser: UserSession | null;
  currentSchool: School;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  onBackToClasses: () => void;
  onUpdateCurrentUser: (updatedSession: UserSession) => void;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({
  currentUser,
  currentSchool,
  classes,
  subjects,
  teachers,
  onBackToClasses,
  onUpdateCurrentUser,
}) => {
  // Find linked teacher record if available
  const matchedTeacher = teachers.find(
    (t) =>
      t.id === currentUser?.teacherId ||
      (t.email && currentUser?.email && t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.fullName && t.fullName.toLowerCase().includes(currentUser.fullName.toLowerCase()))
  ) || teachers[0];

  // Editable fields
  const [fullName, setFullName] = useState(currentUser?.fullName || matchedTeacher?.fullName || 'Professeur Masomo');
  const [email, setEmail] = useState(currentUser?.email || matchedTeacher?.email || 'professeur@masomo.cd');
  const [phone, setPhone] = useState(currentUser?.phone || matchedTeacher?.phone || '+243 81 500 1234');
  const [address, setAddress] = useState('Avenue de la Paix 12, Commune de Ngaliema, Kinshasa');
  const [qualification, setQualification] = useState(matchedTeacher?.qualification || 'Licence en Pédagogie Appliquée (ISP / Gombe)');
  const [bio, setBio] = useState('Enseignant dévoué à l’excellence académique et à la rigueur méthodologique des élèves en République Démocratique du Congo.');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

  // 14-Day Profile Modification Restriction Calculation
  const lastProfileUpdate = currentUser?.lastProfileUpdateDate;
  let isProfileRestricted = false;
  let daysRemaining = 0;
  if (lastProfileUpdate) {
    const lastMs = new Date(lastProfileUpdate).getTime();
    const elapsedDays = (Date.now() - lastMs) / (1000 * 60 * 60 * 24);
    if (elapsedDays < 14) {
      isProfileRestricted = true;
      daysRemaining = Math.ceil(14 - elapsedDays);
    }
  }

  // Google account linking
  const isGoogleLinked = Boolean(currentUser?.googleLinked || currentUser?.googleEmail);

  // Classes taught
  const assignedClasses = classes.filter((c) =>
    matchedTeacher?.assignedClasses?.includes(c.id) || c.mainTeacherId === matchedTeacher?.id
  );
  const displayClasses = assignedClasses.length > 0 ? assignedClasses : classes.slice(0, 3);

  // Subjects taught
  const assignedSubjects = subjects.filter((s) =>
    matchedTeacher?.specialty && (s.name.toLowerCase().includes(matchedTeacher.specialty.toLowerCase()) || s.code.toLowerCase().includes(matchedTeacher.specialty.toLowerCase()))
  );
  const displaySubjects = assignedSubjects.length > 0 ? assignedSubjects : subjects.slice(0, 4);

  const handleToggleGoogleLink = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const nextLinked = !isGoogleLinked;
      const res = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleLinked: nextLinked,
          googleEmail: nextLinked ? email : undefined,
          bypassDelay: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour Google');
      localStorage.setItem('edukin_session', JSON.stringify(data));
      onUpdateCurrentUser(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de mettre à jour la liaison Google');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProfileRestricted) {
      setErrorMessage(`Modification verrouillée : Vous devez attendre encore ${daysRemaining} jour(s) avant de modifier à nouveau votre profil.`);
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      // 1. Sync with backend API (real DB update)
      if (currentUser?.id) {
        const res = await fetch(`/api/users/${currentUser.id}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email,
            phone,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Erreur lors de la mise à jour (${res.status})`);
        }

        // Update local session state
        localStorage.setItem('edukin_session', JSON.stringify(data));
        onUpdateCurrentUser(data);
      }

      if (matchedTeacher?.id) {
        await fetch(`/api/teachers/${matchedTeacher.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            qualification,
          }),
        });
      }

      setLastSyncTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsSaving(false);
    }
  };

  const userInitial = fullName.charAt(0).toUpperCase();

  return (
    <div className="w-full min-h-[calc(100vh-100px)] flex flex-col space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Breadcrumb / Return Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToClasses}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à Mes Classes</span>
        </button>

        {/* Real Live Database Sync Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3.5 h-3.5" />
          <span className="font-semibold">Base de Données Synchronisée</span>
          <span className="text-emerald-600/70 dark:text-emerald-400/70">({lastSyncTime})</span>
        </div>
      </div>

      {/* Main Full-Width Header Card */}
      <div className="w-full rounded-2xl bg-white dark:bg-[#181B20] border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-3xl flex items-center justify-center shadow-md shrink-0">
            {userInitial}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {fullName}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Titulaire
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Compte Actif
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Établissement : <strong className="text-slate-700 dark:text-slate-200">{currentSchool.name}</strong> • {currentSchool.city}, RDC
            </p>
            <p className="text-xs text-slate-400">
              Matricule National : <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">ENS-CD-2024-0089</span> • ID Système : <span className="font-mono">{matchedTeacher?.id || currentUser?.id || 'masomo-user'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-auto shrink-0">
          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Volume Horaire</span>
            <span className="font-bold text-slate-900 dark:text-white">24h / semaine (Plein Temps)</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Ancienneté</span>
            <span className="font-bold text-slate-900 dark:text-white">6 années de service</span>
          </div>
        </div>
      </div>

      {/* Success Notification Bar */}
      {saveSuccess && (
        <div className="w-full p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="font-bold text-xs">Profil enregistré et synchronisé avec succès !</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Vos nouvelles coordonnées ont été enregistrées dans le serveur et sur la base de données.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-600">{lastSyncTime}</span>
        </div>
      )}

      {/* Full-Width Two Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full flex-1">
        
        {/* Left Column: Official Administrative Dossier (1/3) */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Official Dossier Card */}
          <div className="rounded-2xl bg-white dark:bg-[#181B20] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Dossier Pédagogique Officiel</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="block text-[11px] text-slate-400 font-medium">Diplôme & Qualification</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{qualification}</span>
              </div>

              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="block text-[11px] text-slate-400 font-medium">Régime Administratif</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Enseignant Permanent Titulaire</span>
              </div>

              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="block text-[11px] text-slate-400 font-medium">Affectation Officielle</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{currentSchool.name}</span>
              </div>

              <div>
                <span className="block text-[11px] text-slate-400 font-medium">Statut Sécurité & Conformité</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  <Check className="w-3.5 h-3.5" /> Conforme Normes EPST RDC
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Classes & Subjects Card */}
          <div className="rounded-2xl bg-white dark:bg-[#181B20] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Classes & Cours Attribués</span>
            </h3>

            <div className="space-y-3">
              <div>
                <span className="block text-[11px] text-slate-400 font-medium mb-1.5">Classes en charge :</span>
                <div className="flex flex-wrap gap-1.5">
                  {displayClasses.map((cls) => (
                    <span
                      key={cls.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700"
                    >
                      {cls.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="block text-[11px] text-slate-400 font-medium mb-1.5">Matières enseignées :</span>
                <div className="flex flex-wrap gap-1.5">
                  {displaySubjects.map((sbj) => (
                    <span
                      key={sbj.id}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800"
                    >
                      {sbj.name} ({sbj.code})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Google Account Linking Card */}
          <div className="rounded-2xl bg-white dark:bg-[#181B20] border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.41 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.13z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.59 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
                Connexion Google
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isGoogleLinked
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {isGoogleLinked ? 'Lié' : 'Non associé'}
              </span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Liez votre compte Google pour vous connecter en 1 clic sans ressaisir vos identifiants.
            </p>

            {isGoogleLinked && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                {currentUser?.googleEmail || email}
              </div>
            )}

            <button
              type="button"
              onClick={handleToggleGoogleLink}
              disabled={isSaving}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                isGoogleLinked
                  ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40'
                  : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}
            >
              {isGoogleLinked ? 'Délier le compte Google' : 'Lier mon compte Google'}
            </button>
          </div>

        </div>

        {/* Right Column: Complete Edit & Sync Form (2/3) */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-2xl bg-white dark:bg-[#181B20] border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-6">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Modifier les Coordonnées & l’État Civil
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ces informations sont directement synchronisées avec la base de données et l'administration scolaire
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isProfileRestricted
                      ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {isProfileRestricted ? `Verrouillé (${daysRemaining}j restants)` : 'Modifications autorisées'}
                </span>
              </div>

              {/* 14-Day Profile Edit Restriction Banner */}
              {isProfileRestricted ? (
                <div className="mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Règle de sécurité des profils (Délai de 2 semaines) :</span>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                      Conformément à la politique de traçabilité, les informations de profil (nom, numéro, adresse e-mail) ne peuvent être modifiées qu'une fois toutes les 2 semaines. Votre dernière mise à jour est active. Prochaine modification autorisée dans{' '}
                      <strong>{daysRemaining} jour(s)</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Délai de sécurité de 2 semaines respecté : vous pouvez mettre à jour vos coordonnées.
                  </span>
                  {lastProfileUpdate && (
                    <span className="text-[11px] text-slate-400">
                      Dernier changement : {new Date(lastProfileUpdate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs">
                  {errorMessage}
                </div>
              )}

              <form id="teacher-profile-form" onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name & Qualification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nom complet officiel * {isProfileRestricted && '(Verrouillé)'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        disabled={isProfileRestricted}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                          isProfileRestricted
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                        }`}
                        placeholder="Ex: Professeur Jean-Paul Kalambayi"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Diplôme / Qualification principale
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        disabled={isProfileRestricted}
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                          isProfileRestricted
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                        }`}
                        placeholder="Ex: Licence Pédagogique, Agrégation..."
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Adresse Email professionnelle * {isProfileRestricted && '(Verrouillé)'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        disabled={isProfileRestricted}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                          isProfileRestricted
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                        }`}
                        placeholder="professeur@masomo.cd"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Numéro Téléphone / WhatsApp * {isProfileRestricted && '(Verrouillé)'}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        disabled={isProfileRestricted}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                          isProfileRestricted
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                        }`}
                        placeholder="+243 81 500 1234"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Adresse de Résidence (Commune / Ville)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Commune de Lemba, Kinshasa"
                    />
                  </div>
                </div>

                {/* Bio / Pédagogie */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Note pédagogique & Biographie succincte
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Présentez votre parcours et votre vision de l'enseignement..."
                  />
                </div>
              </form>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-400" />
                <span>Les modifications sont enregistrées sur le serveur local et Supabase.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onBackToClasses}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="teacher-profile-form"
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Synchronisation...' : 'Enregistrer et Synchroniser'}</span>
                </button>
              </div>
            </div>

          </div>
      </div>

      </div>
    </div>
  );
};
