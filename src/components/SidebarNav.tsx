import React, { useState } from 'react';
import {
  Home,
  Clock,
  Bell,
  User,
  HelpCircle,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Award,
  X,
  Shield,
  Layers,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Building,
  Database,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { SchoolClass, UserSession, UserRole } from '../types';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarNavProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  unreadMessagesCount?: number;
  isTitulaire?: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser?: UserSession | null;
  currentRole?: UserRole;
  classes?: SchoolClass[];
  onSelectClass?: (classId: string) => void;
  onLogout?: () => void;
  onOpenUserManagement?: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  unreadMessagesCount = 0,
  isTitulaire = true,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  currentRole = 'enseignant',
  classes = [],
  onSelectClass,
  onLogout,
  onOpenUserManagement,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Group badge colors
  const groupBadgeColors = [
    'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700',
    'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700',
    'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-700',
    'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
    'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700',
  ];

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  const handleClassClick = (classId: string) => {
    onSelectTab('classes');
    if (onSelectClass) onSelectClass(classId);
    onCloseMobile();
  };

  const userName = currentUser?.fullName || 'Utilisateur';
  const userEmail = currentUser?.email || 'utilisateur@masomo.cd';
  const userInitial = userName.charAt(0).toUpperCase();

  // Determine Nav Items per Role
  const getNavItems = (): NavItem[] => {
    switch (currentRole) {
      case 'enseignant':
        return [
          { id: 'classes', label: 'Mes Classes', icon: Home },
          { id: 'schedule', label: 'Horaire & Tâches', icon: Clock },
          { id: 'attendance', label: 'Appel Journalier', icon: UserCheck },
          { id: 'grades', label: 'Saisie des Notes', icon: FileText },
          ...(isTitulaire ? [{ id: 'titulaire', label: 'Espace Titulaire', icon: Award }] : []),
          { id: 'messages', label: 'Messages & Alertes', icon: Bell },
          { id: 'profil', label: 'Profil Enseignant', icon: User },
        ];

      case 'directeur':
        return [
          { id: 'overview', label: 'Tableau de Bord', icon: Home },
          { id: 'titulaires', label: 'Titulaires & Cours 7e/8e', icon: Award },
          { id: 'classes', label: 'Gestion des Classes', icon: Layers },
          { id: 'bulletins', label: 'Bulletins & Délibérations', icon: FileText },
          { id: 'finances', label: 'Finances & Frais', icon: DollarSign },
          { id: 'discipline', label: 'Discipline & Assiduité', icon: ShieldCheck },
          { id: 'users', label: 'Gestion des Accès', icon: Users },
          { id: 'profil', label: 'Profil Direction', icon: User },
        ];

      case 'directeur_etudes':
        return [
          { id: 'overview', label: 'Supervision Pédagogique', icon: Award },
          { id: 'cours', label: 'Cours 7e, 8e EB & Humanités', icon: BookOpen },
          { id: 'bulletins', label: 'Validation des Bulletins', icon: FileText },
          { id: 'classes', label: 'Suivi des Classes', icon: Layers },
          { id: 'profil', label: 'Profil Direction Études', icon: User },
        ];

      case 'directeur_discipline':
        return [
          { id: 'overview', label: 'Registre Disciplinaire', icon: ShieldCheck },
          { id: 'attendance', label: 'Assiduité & Retards', icon: Clock },
          { id: 'incidents', label: 'Incidents & Sanctions', icon: AlertCircle },
          { id: 'sms', label: 'Convocations Parents', icon: Bell },
          { id: 'profil', label: 'Profil Discipline', icon: User },
        ];

      case 'comptable':
        return [
          { id: 'overview', label: 'Trésorerie & Caisse', icon: DollarSign },
          { id: 'payments', label: 'Bordereaux de Paiement', icon: FileText },
          { id: 'fees', label: 'Grille des Frais', icon: Layers },
          { id: 'mobile_money', label: 'Mobile Money RDC', icon: TrendingUp },
          { id: 'profil', label: 'Profil Comptabilité', icon: User },
        ];

      case 'admin_scolaire':
        return [
          { id: 'overview', label: 'Secrétariat Scolaire', icon: Home },
          { id: 'inscriptions', label: 'Élèves & Matricules', icon: Users },
          { id: 'classes', label: 'Classes & Titulaires', icon: Layers },
          { id: 'subjects', label: 'Matières & Programmes', icon: BookOpen },
          { id: 'periods', label: 'Années & Périodes', icon: Clock },
          { id: 'profil', label: 'Profil Secrétariat', icon: User },
        ];

      case 'parent':
        return [
          { id: 'overview', label: 'Mes Enfants', icon: Users },
          { id: 'bulletins', label: 'Bulletins Scolaires', icon: Award },
          { id: 'attendance', label: 'Présences & Retards', icon: Clock },
          { id: 'payments', label: 'Paiement des Frais', icon: DollarSign },
          { id: 'messages', label: 'Messages de l’École', icon: Bell },
          { id: 'profil', label: 'Profil Parent', icon: User },
        ];

      case 'eleve':
        return [
          { id: 'overview', label: 'Mon Espace Élève', icon: Home },
          { id: 'bulletin', label: 'Mon Bulletin Officiel', icon: Award },
          { id: 'cours', label: 'Mes Cours & Matières', icon: BookOpen },
          { id: 'horaire', label: 'Mon Emploi du Temps', icon: Clock },
          { id: 'profil', label: 'Profil Élève', icon: User },
        ];

      case 'super_admin':
        return [
          { id: 'overview', label: 'Plateforme Nationale', icon: Home },
          { id: 'schools', label: 'Établissements RDC', icon: Building },
          { id: 'users', label: 'Utilisateurs Globaux', icon: Users },
          { id: 'supabase', label: 'Supabase Cloud DB', icon: Database },
          { id: 'profil', label: 'Profil Administrateur', icon: User },
        ];

      default:
        return [
          { id: 'overview', label: 'Accueil', icon: Home },
          { id: 'profil', label: 'Mon Profil', icon: User },
        ];
    }
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div
      className={`h-full flex flex-col justify-between select-none relative transition-all duration-300 ease-out ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white dark:bg-[#181B20] border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm`}
    >
      {/* Floating Collapse Toggle Button on Edge (Desktop only) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-7 z-40 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white items-center justify-center shadow-md border-2 border-white dark:border-[#181B20] transition-transform active:scale-95"
        title={isCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Top Section */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
        {/* macOS Style 3 Dots Window Controls */}
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block shadow-2xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-2xs" />
          </div>
          {/* Mobile Close X Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Header */}
        <div className={`flex items-center gap-2.5 px-1 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="w-4 h-4 stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white block">
                Masomo
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Système Scolaire RDC</span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        {!isCollapsed ? (
          <div className="relative mt-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        ) : (
          <div className="flex justify-center mt-1">
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Rechercher..."
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section: MENU */}
        <div className="space-y-1">
          {!isCollapsed && (
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-1">
              Menu
            </span>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative">
                {isActive && (
                  <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full z-10" />
                )}
                <button
                  id={`sidebar-tab-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900 dark:text-white' : ''}`} />
                  {!isCollapsed && (
                    <span className="flex-1 text-left">{item.label}</span>
                  )}
                </button>
              </div>
            );
          })}

          {/* Support & Aide */}
          <button
            id="sidebar-tab-support"
            onClick={() => {
              setShowSupportModal(true);
              onCloseMobile();
            }}
            title={isCollapsed ? 'Support' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-all ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Support & Assistance</span>}
          </button>

          {/* SuperAdmin Users Management Shortcut */}
          {currentRole === 'super_admin' && onOpenUserManagement && (
            <button
              id="sidebar-tab-superadmin"
              onClick={() => {
                onOpenUserManagement();
                onCloseMobile();
              }}
              title={isCollapsed ? 'Gestion Globale' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Comptes & Droits</span>}
            </button>
          )}
        </div>

        {/* Section: GROUP (Classes avec chevrons) */}
        {!isCollapsed && filteredClasses.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-1">
              Classes & Sections
            </span>

            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {filteredClasses.map((cls, idx) => {
                const colorBadge = groupBadgeColors[idx % groupBadgeColors.length];
                return (
                  <button
                    key={cls.id}
                    onClick={() => handleClassClick(cls.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${colorBadge}`}>
                        {cls.name.charAt(0)}
                      </span>
                      <span className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">
                        {cls.name}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Area (Segmented Light/Dark + Profile Avatar + Logout) */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Segmented Light/Dark Switch */}
        {!isCollapsed ? (
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 flex items-center gap-1">
            <button
              onClick={() => {
                if (isDarkMode) onToggleDarkMode();
              }}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                !isDarkMode
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              onClick={() => {
                if (!isDarkMode) onToggleDarkMode();
              }}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                isDarkMode
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dark</span>
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        )}

        {/* User Profile Card at Bottom */}
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <button
            onClick={() => handleTabClick('profil')}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity flex-1"
            title="Consulter et modifier mon profil"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700">
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 leading-tight">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                  {userName}
                </span>
                <span className="block text-[11px] text-slate-400 truncate">
                  {userEmail}
                </span>
              </div>
            )}
          </button>

          {!isCollapsed && onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#181B20] rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span className="ml-2 text-xs font-bold text-slate-900 dark:text-white">Support Masomo</span>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Besoin d'assistance pédagogique ou technique ? Contactez l'équipe support EduKin :
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1.5 font-mono text-slate-700 dark:text-slate-300">
              <div>📧 support@masomo.cd</div>
              <div>📞 +243 81 500 1234 (Kinshasa)</div>
              <div>⚡ Statut : Système Opérationnel (RDC)</div>
            </div>
            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Smooth Backdrop */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={onCloseMobile}
          />
          {/* Sidebar Panel sliding from left */}
          <div className="relative z-10 h-full animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
