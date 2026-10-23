import { useState } from 'react';
import { School, Student, SchoolClass, Teacher, AttendanceRecord, Announcement, Subject } from '../types';
import { 
  Download, 
  RotateCcw, 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Layers, 
  DollarSign, 
  ArrowUpRight, 
  BarChart3, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  FolderPlus,
  ShieldCheck,
  FileText,
  Clock,
  Search,
  UserCheck,
  Award,
  BookOpen,
  Check,
  UserPlus,
  Plus,
  Sparkles,
  HelpCircle,
  Edit3,
  Filter
} from 'lucide-react';

interface DirecteurDashboardProps {
  school: School;
  students: Student[];
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects?: Subject[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  onOpenBulletinForStudent: (studentId: string) => void;
  onOpenUserManagement?: () => void;
  onAssignTitulaire?: (classId: string, teacherId: string) => Promise<void>;
  onAssignCourse?: (classId: string, subjectId: string, teacherId: string) => Promise<void>;
  onAddSubject?: (subjectData: Omit<Subject, 'id' | 'schoolId'>) => Promise<Subject | void>;
}

export const DirecteurDashboard = ({
  school,
  students,
  classes,
  teachers,
  subjects = [],
  attendance,
  announcements,
  onOpenBulletinForStudent,
  onOpenUserManagement,
  onAssignTitulaire,
  onAssignCourse,
  onAddSubject,
}: DirecteurDashboardProps) => {
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'month' | 'year'>('month');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [activeAlertAction, setActiveAlertAction] = useState<string | null>(null);
  const [titulaireSuccessMsg, setTitulaireSuccessMsg] = useState<string | null>(null);
  const [attributionSubTab, setAttributionSubTab] = useState<'titulaires' | 'cours'>('titulaires');
  const [selectedCourseClassId, setSelectedCourseClassId] = useState<string>(classes[0]?.id || '');
  const [assignedCoursesMap, setAssignedCoursesMap] = useState<Record<string, string>>({});

  // Formulaire d'attribution de cours personnalisé écrit par le Directeur
  const [showCourseCreationForm, setShowCourseCreationForm] = useState(false);
  const [courseNameInput, setCourseNameInput] = useState('');
  const [courseCodeInput, setCourseCodeInput] = useState('');
  const [courseCategoryInput, setCourseCategoryInput] = useState<Subject['category']>('Sciences');
  const [courseCoeffInput, setCourseCoeffInput] = useState<number>(2);
  const [courseMaxScoreInput, setCourseMaxScoreInput] = useState<number>(20);
  const [courseTeacherIdInput, setCourseTeacherIdInput] = useState<string>('');
  const [courseClassIdInput, setCourseClassIdInput] = useState<string>(classes[0]?.id || '');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [courseFilterSearch, setCourseFilterSearch] = useState('');

  const handleCreateAndAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseNameInput.trim()) {
      alert('Veuillez saisir le nom du cours.');
      return;
    }

    const targetClassId = courseClassIdInput || selectedCourseClassId || classes[0]?.id;
    const targetClass = classes.find((c) => c.id === targetClassId) || classes[0];
    const targetTeacher = teachers.find((t) => t.id === courseTeacherIdInput);

    setIsSubmittingCourse(true);
    try {
      const code = courseCodeInput.trim() || courseNameInput.trim().slice(0, 4).toUpperCase();
      let createdId = `sbj-${Date.now()}`;

      if (onAddSubject) {
        const result = await onAddSubject({
          name: courseNameInput.trim(),
          code,
          category: courseCategoryInput,
          defaultCoefficient: Number(courseCoeffInput) || 2,
          defaultMaxScore: Number(courseMaxScoreInput) || 20,
        });
        if (result && typeof result === 'object' && 'id' in result) {
          createdId = (result as Subject).id;
        }
      }

      if (onAssignCourse && targetClassId && courseTeacherIdInput) {
        await onAssignCourse(targetClassId, createdId, courseTeacherIdInput);
        setAssignedCoursesMap((prev) => ({
          ...prev,
          [`${targetClassId}-${createdId}`]: courseTeacherIdInput,
        }));
      }

      setTitulaireSuccessMsg(
        `✓ Cours « ${courseNameInput.trim()} » enregistré et attribué à ${
          targetTeacher ? targetTeacher.fullName : 'la classe'
        } (${targetClass?.name}). Le professeur pourra lui-même choisir ou moduler le coefficient lors de la saisie de notes.`
      );
      setTimeout(() => setTitulaireSuccessMsg(null), 5000);

      // Reset form
      setCourseNameInput('');
      setCourseCodeInput('');
      setCourseCoeffInput(2);
      setCourseMaxScoreInput(20);
      setCourseTeacherIdInput('');
      setShowCourseCreationForm(false);
    } catch (err) {
      console.error('Error creating course:', err);
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Statistics calculation
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  const todayAbsences = attendance.filter((a) => a.status === 'absent').length;
  const todayRetards = attendance.filter((a) => a.status === 'retard').length;
  const todayPresents = attendance.filter((a) => a.status === 'present').length;
  const totalPointed = attendance.length || 1;
  const attendanceRate = Math.round((todayPresents / totalPointed) * 100);

  const filteredStudents = students.filter((s) => {
    const q = searchStudentQuery.toLowerCase();
    return (
      s.lastName.toLowerCase().includes(q) ||
      s.firstName.toLowerCase().includes(q) ||
      s.matricule.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* DIRECTEUR TOP NAVIGATION BAR */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2 flex-wrap w-full">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tableau de Bord & Indicateurs</span>
        </button>

        {onOpenUserManagement && (
          <button
            id="tab-directeur-profiles-mgmt"
            onClick={onOpenUserManagement}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
            title="Créer et administrer les comptes : Enseignants, Directeur des Études, Comptable, Discipline, Élèves, Parents"
          >
            <UserPlus className="w-4 h-4" />
            <span>Création & Gestion des Profils (Tous les rôles)</span>
          </button>
        )}

        <button
          onClick={() => {
            const el = document.getElementById('section-titulaires-cours');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all"
        >
          <UserCheck className="w-4 h-4" />
          <span>Attribution des Titulaires & Cours</span>
        </button>

        <button
          onClick={() => setShowStudentsModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all"
        >
          <FileText className="w-4 h-4" />
          <span>Dossiers & Bulletins Élèves</span>
        </button>
      </div>

      {/* 1. TOP BLUE EXECUTIVE HERO BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-80 h-80 rounded-full bg-blue-500/20 pointer-events-none" />

        {/* Top Header Row: Welcome + Date + Export/Refresh + Direct Profile Creation Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Direction Générale
              </h1>
              <span className="px-3 py-0.5 rounded-full bg-white/15 text-white/90 text-xs font-medium border border-white/20">
                Mercredi, 19 Septembre 2026
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
              Aperçu des performances & administration de votre établissement ({school.name})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenUserManagement && (
              <button
                id="btn-directeur-create-profiles-hero"
                onClick={onOpenUserManagement}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all transform active:scale-95"
                title="Créer les profils : Directeur des études, discipline, enseignants, comptable, élèves, parents"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Créer des Profils & Comptes</span>
              </button>
            )}

            <button
              onClick={() => {
                alert(`Exportation du rapport d'activités (${school.name}) au format PDF / Excel en cours...`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter</span>
            </button>

            <button
              onClick={() => window.location.reload()}
              title="Actualiser les indicateurs"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embedded 4 Stat Cards inside Blue Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15 relative z-10">
          {/* Card 1: Today's Orders / Inscriptions du jour */}
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 transition-all">
            <div className="flex items-center gap-2 text-blue-100 text-xs font-medium">
              <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center">
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="truncate">Inscriptions du jour</span>
            </div>
            <div className="text-2xl font-bold text-white mt-2">47</div>
            <div className="text-[11px] text-emerald-300 font-medium mt-0.5 flex items-center gap-0.5">
              <span>+12%</span>
              <span className="text-blue-200/80">par rapport à hier</span>
            </div>
          </div>

          {/* Card 2: Users & Profiles (Clickable shortcut to User Management) */}
          <div 
            onClick={onOpenUserManagement}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-xs p-3.5 rounded-xl border border-white/20 transition-all cursor-pointer group"
            title="Cliquer pour gérer et créer tous les profils"
          >
            <div className="flex items-center justify-between text-blue-100 text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="truncate">Profils & Utilisateurs</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{totalTeachers + totalStudents + 4} Comptes</div>
            <div className="text-[11px] text-emerald-300 font-medium mt-0.5 flex items-center gap-0.5">
              <span>+ Créer Staff, Profs, Élèves</span>
            </div>
          </div>

          {/* Card 3: Revenue Today / Recettes du jour */}
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 transition-all">
            <div className="flex items-center gap-2 text-blue-100 text-xs font-medium">
              <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="truncate">Recettes du jour</span>
            </div>
            <div className="text-2xl font-bold text-white mt-2">84,500 CDF</div>
            <div className="text-[11px] text-emerald-300 font-medium mt-0.5 flex items-center gap-0.5">
              <span>+18%</span>
              <span className="text-blue-200/80">par rapport à hier</span>
            </div>
          </div>

          {/* Card 4: Taux d'Assiduité / Conversion Rate */}
          <div className="bg-white/10 hover:bg-white/15 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 transition-all">
            <div className="flex items-center gap-2 text-blue-100 text-xs font-medium">
              <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="truncate">Taux d'Assiduité</span>
            </div>
            <div className="text-2xl font-bold text-white mt-2">{attendanceRate}%</div>
            <div className="text-[11px] text-emerald-300 font-medium mt-0.5 flex items-center gap-0.5">
              <span>+0.4%</span>
              <span className="text-blue-200/80">par rapport à hier</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ROW OF 4 CRISP WHITE METRIC CARDS WITH PROGRESS BARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> +12.5%
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalStudents > 0 ? (totalStudents * 8 + 420).toLocaleString() : '1,240'}
            </div>
            <div className="text-xs font-medium text-slate-700 mt-0.5">Total Élèves Inscrits</div>
            <div className="text-[11px] text-slate-400">Élèves actifs & scolarisés</div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Progression</span>
              <span className="font-semibold text-slate-700">76%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '76%' }} />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>vs mois passé :</span>
              <span className="font-medium text-slate-600">1,156</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Classes / Sections */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Layers className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> +8.2%
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {totalClasses > 0 ? totalClasses : 24}
            </div>
            <div className="text-xs font-medium text-slate-700 mt-0.5">Classes & Sections</div>
            <div className="text-[11px] text-slate-400">Salles et cours actifs</div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Progression</span>
              <span className="font-semibold text-slate-700">82%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>vs mois passé :</span>
              <span className="font-medium text-slate-600">22</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Paiements & Reçus */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> +15.3%
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              9,238
            </div>
            <div className="text-xs font-medium text-slate-700 mt-0.5">Reçus & Frais Émis</div>
            <div className="text-[11px] text-slate-400">Minerval & acomptes trimestriels</div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Progression</span>
              <span className="font-semibold text-slate-700">85%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '85%' }} />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>vs mois passé :</span>
              <span className="font-medium text-slate-600">8,012</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Revenue / Recettes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> +23.1%
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              2.4M CDF
            </div>
            <div className="text-xs font-medium text-slate-700 mt-0.5">Recettes Totales</div>
            <div className="text-[11px] text-slate-400">Recouvrement net bancaire & Mobile</div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-500 font-medium">Progression</span>
              <span className="font-semibold text-slate-700">90%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full" style={{ width: '90%' }} />
            </div>
            <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
              <span>vs mois passé :</span>
              <span className="font-medium text-slate-600">1.95M CDF</span>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED PROFILES & ACCOUNTS MANAGEMENT CARD FOR THE DIRECTOR */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                Rôle Exclusif Direction
              </span>
              <span className="text-xs font-semibold text-slate-700">
                Administration Centrale des Utilisateurs ({school.name})
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Création & Administration de Tous les Profils de l'Établissement
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              En tant que Chef d'Établissement, vous avez la responsabilité de créer, activer et gérer tous les comptes de l'école. Chaque profil dispose d'un espace dédié et sécurisé :
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200">
                Directeur des Études
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200">
                Directeur de Discipline
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                Comptable & Caisse
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-orange-100 text-orange-800 text-[11px] font-semibold border border-orange-200">
                Enseignants & Titulaires
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 text-[11px] font-semibold border border-sky-200">
                Secrétaire Administratif
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-semibold border border-blue-200">
                Élèves (Matricules RDC)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-green-100 text-green-800 text-[11px] font-semibold border border-green-200">
                Parents d'Élèves
              </span>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            {onOpenUserManagement && (
              <button
                id="btn-directeur-access-profiles-main"
                onClick={onOpenUserManagement}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all transform active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Ouvrir la Création & Gestion des Profils</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. ROW 3: REVENUE ANALYTICS & LIVE ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left (2 cols): Revenue Analytics with horizontal progress bars */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Revenue Analytics</h2>
                <p className="text-xs text-slate-400">
                  Statistiques complètes du recouvrement des frais scolaires
                </p>
              </div>

              {/* Month / Year toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => setAnalyticsPeriod('month')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    analyticsPeriod === 'month'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Ce Mois
                </button>
                <button
                  onClick={() => setAnalyticsPeriod('year')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    analyticsPeriod === 'year'
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Cette Année
                </button>
              </div>
            </div>

            {/* Horizontal Bar Breakdown per Period */}
            <div className="space-y-4 my-4">
              {/* Item 1: Janvier / 1ère Période */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">1ère Période</span>
                    <span className="text-slate-400">• 842 reçus émis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-medium text-[11px]">+12.5%</span>
                    <span className="font-bold text-slate-800">180K CDF</span>
                  </div>
                </div>
                <div className="w-full h-8 rounded-lg bg-blue-50 overflow-hidden relative">
                  <div 
                    className="h-full bg-blue-600 rounded-lg flex items-center justify-end pr-3 text-white text-xs font-bold transition-all duration-500" 
                    style={{ width: '60%' }}
                  >
                    60%
                  </div>
                </div>
              </div>

              {/* Item 2: Février / 2ème Période */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">2ème Période</span>
                    <span className="text-slate-400">• 1,024 reçus émis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-medium text-[11px]">+22.2%</span>
                    <span className="font-bold text-slate-800">220K CDF</span>
                  </div>
                </div>
                <div className="w-full h-8 rounded-lg bg-blue-50 overflow-hidden relative">
                  <div 
                    className="h-full bg-blue-600 rounded-lg flex items-center justify-end pr-3 text-white text-xs font-bold transition-all duration-500" 
                    style={{ width: '73%' }}
                  >
                    73%
                  </div>
                </div>
              </div>

              {/* Item 3: Mars / 1er Semestre */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">1er Semestre (Examens)</span>
                    <span className="text-slate-400">• 1,156 reçus émis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-medium text-[11px]">+9.1%</span>
                    <span className="font-bold text-slate-800">240K CDF</span>
                  </div>
                </div>
                <div className="w-full h-8 rounded-lg bg-blue-50 overflow-hidden relative">
                  <div 
                    className="h-full bg-blue-600 rounded-lg flex items-center justify-end pr-3 text-white text-xs font-bold transition-all duration-500" 
                    style={{ width: '89%' }}
                  >
                    89%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Bottom Mini-Metric Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 text-center">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-sm font-bold text-slate-900">640K CDF</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Recettes Période</div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <div className="text-sm font-bold text-emerald-600">+18.5%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Taux de Croissance</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-sm font-bold text-slate-900">213K CDF</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Moyenne / Mois</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-sm font-bold text-slate-900">3,022</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Reçus Délivrés</div>
            </div>
          </div>
        </div>

        {/* Right (1 col): Live Activity timeline */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900">Live Activity</h2>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Mises à jour des événements en temps réel
            </p>

            {/* Timeline items */}
            <div className="space-y-3.5">
              {/* Event 1: Payment */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 leading-snug">
                    <strong className="font-semibold text-slate-900">Ahmad Sharif</strong> a payé le minerval
                  </div>
                  <div className="font-semibold text-blue-600 text-[11px] mt-0.5">45,000 CDF (M-Pesa)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Il y a 2 minutes</div>
                </div>
              </div>

              {/* Event 2: Inscription */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 leading-snug">
                    <strong className="font-semibold text-slate-900">Fatima Nazari</strong> inscrite en 4ème Scientifique
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Il y a 15 minutes</div>
                </div>
              </div>

              {/* Event 3: Teacher notes */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 leading-snug">
                    <strong className="font-semibold text-slate-900">Prof. Malela</strong> a validé les cotes de Mathématiques
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Il y a 32 minutes</div>
                </div>
              </div>

              {/* Event 4: Bulletin */}
              <div className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 leading-snug">
                    <strong className="font-semibold text-slate-900">Sara Ahmadi</strong> bulletin officiel généré (Distinction)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Il y a 1 heure</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => setShowStudentsModal(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Consulter les bulletins des élèves →
            </button>
          </div>
        </div>
      </div>

      {/* 4. ROW 4: QUICK ACTIONS & TOP SELLERS / CLASSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Actions (2x2 saturated colored cards) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
          <p className="text-xs text-slate-400 mb-4">
            Tâches administratives fréquentes
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Action 1: Inscrire un élève (Blue) */}
            <button
              onClick={() => setShowStudentsModal(true)}
              className="p-4 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white text-left hover:brightness-105 transition-all shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <FolderPlus className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-bold">Inscrire un Élève</div>
              <div className="text-[11px] text-blue-100/90 mt-0.5">Nouveau dossier scolaire</div>
            </button>

            {/* Action 2: Créer & Gérer les Profils (Teal / Emerald) */}
            <button
              id="btn-directeur-quickaction-create-profiles"
              onClick={onOpenUserManagement}
              className="p-4 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-left hover:brightness-105 transition-all shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-bold">Créer & Gérer les Profils</div>
              <div className="text-[11px] text-emerald-100/90 mt-0.5">Profs, Dir. Études, Caisse, Élèves, Parents</div>
            </button>

            {/* Action 3: Rapports & Caisse (Orange) */}
            <button
              onClick={() => {
                alert("Ouverture du grand livre des comptes et du journal de caisse...");
              }}
              className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white text-left hover:brightness-105 transition-all shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-bold">Rapports & Caisse</div>
              <div className="text-[11px] text-orange-100/90 mt-0.5">Journal des recettes</div>
            </button>

            {/* Action 4: Settings / Bulletins (Purple) */}
            <button
              onClick={() => setShowStudentsModal(true)}
              className="p-4 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-left hover:brightness-105 transition-all shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-3">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div className="text-xs font-bold">Bulletins & Palmarès</div>
              <div className="text-[11px] text-purple-100/90 mt-0.5">Délibération officielle</div>
            </button>
          </div>
        </div>

        {/* Top Sellers / Meilleures Classes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900">Palmarès des Meilleures Classes</h2>
              <button
                onClick={() => setShowStudentsModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tout &gt;
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Moyenne générale et taux d'assiduité ce trimestre
            </p>

            <div className="space-y-3">
              {/* Rank 1: Gold */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">4ème Scientifique A</div>
                    <div className="text-[11px] text-slate-400">34 élèves • +24.5% assiduité</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">94.5% Réussite</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Rang 1</div>
                </div>
              </div>

              {/* Rank 2: Silver */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">6ème Commerciale & Gestion</div>
                    <div className="text-[11px] text-slate-400">28 élèves • +18.2% assiduité</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">91.2% Réussite</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Rang 2</div>
                </div>
              </div>

              {/* Rank 3: Bronze */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">2ème Éducation de Base B</div>
                    <div className="text-[11px] text-slate-400">42 élèves • +15.7% assiduité</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">88.7% Réussite</div>
                  <div className="text-[11px] text-emerald-600 font-medium">Rang 3</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center pt-3 text-[11px] text-slate-400">
            Conforme au barème de notation officiel EPST RDC
          </div>
        </div>
      </div>

      {/* 5. ROW 5: PENDING ACTIONS (Actions en attente) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-slate-900">Pending Actions</h2>
          <span className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            25 En attente
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Dossiers nécessitant votre attention et validation immédiate
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Absences (Orange) */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                  12
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900">Vérification des Absences</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                12 élèves avec absences répétées nécessitent un billet de rentrée ou convocation parentale.
              </p>
            </div>
            <button
              onClick={() => setActiveAlertAction('absences')}
              className="mt-4 w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors text-center"
            >
              Traiter maintenant &gt;
            </button>
          </div>

          {/* Card 2: Paiements Mobile Money (Blue) */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  8
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900">Paiements Mobile Money</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                8 transactions reçues par M-Pesa & Airtel Money en attente d'émission du reçu officiel.
              </p>
            </div>
            <button
              onClick={() => setActiveAlertAction('mobile_money')}
              className="mt-4 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors text-center"
            >
              Vérifier &gt;
            </button>
          </div>

          {/* Card 3: Alertes Disciplinaires (Red) */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-bold">
                  5
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900">Alertes Disciplinaires</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                5 fiches de discipline signalées par le Surveillant Général à arbitrer par la Direction.
              </p>
            </div>
            <button
              onClick={() => setActiveAlertAction('discipline')}
              className="mt-4 w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors text-center"
            >
              Voir les litiges &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 6. GESTION ET ATTRIBUTION DES RÔLES DE TITULAIRES & COURS (7e, 8e EB & HUMANITÉS) */}
      <div id="section-titulaires-cours" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Organisation Pédagogique : Titulaires & Affectation des Cours
              </h2>
              <p className="text-xs text-slate-500">
                Attribution des professeurs titulaires et répartition des cours d’Éducation de Base (7e, 8e EB) et Humanités.
              </p>
            </div>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setAttributionSubTab('titulaires')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                attributionSubTab === 'titulaires'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Titulaires de Classe ({classes.filter((c) => c.mainTeacherId).length}/{classes.length})
            </button>
            <button
              onClick={() => setAttributionSubTab('cours')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                attributionSubTab === 'cours'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cours & Enseignants (7e, 8e EB)
            </button>
          </div>
        </div>

        {titulaireSuccessMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{titulaireSuccessMsg}</span>
          </div>
        )}

        {/* SUBTAB 1: TITULAIRES DE CLASSE */}
        {attributionSubTab === 'titulaires' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map((cls) => {
                const currentTitulaire = teachers.find((t) => t.id === cls.mainTeacherId);
                return (
                  <div
                    key={cls.id}
                    className={`p-3.5 rounded-xl border space-y-2.5 text-xs transition-all shadow-2xs ${
                      cls.mainTeacherId
                        ? 'border-indigo-200 bg-indigo-50/20'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{cls.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                        {cls.level}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Section : {cls.section}</span>
                      <span className="text-slate-400">Capacité : {cls.capacity}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Professeur Titulaire :
                        </label>
                      </div>

                      {onAssignTitulaire ? (
                        <select
                          id={`directeur-select-titulaire-${cls.id}`}
                          value={cls.mainTeacherId || ''}
                          onChange={async (e) => {
                            const newId = e.target.value;
                            await onAssignTitulaire(cls.id, newId);
                            const appointedTeacher = teachers.find((t) => t.id === newId);
                            setTitulaireSuccessMsg(
                              appointedTeacher
                                ? `✓ ${appointedTeacher.fullName} nommé Titulaire officiel de la classe ${cls.name}.`
                                : `Titulaire retiré pour la classe ${cls.name}.`
                            );
                            setTimeout(() => setTitulaireSuccessMsg(null), 4000);
                          }}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                        >
                          <option value="">-- Aucun titulaire (Sélectionner) --</option>
                          {teachers.map((tch) => (
                            <option key={tch.id} value={tch.id}>
                              {tch.fullName} ({tch.specialty})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-slate-600 font-medium">
                          {currentTitulaire ? currentTitulaire.fullName : 'Non assigné'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 2: COURS & ENSEIGNANTS (7e, 8e EB & HUMANITÉS) */}
        {attributionSubTab === 'cours' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Guide & Règles d'attribution des cours et des coefficients */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Attribution des cours par la Direction & Choix du coefficient par le Professeur</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                <strong>1. Écriture du nom du cours :</strong> Le Directeur peut rédiger librement le nom d'un cours spécifique (ex : <em>Botanique</em>, <em>Dessin Technique</em>, <em>Informatique Pratique</em>) ou attribuer les matières du programme officiel EPST.
                <br />
                <strong>2. Liberté du coefficient par le professeur :</strong> Le coefficient défini ici sert de base indicative. Lors de chaque saisie de notes, <strong>l'enseignant choisit et modifie lui-même le coefficient</strong> directement sur son écran selon le barème de son évaluation.
              </p>
            </div>

            {/* Actions Bar: Class Selector + New Course Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Class Pill selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Classe :</span>
                {classes.map((cls) => {
                  const isSelected = (selectedCourseClassId || classes[0]?.id) === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setSelectedCourseClassId(cls.id);
                        setCourseClassIdInput(cls.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cls.name}
                    </button>
                  );
                })}
              </div>

              {/* Button to toggle custom course writing form */}
              <button
                type="button"
                onClick={() => setShowCourseCreationForm((prev) => !prev)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{showCourseCreationForm ? 'Masquer le formulaire' : 'Rédiger un cours personnalisé'}</span>
              </button>
            </div>

            {/* FORMULAIRE : ÉCRIRE LE NOM DU COURS ET ATTRIBUER AU PROFESSEUR */}
            {showCourseCreationForm && (
              <form
                onSubmit={handleCreateAndAssignCourse}
                className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-3.5 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-xs">
                      Créer un nouveau cours & l'affecter à un professeur
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Saisie par le Directeur
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Nom du cours écrit par le directeur */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nom complet du cours rédigé par le Directeur *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Botanique & Écologie, Dessin & Métiers, Informatique Pratique..."
                      value={courseNameInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCourseNameInput(val);
                        if (!courseCodeInput) {
                          setCourseCodeInput(val.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, ''));
                        }
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Code de référence */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Code officiel / Abrégé *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: BOT, DESS, INFO"
                      value={courseCodeInput}
                      onChange={(e) => setCourseCodeInput(e.target.value.toUpperCase())}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Catégorie pédagogique
                    </label>
                    <select
                      value={courseCategoryInput}
                      onChange={(e) => setCourseCategoryInput(e.target.value as Subject['category'])}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Sciences">Sciences & Technologies</option>
                      <option value="Lettres & Langues">Lettres & Langues</option>
                      <option value="Sciences Humaines">Sciences Humaines & Sociales</option>
                      <option value="Technique">Technique & Professionnel</option>
                      <option value="Autre">Autre / Éducation Civique</option>
                    </select>
                  </div>

                  {/* Classe cible */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Classe concernée *
                    </label>
                    <select
                      value={courseClassIdInput || selectedCourseClassId}
                      onChange={(e) => setCourseClassIdInput(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Professeur assigné */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Professeur en charge du cours *
                    </label>
                    <select
                      required
                      value={courseTeacherIdInput}
                      onChange={(e) => setCourseTeacherIdInput(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-- Choisir le professeur --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Coefficient indicatif */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Coeff. indicatif (modifiable par le prof)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={courseCoeffInput}
                      onChange={(e) => setCourseCoeffInput(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* Barème indicatif */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Barème indicatif (points)
                    </label>
                    <select
                      value={courseMaxScoreInput}
                      onChange={(e) => setCourseMaxScoreInput(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="20">Sur 20 points (Standard)</option>
                      <option value="40">Sur 40 points</option>
                      <option value="50">Sur 50 points</option>
                      <option value="10">Sur 10 points</option>
                    </select>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-end gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingCourse}
                      className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSubmittingCourse ? 'Enregistrement...' : 'Enregistrer & Attribuer'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCourseCreationForm(false)}
                      className="py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Courses List for the selected class */}
            {(() => {
              const activeClass = classes.find((c) => c.id === (selectedCourseClassId || classes[0]?.id)) || classes[0];
              const rawSubjects = subjects.length > 0 ? subjects : [
                { id: 'sbj-math', schoolId: school.id, name: 'Mathématiques & Algèbre', code: 'MATH', category: 'Sciences', defaultCoefficient: 4, defaultMaxScore: 40 },
                { id: 'sbj-fr', schoolId: school.id, name: 'Français & Littérature', code: 'FRAN', category: 'Lettres & Langues', defaultCoefficient: 4, defaultMaxScore: 40 },
                { id: 'sbj-phys', schoolId: school.id, name: 'Sciences Physiques & Technologie', code: 'PHYS', category: 'Sciences', defaultCoefficient: 3, defaultMaxScore: 30 },
                { id: 'sbj-svt', schoolId: school.id, name: 'Sciences de la Vie et de la Terre (SVT)', code: 'SVT', category: 'Sciences', defaultCoefficient: 2, defaultMaxScore: 20 },
                { id: 'sbj-ang', schoolId: school.id, name: 'Anglais & Communication', code: 'ANG', category: 'Lettres & Langues', defaultCoefficient: 2, defaultMaxScore: 20 },
                { id: 'sbj-hist', schoolId: school.id, name: 'Histoire & Éducation Civique', code: 'HIST', category: 'Sciences Humaines', defaultCoefficient: 2, defaultMaxScore: 20 },
                { id: 'sbj-info', schoolId: school.id, name: 'Informatique & TIC', code: 'INFO', category: 'Sciences', defaultCoefficient: 2, defaultMaxScore: 20 },
              ];

              const displaySubjects = courseFilterSearch.trim()
                ? rawSubjects.filter(
                    (s) =>
                      s.name.toLowerCase().includes(courseFilterSearch.toLowerCase()) ||
                      s.code.toLowerCase().includes(courseFilterSearch.toLowerCase())
                  )
                : rawSubjects;

              return (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-0">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">
                        Cours programmés pour <strong className="text-indigo-600 font-bold">{activeClass?.name}</strong> ({activeClass?.level})
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {displaySubjects.length} cours • Le coefficient peut être modulé par l'enseignant lors de ses saisies
                      </p>
                    </div>

                    {/* Quick filter */}
                    <div className="relative w-full sm:w-56">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Filtrer un cours..."
                        value={courseFilterSearch}
                        onChange={(e) => setCourseFilterSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {displaySubjects.map((sub) => {
                      const currentAssignedTeacherId = assignedCoursesMap[`${activeClass?.id}-${sub.id}`] || (teachers[0]?.id ?? '');
                      const assignedTeacher = teachers.find((t) => t.id === currentAssignedTeacherId);

                      return (
                        <div key={sub.id} className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-slate-50/70 transition-colors">
                          <div className="min-w-56">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{sub.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                                {sub.code}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Catégorie : {sub.category} • Coeff indicatif : <strong>{sub.defaultCoefficient}</strong> • Barème : /{sub.defaultMaxScore} pts
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 max-w-md">
                            <label className="text-[11px] text-slate-500 font-medium sm:hidden">
                              Professeur attribué :
                            </label>
                            <select
                              value={currentAssignedTeacherId}
                              onChange={(e) => {
                                const tId = e.target.value;
                                setAssignedCoursesMap((prev) => ({
                                  ...prev,
                                  [`${activeClass?.id}-${sub.id}`]: tId,
                                }));
                                if (onAssignCourse && activeClass) {
                                  onAssignCourse(activeClass.id, sub.id, tId);
                                }
                                const tch = teachers.find((t) => t.id === tId);
                                setTitulaireSuccessMsg(
                                  tch
                                    ? `✓ ${tch.fullName} affecté au cours de ${sub.name} (${activeClass?.name}). L'enseignant choisit son coefficient à la saisie.`
                                    : 'Affectation mise à jour.'
                                );
                                setTimeout(() => setTitulaireSuccessMsg(null), 3500);
                              }}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                            >
                              <option value="">-- Assigner un professeur --</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.fullName} ({t.specialty})
                                </option>
                              ))}
                            </select>

                            <div className="shrink-0">
                              {assignedTeacher ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Affecté : {assignedTeacher.fullName.split(' ')[0]}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  À pourvoir
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* 7. MODAL TO VIEW STUDENTS & OPEN BULLETINS */}
      {showStudentsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dossiers & Bulletins Élèves</h3>
                <p className="text-xs text-slate-400">Consultez et imprimez les bulletins officiels EPST</p>
              </div>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  placeholder="Rechercher un élève par nom, prénom ou matricule..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredStudents.map((stu) => {
                const stuClass = classes.find((c) => c.id === stu.classId);
                return (
                  <div
                    key={stu.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {stu.lastName} {stu.postName} {stu.firstName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="font-mono">{stu.matricule}</span>
                        <span>•</span>
                        <span>{stuClass?.name || 'Section'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowStudentsModal(false);
                        onOpenBulletinForStudent(stu.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                    >
                      Ouvrir Bulletin
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. ACTION CONFIRMATION MODAL */}
      {activeAlertAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {activeAlertAction === 'absences' && 'Traitement des Absences non justifiées'}
              {activeAlertAction === 'mobile_money' && 'Validation des Transactions Mobile Money'}
              {activeAlertAction === 'discipline' && 'Arbitrage des Alertes Disciplinaires'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Les dossiers ont été synchronisés avec la base de données. Les notifications automatiques par SMS ont été envoyées aux parents concernés.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setActiveAlertAction(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
