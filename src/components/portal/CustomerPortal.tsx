import React, { useState, useEffect } from 'react';
import type {
  Project,
  Customer,
  BillingRecord,
  DiaryEntry,
  ProjectFile,
  TaskItem,
} from '../../types';
import {
  getProjects,
  getDiaryEntries,
  getProjectFiles,
  getTasks,
  getBills,
  getCustomerAccessByEmail,
} from '../../firebase/services';
import {
  FolderKanban,
  CheckSquare,
  FileText,
  Folder,
  Receipt,
  Download,
  Eye,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  Printer,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { InvoiceModal } from '../billing/InvoiceModal';

interface CustomerPortalProps {
  currentUserEmail?: string;
  customers: Customer[];
}

export function CustomerPortal({ currentUserEmail = 'client@company.com', customers }: CustomerPortalProps) {
  const [activeEmail, setActiveEmail] = useState(currentUserEmail);
  const [accessibleProjects, setAccessibleProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected project customer-visible records
  const [visibleDiary, setVisibleDiary] = useState<DiaryEntry[]>([]);
  const [visibleFiles, setVisibleFiles] = useState<ProjectFile[]>([]);
  const [visibleTasks, setVisibleTasks] = useState<TaskItem[]>([]);
  const [visibleBills, setVisibleBills] = useState<BillingRecord[]>([]);
  const [viewingInvoice, setViewingInvoice] = useState<BillingRecord | null>(null);

  // Customer profile info
  const currentCustomer = customers.find((c) => c.email.toLowerCase() === activeEmail.toLowerCase());

  // Load projects that this customer has access to
  const loadCustomerPortalData = async () => {
    setLoading(true);
    try {
      // 1. Fetch access grants for this email
      const accessGrants = (await getCustomerAccessByEmail(activeEmail)) || [];
      const grantedProjectIds = new Set(accessGrants.map((g: { projectId: string }) => g.projectId));

      // 2. Also check projects where customerId matches customer with this email
      const allProjects = await getProjects();
      const customerProjects = allProjects.filter(
        (p) =>
          grantedProjectIds.has(p.id) ||
          (currentCustomer && p.customerId === currentCustomer.id) ||
          (p.customerName && currentCustomer && p.customerName.toLowerCase() === currentCustomer.name.toLowerCase())
      );

      setAccessibleProjects(customerProjects);
      if (customerProjects.length > 0 && !selectedProject) {
        setSelectedProject(customerProjects[0]);
      } else if (customerProjects.length === 0) {
        setSelectedProject(null);
      }
    } catch (err) {
      console.error('Error loading customer portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerPortalData();
  }, [activeEmail, currentCustomer]);

  // When selected project changes, load its PUBLIC/CUSTOMER_VISIBLE items
  useEffect(() => {
    if (!selectedProject) return;

    const loadProjectDetails = async () => {
      try {
        // Only load customerVisible = true
        const [d, f, t, b] = await Promise.all([
          getDiaryEntries(selectedProject.id, true), // customerVisibleOnly = true
          getProjectFiles(selectedProject.id, true), // customerVisibleOnly = true
          getTasks(selectedProject.id, true), // customerVisibleOnly = true
          getBills(selectedProject.id),
        ]);
        setVisibleDiary(d);
        setVisibleFiles(f);
        setVisibleTasks(t);
        // Only show sent or paid bills to client
        setVisibleBills(b.filter((bill) => bill.status !== 'draft'));
      } catch (err) {
        console.error('Error loading project details for customer:', err);
      }
    };

    loadProjectDetails();
  }, [selectedProject?.id]);

  const completedTasks = visibleTasks.filter((t) => t.completed).length;

  return (
    <div id="customer-portal-container" className="space-y-6 pb-12">
      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Secure Customer Portal (Zero Cross-Customer Exposure)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              You are authenticated as{' '}
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{activeEmail}</span>.
              Internal engineering notes and unassigned files are strictly hidden.
            </p>
          </div>
        </div>

        {/* Quick Email Selector for Testing Multi-Customer Separation */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-slate-500">Simulate Client:</span>
          <select
            value={activeEmail}
            onChange={(e) => {
              setActiveEmail(e.target.value);
              setSelectedProject(null);
            }}
            className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.email}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left Projects List, Right Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Accessible Projects */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Your Assigned Projects ({accessibleProjects.length})
          </h3>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading your builds...</div>
          ) : accessibleProjects.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No active engineering projects linked to your email ({activeEmail}).
            </div>
          ) : (
            accessibleProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  selectedProject?.id === p.id
                    ? 'bg-white dark:bg-slate-900 border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    {p.projectType}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {p.progress || 0}%
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                  {p.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {p.description}
                </p>
              </div>
            ))
          )}

          {/* Workshop Contact Box */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 mt-4">
            <h4 className="font-bold text-slate-900 dark:text-white">Workshop Engineering Desk</h4>
            <p className="text-slate-500 text-[11px]">Direct questions to your lead engineer:</p>
            <div className="pt-1 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>workshop@kkscreativehub.com</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-500" />
                <span>+91 98400 11223</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Project Live Progress & Deliverables */}
        <div className="lg:col-span-3 space-y-6">
          {selectedProject ? (
            <>
              {/* Project Header Banner */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {selectedProject.projectType}
                      </span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600">
                        {selectedProject.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedProject.name}
                    </h2>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Completion Milestone</div>
                    <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {selectedProject.progress || 0}%
                    </div>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedProject.progress || 0}%` }}
                  />
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Public Checklist Milestones */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                      <span>Engineering Milestones & Checklist</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live status updates from the workshop bench
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {completedTasks} / {visibleTasks.length} Completed
                  </span>
                </div>

                <div className="space-y-2">
                  {visibleTasks.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No public tasks published yet.</div>
                  ) : (
                    visibleTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                              task.completed ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            {task.completed && '✓'}
                          </div>
                          <span
                            className={`font-semibold ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {task.category || 'Engineering'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Public Diary Log */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Workshop Progress Logs</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chronological updates logged by workshop technicians
                  </p>
                </div>

                <div className="space-y-3">
                  {visibleDiary.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No progress logs published yet.</div>
                  ) : (
                    visibleDiary.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                            {entry.title}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shared Technical Files */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Folder className="w-4 h-4 text-indigo-600" />
                    <span>Shared Deliverables & Documents</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Approved schematics, Gerber zips, 3D renderings and datasheets
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleFiles.length === 0 ? (
                    <div className="col-span-2 text-xs text-slate-400 italic">
                      No files shared for customer download yet.
                    </div>
                  ) : (
                    visibleFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                            {file.fileName}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{file.fileType}</div>
                        </div>

                        <a
                          href={file.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Get</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Project Invoices */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    <span>Project Invoices & Billing</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official milestone invoices issued for this hardware build
                  </p>
                </div>

                <div className="space-y-3">
                  {visibleBills.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No invoices issued yet.</div>
                  ) : (
                    visibleBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {bill.invoiceNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                                bill.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {bill.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Issued {new Date(bill.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                              ₹{bill.grandTotal?.toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => setViewingInvoice(bill)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Select a project from the left
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View live engineering updates, tasks, and downloadable files.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {viewingInvoice && (
        <InvoiceModal
          bill={viewingInvoice}
          project={selectedProject || undefined}
          customer={currentCustomer || undefined}
          onClose={() => setViewingInvoice(null)}
        />
      )}
    </div>
  );
}
