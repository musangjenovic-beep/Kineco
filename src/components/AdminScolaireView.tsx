import { useState } from 'react';
import { School, SchoolClass, Subject, AcademicYear, AcademicPeriod, Student, Parent, Teacher } from '../types';
import { Plus, BookOpen, Layers, Calendar, Settings, Users, Check, UserCheck } from 'lucide-react';

interface AdminScolaireViewProps {
  school: School;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers?: Teacher[];
  academicYears: AcademicYear[];
  academicPeriods: AcademicPeriod[];
  students: Student[];
  parents: Parent[];
  onAddClass: (classData: Omit<SchoolClass, 'id' | 'schoolId'>) => Promise<void>;
  onAddSubject: (subjectData: Omit<Subject, 'id' | 'schoolId'>) => Promise<void>;
  onAddPeriod: (periodData: Omit<AcademicPeriod, 'id'>) => Promise<void>;
  onUpdateSchoolSettings: (updates: Partial<School>) => Promise<void>;
  onAssignTitulaire?: (classId: string, teacherId: string) => Promise<void>;
}

export const AdminScolaireView = ({
  school,
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
}: AdminScolaireViewProps) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'periods' | 'settings'>('classes');

  // Form states for new class
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('Humanités');
  const [newClassSection, setNewClassSection] = useState('Scientifique');
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

  // School settings state
  const [exchangeRate, setExchangeRate] = useState(school.exchangeRateUsdCdf);
  const [schoolPhone, setSchoolPhone] = useState(school.phone);
  const [schoolEmail, setSchoolEmail] = useState(school.email);
  const [settingsSaved, setSettingsSaved] = useState(false);

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
      isCurrent: true,
    });
    setNewPeriodName('');
    setNewPeriodCode('');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSchoolSettings({
      exchangeRateUsdCdf: Number(exchangeRate),
      phone: schoolPhone,
      email: schoolEmail,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Administration Académique & Système
            </h1>
            <p className="text-xs text-slate-500">
              Configuration dynamique des classes, matières, coefficients et périodes scolaires ({school.name})
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <button
              id="tab-admin-classes"
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'classes' ? 'bg-white shadow-xs text-blue-700' : 'hover:text-slate-900'
              }`}
            >
              Classes ({classes.length})
            </button>
            <button
              id="tab-admin-subjects"
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'subjects' ? 'bg-white shadow-xs text-blue-700' : 'hover:text-slate-900'
              }`}
            >
              Matières ({subjects.length})
            </button>
            <button
              id="tab-admin-periods"
              onClick={() => setActiveTab('periods')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'periods' ? 'bg-white shadow-xs text-blue-700' : 'hover:text-slate-900'
              }`}
            >
              Périodes & Année
            </button>
            <button
              id="tab-admin-settings"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-white shadow-xs text-blue-700' : 'hover:text-slate-900'
              }`}
            >
              Paramètres Établissement
            </button>
          </div>
        </div>

        {/* Tab 1: Classes */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            {/* Create Class Form */}
            <form onSubmit={handleCreateClass} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Créer une nouvelle classe</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Nom de la classe *</label>
                  <input
                    id="input-class-name"
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Ex: 8ème Éducation de Base C"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Niveau</label>
                  <select
                    id="select-class-level"
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Cycle Terminal EB">Cycle Terminal EB (7e/8e)</option>
                    <option value="Humanités">Humanités (1ère à 4ème)</option>
                    <option value="Primaire">Primaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Section / Option</label>
                  <select
                    id="select-class-section"
                    value={newClassSection}
                    onChange={(e) => setNewClassSection(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Scientifique">Scientifique (Bio-Chimie)</option>
                    <option value="Commerciale & Gestion">Commerciale & Gestion</option>
                    <option value="Littéraire">Littéraire (Latin-Philo)</option>
                    <option value="Pédagogique">Pédagogique</option>
                    <option value="Générale">Générale</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    id="btn-submit-add-class"
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition-colors"
                  >
                    Ajouter la classe
                  </button>
                </div>
              </div>
            </form>

            {/* Classes List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {classes.map((cls) => {
                const count = students.filter((s) => s.classId === cls.id).length;
                const assignedTeacher = teachers.find((t) => t.id === cls.mainTeacherId);
                return (
                  <div key={cls.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 font-bold text-sm">{cls.name}</strong>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                        {cls.level}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Section : <span className="text-slate-800 font-medium">{cls.section}</span>
                    </div>

                    {/* Titulaire de classe selector */}
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          Titulaire :
                        </span>
                        {assignedTeacher ? (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                            {assignedTeacher.fullName}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic text-[10px]">Non assigné</span>
                        )}
                      </div>

                      {onAssignTitulaire && (
                        <select
                          id={`select-titulaire-${cls.id}`}
                          value={cls.mainTeacherId || ''}
                          onChange={(e) => onAssignTitulaire(cls.id, e.target.value)}
                          className="w-full text-[11px] px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Choisir le Professeur Titulaire --</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName} ({t.specialty})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 text-slate-500">
                      <span>Capacité: {cls.capacity} places</span>
                      <strong className="text-blue-600">{count} élèves inscrits</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Subjects */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            {/* Create Subject Form */}
            <form onSubmit={handleCreateSubject} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Ajouter une matière au programme</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Intitulé du cours *</label>
                  <input
                    id="input-subject-name"
                    type="text"
                    required
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Ex: Éducation Civique & Morale"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Code / Sigle *</label>
                  <input
                    id="input-subject-code"
                    type="text"
                    required
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="Ex: ECM"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Domaine</label>
                  <select
                    id="select-subject-category"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Sciences">Sciences</option>
                    <option value="Lettres & Langues">Lettres & Langues</option>
                    <option value="Sciences Humaines">Sciences Humaines</option>
                    <option value="Technique">Technique</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Période</label>
                  <input
                    id="input-subject-max-score"
                    type="number"
                    value={newSubMax}
                    onChange={(e) => setNewSubMax(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    id="btn-submit-add-subject"
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </form>

            {/* Subjects Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Intitulé de la matière</th>
                    <th className="py-2.5 px-3">Domaine d'apprentissage</th>
                    <th className="py-2.5 px-3 text-center">Coefficient</th>
                    <th className="py-2.5 px-3 text-center">Max Période</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{sub.code}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{sub.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{sub.category}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{sub.defaultCoefficient}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{sub.defaultMaxScore} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Periods & Year */}
        {activeTab === 'periods' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
              <span className="font-bold block mb-1">Année Scolaire en cours : {academicYears[0]?.name}</span>
              <p className="text-blue-800">
                Les périodes scolaires ci-dessous déterminent les colonnes du bulletin officiel RDC et les fenêtres de saisie des notes pour les professeurs.
              </p>
            </div>

            {/* Create Period Form */}
            <form onSubmit={handleCreatePeriod} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Ajouter une période d'évaluation</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Intitulé de la période *</label>
                  <input
                    id="input-period-name"
                    type="text"
                    required
                    value={newPeriodName}
                    onChange={(e) => setNewPeriodName(e.target.value)}
                    placeholder="Ex: 3ème Période"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Code abrégé *</label>
                  <input
                    id="input-period-code"
                    type="text"
                    required
                    value={newPeriodCode}
                    onChange={(e) => setNewPeriodCode(e.target.value)}
                    placeholder="Ex: P3"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white uppercase"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    id="btn-submit-add-period"
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition-colors"
                  >
                    Ajouter la période
                  </button>
                </div>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {academicPeriods.map((per) => (
                <div key={per.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold">{per.name}</strong>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {per.code}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Semestre {per.semester} • Poids: {per.weight}</div>
                  <div className="pt-2 text-[10px]">
                    {per.isCurrent ? (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        ● Période active
                      </span>
                    ) : (
                      <span className="text-slate-400">Période clôturée</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: School Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl text-xs">
            {settingsSaved && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Paramètres de l'école mis à jour avec succès !</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Taux de change appliqué (1 USD = X Francs Congolais)
              </label>
              <input
                id="input-settings-rate"
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Utilisé automatiquement pour convertir les frais de scolarité et paiements Mobile Money.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Téléphone officiel de l'école
              </label>
              <input
                id="input-settings-phone"
                type="text"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email officiel
              </label>
              <input
                id="input-settings-email"
                type="email"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <button
              id="btn-submit-save-settings"
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-sm"
            >
              Enregistrer les modifications
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
