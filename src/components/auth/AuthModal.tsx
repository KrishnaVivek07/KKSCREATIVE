import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Eye,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AuthModal({ isOpen = true, onClose }: AuthModalProps) {
  const {
    isAuthModalOpen,
    closeAuthModal,
    activePortalTab,
    setActivePortalTab,
    loginAsOwner,
    loginAsCustomer,
    signInWithGoogle,
    resetPassword,
    fixedOwnerEmail,
    demoLoginAs,
  } = useAuth();

  const showModal = isOpen && isAuthModalOpen;

  const [portal, setPortal] = useState<'owner' | 'customer'>(activePortalTab || 'owner');
  const [customerMode, setCustomerMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  
  // Owner form state
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  
  // Customer form state
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('');
  const [customerName, setCustomerName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync active portal tab from context
  useEffect(() => {
    if (activePortalTab) {
      setPortal(activePortalTab);
    }
  }, [activePortalTab]);

  if (!showModal) return null;

  const handleClose = () => {
    setError(null);
    setSuccessMessage(null);
    closeAuthModal();
    onClose?.();
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      await loginAsOwner(ownerEmail, ownerPassword);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Owner authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      if (customerMode === 'reset') {
        if (!customerEmail.trim()) {
          throw new Error('Please provide your customer email.');
        }
        await resetPassword(customerEmail.trim());
        setSuccessMessage('Password reset link sent to your customer email.');
      } else {
        await loginAsCustomer(customerEmail, customerPassword, customerName);
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || 'Customer authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleOwner = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle('owner');
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCustomer = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle('customer');
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 overflow-hidden my-8 transition-all"
      >
        {/* Close Button */}
        <button
          id="auth-modal-close-btn"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-3">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            KKS Creative Hub Portals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Please select whether you are entering as the Workshop Owner or accessing as an Authorized Customer.
          </p>
        </div>

        {/* Portal Choice Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
          <button
            id="portal-tab-owner-btn"
            type="button"
            onClick={() => {
              setPortal('owner');
              setActivePortalTab('owner');
              setError(null);
            }}
            className={`flex flex-col items-center justify-center py-3 px-3 rounded-xl transition-all ${
              portal === 'owner'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm">Owner Portal</span>
            </div>
            <span className="text-[10px] opacity-75 font-normal">
              Workshop Management
            </span>
          </button>

          <button
            id="portal-tab-customer-btn"
            type="button"
            onClick={() => {
              setPortal('customer');
              setActivePortalTab('customer');
              setError(null);
            }}
            className={`flex flex-col items-center justify-center py-3 px-3 rounded-xl transition-all ${
              portal === 'customer'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-md font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Customer Portal</span>
            </div>
            <span className="text-[10px] opacity-75 font-normal">
              Client Projects & Bills
            </span>
          </button>
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 animate-in fade-in duration-200">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ---------------- OWNER PORTAL FORM ---------------- */}
        {portal === 'owner' && (
          <div id="owner-login-section" className="space-y-4 animate-in fade-in duration-200">
            {/* Dynamic Owner Info Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Workshop Owner Authentication
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                  Admin Access
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Log in with your Google account or email to access full workshop controls, hardware inventories, customer projects, and billing.
              </p>
            </div>

            {/* Primary Google Sign-In for Owner */}
            <button
              id="owner-google-login-btn"
              type="button"
              onClick={handleGoogleOwner}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-800 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-white text-sm font-bold transition-all shadow-sm hover:scale-[1.01] hover:border-indigo-400 disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{submitting ? 'Connecting with Google...' : 'Sign in with Google as Owner'}</span>
            </button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase font-medium">
                or sign in with credentials
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>

            <form onSubmit={handleOwnerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Owner Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="owner-email-input"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="Enter owner email (e.g. director@kksworkshop.com)"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Owner Password / Passcode (Optional for Demo)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="owner-password-input"
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Enter password or leave empty for quick access"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                id="owner-login-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <span>{submitting ? 'Authenticating Owner...' : 'Enter as Workshop Owner'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ---------------- CUSTOMER PORTAL FORM ---------------- */}
        {portal === 'customer' && (
          <div id="customer-login-section" className="space-y-4 animate-in fade-in duration-200">
            {/* Customer Sub-tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {customerMode === 'signin' && 'Client Portal Sign In'}
                {customerMode === 'signup' && 'Register as New Customer'}
                {customerMode === 'reset' && 'Reset Customer Password'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerMode('signin')}
                  className={`text-xs ${
                    customerMode === 'signin'
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold underline'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Sign In
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setCustomerMode('signup')}
                  className={`text-xs ${
                    customerMode === 'signup'
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold underline'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  New Client
                </button>
              </div>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              {customerMode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Client Name / Organization
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="customer-name-input"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Verma or SolarTech Pvt Ltd"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="customer-email-input"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {customerMode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password (Optional for Demo)
                    </label>
                    {customerMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setCustomerMode('reset')}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="customer-password-input"
                      type="password"
                      value={customerPassword}
                      onChange={(e) => setCustomerPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button
                id="customer-login-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <span>
                  {submitting
                    ? 'Processing Client Access...'
                    : customerMode === 'signup'
                    ? 'Register as Customer'
                    : customerMode === 'reset'
                    ? 'Send Password Reset'
                    : 'Sign In to Customer Portal'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase font-medium">
                or sign in with Google
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>

            <button
              id="customer-google-login-btn"
              type="button"
              onClick={handleGoogleCustomer}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google as Customer</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <span>KKS Creative Hub Multi-Portal Architecture</span>
          <span>•</span>
          <span>Role Enforcement Active</span>
        </div>
      </div>
    </div>
  );
}
