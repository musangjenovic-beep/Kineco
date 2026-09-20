import { useState } from 'react';
import { School, Student, DisciplineIncident, AttendanceRecord } from '../types';
import { ShieldAlert, AlertTriangle, Plus, Send, Clock, UserX, CheckCircle } from 'lucide-react';

interface DisciplineViewProps {
  school: School;
  students: Student[];
  incidents: DisciplineIncident[];
  attendance: AttendanceRecord[];
  onAddIncident: (data: Omit<DisciplineIncident, 'id' | 'schoolId' | 'recordedAt'>) => Promise<void>;
  onSendSmsAlert: (phone: string, name: string, msg: string) => Promise<void>;
}

export const DisciplineView = ({
  school,
  students,
  incidents,
  attendance,
  onAddIncident,
  onSendSmsAlert,
}: DisciplineViewProps) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [incidentCategory, setIncidentCategory] = useState<DisciplineIncident['category']>('Absence injustifiée');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<DisciplineIncident['severity']>('Modéré');
  const [sanction, setSanction] = useState('Avertissement écrit & mot au carnet');
  const [notifyParent, setNotifyParent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Daily attendance stats
  const absences = attendance.filter((a) => a.status === 'absent');
  const retards = attendance.filter((a) => a.status === 'retard');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !description.trim()) return;

    setIsSubmitting(true);
    await onAddIncident({
      studentId: selectedStudentId,
      date: new Date().toISOString().split('T')[0],
      category: incidentCategory,
      description,
      severity,
      sanction,
      parentNotified: notifyParent,
      recordedBy: 'M. Norbert Bope (Directeur de Discipline)',
    });

    setIsSubmitting(false);
    setDescription('');
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Direction de Discipline & Assiduité
              </span>
              <span className="text-xs text-slate-500">{school.name}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Registre Disciplinaire & Alertes d'Assiduité
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Suivi des infractions au règlement d'ordre intérieur (ROI), convocations, retards journaliers et notification SMS instantanée aux parents d'élèves.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-center p-3 rounded-xl bg-red-50 border border-red-200">
              <span className="text-[10px] text-red-600 font-bold uppercase block">Absents aujourd'hui</span>
              <span className="text-xl font-black text-red-700">{absences.length}</span>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-600 font-bold uppercase block">Retards aujourd'hui</span>
              <span className="text-xl font-black text-amber-700">{retards.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Enregistrer un incident */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 lg:col-span-1 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Signaler un Incident / Sanction</span>
          </h2>

          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Incident consigné au dossier et parent averti par SMS !</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Élève concerné *</label>
              <select
                id="select-discipline-student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName} {s.postName} {s.firstName} ({s.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catégorie de l'infraction</label>
              <select
                id="select-discipline-category"
                value={incidentCategory}
                onChange={(e) => setIncidentCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Absence injustifiée">Absence injustifiée</option>
                <option value="Retard répété">Retard répété</option>
                <option value="Uniforme non conforme">Uniforme non conforme</option>
                <option value="Indiscipline">Indiscipline / Insolence</option>
                <option value="Bagarre">Bagarre / Voie de fait</option>
                <option value="Autre">Autre infraction</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gravité</label>
                <select
                  id="select-discipline-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Faible">Faible</option>
                  <option value="Modéré">Modéré</option>
                  <option value="Grave">Grave</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="text"
                  disabled
                  value={new Date().toLocaleDateString('fr-FR')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description des faits *</label>
              <textarea
                id="textarea-discipline-desc"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisez le contexte, l'heure et les témoins..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sanction retenue</label>
              <input
                id="input-discipline-sanction"
                type="text"
                value={sanction}
                onChange={(e) => setSanction(e.target.value)}
                placeholder="Ex: Avertissement, corvée, convocation"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
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
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Sanction'}
            </button>
          </form>
        </div>

        {/* Historique des incidents */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Historique des Incidents Disciplinaires</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              {incidents.length} Dossiers
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {incidents.map((inc) => {
              const stu = students.find((s) => s.id === inc.studentId);
              return (
                <div key={inc.id} className="p-4 bg-white hover:bg-slate-50/70 transition-colors space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.severity === 'Grave'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : inc.severity === 'Modéré'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {inc.severity}
                      </span>
                      <strong className="text-slate-900 font-bold text-sm">
                        {stu ? `${stu.lastName} ${stu.postName} ${stu.firstName}` : 'Élève'}
                      </strong>
                      <span className="text-slate-400 font-mono text-[11px]">({stu?.matricule})</span>
                    </div>

                    <span className="text-slate-500 text-[11px]">{inc.date}</span>
                  </div>

                  <p className="text-slate-700 font-medium">Motif : {inc.category} — <span className="font-normal text-slate-600">{inc.description}</span></p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                    <div>
                      Sanction : <strong className="text-slate-800">{inc.sanction}</strong>
                    </div>
                    <div>
                      {inc.parentNotified ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
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
