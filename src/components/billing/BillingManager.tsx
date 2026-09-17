import React, { useState } from 'react';
import type { BillingRecord, Project, Customer, ComponentItem } from '../../types';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Trash2,
  FileSpreadsheet,
  Percent,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { CreateBillModal } from './CreateBillModal';

interface BillingManagerProps {
  bills: BillingRecord[];
  projects: Project[];
  customers: Customer[];
  catalogComponents?: ComponentItem[];
  onViewInvoice: (bill: BillingRecord) => void;
  onUpdateStatus: (id: string, status: 'draft' | 'sent' | 'paid') => Promise<void>;
  onDeleteBill: (id: string) => Promise<void>;
  onSelectProject: (projectId: string) => void;
  onCreateBill?: (data: Omit<BillingRecord, 'id'>) => Promise<void>;
}

export function BillingManager({
  bills,
  projects,
  customers,
  catalogComponents = [],
  onViewInvoice,
  onUpdateStatus,
  onDeleteBill,
  onSelectProject,
  onCreateBill,
}: BillingManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'draft' | 'sent' | 'paid'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = bills.filter((b) => {
    const matchesSearch =
      b.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (b.customerName && b.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (b.projectName && b.projectName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = bills.reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const totalPaid = bills
    .filter((b) => b.status === 'paid')
    .reduce((acc, b) => acc + (b.grandTotal || 0), 0);
  const totalPending = totalInvoiced - totalPaid;
  const totalGstCollected = bills.reduce((acc, b) => acc + (b.taxAmount || 0), 0);

  return (
    <div id="billing-manager-container" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workshop Billing & Invoices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manual and automated itemized invoices with genuine Indian GST (CGST + SGST / IGST) calculations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onCreateBill && (
            <button
              id="create-manual-invoice-btn"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Manual Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Invoiced
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            ₹{totalInvoiced.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{bills.length} total invoices issued</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Collected Revenue
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            ₹{totalPaid.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            {bills.filter((b) => b.status === 'paid').length} settled bills
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Pending Balance
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            ₹{totalPending.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting client clearance</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total GST Levied</span>
            <Percent className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            ₹{totalGstCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-500 mt-1 font-medium">
            CGST + SGST & IGST recorded
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search invoice number, client name, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'draft', 'sent', 'paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No invoices found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create a manual invoice with custom line items, enter prices, and apply genuine GST rates, or generate invoices directly from your project BOM.
          </p>
          {onCreateBill && (
            <div className="pt-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Manual Invoice</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {filtered.map((bill) => {
            const prj = projects.find((p) => p.id === bill.projectId);
            const itemCount = bill.items?.length || 0;

            return (
              <div
                key={bill.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {bill.invoiceNumber}
                    </span>

                    <select
                      value={bill.status}
                      onChange={(e) => onUpdateStatus(bill.id, e.target.value as any)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase cursor-pointer border-none ${
                        bill.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : bill.status === 'sent'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      <option value="draft">DRAFT</option>
                      <option value="sent">SENT</option>
                      <option value="paid">PAID</option>
                    </select>

                    {/* GST Badge */}
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {bill.taxType === 'IGST'
                        ? `IGST ${bill.taxRate}%`
                        : bill.taxType === 'EXEMPT'
                        ? 'GST Exempt (0%)'
                        : `CGST+SGST ${bill.taxRate}%`}
                    </span>

                    {itemCount > 0 && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        • {itemCount} manual item{itemCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {bill.customerName || 'Direct Client'}
                    </span>
                    {bill.customerGst && (
                      <span className="font-mono text-[11px] text-slate-400">
                        ({bill.customerGst})
                      </span>
                    )}
                    <span>•</span>
                    {bill.projectId && bill.projectId !== 'direct-sale' ? (
                      <span
                        onClick={() => onSelectProject(bill.projectId)}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                      >
                        {prj?.name || bill.projectName || 'View Project'}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Direct Workshop Sale</span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Issued: {new Date(bill.createdAt).toLocaleDateString()}</span>
                    {bill.dueDate && <span>• Due: {bill.dueDate}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-5">
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      ₹{bill.grandTotal?.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Subtotal ₹{bill.subtotal?.toLocaleString()} + GST ₹{bill.taxAmount?.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewInvoice(bill)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors"
                      title="View printable GST invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </button>
                    <button
                      onClick={() => onDeleteBill(bill.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      title="Delete invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Bill Creator Modal */}
      {showCreateModal && onCreateBill && (
        <CreateBillModal
          projects={projects}
          customers={customers}
          catalogComponents={catalogComponents}
          onClose={() => setShowCreateModal(false)}
          onSaveBill={onCreateBill}
        />
      )}
    </div>
  );
}
