import { RecordItem, DashboardStats, Attachment, OJTStudent, PartnerOrganization, OJTTimeLog, TimeLogStatus } from '../types';

export interface SystemSettings {
  universityName: string;
  departmentName: string;
  isFirebaseSimulated: boolean;
  firebaseApiKey: string;
  firebaseProjectId: string;
  machineId: string;
}

export interface UserSession {
  username: string;
  name: string;
  role: 'Administrator' | 'Legal Team' | 'OJT Coordinator';
}

// ============================================
// Multi-User Session Authentication API
// ============================================

export function getCurrentUser(): UserSession | null {
  const userJson = localStorage.getItem('moa_lo_current_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: UserSession | null): void {
  if (user) {
    localStorage.setItem('moa_lo_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('moa_lo_current_user');
  }
}

export async function login(username: string, password: string): Promise<UserSession> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Invalid credentials' }));
    throw new Error(err.message || 'Authentication failed');
  }
  
  const data = await res.json();
  setCurrentUser(data.user);
  return data.user;
}

export function logout(): void {
  setCurrentUser(null);
}

// ============================================
// Partner Organizations API
// ============================================

export async function getOrganizations(): Promise<PartnerOrganization[]> {
  const res = await fetch('/api/organizations');
  if (!res.ok) throw new Error('Failed to fetch organizations from central server');
  return res.json();
}

export async function createOrganization(organization: Omit<PartnerOrganization, 'id' | 'createdAt' | 'updatedAt'>): Promise<PartnerOrganization> {
  const user = getCurrentUser();
  const res = await fetch('/api/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organization, user })
  });
  if (!res.ok) throw new Error('Failed to create organization on central server');
  return res.json();
}

export async function updateOrganization(id: string, updates: Partial<Omit<PartnerOrganization, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PartnerOrganization> {
  const user = getCurrentUser();
  const res = await fetch(`/api/organizations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates, user })
  });
  if (!res.ok) throw new Error('Failed to update organization on central server');
  return res.json();
}

export async function deleteOrganization(id: string): Promise<void> {
  const user = getCurrentUser();
  const res = await fetch(`/api/organizations/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user })
  });
  if (!res.ok) throw new Error('Failed to delete organization from central server');
}

// ============================================
// Core Storage API (REST API calls to Central Server)
// ============================================

export async function getRecords(): Promise<RecordItem[]> {
  const res = await fetch('/api/records');
  if (!res.ok) throw new Error('Failed to fetch records from central server');
  return res.json();
}

export async function createRecord(record: Omit<RecordItem, 'id' | 'controlNumber' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<RecordItem> {
  const user = getCurrentUser();
  const res = await fetch('/api/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record, user })
  });
  if (!res.ok) throw new Error('Failed to create record on central server');
  return res.json();
}

export async function updateRecord(id: string, updates: Partial<Omit<RecordItem, 'id' | 'controlNumber' | 'createdAt' | 'updatedAt'>>): Promise<RecordItem> {
  const user = getCurrentUser();
  const res = await fetch(`/api/records/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates, user })
  });
  if (!res.ok) throw new Error('Failed to update record on central server');
  return res.json();
}

export async function deleteRecord(id: string): Promise<void> {
  const user = getCurrentUser();
  const res = await fetch(`/api/records/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user })
  });
  if (!res.ok) throw new Error('Failed to delete record from central server');
}

// ============================================
// OJT Students API
// ============================================

export async function getStudents(): Promise<OJTStudent[]> {
  const res = await fetch('/api/students');
  if (!res.ok) throw new Error('Failed to fetch student list from central server');
  return res.json();
}

export async function createStudent(student: Omit<OJTStudent, 'id' | 'createdAt' | 'updatedAt'>): Promise<OJTStudent> {
  const user = getCurrentUser();
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student, user })
  });
  if (!res.ok) throw new Error('Failed to enroll student on central server');
  return res.json();
}

export async function updateStudent(id: string, updates: Partial<Omit<OJTStudent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<OJTStudent> {
  const user = getCurrentUser();
  const res = await fetch(`/api/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates, user })
  });
  if (!res.ok) throw new Error('Failed to update student on central server');
  return res.json();
}

export async function deleteStudent(id: string): Promise<void> {
  const user = getCurrentUser();
  const res = await fetch(`/api/students/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user })
  });
  if (!res.ok) throw new Error('Failed to delete student from central server');
}

// ============================================
// Audit Logs API
// ============================================

export async function getAuditLogs(): Promise<any[]> {
  const res = await fetch('/api/audit-logs');
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

// ============================================
// System Settings API
// ============================================

export function getSettings(): SystemSettings {
  const data = localStorage.getItem('moa_lo_settings');
  const defaultSettings: SystemSettings = {
    universityName: 'University of Technology',
    departmentName: 'Office of Legal Affairs & Legal Records',
    isFirebaseSimulated: true,
    firebaseApiKey: '',
    firebaseProjectId: 'moa-lo-tracker-prod',
    machineId: 'central-server'
  };

  if (!data) {
    localStorage.setItem('moa_lo_settings', JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultSettings;
  }
}

export async function fetchSettingsFromServer(): Promise<SystemSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  const serverSettings = await res.json();
  localStorage.setItem('moa_lo_settings', JSON.stringify(serverSettings));
  return serverSettings;
}

export async function saveSettings(settings: SystemSettings): Promise<void> {
  const user = getCurrentUser();
  localStorage.setItem('moa_lo_settings', JSON.stringify(settings));
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings, user })
  });
  if (!res.ok) throw new Error('Failed to save settings on central server');
}

export async function importBackup(records: RecordItem[], students: OJTStudent[], organizations?: PartnerOrganization[]): Promise<any> {
  const user = getCurrentUser();
  const res = await fetch('/api/backup/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records, students, organizations, user })
  });
  if (!res.ok) throw new Error('Failed to restore backup database');
  return res.json();
}

export async function createStudentsBulk(students: Omit<OJTStudent, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<OJTStudent[]> {
  const user = getCurrentUser();
  const res = await fetch('/api/students/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students, user })
  });
  if (!res.ok) throw new Error('Failed to bulk enroll students');
  const data = await res.json();
  return data.students;
}

export async function getStats(): Promise<DashboardStats> {
  const records = await getRecords();
  const moas = records.filter(r => r.type === 'MOA');
  const los = records.filter(r => r.type === 'LO');
  const orgs = await getOrganizations().catch(() => []);
  const students = await getStudents().catch(() => []);
  return {
    totalMOA: moas.length,
    activeMOA: moas.filter(r => r.status === 'Active').length,
    expiredMOA: moas.filter(r => r.status === 'Expired').length,
    archivedMOA: moas.filter(r => r.status === 'Archived').length,
    totalLO: los.length,
    issuedLO: los.filter(r => r.status === 'Issued').length,
    archivedLO: los.filter(r => r.status === 'Archived').length,
    pendingSync: 0,
    totalOrganizations: orgs.length,
    activeStudents: students.filter(s => s.status === 'On-going').length
  };
}

// ============================================
// OJT Notifications Storage API
// ============================================

export function getStoredNotifications(): import('../types').OJTNotification[] {
  const raw = localStorage.getItem('moa_lo_notifications');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredNotifications(notifications: import('../types').OJTNotification[]): void {
  localStorage.setItem('moa_lo_notifications', JSON.stringify(notifications));
}

// ============================================
// OJT Time Logs Storage & REST API Wrappers
// ============================================

export async function getTimeLogs(studentId?: string): Promise<OJTTimeLog[]> {
  const url = studentId ? `/api/time-logs?studentId=${encodeURIComponent(studentId)}` : '/api/time-logs';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch time logs from server');
  return res.json();
}

export async function createTimeLog(
  log: Omit<OJTTimeLog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ log: OJTTimeLog; updatedStudent?: OJTStudent } & OJTTimeLog> {
  const user = getCurrentUser();
  const res = await fetch('/api/time-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ log, user })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create time log' }));
    throw new Error(err.error || 'Failed to create time log');
  }
  return res.json();
}

export async function updateTimeLog(
  id: string,
  updates: Partial<OJTTimeLog>
): Promise<{ log: OJTTimeLog; updatedStudent?: OJTStudent }> {
  const user = getCurrentUser();
  const res = await fetch(`/api/time-logs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates, user })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update time log' }));
    throw new Error(err.error || 'Failed to update time log');
  }
  return res.json();
}

export async function approveTimeLog(
  id: string
): Promise<{ log: OJTTimeLog; updatedStudent: OJTStudent }> {
  const user = getCurrentUser();
  const res = await fetch(`/api/time-logs/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to approve time log' }));
    throw new Error(err.error || 'Failed to approve time log');
  }
  return res.json();
}

export async function rejectTimeLog(
  id: string,
  rejectionReason: string
): Promise<{ log: OJTTimeLog; updatedStudent: OJTStudent }> {
  const user = getCurrentUser();
  const res = await fetch(`/api/time-logs/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectionReason, user })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to reject time log' }));
    throw new Error(err.error || 'Failed to reject time log');
  }
  return res.json();
}

export async function deleteTimeLog(
  id: string,
  userParam?: UserSession | null
): Promise<{ success: boolean; updatedStudent?: OJTStudent }> {
  const user = userParam || getCurrentUser();
  const query = user ? `?user=${encodeURIComponent(JSON.stringify(user))}` : '';
  const res = await fetch(`/api/time-logs/${id}${query}`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      ...(user ? { 'X-User': JSON.stringify(user) } : {})
    },
    body: JSON.stringify({ user })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete time log' }));
    throw new Error(err.error || 'Failed to delete time log');
  }
  return res.json();
}

export async function bulkApproveTimeLogs(
  ids: string[]
): Promise<{ count: number; updatedStudents: OJTStudent[] }> {
  const user = getCurrentUser();
  const res = await fetch('/api/time-logs/bulk-approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, user })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to bulk approve time logs' }));
    throw new Error(err.error || 'Failed to bulk approve time logs');
  }
  return res.json();
}

export async function createTimeLogsBulk(
  logs: (Omit<OJTTimeLog, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: TimeLogStatus; reviewedBy?: string; reviewedAt?: string })[],
  replaceExisting: boolean
): Promise<{
  created: OJTTimeLog[];
  skipped: { date: string; status: TimeLogStatus }[];
  replaced: { date: string; original: OJTTimeLog; updated: OJTTimeLog }[];
  protected: { date: string; status: TimeLogStatus }[];
  failed: { date: string; reason: string }[];
}> {
  const user = getCurrentUser();
  const res = await fetch('/api/time-logs/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs, replaceExisting, user })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to complete bulk daily time entry' }));
    throw new Error(err.error || 'Failed to complete bulk daily time entry');
  }
  return res.json();
}
