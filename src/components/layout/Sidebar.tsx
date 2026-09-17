import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Cpu,
  Receipt,
  Eye,
  Settings,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
  Palette,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { KksLogo } from '../common/KksLogo';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  projectCount: number;
  componentCount: number;
  customerCount: number;
}

export function Sidebar({
  activeView,
  setActiveView,
  isOpen,
  onClose,
  projectCount,
  componentCount,
  customerCount,
}: SidebarProps) {
  const { isOwner, role } = useAuth();
  const { openCustomizer, mode, isDark } = useTheme();

  const ownerNavItems = [
    {
      id: 'dashboard',
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'projects',
      label: 'Project Workspaces',
      icon: FolderKanban,
      badge: projectCount > 0 ? projectCount : null,
    },
    {
      id: 'customers',
      label: 'Customer Registry',
      icon: Users,
      badge: customerCount > 0 ? customerCount : null,
    },
    {
      id: 'components',
      label: 'Electronics Database',
      icon: Cpu,
      badge: componentCount > 0 ? componentCount : null,
    },
    {
      id: 'billing',
      label: 'Billing & Invoices',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'ai',
      label: 'Gemini AI Assistant',
      icon: Sparkles,
      badge: 'AI',
    },
    {
      id: 'portal',
      label: 'Customer Portal Preview',
      icon: Eye,
      badge: null,
    },
  ];

  const customerNavItems = [
    {
      id: 'portal',
      label: 'My Shared Projects',
      icon: Eye,
      badge: null,
    },
  ];

  const currentNav = isOwner ? ownerNavItems : customerNavItems;

  const handleNavClick = (viewId: string) => {
    setActiveView(viewId);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed md:sticky top-0 md:top-16 z-40 md:z-20 h-screen md:h-[calc(100vh-4rem)] w-64 shrink-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-4 overflow-y-auto">
          {/* Mobile header inside sidebar */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 md:hidden">
            <div className="flex items-center gap-2.5">
              <KksLogo size="sm" />
              <div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                  KKS
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                  Innovate your ideas with KKS
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Role Banner */}
          <div className="mb-4 p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-slate-100 to-indigo-500/5 dark:from-indigo-950/40 dark:via-slate-800/60 dark:to-indigo-900/20 border border-indigo-200/60 dark:border-indigo-800/40">
            <div className="flex items-center gap-2">
              {isOwner ? (
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {isOwner ? 'Workshop Owner' : 'Customer Portal'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isOwner
                ? 'Full admin, engineering & billing authority'
                : 'Restricted view of assigned projects'}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation
            </p>
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick toggle to customer portal for testing */}
          {isOwner && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Auditing & Testing
              </p>
              <button
                id="preview-customer-portal-btn"
                onClick={() => handleNavClick('portal')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${
                  activeView === 'portal'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300'
                }`}
              >
                <Eye className="w-4 h-4 text-emerald-500" />
                <span>Customer Portal View</span>
              </button>
            </div>
          )}

          {/* Theme & Customization Quick Action */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              id="sidebar-theme-customizer-btn"
              onClick={() => {
                openCustomizer();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-indigo-500" />
                <span>Theme & Appearance</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                {mode}
              </span>
            </button>
          </div>

          {/* Workshop Details in Footer */}
          <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>KKS</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                Innovate your ideas with KKS. Electronics, Robotics & IoT Workshop.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
