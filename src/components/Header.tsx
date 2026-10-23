import React from 'react';
import { User, X, LogOut, UserPlus } from 'lucide-react';
import { UserRole } from '../types';

export type TeacherTabType =
  | 'classes'
  | 'schedule'
  | 'messages'
  | 'titulaire'
  | 'attendance'
  | 'grades'
  | 'subjects'
  | 'profil';

interface HeaderProps {
  userName?: string;
  userRole?: UserRole;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onLogout?: () => void;
  onOpenUserManagement?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Utilisateur',
  userRole,
  isMenuOpen,
  onToggleMenu,
  onLogout,
  onOpenUserManagement,
}) => {
  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'enseignant':
        return 'Enseignant';
      case 'eleve':
        return 'Espace Élève';
      case 'parent':
        return 'Espace Parent';
      case 'directeur':
        return 'Direction Générale';
      case 'directeur_etudes':
        return 'Direction des Études';
      case 'directeur_discipline':
        return 'Discipline Scolaire';
      case 'comptable':
        return 'Comptabilité & Finances';
      case 'admin_scolaire':
        return 'Secrétariat Administratif';
      case 'super_admin':
        return 'Super Administrateur';
      default:
        return 'Utilisateur';
    }
  };

  const isTeacher = userRole === 'enseignant';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
        
        {/* Left Side: Hamburger Menu (for teacher sidebar) & User Info */}
        <div className="flex items-center gap-3">
          {isTeacher && (
            <button
              id="btn-toggle-main-menu"
              onClick={onToggleMenu}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center focus:outline-none"
              title={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 stroke-[2] text-slate-900 dark:text-white transition-transform duration-200 rotate-90" />
              ) : (
                <div className="w-5 h-4 flex flex-col justify-between items-center py-0.5" aria-hidden="true">
                  <span className="w-5 h-[2px] bg-slate-800 dark:bg-slate-100 rounded-full transition-all" />
                  <span className="w-5 h-[2px] bg-slate-800 dark:bg-slate-100 rounded-full transition-all" />
                  <span className="w-5 h-[2px] bg-slate-800 dark:bg-slate-100 rounded-full transition-all" />
                </div>
              )}
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">
              {userName}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {getRoleLabel(userRole)}
            </span>
          </div>
        </div>

        {/* Right Side: Logout and Quick Actions */}
        <div className="flex items-center gap-2">
          {(userRole === 'directeur' || userRole === 'super_admin') && onOpenUserManagement && (
            <button
              id="btn-header-user-mgmt"
              onClick={onOpenUserManagement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors shadow-2xs"
              title="Créer et gérer tous les profils de l'école (Profs, Dir. Études, Caisse, Élèves, Parents)"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Créer & Gérer Profils</span>
              <span className="sm:hidden">Profils</span>
            </button>
          )}

          {!isTeacher && onLogout && (
            <button
              id="btn-header-logout"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
