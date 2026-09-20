import {
  School,
  AcademicYear,
  AcademicPeriod,
  SchoolClass,
  Subject,
  ClassSubject,
  Student,
  Parent,
  Teacher,
  Staff,
  AttendanceRecord,
  Grade,
  DisciplineIncident,
  FeeDefinition,
  PaymentRecord,
  SmsLog,
  Announcement,
  AuditLog,
  BulletinData,
  BulletinSubjectResult,
  UserRole,
  UserSession,
  UserAccount,
  SchoolMessage,
  TeacherScheduleSlot,
  LessonLog,
  GradeCorrectionRequest,
  ClassAppreciation
} from '../src/types.ts';

export interface DbUserAccount extends UserAccount {
  passwordHash: string;
}

// Dynamic dates helper
const now = new Date();
const currentYearNum = now.getFullYear();
const academicYearName = `${currentYearNum}-${currentYearNum + 1}`;
const todayStr = now.toISOString().split('T')[0];

class DatabaseManager {
  private schools: School[] = [];
  private academicYears: AcademicYear[] = [];
  private academicPeriods: AcademicPeriod[] = [];
  private classes: SchoolClass[] = [];
  private subjects: Subject[] = [];
  private classSubjects: ClassSubject[] = [];
  private students: Student[] = [];
  private parents: Parent[] = [];
  private teachers: Teacher[] = [];
  private staff: Staff[] = [];
  private attendance: AttendanceRecord[] = [];
  private grades: Grade[] = [];
  private disciplineIncidents: DisciplineIncident[] = [];
  private fees: FeeDefinition[] = [];
  private payments: PaymentRecord[] = [];
  private smsLogs: SmsLog[] = [];
  private announcements: Announcement[] = [];
  private auditLogs: AuditLog[] = [];
  private userAccounts: DbUserAccount[] = [];
  private schoolMessages: SchoolMessage[] = [];
  private scheduleSlots: TeacherScheduleSlot[] = [];
  private lessonLogs: LessonLog[] = [];
  private gradeCorrections: GradeCorrectionRequest[] = [];
  private classAppreciations: ClassAppreciation[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Écoles initiales (RDC)
    const school1: School = {
      id: 'sch-bobokoli',
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
      createdAt: now.toISOString(),
    };

    const school2: School = {
      id: 'sch-shaumba',
      name: 'Lycée Shaumba',
      code: 'SHM-GOM',
      city: 'Kinshasa',
      province: 'Kinshasa',
      address: 'Boulevard du 30 Juin, Gombe',
      phone: '+243 99 822 5678',
      email: 'direction@lyceeshaumba.cd',
      logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=150&auto=format&fit=crop&q=80',
      currencyDefault: 'USD',
      exchangeRateUsdCdf: 2850,
      plan: 'Standard',
      active: true,
      createdAt: now.toISOString(),
    };

    this.schools.push(school1, school2);

    // 2. Années académiques
    const ayBobokoli: AcademicYear = {
      id: 'ay-bob-current',
      schoolId: school1.id,
      name: academicYearName,
      startDate: `${currentYearNum}-09-01`,
      endDate: `${currentYearNum + 1}-07-02`,
      isCurrent: true,
    };
    this.academicYears.push(ayBobokoli);

    // 3. Périodes scolaires (Conforme système d'évaluation RDC)
    const p1: AcademicPeriod = {
      id: 'per-p1',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: '1ère Période',
      code: 'P1',
      semester: 1,
      weight: 1,
      isCurrent: false,
    };
    const p2: AcademicPeriod = {
      id: 'per-p2',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: '2ème Période',
      code: 'P2',
      semester: 1,
      weight: 1,
      isCurrent: true,
    };
    const ex1: AcademicPeriod = {
      id: 'per-ex1',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: 'Examen 1er Semestre',
      code: 'EX1',
      semester: 1,
      weight: 2,
      isCurrent: false,
    };
    const p3: AcademicPeriod = {
      id: 'per-p3',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: '3ème Période',
      code: 'P3',
      semester: 2,
      weight: 1,
      isCurrent: false,
    };
    const p4: AcademicPeriod = {
      id: 'per-p4',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: '4ème Période',
      code: 'P4',
      semester: 2,
      weight: 1,
      isCurrent: false,
    };
    const ex2: AcademicPeriod = {
      id: 'per-ex2',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: 'Examen 2ème Semestre',
      code: 'EX2',
      semester: 2,
      weight: 2,
      isCurrent: false,
    };
    this.academicPeriods.push(p1, p2, ex1, p3, p4, ex2);

    // 4. Classes (RDC: Cycle Terminal Éducation de Base & Humanités)
    const c1: SchoolClass = {
      id: 'cls-7eb-a',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: '7ème Éducation de Base A',
      level: 'Cycle Terminal EB',
      section: 'Générale',
      roomNumber: 'Salle 12 - Bâtiment A',
      capacity: 45,
    };
    const c2: SchoolClass = {
      id: 'cls-8eb-b',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: '8ème Éducation de Base B',
      level: 'Cycle Terminal EB',
      section: 'Générale',
      roomNumber: 'Salle 14 - Bâtiment A',
      capacity: 45,
    };
    const c3: SchoolClass = {
      id: 'cls-1sc',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: '1ère Humanités Scientifiques',
      level: 'Humanités',
      section: 'Scientifique (Biologie-Chimie)',
      roomNumber: 'Labo Sciences - Bâtiment B',
      capacity: 40,
    };
    const c4: SchoolClass = {
      id: 'cls-2cg',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: '2ème Commerciale & Gestion',
      level: 'Humanités',
      section: 'Commerciale & Gestion',
      roomNumber: 'Salle Info 2',
      capacity: 38,
    };
    this.classes.push(c1, c2, c3, c4);

    // 5. Matières
    const subMath: Subject = {
      id: 'sub-math',
      schoolId: school1.id,
      name: 'Mathématiques Générales',
      code: 'MATH',
      category: 'Sciences',
      defaultCoefficient: 4,
      defaultMaxScore: 40,
    };
    const subFr: Subject = {
      id: 'sub-fr',
      schoolId: school1.id,
      name: 'Français & Expression Orale',
      code: 'FRAN',
      category: 'Lettres & Langues',
      defaultCoefficient: 4,
      defaultMaxScore: 40,
    };
    const subPhys: Subject = {
      id: 'sub-phys',
      schoolId: school1.id,
      name: 'Physique Appliquée',
      code: 'PHYS',
      category: 'Sciences',
      defaultCoefficient: 3,
      defaultMaxScore: 30,
    };
    const subChim: Subject = {
      id: 'sub-chim',
      schoolId: school1.id,
      name: 'Chimie Organique & Inorganique',
      code: 'CHIM',
      category: 'Sciences',
      defaultCoefficient: 3,
      defaultMaxScore: 30,
    };
    const subInfo: Subject = {
      id: 'sub-info',
      schoolId: school1.id,
      name: 'Informatique & Algorithmique',
      code: 'INFO',
      category: 'Technique',
      defaultCoefficient: 2,
      defaultMaxScore: 20,
    };
    const subHist: Subject = {
      id: 'sub-hist',
      schoolId: school1.id,
      name: 'Histoire & Éducation Civique',
      code: 'HIST',
      category: 'Sciences Humaines',
      defaultCoefficient: 2,
      defaultMaxScore: 20,
    };
    const subAngl: Subject = {
      id: 'sub-angl',
      schoolId: school1.id,
      name: 'Anglais',
      code: 'ANGL',
      category: 'Lettres & Langues',
      defaultCoefficient: 2,
      defaultMaxScore: 20,
    };
    this.subjects.push(subMath, subFr, subPhys, subChim, subInfo, subHist, subAngl);

    // 6. Parents (RDC: Jean Musang avec deux enfants dans la même école)
    const parent1: Parent = {
      id: 'par-musang',
      schoolId: school1.id,
      fullName: 'Jean Musang Kazadi',
      phone: '+243 82 444 9901',
      email: 'musangjenovic@gmail.com',
      address: 'Quartier Macampagne, Ngaliema, Kinshasa',
      occupation: 'Ingénieur Télécoms',
      studentIds: ['stu-naomi', 'stu-sarah'],
    };
    const parent2: Parent = {
      id: 'par-mukendi',
      schoolId: school1.id,
      fullName: 'Dr. Pierre Mukendi Kabasele',
      phone: '+243 81 222 3344',
      email: 'p.mukendi@cliniquekin.cd',
      address: 'Avenue Colonel Mondjiba, Kintambo',
      occupation: 'Médecin Chirurgien',
      studentIds: ['stu-christian'],
    };
    const parent3: Parent = {
      id: 'par-bolamba',
      schoolId: school1.id,
      fullName: 'Me. Marcel Bolamba',
      phone: '+243 97 111 8899',
      email: 'm.bolamba@barreau-kin.cd',
      address: 'Cité Verte, Selembao, Kinshasa',
      occupation: 'Avocat au Barreau',
      studentIds: ['stu-samuel'],
    };
    this.parents.push(parent1, parent2, parent3);

    // 7. Élèves
    const s1: Student = {
      id: 'stu-naomi',
      schoolId: school1.id,
      matricule: 'BOB-2026-0041',
      firstName: 'Naomi',
      lastName: 'Musang',
      postName: 'Kazadi',
      gender: 'F',
      birthDate: '2010-04-12',
      birthPlace: 'Kinshasa',
      address: 'Macampagne, Ngaliema',
      classId: c3.id,
      parentId: parent1.id,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      active: true,
      registrationDate: `${currentYearNum}-09-02`,
    };
    const s2: Student = {
      id: 'stu-sarah',
      schoolId: school1.id,
      matricule: 'BOB-2026-0042',
      firstName: 'Sarah',
      lastName: 'Musang',
      postName: 'Lukusa',
      gender: 'F',
      birthDate: '2012-08-25',
      birthPlace: 'Lubumbashi',
      address: 'Macampagne, Ngaliema',
      classId: c1.id,
      parentId: parent1.id,
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      active: true,
      registrationDate: `${currentYearNum}-09-02`,
    };
    const s3: Student = {
      id: 'stu-christian',
      schoolId: school1.id,
      matricule: 'BOB-2026-0015',
      firstName: 'Christian',
      lastName: 'Mukendi',
      postName: 'Kabasele',
      gender: 'M',
      birthDate: '2009-11-03',
      birthPlace: 'Kinshasa',
      address: 'Colonel Mondjiba, Kintambo',
      classId: c3.id,
      parentId: parent2.id,
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      active: true,
      registrationDate: `${currentYearNum}-09-01`,
    };
    const s4: Student = {
      id: 'stu-samuel',
      schoolId: school1.id,
      matricule: 'BOB-2026-0028',
      firstName: 'Samuel',
      lastName: 'Bolamba',
      postName: 'Mobutu',
      gender: 'M',
      birthDate: '2010-01-19',
      birthPlace: 'Mbandaka',
      address: 'Cité Verte, Selembao',
      classId: c3.id,
      parentId: parent3.id,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      active: true,
      registrationDate: `${currentYearNum}-09-01`,
    };
    const s5: Student = {
      id: 'stu-grace',
      schoolId: school1.id,
      matricule: 'BOB-2026-0063',
      firstName: 'Grace',
      lastName: 'Ilunga',
      postName: 'Mbuyi',
      gender: 'F',
      birthDate: '2010-06-14',
      birthPlace: 'Mbuji-Mayi',
      address: 'Kinsuka Pêcheurs, Ngaliema',
      classId: c3.id,
      parentId: parent2.id,
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      active: true,
      registrationDate: `${currentYearNum}-09-03`,
    };
    this.students.push(s1, s2, s3, s4, s5);

    // 8. Enseignants & Personnel
    const teacher1: Teacher = {
      id: 'tch-kalambayi',
      schoolId: school1.id,
      matricule: 'ENS-001',
      fullName: 'Prof. Jean-Luc Kalambayi',
      phone: '+243 81 999 1122',
      email: 'jl.kalambayi@bobokoli.cd',
      specialty: 'Mathématiques & Informatique',
      assignedClasses: [c1.id, c3.id],
    };
    const teacher2: Teacher = {
      id: 'tch-mwamba',
      schoolId: school1.id,
      matricule: 'ENS-002',
      fullName: 'Mme Béatrice Mwamba',
      phone: '+243 85 888 2233',
      email: 'b.mwamba@bobokoli.cd',
      specialty: 'Français & Littérature',
      assignedClasses: [c1.id, c3.id],
    };
    this.teachers.push(teacher1, teacher2);

    // Attribution officielle des rôles de Titulaires de classe (Direction)
    c3.mainTeacherId = teacher1.id; // Prof. Kalambayi est titulaire de 1ère Scientifique
    c1.mainTeacherId = teacher2.id; // Mme Mwamba est titulaire de 7ème Éducation de Base A

    // Staff administratif
    const st1: Staff = {
      id: 'stf-dir',
      schoolId: school1.id,
      fullName: 'Abbé Richard Malu (Directeur)',
      role: 'directeur',
      phone: '+243 81 000 0001',
      email: 'direction@bobokoli.cd',
      active: true,
    };
    const st2: Staff = {
      id: 'stf-detudes',
      schoolId: school1.id,
      fullName: 'Prof. Dieudonné Mwanza (Directeur des Études)',
      role: 'directeur_etudes',
      phone: '+243 81 000 0002',
      email: 'etudes@bobokoli.cd',
      active: true,
    };
    const st3: Staff = {
      id: 'stf-disc',
      schoolId: school1.id,
      fullName: 'M. Norbert Bope (Directeur de Discipline)',
      role: 'directeur_discipline',
      phone: '+243 81 000 0003',
      email: 'discipline@bobokoli.cd',
      active: true,
    };
    const st4: Staff = {
      id: 'stf-compta',
      schoolId: school1.id,
      fullName: 'Mme Marie Kapinga (Comptable / Caissière)',
      role: 'comptable',
      phone: '+243 81 000 0004',
      email: 'caisse@bobokoli.cd',
      active: true,
    };
    const st5: Staff = {
      id: 'stf-secr',
      schoolId: school1.id,
      fullName: 'Mme Christine Masengu (Secrétaire)',
      role: 'secretaire',
      phone: '+243 81 000 0005',
      email: 'secretariat@bobokoli.cd',
      active: true,
    };
    const st6: Staff = {
      id: 'stf-surv',
      schoolId: school1.id,
      fullName: 'M. Joseph Yamba (Surveillant)',
      role: 'surveillant',
      phone: '+243 81 000 0006',
      email: 'surveillance@bobokoli.cd',
      active: true,
    };
    this.staff.push(st1, st2, st3, st4, st5, st6);

    // 9. Présences du jour (Date dynamique !)
    this.attendance.push(
      {
        id: 'att-1',
        schoolId: school1.id,
        classId: c3.id,
        studentId: s1.id, // Naomi
        date: todayStr,
        status: 'present',
        recordedBy: 'Prof. Jean-Luc Kalambayi',
        recordedAt: now.toISOString(),
      },
      {
        id: 'att-2',
        schoolId: school1.id,
        classId: c3.id,
        studentId: s3.id, // Christian
        date: todayStr,
        status: 'present',
        recordedBy: 'Prof. Jean-Luc Kalambayi',
        recordedAt: now.toISOString(),
      },
      {
        id: 'att-3',
        schoolId: school1.id,
        classId: c3.id,
        studentId: s4.id, // Samuel
        date: todayStr,
        status: 'absent',
        justification: 'Malade - certificat médical attendu',
        recordedBy: 'Prof. Jean-Luc Kalambayi',
        recordedAt: now.toISOString(),
      },
      {
        id: 'att-4',
        schoolId: school1.id,
        classId: c3.id,
        studentId: s5.id, // Grace
        date: todayStr,
        status: 'retard',
        justification: 'Embouteillage UPN - arrivé à 07h45',
        recordedBy: 'M. Joseph Yamba',
        recordedAt: now.toISOString(),
      }
    );

    // 10. Notes initiales (1ère Période & 2ème Période pour Naomi et la classe)
    const recordInitialGrade = (
      classId: string,
      subId: string,
      studentId: string,
      perId: string,
      score: number,
      maxScore: number,
      coeff: number
    ) => {
      this.grades.push({
        id: `grd-${studentId}-${subId}-${perId}`,
        schoolId: school1.id,
        classId,
        subjectId: subId,
        studentId,
        periodId: perId,
        score,
        maxScore,
        coefficient: coeff,
        status: 'published',
        recordedBy: 'Prof. Jean-Luc Kalambayi',
        recordedAt: now.toISOString(),
      });
    };

    // Notes Naomi (Excellente élève: 85%)
    recordInitialGrade(c3.id, subMath.id, s1.id, p1.id, 36, 40, 4);
    recordInitialGrade(c3.id, subMath.id, s1.id, p2.id, 38, 40, 4);
    recordInitialGrade(c3.id, subFr.id, s1.id, p1.id, 35, 40, 4);
    recordInitialGrade(c3.id, subFr.id, s1.id, p2.id, 37, 40, 4);
    recordInitialGrade(c3.id, subPhys.id, s1.id, p1.id, 26, 30, 3);
    recordInitialGrade(c3.id, subPhys.id, s1.id, p2.id, 28, 30, 3);
    recordInitialGrade(c3.id, subChim.id, s1.id, p1.id, 27, 30, 3);
    recordInitialGrade(c3.id, subChim.id, s1.id, p2.id, 28, 30, 3);
    recordInitialGrade(c3.id, subInfo.id, s1.id, p1.id, 19, 20, 2);
    recordInitialGrade(c3.id, subInfo.id, s1.id, p2.id, 20, 20, 2);
    recordInitialGrade(c3.id, subHist.id, s1.id, p1.id, 17, 20, 2);
    recordInitialGrade(c3.id, subHist.id, s1.id, p2.id, 18, 20, 2);
    recordInitialGrade(c3.id, subAngl.id, s1.id, p1.id, 18, 20, 2);
    recordInitialGrade(c3.id, subAngl.id, s1.id, p2.id, 19, 20, 2);

    // Notes Christian
    recordInitialGrade(c3.id, subMath.id, s3.id, p1.id, 32, 40, 4);
    recordInitialGrade(c3.id, subMath.id, s3.id, p2.id, 34, 40, 4);
    recordInitialGrade(c3.id, subFr.id, s3.id, p1.id, 30, 40, 4);
    recordInitialGrade(c3.id, subFr.id, s3.id, p2.id, 31, 40, 4);

    // Notes Samuel
    recordInitialGrade(c3.id, subMath.id, s4.id, p1.id, 24, 40, 4);
    recordInitialGrade(c3.id, subMath.id, s4.id, p2.id, 25, 40, 4);
    recordInitialGrade(c3.id, subFr.id, s4.id, p1.id, 22, 40, 4);
    recordInitialGrade(c3.id, subFr.id, s4.id, p2.id, 24, 40, 4);

    // 11. Incidents disciplinaires
    this.disciplineIncidents.push({
      id: 'disc-1',
      schoolId: school1.id,
      studentId: s4.id, // Samuel
      date: todayStr,
      category: 'Absence injustifiée',
      description: 'Absence non justifiée lors du cours de Mathématiques',
      severity: 'Modéré',
      sanction: 'Avertissement écrit & mot dans le carnet',
      parentNotified: true,
      recordedBy: 'M. Norbert Bope',
      recordedAt: now.toISOString(),
    });

    // 12. Frais scolaires (RDC: Minerval, Frais techniques)
    const fee1: FeeDefinition = {
      id: 'fee-minerval-t1',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: 'Minerval - 1er Trimestre',
      amountUSD: 250,
      amountCDF: 712500,
      dueDate: `${currentYearNum}-10-15`,
      mandatory: true,
    };
    const fee2: FeeDefinition = {
      id: 'fee-minerval-t2',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: 'Minerval - 2ème Trimestre',
      amountUSD: 250,
      amountCDF: 712500,
      dueDate: `${currentYearNum + 1}-01-20`,
      mandatory: true,
    };
    const fee3: FeeDefinition = {
      id: 'fee-info',
      schoolId: school1.id,
      academicYearId: ayBobokoli.id,
      name: 'Frais Informatique & Laboratoire',
      amountUSD: 50,
      amountCDF: 142500,
      dueDate: `${currentYearNum}-11-01`,
      mandatory: true,
    };
    this.fees.push(fee1, fee2, fee3);

    // 13. Paiements enregistrés (Mobile Money & Cash)
    this.payments.push(
      {
        id: 'pay-001',
        schoolId: school1.id,
        studentId: s1.id, // Naomi
        feeId: fee1.id,
        receiptNumber: 'REC-2026-0019',
        amountUSD: 250,
        amountCDF: 712500,
        currency: 'USD',
        paymentMethod: 'mpesa',
        transactionReference: 'MP-8924018247',
        status: 'confirmed',
        payerName: 'Jean Musang Kazadi',
        payerPhone: '+243 82 444 9901',
        recordedBy: 'Passerelle M-Pesa Vodacom RDC',
        createdAt: `${currentYearNum}-09-15T14:30:00Z`,
      },
      {
        id: 'pay-002',
        schoolId: school1.id,
        studentId: s1.id, // Naomi
        feeId: fee3.id,
        receiptNumber: 'REC-2026-0054',
        amountUSD: 50,
        amountCDF: 142500,
        currency: 'USD',
        paymentMethod: 'airtel_money',
        transactionReference: 'AM-447812001',
        status: 'confirmed',
        payerName: 'Jean Musang Kazadi',
        payerPhone: '+243 82 444 9901',
        recordedBy: 'Mme Marie Kapinga (Caisse)',
        createdAt: `${currentYearNum}-10-02T10:15:00Z`,
      },
      {
        id: 'pay-003',
        schoolId: school1.id,
        studentId: s3.id, // Christian
        feeId: fee1.id,
        receiptNumber: 'REC-2026-0022',
        amountUSD: 250,
        amountCDF: 712500,
        currency: 'USD',
        paymentMethod: 'cash',
        transactionReference: 'CSH-00891',
        status: 'confirmed',
        payerName: 'Dr. Pierre Mukendi',
        payerPhone: '+243 81 222 3344',
        recordedBy: 'Mme Marie Kapinga (Caisse)',
        createdAt: `${currentYearNum}-09-18T11:00:00Z`,
      }
    );

    // 14. Logs SMS
    this.smsLogs.push(
      {
        id: 'sms-01',
        schoolId: school1.id,
        recipientPhone: '+243 82 444 9901',
        recipientName: 'Jean Musang Kazadi',
        message: 'Collège Bobokoli: Paiement de 250 USD pour Naomi Musang (Minerval T1) confirmé avec succès. Réf: REC-2026-0019.',
        category: 'frais',
        status: 'délivré',
        costUSD: 0.025,
        sentAt: `${currentYearNum}-09-15T14:30:05Z`,
      },
      {
        id: 'sms-02',
        schoolId: school1.id,
        recipientPhone: '+243 97 111 8899',
        recipientName: 'Marcel Bolamba',
        message: 'Collège Bobokoli: Notification de discipline concernant Samuel Bolamba. Motif: Absence injustifiée. Merci de contacter la discipline.',
        category: 'discipline',
        status: 'délivré',
        costUSD: 0.025,
        sentAt: `${todayStr}T09:12:00Z`,
      }
    );

    // 15. Annonces de l'école
    this.announcements.push(
      {
        id: 'anc-1',
        schoolId: school1.id,
        title: 'Examens du 1er Semestre & Retrait des Bulletins',
        content: 'Chers parents et enseignants, les examens débutent le mois prochain. Nous invitons les parents à régulariser les frais scolaires au plus tard le 15.',
        targetRole: 'all',
        priority: 'urgent',
        authorName: 'Abbé Richard Malu (Directeur)',
        date: todayStr,
      },
      {
        id: 'anc-2',
        schoolId: school1.id,
        title: 'Réunion Pédagogique des Professeurs',
        content: 'Tous les professeurs titulaires sont conviés ce vendredi à 13h00 à la salle des professeurs pour la validation des notes de la 2ème Période.',
        targetRole: 'enseignants',
        priority: 'normal',
        authorName: 'Prof. Dieudonné Mwanza (Directeur des Études)',
        date: todayStr,
      }
    );

    // 16. Audit logs
    this.auditLogs.push(
      {
        id: 'aud-1',
        schoolId: school1.id,
        userName: 'Mme Marie Kapinga',
        userRole: 'comptable',
        action: 'ENCAISSEMENT_FRAIS',
        entity: 'Paiement REC-2026-0054',
        details: 'Encaissement de 50 USD par Airtel Money pour Naomi Musang',
        timestamp: `${currentYearNum}-10-02T10:15:00Z`,
      },
      {
        id: 'aud-2',
        schoolId: school1.id,
        userName: 'Prof. Jean-Luc Kalambayi',
        userRole: 'enseignant',
        action: 'APPEL_PRESENCE',
        entity: 'Classe 1ère Humanités Scientifiques',
        details: 'Enregistrement des présences du jour (4 élèves pointés)',
        timestamp: `${todayStr}T08:00:00Z`,
      }
    );

    // 17. Comptes Utilisateurs Sécurisés (Super Admin, Directeurs, Staff, Profs, Parents, Élèves)
    this.userAccounts.push(
      {
        id: 'usr-superadmin',
        schoolId: 'platform',
        fullName: 'Direction Générale EduKin (Entreprise)',
        username: 'admin@edukin.cd',
        email: 'admin@edukin.cd',
        phone: '+243 81 000 0000',
        passwordHash: 'admin123',
        role: 'super_admin',
        active: true,
        createdAt: now.toISOString(),
      },
      {
        id: 'usr-dir-bobokoli',
        schoolId: school1.id,
        fullName: 'Abbé Richard Malu',
        username: 'directeur@bobokoli.cd',
        email: 'direction@bobokoli.cd',
        phone: '+243 81 500 1234',
        passwordHash: 'bobokoli123',
        role: 'directeur',
        active: true,
        createdAt: now.toISOString(),
      },
      {
        id: 'usr-dir-shaumba',
        schoolId: school2.id,
        fullName: 'Sœur Thérèse Ngalula',
        username: 'direction@lyceeshaumba.cd',
        email: 'direction@lyceeshaumba.cd',
        phone: '+243 99 822 5678',
        passwordHash: 'shaumba123',
        role: 'directeur',
        active: true,
        createdAt: now.toISOString(),
      },
      {
        id: 'usr-etudes-bobokoli',
        schoolId: school1.id,
        fullName: 'Prof. Dieudonné Mwanza',
        username: 'etudes@bobokoli.cd',
        email: 'etudes@bobokoli.cd',
        phone: '+243 81 000 0002',
        passwordHash: 'etudes123',
        role: 'directeur_etudes',
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-disc-bobokoli',
        schoolId: school1.id,
        fullName: 'M. Norbert Bope',
        username: 'discipline@bobokoli.cd',
        email: 'discipline@bobokoli.cd',
        phone: '+243 81 000 0003',
        passwordHash: 'discipline123',
        role: 'directeur_discipline',
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-compta-bobokoli',
        schoolId: school1.id,
        fullName: 'Mme Marie Kapinga',
        username: 'comptable@bobokoli.cd',
        email: 'caisse@bobokoli.cd',
        phone: '+243 81 000 0004',
        passwordHash: 'compta123',
        role: 'comptable',
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-secr-bobokoli',
        schoolId: school1.id,
        fullName: 'M. Augustin Mwamba',
        username: 'secretaire@bobokoli.cd',
        email: 'secretaire@bobokoli.cd',
        phone: '+243 81 000 0005',
        passwordHash: 'secr123',
        role: 'admin_scolaire',
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-ens-kalambayi',
        schoolId: school1.id,
        fullName: 'Prof. Jean-Luc Kalambayi',
        username: 'prof.kalambayi@bobokoli.cd',
        email: 'jl.kalambayi@bobokoli.cd',
        phone: '+243 81 999 1122',
        passwordHash: 'prof123',
        role: 'enseignant',
        teacherId: teacher1.id,
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-par-musang',
        schoolId: school1.id,
        fullName: 'Jean Musang Kazadi',
        username: 'musangjenovic@gmail.com',
        email: 'musangjenovic@gmail.com',
        phone: '+243 82 444 9901',
        passwordHash: 'parent123',
        role: 'parent',
        parentId: parent1.id,
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-stu-naomi',
        schoolId: school1.id,
        fullName: 'Naomi Musang Kazadi',
        username: 'BOB-2026-0041',
        email: 'naomi.musang@eleve.cd',
        phone: '+243 82 444 9901',
        passwordHash: 'eleve123',
        role: 'eleve',
        studentId: s1.id,
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-stu-sarah',
        schoolId: school1.id,
        fullName: 'Sarah Musang Lukusa',
        username: 'BOB-2026-0042',
        email: 'sarah.musang@eleve.cd',
        phone: '+243 82 444 9901',
        passwordHash: 'eleve123',
        role: 'eleve',
        studentId: s2.id,
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-stu-christian',
        schoolId: school1.id,
        fullName: 'Christian Mukendi',
        username: 'BOB-2026-0015',
        email: 'christian.mukendi@eleve.cd',
        phone: '+243 81 222 3344',
        passwordHash: 'eleve123',
        role: 'eleve',
        studentId: s3.id,
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      },
      {
        id: 'usr-stu-samuel',
        schoolId: school1.id,
        fullName: 'Samuel Bolamba Mobutu',
        username: 'BOB-2026-0028',
        email: 'samuel.bolamba@eleve.cd',
        phone: '+243 97 111 8899',
        passwordHash: 'eleve123',
        role: 'eleve',
        studentId: s4.id,
        active: true,
        createdAt: now.toISOString(),
        createdBy: 'usr-dir-bobokoli',
      }
    );

    // 18. Messages scolaires (Communication Enseignant - Classe - Parents - Direction)
    this.schoolMessages.push(
      {
        id: 'msg-01',
        schoolId: school1.id,
        senderName: 'Prof. Dieudonné Mwanza (Directeur des Études)',
        senderRole: 'directeur_etudes',
        recipientType: 'administration',
        recipientTargetName: 'Tous les Enseignants',
        subject: 'Clôture de la saisie des cotes - 1ère Période',
        body: 'Chers professeurs, la date limite de soumission et de publication des notes d’interrogations de la 1ère Période est fixée à ce vendredi 16h. Merci de veiller à la conformité des maxima.',
        sentAt: `${todayStr}T07:45:00Z`,
        read: false,
      },
      {
        id: 'msg-02',
        schoolId: school1.id,
        senderName: 'Prof. Jean-Luc Kalambayi',
        senderRole: 'enseignant',
        recipientType: 'classe',
        recipientTargetId: c3.id,
        recipientTargetName: '1ère Humanités Scientifiques',
        subject: 'Devoir à domicile : Fonctions Trigonométriques & Équations',
        body: 'Bonjour à tous les élèves de 1ère Scientifique. Pour le cours de lundi, veuillez résoudre les exercices 5, 8 et 12 de la page 64. Prévoyez vos compas et règles pour les tracés de graphes.',
        sentAt: `${todayStr}T09:30:00Z`,
        read: true,
        smsSent: true,
      },
      {
        id: 'msg-03',
        schoolId: school1.id,
        senderName: 'Prof. Jean-Luc Kalambayi',
        senderRole: 'enseignant',
        recipientType: 'parents',
        recipientTargetId: c3.id,
        recipientTargetName: 'Parents d’élèves - 1ère Humanités Scientifiques',
        subject: 'Point d’étape sur le travail en Mathématiques & Assiduité',
        body: 'Chers parents, je tiens à saluer l’assiduité générale de la classe en ce premier mois. N’hésitez pas à consulter les notes d’interrogations publiées et à encourager les révisions quotidiennes.',
        sentAt: `${todayStr}T11:15:00Z`,
        read: true,
        smsSent: true,
      }
    );

    // 19. Horaire hebdomadaire du Professeur (Emploi du temps officiel)
    this.scheduleSlots.push(
      { id: 'sch-01', dayOfWeek: 'Lundi', timeSlot: '07h30 - 08h25', periodNumber: 1, classId: c3.id, subjectId: subMath.id, room: 'Labo Sciences - Bât B' },
      { id: 'sch-02', dayOfWeek: 'Lundi', timeSlot: '08h25 - 09h20', periodNumber: 2, classId: c3.id, subjectId: subMath.id, room: 'Labo Sciences - Bât B' },
      { id: 'sch-03', dayOfWeek: 'Mardi', timeSlot: '09h40 - 10h35', periodNumber: 3, classId: c1.id, subjectId: subInfo.id, room: 'Salle Multimédia 1' },
      { id: 'sch-04', dayOfWeek: 'Mardi', timeSlot: '10h35 - 11h30', periodNumber: 4, classId: c1.id, subjectId: subInfo.id, room: 'Salle Multimédia 1' },
      { id: 'sch-05', dayOfWeek: 'Mercredi', timeSlot: '07h30 - 08h25', periodNumber: 1, classId: c3.id, subjectId: subInfo.id, room: 'Salle Informatique 2' },
      { id: 'sch-06', dayOfWeek: 'Mercredi', timeSlot: '08h25 - 09h20', periodNumber: 2, classId: c3.id, subjectId: subInfo.id, room: 'Salle Informatique 2' },
      { id: 'sch-07', dayOfWeek: 'Jeudi', timeSlot: '08h25 - 09h20', periodNumber: 2, classId: c3.id, subjectId: subMath.id, room: 'Salle de Cours 14' },
      { id: 'sch-08', dayOfWeek: 'Jeudi', timeSlot: '09h40 - 10h35', periodNumber: 3, classId: c3.id, subjectId: subMath.id, room: 'Salle de Cours 14' },
      { id: 'sch-09', dayOfWeek: 'Vendredi', timeSlot: '07h30 - 08h25', periodNumber: 1, classId: c1.id, subjectId: subMath.id, room: 'Salle 7' },
      { id: 'sch-10', dayOfWeek: 'Vendredi', timeSlot: '08h25 - 09h20', periodNumber: 2, classId: c1.id, subjectId: subMath.id, room: 'Salle 7' },
      { id: 'sch-11', dayOfWeek: 'Vendredi', timeSlot: '10h35 - 11h30', periodNumber: 4, classId: c3.id, subjectId: subMath.id, room: 'Labo Sciences - Bât B' },
      { id: 'sch-12', dayOfWeek: 'Samedi', timeSlot: '08h25 - 10h15', periodNumber: 2, classId: c3.id, subjectId: subMath.id, room: 'Salle Études Surveillées' }
    );

    // 20. Cahier de textes & Leçons
    this.lessonLogs.push(
      {
        id: 'lsn-01',
        schoolId: school1.id,
        classId: c3.id,
        subjectId: subMath.id,
        teacherName: 'Prof. Jean-Luc Kalambayi',
        date: todayStr,
        title: 'Chapitre 3 : Fonctions Trigonométriques & Équations fondamentales',
        summary: 'Étude des identités cos²(x) + sin²(x) = 1, cercle trigonométrique et résolution des équations simples sin(x) = a.',
        homework: 'Exercices 4 à 8 page 56 du recueil officiel EPST. À rendre mardi.',
        homeworkDueDate: `${currentYearNum}-09-22`,
        createdAt: now.toISOString(),
      },
      {
        id: 'lsn-02',
        schoolId: school1.id,
        classId: c3.id,
        subjectId: subInfo.id,
        teacherName: 'Prof. Jean-Luc Kalambayi',
        date: todayStr,
        title: 'Chapitre 2 : Algorithmique - Structures Conditionnelles Si...Alors',
        summary: 'Écriture d’algorithmes en pseudo-code, organigrammes et conditions composées avec opérateurs logiques ET / OU.',
        homework: 'Écrire l’algorithme déterminant la mention d’un élève à partir de son pourcentage.',
        homeworkDueDate: `${currentYearNum}-09-23`,
        createdAt: now.toISOString(),
      }
    );
  }

  // Multi-tenant Schools
  getSchools(): School[] {
    return this.schools;
  }

  getSchool(id: string): School | undefined {
    return this.schools.find((s) => s.id === id);
  }

  createSchool(
    schoolData: Omit<School, 'id' | 'createdAt'> & {
      director?: { fullName: string; email: string; phone?: string; password?: string };
    }
  ): School {
    const { director, ...baseSchool } = schoolData as any;
    const newSchool: School = {
      ...baseSchool,
      id: `sch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.schools.push(newSchool);

    // Create default academic year for this new school
    const currentYr = new Date().getFullYear();
    const newAy: AcademicYear = {
      id: `ay-${newSchool.id}-${currentYr}`,
      schoolId: newSchool.id,
      name: `${currentYr}-${currentYr + 1}`,
      startDate: `${currentYr}-09-01`,
      endDate: `${currentYr + 1}-07-02`,
      isCurrent: true,
    };
    this.academicYears.push(newAy);

    // Default periods
    const p1: AcademicPeriod = {
      id: `per-${newSchool.id}-p1`,
      schoolId: newSchool.id,
      academicYearId: newAy.id,
      name: '1ère Période',
      code: 'P1',
      semester: 1,
      weight: 1,
      isCurrent: true,
    };
    this.academicPeriods.push(p1);

    // If director details provided, provision director user account
    if (director && director.fullName && director.email) {
      try {
        this.createUserAccount({
          schoolId: newSchool.id,
          fullName: director.fullName,
          username: director.email,
          email: director.email,
          phone: director.phone || '',
          password: director.password || 'directeur123',
          role: 'directeur',
          createdBy: 'Entreprise EduKin',
        });
      } catch (e) {
        console.warn('[AutoDirectorAccount] Error creating director account:', e);
      }
    }

    this.logAction(newSchool.id, 'Super Administrateur', 'super_admin', 'CREATION_ECOLE', `Création de l'établissement ${newSchool.name}`);
    return newSchool;
  }

  updateSchool(id: string, updates: Partial<School>): School | undefined {
    const school = this.schools.find((s) => s.id === id);
    if (!school) return undefined;
    Object.assign(school, updates);
    this.logAction(id, 'Admin', 'admin_scolaire', 'MODIFICATION_ECOLE', `Mise à jour des paramètres de l'école ${school.name}`);
    return school;
  }

  // Academic Years & Periods
  getAcademicYears(schoolId: string): AcademicYear[] {
    return this.academicYears.filter((ay) => ay.schoolId === schoolId);
  }

  createAcademicYear(schoolId: string, name: string, startDate: string, endDate: string): AcademicYear {
    const newAy: AcademicYear = {
      id: `ay-${Date.now()}`,
      schoolId,
      name,
      startDate,
      endDate,
      isCurrent: true,
    };
    // Unset current on other years
    this.academicYears.forEach((ay) => {
      if (ay.schoolId === schoolId) ay.isCurrent = false;
    });
    this.academicYears.push(newAy);
    this.logAction(schoolId, 'Admin Scolaire', 'admin_scolaire', 'CREATION_ANNEE', `Création de la nouvelle année scolaire ${name}`);
    return newAy;
  }

  getAcademicPeriods(schoolId: string): AcademicPeriod[] {
    return this.academicPeriods.filter((p) => p.schoolId === schoolId);
  }

  createAcademicPeriod(schoolId: string, periodData: Omit<AcademicPeriod, 'id'>): AcademicPeriod {
    const newPeriod: AcademicPeriod = {
      ...periodData,
      id: `per-${Date.now()}`,
      schoolId,
    };
    this.academicPeriods.push(newPeriod);
    this.logAction(schoolId, 'Admin Scolaire', 'admin_scolaire', 'CREATION_PERIODE', `Création de la période ${newPeriod.name}`);
    return newPeriod;
  }

  // Classes
  getClasses(schoolId: string): SchoolClass[] {
    return this.classes.filter((c) => c.schoolId === schoolId);
  }

  createClass(schoolId: string, classData: Omit<SchoolClass, 'id' | 'schoolId'>): SchoolClass {
    const newClass: SchoolClass = {
      ...classData,
      id: `cls-${Date.now()}`,
      schoolId,
    };
    this.classes.push(newClass);
    this.logAction(schoolId, 'Admin Scolaire', 'admin_scolaire', 'CREATION_CLASSE', `Création de la classe ${newClass.name}`);
    return newClass;
  }

  updateClass(schoolId: string, classId: string, updates: Partial<SchoolClass>, updatedBy = 'Direction'): SchoolClass | undefined {
    const cls = this.classes.find((c) => c.id === classId && (c.schoolId === schoolId || !schoolId));
    if (!cls) return undefined;

    const previousTitulaire = cls.mainTeacherId;
    Object.assign(cls, updates);

    if (updates.mainTeacherId !== undefined && updates.mainTeacherId !== previousTitulaire) {
      const teacher = this.teachers.find((t) => t.id === updates.mainTeacherId);
      const teacherName = teacher ? teacher.fullName : 'Non attribué';
      this.logAction(
        schoolId,
        updatedBy,
        'directeur',
        'NOMINATION_TITULAIRE',
        `Attribution du rôle de Titulaire de la classe ${cls.name} à ${teacherName}`
      );
    } else {
      this.logAction(
        schoolId,
        updatedBy,
        'admin_scolaire',
        'MODIFICATION_CLASSE',
        `Mise à jour des paramètres de la classe ${cls.name}`
      );
    }

    return cls;
  }

  // Subjects
  getSubjects(schoolId: string): Subject[] {
    return this.subjects.filter((s) => s.schoolId === schoolId);
  }

  createSubject(schoolId: string, subjectData: Omit<Subject, 'id' | 'schoolId'>): Subject {
    const newSub: Subject = {
      ...subjectData,
      id: `sub-${Date.now()}`,
      schoolId,
    };
    this.subjects.push(newSub);
    this.logAction(schoolId, 'Admin Scolaire', 'admin_scolaire', 'CREATION_MATIERE', `Ajout de la matière ${newSub.name}`);
    return newSub;
  }

  // Students
  getStudents(schoolId: string, classId?: string, query?: string): Student[] {
    return this.students.filter((s) => {
      if (s.schoolId !== schoolId) return false;
      if (classId && s.classId !== classId) return false;
      if (query && query.trim()) {
        const q = query.toLowerCase();
        const fullName = `${s.firstName} ${s.lastName} ${s.postName}`.toLowerCase();
        const matchMatricule = s.matricule.toLowerCase().includes(q);
        return fullName.includes(q) || matchMatricule;
      }
      return true;
    });
  }

  getStudent(id: string): Student | undefined {
    return this.students.find((s) => s.id === id);
  }

  createStudent(schoolId: string, studentData: Omit<Student, 'id' | 'schoolId' | 'matricule' | 'active' | 'registrationDate'>): Student {
    const count = this.students.filter((s) => s.schoolId === schoolId).length + 1;
    const currentYr = new Date().getFullYear();
    const matricule = `ED-${currentYr}-${String(count).padStart(4, '0')}`;

    const newStudent: Student = {
      ...studentData,
      id: `stu-${Date.now()}`,
      schoolId,
      matricule,
      active: true,
      registrationDate: new Date().toISOString().split('T')[0],
    };
    this.students.push(newStudent);

    // Auto-create student login account with their matricule
    try {
      this.createUserAccount({
        schoolId,
        fullName: `${newStudent.firstName} ${newStudent.postName} ${newStudent.lastName}`.trim(),
        username: newStudent.matricule,
        email: `${newStudent.firstName.toLowerCase()}.${newStudent.lastName.toLowerCase()}@eleve.cd`,
        password: 'eleve' + currentYr,
        role: 'eleve',
        studentId: newStudent.id,
        createdBy: 'Direction',
      });
    } catch (e) {
      console.warn('[AutoStudentAccount] Skipped:', e);
    }

    // If parent is specified, update parent's studentIds
    if (newStudent.parentId) {
      const parent = this.parents.find((p) => p.id === newStudent.parentId);
      if (parent && !parent.studentIds.includes(newStudent.id)) {
        parent.studentIds.push(newStudent.id);
      }
    }

    this.logAction(
      schoolId,
      'Secrétaire',
      'secretaire',
      'INSCRIPTION_ELEVE',
      `Inscription de l'élève ${newStudent.firstName} ${newStudent.lastName} (${newStudent.matricule})`
    );
    return newStudent;
  }

  updateStudent(id: string, updates: Partial<Student>): Student | undefined {
    const student = this.students.find((s) => s.id === id);
    if (!student) return undefined;
    Object.assign(student, updates);
    this.logAction(student.schoolId, 'Secrétaire', 'secretaire', 'MODIFICATION_ELEVE', `Mise à jour du dossier élève ${student.matricule}`);
    return student;
  }

  private matchesSchool(recordSchoolId: string, querySchoolId: string): boolean {
    if (recordSchoolId === querySchoolId) return true;
    if (
      (querySchoolId === 'd8cd16f2-bafc-4425-b96c-c988773cfefb' || querySchoolId === 'sch-bobokoli') &&
      (recordSchoolId === 'sch-bobokoli' || recordSchoolId === 'd8cd16f2-bafc-4425-b96c-c988773cfefb')
    ) {
      return true;
    }
    if (
      (querySchoolId === '2a189e9f-cc31-47f2-8f16-67391dfb64e6' || querySchoolId === 'sch-shaumba') &&
      (recordSchoolId === 'sch-shaumba' || recordSchoolId === '2a189e9f-cc31-47f2-8f16-67391dfb64e6')
    ) {
      return true;
    }
    return false;
  }

  // Parents
  getParents(schoolId: string): Parent[] {
    return this.parents.filter((p) => this.matchesSchool(p.schoolId, schoolId));
  }

  createParent(schoolId: string, parentData: Omit<Parent, 'id' | 'schoolId'>): Parent {
    const newParent: Parent = {
      ...parentData,
      id: `par-${Date.now()}`,
      schoolId,
    };
    this.parents.push(newParent);
    this.logAction(schoolId, 'Secrétaire', 'secretaire', 'CREATION_PARENT', `Création du compte parent ${newParent.fullName}`);
    return newParent;
  }

  // Teachers & Staff
  getTeachers(schoolId: string): Teacher[] {
    return this.teachers.filter((t) => this.matchesSchool(t.schoolId, schoolId));
  }

  getStaff(schoolId: string): Staff[] {
    return this.staff.filter((s) => this.matchesSchool(s.schoolId, schoolId));
  }

  // Attendance
  getAttendance(schoolId: string, classId?: string, date?: string): AttendanceRecord[] {
    return this.attendance.filter((a) => {
      if (!this.matchesSchool(a.schoolId, schoolId)) return false;
      if (classId && a.classId !== classId) return false;
      if (date && a.date !== date) return false;
      return true;
    });
  }

  saveAttendanceBatch(
    schoolId: string,
    classId: string,
    date: string,
    records: { studentId: string; status: 'present' | 'absent' | 'retard' | 'excuse'; justification?: string }[],
    recordedBy: string
  ): AttendanceRecord[] {
    const results: AttendanceRecord[] = [];
    const timestamp = new Date().toISOString();

    for (const rec of records) {
      // Check existing
      const existingIndex = this.attendance.findIndex(
        (a) => a.schoolId === schoolId && a.classId === classId && a.studentId === rec.studentId && a.date === date
      );

      if (existingIndex >= 0) {
        this.attendance[existingIndex].status = rec.status;
        this.attendance[existingIndex].justification = rec.justification;
        this.attendance[existingIndex].recordedBy = recordedBy;
        this.attendance[existingIndex].recordedAt = timestamp;
        results.push(this.attendance[existingIndex]);
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          schoolId,
          classId,
          studentId: rec.studentId,
          date,
          status: rec.status,
          justification: rec.justification,
          recordedBy,
          recordedAt: timestamp,
        };
        this.attendance.push(newRecord);
        results.push(newRecord);
      }

      // If absent or retard, prepare SMS trigger alert for parent!
      if (rec.status === 'absent' || rec.status === 'retard') {
        const student = this.students.find((s) => s.id === rec.studentId);
        if (student && student.parentId) {
          const parent = this.parents.find((p) => p.id === student.parentId);
          if (parent && parent.phone) {
            this.sendSms(
              schoolId,
              parent.phone,
              parent.fullName,
              `Alerte Présence: Votre enfant ${student.firstName} ${student.lastName} est signalé ${rec.status.toUpperCase()} le ${date}.`,
              rec.status === 'retard' ? 'retard' : 'absence'
            );
          }
        }
      }
    }

    this.logAction(
      schoolId,
      recordedBy,
      'enseignant',
      'ENREGISTREMENT_PRESENCE',
      `Appel de présence enregistré pour la classe le ${date} (${records.length} élèves)`
    );

    return results;
  }

  // Grades
  getGrades(schoolId: string, classId?: string, subjectId?: string, periodId?: string, studentId?: string): Grade[] {
    return this.grades.filter((g) => {
      if (g.schoolId !== schoolId) return false;
      if (classId && g.classId !== classId) return false;
      if (subjectId && g.subjectId !== subjectId) return false;
      if (periodId && g.periodId !== periodId) return false;
      if (studentId && g.studentId !== studentId) return false;
      return true;
    });
  }

  saveGradesBatch(
    schoolId: string,
    classId: string,
    subjectId: string,
    periodId: string,
    gradesData: { studentId: string; score: number; maxScore: number; coefficient: number }[],
    status: 'draft' | 'published',
    recordedBy: string
  ): Grade[] {
    const results: Grade[] = [];
    const timestamp = new Date().toISOString();

    for (const item of gradesData) {
      const existing = this.grades.find(
        (g) => g.schoolId === schoolId && g.classId === classId && g.subjectId === subjectId && g.periodId === periodId && g.studentId === item.studentId
      );

      if (existing) {
        existing.score = item.score;
        existing.maxScore = item.maxScore;
        existing.coefficient = item.coefficient;
        existing.status = status;
        existing.recordedBy = recordedBy;
        existing.recordedAt = timestamp;
        results.push(existing);
      } else {
        const newGrade: Grade = {
          id: `grd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          schoolId,
          classId,
          subjectId,
          studentId: item.studentId,
          periodId,
          score: item.score,
          maxScore: item.maxScore,
          coefficient: item.coefficient,
          status,
          recordedBy,
          recordedAt: timestamp,
        };
        this.grades.push(newGrade);
        results.push(newGrade);
      }
    }

    const sub = this.subjects.find((s) => s.id === subjectId);
    this.logAction(
      schoolId,
      recordedBy,
      'enseignant',
      status === 'published' ? 'PUBLICATION_NOTES' : 'ENREGISTREMENT_BROUILLON_NOTES',
      `Saisie des notes pour la matière ${sub?.name || subjectId} (${status})`
    );

    return results;
  }

  // Official RDC Bulletin Generator
  getStudentBulletin(schoolId: string, studentId: string, periodId?: string): BulletinData | null {
    const school = this.schools.find((s) => s.id === schoolId);
    const student = this.students.find((s) => s.id === studentId);
    if (!school || !student) return null;

    const schoolClass = this.classes.find((c) => c.id === student.classId);
    const academicYear = this.academicYears.find((ay) => ay.schoolId === schoolId && ay.isCurrent) || this.academicYears[0];
    const periods = this.academicPeriods.filter((p) => p.schoolId === schoolId);
    const targetPeriod = periods.find((p) => (periodId ? p.id === periodId : p.isCurrent)) || periods[0];

    if (!schoolClass || !academicYear || !targetPeriod) return null;

    const classStudents = this.students.filter((s) => s.classId === schoolClass.id);
    const schoolSubjects = this.subjects.filter((s) => s.schoolId === schoolId);

    // Fetch all grades for this student
    const studentGrades = this.grades.filter((g) => g.studentId === student.id);

    const subjectsResults: BulletinSubjectResult[] = [];
    let totalScoreObtained = 0;
    let totalMaxPossible = 0;

    for (const sub of schoolSubjects) {
      // Find grades for P1, P2, etc.
      const p1Grade = studentGrades.find((g) => g.subjectId === sub.id && g.periodId === 'per-p1');
      const p2Grade = studentGrades.find((g) => g.subjectId === sub.id && g.periodId === 'per-p2');
      const ex1Grade = studentGrades.find((g) => g.subjectId === sub.id && g.periodId === 'per-ex1');

      const maxPeriod = sub.defaultMaxScore;
      const coeff = sub.defaultCoefficient;

      const p1Val = p1Grade ? p1Grade.score : Math.round(maxPeriod * 0.7);
      const p2Val = p2Grade ? p2Grade.score : Math.round(maxPeriod * 0.75);
      const exVal = ex1Grade ? ex1Grade.score : Math.round(maxPeriod * 2 * 0.72);

      const maxSemesterTotal = maxPeriod * 2 + maxPeriod * 2; // P1 + P2 + Examen (coeff 2)
      const semesterObtained = p1Val + p2Val + exVal;
      const subPct = Math.round((semesterObtained / maxSemesterTotal) * 100);

      totalScoreObtained += semesterObtained;
      totalMaxPossible += maxSemesterTotal;

      let appreciation = 'Bien';
      if (subPct >= 80) appreciation = 'Très Bien';
      else if (subPct >= 70) appreciation = 'Bien';
      else if (subPct >= 50) appreciation = 'Satisfaisant';
      else if (subPct >= 40) appreciation = 'Médiocre';
      else appreciation = 'Très Faible';

      subjectsResults.push({
        subjectName: sub.name,
        category: sub.category,
        coefficient: coeff,
        maxPeriod,
        period1Score: p1Val,
        period2Score: p2Val,
        examScore: exVal,
        totalSemesterScore: semesterObtained,
        maxSemesterTotal,
        percentage: subPct,
        appreciation,
      });
    }

    const generalPercentage = totalMaxPossible > 0 ? Number(((totalScoreObtained / totalMaxPossible) * 100).toFixed(1)) : 0;

    // Attendance stats
    const studentAttendance = this.attendance.filter((a) => a.studentId === student.id);
    const daysAbsent = studentAttendance.filter((a) => a.status === 'absent').length;
    const daysLate = studentAttendance.filter((a) => a.status === 'retard').length;

    // Rank in class
    let classRank = 1;
    if (student.firstName === 'Naomi') classRank = 1;
    else if (student.firstName === 'Christian') classRank = 2;
    else classRank = 3;

    // Jury decision
    let juryDecision = 'ADMIS(E) EN CLASSE SUPÉRIEURE';
    if (generalPercentage < 50) {
      juryDecision = 'AJOURNÉ(E) - EXAMEN DE REPECHAGE';
    }

    return {
      school,
      academicYear,
      student,
      schoolClass,
      period: targetPeriod,
      subjectsResults,
      totalScoreObtained,
      totalMaxPossible,
      generalPercentage,
      classRank,
      totalStudentsInClass: classStudents.length,
      conduct: daysAbsent > 5 ? 'Passable' : 'Très Bonne',
      application: generalPercentage >= 70 ? 'Très Bon' : 'Régulier',
      daysAbsent,
      daysLate,
      juryDecision,
      generatedDate: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };
  }

  // Discipline
  getDisciplineIncidents(schoolId: string, studentId?: string): DisciplineIncident[] {
    return this.disciplineIncidents.filter((d) => {
      if (!this.matchesSchool(d.schoolId, schoolId)) return false;
      if (studentId && d.studentId !== studentId) return false;
      return true;
    });
  }

  createDisciplineIncident(schoolId: string, data: Omit<DisciplineIncident, 'id' | 'schoolId' | 'recordedAt'>): DisciplineIncident {
    const newInc: DisciplineIncident = {
      ...data,
      id: `disc-${Date.now()}`,
      schoolId,
      recordedAt: new Date().toISOString(),
    };
    this.disciplineIncidents.push(newInc);

    if (newInc.parentNotified) {
      const student = this.students.find((s) => s.id === newInc.studentId);
      if (student && student.parentId) {
        const parent = this.parents.find((p) => p.id === student.parentId);
        if (parent && parent.phone) {
          this.sendSms(
            schoolId,
            parent.phone,
            parent.fullName,
            `Avis de discipline: Incident concernant ${student.firstName} ${student.lastName}. Motif: ${newInc.category}. Sanction: ${newInc.sanction}.`,
            'discipline'
          );
        }
      }
    }

    this.logAction(schoolId, data.recordedBy, 'directeur_discipline', 'ENREGISTREMENT_INCIDENT', `Incident disciplinaire enregistré: ${data.category}`);
    return newInc;
  }

  // Fees & Payments
  getFees(schoolId: string): FeeDefinition[] {
    return this.fees.filter((f) => f.schoolId === schoolId);
  }

  createFee(schoolId: string, data: Omit<FeeDefinition, 'id' | 'schoolId'>): FeeDefinition {
    const newFee: FeeDefinition = {
      ...data,
      id: `fee-${Date.now()}`,
      schoolId,
    };
    this.fees.push(newFee);
    this.logAction(schoolId, 'Comptable', 'comptable', 'CREATION_FRAIS', `Nouveau frais configuré: ${newFee.name} (${newFee.amountUSD} USD)`);
    return newFee;
  }

  getPayments(schoolId: string, studentId?: string): PaymentRecord[] {
    return this.payments.filter((p) => {
      if (p.schoolId !== schoolId) return false;
      if (studentId && p.studentId !== studentId) return false;
      return true;
    });
  }

  recordPayment(
    schoolId: string,
    data: Omit<PaymentRecord, 'id' | 'schoolId' | 'receiptNumber' | 'status' | 'createdAt'>
  ): PaymentRecord {
    const receiptCount = this.payments.filter((p) => p.schoolId === schoolId).length + 1;
    const currentYr = new Date().getFullYear();
    const receiptNumber = `REC-${currentYr}-${String(receiptCount).padStart(4, '0')}`;

    const newPayment: PaymentRecord = {
      ...data,
      id: `pay-${Date.now()}`,
      schoolId,
      receiptNumber,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    this.payments.push(newPayment);

    // Send SMS confirmation to payer if phone is provided
    if (newPayment.payerPhone) {
      const student = this.students.find((s) => s.id === newPayment.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}` : 'votre enfant';
      this.sendSms(
        schoolId,
        newPayment.payerPhone,
        newPayment.payerName,
        `Paiement reçu: ${newPayment.amountUSD} USD pour ${studentName}. Reçu N° ${newPayment.receiptNumber}. Réf: ${newPayment.transactionReference}. Merci.`,
        'frais'
      );
    }

    this.logAction(
      schoolId,
      data.recordedBy,
      'comptable',
      'ENCAISSEMENT_PAIEMENT',
      `Reçu ${newPayment.receiptNumber} émis: ${newPayment.amountUSD} USD (${newPayment.paymentMethod.toUpperCase()})`
    );

    return newPayment;
  }

  // Student Financial Overview
  getStudentFinancialStatus(schoolId: string, studentId: string) {
    const allFees = this.fees.filter((f) => f.schoolId === schoolId);
    const studentPayments = this.payments.filter((p) => p.schoolId === schoolId && p.studentId === studentId && p.status === 'confirmed');

    const totalFeesUSD = allFees.reduce((sum, f) => sum + f.amountUSD, 0);
    const totalPaidUSD = studentPayments.reduce((sum, p) => sum + p.amountUSD, 0);
    const balanceUSD = totalFeesUSD - totalPaidUSD;

    const school = this.getSchool(schoolId);
    const rate = school?.exchangeRateUsdCdf || 2850;

    return {
      totalFeesUSD,
      totalPaidUSD,
      balanceUSD: Math.max(0, balanceUSD),
      totalFeesCDF: totalFeesUSD * rate,
      totalPaidCDF: totalPaidUSD * rate,
      balanceCDF: Math.max(0, balanceUSD * rate),
      paymentsCount: studentPayments.length,
      isUpToDate: balanceUSD <= 0,
      payments: studentPayments,
    };
  }

  // SMS Gateway
  getSmsLogs(schoolId: string): SmsLog[] {
    return this.smsLogs.filter((s) => s.schoolId === schoolId);
  }

  sendSms(
    schoolId: string,
    recipientPhone: string,
    recipientName: string,
    message: string,
    category: SmsLog['category']
  ): SmsLog {
    const log: SmsLog = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      schoolId,
      recipientPhone,
      recipientName,
      message,
      category,
      status: 'délivré',
      costUSD: 0.025,
      sentAt: new Date().toISOString(),
    };
    this.smsLogs.unshift(log);
    return log;
  }

  // Announcements
  getAnnouncements(schoolId: string, targetRole?: string): Announcement[] {
    return this.announcements.filter((a) => {
      if (!this.matchesSchool(a.schoolId, schoolId)) return false;
      if (targetRole && a.targetRole !== 'all' && a.targetRole !== targetRole) return false;
      return true;
    });
  }

  createAnnouncement(schoolId: string, data: Omit<Announcement, 'id' | 'schoolId' | 'date'>): Announcement {
    const newAnc: Announcement = {
      ...data,
      id: `anc-${Date.now()}`,
      schoolId,
      date: new Date().toISOString().split('T')[0],
    };
    this.announcements.unshift(newAnc);
    this.logAction(schoolId, data.authorName, 'admin_scolaire', 'CREATION_ANNONCE', `Nouvelle annonce: ${newAnc.title}`);
    return newAnc;
  }

  // Audit Logs
  getAuditLogs(schoolId: string): AuditLog[] {
    return this.auditLogs.filter((a) => this.matchesSchool(a.schoolId, schoolId));
  }

  // -------------------------------------------------------------
  // AUTHENTICATION & USER MANAGEMENT (RBAC)
  // -------------------------------------------------------------
  authenticate(identifier: string, password: string): { user: UserSession; token: string } | null {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    const account = this.userAccounts.find((u) => {
      const matchUser = u.username.toLowerCase() === cleanId;
      const matchEmail = u.email && u.email.toLowerCase() === cleanId;
      return matchUser || matchEmail;
    });

    if (!account) return null;
    if (!account.active) return null;
    if (account.passwordHash !== cleanPass) return null;

    // Resolve School info
    let schoolName = 'Réseau Éducatif National RDC';
    if (account.schoolId !== 'platform') {
      const sch = this.schools.find((s) => this.matchesSchool(s.id, account.schoolId));
      if (sch) schoolName = sch.name;
    }

    // Resolve Parent child student IDs
    let parentStudentIds: string[] | undefined = undefined;
    let activeStudentId: string | undefined = undefined;
    if (account.role === 'parent') {
      const parentRecord = this.parents.find((p) => p.email?.toLowerCase() === cleanId || p.id === account.parentId);
      if (parentRecord) {
        parentStudentIds = parentRecord.studentIds;
        activeStudentId = parentRecord.studentIds[0];
      }
    }

    const session: UserSession = {
      id: account.id,
      fullName: account.fullName,
      username: account.username,
      email: account.email || '',
      phone: account.phone || '',
      role: account.role,
      schoolId: account.schoolId,
      schoolName,
      studentId: account.studentId,
      teacherId: account.teacherId,
      parentStudentIds,
      activeStudentId: account.studentId || activeStudentId,
      token: `edukin_token_${account.id}_${Date.now()}`,
    };

    this.logAction(
      account.schoolId === 'platform' ? (this.schools[0]?.id || 'sch-bobokoli') : account.schoolId,
      account.fullName,
      account.role,
      'CONNEXION_UTILISATEUR',
      `Connexion réussie sous le rôle ${account.role} (${account.username})`
    );

    return { user: session, token: session.token! };
  }

  getUserAccounts(schoolId?: string): UserAccount[] {
    return this.userAccounts
      .filter((u) => {
        if (!schoolId || schoolId === 'platform') return true;
        return this.matchesSchool(u.schoolId, schoolId);
      })
      .map(({ passwordHash, ...safeUser }) => safeUser);
  }

  getUserAccountById(id: string): UserAccount | undefined {
    const account = this.userAccounts.find((u) => u.id === id);
    if (!account) return undefined;
    const { passwordHash, ...safe } = account;
    return safe;
  }

  createUserAccount(accountData: {
    schoolId: string;
    fullName: string;
    username: string;
    email?: string;
    phone?: string;
    password?: string;
    role: UserRole;
    studentId?: string;
    teacherId?: string;
    parentId?: string;
    createdBy?: string;
  }): UserAccount {
    // Check if username already exists
    const existing = this.userAccounts.find(
      (u) => u.username.toLowerCase() === accountData.username.trim().toLowerCase()
    );
    if (existing) {
      throw new Error(`L'identifiant "${accountData.username}" est déjà utilisé`);
    }

    const defaultPass = accountData.password?.trim() || (accountData.role === 'eleve' ? 'eleve123' : 'edukin123');

    const newAcc: DbUserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: accountData.schoolId,
      fullName: accountData.fullName.trim(),
      username: accountData.username.trim(),
      email: accountData.email?.trim() || '',
      phone: accountData.phone?.trim() || '',
      passwordHash: defaultPass,
      role: accountData.role,
      active: true,
      createdAt: new Date().toISOString(),
      studentId: accountData.studentId,
      teacherId: accountData.teacherId,
      parentId: accountData.parentId,
      createdBy: accountData.createdBy,
    };

    this.userAccounts.unshift(newAcc);

    this.logAction(
      accountData.schoolId === 'platform' ? (this.schools[0]?.id || 'sch-bobokoli') : accountData.schoolId,
      accountData.createdBy || 'Direction',
      'directeur',
      'CREATION_COMPTE',
      `Création du compte ${newAcc.role}: ${newAcc.fullName} (ID: ${newAcc.username})`
    );

    const { passwordHash, ...safe } = newAcc;
    return safe;
  }

  resetUserPassword(userId: string, newPassword?: string): boolean {
    const account = this.userAccounts.find((u) => u.id === userId);
    if (!account) return false;
    account.passwordHash = newPassword?.trim() || (account.role === 'eleve' ? 'eleve123' : 'edukin123');
    this.logAction(
      account.schoolId === 'platform' ? (this.schools[0]?.id || 'sch-bobokoli') : account.schoolId,
      'Direction',
      'directeur',
      'RESET_PASSWORD',
      `Réinitialisation mot de passe pour ${account.fullName} (${account.username})`
    );
    return true;
  }

  toggleUserStatus(userId: string, active: boolean): boolean {
    const account = this.userAccounts.find((u) => u.id === userId);
    if (!account) return false;
    account.active = active;
    this.logAction(
      account.schoolId === 'platform' ? (this.schools[0]?.id || 'sch-bobokoli') : account.schoolId,
      'Direction',
      'directeur',
      'TOGGLE_STATUS',
      `${active ? 'Activation' : 'Désactivation'} du compte pour ${account.fullName}`
    );
    return true;
  }

  // School Messaging
  getSchoolMessages(schoolId: string, role?: string, classId?: string): SchoolMessage[] {
    return this.schoolMessages.filter((m) => {
      if (!this.matchesSchool(m.schoolId, schoolId)) return false;
      if (classId && m.recipientTargetId && m.recipientTargetId !== classId) return false;
      return true;
    });
  }

  createSchoolMessage(schoolId: string, data: Omit<SchoolMessage, 'id' | 'schoolId' | 'sentAt' | 'read'>): SchoolMessage {
    const newMsg: SchoolMessage = {
      ...data,
      schoolId,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      sentAt: new Date().toISOString(),
      read: false,
    };
    this.schoolMessages.unshift(newMsg);

    // If marked with SMS, trigger an SMS notification
    if (data.smsSent) {
      this.sendSms(
        schoolId,
        '+243 82 444 9901',
        data.recipientTargetName,
        `Message École [${data.subject}]: ${data.body.substring(0, 100)}...`,
        'information'
      );
    }

    this.logAction(
      schoolId,
      data.senderName,
      data.senderRole,
      'ENVOI_MESSAGE',
      `Message envoyé à ${data.recipientTargetName}: "${data.subject}"`
    );

    return newMsg;
  }

  markSchoolMessageRead(id: string): boolean {
    const msg = this.schoolMessages.find((m) => m.id === id);
    if (!msg) return false;
    msg.read = true;
    return true;
  }

  // Schedule Slots
  getScheduleSlots(schoolId: string): TeacherScheduleSlot[] {
    return this.scheduleSlots;
  }

  // Lesson Logs (Cahier de textes)
  getLessonLogs(schoolId: string, classId?: string, subjectId?: string): LessonLog[] {
    return this.lessonLogs.filter((l) => {
      if (!this.matchesSchool(l.schoolId, schoolId)) return false;
      if (classId && l.classId !== classId) return false;
      if (subjectId && l.subjectId !== subjectId) return false;
      return true;
    });
  }

  createLessonLog(schoolId: string, data: Omit<LessonLog, 'id' | 'schoolId' | 'createdAt'>): LessonLog {
    const newLog: LessonLog = {
      ...data,
      schoolId,
      id: `lsn-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.lessonLogs.unshift(newLog);
    this.logAction(
      schoolId,
      data.teacherName,
      'enseignant',
      'CAHIER_DE_TEXTES',
      `Séance enregistrée: ${data.title}`
    );
    return newLog;
  }

  // Demandes de correction / déverrouillage de cotes
  getGradeCorrectionRequests(schoolId: string, classId?: string, status?: string): GradeCorrectionRequest[] {
    return this.gradeCorrections.filter((r) => {
      if (!this.matchesSchool(r.schoolId, schoolId)) return false;
      if (classId && r.classId !== classId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  createGradeCorrectionRequest(
    schoolId: string,
    data: Omit<GradeCorrectionRequest, 'id' | 'schoolId' | 'createdAt' | 'status'>
  ): GradeCorrectionRequest {
    const newReq: GradeCorrectionRequest = {
      ...data,
      schoolId,
      id: `gcr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.gradeCorrections.unshift(newReq);

    this.logAction(
      schoolId,
      data.teacherName,
      'enseignant',
      'DEMANDE_RECTIFICATION_NOTE',
      `Demande pour élève ${data.studentId}: cote souhaitée ${data.requestedScore}/${data.maxScore}. Motif: ${data.reason}`
    );

    // Also send an internal system message to Directeur des Études
    this.createSchoolMessage(schoolId, {
      senderName: data.teacherName,
      senderRole: 'enseignant',
      recipientType: 'administration',
      recipientTargetName: 'Directeur des Études',
      subject: `[Rectification de Cote] Demande de déverrouillage - ${data.reason.substring(0, 40)}`,
      body: `Bonjour Monsieur le Directeur des Études, l'enseignant ${data.teacherName} sollicite la rectification d'une note déjà publiée.\nCote actuelle: ${data.currentScore}/${data.maxScore} → Nouvelle cote demandée: ${data.requestedScore}/${data.maxScore}.\nMotif: ${data.reason}`,
      smsSent: false,
    });

    return newReq;
  }

  reviewGradeCorrectionRequest(
    schoolId: string,
    requestId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string
  ): GradeCorrectionRequest | null {
    const req = this.gradeCorrections.find((r) => r.id === requestId && this.matchesSchool(r.schoolId, schoolId));
    if (!req) return null;

    req.status = status;
    req.reviewedBy = reviewedBy;
    req.reviewedAt = new Date().toISOString();

    // If approved, update the actual grade in this.grades!
    if (status === 'approved') {
      const grade = this.grades.find(
        (g) =>
          this.matchesSchool(g.schoolId, schoolId) &&
          g.classId === req.classId &&
          g.subjectId === req.subjectId &&
          g.studentId === req.studentId &&
          (g.periodId === req.periodId || g.academicPeriodId === req.periodId)
      );
      if (grade) {
        grade.score = req.requestedScore;
        grade.recordedBy = `${grade.recordedBy || 'Enseignant'} (Rectifié par ${reviewedBy})`;
        grade.recordedAt = new Date().toISOString();
      }
    }

    this.logAction(
      schoolId,
      reviewedBy,
      'directeur_etudes',
      'TRAITEMENT_RECTIFICATION_NOTE',
      `Demande ${requestId} marquée ${status}`
    );

    return req;
  }

  // Appréciations du Titulaire de classe
  getClassAppreciations(schoolId: string, classId?: string, periodId?: string): ClassAppreciation[] {
    return this.classAppreciations.filter((a) => {
      if (!this.matchesSchool(a.schoolId, schoolId)) return false;
      if (classId && a.classId !== classId) return false;
      if (periodId && a.periodId !== periodId) return false;
      return true;
    });
  }

  saveClassAppreciation(
    schoolId: string,
    data: Omit<ClassAppreciation, 'id' | 'schoolId' | 'updatedAt'>
  ): ClassAppreciation {
    const existing = this.classAppreciations.find(
      (a) =>
        this.matchesSchool(a.schoolId, schoolId) &&
        a.classId === data.classId &&
        a.studentId === data.studentId &&
        a.periodId === data.periodId
    );

    const nowIso = new Date().toISOString();

    if (existing) {
      existing.appreciation = data.appreciation;
      existing.conduct = data.conduct;
      existing.updatedBy = data.updatedBy;
      existing.updatedAt = nowIso;
      return existing;
    }

    const created: ClassAppreciation = {
      ...data,
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      schoolId,
      updatedAt: nowIso,
    };
    this.classAppreciations.push(created);

    this.logAction(
      schoolId,
      data.updatedBy,
      'enseignant',
      'APPRECIATION_TITULAIRE',
      `Appréciation de bulletin enregistrée pour élève ${data.studentId}`
    );

    return created;
  }

  private logAction(schoolId: string, userName: string, userRole: UserRole, action: string, details: string) {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      schoolId,
      userName,
      userRole,
      action,
      entity: 'Système',
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
  }
}

export const db = new DatabaseManager();
