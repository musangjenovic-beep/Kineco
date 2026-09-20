export type UserRole =
  | 'super_admin'
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
  birthPlace: string;
  address: string;
  classId: string;
  parentId: string;
  photoUrl?: string;
  active: boolean;
  registrationDate: string;
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
  phone: string;
  email: string;
  specialty: string;
  assignedClasses: string[]; // classIds
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
  date: string;
  category: 'Retard répété' | 'Absence injustifiée' | 'Indiscipline' | 'Bagarre' | 'Uniforme non conforme' | 'Autre';
  description: string;
  severity: 'Faible' | 'Modéré' | 'Grave';
  sanction: string;
  parentNotified: boolean;
  recordedBy: string;
  recordedAt: string;
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
