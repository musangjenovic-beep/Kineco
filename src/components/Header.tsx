import { useState } from 'react';
import { School, UserRole, UserSession } from '../types';
import { 
  Building2, 
  MessageSquare, 
  ChevronDown,
  Users,
  LogOut,
  CheckSquare,
  Edit3,
  BookOpen,
  Clock,
  Award
} from 'lucide-react';

export type TeacherTabType = 'classes' | 'attendance' | 'grades' | 'titulaire' | 'subjects' | 'schedule' | 'messages';

interface HeaderProps {
  schools: School[];
  currentSchool: School;
  onSelectSchool: (school: School) => void;
  currentUser?: UserSession;
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  onOpenSmsModal: () => void;
  onOpenNewSchoolModal: () => void;
  onOpenUserManagementModal?: () => void;
  onLogout?: () => void;
  teacherActiveTab?: TeacherTabType;
  onSelectTeacherTab?: (tab: TeacherTabType) => void;
  unreadMessagesCount?: number;
}

export const Header = ({
  schools,
  currentSchool,
  onSelectSchool,
  currentUser,
  currentRole,
  onSelectRole,
  onOpenSmsModal,
  onOpenNewSchoolModal,
  onOpenUserManagementModal,
  onLogout,
  teacherActiveTab,
  onSelectTeacherTab,
  unreadMessagesCount = 0,
}: HeaderProps) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);

  const activeRole = currentRole || currentUser?.role || 'directeur';

  const roleLabels: Record<UserRole, { label: string; short: string }> = {
    super_admin: { label: 'Super Admin', short: 'Admin' },
    directeur: { label: 'Directeur', short: 'Direction' },
    admin_scolaire: { label: 'Admin Scolaire', short: 'Admin' },
    directeur_etudes: { label: 'Directeur des Études', short: 'Études' },
    directeur_discipline: { label: 'Discipline', short: 'Discipline' },
    comptable: { label: 'Comptable', short: 'Finance' },
    secretaire: { label: 'Secrétaire', short: 'Secrétariat' },
    surveillant: { label: 'Surveillant', short: 'Surveillance' },
    enseignant: { label: 'Enseignant', short: 'Professeur' },
    parent: { label: 'Parent / Tuteur', short: 'Parent' },
    eleve: { label: 'Élève', short: 'Élève' },
  };

  const currentRoleInfo = roleLabels[activeRole] || roleLabels.directeur;

  const teacherNavItems: { id: TeacherTabType; label: string; icon: typeof Users }[] = [
    { id: 'classes', label: 'Classes', icon: Users },
    { id: 'attendance', label: 'Présences', icon: CheckSquare },
    { id: 'grades', label: 'Notes', icon: Edit3 },
    { id: 'titulaire', label: 'Titulaire', icon: Award },
    { id: 'subjects', label: 'Matières', icon: BookOpen },
    { id: 'schedule', label: 'Horaire', icon: Clock },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left: Brand & School Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
              EK
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-tight text-slate-900 block leading-none">
                EduKin
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                RDC
              </span>
            </div>
          </div>

          {/* School Selector */}
          <div className="relative">
            <button
              id="btn-school-dropdown-toggle"
              onClick={() => {
                setSchoolDropdownOpen(!schoolDropdownOpen);
                setRoleDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 text-left transition-colors text-xs font-medium text-slate-700"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate max-w-[110px] sm:max-w-[170px]">
                {currentSchool.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {schoolDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                  Établissement actif
                </div>
                <div className="max-h-60 overflow-y-auto space-y-0.5">
                  {schools.map((s) => (
                    <button
                      key={s.id}
                      id={`btn-select-school-${s.id}`}
                      onClick={() => {
                        onSelectSchool(s);
                        setSchoolDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        s.id === currentSchool.id
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate font-medium">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.city} • {s.code}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button
                    id="btn-add-school-modal-trigger"
                    onClick={() => {
                      setSchoolDropdownOpen(false);
                      onOpenNewSchoolModal();
                    }}
                    className="w-full text-center text-xs py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    + Créer un établissement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick SMS Tool */}
          <button
            id="btn-open-sms-header"
            onClick={onOpenSmsModal}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs transition-colors"
            title="Passerelle SMS RDC"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">SMS</span>
          </button>

          {/* User Management */}
          {onOpenUserManagementModal && (
            <button
              id="btn-open-user-management"
              onClick={onOpenUserManagementModal}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors"
              title="Gérer les comptes"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Comptes</span>
            </button>
          )}

          {/* Role Switcher */}
          <div className="relative">
            <button
              id="btn-role-dropdown-toggle"
              onClick={() => {
                setRoleDropdownOpen(!roleDropdownOpen);
                setSchoolDropdownOpen(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-left transition-colors text-xs font-medium text-slate-800"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
              <span className="hidden sm:inline">{currentRoleInfo.label}</span>
              <span className="sm:hidden">{currentRoleInfo.short}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Changer de rôle
                </div>
                <div className="space-y-0.5">
                  {(Object.keys(roleLabels) as UserRole[]).map((rKey) => {
                    const info = roleLabels[rKey];
                    const isCurrent = activeRole === rKey;
                    return (
                      <button
                        key={rKey}
                        id={`btn-select-role-${rKey}`}
                        onClick={() => {
                          onSelectRole(rKey);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User profile avatar */}
          {currentUser && (
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
            </div>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              id="btn-logout"
              onClick={onLogout}
              title="Déconnexion"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation intégrée dans la barre pour l'enseignant (Classes, Présences, Notes, etc.) */}
      {currentRole === 'enseignant' && onSelectTeacherTab && (
        <div className="border-t border-slate-100 bg-slate-50/80 px-2 sm:px-4 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 py-1.5">
            {teacherNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = teacherActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`header-nav-${item.id}`}
                  onClick={() => onSelectTeacherTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.id === 'messages' && unreadMessagesCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

