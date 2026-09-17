import React, { useState, useEffect } from 'react';
import type {
  Project,
  Customer,
  ComponentItem,
  ProjectComponent,
  BillingRecord,
  DiaryEntry,
  ProjectFile,
  DesignVersion,
  TaskItem,
  CustomerAccess,
  AiChatMessage,
  ProjectType,
  ProjectStatus,
  ProjectPriority,
  VisibilityType,
} from '../../types';
import {
  getProjectComponents,
  addProjectComponent,
  deleteProjectComponent,
  getDiaryEntries,
  addDiaryEntry,
  deleteDiaryEntry,
  getProjectFiles,
  addProjectFile,
  deleteProjectFile,
  getDesignVersions,
  addDesignVersion,
  deleteDesignVersion,
  getTasks,
  addTask,
  toggleTask,
  deleteTask,
  getProjectCustomerAccess,
  grantCustomerAccess,
  revokeCustomerAccess,
  getAiMessages,
  addAiMessage,
  updateProject,
  saveBill,
  getBills,
  deleteBill,
} from '../../firebase/services';
import { CreateBillModal } from '../billing/CreateBillModal';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Cpu,
  Receipt,
  FileText,
  Folder,
  Layers,
  CheckSquare,
  TrendingUp,
  Bot,
  Share2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Upload,
  Lock,
  Eye,
  Send,
  Printer,
  Calendar,
  DollarSign,
  AlertTriangle,
  Edit2,
  RefreshCw,
  Box,
} from 'lucide-react';

interface ProjectWorkspaceProps {
  project: Project;
  customers: Customer[];
  catalogComponents: ComponentItem[];
  onBack: () => void;
  onProjectUpdated: (updated: Project) => void;
  onViewInvoice: (bill: BillingRecord) => void;
}

type WorkspaceTab =
  | 'overview'
  | 'customer'
  | 'components'
  | 'billing'
  | 'diary'
  | 'files'
  | 'design'
  | 'checklist'
  | 'progress'
  | 'ai'
  | 'sharing';

export function ProjectWorkspace({
  project,
  customers,
  catalogComponents,
  onBack,
  onProjectUpdated,
  onViewInvoice,
}: ProjectWorkspaceProps) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  // Sub-collection states
  const [components, setComponents] = useState<ProjectComponent[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [designVersions, setDesignVersions] = useState<DesignVersion[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [accessList, setAccessList] = useState<CustomerAccess[]>([]);
  const [aiHistory, setAiHistory] = useState<AiChatMessage[]>([]);
  const [projectBills, setProjectBills] = useState<BillingRecord[]>([]);
  const [loadingSection, setLoadingSection] = useState(true);

  // Form states
  // Add component modal/form
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [selectedCatalogCompId, setSelectedCatalogCompId] = useState('');
  const [customCompName, setCustomCompName] = useState('');
  const [compQty, setCompQty] = useState(1);
  const [compUnitPrice, setCompUnitPrice] = useState(0);

  // Add diary form
  const [showAddDiary, setShowAddDiary] = useState(false);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryDesc, setDiaryDesc] = useState('');
  const [diaryTags, setDiaryTags] = useState('Hardware, Progress');
  const [diaryVisibility, setDiaryVisibility] = useState<VisibilityType>('CUSTOMER_VISIBLE');

  // Add task form
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('Hardware assembly');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskCustomerVisible, setTaskCustomerVisible] = useState(true);
  const [aiGeneratingTasks, setAiGeneratingTasks] = useState(false);

  // Add file form
  const [showAddFile, setShowAddFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('Schematic PDF');
  const [fileUrl, setFileUrl] = useState('');
  const [fileVisibility, setFileVisibility] = useState<VisibilityType>('CUSTOMER_VISIBLE');

  // Add design version form
  const [showAddDesign, setShowAddDesign] = useState(false);
  const [designTitle, setDesignTitle] = useState('');
  const [versionNumber, setVersionNumber] = useState('v1.0');
  const [designDimensions, setDesignDimensions] = useState('120 x 80 x 40 mm');
  const [designMaterials, setDesignMaterials] = useState('3D Printed PLA & Acrylic');
  const [designNotes, setDesignNotes] = useState('');

  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Share form
  const [shareEmail, setShareEmail] = useState('');

  // Billing form
  const [showAddBill, setShowAddBill] = useState(false);
  const [billLabor, setBillLabor] = useState(8000);
  const [billDesign, setBillDesign] = useState(5000);
  const [billOther, setBillOther] = useState(1200);
  const [billDiscount, setBillDiscount] = useState(0);
  const [billTaxRate, setBillTaxRate] = useState(18);

  // Load all subcollection data for this project
  const loadWorkspaceData = async () => {
    setLoadingSection(true);
    try {
      const [comps, d, f, dv, t, al, aim, bl] = await Promise.all([
        getProjectComponents(project.id),
        getDiaryEntries(project.id, false),
        getProjectFiles(project.id, false),
        getDesignVersions(project.id),
        getTasks(project.id, false),
        getProjectCustomerAccess(project.id),
        getAiMessages(project.id),
        getBills(project.id),
      ]);
      setComponents(comps);
      setDiary(d);
      setFiles(f);
      setDesignVersions(dv);
      setTasks(t);
      setAccessList(al);
      setAiHistory(aim);
      setProjectBills(bl);
    } catch (err) {
      console.error('Error loading project workspace data:', err);
    } finally {
      setLoadingSection(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [project.id]);

  // Derived calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalComponentCost = components.reduce((acc, c) => acc + (c.total || 0), 0);

  // Synchronize progress with project doc if different
  useEffect(() => {
    if (totalTasks > 0 && project.progress !== calculatedProgress) {
      updateProject(project.id, { progress: calculatedProgress }).then(() => {
        onProjectUpdated({ ...project, progress: calculatedProgress });
      });
    }
  }, [calculatedProgress, totalTasks]);

  // ================= TABS HANDLERS =================
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await toggleTask(taskId, !currentStatus, project.id);
      const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !currentStatus } : t));
      setTasks(updated);
      const newCompleted = updated.filter((t) => t.completed).length;
      const newProgress = Math.round((newCompleted / updated.length) * 100);
      onProjectUpdated({ ...project, progress: newProgress });
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const newTask = await addTask({
        projectId: project.id,
        title: taskTitle.trim(),
        category: taskCategory,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        completed: false,
        customerVisible: taskCustomerVisible,
        ownerId: 'workshop-owner',
        createdAt: new Date().toISOString(),
      });
      setTasks((prev) => [...prev, newTask]);
      setTaskTitle('');
      setShowAddTask(false);
      const updatedList = [...tasks, newTask];
      const newProgress = Math.round((updatedList.filter((t) => t.completed).length / updatedList.length) * 100);
      onProjectUpdated({ ...project, progress: newProgress });
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleGenerateAiChecklist = async () => {
    setAiGeneratingTasks(true);
    try {
      const res = await fetch('/api/gemini/suggest-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          projectType: project.projectType,
          description: project.description,
        }),
      });
      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        for (const item of data.tasks) {
          const created = await addTask({
            projectId: project.id,
            title: item.title,
            description: item.description,
            category: item.category || 'Engineering',
            priority: item.priority || 'medium',
            completed: false,
            customerVisible: true,
            ownerId: 'workshop-owner',
            createdAt: new Date().toISOString(),
          });
          setTasks((prev) => [...prev, created]);
        }
      }
    } catch (err) {
      console.error('Error generating AI checklist:', err);
    } finally {
      setAiGeneratingTasks(false);
    }
  };

  const handleAddProjectComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    let name = customCompName.trim();
    let unitPrice = compUnitPrice;
    let isCustom = true;
    let componentId: string | undefined = undefined;

    if (selectedCatalogCompId) {
      const found = catalogComponents.find((c) => c.id === selectedCatalogCompId);
      if (found) {
        name = found.name;
        unitPrice = found.referencePrice;
        isCustom = false;
        componentId = found.id;
      }
    }

    if (!name) return;

    try {
      const newComp = await addProjectComponent({
        projectId: project.id,
        componentId,
        name,
        quantity: Number(compQty) || 1,
        unitPrice,
        total: (Number(compQty) || 1) * unitPrice,
        isCustom,
        ownerId: 'workshop-owner',
        createdAt: new Date().toISOString(),
      });
      setComponents((prev) => [...prev, newComp]);
      setSelectedCatalogCompId('');
      setCustomCompName('');
      setCompQty(1);
      setCompUnitPrice(0);
      setShowAddComponent(false);
    } catch (err) {
      console.error('Failed to add component:', err);
    }
  };

  const handleAddDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diaryTitle.trim() || !diaryDesc.trim()) return;

    try {
      const entry = await addDiaryEntry({
        projectId: project.id,
        title: diaryTitle.trim(),
        description: diaryDesc.trim(),
        date: new Date().toISOString(),
        author: 'Workshop Lead Engineer',
        tags: diaryTags.split(',').map((t) => t.trim()).filter(Boolean),
        visibility: diaryVisibility,
        ownerId: 'workshop-owner',
        createdAt: new Date().toISOString(),
      });
      setDiary((prev) => [entry, ...prev]);
      setDiaryTitle('');
      setDiaryDesc('');
      setShowAddDiary(false);
    } catch (err) {
      console.error('Failed to add diary entry:', err);
    }
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    try {
      const newFile = await addProjectFile({
        projectId: project.id,
        fileName: fileName.trim(),
        fileType,
        fileSize: 1024 * 450, // Approx 450 KB
        storagePath: `projects/${project.id}/files/${fileName.trim()}`,
        downloadUrl: fileUrl.trim() || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000',
        uploadedBy: 'Workshop Owner',
        uploadDate: new Date().toISOString(),
        visibility: fileVisibility,
        ownerId: 'workshop-owner',
        createdAt: new Date().toISOString(),
      });
      setFiles((prev) => [newFile, ...prev]);
      setFileName('');
      setFileUrl('');
      setShowAddFile(false);
    } catch (err) {
      console.error('Failed to add file:', err);
    }
  };

  const handleAddDesignVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designTitle.trim()) return;

    try {
      const newVer = await addDesignVersion({
        projectId: project.id,
        title: designTitle.trim(),
        versionNumber,
        dimensions: designDimensions,
        materials: designMaterials,
        notes: designNotes,
        componentsList: components.map((c) => c.name).join(', '),
        externalToolUrl: 'https://www.easyeda.com',
        ownerId: 'workshop-owner',
        createdAt: new Date().toISOString(),
      });
      setDesignVersions((prev) => [newVer, ...prev]);
      setDesignTitle('');
      setShowAddDesign(false);
    } catch (err) {
      console.error('Failed to add design version:', err);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    try {
      const currentOwnerId = user?.uid || profile?.id || profile?.email || 'workshop-owner';
      const acc = await grantCustomerAccess({
        customerEmail: shareEmail.trim().toLowerCase(),
        projectId: project.id,
        projectName: project.name,
        grantedBy: currentOwnerId,
        createdAt: new Date().toISOString(),
      });
      setAccessList((prev) => [...prev, acc]);
      setShareEmail('');
    } catch (err) {
      console.error('Failed to grant access:', err);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = totalComponentCost + billLabor + billDesign + billOther;
    const discounted = Math.max(0, subtotal - billDiscount);
    const taxAmount = Math.round((discounted * billTaxRate) / 100);
    const grandTotal = discounted + taxAmount;
    const invNum = `INV-${project.id.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const currentOwnerId = user?.uid || profile?.id || profile?.email || 'workshop-owner';
      const bill = await saveBill({
        projectId: project.id,
        projectName: project.name,
        invoiceNumber: invNum,
        ...(project.customerId ? { customerId: project.customerId } : {}),
        customerName: project.customerName || 'Valued Client',
        componentCost: totalComponentCost,
        labourCost: billLabor,
        designCost: billDesign,
        otherExpenses: billOther,
        subtotal,
        discount: billDiscount,
        taxRate: billTaxRate,
        taxAmount,
        grandTotal,
        currency: '₹',
        status: 'sent',
        dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        notes: `Workshop milestone invoice for ${project.name}`,
        ownerId: currentOwnerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setProjectBills((prev) => [bill, ...prev]);
      setShowAddBill(false);
    } catch (err) {
      console.error('Failed to save bill:', err);
    }
  };

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;

    const userMsgText = aiPrompt.trim();
    setAiPrompt('');
    setAiLoading(true);

    try {
      // Add user message to Firestore
      const userMsg = await addAiMessage({
        projectId: project.id,
        role: 'user',
        text: userMsgText,
        createdAt: new Date().toISOString(),
        ownerId: 'workshop-owner',
      });
      setAiHistory((prev) => [...prev, userMsg]);

      // Call server-side Gemini API
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsgText,
          projectContext: {
            name: project.name,
            projectType: project.projectType,
            description: project.description,
            status: project.status,
            components: components.map((c) => c.name),
            tasks: tasks.map((t) => `${t.title} [${t.completed ? 'Done' : 'Pending'}]`),
          },
          conversationHistory: aiHistory.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();
      const assistantText = data.reply || data.error || 'No response returned from Gemini API.';

      // Save assistant response to Firestore
      const botMsg = await addAiMessage({
        projectId: project.id,
        role: 'assistant',
        text: assistantText,
        createdAt: new Date().toISOString(),
        ownerId: 'workshop-owner',
      });
      setAiHistory((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Gemini chat error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const tabs: { id: WorkspaceTab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: '1. Overview', icon: LayoutDashboard },
    { id: 'customer', label: '2. Customer', icon: Users },
    { id: 'components', label: '3. Components', icon: Cpu, count: components.length },
    { id: 'billing', label: '4. Billing', icon: Receipt, count: projectBills.length },
    { id: 'diary', label: '5. Diary', icon: FileText, count: diary.length },
    { id: 'files', label: '6. Files', icon: Folder, count: files.length },
    { id: 'design', label: '7. Design', icon: Layers, count: designVersions.length },
    { id: 'checklist', label: '8. Checklist', icon: CheckSquare, count: tasks.length },
    { id: 'progress', label: '9. Progress', icon: TrendingUp },
    { id: 'ai', label: '10. AI Assistant', icon: Bot },
    { id: 'sharing', label: '11. Sharing', icon: Share2, count: accessList.length },
  ];

  return (
    <div id="project-workspace-container" className="space-y-5 pb-16">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            id="workspace-back-btn"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {project.projectType}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  project.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-600'
                    : project.status === 'in_progress'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {project.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">ID: {project.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              {project.name}
            </h1>
          </div>
        </div>

        {/* Progress & Quick Stats */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Automatic Progress</div>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {calculatedProgress}%
            </div>
          </div>
          <div className="w-28 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${calculatedProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Header (11 Sections) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`workspace-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div id="section-overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Project Scope & Engineering Brief
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] text-slate-400">Budget</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{project.budget?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] text-slate-400">Priority</div>
                  <div className="text-sm font-black uppercase text-indigo-600 dark:text-indigo-400">
                    {project.priority}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] text-slate-400">Start Date</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {project.startDate || 'Not set'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-[11px] text-slate-400">Target Due</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {project.expectedCompletionDate || 'Open'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Sidebar */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Execution Snapshot
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Checklist Tasks:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {completedTasks} / {totalTasks} Completed ({calculatedProgress}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Allocated Components:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {components.length} items (₹{totalComponentCost.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Engineering Diary Logs:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {diary.length} updates
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">CAD & Schematics:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {files.length} uploaded files
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Client Portal Access:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {accessList.length} permitted users
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('checklist')}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors text-center"
                  >
                    Manage Tasks Checklist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CUSTOMER ================= */}
      {activeTab === 'customer' && (
        <div id="section-customer" className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Linked Client Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customer organization responsible for this project order
              </p>
            </div>
          </div>

          {project.customerId ? (
            (() => {
              const cust = customers.find((c) => c.id === project.customerId);
              return (
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                        {cust?.name || project.customerName}
                      </h4>
                      {cust?.company && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                          {cust.company}
                        </p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200">
                      Active Customer
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Email Address</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {cust?.email || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Contact Phone</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {cust?.phone || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Workshop Notes</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {cust?.notes || 'Standard client terms apply.'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No customer linked
              </p>
              <p className="text-xs text-slate-500 mt-1">
                This is currently classified as an internal or unassigned workshop build.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: COMPONENTS ================= */}
      {activeTab === 'components' && (
        <div id="section-components" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Project Bill of Materials (BOM)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hardware modules, ICs, sensors and passive electronics allocated to this build
              </p>
            </div>
            <button
              id="add-project-component-btn"
              onClick={() => setShowAddComponent(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Component</span>
            </button>
          </div>

          {/* Components Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {components.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No electronics components allocated yet. Click "Allocate Component" above.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Component Name</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price (₹)</th>
                    <th className="px-4 py-3 text-right">Total (₹)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {components.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {c.name}
                        {c.isCustom && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Custom Item
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">{c.quantity}</td>
                      <td className="px-4 py-3 text-right font-mono">₹{c.unitPrice?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        ₹{c.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            await deleteProjectComponent(c.id);
                            setComponents((prev) => prev.filter((item) => item.id !== c.id));
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          title="Remove Component"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right uppercase text-[11px] text-slate-500">
                      Total Component Cost:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-indigo-600 dark:text-indigo-400">
                      ₹{totalComponentCost.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Add Component Modal */}
          {showAddComponent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Allocate Component to Build
                  </h4>
                  <button
                    onClick={() => setShowAddComponent(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddProjectComponent} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select from Electronics Catalog
                    </label>
                    <select
                      value={selectedCatalogCompId}
                      onChange={(e) => {
                        setSelectedCatalogCompId(e.target.value);
                        const found = catalogComponents.find((c) => c.id === e.target.value);
                        if (found) {
                          setCompUnitPrice(found.referencePrice);
                        }
                      }}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Or enter custom part below --</option>
                      {catalogComponents.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (₹{c.referencePrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedCatalogCompId && (
                    <>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Custom Component Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Custom 4-layer FR4 Shield"
                          value={customCompName}
                          onChange={(e) => setCustomCompName(e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Unit Price (₹)
                        </label>
                        <input
                          type="number"
                          value={compUnitPrice}
                          onChange={(e) => setCompUnitPrice(Number(e.target.value))}
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Quantity Required
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={compQty}
                      onChange={(e) => setCompQty(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddComponent(false)}
                      className="px-3 py-1.5 text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold"
                    >
                      Add to BOM
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: BILLING ================= */}
      {activeTab === 'billing' && (
        <div id="section-billing" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Project Billing & Invoices
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated calculation: Components + Labour + Design + Expenses - Discounts + Taxes
              </p>
            </div>
            <button
              id="create-project-invoice-btn"
              onClick={() => setShowAddBill(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New Invoice</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectBills.length === 0 ? (
              <div className="col-span-2 p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No invoices generated for this project yet.
              </div>
            ) : (
              projectBills.map((bill) => (
                <div
                  key={bill.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {bill.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
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

                    <div className="text-xl font-black text-slate-900 dark:text-white mb-2">
                      {bill.currency} {bill.grandTotal?.toLocaleString()}
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <div className="flex justify-between">
                        <span>Component Cost:</span>
                        <span className="font-mono">₹{bill.componentCost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labour & Assembly:</span>
                        <span className="font-mono">₹{bill.labourCost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Design & CAD:</span>
                        <span className="font-mono">₹{bill.designCost?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span>Grand Total:</span>
                        <span className="font-mono">₹{bill.grandTotal?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">Due: {bill.dueDate || 'On Delivery'}</span>
                    <button
                      onClick={() => onViewInvoice(bill)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Printable Invoice</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New GST & Manual Invoice Generator Modal */}
          {showAddBill && (
            <CreateBillModal
              projects={[project]}
              customers={customers}
              catalogComponents={catalogComponents}
              preselectedProjectId={project.id}
              onClose={() => setShowAddBill(false)}
              onSaveBill={async (billData) => {
                const bill = await saveBill(billData);
                setProjectBills((prev) => [bill, ...prev]);
                setShowAddBill(false);
              }}
            />
          )}
        </div>
      )}

      {/* ================= TAB 5: DIARY ================= */}
      {activeTab === 'diary' && (
        <div id="section-diary" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Project Engineering Diary
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log progress, bench findings, and milestones with granular privacy control
              </p>
            </div>
            <button
              id="add-diary-entry-btn"
              onClick={() => setShowAddDiary(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Diary Update</span>
            </button>
          </div>

          <div className="space-y-3">
            {diary.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No diary entries logged yet.
              </div>
            ) : (
              diary.map((entry) => (
                <div
                  key={entry.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {entry.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          entry.visibility === 'CUSTOMER_VISIBLE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {entry.visibility === 'CUSTOMER_VISIBLE' ? (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Client Visible
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Private
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {new Date(entry.date).toLocaleString()}
                      </span>
                      <button
                        onClick={async () => {
                          await deleteDiaryEntry(entry.id);
                          setDiary((prev) => prev.filter((d) => d.id !== entry.id));
                        }}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {entry.description}
                  </p>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {entry.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Diary Modal */}
          {showAddDiary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    Log Project Diary Entry
                  </h4>
                  <button onClick={() => setShowAddDiary(false)} className="text-slate-400">
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddDiary} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Completed initial firmware I2C bus scan"
                      value={diaryTitle}
                      onChange={(e) => setDiaryTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Log Notes & Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Detail the technical milestones, oscilloscope readings, or component testing results..."
                      value={diaryDesc}
                      onChange={(e) => setDiaryDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Firmware, I2C, ESP32"
                        value={diaryTags}
                        onChange={(e) => setDiaryTags(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Client Visibility *
                      </label>
                      <select
                        value={diaryVisibility}
                        onChange={(e) => setDiaryVisibility(e.target.value as VisibilityType)}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="CUSTOMER_VISIBLE">Customer Visible (Shared)</option>
                        <option value="PRIVATE">Private (Workshop Internal Only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDiary(false)}
                      className="px-3 py-1.5 text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold"
                    >
                      Save Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: FILES ================= */}
      {activeTab === 'files' && (
        <div id="section-files" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Project File Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Schematics, CAD drawings, Gerber zips, firmwares and datasheets
              </p>
            </div>
            <button
              id="upload-project-file-btn"
              onClick={() => setShowAddFile(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Attach File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.length === 0 ? (
              <div className="col-span-3 p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No files registered in Firestore yet.
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {file.fileType}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                          file.visibility === 'CUSTOMER_VISIBLE'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {file.visibility === 'CUSTOMER_VISIBLE' ? 'Shared' : 'Private'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {file.fileName}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Uploaded {new Date(file.uploadDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Download / Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={async () => {
                        await deleteProjectFile(file.id);
                        setFiles((prev) => prev.filter((f) => f.id !== file.id));
                      }}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add File Modal */}
          {showAddFile && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Attach Project Technical Document
                  </h4>
                  <button onClick={() => setShowAddFile(false)} className="text-slate-400">
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddFile} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      File Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Schematic_Rev2_ESP32.pdf"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      File Category / Type
                    </label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Schematic PDF">Schematic PDF</option>
                      <option value="Gerber ZIP">Gerber Production ZIP</option>
                      <option value="CAD 3D Model">CAD 3D Model (.STEP / .STL)</option>
                      <option value="Firmware Binary">Firmware Binary (.BIN / .HEX)</option>
                      <option value="Datasheet">Datasheet Document</option>
                      <option value="Client Specification">Client Specification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Document / Storage Link URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Client Portal Visibility
                    </label>
                    <select
                      value={fileVisibility}
                      onChange={(e) => setFileVisibility(e.target.value as VisibilityType)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="CUSTOMER_VISIBLE">Shared in Customer Portal</option>
                      <option value="PRIVATE">Private (Workshop Internal Only)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddFile(false)}
                      className="px-3 py-1.5 text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold"
                    >
                      Register File
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 7: DESIGN STUDIO ================= */}
      {activeTab === 'design' && (
        <div id="section-design" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Integrated Hardware Design Studio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                CAD versions, enclosure specs, materials, and direct launchers to EDA tools
              </p>
            </div>
            <button
              id="add-design-version-btn"
              onClick={() => setShowAddDesign(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Design Version</span>
            </button>
          </div>

          {/* External Engineering Launchers */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Launch Online EDA & Simulators
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: 'EasyEDA PCB', url: 'https://easyeda.com/editor', desc: 'Circuit & 2-Layer PCB' },
                { name: 'Wokwi Simulator', url: 'https://wokwi.com', desc: 'ESP32 & Arduino Sandbox' },
                { name: 'Onshape Cloud CAD', url: 'https://www.onshape.com', desc: 'Parametric 3D Solid' },
                { name: 'KiCad Hub', url: 'https://www.kicad.org', desc: 'Open Source EDA Suite' },
                { name: 'Tinkercad Circuits', url: 'https://www.tinkercad.com', desc: 'Interactive Breadboard' },
              ].map((tool, i) => (
                <a
                  key={i}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors group text-left"
                >
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{tool.name}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{tool.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Design Versions List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Design Versions & Mechanical Specs
            </h4>

            {designVersions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No design revisions recorded. Click "New Design Version" to log PCB and mechanical enclosure parameters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {designVersions.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-black rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                          {ver.versionNumber}
                        </span>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                          {ver.title}
                        </h5>
                      </div>
                      <button
                        onClick={async () => {
                          await deleteDesignVersion(ver.id);
                          setDesignVersions((prev) => prev.filter((d) => d.id !== ver.id));
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Dimensions</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {ver.dimensions || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Materials</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {ver.materials || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {ver.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {ver.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Design Modal */}
          {showAddDesign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Record Design Version
                  </h4>
                  <button onClick={() => setShowAddDesign(false)}>×</button>
                </div>

                <form onSubmit={handleAddDesignVersion} className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1">Version Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Enclosure with IP65 O-Ring Groove"
                      value={designTitle}
                      onChange={(e) => setDesignTitle(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Version ID</label>
                      <input
                        type="text"
                        value={versionNumber}
                        onChange={(e) => setVersionNumber(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Dimensions</label>
                      <input
                        type="text"
                        value={designDimensions}
                        onChange={(e) => setDesignDimensions(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Materials</label>
                    <input
                      type="text"
                      value={designMaterials}
                      onChange={(e) => setDesignMaterials(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={designNotes}
                      onChange={(e) => setDesignNotes(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDesign(false)}
                      className="px-3 py-1.5 text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold"
                    >
                      Save Version
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 8: CHECKLIST & AUTO PROGRESS ================= */}
      {activeTab === 'checklist' && (
        <div id="section-checklist" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Automatic Progress Engine</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Current: <span className="font-bold text-indigo-600 dark:text-indigo-400">{completedTasks}</span> of{' '}
                <span className="font-bold">{totalTasks}</span> tasks completed ={' '}
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{calculatedProgress}%</span>.
                Progress is computed automatically from checklist completion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="ai-generate-tasks-btn"
                onClick={handleGenerateAiChecklist}
                disabled={aiGeneratingTasks}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiGeneratingTasks ? 'Generating...' : 'Gemini AI Tasks'}</span>
              </button>
              <button
                id="add-task-manual-btn"
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No tasks logged yet. Click "Gemini AI Tasks" to automatically generate an engineering roadmap!
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 flex items-start gap-3 transition-colors ${
                    task.completed ? 'bg-slate-50/50 dark:bg-slate-800/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id, task.completed)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.category && (
                        <span className="px-2 py-0.2 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {task.category}
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      await deleteTask(task.id, project.id);
                      setTasks((prev) => prev.filter((t) => t.id !== task.id));
                    }}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Task Modal */}
          {showAddTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Add Checklist Task
                  </h4>
                  <button onClick={() => setShowAddTask(false)}>×</button>
                </div>

                <form onSubmit={handleAddTask} className="space-y-3">
                  <div>
                    <label className="block font-semibold mb-1">Task Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Solder SMD decoupling capacitors"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Category</label>
                      <select
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="Requirements">Requirements</option>
                        <option value="Circuit design">Circuit design</option>
                        <option value="CAD design">CAD design</option>
                        <option value="Component procurement">Component procurement</option>
                        <option value="Firmware">Firmware</option>
                        <option value="Hardware assembly">Hardware assembly</option>
                        <option value="Testing">Testing</option>
                        <option value="Documentation">Documentation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Priority</label>
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value as any)}
                        className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="task-cust-vis"
                      checked={taskCustomerVisible}
                      onChange={(e) => setTaskCustomerVisible(e.target.checked)}
                      className="rounded text-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="task-cust-vis" className="text-slate-600 dark:text-slate-300">
                      Show in Customer Portal
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      className="px-3 py-1.5 text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 9: PROGRESS ================= */}
      {activeTab === 'progress' && (
        <div id="section-progress" className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Project Execution Progress Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Computed strictly from Firestore checklist tasks without manual tampering
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Overall Checklist Completion
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {calculatedProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden mb-3">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${calculatedProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>{completedTasks} Tasks Finalized</span>
              <span>{totalTasks - completedTasks} Tasks Pending</span>
            </div>
          </div>

          {/* Category distribution */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Category Breakdown
            </h4>

            {['Requirements', 'Circuit design', 'CAD design', 'Firmware', 'Hardware assembly', 'Testing'].map(
              (cat) => {
                const catTasks = tasks.filter((t) => t.category === cat);
                const catDone = catTasks.filter((t) => t.completed).length;
                const catPct = catTasks.length > 0 ? Math.round((catDone / catTasks.length) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {cat} ({catDone}/{catTasks.length})
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{catPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${catPct}%` }} />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 10: AI ASSISTANT ================= */}
      {activeTab === 'ai' && (
        <div id="section-ai" className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[600px] overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  KKS Workshop AI Consultant (Gemini 3.8 Flash)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Specialized in ESP32, Arduino, circuit calculations, schematics & troubleshooting
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              Project Grounded
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {aiHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Bot className="w-10 h-10 text-indigo-400" />
                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Ready to assist with "{project.name}"
                </h5>
                <p className="text-xs text-slate-500 max-w-sm">
                  Ask me for circuit troubleshooting, ESP32/Arduino code snippets, sensor pullup calculations, or project documentation summaries.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {[
                    'Explain I2C bus wiring and pull-up values',
                    'Generate ESP32 FreeRTOS sensor sampling snippet',
                    'How do I debounce noisy push buttons in hardware?',
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setAiPrompt(preset)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              aiHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-2xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {aiLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-400">
                <Bot className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Consulting Gemini engineering models...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendAiMessage} className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask an engineering, circuit, or code question..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={aiLoading || !aiPrompt.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= TAB 11: SHARING ================= */}
      {activeTab === 'sharing' && (
        <div id="section-sharing" className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Customer Portal Sharing & Access Rights
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Permit client email accounts to view this project in their dedicated Customer Portal
            </p>
          </div>

          <form onSubmit={handleGrantAccess} className="flex gap-3 max-w-lg">
            <input
              type="email"
              required
              placeholder="client@example.com"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
            >
              Grant Access
            </button>
          </form>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Access Grants ({accessList.length})
            </h4>

            {accessList.length === 0 ? (
              <p className="text-xs text-slate-500">
                No external clients currently granted access.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                {accessList.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {acc.customerEmail}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        Granted {new Date(acc.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={async () => {
                        await revokeCustomerAccess(acc.id);
                        setAccessList((prev) => prev.filter((a) => a.id !== acc.id));
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
