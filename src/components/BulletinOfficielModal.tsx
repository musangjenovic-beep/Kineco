import { BulletinData } from '../types';
import { Printer, Download, X, Award, CheckCircle, School as SchoolIcon } from 'lucide-react';

interface BulletinOfficielModalProps {
  bulletin: BulletinData | null;
  onClose: () => void;
}

export const BulletinOfficielModal = ({ bulletin, onClose }: BulletinOfficielModalProps) => {
  if (!bulletin) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate simple text summary or trigger print to PDF
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-6 overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 print:shadow-none print:border-none print:max-h-none print:max-w-none print:rounded-none">
        
        {/* Action Header - Hidden on Print */}
        <div className="sticky top-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 z-10 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-bold text-sm tracking-tight">Bulletin Scolaire Officiel — RDC (EPST)</h2>
              <p className="text-xs text-slate-300">
                {bulletin.student.firstName} {bulletin.student.lastName} {bulletin.student.postName} • {bulletin.schoolClass.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-bulletin"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              id="btn-download-bulletin"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger (PDF)</span>
            </button>
            <button
              id="btn-close-bulletin"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div id="printable-bulletin" className="p-6 sm:p-10 space-y-6 text-slate-900">
          
          {/* Header RDC & Établissement */}
          <div className="text-center border-b-2 border-slate-900 pb-5">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-700">
              <span>République Démocratique du Congo</span>
            </div>
            <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wider mt-0.5">
              Ministère de l'Enseignement Primaire, Secondaire et Technique (EPST)
            </div>
            <div className="text-[11px] font-medium text-slate-500 mt-0.5">
              Province Éducationnelle de {bulletin.school.province} • Ville de {bulletin.school.city}
            </div>

            <div className="mt-3 inline-block px-6 py-2 rounded-xl bg-slate-100 border border-slate-300">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                {bulletin.school.name}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">{bulletin.school.address} • Tél: {bulletin.school.phone}</p>
            </div>

            <div className="mt-4">
              <span className="inline-block px-4 py-1 rounded-full bg-blue-900 text-white font-bold text-xs uppercase tracking-wider">
                Bulletin de Notes — Année Scolaire {bulletin.academicYear.name}
              </span>
            </div>
          </div>

          {/* Student & Class Details Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Nom, Post-nom & Prénom :</span>
              <strong className="text-slate-900 font-bold text-sm block">
                {bulletin.student.lastName} {bulletin.student.postName} {bulletin.student.firstName}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Matricule :</span>
              <strong className="text-slate-900 font-bold block">{bulletin.student.matricule}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Classe & Section :</span>
              <strong className="text-slate-900 font-bold block">{bulletin.schoolClass.name}</strong>
              <span className="text-slate-600 text-[10px]">{bulletin.schoolClass.section}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Période d'Évaluation :</span>
              <strong className="text-blue-700 font-bold block">{bulletin.period.name}</strong>
            </div>
          </div>

          {/* Official Grades Grid */}
          <div className="overflow-x-auto border border-slate-300 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-semibold">
                  <th className="py-2.5 px-3 border border-slate-700">Matières / Disciplines</th>
                  <th className="py-2.5 px-2 text-center border border-slate-700 w-16">Max P1</th>
                  <th className="py-2.5 px-2 text-center border border-slate-700 w-16">P1</th>
                  <th className="py-2.5 px-2 text-center border border-slate-700 w-16">P2</th>
                  <th className="py-2.5 px-2 text-center border border-slate-700 w-20">Examen</th>
                  <th className="py-2.5 px-2 text-center border border-slate-700 w-20">Total Sem.</th>
                  <th className="py-2.5 px-2 text-center border border-slate-700 w-16">%</th>
                  <th className="py-2.5 px-3 border border-slate-700">Appréciation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {bulletin.subjectsResults.map((sub, idx) => {
                  const isFail = (sub.percentage || 0) < 50;
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-2 px-3 font-sans font-medium text-slate-900 border border-slate-300">
                        {sub.subjectName}
                        <span className="text-[10px] text-slate-500 block font-normal">{sub.category} (Coeff {sub.coefficient})</span>
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600 border border-slate-300">{sub.maxPeriod}</td>
                      <td className="py-2 px-2 text-center font-bold text-slate-800 border border-slate-300">{sub.period1Score}</td>
                      <td className="py-2 px-2 text-center font-bold text-slate-800 border border-slate-300">{sub.period2Score}</td>
                      <td className="py-2 px-2 text-center font-bold text-blue-900 border border-slate-300">{sub.examScore}</td>
                      <td className="py-2 px-2 text-center font-extrabold text-slate-900 border border-slate-300">
                        {sub.totalSemesterScore} / {sub.maxSemesterTotal}
                      </td>
                      <td className={`py-2 px-2 text-center font-bold border border-slate-300 ${isFail ? 'text-red-600 bg-red-50' : 'text-emerald-700'}`}>
                        {sub.percentage}%
                      </td>
                      <td className="py-2 px-3 font-sans text-[11px] text-slate-700 border border-slate-300">
                        {sub.appreciation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recapitulation & Deliberation Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-2 border-slate-900 rounded-xl p-4 bg-slate-50">
            {/* Academic Score Result */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Résultats Généraux</span>
              <div className="text-sm font-bold text-slate-800">
                Points : <span className="text-base font-black">{bulletin.totalScoreObtained}</span> / {bulletin.totalMaxPossible}
              </div>
              <div className="text-xl font-black text-blue-900 flex items-center gap-2">
                <span>{bulletin.generalPercentage}%</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  Place : {bulletin.classRank}e sur {bulletin.totalStudentsInClass}
                </span>
              </div>
            </div>

            {/* Discipline & Assiduity */}
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-300 sm:pl-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Assiduité & Conduite</span>
              <div className="text-xs text-slate-700">
                Conduite : <strong className="font-bold text-slate-900">{bulletin.conduct}</strong>
              </div>
              <div className="text-xs text-slate-700">
                Application : <strong className="font-bold text-slate-900">{bulletin.application}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Absences : <strong className="text-slate-900">{bulletin.daysAbsent} jour(s)</strong> • Retards : {bulletin.daysLate}
              </div>
            </div>

            {/* Jury Decision */}
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-300 sm:pl-4 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Décision du Jury</span>
              <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 font-black text-xs text-center flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>{bulletin.juryDecision}</span>
              </div>
            </div>
          </div>

          {/* Official Signatures Box */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs text-slate-700 border-t border-slate-300">
            <div>
              <p className="font-semibold text-slate-900">Le Titulaire de Classe</p>
              <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-[11px] text-slate-400">
                Signature & Date
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Le Directeur des Études</p>
              <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-[11px] text-slate-400">
                Sceau & Signature
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Le Parent ou Tuteur</p>
              <div className="h-16 border-b border-dashed border-slate-300 flex items-end justify-center pb-1 text-[11px] text-slate-400">
                Vu et pris connaissance
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2">
            Document officiel généré par le Système Numérique EduKin RDC le {bulletin.generatedDate}. Toute rature annule le bulletin.
          </div>
        </div>

      </div>
    </div>
  );
};
