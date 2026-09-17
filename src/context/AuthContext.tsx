import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, testConnection } from '../firebase/config';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isOwner: boolean;
  loading: boolean;
  isOnline: boolean;
  isAuthModalOpen: boolean;
  activePortalTab: 'owner' | 'customer';
  openAuthModal: (portal?: 'owner' | 'customer') => void;
  closeAuthModal: () => void;
  setActivePortalTab: (portal: 'owner' | 'customer') => void;
  signInWithGoogle: (targetRole?: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  loginAsOwner: (email?: string, password?: string) => Promise<void>;
  loginAsCustomer: (email: string, password?: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  switchRoleForTesting: (role: UserRole) => void;
  demoLoginAs: (role: UserRole, customEmail?: string) => Promise<void>;
  fixedOwnerEmail?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('owner');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activePortalTab, setActivePortalTab] = useState<'owner' | 'customer'>('owner');

  const openAuthModal = (portal?: 'owner' | 'customer') => {
    if (portal) {
      setActivePortalTab(portal);
    }
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial firestore connection probe
    testConnection().then((online) => {
      if (!online) console.info('Firestore status: initialized');
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            const currentRole: UserRole = data.role || 'owner';
            const updatedProfile: UserProfile = {
              ...data,
              id: firebaseUser.uid,
              email: firebaseUser.email || data.email,
              displayName: firebaseUser.displayName || data.displayName,
              photoURL: firebaseUser.photoURL || data.photoURL,
              role: currentRole,
            };
            setProfile(updatedProfile);
            setRole(currentRole);
          } else {
            // New user signing in with Google: set role based on active portal (default owner)
            const assignedRole: UserRole = activePortalTab || 'owner';
            const newProfile: UserProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || (assignedRole === 'owner' ? 'Workshop Owner' : 'Customer Client'),
              role: assignedRole,
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
            setRole(assignedRole);
          }
        } catch (err) {
          console.warn('User profile sync error:', err);
          const fallbackRole: UserRole = activePortalTab || 'owner';
          setProfile({
            id: firebaseUser.uid,
            email: firebaseUser.email || 'owner@kksworkshop.com',
            displayName: firebaseUser.displayName || 'Workshop Owner',
            role: fallbackRole,
          });
          setRole(fallbackRole);
        }
      } else {
        // No Firebase user logged in - maintain active owner session so workshop is usable right away
        const lastEmail = localStorage.getItem('kks_owner_email') || 'owner@kksworkshop.com';
        const defaultRole: UserRole = 'owner';
        setProfile({
          id: 'owner-session-id',
          email: lastEmail,
          displayName: lastEmail.split('@')[0] || 'Workshop Owner',
          role: defaultRole,
        });
        setRole(defaultRole);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activePortalTab]);

  /**
   * Sign in with Google: Any user can sign in with Google to become the owner or customer!
   */
  const signInWithGoogle = async (targetRole: UserRole = activePortalTab || 'owner') => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const googleUser = cred.user;

    // Save profile to Firestore with targetRole
    const userDocRef = doc(db, 'users', googleUser.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const existing = snap.data() as UserProfile;
      // If logging in through owner portal, upgrade or retain owner role
      const finalRole: UserRole = targetRole === 'owner' ? 'owner' : existing.role || targetRole;
      const updatedProfile: UserProfile = {
        ...existing,
        email: googleUser.email || existing.email,
        displayName: googleUser.displayName || existing.displayName,
        photoURL: googleUser.photoURL || existing.photoURL,
        role: finalRole,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, updatedProfile, { merge: true });
      setProfile(updatedProfile);
      setRole(finalRole);
    } else {
      const newProfile: UserProfile = {
        id: googleUser.uid,
        email: googleUser.email || '',
        displayName: googleUser.displayName || (targetRole === 'owner' ? 'Workshop Owner' : 'Customer Client'),
        role: targetRole,
        photoURL: googleUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
      setRole(targetRole);
    }

    if (targetRole === 'owner' && googleUser.email) {
      localStorage.setItem('kks_owner_email', googleUser.email);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginAsOwner = async (ownerEmail?: string, password?: string) => {
    const emailToUse = ownerEmail?.trim() || localStorage.getItem('kks_owner_email') || 'owner@kksworkshop.com';
    if (password && password.trim()) {
      try {
        await signInWithEmailAndPassword(auth, emailToUse, password);
        return;
      } catch (err) {
        console.warn('Firebase password login fallback:', err);
      }
    }

    localStorage.setItem('kks_owner_email', emailToUse);
    const ownerProfile: UserProfile = {
      id: user ? user.uid : 'owner-session-id',
      email: emailToUse,
      displayName: emailToUse.split('@')[0] || 'Workshop Owner',
      role: 'owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRole('owner');
    setProfile(ownerProfile);
    closeAuthModal();
  };

  const loginAsCustomer = async (customerEmail: string, password?: string, customerName?: string) => {
    const cleanEmail = customerEmail.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error('Please enter a valid customer email address.');
    }

    if (password && password.trim()) {
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        setRole('customer');
        return;
      } catch (err: any) {
        console.warn('Client email sign-in note:', err);
      }
    }

    const clientProfile: UserProfile = {
      id: user ? user.uid : `customer-${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
      email: cleanEmail,
      displayName: customerName || cleanEmail.split('@')[0],
      role: 'customer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRole('customer');
    setProfile(clientProfile);
    closeAuthModal();
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, assignedRole: UserRole = 'customer') => {
    const cleanEmail = email.trim().toLowerCase();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const newProfile: UserProfile = {
      id: cred.user.uid,
      email: cleanEmail,
      displayName: name || cleanEmail.split('@')[0],
      role: assignedRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    setProfile(newProfile);
    setRole(assignedRole);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('SignOut notice:', err);
    }
    setUser(null);
    setProfile(null);
    openAuthModal();
  };

  const switchRoleForTesting = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'owner') {
      const email = user?.email || localStorage.getItem('kks_owner_email') || 'owner@kksworkshop.com';
      setProfile({
        id: user?.uid || 'owner-session-id',
        email,
        displayName: user?.displayName || email.split('@')[0] || 'Workshop Owner',
        photoURL: user?.photoURL || undefined,
        role: 'owner',
      });
    } else {
      setProfile({
        id: 'customer-client-id',
        email: 'client@company.com',
        displayName: 'Registered Client',
        role: 'customer',
      });
    }
  };

  const demoLoginAs = async (demoRole: UserRole, customEmail?: string) => {
    if (demoRole === 'owner') {
      const email = customEmail || user?.email || 'owner@kksworkshop.com';
      setRole('owner');
      setProfile({
        id: user?.uid || 'owner-session-id',
        email,
        displayName: user?.displayName || email.split('@')[0] || 'Workshop Owner',
        photoURL: user?.photoURL || undefined,
        role: 'owner',
      });
    } else {
      const email = customEmail || 'client@company.com';
      setRole('customer');
      setProfile({
        id: 'customer-client-id',
        email,
        displayName: email.split('@')[0] || 'Client User',
        role: 'customer',
      });
    }
  };

  // Any authenticated or assigned user with role 'owner' has owner access
  const isOwner = role === 'owner';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isOwner,
        loading,
        isOnline,
        isAuthModalOpen,
        activePortalTab,
        openAuthModal,
        closeAuthModal,
        setActivePortalTab,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        loginAsOwner,
        loginAsCustomer,
        resetPassword,
        logout,
        signOut: logout,
        switchRoleForTesting,
        demoLoginAs,
        fixedOwnerEmail: profile?.email || 'owner@kksworkshop.com',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

