import { useState, useEffect } from 'react';
import {
  School,
  Student,
  SchoolClass,
  Subject,
  Teacher,
  Parent,
  AcademicYear,
  AcademicPeriod,
  Grade,
  FeeDefinition,
  PaymentRecord,
  AttendanceRecord,
  DisciplineIncident,
  Announcement,
  SmsLog,
  UserRole,
  BulletinData,
  UserSession,
} from './types';

import { Header, TeacherTabType } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { TeacherProfileView } from './components/TeacherProfileView';
import { BulletinOfficielModal } from './components/BulletinOfficielModal';
import { RecuPaiementModal } from './components/RecuPaiementModal';
import { SmsModuleModal } from './components/SmsModuleModal';
import { SupabaseSqlViewer } from './components/SupabaseSqlViewer';
import { NewSchoolModal } from './components/NewSchoolModal';
import { LoginPage } from './components/LoginPage';
import { UserManagementView } from './components/UserManagementView';

import { SuperAdminView } from './components/SuperAdminView';
import { DirecteurDashboard } from './components/DirecteurDashboard';
import { AdminScolaireView } from './components/AdminScolaireView';
import { DirecteurEtudesView } from './components/DirecteurEtudesView';
import { DisciplineView } from './components/DisciplineView';
import { ComptableFinancialView } from './components/ComptableFinancialView';
import { EnseignantView } from './components/EnseignantView';
import { ParentView } from './components/ParentView';

const INITIAL_DEFAULT_SCHOOL: School = {
  id: 'd8cd16f2-bafc-4425-b96c-c988773cfefb',
  name: 'Collège Bobokoli',
  code: 'BOB-KIN',
  city: 'Kinshasa',
  province: 'Kinshasa',
  address: 'Avenue de la Montagne 45, Binza Delvaux, Ngaliema',
  phone: '+243 81 500 1234',
  email: 'contact@bobokoli.cd',
  logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&auto=format&fit=crop&q=80',
  currencyDefault: 'USD',
  exchangeRateUsdCdf: 2850,
  plan: 'Premium',
  active: true,
  createdAt: new Date().toISOString(),
};

const safeFetchJson = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    console.warn(`Safe fetch fallback for ${url}:`, err);
    return [];
  }
};

export default function App() {
  // Session Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('edukin_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse stored session:', e);
    }
    return null;
  });

  // Role & Tenant Context State
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return currentUser?.role || 'enseignant';
  });
  const [schools, setSchools] = useState<School[]>([INITIAL_DEFAULT_SCHOOL]);
  const [currentSchool, setCurrentSchool] = useState<School>(INITIAL_DEFAULT_SCHOOL);

  // Core Data
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [fees, setFees] = useState<FeeDefinition[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [incidents, setIncidents] = useState<DisciplineIncident[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [bulletinStudentId, setBulletinStudentId] = useState<string | null>(null);
  const [bulletinData, setBulletinData] = useState<BulletinData | null>(null);
  const [receiptModalPayment, setReceiptModalPayment] = useState<PaymentRecord | null>(null);
  const [receiptModalStudent, setReceiptModalStudent] = useState<Student | null>(null);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isNewSchoolModalOpen, setIsNewSchoolModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [teacherActiveTab, setTeacherActiveTab] = useState<TeacherTabType>('classes');
  const [teacherUnreadMessages, setTeacherUnreadMessages] = useState<number>(0);

  // Real Dark Mode State synced with DOM and localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('masomo_theme');
    if (saved) return saved === 'dark';
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('masomo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('masomo_theme', 'light');
    }
  }, [isDarkMode]);

  // Handle Login and Logout
  const handleLoginSuccess = (session: UserSession) => {
    setCurrentUser(session);
    setCurrentRole(session.role);
    if (session.schoolId) {
      const match = schools.find((s) => s.id === session.schoolId);
      if (match) setCurrentSchool(match);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('edukin_session');
    setCurrentUser(null);
    setIsUserManagementOpen(false);
  };

  // Load official bulletin when student selected
  useEffect(() => {
    if (!bulletinStudentId || !currentSchool) {
      setBulletinData(null);
      return;
    }
    fetch(`/api/bulletins/${bulletinStudentId}?schoolId=${currentSchool.id}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Bulletin introuvable');
      })
      .then((data: BulletinData) => setBulletinData(data))
      .catch((err) => {
        console.error('Erreur chargement bulletin:', err);
        setBulletinData(null);
      });
  }, [bulletinStudentId, currentSchool]);

  // Fetch initial schools list
  useEffect(() => {
    fetch('/api/schools')
      .then((res) => res.json())
      .then((data: School[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSchools(data);
          setCurrentSchool(data[0]);
        }
      })
      .catch((err) => console.error('Failed to fetch schools:', err));
  }, []);

  // Fetch data whenever currentSchool changes
  useEffect(() => {
    if (!currentSchool) return;

    setIsLoading(true);
    const sid = currentSchool.id;

    Promise.all([
      safeFetchJson(`/api/students?schoolId=${sid}`),
      safeFetchJson(`/api/classes?schoolId=${sid}`),
      safeFetchJson(`/api/subjects?schoolId=${sid}`),
      safeFetchJson(`/api/teachers?schoolId=${sid}`),
      safeFetchJson(`/api/parents?schoolId=${sid}`),
      safeFetchJson(`/api/academic-years?schoolId=${sid}`),
      safeFetchJson(`/api/academic-periods?schoolId=${sid}`),
      safeFetchJson(`/api/grades?schoolId=${sid}`),
      safeFetchJson(`/api/fees?schoolId=${sid}`),
      safeFetchJson(`/api/payments?schoolId=${sid}`),
      safeFetchJson(`/api/attendance?schoolId=${sid}`),
      safeFetchJson(`/api/incidents?schoolId=${sid}`),
      safeFetchJson(`/api/announcements?schoolId=${sid}`),
      safeFetchJson(`/api/sms-logs?schoolId=${sid}`),
    ])
      .then(
        ([
          studs,
          cls,
          subs,
          tchs,
          pts,
          ays,
          aps,
          grds,
          fss,
          pys,
          atts,
          incs,
          ancs,
          smsl,
        ]) => {
          setStudents(studs);
          setClasses(cls);
          setSubjects(subs);
          setTeachers(tchs);
          setParents(pts);
          setAcademicYears(ays);
          setAcademicPeriods(aps);
          setGrades(grds);
          setFees(fss);
          setPayments(pys);
          setAttendance(atts);
          setIncidents(incs);
          setAnnouncements(ancs);
          setSmsLogs(smsl);
          setIsLoading(false);
        }
      )
      .catch((err) => {
        console.error('Failed to load school data:', err);
        setIsLoading(false);
      });
  }, [currentSchool?.id]);

  // Actions / Mutations
  const handleCreateSchool = async (schoolData: Omit<School, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolData),
    });
    const newSchool = await res.json();
    setSchools((prev) => [newSchool, ...prev]);
    setCurrentSchool(newSchool);
  };

  const handleAddClass = async (classData: Omit<SchoolClass, 'id' | 'schoolId'>) => {
    if (!currentSchool) return;
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...classData, schoolId: currentSchool.id }),
    });
    const created = await res.json();
    setClasses((prev) => [...prev, created]);
  };

  const handleAssignTitulaire = async (classId: string, teacherId: string) => {
    if (!currentSchool) return;
    const res = await fetch(`/api/classes/${classId}/titulaire`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: currentSchool.id,
        teacherId,
        updatedBy: currentUser?.fullName || 'Directeur',
      }),
    });
    if (res.ok) {
      const updatedClass = await res.json();
      setClasses((prev) => prev.map((c) => (c.id === classId ? updatedClass : c)));
    }
  };

  const handleAddSubject = async (subjectData: Omit<Subject, 'id' | 'schoolId'>) => {
    if (!currentSchool) return;
    const res = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...subjectData, schoolId: currentSchool.id }),
    });
    const created = await res.json();
    setSubjects((prev) => [...prev, created]);
  };

  const handleAddPeriod = async (periodData: Omit<AcademicPeriod, 'id'>) => {
    const res = await fetch('/api/academic-periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(periodData),
    });
    const created = await res.json();
    setAcademicPeriods((prev) => [...prev, created]);
  };

  const handleUpdateSchoolSettings = async (updates: Partial<School>) => {
    if (!currentSchool) return;
    const res = await fetch(`/api/schools/${currentSchool.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const updated = await res.json();
    setCurrentSchool(updated);
    setSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleSaveGrade = async (gradeData: Omit<Grade, 'id' | 'schoolId' | 'gradedAt' | 'gradedBy'>) => {
    if (!currentSchool) return;
    const res = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...gradeData,
        schoolId: currentSchool.id,
        gradedBy: 'Professeur Titulaire',
      }),
    });
    const saved = await res.json();
    setGrades((prev) => {
      const idx = prev.findIndex(
        (g) =>
          g.studentId === saved.studentId &&
          g.subjectId === saved.subjectId &&
          (g.periodId === (saved.periodId || saved.academicPeriodId) || g.academicPeriodId === (saved.periodId || saved.academicPeriodId))
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleMarkAttendance = async (
    studentId: string,
    classId: string,
    status: AttendanceRecord['status'],
    note?: string,
    customDate?: string
  ) => {
    if (!currentSchool) return;
    const date = customDate || new Date().toISOString().split('T')[0];
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: currentSchool.id,
        studentId,
        classId,
        date,
        status,
        note: note || '',
        recordedBy: currentUser?.fullName || 'Professeur',
      }),
    });
    const record = await res.json();
    setAttendance((prev) => {
      const filtered = prev.filter((a) => !(a.studentId === studentId && a.date === date));
      return [record, ...filtered];
    });
  };

  const handleSaveAttendanceBatch = async (
    classId: string,
    date: string,
    records: { studentId: string; status: AttendanceRecord['status']; justification?: string }[],
    recordedBy?: string
  ) => {
    if (!currentSchool) return;
    const res = await fetch('/api/attendance/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: currentSchool.id,
        classId,
        date,
        records,
        recordedBy: recordedBy || currentUser?.fullName || 'Professeur',
      }),
    });
    const data = await res.json();
    if (data.records && Array.isArray(data.records)) {
      const studentIds = new Set(records.map((r) => r.studentId));
      setAttendance((prev) => {
        const filtered = prev.filter((a) => !(studentIds.has(a.studentId) && a.date === date));
        return [...data.records, ...filtered];
      });
      // Refresh SMS logs in case absence alerts were dispatched
      fetch(`/api/sms-logs?schoolId=${currentSchool.id}`)
        .then((r) => r.json())
        .then((logs) => setSmsLogs(logs))
        .catch(() => {});
    }
  };

  const handleSaveGradesBatch = async (
    classId: string,
    subjectId: string,
    periodId: string,
    gradesList: { studentId: string; score: number; maxScore: number; coefficient: number }[],
    status: 'draft' | 'published',
    recordedBy?: string
  ) => {
    if (!currentSchool) return;
    const res = await fetch('/api/grades/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: currentSchool.id,
        classId,
        subjectId,
        periodId,
        grades: gradesList,
        status,
        recordedBy: recordedBy || currentUser?.fullName || 'Professeur',
      }),
    });
    const data = await res.json();
    if (data.records && Array.isArray(data.records)) {
      setGrades((prev) => {
        const nextGrades = [...prev];
        for (const saved of data.records) {
          const idx = nextGrades.findIndex(
            (g) =>
              g.studentId === saved.studentId &&
              g.subjectId === saved.subjectId &&
              (g.periodId === (saved.periodId || saved.academicPeriodId) ||
                g.academicPeriodId === (saved.periodId || saved.academicPeriodId))
          );
          if (idx >= 0) {
            nextGrades[idx] = saved;
          } else {
            nextGrades.push(saved);
          }
        }
        return nextGrades;
      });
    }
  };

  const handleRecordPayment = async (
    data: Omit<PaymentRecord, 'id' | 'schoolId' | 'receiptNumber' | 'status' | 'createdAt'>
  ): Promise<PaymentRecord> => {
    if (!currentSchool) throw new Error('No active school');
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        schoolId: currentSchool.id,
      }),
    });
    const record: PaymentRecord = await res.json();
    setPayments((prev) => [record, ...prev]);

    // Also refresh SMS logs if SMS receipt was generated
    fetch(`/api/sms-logs?schoolId=${currentSchool.id}`)
      .then((r) => r.json())
      .then((logs) => setSmsLogs(logs))
      .catch(() => {});

    return record;
  };

  const handleAddFee = async (feeData: Omit<FeeDefinition, 'id' | 'schoolId'>) => {
    if (!currentSchool) return;
    const res = await fetch('/api/fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...feeData,
        schoolId: currentSchool.id,
      }),
    });
    const created = await res.json();
    setFees((prev) => [...prev, created]);
  };

  const handleAddIncident = async (
    data: Omit<DisciplineIncident, 'id' | 'schoolId' | 'recordedAt'>
  ) => {
    if (!currentSchool) return;
    const res = await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        schoolId: currentSchool.id,
      }),
    });
    const record = await res.json();
    setIncidents((prev) => [record, ...prev]);

    // Refresh SMS if parent was notified
    if (data.parentNotified) {
      fetch(`/api/sms-logs?schoolId=${currentSchool.id}`)
        .then((r) => r.json())
        .then((logs) => setSmsLogs(logs))
        .catch(() => {});
    }
  };

  const handleSendSms = async (
    phone: string,
    recipientName: string,
    message: string,
    category: SmsLog['category']
  ) => {
    if (!currentSchool) return;
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: currentSchool.id,
        recipientPhone: phone,
        recipientName,
        message,
        category,
      }),
    });
    const log = await res.json();
    setSmsLogs((prev) => [log, ...prev]);
  };

  const handlePayOnlineByParent = async (
    studentId: string,
    feeId: string,
    amountUSD: number,
    method: PaymentRecord['paymentMethod']
  ) => {
    if (!currentSchool) return;
    const student = students.find((s) => s.id === studentId);
    const rate = currentSchool.exchangeRateUsdCdf;
    const record = await handleRecordPayment({
      studentId,
      feeId,
      amountUSD,
      amountCDF: amountUSD * rate,
      currency: 'USD',
      paymentMethod: method,
      transactionReference: `ONLINE-${Date.now()}`,
      payerName: student ? `${student.lastName} Parent` : 'Parent',
      payerPhone: '+243 82 444 9901',
      recordedBy: 'Portail Mobile Money Parents',
    });

    if (student) {
      setReceiptModalPayment(record);
      setReceiptModalStudent(student);
    }
  };

  // Target student for Bulletin
  const bulletinStudent = students.find((s) => s.id === bulletinStudentId) || null;
  const bulletinClass = classes.find((c) => c.id === bulletinStudent?.classId) || null;

  // Unauthenticated: Show Secure Login Page with Role Demos
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (!currentSchool && isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Initialisation d'EduKin RDC & Chargement des Établissements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors">
      {/* Sleek Modern Collapsible Sidebar strictly for Teacher role */}
      {currentSchool && currentRole === 'enseignant' && (
        <SidebarNav
          activeTab={teacherActiveTab}
          onSelectTab={(tab) => setTeacherActiveTab(tab)}
          unreadMessagesCount={teacherUnreadMessages}
          isTitulaire={true}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          currentUser={currentUser}
          currentRole={currentRole}
          classes={classes}
          onSelectClass={() => setTeacherActiveTab('classes')}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onLogout={handleLogout}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        {currentSchool && (
          <Header
            userName={currentUser?.fullName || 'Professeur'}
            userRole={currentRole}
            isMenuOpen={isMobileSidebarOpen}
            onToggleMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content Area depending on Role */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {currentSchool && (
          <>
            {isUserManagementOpen ? (
              <UserManagementView
                currentSchool={currentSchool}
                currentUserRole={currentRole}
                currentUserId={currentUser?.id}
                onClose={() => setIsUserManagementOpen(false)}
              />
            ) : (
              <>
                {/* SUPER ADMIN ROLE */}
                {currentRole === 'super_admin' && (
                  <SuperAdminView
                    schools={schools}
                    onOpenNewSchoolModal={() => setIsNewSchoolModalOpen(true)}
                    onSelectSchool={(school) => setCurrentSchool(school)}
                    currentSchool={currentSchool}
                    onOpenUserManagement={() => setIsUserManagementOpen(true)}
                  />
                )}

                {/* DIRECTEUR GENERAL ROLE */}
                {currentRole === 'directeur' && (
                  <DirecteurDashboard
                    school={currentSchool}
                    students={students}
                    classes={classes}
                    teachers={teachers}
                    attendance={attendance}
                    announcements={announcements}
                    onOpenBulletinForStudent={(stuId) => setBulletinStudentId(stuId)}
                    onOpenUserManagement={() => setIsUserManagementOpen(true)}
                    onAssignTitulaire={handleAssignTitulaire}
                  />
                )}

                {/* ADMINISTRATEUR SCOLAIRE ROLE */}
                {currentRole === 'admin_scolaire' && (
                  <AdminScolaireView
                    school={currentSchool}
                    classes={classes}
                    subjects={subjects}
                    teachers={teachers}
                    academicYears={academicYears}
                    academicPeriods={academicPeriods}
                    students={students}
                    parents={parents}
                    onAddClass={handleAddClass}
                    onAddSubject={handleAddSubject}
                    onAddPeriod={handleAddPeriod}
                    onUpdateSchoolSettings={handleUpdateSchoolSettings}
                    onAssignTitulaire={handleAssignTitulaire}
                  />
                )}

                {/* DIRECTEUR DES ÉTUDES ROLE */}
                {currentRole === 'directeur_etudes' && (
                  <DirecteurEtudesView
                    school={currentSchool}
                    classes={classes}
                    subjects={subjects}
                    students={students}
                    grades={grades}
                    academicPeriods={academicPeriods}
                    onOpenBulletin={(stuId) => setBulletinStudentId(stuId)}
                  />
                )}

                {/* DIRECTEUR DE DISCIPLINE ROLE */}
                {currentRole === 'directeur_discipline' && (
                  <DisciplineView
                    school={currentSchool}
                    students={students}
                    incidents={incidents}
                    attendance={attendance}
                    onAddIncident={handleAddIncident}
                    onSendSmsAlert={async (phone, name, msg) => {
                      await handleSendSms(phone, name, msg, 'discipline');
                    }}
                  />
                )}

                {/* COMPTABLE / CAISSIER ROLE */}
                {currentRole === 'comptable' && (
                  <ComptableFinancialView
                    school={currentSchool}
                    students={students}
                    classes={classes}
                    fees={fees}
                    payments={payments}
                    onRecordPayment={handleRecordPayment}
                    onAddFee={handleAddFee}
                    onOpenReceiptModal={(pmt, stu) => {
                      setReceiptModalPayment(pmt);
                      setReceiptModalStudent(stu);
                    }}
                  />
                )}

                {/* ENSEIGNANT ROLE */}
                {currentRole === 'enseignant' && (
                  teacherActiveTab === 'profil' ? (
                    <TeacherProfileView
                      currentUser={currentUser}
                      currentSchool={currentSchool}
                      classes={classes}
                      subjects={subjects}
                      teachers={teachers}
                      onBackToClasses={() => setTeacherActiveTab('classes')}
                      onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
                    />
                  ) : (
                    <EnseignantView
                      school={currentSchool}
                      classes={classes}
                      subjects={subjects}
                      students={students}
                      grades={grades}
                      periods={academicPeriods}
                      attendance={attendance}
                      currentUser={currentUser}
                      teachers={teachers}
                      parents={parents}
                      activeTab={teacherActiveTab as any}
                      onTabChange={(tab) => setTeacherActiveTab(tab)}
                      onUnreadCountChange={(count) => setTeacherUnreadMessages(count)}
                      onSaveGrade={handleSaveGrade}
                      onSaveGradeBatch={handleSaveGradesBatch}
                      onMarkAttendance={handleMarkAttendance}
                      onSaveAttendanceBatch={handleSaveAttendanceBatch}
                      onSendSmsAlert={async (phone, name, msg) => {
                        await handleSendSms(phone, name, msg, 'information');
                      }}
                    />
                  )
                )}

                {/* PARENT / RESPONSABLE / ELEVE ROLE */}
                {(currentRole === 'parent' || currentRole === 'eleve') && (
                  <ParentView
                    school={currentSchool}
                    students={students}
                    classes={classes}
                    subjects={subjects}
                    grades={grades}
                    payments={payments}
                    incidents={incidents}
                    attendance={attendance}
                    fees={fees}
                    currentUserRole={currentRole}
                    currentUsername={currentUser?.username}
                    onOpenBulletin={(stuId) => setBulletinStudentId(stuId)}
                    onOpenReceipt={(pmt, stu) => {
                      setReceiptModalPayment(pmt);
                      setReceiptModalStudent(stu);
                    }}
                    onPayOnline={handlePayOnlineByParent}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
      </div>

      {/* MODAL 1: Bulletin Officiel EPST RDC */}
      {bulletinData && (
        <BulletinOfficielModal
          bulletin={bulletinData}
          onClose={() => {
            setBulletinData(null);
            setBulletinStudentId(null);
          }}
        />
      )}

      {/* MODAL 2: Reçu de Paiement Officiel */}
      {receiptModalPayment && receiptModalStudent && currentSchool && (
        <RecuPaiementModal
          payment={receiptModalPayment}
          student={receiptModalStudent}
          school={currentSchool}
          onClose={() => {
            setReceiptModalPayment(null);
            setReceiptModalStudent(null);
          }}
        />
      )}

      {/* MODAL 3: Passerelle SMS RDC */}
      {isSmsModalOpen && currentSchool && (
        <SmsModuleModal
          school={currentSchool}
          smsLogs={smsLogs}
          onSendSms={handleSendSms}
          onClose={() => setIsSmsModalOpen(false)}
        />
      )}

      {/* MODAL 4: Schéma Supabase SQL & RLS */}
      {isSupabaseModalOpen && (
        <SupabaseSqlViewer onClose={() => setIsSupabaseModalOpen(false)} />
      )}

      {/* MODAL 5: Nouvel Établissement (Multi-Tenant) */}
      {isNewSchoolModalOpen && (
        <NewSchoolModal
          onCreateSchool={handleCreateSchool}
          onClose={() => setIsNewSchoolModalOpen(false)}
        />
      )}
    </div>
  );
}
