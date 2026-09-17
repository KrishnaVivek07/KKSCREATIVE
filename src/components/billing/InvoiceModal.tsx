import React from 'react';
import type { BillingRecord, Project, Customer } from '../../types';
import {
  Printer,
  X,
  Cpu,
  Wrench,
  Palette,
  FileText,
  Building2,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { numberToWordsIndian } from '../../utils/gstUtils';
import { KksLogo } from '../common/KksLogo';

interface InvoiceModalProps {
  bill: BillingRecord;
  project?: Project;
  customer?: Customer;
  onClose: () => void;
}

export function InvoiceModal({ bill, project, customer, onClose }: InvoiceModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const hasManualItems = bill.items && bill.items.length > 0;
  const workshopGst = bill.workshopGst || '36AAECK9821M1Z5';
  const clientGst = bill.customerGst || (customer as any)?.gstNumber || '';
  const amountWords = numberToWordsIndian(bill.grandTotal || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Controls Bar (Hidden during print) */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              Tax Invoice Viewer: {bill.invoiceNumber}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                bill.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : bill.status === 'sent'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {bill.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Invoice Document */}
        <div id="printable-invoice" className="p-8 sm:p-12 space-y-7 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <KksLogo size="sm" />
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  KKS
                </h1>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                Innovate your ideas with KKS
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Engineering, Robotics, IoT Hardware R&D & Prototyping Workshop
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plot 104, Tech Park Boulevard • workshop@kkscreativehub.com
              </p>
              <div className="pt-1">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-bold border border-indigo-200 dark:border-indigo-800">
                  GSTIN: {workshopGst}
                </span>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wide">
                TAX INVOICE
              </div>
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                #{bill.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Invoice Date: {new Date(bill.createdAt).toLocaleDateString()}
              </div>
              {bill.dueDate && (
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Payment Due: {bill.dueDate}
                </div>
              )}
            </div>
          </div>

          {/* Bill To & Project Info */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                Billed To (Client Details)
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {customer?.name || bill.customerName || 'Direct Client'}
              </h3>
              {(customer?.company) && (
                <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {customer.company}
                </p>
              )}
              {clientGst && (
                <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  Client GSTIN: {clientGst}
                </p>
              )}
              {(bill.customerAddress || customer?.address) && (
                <p className="text-slate-500 mt-1">{bill.customerAddress || customer?.address}</p>
              )}
              {customer?.email && <p className="text-slate-500">{customer.email}</p>}
              {customer?.phone && <p className="text-slate-500">{customer.phone}</p>}
            </div>

            <div className="sm:text-right">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                Project / Order Reference
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {project?.name || bill.projectName || 'Hardware Engineering Prototyping'}
              </h4>
              <p className="text-slate-500">
                Type: {project?.projectType || 'Custom Hardware Build'}
              </p>
              {bill.projectId && bill.projectId !== 'direct-sale' && (
                <p className="text-slate-400 font-mono text-[11px]">
                  Ref ID: {bill.projectId.slice(0, 8)}
                </p>
              )}
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span>Supply Type:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {bill.taxType === 'IGST'
                    ? 'Inter-State (IGST)'
                    : bill.taxType === 'EXEMPT'
                    ? 'Exempt / Zero-rated'
                    : 'Intra-State (CGST + SGST)'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-3 w-8 text-center">#</th>
                  <th className="px-4 py-3">Description of Goods / Services</th>
                  <th className="px-3 py-3 w-20 text-center">HSN/SAC</th>
                  <th className="px-3 py-3 w-16 text-right">Qty</th>
                  <th className="px-4 py-3 w-28 text-right">Rate (₹)</th>
                  <th className="px-4 py-3 w-32 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {hasManualItems ? (
                  bill.items!.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-3 py-2.5 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        {item.description}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-500 text-[11px]">
                        {item.hsnCode || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        ₹{item.unitPrice?.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(item.total || item.quantity * item.unitPrice)?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  // Legacy Fallback for bills created with category blocks
                  <>
                    {bill.componentCost > 0 && (
                      <tr>
                        <td className="px-3 py-2.5 text-center text-slate-400 font-mono">1</td>
                        <td className="px-4 py-2.5 font-semibold flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Electronics & Hardware Bill of Materials (BOM)</span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-slate-500 text-[11px]">
                          8542
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">1</td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          ₹{bill.componentCost?.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">
                          ₹{bill.componentCost?.toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </>
                )}

                {/* Additional services rows */}
                {bill.labourCost > 0 && (
                  <tr>
                    <td className="px-3 py-2.5 text-center text-slate-400 font-mono">
                      {hasManualItems ? bill.items!.length + 1 : 2}
                    </td>
                    <td className="px-4 py-2.5 font-semibold flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Assembly, Soldering & Bench Engineering Labour</span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-500 text-[11px]">
                      998719
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">1</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      ₹{bill.labourCost?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">
                      ₹{bill.labourCost?.toLocaleString()}
                    </td>
                  </tr>
                )}

                {bill.designCost > 0 && (
                  <tr>
                    <td className="px-3 py-2.5 text-center text-slate-400 font-mono">
                      {hasManualItems ? bill.items!.length + (bill.labourCost > 0 ? 2 : 1) : 3}
                    </td>
                    <td className="px-4 py-2.5 font-semibold flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Hardware CAD & PCB Design Engineering</span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-500 text-[11px]">
                      998314
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">1</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      ₹{bill.designCost?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">
                      ₹{bill.designCost?.toLocaleString()}
                    </td>
                  </tr>
                )}

                {bill.otherExpenses > 0 && (
                  <tr>
                    <td className="px-3 py-2.5 text-center text-slate-400 font-mono">
                      {hasManualItems
                        ? bill.items!.length +
                          (bill.labourCost > 0 ? 1 : 0) +
                          (bill.designCost > 0 ? 1 : 0) +
                          1
                        : 4}
                    </td>
                    <td className="px-4 py-2.5 font-semibold flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Consumables & Shipping Logistics</span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-500 text-[11px]">
                      996812
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">1</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      ₹{bill.otherExpenses?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">
                      ₹{bill.otherExpenses?.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1 text-xs space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">
                Total Amount In Words
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200 italic">
                {amountWords}
              </p>
            </div>

            <div className="w-full sm:w-80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Taxable Subtotal:</span>
                <span className="font-mono">₹{bill.subtotal?.toLocaleString()}</span>
              </div>

              {bill.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Client Discount:</span>
                  <span className="font-mono">-₹{bill.discount?.toLocaleString()}</span>
                </div>
              )}

              {/* Genuine Indian GST Breakdown */}
              {(bill.taxType === 'CGST_SGST' || (bill.cgstAmount !== undefined && bill.sgstAmount !== undefined)) && (
                <>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 pl-2">
                    <span>Central GST (CGST @ {bill.cgstRate ?? (bill.taxRate / 2)}%):</span>
                    <span className="font-mono font-semibold">
                      ₹{(bill.cgstAmount ?? (bill.taxAmount / 2))?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300 pl-2">
                    <span>State GST (SGST @ {bill.sgstRate ?? (bill.taxRate / 2)}%):</span>
                    <span className="font-mono font-semibold">
                      ₹{(bill.sgstAmount ?? (bill.taxAmount / 2))?.toLocaleString()}
                    </span>
                  </div>
                </>
              )}

              {(bill.taxType === 'IGST' || (bill.taxType !== 'CGST_SGST' && bill.igstAmount !== undefined)) && (
                <div className="flex justify-between text-slate-700 dark:text-slate-300 pl-2">
                  <span>Integrated GST (IGST @ {bill.igstRate ?? bill.taxRate}%):</span>
                  <span className="font-mono font-semibold">
                    ₹{(bill.igstAmount ?? bill.taxAmount)?.toLocaleString()}
                  </span>
                </div>
              )}

              {bill.taxType === 'EXEMPT' && (
                <div className="flex justify-between text-slate-500 pl-2 italic">
                  <span>GST:</span>
                  <span>Exempt (0%)</span>
                </div>
              )}

              {bill.taxType === undefined && bill.cgstAmount === undefined && bill.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-2">
                  <span>GST ({bill.taxRate}%):</span>
                  <span className="font-mono">₹{bill.taxAmount?.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-base font-black text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  ₹{bill.grandTotal?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Payment Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px]">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">Bank & Payment Details:</p>
              <p className="text-slate-500">Beneficiary: KKS Creative Hub Workshop</p>
              <p className="text-slate-500">Bank: HDFC Bank • Account: 9812003847291</p>
              <p className="text-slate-500">IFSC: HDFC0001824 • UPI: kkscreativehub@hdfc</p>
              {bill.notes && (
                <p className="pt-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  Note: {bill.notes}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between text-right">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  For KKS Creative Hub
                </p>
                <p className="text-slate-400 text-[10px]">Authorized Signatory / Workshop Seal</p>
              </div>
              <div className="pt-8">
                <span className="font-mono text-[10px] text-slate-400 border-t border-dashed border-slate-300 dark:border-slate-700 px-6 pt-1 inline-block">
                  Signatory Signature
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
