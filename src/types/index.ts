export type UserRole = 'owner' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'planned' | 'in_progress' | 'testing' | 'completed' | 'on_hold';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectType = 'IoT' | 'Robotics' | 'Embedded' | 'Hardware' | 'Software' | 'PCB' | 'Automation' | 'Creative';

export interface Project {
  id: string;
  name: string;
  customerId?: string;
  customerName?: string;
  description: string;
  projectType: ProjectType;
  startDate: string;
  expectedCompletionDate: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget: number;
  coverImage?: string;
  ownerId: string;
  progress: number; // 0 to 100, calculated automatically from checklist tasks
  createdAt: string;
  updatedAt: string;
}

export type ComponentCategory =
  | 'Microcontrollers'
  | 'Sensors'
  | 'RFID'
  | 'Motors'
  | 'Motor drivers'
  | 'Displays'
  | 'Relays'
  | 'Communication modules'
  | 'Resistors'
  | 'Capacitors'
  | 'ICs'
  | 'Connectors'
  | 'Power supplies'
  | 'PCBs'
  | 'Wires'
  | 'Mechanical parts'
  | 'Other';

export interface ComponentItem {
  id: string;
  name: string;
  category: ComponentCategory;
  manufacturer?: string;
  modelNumber?: string;
  description?: string;
  referencePrice: number;
  currency: string;
  supplier?: string;
  sourceUrl?: string;
  datasheetUrl?: string;
  imageUrl?: string;
  notes?: string;
  lastUpdatedDate: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectComponent {
  id: string;
  projectId: string;
  componentId?: string; // Empty if custom
  name: string;
  quantity: number;
  unitPrice: number;
  customPrice?: number;
  total: number;
  isCustom: boolean;
  notes?: string;
  ownerId: string;
  createdAt: string;
}

export interface BillingItem {
  id: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type BillingStatus = 'draft' | 'sent' | 'paid';
export type GstTaxType = 'CGST_SGST' | 'IGST' | 'EXEMPT';

export interface BillingRecord {
  id: string;
  projectId: string;
  projectName?: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerGst?: string;
  customerAddress?: string;
  workshopGst?: string;
  componentCost: number;
  labourCost: number;
  designCost: number;
  otherExpenses: number;
  subtotal: number;
  discount: number;
  taxType?: GstTaxType;
  taxRate: number; // percentage, e.g. 18 for GST
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  status: BillingStatus;
  notes?: string;
  dueDate: string;
  items?: BillingItem[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export type VisibilityType = 'PRIVATE' | 'CUSTOMER_VISIBLE';

export interface DiaryEntry {
  id: string;
  projectId: string;
  title: string;
  description: string;
  date: string;
  author: string;
  images?: string[];
  attachments?: string[];
  tags: string[];
  visibility: VisibilityType;
  ownerId: string;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadDate: string;
  visibility: VisibilityType;
  ownerId: string;
  createdAt: string;
}

export interface DesignVersion {
  id: string;
  projectId: string;
  title: string;
  versionNumber: string;
  notes?: string;
  dimensions?: string;
  materials?: string;
  componentsList?: string;
  cadFileUrl?: string;
  previewImageUrl?: string;
  externalToolUrl?: string;
  ownerId: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignedUser?: string;
  completed: boolean;
  completedDate?: string;
  customerVisible: boolean;
  ownerId: string;
  createdAt: string;
}

export interface CustomerAccess {
  id: string;
  customerEmail: string;
  customerUserId?: string;
  projectId: string;
  projectName: string;
  grantedBy: string;
  createdAt: string;
}

export interface AiChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  ownerId: string;
}
