import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { dataService, checkSupabaseConnection, seedSupabaseIfEmpty } from './server/supabase.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Background connection check & auto-seeding
  checkSupabaseConnection().then(async (status) => {
    if (status.connected) {
      console.log('[Supabase] Connection verified successfully! Checking seed status...');
      await seedSupabaseIfEmpty();
    } else {
      console.log('[Supabase] Status:', status.error || 'Standby mode');
    }
  }).catch((err) => console.warn('[Supabase] Background check failed:', err.message));

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------
  app.get('/api/health', async (req: Request, res: Response) => {
    const supabaseStatus = await checkSupabaseConnection();
    const schools = await dataService.getSchools();
    res.json({
      status: 'ok',
      service: 'EduKin RDC School Platform API',
      timestamp: new Date().toISOString(),
      schoolsCount: schools.length,
      supabase: supabaseStatus,
    });
  });

  // Supabase Status & Control
  app.get('/api/supabase/status', async (req: Request, res: Response) => {
    const status = await checkSupabaseConnection();
    res.json(status);
  });

  app.post('/api/supabase/seed', async (req: Request, res: Response) => {
    const success = await seedSupabaseIfEmpty();
    res.json({ success, message: success ? 'Données scolaires RDC synchronisées dans Supabase' : 'Échec de la synchronisation' });
  });

  // 1. Écoles (Multi-Tenant)
  app.get('/api/schools', async (req: Request, res: Response) => {
    const schools = await dataService.getSchools();
    res.json(schools);
  });

  app.get('/api/schools/:id', async (req: Request, res: Response) => {
    const school = await dataService.getSchool(req.params.id);
    if (!school) return res.status(404).json({ error: 'Établissement non trouvé' });
    res.json(school);
  });

  app.post('/api/schools', async (req: Request, res: Response) => {
    try {
      const { name, code, city, province, address, phone, email, currencyDefault, exchangeRateUsdCdf, plan, director } = req.body;
      if (!name || !code) {
        return res.status(400).json({ error: 'Le nom et le code de l’établissement sont obligatoires' });
      }
      const newSchool = await dataService.createSchool({
        name,
        code,
        city: city || 'Kinshasa',
        province: province || 'Kinshasa',
        address: address || '',
        phone: phone || '',
        email: email || '',
        currencyDefault: currencyDefault || 'USD',
        exchangeRateUsdCdf: exchangeRateUsdCdf || 2850,
        plan: plan || 'Standard',
        active: true,
        ...(director ? { director } : {}),
      } as any);
      res.status(201).json(newSchool);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/schools/:id', (req: Request, res: Response) => {
    const updated = db.updateSchool(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Établissement non trouvé' });
    res.json(updated);
  });

  // -------------------------------------------------------------
  // AUTHENTICATION & ACCESS CONTROL
  // -------------------------------------------------------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
    }

    const authResult = db.authenticate(identifier, password);
    if (!authResult) {
      return res.status(401).json({
        error: 'Identifiant ou mot de passe incorrect. Vérifiez vos accès ou contactez la direction de votre école.',
      });
    }

    res.json(authResult);
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Déconnexion effectuée avec succès' });
  });

  app.get('/api/auth/demo-accounts', (_req: Request, res: Response) => {
    res.json([
      {
        role: 'super_admin',
        label: 'Super Administrateur (Entreprise EduKin)',
        identifier: 'admin@edukin.cd',
        defaultPassword: 'admin123',
        schoolName: 'Direction Nationale EduKin RDC',
        description: 'Gestion globale des écoles partenaires et création des comptes directeurs',
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
        role: 'directeur',
        label: 'Directrice (Lycée Shaumba)',
        identifier: 'direction@lyceeshaumba.cd',
        defaultPassword: 'shaumba123',
        schoolName: 'Lycée Shaumba',
        description: 'Chef d’établissement partenaire',
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
        role: 'comptable',
        label: 'Comptable / Caisse (Finances)',
        identifier: 'comptable@bobokoli.cd',
        defaultPassword: 'compta123',
        schoolName: 'Collège Bobokoli',
        description: 'Encaissements, bordereaux de frais, Mobile Money RDC',
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
        role: 'admin_scolaire',
        label: 'Secrétaire / Admin Scolaire',
        identifier: 'secretaire@bobokoli.cd',
        defaultPassword: 'secr123',
        schoolName: 'Collège Bobokoli',
        description: 'Inscriptions des élèves, registres officiels matricules',
      },
      {
        role: 'enseignant',
        label: 'Enseignant Titulaire (Math & Info)',
        identifier: 'prof.kalambayi@bobokoli.cd',
        defaultPassword: 'prof123',
        schoolName: 'Collège Bobokoli',
        description: 'Saisie des notes périodiques et appel journalier',
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
    ]);
  });

  // -------------------------------------------------------------
  // USER ACCOUNTS & PROVISIONING (ROLE HIERARCHY)
  // -------------------------------------------------------------
  app.get('/api/users', (req: Request, res: Response) => {
    const schoolId = req.query.schoolId as string | undefined;
    const users = db.getUserAccounts(schoolId);
    res.json(users);
  });

  app.post('/api/users', (req: Request, res: Response) => {
    try {
      const { schoolId, fullName, username, email, phone, password, role, studentId, teacherId, parentId, createdBy } = req.body;
      if (!fullName || !username || !role) {
        return res.status(400).json({ error: 'Nom complet, identifiant de connexion et rôle sont obligatoires' });
      }

      const newAccount = db.createUserAccount({
        schoolId: schoolId || 'platform',
        fullName,
        username,
        email,
        phone,
        password,
        role,
        studentId,
        teacherId,
        parentId,
        createdBy: createdBy || 'Direction',
      });

      res.status(201).json(newAccount);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/users/:id/reset-password', (req: Request, res: Response) => {
    const { newPassword } = req.body;
    const ok = db.resetUserPassword(req.params.id, newPassword);
    if (!ok) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  });

  app.patch('/api/users/:id/status', (req: Request, res: Response) => {
    const { active } = req.body;
    const ok = db.toggleUserStatus(req.params.id, Boolean(active));
    if (!ok) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true, message: `Compte ${active ? 'activé' : 'désactivé'} avec succès` });
  });

  // 2. Années & Périodes Scolaires
  app.get('/api/academic-years', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const years = await dataService.getAcademicYears(schoolId);
    res.json(years);
  });

  app.post('/api/academic-years', (req: Request, res: Response) => {
    const { schoolId, name, startDate, endDate } = req.body;
    if (!schoolId || !name) return res.status(400).json({ error: 'Paramètres manquants' });
    const ay = db.createAcademicYear(schoolId, name, startDate, endDate);
    res.status(201).json(ay);
  });

  app.get('/api/academic-periods', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const periods = await dataService.getAcademicPeriods(schoolId);
    res.json(periods);
  });

  app.post('/api/academic-periods', (req: Request, res: Response) => {
    const { schoolId, academicYearId, name, code, semester, weight } = req.body;
    const period = db.createAcademicPeriod(schoolId, {
      schoolId: schoolId || 'sch-bobokoli',
      academicYearId,
      name,
      code,
      semester: Number(semester) as 1 | 2,
      weight: Number(weight) || 1,
      isCurrent: true,
    });
    res.status(201).json(period);
  });

  // 3. Classes
  app.get('/api/classes', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const classes = await dataService.getClasses(schoolId);
    res.json(classes);
  });

  app.post('/api/classes', (req: Request, res: Response) => {
    const { schoolId, academicYearId, name, level, section, roomNumber, capacity, mainTeacherId } = req.body;
    if (!name || !level) return res.status(400).json({ error: 'Nom et niveau requis' });
    const newClass = db.createClass(schoolId, {
      academicYearId,
      name,
      level,
      section: section || 'Générale',
      roomNumber,
      capacity: Number(capacity) || 45,
      mainTeacherId,
    });
    res.status(201).json(newClass);
  });

  app.put('/api/classes/:id', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || req.body.schoolId || 'sch-bobokoli';
    const updatedBy = req.body.updatedBy || 'Direction';
    const updated = await dataService.updateClass(schoolId, req.params.id, req.body, updatedBy);
    if (!updated) return res.status(404).json({ error: 'Classe non trouvée' });
    res.json(updated);
  });

  app.patch('/api/classes/:id/titulaire', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || req.body.schoolId || 'sch-bobokoli';
    const { teacherId, updatedBy } = req.body;
    const updated = await dataService.updateClass(schoolId, req.params.id, { mainTeacherId: teacherId }, updatedBy || 'Directeur');
    if (!updated) return res.status(404).json({ error: 'Classe non trouvée' });
    res.json(updated);
  });

  // 4. Matières
  app.get('/api/subjects', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const subjects = await dataService.getSubjects(schoolId);
    res.json(subjects);
  });

  app.post('/api/subjects', (req: Request, res: Response) => {
    const { schoolId, name, code, category, defaultCoefficient, defaultMaxScore } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Nom et code requis' });
    const newSub = db.createSubject(schoolId, {
      name,
      code,
      category: category || 'Sciences',
      defaultCoefficient: Number(defaultCoefficient) || 1,
      defaultMaxScore: Number(defaultMaxScore) || 20,
    });
    res.status(201).json(newSub);
  });

  // 5. Élèves
  app.get('/api/students', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const classId = req.query.classId as string | undefined;
    const q = req.query.q as string | undefined;
    const students = await dataService.getStudents(schoolId, classId, q);
    res.json(students);
  });

  app.get('/api/students/:id', async (req: Request, res: Response) => {
    const student = await dataService.getStudent(req.params.id);
    if (!student) return res.status(404).json({ error: 'Élève non trouvé' });
    res.json(student);
  });

  app.post('/api/students', async (req: Request, res: Response) => {
    const { schoolId, firstName, lastName, postName, gender, birthDate, birthPlace, address, classId, parentId } = req.body;
    if (!firstName || !lastName || !classId) {
      return res.status(400).json({ error: 'Prénom, Nom et Classe sont obligatoires' });
    }
    const newStudent = await dataService.createStudent(schoolId, {
      firstName,
      lastName,
      postName: postName || '',
      gender: gender || 'M',
      birthDate: birthDate || '2010-01-01',
      birthPlace: birthPlace || 'Kinshasa',
      address: address || '',
      classId,
      parentId: parentId || '',
    });
    res.status(201).json(newStudent);
  });

  app.put('/api/students/:id', (req: Request, res: Response) => {
    const updated = db.updateStudent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Élève introuvable' });
    res.json(updated);
  });

  // 6. Parents & Enseignants & Staff
  app.get('/api/parents', (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    res.json(db.getParents(schoolId));
  });

  app.post('/api/parents', (req: Request, res: Response) => {
    const { schoolId, fullName, phone, email, address, occupation, studentIds } = req.body;
    if (!fullName || !phone) return res.status(400).json({ error: 'Nom et téléphone requis' });
    const parent = db.createParent(schoolId, {
      fullName,
      phone,
      email: email || '',
      address: address || '',
      occupation: occupation || '',
      studentIds: studentIds || [],
    });
    res.status(201).json(parent);
  });

  app.get('/api/teachers', (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    res.json(db.getTeachers(schoolId));
  });

  app.put('/api/teachers/:id', (req: Request, res: Response) => {
    const updated = db.updateTeacher(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Enseignant introuvable' });
    res.json(updated);
  });

  app.put('/api/users/:id/profile', (req: Request, res: Response) => {
    const updated = db.updateUserProfile(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(updated);
  });

  app.get('/api/staff', (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    res.json(db.getStaff(schoolId));
  });

  // 7. Présences (Appel en direct avec date dynamique)
  app.get('/api/attendance', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const classId = req.query.classId as string | undefined;
    const date = req.query.date as string | undefined;
    const records = await dataService.getAttendance(schoolId, classId, date);
    res.json(records);
  });

  app.post('/api/attendance/batch', async (req: Request, res: Response) => {
    const { schoolId, classId, date, records, recordedBy } = req.body;
    if (!schoolId || !classId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Données de présence invalides' });
    }
    const saved = await dataService.saveAttendanceBatch(schoolId, classId, date, records, recordedBy || 'Enseignant');
    res.json({ success: true, count: saved.length, records: saved });
  });

  app.post('/api/attendance', async (req: Request, res: Response) => {
    const { schoolId, studentId, classId, date, status, note, recordedBy } = req.body;
    const saved = await dataService.saveAttendanceBatch(
      schoolId || 'sch-bobokoli',
      classId,
      date || new Date().toISOString().split('T')[0],
      [{ studentId, status, justification: note }],
      recordedBy || 'Enseignant'
    );
    res.status(201).json(saved[0] || { studentId, status });
  });

  // 8. Notes & Évaluations
  app.get('/api/grades', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const classId = req.query.classId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const periodId = req.query.periodId as string | undefined;
    const studentId = req.query.studentId as string | undefined;
    const grades = await dataService.getGrades(schoolId, classId, subjectId, periodId, studentId);
    res.json(grades);
  });

  app.post('/api/grades/batch', async (req: Request, res: Response) => {
    const { schoolId, classId, subjectId, periodId, grades, status, recordedBy } = req.body;
    if (!schoolId || !classId || !subjectId || !periodId || !grades) {
      return res.status(400).json({ error: 'Paramètres manquants pour la saisie des notes' });
    }
    const saved = await dataService.saveGradesBatch(schoolId, classId, subjectId, periodId, grades, status || 'draft', recordedBy || 'Enseignant');
    res.json({ success: true, count: saved.length, records: saved });
  });

  // Demandes de déverrouillage / rectification de cotes (Directeur des Études)
  app.get('/api/grade-corrections', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const classId = req.query.classId as string | undefined;
    const status = req.query.status as string | undefined;
    const list = await dataService.getGradeCorrectionRequests(schoolId, classId, status);
    res.json(list);
  });

  app.post('/api/grade-corrections', async (req: Request, res: Response) => {
    const { schoolId, teacherName, teacherId, classId, subjectId, studentId, periodId, currentScore, requestedScore, maxScore, reason } = req.body;
    if (!schoolId || !classId || !studentId || !reason) {
      return res.status(400).json({ error: 'Champs obligatoires manquants pour la demande de rectification' });
    }
    const created = await dataService.createGradeCorrectionRequest(schoolId, {
      teacherName: teacherName || 'Enseignant',
      teacherId,
      classId,
      subjectId,
      studentId,
      periodId,
      currentScore: Number(currentScore),
      requestedScore: Number(requestedScore),
      maxScore: Number(maxScore) || 20,
      reason,
    });
    res.status(201).json(created);
  });

  app.patch('/api/grade-corrections/:id/review', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || req.body.schoolId || 'sch-bobokoli';
    const { status, reviewedBy } = req.body;
    const updated = await dataService.reviewGradeCorrectionRequest(schoolId, req.params.id, status, reviewedBy || 'Directeur des Études');
    if (!updated) return res.status(404).json({ error: 'Demande introuvable' });
    res.json(updated);
  });

  // Appréciations officielles du Titulaire de classe (Professeur Principal)
  app.get('/api/class-appreciations', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const classId = req.query.classId as string | undefined;
    const periodId = req.query.periodId as string | undefined;
    const list = await dataService.getClassAppreciations(schoolId, classId, periodId);
    res.json(list);
  });

  app.post('/api/class-appreciations', async (req: Request, res: Response) => {
    const { schoolId, classId, studentId, periodId, appreciation, conduct, updatedBy } = req.body;
    if (!schoolId || !classId || !studentId) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    const saved = await dataService.saveClassAppreciation(schoolId, {
      classId,
      studentId,
      periodId: periodId || 'per-p1',
      appreciation: appreciation || '',
      conduct: conduct || 'Bonne',
      updatedBy: updatedBy || 'Titulaire de classe',
    });
    res.status(201).json(saved);
  });

  app.post('/api/grades', async (req: Request, res: Response) => {
    const { schoolId, classId, subjectId, academicPeriodId, periodId, studentId, score, maxScore, coefficient, status, recordedBy } = req.body;
    const targetPeriod = periodId || academicPeriodId;
    const saved = await dataService.saveGradesBatch(
      schoolId || 'sch-bobokoli',
      classId,
      subjectId,
      targetPeriod,
      [{
        studentId,
        score: Number(score),
        maxScore: Number(maxScore) || 20,
        coefficient: Number(coefficient) || 1,
      }],
      status || 'published',
      recordedBy || 'Enseignant'
    );
    res.status(201).json(saved[0] || { studentId, score, status });
  });

  // 9. Bulletin officiel RDC
  app.get('/api/bulletins/:studentId', (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const periodId = req.query.periodId as string | undefined;
    const bulletin = db.getStudentBulletin(schoolId, req.params.studentId, periodId);
    if (!bulletin) return res.status(404).json({ error: 'Données du bulletin indisponibles' });
    res.json(bulletin);
  });

  // 10. Discipline & Incidents
  const handleGetDiscipline = (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const studentId = req.query.studentId as string | undefined;
    res.json(db.getDisciplineIncidents(schoolId, studentId));
  };

  const handlePostDiscipline = (req: Request, res: Response) => {
    const { schoolId, studentId, date, category, description, severity, sanction, parentNotified, recordedBy } = req.body;
    if (!schoolId || !studentId || !category) {
      return res.status(400).json({ error: 'Paramètres d’incident manquants' });
    }
    const inc = db.createDisciplineIncident(schoolId, {
      studentId,
      date: date || new Date().toISOString().split('T')[0],
      category,
      description: description || '',
      severity: severity || 'Modéré',
      sanction: sanction || 'Avertissement',
      parentNotified: Boolean(parentNotified),
      recordedBy: recordedBy || 'Directeur de Discipline',
    });
    res.status(201).json(inc);
  };

  app.get('/api/discipline', handleGetDiscipline);
  app.get('/api/incidents', handleGetDiscipline);
  app.post('/api/discipline', handlePostDiscipline);
  app.post('/api/incidents', handlePostDiscipline);

  // 11. Frais & Paiements (Mobile Money RDC: M-Pesa, Airtel Money, Orange Money)
  app.get('/api/fees', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const fees = await dataService.getFees(schoolId);
    res.json(fees);
  });

  app.post('/api/fees', (req: Request, res: Response) => {
    const { schoolId, academicYearId, name, amountUSD, amountCDF, dueDate, mandatory } = req.body;
    const fee = db.createFee(schoolId, {
      academicYearId,
      name,
      amountUSD: Number(amountUSD) || 0,
      amountCDF: Number(amountCDF) || 0,
      dueDate: dueDate || '',
      mandatory: mandatory !== false,
    });
    res.status(201).json(fee);
  });

  app.get('/api/payments', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const studentId = req.query.studentId as string | undefined;
    const payments = await dataService.getPayments(schoolId, studentId);
    res.json(payments);
  });

  app.post('/api/payments', async (req: Request, res: Response) => {
    const { schoolId, studentId, feeId, amountUSD, amountCDF, currency, paymentMethod, transactionReference, payerName, payerPhone, recordedBy } = req.body;
    if (!schoolId || !studentId || !amountUSD) {
      return res.status(400).json({ error: 'Données de paiement incomplètes' });
    }
    const payment = await dataService.recordPayment(schoolId, {
      studentId,
      feeId: feeId || '',
      amountUSD: Number(amountUSD),
      amountCDF: Number(amountCDF) || Number(amountUSD) * 2850,
      currency: currency || 'USD',
      paymentMethod: paymentMethod || 'mpesa',
      transactionReference: transactionReference || `TX-${Date.now()}`,
      payerName: payerName || 'Parent Tuteur',
      payerPhone: payerPhone || '',
      recordedBy: recordedBy || 'Système',
    });
    res.status(201).json(payment);
  });

  app.get('/api/finances/student/:studentId', (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    res.json(db.getStudentFinancialStatus(schoolId, req.params.studentId));
  });

  // 12. SMS & Notifications
  const handleGetSmsLogs = async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const logs = await dataService.getSmsLogs(schoolId);
    res.json(logs);
  };

  app.get('/api/sms', handleGetSmsLogs);
  app.get('/api/sms-logs', handleGetSmsLogs);

  app.post('/api/sms/send', async (req: Request, res: Response) => {
    const { schoolId, recipientPhone, recipientName, message, category } = req.body;
    if (!recipientPhone || !message) {
      return res.status(400).json({ error: 'Numéro de téléphone et message requis' });
    }
    const log = await dataService.sendSms(schoolId || 'sch-bobokoli', recipientPhone, recipientName || 'Parent', message, category || 'information');
    res.status(201).json({ success: true, log });
  });

  // 13. Annonces & Audit Logs
  app.get('/api/announcements', (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const role = req.query.role as string | undefined;
    res.json(db.getAnnouncements(schoolId, role));
  });

  app.post('/api/announcements', (req: Request, res: Response) => {
    const { schoolId, title, content, targetRole, priority, authorName } = req.body;
    const anc = db.createAnnouncement(schoolId || 'sch-bobokoli', {
      title,
      content,
      targetRole: targetRole || 'all',
      priority: priority || 'normal',
      authorName: authorName || 'Direction',
    });
    res.status(201).json(anc);
  });

  // 14. Messagerie Scolaire (Enseignant, Parents, Direction)
  app.get('/api/messages', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const role = req.query.role as string | undefined;
    const classId = req.query.classId as string | undefined;
    const list = await dataService.getSchoolMessages(schoolId, role, classId);
    res.json(list);
  });

  app.post('/api/messages', async (req: Request, res: Response) => {
    const { schoolId, senderName, senderRole, senderId, recipientType, recipientTargetId, recipientTargetName, subject, body, smsSent } = req.body;
    if (!subject || !body || !recipientTargetName) {
      return res.status(400).json({ error: 'Objet, message et destinataire requis' });
    }
    const msg = await dataService.createSchoolMessage(schoolId || 'sch-bobokoli', {
      senderName: senderName || 'Professeur',
      senderRole: senderRole || 'enseignant',
      senderId,
      recipientType: recipientType || 'classe',
      recipientTargetId,
      recipientTargetName,
      subject,
      body,
      smsSent: Boolean(smsSent),
    });
    res.status(201).json(msg);
  });

  app.patch('/api/messages/:id/read', (req: Request, res: Response) => {
    const ok = db.markSchoolMessageRead(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Message introuvable' });
    res.json({ success: true });
  });

  // 15. Horaire de cours & Cahier de textes
  app.get('/api/schedule', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const slots = await dataService.getScheduleSlots(schoolId);
    res.json(slots);
  });

  app.get('/api/lesson-logs', async (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    const classId = req.query.classId as string | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const list = await dataService.getLessonLogs(schoolId, classId, subjectId);
    res.json(list);
  });

  app.post('/api/lesson-logs', async (req: Request, res: Response) => {
    const { schoolId, classId, subjectId, teacherName, date, title, summary, homework, homeworkDueDate } = req.body;
    if (!classId || !subjectId || !title || !summary) {
      return res.status(400).json({ error: 'Classe, matière, titre et résumé requis' });
    }
    const log = await dataService.createLessonLog(schoolId || 'sch-bobokoli', {
      classId,
      subjectId,
      teacherName: teacherName || 'Professeur',
      date: date || new Date().toISOString().split('T')[0],
      title,
      summary,
      homework,
      homeworkDueDate,
    });
    res.status(201).json(log);
  });

  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const schoolId = (req.query.schoolId as string) || 'sch-bobokoli';
    res.json(db.getAuditLogs(schoolId));
  });

  // Export Supabase SQL schema endpoint
  app.get('/api/export-supabase-sql', (req: Request, res: Response) => {
    try {
      const sqlPath = path.join(process.cwd(), 'supabase', 'schema.sql');
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(sqlContent);
      } else {
        res.status(404).send('-- Schema file not found');
      }
    } catch (err: any) {
      res.status(500).send(`-- Error reading schema: ${err.message}`);
    }
  });

  // -------------------------------------------------------------
  // VITE MIDDLEWARE (Development) or STATIC ASSETS (Production)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduKin RDC School Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
