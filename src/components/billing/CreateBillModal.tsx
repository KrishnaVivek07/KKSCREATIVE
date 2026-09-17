import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { BillingRecord, BillingItem, Project, Customer, ComponentItem } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  Building,
  User,
  Package,
  Layers,
  Percent,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  calculateGst,
  COMMON_GST_SLABS,
  COMMON_HSN_CODES,
  numberToWordsIndian,
} from '../../utils/gstUtils';

interface CreateBillModalProps {
  projects: Project[];
  customers: Customer[];
  catalogComponents?: ComponentItem[];
  preselectedProjectId?: string;
  onClose: () => void;
  onSaveBill: (billData: Omit<BillingRecord, 'id'>) => Promise<void>;
}

export function CreateBillModal({
  projects,
  customers,
  catalogComponents = [],
  preselectedProjectId,
  onClose,
  onSaveBill,
}: CreateBillModalProps) {
  const { user, profile } = useAuth();
  // 1. Basic Invoice Info
  const [invoiceNumber, setInvoiceNumber] = useState(
    () => `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [dueDate, setDueDate] = useState(
    () => new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid'>('sent');

  // 2. Project Association (Optional)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(preselectedProjectId || '');

  // 3. Customer Information
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerCompany, setCustomerCompany] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerGst, setCustomerGst] = useState<string>('');
  const [workshopGst, setWorkshopGst] = useState<string>('36AAECK9821M1Z5');

  // 4. Line Items (Manual items added by user)
  const [items, setItems] = useState<BillingItem[]>([
    {
      id: 'item-1',
      description: 'Custom Electronics Hardware Assembly & Fabrication',
      hsnCode: '8542',
      quantity: 1,
      unitPrice: 5000,
      total: 5000,
    },
  ]);

  // 5. Additional Engineering Expenses (Optional)
  const [labourCost, setLabourCost] = useState<number>(0);
  const [designCost, setDesignCost] = useState<number>(0);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // 6. GST Configuration
  const [taxType, setTaxType] = useState<'CGST_SGST' | 'IGST' | 'EXEMPT'>('CGST_SGST');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);

  // 7. Notes & Terms
  const [notes, setNotes] = useState<string>(
    'Thank you for your business. Payment is due within 15 days of invoice date via NEFT/RTGS/UPI.'
  );

  const [saving, setSaving] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [catalogSearchOpen, setCatalogSearchOpen] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState('');

  // Handle customer dropdown change
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerCompany(cust.company || '');
      setCustomerEmail(cust.email || '');
      setCustomerPhone(cust.phone || '');
      setCustomerAddress(cust.address || '');
    }
  };

  // If preselected project, auto-pick its customer
  React.useEffect(() => {
    if (preselectedProjectId) {
      const prj = projects.find((p) => p.id === preselectedProjectId);
      if (prj) {
        if (prj.customerId) {
          handleCustomerSelect(prj.customerId);
        } else if (prj.customerName) {
          setCustomerName(prj.customerName);
        }
      }
    }
  }, [preselectedProjectId, projects]);

  // Line item manipulation
  const handleAddItem = () => {
    const newItem: BillingItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: '',
      hsnCode: '8542',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof BillingItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const q = field === 'quantity' ? Number(value) : item.quantity;
          const p = field === 'unitPrice' ? Number(value) : item.unitPrice;
          updated.total = Math.round(q * p * 100) / 100;
        }
        return updated;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) {
      // Keep at least one empty item
      setItems([
        {
          id: `item-${Date.now()}`,
          description: '',
          hsnCode: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Quick insert from Master Catalog
  const handleSelectCatalogComponent = (comp: ComponentItem) => {
    const newItem: BillingItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: `${comp.name}${comp.modelNumber ? ` (${comp.modelNumber})` : ''}`,
      hsnCode: comp.category === 'Microcontrollers' ? '8542' : '9031',
      quantity: 1,
      unitPrice: comp.referencePrice || 0,
      total: comp.referencePrice || 0,
    };
    setItems((prev) => [...prev, newItem]);
    setCatalogSearchOpen(false);
  };

  // Calculations
  const itemsSubtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.total || 0), 0);
  }, [items]);

  const rawSubtotal = itemsSubtotal + labourCost + designCost + otherExpenses;

  const gstResult = useMemo(() => {
    return calculateGst(rawSubtotal, discount, taxRate, taxType);
  }, [rawSubtotal, discount, taxRate, taxType]);

  const grandTotal = gstResult.grandTotal;
  const amountInWords = useMemo(() => numberToWordsIndian(grandTotal), [grandTotal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setErrorBanner(null);

    const trimmedClient = customerName.trim();
    if (!trimmedClient) {
      setErrorBanner('Please specify a Client or Customer name for this invoice.');
      return;
    }

    setSaving(true);
    try {
      const currentProject = projects.find((p) => p.id === selectedProjectId);

      // Sanitize line items to ensure no undefined or NaN values
      const sanitizedItems: BillingItem[] = items.map((item, idx) => {
        const itemQty = Math.max(1, Number(item.quantity) || 1);
        const itemPrice = Math.max(0, Number(item.unitPrice) || 0);
        const itemTotal = Math.round(itemQty * itemPrice * 100) / 100;
        const baseItem: BillingItem = {
          id: item.id || `item-${Date.now()}-${idx}`,
          description: (item.description || '').trim() || `Hardware Line Item #${idx + 1}`,
          hsnCode: (item.hsnCode || '').trim() || '8542',
          quantity: itemQty,
          unitPrice: itemPrice,
          total: itemTotal,
        };
        return baseItem;
      });

      const billData: Omit<BillingRecord, 'id'> = {
        projectId: selectedProjectId.trim() || 'direct-sale',
        projectName: currentProject?.name || (selectedProjectId ? 'Workshop Project' : 'Direct Hardware Invoicing'),
        invoiceNumber: invoiceNumber.trim() || `INV-${Date.now()}`,
        customerName: trimmedClient,
        componentCost: Number(itemsSubtotal) || 0,
        labourCost: Number(labourCost) || 0,
        designCost: Number(designCost) || 0,
        otherExpenses: Number(otherExpenses) || 0,
        subtotal: Number(rawSubtotal) || 0,
        discount: Number(discount) || 0,
        taxType,
        taxRate: Number(gstResult.taxRate) || 0,
        cgstRate: Number(gstResult.cgstRate) || 0,
        cgstAmount: Number(gstResult.cgstAmount) || 0,
        sgstRate: Number(gstResult.sgstRate) || 0,
        sgstAmount: Number(gstResult.sgstAmount) || 0,
        igstRate: Number(gstResult.igstRate) || 0,
        igstAmount: Number(gstResult.igstAmount) || 0,
        taxAmount: Number(gstResult.totalGst) || 0,
        grandTotal: Number(gstResult.grandTotal) || 0,
        currency: '₹',
        status,
        dueDate: dueDate || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        items: sanitizedItems,
        ownerId: user?.uid || profile?.id || profile?.email || 'owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Only assign optional fields if they have truthy string values (never undefined)
      if (selectedCustomerId.trim()) {
        billData.customerId = selectedCustomerId.trim();
      }
      if (customerGst.trim()) {
        billData.customerGst = customerGst.trim();
      }
      if (customerAddress.trim()) {
        billData.customerAddress = customerAddress.trim();
      }
      if (workshopGst.trim()) {
        billData.workshopGst = workshopGst.trim();
      }
      if (notes.trim()) {
        billData.notes = notes.trim();
      }

      await onSaveBill(billData);
      onClose();
    } catch (err) {
      console.error('Failed to create manual bill:', err);
      const msg = err instanceof Error ? err.message : 'Database error occurred. Please try again.';
      setErrorBanner(`Failed to save invoice: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredCatalog = catalogComponents
    .filter(
      (c) =>
        c.name.toLowerCase().includes(catalogFilter.toLowerCase()) ||
        c.category.toLowerCase().includes(catalogFilter.toLowerCase())
    )
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Create Manual GST Invoice</h2>
              <p className="text-xs text-indigo-200">
                Enter itemized bill items, custom unit prices, and genuine GST breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {errorBanner && (
            <div
              id="invoice-error-banner"
              className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start justify-between gap-3 text-red-700 dark:text-red-300 animate-in fade-in duration-200"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error Generating Invoice</p>
                  <p className="text-[11px] mt-0.5 opacity-90">{errorBanner}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Top Section: Invoice Number, Dates, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Number *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="sent">SENT (Pending Clearance)</option>
                <option value="paid">PAID (Settled)</option>
                <option value="draft">DRAFT</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Link to Project (Optional)
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None (Direct Over-The-Counter Sale)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer & Workshop Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                <span>Billed To Client Information</span>
              </span>

              {customers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Pick saved client:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">-- Choose registered customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Client / Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra / Tech Corp"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Company / Entity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chandra Embedded Labs"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Client GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  value={customerGst}
                  onChange={(e) => setCustomerGst(e.target.value.toUpperCase())}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  placeholder="Street, City, State, PIN Code"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Workshop GSTIN
                </label>
                <input
                  type="text"
                  placeholder="Workshop GSTIN"
                  value={workshopGst}
                  onChange={(e) => setWorkshopGst(e.target.value.toUpperCase())}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white uppercase"
                />
              </div>
            </div>
          </div>

          {/* Itemized Line Items Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-500" />
                  <span>Invoice Line Items & Manual Prices</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Enter items, quantities, and individual prices manually.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {catalogComponents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearchOpen(!catalogSearchOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Pick from Component Catalog</span>
                  </button>
                )}

                <button
                  type="button"
                  id="add-invoice-line-item-btn"
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>
            </div>

            {/* Quick Catalog Search Popover */}
            {catalogSearchOpen && (
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                    Search 118+ Hardware Components Catalog to Auto-fill
                  </span>
                  <button
                    type="button"
                    onClick={() => setCatalogSearchOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Type to filter ESP32, STM32, DHT22, Relays, OLED..."
                  value={catalogFilter}
                  onChange={(e) => setCatalogFilter(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {filteredCatalog.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCatalogComponent(c)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-slate-200 dark:border-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{c.category}</div>
                      </div>
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        ₹{c.referencePrice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-left">
                <thead className="bg-slate-100/70 dark:bg-slate-800/80 font-bold uppercase tracking-wider text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 w-8 text-center">#</th>
                    <th className="px-3 py-2.5">Item Description / Specification *</th>
                    <th className="px-3 py-2.5 w-28">HSN / SAC</th>
                    <th className="px-3 py-2.5 w-24 text-right">Qty</th>
                    <th className="px-3 py-2.5 w-32 text-right">Unit Price (₹) *</th>
                    <th className="px-3 py-2.5 w-32 text-right">Total (₹)</th>
                    <th className="px-3 py-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-3 py-2 text-center text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. ESP32-WROOM Controller / PCB Assembly"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'description', e.target.value)
                          }
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="8542"
                          value={item.hsnCode || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'hsnCode', e.target.value)}
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-center text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'quantity', Number(e.target.value))
                          }
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-right text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))
                          }
                          className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-right font-bold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(item.total || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-slate-500 font-medium">
                {items.length} item{items.length !== 1 ? 's' : ''} in bill
              </span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Items Subtotal:{' '}
                <span className="font-mono text-indigo-600 dark:text-indigo-400 text-sm font-black">
                  ₹{itemsSubtotal.toLocaleString()}
                </span>
              </span>
            </div>
          </div>

          {/* Additional Workshop Services & Engineering Add-ons */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-sm text-slate-900 dark:text-white block">
              Additional Engineering & Workshop Charges (Optional)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Assembly & Soldering (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={labourCost}
                  onChange={(e) => setLabourCost(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  CAD / PCB Design (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={designCost}
                  onChange={(e) => setDesignCost(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Packaging & Logistics (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                  Client Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                />
              </div>
            </div>
          </div>

          {/* GENUINE GST TAX SECTION */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                  Genuine Indian GST Tax Configuration
                </span>
              </div>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                Auto-computes CGST (50%) + SGST (50%) or IGST (100%)
              </span>
            </div>

            {/* Tax Type Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTaxType('CGST_SGST')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  taxType === 'CGST_SGST'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <div className="font-bold text-xs">Intra-State (CGST + SGST)</div>
                <div className={`text-[11px] mt-1 ${taxType === 'CGST_SGST' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Same state transaction. GST is split equally into CGST & SGST.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTaxType('IGST')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  taxType === 'IGST'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <div className="font-bold text-xs">Inter-State (IGST)</div>
                <div className={`text-[11px] mt-1 ${taxType === 'IGST' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Out of state supply. Single Integrated GST rate applied.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTaxType('EXEMPT')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  taxType === 'EXEMPT'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                <div className="font-bold text-xs">Exempt / Zero-Rated (0%)</div>
                <div className={`text-[11px] mt-1 ${taxType === 'EXEMPT' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Bill of supply / SEZ / Export with zero tax applied.
                </div>
              </button>
            </div>

            {/* GST Rate Preset Buttons */}
            {taxType !== 'EXEMPT' && (
              <div className="space-y-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Applicable GST Slab:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {COMMON_GST_SLABS.filter((s) => s.rate > 0).map((slab) => (
                    <button
                      key={slab.rate}
                      type="button"
                      onClick={() => {
                        setTaxRate(slab.rate);
                        setIsCustomRate(false);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        taxRate === slab.rate && !isCustomRate
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      {slab.rate}% GST
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsCustomRate(true)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isCustomRate
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Custom %
                  </button>

                  {isCustomRate && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-20 p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-500 font-bold font-mono text-right"
                      />
                      <span className="font-bold text-slate-600">%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live Calculation Preview Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Items Subtotal:</span>
                <span className="font-mono">₹{itemsSubtotal.toLocaleString()}</span>
              </div>

              {(labourCost > 0 || designCost > 0 || otherExpenses > 0) && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Additional Services & Expenses:</span>
                  <span className="font-mono">
                    ₹{(labourCost + designCost + otherExpenses).toLocaleString()}
                  </span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Client Discount:</span>
                  <span className="font-mono">-₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Taxable Value (Subtotal):</span>
                <span className="font-mono">₹{gstResult.taxableAmount.toLocaleString()}</span>
              </div>

              {/* Genuine GST details */}
              {taxType === 'CGST_SGST' && taxRate > 0 && (
                <>
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400 pl-3">
                    <span>• Central GST (CGST @ {gstResult.cgstRate}%):</span>
                    <span className="font-mono font-semibold">
                      ₹{gstResult.cgstAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-indigo-600 dark:text-indigo-400 pl-3">
                    <span>• State GST (SGST @ {gstResult.sgstRate}%):</span>
                    <span className="font-mono font-semibold">
                      ₹{gstResult.sgstAmount.toLocaleString()}
                    </span>
                  </div>
                </>
              )}

              {taxType === 'IGST' && taxRate > 0 && (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 pl-3">
                  <span>• Integrated GST (IGST @ {gstResult.igstRate}%):</span>
                  <span className="font-mono font-semibold">
                    ₹{gstResult.igstAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    Grand Total (₹):
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium italic mt-0.5">
                    {amountInWords}
                  </p>
                </div>
                <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Invoice Notes & Payment Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="save-manual-invoice-btn"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Saving to Database...' : 'Save & Generate Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
