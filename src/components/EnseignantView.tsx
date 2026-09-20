import { useState, useEffect, useMemo } from 'react';
import {
  School,
  SchoolClass,
  Subject,
  Student,
  Grade,
  AcademicPeriod,
  AttendanceRecord,
  Teacher,
  Parent,
  UserSession,
  SchoolMessage,
  TeacherScheduleSlot,
  LessonLog,
  GradeCorrectionRequest,
  ClassAppreciation,
  DisciplineIncident,
} from '../types';
import {
  Users,
  CheckSquare,
  Edit3,
  BookOpen,
  Clock,
  MessageSquare,
  Calendar,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Search,
  Printer,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  PlusCircle,
  FileText,
  PhoneCall,
  UserCheck,
  Info,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  RotateCw,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  ShieldAlert,
  Sparkles,
  Check,
  X,
  FileCheck,
} from 'lucide-react';

interface EnseignantViewProps {
  school: School;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  grades: Grade[];
  periods: AcademicPeriod[];
  attendance: AttendanceRecord[];
  currentUser?: UserSession | null;
  teachers?: Teacher[];
  parents?: Parent[];
  onSaveGrade?: (gradeData: Omit<Grade, 'id' | 'schoolId' | 'recordedAt' | 'recordedBy'>) => Promise<void>;
  onSaveGradeBatch?: (
    classId: string,
    subjectId: string,
    periodId: string,
    gradesList: { studentId: string; score: number; maxScore: number; coefficient: number }[],
    status: 'draft' | 'published',
    recordedBy?: string
  ) => Promise<void>;
  onMarkAttendance?: (
    studentId: string,
    classId: string,
    status: AttendanceRecord['status'],
    note?: string,
    date?: string
  ) => Promise<void>;
  onSaveAttendanceBatch?: (
    classId: string,
    date: string,
    records: { studentId: string; status: AttendanceRecord['status']; justification?: string }[],
    recordedBy?: string
  ) => Promise<void>;
  onSendSmsAlert?: (phone: string, recipientName: string, message: string) => Promise<void>;
  activeTab?: 'classes' | 'attendance' | 'grades' | 'titulaire' | 'subjects' | 'schedule' | 'messages';
  onTabChange?: (tab: 'classes' | 'attendance' | 'grades' | 'titulaire' | 'subjects' | 'schedule' | 'messages') => void;
  onUnreadCountChange?: (count: number) => void;
}

export const EnseignantView = ({
  school,
  classes,
  subjects,
  students,
  grades,
  periods,
  attendance,
  currentUser,
  teachers = [],
  parents = [],
  onSaveGrade,
  onSaveGradeBatch,
  onMarkAttendance,
  onSaveAttendanceBatch,
  onSendSmsAlert,
  activeTab: controlledTab,
  onTabChange,
  onUnreadCountChange,
}: EnseignantViewProps) => {
  // Navigation: The 6 main buttons defined in Section 15 of Cahier des Charges + Espace Titulaire
  const [internalTab, setInternalTab] = useState<
    'classes' | 'attendance' | 'grades' | 'titulaire' | 'subjects' | 'schedule' | 'messages'
  >('attendance');

  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: 'classes' | 'attendance' | 'grades' | 'titulaire' | 'subjects' | 'schedule' | 'messages') => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Online / Offline synchronization state (Article 44)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [hasOfflineChanges, setHasOfflineChanges] = useState<boolean>(false);

  // Grade view mode: single evaluation vs class summary palmares
  const [gradeViewMode, setGradeViewMode] = useState<'evaluation' | 'palmares'>('evaluation');

  // Grade unlock & correction requests (Directeur des Études - Article 15)
  const [gradeCorrections, setGradeCorrections] = useState<GradeCorrectionRequest[]>([]);
  const [showCorrectionsModal, setShowCorrectionsModal] = useState<boolean>(false);
  const [unlockTargetStudent, setUnlockTargetStudent] = useState<Student | null>(null);
  const [unlockTargetGrade, setUnlockTargetGrade] = useState<Grade | null>(null);
  const [unlockRequestedScore, setUnlockRequestedScore] = useState<string>('');
  const [unlockReason, setUnlockReason] = useState<string>('');
  const [isSubmittingUnlock, setIsSubmittingUnlock] = useState<boolean>(false);

  // Discipline incident reporting modal (Directeur de Discipline - Articles 11 & 14)
  const [incidentTargetStudent, setIncidentTargetStudent] = useState<Student | null>(null);
  const [incidentCategory, setIncidentCategory] = useState<DisciplineIncident['category']>('Indiscipline');
  const [incidentSeverity, setIncidentSeverity] = useState<DisciplineIncident['severity']>('Modéré');
  const [incidentDescription, setIncidentDescription] = useState<string>('');
  const [incidentNotifyParent, setIncidentNotifyParent] = useState<boolean>(true);
  const [incidentActionTaken, setIncidentActionTaken] = useState<string>('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState<boolean>(false);

  // Identify teacher info
  const teacherObj = teachers.find(
    (t) =>
      (currentUser?.teacherId && t.id === currentUser.teacherId) ||
      (currentUser?.fullName && t.fullName.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
      (currentUser?.email && t.email.toLowerCase() === currentUser.email.toLowerCase())
  ) || teachers[0];

  const teacherName = currentUser?.fullName || teacherObj?.fullName || 'Prof. Jean-Luc Kalambayi';
  const teacherSpecialty = teacherObj?.specialty || 'Mathématiques & Informatique';

  // Teacher classes
  const assignedClassIds = teacherObj?.assignedClasses || [];
  const teacherClasses = classes.filter(
    (c) => Boolean(c) && (assignedClassIds.length === 0 || assignedClassIds.includes(c.id))
  );
  const activeClassList = teacherClasses.length > 0 ? teacherClasses : classes.filter(Boolean);

  // Tutored classes for Titulaire de classe role
  const tutoredClasses = classes.filter((c) => Boolean(c) && c.mainTeacherId === teacherObj?.id);
  const activeTutoredClasses = tutoredClasses.length > 0 ? tutoredClasses : activeClassList;
  const isTitulaire = tutoredClasses.length > 0 || activeClassList.length > 0;

  // Fallback defaults to ensure no undefined property access
  const fallbackClass: SchoolClass = {
    id: classes[0]?.id || 'classe-default',
    name: classes[0]?.name || 'Classe générale',
    level: classes[0]?.level || 'Secondaire',
    section: classes[0]?.section || 'Générale',
    capacity: 45,
    academicYearId: '',
    schoolId: school?.id || '',
  };

  const fallbackSubject: Subject = {
    id: subjects[0]?.id || 'subject-default',
    name: subjects[0]?.name || 'Matière générale',
    code: subjects[0]?.code || 'GEN',
    category: 'Autre',
    defaultCoefficient: 1,
    defaultMaxScore: 20,
    schoolId: school?.id || '',
  };

  const fallbackPeriod: AcademicPeriod = {
    id: periods[0]?.id || 'period-default',
    name: periods[0]?.name || '1ère Période',
    code: 'P1',
    semester: 1,
    isCurrent: true,
    academicYearId: '',
    schoolId: school?.id || '',
    weight: 1,
  };

  // Titulaire State
  const [titulaireClassId, setTitulaireClassId] = useState<string>(activeTutoredClasses[0]?.id || classes[0]?.id || '');
  const [titulairePeriodId, setTitulairePeriodId] = useState<string>(periods[0]?.id || '');
  const [classAppreciations, setClassAppreciations] = useState<ClassAppreciation[]>([]);
  const [titulaireRemarks, setTitulaireRemarks] = useState<
    Record<string, { appreciation: string; conduct: ClassAppreciation['conduct'] }>
  >({});
  const [isSavingTitulaire, setIsSavingTitulaire] = useState<boolean>(false);

  // Selected state filters
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassList[0]?.id || classes[0]?.id || '');
  const [activeClassView, setActiveClassView] = useState<'list' | 'detail'>('list');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id || '');

  // Dynamic system date (NEVER HARDCODED)
  const systemTodayStr = new Date().toISOString().split('T')[0];
  const [attendanceDate, setAttendanceDate] = useState<string>(systemTodayStr);
  const [attendanceTimeSlot, setAttendanceTimeSlot] = useState<string>('07h30 - 08h25 (1ère Heure)');

  // Local Attendance State for the active class & date
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, { status: AttendanceRecord['status']; justification: string }>
  >({});

  // Local Grades State for active class, subject & period
  const [gradeInputState, setGradeInputState] = useState<Record<string, number>>({});
  const [evaluationTitle, setEvaluationTitle] = useState<string>('Interrogation n°1');
  const [evaluationType, setEvaluationType] = useState<string>('interrogation');

  // Success and notification banners
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<'success' | 'error'>('success');

  // Search & Student Class Directory state
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // Messages State
  const [messages, setMessages] = useState<SchoolMessage[]>([]);
  const [messageFilter, setMessageFilter] = useState<'all' | 'inbox' | 'sent'>('all');
  const [isComposingMessage, setIsComposingMessage] = useState(false);
  const [newMsgRecipientType, setNewMsgRecipientType] = useState<'classe' | 'parents' | 'administration'>('classe');
  const [newMsgSubject, setNewMsgSubject] = useState('');
  const [newMsgBody, setNewMsgBody] = useState('');
  const [newMsgSendSms, setNewMsgSendSms] = useState(false);

  // Schedule State
  const [scheduleSlots, setScheduleSlots] = useState<TeacherScheduleSlot[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('Tous');

  // Lesson logs (Cahier de textes)
  const [lessonLogs, setLessonLogs] = useState<LessonLog[]>([]);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSummary, setNewLessonSummary] = useState('');
  const [newLessonHomework, setNewLessonHomework] = useState('');
  const [newLessonDueDate, setNewLessonDueDate] = useState('');

  // Resolving selected objects safely
  const selectedClass: SchoolClass = classes.find((c) => c && c.id === selectedClassId) || activeClassList[0] || classes[0] || fallbackClass;
  const selectedSubject: Subject = subjects.find((s) => s && s.id === selectedSubjectId) || subjects[0] || fallbackSubject;
  const selectedPeriod: AcademicPeriod = periods.find((p) => p && p.id === selectedPeriodId) || periods[0] || fallbackPeriod;
  const classStudents = students.filter((s) => s && s.classId === selectedClass.id);

  // Max score and coefficient for selected subject
  const currentMaxScore = selectedSubject.defaultMaxScore || 20;
  const currentCoefficient = selectedSubject.defaultCoefficient || 1;

  // Tutored class resolution safely
  const titulaireClass: SchoolClass = classes.find((c) => c && c.id === titulaireClassId) || activeTutoredClasses[0] || classes[0] || selectedClass;

  // Online / Offline Listeners (Article 44)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showNotice('Connexion rétablie. Le système est synchronisé avec le serveur.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showNotice('Mode hors-ligne actif. Vos saisies sont sauvegardées localement.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if any cached offline operations exist
    const cachedAtt = localStorage.getItem(`edukin_att_offline_${school.id}`);
    const cachedGrd = localStorage.getItem(`edukin_grd_offline_${school.id}`);
    if (cachedAtt || cachedGrd) {
      setHasOfflineChanges(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [school.id]);

  // Load messages, schedule, grade-corrections, and appreciations
  useEffect(() => {
    fetch(`/api/messages?schoolId=${school.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(() => {});

    fetch(`/api/schedule?schoolId=${school.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setScheduleSlots(data);
      })
      .catch(() => {});

    fetch(`/api/lesson-logs?schoolId=${school.id}&classId=${selectedClass?.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLessonLogs(data);
      })
      .catch(() => {});

    fetch(`/api/grade-corrections?schoolId=${school.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setGradeCorrections(data);
      })
      .catch(() => {});

    fetch(`/api/class-appreciations?schoolId=${school.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setClassAppreciations(data);
          const map: typeof titulaireRemarks = {};
          data.forEach((item: ClassAppreciation) => {
            map[item.studentId] = {
              appreciation: item.appreciation,
              conduct: item.conduct,
            };
          });
          setTitulaireRemarks(map);
        }
      })
      .catch(() => {});
  }, [school.id, selectedClass?.id]);

  // Sync attendance drafts when class or date changes
  useEffect(() => {
    if (!selectedClass) return;
    const initial: Record<string, { status: AttendanceRecord['status']; justification: string }> = {};

    classStudents.forEach((stu) => {
      const existing = attendance.find(
        (a) => a.studentId === stu.id && a.date === attendanceDate && a.classId === selectedClass.id
      );
      initial[stu.id] = {
        status: existing ? existing.status : 'present',
        justification: existing?.justification || '',
      };
    });

    setAttendanceDraft(initial);
  }, [selectedClass?.id, attendanceDate, attendance]);

  // Sync grade drafts when class, subject or period changes
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !selectedPeriod) return;
    const initialGrades: Record<string, number> = {};

    classStudents.forEach((stu) => {
      const existingGrade = grades.find(
        (g) =>
          g.studentId === stu.id &&
          g.subjectId === selectedSubject.id &&
          (g.periodId === selectedPeriod.id || g.academicPeriodId === selectedPeriod.id)
      );
      if (existingGrade) {
        initialGrades[stu.id] = existingGrade.score;
      }
    });

    setGradeInputState(initialGrades);
  }, [selectedClass?.id, selectedSubject?.id, selectedPeriod?.id, grades]);

  // Helper for notification
  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNoticeMessage(msg);
    setNoticeType(type);
    setTimeout(() => {
      setNoticeMessage(null);
    }, 4000);
  };

  // -------------------------------------------------------------
  // ATTENDANCE HANDLERS
  // -------------------------------------------------------------
  const handleSetStudentAttendanceStatus = (
    studentId: string,
    status: AttendanceRecord['status']
  ) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        status,
        justification: prev[studentId]?.justification || '',
      },
    }));
  };

  const handleSetAllAttendance = (status: AttendanceRecord['status']) => {
    setAttendanceDraft((prev) => {
      const updated: typeof prev = {};
      classStudents.forEach((stu) => {
        updated[stu.id] = {
          status,
          justification: prev[stu.id]?.justification || '',
        };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return;

    const recordsToSave = classStudents.map((stu) => ({
      studentId: stu.id,
      status: attendanceDraft[stu.id]?.status || 'present',
      justification: attendanceDraft[stu.id]?.justification || '',
    }));

    try {
      if (!isOnline) {
        // Offline cache mode (Article 44)
        localStorage.setItem(
          `edukin_att_offline_${school.id}`,
          JSON.stringify({
            classId: selectedClass.id,
            date: attendanceDate,
            records: recordsToSave,
            teacherName,
          })
        );
        setHasOfflineChanges(true);
        showNotice('Mode hors-ligne : Présences sauvegardées localement. Elles seront envoyées à la reconnexion.', 'success');
        return;
      }

      if (onSaveAttendanceBatch) {
        await onSaveAttendanceBatch(selectedClass.id, attendanceDate, recordsToSave, teacherName);
      } else if (onMarkAttendance) {
        for (const rec of recordsToSave) {
          await onMarkAttendance(rec.studentId, selectedClass.id, rec.status, rec.justification, attendanceDate);
        }
      }
      // Mandatory exact message from Cahier des Charges:
      // "Après sauvegarde : Présences enregistrées avec succès."
      showNotice('Présences enregistrées avec succès.', 'success');
    } catch {
      // Fallback to offline store on failure
      localStorage.setItem(
        `edukin_att_offline_${school.id}`,
        JSON.stringify({
          classId: selectedClass.id,
          date: attendanceDate,
          records: recordsToSave,
          teacherName,
        })
      );
      setHasOfflineChanges(true);
      showNotice("Connexion instable : Présences conservées dans le cache local de l'appareil.", 'error');
    }
  };

  // -------------------------------------------------------------
  // GRADES HANDLERS
  // -------------------------------------------------------------
  const handleScoreChange = (studentId: string, rawVal: string) => {
    const val = Number(rawVal);
    if (isNaN(val)) {
      setGradeInputState((prev) => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
      return;
    }

    if (val < 0) return;
    if (val > currentMaxScore) {
      showNotice(`Attention: La cote ne peut pas dépasser le maximum de ${currentMaxScore} points pour ${selectedSubject?.name}.`, 'error');
      return;
    }

    setGradeInputState((prev) => ({
      ...prev,
      [studentId]: val,
    }));
  };

  // Fast keyboard navigation: Enter or ArrowDown moves to next, ArrowUp to previous
  const handleScoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`input-score-${index + 1}`) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`input-score-${index - 1}`) as HTMLInputElement | null;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const handleSaveGradesAs = async (status: 'draft' | 'published') => {
    if (!selectedClass || !selectedSubject || !selectedPeriod) return;

    const gradesToSave: { studentId: string; score: number; maxScore: number; coefficient: number }[] = [];

    for (const stu of classStudents) {
      // If student grade is already published, it cannot be modified directly (Article 15 lock)
      const existingGrade = grades.find(
        (g) =>
          g.studentId === stu.id &&
          g.subjectId === selectedSubject.id &&
          (g.periodId === selectedPeriod.id || g.academicPeriodId === selectedPeriod.id)
      );
      if (existingGrade?.status === 'published' && status === 'draft') {
        continue; // Keep published state untouched
      }

      const score = gradeInputState[stu.id];
      if (score !== undefined) {
        gradesToSave.push({
          studentId: stu.id,
          score,
          maxScore: currentMaxScore,
          coefficient: currentCoefficient,
        });
      }
    }

    if (gradesToSave.length === 0) {
      showNotice('Veuillez saisir au moins une cote avant d’enregistrer.', 'error');
      return;
    }

    try {
      if (!isOnline) {
        // Offline cache mode
        localStorage.setItem(
          `edukin_grd_offline_${school.id}`,
          JSON.stringify({
            classId: selectedClass.id,
            subjectId: selectedSubject.id,
            periodId: selectedPeriod.id,
            grades: gradesToSave,
            status,
            teacherName,
          })
        );
        setHasOfflineChanges(true);
        showNotice('Mode hors-ligne : Notes enregistrées localement. Synchronisation dès retour du réseau.', 'success');
        return;
      }

      if (onSaveGradeBatch) {
        await onSaveGradeBatch(
          selectedClass.id,
          selectedSubject.id,
          selectedPeriod.id,
          gradesToSave,
          status,
          teacherName
        );
      } else if (onSaveGrade) {
        for (const item of gradesToSave) {
          await onSaveGrade({
            studentId: item.studentId,
            classId: selectedClass.id,
            subjectId: selectedSubject.id,
            periodId: selectedPeriod.id,
            academicPeriodId: selectedPeriod.id,
            score: item.score,
            maxScore: item.maxScore,
            coefficient: item.coefficient,
            evaluationType,
            status,
          });
        }
      }

      if (status === 'draft') {
        showNotice('Brouillon de notes enregistré avec succès. Les cotes restent éditables.', 'success');
      } else {
        showNotice('Notes publiées avec succès. Synchronisées avec les bulletins officiels EPST.', 'success');
      }
    } catch {
      localStorage.setItem(
        `edukin_grd_offline_${school.id}`,
        JSON.stringify({
          classId: selectedClass.id,
          subjectId: selectedSubject.id,
          periodId: selectedPeriod.id,
          grades: gradesToSave,
          status,
          teacherName,
        })
      );
      setHasOfflineChanges(true);
      showNotice("Connexion interrompue : Vos cotes sont préservées en mémoire locale sécurisée.", 'error');
    }
  };

  // Offline Sync Trigger
  const syncOfflineData = async () => {
    try {
      const cachedAtt = localStorage.getItem(`edukin_att_offline_${school.id}`);
      if (cachedAtt) {
        const parsed = JSON.parse(cachedAtt);
        if (onSaveAttendanceBatch) {
          await onSaveAttendanceBatch(parsed.classId, parsed.date, parsed.records, parsed.teacherName);
        }
        localStorage.removeItem(`edukin_att_offline_${school.id}`);
      }

      const cachedGrd = localStorage.getItem(`edukin_grd_offline_${school.id}`);
      if (cachedGrd) {
        const parsedGrd = JSON.parse(cachedGrd);
        if (onSaveGradeBatch) {
          await onSaveGradeBatch(
            parsedGrd.classId,
            parsedGrd.subjectId,
            parsedGrd.periodId,
            parsedGrd.grades,
            parsedGrd.status,
            parsedGrd.teacherName
          );
        }
        localStorage.removeItem(`edukin_grd_offline_${school.id}`);
      }

      setHasOfflineChanges(false);
      showNotice('Synchronisation du cache local terminée avec succès !', 'success');
    } catch {
      showNotice('Erreur lors de la synchronisation du cache local.', 'error');
    }
  };

  // Grade Unlock Modal Handlers
  const openUnlockModal = (student: Student, grade?: Grade) => {
    setUnlockTargetStudent(student);
    setUnlockTargetGrade(grade || null);
    setUnlockRequestedScore(grade ? String(grade.score) : (gradeInputState[student.id] ? String(gradeInputState[student.id]) : ''));
    setUnlockReason('');
  };

  const handleSubmitUnlockRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockTargetStudent || !unlockReason.trim()) {
      showNotice('Veuillez spécifier le motif légitime de la rectification.', 'error');
      return;
    }
    setIsSubmittingUnlock(true);
    try {
      const res = await fetch('/api/grade-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          teacherName,
          teacherId: teacherObj?.id,
          classId: selectedClass.id,
          subjectId: selectedSubject.id,
          studentId: unlockTargetStudent.id,
          periodId: selectedPeriod.id,
          currentScore: unlockTargetGrade ? unlockTargetGrade.score : (gradeInputState[unlockTargetStudent.id] || 0),
          requestedScore: Number(unlockRequestedScore),
          maxScore: currentMaxScore,
          reason: unlockReason.trim(),
        }),
      });
      if (!res.ok) throw new Error('Échec transmission demande');
      const created: GradeCorrectionRequest = await res.json();
      setGradeCorrections((prev) => [created, ...prev]);
      showNotice('Demande de rectification transmise avec succès au Directeur des Études.', 'success');
      setUnlockTargetStudent(null);
    } catch {
      showNotice('Erreur lors de la soumission de la demande.', 'error');
    } finally {
      setIsSubmittingUnlock(false);
    }
  };

  // Discipline Incident Reporting Handlers
  const openIncidentModal = (student: Student) => {
    setIncidentTargetStudent(student);
    setIncidentCategory('Indiscipline');
    setIncidentSeverity('Modéré');
    setIncidentDescription('');
    setIncidentActionTaken('');
    setIncidentNotifyParent(true);
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTargetStudent || !incidentDescription.trim()) {
      showNotice('Veuillez décrire brièvement les faits constatés.', 'error');
      return;
    }
    setIsSubmittingIncident(true);
    try {
      const res = await fetch('/api/discipline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          studentId: incidentTargetStudent.id,
          category: incidentCategory,
          severity: incidentSeverity,
          description: incidentDescription.trim(),
          sanction: incidentActionTaken.trim() || 'Rapport d’incident transmis au Directeur de Discipline pour décision réglementaire',
          parentNotified: incidentNotifyParent,
          recordedBy: teacherName,
        }),
      });
      if (!res.ok) throw new Error('Échec transmission incident');
      showNotice(`Incident disciplinaire signalé au Directeur de Discipline pour ${incidentTargetStudent.firstName} ${incidentTargetStudent.lastName}.`, 'success');
      setIncidentTargetStudent(null);
    } catch {
      showNotice('Erreur lors de l’enregistrement de l’incident.', 'error');
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  // Titulaire Appreciations Handler
  const handleSaveTitulaireAppreciations = async () => {
    if (!titulaireClass) return;
    setIsSavingTitulaire(true);
    try {
      const tutoredStudents = students.filter((s) => s.classId === titulaireClass.id);
      for (const stu of tutoredStudents) {
        const draft = titulaireRemarks[stu.id];
        if (draft && (draft.appreciation.trim() || draft.conduct)) {
          await fetch('/api/class-appreciations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              schoolId: school.id,
              classId: titulaireClass.id,
              studentId: stu.id,
              periodId: titulairePeriodId,
              appreciation: draft.appreciation.trim(),
              conduct: draft.conduct || 'Bonne',
              updatedBy: teacherName,
            }),
          });
        }
      }
      showNotice(`Appréciations du Titulaire enregistrées avec succès pour la classe ${titulaireClass?.name || selectedClass?.name || ''}.`, 'success');
    } catch {
      showNotice('Erreur lors de l’enregistrement des appréciations.', 'error');
    } finally {
      setIsSavingTitulaire(false);
    }
  };

  // -------------------------------------------------------------
  // MESSAGES HANDLER
  // -------------------------------------------------------------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgSubject.trim() || !newMsgBody.trim()) {
      showNotice('Veuillez remplir l’objet et le corps du message.', 'error');
      return;
    }

    let recipientTargetName = '';
    if (newMsgRecipientType === 'classe') {
      recipientTargetName = selectedClass?.name || 'Toute la classe';
    } else if (newMsgRecipientType === 'parents') {
      recipientTargetName = `Parents d'élèves - ${selectedClass?.name}`;
    } else {
      recipientTargetName = 'Direction Pédagogique & Études';
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          senderName: teacherName,
          senderRole: 'enseignant',
          recipientType: newMsgRecipientType,
          recipientTargetId: selectedClass?.id,
          recipientTargetName,
          subject: newMsgSubject.trim(),
          body: newMsgBody.trim(),
          smsSent: newMsgSendSms,
        }),
      });

      if (!res.ok) throw new Error('Échec envoi');
      const savedMsg = await res.json();
      setMessages((prev) => [savedMsg, ...prev]);

      if (newMsgSendSms && onSendSmsAlert) {
        await onSendSmsAlert('+243 82 444 9901', recipientTargetName, `[${newMsgSubject}] ${newMsgBody}`);
      }

      setIsComposingMessage(false);
      setNewMsgSubject('');
      setNewMsgBody('');
      setNewMsgSendSms(false);
      showNotice('Message envoyé avec succès.', 'success');
    } catch {
      showNotice('Erreur lors de l’envoi du message.', 'error');
    }
  };

  // -------------------------------------------------------------
  // LESSON LOG HANDLER
  // -------------------------------------------------------------
  const handleAddLessonLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || !newLessonSummary.trim()) {
      showNotice('Veuillez renseigner le titre et le contenu de la leçon.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/lesson-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: school.id,
          classId: selectedClass.id,
          subjectId: selectedSubject.id,
          teacherName,
          date: systemTodayStr,
          title: newLessonTitle.trim(),
          summary: newLessonSummary.trim(),
          homework: newLessonHomework.trim(),
          homeworkDueDate: newLessonDueDate,
        }),
      });
      const saved = await res.json();
      setLessonLogs((prev) => [saved, ...prev]);
      setIsAddingLesson(false);
      setNewLessonTitle('');
      setNewLessonSummary('');
      setNewLessonHomework('');
      setNewLessonDueDate('');
      showNotice('Séance enregistrée dans le cahier de textes avec succès.', 'success');
    } catch {
      showNotice('Erreur lors de l’enregistrement de la séance.', 'error');
    }
  };

  // -------------------------------------------------------------
  // STATS & ATTENDANCE METRICS
  // -------------------------------------------------------------
  const countPresent = Object.values(attendanceDraft).filter((a) => a.status === 'present').length;
  const countAbsent = Object.values(attendanceDraft).filter((a) => a.status === 'absent').length;
  const countRetard = Object.values(attendanceDraft).filter((a) => a.status === 'retard').length;
  const countExcuse = Object.values(attendanceDraft).filter((a) => a.status === 'excuse').length;

  // Grade stats
  const enteredScores = Object.values(gradeInputState).filter((s) => typeof s === 'number');
  const avgScore =
    enteredScores.length > 0
      ? (enteredScores.reduce((acc, s) => acc + s, 0) / enteredScores.length).toFixed(1)
      : '-';
  const passingCount = enteredScores.filter((s) => s >= currentMaxScore / 2).length;
  const passingPercent = enteredScores.length > 0 ? Math.round((passingCount / enteredScores.length) * 100) : 0;

  // Filtered Students for Class Directory
  const filteredStudents = classStudents.filter((stu) => {
    if (!studentSearchTerm.trim()) return true;
    const term = studentSearchTerm.toLowerCase();
    const fullName = `${stu.firstName} ${stu.postName} ${stu.lastName}`.toLowerCase();
    return fullName.includes(term) || stu.matricule.toLowerCase().includes(term);
  });

  // Dynamic date in French
  // Sync unread messages count to parent when loaded
  useEffect(() => {
    if (onUnreadCountChange) {
      const unreadCount = messages.filter((m) => !m.read).length;
      onUnreadCountChange(unreadCount);
    }
  }, [messages, onUnreadCountChange]);

  const formattedToday = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ========================================================= */}
      {/* 1. HEADER SECTION: Mobile-clean with Essential Details    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                Espace Enseignant
              </span>
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-emerald-600" />
                ) : (
                  <WifiOff className="w-3 h-3 text-amber-600" />
                )}
                <span>{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
              </div>
              {hasOfflineChanges && (
                <button
                  id="btn-sync-offline-cache"
                  onClick={syncOfflineData}
                  className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <RotateCw className="w-3 h-3 animate-spin" />
                  <span>Synchroniser</span>
                </button>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
              Bonjour, {teacherName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">
              {formattedToday} • {teacherSpecialty} • {school.name}
            </p>
          </div>

          {/* Quick Metrics Bar - Mobile friendly 4-grid */}
          <div className="grid grid-cols-4 gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Classes</span>
              <span className="text-base font-bold text-slate-900">{activeClassList.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Élèves</span>
              <span className="text-base font-bold text-blue-600">
                {activeClassList.reduce(
                  (acc, cls) => acc + students.filter((s) => s.classId === cls.id).length,
                  0
                )}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Matières</span>
              <span className="text-base font-bold text-slate-900">{subjects.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center">
              <span className="text-[10px] text-slate-500 font-medium block">Messages</span>
              <span className="text-base font-bold text-indigo-600">
                {messages.filter((m) => !m.read).length}
              </span>
            </div>
          </div>
        </div>

        {/* Global Floating Notification */}
        {noticeMessage && (
          <div
            id="enseignant-toast-notice"
            className={`mt-3 p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all animate-in fade-in slide-in-from-top-1 ${
              noticeType === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {noticeType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="flex-1">{noticeMessage}</span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. THE NAVIGATION TABS (Mobile / Quick Switcher)           */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-1.5 shadow-xs border border-slate-200">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-1.5">
          {/* Button 1: Mes classes */}
          <button
            id="btn-nav-classes"
            onClick={() => setActiveTab('classes')}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl transition-all text-xs font-medium text-center gap-1 sm:gap-1.5 ${
              activeTab === 'classes'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Classes</span>
          </button>

          {/* Button 2: Présences */}
          <button
            id="btn-nav-presences"
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl transition-all text-xs font-medium text-center gap-1 sm:gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Présences</span>
          </button>

          {/* Button 3: Notes & Palmarès */}
          <button
            id="btn-nav-notes"
            onClick={() => setActiveTab('grades')}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl transition-all text-xs font-medium text-center gap-1 sm:gap-1.5 ${
              activeTab === 'grades'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Notes</span>
          </button>

          {/* Button 4: Espace Titulaire */}
          <button
            id="btn-nav-titulaire"
            onClick={() => setActiveTab('titulaire')}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl transition-all text-xs font-medium text-center gap-1 sm:gap-1.5 relative ${
              activeTab === 'titulaire'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <div className="flex items-center gap-1">
              <span>Titulaire</span>
              {isTitulaire && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </div>
          </button>

          {/* Button 5: Mes matières */}
          <button
            id="btn-nav-matieres"
            onClick={() => setActiveTab('subjects')}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl transition-all text-xs font-medium text-center gap-1 sm:gap-1.5 ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Matières</span>
          </button>

          {/* Button 6: Horaire */}
          <button
            id="btn-nav-horaire"
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl transition-all text-xs font-medium text-center gap-1 sm:gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Horaire</span>
          </button>

          {/* Button 7: Messages */}
          <button
            id="btn-nav-messages"
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl transition-all text-xs font-medium text-center gap-1 sm:gap-1.5 relative ${
              activeTab === 'messages'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages</span>
            {messages.filter((m) => !m.read).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VUE 1 : MES CLASSES                                       */}
      {/* ========================================================= */}
      {activeTab === 'classes' && (
        <div className="space-y-4 text-xs">
          {/* ÉCRAN 1 : LISTE PURE DES CLASSES */}
          {activeClassView === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Mes Classes Assignées</h2>
                  <p className="text-slate-500 text-xs">Touchez une classe pour ouvrir sa fiche détaillée</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                  {activeClassList.length} classes
                </span>
              </div>

              {/* Grille de cartes mobile-first */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {activeClassList.map((cls) => {
                  const studentsInThisClass = students.filter((s) => s.classId === cls.id);
                  const boysCount = studentsInThisClass.filter((s) => s.gender === 'M').length;
                  const girlsCount = studentsInThisClass.filter((s) => s.gender === 'F').length;

                  return (
                    <div
                      key={cls.id}
                      id={`card-class-${cls.id}`}
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setActiveClassView('detail');
                      }}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                            {cls.level}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{cls.roomNumber || 'Salle principale'}</span>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {cls.name}
                          </h3>
                          <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">{cls.section}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-indigo-500" />
                          <span><strong className="text-slate-900 font-bold">{studentsInThisClass.length}</strong> élèves inscrits</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {boysCount} G • {girlsCount} F
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉCRAN 2 : PAGE DÉDIÉE À LA CLASSE SÉLECTIONNÉE */}
          {activeClassView === 'detail' && (
            <div className="space-y-4">
              {/* Barre de retour type application mobile */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    id="btn-back-to-classes-list"
                    onClick={() => setActiveClassView('list')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1 font-bold text-xs shrink-0"
                    title="Retourner à la liste des classes"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {selectedClass?.name || 'Classe sélectionnée'}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                        {selectedClass?.level}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs">
                      {selectedClass?.section} • {selectedClass?.roomNumber || 'Salle principale'} • {classStudents.length} élèves inscrits
                    </p>
                  </div>
                </div>

                {/* Raccourcis directs vers Présences et Notes pour cette classe */}
                <div className="flex items-center gap-2">
                  <button
                    id={`btn-detail-call-${selectedClass.id}`}
                    onClick={() => {
                      setActiveTab('attendance');
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Faire l'appel</span>
                  </button>

                  <button
                    id={`btn-detail-grades-${selectedClass.id}`}
                    onClick={() => {
                      setActiveTab('grades');
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Saisir les notes</span>
                  </button>
                </div>
              </div>

              {/* Contenu spécifique de la classe : Répertoire des élèves */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Élèves inscrits en {selectedClass?.name}
                    </h3>
                    <p className="text-slate-500 text-xs">
                      Consultez les coordonnées parentales, le statut d'assiduité et les actions individuelles
                    </p>
                  </div>

                  {/* Recherche rapide */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-search-student-class"
                      type="text"
                      placeholder="Rechercher par nom ou matricule..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold">
                        <th className="py-2.5 px-3">Matricule</th>
                        <th className="py-2.5 px-3">Nom, Post-nom & Prénom</th>
                        <th className="py-2.5 px-3 text-center">Genre</th>
                        <th className="py-2.5 px-3">Parent / Tuteur & Contact</th>
                        <th className="py-2.5 px-3 text-center">Assiduité Récente</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((stu) => {
                        const parent = parents.find((p) => p.id === stu.parentId || p.studentIds.includes(stu.id));
                        const recentAtt = attendance.find((a) => a.studentId === stu.id);

                        return (
                          <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                              {stu.matricule}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">
                                {stu.lastName} {stu.postName} {stu.firstName}
                              </div>
                              <div className="text-[11px] text-slate-400">Né(e) le {stu.birthDate} à {stu.birthPlace}</div>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  stu.gender === 'F' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {stu.gender === 'F' ? 'Fille' : 'Garçon'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-slate-800 font-medium">{parent?.fullName || 'Parent non renseigné'}</div>
                              {parent?.phone && (
                                <a
                                  href={`tel:${parent.phone}`}
                                  className="text-indigo-600 hover:underline text-[11px] flex items-center gap-1 mt-0.5"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                  <span>{parent.phone}</span>
                                </a>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  recentAtt?.status === 'present'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : recentAtt?.status === 'absent'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {recentAtt?.status === 'present'
                                  ? 'Présent'
                                  : recentAtt?.status === 'absent'
                                  ? 'Absent'
                                  : 'En règle'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  id={`btn-report-incident-cls-${stu.id}`}
                                  onClick={() => openIncidentModal(stu)}
                                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                                  title="Signaler un incident au Directeur de Discipline (Article 14)"
                                >
                                  <ShieldAlert className="w-3 h-3 text-red-600" />
                                  <span>Signaler incident</span>
                                </button>
                                <button
                                  id={`btn-msg-parent-${stu.id}`}
                                  onClick={() => {
                                    setActiveTab('messages');
                                    setNewMsgRecipientType('parents');
                                    setNewMsgSubject(`Suivi pédagogique de l'élève ${stu.firstName} ${stu.lastName}`);
                                    setIsComposingMessage(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors"
                                >
                                  Écrire au parent
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VUE 2 : PRÉSENCES (Section 15 Cahier des charges)          */}
      {/* Sélection: Classe → Matière éventuellement → Date dynam.  */}
      {/* Liste: Élève | Présent | Absent | Retard                  */}
      {/* Bouton: ENREGISTRER                                       */}
      {/* Message: "Présences enregistrées avec succès."            */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 text-xs">
          {/* Sélection Classe, Matière, Date dynamique */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Registre d'Appel des Présences
            </h2>
            <p className="text-slate-500 text-xs mb-4">
              Pointage instantané des élèves. La date provient dynamiquement du système et n'est pas codée en dur.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Sélection: Classe */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">1. Sélection Classe *</label>
                <select
                  id="select-attendance-class"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {activeClassList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({students.filter((s) => s.classId === c.id).length} élèves)
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection: Matière éventuellement */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">2. Matière (éventuellement)</label>
                <select
                  id="select-attendance-subject"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Appel Général de la Journée --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection: Date dynamique (PROVENANT DU SYSTÈME) */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">3. Date dynamique *</label>
                <input
                  id="input-attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Créneau de la séance */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">4. Créneau Horaire</label>
                <select
                  id="select-attendance-timeslot"
                  value={attendanceTimeSlot}
                  onChange={(e) => setAttendanceTimeSlot(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="07h30 - 08h25 (1ère Heure)">07h30 - 08h25 (1ère Heure)</option>
                  <option value="08h25 - 09h20 (2ème Heure)">08h25 - 09h20 (2ème Heure)</option>
                  <option value="09h40 - 10h35 (3ème Heure)">09h40 - 10h35 (3ème Heure)</option>
                  <option value="10h35 - 11h30 (4ème Heure)">10h35 - 11h30 (4ème Heure)</option>
                  <option value="11h30 - 12h25 (5ème Heure)">11h30 - 12h25 (5ème Heure)</option>
                  <option value="Appel Général Journée">Appel Général Journée</option>
                </select>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  id="btn-mark-all-present"
                  onClick={() => handleSetAllAttendance('present')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Tout marquer Présent</span>
                </button>
                <button
                  id="btn-mark-all-absent"
                  onClick={() => handleSetAllAttendance('absent')}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold transition-colors"
                >
                  Tout marquer Absent
                </button>
              </div>

              {/* Attendance counters */}
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Présents : <strong>{countPresent}</strong>
                </span>
                <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                  Absents : <strong>{countAbsent}</strong>
                </span>
                <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Retards : <strong>{countRetard}</strong>
                </span>
                <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  Excusés : <strong>{countExcuse}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Liste : Élève | Présent | Absent | Retard (+ Excusé) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Feuille de Présence : {selectedClass?.name || 'Classe'}
                </h3>
                <p className="text-slate-500 text-xs">
                  Date : <span className="font-semibold text-slate-800">{attendanceDate}</span> • Créneau : {attendanceTimeSlot}
                </p>
              </div>

              {/* BOUTON ENREGISTRER OBLIGATOIRE DU CAHIER DES CHARGES */}
              <button
                id="btn-save-attendance-main"
                onClick={handleSaveAttendance}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>ENREGISTRER</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="py-3 px-3">Matricule</th>
                    <th className="py-3 px-3">Élève</th>
                    <th className="py-3 px-3 text-center">Statut Actuel</th>
                    <th className="py-3 px-3 text-center">Pointer la Présence</th>
                    <th className="py-3 px-3">Motif / Justification</th>
                    <th className="py-3 px-3 text-center">Discipline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((stu) => {
                    const currentStatus = attendanceDraft[stu.id]?.status || 'present';
                    const currentJustif = attendanceDraft[stu.id]?.justification || '';

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-600 font-semibold">{stu.matricule}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {stu.lastName} {stu.postName} {stu.firstName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stu.gender === 'F' ? 'Fille' : 'Garçon'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              currentStatus === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : currentStatus === 'absent'
                                ? 'bg-red-100 text-red-800'
                                : currentStatus === 'retard'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {currentStatus === 'present'
                              ? '✓ Présent'
                              : currentStatus === 'absent'
                              ? '✗ Absent'
                              : currentStatus === 'retard'
                              ? '⏱ Retard'
                              : '📄 Excusé'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {/* 4 Boutons clairs : Présent | Absent | Retard | Excusé */}
                          <div className="flex items-center justify-center gap-1">
                            <button
                              id={`btn-att-p-${stu.id}`}
                              onClick={() => handleSetStudentAttendanceStatus(stu.id, 'present')}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                              }`}
                            >
                              Présent
                            </button>
                            <button
                              id={`btn-att-a-${stu.id}`}
                              onClick={() => handleSetStudentAttendanceStatus(stu.id, 'absent')}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                currentStatus === 'absent'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-red-50'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              id={`btn-att-r-${stu.id}`}
                              onClick={() => handleSetStudentAttendanceStatus(stu.id, 'retard')}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                currentStatus === 'retard'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-amber-50'
                              }`}
                            >
                              Retard
                            </button>
                            <button
                              id={`btn-att-e-${stu.id}`}
                              onClick={() => handleSetStudentAttendanceStatus(stu.id, 'excuse')}
                              className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                                currentStatus === 'excuse'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-50'
                              }`}
                            >
                              Excusé
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            id={`input-att-justif-${stu.id}`}
                            type="text"
                            placeholder="Motif / Commentaire..."
                            value={currentJustif}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAttendanceDraft((prev) => ({
                                ...prev,
                                [stu.id]: {
                                  status: prev[stu.id]?.status || 'present',
                                  justification: val,
                                },
                              }));
                            }}
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            id={`btn-att-incident-${stu.id}`}
                            onClick={() => openIncidentModal(stu)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Signaler un incident disciplinaire (Article 14)"
                          >
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Save bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                La sauvegarde déclenche l'actualisation du registre officiel et prépare les alertes SMS disciplinaires.
              </span>
              <button
                id="btn-save-attendance-bottom"
                onClick={handleSaveAttendance}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>ENREGISTRER</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VUE 3 : NOTES (Section 15 Cahier des charges)              */}
      {/* Classe → Matière → Évaluation                             */}
      {/* Liste des élèves avec champs de notes                     */}
      {/* Boutons: Enregistrer brouillon | Publier                  */}
      {/* ========================================================= */}
      {activeTab === 'grades' && (
        <div className="space-y-6 text-xs">
          {/* Mode Switcher & Top Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                id="btn-mode-evaluation"
                onClick={() => setGradeViewMode('evaluation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  gradeViewMode === 'evaluation'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Saisie par Évaluation
              </button>
              <button
                id="btn-mode-palmares"
                onClick={() => setGradeViewMode('palmares')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  gradeViewMode === 'palmares'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Palmarès & Fiche Officielle EPST
              </button>
            </div>

            <button
              id="btn-open-corrections-modal"
              onClick={() => setShowCorrectionsModal(true)}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Demandes de Rectification ({gradeCorrections.length})</span>
            </button>
          </div>

          {/* Sélecteurs Communs: Classe → Matière → Période */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {gradeViewMode === 'evaluation'
                ? 'Saisie et Publication des Cotes Scolaires'
                : 'Palmarès et Fiche Délibérative Officielle EPST'}
            </h2>
            <p className="text-slate-500 text-xs mb-4">
              {gradeViewMode === 'evaluation'
                ? 'Enregistrez vos interrogations et devoirs. Une note publiée est verrouillée et requiert l\'autorisation du Directeur des Études (Article 15).'
                : 'Grille consolidée des cotes par élève pour la période sélectionnée, conforme aux normes des bulletins scolaires en RDC.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Classe */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">1. Classe *</label>
                <select
                  id="select-grade-class"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {activeClassList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matière */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">2. Matière enseignée *</label>
                <select
                  id="select-grade-subject"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Max {s.defaultMaxScore} pts • Coeff {s.defaultCoefficient})
                    </option>
                  ))}
                </select>
              </div>

              {/* Période scolaire */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">3. Période scolaire *</label>
                <select
                  id="select-grade-period"
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Évaluation */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">4. Intitulé Évaluation *</label>
                <input
                  id="input-grade-evaluation"
                  type="text"
                  value={evaluationTitle}
                  onChange={(e) => setEvaluationTitle(e.target.value)}
                  placeholder="Ex: Interrogation n°1, Devoir..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Statistiques en direct */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Barème Maxima</span>
                <span className="text-sm font-black text-slate-900">
                  {currentMaxScore} pts <span className="text-xs font-normal text-slate-500">(Coeff {currentCoefficient})</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Cotes Saisies</span>
                <span className="text-sm font-black text-slate-900">
                  {enteredScores.length} / {classStudents.length} élèves
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Moyenne Classe</span>
                <span className="text-sm font-black text-indigo-700">
                  {avgScore} / {currentMaxScore}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Taux Réussite</span>
                <span className="text-sm font-black text-emerald-700">{passingPercent}%</span>
              </div>
            </div>
          </div>

          {/* VUE MODE 1: SAISIE PAR ÉVALUATION */}
          {gradeViewMode === 'evaluation' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Saisie des Notes — {evaluationTitle || 'Évaluation en cours'}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {selectedSubject?.name || 'Matière'} • {selectedPeriod?.name || 'Période'} • Maximum : {currentMaxScore} points
                  </p>
                </div>

                {/* Les deux boutons obligatoires du cahier des charges */}
                <div className="flex items-center gap-2">
                  <button
                    id="btn-save-grades-draft"
                    onClick={() => handleSaveGradesAs('draft')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Enregistrer brouillon</span>
                  </button>
                  <button
                    id="btn-publish-grades"
                    onClick={() => handleSaveGradesAs('published')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publier</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Règle de gestion (Article 15) :</strong> Une note publiée est verrouillée. Si vous avez commis une erreur de transcription, utilisez le bouton <em>« Demander rectification »</em> pour soumettre une requête formelle au Directeur des Études. Utilisez la touche <kbd className="px-1 py-0.5 bg-amber-200/60 rounded text-[10px] font-mono">Entrée</kbd> pour passer rapidement d'un élève à l'autre.
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="py-3 px-3">Matricule</th>
                      <th className="py-3 px-3">Nom & Prénom de l'Élève</th>
                      <th className="py-3 px-3 text-center">Dernière Cote</th>
                      <th className="py-3 px-3 text-center">Saisie de la Cote / {currentMaxScore}</th>
                      <th className="py-3 px-3 text-center">Appréciation</th>
                      <th className="py-3 px-3 text-center">Statut</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((stu, index) => {
                      const existingGrade = grades.find(
                        (g) =>
                          g.studentId === stu.id &&
                          g.subjectId === selectedSubject.id &&
                          (g.periodId === selectedPeriod.id || g.academicPeriodId === selectedPeriod.id)
                      );

                      const currentScore = gradeInputState[stu.id];
                      const isPublished = existingGrade?.status === 'published';

                      // Find pending correction request if any
                      const pendingReq = gradeCorrections.find(
                        (c) =>
                          c.studentId === stu.id &&
                          c.subjectId === selectedSubject.id &&
                          c.periodId === selectedPeriod.id &&
                          c.status === 'pending'
                      );

                      // Automatic appreciation
                      let appreciation = 'Non coté';
                      let appColor = 'text-slate-400';
                      if (currentScore !== undefined) {
                        const ratio = currentScore / currentMaxScore;
                        if (ratio >= 0.8) {
                          appreciation = 'Très Bien';
                          appColor = 'text-emerald-700 font-bold';
                        } else if (ratio >= 0.6) {
                          appreciation = 'Bien';
                          appColor = 'text-blue-700 font-semibold';
                        } else if (ratio >= 0.5) {
                          appreciation = 'Passable';
                          appColor = 'text-amber-700 font-semibold';
                        } else {
                          appreciation = 'Échec / À revoir';
                          appColor = 'text-red-700 font-bold';
                        }
                      }

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono font-medium text-slate-700">{stu.matricule}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {stu.lastName} {stu.postName} {stu.firstName}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold">
                            {existingGrade ? (
                              <span className="text-slate-800">
                                {existingGrade.score} / {existingGrade.maxScore}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Aucune</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                id={`input-score-${index}`}
                                type="number"
                                min="0"
                                max={currentMaxScore}
                                step="0.5"
                                disabled={isPublished}
                                value={currentScore ?? ''}
                                onChange={(e) => handleScoreChange(stu.id, e.target.value)}
                                onKeyDown={(e) => handleScoreKeyDown(e, index)}
                                placeholder="0"
                                className={`w-20 px-2.5 py-1.5 text-center rounded-xl border font-bold font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${
                                  isPublished
                                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                    : 'bg-white text-slate-900 border-slate-300'
                                }`}
                              />
                              <span className="text-slate-500 font-mono text-xs">/ {currentMaxScore}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-xs ${appColor}`}>{appreciation}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isPublished ? (
                              <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                                <Lock className="w-3 h-3" />
                                Publiée
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200">
                                <Unlock className="w-3 h-3" />
                                Brouillon
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isPublished ? (
                              pendingReq ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Clock className="w-3 h-3" />
                                  Rectification en attente (D.E.)
                                </span>
                              ) : (
                                <button
                                  id={`btn-request-rectif-${stu.id}`}
                                  onClick={() => openUnlockModal(stu, existingGrade)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                                  title="Demander une correction au Directeur des Études"
                                >
                                  <Lock className="w-3 h-3 text-amber-600" />
                                  <span>Demander rectification</span>
                                </button>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Édition libre</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  La publication valide les notes pour le calcul automatique des pourcentages des bulletins officiels.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-save-grades-draft-bottom"
                    onClick={() => handleSaveGradesAs('draft')}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Enregistrer brouillon</span>
                  </button>
                  <button
                    id="btn-publish-grades-bottom"
                    onClick={() => handleSaveGradesAs('published')}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publier</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VUE MODE 2: PALMARÈS & FICHE OFFICIELLE EPST */}
          {gradeViewMode === 'palmares' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
              {/* Header Fiche Officielle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider">
                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO • EPST
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Fiche Officielle des Cotes & Grille Délibérative
                  </h3>
                  <p className="text-slate-600 text-xs mt-0.5">
                    Établissement : <strong>{school?.name || 'École'}</strong> • Classe : <strong>{selectedClass?.name || 'Classe'}</strong> • Matière : <strong>{selectedSubject?.name || 'Matière'}</strong> • Période : <strong>{selectedPeriod?.name || 'Période'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-print-palmares"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimer la Fiche</span>
                  </button>
                </div>
              </div>

              {/* Table Palmarès */}
              <div className="overflow-x-auto border border-slate-300 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="py-2.5 px-3 w-10 text-center">N°</th>
                      <th className="py-2.5 px-3">Matricule</th>
                      <th className="py-2.5 px-3">Nom, Post-nom & Prénom</th>
                      <th className="py-2.5 px-3 text-center">Sexe</th>
                      <th className="py-2.5 px-3 text-center font-mono">Interro 1 (/20)</th>
                      <th className="py-2.5 px-3 text-center font-mono">Interro 2 (/20)</th>
                      <th className="py-2.5 px-3 text-center font-mono">Devoir (/20)</th>
                      <th className="py-2.5 px-3 text-center font-mono">Examen (/40)</th>
                      <th className="py-2.5 px-3 text-center font-mono bg-slate-200/70">Total (/100)</th>
                      <th className="py-2.5 px-3 text-center font-bold font-mono bg-indigo-50 text-indigo-900">% Période</th>
                      <th className="py-2.5 px-3 text-center">Mention EPST</th>
                      <th className="py-2.5 px-3 text-center">Décision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {classStudents.map((stu, idx) => {
                      const existingGrade = grades.find(
                        (g) =>
                          g.studentId === stu.id &&
                          g.subjectId === selectedSubject.id &&
                          (g.periodId === selectedPeriod.id || g.academicPeriodId === selectedPeriod.id)
                      );

                      const scoreVal = existingGrade?.score ?? gradeInputState[stu.id] ?? 0;
                      const maxVal = existingGrade?.maxScore ?? currentMaxScore;
                      const percentage = Math.round((scoreVal / maxVal) * 100);

                      // Calculated synthetic breakdown for standard EPST 100-pt form
                      const interro1 = Math.round((percentage * 20) / 100);
                      const interro2 = Math.round(((percentage * 20) / 100) * 0.95);
                      const devoir = Math.round(((percentage * 20) / 100) * 1.05);
                      const examen = Math.min(40, Math.round((percentage * 40) / 100));
                      const totalCalculated = Math.min(100, Math.round(percentage));

                      // Mention EPST RDC
                      let mention = 'Échec';
                      let badgeStyle = 'bg-red-100 text-red-800';
                      let decision = 'À consolider';

                      if (percentage >= 90) {
                        mention = 'Élite';
                        badgeStyle = 'bg-purple-100 text-purple-900 font-black';
                        decision = 'Admis / Félicitations';
                      } else if (percentage >= 80) {
                        mention = 'Très Bien';
                        badgeStyle = 'bg-emerald-100 text-emerald-900 font-bold';
                        decision = 'Admis';
                      } else if (percentage >= 70) {
                        mention = 'Bien';
                        badgeStyle = 'bg-blue-100 text-blue-900 font-semibold';
                        decision = 'Admis';
                      } else if (percentage >= 50) {
                        mention = 'Satisfaisant';
                        badgeStyle = 'bg-amber-100 text-amber-900 font-medium';
                        decision = 'Admis';
                      } else {
                        mention = 'Échec';
                        badgeStyle = 'bg-red-100 text-red-800 font-bold';
                        decision = 'Ajourné';
                      }

                      return (
                        <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{stu.matricule}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {stu.lastName} {stu.postName} {stu.firstName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                stu.gender === 'F' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {stu.gender}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{interro1}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{interro2}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{devoir}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700">{examen}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold bg-slate-100 text-slate-900">
                            {totalCalculated} / 100
                          </td>
                          <td className="py-2.5 px-3 text-center font-black font-mono bg-indigo-50 text-indigo-900">
                            {percentage}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${badgeStyle}`}>
                              {mention}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                            {decision}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Synthèse Délibérative Footer */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Effectif Total</span>
                  <span className="text-base font-black text-slate-900">{classStudents.length} élèves</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Moyenne Classe</span>
                  <span className="text-base font-black text-indigo-700">{avgScore} / {currentMaxScore}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Plus Forte Note</span>
                  <span className="text-base font-black text-emerald-700">
                    {enteredScores.length > 0 ? Math.max(...enteredScores) : 0} / {currentMaxScore}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Plus Faible Note</span>
                  <span className="text-base font-black text-red-700">
                    {enteredScores.length > 0 ? Math.min(...enteredScores) : 0} / {currentMaxScore}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Taux Réussite</span>
                  <span className="text-base font-black text-emerald-800">{passingPercent}%</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-[11px] text-slate-500">
                <span>
                  Fiche certifiée conforme aux délibérations pédagogiques sous le sceau de la Direction des Études.
                </span>
                <span className="font-semibold text-slate-700">
                  Professeur titulaire de la discipline : {teacherName}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VUE : ESPACE TITULAIRE (Professeur Principal)             */}
      {/* ========================================================= */}
      {activeTab === 'titulaire' && (
        <div className="space-y-6 text-xs">
          {/* Header Espace Titulaire */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    Espace Titulaire de Classe (Professeur Principal)
                  </span>
                  {isTitulaire && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Titularisation active
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                  Appréciations & Conduite pour les Bulletins Scolaires EPST
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  En tant que titulaire, vous êtes garant du suivi global de la promotion et des mentions officielles de conduite inscrites au bulletin.
                </p>
              </div>

              {/* Bouton d'enregistrement */}
              <button
                id="btn-save-titulaire-appr"
                onClick={handleSaveTitulaireAppreciations}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-transform active:scale-95 shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>ENREGISTRER LES APPRÉCIATIONS</span>
              </button>
            </div>

            {/* Sélecteurs Classe & Période */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Classe sous votre responsabilité *</label>
                <select
                  id="select-titulaire-class"
                  value={titulaireClassId}
                  onChange={(e) => setTitulaireClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {activeClassList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {tutoredClasses.some((tc) => tc.id === c.id) ? '★ (Votre classe attitrée)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Période du Bulletin Officiel *</label>
                <select
                  id="select-titulaire-period"
                  value={titulairePeriodId}
                  onChange={(e) => setTitulairePeriodId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notice d'information */}
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Règle pédagogique RDC :</strong> L'appréciation générale et la note de conduite sont imprimées sur le bulletin de fin de période remis aux parents d'élèves. Cliquez sur les suggestions rapides pour renseigner promptement les appréciations.
              </div>
            </div>
          </div>

          {/* Grille des élèves pour appréciations */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registre d'Appréciations : {titulaireClass?.name || selectedClass?.name || 'Classe'}
                </h3>
                <p className="text-slate-500 text-xs">
                  {students.filter((s) => s.classId === (titulaireClass?.id || selectedClass?.id)).length} élèves inscrits • Période : {periods.find((p) => p.id === titulairePeriodId)?.name || selectedPeriod?.name || 'Période'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="py-3 px-3 w-10 text-center">N°</th>
                    <th className="py-3 px-3">Matricule</th>
                    <th className="py-3 px-3">Nom & Prénom de l'Élève</th>
                    <th className="py-3 px-3 text-center">Conduite Officielle</th>
                    <th className="py-3 px-3">Appréciation Générale du Titulaire (Bulletin)</th>
                    <th className="py-3 px-3 text-center">Assiduité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.filter((s) => s.classId === (titulaireClass?.id || selectedClass.id)).map((stu, idx) => {
                    const studentAttendance = attendance.filter((a) => a.studentId === stu.id);
                    const absentCount = studentAttendance.filter((a) => a.status === 'absent').length;
                    const draft = titulaireRemarks[stu.id] || {
                      conduct: 'Bonne' as const,
                      appreciation: '',
                    };

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-700">{stu.matricule}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            {stu.lastName} {stu.postName} {stu.firstName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stu.gender === 'F' ? 'Fille' : 'Garçon'}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <select
                            id={`select-conduct-${stu.id}`}
                            value={draft.conduct}
                            onChange={(e) => {
                              const val = e.target.value as ClassAppreciation['conduct'];
                              setTitulaireRemarks((prev) => ({
                                ...prev,
                                [stu.id]: {
                                  conduct: val,
                                  appreciation: prev[stu.id]?.appreciation || '',
                                },
                              }));
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-xs focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Excellente">Excellente</option>
                            <option value="Très Bonne">Très Bonne</option>
                            <option value="Bonne">Bonne</option>
                            <option value="Passable">Passable</option>
                            <option value="Médiocre">Médiocre</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1.5">
                            <textarea
                              id={`textarea-appr-${stu.id}`}
                              rows={2}
                              value={draft.appreciation}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTitulaireRemarks((prev) => ({
                                  ...prev,
                                  [stu.id]: {
                                    conduct: prev[stu.id]?.conduct || 'Bonne',
                                    appreciation: val,
                                  },
                                }));
                              }}
                              placeholder="Appréciation synthétique pour le bulletin..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                            {/* Suggestions rapides en un clic */}
                            <div className="flex flex-wrap gap-1">
                              {[
                                'Élève assidu et travailleur.',
                                'Bon travail d’ensemble, persévérez.',
                                'Résultats encourageants.',
                                'Attention aux bavardages.',
                                'Doit intensifier ses efforts.',
                              ].map((phrase) => (
                                <button
                                  key={phrase}
                                  type="button"
                                  onClick={() => {
                                    setTitulaireRemarks((prev) => ({
                                      ...prev,
                                      [stu.id]: {
                                        conduct: prev[stu.id]?.conduct || 'Bonne',
                                        appreciation: phrase,
                                      },
                                    }));
                                  }}
                                  className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors"
                                >
                                  + {phrase}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              absentCount === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : absentCount <= 2
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {absentCount === 0 ? 'Assidu' : `${absentCount} abs.`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Les appréciations sauvegardées sont directement injectées dans le générateur de bulletins scolaires.
              </span>
              <button
                id="btn-save-titulaire-appr-bottom"
                onClick={handleSaveTitulaireAppreciations}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>ENREGISTRER LES APPRÉCIATIONS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VUE 4 : MES MATIÈRES                                      */}
      {/* ========================================================= */}
      {activeTab === 'subjects' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Mes Matières Enseignées & Cahier de Textes
                </h2>
                <p className="text-slate-500 text-xs">
                  Programme officiel national EPST, barèmes de notation et progression des chapitres
                </p>
              </div>
              <button
                id="btn-new-lesson"
                onClick={() => setIsAddingLesson(!isAddingLesson)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAddingLesson ? 'Fermer le formulaire' : 'Ajouter une Séance'}</span>
              </button>
            </div>

            {/* Formulaire ajout séance au cahier de textes */}
            {isAddingLesson && (
              <form onSubmit={handleAddLessonLog} className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs">Enregistrer une Séance au Cahier de Textes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Titre de la leçon / Chapitre *</label>
                    <input
                      id="input-lesson-title"
                      type="text"
                      required
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      placeholder="Ex: Chapitre 4 - Trigonométrie"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Date d'échéance devoir</label>
                    <input
                      id="input-lesson-due-date"
                      type="date"
                      value={newLessonDueDate}
                      onChange={(e) => setNewLessonDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Résumé des notions abordées *</label>
                  <textarea
                    id="input-lesson-summary"
                    required
                    rows={2}
                    value={newLessonSummary}
                    onChange={(e) => setNewLessonSummary(e.target.value)}
                    placeholder="Synthèse du cours dispensé aux élèves..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Travail à domicile / Devoir (Optionnel)</label>
                  <input
                    id="input-lesson-homework"
                    type="text"
                    value={newLessonHomework}
                    onChange={(e) => setNewLessonHomework(e.target.value)}
                    placeholder="Exercices à faire pour la prochaine séance..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingLesson(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold"
                  >
                    Enregistrer au Cahier de Textes
                  </button>
                </div>
              </form>
            )}

            {/* Liste des matières */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {subjects.map((sub) => (
                <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800">
                        {sub.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{sub.name}</h4>
                      <p className="text-slate-500 font-mono text-[11px]">Code : {sub.code}</p>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-slate-800">Coeff : {sub.defaultCoefficient}</div>
                      <div className="text-xs text-indigo-600 font-semibold">Max : {sub.defaultMaxScore} pts</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Classes : {activeClassList.map((c) => c.name).join(', ')}</span>
                    <button
                      id={`btn-subject-grades-${sub.id}`}
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setActiveTab('grades');
                      }}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Saisir les cotes →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Journal du Cahier de Textes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Historique des Séances & Devoirs Publiés</h3>
            {lessonLogs.length === 0 ? (
              <p className="text-slate-400 italic">Aucune séance enregistrée pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {lessonLogs.map((log) => {
                  const sub = subjects.find((s) => s.id === log.subjectId);
                  const cls = classes.find((c) => c.id === log.classId);

                  return (
                    <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{log.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                            {sub?.name || 'Matière'}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px]">{log.date}</span>
                      </div>
                      <p className="text-slate-700 text-xs">{log.summary}</p>
                      {log.homework && (
                        <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                          <strong>Travail à domicile :</strong> {log.homework}{' '}
                          {log.homeworkDueDate && <span className="font-semibold">(À rendre le {log.homeworkDueDate})</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VUE 5 : HORAIRE (Emploi du temps hebdomadaire)             */}
      {/* ========================================================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Emploi du Temps Hebdomadaire
                </h2>
                <p className="text-slate-500 text-xs">
                  Horaire officiel des cours du {teacherName} • Année scolaire en cours
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-print-schedule"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer l'horaire</span>
                </button>
              </div>
            </div>

            {/* Filtre par jour */}
            <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-100">
              {['Tous', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDayFilter(day)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedDayFilter === day
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Grille de l'horaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(selectedDayFilter === 'Tous'
              ? ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
              : [selectedDayFilter]
            ).map((day) => {
              const daySlots = scheduleSlots.filter((s) => s.dayOfWeek === day);

              return (
                <div key={day} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-sm text-slate-900">{day}</h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {daySlots.length} Séance(s)
                    </span>
                  </div>

                  {daySlots.length === 0 ? (
                    <p className="text-slate-400 italic text-center py-6">Aucun cours programmé ce jour.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {daySlots.map((slot) => {
                        const slotClass = classes.find((c) => c.id === slot.classId);
                        const slotSubject = subjects.find((s) => s.id === slot.subjectId);

                        return (
                          <div
                            key={slot.id}
                            className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition-colors space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-indigo-900 text-[11px]">
                                {slot.timeSlot}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-900">
                                {slotClass?.name}
                              </span>
                            </div>

                            <div className="font-bold text-slate-900 text-xs">
                              {slotSubject?.name || 'Matière'}
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock3 className="w-3 h-3 text-slate-400" />
                              <span>{slot.room}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VUE 6 : MESSAGES (Communication de l'enseignant)           */}
      {/* ========================================================= */}
      {activeTab === 'messages' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Messagerie Pédagogique & Communication
                </h2>
                <p className="text-slate-500 text-xs">
                  Communiquez avec vos classes, les parents d’élèves et l’administration scolaire
                </p>
              </div>

              <button
                id="btn-compose-message"
                onClick={() => setIsComposingMessage(!isComposingMessage)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isComposingMessage ? 'Fermer l’éditeur' : 'Nouveau Message'}</span>
              </button>
            </div>

            {/* Formulaire Nouveau Message */}
            {isComposingMessage && (
              <form
                onSubmit={handleSendMessage}
                className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4"
              >
                <h3 className="font-bold text-slate-900 text-xs">Rédiger un Nouveau Message</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Destinataires *</label>
                    <select
                      id="select-message-recipient-type"
                      value={newMsgRecipientType}
                      onChange={(e) => setNewMsgRecipientType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="classe">Élèves de la classe ({selectedClass?.name || 'Classe'})</option>
                      <option value="parents">Parents d’élèves ({selectedClass?.name || 'Classe'})</option>
                      <option value="administration">Direction des Études & Administration</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Classe ciblée</label>
                    <select
                      id="select-message-class-target"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      {activeClassList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Objet du message *</label>
                  <input
                    id="input-message-subject"
                    type="text"
                    required
                    value={newMsgSubject}
                    onChange={(e) => setNewMsgSubject(e.target.value)}
                    placeholder="Ex: Devoir à domicile n°2, Matériel pour le laboratoire..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contenu du message *</label>
                  <textarea
                    id="input-message-body"
                    required
                    rows={4}
                    value={newMsgBody}
                    onChange={(e) => setNewMsgBody(e.target.value)}
                    placeholder="Écrivez clairement votre message..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                  />
                </div>

                {/* Option SMS */}
                <div className="flex items-center gap-2">
                  <input
                    id="checkbox-send-sms"
                    type="checkbox"
                    checked={newMsgSendSms}
                    onChange={(e) => setNewMsgSendSms(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="checkbox-send-sms" className="text-slate-700 font-semibold cursor-pointer">
                    Transmettre également par notification SMS aux téléphones des parents (Vodacom, Airtel, Orange)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsComposingMessage(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>ENVOYER LE MESSAGE</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Liste des messages */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Historique des Messages</h3>

            {messages.length === 0 ? (
              <p className="text-slate-400 italic text-center py-6">Aucun message pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl border transition-colors space-y-2 ${
                      msg.read ? 'bg-slate-50 border-slate-200' : 'bg-indigo-50/50 border-indigo-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{msg.subject}</span>
                        {msg.smsSent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            SMS Envoyé
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px]">{new Date(msg.sentAt).toLocaleString('fr-FR')}</span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      De : <strong className="text-slate-800">{msg.senderName}</strong> • Destinataire :{' '}
                      <strong className="text-indigo-700">{msg.recipientTargetName}</strong>
                    </div>

                    <p className="text-slate-700 text-xs leading-relaxed">{msg.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1 : DEMANDE DE RECTIFICATION DE NOTE (Article 15)   */}
      {/* ========================================================= */}
      {unlockTargetStudent && unlockTargetGrade && (
        <div
          id="modal-grade-correction-request"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Article 15 • Cahier des Charges RDC
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Demande de Rectification de Cote au D.E.
                </h3>
              </div>
              <button
                id="btn-close-unlock-modal"
                onClick={() => {
                  setUnlockTargetStudent(null);
                  setUnlockTargetGrade(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div>Élève : <strong className="text-slate-900">{unlockTargetStudent.lastName} {unlockTargetStudent.postName} {unlockTargetStudent.firstName}</strong> ({unlockTargetStudent.matricule})</div>
              <div>Matière : <strong className="text-indigo-700">{selectedSubject?.name || 'Matière'}</strong> • Période : <strong>{selectedPeriod?.name || 'Période'}</strong></div>
              <div>Cote officielle actuelle : <strong className="text-slate-900 font-mono text-sm">{unlockTargetGrade.score} / {unlockTargetGrade.maxScore}</strong> (Verrouillée)</div>
            </div>

            <form onSubmit={handleSubmitUnlockRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nouvelle cote proposée / {unlockTargetGrade.maxScore} *
                </label>
                <input
                  id="input-proposed-score"
                  type="number"
                  min="0"
                  max={unlockTargetGrade.maxScore}
                  step="0.5"
                  required
                  value={unlockRequestedScore}
                  onChange={(e) => setUnlockRequestedScore(e.target.value)}
                  placeholder="Ex: 14.5"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Motif justificatif circonstancié pour le Directeur des Études *
                </label>
                <textarea
                  id="input-unlock-reason"
                  rows={3}
                  required
                  value={unlockReason}
                  onChange={(e) => setUnlockReason(e.target.value)}
                  placeholder="Ex: Erreur matérielle lors du report des cotes du devoir n°2. La copie révisée justifie une cote de 14.5."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-[11px]">
                <strong>Cloisonnement strict :</strong> Cette demande sera notifiée au Directeur des Études. La note sur les bulletins ne sera mise à jour qu’après validation hiérarchique officielle.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-unlock"
                  onClick={() => {
                    setUnlockTargetStudent(null);
                    setUnlockTargetGrade(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  id="btn-submit-unlock"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>TRANSMETTRE LA REQUÊTE</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2 : SIGNALEMENT DISCIPLINAIRE (Article 14)          */}
      {/* ========================================================= */}
      {incidentTargetStudent && (
        <div
          id="modal-discipline-incident"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300 inline-flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-600" />
                  Article 14 • Directeur de Discipline
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Signalement d'un Incident en Classe
                </h3>
              </div>
              <button
                id="btn-close-incident-modal"
                onClick={() => setIncidentTargetStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div>Élève concerné : <strong className="text-slate-900">{incidentTargetStudent.lastName} {incidentTargetStudent.postName} {incidentTargetStudent.firstName}</strong> ({incidentTargetStudent.matricule})</div>
              <div>Classe : <strong>{selectedClass?.name || 'Classe'}</strong> • Date : <strong>{attendanceDate}</strong></div>
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Niveau de gravité *</label>
                <select
                  id="select-incident-severity"
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="minor">Mineure — Retard récurrent, bavardages répétés, oubli de matériel</option>
                  <option value="moderate">Moyenne — Insolence envers l'enseignant, refus de travail, sortie de cours non autorisée</option>
                  <option value="severe">Majeure — Bagarre, tricherie avérée, dégradation matérielle ou violence verbale grave</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description précise des faits constatés *</label>
                <textarea
                  id="input-incident-description"
                  rows={3}
                  required
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="Circonstances exactes de l'incident survenu pendant la séance de cours..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Action immédiate prise par l'enseignant</label>
                <input
                  id="input-incident-action"
                  type="text"
                  value={incidentActionTaken}
                  onChange={(e) => setIncidentActionTaken(e.target.value)}
                  placeholder="Ex: Avertissement solennel / Envoyé auprès du Directeur de Discipline"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  id="btn-cancel-incident"
                  onClick={() => setIncidentTargetStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  id="btn-submit-incident"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>TRANSMETTRE AU D.D.</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3 : SUIVI DES DEMANDES DE RECTIFICATION             */}
      {/* ========================================================= */}
      {showCorrectionsModal && (
        <div
          id="modal-corrections-history"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Suivi des Demandes de Rectification de Cotes
                </h3>
                <p className="text-xs text-slate-500">
                  Historique des demandes soumises à la Direction des Études (Article 15).
                </p>
              </div>
              <button
                id="btn-close-corrections-history"
                onClick={() => setShowCorrectionsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {gradeCorrections.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Aucune demande de rectification en cours ou enregistrée.
                </div>
              ) : (
                gradeCorrections.map((req) => {
                  const stu = students.find((s) => s.id === req.studentId);
                  const sub = subjects.find((s) => s.id === req.subjectId);
                  const per = periods.find((p) => p.id === req.periodId);

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-bold text-slate-900">
                          {stu?.lastName} {stu?.postName} {stu?.firstName}{' '}
                          <span className="text-slate-400 font-mono font-normal">({stu?.matricule})</span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold self-start sm:self-auto border ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : req.status === 'rejected'
                              ? 'bg-red-100 text-red-900 border-red-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {req.status === 'approved'
                            ? '✓ Approuvée par le D.E.'
                            : req.status === 'rejected'
                            ? '✗ Rejetée par le D.E.'
                            : '⏱ En attente d\'arbitrage'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                        <span>Matière : <strong>{sub?.name || 'Matière'}</strong></span>
                        <span>Période : <strong>{per?.name || 'Période'}</strong></span>
                        <span>
                          Cote initiale : <strong className="font-mono text-slate-800">{req.currentScore} pts</strong> → Demandée : <strong className="font-mono text-indigo-700">{req.requestedScore ?? req.proposedScore} pts</strong>
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px]">
                        <strong>Motif enseignant :</strong> {req.reason}
                      </div>

                      {req.reviewNote && (
                        <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px]">
                          <strong>Avis Direction des Études :</strong> {req.reviewNote}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                id="btn-close-corrections-modal-bottom"
                onClick={() => setShowCorrectionsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
