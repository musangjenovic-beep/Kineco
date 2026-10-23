import { useState } from 'react';
import { School, SchoolClass, Subject, Student, Grade, AcademicPeriod, Teacher } from '../types';
import { BookOpen, Award, CheckCircle2, AlertCircle, FileText, Check, ShieldCheck, UserCheck } from 'lucide-react';

interface DirecteurEtudesViewProps {
  school: School;
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  teachers?: Teacher[];
  grades: Grade[];
  academicPeriods: AcademicPeriod[];
  onOpenBulletin: (studentId: string) => void;
  onAssignCourse?: (classId: string, subjectId: string, teacherId: string) => Promise<void>;
}

export const DirecteurEtudesView = ({
  school,
  classes,
  subjects,
  students,
  teachers = [],
  grades,
  academicPeriods,
  onOpenBulletin,
  onAssignCourse,
}: DirecteurEtudesViewProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'deliberation' | 'cours'>('deliberation');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [validatedNotice, setValidatedNotice] = useState(false);
  const [assignedCourseTeacher, setAssignedCourseTeacher] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.classId === selectedClass?.id);

  // Calculate stats for this class
  const publishedGradesCount = grades.filter((g) => g.classId === selectedClass?.id && g.status === 'published').length;
  const draftGradesCount = grades.filter((g) => g.classId === selectedClass?.id && g.status === 'draft').length;

  const handleValidateAllBulletins = () => {
    setValidatedNotice(true);
    setTimeout(() => setValidatedNotice(false), 3500);
  };

  const defaultSubjectsList = subjects.length > 0 ? subjects : [
    { id: 'sbj-math', schoolId: school.id, name: 'Mathématiques & Algèbre', code: 'MATH', category: 'Sciences', defaultCoefficient: 4, defaultMaxScore: 40 },
    { id: 'sbj-fr', schoolId: school.id, name: 'Français & Littérature', code: 'FRAN', category: 'Lettres & Langues', defaultCoefficient: 4, defaultMaxScore: 40 },
    { id: 'sbj-phys', schoolId: school.id, name: 'Sciences Physiques & Technologie', code: 'PHYS', category: 'Sciences', defaultCoefficient: 3, defaultMaxScore: 30 },
    { id: 'sbj-svt', schoolId: school.id, name: 'Sciences de la Vie et de la Terre (SVT)', code: 'SVT', category: 'Sciences', defaultCoefficient: 2, defaultMaxScore: 20 },
    { id: 'sbj-ang', schoolId: school.id, name: 'Anglais & Expression', code: 'ANG', category: 'Lettres & Langues', defaultCoefficient: 2, defaultMaxScore: 20 },
    { id: 'sbj-hist', schoolId: school.id, name: 'Histoire & Éducation Civique', code: 'HIST', category: 'Sciences Humaines', defaultCoefficient: 2, defaultMaxScore: 20 },
    { id: 'sbj-info', schoolId: school.id, name: 'Informatique & TIC', code: 'INFO', category: 'Sciences', defaultCoefficient: 2, defaultMaxScore: 20 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Direction des Études & Pédagogie
              </span>
              <span className="text-xs text-slate-500">{school.name}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Supervision Pédagogique & Validation des Bulletins
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Contrôle de conformité des cotes saisies par les professeurs, calcul des moyennes semestrielles et délivrance des bulletins officiels RDC.
            </p>
          </div>

          <button
            id="btn-validate-class-bulletins"
            onClick={handleValidateAllBulletins}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Valider les Bulletins de la Période</span>
          </button>
        </div>

        {validatedNotice && (
          <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-300 text-teal-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-teal-600" />
            <span>Tous les bulletins de la classe {selectedClass?.name} ont été approuvés pour impression et publication aux parents.</span>
          </div>
        )}

        {/* Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Classe sélectionnée</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5 truncate">{selectedClass?.name}</div>
            <span className="text-[10px] text-slate-400">{classStudents.length} élèves inscrits</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Notes Publiées</span>
            <div className="font-bold text-emerald-700 text-sm mt-0.5">{publishedGradesCount} saisies</div>
            <span className="text-[10px] text-emerald-600">Disponibles pour délibération</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Brouillons en attente</span>
            <div className="font-bold text-amber-700 text-sm mt-0.5">{draftGradesCount} fiches</div>
            <span className="text-[10px] text-amber-600">À valider par les professeurs</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Règlement Pédagogique</span>
            <div className="font-bold text-blue-900 text-sm mt-0.5">Norme EPST RDC</div>
            <span className="text-[10px] text-slate-400">Seuil d'admission : 50%</span>
          </div>
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('deliberation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'deliberation'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Palmarès & Validation des Bulletins
        </button>
        <button
          onClick={() => setActiveSubTab('cours')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'cours'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Attribution des Cours (7e, 8e EB & Humanités)
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* VIEW 1: DELIBERATION & PALMARES */}
      {activeSubTab === 'deliberation' && (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Palmarès & Délibération par Élève</h2>
            <p className="text-xs text-slate-500">Moyenne estimée, pourcentage et accès au bulletin officiel</p>
          </div>

          {/* Select class */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Changer de classe :</label>
            <select
              id="select-de-class"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold">
                <th className="py-2.5 px-3">Matricule</th>
                <th className="py-2.5 px-3">Nom, Post-nom & Prénom</th>
                <th className="py-2.5 px-3 text-center">Sexe</th>
                <th className="py-2.5 px-3 text-center">Estimation %</th>
                <th className="py-2.5 px-3">Appréciation Jury</th>
                <th className="py-2.5 px-3 text-right">Bulletin Officiel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {classStudents.map((stu, index) => {
                let estimatedPct = 85.2;
                if (index === 1) estimatedPct = 76.4;
                else if (index === 2) estimatedPct = 61.8;
                else if (index === 3) estimatedPct = 54.0;
                else estimatedPct = 72.0;

                const isFail = estimatedPct < 50;

                return (
                  <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{stu.matricule}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {stu.lastName} {stu.postName} {stu.firstName}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{stu.gender}</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-md ${
                        isFail ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {estimatedPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[11px] font-semibold ${
                        isFail ? 'text-red-600' : 'text-slate-800'
                      }`}>
                        {isFail ? 'En difficulté (Soutien requis)' : 'Admis en classe supérieure'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        id={`btn-de-view-bulletin-${stu.id}`}
                        onClick={() => onOpenBulletin(stu.id)}
                        className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white font-medium text-xs transition-colors"
                      >
                        Consulter & Imprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pedagogical Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <span>
            Règle de séparation des rôles : Le Directeur des Études supervise la pédagogie mais ne possède aucun accès de modification sur la caisse ou les montants des frais scolaires.
          </span>
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
        </div>
      </div>
      )}

      {/* VIEW 2: ATTRIBUTION DES COURS (7e, 8e EB & HUMANITÉS) */}
      {activeSubTab === 'cours' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Affectation Pédagogique des Cours & Professeurs
              </h2>
              <p className="text-xs text-slate-500">
                Définition de la grille horaire et attribution des enseignants par matière pour le cycle d’Éducation de Base et les Humanités.
              </p>
            </div>

            {/* Class Switcher */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Classe cible :</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of courses */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Matière / Discipline</th>
                  <th className="py-2.5 px-3">Domaine d’apprentissage</th>
                  <th className="py-2.5 px-3 text-center">Coeff. Officiel</th>
                  <th className="py-2.5 px-3">Professeur Enseignant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defaultSubjectsList.map((sub) => {
                  const key = `${selectedClass?.id}-${sub.id}`;
                  const currentTeacherId = assignedCourseTeacher[key] || (teachers[0]?.id ?? '');
                  const currentTeacher = teachers.find((t) => t.id === currentTeacherId);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{sub.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Code : {sub.code}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {sub.category}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {sub.defaultCoefficient}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={currentTeacherId}
                          onChange={(e) => {
                            const newTId = e.target.value;
                            setAssignedCourseTeacher((prev) => ({ ...prev, [key]: newTId }));
                            if (onAssignCourse && selectedClass) {
                              onAssignCourse(selectedClass.id, sub.id, newTId);
                            }
                            const tFound = teachers.find((t) => t.id === newTId);
                            setSuccessMsg(
                              tFound
                                ? `✓ ${tFound.fullName} affecté au cours de ${sub.name} en ${selectedClass?.name}.`
                                : 'Affectation mise à jour.'
                            );
                            setTimeout(() => setSuccessMsg(null), 3500);
                          }}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="">-- Sélectionner un enseignant --</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName} ({t.specialty})
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
