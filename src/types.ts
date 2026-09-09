export type RecordType = 'MOA' | 'LO';

export type MOAStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Renewed' | 'Archived' | 'Terminated';
export type LOStatus = 'Issued' | 'Archived';

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number; // in bytes
  uploadedAt: string;
  dataUrl?: string; // base64 representation or data URL
}

export interface TimelineEvent {
  id: string;
  type: 'Created' | 'Updated' | 'Version Uploaded' | 'Student Assigned' | 'Legal Opinion Attached' | 'Renewed' | 'Archived' | 'Task Added' | 'Task Completed';
  description: string;
  timestamp: string;
  user?: string;
}

export interface LegalTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignedStaff?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
}

export interface ContractVersion {
  id: string;
  versionNumber: number;
  status: string;
  notes: string;
  uploadedBy: string;
  uploadedAt: string;
  fileName: string;
  fileSize: number;
  dataUrl?: string;
}

export interface PartnerOrganization {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  industry: string;
  notes?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  timeline?: TimelineEvent[];
}

export interface RecordItem {
  id: string;
  controlNumber: string;
  type: RecordType;
  title: string;
  description: string;
  status: MOAStatus | LOStatus;
  
  // Dates
  requestDate?: string; // For LO
  issueDate?: string; // For LO opinion date / For MOA signing date
  expirationDate?: string; // For MOA (optional, or 'Indefinite')
  isIndefinite?: boolean; // For MOA
  
  // MOA specific
  parties?: string[];
  signatories?: string[];
  category?: string; // e.g. Academic, Internship, Research
  department?: string; // department/office in-charge
  
  // LO specific
  requestedBy?: string; // office or person
  queryText?: string; // The legal question asked
  conclusion?: string; // The legal opinion/decision
  assignedCounsel?: string; // lawyer in charge
  references?: string[]; // cited regulations/laws
  
  // Shared
  attachments: Attachment[];
  notes?: string;
  
  // Partnership Management Additions
  organizationId?: string; // references PartnerOrganization.id
  versions?: ContractVersion[];
  tasks?: LegalTask[];
  timeline?: TimelineEvent[];
  departmentOwner?: string;
  createdBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  lastReviewDate?: string;
  confidentialityLevel?: 'Public' | 'Confidential' | 'Strictly Confidential';
  retentionPeriod?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';

  // Customized MOA fields
  school?: string;
  course?: string;
  hours?: number;
  workflowStage?: string;
  studentIds?: string[];

  // System metadata
  syncStatus: 'local' | 'synced' | 'pending_sync';
  createdAt: string;
  updatedAt: string;
}

export interface OJTStudent {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  school?: string;
  office?: string;
  address?: string;
  email: string;
  course: string;
  yearAndSection: string;
  moaId: string; // references MOA RecordItem.id
  organizationId?: string; // references PartnerOrganization.id
  hoursRequired: number;
  hoursCompleted: number;
  status: 'Not Started' | 'On-going' | 'Completed' | 'Suspended';
  startDate?: string;
  endDate?: string;
  legacyHours?: number;
  createdAt: string;
  updatedAt: string;
}

export type TimeLogStatus = 'Pending' | 'Approved' | 'Rejected';

export interface OJTTimeLog {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // HH:mm
  timeOut: string; // HH:mm
  breakMinutes: number;
  hoursRendered: number;
  isManualOverride?: boolean;
  manualOverrideReason?: string;
  notes?: string;
  status: TimeLogStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudSyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

export interface DashboardStats {
  totalMOA: number;
  activeMOA: number;
  expiredMOA: number;
  archivedMOA: number;
  totalLO: number;
  issuedLO: number;
  archivedLO: number;
  pendingSync: number;
  totalOrganizations: number;
  activeStudents: number;
}

export type NotificationState = 'Unread' | 'Read' | 'Resolved' | 'Archived';

export type NotificationType = 
  | 'HALFWAY_PROGRESS'
  | 'MISSING_MOA'
  | 'MISSING_LO'
  | 'DEV_PLACEHOLDER'
  | 'ENDING_SOON'
  | 'COMPLETED'
  | 'PROFILE_REQUEST';

export interface OJTNotification {
  id: string;
  hashKey: string;
  studentId?: string;
  studentName?: string;
  type: NotificationType;
  state: NotificationState;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  isPlaceholder?: boolean;
  actionPayload?: {
    tab: 'students';
    studentId: string;
  };
}
