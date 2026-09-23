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
} from 'lucide-react';
import { TeacherTabType } from './Header';
import { SchoolClass, UserSession, UserRole } from '../types';

interface SidebarNavProps {
  activeTab: TeacherTabType;
  onSelectTab: (tab: TeacherTabType) => void;
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
  isTitulaire = false,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  currentRole,
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

  // Group badge colors matching reference design
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

  const handleTabClick = (tab: TeacherTabType) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const handleClassClick = (classId: string) => {
    onSelectTab('classes');
    if (onSelectClass) onSelectClass(classId);
    onCloseMobile();
  };

  const userName = currentUser?.fullName || 'Professeur';
  const userEmail = currentUser?.email || 'professeur@masomo.cd';
  const userInitial = userName.charAt(0).toUpperCase();

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

          {/* 1. Mes Classes */}
          <div className="relative">
            {activeTab === 'classes' && (
              <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full z-10" />
            )}
            <button
              id="sidebar-tab-classes"
              onClick={() => handleTabClick('classes')}
              title={isCollapsed ? 'Mes Classes' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                activeTab === 'classes'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Home className={`w-4 h-4 shrink-0 ${activeTab === 'classes' ? 'text-slate-900 dark:text-white' : ''}`} />
              {!isCollapsed && <span>Mes Classes</span>}
            </button>
          </div>

          {/* 2. Horaire & Tâches */}
          <div className="relative">
            {activeTab === 'schedule' && (
              <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full z-10" />
            )}
            <button
              id="sidebar-tab-schedule"
              onClick={() => handleTabClick('schedule')}
              title={isCollapsed ? 'Horaire & Tâches' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                activeTab === 'schedule'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'schedule' ? 'text-slate-900 dark:text-white' : ''}`} />
              {!isCollapsed && <span>Horaire & Tâches</span>}
            </button>
          </div>

          {/* 3. Messages & Alertes */}
          <div className="relative">
            {activeTab === 'messages' && (
              <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full z-10" />
            )}
            <button
              id="sidebar-tab-messages"
              onClick={() => handleTabClick('messages')}
              title={isCollapsed ? 'Messages' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                activeTab === 'messages'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Bell className={`w-4 h-4 shrink-0 ${activeTab === 'messages' ? 'text-slate-900 dark:text-white' : ''}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Messages & Alertes</span>
                  {unreadMessagesCount > 0 ? (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white min-w-5 text-center">
                      {unreadMessagesCount}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white min-w-5 text-center">
                      14
                    </span>
                  )}
                </>
              )}
              {isCollapsed && (
                <span className="absolute top-1.5 right-4 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#181B20]" />
              )}
            </button>
          </div>

          {/* 4. Profil Enseignant (Full Page in Main App View) */}
          <div className="relative">
            {activeTab === 'profil' && (
              <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full z-10" />
            )}
            <button
              id="sidebar-tab-profil"
              onClick={() => handleTabClick('profil')}
              title={isCollapsed ? 'Profil Enseignant' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                activeTab === 'profil'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <User className={`w-4 h-4 shrink-0 ${activeTab === 'profil' ? 'text-slate-900 dark:text-white' : ''}`} />
              {!isCollapsed && <span>Profil Enseignant</span>}
            </button>
          </div>

          {/* 5. Titulaire (if applicable) */}
          {isTitulaire && (
            <div className="relative">
              {activeTab === 'titulaire' && (
                <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-500 rounded-r-full z-10" />
              )}
              <button
                id="sidebar-tab-titulaire"
                onClick={() => handleTabClick('titulaire')}
                title={isCollapsed ? 'Titulaire' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                  activeTab === 'titulaire'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Award className={`w-4 h-4 shrink-0 ${activeTab === 'titulaire' ? 'text-slate-900 dark:text-white' : ''}`} />
                {!isCollapsed && <span>Espace Titulaire</span>}
              </button>
            </div>
          )}

          {/* 6. Support & Aide */}
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
            {!isCollapsed && <span>Support</span>}
          </button>

          {/* 7. SuperAdmin Users Management (if applicable) */}
          {currentRole === 'super_admin' && onOpenUserManagement && (
            <button
              id="sidebar-tab-superadmin"
              onClick={() => {
                onOpenUserManagement();
                onCloseMobile();
              }}
              title={isCollapsed ? 'Utilisateurs' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Utilisateurs & Accès</span>}
            </button>
          )}
        </div>

        {/* Section: GROUP (Classes avec chevrons) */}
        {!isCollapsed && filteredClasses.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-1">
              Group
            </span>

            <div className="space-y-0.5 max-h-48 overflow-y-auto">
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

      {/* Bottom Controls Area (Segmented Light/Dark + Profile Avatar) */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        
        {/* Segmented Light/Dark Switch (Directly in the menu) */}
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

        {/* User Profile Card at Bottom (Clicking navigates to full Profil page) */}
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <button
            onClick={() => handleTabClick('profil')}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
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
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Assistance technique et pédagogique pour la gestion de votre établissement :
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <strong>Email :</strong> support@masomo.cd
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <strong>WhatsApp :</strong> +243 81 500 1234
              </div>
            </div>
            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:block sticky top-0 h-screen z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Smooth Sliding Animation */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-out ${
          isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        {/* Backdrop Fade In / Fade Out */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />

        {/* Drawer Slide In from Left / Slide Out to Left */}
        <div
          className={`relative z-10 w-72 max-w-[82vw] h-full shadow-2xl transform transition-transform duration-300 cubic-bezier(0.16,1,0.3,1) ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
};
