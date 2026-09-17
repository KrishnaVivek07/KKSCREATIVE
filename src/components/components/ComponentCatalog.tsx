import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ComponentItem, ComponentCategory } from '../../types';
import {
  Cpu,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Globe,
  Loader2,
  CheckCircle2,
  BookOpen,
  Zap,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface ComponentCatalogProps {
  components: ComponentItem[];
  onAddComponent: (data: Omit<ComponentItem, 'id'>) => Promise<void>;
  onUpdateComponent: (id: string, data: Partial<ComponentItem>) => Promise<void>;
  onDeleteComponent: (id: string) => Promise<void>;
}

const CATEGORIES: ComponentCategory[] = [
  'Microcontrollers',
  'Sensors',
  'RFID',
  'Motors',
  'Motor drivers',
  'Displays',
  'Relays',
  'Communication modules',
  'Resistors',
  'Capacitors',
  'ICs',
  'Connectors',
  'Power supplies',
  'PCBs',
  'Wires',
  'Mechanical parts',
  'Other',
];

interface GoogleSearchResult {
  name: string;
  category: string;
  manufacturer: string;
  modelNumber: string;
  description: string;
  specifications: string;
  pinoutSummary: string;
  operatingVoltage: string;
  packageType: string;
  referencePrice: number;
  currency: string;
  supplier: string;
  datasheetUrl: string;
  sourceUrl: string;
  notes: string;
  searchSources?: Array<{ title: string; url: string }>;
}

export function ComponentCatalog({
  components,
  onAddComponent,
  onUpdateComponent,
  onDeleteComponent,
}: ComponentCatalogProps) {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<ComponentItem | null>(null);

  // Gemini explainer state
  const [aiExplainModal, setAiExplainModal] = useState(false);
  const [aiExplainText, setAiExplainText] = useState('');
  const [aiExplainingComp, setAiExplainingComp] = useState<ComponentItem | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Google Web Search State
  const [webSearchLoading, setWebSearchLoading] = useState(false);
  const [webSearchResult, setWebSearchResult] = useState<GoogleSearchResult | null>(null);
  const [webSearchError, setWebSearchError] = useState<string | null>(null);
  const [addedSuccessMessage, setAddedSuccessMessage] = useState<string | null>(null);
  const [autofillQuery, setAutofillQuery] = useState('');
  const [autofillLoading, setAutofillLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('Microcontrollers');
  const [manufacturer, setManufacturer] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [description, setDescription] = useState('');
  const [referencePrice, setReferencePrice] = useState<number>(100);
  const [currency, setCurrency] = useState('₹');
  const [supplier, setSupplier] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [datasheetUrl, setDatasheetUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = components.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.modelNumber && c.modelNumber.toLowerCase().includes(search.toLowerCase())) ||
      (c.manufacturer && c.manufacturer.toLowerCase().includes(search.toLowerCase())) ||
      (c.supplier && c.supplier.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCat === 'ALL' || c.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const openAdd = () => {
    setEditingComp(null);
    setName('');
    setCategory('Microcontrollers');
    setManufacturer('');
    setModelNumber('');
    setDescription('');
    setReferencePrice(100);
    setCurrency('₹');
    setSupplier('');
    setSourceUrl('');
    setDatasheetUrl('');
    setImageUrl('');
    setNotes('');
    setAutofillQuery('');
    setModalOpen(true);
  };

  const openEdit = (c: ComponentItem) => {
    setEditingComp(c);
    setName(c.name);
    setCategory(c.category);
    setManufacturer(c.manufacturer || '');
    setModelNumber(c.modelNumber || '');
    setDescription(c.description || '');
    setReferencePrice(c.referencePrice);
    setCurrency(c.currency || '₹');
    setSupplier(c.supplier || '');
    setSourceUrl(c.sourceUrl || '');
    setDatasheetUrl(c.datasheetUrl || '');
    setImageUrl(c.imageUrl || '');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  // Google Web Search Handler
  const handleGoogleWebSearch = async (queryToSearch: string) => {
    const cleanQuery = queryToSearch.trim();
    if (!cleanQuery) return;

    setWebSearchLoading(true);
    setWebSearchError(null);
    setWebSearchResult(null);
    setAddedSuccessMessage(null);

    try {
      const res = await fetch('/api/components/search-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanQuery }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch component from Google search.');
      }
      setWebSearchResult(data.component);
    } catch (err: any) {
      console.error('Google component search error:', err);
      setWebSearchError(err.message || 'Error executing Google web search.');
    } finally {
      setWebSearchLoading(false);
    }
  };

  // Add Google searched component directly to database
  const handleAddSearchedComponent = async (res: GoogleSearchResult) => {
    setSubmitting(true);
    try {
      const categoryToUse: ComponentCategory = CATEGORIES.includes(res.category as ComponentCategory)
        ? (res.category as ComponentCategory)
        : 'Other';

      await onAddComponent({
        name: res.name,
        category: categoryToUse,
        manufacturer: res.manufacturer || undefined,
        modelNumber: res.modelNumber || undefined,
        description: res.description || undefined,
        referencePrice: Number(res.referencePrice) || 0,
        currency: res.currency || '₹',
        supplier: res.supplier || undefined,
        sourceUrl: res.sourceUrl || undefined,
        datasheetUrl: res.datasheetUrl || undefined,
        notes: [res.specifications, res.pinoutSummary, res.notes].filter(Boolean).join('\n\n') || undefined,
        lastUpdatedDate: new Date().toISOString().split('T')[0],
        ownerId: 'workshop-owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setAddedSuccessMessage(`Successfully added "${res.name}" to the Workshop Database!`);
      setWebSearchResult(null);
      setSearch('');
    } catch (err: any) {
      console.error('Failed to save searched component:', err);
      setWebSearchError('Failed to save component to Firestore: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Autofill Modal with Google Search
  const handleAutofillFromGoogle = async () => {
    if (!autofillQuery.trim()) return;
    setAutofillLoading(true);
    try {
      const res = await fetch('/api/components/search-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: autofillQuery.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.component) {
        const c: GoogleSearchResult = data.component;
        setName(c.name || autofillQuery);
        if (CATEGORIES.includes(c.category as ComponentCategory)) {
          setCategory(c.category as ComponentCategory);
        }
        setManufacturer(c.manufacturer || '');
        setModelNumber(c.modelNumber || '');
        setDescription(c.description || '');
        setReferencePrice(Number(c.referencePrice) || 100);
        setCurrency(c.currency || '₹');
        setSupplier(c.supplier || '');
        setDatasheetUrl(c.datasheetUrl || '');
        setSourceUrl(c.sourceUrl || '');
        const combinedNotes = [
          c.specifications ? `Specs: ${c.specifications}` : '',
          c.pinoutSummary ? `Pinout: ${c.pinoutSummary}` : '',
          c.notes ? `Note: ${c.notes}` : '',
        ].filter(Boolean).join('\n');
        setNotes(combinedNotes);
      }
    } catch (err) {
      console.error('Autofill error:', err);
    } finally {
      setAutofillLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingComp) {
        await onUpdateComponent(editingComp.id, {
          name: name.trim(),
          category,
          manufacturer: manufacturer.trim() || undefined,
          modelNumber: modelNumber.trim() || undefined,
          description: description.trim() || undefined,
          referencePrice: Number(referencePrice) || 0,
          currency,
          supplier: supplier.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          datasheetUrl: datasheetUrl.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await onAddComponent({
          name: name.trim(),
          category,
          manufacturer: manufacturer.trim() || undefined,
          modelNumber: modelNumber.trim() || undefined,
          description: description.trim() || undefined,
          referencePrice: Number(referencePrice) || 0,
          currency,
          supplier: supplier.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
          datasheetUrl: datasheetUrl.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          lastUpdatedDate: new Date().toISOString().split('T')[0],
          ownerId: user?.uid || profile?.id || profile?.email || 'owner',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save component:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplainWithAi = async (comp: ComponentItem) => {
    setAiExplainingComp(comp);
    setAiExplainText('');
    setAiExplainModal(true);
    setAiLoading(true);

    try {
      const res = await fetch('/api/gemini/explain-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentName: `${comp.name} ${comp.modelNumber ? `(${comp.modelNumber})` : ''}`,
          category: comp.category,
        }),
      });
      const data = await res.json();
      setAiExplainText(data.explanation || data.error || 'No specs generated.');
    } catch (err: any) {
      setAiExplainText(`Failed to retrieve AI specs: ${err?.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div id="component-catalog-container" className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Electronics Components Database
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Globe className="w-3 h-3" />
              Google Web Search Enabled
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standard inventory catalog with reference pricing, datasheets, suppliers, and Google web search auto-discovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="add-new-component-btn"
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Component</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="components-search-input"
            type="text"
            placeholder="Search component name, model (e.g. INA219, ESP32, BME680, DRV8825)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setWebSearchResult(null);
              setWebSearchError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                handleGoogleWebSearch(search.trim());
              }
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Live Google Search Button */}
        {search.trim().length > 0 && (
          <button
            id="search-google-btn"
            onClick={() => handleGoogleWebSearch(search.trim())}
            disabled={webSearchLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-all shrink-0"
            title="Search Google Web for this electronic component"
          >
            {webSearchLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span>Google Search "{search.slice(0, 16)}"</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <select
            id="components-category-filter"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories ({components.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({components.filter((c) => c.category === cat).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Success Notification */}
      {addedSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{addedSuccessMessage}</span>
          </div>
          <button
            onClick={() => setAddedSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-200 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Web Search Error */}
      {webSearchError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{webSearchError}</span>
          </div>
          <button
            onClick={() => setWebSearchError(null)}
            className="text-amber-700 hover:text-amber-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Web Search Result Card */}
      {webSearchResult && (
        <div
          id="google-search-result-card"
          className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-700 shadow-xl transition-all animate-in fade-in duration-200"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-indigo-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-600 text-white">
                  <Globe className="w-3 h-3" />
                  Google Web Discovery
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {webSearchResult.category}
                </span>
                {webSearchResult.manufacturer && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Mfg: {webSearchResult.manufacturer}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {webSearchResult.name}
              </h2>
              {webSearchResult.modelNumber && (
                <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  Part / MPN: {webSearchResult.modelNumber}
                </p>
              )}
            </div>

            <button
              id="add-discovered-component-btn"
              onClick={() => handleAddSearchedComponent(webSearchResult)}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Saving to Firestore...' : 'Add to Workshop Database'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Overview & Applications
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {webSearchResult.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pinout & Voltage Summary
              </span>
              <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                {webSearchResult.pinoutSummary || 'Standard interface'}
              </p>
              <div className="mt-2 text-[11px] text-slate-500">
                <span>Voltage: </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {webSearchResult.operatingVoltage}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Market Price & Procurement
              </span>
              <div className="text-lg font-mono font-extrabold text-slate-900 dark:text-white">
                {webSearchResult.currency} {webSearchResult.referencePrice}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Typical Supplier: {webSearchResult.supplier || 'Robu.in / Mouser'}
              </p>
            </div>
          </div>

          {/* Search citations and links */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              {webSearchResult.datasheetUrl && (
                <a
                  href={webSearchResult.datasheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Official Datasheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {webSearchResult.sourceUrl && (
                <a
                  href={webSearchResult.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <span>Google Query Reference</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              onClick={() => setWebSearchResult(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Close Discovered Card
            </button>
          </div>
        </div>
      )}

      {/* Components Grid / Empty State */}
      {filtered.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-3">
            <Cpu className="w-7 h-7" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {search.trim()
              ? `Component "${search}" not in local inventory`
              : 'No components in this view'}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            {search.trim()
              ? `Search Google Web to automatically fetch "${search}" with live technical specifications, pinout, manufacturer datasheets, and reference prices.`
              : 'Add your workshop components manually or search Google Web to auto-populate specifications.'}
          </p>

          {search.trim() && (
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="empty-state-google-search-btn"
                onClick={() => handleGoogleWebSearch(search.trim())}
                disabled={webSearchLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
              >
                {webSearchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
                <span>
                  {webSearchLoading
                    ? 'Searching Google Web & Datasheets...'
                    : `Search Google Web for "${search}"`}
                </span>
              </button>

              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Manually</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((comp) => (
            <div
              key={comp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {comp.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(comp)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit component"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteComponent(comp.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Delete component"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {comp.name}
                </h3>

                {comp.modelNumber && (
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    Model: {comp.modelNumber}
                  </p>
                )}

                {comp.manufacturer && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mfg: {comp.manufacturer}
                  </p>
                )}

                {comp.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {comp.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Reference Price</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {comp.currency || '₹'} {comp.referencePrice?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Supplier</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {comp.supplier || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleExplainWithAi(comp)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>AI Pinout & Specs</span>
                </button>

                {comp.datasheetUrl && (
                  <a
                    href={comp.datasheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <span>Datasheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Component Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 text-xs my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {editingComp ? 'Edit Electronics Component' : 'Add New Component to Catalog'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Save hardware specs, pinout, and pricing to Firestore
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google Autofill Header inside Modal */}
            {!editingComp && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Quick Autofill from Google Web Search
                  </span>
                  <span className="text-[10px] text-slate-400">Live Grounding</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter component name or part (e.g. INA219, BME680, ESP32-S3)"
                    value={autofillQuery}
                    onChange={(e) => setAutofillQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAutofillFromGoogle();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAutofillFromGoogle}
                    disabled={autofillLoading || !autofillQuery.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {autofillLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Autofill</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold mb-1">Component Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ESP32-WROOM-32D Development Board"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Model / Part Number</label>
                  <input
                    type="text"
                    placeholder="ESP32-WROOM-32D"
                    value={modelNumber}
                    onChange={(e) => setModelNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="Espressif"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ref Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={referencePrice}
                    onChange={(e) => setReferencePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Supplier</label>
                  <input
                    type="text"
                    placeholder="Robu.in / Mouser"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Overview of this component, voltage rating, communication interface..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Datasheet URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={datasheetUrl}
                  onChange={(e) => setDatasheetUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Technical Notes / Pinout</label>
                <textarea
                  rows={2}
                  placeholder="Wiring caveats, capacitor recommendations, pinout summary..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/30 transition-all"
                >
                  {submitting
                    ? 'Saving...'
                    : editingComp
                    ? 'Save Changes'
                    : 'Save Component to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Component Specs Explainer Modal */}
      {aiExplainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Technical Specifications: {aiExplainingComp?.name}
                </h3>
              </div>
              <button
                onClick={() => setAiExplainModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <p>Generating hardware pinout and specifications...</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto pr-2 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-xs">
                {aiExplainText}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setAiExplainModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"
              >
                Close Specs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
