import React from 'react';
import { User, X, LogOut } from 'lucide-react';
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
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Professeur',
  userRole,
  isMenuOpen,
  onToggleMenu,
  onLogout,
}) => {
  const isTeacher = userRole === 'enseignant';

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

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
        
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu ONLY for Teacher (as teacher sidebar is teacher-specific) */}
          {isTeacher ? (
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
          ) : (
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 leading-tight">
              {userName}
            </span>
            {!isTeacher && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {getRoleLabel(userRole)}
              </span>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1.5"
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
