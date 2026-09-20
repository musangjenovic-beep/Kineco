import { useState } from 'react';
import { School, Student, SchoolClass, Grade, PaymentRecord, DisciplineIncident, AttendanceRecord, FeeDefinition, UserRole, Subject } from '../types';
import { Users, FileText, DollarSign, ShieldAlert, CheckCircle2, Receipt, Smartphone, BookOpen, AlertTriangle, Award, Check } from 'lucide-react';

interface ParentViewProps {
  school: School;
  students: Student[];
  classes: SchoolClass[];
  subjects?: Subject[];
  grades: Grade[];
  payments: PaymentRecord[];
  incidents: DisciplineIncident[];
  attendance: AttendanceRecord[];
  fees: FeeDefinition[];
  currentUserRole?: UserRole;
  currentUsername?: string;
  onOpenBulletin: (studentId: string) => void;
  onOpenReceipt: (payment: PaymentRecord, student: Student) => void;
  onPayOnline: (studentId: string, feeId: string, amountUSD: number, method: PaymentRecord['paymentMethod']) => Promise<void>;
}

export const ParentView = ({
  school,
  students,
  classes,
  subjects = [],
  grades,
  payments,
  incidents,
  attendance,
  fees,
  currentUserRole = 'parent',
  currentUsername,
  onOpenBulletin,
  onOpenReceipt,
  onPayOnline,
}: ParentViewProps) => {
  const isStudent = currentUserRole === 'eleve';
  // Match student by matricule if student logged in
  const matchedStudent = isStudent && currentUsername
    ? students.find((s) => s.matricule.toLowerCase() === currentUsername.toLowerCase())
    : null;

  // A parent may have multiple children enrolled in the school
  const [selectedChildId, setSelectedChildId] = useState<string>(
    matchedStudent ? matchedStudent.id : (students[0]?.id || '')
  );
  const [activeTab, setActiveTab] = useState<'academic' | 'finance' | 'discipline'>('academic');
  const [payAmountUSD, setPayAmountUSD] = useState(250);
  const [payMethod, setPayMethod] = useState<PaymentRecord['paymentMethod']>('mpesa');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const currentChild = students.find((s) => s.id === selectedChildId) || students[0];
  const childClass = classes.find((c) => c.id === currentChild?.classId);

  // Child-specific records
  const childPayments = payments.filter((p) => p.studentId === currentChild?.id && p.status === 'confirmed');
  const childPaidUSD = childPayments.reduce((sum, p) => sum + p.amountUSD, 0);
  const totalFeeUSD = fees.reduce((sum, f) => sum + f.amountUSD, 0);
  const balanceUSD = Math.max(0, totalFeeUSD - childPaidUSD);

  const childIncidents = incidents.filter((i) => i.studentId === currentChild?.id);
  const childAttendance = attendance.filter((a) => a.studentId === currentChild?.id);
  const childAbsences = childAttendance.filter((a) => a.status === 'absent');
  const childRetards = childAttendance.filter((a) => a.status === 'retard');
  const childGrades = grades.filter((g) => g.studentId === currentChild?.id && g.status === 'published');

  const rate = school.exchangeRateUsdCdf;

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentChild) return;
    setIsPaying(true);
    await onPayOnline(currentChild.id, fees[0]?.id || 'fee-1', payAmountUSD, payMethod);
    setIsPaying(false);
    setPaySuccess(true);
    setTimeout(() => setPaySuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Multi-Child Selector */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                isStudent 
                  ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              }`}>
                {isStudent ? 'Espace Numérique de l’Élève' : 'Portail Famille & Parents d\'Élèves'}
              </span>
              <span className="text-xs text-slate-400">{school.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
              {isStudent ? `Bienvenue, ${currentChild ? `${currentChild.firstName} ${currentChild.lastName}` : 'Élève'}` : 'Suivi Scolaire & Paiements de Mes Enfants'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {isStudent 
                ? 'Consultez votre bulletin officiel conforme EPST, vos résultats périodiques, vos présences et les communications de l’école.'
                : 'Consultez les bulletins officiels, le cahier de textes, l\'assiduité en temps réel et réglez les frais par M-Pesa, Airtel ou Orange Money.'}
            </p>
          </div>

          {/* Child Switcher Chips */}
          {!isStudent && (
            <div className="bg-slate-800 p-1.5 rounded-xl border border-slate-700 flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold text-slate-400 self-center px-2">Enfant :</span>
              {students.slice(0, 3).map((stu) => {
                const isSelected = stu.id === currentChild?.id;
                return (
                  <button
                    key={stu.id}
                    id={`btn-child-switch-${stu.id}`}
                    onClick={() => setSelectedChildId(stu.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    {stu.firstName} ({stu.matricule})
                  </button>
                );
              })}
            </div>
          )}
          {isStudent && currentChild && (
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 text-[10px] block">Matricule Officiel</span>
              <span className="font-mono font-bold text-sky-400">{currentChild.matricule}</span>
            </div>
          )}
        </div>

        {/* Selected Child Info Bar */}
        {currentChild && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[11px] block">Élève sélectionné</span>
              <div className="font-bold text-white text-sm mt-0.5">
                {currentChild.lastName} {currentChild.postName} {currentChild.firstName}
              </div>
              <span className="text-[10px] text-blue-400 font-mono">Matricule : {currentChild.matricule}</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[11px] block">Classe & Option</span>
              <div className="font-bold text-white text-sm mt-0.5">{childClass?.name}</div>
              <span className="text-[10px] text-slate-400">{childClass?.level}</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[11px] block">Situation Frais Scolaires</span>
              <div className="font-bold text-emerald-400 text-sm mt-0.5 font-mono">
                {balanceUSD === 0 ? '✓ Soldé (En ordre)' : `Reste $${balanceUSD} USD`}
              </div>
              <span className="text-[10px] text-slate-400">Total payé : ${childPaidUSD} USD</span>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 text-[11px] block">Assiduité & Conduite</span>
              <div className="font-bold text-slate-200 text-sm mt-0.5">
                {childAbsences.length} absence(s)
              </div>
              <span className="text-[10px] text-amber-400">{childRetards.length} retard(s) noté(s)</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-5 pt-3 gap-3 text-xs font-semibold">
        <button
          id="tab-parent-academic"
          onClick={() => setActiveTab('academic')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'academic' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Notes & Bulletin Officiel EPST
        </button>
        <button
          id="tab-parent-finance"
          onClick={() => setActiveTab('finance')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'finance' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Paiement en ligne (Mobile Money) & Reçus
        </button>
        <button
          id="tab-parent-discipline"
          onClick={() => setActiveTab('discipline')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'discipline' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Discipline & Conduite ({childIncidents.length})
        </button>
      </div>

      {/* Tab 1: Academic & Report Card */}
      {activeTab === 'academic' && (
        <div className="bg-white rounded-b-2xl p-6 shadow-sm border-x border-b border-slate-200 space-y-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div>
              <h3 className="font-bold text-sm text-blue-950">Bulletin Scolaire Officiel disponible</h3>
              <p className="text-xs text-blue-800 mt-0.5">
                Conforme aux normes du Ministère de l'EPST (Grille Maxima, Examens semestriels, Conduite & Application).
              </p>
            </div>
            <button
              id="btn-parent-view-bulletin"
              onClick={() => onOpenBulletin(currentChild.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Consulter & Imprimer le Bulletin</span>
            </button>
          </div>

          {/* Relevé Privé des Notes & Évaluations Enregistrées */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Relevé Privé des Notes & Évaluations Enregistrées</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isStudent
                    ? 'Vos notes officielles enregistrées et publiées dans la base de données de l’école.'
                    : 'Notes privées de votre enfant enregistrées par le corps professoral.'}
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                {childGrades.length} note(s) officielle(s)
              </span>
            </div>

            {childGrades.length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                Aucune note publiée pour le moment. Les notes apparaîtront dès validation par le professeur ou la direction.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Matière / Cours</th>
                      <th className="py-2.5 px-3">Type d'Évaluation</th>
                      <th className="py-2.5 px-3 text-center">Cote Obtenue</th>
                      <th className="py-2.5 px-3 text-center">Pourcentage</th>
                      <th className="py-2.5 px-3 text-center">Certification Supabase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {childGrades.map((g) => {
                      const sub = subjects.find((s) => s.id === g.subjectId);
                      const pct = Math.round((g.score / g.maxScore) * 100);
                      const isPassing = pct >= 50;
                      return (
                        <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {sub?.name || 'Matière'}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {sub?.category || 'Générale'} • Coeff. {sub?.defaultCoefficient || g.coefficient || 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 capitalize text-slate-600 font-medium">
                            {g.evaluationType || 'Période'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            <span className={isPassing ? 'text-blue-700' : 'text-rose-600'}>
                              {g.score}
                            </span>
                            <span className="text-slate-400 font-normal"> / {g.maxScore}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                isPassing
                                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                                  : 'bg-rose-50 text-rose-700 font-bold'
                              }`}
                            >
                              {pct}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Enregistrée & Publiée
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2">Devoirs & Travaux Pratiques du Moment</h4>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <strong className="text-slate-800 font-semibold block">Chimie : Exercices Alcanes (p. 45)</strong>
              <p className="text-slate-600 text-[11px]">
                À préparer pour la prochaine séance. Vérifier que votre enfant a bien consigné les réponses dans son cahier de devoir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mobile Money Payment & Receipts */}
      {activeTab === 'finance' && (
        <div className="bg-white rounded-b-2xl p-6 shadow-sm border-x border-b border-slate-200 space-y-6 text-xs">
          {paySuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Paiement Mobile Money validé avec succès !</strong>
                <p className="text-[11px]">Le compte de l'élève a été crédité et une confirmation SMS a été générée.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Online Payment Form */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Régler par Mobile Money (RDC)</span>
              </h3>
              <p className="text-slate-500 text-[11px]">
                Paiement instantané direct sans file d'attente à la caisse de l'école.
              </p>

              <form onSubmit={handlePayNow} className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant à verser (USD)</label>
                  <input
                    id="input-parent-pay-amount"
                    type="number"
                    value={payAmountUSD}
                    onChange={(e) => setPayAmountUSD(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-sm bg-white"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Soit {(payAmountUSD * rate).toLocaleString()} Francs Congolais (CDF)
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opérateur Télécom</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod('mpesa')}
                      className={`py-2 px-1 rounded-lg border text-center font-bold text-[11px] transition-colors ${
                        payMethod === 'mpesa' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white'
                      }`}
                    >
                      M-Pesa (Vodacom)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod('airtel_money')}
                      className={`py-2 px-1 rounded-lg border text-center font-bold text-[11px] transition-colors ${
                        payMethod === 'airtel_money' ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-200 bg-white'
                      }`}
                    >
                      Airtel Money
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod('orange_money')}
                      className={`py-2 px-1 rounded-lg border text-center font-bold text-[11px] transition-colors ${
                        payMethod === 'orange_money' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white'
                      }`}
                    >
                      Orange Money
                    </button>
                  </div>
                </div>

                <button
                  id="btn-parent-submit-pay"
                  type="submit"
                  disabled={isPaying}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 mt-2"
                >
                  {isPaying ? 'Communication avec la passerelle...' : `Payer $${payAmountUSD} USD maintenant`}
                </button>
              </form>
            </div>

            {/* Receipts History */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-600" />
                <span>Historique des Reçus de Paiement</span>
              </h3>

              {childPayments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                  Aucun paiement enregistré pour l'instant.
                </div>
              ) : (
                <div className="space-y-2">
                  {childPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:border-emerald-400 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 font-mono">${p.amountUSD} USD</div>
                        <div className="text-[10px] text-slate-500">
                          Reçu N° {p.receiptNumber} • {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <button
                        id={`btn-parent-open-receipt-${p.id}`}
                        onClick={() => onOpenReceipt(p, currentChild)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Voir le Reçu</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Discipline */}
      {activeTab === 'discipline' && (
        <div className="bg-white rounded-b-2xl p-6 shadow-sm border-x border-b border-slate-200 space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Dossier Disciplinaire de l'Élève</h3>

          {childIncidents.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Conduite exemplaire ! Aucun incident ou avertissement signalé ce trimestre.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {childIncidents.map((inc) => (
                <div key={inc.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-amber-900 font-bold">{inc.category}</strong>
                    <span className="text-[10px] font-mono text-slate-500">{inc.date}</span>
                  </div>
                  <p className="text-slate-700">{inc.description}</p>
                  <div className="text-[11px] text-amber-800 font-semibold pt-1 border-t border-amber-200/60">
                    Sanction appliquée : {inc.sanction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
