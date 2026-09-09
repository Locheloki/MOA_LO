import React, { useState } from 'react';
import { 
  Search, Plus, Building2, Phone, Mail, MapPin, ArrowLeft, Edit2, 
  Trash2, Briefcase, Users, Calendar, Clock, ChevronRight, FileText, CheckCircle2, X
} from 'lucide-react';
import { PartnerOrganization, RecordItem, OJTStudent } from '../types';
import { toast } from 'sonner';
import { CustomSelect } from './ui/CustomSelect';

interface OrganizationsTabProps {
  organizations: PartnerOrganization[];
  records: RecordItem[];
  students: OJTStudent[];
  userRole: string;
  onCreateOrg: (org: Omit<PartnerOrganization, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateOrg: (id: string, updates: Partial<Omit<PartnerOrganization, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  onDeleteOrg: (id: string) => Promise<void>;
  onSelectContract: (id: string) => void;
  selectedOrgId: string | null;
  onSelectOrg: (id: string | null) => void;
}

export default function OrganizationsTab({
  organizations,
  records,
  students,
  userRole,
  onCreateOrg,
  onUpdateOrg,
  onDeleteOrg,
  onSelectContract,
  selectedOrgId,
  onSelectOrg
}: OrganizationsTabProps) {
  // Filters
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<PartnerOrganization | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formContactNumber, setFormContactNumber] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  const industries = Array.from(new Set(organizations.map(o => o.industry).filter(Boolean)));

  const handleOpenModal = (org: PartnerOrganization | null = null) => {
    setEditingOrg(org);
    if (org) {
      setFormName(org.name);
      setFormAddress(org.address);
      setFormContactPerson(org.contactPerson);
      setFormContactNumber(org.contactNumber);
      setFormEmail(org.email);
      setFormIndustry(org.industry);
      setFormNotes(org.notes || '');
      setFormStatus(org.status);
    } else {
      setFormName('');
      setFormAddress('');
      setFormContactPerson('');
      setFormContactNumber('');
      setFormEmail('');
      setFormIndustry('');
      setFormNotes('');
      setFormStatus('Active');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      toast.error('Organization name and contact email are required.');
      return;
    }

    const orgData = {
      name: formName,
      address: formAddress,
      contactPerson: formContactPerson,
      contactNumber: formContactNumber,
      email: formEmail,
      industry: formIndustry || 'Other',
      notes: formNotes || undefined,
      status: formStatus
    };

    try {
      if (editingOrg) {
        await onUpdateOrg(editingOrg.id, orgData);
        toast.success('Partner organization updated successfully!');
      } else {
        await onCreateOrg(orgData);
        toast.success('New partner organization registered successfully!');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save partner organization.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      try {
        await onDeleteOrg(id);
        toast.success('Partner organization removed successfully.');
        onSelectOrg(null);
      } catch (err) {
        toast.error('Failed to delete partner.');
      }
    }
  };

  // Filter organizations
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      org.email.toLowerCase().includes(search.toLowerCase()) ||
      org.industry.toLowerCase().includes(search.toLowerCase());

    const matchesIndustry = industryFilter === 'All' || org.industry === industryFilter;
    const matchesStatus = statusFilter === 'All' || org.status === statusFilter;

    return matchesSearch && matchesIndustry && matchesStatus;
  });

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);

  // Compute stats for selected organization
  const orgRecords = records.filter(r => r.organizationId === selectedOrgId);
  const activeMOAs = orgRecords.filter(r => r.type === 'MOA' && r.status === 'Active');
  const orgStudents = students.filter(s => s.organizationId === selectedOrgId);

  const [profileTab, setProfileTab] = useState<'agreements' | 'students' | 'timeline'>('agreements');

  if (selectedOrg) {
    return (
      <div className="space-y-6" id="organization-profile-screen">
        {/* Back and actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-void-black/60 backdrop-blur-md p-4 border border-glass-stroke rounded">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSelectOrg(null)}
              className="p-2 hover:bg-surface-container rounded text-secondary hover:text-starlight-white transition-colors cursor-pointer"
              title="Back to Directory"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-starlight-white font-headline tracking-tight">{selectedOrg.name}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[9px] tracking-widest uppercase ${
                  selectedOrg.status === 'Active' 
                    ? 'bg-[#1a2e1f] border border-[#2d5a39] text-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.15)]' 
                    : 'bg-[#201f1f] border border-glass-stroke text-secondary'
                }`}>
                  {selectedOrg.status}
                </span>
              </div>
              <p className="text-xs text-secondary font-sans mt-0.5">{selectedOrg.industry || 'General Partner'}</p>
            </div>
          </div>

          {userRole === 'Administrator' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleOpenModal(selectedOrg)}
                className="bg-surface-container-highest text-starlight-white border border-glass-stroke font-mono text-[10px] tracking-wider rounded px-3.5 py-2 flex items-center justify-center gap-1.5 hover:bg-outline hover:border-outline transition-all cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                EDIT
              </button>
              <button 
                onClick={() => handleDelete(selectedOrg.id)}
                className="bg-[#2d1215] border border-[#5f2024] text-[#ffb4ab] font-mono text-[10px] tracking-wider rounded px-3.5 py-2 flex items-center justify-center gap-1.5 hover:bg-[#5f2024] transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                DELETE
              </button>
            </div>
          )}
        </div>

        {/* Profile Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <div className="bg-void-black/80 backdrop-blur-xl border border-glass-stroke rounded p-5 space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-secondary border-b border-glass-stroke/50 pb-2">PARTNER INFORMATION</h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-secondary uppercase tracking-wider">Office Address</p>
                  <p className="text-sm text-starlight-white mt-1 leading-relaxed">{selectedOrg.address || 'No address provided.'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Users className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-secondary uppercase tracking-wider">Contact Liaison</p>
                  <p className="text-sm text-starlight-white mt-1">{selectedOrg.contactPerson || 'Not listed.'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-secondary uppercase tracking-wider">Telephone / Mobile</p>
                  <p className="text-sm text-starlight-white font-mono mt-1">{selectedOrg.contactNumber || 'Not listed.'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono text-secondary uppercase tracking-wider">Liaison Email</p>
                  <a href={`mailto:${selectedOrg.email}`} className="text-sm text-primary hover:underline font-mono block mt-1 break-all">
                    {selectedOrg.email}
                  </a>
                </div>
              </div>
            </div>

            {selectedOrg.notes && (
              <div className="bg-void-black/50 border border-glass-stroke p-3 rounded mt-4">
                <p className="text-xs font-mono text-secondary uppercase tracking-wider mb-1">Administrative Notes</p>
                <p className="text-xs text-secondary leading-relaxed font-sans">{selectedOrg.notes}</p>
              </div>
            )}
          </div>

          {/* Connected Tabs Panel */}
          <div className="lg:col-span-2 bg-void-black/80 backdrop-blur-xl border border-glass-stroke rounded shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col min-h-[400px]">
            {/* Tabs Selector */}
            <div className="border-b border-glass-stroke px-5 bg-surface-container/20">
              <div className="flex gap-6">
                <button 
                  onClick={() => setProfileTab('agreements')}
                  className={`py-4 text-xs font-mono tracking-wider uppercase border-b-2 px-1 transition-all cursor-pointer ${
                    profileTab === 'agreements' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-starlight-white'
                  }`}
                >
                  AGREEMENTS & LOs ({orgRecords.length})
                </button>
                <button 
                  onClick={() => setProfileTab('students')}
                  className={`py-4 text-xs font-mono tracking-wider uppercase border-b-2 px-1 transition-all cursor-pointer ${
                    profileTab === 'students' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-starlight-white'
                  }`}
                >
                  OJT PLACEMENTS ({orgStudents.length})
                </button>
                <button 
                  onClick={() => setProfileTab('timeline')}
                  className={`py-4 text-xs font-mono tracking-wider uppercase border-b-2 px-1 transition-all cursor-pointer ${
                    profileTab === 'timeline' ? 'border-primary text-primary font-bold' : 'border-transparent text-secondary hover:text-starlight-white'
                  }`}
                >
                  PARTNER TIMELINE
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              {/* Agreements Tab */}
              {profileTab === 'agreements' && (
                <div className="space-y-4 flex-1">
                  {orgRecords.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orgRecords.map(rec => (
                        <div key={rec.id} className="border border-glass-stroke rounded p-4 bg-[#0e0e0e]/60 hover:bg-surface-container-highest/30 transition-all flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-primary bg-surface-container px-1.5 py-0.5 rounded border border-glass-stroke">
                                {rec.controlNumber}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[9px] tracking-widest uppercase ${
                                rec.status === 'Active' || rec.status === 'Issued' || rec.status === 'Renewed'
                                  ? 'bg-[#1a2e1f] border border-[#2d5a39] text-[#4ade80]'
                                  : rec.status === 'Expired' || rec.status === 'Terminated'
                                  ? 'bg-[#2d1215] border border-[#5f2024] text-[#ffb4ab]'
                                  : 'bg-[#2b2116] border border-[#533f24] text-[#f59e0b]'
                              }`}>
                                {rec.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-starlight-white leading-snug line-clamp-2">{rec.title}</h4>
                            <p className="text-xs text-secondary line-clamp-2 leading-relaxed font-sans">{rec.description || 'No description provided.'}</p>
                          </div>

                          <div className="pt-3 border-t border-glass-stroke/40 mt-4 flex items-center justify-between text-xs font-mono text-secondary">
                            <span>EXP: {rec.isIndefinite ? 'INDEFINITE' : (rec.expirationDate || 'N/A')}</span>
                            <button 
                              onClick={() => onSelectContract(rec.id)}
                              className="text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              WORKSPACE
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-secondary">
                      <FileText className="h-10 w-10 text-secondary/30 mb-2" />
                      <p className="font-bold text-sm text-starlight-white">No agreements linked</p>
                      <p className="text-xs text-secondary mt-0.5 max-w-xs leading-relaxed">There are no Memorandum of Agreements or Legal Opinions linked to this partner.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Students Tab */}
              {profileTab === 'students' && (
                <div className="space-y-4 flex-1">
                  {orgStudents.length > 0 ? (
                    <div className="overflow-x-auto border border-glass-stroke rounded">
                      <table className="w-full text-left text-sm border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-glass-stroke bg-surface-container/50 text-[10px] uppercase font-mono tracking-wider text-secondary">
                            <th className="px-4 py-3 font-medium">Student</th>
                            <th className="px-4 py-3 font-medium">Course / Section</th>
                            <th className="px-4 py-3 font-medium">Progress</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-glass-stroke/50 font-sans text-starlight-white">
                          {orgStudents.map(stud => {
                            const pct = Math.min(100, Math.round((stud.hoursCompleted / stud.hoursRequired) * 100)) || 0;
                            return (
                              <tr key={stud.id} className="hover:bg-surface-container-highest/40 transition-colors">
                                <td className="px-4 py-3">
                                  <p className="font-bold text-starlight-white">{stud.lastName}, {stud.firstName}</p>
                                  <p className="text-secondary text-xs font-mono">{stud.studentId}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-starlight-white">{stud.course}</p>
                                  <p className="text-secondary text-xs">Section {stud.yearAndSection}</p>
                                </td>
                                <td className="px-4 py-3 min-w-[140px]">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden border border-glass-stroke shadow-[0_0_8px_rgba(255,179,173,0.3)]">
                                      <div className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(255,179,173,0.8)]" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-starlight-white font-mono">{pct}%</span>
                                  </div>
                                  <p className="text-[10px] text-secondary font-mono mt-1">{stud.hoursCompleted} / {stud.hoursRequired} hrs</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[9px] tracking-widest uppercase border ${
                                    stud.status === 'Completed' ? 'bg-[#1a2e1f] border-[#2d5a39] text-[#4ade80]' :
                                    stud.status === 'On-going' ? 'bg-[#162a42] border-[#2a4c77] text-[#60a5fa]' :
                                    stud.status === 'Suspended' ? 'bg-[#2d1215] border-[#5f2024] text-[#ffb4ab]' :
                                    'bg-[#201f1f] border-glass-stroke text-secondary'
                                  }`}>
                                    {stud.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-secondary">
                      <Users className="h-10 w-10 text-secondary/30 mb-2" />
                      <p className="font-bold text-sm text-starlight-white">No placements recorded</p>
                      <p className="text-xs text-secondary mt-0.5 max-w-xs leading-relaxed">No students are currently placed with this organization.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {profileTab === 'timeline' && (
                <div className="space-y-6 flex-1 pr-2 max-h-[400px] overflow-y-auto">
                  {selectedOrg.timeline && selectedOrg.timeline.length > 0 ? (
                    <div className="relative border-l border-glass-stroke/50 pl-4 ml-3 space-y-6">
                      {selectedOrg.timeline.map(event => (
                        <div key={event.id} className="relative">
                          {/* Dot indicator */}
                          <span className="absolute -left-[21px] top-1.5 bg-void-black border-2 border-primary rounded-full h-2.5 w-2.5 shadow-[0_0_8px_rgba(255,179,173,0.8)]" />
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] text-secondary font-mono flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-primary" />
                                {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {event.user && <span>• By {event.user}</span>}
                            </div>
                            <p className="text-xs font-mono font-bold uppercase tracking-wider text-primary">{event.type}</p>
                            <p className="text-starlight-white text-sm font-sans leading-relaxed mt-0.5">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-secondary">
                      <Clock className="h-10 w-10 text-secondary/30 mb-2" />
                      <p className="font-bold text-sm text-starlight-white">No activity recorded</p>
                      <p className="text-xs text-secondary mt-0.5">Chronology is empty.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="organizations-tab-directory">
      {/* Search and filter toolbar */}
      <div className="relative z-30 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-void-black/60 backdrop-blur-md p-4 border border-glass-stroke rounded shadow-[0_4px_24px_rgba(0,0,0,0.4)]" id="organizations-toolbar">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary h-4 w-4" />
          <input 
            type="text"
            placeholder="Search partners by name, contact, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container border border-glass-stroke rounded font-sans text-sm text-starlight-white focus:border-outline focus:bg-surface-container-highest outline-none transition-all placeholder:text-secondary shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={industryFilter}
            onChange={(val) => setIndustryFilter(val)}
            options={[
              { value: 'All', label: 'All Industries' },
              ...industries.map(ind => ({ value: ind, label: ind }))
            ]}
            className="min-w-[150px]"
          />

          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
            className="min-w-[130px]"
          />

          {userRole === 'Administrator' && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-primary-container text-white font-mono text-[10px] tracking-wider rounded px-4 py-2 flex items-center justify-center gap-1.5 hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              REGISTER PARTNER
            </button>
          )}
        </div>
      </div>

      {/* Directory Grid */}
      {filteredOrgs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="organizations-grid">
          {filteredOrgs.map(org => {
            const orgRecs = records.filter(r => r.organizationId === org.id);
            const activeCount = orgRecs.filter(r => r.type === 'MOA' && r.status === 'Active').length;
            const placementsCount = students.filter(s => s.organizationId === org.id).length;

            return (
              <div 
                key={org.id} 
                onClick={() => onSelectOrg(org.id)}
                className="bg-void-black/80 backdrop-blur-xl border border-glass-stroke hover:border-primary rounded p-5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_24px_rgba(255,179,173,0.15)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-[220px] group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-surface-container border border-glass-stroke text-primary rounded group-hover:scale-110 transition-transform">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[9px] tracking-widest uppercase ${
                      org.status === 'Active' 
                        ? 'bg-[#1a2e1f] border border-[#2d5a39] text-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.15)]' 
                        : 'bg-[#2d1215] border border-[#5f2024] text-[#ffb4ab]'
                    }`}>
                      {org.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-starlight-white font-headline mt-3 text-base leading-tight truncate group-hover:text-primary transition-colors">{org.name}</h3>
                  <p className="text-xs text-secondary font-sans mt-1 truncate">{org.industry || 'General Partner'}</p>

                  <div className="flex items-center gap-1.5 text-xs text-secondary font-sans mt-3.5">
                    <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{org.address || 'Address not listed'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-glass-stroke/50 pt-3 mt-4 text-[11px] font-mono text-secondary">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    {activeCount} ACTIVE MOAs
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {placementsCount} PLACEMENTS
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 bg-void-black/60 backdrop-blur-md border border-glass-stroke rounded text-center flex flex-col items-center justify-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="p-4 bg-surface-container border border-glass-stroke text-secondary rounded-full">
            <Building2 className="h-8 w-8 text-secondary" />
          </div>
          <div>
            <p className="font-bold text-starlight-white">No partner organizations found</p>
            <p className="text-xs text-secondary mt-1">Refine your filters or create a new partner profile</p>
          </div>
          {userRole === 'Administrator' && (
            <button
              onClick={() => handleOpenModal()}
              className="mt-2 bg-primary-container text-white font-mono text-[10px] tracking-wider rounded px-4 py-2 flex items-center justify-center gap-1.5 hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              REGISTER PARTNER
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-void-black/95 rounded border border-glass-stroke shadow-[0_8px_32px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <header className="px-5 py-4 border-b border-glass-stroke flex items-center justify-between bg-surface-container/30">
              <h3 className="font-bold text-starlight-white font-headline text-base">
                {editingOrg ? 'Edit Partner Organization' : 'Register New Partner Organization'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container rounded-full text-secondary hover:text-starlight-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-sm text-starlight-white">
              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase text-secondary">Organization Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Google Philippines Inc."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-bold uppercase text-secondary">Industry Classification</label>
                  <input 
                    type="text"
                    placeholder="e.g. Technology / Software"
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Partnership Status</label>
                  <CustomSelect
                    value={formStatus}
                    onChange={(val) => setFormStatus(val as 'Active' | 'Inactive')}
                    options={[
                      { value: 'Active', label: 'Active Partnership' },
                      { value: 'Inactive', label: 'Inactive' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase text-secondary">Headquarters Address</label>
                <input 
                  type="text"
                  placeholder="Street address, city, region, postal code"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase text-secondary">Contact Liaison / Officer</label>
                <input 
                  type="text"
                  placeholder="Full name of representative"
                  value={formContactPerson}
                  onChange={(e) => setFormContactPerson(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-bold uppercase text-secondary">Contact Number</label>
                  <input 
                    type="text"
                    placeholder="Telephone or mobile"
                    value={formContactNumber}
                    onChange={(e) => setFormContactNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-bold uppercase text-secondary">Contact Email *</label>
                  <input 
                    type="email"
                    required
                    placeholder="email@partner.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono font-bold uppercase text-secondary">Internal Administrative Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Confidential comments, history details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                />
              </div>

              <footer className="pt-4 border-t border-glass-stroke flex items-center justify-end gap-3 bg-void-black">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-highest border border-glass-stroke rounded font-mono text-xs text-starlight-white hover:bg-outline hover:border-outline transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] rounded cursor-pointer"
                >
                  {editingOrg ? 'SAVE CHANGES' : 'REGISTER PARTNER'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
