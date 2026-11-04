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
  Teacher,
  UserAccount,
  UserRole,
  UserSession,
} from '../src/types.ts';

dotenv.config({ override: true });

const TARGET_PROJECT_REF = 'euxxiidyvkwrnlxtwrsb';
const DEFAULT_SUPABASE_URL = 'https://euxxiidyvkwrnlxtwrsb.supabase.co';
const DEFAULT_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eHhpaWR5dmt3cm5seHR3cnNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjg1MzM0NiwiZXhwIjoyMTA4NDI5MzQ2fQ.Xbsznv6j8gPb8PQjr0pPad1mTsrhAigjgciYjjJ3_QM';

const envUrl = process.env.SUPABASE_URL?.trim();
const supabaseUrl =
  envUrl && envUrl.includes(TARGET_PROJECT_REF) ? envUrl : DEFAULT_SUPABASE_URL;

const envKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.trim();
const supabaseKey =
  envKey && envKey.includes(TARGET_PROJECT_REF) ? envKey : DEFAULT_SUPABASE_KEY;

export { supabase };

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

  // 3. Classes & Titulaire
  async getClasses(schoolId: string): Promise<SchoolClass[]> {
    const local = db.getClasses(schoolId);
    if (supabase) {
      try {
        const targetSchoolId = await this.resolveSupabaseSchoolId(schoolId);
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .or(`school_id.eq.${targetSchoolId},school_id.eq.${schoolId}`)
          .order('name');
        if (!error && data && data.length > 0) {
          // Also fetch profiles to get main teacher names
          const { data: profs } = await supabase.from('profiles').select('id, full_name');
          const profMap = new Map((profs || []).map((p) => [p.id, p.full_name]));

          const localNames = new Set(local.map((c) => c.name.toLowerCase().trim()));
          for (const row of data) {
            const mainTeacherName = row.main_teacher_id ? profMap.get(row.main_teacher_id) || undefined : undefined;
            const existingLocal = local.find(
              (c) => c.id === row.id || c.name.toLowerCase().trim() === row.name.toLowerCase().trim()
            );

            if (existingLocal) {
              if (row.main_teacher_id) {
                existingLocal.mainTeacherId = row.main_teacher_id;
                existingLocal.mainTeacherName = mainTeacherName;
              }
            } else {
              local.push({
                id: row.id,
                schoolId: row.school_id,
                academicYearId: row.academic_year_id,
                name: row.name,
                level: row.level,
                section: row.section,
                roomNumber: row.room_number,
                capacity: row.capacity,
                mainTeacherId: row.main_teacher_id,
                mainTeacherName,
              });
            }
          }
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getClasses');
      }
    }
    return local;
  },

  async updateClass(
    schoolId: string,
    classId: string,
    updates: Partial<SchoolClass>,
    updatedBy = 'Direction'
  ): Promise<SchoolClass | undefined> {
    const local = db.updateClass(schoolId, classId, updates, updatedBy);

    if (supabase) {
      try {
        const updatePayload: any = {};
        if (updates.name !== undefined) updatePayload.name = updates.name;
        if (updates.level !== undefined) updatePayload.level = updates.level;
        if (updates.section !== undefined) updatePayload.section = updates.section;
        if (updates.roomNumber !== undefined) updatePayload.room_number = updates.roomNumber;
        if (updates.capacity !== undefined) updatePayload.capacity = updates.capacity;
        if (updates.mainTeacherId !== undefined) {
          // If mainTeacherId is a local ID or UUID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            updates.mainTeacherId || ''
          );
          updatePayload.main_teacher_id = isUuid ? updates.mainTeacherId : null;
        }

        const isClassUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);

        let query = supabase.from('classes').update(updatePayload);
        if (isClassUuid) {
          query = query.eq('id', classId);
        } else if (local?.name) {
          query = query.eq('name', local.name);
        }

        const { data, error } = await query.select().maybeSingle();
        if (!error && data && local) {
          if (data.main_teacher_id) {
            local.mainTeacherId = data.main_teacher_id;
            const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', data.main_teacher_id).maybeSingle();
            if (prof?.full_name) {
              local.mainTeacherName = prof.full_name;
            }
          }
        }
      } catch (e: any) {
        console.warn('[Supabase] updateClass fallback:', e.message);
      }
    }

    return local;
  },

  // 4. Matières (Subjects)
  async getSubjects(schoolId: string): Promise<Subject[]> {
    const local = db.getSubjects(schoolId);
    if (supabase) {
      try {
        const targetSchoolId = await this.resolveSupabaseSchoolId(schoolId);
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .or(`school_id.eq.${targetSchoolId},school_id.eq.${schoolId}`)
          .order('name');
        if (!error && data && data.length > 0) {
          const localCodes = new Set(local.map((s) => s.code.toUpperCase()));
          for (const row of data) {
            if (!localCodes.has(row.code.toUpperCase())) {
              local.push({
                id: row.id,
                schoolId: row.school_id,
                name: row.name,
                code: row.code,
                category: row.category as any,
                defaultCoefficient: Number(row.default_coefficient),
                defaultMaxScore: Number(row.default_max_score),
              });
            }
          }
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getSubjects');
      }
    }
    return local;
  },

  async createSubject(schoolId: string, data: any): Promise<Subject> {
    const local = db.createSubject(schoolId, {
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      category: data.category || 'Sciences',
      defaultCoefficient: Number(data.defaultCoefficient) || 1,
      defaultMaxScore: Number(data.defaultMaxScore) || 20,
    });

    if (supabase) {
      try {
        const targetSchoolId = await this.resolveSupabaseSchoolId(schoolId);
        const { data: created, error } = await supabase
          .from('subjects')
          .insert({
            school_id: targetSchoolId,
            name: data.name.trim(),
            code: data.code.trim().toUpperCase(),
            category: data.category || 'Sciences',
            default_coefficient: Number(data.defaultCoefficient) || 1,
            default_max_score: Number(data.defaultMaxScore) || 20,
          })
          .select()
          .maybeSingle();

        if (!error && created) {
          local.id = created.id;
        }
      } catch (err: any) {
        console.warn('[Supabase] createSubject error:', err.message);
      }
    }
    return local;
  },

  // 4b. Attribution des Cours aux Classes (Class Subjects)
  async getClassSubjects(schoolId: string, classId?: string): Promise<ClassSubject[]> {
    const local = db.getClassSubjects(schoolId, classId);
    if (supabase) {
      try {
        let q = supabase.from('class_subjects').select('*');
        if (classId) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classId);
          if (isUuid) {
            q = q.eq('class_id', classId);
          }
        }
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          const localKeys = new Set(local.map((cs) => `${cs.classId}-${cs.subjectId}`));
          for (const row of data) {
            const key = `${row.class_id}-${row.subject_id}`;
            if (!localKeys.has(key)) {
              local.push({
                id: row.id,
                schoolId: row.school_id,
                classId: row.class_id,
                subjectId: row.subject_id,
                teacherId: row.teacher_id || '',
                coefficient: Number(row.coefficient),
                maxScore: Number(row.max_score),
                weeklyHours: Number(row.weekly_hours),
                locked: true,
              });
            } else {
              const found = local.find(
                (cs) => cs.classId === row.class_id && cs.subjectId === row.subject_id
              );
              if (found) {
                if (row.teacher_id) found.teacherId = row.teacher_id;
                found.coefficient = Number(row.coefficient) || found.coefficient;
                found.maxScore = Number(row.max_score) || found.maxScore;
                found.weeklyHours = Number(row.weekly_hours) || found.weeklyHours;
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('[Supabase] fallback for getClassSubjects:', err.message);
      }
    }
    return local;
  },

  async assignClassSubject(schoolId: string, data: any): Promise<ClassSubject> {
    const local = db.assignClassSubject({
      schoolId: schoolId || 'sch-bobokoli',
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId || '',
      coefficient: Number(data.coefficient) || 1,
      maxScore: Number(data.maxScore) || 20,
      weeklyHours: Number(data.weeklyHours) || 2,
    });

    if (supabase) {
      try {
        const targetSchoolId = await this.resolveSupabaseSchoolId(schoolId);
        let targetClassId = data.classId;
        let targetSubjectId = data.subjectId;

        const isClassUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetClassId);
        if (!isClassUuid) {
          const { data: cFound } = await supabase.from('classes').select('id').ilike('name', `%${targetClassId.replace('cls-', '')}%`).maybeSingle();
          if (cFound?.id) targetClassId = cFound.id;
        }

        const isSubjectUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSubjectId);
        if (!isSubjectUuid) {
          const { data: sFound } = await supabase.from('subjects').select('id').ilike('code', `%${targetSubjectId.replace('sbj-', '')}%`).maybeSingle();
          if (sFound?.id) targetSubjectId = sFound.id;
        }

        const isTeacherUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.teacherId || '');

        const { data: upserted, error } = await supabase.from('class_subjects').upsert({
          school_id: targetSchoolId,
          class_id: targetClassId,
          subject_id: targetSubjectId,
          teacher_id: isTeacherUuid ? data.teacherId : null,
          coefficient: Number(data.coefficient) || 1,
          max_score: Number(data.maxScore) || 20,
          weekly_hours: Number(data.weeklyHours) || 2,
        }, { onConflict: 'class_id,subject_id' }).select().maybeSingle();

        if (!error && upserted) {
          local.id = upserted.id;
        }
      } catch (err: any) {
        console.warn('[Supabase] assignClassSubject error:', err.message);
      }
    }
    return local;
  },

  async deleteClassSubject(id: string): Promise<boolean> {
    const localDeleted = db.deleteClassSubject(id);
    if (supabase) {
      try {
        await supabase.from('class_subjects').delete().eq('id', id);
      } catch (err: any) {
        console.warn('[Supabase] deleteClassSubject error:', err.message);
      }
    }
    return localDeleted;
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

  // 15. Enseignants (Teachers)
  async getTeachers(schoolId: string): Promise<Teacher[]> {
    const local = db.getTeachers(schoolId);
    if (supabase) {
      try {
        const { data: profs, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'enseignant');

        if (!error && profs && profs.length > 0) {
          const localNames = new Set(local.map((t) => t.fullName.toLowerCase().trim()));
          const localIds = new Set(local.map((t) => t.id));

          for (const p of profs) {
            if (!localIds.has(p.id) && !localNames.has((p.full_name || '').toLowerCase().trim())) {
              local.push({
                id: p.id,
                schoolId: p.school_id || schoolId || 'sch-bobokoli',
                matricule: `ENS-${p.id.slice(0, 6).toUpperCase()}`,
                fullName: p.full_name || 'Professeur',
                phone: p.phone || '',
                email: `${(p.full_name || 'prof').toLowerCase().replace(/\s+/g, '.')}@edukin.cd`,
                specialty: 'Enseignement Général & Spécialités',
                assignedClasses: [],
                active: p.active ?? true,
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('[Supabase] getTeachers fallback:', err.message);
      }
    }
    return local;
  },

  async createTeacher(schoolId: string, data: any): Promise<Teacher> {
    return db.createTeacher(schoolId, data);
  },

  // 16. Comptes Utilisateurs (User Accounts)
  async resolveSupabaseSchoolId(schoolId?: string): Promise<string> {
    if (!supabase || !schoolId || schoolId === 'platform') return 'platform';
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(schoolId);
      if (isUuid) {
        const { data } = await supabase.from('schools').select('id').eq('id', schoolId).maybeSingle();
        if (data?.id) return data.id;
      }

      const { data: byCode } = await supabase
        .from('schools')
        .select('id')
        .or(`code.ilike.%${schoolId.replace('sch-', '')}%,name.ilike.%bobokoli%`)
        .limit(1)
        .maybeSingle();
      if (byCode?.id) return byCode.id;

      const { data: firstSchool } = await supabase.from('schools').select('id').limit(1).maybeSingle();
      if (firstSchool?.id) return firstSchool.id;
    } catch (err) {
      console.warn('[Supabase] resolveSupabaseSchoolId fallback:', err);
    }
    return 'ed8bdc39-2b57-486b-ad31-7ee5f17444cc'; // Default Collège Bobokoli UUID
  },

  async getUserAccounts(schoolId?: string): Promise<UserAccount[]> {
    const local = db.getUserAccounts(schoolId);
    if (supabase) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
        if (!authErr && authData?.users?.length) {
          const localUsernames = new Set(local.map((u) => u.username.toLowerCase()));
          const localIds = new Set(local.map((u) => u.id));

          // Also get profiles to enrich phone & active status
          const { data: profiles } = await supabase.from('profiles').select('*');
          const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

          for (const u of authData.users) {
            const meta = u.user_metadata || {};
            const username = (meta.username || u.email || 'utilisateur').toLowerCase();
            const fullName = meta.full_name || u.email?.split('@')[0] || 'Utilisateur';
            const role = (meta.role || 'enseignant') as UserRole;
            const prof = profileMap.get(u.id);
            const userSchoolId = meta.school_id || prof?.school_id || schoolId || 'sch-bobokoli';

            if (!localIds.has(u.id) && !localUsernames.has(username)) {
              local.push({
                id: u.id,
                schoolId: userSchoolId,
                fullName,
                username,
                email: u.email,
                phone: prof?.phone || u.phone || meta.phone || '',
                role,
                active: prof?.active ?? true,
                createdAt: u.created_at || new Date().toISOString(),
              });
            }
          }
        }
      } catch (e) {
        console.warn('[Supabase] fallback to local for getUserAccounts:', e);
      }
    }
    return local;
  },

  async createUserAccount(schoolId: string, accountData: any): Promise<UserAccount> {
    const validRoles = [
      'super_admin',
      'cadre_securite',
      'cadre_finances',
      'cadre_support',
      'directeur',
      'admin_scolaire',
      'directeur_etudes',
      'directeur_discipline',
      'comptable',
      'secretaire',
      'surveillant',
      'enseignant',
      'parent',
      'eleve',
    ];
    const role = validRoles.includes(accountData.role) ? accountData.role : 'enseignant';
    const cleanUsername = (accountData.username || '').trim().toLowerCase();
    const cleanFullName = (accountData.fullName || '').trim();
    const cleanPassword = (accountData.password || 'edukin123').trim();

    // Determine email for Supabase Auth
    let userEmail = accountData.email?.trim()?.toLowerCase();
    if (!userEmail) {
      if (cleanUsername.includes('@')) {
        userEmail = cleanUsername;
      } else {
        const sanitized = cleanUsername.replace(/[^a-z0-9]/g, '');
        userEmail = `${sanitized || 'user' + Date.now()}@edukin.cd`;
      }
    }

    let authUserId: string | null = null;
    let targetSchoolId = schoolId || 'sch-bobokoli';

    // 1. Sync to Supabase Auth & Profiles
    if (supabase) {
      try {
        targetSchoolId = await this.resolveSupabaseSchoolId(schoolId);

        // Check if user already exists
        const { data: existingList } = await supabase.auth.admin.listUsers();
        const existing = existingList?.users?.find(
          (u) =>
            u.email?.toLowerCase() === userEmail ||
            (u.user_metadata?.username || '').toLowerCase() === cleanUsername
        );

        if (existing) {
          authUserId = existing.id;
          await supabase.auth.admin.updateUserById(existing.id, {
            password: cleanPassword,
            user_metadata: {
              ...existing.user_metadata,
              full_name: cleanFullName,
              username: cleanUsername,
              role,
              school_id: targetSchoolId,
            },
          });
        } else {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userEmail,
            password: cleanPassword,
            email_confirm: true,
            user_metadata: {
              full_name: cleanFullName,
              username: cleanUsername,
              role,
              school_id: targetSchoolId,
            },
          });

          if (authError) {
            console.error('[Supabase Auth Error during createUser]:', authError.message);
          } else if (authData?.user?.id) {
            authUserId = authData.user.id;
          }
        }

        // Upsert into profiles table
        if (authUserId) {
          const profileSchoolId = targetSchoolId === 'platform' ? null : targetSchoolId;
          const { error: profError } = await supabase.from('profiles').upsert({
            id: authUserId,
            school_id: profileSchoolId,
            full_name: cleanFullName,
            phone: accountData.phone?.trim() || null,
            role: role as any,
            active: true,
            updated_at: new Date().toISOString(),
          });
          if (profError) {
            console.warn('[Supabase Profiles Error]:', profError.message);
          }
        }
      } catch (err: any) {
        console.error('[Supabase createUserAccount failure]:', err?.message);
      }
    }

    // 2. Also register in local DB
    const newAccount = db.createUserAccount({
      ...accountData,
      id: authUserId || undefined,
      schoolId: schoolId || 'platform',
      email: userEmail,
      username: cleanUsername,
      fullName: cleanFullName,
      password: cleanPassword,
      role,
    });

    // 3. If role is enseignant, ensure teacher record is created
    if (role === 'enseignant') {
      try {
        await this.createTeacher(schoolId, {
          id: authUserId || undefined,
          fullName: cleanFullName,
          email: userEmail,
          phone: accountData.phone?.trim() || '',
          specialty: accountData.specialty || 'Enseignement Général',
          active: true,
        });
      } catch (e) {
        // Teacher record creation optional
      }
    }

    return newAccount;
  },

  // 17. Authentification Persistante (Supabase + Local DB)
  async authenticateUser(
    identifier: string,
    password: string
  ): Promise<{ user: UserSession; token: string } | null> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Try local memory DB first
    const localResult = db.authenticate(identifier, password);
    if (localResult) {
      return localResult;
    }

    // 2. If not found in local memory, check Supabase Auth & Profiles
    if (supabase) {
      try {
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
        if (!listError && usersData?.users?.length) {
          const matchedUser = usersData.users.find((u) => {
            const metaUser = (u.user_metadata?.username || '').toLowerCase().trim();
            const emailUser = (u.email || '').toLowerCase().trim();
            return (
              metaUser === cleanId ||
              emailUser === cleanId ||
              metaUser.replace(/[^a-z0-9]/g, '') === cleanId.replace(/[^a-z0-9]/g, '') ||
              emailUser.split('@')[0] === cleanId.split('@')[0]
            );
          });

          if (matchedUser && matchedUser.email) {
            // Verify password against Supabase Auth
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
              email: matchedUser.email,
              password: cleanPass,
            });

            if (!signInErr && signInData?.user) {
              const u = signInData.user;
              const meta = u.user_metadata || {};
              const schoolId = meta.school_id || 'sch-bobokoli';
              const sch = await this.getSchool(schoolId);
              const role = (meta.role || 'enseignant') as UserRole;

              const session: UserSession = {
                id: u.id,
                fullName: meta.full_name || u.email?.split('@')[0] || 'Utilisateur',
                username: meta.username || u.email || cleanId,
                email: u.email || '',
                phone: u.phone || meta.phone || '',
                role,
                schoolId,
                schoolName: sch?.name || 'Collège Bobokoli',
                token: signInData.session?.access_token || `edukin_token_${u.id}_${Date.now()}`,
              };

              // Cache into local runtime for fast subsequent requests
              try {
                db.createUserAccount({
                  id: u.id,
                  schoolId,
                  fullName: session.fullName,
                  username: session.username,
                  email: session.email,
                  phone: session.phone,
                  password: cleanPass,
                  role,
                });
              } catch {
                // Ignore if duplicate in memory
              }

              return {
                user: session,
                token: session.token || `edukin_token_${session.id}`,
              };
            }
          }
        }
      } catch (err: any) {
        console.warn('[Supabase Auth] Fallback check failed:', err?.message);
      }
    }

    return null;
  },
};
