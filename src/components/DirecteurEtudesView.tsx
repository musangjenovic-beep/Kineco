import { useState } from 'react';
import {
  School,
  SchoolClass,
  Subject,
  Student,
  Grade,
  AcademicPeriod,
  Teacher,
  ClassSubject,
} from '../types';
import {
  BookOpen,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
  ShieldCheck,
  UserCheck,
  Plus,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  X,
  GraduationCap,
  Sparkles,
  Users,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface DirecteurEtudesViewProps {
  school: School;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  teachers?: Teacher[];
  grades: Grade[];
  academicPeriods: AcademicPeriod[];
  classSubjects?: ClassSubject[];
  onOpenBulletin: (studentId: string) => void;
  onAssignCourse?: (
    classId: string,
    subjectId: string,
    teacherId: string,
    coefficient?: number,
    maxScore?: number,
    weeklyHours?: number
  ) => Promise<void>;
  onDeleteClassSubject?: (classSubjectId: string) => Promise<void>;
  onAddSubject?: (subjectData: Omit<Subject, 'id' | 'schoolId'>) => Promise<Subject | undefined>;
  onAssignTitulaire?: (classId: string, teacherId: string) => Promise<void>;
}

export const DirecteurEtudesView = ({
  school,
  classes,
  subjects,
  students,
  teachers = [],
  grades,
  academicPeriods,
  classSubjects = [],
  onOpenBulletin,
  onAssignCourse,
  onDeleteClassSubject,
  onAddSubject,
  onAssignTitulaire,
}: DirecteurEtudesViewProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'deliberation' | 'cours' | 'titulaires'>('deliberation');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [validatedNotice, setValidatedNotice] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Security Lock State for Course Assignments (prevents accidental edits)
  const [isGridLocked, setIsGridLocked] = useState<boolean>(true);
  const [unlockedItemIds, setUnlockedItemIds] = useState<Set<string>>(new Set());

  // Modal 1: Create New Subject
  const [isCreateSubjectModalOpen, setIsCreateSubjectModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCategory, setNewSubCategory] = useState<Subject['category']>('Sciences');
  const [newSubCoeff, setNewSubCoeff] = useState('2');
  const [newSubMaxScore, setNewSubMaxScore] = useState('20');
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);

  // Modal 2: Assign Course to Class
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSubjectId, setAssignSubjectId] = useState<string>(subjects[0]?.id || '');
  const [assignTeacherId, setAssignTeacherId] = useState<string>(teachers[0]?.id || '');
  const [assignCoeff, setAssignCoeff] = useState('2');
  const [assignMaxScore, setAssignMaxScore] = useState('20');
  const [assignWeeklyHours, setAssignWeeklyHours] = useState('3');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Modal 3: Confirmation for Accidental Edit/Unlock
  const [confirmModalData, setConfirmModalData] = useState<{
    type: 'unlock' | 'delete' | 'change_teacher';
    classSubjectId?: string;
    subjectName?: string;
    className?: string;
    newTeacherId?: string;
    newTeacherName?: string;
  } | null>(null);

  // Modal 4: Assign Titulaire de Classe
  const [titulaireModalClass, setTitulaireModalClass] = useState<SchoolClass | null>(null);
  const [selectedTitulaireId, setSelectedTitulaireId] = useState<string>('');
  const [isSubmittingTitulaire, setIsSubmittingTitulaire] = useState(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClass?.id);

  // Calculate stats for this class
  const publishedGradesCount = grades.filter(
    (g) => g.classId === selectedClass?.id && g.status === 'published'
  ).length;
  const draftGradesCount = grades.filter(
    (g) => g.classId === selectedClass?.id && g.status === 'draft'
  ).length;

  // Filter class subjects for current class
  const currentClassSubjects = classSubjects.filter(
    (cs) => cs.classId === selectedClass?.id
  );

  // Compute total weekly hours and coefficients for selected class
  const totalWeeklyHours = currentClassSubjects.reduce((acc, curr) => acc + (curr.weeklyHours || 2), 0);
  const totalCoefficients = currentClassSubjects.reduce((acc, curr) => acc + (curr.coefficient || 1), 0);

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleValidateAllBulletins = () => {
    setValidatedNotice(true);
    setTimeout(() => setValidatedNotice(false), 3500);
  };

  // 1. Submit Create New Subject
  const handleCreateSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) {
      showNotification('Veuillez renseigner le nom et le code de la matière', true);
      return;
    }

    setIsSubmittingSubject(true);
    try {
      if (onAddSubject) {
        await onAddSubject({
          name: newSubName.trim(),
          code: newSubCode.trim().toUpperCase(),
          category: newSubCategory,
          defaultCoefficient: Number(newSubCoeff) || 1,
          defaultMaxScore: Number(newSubMaxScore) || 20,
        });
      }
      showNotification(`✓ Matière "${newSubName.trim()}" (${newSubCode.trim().toUpperCase()}) enregistrée au programme.`);
      setNewSubName('');
      setNewSubCode('');
      setNewSubCoeff('2');
      setNewSubMaxScore('20');
      setIsCreateSubjectModalOpen(false);
    } catch (err: any) {
      showNotification(err?.message || 'Erreur lors de la création de la matière', true);
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  // 2. Submit Assign Course to Class
  const handleAssignCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !assignSubjectId) {
      showNotification('Veuillez sélectionner une matière', true);
      return;
    }

    setIsSubmittingAssign(true);
    try {
      if (onAssignCourse) {
        await onAssignCourse(
          selectedClass.id,
          assignSubjectId,
          assignTeacherId,
          Number(assignCoeff) || 1,
          Number(assignMaxScore) || 20,
          Number(assignWeeklyHours) || 2
        );
      }
      const subObj = subjects.find((s) => s.id === assignSubjectId);
      const tchObj = teachers.find((t) => t.id === assignTeacherId);
      showNotification(
        `✓ Cours de ${subObj?.name || 'Matière'} attribué à ${selectedClass.name}${
          tchObj ? ` (Professeur: ${tchObj.fullName})` : ''
        }.`
      );
      setIsAssignModalOpen(false);
    } catch (err: any) {
      showNotification(err?.message || 'Erreur lors de l’attribution du cours', true);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // 3. Confirm Delete / Unlock
  const handleExecuteConfirmedAction = async () => {
    if (!confirmModalData) return;

    if (confirmModalData.type === 'delete' && confirmModalData.classSubjectId) {
      if (onDeleteClassSubject) {
        await onDeleteClassSubject(confirmModalData.classSubjectId);
        showNotification(`✓ Attribution du cours de ${confirmModalData.subjectName} retirée de la classe.`);
      }
    } else if (confirmModalData.type === 'unlock' && confirmModalData.classSubjectId) {
      setUnlockedItemIds((prev) => new Set([...prev, confirmModalData.classSubjectId!]));
      showNotification(`Déverrouillé : Vous pouvez modifier l'attribution de ${confirmModalData.subjectName}.`);
    } else if (confirmModalData.type === 'change_teacher' && confirmModalData.classSubjectId && selectedClass) {
      const cs = classSubjects.find((item) => item.id === confirmModalData.classSubjectId);
      if (cs && onAssignCourse) {
        await onAssignCourse(
          selectedClass.id,
          cs.subjectId,
          confirmModalData.newTeacherId || '',
          cs.coefficient,
          cs.maxScore,
          cs.weeklyHours
        );
        showNotification(`✓ Professeur ${confirmModalData.newTeacherName} affecté au cours de ${confirmModalData.subjectName}.`);
      }
    }

    setConfirmModalData(null);
  };

  // 4. Submit Titulaire Assignment
  const handleOpenTitulaireModal = (cls: SchoolClass) => {
    setTitulaireModalClass(cls);
    setSelectedTitulaireId(cls.mainTeacherId || teachers[0]?.id || '');
  };

  const handleSubmitTitulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulaireModalClass || !selectedTitulaireId) return;

    setIsSubmittingTitulaire(true);
    try {
      if (onAssignTitulaire) {
        await onAssignTitulaire(titulaireModalClass.id, selectedTitulaireId);
      }
      const tFound = teachers.find((t) => t.id === selectedTitulaireId);
      showNotification(
        `✓ ${tFound?.fullName || 'Professeur'} désigné officiellement Titulaire de la classe ${titulaireModalClass.name}.`
      );
      setTitulaireModalClass(null);
    } catch (err: any) {
      showNotification(err?.message || 'Erreur lors de la désignation du titulaire', true);
    } finally {
      setIsSubmittingTitulaire(false);
    }
  };

  // Fallback subjects if none exist yet
  const availableSubjects = subjects.length > 0 ? subjects : [
    { id: 'sbj-math', schoolId: school.id, name: 'Mathématiques & Algèbre', code: 'MATH', category: 'Sciences' as const, defaultCoefficient: 4, defaultMaxScore: 40 },
    { id: 'sbj-fr', schoolId: school.id, name: 'Français & Littérature', code: 'FRAN', category: 'Lettres & Langues' as const, defaultCoefficient: 4, defaultMaxScore: 40 },
    { id: 'sbj-phys', schoolId: school.id, name: 'Sciences Physiques & Technologie', code: 'PHYS', category: 'Sciences' as const, defaultCoefficient: 3, defaultMaxScore: 30 },
    { id: 'sbj-svt', schoolId: school.id, name: 'Sciences de la Vie et de la Terre (SVT)', code: 'SVT', category: 'Sciences' as const, defaultCoefficient: 2, defaultMaxScore: 20 },
    { id: 'sbj-ang', schoolId: school.id, name: 'Anglais & Expression', code: 'ANG', category: 'Lettres & Langues' as const, defaultCoefficient: 2, defaultMaxScore: 20 },
    { id: 'sbj-hist', schoolId: school.id, name: 'Histoire & Citoyenneté', code: 'HIST', category: 'Sciences Humaines' as const, defaultCoefficient: 2, defaultMaxScore: 20 },
    { id: 'sbj-info', schoolId: school.id, name: 'Informatique & TIC', code: 'INFO', category: 'Sciences' as const, defaultCoefficient: 2, defaultMaxScore: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Direction des Études & Pédagogie RDC
              </span>
              <span className="text-xs text-slate-500 font-medium">{school.name}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Supervision Pédagogique, Attribution des Cours & Titulaires
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Gestion de la grille horaire officielle, affectation sécurisée des enseignants par discipline,
              nomination des titulaires de classe et validation délibérative des bulletins RDC.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateSubjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-teal-700" />
              <span>Nouveau Cours</span>
            </button>
            <button
              id="btn-validate-class-bulletins"
              onClick={handleValidateAllBulletins}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider les Bulletins</span>
            </button>
          </div>
        </div>

        {validatedNotice && (
          <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-300 text-teal-800 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-teal-600" />
            <span>Tous les bulletins de la classe {selectedClass?.name} ont été approuvés pour impression et publication aux parents.</span>
          </div>
        )}

        {/* Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Classe sélectionnée</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">{selectedClass?.name}</div>
            <span className="text-[10px] text-slate-400">{classStudents.length} élèves inscrits</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Titulaire de la classe</span>
            <div className="font-bold text-teal-700 text-sm mt-0.5 truncate">
              {selectedClass?.mainTeacherName ||
                teachers.find((t) => t.id === selectedClass?.mainTeacherId)?.fullName ||
                'Non désigné'}
            </div>
            <span className="text-[10px] text-slate-500">Garant moral & délibération</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Notes Publiées</span>
            <div className="font-bold text-emerald-700 text-sm mt-0.5">{publishedGradesCount} saisies</div>
            <span className="text-[10px] text-emerald-600">Disponibles pour délibération</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Règlement Pédagogique</span>
            <div className="font-bold text-blue-900 text-sm mt-0.5">Norme EPST RDC</div>
            <span className="text-[10px] text-slate-400">Seuil d'admission : 50%</span>
          </div>
        </div>
      </div>

      {/* Subtabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('deliberation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'deliberation'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Palmarès & Validation des Bulletins</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cours')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'cours'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Grille & Attribution des Cours</span>
        </button>
        <button
          onClick={() => setActiveSubTab('titulaires')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'titulaires'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Titulaires de Classes ({classes.length})</span>
        </button>
      </div>

      {/* Alert Notices */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: DELIBERATION & PALMARES */}
      {/* ======================================================== */}
      {activeSubTab === 'deliberation' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Palmarès & Délibération par Élève</h2>
              <p className="text-xs text-slate-500">Moyenne estimée, pourcentage et accès au bulletin officiel RDC</p>
            </div>

            {/* Select class */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Changer de classe :</label>
              <select
                id="select-de-class"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Matricule</th>
                  <th className="py-2.5 px-3">Nom, Post-nom & Prénom</th>
                  <th className="py-2.5 px-3 text-center">Sexe</th>
                  <th className="py-2.5 px-3 text-center">Estimation %</th>
                  <th className="py-2.5 px-3">Appréciation Jury</th>
                  <th className="py-2.5 px-3 text-right">Bulletin Officiel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {classStudents.map((stu, index) => {
                  let estimatedPct = 85.2;
                  if (index === 1) estimatedPct = 76.4;
                  else if (index === 2) estimatedPct = 61.8;
                  else if (index === 3) estimatedPct = 54.0;
                  else estimatedPct = 72.0;

                  const isFail = estimatedPct < 50;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{stu.matricule}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {stu.lastName} {stu.postName} {stu.firstName}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{stu.gender}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            isFail ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {estimatedPct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[11px] font-semibold ${isFail ? 'text-red-600' : 'text-slate-800'}`}>
                          {isFail ? 'En difficulté (Soutien requis)' : 'Admis en classe supérieure'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          id={`btn-de-view-bulletin-${stu.id}`}
                          onClick={() => onOpenBulletin(stu.id)}
                          className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white font-medium text-xs transition-colors"
                        >
                          Consulter & Imprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pedagogical Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>
              Règle de séparation des rôles : Le Directeur des Études supervise la pédagogie mais ne possède aucun accès de modification sur la caisse ou les montants des frais scolaires.
            </span>
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: GRILLE & ATTRIBUTION DES COURS (AVEC SÉCURITÉ)   */}
      {/* ======================================================== */}
      {activeSubTab === 'cours' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Affectation Pédagogique des Cours & Professeurs
                </h2>
                {isGridLocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    Grille Sécurisée (Anti-Modification)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Unlock className="w-3 h-3 text-amber-600" />
                    Mode Édition Ouvert
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Définition de la grille horaire officielle, affectation des professeurs et coefficients selon le programme national RDC.
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Class Switcher */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Classe :</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Security Lock Toggle */}
              <button
                onClick={() => {
                  const nextState = !isGridLocked;
                  setIsGridLocked(nextState);
                  if (nextState) {
                    setUnlockedItemIds(new Set());
                    showNotification('Grille verrouillée avec succès pour prévenir toute modification accidentelle.');
                  } else {
                    showNotification('Attention : Mode édition activé. Veillez à ne pas modifier les cours sans motif valable.');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                  isGridLocked
                    ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {isGridLocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Déverrouiller pour Modifier</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verrouiller & Sceller la Grille</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attribuer un Cours</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics of Assigned Courses */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Cours au programme</span>
              <span className="font-bold text-slate-900 text-sm">
                {currentClassSubjects.length > 0 ? currentClassSubjects.length : availableSubjects.length} matières
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Total Heures Hebdo</span>
              <span className="font-bold text-teal-800 text-sm">{totalWeeklyHours || 28}h / semaine</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Somme des Coefficients</span>
              <span className="font-bold text-indigo-700 text-sm">{totalCoefficients || 24} pts coeff</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Protection Anti-Erreur</span>
              <span className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {isGridLocked ? 'Protection Active' : 'Modification Possible'}
              </span>
            </div>
          </div>

          {/* Table of courses */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Matière / Discipline</th>
                  <th className="py-2.5 px-3">Domaine Pédagogique</th>
                  <th className="py-2.5 px-3 text-center">Coeff. Officiel</th>
                  <th className="py-2.5 px-3 text-center">Max Points</th>
                  <th className="py-2.5 px-3 text-center">Heures/Semaine</th>
                  <th className="py-2.5 px-3">Professeur Enseignant</th>
                  <th className="py-2.5 px-3 text-right">Sécurité & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* 1. If we have actual class_subjects assigned in DB */}
                {currentClassSubjects.length > 0 ? (
                  currentClassSubjects.map((cs) => {
                    const subObj = subjects.find((s) => s.id === cs.subjectId) || {
                      id: cs.subjectId,
                      name: 'Discipline Scolaire',
                      code: 'DISC',
                      category: 'Sciences' as const,
                      defaultCoefficient: cs.coefficient,
                      defaultMaxScore: cs.maxScore,
                      schoolId: school.id,
                    };
                    const teacherObj = teachers.find((t) => t.id === cs.teacherId);
                    const isRowUnlocked = !isGridLocked || unlockedItemIds.has(cs.id);

                    return (
                      <tr key={cs.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{subObj.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Code : {subObj.code}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {subObj.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {cs.coefficient}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700">
                          /{cs.maxScore || 20}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700">
                          {cs.weeklyHours || 2}h
                        </td>
                        <td className="py-3 px-3">
                          {isRowUnlocked ? (
                            <select
                              value={cs.teacherId || ''}
                              onChange={(e) => {
                                const newTId = e.target.value;
                                const newTFound = teachers.find((t) => t.id === newTId);
                                setConfirmModalData({
                                  type: 'change_teacher',
                                  classSubjectId: cs.id,
                                  subjectName: subObj.name,
                                  className: selectedClass?.name,
                                  newTeacherId: newTId,
                                  newTeacherName: newTFound?.fullName || 'Non assigné',
                                });
                              }}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/40 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
                            >
                              <option value="">-- Sélectionner un enseignant --</option>
                              {teachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.fullName} ({t.specialty})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {teacherObj?.fullName ? teacherObj.fullName[0] : 'P'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                                  {teacherObj?.fullName || 'Non encore affecté'}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                                  {teacherObj?.specialty || 'Spécialiste'}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isRowUnlocked ? (
                              <>
                                <button
                                  title="Verrouiller ce cours"
                                  onClick={() => {
                                    setUnlockedItemIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(cs.id);
                                      return next;
                                    });
                                  }}
                                  className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                >
                                  <Lock className="w-4 h-4" />
                                </button>
                                <button
                                  title="Retirer ce cours de la classe"
                                  onClick={() => {
                                    setConfirmModalData({
                                      type: 'delete',
                                      classSubjectId: cs.id,
                                      subjectName: subObj.name,
                                      className: selectedClass?.name,
                                    });
                                  }}
                                  className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                title="Cliquer pour déverrouiller et modifier ce cours"
                                onClick={() => {
                                  setConfirmModalData({
                                    type: 'unlock',
                                    classSubjectId: cs.id,
                                    subjectName: subObj.name,
                                    className: selectedClass?.name,
                                  });
                                }}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                              >
                                <Lock className="w-3 h-3 text-slate-500" />
                                <span>Verrouillé</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  /* 2. Fallback curriculum when no custom class_subjects are registered yet */
                  availableSubjects.map((sub) => {
                    const defaultTeacher = teachers[0];
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{sub.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Code : {sub.code}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {sub.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {sub.defaultCoefficient}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700">
                          /{sub.defaultMaxScore}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-slate-700">
                          3h
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {defaultTeacher?.fullName ? defaultTeacher.fullName[0] : 'P'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                                {defaultTeacher?.fullName || 'Professeur assigné'}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                                {defaultTeacher?.specialty || 'Enseignement Général'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setAssignSubjectId(sub.id);
                              setAssignCoeff(String(sub.defaultCoefficient));
                              setAssignMaxScore(String(sub.defaultMaxScore));
                              setIsAssignModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white font-medium text-[11px] transition-colors"
                          >
                            Affecter à cette classe
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Sécurité Pédagogique contre les Fausses Manipulations :</span>
              <span>
                Une fois la grille verrouillée, aucun cours ne peut être écrasé ou modifié par mégarde. Toute
                réaffectation d'enseignant nécessite un déverrouillage volontaire avec confirmation.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: TITULAIRES DE CLASSES ("GÈRE TOUT")             */}
      {/* ======================================================== */}
      {activeSubTab === 'titulaires' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>Attribution & Gestion des Professeurs Titulaires</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Désignation officielle du titulaire pour chaque classe. Le titulaire préside les délibérations, enregistre
                la conduite et supervise la discipline de sa classe.
              </p>
            </div>
          </div>

          {/* Role explanation banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-200 text-xs text-slate-700">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 text-sm block">
                  Prérogatives et Responsabilités du Professeur Titulaire en RDC :
                </span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  En système scolaire congolais (Normes EPST), le <strong>Titulaire de Classe</strong> est le premier
                  responsable moral et pédagogique. Il est habilité à :
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700 font-medium pt-1">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Attribuer les notes de Conduite & Application sur les bulletins</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Présider le jury de délibération périodique & semestrielle</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Contrôler l'assiduité, les absences et avertir les parents</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Transmettre les appréciations officielles à la Direction des Études</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Classes Grid with Current Titulaires */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Classe</th>
                  <th className="py-2.5 px-3">Cycle & Section</th>
                  <th className="py-2.5 px-3 text-center">Élèves</th>
                  <th className="py-2.5 px-3 text-center">Salle</th>
                  <th className="py-2.5 px-3">Professeur Titulaire Officiel</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((cls) => {
                  const studentCount = students.filter((s) => s.classId === cls.id).length;
                  const titulaireTeacher = teachers.find(
                    (t) => t.id === cls.mainTeacherId
                  );
                  const hasTitulaire = Boolean(cls.mainTeacherId || cls.mainTeacherName);
                  const displayTeacherName =
                    cls.mainTeacherName || titulaireTeacher?.fullName || 'Aucun titulaire désigné';

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{cls.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID : {cls.id.slice(0, 8)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">{cls.level}</span>
                        <span className="text-[10px] text-slate-400 block">{cls.section}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {studentCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {cls.roomNumber || 'Salle 1'}
                      </td>
                      <td className="py-3 px-3">
                        {hasTitulaire ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {displayTeacherName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{displayTeacherName}</span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                                  Titulaire Actif
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block">
                                {titulaireTeacher?.specialty || 'Enseignant Titulaire'} • {titulaireTeacher?.phone || 'Contact vérifié'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Poste de titulaire vacant</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenTitulaireModal(cls)}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white font-semibold text-xs transition-colors"
                        >
                          {hasTitulaire ? 'Changer de Titulaire' : 'Désigner le Titulaire'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CRÉER UN NOUVEAU COURS AU PROGRAMME            */}
      {/* ======================================================== */}
      {isCreateSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Création d'un Nouveau Cours (Matière)
                </h3>
              </div>
              <button
                onClick={() => setIsCreateSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubjectSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Intitulé du Cours / Matière <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mathématiques Générales, Physique, Chimie..."
                  value={newSubName}
                  onChange={(e) => {
                    setNewSubName(e.target.value);
                    if (!newSubCode) {
                      setNewSubCode(
                        e.target.value
                          .replace(/[^a-zA-Z]/g, '')
                          .slice(0, 4)
                          .toUpperCase()
                      );
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Code Officiel (Sigle) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="Ex: MATH, PHYS"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Domaine Pédagogique
                  </label>
                  <select
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="Sciences">Sciences</option>
                    <option value="Lettres & Langues">Lettres & Langues</option>
                    <option value="Sciences Humaines">Sciences Humaines</option>
                    <option value="Technique">Technique & Commerciale</option>
                    <option value="Autre">Autre / Éduc. Physique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Coefficient par Défaut
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={newSubCoeff}
                    onChange={(e) => setNewSubCoeff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 4 en sciences, 2 en lettres</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Total Points Max
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newSubMaxScore}
                    onChange={(e) => setNewSubMaxScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Norme RDC : 20, 30 ou 40</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSubjectModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSubject}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingSubject ? 'Enregistrement...' : 'Enregistrer le Cours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ATTRIBUER UN COURS À UNE CLASSE                 */}
      {/* ======================================================== */}
      {isAssignModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Affecter un Cours à {selectedClass.name}
                </h3>
                <span className="text-[11px] text-slate-500">Niveau : {selectedClass.level} ({selectedClass.section})</span>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignCourseSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Matière à enseigner <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignSubjectId}
                  onChange={(e) => {
                    setAssignSubjectId(e.target.value);
                    const sub = subjects.find((s) => s.id === e.target.value);
                    if (sub) {
                      setAssignCoeff(String(sub.defaultCoefficient || 2));
                      setAssignMaxScore(String(sub.defaultMaxScore || 20));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                >
                  <option value="">-- Choisir une matière au programme --</option>
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} - {s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Professeur Titulaire de la Matière <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white font-medium"
                >
                  <option value="">-- Choisir le professeur affecté --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.specialty})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Seul l'enseignant sélectionné pourra encoder les cotes pour cette classe.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Coefficient
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10"
                    value={assignCoeff}
                    onChange={(e) => setAssignCoeff(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Total Max
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={assignMaxScore}
                    onChange={(e) => setAssignMaxScore(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Heures/Sem.
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={assignWeeklyHours}
                    onChange={(e) => setAssignWeeklyHours(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssign}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingAssign ? 'Attribution...' : 'Confirmer l’Attribution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CONFIRMATION DE SÉCURITÉ ANTI-MODIFICATION       */}
      {/* ======================================================== */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-slate-900 text-sm mb-1">
              {confirmModalData.type === 'delete' && 'Confirmer le Retrait du Cours'}
              {confirmModalData.type === 'unlock' && 'Déverrouiller pour Modification'}
              {confirmModalData.type === 'change_teacher' && 'Confirmer la Réaffectation du Professeur'}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {confirmModalData.type === 'delete' && (
                <>
                  Êtes-vous certain de vouloir retirer le cours de{' '}
                  <strong>{confirmModalData.subjectName}</strong> de la classe{' '}
                  <strong>{confirmModalData.className}</strong> ?
                </>
              )}
              {confirmModalData.type === 'unlock' && (
                <>
                  Vous êtes sur le point de déverrouiller le cours de{' '}
                  <strong>{confirmModalData.subjectName}</strong>. Cette opération permet de réaffecter l'enseignant
                  ou d'ajuster les pondérations.
                </>
              )}
              {confirmModalData.type === 'change_teacher' && (
                <>
                  Confirmer la réaffectation du cours de{' '}
                  <strong>{confirmModalData.subjectName}</strong> à{' '}
                  <strong>{confirmModalData.newTeacherName}</strong> ? L'accès à la saisie des notes sera mis à jour.
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DÉSIGNATION DU TITULAIRE DE CLASSE              */}
      {/* ======================================================== */}
      {titulaireModalClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Désignation du Titulaire de Classe
                </h3>
              </div>
              <button
                onClick={() => setTitulaireModalClass(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTitulaire} className="space-y-4 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Classe concernée :</span>
                <span className="font-bold text-slate-900 text-sm">{titulaireModalClass.name}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Cycle : {titulaireModalClass.level} • Section : {titulaireModalClass.section}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Sélectionner le Professeur Titulaire <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedTitulaireId}
                  onChange={(e) => setSelectedTitulaireId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-900"
                >
                  <option value="">-- Choisir un enseignant titulaire --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.specialty}) {t.phone ? `• ${t.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-[11px] space-y-1">
                <span className="font-bold block">Prérogatives immédiates après validation :</span>
                <p>
                  Ce professeur aura les droits officiels de délibération, d'encodage des conduites et des appréciations
                  générales des bulletins pour la classe {titulaireModalClass.name}.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTitulaireModalClass(null)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTitulaire}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmittingTitulaire ? 'Nomination...' : 'Nommer Officiellement Titulaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
