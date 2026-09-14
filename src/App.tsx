import React, { useState, useEffect, useRef } from 'react';
import { 
  Landmark, ShieldCheck, Users, Settings as SettingsIcon, FileText, 
  Search, Plus, Download, Upload, Trash2, Edit2, Printer, X, Eye, CheckCircle2,
  AlertCircle, ArrowLeft, ArrowRight, RefreshCw, Calendar, Award, GraduationCap, Check, Lock, LogOut, Building2, Briefcase, Menu, LayoutDashboard, Phone,
  Clock, CheckCheck, XCircle, Clock3, Sun, Moon, Home
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Dashboard from './components/Dashboard';
import OrganizationsTab from './components/OrganizationsTab';
import ContractWorkspace from './components/ContractWorkspace';
import { OJTHourTrackerTab } from './components/OJTHourTrackerTab';
import { CustomSelect } from './components/ui/CustomSelect';
import { NotificationDropdown } from './components/NotificationDropdown';
import { defaultNotificationEngine } from './lib/notifications';
import { 
  getRecords, createRecord, updateRecord, deleteRecord,
  getStudents, createStudent, updateStudent, deleteStudent, createStudentsBulk,
  getSettings, saveSettings, getStats, SystemSettings,
  getCurrentUser, setCurrentUser, login, logout, getAuditLogs, fetchSettingsFromServer, importBackup, UserSession,
  getOrganizations, createOrganization, updateOrganization, deleteOrganization,
  getStoredNotifications, saveStoredNotifications,
  getTimeLogs, createTimeLog, updateTimeLog, approveTimeLog, rejectTimeLog, deleteTimeLog, bulkApproveTimeLogs, createTimeLogsBulk
} from './lib/storage';
import { exportToExcel } from './lib/excel';
import { RecordItem, OJTStudent, Attachment, PartnerOrganization, ContractVersion, LegalTask, TimelineEvent, OJTNotification, OJTTimeLog, DashboardStats } from './types';

export function formatNameWord(word: string): string {
  if (!word) return '';
  const upper = word.toUpperCase();
  
  if (['JR', 'JR.', 'SR', 'SR.'].includes(upper)) {
    return upper.slice(0, 1) + upper.slice(1).toLowerCase();
  }
  if (['II', 'III', 'IV', 'V', 'VI'].includes(upper)) {
    return upper;
  }
  
  // Initials: Single letter with/without period ("A", "A."), or 2-letter uppercase compound initials ending with a period ("DC.", "DL.")
  if (/^[A-Z]\.?$/.test(word) || /^[A-Z]{2}\.$/.test(word)) {
    return upper;
  }

  if (word.includes("'")) {
    return word.split("'").map((part, i) => {
      if (!part) return '';
      if (i === 0 && part.toUpperCase() === 'O') return 'O';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join("'");
  }
  
  if (word.includes('-')) {
    return word.split('-').map(part => {
      if (!part) return '';
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join('-');
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatProperName(nameStr: string): string {
  if (!nameStr) return '';
  return nameStr.trim().split(/\s+/).map(formatNameWord).join(' ');
}

export interface ThemeOption {
  id: string;
  name: string;
  primary: string;
  primaryContainer: string;
  outline: string;
  outlineVariant: string;
  glow: string;
  bgDot: string;
  desc: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: 'coral',
    name: 'Sunset Coral',
    primary: '#ffb3ad',
    primaryContainer: '#ff5451',
    outline: '#ab8986',
    outlineVariant: '#5b403e',
    glow: 'rgba(255, 84, 81, 0.3)',
    bgDot: 'bg-[#ff5451]',
    desc: 'The original warm, rich corporate rose theme.'
  },
  {
    id: 'sapphire',
    name: 'Ocean Sapphire',
    primary: '#93c5fd',
    primaryContainer: '#2563eb',
    outline: '#60a5fa',
    outlineVariant: '#1e3a8a',
    glow: 'rgba(37, 99, 235, 0.3)',
    bgDot: 'bg-[#2563eb]',
    desc: 'A professional, trustworthy intellectual blue.'
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    primary: '#a7f3d0',
    primaryContainer: '#059669',
    outline: '#34d399',
    outlineVariant: '#064e3b',
    glow: 'rgba(5, 150, 105, 0.3)',
    bgDot: 'bg-[#059669]',
    desc: 'An academic, classic deep foliage emerald green.'
  },
  {
    id: 'amethyst',
    name: 'Imperial Amethyst',
    primary: '#e9d5ff',
    primaryContainer: '#8b5cf6',
    outline: '#a78bfa',
    outlineVariant: '#4c1d95',
    glow: 'rgba(139, 92, 246, 0.3)',
    bgDot: 'bg-[#8b5cf6]',
    desc: 'A premium, high-luxury lavender & royal purple.'
  },
  {
    id: 'steel',
    name: 'Steel Slate',
    primary: '#f1f5f9',
    primaryContainer: '#475569',
    outline: '#94a3b8',
    outlineVariant: '#334155',
    glow: 'rgba(71, 85, 105, 0.3)',
    bgDot: 'bg-[#475569]',
    desc: 'A hyper-modern, minimalist high-tech monochrome.'
  }
];

export function numberToWords(num: number): string {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  
  if (isNaN(num) || num === 0) return 'ZERO';
  if (num < 0) return 'MINUS ' + numberToWords(Math.abs(num));
  
  let words = '';
  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + ' THOUSAND ';
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    words += ones[Math.floor(num / 100)] + ' HUNDRED ';
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += '-' + ones[num % 10];
      }
    }
  }
  return words.trim();
}

export function getDayOrdinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

export function formatCertDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatStudentFullName(student?: OJTStudent | null): string {
  if (!student) return '';
  const first = student.firstName?.trim() || '';
  const last = student.lastName?.trim() || '';
  let middle = student.middleName?.trim() || '';
  if (middle) {
    if (middle.length === 1 || middle.endsWith('.')) {
      middle = middle.endsWith('.') ? middle : `${middle}.`;
    } else {
      middle = `${middle[0].toUpperCase()}.`;
    }
    return `${first} ${middle} ${last}`.toUpperCase();
  }
  return `${first} ${last}`.toUpperCase();
}

export function formatStudentCourseSchool(student?: OJTStudent | null): string {
  if (!student) return '';
  const course = student.course?.trim() || 'Bachelor of Public Administration';
  const school = student.school?.trim() || student.yearAndSection?.replace(/^School:\s*/i, '').trim() || 'Pangasinan State University, Lingayen Campus';
  return `(${course}, ${school})`;
}

export function getHoursText(student?: OJTStudent | null, customHours?: string): string {
  const hoursNum = parseInt(customHours || (student ? (student.hoursCompleted || student.hoursRequired || 400).toString() : '400'), 10) || 400;
  const words = numberToWords(hoursNum);
  return `${words} (${hoursNum}) HOURS ON THE JOB AND WORK IMMERSION TRAINING`;
}

export function getOfficeAndDatesText(
  student?: OJTStudent | null,
  customDates?: string,
  customOffice?: string,
  getCompanyName?: (moaId?: string) => string,
  dateFrom?: string,
  dateTo?: string
): string {
  const office = customOffice || student?.office || (student?.moaId && getCompanyName ? getCompanyName(student.moaId) : '') || 'Provincial Assessment Office';
  let datesStr = customDates;
  if (!datesStr) {
    const start = (dateFrom !== undefined && dateFrom.trim() !== '')
      ? dateFrom.trim()
      : (student?.startDate ? formatCertDate(student.startDate) : 'February 3, 2025');
    const end = (dateTo !== undefined && dateTo.trim() !== '')
      ? dateTo.trim()
      : (student?.endDate ? formatCertDate(student.endDate) : 'April 15, 2025');
    datesStr = `from ${start} to ${end}`;
  }
  return `${datesStr} at the ${office}, Capitol Compound, Lingayen, Pangasinan.`;
}

export interface PortraitTwoInOneCertificateProps {
  student1?: OJTStudent | null;
  student2?: OJTStudent | null;
  customHours1?: string;
  customHours2?: string;
  customDates1?: string;
  customDates2?: string;
  dateFrom1?: string;
  dateTo1?: string;
  dateFrom2?: string;
  dateTo2?: string;
  customOffice1?: string;
  customOffice2?: string;
  givenDay: string;
  givenMonthYear: string;
  getCompanyName: (moaId?: string) => string;
  onSelectStudent1Click?: () => void;
  onSelectStudent2Click?: () => void;
}

export function PortraitTwoInOneCertificate({
  student1,
  student2,
  customHours1,
  customHours2,
  customDates1,
  customDates2,
  dateFrom1,
  dateTo1,
  dateFrom2,
  dateTo2,
  customOffice1,
  customOffice2,
  givenDay,
  givenMonthYear,
  getCompanyName,
  onSelectStudent1Click,
  onSelectStudent2Click
}: PortraitTwoInOneCertificateProps) {
  const name1 = formatStudentFullName(student1);
  const courseSchool1 = formatStudentCourseSchool(student1);
  const hours1 = getHoursText(student1, customHours1);
  const officeDates1 = getOfficeAndDatesText(student1, customDates1, customOffice1, getCompanyName, dateFrom1, dateTo1);

  const name2 = formatStudentFullName(student2);
  const courseSchool2 = formatStudentCourseSchool(student2);
  const hours2 = getHoursText(student2, customHours2);
  const officeDates2 = getOfficeAndDatesText(student2, customDates2, customOffice2, getCompanyName, dateFrom2, dateTo2);

  const givenDateStr = `Given this ${givenDay} day of ${givenMonthYear}.`;

  return (
    <div
      id="print-certificate-area"
      className="relative w-full max-w-[720px] mx-auto shadow-2xl rounded overflow-hidden bg-white text-black select-none print:max-w-none print:w-full print:h-full print:shadow-none print:rounded-none"
      style={{
        aspectRatio: '3400 / 4400',
        containerType: 'inline-size'
      }}
    >
      {/* Official Pangasinan 2-in-1 Template Background Image */}
      <img
        src="/template.jpg"
        alt="Province of Pangasinan Certificate of Completion Template"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
      />

      {/* ==================== TOP CERTIFICATE (STUDENT 1) ==================== */}
      {student1 ? (
        <div 
          onClick={onSelectStudent1Click}
          className="absolute inset-x-0 top-0 h-[50%] group cursor-pointer print:cursor-default pointer-events-auto"
          title="Click to change Student 1"
        >
          {/* Subtle hover badge for web preview */}
          <div className="absolute top-4 right-5 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-void-black/85 text-starlight-white border border-glass-stroke font-mono text-[9px] px-2 py-1 rounded shadow-lg pointer-events-none flex items-center gap-1 z-20">
            <Search className="h-3 w-3 text-primary" />
            Click to change Student 1
          </div>

          {/* Student 1 Name */}
          <div
            className="absolute inset-x-[6%] text-center font-serif font-bold text-[#111111] uppercase tracking-wider print:text-[20pt]"
            style={{
              top: '38.0%',
              fontSize: 'clamp(14px, 3.2cqw, 26px)',
              lineHeight: 1.15,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {name1}
          </div>

          {/* Student 1 Course & School */}
          <div
            className="absolute inset-x-[6%] text-center font-serif font-bold text-[#222222] print:text-[12pt]"
            style={{
              top: '46.8%',
              fontSize: 'clamp(9px, 1.85cqw, 15px)',
              lineHeight: 1.2,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {courseSchool1}
          </div>

          {/* Student 1 Hours */}
          <div
            className="absolute inset-x-[8%] text-center font-serif font-bold text-[#111111] tracking-wide print:text-[11pt]"
            style={{
              top: '60.8%',
              fontSize: 'clamp(8.5px, 1.7cqw, 13.5px)',
              lineHeight: 1.2,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {hours1}
          </div>

          {/* Student 1 Office and Dates */}
          <div
            className="absolute inset-x-[9%] text-center font-serif text-[#1e1e1e] leading-snug print:text-[10.5pt]"
            style={{
              top: '64.8%',
              fontSize: 'clamp(8px, 1.55cqw, 12.5px)',
              lineHeight: 1.3,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {officeDates1}
          </div>

          {/* Student 1 Given Date */}
          <div
            className="absolute inset-x-[8%] text-center font-serif text-[#1e1e1e] print:text-[10.5pt]"
            style={{
              top: '73.8%',
              fontSize: 'clamp(8px, 1.55cqw, 12.5px)',
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {givenDateStr}
          </div>
        </div>
      ) : (
        <div 
          onClick={onSelectStudent1Click}
          className="absolute inset-x-[15%] top-[18%] h-[22%] border-2 border-dashed border-primary/50 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center p-4 text-center cursor-pointer print:hidden group pointer-events-auto shadow-sm"
        >
          <Search className="h-7 w-7 text-primary/70 mb-1 group-hover:scale-110 transition-transform" />
          <span className="font-sans text-xs font-bold text-gray-800">Top Certificate: Click to Search & Pick Student 1</span>
          <span className="font-sans text-[10px] text-gray-500">Open student search popup</span>
        </div>
      )}

      {/* ==================== BOTTOM CERTIFICATE (STUDENT 2) ==================== */}
      {student2 ? (
        <div 
          onClick={onSelectStudent2Click}
          className="absolute inset-x-0 bottom-0 h-[50%] group cursor-pointer print:cursor-default pointer-events-auto"
          title="Click to change Student 2"
        >
          {/* Subtle hover badge for web preview */}
          <div className="absolute top-4 right-5 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-void-black/85 text-starlight-white border border-glass-stroke font-mono text-[9px] px-2 py-1 rounded shadow-lg pointer-events-none flex items-center gap-1 z-20">
            <Search className="h-3 w-3 text-amber-400" />
            Click to change Student 2
          </div>

          {/* Student 2 Name */}
          <div
            className="absolute inset-x-[6%] text-center font-serif font-bold text-[#111111] uppercase tracking-wider print:text-[20pt]"
            style={{
              top: '36.4%',
              fontSize: 'clamp(14px, 3.2cqw, 26px)',
              lineHeight: 1.15,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {name2}
          </div>

          {/* Student 2 Course & School */}
          <div
            className="absolute inset-x-[6%] text-center font-serif font-bold text-[#222222] print:text-[12pt]"
            style={{
              top: '45.0%',
              fontSize: 'clamp(9px, 1.85cqw, 15px)',
              lineHeight: 1.2,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {courseSchool2}
          </div>

          {/* Student 2 Hours */}
          <div
            className="absolute inset-x-[8%] text-center font-serif font-bold text-[#111111] tracking-wide print:text-[11pt]"
            style={{
              top: '59.0%',
              fontSize: 'clamp(8.5px, 1.7cqw, 13.5px)',
              lineHeight: 1.2,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {hours2}
          </div>

          {/* Student 2 Office and Dates */}
          <div
            className="absolute inset-x-[9%] text-center font-serif text-[#1e1e1e] leading-snug print:text-[10.5pt]"
            style={{
              top: '63.0%',
              fontSize: 'clamp(8px, 1.55cqw, 12.5px)',
              lineHeight: 1.3,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {officeDates2}
          </div>

          {/* Student 2 Given Date */}
          <div
            className="absolute inset-x-[8%] text-center font-serif text-[#1e1e1e] print:text-[10.5pt]"
            style={{
              top: '72.0%',
              fontSize: 'clamp(8px, 1.55cqw, 12.5px)',
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {givenDateStr}
          </div>
        </div>
      ) : (
        <div 
          onClick={onSelectStudent2Click}
          className="absolute inset-x-[15%] bottom-[18%] h-[22%] border-2 border-dashed border-amber-500/50 rounded-xl bg-amber-50/80 hover:bg-amber-100/90 transition-colors flex flex-col items-center justify-center p-4 text-center cursor-pointer print:hidden group pointer-events-auto shadow-sm"
        >
          <Users className="h-7 w-7 text-amber-600/80 mb-1 group-hover:scale-110 transition-transform" />
          <span className="font-sans text-xs font-bold text-amber-950">Bottom Certificate: Click to Search & Pick Student 2</span>
          <span className="font-sans text-[10px] text-amber-800/80 mt-0.5">Click here to search and select Student 2 from popup</span>
        </div>
      )}
    </div>
  );
}

export interface LandscapeSingleCertificateProps {
  student?: OJTStudent | null;
  customHours?: string;
  customDates?: string;
  dateFrom?: string;
  dateTo?: string;
  customOffice?: string;
  givenDay: string;
  givenMonthYear: string;
  getCompanyName: (moaId?: string) => string;
  onSelectStudentClick?: () => void;
}

export function LandscapeSingleCertificate({
  student,
  customHours,
  customDates,
  dateFrom,
  dateTo,
  customOffice,
  givenDay,
  givenMonthYear,
  getCompanyName,
  onSelectStudentClick
}: LandscapeSingleCertificateProps) {
  const name = formatStudentFullName(student);
  const courseSchool = formatStudentCourseSchool(student);
  const hours = getHoursText(student, customHours);
  const officeDates = getOfficeAndDatesText(student, customDates, customOffice, getCompanyName, dateFrom, dateTo);
  const givenDateStr = `Given this ${givenDay} day of ${givenMonthYear}.`;

  return (
    <div
      id="print-certificate-area"
      className="relative w-full max-w-[860px] mx-auto shadow-2xl rounded overflow-hidden bg-white text-black select-none print:max-w-none print:w-full print:h-full print:shadow-none print:rounded-none"
      style={{
        aspectRatio: '3400 / 2200',
        containerType: 'inline-size'
      }}
    >
      {/* Official Pangasinan Single Template Background Image */}
      <img
        src="/template_single.jpg"
        alt="Province of Pangasinan Certificate of Completion Template"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none"
      />

      {student ? (
        <div 
          onClick={onSelectStudentClick}
          className="absolute inset-0 group cursor-pointer print:cursor-default pointer-events-auto"
          title="Click to change student"
        >
          {/* Subtle hover badge for web preview */}
          <div className="absolute top-4 right-5 print:hidden opacity-0 group-hover:opacity-100 transition-opacity bg-void-black/85 text-starlight-white border border-glass-stroke font-mono text-[9px] px-2 py-1 rounded shadow-lg pointer-events-none flex items-center gap-1 z-20">
            <Search className="h-3 w-3 text-primary" />
            Click to change intern
          </div>

          {/* Student Name */}
          <div
            className="absolute inset-x-[6%] text-center font-serif font-bold text-[#111111] uppercase tracking-wider print:text-[22pt]"
            style={{
              top: '38.0%',
              fontSize: 'clamp(14px, 3.2cqw, 28px)',
              lineHeight: 1.15,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {name}
          </div>

          {/* Student Course & School */}
          <div
            className="absolute inset-x-[6%] text-center font-serif font-bold text-[#222222] print:text-[13pt]"
            style={{
              top: '46.8%',
              fontSize: 'clamp(9px, 1.85cqw, 16px)',
              lineHeight: 1.2,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {courseSchool}
          </div>

          {/* Student Hours */}
          <div
            className="absolute inset-x-[8%] text-center font-serif font-bold text-[#111111] tracking-wide print:text-[12pt]"
            style={{
              top: '60.8%',
              fontSize: 'clamp(8.5px, 1.7cqw, 14.5px)',
              lineHeight: 1.2,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {hours}
          </div>

          {/* Student Office and Dates */}
          <div
            className="absolute inset-x-[9%] text-center font-serif text-[#1e1e1e] leading-snug print:text-[11pt]"
            style={{
              top: '64.8%',
              fontSize: 'clamp(8px, 1.55cqw, 13px)',
              lineHeight: 1.3,
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {officeDates}
          </div>

          {/* Student Given Date */}
          <div
            className="absolute inset-x-[8%] text-center font-serif text-[#1e1e1e] print:text-[11pt]"
            style={{
              top: '73.8%',
              fontSize: 'clamp(8px, 1.55cqw, 13px)',
              fontFamily: '"Times New Roman", Times, Georgia, serif'
            }}
          >
            {givenDateStr}
          </div>
        </div>
      ) : (
        <div 
          onClick={onSelectStudentClick}
          className="absolute inset-x-[20%] top-[30%] h-[40%] border-2 border-dashed border-primary/50 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer print:hidden group pointer-events-auto shadow-sm"
        >
          <Search className="h-9 w-9 text-primary/70 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-sans text-sm font-bold text-gray-800">Click to Search & Pick Student for Certificate</span>
          <span className="font-sans text-xs text-gray-500 mt-1">Open student search popup</span>
        </div>
      )}
    </div>
  );
}

interface StudentCertificatePickerModalProps {
  isOpen: boolean;
  targetSlot: 'student1' | 'student2';
  currentSelectedId: string;
  otherSlotSelectedId: string;
  students: OJTStudent[];
  onSelectStudent: (student: OJTStudent) => void;
  onClose: () => void;
}

export function StudentCertificatePickerModal({
  isOpen,
  targetSlot,
  currentSelectedId,
  otherSlotSelectedId,
  students,
  onSelectStudent,
  onClose
}: StudentCertificatePickerModalProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'On-going'>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = students.filter(s => {
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const name = `${s.firstName} ${s.middleName || ''} ${s.lastName}`.toLowerCase();
    const revName = `${s.lastName} ${s.firstName}`.toLowerCase();
    return (
      name.includes(q) ||
      revName.includes(q) ||
      (s.studentId || '').toLowerCase().includes(q) ||
      (s.course || '').toLowerCase().includes(q) ||
      (s.school || '').toLowerCase().includes(q) ||
      (s.office || '').toLowerCase().includes(q)
    );
  });

  const slotTitle = targetSlot === 'student1' ? 'Student 1 (Top Certificate)' : 'Student 2 (Bottom Certificate)';
  const slotBadgeClass = targetSlot === 'student1' 
    ? 'bg-primary/20 text-primary border-primary/40' 
    : 'bg-amber-500/20 text-amber-400 border-amber-500/40';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void-black/80 backdrop-blur-md animate-fade-in print:hidden"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-surface-container border border-glass-stroke rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-glass-stroke flex items-center justify-between bg-surface-container-high/60">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${slotBadgeClass}`}>
                {targetSlot === 'student1' ? 'Top Half' : 'Bottom Half'}
              </span>
              <h3 className="font-headline text-base sm:text-lg font-bold text-starlight-white">
                Choose Intern for {slotTitle}
              </h3>
            </div>
            <p className="font-sans text-xs text-secondary mt-1">
              Live search across roster by student name, ID, degree, school, or office.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-white rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-glass-stroke/60 bg-surface-container/80 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary h-4 w-4" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by intern name, ID (e.g. 2026-49292), course, school, or office..."
              className="w-full bg-void-black/80 border border-glass-stroke rounded-xl pl-10 pr-10 py-2.5 font-sans text-sm text-starlight-white outline-none focus:border-primary transition-colors shadow-inner"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              {(['All', 'Completed', 'On-going'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-primary text-void-black font-bold shadow-sm'
                      : 'text-secondary hover:text-white hover:bg-surface-container-high'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <span className="font-mono text-[11px] text-secondary">
              Showing <strong className="text-starlight-white">{filtered.length}</strong> of {students.length} interns
            </span>
          </div>
        </div>

        {/* Scrollable Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-secondary">
              <Search className="h-10 w-10 mx-auto opacity-30 mb-2" />
              <p className="font-headline text-sm font-semibold text-starlight-white">No matching interns found</p>
              <p className="font-sans text-xs mt-0.5">Try searching with a different name, keyword, or clear the search query.</p>
            </div>
          ) : (
            filtered.map((s) => {
              const isSelected = s.id === currentSelectedId;
              const isOtherSlot = s.id === otherSlotSelectedId;
              const fullName = formatStudentFullName(s);

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectStudent(s);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-primary/15 border-primary shadow-[0_0_15px_rgba(255,179,173,0.15)] ring-1 ring-primary/40'
                      : isOtherSlot
                        ? 'bg-surface-container-low/40 border-glass-stroke/40 opacity-75 hover:opacity-100 hover:border-amber-500/40'
                        : 'bg-surface-container/60 hover:bg-surface-container-high border-glass-stroke/70 hover:border-primary/50'
                  }`}
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-xs shrink-0 border ${
                      isSelected
                        ? 'bg-primary text-void-black border-primary'
                        : 'bg-gradient-to-br from-surface-container-highest to-void-black text-starlight-white border-glass-stroke group-hover:border-primary/40'
                    }`}>
                      {s.firstName?.[0]}{s.lastName?.[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-headline text-sm font-bold text-starlight-white truncate group-hover:text-primary transition-colors">
                          {fullName}
                        </h4>
                        <span className="font-mono text-[10px] text-secondary bg-void-black/60 px-1.5 py-0.5 rounded border border-glass-stroke/40">
                          {s.studentId}
                        </span>
                        {isOtherSlot && (
                          <span className="font-mono text-[9px] text-amber-400 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded">
                            {targetSlot === 'student1' ? 'Assigned to Slot 2' : 'Assigned to Slot 1'}
                          </span>
                        )}
                        {isSelected && (
                          <span className="font-mono text-[9px] text-green-400 bg-green-950/50 border border-green-800/60 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" />
                            Current Selection
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-xs text-secondary truncate mt-0.5">
                        {s.course} &bull; <span className="text-secondary/70">{s.school || s.yearAndSection?.replace(/^School:\s*/i, '')}</span>
                      </p>
                      <p className="font-sans text-[11px] text-primary/80 truncate mt-0.5">
                        {s.office || 'Provincial Assessment Office'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Hours badge + Select button */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="font-mono text-xs font-bold text-starlight-white">
                        {s.hoursCompleted || s.hoursRequired || 400} hrs
                      </div>
                      <div className="font-mono text-[10px] text-secondary">
                        {s.status}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-primary text-void-black'
                          : 'bg-surface-container-high group-hover:bg-primary group-hover:text-void-black text-secondary'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Select'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-high/40 border-t border-glass-stroke flex items-center justify-between text-[11px] font-mono text-secondary">
          <span>Press <kbd className="px-1.5 py-0.5 bg-void-black/60 rounded border border-glass-stroke text-[10px]">ESC</kbd> or click outside to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-surface-container hover:bg-surface-container-highest border border-glass-stroke rounded text-starlight-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface CertificatePreviewProps {
  selectedCertStudentId: string;
  students: OJTStudent[];
  certStyle: 'gold' | 'blue' | 'emerald' | 'ruby';
  certTitle: string;
  certCustomHours: string;
  certSignatoryName: string;
  certSignatoryTitle: string;
  certSecondarySignatoryName: string;
  certSecondarySignatoryTitle: string;
  certDate: string;
  universityName: string;
  getCompanyName: (moaId?: string) => string;
}

function CertificatePreview({
  selectedCertStudentId,
  students,
  certStyle,
  certTitle,
  certCustomHours,
  certSignatoryName,
  certSignatoryTitle,
  certSecondarySignatoryName,
  certSecondarySignatoryTitle,
  certDate,
  universityName,
  getCompanyName
}: CertificatePreviewProps) {
  const certStudent = selectedCertStudentId ? students.find(s => s.id === selectedCertStudentId) : null;
  if (!certStudent) {
    return (
      <div className="w-full aspect-[1.414/1] bg-void-black/80 border border-dashed border-glass-stroke rounded flex flex-col items-center justify-center p-8 text-center">
        <Award className="h-12 w-12 text-secondary/40 mb-3" />
        <h4 className="font-headline text-base font-bold text-starlight-white">No Student Selected</h4>
        <p className="font-sans text-xs text-secondary mt-1 max-w-sm">
          Please select a student from the dropdown menu on the left or click the generate button next to an intern in the roster list.
        </p>
      </div>
    );
  }

  const colors = {
    gold: {
      border: 'border-amber-500/80',
      bg: 'bg-gradient-to-br from-[#1a150e] to-[#0e0c08]',
      text: 'text-amber-300',
      accent: '#f59e0b',
      shadow: 'rgba(245,158,11,0.15)',
      seal: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-amber-300/40'
    },
    blue: {
      border: 'border-blue-500/80',
      bg: 'bg-gradient-to-br from-[#0c1624] to-[#060a10]',
      text: 'text-blue-300',
      accent: '#3b82f6',
      shadow: 'rgba(59,130,246,0.15)',
      seal: 'bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 border-blue-300/40'
    },
    emerald: {
      border: 'border-emerald-500/80',
      bg: 'bg-gradient-to-br from-[#0b1c14] to-[#050e0a]',
      text: 'text-emerald-300',
      accent: '#10b981',
      shadow: 'rgba(16,185,129,0.15)',
      seal: 'bg-gradient-to-br from-emerald-300 via-emerald-400 to-emerald-600 border-emerald-300/40'
    },
    ruby: {
      border: 'border-rose-500/80',
      bg: 'bg-gradient-to-br from-[#1c0d10] to-[#0e0608]',
      text: 'text-rose-300',
      accent: '#f43f5e',
      shadow: 'rgba(244,63,94,0.15)',
      seal: 'bg-gradient-to-br from-rose-300 via-rose-400 to-rose-600 border-rose-300/40'
    }
  };

  const theme = colors[certStyle] || colors.gold;

  return (
    <div 
      id="print-certificate-area"
      className={`w-full aspect-[1.414/1] relative p-8 md:p-12 lg:p-16 rounded border ${theme.border} ${theme.bg} shadow-2xl overflow-hidden transition-all duration-300 print:rounded-none`}
      style={{ boxShadow: `0 20px 50px ${theme.shadow}` }}
    >
      <div className={`absolute inset-4 border border-dashed ${theme.border} opacity-20 pointer-events-none`} />
      <div className={`absolute inset-6 border-2 ${theme.border} pointer-events-none`} />
      
      <div className={`absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 ${theme.border}`} />
      <div className={`absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 ${theme.border}`} />
      <div className={`absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 ${theme.border}`} />
      <div className={`absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 ${theme.border}`} />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5">
        <Award className="w-96 h-96 text-white" />
      </div>

      <div className="h-full flex flex-col justify-between items-center text-center relative z-10">
        <div className="space-y-1 md:space-y-2">
          <div className="flex justify-center items-center gap-2 mb-1">
            <GraduationCap className="h-8 w-8 text-primary" style={{ color: theme.accent }} />
          </div>
          <h4 className="font-mono text-[10px] md:text-xs tracking-[0.25em] text-secondary uppercase font-bold">
            {universityName || 'OFFICE OF ACADEMIC AFFAIRS'}
          </h4>
          <p className="font-sans text-[9px] md:text-[10px] text-secondary tracking-wider uppercase opacity-85">
            In cooperation with Partnered Industry Corporations
          </p>
        </div>

        <div className="space-y-2 md:space-y-3">
          <h1 className="font-serif italic text-2xl md:text-3xl lg:text-4xl font-extrabold text-starlight-white tracking-wide uppercase">
            {certTitle}
          </h1>
          <div className="flex justify-center items-center gap-3">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-secondary opacity-50" />
            <p className="font-mono text-[9px] md:text-[10px] text-secondary uppercase tracking-[0.15em]">
              This document is proudly presented to
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-secondary opacity-50" />
          </div>
        </div>

        <div className="space-y-1 md:space-y-2">
          <h2 className="font-serif italic text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-wide" style={{ color: theme.accent }}>
            {certStudent.firstName} {certStudent.middleName ? `${certStudent.middleName} ` : ''}{certStudent.lastName}
          </h2>
          <p className="font-mono text-[10px] md:text-xs text-secondary tracking-wider">
            Student ID: <span className="text-starlight-white font-semibold">{certStudent.studentId}</span> &bull; Course: <span className="text-starlight-white font-semibold">{certStudent.course}</span> &bull; School: <span className="text-starlight-white font-semibold">{certStudent.school || certStudent.yearAndSection.replace('School: ', '')}</span>
          </p>
        </div>

        <div className="max-w-2xl px-4">
          <p className="font-sans text-xs md:text-sm text-secondary leading-relaxed">
            for successfully completing and fulfilling all requirements of the <span className="text-starlight-white font-semibold">On-the-Job Training (OJT)</span> program
            consisting of <span className="text-starlight-white font-bold underline" style={{ textDecorationColor: theme.accent }}>{certCustomHours || certStudent.hoursCompleted} Hours</span> of professional industry placement.
            The training was conducted at <span className="text-starlight-white font-semibold italic">{certStudent.office || getCompanyName(certStudent.moaId)}</span> {certStudent.address ? `located at ${certStudent.address}` : ''} under the
            cooperative terms of the active Memorandum of Agreement.
          </p>
        </div>

        <div className="w-full grid grid-cols-12 items-center gap-4 pt-4 md:pt-6">
          <div className="col-span-4 flex flex-col items-center">
            <span className="font-serif italic text-base md:text-lg text-primary select-none h-6 opacity-85" style={{ color: theme.accent, fontFamily: 'cursive' }}>
              {certSignatoryName.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
            </span>
            <div className="w-2/3 h-[1px] bg-glass-stroke/80 my-1" />
            <span className="font-sans text-[10px] font-bold text-starlight-white text-center">
              {certSignatoryName}
            </span>
            <span className="font-sans text-[8px] text-secondary text-center">
              {certSignatoryTitle}
            </span>
          </div>

          <div className="col-span-4 flex flex-col items-center justify-center">
            <div className={`w-14 h-14 rounded-full ${theme.seal} flex items-center justify-center shadow-lg relative border-4`}>
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-starlight-white/40 pointer-events-none" />
              <Award className="h-6 w-6 text-void-black font-extrabold" />
            </div>
            <span className="font-mono text-[8px] text-secondary tracking-widest uppercase mt-2">
              {certDate}
            </span>
          </div>

          <div className="col-span-4 flex flex-col items-center">
            <span className="font-serif italic text-base md:text-lg text-primary select-none h-6 opacity-85" style={{ color: theme.accent, fontFamily: 'cursive' }}>
              {certSecondarySignatoryName.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
            </span>
            <div className="w-2/3 h-[1px] bg-glass-stroke/80 my-1" />
            <span className="font-sans text-[10px] font-bold text-starlight-white text-center">
              {certSecondarySignatoryName}
            </span>
            <span className="font-sans text-[8px] text-secondary text-center">
              {certSecondarySignatoryTitle}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StudentDtrModalProps {
  selectedDtrStudent: OJTStudent;
  timeLogs: OJTTimeLog[];
  canApprove?: boolean;
  onApproveLog?: (id: string) => Promise<void>;
  onRejectLog?: (id: string, reason: string) => Promise<void>;
  onDeleteLog?: (id: string) => Promise<void>;
  onClose: () => void;
}

function StudentDtrModal({ selectedDtrStudent, timeLogs, canApprove, onApproveLog, onRejectLog, onDeleteLog, onClose }: StudentDtrModalProps) {
  const student = selectedDtrStudent;
  const targetHours = student.hoursRequired || 480;
  const completedHours = student.hoursCompleted || 0;
  const remaining = Math.max(0, targetHours - completedHours);
  
  const allStudentLogs = timeLogs
    .filter(l => l.studentId === student.id)
    .sort((a, b) => b.date.localeCompare(a.date));
    
  const approvedLogs = allStudentLogs.filter(l => l.status === 'Approved');
  const pendingLogs = allStudentLogs.filter(l => l.status === 'Pending');

  const avgDaily = approvedLogs.length > 0
    ? approvedLogs.reduce((sum, l) => sum + l.hoursRendered, 0) / approvedLogs.length
    : 8.0;

  const dailyPace = avgDaily > 0 ? avgDaily : 8.0;
  const workingDaysNeeded = Math.ceil(remaining / dailyPace);

  let date = new Date();
  let count = 0;
  while (count < workingDaysNeeded && workingDaysNeeded > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // Monday-Friday
      count++;
    }
  }

  const dateFormatted = remaining === 0
    ? 'Completed!'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-void-black/95 rounded-xl border border-glass-stroke shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in text-white">
        {/* Header */}
        <header className="p-6 border-b border-glass-stroke flex items-center justify-between bg-surface-container/30">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-starlight-white font-headline text-base md:text-lg truncate">
                Student DTR & Time Logs — {student.firstName} {student.lastName}
              </h3>
              <p className="text-xs text-secondary font-mono truncate">
                ID: {student.studentId} • {student.course} • {student.school || 'Pangasinan State University'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-secondary hover:text-starlight-white hover:bg-surface-container p-1.5 rounded transition-all cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="p-4 md:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-surface-container/40 p-3.5 rounded-lg border border-glass-stroke/50">
              <div className="text-[10px] font-mono uppercase tracking-wider text-secondary">Target Hours</div>
              <div className="text-lg md:text-xl font-bold font-mono text-starlight-white mt-0.5">{targetHours} hrs</div>
            </div>
            <div className="bg-surface-container/40 p-3.5 rounded-lg border border-glass-stroke/50">
              <div className="text-[10px] font-mono uppercase tracking-wider text-secondary">Hours Rendered</div>
              <div className="text-lg md:text-xl font-bold font-mono text-green-400 mt-0.5">{completedHours.toFixed(1)} hrs</div>
            </div>
            <div className="bg-surface-container/40 p-3.5 rounded-lg border border-glass-stroke/50">
              <div className="text-[10px] font-mono uppercase tracking-wider text-secondary">Remaining</div>
              <div className="text-lg md:text-xl font-bold font-mono text-amber-400 mt-0.5">{remaining.toFixed(1)} hrs</div>
            </div>
            <div className="bg-surface-container/40 p-3.5 rounded-lg border border-glass-stroke/50">
              <div className="text-[10px] font-mono uppercase tracking-wider text-secondary">Est. Completion</div>
              <div className="text-xs md:text-sm font-bold font-mono text-sky-400 mt-1 truncate" title={dateFormatted}>{dateFormatted}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-secondary">Overall Completion Progress</span>
              <span className="text-starlight-white font-bold">{Math.min(100, Math.round((completedHours / (targetHours || 1)) * 100))}%</span>
            </div>
            <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-glass-stroke/40">
              <div 
                className="h-full bg-gradient-to-r from-primary via-yellow-400 to-green-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((completedHours / (targetHours || 1)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Pending Logs Highlight Banner */}
          {pendingLogs.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs font-mono text-yellow-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-400 shrink-0" />
                <span>This intern has <strong>{pendingLogs.length} pending time log(s)</strong> awaiting review.</span>
              </div>
            </div>
          )}

          {/* Time Logs List */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-secondary">Daily Time Logs & Review</h4>
            
            {/* Desktop Table View */}
            <div className="hidden md:block border border-glass-stroke rounded-lg overflow-hidden bg-void-black/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-glass-stroke bg-surface-container/30 font-mono text-[10px] uppercase tracking-wider text-secondary">
                    <th className="p-3">Date</th>
                    <th className="p-3">Time In</th>
                    <th className="p-3">Time Out</th>
                    <th className="p-3">Break</th>
                    <th className="p-3">Hours</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3">Status</th>
                    {canApprove && <th className="p-3 text-right">Quick Review</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-stroke/30 font-sans">
                  {allStudentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={canApprove ? 8 : 7} className="p-6 text-center text-secondary font-mono italic">
                        No daily time logs recorded for this student yet.
                      </td>
                    </tr>
                  ) : (
                    allStudentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container-highest/20 transition-colors">
                        <td className="p-3 font-mono font-semibold text-starlight-white">{log.date}</td>
                        <td className="p-3 font-mono text-secondary">{log.timeIn}</td>
                        <td className="p-3 font-mono text-secondary">{log.timeOut}</td>
                        <td className="p-3 font-mono text-secondary">{log.breakMinutes}m</td>
                        <td className="p-3 font-mono font-bold text-green-400">{log.hoursRendered.toFixed(1)} hrs</td>
                        <td className="p-3 max-w-xs truncate font-mono text-secondary" title={log.notes || ''}>{log.notes || <span className="opacity-30 italic text-[10px]">No notes</span>}</td>
                        <td className="p-3">
                          {log.status === 'Approved' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30">APPROVED</span>
                          )}
                          {log.status === 'Pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">PENDING</span>
                          )}
                          {log.status === 'Rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30" title={log.rejectionReason}>REJECTED</span>
                          )}
                        </td>
                        {canApprove && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {log.status === 'Pending' && onApproveLog && onRejectLog && (
                                <>
                                  <button
                                    onClick={() => onApproveLog(log.id)}
                                    className="px-2.5 py-1 bg-green-600/90 hover:bg-green-500 text-white font-mono text-[10px] font-bold rounded transition-all cursor-pointer shadow-sm"
                                  >
                                    APPROVE
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt('Enter rejection reason:');
                                      if (reason) onRejectLog(log.id, reason);
                                    }}
                                    className="px-2.5 py-1 bg-red-600/90 hover:bg-red-500 text-white font-mono text-[10px] font-bold rounded transition-all cursor-pointer shadow-sm"
                                  >
                                    REJECT
                                  </button>
                                </>
                              )}
                              {onDeleteLog && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete time log for ${student.firstName} ${student.lastName} on ${log.date}?`)) {
                                      onDeleteLog(log.id);
                                    }
                                  }}
                                  className="p-1 text-secondary hover:text-red-400 hover:bg-surface-container rounded transition-colors cursor-pointer"
                                  title="Delete Log"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-3">
              {allStudentLogs.length === 0 ? (
                <div className="p-6 text-center text-secondary font-mono text-xs italic bg-surface-container/20 rounded-lg">
                  No daily time logs recorded for this student yet.
                </div>
              ) : (
                allStudentLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-surface-container/40 border border-glass-stroke/60 rounded-xl space-y-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between border-b border-glass-stroke/30 pb-2">
                      <span className="font-bold text-starlight-white">{log.date}</span>
                      {log.status === 'Approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30">APPROVED</span>
                      )}
                      {log.status === 'Pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">PENDING</span>
                      )}
                      {log.status === 'Rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">REJECTED</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-secondary text-[9px] block">Shift</span>
                        <span className="text-starlight-white">{log.timeIn} – {log.timeOut}</span>
                      </div>
                      <div>
                        <span className="text-secondary text-[9px] block">Rendered Hours</span>
                        <span className="text-green-400 font-bold">{log.hoursRendered.toFixed(1)} hrs</span>
                      </div>
                    </div>

                    {log.notes && (
                      <p className="text-[11px] text-secondary italic border-t border-glass-stroke/20 pt-1.5">"{log.notes}"</p>
                    )}

                    {canApprove && (
                      <div className="flex gap-2 pt-2 border-t border-glass-stroke/30">
                        {log.status === 'Pending' && onApproveLog && onRejectLog && (
                          <>
                            <button
                              onClick={() => onApproveLog(log.id)}
                              className="flex-1 py-2 bg-transparent border border-green-500 text-green-400 hover:bg-green-500/10 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer text-center active:scale-95"
                            >
                              APPROVE
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) onRejectLog(log.id, reason);
                              }}
                              className="flex-1 py-2 bg-transparent border border-red-500 text-red-400 hover:bg-red-500/10 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer text-center active:scale-95"
                            >
                              REJECT
                            </button>
                          </>
                        )}
                        {onDeleteLog && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete time log for ${student.firstName} ${student.lastName} on ${log.date}?`)) {
                                onDeleteLog(log.id);
                              }
                            }}
                            className="px-3 py-2 bg-surface-container hover:bg-red-500/20 border border-glass-stroke text-red-400 font-mono text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                            title="Delete Log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUserSession] = useState<UserSession | null>(getCurrentUser());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    const saved = localStorage.getItem('moa_lo_theme');
    return (!saved || saved === 'coral') ? 'steel' : saved;
  });

  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('moa_lo_mode') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('moa_lo_mode', 'light');
    } else {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('moa_lo_mode', 'dark');
    }
  }, [isLightMode]);

  useEffect(() => {
    const selectedTheme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
    const root = document.documentElement;
    root.style.setProperty('--primary', selectedTheme.primary);
    root.style.setProperty('--primary-container', selectedTheme.primaryContainer);
    root.style.setProperty('--outline', selectedTheme.outline);
    root.style.setProperty('--outline-variant', selectedTheme.outlineVariant);
    root.style.setProperty('--accent-glow', selectedTheme.glow);
    localStorage.setItem('moa_lo_theme', currentThemeId);
  }, [currentThemeId]);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'moa' | 'lo' | 'students' | 'settings' | 'audit_logs' | 'organizations' | 'ojt-tracker'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [students, setStudents] = useState<OJTStudent[]>([]);
  const [organizations, setOrganizations] = useState<PartnerOrganization[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMOA: 0, activeMOA: 0, expiredMOA: 0, archivedMOA: 0,
    totalLO: 0, issuedLO: 0, archivedLO: 0, pendingSync: 0,
    totalOrganizations: 0, activeStudents: 0
  });

  // Notification State & Rule Evaluator Engine
  const [notifications, setNotifications] = useState<OJTNotification[]>(() => getStoredNotifications());

  // Evaluate OJT notifications whenever students or records load/update
  useEffect(() => {
    if (students.length > 0 || records.length > 0) {
      const evaluated = defaultNotificationEngine.evaluateAll(students, records, notifications);
      setNotifications(evaluated);
      saveStoredNotifications(evaluated);
    }
  }, [students, records]);

  const handleNotificationClick = (notif: OJTNotification) => {
    const updated: OJTNotification[] = notifications.map(n => n.id === notif.id ? { ...n, state: 'Read' } : n);
    setNotifications(updated);
    saveStoredNotifications(updated);

    if (notif.actionPayload?.tab === 'students') {
      setCurrentTab('students');
      setStudentSubTab('roster');
      setSearchQuery('');
      setStatusFilter('All');
      const targetStudent = students.find(s => s.id === notif.actionPayload?.studentId);
      if (targetStudent) {
        openStudentModal(targetStudent);
      }
    }
  };

  const handleMarkAllNotificationsRead = () => {
    const updated: OJTNotification[] = notifications.map(n => ({ ...n, state: 'Read' }));
    setNotifications(updated);
    saveStoredNotifications(updated);
    toast.success('All notifications marked as read.');
  };

  const handleToggleNotificationRead = (id: string) => {
    const updated: OJTNotification[] = notifications.map(n => n.id === id ? { ...n, state: n.state === 'Unread' ? 'Read' : 'Unread' } : n);
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isContractDetailModalOpen, setIsContractDetailModalOpen] = useState(false);
  
  // Organization field bindings
  const [formOrgId, setFormOrgId] = useState('');
  const [studOrgId, setStudOrgId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Login Form State
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Quick Attendance Log State
  const [attendNameQuery, setAttendNameQuery] = useState('');
  const [attendNameResults, setAttendNameResults] = useState<any[]>([]);
  const [attendStudent, setAttendStudent] = useState<any>(null);
  const [attendStudentNotFound, setAttendStudentNotFound] = useState(false);
  const [attendTimeIn, setAttendTimeIn] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [attendTimeOut, setAttendTimeOut] = useState('');
  const [attendBreak, setAttendBreak] = useState('60');
  const [attendNotes, setAttendNotes] = useState('');
  const [isAttendLoading, setIsAttendLoading] = useState(false);
  const [attendSuccess, setAttendSuccess] = useState(false);
  const [attendError, setAttendError] = useState('');
  const [showProfileRequest, setShowProfileRequest] = useState(false);
  const [profileRequestName, setProfileRequestName] = useState('');
  const [profileRequestEmail, setProfileRequestEmail] = useState('');
  const [profileRequestSchool, setProfileRequestSchool] = useState('');
  const [profileRequestSent, setProfileRequestSent] = useState(false);
  const [activeLoginTab, setActiveLoginTab] = useState<'login' | 'attendance'>('login');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [degreeFilter, setDegreeFilter] = useState('All');
  const [hoursFilter, setHoursFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Pagination & Performance Buffer State
  const [studentPage, setStudentPage] = useState(1);
  const [isTabBufferLoading, setIsTabBufferLoading] = useState(false);
  const STUDENTS_PER_PAGE = 9;

  // Modals / Editors State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [recordType, setRecordType] = useState<'MOA' | 'LO'>('MOA');

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<OJTStudent | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRawText, setImportRawText] = useState('');

  // Time Logs & Student DTR Modal State
  const [timeLogs, setTimeLogs] = useState<OJTTimeLog[]>([]);
  const [selectedDtrStudent, setSelectedDtrStudent] = useState<OJTStudent | null>(null);
  const [isStudentDtrModalOpen, setIsStudentDtrModalOpen] = useState<boolean>(false);

  // Preview & Printing State
  const [previewRecord, setPreviewRecord] = useState<RecordItem | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Form State - Records
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formExpDate, setFormExpDate] = useState('');
  const [formIsIndefinite, setFormIsIndefinite] = useState(false);
  const [formParties, setFormParties] = useState('');
  const [formSignatories, setFormSignatories] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formReqBy, setFormReqBy] = useState('');
  const [formReqDate, setFormReqDate] = useState('');
  const [formQuery, setFormQuery] = useState('');
  const [formConclusion, setFormConclusion] = useState('');
  const [formCounsel, setFormCounsel] = useState('');
  const [formReferences, setFormReferences] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAttachments, setFormAttachments] = useState<Attachment[]>([]);

  // Form State - Customized MOA
  const [formSchool, setFormSchool] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formWorkflowStage, setFormWorkflowStage] = useState('For Review');
  const [formStudentIds, setFormStudentIds] = useState<string[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Quick Add Student State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showQuickAddStudent, setShowQuickAddStudent] = useState(false);
  const [quickFirst, setQuickFirst] = useState('');
  const [quickLast, setQuickLast] = useState('');
  const [quickCourse, setQuickCourse] = useState('');
  const [quickSchool, setQuickSchool] = useState('');

  // Autocomplete suggestions state loaded from localStorage
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>(() => {
    const saved = localStorage.getItem('moa_school_suggestions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      "Pangasinan State University - Lingayen Campus",
      "University of Luzon",
      "Saint Louis University",
      "Pangasinan National High School"
    ];
  });

  const [courseSuggestions, setCourseSuggestions] = useState<string[]>(() => {
    const saved = localStorage.getItem('moa_course_suggestions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      "BS Computer Science",
      "BS Information Technology",
      "BS Business Administration",
      "Associate in Computer Technology"
    ];
  });

  const saveSchoolSuggestion = (school: string) => {
    if (!school || !school.trim()) return;
    const trimmed = school.trim();
    if (!schoolSuggestions.includes(trimmed)) {
      const updated = [trimmed, ...schoolSuggestions];
      setSchoolSuggestions(updated);
      localStorage.setItem('moa_school_suggestions', JSON.stringify(updated));
    }
  };

  const removeSchoolSuggestion = (school: string) => {
    const updated = schoolSuggestions.filter(s => s !== school);
    setSchoolSuggestions(updated);
    localStorage.setItem('moa_school_suggestions', JSON.stringify(updated));
  };

  const saveCourseSuggestion = (course: string) => {
    if (!course || !course.trim()) return;
    const trimmed = course.trim();
    if (!courseSuggestions.includes(trimmed)) {
      const updated = [trimmed, ...courseSuggestions];
      setCourseSuggestions(updated);
      localStorage.setItem('moa_course_suggestions', JSON.stringify(updated));
    }
  };

  const removeCourseSuggestion = (course: string) => {
    const updated = courseSuggestions.filter(c => c !== course);
    setCourseSuggestions(updated);
    localStorage.setItem('moa_course_suggestions', JSON.stringify(updated));
  };

  // Form State - Students
  const [studId, setStudId] = useState('');
  const [studFirst, setStudFirst] = useState('');
  const [studMiddleName, setStudMiddleName] = useState('');
  const [studLast, setStudLast] = useState('');
  const [studEmail, setStudEmail] = useState('');
  const [studCourse, setStudCourse] = useState('');
  const [studSchool, setStudSchool] = useState('');
  const [studOffice, setStudOffice] = useState('');
  const [studAddress, setStudAddress] = useState('');
  const [studSection, setStudSection] = useState('');
  const [studMoaId, setStudMoaId] = useState('');
  const [studReqHours, setStudReqHours] = useState(480);
  const [studCompHours, setStudCompHours] = useState(0);
  const [studStatus, setStudStatus] = useState<'Not Started' | 'On-going' | 'Completed' | 'Suspended'>('On-going');
  const [studStart, setStudStart] = useState('');
  const [studEnd, setStudEnd] = useState('');
  const [studLegacyHours, setStudLegacyHours] = useState<string>('');

  // Certificate Generation State
  const [studentSubTab, setStudentSubTab] = useState<'roster' | 'certificates'>('roster');
  const [selectedCertStudentId, setSelectedCertStudentId] = useState<string>('');
  const [selectedCertStudent2Id, setSelectedCertStudent2Id] = useState<string>('');
  const [certTemplateMode, setCertTemplateMode] = useState<'portrait_2in1' | 'landscape_card'>('portrait_2in1');
  const [certGivenDay, setCertGivenDay] = useState<string>(() => getDayOrdinal(new Date().getDate()));
  const [certGivenMonthYear, setCertGivenMonthYear] = useState<string>(() => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  const [certCustomOffice, setCertCustomOffice] = useState('');
  const [certCustomHours1, setCertCustomHours1] = useState('');
  const [certCustomHours2, setCertCustomHours2] = useState('');
  const [certCustomDates1, setCertCustomDates1] = useState('');
  const [certCustomDates2, setCertCustomDates2] = useState('');
  const [certDateFrom1, setCertDateFrom1] = useState('February 3, 2025');
  const [certDateTo1, setCertDateTo1] = useState('April 15, 2025');
  const [certDateFrom2, setCertDateFrom2] = useState('February 3, 2025');
  const [certDateTo2, setCertDateTo2] = useState('April 15, 2025');
  const [certTitle, setCertTitle] = useState('CERTIFICATE OF COMPLETION');
  const [certSignatoryName, setCertSignatoryName] = useState('DR. EVANGELINE P. BAUTISTA');
  const [certSignatoryTitle, setCertSignatoryTitle] = useState('Dean, College of Computer Studies');
  const [certSecondarySignatoryName, setCertSecondarySignatoryName] = useState('PROF. REINALD M. PUNO');
  const [certSecondarySignatoryTitle, setCertSecondarySignatoryTitle] = useState('OJT Roster Coordinator');
  const [certDate, setCertDate] = useState(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
  const [certStyle, setCertStyle] = useState<'gold' | 'blue' | 'emerald' | 'ruby'>('gold');
  const [certCustomHours, setCertCustomHours] = useState('');

  // Certificate Search Picker Modal State
  const [isCertPickerOpen, setIsCertPickerOpen] = useState(false);
  const [certPickerSlot, setCertPickerSlot] = useState<'student1' | 'student2'>('student1');

  const openPickerFor = (slot: 'student1' | 'student2') => {
    setCertPickerSlot(slot);
    setIsCertPickerOpen(true);
  };

  const handleSelectCertStudent = (student: OJTStudent) => {
    if (certPickerSlot === 'student1') {
      setSelectedCertStudentId(student.id);
      setCertCustomHours1((student.hoursCompleted || student.hoursRequired || 400).toString());
      setCertCustomHours((student.hoursCompleted || student.hoursRequired || 400).toString());
      if (student.office) setCertCustomOffice(student.office);
      if (student.startDate) setCertDateFrom1(formatCertDate(student.startDate));
      if (student.endDate) setCertDateTo1(formatCertDate(student.endDate));
      toast.success(`Selected ${student.lastName}, ${student.firstName} for Top Certificate`);
    } else {
      setSelectedCertStudent2Id(student.id);
      setCertCustomHours2((student.hoursCompleted || student.hoursRequired || 400).toString());
      if (student.startDate) {
        setCertDateFrom2(formatCertDate(student.startDate));
      } else if (certDateFrom1) {
        setCertDateFrom2(certDateFrom1);
      }
      if (student.endDate) {
        setCertDateTo2(formatCertDate(student.endDate));
      } else if (certDateTo1) {
        setCertDateTo2(certDateTo1);
      }
      toast.success(`Selected ${student.lastName}, ${student.firstName} for Bottom Certificate`);
    }
  };

  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadDatabase();
    }
  }, [currentUser]);

  const loadDatabase = async () => {
    setIsLoading(true);
    try {
      // Fetch centralized server configurations
      const serverSettings = await fetchSettingsFromServer();
      setSettings(serverSettings);

      const recs = await getRecords();
      const studs = await getStudents();
      const orgs = await getOrganizations().catch(() => []);
      const logsData = await getTimeLogs().catch(() => []);
      const currentStats = await getStats();
      setRecords(recs);
      setStudents(studs);
      setOrganizations(orgs);
      setTimeLogs(logsData);
      setStats({
        ...currentStats,
        totalOrganizations: orgs.length,
        activeStudents: studs.filter(s => s.status === 'On-going').length
      });

      // Load logs if Administrator
      if (currentUser?.role === 'Administrator') {
        const logs = await getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (e) {
      toast.error('Failed to communicate with central host database.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      toast.error('Please enter both username and password.');
      return;
    }
    setIsLoggingIn(true);
    try {
      const user = await login(usernameInput, passwordInput);
      setCurrentUserSession(user);
      
      // Determine default starting tab based on role permissions
      if (user.role === 'OJT Coordinator') {
        setCurrentTab('students');
      } else if (user.role === 'Legal Team') {
        setCurrentTab('moa');
      } else {
        setCurrentTab('dashboard');
      }

      toast.success(`Welcome back, ${user.name}!`);
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentUserSession(null);
    toast.success('Logged out from central network session.');
  };

  const handleAttendNameSearch = async () => {
    if (!attendNameQuery.trim()) return;
    setIsAttendLoading(true);
    setAttendStudentNotFound(false);
    setAttendStudent(null);
    setAttendError('');
    setAttendNameResults([]);
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to reach student database');
      const studs: any[] = await res.json();
      const q = attendNameQuery.trim().toLowerCase();
      const matches = studs.filter(s => {
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        return fullName.includes(q);
      });
      if (matches.length === 1) {
        setAttendStudent(matches[0]);
      } else if (matches.length > 1) {
        setAttendNameResults(matches);
      } else {
        setAttendStudentNotFound(true);
        setShowProfileRequest(false);
      }
    } catch {
      setAttendError('Could not connect to student database.');
    } finally {
      setIsAttendLoading(false);
    }
  };

  const handleAttendLog = async () => {
    if (!attendStudent || !attendTimeIn || !attendTimeOut) return;
    setIsAttendLoading(true);
    setAttendError('');
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const inH = parseInt(attendTimeIn.split(':')[0]), inM = parseInt(attendTimeIn.split(':')[1]);
      const outH = parseInt(attendTimeOut.split(':')[0]), outM = parseInt(attendTimeOut.split(':')[1]);
      const totalMin = (outH * 60 + outM) - (inH * 60 + inM) - (Number(attendBreak) || 0);
      const hours = Math.round((totalMin / 60) * 100) / 100;
      if (hours <= 0) { setAttendError('Time Out must be after Time In (minus break).'); setIsAttendLoading(false); return; }
      const logRes = await fetch('/api/time-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log: {
            studentId: attendStudent.id,
            date: dateStr,
            timeIn: attendTimeIn,
            timeOut: attendTimeOut,
            breakMinutes: Number(attendBreak) || 0,
            hoursRendered: hours,
            notes: attendNotes.trim() || undefined,
            status: 'Pending',
            source: 'kiosk'
          },
          user: { name: `${attendStudent.firstName} ${attendStudent.lastName}`, role: 'Student' }
        })
      });
      if (!logRes.ok) {
        const err = await logRes.json().catch(() => ({ error: 'Failed to log attendance' }));
        throw new Error(err.error || 'Failed to log attendance');
      }
      setAttendSuccess(true);
      setAttendStudent(null);
      setAttendTimeOut('');
      setAttendNotes('');
      setTimeout(() => setAttendSuccess(false), 5000);
    } catch (err: any) {
      setAttendError(err.message || 'Failed to submit attendance log.');
    } finally {
      setIsAttendLoading(false);
    }
  };

  const handleProfileRequest = async () => {
    if (!profileRequestName.trim()) return;
    setIsAttendLoading(true);
    try {
      const stored = localStorage.getItem('moa_lo_notifications');
      const storedNotifs: any[] = stored ? JSON.parse(stored) : [];
      const newNotif = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        hashKey: `profile-req-${Date.now()}`,
        type: 'PROFILE_REQUEST' as const,
        state: 'Unread' as const,
        title: 'New Student Profile Request',
        message: `${profileRequestName.trim()} has requested a student profile creation. Email: ${profileRequestEmail || 'N/A'}, School: ${profileRequestSchool || 'N/A'}.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      storedNotifs.unshift(newNotif);
      localStorage.setItem('moa_lo_notifications', JSON.stringify(storedNotifs));
      setNotifications(storedNotifs);
      setProfileRequestSent(true);
      setProfileRequestName('');
      setProfileRequestEmail('');
      setProfileRequestSchool('');
    } catch {
      setAttendError('Failed to send profile request.');
    } finally {
      setIsAttendLoading(false);
    }
  };

  const refreshStats = async (updatedRecs = records) => {
    const moas = updatedRecs.filter(r => r.type === 'MOA');
    const los = updatedRecs.filter(r => r.type === 'LO');
    setStats({
      totalMOA: moas.length,
      activeMOA: moas.filter(r => r.status === 'Active' || r.status === 'Renewed').length,
      expiredMOA: moas.filter(r => r.status === 'Expired' || r.status === 'Terminated').length,
      archivedMOA: moas.filter(r => r.status === 'Archived').length,
      totalLO: los.length,
      issuedLO: los.filter(r => r.status === 'Issued').length,
      archivedLO: los.filter(r => r.status === 'Archived').length,
      pendingSync: updatedRecs.filter(r => r.syncStatus === 'local' || r.syncStatus === 'pending_sync').length,
      totalOrganizations: organizations.length,
      activeStudents: students.filter(s => s.status === 'On-going').length
    });
  };

  // Sync stub
  const handleSync = async () => {
    setIsSyncing(true);
    toast.info('Refreshing local data...');
    try {
      const updatedRecs = await getRecords();
      setRecords(updatedRecs);
      await refreshStats(updatedRecs);
      toast.success('Data refreshed from server.');
    } catch (e) {
      toast.error('Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Record Form Actions
  const openRecordModal = (record: RecordItem | null = null, type: 'MOA' | 'LO' = 'MOA') => {
    setEditingRecord(record);
    setRecordType(type);
    if (record) {
      setFormTitle(record.title);
      setFormDesc(record.description || '');
      setFormStatus(record.status);
      setFormIssueDate(record.issueDate || '');
      setFormExpDate(record.expirationDate || '');
      setFormIsIndefinite(!!record.isIndefinite);
      setFormParties(record.parties?.join(', ') || '');
      setFormSignatories(record.signatories?.join(', ') || '');
      setFormCategory(record.category || '');
      setFormDept(record.department || '');
      setFormReqBy(record.requestedBy || '');
      setFormReqDate(record.requestDate || '');
      setFormQuery(record.queryText || '');
      setFormConclusion(record.conclusion || '');
      setFormCounsel(record.assignedCounsel || '');
      setFormReferences(record.references?.join(', ') || '');
      setFormNotes(record.notes || '');
      setFormAttachments(record.attachments || []);
      setFormOrgId(record.organizationId || '');
      // Custom MOA fields
      setFormSchool(record.school || '');
      setFormCourse(record.course || '');
      setFormHours(record.hours ? String(record.hours) : '');
      setFormWorkflowStage(record.workflowStage || 'Approved');
      setFormStudentIds(record.studentIds || []);
    } else {
      setFormTitle('');
      setFormDesc('');
      setFormStatus(type === 'MOA' ? 'Active' : 'Issued');
      setFormIssueDate('');
      setFormExpDate('');
      setFormIsIndefinite(false);
      setFormParties('');
      setFormSignatories('');
      setFormCategory('Internship & OJT');
      setFormDept('');
      setFormReqBy('');
      setFormReqDate('');
      setFormQuery('');
      setFormConclusion('');
      setFormCounsel('');
      setFormReferences('');
      setFormNotes('');
      setFormAttachments([]);
      setFormOrgId('');
      // Custom MOA fields
      setFormSchool('');
      setFormCourse('');
      setFormHours('');
      setFormWorkflowStage('Approved');
      setFormStudentIds([]);
    }
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recordType === 'MOA') {
      if (!formSchool || !formCourse || !formHours || !formIssueDate) {
        toast.error('School/University, Course, Hours, and Date Received are required.');
        return;
      }
    } else {
      if (!formTitle) {
        toast.error('Title is required.');
        return;
      }
    }

    const itemData: any = {
      type: recordType,
      notes: formNotes || undefined,
      attachments: formAttachments,
      organizationId: formOrgId || undefined
    };

    if (recordType === 'MOA') {
      itemData.title = `${formSchool} - ${formCourse} MOA`;
      itemData.description = `Memorandum of Agreement with ${formSchool} for ${formCourse} (${formHours} Hours) - Stage: ${formWorkflowStage}`;
      itemData.status = formStatus;
      itemData.issueDate = formIssueDate || undefined;
      itemData.school = formSchool;
      itemData.course = formCourse;
      itemData.hours = Number(formHours);
      itemData.workflowStage = formWorkflowStage;
      itemData.studentIds = formStudentIds;
      itemData.parties = [formSchool, settings.universityName];
      itemData.category = 'Internship & OJT';

      // Save to autocomplete suggestion list
      saveSchoolSuggestion(formSchool);
      saveCourseSuggestion(formCourse);
    } else {
      itemData.title = formTitle;
      itemData.description = formDesc;
      itemData.status = formStatus;
      itemData.issueDate = formIssueDate || undefined;
      itemData.requestedBy = formReqBy;
      itemData.requestDate = formReqDate || undefined;
      itemData.queryText = formQuery;
      itemData.conclusion = formConclusion;
      itemData.assignedCounsel = formCounsel;
      itemData.references = formReferences.split(',').map(s => s.trim()).filter(Boolean);
    }

    try {
      let savedRecord: RecordItem;
      if (editingRecord) {
        savedRecord = await updateRecord(editingRecord.id, itemData);
        const updatedRecs = records.map(r => r.id === editingRecord.id ? savedRecord : r);
        setRecords(updatedRecs);
        refreshStats(updatedRecs);
        toast.success('Record updated successfully.');
      } else {
        savedRecord = await createRecord(itemData);
        const updatedRecs = [savedRecord, ...records];
        setRecords(updatedRecs);
        refreshStats(updatedRecs);
        toast.success('Record created successfully.');
      }

      // Sync student associations:
      const currentMoaId = savedRecord.id;
      const updatedStudents = await Promise.all(
        students.map(async (student) => {
          const isSelected = formStudentIds.includes(student.studentId) || formStudentIds.includes(student.id);
          const wasAssigned = student.moaId === currentMoaId;

          if (isSelected && !wasAssigned) {
            return await updateStudent(student.id, { moaId: currentMoaId });
          } else if (!isSelected && wasAssigned) {
            return await updateStudent(student.id, { moaId: '' });
          }
          return student;
        })
      );
      setStudents(updatedStudents);

      setIsRecordModalOpen(false);
    } catch (e) {
      toast.error('Failed to save record.');
    }
  };

  const handleQuickAddStudent = async () => {
    if (!quickFirst.trim() || !quickLast.trim()) {
      toast.error('First Name and Last Name are required.');
      return;
    }

    const selectedSchool = quickSchool.trim() || formSchool || 'Pangasinan State University - Lingayen Campus';

    const genStudentId = `STU-${Date.now().toString().slice(-6)}`;
    const newStudentData = {
      studentId: genStudentId,
      firstName: quickFirst.trim(),
      middleName: '',
      lastName: quickLast.trim(),
      email: '',
      course: quickCourse.trim() || formCourse || 'BS Computer Science',
      school: selectedSchool,
      office: '',
      address: '',
      yearAndSection: `School: ${selectedSchool}`,
      moaId: editingRecord ? editingRecord.id : '',
      hoursRequired: Number(formHours) || 480,
      hoursCompleted: 0,
      status: 'On-going' as const
    };

    try {
      const created = await createStudent(newStudentData);
      setStudents(prev => [created, ...prev]);
      setFormStudentIds(prev => [...prev, created.id]);
      toast.success(`Student ${quickFirst} ${quickLast} enrolled and linked successfully.`);
      
      // Reset inputs
      setQuickFirst('');
      setQuickLast('');
      setQuickSchool('');
      setShowQuickAddStudent(false);
    } catch (e) {
      toast.error('Failed to quick add student.');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteRecord(id);
        const updatedRecs = records.filter(r => r.id !== id);
        setRecords(updatedRecs);
        refreshStats(updatedRecs);
        toast.success('Record deleted.');
      } catch (e) {
        toast.error('Deletion failed.');
      }
    }
  };

  // Time Logs Actions
  const handleAddTimeLog = async (logData: Omit<OJTTimeLog, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res: any = await createTimeLog(logData);
    const newLog = res.log || res;
    setTimeLogs(prev => [newLog, ...prev]);
    if (res.updatedStudent) {
      const updatedS = res.updatedStudent;
      setStudents(prev => prev.map(s => s.id === updatedS.id ? updatedS : s));
      if (selectedDtrStudent && selectedDtrStudent.id === updatedS.id) {
        setSelectedDtrStudent(updatedS);
      }
    }
  };

  const handleUpdateTimeLog = async (id: string, updates: Partial<OJTTimeLog>) => {
    const res = await updateTimeLog(id, updates);
    setTimeLogs(prev => prev.map(l => l.id === id ? res.log : l));
    if (res.updatedStudent) {
      const updatedS = res.updatedStudent;
      setStudents(prev => prev.map(s => s.id === updatedS.id ? updatedS : s));
      if (selectedDtrStudent && selectedDtrStudent.id === updatedS.id) {
        setSelectedDtrStudent(updatedS);
      }
    }
  };

  const handleApproveTimeLog = async (id: string) => {
    const res = await approveTimeLog(id);
    setTimeLogs(prev => prev.map(l => l.id === id ? res.log : l));
    if (res.updatedStudent) {
      const updatedS = res.updatedStudent;
      setStudents(prev => prev.map(s => s.id === updatedS.id ? updatedS : s));
      if (selectedDtrStudent && selectedDtrStudent.id === updatedS.id) {
        setSelectedDtrStudent(updatedS);
      }
    }
  };

  const handleRejectTimeLog = async (id: string, reason: string) => {
    const res = await rejectTimeLog(id, reason);
    setTimeLogs(prev => prev.map(l => l.id === id ? res.log : l));
    if (res.updatedStudent) {
      const updatedS = res.updatedStudent;
      setStudents(prev => prev.map(s => s.id === updatedS.id ? updatedS : s));
      if (selectedDtrStudent && selectedDtrStudent.id === updatedS.id) {
        setSelectedDtrStudent(updatedS);
      }
    }
  };

  const handleDeleteTimeLog = async (id: string) => {
    try {
      const res = await deleteTimeLog(id, currentUser);
      setTimeLogs(prev => prev.filter(l => l.id !== id));
      if (res.updatedStudent) {
        const updatedS = res.updatedStudent;
        setStudents(prev => prev.map(s => s.id === updatedS.id ? updatedS : s));
        if (selectedDtrStudent && selectedDtrStudent.id === updatedS.id) {
          setSelectedDtrStudent(updatedS);
        }
      }
      toast.success('Time log deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete time log:', err);
      toast.error(err.message || 'Failed to delete time log');
      throw err;
    }
  };

  const handleBulkApproveTimeLogs = async (ids: string[]) => {
    const res = await bulkApproveTimeLogs(ids);
    const approvedIdsSet = new Set(ids);
    setTimeLogs(prev => prev.map(l => approvedIdsSet.has(l.id) && l.status === 'Pending' ? { ...l, status: 'Approved', reviewedBy: currentUser?.name || 'System' } : l));
    if (res.updatedStudents && res.updatedStudents.length > 0) {
      const studentMap = new Map(res.updatedStudents.map(s => [s.id, s]));
      setStudents(prev => prev.map(s => studentMap.get(s.id) || s));
      if (selectedDtrStudent && studentMap.has(selectedDtrStudent.id)) {
        setSelectedDtrStudent(studentMap.get(selectedDtrStudent.id)!);
      }
    }
  };

  const handleBulkAddLogs = async (
    logs: Omit<OJTTimeLog, 'id' | 'createdAt' | 'updatedAt' | 'status'>[],
    replaceExisting: boolean
  ) => {
    const res = await createTimeLogsBulk(logs, replaceExisting);
    
    // Fetch fresh lists to update dashboard and progress states
    const allLogs = await getTimeLogs();
    setTimeLogs(allLogs);

    const allStudents = await getStudents();
    setStudents(allStudents);

    if (selectedDtrStudent) {
      const freshStud = allStudents.find(s => s.id === selectedDtrStudent.id);
      if (freshStud) {
        setSelectedDtrStudent(freshStud);
      }
    }

    return res;
  };

  const handleRefreshHourTracker = async () => {
    const [allLogs, allStudents] = await Promise.all([
      getTimeLogs().catch(() => []),
      getStudents().catch(() => [])
    ]);
    setTimeLogs(allLogs);
    setStudents(allStudents);

    if (selectedDtrStudent) {
      const freshStud = allStudents.find(s => s.id === selectedDtrStudent.id);
      if (freshStud) {
        setSelectedDtrStudent(freshStud);
      }
    }
  };

  // Student Form Actions
  const openStudentModal = (student: OJTStudent | null = null) => {
    setEditingStudent(student);
    if (student) {
      setStudId(student.studentId);
      setStudFirst(student.firstName);
      setStudMiddleName(student.middleName || '');
      setStudLast(student.lastName);
      setStudEmail(student.email);
      setStudCourse(student.course);
      setStudSchool(student.school || '');
      setStudOffice(student.office || '');
      setStudAddress(student.address || '');
      setStudSection(student.yearAndSection);
      setStudMoaId(student.moaId);
      setStudOrgId(student.organizationId || '');
      setStudReqHours(student.hoursRequired);
      setStudCompHours(student.hoursCompleted);
      setStudStatus(student.status);
      setStudStart(student.startDate || '');
      setStudEnd(student.endDate || '');
      setStudLegacyHours(student.legacyHours !== undefined && student.legacyHours !== null ? String(student.legacyHours) : '');
    } else {
      setStudId('');
      setStudFirst('');
      setStudMiddleName('');
      setStudLast('');
      setStudEmail('');
      setStudCourse('');
      setStudSchool('');
      setStudOffice('');
      setStudAddress('');
      setStudSection('');
      // Use the first active MOA as default if possible
      const firstMoa = records.find(r => r.type === 'MOA')?.id || '';
      setStudMoaId(firstMoa);
      setStudOrgId('');
      setStudReqHours(480);
      setStudCompHours(0);
      setStudStatus('On-going');
      setStudStart('');
      setStudEnd('');
      setStudLegacyHours('');
    }
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studFirst || !studLast || !studCourse || !studSchool || !studReqHours || !studStart || !studOffice) {
      toast.error('First Name, Last Name, Program/Course, School, OJT Hours, Start Date, and Office are required.');
      return;
    }

    const generatedId = `2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const studentId = editingStudent ? editingStudent.studentId : generatedId;

    const email = studEmail ? studEmail.trim() : '';

    const activeMOAs = records.filter(r => r.type === 'MOA');
    let matchedMoaId = activeMOAs[0]?.id || 'rec-moa-2026-0001';
    if (studOffice) {
      const matchedRecord = activeMOAs.find(r => 
        r.title.toLowerCase().includes(studOffice.toLowerCase()) || 
        r.parties?.some(p => p.toLowerCase().includes(studOffice.toLowerCase())) ||
        r.description?.toLowerCase().includes(studOffice.toLowerCase())
      );
      if (matchedRecord) {
        matchedMoaId = matchedRecord.id;
      }
    }

    const hasFinishDate = Boolean(studEnd && studEnd.trim());
    const hoursReq = Number(studReqHours);

    const studData = {
      studentId,
      firstName: formatProperName(studFirst),
      middleName: studMiddleName ? formatProperName(studMiddleName) : undefined,
      lastName: formatProperName(studLast),
      email,
      course: studCourse,
      school: studSchool,
      office: studOffice,
      address: studAddress,
      yearAndSection: `School: ${studSchool}`,
      moaId: matchedMoaId,
      organizationId: editingStudent?.organizationId,
      hoursRequired: hoursReq,
      hoursCompleted: hasFinishDate 
        ? (editingStudent ? Math.max(editingStudent.hoursCompleted, hoursReq) : hoursReq)
        : (editingStudent ? editingStudent.hoursCompleted : 0),
      status: (hasFinishDate 
        ? 'Completed' 
        : (editingStudent ? (editingStudent.status === 'Completed' && !studEnd ? 'On-going' : editingStudent.status) : 'On-going')) as 'Not Started' | 'On-going' | 'Completed' | 'Suspended',
      startDate: studStart || undefined,
      endDate: hasFinishDate ? studEnd.trim() : undefined,
      legacyHours: studLegacyHours !== '' ? Number(studLegacyHours) : (hasFinishDate ? hoursReq : undefined)
    };

    try {
      if (editingStudent) {
        const updated = await updateStudent(editingStudent.id, studData);
        setStudents(students.map(s => s.id === editingStudent.id ? updated : s));
        toast.success('Student record updated.');
      } else {
        const created = await createStudent(studData);
        setStudents([created, ...students]);
        toast.success('Student record created.');
      }
      setIsStudentModalOpen(false);
    } catch (e) {
      toast.error('Failed to save student.');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Are you sure you want to delete this student record?')) {
      try {
        await deleteStudent(id);
        setStudents(students.filter(s => s.id !== id));
        toast.success('Student record deleted.');
      } catch (e) {
        toast.error('Deletion failed.');
      }
    }
  };

  // Organization Actions
  const handleCreateOrg = async (orgData: Omit<PartnerOrganization, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const created = await createOrganization(orgData);
      setOrganizations([created, ...organizations]);
      setStats((prev: DashboardStats) => ({ ...prev, totalOrganizations: prev.totalOrganizations + 1 }));
      toast.success(`Partner organization "${created.name}" registered successfully.`);
    } catch (err) {
      toast.error('Failed to register partner organization.');
      throw err;
    }
  };

  const handleUpdateOrg = async (id: string, updates: Partial<Omit<PartnerOrganization, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updated = await updateOrganization(id, updates);
      setOrganizations(organizations.map(o => o.id === id ? updated : o));
      toast.success(`Partner organization profile updated.`);
    } catch (err) {
      toast.error('Failed to update organization profile.');
      throw err;
    }
  };

  const handleDeleteOrg = async (id: string) => {
    try {
      await deleteOrganization(id);
      setOrganizations(organizations.filter(o => o.id !== id));
      setStats((prev: DashboardStats) => ({ ...prev, totalOrganizations: Math.max(0, prev.totalOrganizations - 1) }));
      toast.success('Partner organization profile deleted.');
    } catch (err) {
      toast.error('Failed to delete partner organization.');
    }
  };

  const handleProcessImport = async () => {
    if (!importRawText.trim()) {
      toast.error('Please paste or upload some student data first.');
      return;
    }

    let parsedItems: any[] = [];
    const text = importRawText.trim();

    // 1. Try parsing as JSON
    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          parsedItems = parsed;
        } else if (parsed && Array.isArray(parsed.students)) {
          parsedItems = parsed.students;
        } else if (parsed && typeof parsed === 'object') {
          parsedItems = [parsed];
        }
      } catch (err) {
        // Fall back to CSV
      }
    }

    // 2. CSV parsing fallback
    if (parsedItems.length === 0) {
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/["']/g, '').trim());
        const isHeader = headers.some(h => 
          h.includes('name') || h.includes('id') || h.includes('course') || 
          h.includes('program') || h.includes('hours') || h.includes('email') ||
          h.includes('school') || h.includes('office') || h.includes('address')
        );

        const startIdx = isHeader ? 1 : 0;
        
        for (let i = startIdx; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length === 0 || values.join('').trim() === '') continue;

          const item: any = {};
          if (isHeader) {
            headers.forEach((header, idx) => {
              if (idx < values.length) {
                if (header.includes('first')) item.firstName = values[idx];
                else if (header.includes('last')) item.lastName = values[idx];
                else if (header.includes('middle')) item.middleInitial = values[idx];
                else if (header.includes('id')) item.studentId = values[idx];
                else if (header.includes('email')) item.email = values[idx];
                else if (header.includes('course') || header.includes('program')) item.program = values[idx];
                else if (header.includes('school') || header.includes('campus')) item.school = values[idx];
                else if (header.includes('hours') || header.includes('ojt')) item.ojtHours = values[idx];
                else if (header.includes('start')) item.startDate = values[idx];
                else if (header.includes('end')) item.endDate = values[idx];
                else if (header.includes('office')) item.office = values[idx];
                else if (header.includes('address')) item.address = values[idx];
                else item[header] = values[idx];
              }
            });
          } else {
            if (values.length >= 1) item.studentId = values[0];
            if (values.length >= 2) item.lastName = values[1];
            if (values.length >= 3) item.firstName = values[2];
            if (values.length >= 4) item.program = values[3];
            if (values.length >= 5) item.ojtHours = values[4];
            if (values.length >= 6) item.email = values[5];
          }
          parsedItems.push(item);
        }
      }
    }

    if (parsedItems.length === 0) {
      toast.error('Could not parse any student records. Check format.');
      return;
    }

    const activeMOAs = records.filter(r => r.type === 'MOA');
    const defaultMoaId = activeMOAs[0]?.id || 'rec-moa-2026-0001';

    const mappedStudents = parsedItems.map((item) => {
      let program = item.program || item.course || item.class || '';
      let school = item.school || item.campus || '';
      let ojtHoursStr = item.ojtHours || item.hoursRequired || item.hours || '';
      let startDate = item.startDate || item.start || '';
      let endDate = item.endDate || item.end || '';
      let office = item.office || '';
      let address = item.address || '';
      let lastName = item.lastName || '';
      let firstName = item.firstName || '';
      let middleInitial = item.middleInitial || '';
      let studentId = item.studentId || item.id || '';

      const cleanStr = (s: any) => typeof s === 'string' ? s.replace(/^["']|["']$/g, '').trim() : '';
      firstName = cleanStr(firstName);
      lastName = cleanStr(lastName);
      middleInitial = cleanStr(middleInitial);
      program = cleanStr(program);
      school = cleanStr(school);
      ojtHoursStr = cleanStr(ojtHoursStr);
      startDate = cleanStr(startDate);
      endDate = cleanStr(endDate);
      office = cleanStr(office);
      address = cleanStr(address);
      studentId = cleanStr(studentId);

      let hoursRequired = 480;
      let yearAndSection = '3-A';
      let email = item.email ? cleanStr(item.email) : '';

      // Check for the STEM split/shift error
      if (
        program.toLowerCase() === 'science' && 
        school.toLowerCase() === 'technology' && 
        ojtHoursStr.toLowerCase() === 'engineering' && 
        startDate.toLowerCase() === 'and mathematics'
      ) {
        program = "Science, Technology, Engineering, and Mathematics (STEM)";
        school = endDate;
        hoursRequired = parseInt(office, 10) || 80;
        startDate = address;
        endDate = ''; 
      } else {
        hoursRequired = parseInt(ojtHoursStr, 10) || 480;
      }

      if (!studentId) {
        studentId = `2023-${Math.floor(10000 + Math.random() * 90000)}`;
      }

      email = email || '';

      if (school) {
        yearAndSection = `School: ${school}`;
      }

      let matchedMoaId = defaultMoaId;
      if (office) {
        const matchedRecord = activeMOAs.find(r => 
          r.title.toLowerCase().includes(office.toLowerCase()) || 
          r.parties?.some(p => p.toLowerCase().includes(office.toLowerCase())) ||
          r.description?.toLowerCase().includes(office.toLowerCase())
        );
        if (matchedRecord) {
          matchedMoaId = matchedRecord.id;
        }
      }

      const formattedFirst = formatProperName(middleInitial ? `${firstName} ${middleInitial}.` : firstName);
      const formattedLast = formatProperName(lastName);

      return {
        studentId,
        firstName: formattedFirst,
        lastName: formattedLast,
        email,
        course: program || 'BS Computer Science',
        yearAndSection,
        moaId: matchedMoaId,
        office: office || item.office || item.department || undefined,
        address: address || item.address || undefined,
        hoursRequired,
        hoursCompleted: Number(item.hoursCompleted) || 0,
        status: (item.status as any) || 'On-going',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || undefined
      };
    });

    try {
      const updatedStudents = await createStudentsBulk(mappedStudents);
      setStudents(updatedStudents);
      toast.success(`Successfully imported ${mappedStudents.length} student records!`);
      setIsImportModalOpen(false);
      setImportRawText('');
    } catch (err) {
      toast.error('Failed to import student records.');
    }
  };

  // Attachment Handler (Base64 Binary Upload directly into IndexedDB)
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList) return;
    Array.from(filesList).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newAtt: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl: base64
        };
        setFormAttachments(prev => [...prev, newAtt]);
        toast.success(`Attached ${file.name} successfully.`);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (attId: string) => {
    setFormAttachments(prev => prev.filter(att => att.id !== attId));
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles) return;
    Array.from(droppedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newAtt: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          dataUrl: base64
        };
        setFormAttachments(prev => [...prev, newAtt]);
        toast.success(`Attached ${file.name} successfully.`);
      };
      reader.readAsDataURL(file);
    });
  };

  // Standard JSON Import & Export triggers (Browser compatible)
  const handleBackupExport = () => {
    try {
      const backupData = JSON.stringify({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        records,
        students,
        settings
      }, null, 2);
      
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moa_lo_database_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Database backup JSON exported successfully.');
    } catch (e) {
      toast.error('Failed to export backup.');
    }
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.records && !parsed.students) {
          throw new Error('Invalid backup file format');
        }

        const confirmed = confirm('Importing backup will merge with and overwrite your current central host database. Continue?');
        if (!confirmed) return;

        const mergedRecords = [...(parsed.records || [])];
        const mergedStudents = [...(parsed.students || [])];

        // Basic deduplication by ID
        const uniqueRecs = Array.from(new Map(
          [...records, ...mergedRecords].map(item => [item.id, item])
        ).values());

        const uniqueStuds = Array.from(new Map(
          [...students, ...mergedStudents].map(item => [item.id, item])
        ).values());

        await importBackup(uniqueRecs, uniqueStuds);
        
        await loadDatabase();
        toast.success(`Successfully imported ${mergedRecords.length} records and ${mergedStudents.length} students to central host!`);
      } catch (err) {
        toast.error('Failed to parse backup. Ensure it is a valid MOA/LO backup JSON.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleExcelExport = async () => {
    toast.info('Generating Excel workbook...');
    try {
      await exportToExcel(records);
      toast.success('Excel file exported!');
    } catch (e) {
      toast.error('Excel export failed.');
      console.error(e);
    }
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settings);
    toast.success('System settings saved successfully.');
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  // Helper to get company name from MOA ID
  const getCompanyName = (moaId?: string) => {
    if (!moaId) return 'Unassigned';
    const match = records.find(r => r.id === moaId);
    if (!match) return 'Unassigned';
    return match.parties?.find(p => p !== settings.universityName) || match.title;
  };

  // Filtered lists
  const filteredRecords = records.filter(rec => {
    if (rec.type !== (currentTab === 'moa' ? 'MOA' : 'LO')) return false;
    
    const matchesSearch = 
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.controlNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.parties?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (rec.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || rec.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const filteredStudents = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return students.filter(stud => {
      const schoolName = stud.school || (stud.yearAndSection?.startsWith('School: ') ? stud.yearAndSection.replace('School: ', '') : stud.yearAndSection) || '';
      
      const matchesSearch = 
        !query ||
        `${stud.firstName} ${stud.lastName}`.toLowerCase().includes(query) ||
        (stud.office && stud.office.toLowerCase().includes(query)) ||
        (stud.course && stud.course.toLowerCase().includes(query)) ||
        (schoolName && schoolName.toLowerCase().includes(query)) ||
        (stud.email && stud.email.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'All' || stud.status === statusFilter;
      const matchesDegree = degreeFilter === 'All' || stud.course === degreeFilter;

      let matchesHours = true;
      if (hoursFilter !== 'All') {
        const hrs = stud.hoursRequired || 0;
        if (hoursFilter === '< 300') matchesHours = hrs < 300;
        else if (hoursFilter === '300-500') matchesHours = hrs >= 300 && hrs <= 500;
        else if (hoursFilter === '> 500') matchesHours = hrs > 500;
        else matchesHours = hrs.toString() === hoursFilter;
      }

      let matchesDate = true;
      if (startDateFilter) {
        matchesDate = matchesDate && Boolean(stud.startDate && stud.startDate >= startDateFilter);
      }
      if (endDateFilter) {
        matchesDate = matchesDate && Boolean(stud.endDate && stud.endDate <= endDateFilter);
      }

      return matchesSearch && matchesStatus && matchesDegree && matchesHours && matchesDate;
    });
  }, [students, searchQuery, statusFilter, degreeFilter, hoursFilter, startDateFilter, endDateFilter]);

  const uniqueDegrees = React.useMemo(() => {
    return Array.from(new Set(students.map(s => s.course).filter((x): x is string => Boolean(x)))).sort();
  }, [students]);

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const safeStudentPage = Math.min(studentPage, totalStudentPages);

  const getVisiblePageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    const pages: (number | string)[] = [];
    pages.push(1);
    
    if (current > 3) {
      pages.push('...');
    }
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < total - 2) {
      pages.push('...');
    }
    
    pages.push(total);
    return pages;
  };

  const handleStudentPageChange = (newPage: number) => {
    setStudentPage(newPage);
    const topElem = document.getElementById('intern-roster-top');
    if (topElem) {
      topElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const paginatedStudents = React.useMemo(() => {
    return filteredStudents.slice((safeStudentPage - 1) * STUDENTS_PER_PAGE, safeStudentPage * STUDENTS_PER_PAGE);
  }, [filteredStudents, safeStudentPage]);

  React.useEffect(() => {
    setStudentPage(1);
  }, [searchQuery, statusFilter, degreeFilter, hoursFilter, startDateFilter, endDateFilter]);

  const switchTabWithBuffer = (tab: 'dashboard' | 'moa' | 'lo' | 'students' | 'settings' | 'audit_logs' | 'organizations' | 'ojt-tracker') => {
    if (tab === currentTab) return;
    setIsTabBufferLoading(true);
    setCurrentTab(tab);
    setSearchQuery('');
    setStatusFilter('All');
    setStudentPage(1);
    setIsMobileSidebarOpen(false);
    setTimeout(() => {
      setIsTabBufferLoading(false);
    }, 120);
  };

  const hasActiveStudentFilters = Boolean(
    searchQuery || 
    statusFilter !== 'All' || 
    degreeFilter !== 'All' || 
    hoursFilter !== 'All' || 
    startDateFilter || 
    endDateFilter
  );

  const resetStudentFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setDegreeFilter('All');
    setHoursFilter('All');
    setStartDateFilter('');
    setEndDateFilter('');
    setStudentPage(1);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden" id="login-container">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-highest/30 via-background to-background pointer-events-none z-0"></div>
        <Toaster position="top-right" richColors />

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="flex justify-center">
            <div className="p-3 bg-primary-container text-white rounded-full shadow-[0_0_20px_rgba(255,84,81,0.4)]">
              <ShieldCheck className="h-10 w-10" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-starlight-white font-headline drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            Legal Registry Tracker
          </h2>
          <p className="mt-2 text-center text-xs text-secondary font-mono tracking-wider">
            PATRIC CENTRAL SECURE LAN PORTAL
          </p>

          {/* Login | Attendance Tab Bar */}
          <div className="mt-8 flex bg-surface-container/40 p-1 rounded-lg border border-glass-stroke max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setActiveLoginTab('login')}
              className={`flex-1 py-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                activeLoginTab === 'login'
                  ? 'bg-primary-container text-white shadow-[0_0_10px_rgba(255,84,81,0.2)]'
                  : 'text-secondary hover:text-white hover:bg-surface-container/20'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setActiveLoginTab('attendance')}
              className={`flex-1 py-2 rounded-md text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                activeLoginTab === 'attendance'
                  ? 'bg-primary-container text-white shadow-[0_0_10px_rgba(255,84,81,0.2)]'
                  : 'text-secondary hover:text-white hover:bg-surface-container/20'
              }`}
            >
              Attendance
            </button>
          </div>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-void-black/80 backdrop-blur-xl py-8 px-4 border border-glass-stroke rounded shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:px-10">

            {/* ========== LOGIN TAB ========== */}
            {activeLoginTab === 'login' && (
              <>
                <form className="space-y-5" onSubmit={handleLogin} id="login-form">
                  <div>
                    <label htmlFor="username" className="block text-xs font-semibold uppercase text-secondary font-mono tracking-wider mb-1">
                      Network Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-glass-stroke rounded bg-surface-container text-starlight-white placeholder-secondary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container sm:text-sm transition-all"
                      placeholder="e.g. admin, legal, ojt"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold uppercase text-secondary font-mono tracking-wider mb-1">
                      Security Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-glass-stroke rounded bg-surface-container text-starlight-white placeholder-secondary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container sm:text-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded bg-primary-container hover:bg-primary hover:text-void-black text-white font-mono text-xs tracking-widest font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(255,84,81,0.3)]"
                  >
                    {isLoggingIn ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'CONNECT TO SECURE SERVER'}
                  </button>
                </form>

                <div className="mt-8 border-t border-glass-stroke pt-6">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-widest text-center mb-4 font-mono">Preset Network Credentials</h3>
                  <div className="grid grid-cols-1 gap-2.5 text-xs text-secondary">
                    <div className="flex items-start gap-2 bg-surface-container/60 p-2.5 rounded border border-glass-stroke">
                      <div className="p-1 bg-primary-container/20 text-primary border border-primary-container/30 rounded text-[10px] font-bold font-mono">ADMIN</div>
                      <div>
                        <span className="font-semibold text-starlight-white font-mono">admin / admin123</span>
                        <p className="text-[10px] text-secondary mt-0.5">Full master control, configuration, and compliance audit logs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-surface-container/60 p-2.5 rounded border border-glass-stroke">
                      <div className="p-1 bg-primary/20 text-primary border border-primary/30 rounded text-[10px] font-bold font-mono">LEGAL</div>
                      <div>
                        <span className="font-semibold text-starlight-white font-mono">legal / legal123</span>
                        <p className="text-[10px] text-secondary mt-0.5">Review, edit and issue agreements and legal opinions</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-surface-container/60 p-2.5 rounded border border-glass-stroke">
                      <div className="p-1 bg-primary-container/20 text-primary border border-primary-container/30 rounded text-[10px] font-bold font-mono">OJT</div>
                      <div>
                        <span className="font-semibold text-starlight-white font-mono">ojt / ojt123</span>
                        <p className="text-[10px] text-secondary mt-0.5">Register OJT students, manage training hours and active MOAs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ========== ATTENDANCE TAB ========== */}
            {activeLoginTab === 'attendance' && (
              <div className="space-y-4">
                {attendSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-center animate-fade-in">
                    <p className="text-green-400 text-xs font-mono font-bold">Attendance logged successfully!</p>
                  </div>
                )}

                {/* No student selected yet → show search */}
                {!attendStudent && !attendStudentNotFound && (
                  <>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Search by Name</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-secondary" />
                        <input
                          type="text"
                          value={attendNameQuery}
                          onChange={(e) => {
                            setAttendNameQuery(e.target.value);
                            setAttendNameResults([]);
                            setAttendStudentNotFound(false);
                            setProfileRequestSent(false);
                            setShowProfileRequest(false);
                          }}
                          className="w-full pl-8 pr-3 py-2 border border-glass-stroke rounded bg-surface-container text-starlight-white placeholder-secondary text-xs font-mono focus:outline-none focus:border-primary-container transition-all"
                          placeholder="Type your name..."
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAttendNameSearch}
                      disabled={isAttendLoading || !attendNameQuery.trim()}
                      className="w-full py-2 bg-surface-container-highest border border-glass-stroke hover:border-primary/50 text-starlight-white font-mono text-[11px] tracking-widest font-bold rounded transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isAttendLoading ? <RefreshCw className="h-4 w-4 animate-spin inline" /> : 'SEARCH'}
                    </button>

                    {/* Name search results */}
                    {attendNameResults.length > 0 && (
                      <div className="space-y-1.5 animate-fade-in">
                        <p className="text-secondary text-[10px] font-mono">Select your name:</p>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                          {attendNameResults.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => { setAttendStudent(s); setAttendNameQuery(''); setAttendNameResults([]); }}
                              className="w-full text-left px-3 py-2 bg-surface-container/60 hover:bg-surface-container-highest border border-glass-stroke hover:border-primary/40 rounded transition-all cursor-pointer group"
                            >
                              <p className="text-[11px] font-mono font-bold text-starlight-white group-hover:text-primary transition-colors">
                                {s.firstName} {s.lastName}
                              </p>
                              <p className="text-[10px] font-mono text-secondary">{s.course} — {s.yearAndSection}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </>
                )}

                {/* Student selected → show time log form */}
                {attendStudent && (
                  <>
                    <div className="p-2.5 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-between">
                      <div>
                        <p className="text-green-400 text-[11px] font-mono font-bold">{attendStudent.firstName} {attendStudent.lastName}</p>
                        <p className="text-green-400/60 text-[10px] font-mono">{attendStudent.course} — {attendStudent.yearAndSection}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAttendStudent(null); setAttendTimeOut(''); setAttendNotes(''); setAttendError(''); }}
                        className="text-secondary hover:text-starlight-white transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Time In</label>
                        <input
                          type="time"
                          value={attendTimeIn}
                          onChange={(e) => setAttendTimeIn(e.target.value)}
                          className="w-full px-2 py-1.5 border border-glass-stroke rounded bg-surface-container text-starlight-white text-xs font-mono focus:outline-none focus:border-primary-container transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Time Out</label>
                        <input
                          type="time"
                          value={attendTimeOut}
                          onChange={(e) => setAttendTimeOut(e.target.value)}
                          className="w-full px-2 py-1.5 border border-glass-stroke rounded bg-surface-container text-starlight-white text-xs font-mono focus:outline-none focus:border-primary-container transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Break (minutes)</label>
                      <input
                        type="number"
                        value={attendBreak}
                        onChange={(e) => setAttendBreak(e.target.value)}
                        min="0"
                        max="480"
                        className="w-full px-2 py-1.5 border border-glass-stroke rounded bg-surface-container text-starlight-white text-xs font-mono focus:outline-none focus:border-primary-container transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        value={attendNotes}
                        onChange={(e) => setAttendNotes(e.target.value)}
                        className="w-full px-2 py-1.5 border border-glass-stroke rounded bg-surface-container text-starlight-white placeholder-secondary text-xs font-mono focus:outline-none focus:border-primary-container transition-all"
                        placeholder="e.g. OJT rendering"
                      />
                    </div>

                    {attendError && <p className="text-red-400 text-[10px] font-mono">{attendError}</p>}

                    <button
                      type="button"
                      onClick={handleAttendLog}
                      disabled={isAttendLoading || !attendTimeIn || !attendTimeOut}
                      className="w-full py-2.5 bg-primary-container hover:bg-primary hover:text-void-black text-white font-mono text-[11px] tracking-widest font-bold rounded transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isAttendLoading ? <RefreshCw className="h-4 w-4 animate-spin inline" /> : 'LOG ATTENDANCE'}
                    </button>
                  </>
                )}

                {/* Student not found → profile request */}
                {attendStudentNotFound && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded text-center">
                      <p className="text-red-400 text-[11px] font-mono font-bold">No matching student found</p>
                    </div>

                    {!showProfileRequest && !profileRequestSent && (
                      <button
                        type="button"
                        onClick={() => setShowProfileRequest(true)}
                        className="w-full py-2 bg-surface-container-highest border border-glass-stroke hover:border-primary/50 text-starlight-white font-mono text-[11px] tracking-widest font-bold rounded transition-all cursor-pointer"
                      >
                        REQUEST PROFILE CREATION
                      </button>
                    )}

                    {showProfileRequest && !profileRequestSent && (
                      <div className="space-y-2.5 animate-fade-in">
                        <p className="text-secondary text-[10px] font-mono text-center">Provide your details so an administrator can create your profile.</p>
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={profileRequestName}
                            onChange={(e) => setProfileRequestName(e.target.value)}
                            className="w-full px-2 py-1.5 border border-glass-stroke rounded bg-surface-container text-starlight-white text-xs font-mono focus:outline-none focus:border-primary-container transition-all"
                            placeholder="e.g. Juan Dela Cruz"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Email</label>
                          <input
                            type="email"
                            value={profileRequestEmail}
                            onChange={(e) => setProfileRequestEmail(e.target.value)}
                            className="w-full px-2 py-1.5 border border-glass-stroke rounded bg-surface-container text-starlight-white text-xs font-mono focus:outline-none focus:border-primary-container transition-all"
                            placeholder="e.g. juan@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">School</label>
                          <input
                            type="text"
                            value={profileRequestSchool}
                            onChange={(e) => setProfileRequestSchool(e.target.value)}
                            className="w-full px-2 py-1.5 border border-glass-stroke rounded bg-surface-container text-starlight-white text-xs font-mono focus:outline-none focus:border-primary-container transition-all"
                            placeholder="e.g. University of Santo Tomas"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleProfileRequest}
                          disabled={isAttendLoading || !profileRequestName.trim()}
                          className="w-full py-2 bg-primary-container hover:bg-primary hover:text-void-black text-white font-mono text-[11px] tracking-widest font-bold rounded transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isAttendLoading ? <RefreshCw className="h-4 w-4 animate-spin inline" /> : 'SUBMIT REQUEST'}
                        </button>
                      </div>
                    )}

                    {profileRequestSent && (
                      <div className="p-2.5 bg-green-500/10 border border-green-500/30 rounded text-center animate-fade-in">
                        <p className="text-green-400 text-[11px] font-mono font-bold">Request sent to administrators!</p>
                        <p className="text-green-400/60 text-[10px] font-mono mt-0.5">You will be notified when your profile is created.</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => { setAttendStudentNotFound(false); setAttendNameQuery(''); setShowProfileRequest(false); setProfileRequestSent(false); }}
                      className="w-full py-1.5 text-secondary hover:text-starlight-white text-[10px] font-mono transition-colors cursor-pointer"
                    >
                      ← Search again
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden text-on-background font-sans relative print:bg-white print:text-black" id="app-root">
      <Toaster position="top-right" richColors />
      
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-highest/20 via-background to-background pointer-events-none z-0"></div>

      {/* Mobile Sidebar Overlay & Drawer */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-void-black/80 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-surface-container/95 border-r border-glass-stroke backdrop-blur-xl z-50 flex flex-col justify-between p-6 transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-glass-stroke pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary-container text-white rounded-full">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="font-headline font-bold text-starlight-white text-base">MOA & LO Tracker</span>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 text-secondary hover:text-starlight-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="font-mono text-xs text-starlight-white/70">
            {formatTime(currentTime)}
          </div>

          <nav className="flex flex-col gap-2" id="mobile-sidebar-nav">
            {currentUser && (
              <button
                onClick={() => { setCurrentTab('dashboard'); setSearchQuery(''); setStatusFilter('All'); setIsMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentTab === 'dashboard' ? 'bg-primary-container/20 text-primary border border-primary-container/40' : 'text-secondary hover:bg-surface-container-highest/50 hover:text-white'}`}
              >
                <Landmark className="h-4 w-4" />
                Dashboard
              </button>
            )}
            {currentUser && (currentUser.role === 'Administrator' || currentUser.role === 'Legal Team') && (
              <button
                onClick={() => { setCurrentTab('moa'); setSearchQuery(''); setStatusFilter('All'); setIsMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentTab === 'moa' || currentTab === 'lo' ? 'bg-primary-container/20 text-primary border border-primary-container/40' : 'text-secondary hover:bg-surface-container-highest/50 hover:text-white'}`}
              >
                <FileText className="h-4 w-4" />
                Document Registry
              </button>
            )}
            {currentUser && (currentUser.role === 'Administrator' || currentUser.role === 'OJT Coordinator') && (
              <button
                onClick={() => { setCurrentTab('students'); setSearchQuery(''); setStatusFilter('All'); setIsMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentTab === 'students' ? 'bg-primary-container/20 text-primary border border-primary-container/40' : 'text-secondary hover:bg-surface-container-highest/50 hover:text-white'}`}
              >
                <Users className="h-4 w-4" />
                Intern Roster
              </button>
            )}
            {currentUser && (
              <button
                onClick={() => { setCurrentTab('ojt-tracker'); setSearchQuery(''); setStatusFilter('All'); setIsMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${currentTab === 'ojt-tracker' ? 'bg-primary-container/20 text-primary border border-primary-container/40' : 'text-secondary hover:bg-surface-container-highest/50 hover:text-white'}`}
              >
                Hour Tracker
              </button>
            )}

          </nav>
        </div>

        {currentUser && (
          <div className="border-t border-glass-stroke pt-4 flex items-center justify-between">
            <div className="text-left">
              <div className="text-xs font-semibold text-starlight-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.role}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLightMode(!isLightMode)}
                className="p-2 rounded-lg bg-surface-container-highest text-secondary hover:text-primary transition-colors cursor-pointer"
                title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {isLightMode ? <Moon className="h-4 w-4 text-amber-400" /> : <Sun className="h-4 w-4 text-yellow-400" />}
              </button>
              <button
                onClick={() => { handleLogout(); setIsMobileSidebarOpen(false); }}
                className="p-2 rounded-lg bg-surface-container-highest text-secondary hover:text-primary transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* TopNavBar */}
      <header className="relative flex items-center justify-between w-full px-4 md:px-8 py-3 md:h-[64px] sticky top-0 z-40 bg-void-black/80 backdrop-blur-lg border-b border-glass-stroke shrink-0 print:hidden" id="app-header">
        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 text-secondary hover:text-starlight-white transition-colors cursor-pointer rounded-lg hover:bg-surface-container-highest/40"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-headline font-bold text-starlight-white text-sm">
            {currentTab === 'dashboard' ? 'Dashboard' : (currentTab === 'moa' || currentTab === 'lo') ? 'Document Registry' : currentTab === 'ojt-tracker' ? 'Hour Tracker' : 'Intern Roster'}
          </span>
        </div>

        {/* Left side (Desktop): Live ticking clock */}
        <div className="hidden md:flex items-center justify-start h-full min-w-[120px]">
          <div 
            className={`font-mono text-xs text-starlight-white/80 tracking-widest transition-all duration-500 ease-in-out ${
              currentTab !== 'dashboard' 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-2 pointer-events-none'
            }`}
          >
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Center navigation buttons (Desktop) */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-8 h-full" id="header-nav">
          {currentUser && (
            <button
              onClick={() => switchTabWithBuffer('dashboard')}
              className={`relative h-full flex items-center gap-2 px-1 text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
                currentTab === 'dashboard' ? 'text-starlight-white' : 'text-secondary hover:text-starlight-white'
              }`}
            >
              <span>Dashboard</span>
              <span 
                className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full shadow-[0_0_10px_rgba(255,84,81,0.9)] transition-all duration-300 ease-out ${
                  currentTab === 'dashboard' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`} 
              />
            </button>
          )}
          {currentUser && (currentUser.role === 'Administrator' || currentUser.role === 'Legal Team') && (
            <button
              onClick={() => switchTabWithBuffer('moa')}
              className={`relative h-full flex items-center gap-2 px-1 text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
                currentTab === 'moa' || currentTab === 'lo' ? 'text-starlight-white' : 'text-secondary hover:text-starlight-white'
              }`}
            >
              <span>Document Registry</span>
              <span 
                className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full shadow-[0_0_10px_rgba(255,84,81,0.9)] transition-all duration-300 ease-out ${
                  currentTab === 'moa' || currentTab === 'lo' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`} 
              />
            </button>
          )}
          {currentUser && (currentUser.role === 'Administrator' || currentUser.role === 'OJT Coordinator') && (
            <button
              onClick={() => switchTabWithBuffer('students')}
              className={`relative h-full flex items-center gap-2 px-1 text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
                currentTab === 'students' ? 'text-starlight-white' : 'text-secondary hover:text-starlight-white'
              }`}
            >
              <span>Intern Roster</span>
              <span 
                className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full shadow-[0_0_10px_rgba(255,84,81,0.9)] transition-all duration-300 ease-out ${
                  currentTab === 'students' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`} 
              />
            </button>
          )}
          {currentUser && (
            <button
              onClick={() => switchTabWithBuffer('ojt-tracker')}
              className={`relative h-full flex items-center gap-2 px-1 text-sm font-semibold tracking-wide transition-colors duration-200 cursor-pointer ${
                currentTab === 'ojt-tracker' ? 'text-starlight-white' : 'text-secondary hover:text-starlight-white'
              }`}
            >
              <span>Hour Tracker</span>
              <span 
                className={`absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full shadow-[0_0_10px_rgba(255,84,81,0.9)] transition-all duration-300 ease-out ${
                  currentTab === 'ojt-tracker' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`} 
              />
            </button>
          )}
        </nav>

        {/* Right column: User Account / Profile & Stats */}
        <div className="flex items-center justify-end gap-3">
          {stats.pendingSync > 0 && (
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 font-mono text-[10px] text-primary bg-[#2d1215] hover:bg-[#5f2024] px-2.5 py-1 rounded border border-[#5f2024] transition-colors cursor-pointer animate-pulse"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{stats.pendingSync} UNSYNCED</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <NotificationDropdown
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
              onMarkAllAsRead={handleMarkAllNotificationsRead}
              onToggleReadState={handleToggleNotificationRead}
            />

            {currentUser && (
              <div className="relative group/profile">
                {/* Fixed Size Profile Circle Button */}
                <button
                  className="h-9 w-9 rounded-full bg-primary-container text-white flex items-center justify-center text-xs font-bold font-sans uppercase cursor-pointer transition-all duration-300 border border-glass-stroke hover:border-outline/50 hover:scale-105 shrink-0 shadow-sm"
                  title={currentUser.name}
                >
                  {currentUser.name.substring(0, 2)}
                </button>

                {/* Floating Phone-Card Style Popover Pill (Does NOT shift bell icon or header layout) */}
                <div className="absolute right-0 top-full pt-2 z-50 pointer-events-none opacity-0 translate-y-2 group-hover/profile:opacity-100 group-hover/profile:translate-y-0 group-hover/profile:pointer-events-auto transition-all duration-500 ease-in-out">
                  <div className="bg-void-black/95 backdrop-blur-xl border border-glass-stroke/80 text-white px-3 py-2 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] border-outline/30 flex items-center gap-2.5 whitespace-nowrap min-w-max">
                    <div className="text-left">
                      <div className="text-[11px] font-semibold text-starlight-white/90 leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono leading-tight mt-0.5">
                        {currentUser.role}
                      </div>
                    </div>

                    <div className="h-4 w-[1px] bg-glass-stroke/60 shrink-0" />

                    <button
                      onClick={handleLogout}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all duration-300 cursor-pointer shrink-0"
                      title="Log Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Scrollable Canvas */}
      <main className="flex-1 overflow-y-auto p-8 relative z-10 w-full print:bg-white print:h-auto print:overflow-visible" id="app-main">
        
        {/* Content Panel */}
        <div className="w-full mx-auto flex flex-col gap-8 max-w-7xl print:p-0 print:overflow-visible" id="main-content-panel">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-slate-500 font-medium text-sm">Opening secure database store...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Tab */}
              {currentTab === 'dashboard' && (
                <div className="animate-fade-in">
                  <Dashboard 
                    records={records} 
                    stats={stats} 
                    students={students}
                    onNavigate={(tab) => setCurrentTab(tab)} 
                    onSync={handleSync} 
                    isSyncing={isSyncing}
                    organizations={organizations}
                    onSelectContract={(contractId) => {
                      const c = records.find(r => r.id === contractId);
                      if (c) {
                        setPreviewRecord(c);
                        setIsContractDetailModalOpen(true);
                      }
                    }}
                    onSelectOrg={(orgId) => {
                      setSelectedOrgId(orgId);
                      setCurrentTab('organizations');
                    }}
                  />
                </div>
              )}

              {/* MOA Tab & LO Tab */}
              {(currentTab === 'moa' || currentTab === 'lo') && (
                <div className="space-y-6 animate-fade-in">
                  {/* Header & Tabs */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
                    <div>
                      <h2 className="font-headline text-3xl font-bold text-starlight-white mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Document Registry</h2>
                      <p className="font-sans text-sm text-secondary">Manage and track all Memorandums of Agreement and Legal Opinions.</p>
                    </div>
                    <div className="flex bg-void-black p-1 rounded border border-glass-stroke">
                      <button 
                        onClick={() => { setCurrentTab('moa'); setSearchQuery(''); setStatusFilter('All'); }}
                        className={`font-mono text-[11px] px-4 py-1.5 rounded font-bold tracking-wider uppercase transition-all cursor-pointer ${currentTab === 'moa' ? 'text-void-black bg-primary shadow-[0_0_10px_rgba(255,179,173,0.3)]' : 'text-secondary hover:text-white'}`}
                      >
                        AGREEMENTS (MOA)
                      </button>
                      <button 
                        onClick={() => { setCurrentTab('lo'); setSearchQuery(''); setStatusFilter('All'); }}
                        className={`font-mono text-[11px] px-4 py-1.5 rounded font-bold tracking-wider uppercase transition-all cursor-pointer ${currentTab === 'lo' ? 'text-void-black bg-primary shadow-[0_0_10px_rgba(255,179,173,0.3)]' : 'text-secondary hover:text-white'}`}
                      >
                        OPINIONS (LO)
                      </button>
                    </div>
                  </div>

                  {/* Content for active registry tab with smooth slide-up transition */}
                  <div key={currentTab} className="space-y-6 animate-fade-in">
                    {/* Multifactor Toolbar */}
                    <div className="relative z-30 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-void-black/60 backdrop-blur-md p-4 border border-glass-stroke rounded shadow-[0_4px_24px_rgba(0,0,0,0.4)] print:hidden">
                    <div className="flex-1 flex flex-col sm:flex-row gap-4">
                      {/* Search */}
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary h-4 w-4" />
                        <input
                          type="text"
                          placeholder={currentTab === 'moa' ? 'Search by Title or Partner...' : 'Search by Title, Requested By...'}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-surface-container border border-glass-stroke rounded font-sans text-sm text-starlight-white focus:border-outline focus:bg-surface-container-highest outline-none transition-all placeholder:text-secondary shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                        />
                      </div>

                      {/* Status Filter */}
                      <div className="relative min-w-[160px] flex items-center">
                        <CustomSelect
                          value={statusFilter}
                          onChange={(val) => setStatusFilter(val)}
                          options={currentTab === 'moa' ? [
                            { value: 'All', label: 'All Statuses' },
                            { value: 'Active', label: 'Active' },
                            { value: 'Expiring Soon', label: 'Expiring Soon' },
                            { value: 'Expired', label: 'Expired' },
                            { value: 'Renewed', label: 'Renewed' },
                            { value: 'Archived', label: 'Archived' },
                          ] : [
                            { value: 'All', label: 'All Statuses' },
                            { value: 'Issued', label: 'Issued' },
                            { value: 'Archived', label: 'Archived' },
                          ]}
                          className="w-full"
                        />
                      </div>

                      {/* Category Filter for MOA */}
                      {currentTab === 'moa' && (
                        <div className="relative min-w-[160px] flex items-center">
                          <CustomSelect
                            value={categoryFilter}
                            onChange={(val) => setCategoryFilter(val)}
                            options={[
                              { value: 'All', label: 'All Categories' },
                              { value: 'Internship & OJT', label: 'Internship & OJT' },
                              { value: 'Academic Exchange', label: 'Academic Exchange' },
                              { value: 'Research & Development', label: 'Research & Development' },
                              { value: 'Community Extension', label: 'Community Extension' },
                            ]}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExcelExport}
                        className="bg-surface-container-highest text-starlight-white border border-glass-stroke font-mono text-[10px] tracking-wider rounded px-4 py-2 flex items-center justify-center gap-1.5 hover:bg-outline hover:border-outline transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)] cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        EXPORT EXCEL
                      </button>
                      <button
                        onClick={() => openRecordModal(null, currentTab === 'moa' ? 'MOA' : 'LO')}
                        className="bg-primary-container text-white font-mono text-[10px] tracking-wider rounded px-4 py-2 flex items-center justify-center gap-1.5 hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        REGISTER NEW RECORD
                      </button>
                    </div>
                  </div>

                  {/* Data Grid Table */}
                  <div className="bg-void-black/80 backdrop-blur-xl border border-glass-stroke rounded overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-glass-stroke bg-surface-container/50 text-secondary font-mono text-xs tracking-wider uppercase">
                            <th className="px-6 py-4 font-medium">Title</th>
                            {currentTab === 'moa' ? (
                              <th className="px-6 py-4 font-medium">Parties Involved</th>
                            ) : (
                              <th className="px-6 py-4 font-medium">Requested By / Counsel</th>
                            )}
                            <th className="px-6 py-4 font-medium">Issue Date</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium text-right print:hidden">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="font-sans text-sm text-starlight-white divide-y divide-glass-stroke/50">
                          {filteredRecords.length > 0 ? (
                            filteredRecords.map((rec) => (
                              <tr key={rec.id} className="hover:bg-surface-container-highest/40 transition-colors group">
                                <td className="px-6 py-4 font-medium max-w-sm">
                                  <div className="text-starlight-white truncate font-medium" title={rec.title}>
                                    {rec.title}
                                  </div>
                                  <div className="text-xs text-secondary truncate mt-0.5 font-sans" title={rec.description}>
                                    {rec.description}
                                  </div>
                                </td>
                                {currentTab === 'moa' ? (
                                  <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                      {rec.parties?.map((p, idx) => (
                                        <span key={idx} className="text-[11px] bg-surface-container px-2 py-0.5 rounded text-secondary font-medium border border-glass-stroke">
                                          {p}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                ) : (
                                  <td className="px-6 py-4">
                                    <div className="font-medium text-starlight-white">{rec.requestedBy}</div>
                                    <div className="text-xs text-secondary">{rec.assignedCounsel || 'No Counsel Assigned'}</div>
                                  </td>
                                )}
                                <td className="px-6 py-4 text-secondary">
                                  <div>{rec.issueDate || '—'}</div>
                                  {rec.type === 'MOA' && (
                                    <div className="text-xs mt-0.5">
                                      Exp: {rec.isIndefinite ? 'Indefinite' : (rec.expirationDate || '—')}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] tracking-widest uppercase ${
                                    rec.status === 'Active' || rec.status === 'Issued' || rec.status === 'Renewed' 
                                      ? 'bg-[#1a2e1f] border border-[#2d5a39] text-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.15)]' 
                                      : rec.status === 'Expiring Soon' 
                                      ? 'bg-[#2b2116] border border-[#533f24] text-[#f59e0b]' 
                                      : 'bg-[#2d1215] border border-[#5f2024] text-[#ffb4ab]'
                                  }`}>
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right print:hidden">
                                  <div className="flex items-center justify-end gap-1.5 -mr-1.5">
                                    <button
                                      onClick={() => { setPreviewRecord(rec); setIsContractDetailModalOpen(true); }}
                                      className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
                                      title="Lifecycle Workspace"
                                    >
                                      <Briefcase className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => { setPreviewRecord(rec); setIsPrintPreviewOpen(true); }}
                                      className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
                                      title="View / Print Document"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => openRecordModal(rec, rec.type)}
                                      className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
                                      title="Edit Record"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(rec.id)}
                                      className="p-1.5 text-secondary hover:text-error hover:bg-surface-container rounded transition-colors cursor-pointer"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-secondary">
                                No agreements or legal opinions match the filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  </div>
                </div>
              )}

              {/* OJT Students Tab */}
              {currentTab === 'students' && (
                <div className="space-y-6 animate-fade-in scroll-mt-24" id="intern-roster-top">
                  {/* Header & Title & Sub-tabs */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 border-b border-glass-stroke/30 pb-4 print:hidden">
                    <div>
                      <h2 className="font-headline text-3xl font-bold text-starlight-white mb-1">Intern Roster</h2>
                      <p className="font-sans text-sm text-secondary">Manage OJT placements and track required hours against active MOAs.</p>
                    </div>
                    <div className="flex bg-surface-container/60 p-1 rounded border border-glass-stroke">
                      <button
                        onClick={() => setStudentSubTab('roster')}
                        className={`px-4 py-1.5 rounded font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                          studentSubTab === 'roster'
                            ? 'bg-primary text-void-black shadow-[0_0_12px_rgba(255,84,81,0.25)]'
                            : 'text-secondary hover:text-white'
                        }`}
                      >
                        ROSTER DIRECTORY
                      </button>
                      <button
                        onClick={() => {
                          setStudentSubTab('certificates');
                          if (!selectedCertStudentId && students.length > 0) {
                            setSelectedCertStudentId(students[0].id);
                            setCertCustomHours(students[0].hoursCompleted.toString());
                          }
                        }}
                        className={`px-4 py-1.5 rounded font-mono text-xs font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          studentSubTab === 'certificates'
                            ? 'bg-primary text-void-black shadow-[0_0_12px_rgba(255,84,81,0.25)]'
                            : 'text-secondary hover:text-white'
                        }`}
                      >
                        <Award className="h-3.5 w-3.5" />
                        OJT CERTIFICATES
                      </button>
                    </div>
                  </div>

                  {studentSubTab === 'roster' ? (
                    <div className="space-y-6 animate-fade-in">
                      {/* Multifactor Toolbar & Filters */}
                      <div className="relative z-30 space-y-4 bg-void-black/60 backdrop-blur-md p-5 border border-glass-stroke rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] print:hidden">
                        {/* Top Row: Search & Actions */}
                        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                          <div className="flex-1 flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1 max-w-md">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary h-4 w-4" />
                              <input
                                type="text"
                                placeholder="Search student name, office, course, or school..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-surface-container border border-glass-stroke rounded-lg font-sans text-sm text-starlight-white focus:border-outline focus:bg-surface-container-highest outline-none transition-all placeholder:text-secondary shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                              />
                            </div>

                            {/* Status Filter */}
                            <div className="relative min-w-[150px] flex items-center">
                              <CustomSelect
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val)}
                                options={[
                                  { value: 'All', label: 'All Statuses' },
                                  { value: 'Not Started', label: 'Not Started' },
                                  { value: 'On-going', label: 'On-going' },
                                  { value: 'Completed', label: 'Completed' },
                                  { value: 'Suspended', label: 'Suspended' },
                                ]}
                                className="w-full"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {hasActiveStudentFilters && (
                              <button
                                onClick={resetStudentFilters}
                                className="bg-surface-container text-secondary hover:text-starlight-white border border-glass-stroke font-mono text-[10px] tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                                RESET FILTERS
                              </button>
                            )}
                            <button
                              onClick={() => setIsImportModalOpen(true)}
                              className="bg-surface-container-highest text-starlight-white border border-glass-stroke font-mono text-[10px] tracking-wider rounded-lg px-4 py-2 flex items-center justify-center gap-1.5 hover:bg-outline hover:border-outline transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)] cursor-pointer"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              BATCH IMPORT INTERNS
                            </button>
                            <button
                              onClick={() => openStudentModal(null)}
                              className="bg-primary-container text-white font-mono text-[10px] tracking-wider rounded-lg px-4 py-2 flex items-center justify-center gap-1.5 hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              ADD STUDENT
                            </button>
                          </div>
                        </div>

                        {/* Bottom Row: Filter Dropdowns & Date Pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-glass-stroke/30">
                          {/* Degree / Program */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-secondary mb-1">Degree / Course</label>
                            <CustomSelect
                              value={degreeFilter}
                              onChange={(val) => setDegreeFilter(val)}
                              options={[
                                { value: 'All', label: 'All Degrees' },
                                ...uniqueDegrees.map(d => ({ value: d, label: d }))
                              ]}
                              className="w-full"
                            />
                          </div>

                          {/* Hours Assigned */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-secondary mb-1">Hours Assigned</label>
                            <CustomSelect
                              value={hoursFilter}
                              onChange={(val) => setHoursFilter(val)}
                              options={[
                                { value: 'All', label: 'All Hours' },
                                { value: '< 300', label: '< 300 hrs' },
                                { value: '300-500', label: '300 - 500 hrs' },
                                { value: '> 500', label: '> 500 hrs' },
                              ]}
                              className="w-full"
                            />
                          </div>

                          {/* Start Date */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-secondary mb-1">Start Date (From)</label>
                            <input
                              type="date"
                              value={startDateFilter}
                              onChange={(e) => setStartDateFilter(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white font-mono focus:border-outline outline-none transition-all"
                            />
                          </div>

                          {/* End Date */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-secondary mb-1">End Date (To)</label>
                            <input
                              type="date"
                              value={endDateFilter}
                              onChange={(e) => setEndDateFilter(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white font-mono focus:border-outline outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Student Cards Grid & Pagination */}
                      {isTabBufferLoading ? (
                        <div className="space-y-6 animate-pulse">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map((idx) => (
                              <div key={idx} className="bg-void-black/70 border border-glass-stroke/50 rounded-xl p-5 space-y-4 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
                                <div className="h-5 bg-surface-container-highest/60 rounded w-3/4 animate-pulse" />
                                <div className="h-3 bg-surface-container-highest/40 rounded w-1/2 animate-pulse" />
                                <div className="space-y-2 pt-3 border-t border-glass-stroke/30">
                                  <div className="h-4 bg-surface-container-highest/40 rounded w-full animate-pulse" />
                                  <div className="h-4 bg-surface-container-highest/40 rounded w-5/6 animate-pulse" />
                                </div>
                                <div className="h-12 bg-surface-container-highest/30 rounded-lg animate-pulse" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : filteredStudents.length > 0 ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {paginatedStudents.map((stud) => (
                              <div 
                                key={stud.id} 
                                className="bg-void-black/70 backdrop-blur-md border border-glass-stroke hover:border-primary/40 rounded-xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between gap-4 transition-all duration-200 group"
                              >
                                {/* Card Header: Name & Actions */}
                                <div className="flex items-start justify-between gap-3 border-b border-glass-stroke/30 pb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-headline font-bold text-base text-starlight-white truncate group-hover:text-primary transition-colors">
                                      {formatProperName(`${stud.lastName}, ${stud.firstName}${stud.middleName ? ` ${stud.middleName}` : ''}`)}
                                    </h3>
                                    <p className="text-xs text-secondary font-mono truncate mt-0.5" title={stud.email}>
                                      {stud.email}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 print:hidden">
                                    <button
                                      onClick={() => {
                                        setSelectedDtrStudent(stud);
                                        setIsStudentDtrModalOpen(true);
                                      }}
                                      className="p-1.5 text-secondary hover:text-sky-400 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                                      title="View DTR & Daily Time Logs"
                                    >
                                      <Clock className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedCertStudentId(stud.id);
                                        setStudentSubTab('certificates');
                                        setCertCustomHours(stud.hoursCompleted.toString());
                                        setCertCustomHours1((stud.hoursCompleted || stud.hoursRequired || 400).toString());
                                        if (stud.office) setCertCustomOffice(stud.office);
                                        if (stud.startDate) setCertDateFrom1(formatCertDate(stud.startDate));
                                        if (stud.endDate) setCertDateTo1(formatCertDate(stud.endDate));
                                      }}
                                      className="p-1.5 text-secondary hover:text-green-400 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                                      title="Generate Certificate"
                                    >
                                      <Award className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => openStudentModal(stud)}
                                      className="p-1.5 text-secondary hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                                      title="Edit Student"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(stud.id)}
                                      className="p-1.5 text-secondary hover:text-error hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                                      title="Delete Student"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Card Content */}
                                <div className="space-y-3 flex-1">
                                  {/* Program & School */}
                                  <div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-starlight-white">
                                      <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                                      <span className="truncate">{stud.course}</span>
                                    </div>
                                    <p className="text-[11px] text-amber-300/90 font-medium ml-5.5 mt-0.5 truncate">
                                      {stud.school || stud.yearAndSection}
                                    </p>
                                  </div>

                                  {/* Assigned Office */}
                                  <div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-starlight-white">
                                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                                      <span className="truncate" title={stud.office || 'N/A'}>
                                        {stud.office || 'N/A'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Student Home Address */}
                                  {stud.address && (
                                    <div className="flex items-center gap-1.5 text-xs text-secondary">
                                      <Home className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                      <span className="text-[11px] font-mono text-sky-300/90 truncate" title={`Home Address: ${stud.address}`}>
                                        {stud.address}
                                      </span>
                                    </div>
                                  )}

                                  {/* Dates Section: Start Date & End Date */}
                                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-glass-stroke/30">
                                    <div className="bg-surface-container/50 p-2.5 rounded-lg border border-glass-stroke/40">
                                      <div className="text-[10px] font-mono text-secondary uppercase tracking-wider flex items-center gap-1 font-bold">
                                        <Calendar className="h-3.5 w-3.5 text-secondary/80 shrink-0" />
                                        Start Date
                                      </div>
                                      <div className="text-xs font-mono font-semibold text-starlight-white mt-1">
                                        {stud.startDate || 'N/A'}
                                      </div>
                                    </div>

                                    <div className="bg-surface-container/50 p-2.5 rounded-lg border border-glass-stroke/40">
                                      <div className="text-[10px] font-mono text-secondary uppercase tracking-wider flex items-center gap-1 font-bold">
                                        <Calendar className="h-3.5 w-3.5 text-secondary/80 shrink-0" />
                                        End Date
                                      </div>
                                      <div className="text-xs font-mono font-semibold text-starlight-white mt-1">
                                        {stud.endDate || 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Card Footer: Hours Assigned & DTR Button */}
                                <div className="pt-3 border-t border-glass-stroke/30 space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider block">OJT Hours Completed</span>
                                      <span className="font-mono text-base font-extrabold text-green-400">
                                        {stud.hoursCompleted.toFixed(1)} / {stud.hoursRequired} hrs
                                      </span>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[10px] tracking-widest uppercase border ${
                                      stud.hoursCompleted >= stud.hoursRequired 
                                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                        : 'bg-surface-container border-glass-stroke text-secondary'
                                    }`}>
                                      {Math.min(100, Math.round((stud.hoursCompleted / (stud.hoursRequired || 1)) * 100))}%
                                    </span>
                                  </div>

                                  {/* Visual Progress Bar */}
                                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden border border-glass-stroke/30">
                                    <div 
                                      className="h-full bg-gradient-to-r from-primary via-yellow-400 to-green-400 transition-all duration-300 rounded-full" 
                                      style={{ width: `${Math.min(100, Math.round((stud.hoursCompleted / (stud.hoursRequired || 1)) * 100))}%` }}
                                    />
                                  </div>

                                  <button
                                    onClick={() => {
                                      setSelectedDtrStudent(stud);
                                      setIsStudentDtrModalOpen(true);
                                    }}
                                    className="w-full py-2 bg-surface-container-highest/60 hover:bg-surface-container-highest border border-glass-stroke hover:border-sky-500/50 text-sky-400 hover:text-sky-300 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                  >
                                    <Clock className="h-3.5 w-3.5" />
                                    VIEW DTR / LOG HOURS
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pagination Bar */}
                          {filteredStudents.length > STUDENTS_PER_PAGE && (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-void-black/60 backdrop-blur-md p-4 border border-glass-stroke rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] print:hidden">
                              <div className="text-xs font-mono text-secondary flex flex-wrap items-center gap-3">
                                <span>
                                  Showing <span className="text-starlight-white font-bold">{Math.min((safeStudentPage - 1) * STUDENTS_PER_PAGE + 1, filteredStudents.length)}</span> to{' '}
                                  <span className="text-starlight-white font-bold">{Math.min(safeStudentPage * STUDENTS_PER_PAGE, filteredStudents.length)}</span> of{' '}
                                  <span className="text-primary font-bold">{filteredStudents.length}</span> interns
                                </span>
                                <span className="text-glass-stroke hidden sm:inline">|</span>
                                <span className="text-starlight-white/90 font-bold bg-surface-container/60 px-2 py-0.5 rounded border border-glass-stroke/40">
                                  Page {safeStudentPage} of {totalStudentPages}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStudentPageChange(Math.max(1, safeStudentPage - 1))}
                                  disabled={safeStudentPage === 1}
                                  className="px-3 py-1.5 rounded-lg border border-glass-stroke font-mono text-xs text-starlight-white bg-surface-container hover:bg-surface-container-highest disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <ArrowLeft className="h-3.5 w-3.5" />
                                  Previous
                                </button>

                                {/* Truncated Page Numbers */}
                                <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                                  {getVisiblePageNumbers(safeStudentPage, totalStudentPages).map((item, idx) => (
                                    typeof item === 'number' ? (
                                      <button
                                        key={idx}
                                        onClick={() => handleStudentPageChange(item)}
                                        className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                                          safeStudentPage === item
                                            ? 'bg-primary-container text-white border border-primary/50 shadow-[0_0_12px_rgba(255,84,81,0.3)]'
                                            : 'bg-surface-container text-secondary hover:text-white hover:bg-surface-container-highest border border-glass-stroke/50'
                                        }`}
                                      >
                                        {item}
                                      </button>
                                    ) : (
                                      <span key={idx} className="w-6 text-center text-xs font-mono text-secondary font-bold select-none">
                                        ...
                                      </span>
                                    )
                                  ))}
                                </div>

                                <button
                                  onClick={() => handleStudentPageChange(Math.min(totalStudentPages, safeStudentPage + 1))}
                                  disabled={safeStudentPage >= totalStudentPages}
                                  className="px-3 py-1.5 rounded-lg border border-glass-stroke font-mono text-xs text-starlight-white bg-surface-container hover:bg-surface-container-highest disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
                                >
                                  Next
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-void-black/80 backdrop-blur-xl border border-glass-stroke rounded-xl p-12 text-center text-secondary font-sans shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                          No OJT student records match the filters.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Subsection for OJT Certificate Generator */
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-fade-in">
                      {/* Left Sidebar: Controls & Customization */}
                      <div className="xl:col-span-4 bg-void-black/80 backdrop-blur-xl border border-glass-stroke p-5 rounded space-y-6 print:hidden">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-headline text-lg font-bold text-starlight-white">Customize Certificate</h3>
                            <span className="font-mono text-[9px] bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 rounded font-bold uppercase">
                              {certTemplateMode === 'portrait_2in1' ? '2-in-1 Sheet' : 'Single Card'}
                            </span>
                          </div>
                        </div>

                        {/* Format Mode Toggle */}
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-secondary uppercase tracking-wider font-bold">Template Format</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCertTemplateMode('portrait_2in1')}
                              className={`p-2.5 rounded border text-xs font-mono font-medium flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                                certTemplateMode === 'portrait_2in1'
                                  ? 'border-primary bg-primary/10 text-starlight-white ring-1 ring-primary/50'
                                  : 'border-glass-stroke text-secondary hover:text-white hover:bg-surface-container'
                              }`}
                            >
                              <Award className="h-4 w-4 text-primary" />
                              <span className="text-[11px] font-bold">Pangasinan 2-in-1</span>
                              <span className="text-[9px] opacity-75 font-sans">Portrait (2 Students)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCertTemplateMode('landscape_card')}
                              className={`p-2.5 rounded border text-xs font-mono font-medium flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer ${
                                certTemplateMode === 'landscape_card'
                                  ? 'border-primary bg-primary/10 text-starlight-white ring-1 ring-primary/50'
                                  : 'border-glass-stroke text-secondary hover:text-white hover:bg-surface-container'
                              }`}
                            >
                              <GraduationCap className="h-4 w-4 text-primary" />
                              <span className="text-[11px] font-bold">Landscape Card</span>
                                  <span className="text-[9px] opacity-75 font-sans">Single Student</span>
                            </button>
                          </div>
                        </div>

                        {certTemplateMode === 'portrait_2in1' ? (
                          <>
                            {/* Student 1 (Top Certificate) */}
                            <div className="space-y-3 p-3.5 bg-surface-container/40 border border-glass-stroke/60 rounded-xl">
                              <div className="flex items-center justify-between">
                                <label className="block font-mono text-[11px] text-primary uppercase tracking-wider font-bold flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                                  Student 1 (Top Certificate)
                                </label>
                                {selectedCertStudentId && (
                                  <span className="font-mono text-[9px] text-green-400 font-semibold bg-green-950/40 border border-green-800/50 px-1.5 py-0.5 rounded">
                                    Selected
                                  </span>
                                )}
                              </div>

                              {(() => {
                                const s1 = students.find(s => s.id === selectedCertStudentId);
                                if (!s1) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => openPickerFor('student1')}
                                      className="w-full p-3.5 border-2 border-dashed border-primary/40 hover:border-primary rounded-xl bg-primary/5 hover:bg-primary/10 transition-all flex items-center gap-3 text-left group cursor-pointer"
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Search className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-headline text-xs font-bold text-starlight-white group-hover:text-primary transition-colors flex items-center gap-1">
                                          Choose Student 1 &rarr;
                                        </div>
                                        <div className="font-sans text-[11px] text-secondary truncate">
                                          Click to search roster by name, ID, course, school...
                                        </div>
                                      </div>
                                    </button>
                                  );
                                }

                                const fullName = formatStudentFullName(s1);
                                return (
                                  <div className="space-y-2">
                                    <div className="p-3 bg-surface-container/70 border border-primary/30 rounded-xl flex items-center justify-between gap-2.5">
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-9 h-9 rounded-lg bg-primary text-void-black font-bold font-mono text-xs flex items-center justify-center shrink-0 shadow-sm">
                                          {s1.firstName?.[0]}{s1.lastName?.[0]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-headline text-xs font-bold text-starlight-white truncate">
                                            {fullName}
                                          </div>
                                          <div className="font-mono text-[10px] text-secondary truncate">
                                            {s1.studentId} &bull; {s1.course}
                                          </div>
                                          <div className="font-sans text-[10px] text-secondary/80 truncate">
                                            {s1.school || s1.yearAndSection?.replace(/^School:\s*/i, '')}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openPickerFor('student1')}
                                        className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-void-black text-secondary transition-all shrink-0 flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                                        title="Change Student 1"
                                      >
                                        <Search className="h-3 w-3" />
                                        <span className="hidden sm:inline">Change</span>
                                      </button>
                                    </div>

                                    {/* Student 1 Details Quick Tuning */}
                                    <div className="space-y-2 pt-1">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block font-mono text-[9px] text-secondary uppercase">Training Hours</label>
                                          <input
                                            type="number"
                                            value={certCustomHours1 || (s1.hoursCompleted || s1.hoursRequired || 400)}
                                            onChange={(e) => setCertCustomHours1(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-outline"
                                            placeholder="e.g. 400"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-mono text-[9px] text-secondary uppercase">Office Override</label>
                                          <input
                                            type="text"
                                            value={certCustomOffice || s1.office || ''}
                                            onChange={(e) => setCertCustomOffice(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-outline"
                                            placeholder="Office name"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block font-mono text-[9px] text-primary uppercase font-bold flex items-center justify-between">
                                            <span>Date From</span>
                                            <Calendar className="h-2.5 w-2.5 text-primary/70" />
                                          </label>
                                          <input
                                            type="text"
                                            value={certDateFrom1}
                                            onChange={(e) => setCertDateFrom1(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-primary transition-colors"
                                            placeholder="e.g. February 3, 2025"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-mono text-[9px] text-primary uppercase font-bold flex items-center justify-between">
                                            <span>Date To</span>
                                            <Calendar className="h-2.5 w-2.5 text-primary/70" />
                                          </label>
                                          <input
                                            type="text"
                                            value={certDateTo1}
                                            onChange={(e) => setCertDateTo1(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-primary transition-colors"
                                            placeholder="e.g. April 15, 2025"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Student 2 (Bottom Certificate) */}
                            <div className="space-y-3 p-3.5 bg-surface-container/40 border border-glass-stroke/60 rounded-xl">
                              <div className="flex items-center justify-between">
                                <label className="block font-mono text-[11px] text-amber-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">2</span>
                                  Student 2 (Bottom Certificate)
                                </label>
                                {selectedCertStudent2Id ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCertStudent2Id('')}
                                    className="font-mono text-[9px] text-secondary hover:text-error transition-colors underline cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                ) : (
                                  <span className="font-mono text-[9px] text-secondary bg-surface-container px-1.5 py-0.5 rounded">
                                    Optional
                                  </span>
                                )}
                              </div>

                              {(() => {
                                const s2 = students.find(s => s.id === selectedCertStudent2Id);
                                if (!s2) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => openPickerFor('student2')}
                                      className="w-full p-3.5 border-2 border-dashed border-amber-500/30 hover:border-amber-500/60 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-all flex items-center gap-3 text-left group cursor-pointer"
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Users className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-headline text-xs font-bold text-starlight-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                                          Choose Student 2 (Bottom Half) &rarr;
                                        </div>
                                        <div className="font-sans text-[11px] text-secondary truncate">
                                          Click to search roster, or leave empty for single cert
                                        </div>
                                      </div>
                                    </button>
                                  );
                                }

                                const fullName = formatStudentFullName(s2);
                                return (
                                  <div className="space-y-2">
                                    <div className="p-3 bg-surface-container/70 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2.5">
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-9 h-9 rounded-lg bg-amber-500 text-void-black font-bold font-mono text-xs flex items-center justify-center shrink-0 shadow-sm">
                                          {s2.firstName?.[0]}{s2.lastName?.[0]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-headline text-xs font-bold text-starlight-white truncate">
                                            {fullName}
                                          </div>
                                          <div className="font-mono text-[10px] text-secondary truncate">
                                            {s2.studentId} &bull; {s2.course}
                                          </div>
                                          <div className="font-sans text-[10px] text-secondary/80 truncate">
                                            {s2.school || s2.yearAndSection?.replace(/^School:\s*/i, '')}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => openPickerFor('student2')}
                                          className="p-1.5 rounded-lg bg-surface-container-high hover:bg-amber-500 hover:text-void-black text-secondary transition-all flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                                          title="Change Student 2"
                                        >
                                          <Search className="h-3 w-3" />
                                          <span className="hidden sm:inline">Change</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setSelectedCertStudent2Id('')}
                                          className="p-1.5 rounded-lg bg-surface-container-high hover:bg-rose-500/20 hover:text-rose-400 text-secondary transition-all font-mono text-[10px] cursor-pointer"
                                          title="Remove Student 2"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Student 2 Details Quick Tuning */}
                                    <div className="space-y-2 pt-1">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block font-mono text-[9px] text-secondary uppercase">Training Hours</label>
                                          <input
                                            type="number"
                                            value={certCustomHours2 || (s2.hoursCompleted || s2.hoursRequired || 400)}
                                            onChange={(e) => setCertCustomHours2(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-outline"
                                            placeholder="e.g. 400"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-mono text-[9px] text-secondary uppercase">Office Override</label>
                                          <input
                                            type="text"
                                            value={certCustomOffice || s2.office || ''}
                                            onChange={(e) => setCertCustomOffice(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-outline"
                                            placeholder="Office name"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block font-mono text-[9px] text-amber-400 uppercase font-bold flex items-center justify-between">
                                            <span>Date From</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCertDateFrom2(certDateFrom1);
                                                toast.info("Copied Start Date from Student 1");
                                              }}
                                              className="text-[8px] text-secondary hover:text-amber-400 font-sans underline cursor-pointer"
                                              title="Copy Date From from Student 1"
                                            >
                                              Copy S1
                                            </button>
                                          </label>
                                          <input
                                            type="text"
                                            value={certDateFrom2}
                                            onChange={(e) => setCertDateFrom2(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-amber-400 transition-colors"
                                            placeholder="e.g. February 3, 2025"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-mono text-[9px] text-amber-400 uppercase font-bold flex items-center justify-between">
                                            <span>Date To</span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setCertDateTo2(certDateTo1);
                                                toast.info("Copied End Date from Student 1");
                                              }}
                                              className="text-[8px] text-secondary hover:text-amber-400 font-sans underline cursor-pointer"
                                              title="Copy Date To from Student 1"
                                            >
                                              Copy S1
                                            </button>
                                          </label>
                                          <input
                                            type="text"
                                            value={certDateTo2}
                                            onChange={(e) => setCertDateTo2(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-amber-400 transition-colors"
                                            placeholder="e.g. April 15, 2025"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                              {/* Batch / Quick Pair Buttons */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!selectedCertStudentId && students.length > 0) {
                                      setSelectedCertStudentId(students[0].id);
                                      if (students.length > 1) {
                                        setSelectedCertStudent2Id(students[1].id);
                                      }
                                      return;
                                    }
                                    const idx = students.findIndex(s => s.id === selectedCertStudentId);
                                    if (idx !== -1 && idx < students.length - 1) {
                                      setSelectedCertStudent2Id(students[idx + 1].id);
                                      toast.success(`Paired with next student: ${students[idx + 1].lastName}, ${students[idx + 1].firstName}`);
                                    } else {
                                      toast.info("No next student found in roster.");
                                    }
                                  }}
                                  className="flex-1 py-1.5 px-2 bg-surface-container border border-glass-stroke hover:border-amber-500/50 rounded font-mono text-[10px] text-secondary hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  title="Automatically pair with the next student in roster order"
                                >
                                  <Users className="h-3 w-3 text-amber-400" />
                                  Pair Next Student
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const refId = selectedCertStudent2Id || selectedCertStudentId;
                                    const currentIdx = refId ? students.findIndex(s => s.id === refId) : -1;
                                    const nextIdx1 = currentIdx + 1;
                                    const nextIdx2 = currentIdx + 2;
                                    if (nextIdx1 < students.length) {
                                      setSelectedCertStudentId(students[nextIdx1].id);
                                      if (nextIdx2 < students.length) {
                                        setSelectedCertStudent2Id(students[nextIdx2].id);
                                        toast.success(`Next pair: ${students[nextIdx1].lastName} & ${students[nextIdx2].lastName}`);
                                      } else {
                                        setSelectedCertStudent2Id('');
                                        toast.success(`Last student: ${students[nextIdx1].lastName}`);
                                      }
                                    } else {
                                      toast.info("Reached end of student roster.");
                                    }
                                  }}
                                  className="py-1.5 px-2.5 bg-surface-container border border-glass-stroke hover:border-primary/50 rounded font-mono text-[10px] text-secondary hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                  title="Advance to next pair of 2 students"
                                >
                                  Next Pair &rarr;
                                </button>
                              </div>

                            {/* Common Issuance Date Configuration */}
                            <div className="space-y-3 pt-2 border-t border-glass-stroke/30">
                              <h4 className="font-mono text-[10px] text-secondary uppercase tracking-widest font-bold">
                                Official Award & Issuance Date
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block font-mono text-[9px] text-secondary uppercase">Day (e.g. 28th, 9th)</label>
                                  <input
                                    type="text"
                                    value={certGivenDay}
                                    onChange={(e) => setCertGivenDay(e.target.value)}
                                    className="w-full bg-surface-container border border-glass-stroke rounded font-sans text-xs text-starlight-white px-3 py-1.5 outline-none focus:border-outline"
                                    placeholder="28th"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block font-mono text-[9px] text-secondary uppercase">Month & Year</label>
                                  <input
                                    type="text"
                                    value={certGivenMonthYear}
                                    onChange={(e) => setCertGivenMonthYear(e.target.value)}
                                    className="w-full bg-surface-container border border-glass-stroke rounded font-sans text-xs text-starlight-white px-3 py-1.5 outline-none focus:border-outline"
                                    placeholder="April 2025"
                                  />
                                </div>
                              </div>
                              <p className="font-sans text-[11px] text-secondary italic">
                                Preview: &ldquo;Given this {certGivenDay} day of {certGivenMonthYear}.&rdquo;
                              </p>

                              {/* Sync Training Dates to Both Students */}
                              {selectedCertStudentId && selectedCertStudent2Id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCertDateFrom2(certDateFrom1);
                                    setCertDateTo2(certDateTo1);
                                    toast.success("Applied Student 1's training dates (From & To) to Student 2.");
                                  }}
                                  className="w-full py-1.5 px-3 bg-surface-container border border-glass-stroke hover:border-amber-400/50 rounded font-mono text-[10px] text-secondary hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="Sync Date From and Date To from Student 1 to Student 2"
                                >
                                  <Calendar className="h-3 w-3 text-amber-400" />
                                  Sync Training Dates (Copy S1 &rarr; S2)
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Landscape Single Card Mode */
                          <>
                            {/* Student Selector */}
                            <div className="space-y-3 p-3.5 bg-surface-container/40 border border-glass-stroke/60 rounded-xl">
                              <div className="flex items-center justify-between">
                                <label className="block font-mono text-[11px] text-primary uppercase tracking-wider font-bold flex items-center gap-1.5">
                                  <Award className="h-4 w-4 text-primary" />
                                  Recipient Intern (Landscape)
                                </label>
                                {selectedCertStudentId && (
                                  <span className="font-mono text-[9px] text-green-400 font-semibold bg-green-950/40 border border-green-800/50 px-1.5 py-0.5 rounded">
                                    Selected
                                  </span>
                                )}
                              </div>

                              {(() => {
                                const found = students.find(s => s.id === selectedCertStudentId);
                                if (!found) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => openPickerFor('student1')}
                                      className="w-full p-3.5 border-2 border-dashed border-primary/40 hover:border-primary rounded-xl bg-primary/5 hover:bg-primary/10 transition-all flex items-center gap-3 text-left group cursor-pointer"
                                    >
                                      <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <Search className="h-5 w-5" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-headline text-xs font-bold text-starlight-white group-hover:text-primary transition-colors flex items-center gap-1">
                                          Choose Intern &rarr;
                                        </div>
                                        <div className="font-sans text-[11px] text-secondary truncate">
                                          Click to search roster by name, ID, course, school...
                                        </div>
                                      </div>
                                    </button>
                                  );
                                }

                                const fullName = formatStudentFullName(found);
                                return (
                                  <div className="space-y-2">
                                    <div className="p-3 bg-surface-container/70 border border-primary/30 rounded-xl flex items-center justify-between gap-2.5">
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="w-9 h-9 rounded-lg bg-primary text-void-black font-bold font-mono text-xs flex items-center justify-center shrink-0 shadow-sm">
                                          {found.firstName?.[0]}{found.lastName?.[0]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-headline text-xs font-bold text-starlight-white truncate">
                                            {fullName}
                                          </div>
                                          <div className="font-mono text-[10px] text-secondary truncate">
                                            {found.studentId} &bull; {found.course}
                                          </div>
                                          <div className="font-sans text-[10px] text-secondary/80 truncate">
                                            {found.school || found.yearAndSection?.replace(/^School:\s*/i, '')}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => openPickerFor('student1')}
                                        className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-void-black text-secondary transition-all shrink-0 flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                                        title="Change Student"
                                      >
                                        <Search className="h-3 w-3" />
                                        <span className="hidden sm:inline">Change</span>
                                      </button>
                                    </div>

                                    {/* Student Details Quick Tuning */}
                                    <div className="space-y-2 pt-1">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block font-mono text-[9px] text-secondary uppercase">Training Hours</label>
                                          <input
                                            type="number"
                                            value={certCustomHours1 || certCustomHours || (found.hoursCompleted || found.hoursRequired || 400)}
                                            onChange={(e) => {
                                              setCertCustomHours1(e.target.value);
                                              setCertCustomHours(e.target.value);
                                            }}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-outline"
                                            placeholder="e.g. 400"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-mono text-[9px] text-secondary uppercase">Office Override</label>
                                          <input
                                            type="text"
                                            value={certCustomOffice || found.office || ''}
                                            onChange={(e) => setCertCustomOffice(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-outline"
                                            placeholder="Office name"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block font-mono text-[9px] text-primary uppercase font-bold flex items-center justify-between">
                                            <span>Date From</span>
                                            <Calendar className="h-2.5 w-2.5 text-primary/70" />
                                          </label>
                                          <input
                                            type="text"
                                            value={certDateFrom1}
                                            onChange={(e) => setCertDateFrom1(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-primary transition-colors"
                                            placeholder="e.g. February 3, 2025"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-mono text-[9px] text-primary uppercase font-bold flex items-center justify-between">
                                            <span>Date To</span>
                                            <Calendar className="h-2.5 w-2.5 text-primary/70" />
                                          </label>
                                          <input
                                            type="text"
                                            value={certDateTo1}
                                            onChange={(e) => setCertDateTo1(e.target.value)}
                                            className="w-full bg-surface-container-low border border-glass-stroke/70 rounded font-sans text-xs text-starlight-white px-2 py-1 outline-none focus:border-primary transition-colors"
                                            placeholder="e.g. April 15, 2025"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Official Award & Issuance Date */}
                            <div className="space-y-3 pt-2 border-t border-glass-stroke/30">
                              <h4 className="font-mono text-[10px] text-secondary uppercase tracking-widest font-bold">
                                Official Award & Issuance Date
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block font-mono text-[9px] text-secondary uppercase">Day (e.g. 28th, 9th)</label>
                                  <input
                                    type="text"
                                    value={certGivenDay}
                                    onChange={(e) => setCertGivenDay(e.target.value)}
                                    className="w-full bg-surface-container border border-glass-stroke rounded font-sans text-xs text-starlight-white px-3 py-1.5 outline-none focus:border-outline"
                                    placeholder="28th"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block font-mono text-[9px] text-secondary uppercase">Month & Year</label>
                                  <input
                                    type="text"
                                    value={certGivenMonthYear}
                                    onChange={(e) => setCertGivenMonthYear(e.target.value)}
                                    className="w-full bg-surface-container border border-glass-stroke rounded font-sans text-xs text-starlight-white px-3 py-1.5 outline-none focus:border-outline"
                                    placeholder="April 2025"
                                  />
                                </div>
                              </div>
                              <p className="font-sans text-[11px] text-secondary italic">
                                Preview: &ldquo;Given this {certGivenDay} day of {certGivenMonthYear}.&rdquo;
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Right Panel: Live Certificate Preview & Print Action */}
                      <div className="xl:col-span-8 space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-3 bg-void-black/40 p-3 rounded border border-glass-stroke/60 print:hidden">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            {certTemplateMode === 'portrait_2in1' ? (
                              <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
                                {selectedCertStudentId && selectedCertStudent2Id 
                                  ? '2 Students Loaded' 
                                  : selectedCertStudentId 
                                    ? '1 of 2 Students Loaded' 
                                    : 'No Students Selected'}
                              </span>
                            ) : (
                              <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
                                {selectedCertStudentId ? '1 Student Loaded' : 'No Student Selected'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Swap Students Button */}
                            {certTemplateMode === 'portrait_2in1' && selectedCertStudentId && selectedCertStudent2Id && (
                              <button
                                type="button"
                                onClick={() => {
                                  const temp = selectedCertStudentId;
                                  setSelectedCertStudentId(selectedCertStudent2Id);
                                  setSelectedCertStudent2Id(temp);
                                  const tempH = certCustomHours1;
                                  setCertCustomHours1(certCustomHours2);
                                  setCertCustomHours2(tempH);
                                  const tempFrom = certDateFrom1;
                                  setCertDateFrom1(certDateFrom2);
                                  setCertDateFrom2(tempFrom);
                                  const tempTo = certDateTo1;
                                  setCertDateTo1(certDateTo2);
                                  setCertDateTo2(tempTo);
                                  toast.info("Swapped Top and Bottom students.");
                                }}
                                className="bg-surface-container hover:bg-surface-container-high text-secondary hover:text-starlight-white font-mono text-[10px] rounded px-2.5 py-1.5 border border-glass-stroke transition-colors cursor-pointer"
                                title="Swap Student 1 and Student 2 positions"
                              >
                                Swap Top / Bottom
                              </button>
                            )}

                            {/* Print Button */}
                            <button
                              onClick={() => {
                                if (certTemplateMode === 'portrait_2in1') {
                                  if (!selectedCertStudentId && !selectedCertStudent2Id) {
                                    toast.error("Please select at least one student to print!");
                                    return;
                                  }
                                } else {
                                  if (!selectedCertStudentId) {
                                    toast.error("Please select a student first!");
                                    return;
                                  }
                                }
                                window.print();
                              }}
                              className="bg-primary text-void-black font-mono text-[10px] font-bold tracking-wider rounded px-3.5 py-1.5 flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,179,173,0.3)]"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              {certTemplateMode === 'portrait_2in1' ? 'PRINT 2-IN-1 CERTIFICATE' : 'PRINT CERTIFICATE'}
                            </button>
                          </div>
                        </div>

                        {/* Certificate Render Wrapper */}
                        {certTemplateMode === 'portrait_2in1' ? (
                          <PortraitTwoInOneCertificate
                            student1={students.find(s => s.id === selectedCertStudentId) || null}
                            student2={students.find(s => s.id === selectedCertStudent2Id) || null}
                            customHours1={certCustomHours1}
                            customHours2={certCustomHours2}
                            customDates1={certCustomDates1}
                            customDates2={certCustomDates2}
                            dateFrom1={certDateFrom1}
                            dateTo1={certDateTo1}
                            dateFrom2={certDateFrom2}
                            dateTo2={certDateTo2}
                            customOffice1={certCustomOffice}
                            customOffice2={certCustomOffice}
                            givenDay={certGivenDay}
                            givenMonthYear={certGivenMonthYear}
                            getCompanyName={getCompanyName}
                            onSelectStudent1Click={() => openPickerFor('student1')}
                            onSelectStudent2Click={() => openPickerFor('student2')}
                          />
                        ) : (
                          <LandscapeSingleCertificate
                            student={students.find(s => s.id === selectedCertStudentId) || null}
                            customHours={certCustomHours1 || certCustomHours}
                            customDates={certCustomDates1}
                            dateFrom={certDateFrom1}
                            dateTo={certDateTo1}
                            customOffice={certCustomOffice}
                            givenDay={certGivenDay}
                            givenMonthYear={certGivenMonthYear}
                            getCompanyName={getCompanyName}
                            onSelectStudentClick={() => openPickerFor('student1')}
                          />
                        )}

                        {/* Dynamic Print Page Orientation */}
                        <style>{`
                          @media print {
                            @page {
                              size: ${certTemplateMode === 'portrait_2in1' ? 'portrait' : 'landscape'};
                              margin: 0;
                            }
                          }
                        `}</style>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OJT Hour Tracker Tab */}
              {currentTab === 'ojt-tracker' && (
                <div className="animate-fade-in">
                  <OJTHourTrackerTab
                    timeLogs={timeLogs}
                    students={students}
                    userRole={currentUser?.role || ''}
                    userName={currentUser?.name || ''}
                    onRefresh={handleRefreshHourTracker}
                    onAddLog={handleAddTimeLog}
                    onUpdateLog={handleUpdateTimeLog}
                    onApproveLog={handleApproveTimeLog}
                    onRejectLog={handleRejectTimeLog}
                    onDeleteLog={handleDeleteTimeLog}
                    onBulkApprove={handleBulkApproveTimeLogs}
                    onAddLogsBulk={handleBulkAddLogs}
                  />
                </div>
              )}

              {/* Organizations Tab */}
              {currentTab === 'organizations' && (
                <div className="animate-fade-in">
                  <OrganizationsTab
                    organizations={organizations}
                    records={records}
                    students={students}
                    userRole={currentUser?.role || ''}
                    onCreateOrg={async (org) => {
                      const newOrg = await createOrganization(org);
                      setOrganizations([...organizations, newOrg]);
                    }}
                    onUpdateOrg={async (id, updates) => {
                      const updated = await updateOrganization(id, updates);
                      setOrganizations(organizations.map(o => o.id === id ? updated : o));
                    }}
                    onDeleteOrg={async (id) => {
                      await deleteOrganization(id);
                      setOrganizations(organizations.filter(o => o.id !== id));
                    }}
                    onSelectContract={(contractId) => {
                      const c = records.find(r => r.id === contractId);
                      if (c) {
                        setPreviewRecord(c);
                        setIsContractDetailModalOpen(true);
                      }
                    }}
                    selectedOrgId={selectedOrgId}
                    onSelectOrg={setSelectedOrgId}
                  />
                </div>
              )}

              {/* Settings Tab */}
              {currentTab === 'settings' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-headline text-3xl font-bold text-starlight-white mb-1">System Configuration</h2>
                    <p className="font-sans text-sm text-secondary">Manage administrative settings, institute letterhead metadata, and color themes.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Metadata and options */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="bg-void-black/80 border border-glass-stroke p-6 rounded shadow-[0_4px_24px_rgba(0,0,0,0.4)] space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-glass-stroke/50">
                          <SettingsIcon className="h-5 w-5 text-primary" />
                          <h3 className="font-headline text-lg font-bold text-starlight-white">Institution Profile</h3>
                        </div>

                        <form onSubmit={handleUpdateSettings} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">University / Organization Name</label>
                            <input
                              type="text"
                              value={settings.universityName}
                              onChange={(e) => setSettings({ ...settings, universityName: e.target.value })}
                              className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Department / Administrative Office</label>
                            <input
                              type="text"
                              value={settings.departmentName}
                              onChange={(e) => setSettings({ ...settings, departmentName: e.target.value })}
                              className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all"
                            />
                          </div>

                          <div className="pt-4 border-t border-glass-stroke/50 flex justify-end">
                            <button
                              type="submit"
                              className="px-5 py-2 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors rounded shadow-[0_0_15px_rgba(255,84,81,0.25)] cursor-pointer"
                            >
                              SAVE SYSTEM CHANGES
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Info Panel / Developer tools */}
                      <div className="bg-[#111e2e]/30 border border-[#233854]/40 p-6 rounded space-y-3">
                        <h4 className="text-xs font-mono font-bold text-[#60a5fa] uppercase tracking-wider">Cloud Network Diagnostics</h4>
                        <div className="text-xs text-secondary leading-relaxed space-y-1.5 font-mono">
                          <p>&bull; Machine Node: <span className="text-starlight-white">{settings.machineId}</span></p>
                          <p>&bull; Database ID: <span className="text-starlight-white">{settings.firebaseProjectId}</span></p>
                          <p>&bull; Local Database Mode: <span className="text-[#34d399]">Connected & Synced</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Beautiful Color Theme Selector */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-void-black/80 border border-glass-stroke p-6 rounded shadow-[0_4px_24px_rgba(0,0,0,0.4)] space-y-6">
                        <div className="flex items-center gap-2 pb-4 border-b border-glass-stroke/50">
                          <Award className="h-5 w-5 text-primary" />
                          <h3 className="font-headline text-lg font-bold text-starlight-white">Visual Interface Theme</h3>
                        </div>

                        <div className="space-y-3">
                          <p className="text-xs text-secondary leading-relaxed">
                            Personalize your application theme workspace. Select from the beautiful palettes below to change primary accents, highlights, and subtle glows instantly:
                          </p>

                          <div className="grid grid-cols-1 gap-3 pt-2">
                            {THEMES.map((theme) => {
                              const isActive = currentThemeId === theme.id;
                              return (
                                <button
                                  key={theme.id}
                                  type="button"
                                  onClick={() => {
                                    setCurrentThemeId(theme.id);
                                    toast.success(`Theme updated to ${theme.name}!`);
                                  }}
                                  className={`w-full text-left p-4 rounded border transition-all cursor-pointer flex items-center justify-between ${
                                    isActive
                                      ? 'bg-surface-container border-primary shadow-[0_0_15px_rgba(255,179,173,0.15)]'
                                      : 'bg-surface-container/40 border-glass-stroke hover:bg-surface-container/70 hover:border-glass-stroke-highest'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    {/* Color Indicator Dot */}
                                    <div className={`w-3.5 h-3.5 rounded-full ${theme.bgDot} shadow-lg shrink-0`} />
                                    <div>
                                      <div className="text-xs font-bold text-starlight-white font-sans">{theme.name}</div>
                                      <div className="text-[10px] text-secondary mt-0.5 font-sans">{theme.desc}</div>
                                    </div>
                                  </div>
                                  
                                  {isActive && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-void-black shrink-0">
                                      <Check className="h-3 w-3 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </main>

      {/* Record Edit / Create Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="record-modal-overlay">
          <div className="bg-void-black/95 rounded border border-glass-stroke shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <header className="p-6 border-b border-glass-stroke flex items-center justify-between bg-surface-container/30">
              <h3 className="font-bold text-starlight-white font-headline text-lg">
                {editingRecord ? `Edit ${recordType} Record` : `Create New ${recordType} Record`}
              </h3>
              <button 
                onClick={() => setIsRecordModalOpen(false)}
                className="text-secondary hover:text-starlight-white hover:bg-surface-container p-1.5 rounded transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleSaveRecord} className="flex-1 overflow-y-auto p-6 space-y-6 text-starlight-white">
              {/* If LO, render the original common title, description, and status */}
              {recordType === 'LO' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Title / Subject</label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Legal Opinion on Data Disclosure"
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Status</label>
                      <CustomSelect
                        value={formStatus}
                        onChange={(val) => setFormStatus(val)}
                        options={[
                          { value: 'Issued', label: 'Issued' },
                          { value: 'Archived', label: 'Archived' },
                        ]}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Description / Summary Scope</label>
                    <textarea
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                    />
                  </div>
                </>
              )}

              {/* MOA Specific Fields (Customized layout according to user request) */}
              {recordType === 'MOA' && (
                <div className="space-y-6">
                  {/* School/University field with suggestions */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-starlight-white mb-1">School/University</label>
                    <input
                      type="text"
                      required
                      value={formSchool}
                      onChange={(e) => {
                        setFormSchool(e.target.value);
                        setShowSchoolDropdown(true);
                      }}
                      onFocus={() => setShowSchoolDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSchoolDropdown(false), 200)}
                      placeholder="Enter or select school name"
                      className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                    />
                    <p className="text-[10px] text-secondary mt-1">
                      Recent school entries appear as you type. Use the x button to remove suggestions.
                    </p>

                    {showSchoolDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-void-black border border-glass-stroke rounded shadow-2xl z-50 max-h-48 overflow-y-auto">
                        {schoolSuggestions
                          .filter(s => s.toLowerCase().includes(formSchool.toLowerCase()))
                          .map((school, i) => (
                            <div 
                              key={i} 
                              onMouseDown={() => {
                                setFormSchool(school);
                                setShowSchoolDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-surface-container-highest flex items-center justify-between text-sm text-starlight-white cursor-pointer"
                            >
                              <span>{school}</span>
                              <button 
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeSchoolSuggestion(school);
                                }}
                                className="text-secondary hover:text-red-400 p-1"
                                title="Remove suggestion"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        {schoolSuggestions.filter(s => s.toLowerCase().includes(formSchool.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-xs text-secondary italic">
                            No matching recent suggestions. Press enter/continue to save as new.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Course field with suggestions */}
                  <div className="relative">
                    <label className="block text-xs font-semibold text-starlight-white mb-1">Course</label>
                    <input
                      type="text"
                      required
                      value={formCourse}
                      onChange={(e) => {
                        setFormCourse(e.target.value);
                        setShowCourseDropdown(true);
                      }}
                      onFocus={() => setShowCourseDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCourseDropdown(false), 200)}
                      placeholder="Enter or select course name"
                      className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                    />
                    <p className="text-[10px] text-secondary mt-1">
                      Suggestions are stored separately from records and can be deleted anytime.
                    </p>

                    {showCourseDropdown && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-void-black border border-glass-stroke rounded shadow-2xl z-50 max-h-48 overflow-y-auto">
                        {courseSuggestions
                          .filter(c => c.toLowerCase().includes(formCourse.toLowerCase()))
                          .map((course, i) => (
                            <div 
                              key={i} 
                              onMouseDown={() => {
                                setFormCourse(course);
                                setShowCourseDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-surface-container-highest flex items-center justify-between text-sm text-starlight-white cursor-pointer"
                            >
                              <span>{course}</span>
                              <button 
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeCourseSuggestion(course);
                                }}
                                className="text-secondary hover:text-red-400 p-1"
                                title="Remove suggestion"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        {courseSuggestions.filter(c => c.toLowerCase().includes(formCourse.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-xs text-secondary italic">
                            No matching recent suggestions. Press enter/continue to save as new.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hours field */}
                    <div>
                      <label className="block text-xs font-semibold text-starlight-white mb-1">Hours</label>
                      <input
                        type="number"
                        required
                        value={formHours}
                        onChange={(e) => setFormHours(e.target.value)}
                        placeholder="Enter hours"
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all"
                      />
                    </div>

                    {/* Date Received field */}
                    <div>
                      <label className="block text-xs font-semibold text-starlight-white mb-1">Date Received</label>
                      <input
                        type="date"
                        required
                        value={formIssueDate}
                        onChange={(e) => setFormIssueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status field */}
                    <div>
                      <label className="block text-xs font-semibold text-starlight-white mb-1">Document Status</label>
                      <CustomSelect
                        value={formStatus}
                        onChange={(val) => setFormStatus(val)}
                        options={[
                          { value: 'Active', label: 'Active' },
                          { value: 'Expiring Soon', label: 'Expiring Soon' },
                          { value: 'Expired', label: 'Expired' },
                          { value: 'Renewed', label: 'Renewed' },
                          { value: 'Archived', label: 'Archived' },
                        ]}
                        className="w-full"
                      />
                    </div>

                    {/* Workflow Stage field */}
                    <div>
                      <label className="block text-xs font-semibold text-starlight-white mb-1">Document Record Stage</label>
                      <CustomSelect
                        value={formWorkflowStage}
                        onChange={(val) => setFormWorkflowStage(val)}
                        options={[
                          { value: 'Approved', label: 'Approved' },
                          { value: 'Signed / Executed', label: 'Signed / Executed' },
                          { value: 'Archived', label: 'Archived' },
                        ]}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Input the students involved in the respective MOA */}
                  <div className="border-t border-glass-stroke/30 pt-4">
                    <label className="block text-xs font-semibold text-starlight-white mb-1.5">Students Involved</label>
                    <div className="bg-surface-container border border-glass-stroke rounded p-4 space-y-4">
                      {/* Student search & filter */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search students to link to this MOA..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-surface-container-highest border border-glass-stroke rounded text-xs text-starlight-white placeholder-secondary outline-none focus:border-outline"
                        />
                      </div>

                      {/* List of students with checkboxes */}
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 border border-glass-stroke/30 rounded p-2 bg-void-black/30">
                        {students.filter(stud => 
                          `${stud.firstName} ${stud.lastName}`.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          stud.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          stud.course.toLowerCase().includes(studentSearchQuery.toLowerCase())
                        ).length === 0 ? (
                          <p className="text-xs text-secondary italic p-2 text-center">No matching students found.</p>
                        ) : (
                          students.filter(stud => 
                            `${stud.firstName} ${stud.lastName}`.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                            stud.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                            stud.course.toLowerCase().includes(studentSearchQuery.toLowerCase())
                          ).map(stud => {
                            const isSelected = formStudentIds.includes(stud.studentId) || formStudentIds.includes(stud.id);
                            return (
                              <label key={stud.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-highest/50 cursor-pointer text-xs transition-all">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormStudentIds([...formStudentIds, stud.id]);
                                    } else {
                                      setFormStudentIds(formStudentIds.filter(id => id !== stud.id && id !== stud.studentId));
                                    }
                                  }}
                                  className="rounded text-primary focus:ring-primary border-glass-stroke bg-surface-container-highest"
                                />
                                <div className="flex-1">
                                  <span className="font-semibold text-starlight-white">{stud.lastName}, {stud.firstName}</span>
                                  <span className="text-[10px] text-secondary ml-2">ID: {stud.studentId} &bull; {stud.course} &bull; {stud.school}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>

                      {/* Quick Add Student Form toggler */}
                      <div className="border-t border-glass-stroke/30 pt-3">
                        {showQuickAddStudent ? (
                          <div className="space-y-3 bg-void-black/40 p-3 rounded border border-glass-stroke/20">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Quick Enroll & Link Student</span>
                              <button 
                                type="button" 
                                onClick={() => setShowQuickAddStudent(false)}
                                className="text-xs text-secondary hover:text-starlight-white"
                              >
                                Cancel
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="First Name"
                                value={quickFirst}
                                onChange={(e) => setQuickFirst(e.target.value)}
                                className="px-2.5 py-1.5 bg-surface-container-highest border border-glass-stroke rounded text-xs text-starlight-white outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Last Name"
                                value={quickLast}
                                onChange={(e) => setQuickLast(e.target.value)}
                                className="px-2.5 py-1.5 bg-surface-container-highest border border-glass-stroke rounded text-xs text-starlight-white outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Course (Default: same as MOA)"
                                value={quickCourse}
                                onChange={(e) => setQuickCourse(e.target.value)}
                                className="px-2.5 py-1.5 bg-surface-container-highest border border-glass-stroke rounded text-xs text-starlight-white outline-none"
                              />
                              <input
                                type="text"
                                placeholder="School/University (Default: same as MOA)"
                                value={quickSchool}
                                onChange={(e) => setQuickSchool(e.target.value)}
                                className="px-2.5 py-1.5 bg-surface-container-highest border border-glass-stroke rounded text-xs text-starlight-white outline-none"
                              />
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={handleQuickAddStudent}
                                className="bg-primary/20 hover:bg-primary hover:text-void-black text-white text-xs py-1.5 px-4 border border-glass-stroke rounded transition-all w-full md:w-auto"
                              >
                                Add Student
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickFirst('');
                              setQuickLast('');
                              setQuickCourse(formCourse || '');
                              setQuickSchool(formSchool || '');
                              setShowQuickAddStudent(true);
                            }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Quick Enroll New Student
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LO Specific Fields */}
              {recordType === 'LO' && (
                <div className="space-y-4 border-t border-glass-stroke/40 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Requested By (Office/Person)</label>
                      <input
                        type="text"
                        value={formReqBy}
                        onChange={(e) => setFormReqBy(e.target.value)}
                        placeholder="e.g. Office of the Registrar"
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Request Date</label>
                        <input
                          type="date"
                          value={formReqDate}
                          onChange={(e) => setFormReqDate(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Issue Date</label>
                        <input
                          type="date"
                          value={formIssueDate}
                          onChange={(e) => setFormIssueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Legal Question / Query Text</label>
                      <textarea
                        value={formQuery}
                        onChange={(e) => setFormQuery(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Legal Conclusion / Resolution</label>
                      <textarea
                        value={formConclusion}
                        onChange={(e) => setFormConclusion(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Assigned Counsel</label>
                      <input
                        type="text"
                        value={formCounsel}
                        onChange={(e) => setFormCounsel(e.target.value)}
                        placeholder="e.g. Atty. Clara Reyes"
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Cited References (Comma Separated)</label>
                      <input
                        type="text"
                        value={formReferences}
                        onChange={(e) => setFormReferences(e.target.value)}
                        placeholder="e.g. Republic Act No. 10173, NPC Advisory 2018-031"
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Fields - Notes & PDF Attachments Storage for MOA & LO */}
              <div className="space-y-4 border-t border-glass-stroke/40 pt-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Internal Notes / Remarks</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide any context or internal remarks..."
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>

                {/* Drag and Drop Upload Element */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Uploaded Approved Document (PDF Storage Repository)</label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-attachment-input-browse')?.click()}
                    className={`border-2 border-dashed p-6 rounded flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      isDragging 
                        ? 'border-primary bg-primary-container/10' 
                        : 'border-glass-stroke bg-surface-container/20 hover:bg-surface-container-highest/10 hover:border-primary'
                    }`}
                  >
                    <Upload className={`h-8 w-8 mb-2 ${isDragging ? 'text-primary animate-bounce' : 'text-secondary'}`} />
                    <p className="text-sm font-bold text-starlight-white">Upload Approved PDF Document</p>
                    <p className="text-xs text-secondary mt-1">Drag & Drop signed PDF files here, or click to browse (up to 50MB)</p>
                    
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,.pdf,image/*,.doc,.docx"
                      onChange={handleAttachmentUpload}
                      className="hidden"
                      id="file-attachment-input-browse"
                    />
                    <button
                      type="button"
                      className="mt-3 px-3 py-1.5 bg-surface-container-highest border border-glass-stroke rounded text-xs text-starlight-white font-mono hover:bg-outline hover:border-outline transition-colors cursor-pointer"
                    >
                      BROWSE FILES
                    </button>
                  </div>

                  {/* List of attachments inside form */}
                  {formAttachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">Stored Document Attachments</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {formAttachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between p-2 bg-[#0e0e0e]/60 border border-glass-stroke rounded text-xs font-mono text-starlight-white">
                            <span className="font-semibold truncate w-40" title={att.fileName}>
                              {att.fileName}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-secondary">{(att.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                              <button
                                type="button"
                                onClick={() => removeAttachment(att.id)}
                                className="text-primary hover:bg-[#2d1215] p-1 rounded cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-glass-stroke">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-highest border border-glass-stroke rounded font-mono text-xs text-starlight-white hover:bg-outline hover:border-outline transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] rounded cursor-pointer"
                >
                  SAVE RECORD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Edit / Create Modal */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="student-modal-overlay">
          <div className="bg-void-black/95 rounded border border-glass-stroke shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <header className="p-6 border-b border-glass-stroke flex items-center justify-between bg-surface-container/30">
              <h3 className="font-bold text-starlight-white font-headline text-lg">
                {editingStudent ? 'Edit Student Record' : 'Add New OJT Student'}
              </h3>
              <button 
                onClick={() => setIsStudentModalOpen(false)}
                className="text-secondary hover:text-starlight-white hover:bg-surface-container p-1.5 rounded transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleSaveStudent} className="flex-1 overflow-y-auto p-6 space-y-5 text-starlight-white">
              {/* Row 1: Name Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={studFirst}
                    onChange={(e) => setStudFirst(e.target.value)}
                    placeholder="First Name"
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Middle Name</label>
                  <input
                    type="text"
                    value={studMiddleName}
                    onChange={(e) => setStudMiddleName(e.target.value)}
                    placeholder="Middle Name"
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={studLast}
                    onChange={(e) => setStudLast(e.target.value)}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Program & School */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Program/Course</label>
                  <input
                    type="text"
                    required
                    value={studCourse}
                    onChange={(e) => setStudCourse(e.target.value)}
                    placeholder="Program/Course"
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">School</label>
                  <input
                    type="text"
                    required
                    value={studSchool}
                    onChange={(e) => setStudSchool(e.target.value)}
                    placeholder="School"
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all"
                  />
                </div>
              </div>

              {/* Header section: On-the-Job Training Details */}
              <div className="py-2 border-t border-glass-stroke/30 text-center">
                <h4 className="text-sm font-bold text-starlight-white font-headline">On-the-Job Training Details</h4>
              </div>

              {/* Row 3: OJT Hours & Start Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">OJT Hours</label>
                  <input
                    type="number"
                    required
                    value={studReqHours}
                    onChange={(e) => setStudReqHours(Number(e.target.value))}
                    placeholder="OJT Hours"
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={studStart}
                    onChange={(e) => setStudStart(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Est. Completion Date & Finish Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Est. Completion</label>
                  <div className="w-full px-3 py-2 bg-surface-container-highest border border-glass-stroke/50 rounded text-sm text-secondary font-mono flex items-center justify-between cursor-not-allowed h-[38px] overflow-hidden">
                    {studStart && studReqHours ? (
                      <span className="truncate text-starlight-white font-bold">
                        {new Date(new Date(studStart).getTime() + (Number(studReqHours) / 40) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                    <span className="text-[9px] uppercase tracking-wider text-primary ml-2 flex-shrink-0">Estimate</span>
                  </div>
                  <p className="text-[10px] text-secondary mt-1">Calculated expected completion timeline.</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">Finish Date</label>
                    <span className="text-[9px] text-primary/80 font-mono uppercase tracking-wider">Optional</span>
                  </div>
                  <input
                    type="date"
                    value={studEnd}
                    onChange={(e) => setStudEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                  />
                  <p className="text-[10px] text-secondary mt-1">Leave blank if the intern is not yet finished.</p>
                </div>
              </div>

              {/* Legacy Hours Override — only show when editing or when the student started a while ago */}
              <div className="bg-surface-container/20 border border-glass-stroke/30 rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">Legacy / Placeholder Hours</label>
                  <span className="text-[9px] text-primary font-mono uppercase tracking-wider">Optional Override</span>
                </div>
                <p className="text-[10px] text-secondary leading-relaxed">
                  Auto-fills completed hours for students whose OJT started long ago but have no DTR logs in the system.
                  Leave blank to let the system auto-calculate. Set to <strong className="text-starlight-white">0</strong> to disable auto-maxing.
                </p>
                <input
                  type="number"
                  min="0"
                  value={studLegacyHours}
                  onChange={(e) => setStudLegacyHours(e.target.value)}
                  placeholder={`Auto (${studStart && studReqHours ? (() => { const start = new Date(studStart).getTime(); const msReq = ((Number(studReqHours) / 40) + 4) * 7 * 24 * 60 * 60 * 1000; return Date.now() > start + msReq ? studReqHours + ' hrs — will auto-max' : '0 hrs — too recent'; })() : 'enter start date & hours first'})`}
                  className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all font-mono"
                />
              </div>

              {/* Row 5: Office & Student Home Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Assigned Office</label>
                  <input
                    type="text"
                    required
                    value={studOffice}
                    onChange={(e) => setStudOffice(e.target.value)}
                    placeholder="e.g. Provincial Legal Office"
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">Student Home Address</label>
                    <span className="text-[9px] text-secondary font-mono uppercase tracking-wider">Optional</span>
                  </div>
                  <input
                    type="text"
                    value={studAddress}
                    onChange={(e) => setStudAddress(e.target.value)}
                    placeholder="e.g. Brgy. Poblacion, Lingayen, Pangasinan"
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-glass-stroke">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-highest border border-glass-stroke rounded font-mono text-xs text-starlight-white hover:bg-outline hover:border-outline transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] rounded cursor-pointer"
                >
                  SAVE RECORD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Bulk Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" id="student-import-modal-overlay">
          <div className="bg-void-black/95 rounded border border-glass-stroke shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <header className="p-6 border-b border-glass-stroke flex items-center justify-between bg-surface-container/30">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-starlight-white font-headline text-lg">
                  Import Student Records (Bulk)
                </h3>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-secondary hover:text-starlight-white hover:bg-surface-container p-1.5 rounded transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-starlight-white">
              <div className="bg-[#162a42]/30 border border-[#2a4c77] rounded p-4 text-xs text-secondary space-y-2 leading-relaxed font-sans">
                <p className="font-bold text-starlight-white font-mono uppercase tracking-wider">Supported Import Formats:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>JSON Array:</strong> An array of student objects (with <code>firstName</code>, <code>lastName</code>, <code>studentId</code>, <code>program</code> / <code>course</code>, <code>ojtHours</code>, etc.).</li>
                  <li><strong>CSV / Tabular Text:</strong> Copy-pasted rows from Excel/Google Sheets, with or without a header row.</li>
                </ul>
                <p className="mt-2 text-[11px] leading-relaxed text-[#60a5fa] font-mono">
                  💡 <strong>Smart Field Aligner:</strong> Our importer automatically maps similar field names (e.g., <code>program</code> to <code>course</code>) and fixes common spreadsheet offset errors (like shifted STEM program arrays).
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">Paste student records (JSON or CSV rows):</label>
                  <button
                    type="button"
                    onClick={() => {
                      setImportRawText(JSON.stringify([
                        {
                          "firstName": "Juel Jerome",
                          "middleInitial": "C",
                          "lastName": "De Castro",
                          "program": "Bachelor of Science in Computer Science",
                          "school": "Pangasinan State University - Lingayen Campus",
                          "ojtHours": "480",
                          "startDate": "2026-02-03",
                          "endDate": "2026-05-13",
                          "office": "Human Resource Management and Development Office",
                          "address": "Capitol Compound, Lingayen, Pangasinan"
                        },
                        {
                          "firstName": "AMBER MIKAELA",
                          "middleInitial": "S",
                          "lastName": "INFANTE",
                          "program": "Science",
                          "school": "Technology",
                          "ojtHours": "Engineering",
                          "startDate": "and Mathematics",
                          "endDate": "Pangasinan National High School",
                          "office": "80",
                          "address": "2025-11-17"
                        }
                      ], null, 2));
                      toast.success("Loaded sample JSON into input box!");
                    }}
                    className="text-xs font-mono text-primary hover:underline cursor-pointer"
                  >
                    LOAD SAMPLE DATA
                  </button>
                </div>
                <textarea
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  placeholder={`Paste JSON array like:\n[\n  { "firstName": "Juel Jerome", "lastName": "De Castro", "program": "BSCS", "ojtHours": "480" }\n]\n\nOr paste CSV tab-separated rows copied from Excel.`}
                  className="w-full h-64 px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs font-mono text-starlight-white placeholder-secondary focus:border-outline focus:bg-surface-container-highest outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                />
              </div>

              {/* Simple file upload trigger */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">Or Upload a .json or .csv File:</label>
                <input
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      if (evt.target?.result) {
                        setImportRawText(evt.target.result as string);
                        toast.success(`Loaded file: ${file.name}`);
                      }
                    };
                    reader.readAsText(file);
                  }}
                  className="w-full text-xs text-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-mono file:bg-surface-container file:text-starlight-white hover:file:bg-surface-container-highest cursor-pointer font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-glass-stroke bg-void-black">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportRawText('');
                }}
                className="px-4 py-2 bg-surface-container-highest border border-glass-stroke rounded font-mono text-xs text-starlight-white hover:bg-outline hover:border-outline transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleProcessImport}
                className="px-4 py-2 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] rounded cursor-pointer flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                PROCESS AND IMPORT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview & Document View Modal */}
      {isPrintPreviewOpen && previewRecord && (
        <div className="fixed inset-0 bg-void-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto print:absolute print:inset-0 print:p-0 print:bg-white print:block" id="print-preview-overlay">
          <div className="bg-void-black/95 rounded border border-glass-stroke shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col print:shadow-none print:border-none print:w-full print:max-h-none print:rounded-none animate-scale-in">
            
            {/* Header Control Panel - HIDDEN during print */}
            <header className="p-4 border-b border-glass-stroke flex items-center justify-between bg-surface-container/30 print:hidden flex-shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                <span className="font-mono text-xs uppercase font-bold text-starlight-white tracking-wider">Print Preview Mode - {previewRecord.type} Document</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerPrint}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors rounded shadow-[0_0_12px_rgba(255,84,81,0.2)] cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Print Now
                </button>
                <button 
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="text-secondary hover:text-starlight-white hover:bg-surface-container p-1.5 rounded transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-surface-container/10 print:bg-white print:p-0">
              
              {previewRecord.type === 'MOA' ? (
                /* MOA Certificate Styling - full A4/Letter size container */
                <div 
                  className="mx-auto w-[210mm] min-h-[297mm] bg-white border-[16px] border-double border-slate-900 p-12 flex flex-col justify-between shadow-lg font-serif text-slate-950 print:shadow-none print:border-slate-900 print:my-0 print:p-8"
                  id="moa-print-layout-container"
                >
                  {/* Seal/Ornament */}
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold tracking-widest text-lg border-2 border-amber-400">
                      OJT
                    </div>
                    <h1 className="text-2xl font-bold tracking-wider text-slate-900 mt-4 uppercase font-serif">
                      {settings.universityName}
                    </h1>
                    <p className="text-xs text-slate-500 font-mono mt-1 tracking-widest uppercase">
                      {settings.departmentName}
                    </p>
                    <div className="w-32 h-1 bg-amber-400 mx-auto mt-3" />
                  </div>

                  {/* Body */}
                  <div className="text-center space-y-6 my-8">
                    <h2 className="text-3xl font-bold italic text-slate-800 uppercase tracking-wide">
                      Memorandum of Agreement
                    </h2>
                    <p className="text-xs font-mono text-slate-500 uppercase">
                      Control Number: {previewRecord.controlNumber}
                    </p>

                    <p className="text-sm leading-relaxed text-slate-700 text-justify max-w-lg mx-auto">
                      This formal Memorandum of Agreement is executed and entered into, establishing an official partnership for industry training and certification, by and between:
                    </p>

                    {/* Parties */}
                    <div className="space-y-4">
                      {previewRecord.parties?.map((party, idx) => (
                        <div key={idx}>
                          {idx > 0 && <p className="text-xs font-semibold italic text-slate-400 my-1">— AND —</p>}
                          <h3 className="text-lg font-bold text-slate-900 uppercase">{party}</h3>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs leading-relaxed text-slate-500 text-justify max-w-lg mx-auto mt-4">
                      {previewRecord.description || 'This agreement establishes cooperation to provide students with industrial experience, skills building, and expert mentorship to meet global standards of technology and practice.'}
                    </p>
                  </div>

                  {/* Signatures */}
                  <div>
                    <div className="grid grid-cols-2 gap-8 text-center mt-12">
                      {previewRecord.signatories && previewRecord.signatories.length > 0 ? (
                        previewRecord.signatories.map((sig, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="w-48 border-b border-slate-400 mx-auto pt-8" />
                            <p className="text-xs font-bold text-slate-800">{sig}</p>
                            <p className="text-[10px] text-slate-400">Authorized Representative</p>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="space-y-1">
                            <div className="w-48 border-b border-slate-400 mx-auto pt-8" />
                            <p className="text-xs font-bold text-slate-800">University President</p>
                            <p className="text-[10px] text-slate-400">Representing {settings.universityName}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="w-48 border-b border-slate-400 mx-auto pt-8" />
                            <p className="text-xs font-bold text-slate-800">Company Director</p>
                            <p className="text-[10px] text-slate-400">Representing Partner Organization</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer terms */}
                    <div className="border-t border-slate-200 pt-4 mt-12 text-center text-[10px] text-slate-400 font-mono space-y-1">
                      <div>Issued on {previewRecord.issueDate || '—'} | Valid until: {previewRecord.isIndefinite ? 'Indefinite Validity' : (previewRecord.expirationDate || '—')}</div>
                      <div>System Verification Code: {previewRecord.id.substring(0, 18).toUpperCase()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Legal Opinion Document Styling */
                <div 
                  className="mx-auto w-[210mm] min-h-[297mm] bg-white border border-slate-200 p-16 shadow-lg font-serif text-slate-900 print:shadow-none print:border-none print:p-8"
                  id="lo-print-layout-container"
                >
                  {/* Legal Office Letterhead */}
                  <div className="text-center border-b-2 border-slate-900 pb-4">
                    <h1 className="text-xl font-bold tracking-tight uppercase font-serif">{settings.universityName}</h1>
                    <h2 className="text-sm uppercase tracking-wider text-slate-600 font-sans mt-0.5">{settings.departmentName}</h2>
                    <p className="text-[10px] italic text-slate-400 mt-1">Confidential & Privileged Legal Communication</p>
                  </div>

                  {/* Memorandum Header Info */}
                  <div className="grid grid-cols-4 gap-y-2 gap-x-4 my-8 text-sm border-b border-slate-200 pb-4 font-sans">
                    <div className="font-bold text-slate-700">TO:</div>
                    <div className="col-span-3 text-slate-900">{previewRecord.requestedBy}</div>

                    <div className="font-bold text-slate-700">FROM:</div>
                    <div className="col-span-3 text-slate-900 font-semibold">{previewRecord.assignedCounsel || 'Chief Legal Counsel'}</div>

                    <div className="font-bold text-slate-700">DATE:</div>
                    <div className="col-span-3 text-slate-900">{previewRecord.issueDate || '—'}</div>

                    <div className="font-bold text-slate-700">RE:</div>
                    <div className="col-span-3 text-slate-900 font-bold uppercase">{previewRecord.title}</div>

                    <div className="font-bold text-slate-700">CONTROL NO:</div>
                    <div className="col-span-3 text-slate-800 font-mono text-xs">{previewRecord.controlNumber}</div>
                  </div>

                  {/* Content sections */}
                  <div className="space-y-6 text-sm leading-relaxed text-justify">
                    <div>
                      <h3 className="font-sans font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">I. Legal Query / Question Raised</h3>
                      <p className="text-slate-800 italic bg-slate-50 p-3 border-l-4 border-slate-400 rounded-r">
                        "{previewRecord.queryText || 'No legal query has been explicitly documented.'}"
                      </p>
                    </div>

                    <div>
                      <h3 className="font-sans font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">II. Legal Conclusion & Resolution</h3>
                      <p className="text-slate-800">
                        {previewRecord.conclusion || 'Pending formal legal resolution.'}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-sans font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">III. Legal Analysis & Discussion</h3>
                      <p className="text-slate-700">
                        {previewRecord.description || 'No detailed analysis has been provided for this draft opinion.'}
                      </p>
                    </div>

                    {previewRecord.references && previewRecord.references.length > 0 && (
                      <div>
                        <h3 className="font-sans font-bold text-slate-800 uppercase tracking-wider text-xs mb-2">IV. Cited Regulations & References</h3>
                        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                          {previewRecord.references.map((ref, idx) => (
                            <li key={idx}>{ref}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {previewRecord.notes && (
                      <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 italic">
                        <strong>Office Notes:</strong> {previewRecord.notes}
                      </div>
                    )}
                  </div>

                  {/* Footer Signatures */}
                  <div className="mt-16 pt-8 border-t border-slate-200">
                    <div className="flex justify-end text-center">
                      <div className="w-64 space-y-1">
                        <div className="border-b border-slate-400 pt-8" />
                        <p className="text-xs font-bold text-slate-800 uppercase">{previewRecord.assignedCounsel || 'Chief Legal Counsel'}</p>
                        <p className="text-[10px] text-slate-400">Office of Legal Counsel Representative</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Advanced Lifecycle & Collaboration Workspace Modal */}
      {isContractDetailModalOpen && previewRecord && (
        <ContractWorkspace
          contract={previewRecord}
          organizations={organizations}
          onClose={() => {
            setIsContractDetailModalOpen(false);
            setPreviewRecord(null);
          }}
          onUpdateContract={async (id, updates) => {
            try {
              const updated = await updateRecord(id, updates);
              setRecords(records.map(r => r.id === id ? updated : r));
              setPreviewRecord(updated);
              toast.success('Agreement updated in lifecycle workspace.');
            } catch (err) {
              toast.error('Failed to update contract version or tasks.');
            }
          }}
          userRole={currentUser?.role || ''}
        />
      )}


      {isStudentDtrModalOpen && selectedDtrStudent && (
        <StudentDtrModal
          selectedDtrStudent={selectedDtrStudent}
          timeLogs={timeLogs}
          canApprove={currentUser?.role === 'Administrator' || currentUser?.role === 'OJT Coordinator'}
          onApproveLog={handleApproveTimeLog}
          onRejectLog={handleRejectTimeLog}
          onDeleteLog={handleDeleteTimeLog}
          onClose={() => setIsStudentDtrModalOpen(false)}
        />
      )}

      {/* Certificate Student Search Picker Modal */}
      {isCertPickerOpen && (
        <StudentCertificatePickerModal
          isOpen={isCertPickerOpen}
          targetSlot={certPickerSlot}
          students={students}
          currentSelectedId={certPickerSlot === 'student1' ? selectedCertStudentId : selectedCertStudent2Id}
          otherSlotSelectedId={certPickerSlot === 'student1' ? selectedCertStudent2Id : selectedCertStudentId}
          onSelectStudent={handleSelectCertStudent}
          onClose={() => setIsCertPickerOpen(false)}
        />
      )}

      {/* Sticky Developer Facebook Contact Button & Phone Card (Dashboard Only) */}
      <div
        className={`group/dev fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 transition-all duration-700 ease-in-out print:hidden ${
          currentTab === 'dashboard'
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
        }`}
      >
        {/* Contact Phone Number Card (Reveals smoothly on hover like a page) */}
        <div className="bg-void-black/95 backdrop-blur-xl border border-glass-stroke/80 text-white px-3 py-1.5 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] opacity-0 translate-y-3 pointer-events-none group-hover/dev:opacity-100 group-hover/dev:translate-y-0 group-hover/dev:pointer-events-auto transition-all duration-700 ease-in-out flex items-center gap-2 border-outline/30">
          <Phone className="w-3 h-3 text-starlight-white/60" />
          <a
            href="tel:+639691637944"
            className="text-[11px] font-normal text-starlight-white/90 hover:text-starlight-white transition-colors tracking-wide font-sans"
          >
            +639691637944
          </a>
        </div>

        {/* Main Facebook Button */}
        <a
          href="https://www.facebook.com/Loche.Jimenez"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center h-11 p-1.5 rounded-full bg-void-black/90 backdrop-blur-xl border border-glass-stroke text-white shadow-[0_4px_24px_rgba(0,0,0,0.7)] transition-all duration-700 ease-in-out cursor-pointer hover:border-outline hover:bg-surface-container-highest/80"
          title="Contact Developer"
        >
          {/* Black & White Facebook Icon */}
          <div className="w-8 h-8 rounded-full bg-starlight-white text-void-black flex items-center justify-center shrink-0 group-hover/dev:rotate-[360deg] group-hover/dev:scale-105 transition-transform duration-700 ease-in-out shadow-sm">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>

          {/* Expanding text container on hover */}
          <div className="max-w-0 opacity-0 group-hover/dev:max-w-xs group-hover/dev:opacity-100 transition-all duration-700 ease-in-out overflow-hidden whitespace-nowrap">
            <span className="font-sans text-[11px] font-normal text-starlight-white/90 tracking-wide pl-2.5 pr-3.5 block">
              Contact Developer
            </span>
          </div>
        </a>
      </div>

      {/* Sticky Theme Light/Dark Mode Button (Desktop Only - Fixed Bottom Left) */}
      <button
        onClick={() => setIsLightMode(!isLightMode)}
        className="fixed bottom-6 left-6 z-50 hidden md:flex items-center justify-center w-11 h-11 rounded-full bg-void-black/90 backdrop-blur-xl border border-glass-stroke shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:border-primary/50 hover:bg-surface-container-highest/80 transition-all cursor-pointer group print:hidden"
        title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        {isLightMode ? (
          <Moon className="h-5 w-5 text-amber-400 group-hover:rotate-12 transition-transform" />
        ) : (
          <Sun className="h-5 w-5 text-yellow-400 group-hover:rotate-45 transition-transform" />
        )}
      </button>
    </div>
  );
}
