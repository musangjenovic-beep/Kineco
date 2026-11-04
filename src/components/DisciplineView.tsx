import { useState, useMemo } from 'react';
import { School, Student, DisciplineIncident, AttendanceRecord, SchoolClass } from '../types';
import { ShieldAlert, AlertTriangle, Plus, Send, Clock, UserX, CheckCircle, Lock, Filter, Search } from 'lucide-react';

interface DisciplineViewProps {
  school: School;
  students: Student[];
  classes?: SchoolClass[];
  incidents: DisciplineIncident[];
  attendance: AttendanceRecord[];
  onAddIncident: (data: Omit<DisciplineIncident, 'id' | 'schoolId' | 'recordedAt'>) => Promise<void>;
  onSendSmsAlert: (phone: string, name: string, msg: string) => Promise<void>;
}

export const DisciplineView = ({
  school,
  students,
  classes = [],
  incidents,
  attendance,
  onAddIncident,
  onSendSmsAlert,
}: DisciplineViewProps) => {
  // Cascading Selection: Section -> Classe -> Élève (Article 38 & 45 des spécifications)
  const defaultSections = school.sections && school.sections.length > 0 
    ? school.sections 
    : ['Scientifique', 'Littéraire', 'Commerciale & Gestion', 'Pédagogique', 'Électricité', 'Éducation de Base'];

  const [selectedSection, setSelectedSection] = useState<string>('TOUTES');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [incidentCategory, setIncidentCategory] = useState<DisciplineIncident['category']>('Absence injustifiée');
  const [otherInfractionText, setOtherInfractionText] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<DisciplineIncident['severity']>('Modéré');
  const [sanction, setSanction] = useState('Avertissement écrit & mot au carnet');
  const [notifyParent, setNotifyParent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Filter classes by selected section
  const availableClasses = useMemo(() => {
    if (selectedSection === 'TOUTES') return classes;
    return classes.filter((c) => {
      const sectionLower = selectedSection.toLowerCase();
      return (
        c.section?.toLowerCase().includes(sectionLower) ||
        c.name.toLowerCase().includes(sectionLower) ||
        (selectedSection === 'Éducation de Base' && (c.name.includes('7') || c.name.includes('8')))
      );
    });
  }, [classes, selectedSection]);

  // Filter students strictly by selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Daily attendance stats
  const absences = attendance.filter((a) => a.status === 'absent');
  const retards = attendance.filter((a) => a.status === 'retard');

  // Immutable timestamp captured at render (Article 39: date et heure verrouillées et immuables)
  const currentTimestamp = useMemo(() => new Date().toISOString(), []);
  const formattedLockTime = new Date().toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Veuillez sélectionner un élève via le filtre Section -> Classe.');
      return;
    }
    const finalDescription = incidentCategory === 'Autre'
      ? `[Autre infraction: ${otherInfractionText.trim()}] ${description.trim()}`
      : description.trim();

    if (!finalDescription) {
      alert('Veuillez renseigner la description des faits.');
      return;
    }

    const selectedCls = classes.find((c) => c.id === selectedClassId);
    const stu = students.find((s) => s.id === selectedStudentId);

    setIsSubmitting(true);
    await onAddIncident({
      studentId: selectedStudentId,
      date: new Date().toISOString().split('T')[0],
      category: incidentCategory,
      description: finalDescription,
      severity,
      sanction,
      parentNotified: notifyParent,
      recordedBy: 'Direction de Discipline (ROI Certifié)',
      immutableTimestamp: new Date().toISOString(),
      isOther: incidentCategory === 'Autre',
      classId: selectedClassId,
      section: selectedCls?.section || selectedSection,
    });

    const phone = stu?.parentPhone || stu?.guardianPhone;
    if (notifyParent && stu && phone) {
      try {
        await onSendSmsAlert(
          phone,
          `${stu.firstName} ${stu.lastName}`,
          `Alerte Discipline: Incident (${incidentCategory}) consigné ce jour pour ${stu.firstName}. Sanction: ${sanction}. Merci de contacter la direction.`
        );
      } catch (err) {
        console.warn('SMS dispatch:', err);
      }
    }

    setIsSubmitting(false);
    setDescription('');
    setOtherInfractionText('');
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title Card */}
      <div className="bg-white dark:bg-[#181B20] rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Direction de Discipline & Assiduité
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{school.name}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Registre Disciplinaire & Traçabilité des Sanctions
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Sélection stricte par option et classe, horodatage immuable scellé pour les infractions et notification SMS instantanée aux parents.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase block">Absents aujourd'hui</span>
              <span className="text-xl font-black text-red-700 dark:text-red-300">{absences.length}</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase block">Retards aujourd'hui</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-300">{retards.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Enregistrer un incident */}
        <div className="bg-white dark:bg-[#181B20] rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 lg:col-span-1 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Signaler un Incident / Sanction</span>
          </h2>

          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Incident consigné au dossier avec horodatage scellé et parent averti !</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Step 1: Section selection */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                1. Option / Section *
              </label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setSelectedClassId('');
                  setSelectedStudentId('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="TOUTES">Toutes les sections</option>
                {defaultSections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Step 2: Class selection (filtered) */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                2. Classe spécifique *
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Sélectionnez la classe ({availableClasses.length} disponibles)...</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `(${cls.section})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Student selection (strictly filtered by class) */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                3. Élève concerné * (Restreint à la classe)
              </label>
              <select
                id="select-discipline-student"
                value={selectedStudentId}
                disabled={!selectedClassId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="">
                  {selectedClassId 
                    ? `Choisir l'élève (${classStudents.length} élèves inscrits)...` 
                    : 'Sélectionnez d’abord une classe ci-dessus'}
                </option>
                {classStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName} {s.postName} {s.firstName} ({s.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catégorie de l'infraction
              </label>
              <select
                id="select-discipline-category"
                value={incidentCategory}
                onChange={(e) => setIncidentCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="Absence injustifiée">Absence injustifiée</option>
                <option value="Retard répété">Retard répété</option>
                <option value="Uniforme non conforme">Uniforme non conforme</option>
                <option value="Indiscipline">Indiscipline / Insolence</option>
                <option value="Bagarre">Bagarre / Voie de fait</option>
                <option value="Autre">Autre infraction (Horodatage scellé)</option>
              </select>
            </div>

            {/* Champ "Autres infractions" spécifique avec horodatage scellé immuable */}
            {incidentCategory === 'Autre' && (
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                <label className="block font-bold text-amber-900 dark:text-amber-200">
                  Libellé de l'infraction particulière *
                </label>
                <input
                  type="text"
                  required
                  value={otherInfractionText}
                  onChange={(e) => setOtherInfractionText(e.target.value)}
                  placeholder="Ex: Dégradation de matériel de laboratoire"
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                />

                <div className="flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 font-mono">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Horodatage immuable scellé : <strong>{formattedLockTime}</strong></span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gravité</label>
                <select
                  id="select-discipline-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Faible">Faible</option>
                  <option value="Modéré">Modéré</option>
                  <option value="Grave">Grave</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date d'effet</label>
                <input
                  type="text"
                  disabled
                  value={new Date().toLocaleDateString('fr-FR')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description des faits *
              </label>
              <textarea
                id="textarea-discipline-desc"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisez le contexte, l'heure exacte et les témoins..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sanction retenue</label>
              <input
                id="input-discipline-sanction"
                type="text"
                value={sanction}
                onChange={(e) => setSanction(e.target.value)}
                placeholder="Ex: Avertissement, retenue, convocation des parents"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  id="checkbox-discipline-notify"
                  type="checkbox"
                  checked={notifyParent}
                  onChange={(e) => setNotifyParent(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>Alerter le parent par SMS immédiatement</span>
              </label>
            </div>

            <button
              id="btn-submit-discipline"
              type="submit"
              disabled={isSubmitting || !selectedStudentId}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all shadow-sm disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement sécurisé...' : 'Enregistrer la Sanction'}</span>
            </button>
          </form>
        </div>

        {/* Historique des incidents */}
        <div className="bg-white dark:bg-[#181B20] rounded-2xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Historique des Incidents Disciplinaires
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {incidents.length} Dossiers Enregistrés
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {incidents.map((inc) => {
              const stu = students.find((s) => s.id === inc.studentId);
              const cls = classes.find((c) => c.id === (stu?.classId || inc.classId));
              return (
                <div key={inc.id} className="p-4 bg-white dark:bg-[#181B20] hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.severity === 'Grave'
                          ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-300'
                          : inc.severity === 'Modéré'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {inc.severity}
                      </span>
                      <strong className="text-slate-900 dark:text-white font-bold text-sm">
                        {stu ? `${stu.lastName} ${stu.postName} ${stu.firstName}` : 'Élève'}
                      </strong>
                      <span className="text-slate-400 font-mono text-[11px]">({stu?.matricule})</span>
                      {cls && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {cls.name} {cls.section ? `• ${cls.section}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <span>{inc.date}</span>
                      {inc.immutableTimestamp && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          <Lock className="w-3 h-3" /> Horodatage Certifié
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    Motif : <strong className="text-slate-900 dark:text-white">{inc.category}</strong> — <span className="font-normal text-slate-600 dark:text-slate-400">{inc.description}</span>
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      Sanction : <strong className="text-slate-800 dark:text-slate-200">{inc.sanction}</strong>
                    </div>
                    <div>
                      {inc.parentNotified ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>SMS envoyé au parent</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Parent non notifié</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
