import { useState, useEffect } from 'react';
import { School, UserRole, UserAccount } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Printer, 
  Copy, 
  Check, 
  RefreshCw,
  X,
  AlertCircle,
  Building2,
  Lock,
  Mail,
  Phone,
  GraduationCap
} from 'lucide-react';

interface UserManagementViewProps {
  currentSchool: School;
  currentUserRole: UserRole;
  currentUserId?: string;
  onClose?: () => void;
}

export const UserManagementView = ({
  currentSchool,
  currentUserRole,
  currentUserId,
  onClose,
}: UserManagementViewProps) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New User Form State
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('enseignant');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+243 ');
  const [password, setPassword] = useState('edukin123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load users from backend
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const url = currentUserRole === 'super_admin' 
        ? '/api/users' 
        : `/api/users?schoolId=${currentSchool.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load user accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentSchool.id, currentUserRole]);

  // Auto-generate identifier when role or name changes
  const generateSuggestedUsername = (targetRole: UserRole, targetName: string) => {
    const clean = targetName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const yr = new Date().getFullYear();

    if (targetRole === 'eleve') {
      const schoolPrefix = currentSchool.code ? currentSchool.code.split('-')[0] : 'EDU';
      return `${schoolPrefix}-${yr}-${randDigits}`;
    }
    if (targetRole === 'enseignant') {
      return clean ? `prof.${clean}@${currentSchool.code?.toLowerCase() || 'ecole'}.cd` : `prof.${randDigits}@ecole.cd`;
    }
    if (targetRole === 'parent') {
      return clean ? `parent.${clean}@gmail.com` : `parent.${randDigits}@gmail.com`;
    }
    return clean ? `${clean}@${currentSchool.code?.toLowerCase() || 'ecole'}.cd` : `user.${randDigits}@ecole.cd`;
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (!username || username.includes('-') || username.includes('@')) {
      setUsername(generateSuggestedUsername(newRole, fullName));
    }
    if (newRole === 'eleve') {
      setPassword('eleve' + new Date().getFullYear());
    } else {
      setPassword('edukin123');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;

    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: currentSchool.id,
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          password: password.trim() || 'edukin123',
          role,
          createdBy: currentUserId || 'Direction',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du compte');
      }

      setNotification({
        type: 'success',
        message: `Le compte ${data.role} pour "${data.fullName}" a été créé avec succès (Identifiant: ${data.username}).`,
      });

      // Reset form
      setFullName('');
      setUsername('');
      setEmail('');
      setPhone('+243 ');
      setPassword('edukin123');
      setIsCreateModalOpen(false);

      // Refresh list
      loadUsers();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Impossible de créer le compte.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    try {
      const newStatus = !user.active;
      const res = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, active: newStatus } : u))
        );
        setNotification({
          type: 'success',
          message: `Compte ${user.fullName} ${newStatus ? 'activé' : 'désactivé'}.`,
        });
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleResetPassword = async (user: UserAccount) => {
    const newPass = prompt(`Saisissez le nouveau mot de passe pour ${user.fullName}:`, user.role === 'eleve' ? 'eleve123' : 'edukin123');
    if (!newPass) return;

    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPass }),
      });

      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Mot de passe réinitialisé avec succès pour ${user.fullName} (${user.username}).`,
        });
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  const handleCopyCredentials = (user: UserAccount) => {
    const creds = `=== Accès EduKin RDC ===\nÉtablissement : ${currentSchool.name}\nNom : ${user.fullName}\nRôle : ${user.role}\nIdentifiant : ${user.username}\nLien : https://edukin.cd`;
    navigator.clipboard.writeText(creds);
    setCopiedUserId(user.id);
    setTimeout(() => setCopiedUserId(null), 2500);
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));

    if (!matchesSearch) return false;

    if (selectedRoleFilter === 'all') return true;
    if (selectedRoleFilter === 'staff') {
      return ['directeur_etudes', 'directeur_discipline', 'comptable', 'admin_scolaire', 'secretaire'].includes(u.role);
    }
    return u.role === selectedRoleFilter;
  });

  const roleBadges: Record<UserRole, { label: string; color: string }> = {
    super_admin: { label: 'Super Admin (Entreprise)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    directeur: { label: 'Directeur Général', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    directeur_etudes: { label: 'Directeur des Études', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    directeur_discipline: { label: 'Directeur de Discipline', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    comptable: { label: 'Comptable / Caisse', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    admin_scolaire: { label: 'Admin Scolaire', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    secretaire: { label: 'Secrétaire', color: 'bg-pink-100 text-pink-800 border-pink-200' },
    surveillant: { label: 'Surveillant', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    enseignant: { label: 'Enseignant', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    eleve: { label: 'Élève', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    parent: { label: 'Parent d’élèves', color: 'bg-green-100 text-green-800 border-green-200' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-lg p-5 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-slate-700">
                Gestion des Accès & Sécurité
              </span>
              <span className="text-xs text-slate-400">• {currentSchool.name}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestion des Utilisateurs & Attribution des Rôles
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              En tant que direction, vous pouvez créer et révoquer les accès de vos collaborateurs (Directeur des études, comptable, discipline, profs) ainsi que les identifiants uniques des élèves et parents.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onClose && (
              <button
                id="btn-back-to-dashboard-top"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
              >
                <span>← Retour au Tableau de Bord</span>
              </button>
            )}

            <button
              id="btn-open-create-user-modal"
              onClick={() => {
                setUsername(generateSuggestedUsername(role, fullName));
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Créer un Nouveau Profil</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Total Utilisateurs</span>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{users.length}</div>
            <span className="text-[10px] text-slate-400">Pour cet établissement</span>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Comptes Élèves (Matricules)</span>
            <div className="text-lg font-bold text-slate-800 mt-0.5">
              {users.filter((u) => u.role === 'eleve').length}
            </div>
            <span className="text-[10px] text-slate-400">Accès bulletins personnels</span>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Corps Enseignant</span>
            <div className="text-lg font-bold text-slate-800 mt-0.5">
              {users.filter((u) => u.role === 'enseignant').length}
            </div>
            <span className="text-[10px] text-slate-400">Saisie notes & présences</span>
          </div>

          <div className="p-3 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Sécurité Active</span>
            <div className="text-lg font-bold text-slate-800 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conforme</span>
            </div>
            <span className="text-[10px] text-slate-400">Isolation par school_id</span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3 rounded border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, matricule officiel, email ou téléphone..."
              className="w-full pl-9 pr-3 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              selectedRoleFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tous ({users.length})
          </button>
          <button
            onClick={() => setSelectedRoleFilter('staff')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              selectedRoleFilter === 'staff' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Direction & Staff
          </button>
          <button
            onClick={() => setSelectedRoleFilter('enseignant')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              selectedRoleFilter === 'enseignant' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Enseignants
          </button>
          <button
            onClick={() => setSelectedRoleFilter('eleve')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              selectedRoleFilter === 'eleve' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Élèves ({users.filter((u) => u.role === 'eleve').length})
          </button>
          <button
            onClick={() => setSelectedRoleFilter('parent')}
            className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
              selectedRoleFilter === 'parent' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Parents
          </button>
        </div>
      </div>

      {/* Users List & Table (Full-width responsive cards on mobile, table on desktop - zero horizontal scroll!) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden w-full shadow-xs">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chargement des comptes utilisateurs...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Aucun compte utilisateur ne correspond à votre filtre.
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: 100% Full-Width Responsive Cards */}
            <div className="block md:hidden divide-y divide-slate-100 w-full">
              {filteredUsers.map((u) => {
                const badge = roleBadges[u.role] || { label: u.role, color: 'bg-slate-100 text-slate-700' };
                const isCopied = copiedUserId === u.id;

                return (
                  <div key={u.id} className="p-4 space-y-3 w-full bg-white hover:bg-slate-50/50 transition-colors">
                    {/* Header: Avatar, Name, Status */}
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs leading-snug">{u.fullName}</div>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.active ? 'Actif' : 'Suspendu'}</span>
                      </span>
                    </div>

                    {/* ID & Credentials */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs w-full">
                      <div className="font-mono text-slate-700 text-[11px] truncate">
                        <span className="text-slate-400 font-sans mr-1">ID:</span>
                        <span className="font-bold">{u.username}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCredentials(u)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded bg-white border border-slate-200 shadow-2xs shrink-0"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Contact Info if available */}
                    {(u.email || u.phone) && (
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        {u.email && <div className="truncate text-slate-500">✉ {u.email}</div>}
                        {u.phone && <div className="text-slate-500">☎ {u.phone}</div>}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center gap-2 w-full">
                      <button
                        onClick={() => handleResetPassword(u)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors text-center"
                      >
                        Changer Code
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-[11px] transition-colors text-center border ${
                          u.active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {u.active ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: Clean Table */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Utilisateur & Identifiant</th>
                    <th className="py-3 px-4">Rôle Attribué</th>
                    <th className="py-3 px-4">Coordonnées</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions Sécurisées</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const badge = roleBadges[u.role] || { label: u.role, color: 'bg-slate-100 text-slate-700' };
                    const isCopied = copiedUserId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                              {u.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{u.fullName}</div>
                              <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span>ID: {u.username}</span>
                                <button
                                  onClick={() => handleCopyCredentials(u)}
                                  title="Copier les informations de connexion"
                                  className="text-slate-400 hover:text-slate-700"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-[11px] text-slate-600">
                            {u.email && <div>{u.email}</div>}
                            {u.phone && <div className="text-slate-400">{u.phone}</div>}
                            {!u.email && !u.phone && <span className="text-slate-400 italic">Non renseigné</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                              u.active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {u.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            <span>{u.active ? 'Actif' : 'Suspendu'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => handleResetPassword(u)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors"
                            title="Réinitialiser le mot de passe"
                          >
                            Changer Code
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 rounded font-medium text-[11px] transition-colors ${
                              u.active
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {u.active ? 'Désactiver' : 'Activer'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL: Créer un nouvel utilisateur */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-slate-900">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Créer un Nouvel Accès Utilisateur</h3>
                  <p className="text-[11px] text-slate-400">{currentSchool.name} — Établissement RDC</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rôle de l'Utilisateur *
                </label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="directeur_etudes">Directeur des Études (Pédagogie, Notes, Bulletins)</option>
                  <option value="comptable">Comptable / Caissier (Finances, Frais, Reçus)</option>
                  <option value="directeur_discipline">Directeur de Discipline (Assiduité, Sanctions)</option>
                  <option value="admin_scolaire">Admin Scolaire / Secrétaire (Inscriptions, Registres)</option>
                  <option value="enseignant">Enseignant Titulaire (Saisie des notes & appel)</option>
                  <option value="eleve">Élève (Consultation bulletin et notes)</option>
                  <option value="parent">Parent d’élèves / Tuteur légal</option>
                  {currentUserRole === 'super_admin' && (
                    <option value="directeur">Directeur Général d'Établissement</option>
                  )}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Les permissions de cet utilisateur seront strictement limitées à ce rôle.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom Complet de la Personne *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (!username || username.includes('@') || username.includes('-')) {
                      setUsername(generateSuggestedUsername(role, e.target.value));
                    }
                  }}
                  placeholder="Ex: Prof. Dieudonné Ilunga ou Naomi Kazadi"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Identifiant Unique *
                    </label>
                    <button
                      type="button"
                      onClick={() => setUsername(generateSuggestedUsername(role, fullName))}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Générer
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: BOB-2026-0045 ou prof.ilunga"
                    className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Utilisé pour se connecter à la plateforme.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mot de Passe Initial *
                  </label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Pourra être changé par l'utilisateur.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Adresse Email (Optionnel)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domaine.cd"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Numéro Téléphone RDC
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+243 81..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Création en cours...' : 'Créer le Compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
