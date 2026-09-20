-- ============================================================================
-- PLATEFORME NUMÉRIQUE DE GESTION SCOLAIRE — RDC
-- SCHÉMA POSTGRESQL & POLICIES ROW LEVEL SECURITY (RLS) SUPABASE
-- ============================================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ÉTABLISSEMENTS (Multi-Tenant Root)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Kinshasa',
    province VARCHAR(100) NOT NULL DEFAULT 'Kinshasa',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(150),
    logo_url TEXT,
    currency_default VARCHAR(10) NOT NULL DEFAULT 'USD',
    exchange_rate_usd_cdf NUMERIC(12,2) NOT NULL DEFAULT 2850.00,
    plan VARCHAR(50) NOT NULL DEFAULT 'Standard' CHECK (plan IN ('Basic', 'Standard', 'Premium')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ANNÉES SCOLAIRES (Dynamiques, aucune date en dur)
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- e.g. '2025-2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PÉRIODES SCOLAIRES (P1, P2, Examen 1er Semestre, P3, P4, Examen 2ème Semestre)
CREATE TABLE IF NOT EXISTS public.academic_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    semester INT NOT NULL CHECK (semester IN (1, 2)),
    weight NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. UTILISATEURS & PROFILS
CREATE TYPE user_role_type AS ENUM (
    'super_admin',
    'directeur',
    'admin_scolaire',
    'directeur_etudes',
    'directeur_discipline',
    'comptable',
    'secretaire',
    'surveillant',
    'enseignant',
    'parent',
    'eleve'
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role_type NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g. '7e Éducation de Base A', '1ère Scientifique'
    level VARCHAR(100) NOT NULL, -- 'Cycle Terminal EB', 'Humanités'
    section VARCHAR(100) NOT NULL, -- 'Scientifique', 'Commerciale', 'Littéraire'
    room_number VARCHAR(50),
    capacity INT DEFAULT 45,
    main_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MATIÈRES & COURS
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'Sciences',
    default_coefficient NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    default_max_score NUMERIC(6,2) NOT NULL DEFAULT 20.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AFFECTATION DES MATIÈRES PAR CLASSE
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    coefficient NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    max_score NUMERIC(6,2) NOT NULL DEFAULT 20.0,
    weekly_hours INT DEFAULT 2,
    UNIQUE(class_id, subject_id)
);

-- 8. PARENTS / TUTEURS
CREATE TABLE IF NOT EXISTS public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    occupation VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ÉLÈVES
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    matricule VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    post_name VARCHAR(100) NOT NULL, -- Spécificité RDC
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    birth_date DATE NOT NULL,
    birth_place VARCHAR(150),
    address TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
    photo_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, matricule)
);

-- Garantir la colonne user_id même si la table a déjà été créée
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 10. ASSOCIATION MULTI-ENFANTS (Un parent peut avoir plusieurs enfants)
CREATE TABLE IF NOT EXISTS public.parent_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'Père' CHECK (relationship_type IN ('Père', 'Mère', 'Tuteur légal', 'Autre')),
    UNIQUE(parent_id, student_id)
);

-- 11. PRÉSENCES & ABSENCES
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'retard', 'excuse')),
    justification TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, date, class_id)
);

-- 12. NOTES & ÉVALUATIONS
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
    score NUMERIC(6,2) NOT NULL,
    max_score NUMERIC(6,2) NOT NULL DEFAULT 20.0,
    coefficient NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, subject_id, period_id)
);

-- 13. DISCIPLINE & INCIDENTS
CREATE TABLE IF NOT EXISTS public.discipline_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Modéré' CHECK (severity IN ('Faible', 'Modéré', 'Grave')),
    sanction TEXT,
    parent_notified BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. FRAIS SCOLAIRES
CREATE TABLE IF NOT EXISTS public.fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    amount_cdf NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    due_date DATE,
    mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. PAIEMENTS & REÇUS (M-Pesa, Airtel Money, Orange Money, Cash)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_id UUID REFERENCES public.fees(id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    amount_cdf NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('mpesa', 'airtel_money', 'orange_money', 'cash', 'banque')),
    transaction_ref VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'failed')),
    payer_name VARCHAR(150),
    payer_phone VARCHAR(50),
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, receipt_number)
);

-- 16. LOGS SMS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(150),
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'délivré',
    cost_usd NUMERIC(6,4) DEFAULT 0.025,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. ANNONCES & COMMUNICATIONS
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50) NOT NULL DEFAULT 'all',
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    author_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. JOURNAL D'ACTIVITÉ (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role user_role_type NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. APPRÉCIATIONS OFFICIELLES DU TITULAIRE DE CLASSE (BULLETIN EPST)
CREATE TABLE IF NOT EXISTS public.class_appreciations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
    appreciation TEXT NOT NULL DEFAULT '',
    conduct VARCHAR(30) NOT NULL DEFAULT 'Bonne' CHECK (conduct IN ('Excellente', 'Très Bonne', 'Bonne', 'Passable', 'Médiocre')),
    updated_by VARCHAR(150),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(school_id, class_id, student_id, period_id)
);

-- 20. DEMANDES DE RECTIFICATION DE COTES (DIRECTEUR DES ÉTUDES)
CREATE TABLE IF NOT EXISTS public.grade_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_name VARCHAR(150) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES public.academic_periods(id) ON DELETE CASCADE,
    current_score NUMERIC(6,2) NOT NULL,
    requested_score NUMERIC(6,2) NOT NULL,
    max_score NUMERIC(6,2) NOT NULL DEFAULT 20.0,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by VARCHAR(150),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. CAHIER DE TEXTES & JOURNAL DE CLASSE (ENSEIGNANT)
CREATE TABLE IF NOT EXISTS public.lesson_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_name VARCHAR(150) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    title VARCHAR(200) NOT NULL,
    summary TEXT NOT NULL,
    homework TEXT,
    homework_due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. MESSAGERIE INTERNE (ENSEIGNANTS, DIRECTION, PARENTS)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    sender_name VARCHAR(150) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_type VARCHAR(30) NOT NULL CHECK (recipient_type IN ('classe', 'parents', 'administration')),
    recipient_target_id VARCHAR(100),
    recipient_target_name VARCHAR(150) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sms_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. EMPLOI DU TEMPS & HORAIRE DE COURS
CREATE TABLE IF NOT EXISTS public.schedule_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi')),
    time_slot VARCHAR(50) NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    room VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discipline_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_appreciations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

-- Helper function: obtenir le school_id de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.current_user_school_id()
RETURNS UUID AS $$
    SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function: obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role_type AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Policies sur Schools
DROP POLICY IF EXISTS "Super admin can view all schools" ON public.schools;
CREATE POLICY "Super admin can view all schools"
ON public.schools FOR ALL
TO authenticated
USING (public.current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Users view their own school" ON public.schools;
CREATE POLICY "Users view their own school"
ON public.schools FOR SELECT
TO authenticated
USING (id = public.current_user_school_id());

-- Policies sur Profiles
DROP POLICY IF EXISTS "Users view profiles in school" ON public.profiles;
CREATE POLICY "Users view profiles in school"
ON public.profiles FOR SELECT
TO authenticated
USING (
    school_id = public.current_user_school_id() 
    OR id = auth.uid() 
    OR public.current_user_role() = 'super_admin'
);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 2. Policies sur Classes (Le Directeur et l'Admin peuvent nommer le Titulaire de classe)
DROP POLICY IF EXISTS "Users view classes in school" ON public.classes;
CREATE POLICY "Users view classes in school"
ON public.classes FOR SELECT
TO authenticated
USING (school_id = public.current_user_school_id());

DROP POLICY IF EXISTS "Director and Admin manage classes and assign titulaire" ON public.classes;
CREATE POLICY "Director and Admin manage classes and assign titulaire"
ON public.classes FOR ALL
TO authenticated
USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('directeur', 'admin_scolaire', 'super_admin')
);

-- 3. Policies sur Students (Séparation stricte par école)
DROP POLICY IF EXISTS "School staff view their students" ON public.students;
CREATE POLICY "School staff view their students"
ON public.students FOR ALL
TO authenticated
USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() NOT IN ('parent', 'eleve')
);

DROP POLICY IF EXISTS "Parents view their own children" ON public.students;
CREATE POLICY "Parents view their own children"
ON public.students FOR SELECT
TO authenticated
USING (
    public.current_user_role() = 'parent'
    AND id IN (
        SELECT ps.student_id FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        WHERE p.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students view their own record" ON public.students;
CREATE POLICY "Students view their own record"
ON public.students FOR SELECT
TO authenticated
USING (
    public.current_user_role() = 'eleve'
    AND user_id = auth.uid()
);

-- 4. Policies sur Attendance (Présences & Absences)
DROP POLICY IF EXISTS "Staff view and record attendance" ON public.attendance;
CREATE POLICY "Staff view and record attendance"
ON public.attendance FOR ALL
TO authenticated
USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('enseignant', 'directeur', 'directeur_discipline', 'directeur_etudes', 'admin_scolaire', 'surveillant')
);

DROP POLICY IF EXISTS "Parents view attendance of their children" ON public.attendance;
CREATE POLICY "Parents view attendance of their children"
ON public.attendance FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT ps.student_id FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        WHERE p.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students view their own attendance" ON public.attendance;
CREATE POLICY "Students view their own attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
    )
);

-- 5. Policies sur Grades (Notes & Évaluations privées)
DROP POLICY IF EXISTS "Staff view school grades" ON public.grades;
CREATE POLICY "Staff view school grades"
ON public.grades FOR SELECT
TO authenticated
USING (school_id = public.current_user_school_id());

DROP POLICY IF EXISTS "Teachers can insert and update grades" ON public.grades;
CREATE POLICY "Teachers can insert and update grades"
ON public.grades FOR ALL
TO authenticated
USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('enseignant', 'directeur_etudes', 'admin_scolaire', 'directeur')
);

DROP POLICY IF EXISTS "Parents view published grades of children" ON public.grades;
CREATE POLICY "Parents view published grades of children"
ON public.grades FOR SELECT
TO authenticated
USING (
    status = 'published'
    AND student_id IN (
        SELECT ps.student_id FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        WHERE p.user_id = auth.uid()
    )
);

-- Accès sécurisé et strictement privé pour l'élève à ses propres notes
DROP POLICY IF EXISTS "Students view their own grades" ON public.grades;
CREATE POLICY "Students view their own grades"
ON public.grades FOR SELECT
TO authenticated
USING (
    status = 'published'
    AND student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
    )
);

-- 6. Policies sur Appréciations du Titulaire (class_appreciations)
DROP POLICY IF EXISTS "Staff manage class appreciations" ON public.class_appreciations;
CREATE POLICY "Staff manage class appreciations"
ON public.class_appreciations FOR ALL
TO authenticated
USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('enseignant', 'directeur', 'directeur_etudes', 'admin_scolaire')
);

DROP POLICY IF EXISTS "Parents view appreciations of their children" ON public.class_appreciations;
CREATE POLICY "Parents view appreciations of their children"
ON public.class_appreciations FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT ps.student_id FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        WHERE p.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students view their own appreciations" ON public.class_appreciations;
CREATE POLICY "Students view their own appreciations"
ON public.class_appreciations FOR SELECT
TO authenticated
USING (
    student_id IN (
        SELECT id FROM public.students WHERE user_id = auth.uid()
    )
);

-- 7. Policies sur Rectification des Cotes (grade_corrections)
DROP POLICY IF EXISTS "Teachers and director view corrections" ON public.grade_corrections;
CREATE POLICY "Teachers and director view corrections"
ON public.grade_corrections FOR SELECT
TO authenticated
USING (school_id = public.current_user_school_id());

DROP POLICY IF EXISTS "Teachers submit grade corrections" ON public.grade_corrections;
CREATE POLICY "Teachers submit grade corrections"
ON public.grade_corrections FOR INSERT
TO authenticated
WITH CHECK (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('enseignant', 'directeur_etudes')
);

DROP POLICY IF EXISTS "Director of studies reviews grade corrections" ON public.grade_corrections;
CREATE POLICY "Director of studies reviews grade corrections"
ON public.grade_corrections FOR UPDATE
TO authenticated
USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('directeur_etudes', 'directeur', 'super_admin')
);

-- 8. Policies sur Cahier de Textes (lesson_logs)
DROP POLICY IF EXISTS "Everyone in school views lesson logs" ON public.lesson_logs;
CREATE POLICY "Everyone in school views lesson logs"
ON public.lesson_logs FOR SELECT
TO authenticated
USING (school_id = public.current_user_school_id());

DROP POLICY IF EXISTS "Teachers and directors manage lesson logs" ON public.lesson_logs;
CREATE POLICY "Teachers and directors manage lesson logs"
ON public.lesson_logs FOR ALL
TO authenticated
USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('enseignant', 'directeur', 'directeur_etudes', 'admin_scolaire')
);

-- 9. Policies sur Messagerie (messages)
DROP POLICY IF EXISTS "Users view school messages" ON public.messages;
CREATE POLICY "Users view school messages"
ON public.messages FOR SELECT
TO authenticated
USING (school_id = public.current_user_school_id());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (school_id = public.current_user_school_id());

-- 10. Policies sur Horaires (schedule_slots)
DROP POLICY IF EXISTS "Users view schedule" ON public.schedule_slots;
CREATE POLICY "Users view schedule"
ON public.schedule_slots FOR SELECT
TO authenticated
USING (school_id = public.current_user_school_id());

DROP POLICY IF EXISTS "Admin and Director manage schedule" ON public.schedule_slots;
CREATE POLICY "Admin and Director manage schedule"
ON public.schedule_slots FOR ALL
TO authenticated
USING (
    school_id = public.current_user_school_id()
    AND public.current_user_role() IN ('directeur', 'directeur_etudes', 'admin_scolaire', 'super_admin')
);

-- Index pour performances multi-écoles
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_main_teacher ON public.classes(main_teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON public.attendance(school_id, date);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_school_class ON public.grades(school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_payments_school ON public.payments(school_id);
CREATE INDEX IF NOT EXISTS idx_class_apprec_student ON public.class_appreciations(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_corr_class ON public.grade_corrections(class_id);
CREATE INDEX IF NOT EXISTS idx_lesson_logs_class ON public.lesson_logs(class_id);
CREATE INDEX IF NOT EXISTS idx_messages_school ON public.messages(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_school ON public.audit_logs(school_id);
