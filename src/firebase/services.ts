import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errors';
import type {
  Customer,
  Project,
  ComponentItem,
  ProjectComponent,
  BillingRecord,
  DiaryEntry,
  ProjectFile,
  DesignVersion,
  TaskItem,
  CustomerAccess,
  AiChatMessage,
} from '../types';
import { MASTER_COMPONENTS_DATA } from '../data/masterComponents';

// ==================== FIRESTORE DATA SANITIZER ====================
/**
 * Recursively strips undefined values so Firestore never encounters unsupported field values.
 */
export function cleanFirestorePayload<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => cleanFirestorePayload(item)) as unknown as T;
  }
  if (typeof input === 'object' && !(input instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestorePayload(value);
      }
    }
    return cleaned as T;
  }
  return input;
}

// ==================== CUSTOMERS ====================
export async function getCustomers(): Promise<Customer[]> {
  const colPath = 'customers';
  try {
    const q = query(collection(db, colPath), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
  } catch (error) {
    try {
      // Fallback without orderBy if index is building
      const snapshot = await getDocs(collection(db, colPath));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.LIST, colPath);
    }
  }
}

export async function addCustomer(data: Omit<Customer, 'id'>): Promise<Customer> {
  const colPath = 'customers';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const docPath = `customers/${id}`;
  try {
    await updateDoc(doc(db, 'customers', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const docPath = `customers/${id}`;
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== PROJECTS ====================
export async function getProjects(): Promise<Project[]> {
  const colPath = 'projects';
  try {
    const q = query(collection(db, colPath), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
  } catch (error) {
    try {
      const snapshot = await getDocs(collection(db, colPath));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
    } catch (fallbackError) {
      handleFirestoreError(fallbackError, OperationType.LIST, colPath);
    }
  }
}

export async function getProject(id: string): Promise<Project | null> {
  const docPath = `projects/${id}`;
  try {
    const snapshot = await getDoc(doc(db, 'projects', id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Project;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function addProject(data: Omit<Project, 'id'>): Promise<Project> {
  const colPath = 'projects';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      progress: data.progress ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data, progress: data.progress ?? 0 };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<void> {
  const docPath = `projects/${id}`;
  try {
    await updateDoc(doc(db, 'projects', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteProject(id: string): Promise<void> {
  const docPath = `projects/${id}`;
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== ELECTRONICS COMPONENTS ====================
export async function getComponents(): Promise<ComponentItem[]> {
  const colPath = 'components';
  try {
    const snapshot = await getDocs(collection(db, colPath));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ComponentItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function addComponent(data: Omit<ComponentItem, 'id'>): Promise<ComponentItem> {
  const colPath = 'components';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateComponent(id: string, updates: Partial<ComponentItem>): Promise<void> {
  const docPath = `components/${id}`;
  try {
    await updateDoc(doc(db, 'components', id), {
      ...updates,
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteComponent(id: string): Promise<void> {
  const docPath = `components/${id}`;
  try {
    await deleteDoc(doc(db, 'components', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== PROJECT COMPONENTS ====================
export async function getProjectComponents(projectId: string): Promise<ProjectComponent[]> {
  const colPath = 'projectComponents';
  try {
    const q = query(collection(db, colPath), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectComponent));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function addProjectComponent(data: Omit<ProjectComponent, 'id'>): Promise<ProjectComponent> {
  const colPath = 'projectComponents';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function deleteProjectComponent(id: string): Promise<void> {
  const docPath = `projectComponents/${id}`;
  try {
    await deleteDoc(doc(db, 'projectComponents', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== BILLING ====================
export async function getBills(projectId?: string): Promise<BillingRecord[]> {
  const colPath = 'billing';
  try {
    let q = query(collection(db, colPath));
    if (projectId) {
      q = query(collection(db, colPath), where('projectId', '==', projectId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BillingRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function saveBill(data: Omit<BillingRecord, 'id'>, existingId?: string): Promise<BillingRecord> {
  const colPath = 'billing';
  try {
    const now = new Date().toISOString();
    if (existingId) {
      const cleaned = cleanFirestorePayload({
        ...data,
        updatedAt: now,
      });
      await updateDoc(doc(db, colPath, existingId), cleaned);
      return { id: existingId, ...data, updatedAt: now };
    } else {
      const cleaned = cleanFirestorePayload({
        ...data,
        createdAt: data.createdAt || now,
        updatedAt: now,
      });
      const ref = await addDoc(collection(db, colPath), cleaned);
      return { id: ref.id, ...data, createdAt: data.createdAt || now, updatedAt: now };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, colPath);
  }
}

export async function deleteBill(id: string): Promise<void> {
  const docPath = `billing/${id}`;
  try {
    await deleteDoc(doc(db, 'billing', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== DIARY ENTRIES ====================
export async function getDiaryEntries(projectId: string, customerView = false): Promise<DiaryEntry[]> {
  const colPath = 'diaryEntries';
  try {
    let q = query(collection(db, colPath), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    let entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DiaryEntry));
    if (customerView) {
      entries = entries.filter(e => e.visibility === 'CUSTOMER_VISIBLE');
    }
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function addDiaryEntry(data: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
  const colPath = 'diaryEntries';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  const docPath = `diaryEntries/${id}`;
  try {
    await deleteDoc(doc(db, 'diaryEntries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== FILES ====================
export async function getProjectFiles(projectId: string, customerView = false): Promise<ProjectFile[]> {
  const colPath = 'files';
  try {
    const q = query(collection(db, colPath), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    let files = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectFile));
    if (customerView) {
      files = files.filter(f => f.visibility === 'CUSTOMER_VISIBLE');
    }
    return files.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function addProjectFile(data: Omit<ProjectFile, 'id'>): Promise<ProjectFile> {
  const colPath = 'files';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function deleteProjectFile(id: string): Promise<void> {
  const docPath = `files/${id}`;
  try {
    await deleteDoc(doc(db, 'files', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== DESIGN VERSIONS ====================
export async function getDesignVersions(projectId: string): Promise<DesignVersion[]> {
  const colPath = 'designVersions';
  try {
    const q = query(collection(db, colPath), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as DesignVersion))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function addDesignVersion(data: Omit<DesignVersion, 'id'>): Promise<DesignVersion> {
  const colPath = 'designVersions';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function deleteDesignVersion(id: string): Promise<void> {
  const docPath = `designVersions/${id}`;
  try {
    await deleteDoc(doc(db, 'designVersions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== TASKS & AUTOMATIC PROGRESS ====================
export async function getTasks(projectId: string, customerView = false): Promise<TaskItem[]> {
  const colPath = 'tasks';
  try {
    const q = query(collection(db, colPath), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    let tasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TaskItem));
    if (customerView) {
      tasks = tasks.filter(t => t.customerVisible);
    }
    return tasks;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function addTask(data: Omit<TaskItem, 'id'>): Promise<TaskItem> {
  const colPath = 'tasks';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    const task = { id: ref.id, ...data };
    await recalculateProjectProgress(data.projectId);
    return task;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function toggleTask(taskId: string, completed: boolean, projectId: string): Promise<void> {
  const docPath = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      completed,
      completedDate: completed ? new Date().toISOString() : null,
    });
    await recalculateProjectProgress(projectId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function updateTask(taskId: string, updates: Partial<TaskItem>, projectId: string): Promise<void> {
  const docPath = `tasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'tasks', taskId), updates);
    await recalculateProjectProgress(projectId);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteTask(taskId: string, projectId: string): Promise<void> {
  const docPath = `tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
    await recalculateProjectProgress(projectId);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// Recalculates progress strictly from checklist data and saves to Project document
export async function recalculateProjectProgress(projectId: string): Promise<number> {
  try {
    const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(d => d.data() as TaskItem);
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    await updateDoc(doc(db, 'projects', projectId), {
      progress,
      updatedAt: new Date().toISOString(),
    });
    return progress;
  } catch (error) {
    console.warn("Could not recalculate progress:", error);
    return 0;
  }
}

// ==================== CUSTOMER ACCESS ====================
export async function getCustomerAccess(customerEmail: string): Promise<CustomerAccess[]> {
  const colPath = 'customerAccess';
  try {
    const q = query(collection(db, colPath), where('customerEmail', '==', customerEmail.toLowerCase()));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CustomerAccess));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function getProjectCustomerAccess(projectId: string): Promise<CustomerAccess[]> {
  const colPath = 'customerAccess';
  try {
    const q = query(collection(db, colPath), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CustomerAccess));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function grantCustomerAccess(data: Omit<CustomerAccess, 'id'>): Promise<CustomerAccess> {
  const colPath = 'customerAccess';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      customerEmail: data.customerEmail.toLowerCase(),
      createdAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function revokeCustomerAccess(accessId: string): Promise<void> {
  const docPath = `customerAccess/${accessId}`;
  try {
    await deleteDoc(doc(db, 'customerAccess', accessId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ==================== AI CONVERSATIONS ====================
export async function getAiMessages(projectId: string): Promise<AiChatMessage[]> {
  const colPath = 'aiConversations';
  try {
    const q = query(collection(db, colPath), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AiChatMessage));
    return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}

export async function addAiMessage(data: Omit<AiChatMessage, 'id'>): Promise<AiChatMessage> {
  const colPath = 'aiConversations';
  try {
    const ref = await addDoc(collection(db, colPath), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: ref.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

// ==================== COMPREHENSIVE MASTER COMPONENTS SYNC ====================
export async function syncMasterComponents(
  ownerId = 'kks-workshop-owner'
): Promise<{ addedCount: number; totalCount: number }> {
  const colPath = 'components';
  try {
    const existing = await getComponents();
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase().trim()));
    const existingModels = new Set(
      existing.map((c) => (c.modelNumber || '').toLowerCase().trim()).filter(Boolean)
    );

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    let addedCount = 0;

    // Batch writes (max 500 per batch in Firestore)
    let batch = writeBatch(db);
    let batchOps = 0;

    for (const comp of MASTER_COMPONENTS_DATA) {
      const nameKey = comp.name.toLowerCase().trim();
      const modelKey = (comp.modelNumber || '').toLowerCase().trim();

      if (existingNames.has(nameKey) || (modelKey && existingModels.has(modelKey))) {
        continue;
      }

      const docRef = doc(collection(db, colPath));
      batch.set(docRef, {
        ...comp,
        ownerId,
        lastUpdatedDate: today,
        createdAt: now,
        updatedAt: now,
      });

      addedCount++;
      batchOps++;

      if (batchOps >= 450) {
        await batch.commit();
        batch = writeBatch(db);
        batchOps = 0;
      }
    }

    if (batchOps > 0) {
      await batch.commit();
    }

    return { addedCount, totalCount: existing.length + addedCount };
  } catch (error) {
    console.error('Error syncing master components catalog:', error);
    return { addedCount: 0, totalCount: 0 };
  }
}

// ==================== PURGE DEMO / EXAMPLE WORKSPACE DATA ====================
export async function clearAllDemoExampleData(): Promise<{
  deletedProjects: number;
  deletedCustomers: number;
  deletedBills: number;
}> {
  let deletedProjects = 0;
  let deletedCustomers = 0;
  let deletedBills = 0;

  try {
    // 1. Purge demo projects
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    for (const d of projectsSnapshot.docs) {
      const data = d.data();
      const isDemo =
        data.name?.includes('Smart Greenhouse') ||
        data.customerName?.includes('TechAgro') ||
        data.ownerId === 'workshop-owner';
      if (isDemo) {
        await deleteProject(d.id);
        deletedProjects++;
      }
    }

    // 2. Purge demo customers
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    for (const d of customersSnapshot.docs) {
      const data = d.data();
      const isDemo =
        data.name?.includes('TechAgro') ||
        data.email?.includes('techagro.example.com') ||
        data.ownerId === 'workshop-owner';
      if (isDemo) {
        await deleteCustomer(d.id);
        deletedCustomers++;
      }
    }

    // 3. Purge demo bills
    const billsSnapshot = await getDocs(collection(db, 'billing'));
    for (const d of billsSnapshot.docs) {
      const data = d.data();
      const isDemo =
        data.invoiceNumber === 'INV-2026-001' ||
        data.customerName?.includes('TechAgro') ||
        data.notes?.includes('Smart Greenhouse') ||
        data.ownerId === 'workshop-owner';
      if (isDemo) {
        await deleteBill(d.id);
        deletedBills++;
      }
    }

    // 4. Purge demo customer access
    const accessSnapshot = await getDocs(collection(db, 'customerAccess'));
    for (const d of accessSnapshot.docs) {
      const data = d.data();
      if (
        data.customerEmail?.includes('techagro.example.com') ||
        data.grantedBy === 'workshop-owner'
      ) {
        await deleteDoc(doc(db, 'customerAccess', d.id));
      }
    }
  } catch (err) {
    console.warn('Demo cleanup check completed:', err);
  }

  return { deletedProjects, deletedCustomers, deletedBills };
}

// ==================== COMPLETE BLANK WORKSPACE RESET ====================
export async function clearAllWorkspaceData(): Promise<{ success: boolean; message: string }> {
  try {
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    for (const d of projectsSnapshot.docs) {
      await deleteProject(d.id);
    }

    const customersSnapshot = await getDocs(collection(db, 'customers'));
    for (const d of customersSnapshot.docs) {
      await deleteCustomer(d.id);
    }

    const billsSnapshot = await getDocs(collection(db, 'billing'));
    for (const d of billsSnapshot.docs) {
      await deleteBill(d.id);
    }

    const tasksSnapshot = await getDocs(collection(db, 'tasks'));
    for (const d of tasksSnapshot.docs) {
      await deleteDoc(doc(db, 'tasks', d.id));
    }

    const diarySnapshot = await getDocs(collection(db, 'diary'));
    for (const d of diarySnapshot.docs) {
      await deleteDoc(doc(db, 'diary', d.id));
    }

    const designSnapshot = await getDocs(collection(db, 'designVersions'));
    for (const d of designSnapshot.docs) {
      await deleteDoc(doc(db, 'designVersions', d.id));
    }

    const accessSnapshot = await getDocs(collection(db, 'customerAccess'));
    for (const d of accessSnapshot.docs) {
      await deleteDoc(doc(db, 'customerAccess', d.id));
    }

    return { success: true, message: 'All project workspaces, clients, tasks, and invoices have been reset to empty.' };
  } catch (err: any) {
    console.error('Error clearing workspace data:', err);
    return { success: false, message: err.message || 'Failed to clear workspace data' };
  }
}

// ==================== ALIASES & UTILITIES ====================
export const createProject = addProject;
export const createCustomer = addCustomer;
export const createComponent = addComponent;
export const getCustomerAccessByEmail = getCustomerAccess;

export async function updateBillStatus(id: string, status: 'draft' | 'sent' | 'paid'): Promise<void> {
  const docPath = `billing/${id}`;
  try {
    await updateDoc(doc(db, 'billing', id), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function seedInitialDatabaseIfEmpty(
  ownerId = 'kks-workshop-owner'
): Promise<void> {
  try {
    // 1. Always purge any legacy demo/example projects, clients, and bills so sections remain empty
    await clearAllDemoExampleData();

    // 2. Ensure the comprehensive 118+ developer components catalog is synced and available
    await syncMasterComponents(ownerId);
  } catch (err) {
    console.warn('Initial seeding and synchronization check completed:', err);
  }
}

