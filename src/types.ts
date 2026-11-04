export type UserRole =
  | 'super_admin'
  | 'cadre_securite'
  | 'cadre_finances'
  | 'cadre_support'
  | 'directeur'
  | 'admin_scolaire'
  | 'directeur_etudes'
  | 'directeur_discipline'
  | 'comptable'
  | 'secretaire'
  | 'surveillant'
  | 'enseignant'
  | 'parent'
  | 'eleve';

export interface School {
  id: string;
  name: string;
  code: string;
  city: string;
  province: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  currencyDefault: 'USD' | 'CDF';
  exchangeRateUsdCdf: number; // e.g. 2850 CDF for 1 USD
  plan: 'Basic' | 'Standard' | 'Premium';
  subscriptionStatus?: 'active' | 'suspended';
  subscriptionExpiresAt?: string;
  sections?: string[]; // Custom pedagogical sections (ex: Scientifique, Littéraire, Électricité, etc.)
  active: boolean;
  createdAt: string;
}

export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string; // e.g. "2025-2026"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface AcademicPeriod {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string; // e.g. "1ère Période", "2ème Période", "Examen 1er Semestre"
  code: string; // "P1", "P2", "EX1", "P3", "P4", "EX2"
  semester: 1 | 2;
  weight: number;
  isCurrent: boolean;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string; // e.g. "7ème Éducation de Base", "8ème EB", "1ère Scientifique A", "4ème Commerciale"
  level: string; // "Cycle Terminal EB", "Humanités"
  section: string; // "Scientifique", "Commerciale & Gestion", "Pédagogique", "Littéraire", "Générale"
  roomNumber?: string;
  capacity: number;
  mainTeacherId?: string;
  mainTeacherName?: string;
  titulaireId?: string;
  titulaireName?: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string; // e.g. "Mathématiques", "Français", "Physique", "Chimie", "Informatique", "Histoire"
  code: string;
  category: 'Sciences' | 'Lettres & Langues' | 'Sciences Humaines' | 'Technique' | 'Autre';
  defaultCoefficient: number;
  defaultMaxScore: number; // e.g. 20, 40 or 50
}

export interface ClassSubject {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  coefficient: number;
  maxScore: number;
  weeklyHours: number;
  locked?: boolean;
}

export interface Student {
  id: string;
  schoolId: string;
  matricule: string; // e.g. "STJ-2026-0041"
  firstName: string;
  lastName: string;
  postName: string; // Typical Congolese naming: Nom, Post-nom, Prénom
  gender: 'M' | 'F';
  birthDate: string;
  dateOfBirth?: string;
  birthPlace: string;
  address: string;
  classId: string;
  parentId: string;
  photoUrl?: string;
  nationality?: string;
  birthCertificateNumber?: string;
  previousSchool?: string;
  lastClassAttended?: string;
  previousAverage?: number;
  guardianName?: string;
  guardianPhone?: string;
  guardianJob?: string;
  guardianProfession?: string;
  parentPhone?: string;
  transferStatus?: 'none' | 'pending' | 'transferred';
  transferTargetSchoolId?: string;
  transferOriginSchoolId?: string;
  transferRequestedAt?: string;
  transferApprovedAt?: string;
  transferHistoryNotes?: string;
  academicHistory?: {
    year: string;
    schoolName: string;
    className: string;
    generalAverage: number;
    passed: boolean;
  }[];
  active: boolean;
  registrationDate: string;
  enrollmentDate?: string;
}

export interface Parent {
  id: string;
  schoolId: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  studentIds: string[];
}

export interface Teacher {
  id: string;
  schoolId: string;
  matricule: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email: string;
  specialty: string;
  assignedClasses: string[]; // classIds
  qualification?: string;
  userId?: string;
  active?: boolean;
}

export interface Staff {
  id: string;
  schoolId: string;
  fullName: string;
  role: UserRole;
  phone: string;
  email: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  classId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'retard' | 'excuse';
  justification?: string;
  recordedBy: string;
  recordedAt: string;
  isLocked?: boolean;
  directionNotified?: boolean;
}

export interface Grade {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  studentId: string;
  periodId: string;
  academicPeriodId?: string;
  score: number;
  maxScore: number;
  coefficient: number;
  evaluationType?: string;
  status: 'draft' | 'published';
  recordedBy?: string;
  recordedAt?: string;
}

export interface DisciplineIncident {
  id: string;
  schoolId: string;
  studentId: string;
  classId?: string;
  section?: string;
  date: string;
  category: 'Retard répété' | 'Absence injustifiée' | 'Indiscipline' | 'Bagarre' | 'Uniforme non conforme' | 'Autre';
  description: string;
  severity: 'Faible' | 'Modéré' | 'Grave';
  sanction: string;
  parentNotified: boolean;
  recordedBy: string;
  recordedAt: string;
  immutableTimestamp?: string; // Locked exact timestamp for "Autres infractions"
  isOther?: boolean;
}

export interface FeeDefinition {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string; // e.g. "Minerval 1er Trimestre", "Frais de Fonctionnement", "Frais d'Examens d'État"
  amountUSD: number;
  amountCDF: number;
  dueDate: string;
  mandatory: boolean;
  targetClassIds?: string[]; // Specific targeted classes (empty/undefined = all classes)
  installmentName?: string; // Tranche: e.g. "Tranche 1", "Acompte", "Solde"
}

export interface PaymentRecord {
  id: string;
  schoolId: string;
  studentId: string;
  feeId: string;
  receiptNumber: string; // e.g. "REC-2026-0038"
  amountUSD: number;
  amountCDF: number;
  currency: 'USD' | 'CDF';
  paymentMethod: 'mpesa' | 'airtel_money' | 'orange_money' | 'cash' | 'banque';
  transactionReference: string;
  status: 'confirmed' | 'pending' | 'failed';
  payerName: string;
  payerPhone: string;
  recordedBy: string;
  createdAt: string;
}

export interface SmsLog {
  id: string;
  schoolId: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  category: 'absence' | 'retard' | 'frais' | 'discipline' | 'bulletin' | 'information';
  status: 'envoyé' | 'délivré' | 'échoué';
  costUSD: number;
  sentAt: string;
}

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  targetRole: 'all' | 'parents' | 'enseignants' | 'eleves';
  priority: 'normal' | 'urgent';
  authorName: string;
  date: string;
}

export interface SchoolMessage {
  id: string;
  schoolId: string;
  senderName: string;
  senderRole: UserRole;
  senderId?: string;
  recipientType: 'classe' | 'parents' | 'administration' | 'direction';
  recipientTargetId?: string; // classId or role
  recipientTargetName: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
  smsSent?: boolean;
}

export interface TeacherScheduleSlot {
  id: string;
  dayOfWeek: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi';
  timeSlot: string; // e.g. "07h30 - 08h25"
  periodNumber: number;
  classId: string;
  subjectId: string;
  room: string;
}

export interface LessonLog {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherName: string;
  date: string;
  title: string;
  summary: string;
  homework?: string;
  homeworkDueDate?: string;
  createdAt: string;
}

export interface GradeCorrectionRequest {
  id: string;
  schoolId: string;
  teacherName: string;
  teacherId?: string;
  classId: string;
  subjectId: string;
  studentId: string;
  periodId: string;
  currentScore: number;
  requestedScore: number;
  proposedScore?: number;
  maxScore: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface ClassAppreciation {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string;
  periodId: string;
  appreciation: string;
  conduct: 'Excellente' | 'Très Bonne' | 'Bonne' | 'Passable' | 'Médiocre';
  updatedBy: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  schoolId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface UserAccount {
  id: string;
  schoolId: string;
  fullName: string;
  username: string; // login identifier (matricule for student, email for staff)
  email?: string;
  phone?: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  studentId?: string; // If role === 'eleve'
  teacherId?: string; // If role === 'enseignant'
  parentId?: string; // If role === 'parent'
  createdBy?: string;
  lastProfileUpdateDate?: string; // Date of last profile change (14-day rule)
  googleLinked?: boolean;
  googleEmail?: string;
}

export interface UserSession {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  schoolId: string;
  schoolName: string;
  studentId?: string; // If role === 'eleve'
  teacherId?: string; // If role === 'enseignant'
  parentStudentIds?: string[]; // If role === 'parent'
  activeStudentId?: string; // Current child selected by parent
  token?: string;
  lastProfileUpdateDate?: string;
  googleLinked?: boolean;
  googleEmail?: string;
}

export interface StudentTransfer {
  id: string;
  studentId: string;
  studentName: string;
  matricule: string;
  sourceSchoolId: string;
  sourceSchoolName: string;
  targetSchoolId: string;
  targetSchoolName: string;
  targetClassId?: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  academicSummary: {
    gradesCount: number;
    generalAverage?: number;
    lastPeriod?: string;
    conduct?: string;
  };
  remarks?: string;
  reason?: string;
}

export interface BulletinSubjectResult {
  subjectName: string;
  category: string;
  coefficient: number;
  maxPeriod: number;
  period1Score?: number;
  period2Score?: number;
  examScore?: number;
  totalSemesterScore?: number;
  maxSemesterTotal?: number;
  percentage?: number;
  appreciation: string;
}

export interface BulletinData {
  school: School;
  academicYear: AcademicYear;
  student: Student;
  schoolClass: SchoolClass;
  period: AcademicPeriod;
  subjectsResults: BulletinSubjectResult[];
  totalScoreObtained: number;
  totalMaxPossible: number;
  generalPercentage: number;
  classRank: number;
  totalStudentsInClass: number;
  conduct: 'Très Bonne' | 'Bonne' | 'Passable' | 'Médiocre';
  application: 'Très Bon' | 'Régulier' | 'Moyen' | 'Insuffisant';
  daysAbsent: number;
  daysLate: number;
  juryDecision: string;
  generatedDate: string;
}
