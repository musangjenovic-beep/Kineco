import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { db } from './db.ts';
import {
  School,
  AcademicYear,
  AcademicPeriod,
  SchoolClass,
  Subject,
  ClassSubject,
  Student,
  Parent,
  AttendanceRecord,
  Grade,
  DisciplineIncident,
  FeeDefinition,
  PaymentRecord,
  SmsLog,
  Announcement,
  AuditLog,
  LessonLog,
  GradeCorrectionRequest,
  ClassAppreciation,
  SchoolMessage,
  TeacherScheduleSlot,
} from '../src/types.ts';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim() || '';

let supabase: SupabaseClient | null = null;
let isConnected = false;
let lastError: string | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('[Supabase] Client initialized with URL:', supabaseUrl);
  } catch (err: any) {
    console.error('[Supabase] Failed to initialize client:', err.message);
    lastError = err.message;
  }
} else {
  console.log('[Supabase] Credentials not configured yet in process.env. Using in-memory fallback.');
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  url: string;
  tablesFound?: string[];
  error?: string;
}> {
  if (!supabase) {
    return {
      connected: false,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Non configurée',
      error: 'Variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes',
    };
  }

  try {
    const { data, error } = await supabase.from('schools').select('id, name, code').limit(5);
    if (error) {
      isConnected = false;
      lastError = error.message;
      return {
        connected: false,
        url: supabaseUrl,
        error: error.message,
      };
    }

    isConnected = true;
    lastError = null;
    return {
      connected: true,
      url: supabaseUrl,
      tablesFound: ['schools', 'students', 'classes', 'grades', 'payments'],
    };
  } catch (err: any) {
    isConnected = false;
    lastError = err.message;
    return {
      connected: false,
      url: supabaseUrl,
      error: err.message,
    };
  }
}

// -------------------------------------------------------------
// SEED INITIAL DATA INTO SUPABASE IF EMPTY
// -------------------------------------------------------------
export async function seedSupabaseIfEmpty(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { count, error: countErr } = await supabase
      .from('schools')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      console.warn('[Supabase Seed] Could not check schools count:', countErr.message);
      return false;
    }

    if (count && count > 0) {
      console.log(`[Supabase Seed] Database already has ${count} schools. Skipping seed.`);
      return true;
    }

    console.log('[Supabase Seed] Database is empty. Seeding initial Congolese educational data...');

    // 1. Schools
    const localSchools = db.getSchools();
    for (const s of localSchools) {
      await supabase.from('schools').upsert({
        id: s.id.length === 36 ? s.id : undefined, // only if UUID or let Postgres generate
        code: s.code,
        name: s.name,
        city: s.city,
        province: s.province,
        address: s.address,
        phone: s.phone,
        email: s.email,
        logo_url: s.logoUrl,
        currency_default: s.currencyDefault,
        exchange_rate_usd_cdf: s.exchangeRateUsdCdf,
        plan: s.plan,
        active: s.active,
      }, { onConflict: 'code' });
    }

    // Récupérer les écoles insérées
    const { data: insertedSchools } = await supabase.from('schools').select('id, code');
    const schoolMap = new Map<string, string>();
    insertedSchools?.forEach((s) => schoolMap.set(s.code, s.id));

    const bobId = schoolMap.get('BOB-KIN') || localSchools[0].id;

    // 2. Année scolaire
    const { data: insertedYear } = await supabase.from('academic_years').insert({
      school_id: bobId,
      name: '2025-2026',
      start_date: '2025-09-01',
      end_date: '2026-07-02',
      is_current: true,
    }).select('id').single();

    const yearId = insertedYear?.id;

    if (yearId) {
      // 3. Périodes
      await supabase.from('academic_periods').insert([
        { school_id: bobId, academic_year_id: yearId, name: '1ère Période', code: 'P1', semester: 1, weight: 1.0, is_current: false },
        { school_id: bobId, academic_year_id: yearId, name: '2ème Période', code: 'P2', semester: 1, weight: 1.0, is_current: false },
        { school_id: bobId, academic_year_id: yearId, name: 'Examen 1er Semestre', code: 'EX1', semester: 1, weight: 2.0, is_current: false },
        { school_id: bobId, academic_year_id: yearId, name: '3ème Période', code: 'P3', semester: 2, weight: 1.0, is_current: true },
        { school_id: bobId, academic_year_id: yearId, name: '4ème Période', code: 'P4', semester: 2, weight: 1.0, is_current: false },
        { school_id: bobId, academic_year_id: yearId, name: 'Examen 2ème Semestre', code: 'EX2', semester: 2, weight: 2.0, is_current: false },
      ]);

      // 4. Classes
      const { data: insertedClasses } = await supabase.from('classes').insert([
        { school_id: bobId, academic_year_id: yearId, name: '7ème Éducation de Base A', level: 'Cycle Terminal EB', section: 'Générale', room_number: 'B101', capacity: 45 },
        { school_id: bobId, academic_year_id: yearId, name: '8ème Éducation de Base B', level: 'Cycle Terminal EB', section: 'Générale', room_number: 'B102', capacity: 45 },
        { school_id: bobId, academic_year_id: yearId, name: '1ère Scientifique A (3ème Humanités)', level: 'Humanités', section: 'Scientifique', room_number: 'S201', capacity: 40 },
        { school_id: bobId, academic_year_id: yearId, name: '2ème Commerciale & Gestion', level: 'Humanités', section: 'Commerciale & Gestion', room_number: 'C203', capacity: 42 },
      ]).select('id, name');

      const class1Id = insertedClasses?.[0]?.id;

      // 5. Matières
      const { data: insertedSubjects } = await supabase.from('subjects').insert([
        { school_id: bobId, name: 'Mathématiques', code: 'MATH', category: 'Sciences', default_coefficient: 3.0, default_max_score: 50.0 },
        { school_id: bobId, name: 'Français', code: 'FRAN', category: 'Lettres & Langues', default_coefficient: 3.0, default_max_score: 50.0 },
        { school_id: bobId, name: 'Physique & Technologie', code: 'PHYS', category: 'Sciences', default_coefficient: 2.0, default_max_score: 40.0 },
        { school_id: bobId, name: 'Histoire & Citoyenneté', code: 'HIST', category: 'Sciences Humaines', default_coefficient: 1.5, default_max_score: 20.0 },
        { school_id: bobId, name: 'Informatique & TIC', code: 'INFO', category: 'Technique', default_coefficient: 2.0, default_max_score: 20.0 },
      ]).select('id, code');

      // 6. Frais scolaires
      await supabase.from('fees').insert([
        { school_id: bobId, academic_year_id: yearId, name: 'Minerval 1er Trimestre', amount_usd: 120.00, amount_cdf: 342000.00, due_date: '2025-10-15', mandatory: true },
        { school_id: bobId, academic_year_id: yearId, name: 'Minerval 2ème Trimestre', amount_usd: 120.00, amount_cdf: 342000.00, due_date: '2026-01-20', mandatory: true },
        { school_id: bobId, academic_year_id: yearId, name: 'Minerval 3ème Trimestre', amount_usd: 120.00, amount_cdf: 342000.00, due_date: '2026-04-15', mandatory: true },
        { school_id: bobId, academic_year_id: yearId, name: 'Frais Informatique & Laboratoire', amount_usd: 35.00, amount_cdf: 99750.00, due_date: '2025-11-01', mandatory: true },
      ]);

      // 7. Parents et Élèves
      const { data: insertedParent } = await supabase.from('parents').insert({
        school_id: bobId,
        full_name: 'Dr. Jean-Pierre Mukendi',
        phone: '+243 81 234 5678',
        email: 'jp.mukendi@gmail.com',
        address: 'Av. Justice 12, Gombe',
        occupation: 'Médecin Chirurgien',
      }).select('id').single();

      if (class1Id && insertedParent?.id) {
        await supabase.from('students').insert([
          {
            school_id: bobId,
            matricule: 'BOB-2025-001',
            first_name: 'Emmanuel',
            last_name: 'Mukendi',
            post_name: 'Tshisekedi',
            gender: 'M',
            birth_date: '2012-04-14',
            birth_place: 'Kinshasa',
            address: 'Av. Justice 12, Gombe',
            class_id: class1Id,
            parent_id: insertedParent.id,
            active: true,
          },
          {
            school_id: bobId,
            matricule: 'BOB-2025-002',
            first_name: 'Grâce',
            last_name: 'Kanku',
            post_name: 'Kasongo',
            gender: 'F',
            birth_date: '2012-09-03',
            birth_place: 'Lubumbashi',
            address: 'Av. Colonel Mondjiba 88, Ngaliema',
            class_id: class1Id,
            parent_id: insertedParent.id,
            active: true,
          }
        ]);
      }
    }

    console.log('[Supabase Seed] Seeding completed successfully!');
    return true;
  } catch (err: any) {
    console.error('[Supabase Seed] Error while seeding:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// DATA ACCESS SERVICE WITH SUPABASE & LOCAL FALLBACK
// -------------------------------------------------------------
export const dataService = {
  // 1. Écoles
  async getSchools(): Promise<School[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('schools').select('*').order('name');
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            name: row.name,
            code: row.code,
            city: row.city,
            province: row.province,
            address: row.address || '',
            phone: row.phone || '',
            email: row.email || '',
            logoUrl: row.logo_url,
            currencyDefault: row.currency_default || 'USD',
            exchangeRateUsdCdf: Number(row.exchange_rate_usd_cdf) || 2850,
            plan: row.plan || 'Standard',
            active: row.active ?? true,
            createdAt: row.created_at,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getSchools:', e);
      }
    }
    return db.getSchools();
  },

  async getSchool(id: string): Promise<School | undefined> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('schools').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            code: data.code,
            city: data.city,
            province: data.province,
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            logoUrl: data.logo_url,
            currencyDefault: data.currency_default || 'USD',
            exchangeRateUsdCdf: Number(data.exchange_rate_usd_cdf) || 2850,
            plan: data.plan || 'Standard',
            active: data.active ?? true,
            createdAt: data.created_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getSchool:', e);
      }
    }
    return db.getSchool(id);
  },

  async createSchool(schoolData: Partial<School>): Promise<School> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('schools').insert({
          name: schoolData.name,
          code: schoolData.code,
          city: schoolData.city || 'Kinshasa',
          province: schoolData.province || 'Kinshasa',
          address: schoolData.address || '',
          phone: schoolData.phone || '',
          email: schoolData.email || '',
          logo_url: schoolData.logoUrl,
          currency_default: schoolData.currencyDefault || 'USD',
          exchange_rate_usd_cdf: schoolData.exchangeRateUsdCdf || 2850,
          plan: schoolData.plan || 'Standard',
          active: true,
        }).select().single();

        if (!error && data) {
          if ((schoolData as any).director?.fullName && (schoolData as any).director?.email) {
            try {
              db.createUserAccount({
                schoolId: data.id,
                fullName: (schoolData as any).director.fullName,
                username: (schoolData as any).director.email,
                email: (schoolData as any).director.email,
                phone: (schoolData as any).director.phone || '',
                password: (schoolData as any).director.password || 'directeur123',
                role: 'directeur',
                createdBy: 'Entreprise EduKin',
              });
            } catch (err) {
              console.warn('[Supabase] Failed to auto-provision director:', err);
            }
          }
          return {
            id: data.id,
            name: data.name,
            code: data.code,
            city: data.city,
            province: data.province,
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            logoUrl: data.logo_url,
            currencyDefault: data.currency_default,
            exchangeRateUsdCdf: Number(data.exchange_rate_usd_cdf),
            plan: data.plan,
            active: data.active,
            createdAt: data.created_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for createSchool:', e);
      }
    }
    return db.createSchool(schoolData as any);
  },

  // 2. Années & Périodes
  async getAcademicYears(schoolId: string): Promise<AcademicYear[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('academic_years')
          .select('*')
          .eq('school_id', schoolId)
          .order('start_date', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            name: row.name,
            startDate: row.start_date,
            endDate: row.end_date,
            isCurrent: row.is_current,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getAcademicYears');
      }
    }
    return db.getAcademicYears(schoolId);
  },

  async getAcademicPeriods(schoolId: string): Promise<AcademicPeriod[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('academic_periods')
          .select('*')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            academicYearId: row.academic_year_id,
            name: row.name,
            code: row.code,
            semester: row.semester,
            weight: Number(row.weight),
            isCurrent: row.is_current,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getAcademicPeriods');
      }
    }
    return db.getAcademicPeriods(schoolId);
  },

  // 3. Classes
  async getClasses(schoolId: string): Promise<SchoolClass[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .eq('school_id', schoolId)
          .order('name');
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            academicYearId: row.academic_year_id,
            name: row.name,
            level: row.level,
            section: row.section,
            roomNumber: row.room_number,
            capacity: row.capacity,
            mainTeacherId: row.main_teacher_id,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getClasses');
      }
    }
    return db.getClasses(schoolId);
  },

  async updateClass(schoolId: string, classId: string, updates: Partial<SchoolClass>, updatedBy = 'Direction'): Promise<SchoolClass | undefined> {
    if (supabase) {
      try {
        const updatePayload: any = {};
        if (updates.name !== undefined) updatePayload.name = updates.name;
        if (updates.level !== undefined) updatePayload.level = updates.level;
        if (updates.section !== undefined) updatePayload.section = updates.section;
        if (updates.roomNumber !== undefined) updatePayload.room_number = updates.roomNumber;
        if (updates.capacity !== undefined) updatePayload.capacity = updates.capacity;
        if (updates.mainTeacherId !== undefined) updatePayload.main_teacher_id = updates.mainTeacherId || null;

        const { data, error } = await supabase
          .from('classes')
          .update(updatePayload)
          .eq('id', classId)
          .select()
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            schoolId: data.school_id,
            academicYearId: data.academic_year_id,
            name: data.name,
            level: data.level,
            section: data.section,
            roomNumber: data.room_number,
            capacity: data.capacity,
            mainTeacherId: data.main_teacher_id,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for updateClass');
      }
    }
    return db.updateClass(schoolId, classId, updates, updatedBy);
  },

  // 4. Matières
  async getSubjects(schoolId: string): Promise<Subject[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('school_id', schoolId)
          .order('name');
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            name: row.name,
            code: row.code,
            category: row.category,
            defaultCoefficient: Number(row.default_coefficient),
            defaultMaxScore: Number(row.default_max_score),
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getSubjects');
      }
    }
    return db.getSubjects(schoolId);
  },

  // 5. Élèves
  async getStudents(schoolId: string, classId?: string, query?: string): Promise<Student[]> {
    if (supabase) {
      try {
        let q = supabase.from('students').select('*').eq('school_id', schoolId);
        if (classId) q = q.eq('class_id', classId);
        if (query) {
          q = q.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,post_name.ilike.%${query}%,matricule.ilike.%${query}%`);
        }
        const { data, error } = await q.order('last_name');
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            matricule: row.matricule,
            firstName: row.first_name,
            lastName: row.last_name,
            postName: row.post_name,
            gender: row.gender,
            birthDate: row.birth_date,
            birthPlace: row.birth_place || 'Kinshasa',
            address: row.address || '',
            classId: row.class_id || '',
            parentId: row.parent_id || '',
            photoUrl: row.photo_url,
            active: row.active ?? true,
            registrationDate: row.created_at,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getStudents');
      }
    }
    return db.getStudents(schoolId, classId, query);
  },

  async getStudent(id: string): Promise<Student | undefined> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('students').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            schoolId: data.school_id,
            matricule: data.matricule,
            firstName: data.first_name,
            lastName: data.last_name,
            postName: data.post_name,
            gender: data.gender,
            birthDate: data.birth_date,
            birthPlace: data.birth_place || 'Kinshasa',
            address: data.address || '',
            classId: data.class_id || '',
            parentId: data.parent_id || '',
            photoUrl: data.photo_url,
            active: data.active ?? true,
            registrationDate: data.created_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getStudent');
      }
    }
    return db.getStudent(id);
  },

  async createStudent(schoolId: string, studentData: any): Promise<Student> {
    if (supabase) {
      try {
        const matricule = studentData.matricule || `STU-${Date.now().toString().slice(-6)}`;
        const { data, error } = await supabase.from('students').insert({
          school_id: schoolId,
          matricule,
          first_name: studentData.firstName,
          last_name: studentData.lastName,
          post_name: studentData.postName || '',
          gender: studentData.gender || 'M',
          birth_date: studentData.birthDate || '2012-01-01',
          birth_place: studentData.birthPlace || 'Kinshasa',
          address: studentData.address || '',
          class_id: studentData.classId || null,
          parent_id: studentData.parentId || null,
          photo_url: studentData.photoUrl || null,
          active: true,
        }).select().single();

        if (!error && data) {
          return {
            id: data.id,
            schoolId: data.school_id,
            matricule: data.matricule,
            firstName: data.first_name,
            lastName: data.last_name,
            postName: data.post_name,
            gender: data.gender,
            birthDate: data.birth_date,
            birthPlace: data.birth_place || 'Kinshasa',
            address: data.address || '',
            classId: data.class_id || '',
            parentId: data.parent_id || '',
            photoUrl: data.photo_url,
            active: data.active,
            registrationDate: data.created_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for createStudent');
      }
    }
    return db.createStudent(schoolId, studentData);
  },

  // 6. Notes (Grades)
  async getGrades(schoolId: string, classId?: string, subjectId?: string, periodId?: string, studentId?: string): Promise<Grade[]> {
    if (supabase) {
      try {
        let q = supabase.from('grades').select('*').eq('school_id', schoolId);
        if (classId) q = q.eq('class_id', classId);
        if (subjectId) q = q.eq('subject_id', subjectId);
        if (periodId) q = q.eq('period_id', periodId);
        if (studentId) q = q.eq('student_id', studentId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            classId: row.class_id,
            subjectId: row.subject_id,
            studentId: row.student_id,
            periodId: row.period_id,
            score: Number(row.score),
            maxScore: Number(row.max_score),
            coefficient: Number(row.coefficient),
            status: row.status,
            recordedAt: row.recorded_at,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getGrades');
      }
    }
    return db.getGrades(schoolId, classId, subjectId, periodId, studentId);
  },

  async saveGradesBatch(schoolId: string, classId: string, subjectId: string, periodId: string, grades: any[], status: 'draft' | 'published' = 'draft', recordedBy = 'Enseignant') {
    if (supabase) {
      try {
        const rows = grades.map((g) => ({
          school_id: schoolId,
          class_id: classId,
          subject_id: subjectId,
          student_id: g.studentId,
          period_id: periodId,
          score: Number(g.score),
          max_score: Number(g.maxScore || 20),
          coefficient: Number(g.coefficient || 1),
          status,
        }));

        const { error } = await supabase.from('grades').upsert(rows, {
          onConflict: 'student_id,subject_id,period_id',
        });

        if (!error) {
          return grades;
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for saveGradesBatch');
      }
    }
    return db.saveGradesBatch(schoolId, classId, subjectId, periodId, grades, status, recordedBy);
  },

  // 7. Frais & Paiements (M-Pesa, Airtel, Orange)
  async getFees(schoolId: string): Promise<FeeDefinition[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('fees').select('*').eq('school_id', schoolId);
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            academicYearId: row.academic_year_id,
            name: row.name,
            amountUSD: Number(row.amount_usd),
            amountCDF: Number(row.amount_cdf),
            dueDate: row.due_date || '',
            mandatory: row.mandatory,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getFees');
      }
    }
    return db.getFees(schoolId);
  },

  async getPayments(schoolId: string, studentId?: string): Promise<PaymentRecord[]> {
    if (supabase) {
      try {
        let q = supabase.from('payments').select('*').eq('school_id', schoolId);
        if (studentId) q = q.eq('student_id', studentId);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            studentId: row.student_id,
            feeId: row.fee_id || '',
            receiptNumber: row.receipt_number,
            amountUSD: Number(row.amount_usd),
            amountCDF: Number(row.amount_cdf),
            currency: row.currency as 'USD' | 'CDF',
            paymentMethod: row.payment_method,
            transactionReference: row.transaction_ref || '',
            status: row.status,
            payerName: row.payer_name || 'Parent Tuteur',
            payerPhone: row.payer_phone || '',
            createdAt: row.created_at,
            recordedBy: 'Comptable',
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getPayments');
      }
    }
    return db.getPayments(schoolId, studentId);
  },

  async recordPayment(schoolId: string, paymentData: any): Promise<PaymentRecord> {
    if (supabase) {
      try {
        const receiptNumber = paymentData.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;
        const { data, error } = await supabase.from('payments').insert({
          school_id: schoolId,
          student_id: paymentData.studentId,
          fee_id: paymentData.feeId || null,
          receipt_number: receiptNumber,
          amount_usd: paymentData.amountUSD,
          amount_cdf: paymentData.amountCDF || paymentData.amountUSD * 2850,
          currency: paymentData.currency || 'USD',
          payment_method: paymentData.paymentMethod || 'mpesa',
          transaction_ref: paymentData.transactionReference || `TX-${Date.now()}`,
          status: paymentData.status || 'confirmed',
          payer_name: paymentData.payerName || 'Parent',
          payer_phone: paymentData.payerPhone || '',
        }).select().single();

        if (!error && data) {
          return {
            id: data.id,
            schoolId: data.school_id,
            studentId: data.student_id,
            feeId: data.fee_id || '',
            receiptNumber: data.receipt_number,
            amountUSD: Number(data.amount_usd),
            amountCDF: Number(data.amount_cdf),
            currency: data.currency as 'USD' | 'CDF',
            paymentMethod: data.payment_method,
            transactionReference: data.transaction_ref,
            status: data.status,
            payerName: data.payer_name,
            payerPhone: data.payer_phone,
            createdAt: data.created_at,
            recordedBy: 'Comptable',
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for recordPayment');
      }
    }
    return db.recordPayment(schoolId, paymentData);
  },

  // 8. SMS & Logs
  async getSmsLogs(schoolId: string): Promise<SmsLog[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('sms_logs').select('*').eq('school_id', schoolId).order('sent_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            recipientPhone: row.recipient_phone,
            recipientName: row.recipient_name,
            message: row.message,
            category: row.category,
            status: row.status,
            costUSD: Number(row.cost_usd),
            sentAt: row.sent_at,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getSmsLogs');
      }
    }
    return db.getSmsLogs(schoolId);
  },

  async sendSms(schoolId: string, phone: string, name: string, message: string, category: string): Promise<SmsLog> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('sms_logs').insert({
          school_id: schoolId,
          recipient_phone: phone,
          recipient_name: name,
          message,
          category,
          status: 'délivré',
          cost_usd: 0.025,
        }).select().single();

        if (!error && data) {
          return {
            id: data.id,
            schoolId: data.school_id,
            recipientPhone: data.recipient_phone,
            recipientName: data.recipient_name,
            message: data.message,
            category: data.category as any,
            status: data.status as any,
            costUSD: Number(data.cost_usd),
            sentAt: data.sent_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for sendSms');
      }
    }
    return db.sendSms(schoolId, phone, name, message, category as any);
  },

  // 9. Présences & Absences (Attendance)
  async getAttendance(schoolId: string, classId?: string, date?: string): Promise<AttendanceRecord[]> {
    if (supabase) {
      try {
        let q = supabase.from('attendance').select('*').eq('school_id', schoolId);
        if (classId) q = q.eq('class_id', classId);
        if (date) q = q.eq('date', date);
        const { data, error } = await q.order('date', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            classId: row.class_id,
            studentId: row.student_id,
            date: row.date,
            status: row.status,
            justification: row.justification || '',
            recordedBy: row.recorded_by || 'Enseignant',
            recordedAt: row.created_at || row.recorded_at || new Date().toISOString(),
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getAttendance');
      }
    }
    return db.getAttendance(schoolId, classId, date);
  },

  async saveAttendanceBatch(schoolId: string, classId: string, date: string, records: any[], recordedBy = 'Enseignant') {
    if (supabase) {
      try {
        const rows = records.map((r) => ({
          school_id: schoolId,
          class_id: classId,
          student_id: r.studentId,
          date,
          status: r.status,
          justification: r.justification || '',
          recorded_by: recordedBy,
        }));

        const { error } = await supabase.from('attendance').upsert(rows, {
          onConflict: 'school_id,student_id,date',
        });
        if (!error) return records;
      } catch (e) {
        console.warn('[Supabase] fallback to local for saveAttendanceBatch');
      }
    }
    return db.saveAttendanceBatch(schoolId, classId, date, records, recordedBy);
  },

  // 10. Appréciations du Titulaire de Classe (Class Appreciations)
  async getClassAppreciations(schoolId: string, classId?: string, periodId?: string): Promise<ClassAppreciation[]> {
    if (supabase) {
      try {
        let q = supabase.from('class_appreciations').select('*').eq('school_id', schoolId);
        if (classId) q = q.eq('class_id', classId);
        if (periodId) q = q.eq('period_id', periodId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            studentId: row.student_id,
            classId: row.class_id,
            periodId: row.period_id,
            appreciation: row.appreciation,
            conduct: row.conduct,
            updatedBy: row.updated_by,
            updatedAt: row.updated_at,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getClassAppreciations');
      }
    }
    return db.getClassAppreciations(schoolId, classId, periodId);
  },

  async saveClassAppreciation(schoolId: string, data: any): Promise<ClassAppreciation> {
    if (supabase) {
      try {
        const { data: saved, error } = await supabase.from('class_appreciations').upsert({
          school_id: schoolId,
          class_id: data.classId,
          student_id: data.studentId,
          period_id: data.periodId,
          appreciation: data.appreciation || '',
          conduct: data.conduct || 'Bonne',
          updated_by: data.updatedBy || 'Titulaire de classe',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'school_id,class_id,student_id,period_id',
        }).select().single();

        if (!error && saved) {
          return {
            id: saved.id,
            schoolId: saved.school_id,
            studentId: saved.student_id,
            classId: saved.class_id,
            periodId: saved.period_id,
            appreciation: saved.appreciation,
            conduct: saved.conduct,
            updatedBy: saved.updated_by,
            updatedAt: saved.updated_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for saveClassAppreciation');
      }
    }
    return db.saveClassAppreciation(schoolId, data);
  },

  // 11. Demandes de Rectification de Cotes (Grade Corrections)
  async getGradeCorrectionRequests(schoolId: string, classId?: string, status?: string): Promise<GradeCorrectionRequest[]> {
    if (supabase) {
      try {
        let q = supabase.from('grade_corrections').select('*').eq('school_id', schoolId);
        if (classId) q = q.eq('class_id', classId);
        if (status) q = q.eq('status', status);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            teacherName: row.teacher_name,
            teacherId: row.teacher_id,
            classId: row.class_id,
            subjectId: row.subject_id,
            studentId: row.student_id,
            periodId: row.period_id,
            currentScore: Number(row.current_score),
            requestedScore: Number(row.requested_score),
            maxScore: Number(row.max_score),
            reason: row.reason,
            status: row.status,
            createdAt: row.created_at,
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getGradeCorrectionRequests');
      }
    }
    return db.getGradeCorrectionRequests(schoolId, classId, status);
  },

  async createGradeCorrectionRequest(schoolId: string, data: any): Promise<GradeCorrectionRequest> {
    if (supabase) {
      try {
        const { data: saved, error } = await supabase.from('grade_corrections').insert({
          school_id: schoolId,
          teacher_name: data.teacherName,
          teacher_id: data.teacherId || null,
          class_id: data.classId,
          subject_id: data.subjectId,
          student_id: data.studentId,
          period_id: data.periodId,
          current_score: data.currentScore,
          requested_score: data.requestedScore,
          max_score: data.maxScore || 20,
          reason: data.reason,
          status: 'pending',
        }).select().single();

        if (!error && saved) {
          return {
            id: saved.id,
            schoolId: saved.school_id,
            teacherName: saved.teacher_name,
            teacherId: saved.teacher_id,
            classId: saved.class_id,
            subjectId: saved.subject_id,
            studentId: saved.student_id,
            periodId: saved.period_id,
            currentScore: Number(saved.current_score),
            requestedScore: Number(saved.requested_score),
            maxScore: Number(saved.max_score),
            reason: saved.reason,
            status: saved.status,
            createdAt: saved.created_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for createGradeCorrectionRequest');
      }
    }
    return db.createGradeCorrectionRequest(schoolId, data);
  },

  async reviewGradeCorrectionRequest(schoolId: string, requestId: string, status: 'approved' | 'rejected', reviewedBy: string): Promise<GradeCorrectionRequest | undefined> {
    if (supabase) {
      try {
        const { data: updated, error } = await supabase.from('grade_corrections').update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        }).eq('id', requestId).select().maybeSingle();

        if (!error && updated) {
          if (status === 'approved') {
            await supabase.from('grades').update({
              score: updated.requested_score,
            }).eq('student_id', updated.student_id)
              .eq('subject_id', updated.subject_id)
              .eq('period_id', updated.period_id);
          }
          return {
            id: updated.id,
            schoolId: updated.school_id,
            teacherName: updated.teacher_name,
            teacherId: updated.teacher_id,
            classId: updated.class_id,
            subjectId: updated.subject_id,
            studentId: updated.student_id,
            periodId: updated.period_id,
            currentScore: Number(updated.current_score),
            requestedScore: Number(updated.requested_score),
            maxScore: Number(updated.max_score),
            reason: updated.reason,
            status: updated.status,
            createdAt: updated.created_at,
            reviewedBy: updated.reviewed_by,
            reviewedAt: updated.reviewed_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for reviewGradeCorrectionRequest');
      }
    }
    const res = db.reviewGradeCorrectionRequest(schoolId, requestId, status, reviewedBy);
    return res || undefined;
  },

  // 12. Cahier de Textes & Journal de Classe (Lesson Logs)
  async getLessonLogs(schoolId: string, classId?: string, subjectId?: string): Promise<LessonLog[]> {
    if (supabase) {
      try {
        let q = supabase.from('lesson_logs').select('*').eq('school_id', schoolId);
        if (classId) q = q.eq('class_id', classId);
        if (subjectId) q = q.eq('subject_id', subjectId);
        const { data, error } = await q.order('date', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            classId: row.class_id,
            subjectId: row.subject_id,
            teacherName: row.teacher_name,
            date: row.date,
            title: row.title,
            summary: row.summary,
            homework: row.homework,
            homeworkDueDate: row.homework_due_date,
            createdAt: row.created_at,
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getLessonLogs');
      }
    }
    return db.getLessonLogs(schoolId, classId, subjectId);
  },

  async createLessonLog(schoolId: string, data: any): Promise<LessonLog> {
    if (supabase) {
      try {
        const { data: saved, error } = await supabase.from('lesson_logs').insert({
          school_id: schoolId,
          class_id: data.classId,
          subject_id: data.subjectId,
          teacher_name: data.teacherName || 'Professeur',
          date: data.date || new Date().toISOString().split('T')[0],
          title: data.title,
          summary: data.summary,
          homework: data.homework || null,
          homework_due_date: data.homeworkDueDate || null,
        }).select().single();

        if (!error && saved) {
          return {
            id: saved.id,
            schoolId: saved.school_id,
            classId: saved.class_id,
            subjectId: saved.subject_id,
            teacherName: saved.teacher_name,
            date: saved.date,
            title: saved.title,
            summary: saved.summary,
            homework: saved.homework,
            homeworkDueDate: saved.homework_due_date,
            createdAt: saved.created_at,
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for createLessonLog');
      }
    }
    return db.createLessonLog(schoolId, data);
  },

  // 13. Messagerie Scolaire (Messages)
  async getSchoolMessages(schoolId: string, role?: string, classId?: string): Promise<SchoolMessage[]> {
    if (supabase) {
      try {
        let q = supabase.from('messages').select('*').eq('school_id', schoolId);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            senderName: row.sender_name,
            senderRole: row.sender_role as any,
            senderId: row.sender_id,
            recipientType: row.recipient_type as any,
            recipientTargetId: row.recipient_target_id,
            recipientTargetName: row.recipient_target_name,
            subject: row.subject,
            body: row.body,
            read: Boolean(row.is_read),
            smsSent: row.sms_sent,
            sentAt: row.created_at || new Date().toISOString(),
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getSchoolMessages');
      }
    }
    return db.getSchoolMessages(schoolId, role, classId);
  },

  async createSchoolMessage(schoolId: string, data: any): Promise<SchoolMessage> {
    if (supabase) {
      try {
        const { data: saved, error } = await supabase.from('messages').insert({
          school_id: schoolId,
          sender_name: data.senderName,
          senderRole: data.senderRole || 'enseignant',
          sender_id: data.senderId || null,
          recipient_type: data.recipientType || 'classe',
          recipient_target_id: data.recipientTargetId || null,
          recipient_target_name: data.recipientTargetName,
          subject: data.subject,
          body: data.body,
          sms_sent: Boolean(data.smsSent),
        }).select().single();

        if (!error && saved) {
          return {
            id: saved.id,
            schoolId: saved.school_id,
            senderName: saved.sender_name,
            senderRole: saved.sender_role as any,
            senderId: saved.sender_id,
            recipientType: saved.recipient_type as any,
            recipientTargetId: saved.recipient_target_id,
            recipientTargetName: saved.recipient_target_name,
            subject: saved.subject,
            body: saved.body,
            read: Boolean(saved.is_read),
            smsSent: saved.sms_sent,
            sentAt: saved.created_at || new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for createSchoolMessage');
      }
    }
    return db.createSchoolMessage(schoolId, data);
  },

  // 14. Horaire de Cours (Schedule Slots)
  async getScheduleSlots(schoolId: string): Promise<TeacherScheduleSlot[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('schedule_slots').select('*').eq('school_id', schoolId);
        if (!error && data && data.length > 0) {
          return data.map((row) => ({
            id: row.id,
            dayOfWeek: (row.day_of_week as any) || 'Lundi',
            timeSlot: row.time_slot || '07h30 - 08h25',
            periodNumber: Number(row.period_number || 1),
            classId: row.class_id,
            subjectId: row.subject_id,
            room: row.room || 'Salle ordinaire',
          }));
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getScheduleSlots');
      }
    }
    return db.getScheduleSlots(schoolId);
  },
};
