import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001; // Port 3001 for dev API server (Vite proxies to this)

// Configure middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // support large files (up to 50MB PDF uploads)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup storage paths
const DATA_DIR = path.join(__dirname, 'data');
const ATTACHMENTS_DIR = path.join(DATA_DIR, 'attachments');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const ORGANIZATIONS_FILE = path.join(DATA_DIR, 'organizations.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const TIME_LOGS_FILE = path.join(DATA_DIR, 'time_logs.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

// Initial Mock Data Seeds for Organizations and Records
const INITIAL_ORGANIZATIONS: any[] = [
  {
    id: 'org-google',
    name: 'Google Philippines Inc.',
    address: 'SPC Building, Bonifacio Global City, Taguig City, Metro Manila',
    contactPerson: 'Bernadette L. Sy',
    contactNumber: '+63 2 8876 1234',
    email: 'bernadette.sy@google.com',
    industry: 'Technology / Software',
    notes: 'Industry partner for computer science and IT internship placement.',
    status: 'Active',
    createdAt: '2026-08-05T14:30:00.000Z',
    updatedAt: '2026-08-05T14:30:00.000Z',
    timeline: [
      {
        id: 't-org-1',
        type: 'Created',
        description: 'Organization profile added to registry',
        timestamp: '2026-08-05T14:30:00.000Z',
        user: 'Administrator'
      }
    ]
  },
  {
    id: 'org-capitol-health',
    name: 'Capitol Regional Health & Medical Center',
    address: 'Capitol Compound, Lingayen, Pangasinan',
    contactPerson: 'Dr. Maria Teresa Santos',
    contactNumber: '+63 75 522 8900',
    email: 'contact@capitolhealth.gov.ph',
    industry: 'Healthcare / Hospital',
    notes: 'Clinical internship and nursing rotation agreement.',
    status: 'Active',
    createdAt: '2026-08-05T14:45:00.000Z',
    updatedAt: '2026-08-05T14:45:00.000Z',
    timeline: [
      {
        id: 't-org-2',
        type: 'Created',
        description: 'Organization profile added to registry',
        timestamp: '2026-08-05T14:45:00.000Z',
        user: 'Administrator'
      }
    ]
  },
  {
    id: 'org-pangasinan-tech',
    name: 'Pangasinan Tech & Innovation Hub',
    address: 'Provincial Capitol Compound, Lingayen, Pangasinan',
    contactPerson: 'Engr. Marco V. Ramos',
    contactNumber: '+63 75 632 1144',
    email: 'info@pangasinan-tech.org',
    industry: 'Research & Technology',
    notes: 'Joint software development and AI incubation partner.',
    status: 'Active',
    createdAt: '2026-08-05T15:00:00.000Z',
    updatedAt: '2026-08-05T15:00:00.000Z',
    timeline: [
      {
        id: 't-org-3',
        type: 'Created',
        description: 'Organization profile added to registry',
        timestamp: '2026-08-05T15:00:00.000Z',
        user: 'Administrator'
      }
    ]
  }
];

const INITIAL_RECORDS: any[] = [
  {
    id: 'rec-moa-2026-0001',
    controlNumber: 'MOA-2026-0001',
    type: 'MOA',
    title: 'Memorandum of Agreement for Industry Internship with Google Philippines Inc.',
    description: 'Establishment of a 480-hour industry internship program for Bachelor of Science in Computer Science and Information Technology students.',
    status: 'Active',
    issueDate: '2026-01-15',
    expirationDate: '2029-01-15',
    isIndefinite: false,
    parties: ['University of Technology', 'Google Philippines Inc.'],
    signatories: ['Dr. Arthur M. Vance (University President)', 'Bernadette L. Sy (Country Director)'],
    category: 'Internship & OJT',
    department: 'College of Computer Studies',
    organizationId: 'org-google',
    departmentOwner: 'College of Computer Studies',
    createdBy: 'Administrator',
    reviewedBy: 'Atty. Clara S. Reyes',
    approvedBy: 'Dr. Arthur M. Vance',
    lastReviewDate: '2026-01-14',
    confidentialityLevel: 'Confidential',
    retentionPeriod: '5 Years',
    riskLevel: 'Low',
    attachments: [],
    versions: [],
    tasks: [],
    timeline: [
      {
        id: 'tl-1',
        type: 'Created',
        description: 'Record created in the tracker system.',
        timestamp: '2026-08-05T14:30:00.000Z',
        user: 'Administrator'
      }
    ],
    notes: 'Primary industry placement partner for computer science students.',
    syncStatus: 'synced',
    createdAt: '2026-08-05T14:30:00.000Z',
    updatedAt: '2026-08-05T14:30:00.000Z'
  },
  {
    id: 'rec-moa-2026-0002',
    controlNumber: 'MOA-2026-0002',
    type: 'MOA',
    title: 'Clinical Rotatory Placement Agreement with Capitol Regional Health Center',
    description: 'Clinical internship and practical hospital training agreement for Nursing and Allied Health students.',
    status: 'Active',
    issueDate: '2026-02-01',
    expirationDate: '2028-02-01',
    isIndefinite: false,
    parties: ['University of Technology', 'Capitol Regional Health & Medical Center'],
    signatories: ['Dr. Arthur M. Vance (University President)', 'Dr. Maria Teresa Santos (Chief of Hospital)'],
    category: 'Clinical Placement',
    department: 'College of Nursing & Health Sciences',
    organizationId: 'org-capitol-health',
    departmentOwner: 'College of Nursing',
    createdBy: 'Prof. Elena Rostova',
    reviewedBy: 'Atty. Clara S. Reyes',
    lastReviewDate: '2026-02-05',
    confidentialityLevel: 'Confidential',
    retentionPeriod: '5 Years',
    riskLevel: 'Medium',
    attachments: [],
    versions: [],
    tasks: [],
    timeline: [
      {
        id: 'tl-2',
        type: 'Created',
        description: 'Agreement logged into storage.',
        timestamp: '2026-08-05T14:45:00.000Z',
        user: 'Prof. Elena Rostova'
      }
    ],
    notes: 'Clinical liability clauses included.',
    syncStatus: 'synced',
    createdAt: '2026-08-05T14:45:00.000Z',
    updatedAt: '2026-08-05T14:45:00.000Z'
  },
  {
    id: 'rec-moa-2026-0003',
    controlNumber: 'MOA-2026-0003',
    type: 'MOA',
    title: 'Joint Research and Innovation Partnership MOA with Pangasinan Tech Hub',
    description: 'Collaborative research, software incubator programs, and AI research projects between the University and Pangasinan Tech Hub.',
    status: 'Active',
    issueDate: '2026-03-10',
    expirationDate: '2029-03-10',
    isIndefinite: false,
    parties: ['University of Technology', 'Pangasinan Tech & Innovation Hub'],
    signatories: ['Dr. Arthur M. Vance (University President)', 'Engr. Marco V. Ramos (Executive Director)'],
    category: 'Research & Development',
    department: 'Office of Research and Extension',
    organizationId: 'org-pangasinan-tech',
    departmentOwner: 'Office of Research and Extension',
    createdBy: 'Dr. Samuel K. Tan',
    reviewedBy: 'Atty. Clara S. Reyes',
    approvedBy: 'Dr. Arthur M. Vance',
    lastReviewDate: '2026-03-08',
    confidentialityLevel: 'Public',
    retentionPeriod: '5 Years',
    riskLevel: 'Low',
    attachments: [],
    versions: [],
    tasks: [],
    timeline: [
      {
        id: 'tl-3',
        type: 'Created',
        description: 'Executed partnership agreement logged into tracker.',
        timestamp: '2026-08-05T15:00:00.000Z',
        user: 'Dr. Samuel K. Tan'
      }
    ],
    notes: 'Includes joint incubator space and hardware testing lab access.',
    syncStatus: 'synced',
    createdAt: '2026-08-05T15:00:00.000Z',
    updatedAt: '2026-08-05T15:00:00.000Z'
  },
  {
    id: 'rec-lo-2026-0001',
    controlNumber: 'LO-2026-0001',
    type: 'LO',
    title: 'Legal Opinion on Data Privacy Compliance for Student OJT Records Sharing',
    description: 'Formal legal analysis regarding the disclosure of student scholastic and OJT records to external host training establishments under the Data Privacy Act.',
    status: 'Issued',
    requestDate: '2026-02-10',
    issueDate: '2026-02-28',
    requestedBy: 'Office of the University Registrar',
    queryText: 'Is written consent required from OJT students prior to transmitting internship performance files to partner companies?',
    conclusion: 'Yes. Standard authorization waivers must be signed during internship orientation prior to records disclosure.',
    assignedCounsel: 'Atty. Clara S. Reyes (Chief Legal Counsel)',
    references: ['Republic Act No. 10173 (Data Privacy Act of 2012)', 'NPC Advisory Opinion No. 2018-031'],
    attachments: [],
    notes: 'Registrar circular distributed to all college deans.',
    syncStatus: 'synced',
    createdAt: '2026-08-05T15:05:00.000Z',
    updatedAt: '2026-08-05T15:05:00.000Z'
  },
  {
    id: 'rec-lo-2026-0002',
    controlNumber: 'LO-2026-0002',
    type: 'LO',
    title: 'Legal Opinion on Intellectual Property Ownership for University Incubator Projects',
    description: 'Legal framework opinion concerning patent rights and software ownership produced by student interns during commercial OJT placements.',
    status: 'Issued',
    requestDate: '2026-03-01',
    requestedBy: 'Office of Technology Transfer & Commercialization',
    queryText: 'How are IP rights allocated between the University, the student intern, and the host establishment?',
    conclusion: 'Joint IP agreement clauses must be attached to the primary MOA prior to student deployment.',
    assignedCounsel: 'Atty. Clara S. Reyes (Chief Legal Counsel)',
    references: ['Republic Act No. 8293 (Intellectual Property Code of the Philippines)'],
    attachments: [],
    notes: 'Legal opinion archived.',
    syncStatus: 'synced',
    createdAt: '2026-08-05T15:10:00.000Z',
    updatedAt: '2026-08-05T15:10:00.000Z'
  }
];

const INITIAL_STUDENTS: any[] = [];

const DEFAULT_SETTINGS = {
  universityName: 'University of Technology',
  departmentName: 'Office of Legal Affairs & Legal Records',
  isFirebaseSimulated: true,
  firebaseApiKey: '',
  firebaseProjectId: 'moa-lo-tracker-prod',
  machineId: 'central-server'
};

// Create dummy files for initial run if they don't exist
const createDummyPDF = (fileName: string) => {
  const filePath = path.join(ATTACHMENTS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from('%PDF-1.4 [Demo PDF Attachment Content for Local Network server]'));
  }
};

// Create initial attachments if they don't exist
createDummyPDF('att-1-Google_Internship_MOA_Signed_2026.pdf');
createDummyPDF('att-2-MIT_Lincoln_Joint_Research_Draft_v4.pdf');
createDummyPDF('att-3-Manila_Health_Outreach_MOA_Complete.pdf');

// Helper functions for reading/writing data
const readJSON = (filePath: string, defaultData: any) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return defaultData;
  }
};

const writeJSON = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
};

// File Attachment Extractor
const processAttachments = async (attachments: any[]) => {
  if (!attachments || !Array.isArray(attachments)) return [];
  
  const processed = [];
  for (const att of attachments) {
    if (att.dataUrl && att.dataUrl.startsWith('data:')) {
      try {
        const parts = att.dataUrl.split(';base64,');
        if (parts.length === 2) {
          const base64Data = parts[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Create safe file name
          const safeFileName = att.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const serverFilename = `att-${Date.now()}-${safeFileName}`;
          const filePath = path.join(ATTACHMENTS_DIR, serverFilename);
          
          fs.writeFileSync(filePath, buffer);
          
          // Decouple storage: save attachment with absolute path served by backend
          processed.push({
            id: att.id,
            fileName: att.fileName,
            mimeType: att.mimeType,
            fileSize: att.fileSize,
            uploadedAt: att.uploadedAt,
            dataUrl: `/attachments/${serverFilename}`
          });
        } else {
          processed.push(att);
        }
      } catch (e) {
        console.error('Error processing attachment file upload:', e);
        processed.push(att);
      }
    } else {
      processed.push(att);
    }
  }
  return processed;
};

// Log Audit Events helper
const logAuditEvent = (user: { name: string; role: string } | null, action: string, details: string) => {
  const logs = readJSON(AUDIT_LOGS_FILE, []);
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userName: user ? user.name : 'System/Anonymous',
    userRole: user ? user.role : 'System',
    action,
    details
  };
  logs.unshift(newLog);
  writeJSON(AUDIT_LOGS_FILE, logs);
};

// Serve local attachments directory
app.use('/attachments', express.static(ATTACHMENTS_DIR));

// ============================================
// API Endpoints
// ============================================

// Authentication Endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Hardcoded central users for local network routing
  const users = [
    { username: 'admin', password: 'admin123', name: 'Administrator', role: 'Administrator' },
    { username: 'legal', password: 'legal123', name: 'Legal Counsel', role: 'Legal Team' },
    { username: 'ojt', password: 'ojt123', name: 'OJT Coordinator', role: 'OJT Coordinator' }
  ];

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const sessionUser = { name: user.name, role: user.role, username: user.username };
    logAuditEvent(sessionUser, 'LOGIN', `Logged in from network client`);
    res.json({ success: true, user: sessionUser });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Partner Organizations REST API
app.get('/api/organizations', (req, res) => {
  const organizations = readJSON(ORGANIZATIONS_FILE, INITIAL_ORGANIZATIONS);
  res.json(organizations);
});

app.post('/api/organizations', (req, res) => {
  const { organization, user } = req.body;
  const organizations = readJSON(ORGANIZATIONS_FILE, INITIAL_ORGANIZATIONS);

  const newOrg = {
    ...organization,
    id: `org-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        id: `t-${Date.now()}`,
        type: 'Created',
        description: `Organization profile "${organization.name}" was created.`,
        timestamp: new Date().toISOString(),
        user: user ? user.name : 'System'
      }
    ]
  };

  organizations.unshift(newOrg);
  writeJSON(ORGANIZATIONS_FILE, organizations);

  logAuditEvent(user, 'CREATE_ORGANIZATION', `Created organization profile: "${newOrg.name}"`);
  res.json(newOrg);
});

app.put('/api/organizations/:id', (req, res) => {
  const { id } = req.params;
  const { updates, user } = req.body;
  const organizations = readJSON(ORGANIZATIONS_FILE, INITIAL_ORGANIZATIONS);

  const index = organizations.findIndex((o: any) => o.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const existing = organizations[index];
  
  // Update timeline if status changed
  const timeline = [...(existing.timeline || [])];
  if (updates.status && updates.status !== existing.status) {
    timeline.unshift({
      id: `t-${Date.now()}`,
      type: 'Updated',
      description: `Organization status changed to "${updates.status}".`,
      timestamp: new Date().toISOString(),
      user: user ? user.name : 'System'
    });
  }

  const updatedOrg = {
    ...existing,
    ...updates,
    timeline,
    updatedAt: new Date().toISOString()
  };

  organizations[index] = updatedOrg;
  writeJSON(ORGANIZATIONS_FILE, organizations);

  logAuditEvent(user, 'UPDATE_ORGANIZATION', `Updated organization profile: "${updatedOrg.name}"`);
  res.json(updatedOrg);
});

app.delete('/api/organizations/:id', (req, res) => {
  const { id } = req.params;
  const user = req.body.user;
  const organizations = readJSON(ORGANIZATIONS_FILE, INITIAL_ORGANIZATIONS);

  const match = organizations.find((o: any) => o.id === id);
  if (!match) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const filtered = organizations.filter((o: any) => o.id !== id);
  writeJSON(ORGANIZATIONS_FILE, filtered);

  logAuditEvent(user, 'DELETE_ORGANIZATION', `Deleted organization profile: "${match.name}"`);
  res.json({ success: true });
});

// Records REST API
app.get('/api/records', (req, res) => {
  const records = readJSON(RECORDS_FILE, INITIAL_RECORDS);
  res.json(records);
});

app.post('/api/records', async (req, res) => {
  const { record, user } = req.body;
  const records = readJSON(RECORDS_FILE, INITIAL_RECORDS);

  // Generate appropriate sequential control number based on type
  const year = new Date().getFullYear();
  const sameTypeAndYear = records.filter((r: any) => r.type === record.type && r.controlNumber.startsWith(`${record.type}-${year}`));
  
  let nextSeqNum = 1;
  if (sameTypeAndYear.length > 0) {
    const sequences = sameTypeAndYear.map((r: any) => {
      const parts = r.controlNumber.split('-');
      const seqStr = parts[parts.length - 1];
      return parseInt(seqStr, 10) || 0;
    });
    nextSeqNum = Math.max(...sequences) + 1;
  }
  
  const seqStr = String(nextSeqNum).padStart(4, '0');
  const controlNumber = `${record.type}-${year}-${seqStr}`;

  // Decouple attachments and write them to disk
  const processedAttachments = await processAttachments(record.attachments);

  // Parse versions or establish first version if attachments exist
  let versions = record.versions || [];
  if (versions.length === 0 && processedAttachments.length > 0) {
    versions = processedAttachments.map((att: any, idx: number) => ({
      id: `ver-${Date.now()}-${idx}`,
      versionNumber: idx + 1,
      status: record.status || 'Active',
      notes: 'Initial executed version of the document.',
      uploadedBy: user ? user.name : 'System',
      uploadedAt: new Date().toISOString(),
      fileName: att.fileName,
      fileSize: att.fileSize,
      dataUrl: att.dataUrl
    }));
  }

  // Setup first timeline event
  const timeline = record.timeline || [
    {
      id: `tl-${Date.now()}`,
      type: 'Created',
      description: `Document record with Control No: ${controlNumber} was created.`,
      timestamp: new Date().toISOString(),
      user: user ? user.name : 'System'
    }
  ];

  const newRecord = {
    ...record,
    id: `rec-${record.type.toLowerCase()}-${Date.now()}`,
    controlNumber,
    attachments: processedAttachments,
    versions,
    tasks: record.tasks || [],
    timeline,
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  records.unshift(newRecord);
  writeJSON(RECORDS_FILE, records);

  logAuditEvent(user, 'CREATE_RECORD', `Created ${newRecord.type} control: ${newRecord.controlNumber} - "${newRecord.title}"`);
  res.json(newRecord);
});

app.put('/api/records/:id', async (req, res) => {
  const { id } = req.params;
  const { updates, user } = req.body;
  const records = readJSON(RECORDS_FILE, INITIAL_RECORDS);

  const index = records.findIndex((r: any) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const existing = records[index];
  
  // Decouple newly added attachments
  const processedAttachments = await processAttachments(updates.attachments);

  // Compute timeline updates
  const timeline = [...(updates.timeline || existing.timeline || [])];
  if (updates.status && updates.status !== existing.status) {
    timeline.unshift({
      id: `tl-${Date.now()}`,
      type: 'Updated',
      description: `Document lifecycle status changed from "${existing.status}" to "${updates.status}".`,
      timestamp: new Date().toISOString(),
      user: user ? user.name : 'System'
    });
  }

  const updatedRecord = {
    ...existing,
    ...updates,
    attachments: processedAttachments,
    versions: updates.versions || existing.versions || [],
    tasks: updates.tasks || existing.tasks || [],
    timeline,
    syncStatus: 'synced',
    updatedAt: new Date().toISOString()
  };

  records[index] = updatedRecord;
  writeJSON(RECORDS_FILE, records);

  logAuditEvent(user, 'UPDATE_RECORD', `Updated ${updatedRecord.type} control: ${updatedRecord.controlNumber} - "${updatedRecord.title}"`);
  res.json(updatedRecord);
});

app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const user = req.body.user;
  const records = readJSON(RECORDS_FILE, INITIAL_RECORDS);

  const match = records.find((r: any) => r.id === id);
  if (!match) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const filtered = records.filter((r: any) => r.id !== id);
  writeJSON(RECORDS_FILE, filtered);

  logAuditEvent(user, 'DELETE_RECORD', `Deleted ${match.type} control: ${match.controlNumber}`);
  res.json({ success: true });
});

// Students REST API
app.get('/api/students', (req, res) => {
  const students = readJSON(STUDENTS_FILE, INITIAL_STUDENTS);
  res.json(students);
});

app.post('/api/students', (req, res) => {
  const { student, user } = req.body;
  const students = readJSON(STUDENTS_FILE, INITIAL_STUDENTS);

  const newStudent = {
    ...student,
    id: `stud-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  students.unshift(newStudent);
  writeJSON(STUDENTS_FILE, students);

  logAuditEvent(user, 'CREATE_STUDENT', `Enrolled student: ${newStudent.firstName} ${newStudent.lastName} (${newStudent.studentId})`);
  res.json(newStudent);
});

app.post('/api/students/bulk', (req, res) => {
  const { students: importedStudents, user } = req.body;
  const students = readJSON(STUDENTS_FILE, INITIAL_STUDENTS);

  const newStudents = (importedStudents || []).map((s: any, idx: number) => ({
    ...s,
    id: s.id || `stud-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
    createdAt: s.createdAt || new Date().toISOString(),
    updatedAt: s.updatedAt || new Date().toISOString()
  }));

  const merged = [...newStudents, ...students];
  writeJSON(STUDENTS_FILE, merged);

  logAuditEvent(user, 'CREATE_STUDENT_BULK', `Bulk enrolled ${newStudents.length} students`);
  res.json({ success: true, students: merged });
});

app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { updates, user } = req.body;
  const students = readJSON(STUDENTS_FILE, INITIAL_STUDENTS);

  const index = students.findIndex((s: any) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const existing = students[index];
  const updatedStudent = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  students[index] = updatedStudent;
  writeJSON(STUDENTS_FILE, students);

  logAuditEvent(user, 'UPDATE_STUDENT', `Updated student details for: ${updatedStudent.firstName} ${updatedStudent.lastName}`);
  res.json(updatedStudent);
});

app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const user = req.body.user;
  const students = readJSON(STUDENTS_FILE, INITIAL_STUDENTS);

  const match = students.find((s: any) => s.id === id);
  if (!match) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const filtered = students.filter((s: any) => s.id !== id);
  writeJSON(STUDENTS_FILE, filtered);

  logAuditEvent(user, 'DELETE_STUDENT', `Unenrolled student: ${match.firstName} ${match.lastName} (${match.studentId})`);
  res.json({ success: true });
});

// ============================================
// Helper functions for deriving student completed hours strictly from Approved time logs
// ============================================
const calculateStudentProgressFromApprovedLogs = (student: any, approvedLogs: any[]) => {
  const sortedLogs = [...approvedLogs].sort((a: any, b: any) => a.date.localeCompare(b.date));
  const targetHours = Number(student.hoursRequired) || 0;
  
  let appliedLegacyHours = 0;
  if (student.legacyHours !== undefined && student.legacyHours !== null && student.legacyHours !== '') {
    appliedLegacyHours = Number(student.legacyHours);
  } else if (student.startDate && targetHours > 0) {
    const start = new Date(student.startDate).getTime();
    const msRequired = ((targetHours / 40) + 4) * 7 * 24 * 60 * 60 * 1000;
    if (Date.now() > start + msRequired) {
      appliedLegacyHours = targetHours;
    }
  }

  const dtrHours = sortedLogs.reduce((sum: number, tl: any) => sum + (Number(tl.hoursRendered) || 0), 0);
  const totalApprovedHours = dtrHours + appliedLegacyHours;
  const roundedHours = Math.round(totalApprovedHours * 100) / 100;
  
  let calculatedEndDate: string | null = null;
  let cumulativeApproved = appliedLegacyHours;
  
  if (cumulativeApproved >= targetHours && targetHours > 0) {
    calculatedEndDate = student.endDate || (student.startDate ? new Date(new Date(student.startDate).getTime() + (targetHours / 40) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  }
  
  for (const log of sortedLogs) {
    if (cumulativeApproved >= targetHours && calculatedEndDate) break;
    cumulativeApproved += (Number(log.hoursRendered) || 0);
    if (cumulativeApproved >= targetHours && !calculatedEndDate) {
      calculatedEndDate = log.date;
    }
  }
  
  const isCompleted = roundedHours >= targetHours && targetHours > 0;
  
  let finalHoursCompleted = roundedHours;
  let finalStatus = student.status;
  let finalEndDate = null;

  if (isCompleted) {
    finalHoursCompleted = roundedHours;
    finalStatus = 'Completed';
    finalEndDate = calculatedEndDate;
  } else if (student.status === 'Completed' && targetHours > 0 && appliedLegacyHours === 0) {
    finalHoursCompleted = Math.max(roundedHours, targetHours);
    finalStatus = 'Completed';
    finalEndDate = student.endDate || null;
  } else {
    finalStatus = student.status === 'Completed' ? 'On-going' : student.status;
    finalEndDate = null;
  }
  
  return {
    hoursCompleted: finalHoursCompleted,
    status: finalStatus,
    endDate: finalEndDate,
    legacyHours: appliedLegacyHours
  };
};

const recalculateStudentHours = (studentId: string, user: { name: string; role: string } | null = null) => {
  const timeLogs = readJSON(TIME_LOGS_FILE, []);
  const students = readJSON(STUDENTS_FILE, INITIAL_STUDENTS);

  const approvedLogs = timeLogs.filter((tl: any) => tl.studentId === studentId && tl.status === 'Approved');
  const studentIndex = students.findIndex((s: any) => s.id === studentId);
  let updatedStudent = null;

  if (studentIndex !== -1) {
    const student = students[studentIndex];
    const oldStatus = student.status;
    const oldEndDate = student.endDate;

    const progress = calculateStudentProgressFromApprovedLogs(student, approvedLogs);

    if (
      student.hoursCompleted !== progress.hoursCompleted ||
      student.status !== progress.status ||
      student.endDate !== progress.endDate ||
      student.legacyHours !== progress.legacyHours
    ) {
      students[studentIndex] = {
        ...student,
        hoursCompleted: progress.hoursCompleted,
        status: progress.status,
        endDate: progress.endDate,
        legacyHours: progress.legacyHours,
        updatedAt: new Date().toISOString()
      };
      writeJSON(STUDENTS_FILE, students);
      updatedStudent = students[studentIndex];

      // Audit log transition shifts if user/system context is active
      const targetHours = Number(student.hoursRequired) || 0;
      if (oldStatus !== progress.status || oldEndDate !== progress.endDate) {
        const auditUser = user || { name: 'System', role: 'System' };
        if (progress.status === 'Completed') {
          const auditMsg = `Student ${student.firstName} ${student.lastName} (${student.studentId}) reached OJT completion. Required: ${targetHours} hrs. Completed: ${progress.hoursCompleted} hrs. Dynamic completion date: ${progress.endDate}.`;
          logAuditEvent(auditUser, 'STUDENT_COMPLETED', auditMsg);
        } else if (oldStatus === 'Completed' && progress.status === 'On-going') {
          const auditMsg = `Student ${student.firstName} ${student.lastName} (${student.studentId}) reverted to In Progress. Completed approved hours: ${progress.hoursCompleted} / ${targetHours} hrs. Completion date cleared.`;
          logAuditEvent(auditUser, 'STUDENT_REVERTED_IN_PROGRESS', auditMsg);
        }
      }
    } else {
      updatedStudent = student;
    }
  }

  return updatedStudent;
};

const recalculateAllStudentsHours = () => {
  const timeLogs = readJSON(TIME_LOGS_FILE, []);
  const students = readJSON(STUDENTS_FILE, INITIAL_STUDENTS);

  let updated = false;
  students.forEach((s: any, idx: number) => {
    const approvedLogs = timeLogs.filter((tl: any) => tl.studentId === s.id && tl.status === 'Approved');
    const progress = calculateStudentProgressFromApprovedLogs(s, approvedLogs);

    if (
      s.hoursCompleted !== progress.hoursCompleted ||
      s.status !== progress.status ||
      s.endDate !== progress.endDate ||
      s.legacyHours !== progress.legacyHours
    ) {
      students[idx] = {
        ...s,
        hoursCompleted: progress.hoursCompleted,
        status: progress.status,
        endDate: progress.endDate,
        legacyHours: progress.legacyHours,
        updatedAt: new Date().toISOString()
      };
      updated = true;
    }
  });

  if (updated) {
    writeJSON(STUDENTS_FILE, students);
  }
  return students;
};

// ============================================
// OJT Time Logs REST API
// ============================================
app.get('/api/time-logs', (req, res) => {
  const { studentId } = req.query;
  const timeLogs = readJSON(TIME_LOGS_FILE, []);
  if (studentId && typeof studentId === 'string') {
    const filtered = timeLogs.filter((tl: any) => tl.studentId === studentId);
    return res.json(filtered);
  }
  res.json(timeLogs);
});

app.post('/api/time-logs', (req, res) => {
  try {
    const { log, user } = req.body || {};

    if (!log || !log.studentId || !log.date || !log.timeIn || !log.timeOut) {
      return res.status(400).json({ error: 'Missing required fields for time log.' });
    }

    const hoursRendered = Number(log.hoursRendered) || 0;
    if (hoursRendered <= 0) {
      return res.status(400).json({ error: 'Hours rendered must be greater than 0.' });
    }

    const timeLogs = readJSON(TIME_LOGS_FILE, []);

    const newLog = {
      ...log,
      id: `tl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'Pending', // New time logs MUST default to Pending
      breakMinutes: Number(log.breakMinutes) || 0,
      hoursRendered,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    timeLogs.unshift(newLog);
    writeJSON(TIME_LOGS_FILE, timeLogs);

    logAuditEvent(user, 'CREATE_TIME_LOG', `Logged ${hoursRendered} hrs for student ID: ${newLog.studentId} on ${newLog.date} (Pending)`);
    res.json(newLog);
  } catch (err: any) {
    console.error('Error creating time log:', err);
    res.status(500).json({ error: 'Failed to create time log. ' + (err.message || '') });
  }
});

app.post('/api/time-logs/bulk', (req, res) => {
  try {
    const { logs, replaceExisting, user } = req.body || {};

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ error: 'No logs provided for bulk insertion.' });
    }

    const timeLogs = readJSON(TIME_LOGS_FILE, []);
    const students = readJSON(STUDENTS_FILE, []);

    // Authoritative validation checks on backend
    for (const log of logs) {
      if (!log.studentId || !log.date || !log.timeIn || !log.timeOut) {
        return res.status(400).json({ error: 'Missing required fields for one or more time logs.' });
      }
      const hoursRendered = Number(log.hoursRendered) || 0;
      if (hoursRendered <= 0 || hoursRendered > 24) {
        return res.status(400).json({ error: `Invalid hours rendered (${hoursRendered}) for date ${log.date}.` });
      }
      const studentExists = students.some((s: any) => s.id === log.studentId);
      if (!studentExists) {
        return res.status(400).json({ error: `Student with ID ${log.studentId} does not exist.` });
      }
    }

    const studentId = logs[0].studentId;
    const datesToProcess = logs.map((l: any) => l.date);

    // Group existing logs for this student on the targeted dates
    const existingForDates = timeLogs.filter(
      (tl: any) => tl.studentId === studentId && datesToProcess.includes(tl.date)
    );

    const created: any[] = [];
    const skipped: any[] = [];
    const replaced: any[] = [];
    const protectedLogs: any[] = [];
    const failed: any[] = [];

    // Create lookup for existing logs by date
    const existingByDateMap = new Map<string, any>();
    existingForDates.forEach((tl: any) => {
      existingByDateMap.set(tl.date, tl);
    });

    const updatedLogsList = [...timeLogs];

    logs.forEach((logData: any) => {
      const existing = existingByDateMap.get(logData.date);

      if (existing) {
        if (replaceExisting) {
          if (existing.status === 'Approved') {
            // If approved, it is protected
            protectedLogs.push({ date: logData.date, status: 'Approved' });
          } else {
            // Update/Replace existing Pending or Rejected log
            const idx = updatedLogsList.findIndex((tl: any) => tl.id === existing.id);
            if (idx !== -1) {
              const originalVal = { ...updatedLogsList[idx] };
              updatedLogsList[idx] = {
                ...updatedLogsList[idx],
                timeIn: logData.timeIn,
                timeOut: logData.timeOut,
                breakMinutes: Number(logData.breakMinutes) || 0,
                hoursRendered: Number(logData.hoursRendered) || 0,
                notes: logData.notes || '',
                status: 'Pending', // Resets status to Pending on edit/replace
                updatedAt: new Date().toISOString()
              };
              replaced.push({
                date: logData.date,
                original: originalVal,
                updated: updatedLogsList[idx]
              });
            } else {
              failed.push({ date: logData.date, reason: 'Log index not found' });
            }
          }
        } else {
          // Skip existing
          skipped.push({ date: logData.date, status: existing.status });
        }
      } else {
        // Create new DTR log
        const newLog = {
          id: `tl-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          studentId: logData.studentId,
          date: logData.date,
          timeIn: logData.timeIn,
          timeOut: logData.timeOut,
          breakMinutes: Number(logData.breakMinutes) || 0,
          hoursRendered: Number(logData.hoursRendered) || 0,
          notes: logData.notes || '',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedLogsList.unshift(newLog);
        created.push(newLog);
      }
    });

    // Write new logs array to database file
    writeJSON(TIME_LOGS_FILE, updatedLogsList);

    // Call recalculateStudentHours once
    recalculateStudentHours(studentId, user);

    // Log a single bulk audit trail
    if (created.length > 0 || replaced.length > 0) {
      const createdDatesStr = created.map((l: any) => l.date).join(', ');
      const replacedDatesStr = replaced.map((l: any) => l.date).join(', ');
      const skippedDatesStr = skipped.map((l: any) => l.date).join(', ');
      const protectedDatesStr = protectedLogs.map((l: any) => l.date).join(', ');

      const auditMsg = `Bulk DTR Log executed for student ${studentId}. ` +
        `CreatedCount: ${created.length}, ReplacedCount: ${replaced.length}, SkippedCount: ${skipped.length}. ` +
        `Created: [${createdDatesStr || 'None'}], ` +
        `Replaced: [${replacedDatesStr || 'None'}], ` +
        `Skipped: [${skippedDatesStr || 'None'}], ` +
        `Protected: [${protectedDatesStr || 'None'}].`;

      logAuditEvent(user, 'BULK_TIME_LOG', auditMsg);
    }

    res.json({
      created,
      skipped,
      replaced,
      protected: protectedLogs,
      failed
    });
  } catch (err: any) {
    console.error('Error in bulk time log creation:', err);
    res.status(500).json({ error: 'Failed to complete bulk daily time entry. ' + (err.message || '') });
  }
});

app.put('/api/time-logs/:id', (req, res) => {
  const { id } = req.params;
  const { updates, user } = req.body;
  const timeLogs = readJSON(TIME_LOGS_FILE, []);

  const index = timeLogs.findIndex((tl: any) => tl.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Time log not found' });
  }

  const existing = timeLogs[index];
  const updatedLog = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  timeLogs[index] = updatedLog;
  writeJSON(TIME_LOGS_FILE, timeLogs);

  let updatedStudent = null;
  if (existing.status === 'Approved' || updatedLog.status === 'Approved') {
    updatedStudent = recalculateStudentHours(updatedLog.studentId, user);
  }

  logAuditEvent(user, 'UPDATE_TIME_LOG', `Updated time log ${id} for student ID: ${updatedLog.studentId}`);
  res.json({ log: updatedLog, updatedStudent });
});

app.post('/api/time-logs/:id/approve', (req, res) => {
  const { id } = req.params;
  const { user } = req.body;

  if (!user || (user.role !== 'Administrator' && user.role !== 'OJT Coordinator')) {
    return res.status(403).json({ error: 'Unauthorized: Only Administrators and OJT Coordinators can approve time logs.' });
  }

  const timeLogs = readJSON(TIME_LOGS_FILE, []);
  const index = timeLogs.findIndex((tl: any) => tl.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Time log not found' });
  }

  const existing = timeLogs[index];
  const updatedLog = {
    ...existing,
    status: 'Approved',
    rejectionReason: undefined,
    reviewedBy: user.name || user.username || 'System',
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  timeLogs[index] = updatedLog;
  writeJSON(TIME_LOGS_FILE, timeLogs);

  const updatedStudent = recalculateStudentHours(updatedLog.studentId, user);

  logAuditEvent(user, 'APPROVE_TIME_LOG', `Approved DTR #${updatedLog.id} for student ID: ${updatedLog.studentId} (${updatedLog.hoursRendered} hrs on ${updatedLog.date})`);
  res.json({ log: updatedLog, updatedStudent });
});

app.post('/api/time-logs/:id/reject', (req, res) => {
  const { id } = req.params;
  const { rejectionReason, user } = req.body;

  if (!user || (user.role !== 'Administrator' && user.role !== 'OJT Coordinator')) {
    return res.status(403).json({ error: 'Unauthorized: Only Administrators and OJT Coordinators can reject time logs.' });
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    return res.status(400).json({ error: 'A rejection reason is required when rejecting a time log.' });
  }

  const timeLogs = readJSON(TIME_LOGS_FILE, []);
  const index = timeLogs.findIndex((tl: any) => tl.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Time log not found' });
  }

  const existing = timeLogs[index];
  const updatedLog = {
    ...existing,
    status: 'Rejected',
    rejectionReason: rejectionReason.trim(),
    reviewedBy: user.name || user.username || 'System',
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  timeLogs[index] = updatedLog;
  writeJSON(TIME_LOGS_FILE, timeLogs);

  const updatedStudent = recalculateStudentHours(updatedLog.studentId, user);

  logAuditEvent(user, 'REJECT_TIME_LOG', `Rejected DTR #${updatedLog.id} for student ID: ${updatedLog.studentId}. Reason: ${rejectionReason}`);
  res.json({ log: updatedLog, updatedStudent });
});

app.delete('/api/time-logs/:id', (req, res) => {
  const { id } = req.params;
  const user = req.body.user;

  if (!user || (user.role !== 'Administrator' && user.role !== 'OJT Coordinator')) {
    return res.status(403).json({ error: 'Unauthorized: Only Administrators and OJT Coordinators can delete time logs.' });
  }

  const timeLogs = readJSON(TIME_LOGS_FILE, []);
  const match = timeLogs.find((tl: any) => tl.id === id);
  if (!match) {
    return res.status(404).json({ error: 'Time log not found' });
  }

  const filtered = timeLogs.filter((tl: any) => tl.id !== id);
  writeJSON(TIME_LOGS_FILE, filtered);

  const updatedStudent = recalculateStudentHours(match.studentId, user);

  logAuditEvent(user, 'DELETE_TIME_LOG', `Deleted DTR #${match.id} (${match.status}) for student ID: ${match.studentId}`);
  res.json({ success: true, updatedStudent });
});

app.post('/api/time-logs/bulk-approve', (req, res) => {
  const { ids, user } = req.body;

  if (!user || (user.role !== 'Administrator' && user.role !== 'OJT Coordinator')) {
    return res.status(403).json({ error: 'Unauthorized: Only Administrators and OJT Coordinators can bulk approve time logs.' });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No time log IDs provided for bulk approval.' });
  }

  const timeLogs = readJSON(TIME_LOGS_FILE, []);
  const affectedStudentIds = new Set<string>();
  let approvedCount = 0;

  timeLogs.forEach((tl: any, idx: number) => {
    if (ids.includes(tl.id) && tl.status === 'Pending') {
      timeLogs[idx] = {
        ...tl,
        status: 'Approved',
        reviewedBy: user.name || user.username || 'System',
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      affectedStudentIds.add(tl.studentId);
      approvedCount++;
    }
  });

  writeJSON(TIME_LOGS_FILE, timeLogs);

  const updatedStudents: any[] = [];
  affectedStudentIds.forEach(studentId => {
    const updated = recalculateStudentHours(studentId, user);
    if (updated) updatedStudents.push(updated);
  });

  logAuditEvent(user, 'BULK_APPROVE_TIME_LOGS', `Bulk approved ${approvedCount} time logs across ${affectedStudentIds.size} students`);
  res.json({ count: approvedCount, updatedStudents });
});

// Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  const logs = readJSON(AUDIT_LOGS_FILE, []);
  res.json(logs);
});

// Settings REST API
app.get('/api/settings', (req, res) => {
  const settings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { settings, user } = req.body;
  writeJSON(SETTINGS_FILE, settings);
  logAuditEvent(user, 'UPDATE_SETTINGS', `Updated System and University details`);
  res.json(settings);
});

// Database Backup / Merge for central server
app.post('/api/backup/import', async (req, res) => {
  const { records: importedRecords, students: importedStudents, organizations: importedOrgs, timeLogs: importedTimeLogs, user } = req.body;
  
  const currentRecords = readJSON(RECORDS_FILE, INITIAL_RECORDS);
  const currentStudents = readJSON(STUDENTS_FILE, INITIAL_STUDENTS);
  const currentOrgs = readJSON(ORGANIZATIONS_FILE, INITIAL_ORGANIZATIONS);
  const currentTimeLogs = readJSON(TIME_LOGS_FILE, []);

  // Merge unique records
  const uniqueRecs = Array.from(new Map(
    [...currentRecords, ...(importedRecords || [])].map((item: any) => [item.id, item])
  ).values());

  // Merge unique students
  const uniqueStuds = Array.from(new Map(
    [...currentStudents, ...(importedStudents || [])].map((item: any) => [item.id, item])
  ).values());

  // Merge unique organizations
  const uniqueOrgs = Array.from(new Map(
    [...currentOrgs, ...(importedOrgs || [])].map((item: any) => [item.id, item])
  ).values());

  // Merge unique time logs
  const uniqueTimeLogs = Array.from(new Map(
    [...currentTimeLogs, ...(importedTimeLogs || [])].map((item: any) => [item.id, item])
  ).values());

  writeJSON(RECORDS_FILE, uniqueRecs);
  writeJSON(STUDENTS_FILE, uniqueStuds);
  writeJSON(ORGANIZATIONS_FILE, uniqueOrgs);
  writeJSON(TIME_LOGS_FILE, uniqueTimeLogs);

  // Recalculate all students' hours derived strictly from approved time logs
  const finalStudents = recalculateAllStudentsHours();

  logAuditEvent(user, 'IMPORT_BACKUP', `Imported backup: merged records (${uniqueRecs.length}), students (${finalStudents.length}), organizations (${uniqueOrgs.length}), and time logs (${uniqueTimeLogs.length})`);
  res.json({ success: true, records: uniqueRecs, students: finalStudents, organizations: uniqueOrgs, timeLogs: uniqueTimeLogs });
});

// Global Express error handler - ensures all errors return JSON, not HTML
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

// Serve frontend production build statically
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Catch-all route to serve Index.html for SPA client routing
  app.get(/^(?!\/api|\/attachments).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start local host web server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`MOA LO Central Network Server running on http://0.0.0.0:${PORT}`);
  // Recalculate all student progress on startup (applies legacy auto-maxing for old students)
  const recalculated = recalculateAllStudentsHours();
  console.log(`Startup recalculation complete: ${recalculated.length} students synced.`);
});
