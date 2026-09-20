import { PaymentRecord, Student, School } from '../types';
import { Printer, CheckCircle, QrCode, X, Receipt } from 'lucide-react';

interface RecuPaiementModalProps {
  payment: PaymentRecord | null;
  student: Student | null;
  school: School | null;
  onClose: () => void;
}

export const RecuPaiementModal = ({ payment, student, school, onClose }: RecuPaiementModalProps) => {
  if (!payment || !student || !school) return null;

  const handlePrint = () => {
    window.print();
  };

  const methodLabels: Record<string, string> = {
    mpesa: 'M-Pesa (Vodacom RDC)',
    airtel_money: 'Airtel Money RDC',
    orange_money: 'Orange Money RDC',
    cash: 'Espèces / Caisse Scolaire',
    banque: 'Virement / Versement Bancaire',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-w-none print:rounded-none">
        
        {/* Action Header - Hidden on Print */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Reçu Officiel de Caisse</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              id="btn-close-receipt"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt */}
        <div className="p-6 space-y-5 text-xs text-slate-800">
          {/* School Header */}
          <div className="text-center border-b border-slate-300 pb-4">
            <h2 className="text-lg font-black tracking-tight uppercase text-slate-900">{school.name}</h2>
            <p className="text-[11px] text-slate-500">{school.address} • {school.city}, RDC</p>
            <p className="text-[11px] text-slate-500">Tél: {school.phone} • Email: {school.email}</p>
            <div className="mt-2 inline-block px-3 py-1 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold text-xs uppercase tracking-wider">
              QUITTANCE DE PAIEMENT N° {payment.receiptNumber}
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Date d'encaissement :</span>
              <span className="font-medium text-slate-900">
                {new Date(payment.createdAt).toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Élève bénéficiaire :</span>
              <span className="font-bold text-slate-900">
                {student.lastName} {student.postName} {student.firstName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Matricule :</span>
              <span className="font-mono font-bold text-blue-700">{student.matricule}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Payeur / Responsable :</span>
              <span className="font-medium text-slate-900">{payment.payerName} ({payment.payerPhone || 'N/A'})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Mode de paiement :</span>
              <span className="font-bold text-slate-800">{methodLabels[payment.paymentMethod] || payment.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Réf. Transaction Mobile :</span>
              <span className="font-mono text-slate-700">{payment.transactionReference}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Caissier / Enregistré par :</span>
              <span className="font-medium text-slate-700">{payment.recordedBy}</span>
            </div>
          </div>

          {/* Amount Paid Box */}
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 text-center">
            <span className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider block">Montant Payé</span>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-0.5">
              ${payment.amountUSD.toLocaleString()} USD
            </div>
            <div className="text-xs font-semibold text-emerald-800 mt-0.5">
              Soit {payment.amountCDF.toLocaleString()} Francs Congolais (CDF)
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Transaction confirmée et créditée au compte de l'élève</span>
            </div>
          </div>

          {/* Verification QR Code and Seal */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 border border-slate-300 rounded-lg bg-white shadow-sm">
                <QrCode className="w-10 h-10 text-slate-800" />
              </div>
              <div className="text-[10px] text-slate-500">
                <div>Scan de vérification QR</div>
                <div className="font-mono text-slate-700">{payment.receiptNumber}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-900">Pour l'Établissement</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">Service de la Comptabilité</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Validé & Enregistré</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
