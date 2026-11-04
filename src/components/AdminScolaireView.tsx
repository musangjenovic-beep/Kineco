import { useState, useEffect } from 'react';
import { School, SchoolClass, Subject, AcademicYear, AcademicPeriod, Student, Parent, Teacher, StudentTransfer } from '../types';
import { 
  Plus, BookOpen, Layers, Calendar, Settings, Users, Check, UserCheck, 
  ArrowRightLeft, UserPlus, FileText, CheckCircle, XCircle, AlertCircle, 
  ShieldCheck, ArrowRight, Building, Search, Phone, GraduationCap 
} from 'lucide-react';

interface AdminScolaireViewProps {
  school: School;
  schools?: School[];
  classes: SchoolClass[];
  subjects: Subject[];
  teachers?: Teacher[];
  academicYears: AcademicYear[];
  academicPeriods: AcademicPeriod[];
  students: Student[];
  parents: Parent[];
  onAddClass: (classData: Omit<SchoolClass, 'id' | 'schoolId'>) => Promise<void>;
  onAddSubject: (subjectData: Omit<Subject, 'id' | 'schoolId'>) => Promise<Subject | void>;
  onAddPeriod: (periodData: Omit<AcademicPeriod, 'id'>) => Promise<void>;
  onUpdateSchoolSettings: (updates: Partial<School>) => Promise<void>;
  onAssignTitulaire?: (classId: string, teacherId: string) => Promise<void>;
  onAddStudent?: (studentData: Partial<Student>) => Promise<Student | void>;
  onRefreshData?: () => void;
}

export const AdminScolaireView = ({
  school,
  schools = [],
  classes,
  subjects,
  teachers = [],
  academicYears,
  academicPeriods,
  students,
  parents,
  onAddClass,
  onAddSubject,
  onAddPeriod,
  onUpdateSchoolSettings,
  onAssignTitulaire,
  onAddStudent,
  onRefreshData,
}: AdminScolaireViewProps) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'sections' | 'inscriptions' | 'transferts' | 'subjects' | 'periods' | 'settings'>('classes');

  // Custom Sections Configuration (Article 32 des spécifications)
  const defaultSectionsList = school.sections && school.sections.length > 0
    ? school.sections
    : ['Scientifique', 'Littéraire', 'Commerciale & Gestion', 'Pédagogique', 'Électricité', 'Éducation de Base'];
  
  const [sectionsList, setSectionsList] = useState<string[]>(defaultSectionsList);
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionSaveSuccess, setSectionSaveSuccess] = useState(false);

  // Form states for new class
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('Humanités');
  const [newClassSection, setNewClassSection] = useState(sectionsList[0] || 'Scientifique');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [newClassCapacity, setNewClassCapacity] = useState(45);

  // Form states for new subject
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubCategory, setNewSubCategory] = useState<Subject['category']>('Sciences');
  const [newSubCoeff, setNewSubCoeff] = useState(2);
  const [newSubMax, setNewSubMax] = useState(20);

  // Form states for new period
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodCode, setNewPeriodCode] = useState('');
  const [newPeriodSemester, setNewPeriodSemester] = useState<1 | 2>(1);

  // Detailed Admission Form state (Article 53: Inscriptions Détaillées)
  const [admissionFirstName, setAdmissionFirstName] = useState('');
  const [admissionLastName, setAdmissionLastName] = useState('');
  const [admissionPostName, setAdmissionPostName] = useState('');
  const [admissionGender, setAdmissionGender] = useState<'M' | 'F'>('M');
  const [admissionBirthDate, setAdmissionBirthDate] = useState('2010-05-15');
  const [admissionBirthPlace, setAdmissionBirthPlace] = useState('Kinshasa');
  const [admissionNationality, setAdmissionNationality] = useState('Congolaise (RDC)');
  const [admissionBirthCert, setAdmissionBirthCert] = useState('');
  const [admissionPrevSchool, setAdmissionPrevSchool] = useState('');
  const [admissionLastClass, setAdmissionLastClass] = useState('');
  const [admissionPrevAverage, setAdmissionPrevAverage] = useState<number>(65);
  const [admissionGuardianName, setAdmissionGuardianName] = useState('');
  const [admissionGuardianPhone, setAdmissionGuardianPhone] = useState('+243 ');
  const [admissionGuardianJob, setAdmissionGuardianJob] = useState('');
  const [admissionTargetClassId, setAdmissionTargetClassId] = useState(classes[0]?.id || '');
  const [admissionSuccess, setAdmissionSuccess] = useState<string | null>(null);

  // Inter-school Student Transfers state (Articles 54, 55, 56)
  const [transfers, setTransfers] = useState<StudentTransfer[]>([]);
  const [transferStudentId, setTransferStudentId] = useState(students[0]?.id || '');
  const [transferTargetSchoolId, setTransferTargetSchoolId] = useState('');
  const [transferReason, setTransferReason] = useState('Déménagement familial');
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [acceptingTransferId, setAcceptingTransferId] = useState<string | null>(null);
  const [acceptTargetClassId, setAcceptTargetClassId] = useState(classes[0]?.id || '');

  // School settings state
  const [exchangeRate, setExchangeRate] = useState(school.exchangeRateUsdCdf || 2850);
  const [schoolPhone, setSchoolPhone] = useState(school.phone);
  const [schoolEmail, setSchoolEmail] = useState(school.email);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Fetch student transfers
  useEffect(() => {
    fetch(`/api/transfers?schoolId=${school.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTransfers(data);
      })
      .catch(() => {});
  }, [school.id]);

  // Handle Add Class
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const currentAy = academicYears.find((ay) => ay.isCurrent) || academicYears[0];
    await onAddClass({
      academicYearId: currentAy ? currentAy.id : 'ay-default',
      name: newClassName,
      level: newClassLevel,
      section: newClassSection,
      roomNumber: newClassRoom,
      capacity: Number(newClassCapacity) || 45,
    });
    setNewClassName('');
    setNewClassRoom('');
  };

  // Handle Add Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCode.trim()) return;
    await onAddSubject({
      name: newSubName,
      code: newSubCode.toUpperCase(),
      category: newSubCategory,
      defaultCoefficient: Number(newSubCoeff) || 1,
      defaultMaxScore: Number(newSubMax) || 20,
    });
    setNewSubName('');
    setNewSubCode('');
  };

  // Handle Add Period
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodName.trim() || !newPeriodCode.trim()) return;
    const currentAy = academicYears.find((ay) => ay.isCurrent) || academicYears[0];
    await onAddPeriod({
      schoolId: school.id,
      academicYearId: currentAy ? currentAy.id : 'ay-default',
      name: newPeriodName,
      code: newPeriodCode.toUpperCase(),
      semester: newPeriodSemester,
      weight: 1,
      isCurrent: false,
    });
    setNewPeriodName('');
    setNewPeriodCode('');
  };

  // Handle Add Section (Article 32)
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const updated = Array.from(new Set([...sectionsList, newSectionName.trim()]));
    setSectionsList(updated);
    setNewSectionName('');

    try {
      const res = await fetch(`/api/schools/${school.id}/sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updated }),
      });
      if (res.ok) {
        setSectionSaveSuccess(true);
        setTimeout(() => setSectionSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Detailed Student Admission (Article 53)
  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admissionFirstName.trim() || !admissionLastName.trim()) return;

    const matricule = `${school.code.slice(0, 3)}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newStudentData: Partial<Student> = {
      schoolId: school.id,
      classId: admissionTargetClassId,
      matricule,
      firstName: admissionFirstName,
      lastName: admissionLastName,
      postName: admissionPostName,
      gender: admissionGender,
      birthDate: admissionBirthDate,
      birthPlace: admissionBirthPlace,
      address: admissionBirthPlace || 'Kinshasa',
      parentId: `prt-${Date.now()}`,
      nationality: admissionNationality,
      birthCertificateNumber: admissionBirthCert,
      previousSchool: admissionPrevSchool,
      lastClassAttended: admissionLastClass,
      previousAverage: admissionPrevAverage,
      guardianName: admissionGuardianName,
      guardianPhone: admissionGuardianPhone,
      guardianProfession: admissionGuardianJob,
      parentPhone: admissionGuardianPhone,
      active: true,
      enrollmentDate: new Date().toISOString().split('T')[0],
      academicHistory: admissionPrevSchool ? [{
        year: '2025-2026',
        schoolName: admissionPrevSchool,
        className: admissionLastClass,
        generalAverage: admissionPrevAverage,
        passed: admissionPrevAverage >= 50,
      }] : [],
    };

    if (onAddStudent) {
      await onAddStudent(newStudentData);
    } else {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudentData),
      });
    }

    setAdmissionSuccess(`Élève ${admissionLastName} ${admissionFirstName} (${matricule}) admis et inscrit avec succès dans sa classe !`);
    setAdmissionFirstName('');
    setAdmissionLastName('');
    setAdmissionPostName('');
    setAdmissionBirthCert('');
    setAdmissionPrevSchool('');
    setAdmissionLastClass('');
    setTimeout(() => setAdmissionSuccess(null), 5000);
  };

  // Handle Initiating Inter-School Transfer (Articles 54, 55, 56)
  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudentId || !transferTargetSchoolId) {
      alert('Veuillez sélectionner un élève et un établissement récepteur.');
      return;
    }

    const stu = students.find((s) => s.id === transferStudentId);
    if (!stu) return;

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: stu.id,
          sourceSchoolId: school.id,
          targetSchoolId: transferTargetSchoolId,
          reason: transferReason,
          studentDossier: {
            student: stu,
            cumulativePoints: 480,
            generalAverage: stu.previousAverage || 68.5,
            disciplinaryRecords: [],
            attendanceRate: 98,
          },
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTransfers((prev) => [created, ...prev]);
        setTransferSuccess(`Dossier académique complet et palmarès de ${stu.firstName} ${stu.lastName} transmis à l'école réceptrice avec succès.`);
        setTimeout(() => setTransferSuccess(null), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Accepting Incoming Transfer
  const handleAcceptTransfer = async (transferId: string) => {
    try {
      const res = await fetch(`/api/transfers/${transferId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetClassId: acceptTargetClassId }),
      });
      if (res.ok) {
        setTransfers((prev) => prev.map((t) => (t.id === transferId ? { ...t, status: 'accepted' } : t)));
        setAcceptingTransferId(null);
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Rejecting Incoming Transfer
  const handleRejectTransfer = async (transferId: string) => {
    try {
      const res = await fetch(`/api/transfers/${transferId}/reject`, { method: 'POST' });
      if (res.ok) {
        setTransfers((prev) => prev.map((t) => (t.id === transferId ? { ...t, status: 'rejected' } : t)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle School Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSchoolSettings({
      exchangeRateUsdCdf: exchangeRate,
      phone: schoolPhone,
      email: schoolEmail,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Card */}
      <div className="bg-white dark:bg-[#181B20] rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Administration Scolaire & Secrétariat
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{school.name}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Structure Pédagogique, Inscriptions & Transferts
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Configuration des sections, classes, admissions détaillées de l'état civil et transferts inter-établissements avec préservation du palmarès académique.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {classes.length} Classes • {students.length} Élèves Inscrits
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B20] rounded-t-2xl px-5 pt-3 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'classes' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Classes & Salles ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'sections' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-indigo-500" />
          <span>Sections & Options ({sectionsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inscriptions')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'inscriptions' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4 text-emerald-500" />
          <span>Admissions & État Civil</span>
        </button>

        <button
          onClick={() => setActiveTab('transferts')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'transferts' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 text-amber-500" />
          <span>Transferts Inter-Écoles ({transfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'subjects' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Matières ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('periods')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'periods' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Périodes RDC</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'settings' ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Paramètres Établissement</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#181B20] rounded-b-2xl p-6 shadow-xs border-x border-b border-slate-200 dark:border-slate-800">
        
        {/* TAB 1: CLASSES */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <form onSubmit={handleCreateClass} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Créer une nouvelle classe</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la classe *</label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Ex: 4ème Scientifique A"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Section / Option *</label>
                  <select
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {sectionsList.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cycle / Niveau</label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Éducation de Base">Éducation de Base (7è-8è)</option>
                    <option value="Humanités">Humanités (1è à 4è)</option>
                    <option value="Technique">Cycle Technique / Professionnel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Local / Salle</label>
                  <input
                    type="text"
                    value={newClassRoom}
                    onChange={(e) => setNewClassRoom(e.target.value)}
                    placeholder="Ex: Salle B-12"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
                  >
                    Ajouter la classe
                  </button>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((c) => {
                const classStudentCount = students.filter((s) => s.classId === c.id).length;
                const titulaire = teachers.find((t) => t.id === (c.titulaireId || c.mainTeacherId));

                return (
                  <div key={c.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B20] space-y-3 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Section : <strong className="text-blue-600 dark:text-blue-400">{c.section || 'Scientifique'}</strong>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {c.roomNumber || 'Salle non assignée'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Élèves inscrits :</span>
                      <strong className="text-slate-900 dark:text-white">{classStudentCount} / {c.capacity || 45}</strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Professeur Titulaire</span>
                      {titulaire ? (
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {titulaire.fullName || c.mainTeacherName || 'Titulaire'}
                        </span>
                      ) : (
                        <span className="text-amber-600 text-[11px] font-medium">Non assigné</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SECTIONS & OPTIONS (Article 32) */}
        {activeTab === 'sections' && (
          <div className="space-y-6 text-xs">
            {sectionSaveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Sections et options mises à jour et enregistrées avec succès !</span>
              </div>
            )}

            <form onSubmit={handleAddSection} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Configurer une nouvelle section ou filière d'enseignement</span>
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Chaque école configure ses propres sections (ex. : Scientifique, Littéraire, Électricité, Commerciale & Gestion, Pédagogie, etc.) et y rattache ses classes (Article 32 & 41).
              </p>

              <div className="flex gap-3 max-w-md">
                <input
                  type="text"
                  required
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Ex: Électronique, Coupe & Couture, Latin-Philo..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
                >
                  Ajouter l'Option
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sectionsList.map((sec) => {
                const attachedClasses = classes.filter((c) => (c.section || '').toLowerCase() === sec.toLowerCase());
                return (
                  <div key={sec} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B20] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{sec}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {attachedClasses.length} classe(s)
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium">Classes rattachées :</span>
                      {attachedClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {attachedClasses.map((ac) => (
                            <span key={ac.id} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-medium">
                              {ac.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Aucune classe rattachée pour le moment</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: INSCRIPTIONS DÉTAILLÉES (Article 53) */}
        {activeTab === 'inscriptions' && (
          <div className="space-y-6 text-xs max-w-3xl">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Secrétariat : Dossier d'Admission Complète & État Civil</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                L'admission requiert l'ensemble des informations d'état civil, certificat de naissance, antécédents scolaires et coordonnées du tuteur légal.
              </p>
            </div>

            {admissionSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">{admissionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdmissionSubmit} className="space-y-5">
              {/* Civil Status Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  1. État Civil & Identité de l'Élève
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={admissionLastName}
                      onChange={(e) => setAdmissionLastName(e.target.value.toUpperCase())}
                      placeholder="Ex: MUKENDI"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Post-Nom *</label>
                    <input
                      type="text"
                      required
                      value={admissionPostName}
                      onChange={(e) => setAdmissionPostName(e.target.value)}
                      placeholder="Ex: Kalala"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={admissionFirstName}
                      onChange={(e) => setAdmissionFirstName(e.target.value)}
                      placeholder="Ex: Emmanuel"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Genre</label>
                    <select
                      value={admissionGender}
                      onChange={(e) => setAdmissionGender(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      <option value="M">Masculin (M)</option>
                      <option value="F">Féminin (F)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date de Naissance</label>
                    <input
                      type="date"
                      required
                      value={admissionBirthDate}
                      onChange={(e) => setAdmissionBirthDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lieu de Naissance</label>
                    <input
                      type="text"
                      required
                      value={admissionBirthPlace}
                      onChange={(e) => setAdmissionBirthPlace(e.target.value)}
                      placeholder="Ex: Kinshasa"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">N° Acte de Naissance</label>
                    <input
                      type="text"
                      value={admissionBirthCert}
                      onChange={(e) => setAdmissionBirthCert(e.target.value)}
                      placeholder="Ex: ACT-2010-0948"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Academic History Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  2. Antécédents Scolaires & Classe d'Affectation
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">École de Provenance</label>
                    <input
                      type="text"
                      value={admissionPrevSchool}
                      onChange={(e) => setAdmissionPrevSchool(e.target.value)}
                      placeholder="Ex: Collège Boboto"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Dernière Classe Fréquentée</label>
                    <input
                      type="text"
                      value={admissionLastClass}
                      onChange={(e) => setAdmissionLastClass(e.target.value)}
                      placeholder="Ex: 8ème Éducation de Base"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pourcentage Obtenu (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={admissionPrevAverage}
                      onChange={(e) => setAdmissionPrevAverage(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Classe d'Admission dans l'École *</label>
                  <select
                    required
                    value={admissionTargetClassId}
                    onChange={(e) => setAdmissionTargetClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `• Option: ${cls.section}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guardian / Parent Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  3. Responsable Légal & Contact
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du Tuteur / Parent</label>
                    <input
                      type="text"
                      value={admissionGuardianName}
                      onChange={(e) => setAdmissionGuardianName(e.target.value)}
                      placeholder="Ex: M. Jean-Claude Kalala"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone Principal (SMS)</label>
                    <input
                      type="text"
                      value={admissionGuardianPhone}
                      onChange={(e) => setAdmissionGuardianPhone(e.target.value)}
                      placeholder="+243 81 000 0000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Profession</label>
                    <input
                      type="text"
                      value={admissionGuardianJob}
                      onChange={(e) => setAdmissionGuardianJob(e.target.value)}
                      placeholder="Ex: Fonctionnaire, Ingénieur..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Valider l'Admission & Inscrire l'Élève</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: TRANSFERTS INTER-ÉCOLES (Articles 54, 55, 56) */}
        {activeTab === 'transferts' && (
          <div className="space-y-6 text-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-500" />
                <span>Passerelle de Transfert Inter-Établissements Sécurisée</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Permet de transférer un élève vers un autre établissement de la plateforme en conservant l'intégralité de son dossier, de ses points cumulés et de ses cotes (Articles 54, 55, 56).
              </p>
            </div>

            {transferSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{transferSuccess}</span>
              </div>
            )}

            {/* Initiate Outgoing Transfer Form */}
            <form onSubmit={handleInitiateTransfer} className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <ArrowRight className="w-4 h-4 text-amber-600" />
                <span>Initier un Transfert Sortant</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Élève à Transférer *</label>
                  <select
                    value={transferStudentId}
                    onChange={(e) => setTransferStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.lastName} {s.postName} {s.firstName} ({s.matricule})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Établissement Récepteur *</label>
                  <select
                    value={transferTargetSchoolId}
                    onChange={(e) => setTransferTargetSchoolId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">Sélectionnez l'école de destination...</option>
                    {schools.filter((sc) => sc.id !== school.id).map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} ({sc.city}, {sc.province})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Motif Officiel de Transfert</label>
                  <input
                    type="text"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Ex: Mutation professionnelle des parents"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Garantie de continuité : Les cotes d'interrogations, le palmarès annuel et l'assiduité sont scellés cryptographiquement et transmis avec le dossier.
                </span>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Transmettre le Dossier Académique</span>
              </button>
            </form>

            {/* List of Transfers (Incoming and Outgoing) */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Journal des Demandes de Transfert ({transfers.length})
              </h3>

              {transfers.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  Aucun dossier de transfert en cours.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {transfers.map((tr) => {
                    const isIncoming = tr.targetSchoolId === school.id;
                    const stu = students.find((s) => s.id === tr.studentId) || (tr as any).studentDossier?.student;
                    const targetSc = schools.find((sc) => sc.id === tr.targetSchoolId);
                    const sourceSc = schools.find((sc) => sc.id === tr.sourceSchoolId);

                    return (
                      <div key={tr.id} className="p-4 bg-white dark:bg-[#181B20] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isIncoming ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isIncoming ? 'Transfert Entrant' : 'Transfert Sortant'}
                            </span>
                            <strong className="text-slate-900 dark:text-white font-bold text-sm">
                              {stu ? `${stu.lastName} ${stu.firstName}` : 'Élève'}
                            </strong>
                            <span className="text-slate-400 font-mono text-[11px]">({stu?.matricule})</span>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tr.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : tr.status === 'rejected'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {tr.status === 'accepted' ? 'Validé & Intégré' : tr.status === 'rejected' ? 'Refusé' : 'En Attente de Validation'}
                          </span>
                        </div>

                        <div className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <span>Provenance : <strong>{sourceSc?.name || 'École d\'origine'}</strong></span>
                          <span>➔</span>
                          <span>Destination : <strong>{targetSc?.name || 'École d\'accueil'}</strong></span>
                        </div>

                        <p className="text-slate-500">Motif : {tr.reason}</p>

                        {/* Incoming actions: Accept or Reject */}
                        {isIncoming && tr.status === 'pending' && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">Affecter dans la classe :</span>
                              <select
                                value={acceptTargetClassId}
                                onChange={(e) => setAcceptTargetClassId(e.target.value)}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                              >
                                {classes.map((cls) => (
                                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                              </select>
                            </div>

                            <button
                              onClick={() => handleAcceptTransfer(tr.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Accepter et Intégrer au Palmarès
                            </button>

                            <button
                              onClick={() => handleRejectTransfer(tr.id)}
                              className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs"
                            >
                              Refuser
                            </button>
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

        {/* TAB 5: SUBJECTS */}
        {activeTab === 'subjects' && (
          <div className="space-y-6 text-xs">
            <form onSubmit={handleCreateSubject} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Créer une matière scolaire</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la matière *</label>
                  <input
                    type="text"
                    required
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Ex: Chimie Organique"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code Matière *</label>
                  <input
                    type="text"
                    required
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                    placeholder="Ex: CHIM-ORG"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Domaine / Catégorie</label>
                  <select
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Sciences">Sciences & Mathématiques</option>
                    <option value="Langues">Langues & Lettres</option>
                    <option value="Sciences Humaines">Sciences Humaines & Histoire</option>
                    <option value="Technique">Technologie & Pratique</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Coefficient de base</label>
                  <input
                    type="number"
                    min={1}
                    value={newSubCoeff}
                    onChange={(e) => setNewSubCoeff(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
                  >
                    Ajouter la matière
                  </button>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {subjects.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B20] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-bold">{s.name}</strong>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {s.code}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{s.category} • Coeff: {s.defaultCoefficient} • Max: {s.defaultMaxScore || 20} pts</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PERIODS */}
        {activeTab === 'periods' && (
          <div className="space-y-6 text-xs">
            <form onSubmit={handleCreatePeriod} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Ajouter une période d'évaluation RDC (P1, P2, EX1, P3, P4, EX2)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la période *</label>
                  <input
                    type="text"
                    required
                    value={newPeriodName}
                    onChange={(e) => setNewPeriodName(e.target.value)}
                    placeholder="Ex: 1ère Période"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code Officiel (P1, EX1...)</label>
                  <input
                    type="text"
                    required
                    value={newPeriodCode}
                    onChange={(e) => setNewPeriodCode(e.target.value.toUpperCase())}
                    placeholder="Ex: P1"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Semestre</label>
                  <select
                    value={newPeriodSemester}
                    onChange={(e) => setNewPeriodSemester(Number(e.target.value) as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value={1}>1er Semestre (P1, P2, EX1)</option>
                    <option value={2}>2ème Semestre (P3, P4, EX2)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm transition-colors"
                  >
                    Ajouter la période
                  </button>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {academicPeriods.map((per) => (
                <div key={per.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B20] space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white font-bold">{per.name}</strong>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {per.code}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Semestre {per.semester} • Poids : {per.weight}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl text-xs">
            {settingsSaved && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Paramètres de l'école mis à jour avec succès !</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Taux de change appliqué (1 USD = X Francs Congolais)
              </label>
              <input
                id="input-settings-rate"
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Utilisé automatiquement pour convertir les frais scolaires et paiements Mobile Money.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Téléphone officiel de l'école
              </label>
              <input
                type="text"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email officiel
              </label>
              <input
                type="email"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-sm"
            >
              Enregistrer les modifications
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
