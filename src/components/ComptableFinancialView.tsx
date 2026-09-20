import { useState } from 'react';
import { School, Student, FeeDefinition, PaymentRecord, SchoolClass } from '../types';
import { DollarSign, Plus, Search, Receipt, Smartphone, CheckCircle, Clock, Printer, CreditCard } from 'lucide-react';

interface ComptableFinancialViewProps {
  school: School;
  students: Student[];
  classes: SchoolClass[];
  fees: FeeDefinition[];
  payments: PaymentRecord[];
  onRecordPayment: (data: Omit<PaymentRecord, 'id' | 'schoolId' | 'receiptNumber' | 'status' | 'createdAt'>) => Promise<PaymentRecord>;
  onAddFee: (data: Omit<FeeDefinition, 'id' | 'schoolId'>) => Promise<void>;
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
  onOpenReceiptModal,
}: ComptableFinancialViewProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'new-payment' | 'fees-config'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // New Payment modal form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedFeeId, setSelectedFeeId] = useState<string>(fees[0]?.id || '');
  const [paymentAmountUSD, setPaymentAmountUSD] = useState<number>(250);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['paymentMethod']>('mpesa');
  const [payerName, setPayerName] = useState('Jean Musang');
  const [payerPhone, setPayerPhone] = useState('+243 82 444 9901');
  const [transRef, setTransRef] = useState(`MP-${Date.now().toString().slice(-8)}`);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Fee Definition form
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeUSD, setNewFeeUSD] = useState<number>(100);
  const [newFeeDueDate, setNewFeeDueDate] = useState('');

  // Financial aggregates
  const totalReceivedUSD = payments
    .filter((p) => p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amountUSD, 0);

  const totalFeesUSD = fees.reduce((sum, f) => sum + f.amountUSD, 0);
  const totalExpectedUSD = totalFeesUSD * students.length;
  const totalOutstandingUSD = Math.max(0, totalExpectedUSD - totalReceivedUSD);

  const rate = school.exchangeRateUsdCdf;

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.postName.toLowerCase().includes(q) ||
      s.matricule.toLowerCase().includes(q)
    );
  });

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !paymentAmountUSD) return;

    setIsProcessing(true);
    const student = students.find((s) => s.id === selectedStudentId);

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
      recordedBy: 'Mme Marie Kapinga (Caisse)',
    });

    setIsProcessing(false);
    if (student) {
      onOpenReceiptModal(record, student);
    }
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeName.trim() || !newFeeUSD) return;
    await onAddFee({
      academicYearId: 'ay-bob-current',
      name: newFeeName,
      amountUSD: newFeeUSD,
      amountCDF: newFeeUSD * rate,
      dueDate: newFeeDueDate || '2026-11-15',
      mandatory: true,
    });
    setNewFeeName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Service Financier & Caisse
              </span>
              <span className="text-xs text-slate-400">{school.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 text-white">
              Gestion des Frais Scolaires & Paiements Mobile Money
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Encaissements physiques et numériques via M-Pesa Vodacom, Airtel Money, Orange Money, et émission immédiate de reçus conformes.
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
            <span className="text-slate-400 text-[11px] block">Reçus Émis</span>
            <div className="text-xl font-bold text-white mt-1">{payments.length} reçus</div>
            <span className="text-[10px] text-emerald-400">100% numérotés</span>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
            <span className="text-slate-400 text-[11px] block">Taux de Change Appliqué</span>
            <div className="text-xl font-bold text-blue-400 mt-1 font-mono">2,850 CDF</div>
            <span className="text-[10px] text-slate-400">Pour 1 Dollar Américain</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-5 pt-3 gap-3 text-xs font-semibold">
        <button
          id="tab-compta-overview"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Soldes des Élèves ({students.length})
        </button>
        <button
          id="tab-compta-new-payment"
          onClick={() => setActiveTab('new-payment')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'new-payment' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Formulaire d'Encaissement & Mobile Money
        </button>
        <button
          id="tab-compta-fees"
          onClick={() => setActiveTab('fees-config')}
          className={`pb-3 px-3 border-b-2 transition-colors ${
            activeTab === 'fees-config' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Configuration des Frais Scolaires ({fees.length})
        </button>
      </div>

      {/* Tab 1: Student Financial Table & Search */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-b-2xl p-5 shadow-sm border-x border-b border-slate-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="input-compta-search-student"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, post-nom ou matricule..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="text-xs text-slate-500">
              Affichage de <strong className="text-slate-800">{filteredStudents.length}</strong> élèves
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3">Matricule</th>
                  <th className="py-2.5 px-3">Nom & Post-nom</th>
                  <th className="py-2.5 px-3">Classe</th>
                  <th className="py-2.5 px-3 text-right">Total Payé (USD)</th>
                  <th className="py-2.5 px-3 text-right">Solde Dû</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredStudents.map((stu) => {
                  const stuPayments = payments.filter((p) => p.studentId === stu.id && p.status === 'confirmed');
                  const paidUSD = stuPayments.reduce((sum, p) => sum + p.amountUSD, 0);
                  const totalFeeUSD = fees.reduce((sum, f) => sum + f.amountUSD, 0);
                  const balanceUSD = Math.max(0, totalFeeUSD - paidUSD);
                  const isPaid = balanceUSD === 0;
                  const stuClass = classes.find((c) => c.id === stu.classId);

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{stu.matricule}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {stu.lastName} {stu.postName} {stu.firstName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{stuClass?.name || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        ${paidUSD} USD
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                        ${balanceUSD} USD
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPaid ? 'En ordre' : 'En retard'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {stuPayments.length > 0 ? (
                          <button
                            id={`btn-compta-receipt-${stu.id}`}
                            onClick={() => onOpenReceiptModal(stuPayments[stuPayments.length - 1], stu)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs flex items-center gap-1 ml-auto"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Dernier Reçu</span>
                          </button>
                        ) : (
                          <button
                            id={`btn-compta-pay-now-${stu.id}`}
                            onClick={() => {
                              setSelectedStudentId(stu.id);
                              setActiveTab('new-payment');
                            }}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-medium text-xs transition-colors"
                          >
                            Encaisser
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

      {/* Tab 2: New Payment Form (Mobile Money & Cash) */}
      {activeTab === 'new-payment' && (
        <div className="bg-white rounded-b-2xl p-6 shadow-sm border-x border-b border-slate-200 max-w-2xl text-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Enregistrer un Encaissement de Frais</span>
          </h2>

          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sélectionner l'Élève *</label>
              <select
                id="select-payment-student"
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const stu = students.find((s) => s.id === e.target.value);
                  if (stu) setPayerName(`${stu.lastName} Parent`);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.lastName} {s.postName} {s.firstName} — {s.matricule}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motif / Frais *</label>
                <select
                  id="select-payment-fee"
                  value={selectedFeeId}
                  onChange={(e) => setSelectedFeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {fees.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (${f.amountUSD})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Montant à Encaisser (USD) *</label>
                <input
                  id="input-payment-amount"
                  type="number"
                  required
                  value={paymentAmountUSD}
                  onChange={(e) => setPaymentAmountUSD(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Soit {(paymentAmountUSD * rate).toLocaleString()} Francs Congolais (CDF)
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Moyen de Paiement *</label>
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
                    className={`py-2 px-2.5 rounded-lg border text-center font-semibold transition-all ${
                      paymentMethod === m.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Payeur</label>
                <input
                  id="input-payer-name"
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Téléphone pour Reçu SMS</label>
                <input
                  id="input-payer-phone"
                  type="text"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Réf. Transaction Mobile / Bordereau</label>
              <input
                id="input-payment-ref"
                type="text"
                value={transRef}
                onChange={(e) => setTransRef(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <button
              id="btn-submit-process-payment"
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isProcessing ? 'Validation en cours...' : 'Valider l’encaissement & Générer le Reçu'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Fees Configuration */}
      {activeTab === 'fees-config' && (
        <div className="bg-white rounded-b-2xl p-6 shadow-sm border-x border-b border-slate-200 space-y-6 text-xs">
          <form onSubmit={handleCreateFee} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Définir un nouveau frais scolaire</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du frais *</label>
                <input
                  id="input-fee-name"
                  type="text"
                  required
                  value={newFeeName}
                  onChange={(e) => setNewFeeName(e.target.value)}
                  placeholder="Ex: Frais d'internat"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Montant en USD *</label>
                <input
                  id="input-fee-amount"
                  type="number"
                  required
                  value={newFeeUSD}
                  onChange={(e) => setNewFeeUSD(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  id="btn-submit-create-fee"
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  Ajouter le frais
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {fees.map((fee) => (
              <div key={fee.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold">{fee.name}</strong>
                  <span className="font-mono font-bold text-emerald-700">${fee.amountUSD} USD</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Equivalent: {(fee.amountUSD * rate).toLocaleString()} Francs Congolais (CDF)
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  Échéance: {fee.dueDate || 'Selon calendrier scolaire'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
