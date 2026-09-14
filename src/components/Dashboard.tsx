import React from 'react';
import { 
  FileText, ShieldCheck, RefreshCw, Layers, Calendar, Clock, ArrowRight, CheckCircle2, 
  AlertTriangle, Building2, Users2, CheckSquare, ClipboardList, AlertCircle, GraduationCap
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { RecordItem, DashboardStats, PartnerOrganization, OJTStudent } from '../types';

interface DashboardProps {
  records: RecordItem[];
  stats: DashboardStats;
  organizations: PartnerOrganization[];
  students: OJTStudent[];
  onNavigate: (tab: 'dashboard' | 'moa' | 'lo' | 'students' | 'settings' | 'audit_logs' | 'organizations') => void;
  onSelectContract?: (id: string) => void;
  onSelectOrg?: (id: string) => void;
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

export default function Dashboard({ 
  records, 
  stats, 
  organizations,
  students,
  onNavigate, 
  onSelectContract,
  onSelectOrg,
  onSync, 
  isSyncing 
}: DashboardProps) {
  
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  let greeting = 'Good evening';
  if (hour < 5) greeting = 'Good night';
  else if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  const currentDateStr = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate industry breakdown for organizations
  const industryCounts: Record<string, number> = {};
  organizations.forEach(org => {
    const ind = org.industry || 'Other';
    industryCounts[ind] = (industryCounts[ind] || 0) + 1;
  });

  const industryData = Object.entries(industryCounts).map(([name, value]) => ({
    name,
    value
  })).slice(0, 5); // top 5

  // Custom theme-appropriate Obsidian colors
  const COLORS = ['#ff5451', '#4ade80', '#60a5fa', '#f59e0b', '#c9c9cf'];

  const hasRecords = stats.totalMOA > 0 || stats.totalLO > 0;

  // Status mapping for chart
  const moas = records.filter(r => r.type === 'MOA');
  const moaStatusData = [
    { name: 'Active', count: moas.filter(r => r.status === 'Active').length, fill: '#4ade80' },
    { name: 'Expiring Soon', count: moas.filter(r => r.status === 'Expiring Soon').length, fill: '#f59e0b' },
    { name: 'Expired', count: moas.filter(r => r.status === 'Expired').length, fill: '#ff5451' },
    { name: 'Archived', count: moas.filter(r => r.status === 'Archived').length, fill: '#60a5fa' }
  ];

  // Expiration analysis
  const expirations = moas.filter(item => {
    if (!item.expirationDate || item.isIndefinite || item.status === 'Archived') return false;
    const expDate = new Date(item.expirationDate);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 180 || expDate < today;
  }).map(item => {
    const expDate = new Date(item.expirationDate!);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let severity: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
    let label = '';
    
    if (expDate < today) {
      severity = 'Critical';
      label = 'Expired';
    } else if (diffDays <= 30) {
      severity = 'High';
      label = `Expires in ${diffDays} days`;
    } else if (diffDays <= 90) {
      severity = 'Medium';
      label = `Expires in ${diffDays} days`;
    } else {
      severity = 'Low';
      label = `Expires in ${diffDays} days`;
    }

    return {
      ...item,
      diffDays,
      severity,
      label
    };
  }).sort((a, b) => a.diffDays - b.diffDays);

  // Task analysis (Incomplete tasks across all records)
  const pendingTasks = records.reduce((acc: any[], record) => {
    if (record.tasks) {
      record.tasks.forEach(task => {
        if (task.status !== 'Completed') {
          acc.push({
            ...task,
            contractId: record.id,
            contractTitle: record.title,
            controlNumber: record.controlNumber
          });
        }
      });
    }
    return acc;
  }, []).sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  }).slice(0, 5); // Top 5 urgent tasks

  // Get 5 most recent records
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6" id="dashboard-root-layout">
      {/* Welcome Hero / Sync Banner */}
      <div className="bg-void-black/80 backdrop-blur-xl border border-glass-stroke rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden" id="dashboard-hero-card">
        {/* Decorative subtle ambient glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#f59e0b]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-4 relative z-10 flex-1">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-starlight-white font-headline tracking-tight leading-snug mb-2">
              {greeting}!
            </h2>
            <p className="text-secondary text-xs sm:text-sm font-sans max-w-xl">
              Welcome back to the University Partnership & Legal Registry. Monitor active memorandum agreements and coordinate educational pathways.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {stats.pendingSync > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2b2116] border border-[#533f24] rounded font-mono text-[10px] uppercase font-bold text-[#f59e0b] animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5" />
                {stats.pendingSync} UNSYNCED
              </span>
            )}
          </div>
        </div>

        {/* Live system clock panel inspired by the uploaded image */}
        <div className="relative z-10 flex-shrink-0 w-full md:w-auto">
          <div className="bg-[#0b0a0f] border border-glass-stroke/85 p-5 rounded-lg min-w-[240px] shadow-[0_4px_24px_rgba(0,0,0,0.6)] flex flex-col justify-center">
            <div className="flex items-center gap-2 text-secondary text-[10px] font-mono font-bold uppercase tracking-widest mb-2">
              <Clock className="h-3.5 w-3.5 text-[#34d399]" />
              System Chronometer
            </div>
            <div className="text-starlight-white text-3xl font-mono font-bold tracking-wider mb-1 font-numeric">
              {time.toLocaleTimeString('en-US', { hour12: true })}
            </div>
            <div className="text-[10px] font-mono font-semibold text-secondary flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-secondary/70" />
              {currentDateStr.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Performance Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="dashboard-stats-grid">
        {/* Total MOA Card */}
        <div className="bg-void-black/80 backdrop-blur-xl p-5 rounded border border-glass-stroke hover:border-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(255,84,81,0.1)] cursor-pointer group flex justify-between items-start" id="stat-card-total-moa">
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold text-secondary uppercase tracking-widest">AGREEMENTS (MOA)</p>
            <p className="text-3xl font-extrabold text-starlight-white font-headline group-hover:text-primary transition-colors">{stats.totalMOA}</p>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#4ade80] font-mono px-2 py-0.5 rounded bg-[#4ade80]/10 border border-[#4ade80]/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{stats.activeMOA} ACTIVE</span>
            </div>
          </div>
          <div className="p-2.5 bg-surface-container border border-glass-stroke text-primary rounded">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* Total LO Card */}
        <div className="bg-void-black/80 backdrop-blur-xl p-5 rounded border border-glass-stroke hover:border-primary transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(255,84,81,0.1)] cursor-pointer group flex justify-between items-start" id="stat-card-total-lo">
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold text-secondary uppercase tracking-widest">LEGAL OPINIONS (LO)</p>
            <p className="text-3xl font-extrabold text-starlight-white font-headline group-hover:text-primary transition-colors">{stats.totalLO}</p>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#60a5fa] font-mono px-2 py-0.5 rounded bg-[#60a5fa]/10 border border-[#60a5fa]/20">
              <FileText className="h-3.5 w-3.5" />
              <span>{stats.issuedLO} ISSUED</span>
            </div>
          </div>
          <div className="p-2.5 bg-surface-container border border-glass-stroke text-primary rounded">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Total Students Logged Card */}
        <div className="bg-void-black/80 backdrop-blur-xl p-5 rounded border border-glass-stroke hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(255,255,255,0.02)] flex justify-between items-start cursor-pointer group" id="stat-card-total-orgs" onClick={() => onNavigate('students')}>
          <div className="space-y-2">
            <p className="text-[10px] font-mono font-bold text-secondary uppercase tracking-widest">STUDENTS LOGGED</p>
            <p className="text-3xl font-extrabold text-starlight-white font-headline group-hover:text-primary transition-colors">{students.length}</p>
            <div className="inline-flex items-center gap-1.5 text-xs text-secondary font-mono px-2 py-0.5 rounded bg-surface-container border border-glass-stroke/50">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              <span>OJT ROSTER</span>
            </div>
          </div>
          <div className="p-2.5 bg-surface-container border border-glass-stroke text-primary rounded">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Recent Records Table */}
      <div className="bg-void-black/80 backdrop-blur-xl rounded border border-glass-stroke shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden" id="dashboard-recent-records-section">
        <header className="p-5 border-b border-glass-stroke flex items-center justify-between bg-surface-container/20">
          <div className="space-y-0.5">
            <h3 className="font-bold text-starlight-white font-headline text-base">Recently Added Records</h3>
            <p className="text-xs text-secondary">Overview of the latest additions to the registry</p>
          </div>
          <button 
            onClick={() => onNavigate('moa')}
            className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            VIEW ALL AGREEMENTS
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="overflow-x-auto">
          {recentRecords.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-glass-stroke text-secondary text-[10px] font-mono uppercase tracking-wider bg-surface-container/20">
                  <th className="px-6 py-3 font-semibold">Document Title</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-stroke/50 text-sm text-starlight-white font-sans">
                {recentRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-highest/20 transition-colors">
                    <td className="px-6 py-4 max-w-md">
                      <p 
                        className="font-medium text-starlight-white truncate hover:underline cursor-pointer" 
                        title={item.title}
                        onClick={() => onSelectContract && onSelectContract(item.id)}
                      >
                        {item.title}
                      </p>
                      <p className="text-xs text-secondary truncate mt-0.5">
                        {item.description || 'No description provided.'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container border border-glass-stroke text-starlight-white font-mono text-[9px] uppercase tracking-wider">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[9px] tracking-widest uppercase ${
                        item.status === 'Active' || item.status === 'Issued' 
                          ? 'bg-[#1a2e1f] border border-[#2d5a39] text-[#4ade80]' 
                          : item.status === 'Expiring Soon'
                          ? 'bg-[#2b2116] border border-[#533f24] text-[#f59e0b]'
                          : 'bg-[#2d1215] border border-[#5f2024] text-[#ffb4ab]'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-secondary">
                      {new Date(item.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="p-3 bg-surface-container rounded-full text-secondary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-starlight-white">No records found</p>
                <p className="text-xs text-secondary mt-1">Start by adding a memorandum of agreement or legal opinion</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
