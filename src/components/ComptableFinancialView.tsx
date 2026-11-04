import { useState, useMemo } from 'react';
import { School, Student, FeeDefinition, PaymentRecord, SchoolClass } from '../types';
import { 
  DollarSign, Plus, Search, Receipt, Smartphone, CheckCircle, Clock, Printer, 
  CreditCard, AlertTriangle, AlertCircle, Trash2, Edit2, Check, X, ShieldAlert 
} from 'lucide-react';

interface ComptableFinancialViewProps {
  school: School;
  students: Student[];
  classes: SchoolClass[];
  fees: FeeDefinition[];
  payments: PaymentRecord[];
  onRecordPayment: (data: Omit<PaymentRecord, 'id' | 'schoolId' | 'receiptNumber' | 'status' | 'createdAt'>) => Promise<PaymentRecord>;
  onAddFee: (data: Omit<FeeDefinition, 'id' | 'schoolId'>) => Promise<void>;
  onUpdateFee?: (id: string, updates: Partial<FeeDefinition>) => Promise<void>;
  onDeleteFee?: (id: string) => Promise<void>;
  onOpenReceiptModal: (payment: PaymentRecord, student: Student) => void;
}

export const ComptableFinancialView = ({
  school,
  students,
  classes,
  fees,
  payments,
  onRecordPayment,
  onAddFee,
  onUpdateFee,
  onDeleteFee,
  onOpenReceiptModal,
}: ComptableFinancialViewProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'new-payment' | 'fees-config'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'PAID' | 'PENDING'>('ALL');

  // New Payment modal form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedFeeId, setSelectedFeeId] = useState<string>(fees[0]?.id || '');
  const [paymentAmountUSD, setPaymentAmountUSD] = useState<number>(250);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['paymentMethod']>('mpesa');
  const [payerName, setPayerName] = useState('Parent d\'Élève');
  const [payerPhone, setPayerPhone] = useState('+243 82 444 9901');
  const [transRef, setTransRef] = useState(`MP-${Date.now().toString().slice(-8)}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // New Fee Definition form
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeInstallment, setNewFeeInstallment] = useState('1ère Tranche (Rentrée)');
  const [newFeeUSD, setNewFeeUSD] = useState<number>(100);
  const [newFeeDueDate, setNewFeeDueDate] = useState('2026-11-30');
  const [targetAllClasses, setTargetAllClasses] = useState(true);
  const [selectedTargetClassIds, setSelectedTargetClassIds] = useState<string[]>([]);

  // Editing Fee state
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  const [editFeeName, setEditFeeName] = useState('');
  const [editFeeAmountUSD, setEditFeeAmountUSD] = useState<number>(0);
  const [editFeeDueDate, setEditFeeDueDate] = useState('');
  const [editFeeInstallment, setEditFeeInstallment] = useState('');

  const rate = school.exchangeRateUsdCdf || 2850;
  const today = new Date();

  // Helper to calculate student applicable fees based on class targeting
  const getApplicableFeesForStudent = (studentClassId?: string) => {
    return fees.filter((f) => {
      if (!f.targetClassIds || f.targetClassIds.length === 0) return true;
      return studentClassId && f.targetClassIds.includes(studentClassId);
    });
  };

  // Helper to check if a student has any overdue unpaid fees
  const getStudentFinancialStatus = (student: Student) => {
    const applicableFees = getApplicableFeesForStudent(student.classId);
    const stuPayments = payments.filter((p) => p.studentId === student.id && p.status === 'confirmed');
    const totalPaidUSD = stuPayments.reduce((sum, p) => sum + p.amountUSD, 0);
    const totalExpectedUSD = applicableFees.reduce((sum, f) => sum + f.amountUSD, 0);
    const balanceUSD = Math.max(0, totalExpectedUSD - totalPaidUSD);

    // Overdue logic: check if any fee due date is in the past and unpaid
    let isOverdue = false;
    let maxDaysOverdue = 0;

    applicableFees.forEach((fee) => {
      if (fee.dueDate) {
        const dueDateObj = new Date(fee.dueDate);
        if (dueDateObj < today) {
          const daysLate = Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 3600 * 24));
          if (daysLate > maxDaysOverdue) maxDaysOverdue = daysLate;
          // If total paid is less than the cumulative of past-due fees
          if (balanceUSD > 0) {
            isOverdue = true;
          }
        }
      }
    });

    return {
      totalPaidUSD,
      totalExpectedUSD,
      balanceUSD,
      isPaid: balanceUSD === 0,
      isOverdue,
      maxDaysOverdue,
    };
  };

  // Financial aggregates
  const totalReceivedUSD = payments
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amountUSD, 0);

  const totalExpectedAllUSD = students.reduce((sum, s) => {
    const stFees = getApplicableFeesForStudent(s.classId);
    return sum + stFees.reduce((fSum, f) => fSum + f.amountUSD, 0);
  }, 0);

  const totalOutstandingUSD = Math.max(0, totalExpectedAllUSD - totalReceivedUSD);

  // Overdue students count
  const overdueCount = students.filter((s) => getStudentFinancialStatus(s).isOverdue).length;

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.postName.toLowerCase().includes(q) ||
      s.matricule.toLowerCase().includes(q);

    const matchesClass = classFilter === 'ALL' || s.classId === classFilter;

    const status = getStudentFinancialStatus(s);
    let matchesStatus = true;
    if (statusFilter === 'OVERDUE') matchesStatus = status.isOverdue;
    else if (statusFilter === 'PAID') matchesStatus = status.isPaid;
    else if (statusFilter === 'PENDING') matchesStatus = !status.isPaid && !status.isOverdue;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !paymentAmountUSD) return;

    setIsProcessing(true);
    const student = students.find((s) => s.id === selectedStudentId);

    try {
      const record = await onRecordPayment({
        studentId: selectedStudentId,
        feeId: selectedFeeId,
        amountUSD: paymentAmountUSD,
        amountCDF: paymentAmountUSD * rate,
        currency: 'USD',
        paymentMethod,
        transactionReference: transRef || `TX-${Date.now()}`,
        payerName: payerName || (student ? `${student.lastName} Parent` : 'Parent'),
        payerPhone,
        recordedBy: 'Mme Marie Kapinga (Caisse Principale)',
      });

      setSyncNotice(`Paiement de $${paymentAmountUSD} USD enregistré. Synchronisé en temps réel sur l'espace parent de ${student?.firstName || 'l\'élève'}.`);
      setTimeout(() => setSyncNotice(null), 5000);

      if (student) {
        onOpenReceiptModal(record, student);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeName.trim() || !newFeeUSD) return;

    await onAddFee({
      academicYearId: 'ay-current',
      name: newFeeName,
      installmentName: newFeeInstallment,
      amountUSD: newFeeUSD,
      amountCDF: newFeeUSD * rate,
      dueDate: newFeeDueDate || '2026-11-30',
      mandatory: true,
      targetClassIds: targetAllClasses ? [] : selectedTargetClassIds,
    });

    setNewFeeName('');
    setSelectedTargetClassIds([]);
    setTargetAllClasses(true);
  };

  const handleStartEditFee = (fee: FeeDefinition) => {
    setEditingFeeId(fee.id);
    setEditFeeName(fee.name);
    setEditFeeAmountUSD(fee.amountUSD);
    setEditFeeDueDate(fee.dueDate || '');
    setEditFeeInstallment(fee.installmentName || '');
  };

  const handleSaveEditFee = async (feeId: string) => {
    if (!onUpdateFee) return;
    await onUpdateFee(feeId, {
      name: editFeeName,
      amountUSD: editFeeAmountUSD,
      amountCDF: editFeeAmountUSD * rate,
      dueDate: editFeeDueDate,
      installmentName: editFeeInstallment,
    });
    setEditingFeeId(null);
  };

  const handleDeleteFeeClick = async (feeId: string) => {
    if (!onDeleteFee) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tranche/définition de frais ?')) {
      await onDeleteFee(feeId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Overview Banner */}
      <div className="bg-slate-900 dark:bg-black text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Service Financier & Caisse Centrale
              </span>
              <span className="text-xs text-slate-400">{school.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
              Gestion des Frais Scolaires & Alertes de Recouvrement
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Ciblage par classe, alertes rouges instantanées pour les retards, gestion dynamique des tranches et synchronisation en temps réel sur les comptes parents.
            </p>
          </div>

          <button
            id="btn-trigger-new-payment-tab"
            onClick={() => setActiveTab('new-payment')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Encaisser un Paiement</span>
          </button>
        </div>

        {/* 4 Financial Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Total Encaissé (USD)</span>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">${totalReceivedUSD.toLocaleString()}</div>
            <span className="text-[10px] text-slate-400 font-mono">Soit {(totalReceivedUSD * rate).toLocaleString()} CDF</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Reste à Recouvrer</span>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">${totalOutstandingUSD.toLocaleString()}</div>
            <span className="text-[10px] text-slate-400 font-mono">{(totalOutstandingUSD * rate).toLocaleString()} CDF</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Alertes Retard Critique</span>
            <div className="text-xl font-black text-red-400 mt-1 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
              <span>{overdueCount} Élèves</span>
            </div>
            <span className="text-[10px] text-red-400 font-medium">Échéances dépassées</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Passerelle Mobile Money</span>
            <div className="text-xl font-bold text-white mt-1">M-Pesa / Airtel</div>
            <span className="text-[10px] text-emerald-400">Sync Instantanée Parents</span>
          </div>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B20] rounded-t-2xl px-5 pt-3 gap-3 text-xs font-semibold">
        <button
          id="tab-compta-overview"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <span>Soldes & Suivi des Retards ({students.length})</span>
          {overdueCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
              {overdueCount}
            </span>
          )}
        </button>

        <button
          id="tab-compta-new-payment"
          onClick={() => setActiveTab('new-payment')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'new-payment'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Encaissement & Reçus Mobile Money</span>
        </button>

        <button
          id="tab-compta-fees"
          onClick={() => setActiveTab('fees-config')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'fees-config'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Configuration des Frais & Tranches ({fees.length})</span>
        </button>
      </div>

      {/* Tab 1: Student Financial Table & Search */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-[#181B20] rounded-b-2xl p-5 shadow-xs border-x border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="input-compta-search-student"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, matricule..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ALL">Toutes les classes ({classes.length})</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold ${
                    statusFilter === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setStatusFilter('OVERDUE')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 ${
                    statusFilter === 'OVERDUE'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>En Retard ({overdueCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('PAID')}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold ${
                    statusFilter === 'PAID'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}
                >
                  En Ordre
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Affichage de <strong className="text-slate-800 dark:text-slate-200">{filteredStudents.length}</strong> élèves
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  <th className="py-2.5 px-3">Matricule</th>
                  <th className="py-2.5 px-3">Nom & Post-nom</th>
                  <th className="py-2.5 px-3">Classe</th>
                  <th className="py-2.5 px-3 text-right">Total Payé (USD)</th>
                  <th className="py-2.5 px-3 text-right">Solde Dû</th>
                  <th className="py-2.5 px-3 text-center">Statut d'Échéance</th>
                  <th className="py-2.5 px-3 text-right">Actions Caisse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filteredStudents.map((stu) => {
                  const status = getStudentFinancialStatus(stu);
                  const stuClass = classes.find((c) => c.id === stu.classId);
                  const stuPayments = payments.filter((p) => p.studentId === stu.id && p.status === 'confirmed');

                  return (
                    <tr
                      key={stu.id}
                      className={`transition-colors ${
                        status.isOverdue
                          ? 'bg-red-50/70 dark:bg-red-950/20 border-l-4 border-l-red-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {stu.matricule}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {stu.lastName} {stu.postName} {stu.firstName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {stuClass?.name || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        ${status.totalPaidUSD} USD
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${status.balanceUSD} USD
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {/* BOLD RED ALERT FOR OVERDUE PAYMENTS (Article 44 du cahier des charges) */}
                        {status.isOverdue ? (
                          <span className="inline-flex items-center gap-1 bg-red-600 text-white font-black px-2.5 py-1 rounded-full text-[10px] shadow-sm animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>RETARD ({status.maxDaysOverdue}j)</span>
                          </span>
                        ) : status.isPaid ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            En ordre (100%)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            En cours (${status.balanceUSD} restants)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedStudentId(stu.id);
                            setActiveTab('new-payment');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200 dark:border-emerald-800 transition-colors"
                        >
                          Encaisser
                        </button>
                        {stuPayments.length > 0 && (
                          <button
                            onClick={() => onOpenReceiptModal(stuPayments[0], stu)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-semibold"
                          >
                            Dernier reçu
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: New Payment Form */}
      {activeTab === 'new-payment' && (
        <div className="bg-white dark:bg-[#181B20] rounded-b-2xl p-6 shadow-xs border-x border-b border-slate-200 dark:border-slate-800 max-w-2xl mx-auto space-y-5 text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span>Enregistrement d'un Paiement & Émission de Reçu</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Paiement physique à la caisse ou via Mobile Money avec notification et synchronisation en direct sur le compte parent.
            </p>
          </div>

          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Élève *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName} {s.postName} {s.firstName} ({s.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tranche / Frais concerné *</label>
                <select
                  value={selectedFeeId}
                  onChange={(e) => setSelectedFeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {fees.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.installmentName ? `[${f.installmentName}] ` : ''}{f.name} (${f.amountUSD} USD)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Montant perçu (USD) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={paymentAmountUSD}
                  onChange={(e) => setPaymentAmountUSD(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Soit {(paymentAmountUSD * rate).toLocaleString()} CDF (Taux : {rate} CDF)
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Moyen de Paiement *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'mpesa', label: 'M-Pesa (Vodacom)' },
                  { id: 'airtel_money', label: 'Airtel Money' },
                  { id: 'orange_money', label: 'Orange Money' },
                  { id: 'cash', label: 'Espèces / Caisse' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id === 'mpesa') setTransRef(`MP-${Date.now().toString().slice(-8)}`);
                      else if (m.id === 'airtel_money') setTransRef(`AM-${Date.now().toString().slice(-8)}`);
                      else if (m.id === 'orange_money') setTransRef(`OM-${Date.now().toString().slice(-8)}`);
                      else setTransRef(`CSH-${Date.now().toString().slice(-6)}`);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold transition-all ${
                      paymentMethod === m.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom du Dépositaire / Payeur</label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Téléphone pour Reçu SMS & WhatsApp</label>
                <input
                  type="text"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Réf. Transaction Mobile / Bordereau</label>
              <input
                type="text"
                value={transRef}
                onChange={(e) => setTransRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <button
              id="btn-submit-process-payment"
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isProcessing ? 'Validation en cours...' : 'Valider l’encaissement & Synchroniser le Parent'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Fees Configuration (Add, Edit, Delete, Class-targeting) */}
      {activeTab === 'fees-config' && (
        <div className="bg-white dark:bg-[#181B20] rounded-b-2xl p-6 shadow-xs border-x border-b border-slate-200 dark:border-slate-800 space-y-6 text-xs">
          {/* Add New Fee / Installment Form (Article 45: ajustement flexible des tranches) */}
          <form onSubmit={handleCreateFee} className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Créer ou Ajuster une Tranche de Frais Scolaires</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Libellé du Frais *</label>
                <input
                  type="text"
                  required
                  value={newFeeName}
                  onChange={(e) => setNewFeeName(e.target.value)}
                  placeholder="Ex: Minerval, Internat, Frais d'État..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nom de la Tranche</label>
                <input
                  type="text"
                  value={newFeeInstallment}
                  onChange={(e) => setNewFeeInstallment(e.target.value)}
                  placeholder="Ex: 1ère Tranche (Rentrée)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Montant en USD *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newFeeUSD}
                  onChange={(e) => setNewFeeUSD(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Date d'Échéance *</label>
                <input
                  type="date"
                  required
                  value={newFeeDueDate}
                  onChange={(e) => setNewFeeDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Class Targeting (Article 44: cibler des classes précises) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
                Ciblage des Classes Concernées :
              </label>

              <div className="flex items-center gap-4 mb-2">
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    checked={targetAllClasses}
                    onChange={() => setTargetAllClasses(true)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Toutes les classes de l'école</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    checked={!targetAllClasses}
                    onChange={() => setTargetAllClasses(false)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Classes spécifiques uniquement</span>
                </label>
              </div>

              {!targetAllClasses && (
                <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                  {classes.map((cls) => {
                    const isChecked = selectedTargetClassIds.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setSelectedTargetClassIds((prev) =>
                            isChecked ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cls.name} {cls.section ? `(${cls.section})` : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                id="btn-submit-create-fee"
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer la Tranche de Frais</span>
              </button>
            </div>
          </form>

          {/* Existing Fees List with Edit and Delete options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fees.map((fee) => {
              const isEditing = editingFeeId === fee.id;
              const dueDateObj = fee.dueDate ? new Date(fee.dueDate) : null;
              const isOverdue = dueDateObj ? dueDateObj < today : false;
              const targetedClassesList = fee.targetClassIds && fee.targetClassIds.length > 0
                ? classes.filter((c) => fee.targetClassIds!.includes(c.id)).map((c) => c.name)
                : ['Toutes les classes'];

              return (
                <div
                  key={fee.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isOverdue
                      ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#181B20]'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editFeeName}
                        onChange={(e) => setEditFeeName(e.target.value)}
                        className="w-full p-1.5 rounded-lg border text-xs"
                      />
                      <input
                        type="text"
                        value={editFeeInstallment}
                        onChange={(e) => setEditFeeInstallment(e.target.value)}
                        placeholder="Tranche"
                        className="w-full p-1.5 rounded-lg border text-xs"
                      />
                      <input
                        type="number"
                        value={editFeeAmountUSD}
                        onChange={(e) => setEditFeeAmountUSD(Number(e.target.value))}
                        className="w-full p-1.5 rounded-lg border text-xs font-mono font-bold"
                      />
                      <input
                        type="date"
                        value={editFeeDueDate}
                        onChange={(e) => setEditFeeDueDate(e.target.value)}
                        className="w-full p-1.5 rounded-lg border text-xs"
                      />
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSaveEditFee(fee.id)}
                          className="px-3 py-1 rounded bg-emerald-600 text-white font-bold text-xs"
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingFeeId(null)}
                          className="px-2 py-1 rounded border text-slate-600 text-xs"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {fee.installmentName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 mb-1 inline-block">
                              {fee.installmentName}
                            </span>
                          )}
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{fee.name}</h4>
                        </div>
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-base">
                          ${fee.amountUSD} USD
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Équivalent : <strong>{(fee.amountUSD * rate).toLocaleString()} CDF</strong>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                        <div className="text-slate-600 dark:text-slate-300 flex items-center justify-between">
                          <span>Échéance :</span>
                          <strong className={isOverdue ? 'text-red-600 font-bold' : ''}>
                            {fee.dueDate || 'Selon calendrier'}
                          </strong>
                        </div>
                        <div className="text-slate-500 flex items-center justify-between">
                          <span>Ciblage :</span>
                          <span className="font-medium truncate max-w-[150px]">
                            {targetedClassesList.join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Edit and Delete Actions */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                        {onUpdateFee && (
                          <button
                            onClick={() => handleStartEditFee(fee)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title="Modifier ce frais"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteFee && (
                          <button
                            onClick={() => handleDeleteFeeClick(fee.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                            title="Supprimer ce frais"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
