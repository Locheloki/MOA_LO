import React, { useState } from 'react';
import { 
  X, Shield, Calendar, Users, FileText, CheckCircle2, AlertTriangle, 
  Upload, CheckSquare, ListTodo, Plus, Trash2, Clock, Check, Download, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import { RecordItem, ContractVersion, LegalTask, TimelineEvent, PartnerOrganization, Attachment } from '../types';
import { CustomSelect } from './ui/CustomSelect';

interface ContractWorkspaceProps {
  contract: RecordItem;
  organizations: PartnerOrganization[];
  userRole: string;
  onClose: () => void;
  onUpdateContract: (id: string, updates: Partial<RecordItem>) => Promise<void>;
}

export default function ContractWorkspace({
  contract,
  organizations,
  userRole,
  onClose,
  onUpdateContract
}: ContractWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'versions' | 'tasks' | 'timeline'>('versions');

  // New Version Form
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [verNotes, setVerNotes] = useState('');
  const [verStatus, setVerStatus] = useState('Active');
  const [verFile, setVerFile] = useState<{ name: string; size: number; dataUrl: string } | null>(null);

  // New Task Form
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigned, setTaskAssigned] = useState('');

  // Editable fields form
  const [formStatus, setFormStatus] = useState(contract.status);
  const [formRiskLevel, setFormRiskLevel] = useState(contract.riskLevel || 'Low');
  const [formConfidentiality, setFormConfidentiality] = useState(contract.confidentialityLevel || 'Public');
  const [formRetention, setFormRetention] = useState(contract.retentionPeriod || '5 Years');
  const [formDeptOwner, setFormDeptOwner] = useState(contract.departmentOwner || contract.department || '');

  const linkedOrg = organizations.find(o => o.id === contract.organizationId);

  // File Upload base64 helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setVerFile({
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Add a new version/revision
  const handleAddVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verFile) {
      alert('Please select a file to upload.');
      return;
    }

    const currentVersions = contract.versions || [];
    const nextVerNo = currentVersions.length > 0 
      ? Math.max(...currentVersions.map(v => v.versionNumber)) + 1 
      : 1;

    const newVersion: ContractVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: nextVerNo,
      status: verStatus,
      notes: verNotes,
      uploadedBy: userRole || 'Anonymous',
      uploadedAt: new Date().toISOString(),
      fileName: verFile.name,
      fileSize: verFile.size,
      dataUrl: verFile.dataUrl
    };

    // Update attachments with this active file as well
    const updatedAttachments: Attachment[] = [
      {
        id: `att-v-${Date.now()}`,
        fileName: verFile.name,
        mimeType: 'application/pdf',
        fileSize: verFile.size,
        uploadedAt: new Date().toISOString(),
        dataUrl: verFile.dataUrl
      },
      ...contract.attachments
    ];

    const timeline = [...(contract.timeline || [])];
    timeline.unshift({
      id: `t-v-${Date.now()}`,
      type: 'Version Uploaded',
      description: `Uploaded document revision v${nextVerNo}: "${verFile.name}" with status: "${verStatus}".`,
      timestamp: new Date().toISOString(),
      user: userRole
    });

    const updates: Partial<RecordItem> = {
      versions: [newVersion, ...currentVersions],
      attachments: updatedAttachments,
      timeline,
      status: verStatus as any, // update contract overall status
      updatedAt: new Date().toISOString()
    };

    await onUpdateContract(contract.id, updates);
    
    // reset form
    setIsAddingVersion(false);
    setVerNotes('');
    setVerFile(null);
  };

  // Add task to contract checklist
  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    const currentTasks = contract.tasks || [];
    const newTask: LegalTask = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      description: taskDesc || undefined,
      dueDate: taskDueDate || undefined,
      assignedStaff: taskAssigned || undefined,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const timeline = [...(contract.timeline || [])];
    timeline.unshift({
      id: `t-task-${Date.now()}`,
      type: 'Task Added',
      description: `Added checklist task: "${taskTitle}" assigned to: "${taskAssigned || 'Unassigned'}".`,
      timestamp: new Date().toISOString(),
      user: userRole
    });

    const updates = {
      tasks: [...currentTasks, newTask],
      timeline,
      updatedAt: new Date().toISOString()
    };

    await onUpdateContract(contract.id, updates);

    // reset form
    setIsAddingTask(false);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDueDate('');
    setTaskAssigned('');
  };

  // Toggle task status checkbox
  const handleToggleTask = async (taskId: string) => {
    const currentTasks = contract.tasks || [];
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;

    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    const updatedTasks = currentTasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t);

    const timeline = [...(contract.timeline || [])];
    timeline.unshift({
      id: `t-tg-${Date.now()}`,
      type: 'Task Completed',
      description: `Marked task: "${task.title}" as: "${nextStatus}".`,
      timestamp: new Date().toISOString(),
      user: userRole
    });

    await onUpdateContract(contract.id, {
      tasks: updatedTasks as any,
      timeline,
      updatedAt: new Date().toISOString()
    });
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    const currentTasks = contract.tasks || [];
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTasks = currentTasks.filter(t => t.id !== taskId);
    const timeline = [...(contract.timeline || [])];
    timeline.unshift({
      id: `t-td-${Date.now()}`,
      type: 'Updated',
      description: `Deleted task: "${task.title}".`,
      timestamp: new Date().toISOString(),
      user: userRole
    });

    await onUpdateContract(contract.id, {
      tasks: updatedTasks,
      timeline,
      updatedAt: new Date().toISOString()
    });
  };

  // Handle saving sidebar changes
  const handleSaveWorkspaceMetadata = async () => {
    const timeline = [...(contract.timeline || [])];
    timeline.unshift({
      id: `t-m-${Date.now()}`,
      type: 'Updated',
      description: `Updated contract metadata (Risk Level, Confidentiality, Retention).`,
      timestamp: new Date().toISOString(),
      user: userRole
    });

    await onUpdateContract(contract.id, {
      status: formStatus as any,
      riskLevel: formRiskLevel as any,
      confidentialityLevel: formConfidentiality as any,
      retentionPeriod: formRetention,
      departmentOwner: formDeptOwner,
      timeline,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-hidden" id="contract-workspace-modal">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <header className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                {contract.controlNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                contract.status === 'Active' || contract.status === 'Issued' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {contract.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 truncate max-w-2xl">{contract.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Modal Main Grid */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Metadata Panel */}
          <div className="w-full md:w-80 border-r border-slate-100 p-5 overflow-y-auto space-y-6 flex flex-col justify-between bg-slate-50/20 text-sm">
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-slate-400" />
                Legal Metadata
              </h3>

              {linkedOrg && (
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Associated Partner</p>
                  <p className="text-slate-900 font-bold mt-0.5 text-xs truncate">{linkedOrg.name}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Document Status</label>
                <CustomSelect
                  value={formStatus}
                  onChange={(val) => setFormStatus(val as any)}
                  options={contract.type === 'LO' ? [
                    { value: 'Issued', label: 'Issued' },
                    { value: 'Archived', label: 'Archived' },
                  ] : [
                    { value: 'Active', label: 'Active / Executed' },
                    { value: 'Expiring Soon', label: 'Expiring Soon' },
                    { value: 'Expired', label: 'Expired' },
                    { value: 'Renewed', label: 'Renewed' },
                    { value: 'Archived', label: 'Archived' },
                  ]}
                  variant="light"
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Legal Risk Profile</label>
                <CustomSelect
                  value={formRiskLevel}
                  onChange={(val) => setFormRiskLevel(val as any)}
                  options={[
                    { value: 'Low', label: 'Low Risk' },
                    { value: 'Medium', label: 'Medium Risk' },
                    { value: 'High', label: 'High Risk / Strict Compliance' },
                  ]}
                  variant="light"
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Confidentiality Level</label>
                <CustomSelect
                  value={formConfidentiality}
                  onChange={(val) => setFormConfidentiality(val as any)}
                  options={[
                    { value: 'Public', label: 'Public (Accessible)' },
                    { value: 'Confidential', label: 'Confidential (Office Restricted)' },
                    { value: 'Strictly Confidential', label: 'Strictly Confidential (Presidents Office Only)' },
                  ]}
                  variant="light"
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Retention Period</label>
                <input 
                  type="text"
                  placeholder="e.g. 5 Years, 10 Years"
                  value={formRetention}
                  onChange={(e) => setFormRetention(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Office / Department Owner</label>
                <input 
                  type="text"
                  placeholder="e.g. College of Computer Studies"
                  value={formDeptOwner}
                  onChange={(e) => setFormDeptOwner(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Issue Date</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{contract.issueDate || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Expiration</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{contract.isIndefinite ? 'Indefinite' : (contract.expirationDate || 'N/A')}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSaveWorkspaceMetadata}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow transition-colors cursor-pointer mt-4"
            >
              Update Metadata
            </button>
          </div>

          {/* Right Column: Workspaces (Tabs) */}
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Tab navigation headers */}
            <div className="border-b border-slate-100 px-6 bg-slate-50/50 flex items-center justify-between">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab('versions')}
                  className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-1 transition-all cursor-pointer ${
                    activeTab === 'versions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Version Registry ({contract.versions?.length || 0})
                </button>
                <button 
                  onClick={() => setActiveTab('tasks')}
                  className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-1 transition-all cursor-pointer ${
                    activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Execution Checklist ({contract.tasks?.length || 0})
                </button>
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 px-1 transition-all cursor-pointer ${
                    activeTab === 'timeline' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Contract Timeline
                </button>
              </div>

              {activeTab === 'versions' && (
                <button 
                  onClick={() => setIsAddingVersion(!isAddingVersion)}
                  className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Revision
                </button>
              )}

              {activeTab === 'tasks' && (
                <button 
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Checklist Item
                </button>
              )}
            </div>

            {/* Content pane */}
            <div className="flex-1 p-6 min-h-0 overflow-y-auto">
              
              {/* Add version inline panel */}
              {activeTab === 'versions' && isAddingVersion && (
                <form onSubmit={handleAddVersionSubmit} className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Log Document Revision</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Version Status</label>
                      <CustomSelect
                        value={verStatus}
                        onChange={(val) => setVerStatus(val)}
                        options={[
                          { value: 'Draft', label: 'Draft' },
                          { value: 'Under Review', label: 'Under Review' },
                          { value: 'Pending Signature', label: 'Pending Signature' },
                          { value: 'Active', label: 'Active / Final' },
                          { value: 'Archived', label: 'Archived' },
                        ]}
                        variant="light"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Contract File</label>
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Version Notes & Changes</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Added revised IP clauses based on Google legal team request."
                      value={verNotes}
                      onChange={(e) => setVerNotes(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1.5">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingVersion(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
                    >
                      Upload Version
                    </button>
                  </div>
                </form>
              )}

              {/* Versions Registry content */}
              {activeTab === 'versions' && (
                <div className="space-y-4">
                  {contract.versions && contract.versions.length > 0 ? (
                    <div className="space-y-3">
                      {contract.versions.map(v => (
                        <div key={v.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                          <div className="space-y-1.5 max-w-[70%]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">v{v.versionNumber}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {v.status}
                              </span>
                              <span className="text-[10px] text-slate-400">By {v.uploadedBy} • {new Date(v.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <p className="font-medium text-slate-700 italic">"{v.notes}"</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                              <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{v.fileName}</span>
                              <span>({Math.round(v.fileSize / 1024)} KB)</span>
                            </div>
                          </div>

                          {v.dataUrl && (
                            <a 
                              href={v.dataUrl} 
                              download={v.fileName}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <FileText className="h-10 w-10 text-slate-300" />
                      <p className="font-bold text-slate-700">No versions tracked</p>
                      <p className="text-xs">This contract does not have an active revision registry established yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Add Checklist task inline panel */}
              {activeTab === 'tasks' && isAddingTask && (
                <form onSubmit={handleAddTaskSubmit} className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Add checklist task</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Task Title *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Obtain signatures from College Dean"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Staff</label>
                      <input 
                        type="text"
                        placeholder="e.g. Atty. Reyes"
                        value={taskAssigned}
                        onChange={(e) => setTaskAssigned(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Due Date</label>
                      <input 
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1.5">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingTask(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
                    >
                      Add Checklist Item
                    </button>
                  </div>
                </form>
              )}

              {/* Task Checklist content */}
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {contract.tasks && contract.tasks.length > 0 ? (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                      {contract.tasks.map(task => (
                        <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-xs gap-4">
                          <div className="flex items-center gap-3 max-w-[70%]">
                            <button 
                              onClick={() => handleToggleTask(task.id)}
                              className={`p-1 rounded-md border transition-colors flex items-center justify-center cursor-pointer ${
                                task.status === 'Completed' 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600' 
                                  : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <div>
                              <p className={`font-bold text-sm ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {task.title}
                              </p>
                              {task.description && <p className="text-slate-500 mt-0.5">{task.description}</p>}
                              <div className="flex gap-3 text-[10px] text-slate-400 mt-1 font-medium">
                                {task.assignedStaff && <span>Assigned: {task.assignedStaff}</span>}
                                {task.dueDate && <span>Due Date: {task.dueDate}</span>}
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <ListTodo className="h-10 w-10 text-slate-300" />
                      <p className="font-bold text-slate-700">No checklist items</p>
                      <p className="text-xs">There are no tasks logged for this contract's execution workflow.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline content */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  {contract.timeline && contract.timeline.length > 0 ? (
                    <div className="relative border-l-2 border-slate-100 pl-4 ml-3 space-y-6 text-xs">
                      {contract.timeline.map(event => (
                        <div key={event.id} className="relative">
                          {/* Dot indicator */}
                          <span className="absolute -left-[21px] top-1 bg-white border-2 border-blue-600 rounded-full h-3 w-3" />
                          
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {event.user && <span>• By {event.user}</span>}
                            </div>
                            <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider text-blue-700">{event.type}</p>
                            <p className="text-slate-600 text-sm mt-0.5">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <Clock className="h-10 w-10 text-slate-300" />
                      <p className="font-bold text-slate-700">No timeline history</p>
                      <p className="text-xs">The chronological logging directory is currently empty for this record.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
