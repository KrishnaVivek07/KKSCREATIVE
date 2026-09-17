import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Cpu,
  Search,
  Wifi,
  WifiOff,
  UserCheck,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Palette,
  Shield,
  Eye,
  Menu,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { KksLogo } from '../common/KksLogo';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export function Navbar({
  onOpenSearch,
  onOpenAuth,
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
  activeView,
  setActiveView,
}: NavbarProps) {
  const { user, profile, role, isOwner, logout, openAuthModal, isOnline } = useAuth();
  const { mode, isDark, toggleTheme, openCustomizer } = useTheme();

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors"
    >
      {/* Left brand & sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          id="mobile-sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => setActiveView(isOwner ? 'dashboard' : 'portal')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <KksLogo size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                KKS
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                Official
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5 truncate max-w-[180px] xs:max-w-none">
              Innovate your ideas with KKS
            </p>
          </div>
        </div>
      </div>

      {/* Middle Global Search Trigger */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <button
          id="navbar-search-btn"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 text-sm bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200/80 dark:border-slate-700/60 transition-colors shadow-inner"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search projects, components, diary, bills...</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile search icon */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          title="Search Database"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Database connectivity status badge */}
        <div
          id="firestore-status-badge"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
          }`}
          title={isOnline ? 'Dedicated Firestore Cloud Database: Connected' : 'Offline: Local changes queued'}
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden xl:inline">Cloud Firestore</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Offline</span>
            </>
          )}
        </div>

        {/* Dedicated Portals Selector */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            id="role-switch-owner-btn"
            onClick={() => {
              if (role !== 'owner') {
                openAuthModal('owner');
              } else {
                setActiveView('dashboard');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              role === 'owner'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={`Workshop Owner Portal (${profile?.email || 'Sign In'})`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Owner Portal</span>
            <span className="sm:hidden">Owner</span>
          </button>
          <button
            id="role-switch-customer-btn"
            onClick={() => {
              if (role !== 'customer') {
                openAuthModal('customer');
              } else {
                setActiveView('portal');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              role === 'customer'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Customer Portal for Clients"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customer Portal</span>
            <span className="sm:hidden">Client</span>
          </button>
        </div>

        {/* Theme Customization & Quick Toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            id="dark-mode-toggle-btn"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all text-xs font-semibold"
            title={`Current Theme: ${mode.toUpperCase()} (${isDark ? 'Dark Surface' : 'Light Surface'}). Click to switch.`}
            aria-label="Toggle Theme Mode"
          >
            {mode === 'system' ? (
              <Laptop className="w-3.5 h-3.5 text-indigo-500" />
            ) : isDark ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden lg:inline capitalize">
              {mode}
            </span>
          </button>

          <button
            id="open-theme-customizer-btn"
            onClick={openCustomizer}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all"
            title="Theme Customization: Light, Dark, Accents & OLED"
            aria-label="Customize Theme"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Account / User Menu */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
          <button
            id="auth-profile-btn"
            onClick={() => openAuthModal(role)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Switch Portal or Account"
          >
            {user?.photoURL || profile?.photoURL ? (
              <img
                src={user?.photoURL || profile?.photoURL}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-indigo-500/30"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  role === 'owner'
                    ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {role === 'owner'
                  ? profile?.displayName?.slice(0, 2).toUpperCase() || 'OW'
                  : profile?.displayName?.slice(0, 2).toUpperCase() || 'CU'}
              </div>
            )}
            <div className="text-left hidden xl:block">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {profile?.displayName || (role === 'owner' ? 'Workshop Owner' : 'Customer')}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {profile?.email || (role === 'owner' ? 'Owner Session' : 'Client Access')}
              </p>
            </div>
          </button>

          <button
            id="logout-btn"
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors hidden sm:block"
            title="Sign Out / Switch Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
