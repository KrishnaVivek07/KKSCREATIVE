import React from 'react';
import type {
  Project,
  Customer,
  ComponentItem,
  BillingRecord,
  DiaryEntry,
  TaskItem,
  ProjectFile,
} from '../../types';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Users,
  Cpu,
  Receipt,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { KksLogo } from '../common/KksLogo';

interface OwnerDashboardProps {
  projects: Project[];
  customers: Customer[];
  components: ComponentItem[];
  bills: BillingRecord[];
  recentDiary?: DiaryEntry[];
  tasks?: TaskItem[];
  files?: ProjectFile[];
  loading?: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject?: () => void;
  onNavigate?: (view: string) => void;
  onSeedData?: () => void;
  onClearWorkspace?: () => Promise<void>;
}

export function OwnerDashboard({
  projects,
  customers,
  components,
  bills,
  recentDiary = [],
  tasks = [],
  files = [],
  loading = false,
  onSelectProject,
  onCreateProject = () => {},
  onNavigate = () => {},
  onSeedData = () => {},
  onClearWorkspace,
}: OwnerDashboardProps) {
  // Real Firestore-calculated metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const pendingProjects = projects.filter(p => p.status === 'planned' || p.status === 'on_hold' || p.status === 'testing').length;
  const totalCustomers = customers.length;
  const totalComponents = components.length;

  // Average progress across all projects
  const avgProgress = totalProjects > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects)
    : 0;

  // Outstanding / Total billed
  const totalBilled = bills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const pendingTasksList = tasks.filter(t => !t.completed).slice(0, 5);
  const recentProjects = [...projects].slice(0, 4);
  const recentBills = [...bills].slice(0, 4);

  return (
    <div id="owner-dashboard-container" className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl">
        <div className="flex items-start sm:items-center gap-4">
          <KksLogo size="lg" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Live Workshop Overview
              </span>
              <span className="text-xs text-indigo-200/70">Source of Truth: Firestore DB</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              KKS
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl font-medium">
              Innovate your ideas with KKS — Real-time control center for electronics, embedded IoT systems, robotics engineering and client deliveries.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onClearWorkspace && (projects.length > 0 || customers.length > 0 || bills.length > 0) && (
            <button
              id="dashboard-reset-workspace-btn"
              onClick={async () => {
                if (window.confirm('Are you sure you want to empty all projects, clients, and bills to start 100% blank? Components catalog will be kept.')) {
                  await onClearWorkspace();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-red-900/60 border border-slate-700 text-slate-300 hover:text-red-200 text-xs font-medium transition-colors"
              title="Reset all projects and clients to an empty workspace"
            >
              <span>Empty Workspace</span>
            </button>
          )}

          <button
            id="dashboard-register-client-btn"
            onClick={() => onNavigate('customers')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-semibold transition-colors"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Register Client</span>
          </button>

          <button
            id="dashboard-new-project-btn"
            onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Project Workspace</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div
          id="kpi-total-projects"
          onClick={() => onNavigate('projects')}
          className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Projects</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : totalProjects}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{activeProjects} Active</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{completedProjects} Done</span>
          </div>
        </div>

        {/* Total Customers */}
        <div
          id="kpi-total-customers"
          onClick={() => onNavigate('customers')}
          className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Clients</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : totalCustomers}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Industry & IoT Clients
          </div>
        </div>

        {/* Electronics Catalog */}
        <div
          id="kpi-total-components"
          onClick={() => onNavigate('components')}
          className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Components Catalog</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : totalComponents}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            MCUs, Sensors, Relays & ICs
          </div>
        </div>

        {/* Billing Total */}
        <div
          id="kpi-total-billing"
          onClick={() => onNavigate('billing')}
          className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate">
            {loading ? '...' : `₹${totalBilled.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {bills.length} Invoices generated
          </div>
        </div>
      </div>

      {/* Workshop Overall Progress Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Workshop Overall Execution Progress</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Computed strictly from active project task checklist completions
            </p>
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
            {avgProgress}%
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-500"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      {/* 2-Column Split: Active Projects & Right Column (Tasks & Diary) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-600" />
              <span>Recent Project Workspaces</span>
            </h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View all ({totalProjects})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800">
              <FolderKanban className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No projects created yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Your workspace is clean. Create your first client project or embedded hardware workspace to start tracking tasks and billings.
              </p>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  id="dashboard-empty-create-project-btn"
                  onClick={onCreateProject}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Project Workspace</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  id={`dashboard-project-card-${project.id}`}
                  onClick={() => onSelectProject(project.id)}
                  className="cursor-pointer p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {project.projectType}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          project.status === 'completed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
                            : project.status === 'in_progress'
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {project.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {project.name}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400">Checklist Progress:</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                    {project.customerName && (
                      <div className="text-[11px] text-slate-400 mt-2 truncate">
                        Client: <span className="text-slate-600 dark:text-slate-300 font-medium">{project.customerName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Invoices Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Recent Workshop Invoices</span>
              </h3>
              <button
                onClick={() => onNavigate('billing')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>View all bills</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentBills.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No invoices created yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
                {recentBills.map((bill) => (
                  <div
                    key={bill.id}
                    onClick={() => onNavigate('billing')}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {bill.invoiceNumber}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {bill.customerName || 'Direct Client'} • Due {bill.dueDate || 'On Delivery'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {bill.currency || '₹'} {bill.grandTotal?.toLocaleString()}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          bill.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-600'
                            : bill.status === 'sent'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {bill.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Pending Tasks & Recent Diary Entries */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Pending Engineering Tasks</span>
              </h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                {pendingTasksList.length}
              </span>
            </div>

            {pendingTasksList.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                {tasks.length === 0
                  ? 'No active tasks yet. Create tasks inside project workspaces.'
                  : 'All workshop checklist tasks completed!'}
              </p>
            ) : (
              <div className="space-y-2">
                {pendingTasksList.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectProject(task.projectId)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {task.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    {task.category && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        {task.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Engineering Diary Logs */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Recent Workshop Diary</span>
              </h3>
            </div>

            {recentDiary.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
                No diary entries logged yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentDiary.slice(0, 4).map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => onSelectProject(entry.projectId)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>{entry.date ? new Date(entry.date).toLocaleDateString() : 'Recent'}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
                          entry.visibility === 'CUSTOMER_VISIBLE'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {entry.visibility === 'CUSTOMER_VISIBLE' ? 'Client Visible' : 'Private'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {entry.title}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {entry.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
