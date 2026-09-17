import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthModal } from './components/auth/AuthModal';
import { OwnerDashboard } from './components/dashboard/OwnerDashboard';
import { ProjectsList } from './components/projects/ProjectsList';
import { ProjectWorkspace } from './components/projects/ProjectWorkspace';
import { CustomerManager } from './components/customers/CustomerManager';
import { ComponentCatalog } from './components/components/ComponentCatalog';
import { BillingManager } from './components/billing/BillingManager';
import { CustomerPortal } from './components/portal/CustomerPortal';
import { AiConsultant } from './components/ai/AiConsultant';
import { InvoiceModal } from './components/billing/InvoiceModal';

import type { Project, Customer, ComponentItem, BillingRecord } from './types';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getComponents,
  createComponent,
  updateComponent,
  deleteComponent,
  getBills,
  saveBill,
  updateBillStatus,
  deleteBill,
  seedInitialDatabaseIfEmpty,
  clearAllWorkspaceData,
} from './firebase/services';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ThemeCustomizerModal } from './components/theme/ThemeCustomizerModal';

function MainApp() {
  const { role, user, isAuthModalOpen, openAuthModal, closeAuthModal, switchRoleForTesting, signOut } =
    useAuth();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<BillingRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Firestore Real Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [bills, setBills] = useState<BillingRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Initial Load & Seeding
  const loadAllData = async () => {
    try {
      setDbError(null);
      // Seed if empty so user has realistic workshop initial data
      await seedInitialDatabaseIfEmpty();

      const [p, c, comp, b] = await Promise.all([
        getProjects(),
        getCustomers(),
        getComponents(),
        getBills(),
      ]);

      setProjects(p);
      setCustomers(c);
      setComponents(comp);
      setBills(b);
    } catch (err: any) {
      console.error('Error connecting to Firestore database:', err);
      setDbError(err.message || 'Database connection issue. Please check Firestore configuration.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleClearWorkspace = async () => {
    setRefreshing(true);
    await clearAllWorkspaceData();
    await loadAllData();
  };

  // Switch to customer portal view if role switched to customer, or dashboard if switched to owner
  useEffect(() => {
    if (role === 'customer' && currentView !== 'portal') {
      setCurrentView('portal');
    } else if (role === 'owner' && currentView === 'portal') {
      setCurrentView('dashboard');
    }
  }, [role]);

  // Project CRUD
  const handleCreateProject = async (data: Omit<Project, 'id'>) => {
    const newPrj = await createProject(data);
    setProjects((prev) => [newPrj, ...prev]);
    setSelectedProjectId(newPrj.id);
    setCurrentView('projects');
  };

  const handleUpdateProject = async (id: string, data: Partial<Project>) => {
    await updateProject(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
  };

  // Customer CRUD
  const handleAddCustomer = async (data: Omit<Customer, 'id'>) => {
    const newCust = await createCustomer(data);
    setCustomers((prev) => [newCust, ...prev]);
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    await updateCustomer(id, data);
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Component CRUD
  const handleAddComponent = async (data: Omit<ComponentItem, 'id'>) => {
    const newComp = await createComponent(data);
    setComponents((prev) => [newComp, ...prev]);
  };

  const handleUpdateComponent = async (id: string, data: Partial<ComponentItem>) => {
    await updateComponent(id, data);
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const handleDeleteComponent = async (id: string) => {
    await deleteComponent(id);
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  // Billing Actions
  const handleCreateBill = async (data: Omit<BillingRecord, 'id'>) => {
    const newBill = await saveBill(data);
    setBills((prev) => [newBill, ...prev]);
  };

  const handleUpdateBillStatus = async (id: string, status: 'draft' | 'sent' | 'paid') => {
    await updateBillStatus(id, status);
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const handleDeleteBill = async (id: string) => {
    await deleteBill(id);
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenSearch={() => {}}
        onOpenAuth={openAuthModal}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        darkMode={isDark}
        onToggleDarkMode={toggleTheme}
        activeView={currentView}
        setActiveView={(view) => {
          setCurrentView(view);
          if (view !== 'projects') {
            setSelectedProjectId(null);
          }
        }}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={currentView}
          setActiveView={(view) => {
            setCurrentView(view);
            if (view !== 'projects') {
              setSelectedProjectId(null);
            }
          }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          projectCount={projects.length}
          customerCount={customers.length}
          componentCount={components.length}
        />

        {/* Dynamic Main Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {/* Firestore Connection Badge & Live Refresh Bar */}
          <div className="mb-6 flex items-center justify-between p-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Cloud Database: Connected (Firestore Database ID: (default))</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors font-semibold"
                title="Sync and refresh all records from Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Syncing...' : 'Sync Firestore'}</span>
              </button>
            </div>
          </div>

          {dbError && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{dbError}</span>
            </div>
          )}

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">Loading KKS Creative Hub cloud database...</p>
            </div>
          ) : (
            <>
              {/* 1. DASHBOARD VIEW */}
              {currentView === 'dashboard' && role === 'owner' && (
                <OwnerDashboard
                  projects={projects}
                  customers={customers}
                  components={components}
                  bills={bills}
                  onSelectProject={(id) => {
                    setSelectedProjectId(id);
                    setCurrentView('projects');
                  }}
                  onCreateProject={() => {
                    setSelectedProjectId(null);
                    setCurrentView('projects');
                  }}
                  onNavigate={(v) => {
                    setCurrentView(v);
                    setSelectedProjectId(null);
                  }}
                  onSeedData={handleManualRefresh}
                  onClearWorkspace={handleClearWorkspace}
                />
              )}

              {/* 2. PROJECTS LIST / PROJECT WORKSPACE VIEW */}
              {currentView === 'projects' && (
                <>
                  {selectedProjectId && activeProject ? (
                    <ProjectWorkspace
                      project={activeProject}
                      customers={customers}
                      catalogComponents={components}
                      onBack={() => setSelectedProjectId(null)}
                      onProjectUpdated={(updated) => {
                        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                      }}
                      onViewInvoice={(bill) => setViewingInvoice(bill)}
                    />
                  ) : (
                    <ProjectsList
                      projects={projects}
                      customers={customers}
                      onSelectProject={(id) => setSelectedProjectId(id)}
                      onCreateProject={handleCreateProject}
                      onDeleteProject={handleDeleteProject}
                      onUpdateProject={handleUpdateProject}
                    />
                  )}
                </>
              )}

              {/* 3. CUSTOMERS VIEW */}
              {currentView === 'customers' && (
                <CustomerManager
                  customers={customers}
                  projects={projects}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onSelectProject={(id) => {
                    setSelectedProjectId(id);
                    setCurrentView('projects');
                  }}
                />
              )}

              {/* 4. COMPONENTS CATALOG VIEW */}
              {currentView === 'components' && (
                <ComponentCatalog
                  components={components}
                  onAddComponent={handleAddComponent}
                  onUpdateComponent={handleUpdateComponent}
                  onDeleteComponent={handleDeleteComponent}
                />
              )}

              {/* 5. BILLING & INVOICES VIEW */}
              {currentView === 'billing' && (
                <BillingManager
                  bills={bills}
                  projects={projects}
                  customers={customers}
                  catalogComponents={components}
                  onViewInvoice={(bill) => setViewingInvoice(bill)}
                  onUpdateStatus={handleUpdateBillStatus}
                  onDeleteBill={handleDeleteBill}
                  onSelectProject={(id) => {
                    setSelectedProjectId(id);
                    setCurrentView('projects');
                  }}
                  onCreateBill={handleCreateBill}
                />
              )}

              {/* 6. AI CONSULTANT VIEW */}
              {currentView === 'ai' && (
                <AiConsultant projects={projects} catalogComponents={components} />
              )}

              {/* 7. CUSTOMER PORTAL VIEW */}
              {currentView === 'portal' && (
                <CustomerPortal
                  currentUserEmail={
                    role === 'customer'
                      ? user?.email || 'client@company.com'
                      : 'client@company.com'
                  }
                  customers={customers}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Printable Invoice Modal (if open) */}
      {viewingInvoice && (
        <InvoiceModal
          bill={viewingInvoice}
          project={projects.find((p) => p.id === viewingInvoice.projectId)}
          customer={customers.find((c) => c.id === viewingInvoice.customerId)}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {/* Auth Modal (Email/Password & Google Sign In) */}
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />

      {/* Theme Customizer Modal (Light, Dark, OLED, Accents) */}
      <ThemeCustomizerModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
