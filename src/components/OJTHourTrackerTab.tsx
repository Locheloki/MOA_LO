import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  OJTTimeLog, 
  OJTStudent, 
  TimeLogStatus 
} from '../types';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Clock3, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCheck, 
  X, 
  Edit3, 
  Trash2, 
  UserCheck, 
  Calendar,
  FileText,
  Building,
  GraduationCap,
  LayoutList,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface OJTHourTrackerTabProps {
  timeLogs: OJTTimeLog[];
  students: OJTStudent[];
  userRole: string;
  userName: string;
  onAddLog: (logData: Omit<OJTTimeLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateLog: (id: string, updates: Partial<OJTTimeLog>) => Promise<void>;
  onApproveLog: (id: string) => Promise<void>;
  onRejectLog: (id: string, reason: string) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onBulkApprove: (ids: string[]) => Promise<void>;
  onAddLogsBulk: (
    logs: Omit<OJTTimeLog, 'id' | 'createdAt' | 'updatedAt' | 'status'>[],
    replaceExisting: boolean
  ) => Promise<{
    created: OJTTimeLog[];
    skipped: { date: string; status: TimeLogStatus }[];
    replaced: { date: string; original: OJTTimeLog; updated: OJTTimeLog }[];
    protected: { date: string; status: TimeLogStatus }[];
    failed: { date: string; reason: string }[];
  }>;
}

export const OJTHourTrackerTab: React.FC<OJTHourTrackerTabProps> = ({
  timeLogs,
  students,
  userRole,
  userName,
  onAddLog,
  onUpdateLog,
  onApproveLog,
  onRejectLog,
  onDeleteLog,
  onBulkApprove,
  onAddLogsBulk
}) => {
  // Time and Date formatters for confirmation dialog
  const formatTimeTo12h = (time24: string) => {
    if (!time24) return '';
    const [hoursStr, minutesStr] = time24.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutesStr} ${ampm}`;
  };

  const formatDateToLong = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Authorization flags
  const canApprove = userRole === 'Administrator' || userRole === 'OJT Coordinator';

  // Form State for Log Modal
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTimeIn, setFormTimeIn] = useState<string>('08:00');
  const [formTimeOut, setFormTimeOut] = useState<string>('17:00');
  const [formBreakMinutes, setFormBreakMinutes] = useState<number>(60);
  const [formIsManual, setFormIsManual] = useState<boolean>(false);
  const [formManualHours, setFormManualHours] = useState<number>(8);
  const [formManualReason, setFormManualReason] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Search & Filter State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');

  // Searchable Student Dropdown State
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const studentDropdownRef = useRef<HTMLDivElement>(null);

  // Close student dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target as Node)) {
        setIsStudentDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students dynamically inside dropdown selection list
  const filteredStudentsForDropdown = useMemo(() => {
    if (!studentSearchQuery) return students;
    const query = studentSearchQuery.toLowerCase();
    return students.filter(s => 
      s.firstName.toLowerCase().includes(query) ||
      s.lastName.toLowerCase().includes(query) ||
      (s.studentId && s.studentId.toLowerCase().includes(query))
    );
  }, [students, studentSearchQuery]);

  // Searchable student selection state for the Log modal
  const [isModalStudentDropdownOpen, setIsModalStudentDropdownOpen] = useState<boolean>(false);
  const [modalStudentSearchQuery, setModalStudentSearchQuery] = useState<string>('');
  const modalStudentDropdownRef = useRef<HTMLDivElement>(null);

  // Close modal student dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalStudentDropdownRef.current && !modalStudentDropdownRef.current.contains(event.target as Node)) {
        setIsModalStudentDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudentsForModalDropdown = useMemo(() => {
    if (!modalStudentSearchQuery) return students;
    const query = modalStudentSearchQuery.toLowerCase();
    return students.filter(s => 
      s.firstName.toLowerCase().includes(query) ||
      s.lastName.toLowerCase().includes(query) ||
      (s.studentId && s.studentId.toLowerCase().includes(query))
    );
  }, [students, modalStudentSearchQuery]);

  // Bulk DTR States
  const [formLogMode, setFormLogMode] = useState<'single' | 'bulk'>('single');
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formDaysToGenerate, setFormDaysToGenerate] = useState<number>(5);
  const [formExcludeWeekends, setFormExcludeWeekends] = useState<boolean>(true);
  const [formBulkSelectedDates, setFormBulkSelectedDates] = useState<string[]>([]);

  // Dialog & Results Confirmation Steps
  const [bulkShowConflictDialog, setBulkShowConflictDialog] = useState<boolean>(false);
  const [bulkShowFinalConfirmation, setBulkShowFinalConfirmation] = useState<boolean>(false);
  const [bulkResultsData, setBulkResultsData] = useState<any | null>(null);

  // Compute all dates within selected start date and number of days
  const allDatesInRange = useMemo(() => {
    if (!formStartDate || formDaysToGenerate <= 0) return [];
    const start = new Date(formStartDate);
    if (isNaN(start.getTime())) return [];

    const dateList: string[] = [];
    const current = new Date(start);
    let count = 0;
    
    // Safety cap to prevent infinite loops (e.g. 100 max dates/iterations)
    let iterations = 0;
    while (count < formDaysToGenerate && iterations < 365) {
      iterations++;
      const day = current.getDay();
      const isWeekend = day === 0 || day === 6;
      
      if (formExcludeWeekends && isWeekend) {
        // Skip weekend and do not increment generated count
      } else {
        dateList.push(current.toISOString().split('T')[0]);
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return dateList;
  }, [formStartDate, formDaysToGenerate, formExcludeWeekends]);

  // Select all generated dates by default when range changes
  useEffect(() => {
    setFormBulkSelectedDates(allDatesInRange);
  }, [allDatesInRange]);

  // Compute DTR conflicts
  const bulkConflicts = useMemo(() => {
    if (!formStudentId || formBulkSelectedDates.length === 0) {
      return { pending: [], approved: [], rejected: [], hasConflict: false, totalConflicts: 0 };
    }
    const studentLogs = timeLogs.filter(l => l.studentId === formStudentId && formBulkSelectedDates.includes(l.date));
    const pending = studentLogs.filter(l => l.status === 'Pending').map(l => l.date);
    const approved = studentLogs.filter(l => l.status === 'Approved').map(l => l.date);
    const rejected = studentLogs.filter(l => l.status === 'Rejected').map(l => l.date);

    return {
      pending,
      approved,
      rejected,
      hasConflict: studentLogs.length > 0,
      totalConflicts: studentLogs.length
    };
  }, [formStudentId, formBulkSelectedDates, timeLogs]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [searchNotes, setSearchNotes] = useState<string>('');

  // Selection state for Bulk Approval
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Modal States
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<OJTTimeLog | null>(null);



  // Rejection Modal State
  const [rejectingLogId, setRejectingLogId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // DTR Printable Report Modal State
  const [isDtrReportModalOpen, setIsDtrReportModalOpen] = useState<boolean>(false);
  const [dtrReportStudentId, setDtrReportStudentId] = useState<string>('');
  const [dtrReportPeriod, setDtrReportPeriod] = useState<'ALL' | 'MONTHLY' | 'CUSTOM'>('ALL');
  const [dtrReportMonth, setDtrReportMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // View mode state (Table vs Calendar Heatmap)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calendarMonth, setCalendarMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');
  const calendarDetailRef = useRef<HTMLDivElement>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Auto-scroll to detail panel when a calendar date is selected
  useEffect(() => {
    if (selectedCalendarDate && calendarDetailRef.current) {
      calendarDetailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedCalendarDate]);

  // Student map for fast lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, OJTStudent>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  // Apply filters to logs
  const filteredLogs = useMemo(() => {
    return timeLogs.filter(log => {
      if (selectedStudentId !== 'ALL' && log.studentId !== selectedStudentId) return false;
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (startDateFilter && log.date < startDateFilter) return false;
      if (endDateFilter && log.date > endDateFilter) return false;
      if (searchNotes) {
        const query = searchNotes.toLowerCase();
        const notesMatch = log.notes?.toLowerCase().includes(query);
        if (!notesMatch) return false;
      }
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [timeLogs, selectedStudentId, statusFilter, startDateFilter, endDateFilter, searchNotes]);



  // Calendar Heatmap Grid Computation
  const calendarGrid = useMemo(() => {
    const parts = calendarMonth.split('-');
    const year = parseInt(parts[0], 10) || new Date().getFullYear();
    const month = parseInt(parts[1], 10) || (new Date().getMonth() + 1);

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0, Sunday = 6
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: ({ day: number; dateStr: string; logs: OJTTimeLog[]; approvedHours: number } | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayLogs = filteredLogs.filter(l => l.date === dateStr);
      const appHrs = dayLogs.filter(l => l.status === 'Approved').reduce((s, l) => s + l.hoursRendered, 0);

      days.push({
        day: d,
        dateStr,
        logs: dayLogs,
        approvedHours: appHrs
      });
    }

    return days;
  }, [calendarMonth, filteredLogs]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalLogged = filteredLogs.reduce((sum, l) => sum + (l.hoursRendered || 0), 0);
    const approvedLogs = filteredLogs.filter(l => l.status === 'Approved');
    const pendingLogs = filteredLogs.filter(l => l.status === 'Pending');
    const rejectedLogs = filteredLogs.filter(l => l.status === 'Rejected');

    const approvedHours = approvedLogs.reduce((sum, l) => sum + (l.hoursRendered || 0), 0);
    const pendingHours = pendingLogs.reduce((sum, l) => sum + (l.hoursRendered || 0), 0);
    const avgHours = filteredLogs.length > 0 ? totalLogged / filteredLogs.length : 0;

    return {
      totalLogged,
      approvedHours,
      pendingHours,
      pendingCount: pendingLogs.length,
      approvedCount: approvedLogs.length,
      rejectedCount: rejectedLogs.length,
      avgHours
    };
  }, [filteredLogs]);

  // Real-time calculated rendered hours for form
  const calculatedFormHours = useMemo(() => {
    if (!formTimeIn || !formTimeOut) return 0;
    const [inH, inM] = formTimeIn.split(':').map(Number);
    const [outH, outM] = formTimeOut.split(':').map(Number);
    const inTotalMinutes = inH * 60 + inM;
    const outTotalMinutes = outH * 60 + outM;

    let diffMinutes = outTotalMinutes - inTotalMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Overnight handle

    const netMinutes = Math.max(0, diffMinutes - (formBreakMinutes || 0));
    const hours = Math.round((netMinutes / 60) * 100) / 100;
    return hours;
  }, [formTimeIn, formTimeOut, formBreakMinutes]);

  const effectiveFormHours = formIsManual ? formManualHours : calculatedFormHours;

  // Check for duplicate / overlapping logs for current student & date
  const overlapWarning = useMemo(() => {
    if (!formStudentId || !formDate || !formTimeIn || !formTimeOut) return null;
    const existingForStudentAndDate = timeLogs.filter(l => 
      l.studentId === formStudentId && 
      l.date === formDate && 
      l.id !== (editingLog ? editingLog.id : '')
    );
    if (existingForStudentAndDate.length > 0) {
      return `Student already has ${existingForStudentAndDate.length} log(s) recorded for date ${formDate}. Ensure times do not double-count!`;
    }
    return null;
  }, [formStudentId, formDate, formTimeIn, formTimeOut, timeLogs, editingLog]);

  // Open Log Modal for Create or Edit
  const openLogModal = (logToEdit: OJTTimeLog | null = null, defaultStudentId: string = '', defaultDate: string = '') => {
    setEditingLog(logToEdit);
    setIsModalStudentDropdownOpen(false);
    setModalStudentSearchQuery('');
    setFormLogMode('single');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormDaysToGenerate(5);
    setFormExcludeWeekends(true);
    setFormBulkSelectedDates([]);
    setBulkShowConflictDialog(false);
    setBulkShowFinalConfirmation(false);
    setBulkResultsData(null);
    if (logToEdit) {
      setFormStudentId(logToEdit.studentId);
      setFormDate(logToEdit.date);
      setFormTimeIn(logToEdit.timeIn);
      setFormTimeOut(logToEdit.timeOut);
      setFormBreakMinutes(logToEdit.breakMinutes || 60);
      setFormIsManual(!!logToEdit.isManualOverride);
      setFormManualHours(logToEdit.hoursRendered);
      setFormManualReason(logToEdit.manualOverrideReason || '');
      setFormNotes(logToEdit.notes || '');
    } else {
      setFormStudentId(defaultStudentId || (students[0]?.id || ''));
      setFormDate(defaultDate || new Date().toISOString().split('T')[0]);
      setFormTimeIn('08:00');
      setFormTimeOut('17:00');
      setFormBreakMinutes(60);
      setFormIsManual(false);
      setFormManualHours(8);
      setFormManualReason('');
      setFormNotes('');
    }
    setIsLogModalOpen(true);
  };

  // Submit Handler for Log Modal
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formLogMode === 'bulk') {
      if (!formStudentId) {
        toast.error('Please select a student.');
        return;
      }
      if (formBulkSelectedDates.length === 0) {
        toast.error('Please select at least one date for daily log entries.');
        return;
      }
      if (effectiveFormHours <= 0) {
        toast.error('Calculated hours rendered must be greater than 0.');
        return;
      }
      if (effectiveFormHours > 24) {
        toast.error('Hours rendered cannot exceed 24 hours per session.');
        return;
      }

      // Check duplicate status
      if (bulkConflicts.hasConflict) {
        setBulkShowConflictDialog(true);
      } else {
        setBulkShowFinalConfirmation(true);
      }
      return;
    }

    if (!formStudentId) {
      toast.error('Please select a student.');
      return;
    }
    if (!formDate || !formTimeIn || !formTimeOut) {
      toast.error('Date, Time In, and Time Out are required.');
      return;
    }

    if (effectiveFormHours <= 0) {
      toast.error('Calculated hours rendered must be greater than 0.');
      return;
    }

    if (effectiveFormHours > 24) {
      toast.error('Hours rendered cannot exceed 24 hours per session.');
      return;
    }

    if (formIsManual && (!formManualReason || !formManualReason.trim())) {
      toast.error('A reason is required when manually overriding rendered hours.');
      return;
    }

    try {
      if (editingLog) {
        await onUpdateLog(editingLog.id, {
          studentId: formStudentId,
          date: formDate,
          timeIn: formTimeIn,
          timeOut: formTimeOut,
          breakMinutes: Number(formBreakMinutes) || 0,
          hoursRendered: effectiveFormHours,
          isManualOverride: formIsManual,
          manualOverrideReason: formIsManual ? formManualReason : undefined,
          notes: formNotes.trim()
        });
        toast.success('Time log updated successfully.');
      } else {
        await onAddLog({
          studentId: formStudentId,
          date: formDate,
          timeIn: formTimeIn,
          timeOut: formTimeOut,
          breakMinutes: Number(formBreakMinutes) || 0,
          hoursRendered: effectiveFormHours,
          isManualOverride: formIsManual,
          manualOverrideReason: formIsManual ? formManualReason : undefined,
          notes: formNotes.trim(),
          status: 'Pending'
        });
        toast.success('Daily time log submitted (Status: Pending Approval).');
      }
      setIsLogModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save time log.');
    }
  };

  // Submit Handler for Bulk logs
  const executeBulkSave = async (replaceExisting: boolean) => {
    const logsToCreate = formBulkSelectedDates.map(dateStr => ({
      studentId: formStudentId,
      date: dateStr,
      timeIn: formTimeIn,
      timeOut: formTimeOut,
      breakMinutes: Number(formBreakMinutes) || 0,
      hoursRendered: effectiveFormHours,
      isManualOverride: formIsManual,
      manualOverrideReason: formIsManual ? formManualReason : undefined,
      notes: formNotes.trim()
    }));

    try {
      const res = await onAddLogsBulk(logsToCreate, replaceExisting);
      setBulkResultsData({
        createdCount: res.created.length,
        skippedCount: res.skipped.length,
        replacedCount: res.replaced.length,
        protectedCount: res.protected.length,
        failedCount: res.failed.length
      });
      setBulkShowConflictDialog(false);
      setBulkShowFinalConfirmation(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete bulk daily time entry.');
    }
  };

  // Reject Submit Handler
  const handleConfirmReject = async () => {
    if (!rejectingLogId) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    try {
      await onRejectLog(rejectingLogId, rejectionReasonInput.trim());
      toast.success('Time log rejected.');
      setRejectingLogId(null);
      setRejectionReasonInput('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject time log.');
    }
  };

  // Bulk Approval Handler
  const handleExecuteBulkApprove = async () => {
    if (selectedLogIds.length === 0) return;
    const pendingSelected = timeLogs.filter(l => selectedLogIds.includes(l.id) && l.status === 'Pending');
    if (pendingSelected.length === 0) {
      toast.error('None of the selected items are in Pending status.');
      return;
    }

    if (confirm(`Approve ${pendingSelected.length} selected pending time log(s)? Approved hours will automatically update student progress.`)) {
      try {
        await onBulkApprove(pendingSelected.map(l => l.id));
        toast.success(`Successfully approved ${pendingSelected.length} time log(s).`);
        setSelectedLogIds([]);
      } catch (err: any) {
        toast.error(err.message || 'Bulk approval failed.');
      }
    }
  };

  // Selection Checkbox Helpers
  const toggleSelectLog = (id: string) => {
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllFilteredPending = () => {
    const pendingFiltered = filteredLogs.filter(l => l.status === 'Pending');
    const allPendingSelected = pendingFiltered.every(l => selectedLogIds.includes(l.id));

    if (allPendingSelected) {
      const pendingIdsSet = new Set(pendingFiltered.map(l => l.id));
      setSelectedLogIds(prev => prev.filter(id => !pendingIdsSet.has(id)));
    } else {
      const pendingIds = pendingFiltered.map(l => l.id);
      setSelectedLogIds(prev => Array.from(new Set([...prev, ...pendingIds])));
    }
  };

  // CSV Export Function
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs available to export.');
      return;
    }

    const headers = [
      'Log ID',
      'Student ID',
      'Student Name',
      'School',
      'Course',
      'Date',
      'Time In',
      'Time Out',
      'Break (Mins)',
      'Hours Rendered',
      'Status',
      'Notes',
      'Reviewed By',
      'Reviewed At',
      'Rejection Reason'
    ];

    const escapeCSV = (str: string | undefined | null) => {
      if (!str) return '""';
      const cleanStr = String(str).replace(/"/g, '""');
      return `"${cleanStr}"`;
    };

    const rows = filteredLogs.map(log => {
      const student = studentMap.get(log.studentId);
      const studentName = student ? `${student.lastName}, ${student.firstName}` : 'Unknown Student';
      return [
        escapeCSV(log.id),
        escapeCSV(student?.studentId || log.studentId),
        escapeCSV(studentName),
        escapeCSV(student?.school || ''),
        escapeCSV(student?.course || ''),
        escapeCSV(log.date),
        escapeCSV(log.timeIn),
        escapeCSV(log.timeOut),
        log.breakMinutes || 0,
        log.hoursRendered,
        escapeCSV(log.status),
        escapeCSV(log.notes || ''),
        escapeCSV(log.reviewedBy || ''),
        escapeCSV(log.reviewedAt || ''),
        escapeCSV(log.rejectionReason || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OJT_Time_Logs_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported time logs to CSV.');
  };

  // Open DTR Report Modal
  const openDtrReportModal = (studentId: string = '') => {
    const targetStudentId = studentId || (selectedStudentId !== 'ALL' ? selectedStudentId : students[0]?.id || '');
    setDtrReportStudentId(targetStudentId);
    setIsDtrReportModalOpen(true);
  };

  // DTR Printable Student & Logs Computation
  const dtrReportStudent = studentMap.get(dtrReportStudentId);
  const dtrReportLogs = useMemo(() => {
    if (!dtrReportStudentId) return [];
    let logs = timeLogs.filter(l => l.studentId === dtrReportStudentId && l.status === 'Approved');
    if (dtrReportPeriod === 'MONTHLY' && dtrReportMonth) {
      logs = logs.filter(l => l.date.startsWith(dtrReportMonth));
    }
    return logs.sort((a, b) => a.date.localeCompare(b.date));
  }, [timeLogs, dtrReportStudentId, dtrReportPeriod, dtrReportMonth]);

  const dtrReportTotalHours = useMemo(() => {
    return dtrReportLogs.reduce((sum, l) => sum + (l.hoursRendered || 0), 0);
  }, [dtrReportLogs]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center bg-surface-container/60 p-1 rounded-xl border border-glass-stroke shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-primary-container text-white shadow-[0_0_12px_rgba(255,84,81,0.3)]'
                : 'text-secondary hover:text-white hover:bg-surface-container'
            }`}
          >
            <LayoutList className="h-4 w-4" />
            Table View
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-primary-container text-white shadow-[0_0_12px_rgba(255,84,81,0.3)]'
                : 'text-secondary hover:text-white hover:bg-surface-container'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar Heatmap
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {canApprove && (() => {
            const pendingCount = timeLogs.filter(l => l.status === 'Pending').length;
            if (pendingCount === 0) return null;
            return (
              <button
                onClick={() => setStatusFilter('Pending')}
                className="px-3.5 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Filter to view all pending approvals"
              >
                <Clock className="h-4 w-4 text-yellow-400" />
                <span>{pendingCount} Pending Review{pendingCount > 1 ? 's' : ''}</span>
              </button>
            );
          })()}

          <button
            onClick={() => openLogModal(null)}
            className="px-4 py-2 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors rounded-xl shadow-[0_0_15px_rgba(255,84,81,0.3)] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            LOG HOURS
          </button>

          <button
            onClick={() => openDtrReportModal()}
            className="px-3 py-2 bg-surface-container border border-glass-stroke text-starlight-white hover:border-primary/50 text-xs font-mono rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Generate Official DTR Printable Report"
          >
            <Printer className="h-4 w-4 text-accent-blue" />
            OFFICIAL DTR REPORT
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-surface-container border border-glass-stroke text-starlight-white hover:border-primary/50 text-xs font-mono rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export filtered logs to CSV file"
          >
            <Download className="h-4 w-4 text-green-400" />
            EXPORT CSV
          </button>
        </div>
      </div>



      {/* Filter and Search Bar */}
      <div className="bg-void-black/70 backdrop-blur-md border border-glass-stroke rounded-xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Student Filter */}
          <div className="relative" ref={studentDropdownRef}>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Student</label>
            <button
              type="button"
              onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container border border-glass-stroke hover:border-glass-stroke-hover focus:border-outline rounded text-xs text-starlight-white transition-all duration-200 font-mono text-left cursor-pointer active:scale-[0.98]"
            >
              <span className="truncate">
                {selectedStudentId === 'ALL' 
                  ? `All Students (${students.length})` 
                  : (() => {
                      const stud = studentMap.get(selectedStudentId);
                      return stud ? `${stud.lastName}, ${stud.firstName}` : 'Select Student';
                    })()
                }
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-secondary transition-transform duration-200 shrink-0 ml-1.5 ${isStudentDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Popover with Slide/Fade Transition */}
            {isStudentDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 bg-void-black/95 backdrop-blur-md border border-glass-stroke rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                <div className="relative shrink-0">
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="Search name or ID..."
                    className="w-full pl-8 pr-7 py-1.5 bg-surface-container border border-glass-stroke rounded-lg text-xs text-starlight-white placeholder-secondary outline-none focus:border-primary/50 transition-all font-mono"
                    autoFocus
                  />
                  <Search className="h-3.5 w-3.5 text-secondary absolute left-2.5 top-2" />
                  {studentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setStudentSearchQuery('')}
                      className="absolute right-2 top-2.5 text-secondary hover:text-starlight-white transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="overflow-y-auto max-h-52 divide-y divide-glass-stroke/10 pr-1 scrollbar-thin scrollbar-thumb-glass-stroke/40">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId('ALL');
                      setIsStudentDropdownOpen(false);
                      setStudentSearchQuery('');
                    }}
                    className={`w-full text-left px-2.5 py-2 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-between ${
                      selectedStudentId === 'ALL'
                        ? 'bg-primary-container/20 text-primary font-bold'
                        : 'text-secondary hover:text-white hover:bg-surface-container/60'
                    }`}
                  >
                    <span>All Students</span>
                    <span className="text-[10px] opacity-60">({students.length})</span>
                  </button>

                  {filteredStudentsForDropdown.length === 0 ? (
                    <div className="px-2.5 py-4 text-center text-xs text-secondary font-mono italic">
                      No matching students
                    </div>
                  ) : (
                    filteredStudentsForDropdown.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(s.id);
                          setIsStudentDropdownOpen(false);
                          setStudentSearchQuery('');
                        }}
                        className={`w-full text-left px-2.5 py-2 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer truncate flex flex-col gap-0.5 ${
                          selectedStudentId === s.id
                            ? 'bg-primary-container/20 text-primary font-bold'
                            : 'text-secondary hover:text-white hover:bg-surface-container/60'
                        }`}
                      >
                        <span className="truncate">{s.lastName}, {s.firstName}</span>
                        <span className="text-[9px] text-secondary font-mono">ID: {s.studentId || 'N/A'}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            </div>

          {/* Status Filter — Segmented Buttons */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Status</label>
            <div className="flex bg-surface-container/40 p-1 rounded-lg border border-glass-stroke">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'Pending', label: 'Pending' },
                { key: 'Approved', label: 'Approved' },
                { key: 'Rejected', label: 'Rejected' },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatusFilter(opt.key)}
                  className={`flex-1 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer text-center ${
                    statusFilter === opt.key
                      ? 'bg-primary-container text-white shadow-[0_0_10px_rgba(255,84,81,0.2)]'
                      : 'text-secondary hover:text-white hover:bg-surface-container/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Start Date</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white outline-none focus:border-outline transition-all font-mono"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">End Date</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white outline-none focus:border-outline transition-all font-mono"
            />
          </div>

          {/* Notes Search */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1">Search Notes</label>
            <div className="relative">
              <input
                type="text"
                value={searchNotes}
                onChange={(e) => setSearchNotes(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white placeholder-secondary focus:border-outline outline-none transition-all"
              />
              <Search className="h-3.5 w-3.5 text-secondary absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Clear Filters Button & Active Summary */}
        {(selectedStudentId !== 'ALL' || statusFilter !== 'ALL' || startDateFilter || endDateFilter || searchNotes) && (
          <div className="flex items-center justify-between pt-2 border-t border-glass-stroke/30 text-xs font-mono">
            <span className="text-secondary">
              Showing {filteredLogs.length} of {timeLogs.length} time log(s)
            </span>
            <button
              onClick={() => {
                setSelectedStudentId('ALL');
                setStatusFilter('ALL');
                setStartDateFilter('');
                setEndDateFilter('');
                setSearchNotes('');
              }}
              className="text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Bar (Visible when items selected - Floating on mobile) */}
      {selectedLogIds.length > 0 && canApprove && (
        <div className="fixed sm:relative bottom-4 left-4 right-4 sm:bottom-auto sm:left-auto sm:right-auto z-40 bg-void-black/95 sm:bg-primary-container/20 border border-primary/50 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.8)] sm:shadow-[0_0_20px_rgba(255,84,81,0.2)]">
          <div className="flex items-center gap-3 text-starlight-white font-mono text-xs">
            <CheckCheck className="h-5 w-5 text-primary shrink-0" />
            <span><strong>{selectedLogIds.length}</strong> time log(s) selected for bulk review</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setSelectedLogIds([])}
              className="px-3 py-1.5 bg-surface-container text-secondary hover:text-starlight-white rounded-lg text-xs font-mono transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={handleExecuteBulkApprove}
              className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(34,197,94,0.4)] cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              BULK APPROVE SELECTED
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats Strip */}
      {viewMode === 'table' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(() => {
            const total = filteredLogs.length;
            const totalHours = filteredLogs.reduce((sum, l) => sum + l.hoursRendered, 0);
            const pending = filteredLogs.filter(l => l.status === 'Pending').length;
            const approved = filteredLogs.filter(l => l.status === 'Approved').length;
            const rejected = filteredLogs.filter(l => l.status === 'Rejected').length;
            return (
              <>
                <div className="bg-surface-container/50 border border-glass-stroke rounded-lg p-3 text-center">
                  <p className="text-2xl font-headline font-bold text-starlight-white">{total}</p>
                  <p className="text-[10px] font-mono text-secondary uppercase tracking-wider mt-0.5">Total Logs</p>
                </div>
                <div className="bg-surface-container/50 border border-glass-stroke rounded-lg p-3 text-center">
                  <p className="text-2xl font-headline font-bold text-primary">{totalHours.toFixed(1)}</p>
                  <p className="text-[10px] font-mono text-secondary uppercase tracking-wider mt-0.5">Total Hours</p>
                </div>
                {pending > 0 && (
                  <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-headline font-bold text-yellow-400">{pending}</p>
                    <p className="text-[10px] font-mono text-yellow-400/70 uppercase tracking-wider mt-0.5">Pending</p>
                  </div>
                )}
                {approved > 0 && (
                  <div className="bg-green-950/20 border border-green-500/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-headline font-bold text-green-400">{approved}</p>
                    <p className="text-[10px] font-mono text-green-400/70 uppercase tracking-wider mt-0.5">Approved</p>
                  </div>
                )}
                {rejected > 0 && (
                  <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-headline font-bold text-red-400">{rejected}</p>
                    <p className="text-[10px] font-mono text-red-400/70 uppercase tracking-wider mt-0.5">Rejected</p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Table View Mode */}
      {viewMode === 'table' && (
        <div className="bg-void-black/70 backdrop-blur-md border border-glass-stroke rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto max-h-[32rem] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-starlight-white border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface-container/95 backdrop-blur-sm border-b border-glass-stroke text-secondary font-mono uppercase text-[10px] tracking-wider">
                  {canApprove && (
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredLogs.filter(l => l.status === 'Pending').length > 0 &&
                          filteredLogs.filter(l => l.status === 'Pending').every(l => selectedLogIds.includes(l.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLogIds(filteredLogs.filter(l => l.status === 'Pending').map(l => l.id));
                          } else {
                            setSelectedLogIds([]);
                          }
                        }}
                        className="rounded accent-primary cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="p-3">Date</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Time In / Out</th>
                  <th className="p-3">Break</th>
                  <th className="p-3">Rendered Hours</th>
                  <th className="p-3 w-8"></th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reviewer</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-stroke/30">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-secondary font-mono">
                      No daily time logs match your current filter parameters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const student = studentMap.get(log.studentId);
                    const studentName = student ? `${student.lastName}, ${student.firstName}` : 'Unknown Student';
                    const isSelected = selectedLogIds.includes(log.id);

                    return (
                      <>
                      <tr 
                        key={log.id} 
                        className={`group transition-colors hover:bg-surface-container/40 ${
                          isSelected ? 'bg-primary-container/10' : ''
                        }`}
                      >
                        {canApprove && (
                          <td className="p-3 text-center">
                            {log.status === 'Pending' ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedLogIds([...selectedLogIds, log.id]);
                                  } else {
                                    setSelectedLogIds(selectedLogIds.filter(id => id !== log.id));
                                  }
                                }}
                                className="rounded accent-primary cursor-pointer"
                              />
                            ) : (
                              <span className="text-secondary/30 text-[10px]">—</span>
                            )}
                          </td>
                        )}

                        <td className="p-3 font-mono font-bold whitespace-nowrap text-starlight-white">
                          {log.date}
                        </td>

                        <td className="p-3 font-semibold">
                          <div>{studentName}</div>
                          {student && (
                            <div className="text-[10px] font-mono text-secondary truncate max-w-[160px]">
                              ID: {student.studentId} • {student.course}
                            </div>
                          )}
                        </td>

                        <td className="p-3 font-mono whitespace-nowrap">
                          {log.timeIn} – {log.timeOut}
                        </td>

                        <td className="p-3 font-mono text-secondary whitespace-nowrap">
                          {log.breakMinutes || 0}m
                        </td>

                        <td className="p-3 font-mono font-bold text-primary whitespace-nowrap">
                          {log.hoursRendered.toFixed(2)} hrs
                          {log.isManualOverride && (
                            <span 
                              className="ml-1 text-[9px] bg-yellow-500/20 text-yellow-300 px-1 py-0.5 rounded border border-yellow-500/30"
                              title={`Manual Override: ${log.manualOverrideReason || 'No reason provided'}`}
                            >
                              Manual
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <button
                            onClick={() => setExpandedRowId(expandedRowId === log.id ? null : log.id)}
                            className={`p-1 rounded transition-colors cursor-pointer ${expandedRowId === log.id ? 'text-primary bg-primary/10' : 'text-secondary hover:text-white hover:bg-surface-container'}`}
                            title={expandedRowId === log.id ? 'Collapse details' : 'Expand details'}
                          >
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedRowId === log.id ? 'rotate-180' : ''}`} />
                          </button>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          {log.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                              <CheckCircle2 className="h-3 w-3" /> APPROVED
                            </span>
                          )}
                          {log.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              <Clock className="h-3 w-3" /> PENDING
                            </span>
                          )}
                          {log.status === 'Rejected' && (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 cursor-help"
                              title={`Rejection Reason: ${log.rejectionReason || 'No reason provided'}`}
                            >
                              <XCircle className="h-3 w-3" /> REJECTED
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[10px] text-secondary whitespace-nowrap">
                          {log.reviewedBy ? (
                            <div>
                              <span className="text-starlight-white">{log.reviewedBy}</span>
                              <div className="opacity-60">{log.reviewedAt ? new Date(log.reviewedAt).toLocaleDateString() : ''}</div>
                            </div>
                          ) : (
                            <span className="opacity-40">—</span>
                          )}
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canApprove && log.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => onApproveLog(log.id)}
                                  className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-colors cursor-pointer"
                                  title="Approve Log"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    setRejectingLogId(log.id);
                                    setRejectionReasonInput('');
                                  }}
                                  className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors cursor-pointer"
                                  title="Reject Log"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => openLogModal(log)}
                              className="p-1 text-secondary hover:text-starlight-white hover:bg-surface-container rounded transition-colors cursor-pointer"
                              title="Edit Log"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            {canApprove && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete time log for ${studentName} on ${log.date}? If this log was approved, student completed hours will be recalculated.`)) {
                                    onDeleteLog(log.id);
                                  }
                                }}
                                className="p-1 text-secondary hover:text-red-400 hover:bg-surface-container rounded transition-colors cursor-pointer"
                                title="Delete Log"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                           </div>
                        </td>
                      </tr>
                      {expandedRowId === log.id && (
                        <tr className="bg-surface-container/20 border-b border-glass-stroke/30">
                          <td colSpan={canApprove ? 10 : 9} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Notes / Remarks</p>
                                <p className="text-starlight-white/95 whitespace-pre-wrap">{log.notes || <span className="opacity-30 italic">No notes</span>}</p>
                              </div>
                              {log.isManualOverride && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-1">Manual Override Reason</p>
                                  <p className="text-yellow-300/90">{log.manualOverrideReason || 'No reason provided'}</p>
                                </div>
                              )}
                              {log.status === 'Rejected' && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">Rejection Reason</p>
                                  <p className="text-red-300/90">{log.rejectionReason || 'No reason provided'}</p>
                                </div>
                              )}
                              {log.reviewedBy && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Reviewed By</p>
                                  <p className="text-starlight-white/95">{log.reviewedBy}</p>
                                  {log.reviewedAt && <p className="text-secondary mt-0.5">{new Date(log.reviewedAt).toLocaleString()}</p>}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Touch Cards View (Visible on screens smaller than md) */}
          <div className="block md:hidden p-3 space-y-3 max-h-[36rem] overflow-y-auto custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-secondary font-mono text-xs">
                No daily time logs match your current filter parameters.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const student = studentMap.get(log.studentId);
                const studentName = student ? `${student.lastName}, ${student.firstName}` : 'Unknown Student';
                const isSelected = selectedLogIds.includes(log.id);

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border transition-all duration-200 space-y-3 ${
                      isSelected
                        ? 'bg-primary-container/15 border-primary/60 shadow-[0_0_15px_rgba(255,84,81,0.15)]'
                        : log.status === 'Pending'
                        ? 'bg-surface-container/60 border-yellow-500/30'
                        : 'bg-surface-container/40 border-glass-stroke/60'
                    }`}
                  >
                    {/* Header: Checkbox, Student Name, Status */}
                    <div className="flex items-start justify-between gap-2 border-b border-glass-stroke/30 pb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {canApprove && log.status === 'Pending' && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLogIds([...selectedLogIds, log.id]);
                              } else {
                                setSelectedLogIds(selectedLogIds.filter(id => id !== log.id));
                              }
                            }}
                            className="rounded accent-primary h-4 w-4 cursor-pointer shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-starlight-white text-sm truncate">{studentName}</h4>
                          {student && (
                            <p className="text-[10px] font-mono text-secondary truncate">
                              ID: {student.studentId} • {student.course}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {log.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                            <CheckCircle2 className="h-3 w-3" /> APPROVED
                          </span>
                        )}
                        {log.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            <Clock className="h-3 w-3" /> PENDING
                          </span>
                        )}
                        {log.status === 'Rejected' && (
                          <span 
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30"
                            title={`Rejection Reason: ${log.rejectionReason || 'No reason provided'}`}
                          >
                            <XCircle className="h-3 w-3" /> REJECTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-surface-container/40 p-2.5 rounded-lg border border-glass-stroke/30">
                        <span className="text-[9px] uppercase tracking-wider text-secondary block font-bold">Date</span>
                        <span className="text-starlight-white font-bold">{log.date}</span>
                      </div>

                      <div className="bg-surface-container/40 p-2.5 rounded-lg border border-glass-stroke/30">
                        <span className="text-[9px] uppercase tracking-wider text-secondary block font-bold">Rendered Hours</span>
                        <span className="text-primary font-extrabold">{log.hoursRendered.toFixed(2)} hrs</span>
                      </div>

                      <div className="bg-surface-container/40 p-2.5 rounded-lg border border-glass-stroke/30">
                        <span className="text-[9px] uppercase tracking-wider text-secondary block font-bold">Shift</span>
                        <span className="text-starlight-white">{log.timeIn} – {log.timeOut}</span>
                      </div>

                      <div className="bg-surface-container/40 p-2.5 rounded-lg border border-glass-stroke/30">
                        <span className="text-[9px] uppercase tracking-wider text-secondary block font-bold">Break Time</span>
                        <span className="text-secondary">{log.breakMinutes || 0} mins</span>
                      </div>
                    </div>

                    {/* Notes & Manual Override Tag */}
                    {(log.notes || log.isManualOverride) && (
                      <div className="text-xs font-mono bg-surface-container/30 p-2.5 rounded-lg border border-glass-stroke/20 space-y-1">
                        {log.isManualOverride && (
                          <span className="inline-block text-[9px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-500/30 font-bold mb-1">
                            ⚠️ Manual Override: {log.manualOverrideReason || 'No reason specified'}
                          </span>
                        )}
                        {log.notes && (
                          <p className="text-secondary italic text-[11px] truncate">"{log.notes}"</p>
                        )}
                      </div>
                    )}

                    {/* Reviewer Meta */}
                    {log.reviewedBy && (
                      <div className="text-[10px] font-mono text-secondary flex justify-between pt-1 border-t border-glass-stroke/20">
                        <span>Reviewed by: <strong className="text-starlight-white">{log.reviewedBy}</strong></span>
                        <span>{log.reviewedAt ? new Date(log.reviewedAt).toLocaleDateString() : ''}</span>
                      </div>
                    )}

                    {/* Touch Action Buttons for Mobile */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-glass-stroke/30">
                      {canApprove && log.status === 'Pending' ? (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => onApproveLog(log.id)}
                            className="flex-1 py-2.5 bg-transparent border border-green-500 text-green-400 hover:bg-green-500/10 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            APPROVE
                          </button>

                          <button
                            onClick={() => {
                              setRejectingLogId(log.id);
                              setRejectionReasonInput('');
                            }}
                            className="flex-1 py-2.5 bg-transparent border border-red-500 text-red-400 hover:bg-red-500/10 font-mono text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <XCircle className="h-4 w-4 text-red-400" />
                            REJECT
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 w-full">
                          <button
                            onClick={() => openLogModal(log)}
                            className="px-3 py-1.5 bg-surface-container border border-glass-stroke text-starlight-white font-mono text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => onDeleteLog(log.id)}
                            className="px-3 py-1.5 bg-surface-container border border-glass-stroke text-red-400 hover:bg-red-500/20 font-mono text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Calendar Heatmap View Mode */}
      {viewMode === 'calendar' && (
        <div className="bg-void-black/70 backdrop-blur-md border border-glass-stroke rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between border-b border-glass-stroke/40 pb-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h3 className="font-headline font-bold text-starlight-white text-lg">
                {new Date(calendarMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div className="flex items-center gap-2 relative z-20">
              <button
                onClick={() => {
                  const [y, m] = calendarMonth.split('-').map(Number);
                  const prev = new Date(y, m - 2, 1);
                  setCalendarMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="p-2 bg-surface-container hover:bg-surface-container-highest border border-glass-stroke rounded text-starlight-white transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                onClick={() => setCalendarMonth(new Date().toISOString().slice(0, 7))}
                className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-highest border border-glass-stroke rounded font-mono text-xs text-starlight-white transition-colors cursor-pointer"
              >
                Today
              </button>

              <button
                onClick={() => {
                  const [y, m] = calendarMonth.split('-').map(Number);
                  const next = new Date(y, m, 1);
                  setCalendarMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="p-2 bg-surface-container hover:bg-surface-container-highest border border-glass-stroke rounded text-starlight-white transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center font-mono text-xs font-bold text-secondary uppercase tracking-wider py-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-2">
            {calendarGrid.map((item, idx) => {
              if (!item) {
                return <div key={`blank-${idx}`} className="h-24 rounded-lg bg-surface-container/10 border border-glass-stroke/10 opacity-30" />;
              }

                  const hasLogs = item.logs.length > 0;
                  const hasApproved = item.approvedHours > 0;
                  const hasPending = item.logs.some(l => l.status === 'Pending');
                  const isSelected = selectedCalendarDate === item.dateStr;

              return (
                <div
                  key={item.dateStr}
                  onClick={() => {
                    const nextDate = selectedCalendarDate === item.dateStr ? '' : item.dateStr;
                    setSelectedCalendarDate(nextDate);
                    setFormLogMode('single');
                    if (nextDate) {
                      setFormDate(nextDate);
                      if (selectedStudentId !== 'ALL') setFormStudentId(selectedStudentId);
                    }
                  }}
                  className={`h-24 p-2 rounded-lg border flex flex-col justify-between transition-all cursor-pointer group relative ${
                    isSelected
                      ? 'bg-primary/10 border-primary/60 ring-1 ring-primary/30 shadow-[0_0_12px_rgba(255,84,81,0.2)]'
                      : hasApproved
                      ? 'bg-green-950/20 border-green-500/40 hover:border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                      : hasPending
                      ? 'bg-yellow-950/20 border-yellow-500/40 hover:border-yellow-500'
                      : 'bg-surface-container/30 border-glass-stroke/40 hover:border-glass-stroke hover:bg-surface-container/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-xs font-bold ${hasApproved ? 'text-green-400' : 'text-starlight-white'}`}>
                      {item.day}
                    </span>
                    {hasApproved && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    )}
                  </div>

                  {hasLogs ? (
                    <div className="space-y-1">
                      {item.logs.slice(0, 2).map(log => (
                        <div key={log.id} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-void-black/60 truncate" title={`${log.timeIn}-${log.timeOut}: ${log.notes || ''}`}>
                          <span className="font-bold text-primary">{log.hoursRendered.toFixed(1)}h</span>
                          <span className="ml-1 text-secondary opacity-80">{log.status === 'Approved' ? '✓' : '?'}</span>
                        </div>
                      ))}
                      {item.logs.length > 2 && (
                        <span className="text-[9px] font-mono text-secondary">+ {item.logs.length - 2} more</span>
                      )}
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center my-auto">
                      <Plus className="h-4 w-4 text-secondary mx-auto" />
                      <span className="text-[9px] font-mono text-secondary block">Log</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Calendar Day Detail Popup — Modal with side-by-side layout */}
      {selectedCalendarDate && (
        <div className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar">
          <div
            className="fixed inset-0 bg-void-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setSelectedCalendarDate('')}
          />
          <div className="flex min-h-screen items-center justify-center p-6 py-20 sm:p-8 sm:py-24">
            <div ref={calendarDetailRef} className="relative bg-void-black/95 rounded-2xl border border-glass-stroke shadow-[0_30px_80px_rgba(0,0,0,0.95)] max-w-5xl w-full flex flex-col animate-scale-in max-h-[90vh]">

          {/* Header */}
          <header className="px-8 pt-6 pb-5 border-b border-glass-stroke flex items-center justify-between bg-surface-container/20 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 shadow-inner">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-starlight-white font-headline text-xl tracking-tight">
                  {formatDateToLong(selectedCalendarDate)}
                </h3>
                <p className="text-xs text-secondary mt-1 font-mono">
                  {(() => {
                    const dayLogs = timeLogs.filter(l => l.date === selectedCalendarDate);
                    const dayStudents = new Set(dayLogs.map(l => l.studentId));
                    return `${dayLogs.length} log(s) from ${dayStudents.size} student(s)`;
                  })()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCalendarDate('')}
              className="text-secondary hover:text-white bg-surface-container hover:bg-surface-container-highest p-2.5 rounded-xl transition-all cursor-pointer shadow-sm border border-glass-stroke/50 group"
            >
              <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </header>

          {/* Content: Side-by-side */}
          <div className="flex flex-col lg:flex-row">

            {/* LEFT: Log Entry Form */}
            <div className="lg:w-[55%] lg:border-r border-glass-stroke p-6 space-y-4">

              {/* Toggle Row 1: Single Day | Multiple Days (Bulk DTR) */}
              <div className="flex bg-surface-container/40 p-1 rounded-lg border border-glass-stroke">
                <button
                  type="button"
                  onClick={() => setFormLogMode('single')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                    formLogMode === 'single'
                      ? 'bg-primary-container text-white shadow-[0_0_10px_rgba(255,84,81,0.2)]'
                      : 'text-secondary hover:text-white hover:bg-surface-container/20'
                  }`}
                >
                  Single Day
                </button>
                <button
                  type="button"
                  onClick={() => setFormLogMode('bulk')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                    formLogMode === 'bulk'
                      ? 'bg-primary-container text-white shadow-[0_0_10px_rgba(255,84,81,0.2)]'
                      : 'text-secondary hover:text-white hover:bg-surface-container/20'
                  }`}
                >
                  Multiple Days (Bulk DTR)
                </button>
              </div>

              {/* Student Selector */}
              <div className="relative" ref={modalStudentDropdownRef}>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Select Student *</label>
                <button
                  type="button"
                  onClick={() => setIsModalStudentDropdownOpen(!isModalStudentDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-surface-container border border-glass-stroke hover:border-glass-stroke-hover focus:border-outline rounded text-sm text-starlight-white transition-all duration-200 font-mono text-left cursor-pointer active:scale-[0.98]"
                >
                  <span className="truncate">
                    {formStudentId
                      ? (() => {
                          const stud = studentMap.get(formStudentId);
                          return stud ? `${stud.lastName}, ${stud.firstName} (${stud.studentId}) — ${stud.course}` : '-- Choose Student --';
                        })()
                      : '-- Choose Student --'
                    }
                  </span>
                  <ChevronDown className={`h-4 w-4 text-secondary transition-transform duration-200 shrink-0 ml-1.5 ${isModalStudentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isModalStudentDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-void-black/98 backdrop-blur-md border border-glass-stroke rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                    <div className="relative shrink-0">
                      <input
                        type="text"
                        value={modalStudentSearchQuery}
                        onChange={(e) => setModalStudentSearchQuery(e.target.value)}
                        placeholder="Search student name or ID..."
                        className="w-full pl-8 pr-7 py-1.5 bg-surface-container border border-glass-stroke rounded-lg text-xs text-starlight-white placeholder-secondary outline-none focus:border-primary/50 transition-all font-mono"
                        autoFocus
                      />
                      <Search className="h-3.5 w-3.5 text-secondary absolute left-2.5 top-2.5" />
                      {modalStudentSearchQuery && (
                        <button type="button" onClick={() => setModalStudentSearchQuery('')} className="absolute right-2 top-2 text-secondary hover:text-starlight-white transition-colors cursor-pointer">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-48 divide-y divide-glass-stroke/10 pr-1 scrollbar-thin scrollbar-thumb-glass-stroke/40">
                      <button type="button" onClick={() => { setFormStudentId(''); setIsModalStudentDropdownOpen(false); setModalStudentSearchQuery(''); }}
                        className={`w-full text-left px-2.5 py-2 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer ${formStudentId === '' ? 'bg-primary-container/20 text-primary font-bold' : 'text-secondary hover:text-white hover:bg-surface-container/60'}`}>
                        -- Choose Student --
                      </button>
                      {filteredStudentsForModalDropdown.length === 0 ? (
                        <div className="px-2.5 py-4 text-center text-xs text-secondary font-mono italic">No matching students</div>
                      ) : (
                        filteredStudentsForModalDropdown.map(s => (
                          <button key={s.id} type="button" onClick={() => { setFormStudentId(s.id); setIsModalStudentDropdownOpen(false); setModalStudentSearchQuery(''); }}
                            className={`w-full text-left px-2.5 py-2 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer truncate flex flex-col gap-0.5 ${formStudentId === s.id ? 'bg-primary-container/20 text-primary font-bold' : 'text-secondary hover:text-white hover:bg-surface-container/60'}`}>
                            <span className="truncate">{s.lastName}, {s.firstName}</span>
                            <span className="text-[9px] text-secondary font-mono font-normal">ID: {s.studentId || 'N/A'} • {s.course}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Date / Break Duration */}
              <div className="grid grid-cols-2 gap-3">
                {formLogMode === 'single' ? (
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Date *</label>
                    <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white focus:border-outline outline-none transition-all font-mono" />
                  </div>
                ) : (
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] font-mono text-secondary uppercase block font-bold mb-1.5">Entry Mode</span>
                    <span className="text-xs text-sky-400 font-bold bg-sky-500/10 px-3 py-2.5 rounded border border-sky-500/20 font-mono">Bulk DTR Entry Mode</span>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Break (Mins)</label>
                  <input type="number" min="0" max="300" value={formBreakMinutes} onChange={(e) => setFormBreakMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono" />
                </div>
              </div>

              {/* Overlap Warning */}
              {formLogMode === 'single' && overlapWarning && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-2 text-xs font-mono text-yellow-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{overlapWarning}</span>
                </div>
              )}

              {/* Bulk Date Checklist */}
              {formLogMode === 'bulk' && (
                <div className="space-y-3 border border-glass-stroke/40 rounded-xl p-3 bg-surface-container/20">
                  <h4 className="text-xs font-mono font-bold text-starlight-white uppercase tracking-wider">Bulk Date Generation</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Start Date *</label>
                      <input type="date" required={formLogMode === 'bulk'} value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white focus:border-outline outline-none transition-all font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Working Days *</label>
                      <input type="number" min="1" max="100" required={formLogMode === 'bulk'} value={formDaysToGenerate} onChange={(e) => setFormDaysToGenerate(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white focus:border-outline outline-none transition-all font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <label className="flex items-center gap-2 text-secondary cursor-pointer hover:text-starlight-white transition-colors">
                      <input type="checkbox" checked={formExcludeWeekends} onChange={(e) => setFormExcludeWeekends(e.target.checked)} className="rounded border-glass-stroke bg-surface-container accent-primary" />
                      Skip Weekends
                    </label>
                    <span className="text-secondary">Days: <strong className="text-starlight-white">{formBulkSelectedDates.length}</strong></span>
                  </div>
                </div>
              )}

              {/* Time In & Time Out */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Time In *</label>
                  <input type="time" required value={formTimeIn} onChange={(e) => setFormTimeIn(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Time Out *</label>
                  <input type="time" required value={formTimeOut} onChange={(e) => setFormTimeOut(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono" />
                </div>
              </div>

              {/* Rendered Hours */}
              <div className="bg-surface-container/50 border border-glass-stroke p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-secondary">Rendered Hours:</span>
                  <span className="text-lg font-headline font-bold text-primary">{effectiveFormHours.toFixed(2)} hrs</span>
                </div>
                <div className="pt-2 border-t border-glass-stroke/30 flex items-center justify-between text-xs font-mono">
                  <label className="flex items-center gap-2 text-secondary cursor-pointer">
                    <input type="checkbox" checked={formIsManual} onChange={(e) => setFormIsManual(e.target.checked)} className="rounded border-glass-stroke bg-surface-container accent-primary" />
                    Manual Override
                  </label>
                  {formIsManual && (
                    <input type="number" step="0.25" min="0.25" max="24" value={formManualHours} onChange={(e) => setFormManualHours(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white font-mono" />
                  )}
                </div>
                {formIsManual && (
                  <div>
                    <label className="block text-[10px] font-mono text-yellow-300 mb-1">Reason *</label>
                    <input type="text" required={formIsManual} value={formManualReason} onChange={(e) => setFormManualReason(e.target.value)} placeholder="e.g. Field assignment"
                      className="w-full px-2 py-1.5 bg-surface-container border border-yellow-500/40 rounded text-xs text-starlight-white outline-none" />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Notes (Optional)</label>
                <textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Supervisor observations or session notes..."
                  className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline outline-none transition-all" />
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setSelectedCalendarDate('')}
                  className="px-4 py-2 bg-surface-container-highest border border-glass-stroke rounded font-mono text-xs text-starlight-white hover:bg-outline transition-all cursor-pointer">
                  CANCEL
                </button>
                <button type="button" onClick={(e) => { e.preventDefault(); handleSaveLog(e as any); }}
                  className="px-4 py-2 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] rounded cursor-pointer">
                  {formLogMode === 'single' ? 'SAVE TIME LOG' : 'PROCEED TO SAVE'}
                </button>
              </div>
            </div>

            {/* RIGHT: Summary + Student Logs */}
            <div className="lg:w-[45%] p-6 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">

              {/* Summary Stats */}
              {(() => {
                const dayLogs = timeLogs.filter(l => l.date === selectedCalendarDate);
                const dayStudents = new Set(dayLogs.map(l => l.studentId));
                const totalHours = dayLogs.reduce((sum, l) => sum + l.hoursRendered, 0);
                const pendingCount = dayLogs.filter(l => l.status === 'Pending').length;
                const approvedCount = dayLogs.filter(l => l.status === 'Approved').length;
                const rejectedCount = dayLogs.filter(l => l.status === 'Rejected').length;

                if (dayLogs.length === 0) return null;

                return (
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-surface-container/50 border border-glass-stroke rounded-lg p-3 text-center">
                        <p className="text-xl font-headline font-bold text-primary">{totalHours.toFixed(1)}</p>
                        <p className="text-[10px] font-mono text-secondary uppercase tracking-wider mt-0.5">Hours</p>
                      </div>
                      <div className="bg-surface-container/50 border border-glass-stroke rounded-lg p-3 text-center">
                        <p className="text-xl font-headline font-bold text-starlight-white">{dayStudents.size}</p>
                        <p className="text-[10px] font-mono text-secondary uppercase tracking-wider mt-0.5">Students</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {approvedCount > 0 && (
                        <div className="flex-1 bg-green-950/20 border border-green-500/30 rounded-lg p-2 text-center">
                          <p className="text-base font-headline font-bold text-green-400">{approvedCount}</p>
                          <p className="text-[9px] font-mono text-green-400/70">Approved</p>
                        </div>
                      )}
                      {pendingCount > 0 && (
                        <div className="flex-1 bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-2 text-center">
                          <p className="text-base font-headline font-bold text-yellow-400">{pendingCount}</p>
                          <p className="text-[9px] font-mono text-yellow-400/70">Pending</p>
                        </div>
                      )}
                      {rejectedCount > 0 && (
                        <div className="flex-1 bg-red-950/20 border border-red-500/30 rounded-lg p-2 text-center">
                          <p className="text-base font-headline font-bold text-red-400">{rejectedCount}</p>
                          <p className="text-[9px] font-mono text-red-400/70">Rejected</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Divider */}
              {timeLogs.filter(l => l.date === selectedCalendarDate).length > 0 && (
                <div className="border-t border-glass-stroke mb-4" />
              )}

              {/* Student Logs List */}
              <div className="space-y-1 divide-y divide-glass-stroke/50">
                {(() => {
                  const dayLogs = timeLogs.filter(l => l.date === selectedCalendarDate);
                  if (dayLogs.length === 0) {
                    return (
                      <div className="py-8 text-center">
                        <Clock className="h-8 w-8 text-secondary/40 mx-auto mb-2" />
                        <p className="text-xs font-mono text-secondary">No logs for this date.</p>
                      </div>
                    );
                  }
                  return dayLogs.map(log => {
                    const student = students.find(s => s.id === log.studentId);
                    const studentName = student ? `${student.lastName}, ${student.firstName}` : log.studentId;
                    return (
                      <div key={log.id} className="py-3 flex items-center justify-between gap-2 first:pt-0 last:pb-0 group/item">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            log.status === 'Approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : log.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-mono font-bold text-starlight-white truncate">{studentName}</p>
                            <p className="text-[10px] font-mono text-secondary">
                              {formatTimeTo12h(log.timeIn)} – {formatTimeTo12h(log.timeOut)}
                              {log.breakMinutes > 0 ? ` · ${log.breakMinutes}m break` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-headline font-bold text-primary">{log.hoursRendered.toFixed(1)}h</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            log.status === 'Approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : log.status === 'Rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {log.status}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); openLogModal(log); }}
                              className="p-1 rounded text-secondary hover:text-starlight-white hover:bg-surface-container transition-colors cursor-pointer" title="Edit">
                              <Edit3 className="h-3 w-3" />
                            </button>
                            {canApprove && (
                              <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete log for ${studentName}?`)) onDeleteLog(log.id); }}
                                className="p-1 rounded text-secondary hover:text-red-400 hover:bg-surface-container transition-colors cursor-pointer" title="Delete">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>

          </div>

            </div>
          </div>
        </div>
      )}

      {/* Log Hours Modal (Create or Edit) — Standalone (used by edit button) */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-void-black/80 backdrop-blur-md transition-opacity" 
            onClick={() => setIsLogModalOpen(false)}
          />
          <div className="flex min-h-screen items-center justify-center p-4 py-16 sm:p-8 sm:py-20">
            <div className="relative bg-void-black/95 rounded-2xl border border-glass-stroke shadow-[0_30px_80px_rgba(0,0,0,0.95)] max-w-xl w-full flex flex-col animate-scale-in">
            <header className="relative px-8 py-6 border-b border-glass-stroke flex items-center justify-between bg-surface-container/20 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 shadow-inner">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-starlight-white font-headline text-xl tracking-tight">
                    {editingLog ? 'Edit Time Log' : 'Log Daily Hours'}
                  </h3>
                  <p className="text-xs text-secondary mt-1 font-mono">Record student OJT hours and notes</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="text-secondary hover:text-white bg-surface-container hover:bg-surface-container-highest p-2.5 rounded-xl transition-all cursor-pointer shadow-sm border border-glass-stroke/50 group"
              >
                <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>
            </header>

             <form onSubmit={handleSaveLog} className="p-8 space-y-6 text-starlight-white">

              {/* Log Entry Mode Selector (Only when creating new logs) */}
              {!editingLog && (
                <div className="flex bg-surface-container/40 p-1 rounded-lg border border-glass-stroke">
                  <button
                    type="button"
                    onClick={() => setFormLogMode('single')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                      formLogMode === 'single'
                        ? 'bg-primary-container text-white shadow-[0_0_10px_rgba(255,84,81,0.2)]'
                        : 'text-secondary hover:text-white hover:bg-surface-container/20'
                    }`}
                  >
                    Single Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLogMode('bulk')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                      formLogMode === 'bulk'
                        ? 'bg-primary-container text-white shadow-[0_0_10px_rgba(255,84,81,0.2)]'
                        : 'text-secondary hover:text-white hover:bg-surface-container/20'
                    }`}
                  >
                    Multiple Days (Bulk DTR)
                  </button>
                </div>
              )}

              {/* Student Selector */}
              <div className="relative" ref={modalStudentDropdownRef}>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Select Student *</label>
                <button
                  type="button"
                  onClick={() => setIsModalStudentDropdownOpen(!isModalStudentDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-surface-container border border-glass-stroke hover:border-glass-stroke-hover focus:border-outline rounded text-sm text-starlight-white transition-all duration-200 font-mono text-left cursor-pointer active:scale-[0.98]"
                >
                  <span className="truncate">
                    {formStudentId 
                      ? (() => {
                          const stud = studentMap.get(formStudentId);
                          return stud ? `${stud.lastName}, ${stud.firstName} (${stud.studentId}) — ${stud.course}` : '-- Choose Student --';
                        })()
                      : '-- Choose Student --'
                    }
                  </span>
                  <ChevronDown className={`h-4 w-4 text-secondary transition-transform duration-200 shrink-0 ml-1.5 ${isModalStudentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Popover with Slide/Fade Transition */}
                {isModalStudentDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-void-black/98 backdrop-blur-md border border-glass-stroke rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                    <div className="relative shrink-0">
                      <input
                        type="text"
                        value={modalStudentSearchQuery}
                        onChange={(e) => setModalStudentSearchQuery(e.target.value)}
                        placeholder="Search student name or ID..."
                        className="w-full pl-8 pr-7 py-1.5 bg-surface-container border border-glass-stroke rounded-lg text-xs text-starlight-white placeholder-secondary outline-none focus:border-primary/50 transition-all font-mono"
                        autoFocus
                      />
                      <Search className="h-3.5 w-3.5 text-secondary absolute left-2.5 top-2.5" />
                      {modalStudentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setModalStudentSearchQuery('')}
                          className="absolute right-2 top-2 text-secondary hover:text-starlight-white transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto max-h-48 divide-y divide-glass-stroke/10 pr-1 scrollbar-thin scrollbar-thumb-glass-stroke/40">
                      <button
                        type="button"
                        onClick={() => {
                          setFormStudentId('');
                          setIsModalStudentDropdownOpen(false);
                          setModalStudentSearchQuery('');
                        }}
                        className={`w-full text-left px-2.5 py-2 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer ${
                          formStudentId === ''
                            ? 'bg-primary-container/20 text-primary font-bold'
                            : 'text-secondary hover:text-white hover:bg-surface-container/60'
                        }`}
                      >
                        -- Choose Student --
                      </button>

                      {filteredStudentsForModalDropdown.length === 0 ? (
                        <div className="px-2.5 py-4 text-center text-xs text-secondary font-mono italic">
                          No matching students
                        </div>
                      ) : (
                        filteredStudentsForModalDropdown.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setFormStudentId(s.id);
                              setIsModalStudentDropdownOpen(false);
                              setModalStudentSearchQuery('');
                            }}
                            className={`w-full text-left px-2.5 py-2 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer truncate flex flex-col gap-0.5 ${
                              formStudentId === s.id
                                ? 'bg-primary-container/20 text-primary font-bold'
                                : 'text-secondary hover:text-white hover:bg-surface-container/60'
                            }`}
                          >
                            <span className="truncate">{s.lastName}, {s.firstName}</span>
                            <span className="text-[9px] text-secondary font-mono font-normal">ID: {s.studentId || 'N/A'} • {s.course}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 2: Date / Mode details & Break Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formLogMode === 'single' ? (
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Date *</label>
                    <input
                      type="date"
                      required={formLogMode === 'single'}
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white focus:border-outline outline-none transition-all font-mono"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] font-mono text-secondary uppercase block font-bold mb-1.5">Entry Mode</span>
                    <span className="text-xs text-sky-400 font-bold bg-sky-500/10 px-3 py-2.5 rounded border border-sky-500/20 font-mono">
                      📅 Bulk DTR Entry Mode
                    </span>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Break Duration (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={formBreakMinutes}
                    onChange={(e) => setFormBreakMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Overlap Warning */}
              {formLogMode === 'single' && overlapWarning && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-2 text-xs font-mono text-yellow-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{overlapWarning}</span>
                </div>
              )}

              {/* Date Checklist Selection (For Bulk Mode only) */}
              {formLogMode === 'bulk' && (
                <div className="space-y-4 border border-glass-stroke/40 rounded-xl p-4 bg-surface-container/20">
                  <h4 className="text-xs font-mono font-bold text-starlight-white uppercase tracking-wider">Bulk Date Generation</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Start Date *</label>
                      <input
                        type="date"
                        required={formLogMode === 'bulk'}
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white focus:border-outline outline-none transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Number of Working Days *</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required={formLogMode === 'bulk'}
                        value={formDaysToGenerate}
                        onChange={(e) => setFormDaysToGenerate(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white focus:border-outline outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <label className="flex items-center gap-2 text-secondary cursor-pointer hover:text-starlight-white transition-colors">
                      <input
                        type="checkbox"
                        checked={formExcludeWeekends}
                        onChange={(e) => setFormExcludeWeekends(e.target.checked)}
                        className="rounded border-glass-stroke bg-surface-container accent-primary"
                      />
                      Exclude Weekends (Sat / Sun)
                    </label>
                  </div>

                  {allDatesInRange.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">Dates Checklist</label>
                      <div className="max-h-40 overflow-y-auto border border-glass-stroke/40 rounded-lg p-2.5 bg-void-black/40 space-y-1.5 divide-y divide-glass-stroke/10 scrollbar-thin">
                        {allDatesInRange.map(dateStr => {
                          const dateObj = new Date(dateStr);
                          const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                          const isChecked = formBulkSelectedDates.includes(dateStr);
                          
                          // Look up conflicts for this specific date
                          const dateLogs = timeLogs.filter(l => l.studentId === formStudentId && l.date === dateStr);
                          const hasDateConflict = dateLogs.length > 0;
                          const conflictStatus = hasDateConflict ? dateLogs[0].status : null;

                          return (
                            <div key={dateStr} className="flex items-center justify-between pt-1.5 first:pt-0">
                              <label className={`flex items-center gap-2 text-xs font-mono cursor-pointer transition-colors ${isChecked ? 'text-starlight-white' : 'text-secondary/50'}`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormBulkSelectedDates(prev => [...prev, dateStr].sort());
                                    } else {
                                      setFormBulkSelectedDates(prev => prev.filter(d => d !== dateStr));
                                    }
                                  }}
                                  className="rounded border-glass-stroke bg-surface-container accent-primary"
                                />
                                <span>{dayLabel} {isWeekend && <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded">Weekend</span>}</span>
                              </label>

                              {hasDateConflict && (
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  conflictStatus === 'Approved'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : conflictStatus === 'Pending'
                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  Existing: {conflictStatus}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Summary counts */}
                  <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-glass-stroke/30">
                    <span className="text-secondary">Selected Days: <strong className="text-starlight-white">{formBulkSelectedDates.length} days</strong></span>
                    <span className="text-primary font-bold">Total Est. Hours: {(formBulkSelectedDates.length * effectiveFormHours).toFixed(1)} hrs</span>
                  </div>

                  {/* Conflict warnings */}
                  {bulkConflicts.hasConflict && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-2 text-xs font-mono text-yellow-400">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">⚠️ Duplicate Warning</strong>
                        <span className="opacity-90">
                          Selected student already has logs on {bulkConflicts.totalConflicts} of the selected date(s).
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Row 3: Time In & Time Out */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Time In *</label>
                  <input
                    type="time"
                    required
                    value={formTimeIn}
                    onChange={(e) => setFormTimeIn(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Time Out *</label>
                  <input
                    type="time"
                    required
                    value={formTimeOut}
                    onChange={(e) => setFormTimeOut(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white focus:border-outline outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Calculated Rendered Hours & Manual Override */}
              <div className="bg-surface-container/50 border border-glass-stroke p-3.5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-secondary">Rendered Hours:</span>
                  <span className="text-lg font-headline font-bold text-primary">
                    {effectiveFormHours.toFixed(2)} hrs
                  </span>
                </div>

                <div className="pt-2 border-t border-glass-stroke/30 flex items-center justify-between text-xs font-mono">
                  <label className="flex items-center gap-2 text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsManual}
                      onChange={(e) => setFormIsManual(e.target.checked)}
                      className="rounded border-glass-stroke bg-surface-container accent-primary"
                    />
                    Enable Manual Override
                  </label>
                  {formIsManual && (
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="24"
                      value={formManualHours}
                      onChange={(e) => setFormManualHours(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-surface-container border border-glass-stroke rounded text-xs text-starlight-white font-mono"
                    />
                  )}
                </div>

                {formIsManual && (
                  <div>
                    <label className="block text-[10px] font-mono text-yellow-300 mb-1">Reason for Manual Override *</label>
                    <input
                      type="text"
                      required={formIsManual}
                      value={formManualReason}
                      onChange={(e) => setFormManualReason(e.target.value)}
                      placeholder="e.g. Field assignment without biometric reader"
                      className="w-full px-2 py-1.5 bg-surface-container border border-yellow-500/40 rounded text-xs text-starlight-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Supervisor Notes / Remarks (Optional)</label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional supervisor observations or session notes..."
                  className="w-full px-3 py-2 bg-surface-container border border-glass-stroke rounded text-sm text-starlight-white placeholder-secondary focus:border-outline outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-glass-stroke">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-highest border border-glass-stroke rounded font-mono text-xs text-starlight-white hover:bg-outline transition-all cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-container text-white font-mono text-xs hover:bg-primary hover:text-void-black transition-colors shadow-[0_0_15px_rgba(255,84,81,0.3)] rounded cursor-pointer"
                >
                  {formLogMode === 'single' ? 'SAVE TIME LOG' : 'PROCEED TO SAVE'}
                </button>
              </div>
            </form>

          {/* 1. Bulk Conflict Dialog Overlay */}
          {bulkShowConflictDialog && (
            <div className="fixed inset-0 bg-void-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
              <div className="bg-void-black border border-glass-stroke rounded-xl p-6 max-w-md w-full shadow-2xl animate-scale-in text-white space-y-4 font-mono">
                <div className="flex items-center gap-2 text-yellow-400 font-headline font-bold text-lg">
                  <AlertTriangle className="h-6 w-6" />
                  DTR Conflicts Detected
                </div>

                <div className="text-xs space-y-2">
                  <p className="text-secondary">
                    The student already has daily time records on the following dates:
                  </p>
                  
                  <div className="max-h-28 overflow-y-auto bg-surface-container/20 border border-glass-stroke/40 rounded p-2 text-[11px] text-yellow-300 space-y-1 scrollbar-thin">
                    {bulkConflicts.approved.map(d => (
                      <div key={d} className="flex justify-between">
                        <span>{new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-green-400 font-bold bg-green-500/10 px-1 rounded border border-green-500/20">Approved (Protected)</span>
                      </div>
                    ))}
                    {bulkConflicts.pending.map(d => (
                      <div key={d} className="flex justify-between">
                        <span>{new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-yellow-400 font-bold bg-yellow-500/10 px-1 rounded border border-yellow-500/20">Pending (Overwritable)</span>
                      </div>
                    ))}
                    {bulkConflicts.rejected.map(d => (
                      <div key={d} className="flex justify-between">
                        <span>{new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-red-400 font-bold bg-red-500/10 px-1 rounded border border-red-500/20">Rejected (Overwritable)</span>
                      </div>
                    ))}
                  </div>

                  {bulkConflicts.approved.length > 0 && (
                    <p className="text-red-400/90 text-[10px] italic border-t border-glass-stroke/20 pt-2">
                      * Note: Approved records are protected history and will not be overwritten.
                    </p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-glass-stroke/30">
                  <button
                    type="button"
                    onClick={() => {
                      const eligibleCount = formBulkSelectedDates.length - bulkConflicts.approved.length;
                      if (eligibleCount <= 0 && bulkConflicts.approved.length > 0) {
                        toast.error('No new dates to create. All selected dates are approved and protected.');
                        return;
                      }
                      executeBulkSave(false);
                    }}
                    className="w-full py-2.5 bg-surface-container hover:bg-surface-container-highest border border-glass-stroke text-starlight-white rounded text-xs transition-colors cursor-pointer flex flex-col items-center justify-center"
                  >
                    <strong>Skip Existing Dates</strong>
                    <span className="text-[10px] text-secondary">Create only the dates that don't already have records</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (bulkConflicts.approved.length === formBulkSelectedDates.length) {
                        toast.error('All conflicting dates are approved and protected. Nothing to replace.');
                        return;
                      }
                      executeBulkSave(true);
                    }}
                    className="w-full py-2.5 bg-primary-container hover:bg-primary text-white rounded text-xs transition-colors cursor-pointer flex flex-col items-center justify-center"
                  >
                    <strong>Replace Existing Records</strong>
                    <span className="text-[10px] opacity-80 text-secondary">Replace Pending/Rejected logs (Approved logs remain unchanged)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkShowConflictDialog(false)}
                    className="w-full py-2 border border-glass-stroke hover:bg-surface-container/40 text-secondary hover:text-starlight-white rounded text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Bulk Final Confirmation Dialog */}
          {bulkShowFinalConfirmation && (
            <div className="fixed inset-0 bg-void-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
              <div className="bg-void-black border border-glass-stroke rounded-xl p-6 max-w-md w-full shadow-2xl animate-scale-in text-white space-y-4 font-mono">
                <h3 className="font-bold text-starlight-white font-headline text-lg border-b border-glass-stroke pb-3 flex items-center gap-2">
                  <CheckCheck className="h-5 w-5 text-green-400" />
                  Confirm Bulk DTR Entry
                </h3>

                <div className="text-xs space-y-3 bg-surface-container/20 border border-glass-stroke/40 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-secondary">Student:</span>
                    <span className="text-starlight-white font-bold">{(() => {
                      const stud = studentMap.get(formStudentId);
                      return stud ? `${stud.lastName}, ${stud.firstName}` : 'Unknown';
                    })()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Start Date:</span>
                    <span className="text-starlight-white font-semibold">{formatDateToLong(formStartDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Working Days:</span>
                    <span className="text-starlight-white font-semibold">{formDaysToGenerate} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Time:</span>
                    <span className="text-starlight-white">{formatTimeTo12h(formTimeIn)} – {formatTimeTo12h(formTimeOut)}</span>
                  </div>
                  <div className="flex justify-between border-t border-glass-stroke/10 pt-2">
                    <span className="text-secondary">Selected DTR Dates:</span>
                    <span className="text-sky-400 font-bold">{formBulkSelectedDates.length} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Total Estimated Hours:</span>
                    <span className="text-primary font-bold">{(formBulkSelectedDates.length * effectiveFormHours).toFixed(1)} hrs</span>
                  </div>
                  <div className="flex justify-between border-t border-glass-stroke/10 pt-2">
                    <span className="text-secondary">Status:</span>
                    <span className="text-yellow-400 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">Pending Approval</span>
                  </div>
                  {(() => {
                    const excludedDates = allDatesInRange.filter(d => !formBulkSelectedDates.includes(d));
                    return excludedDates.length > 0 ? (
                      <div className="border-t border-glass-stroke/20 pt-2 text-[10px]">
                        <span className="text-secondary block mb-1">Excluded Dates ({excludedDates.length}):</span>
                        <div className="max-h-20 overflow-y-auto bg-red-500/5 border border-red-500/10 rounded p-1.5 text-red-400/90 font-mono space-y-0.5 scrollbar-thin">
                          {excludedDates.map(d => (
                            <div key={d}>• {formatDateToLong(d)}</div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <p className="text-[10px] text-secondary italic">
                  * Note: These records will require coordinator/supervisor approval before counting toward approved OJT hours.
                </p>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBulkShowFinalConfirmation(false)}
                    className="flex-1 py-2 bg-surface-container hover:bg-surface-container-highest border border-glass-stroke text-secondary hover:text-starlight-white rounded text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => executeBulkSave(false)}
                    className="flex-1 py-2 bg-primary-container text-white font-bold rounded text-xs hover:bg-primary hover:text-void-black transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,84,81,0.3)]"
                  >
                    Confirm & Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Bulk Results Dialog Overlay */}
          {bulkResultsData && (
            <div className="fixed inset-0 bg-void-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
              <div className="bg-void-black border border-glass-stroke rounded-xl p-6 max-w-md w-full shadow-2xl animate-scale-in text-white space-y-4 font-mono">
                <h3 className="font-bold text-starlight-white font-headline text-lg border-b border-glass-stroke pb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-400" />
                  Bulk DTR Entry Completed
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                    <span>✓ Records Created:</span>
                    <span className="font-bold">{bulkResultsData.createdCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    <span>↷ Existing Records Skipped:</span>
                    <span className="font-bold">{bulkResultsData.skippedCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <span>✎ Existing Records Replaced:</span>
                    <span className="font-bold">{bulkResultsData.replacedCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <span>⚠ Approved Records Protected:</span>
                    <span className="font-bold">{bulkResultsData.protectedCount}</span>
                  </div>

                  {bulkResultsData.failedCount > 0 && (
                    <div className="flex items-center justify-between p-2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      <span>✗ Entries Failed:</span>
                      <span className="font-bold">{bulkResultsData.failedCount}</span>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-secondary italic">
                  All newly logged entries are initialized in "Pending" status and will require review.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setBulkResultsData(null);
                    setIsLogModalOpen(false); // Close the main modal too
                  }}
                  className="w-full py-2 bg-primary-container text-white font-bold rounded text-xs hover:bg-primary hover:text-void-black transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingLogId && (
        <div className="fixed inset-0 bg-void-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-void-black/95 rounded-xl border border-glass-stroke shadow-[0_8px_32px_rgba(0,0,0,0.8)] max-w-md w-full p-6 space-y-4 animate-scale-in text-white">
            <div className="flex items-center gap-2 text-red-400 font-headline font-bold text-lg">
              <XCircle className="h-6 w-6" />
              Reject Time Log Entry
            </div>

            <p className="text-xs text-secondary font-mono">
              Please specify the exact reason for rejecting this daily time log entry. The rejection reason will be recorded in the system audit logs.
            </p>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-widest text-secondary mb-1.5">Rejection Reason *</label>
              <textarea
                required
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Missing supervisor signature verification / Invalid time log entry..."
                className="w-full px-3 py-2 bg-surface-container border border-red-500/40 rounded text-sm text-starlight-white placeholder-secondary focus:border-red-500 outline-none transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingLogId(null);
                  setRejectionReasonInput('');
                }}
                className="px-4 py-2 bg-surface-container text-secondary hover:text-starlight-white rounded font-mono text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                REJECT LOG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DTR Printable Report Modal */}
      {isDtrReportModalOpen && (
        <div className="fixed inset-0 bg-void-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            {/* Modal Header (Hidden on Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-sky-400" />
                <h3 className="font-bold font-headline text-base">Official Daily Time Record (DTR) Preview</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="h-4 w-4" /> PRINT / SAVE PDF
                </button>
                <button 
                  onClick={() => setIsDtrReportModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* DTR Selector & Controls (Hidden on Print) */}
            <div className="p-4 bg-slate-100 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Student</label>
                <select
                  value={dtrReportStudentId}
                  onChange={(e) => setDtrReportStudentId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.lastName}, {s.firstName} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Period Filter</label>
                <select
                  value={dtrReportPeriod}
                  onChange={(e) => setDtrReportPeriod(e.target.value as any)}
                  className="w-full p-2 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                >
                  <option value="ALL">Entire Period (All Approved Logs)</option>
                  <option value="MONTHLY">Specific Month</option>
                </select>
              </div>

              {dtrReportPeriod === 'MONTHLY' && (
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Select Month</label>
                  <input
                    type="month"
                    value={dtrReportMonth}
                    onChange={(e) => setDtrReportMonth(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* PRINTABLE DTR CONTENT */}
            <div className="flex-1 overflow-y-auto p-8 font-serif space-y-6 text-slate-900 bg-white" id="dtr-print-area">
              {/* Letterhead Header */}
              <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
                <p className="text-xs uppercase tracking-widest font-sans font-bold text-slate-600">OFFICIAL ON-THE-JOB TRAINING DOCUMENT</p>
                <h1 className="text-2xl font-bold font-serif uppercase tracking-wider text-slate-900">DAILY TIME RECORD</h1>
                <p className="text-xs font-sans italic text-slate-600">Verified & Approved Student Attendance Sheet</p>
              </div>

              {/* Student & Office Meta Grid */}
              {dtrReportStudent ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-sans border-b border-slate-300 pb-4">
                  <div>
                    <span className="font-bold text-slate-700">STUDENT NAME:</span>{' '}
                    <span className="font-bold text-slate-900 uppercase">{dtrReportStudent.lastName}, {dtrReportStudent.firstName} {dtrReportStudent.middleName || ''}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">STUDENT ID NO:</span>{' '}
                    <span className="font-mono text-slate-900">{dtrReportStudent.studentId}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">SCHOOL / CAMPUS:</span>{' '}
                    <span className="text-slate-900">{dtrReportStudent.school || 'Pangasinan State University'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">DEGREE / PROGRAM:</span>{' '}
                    <span className="text-slate-900">{dtrReportStudent.course}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">HOST ESTABLISHMENT / OFFICE:</span>{' '}
                    <span className="text-slate-900">{dtrReportStudent.office || 'Partner Host Agency'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">REQUIRED HOURS:</span>{' '}
                    <span className="font-bold text-slate-900 font-mono">{dtrReportStudent.hoursRequired} Hours</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs italic text-red-600 font-sans">Please select a student to generate the DTR.</p>
              )}

              {/* DTR Daily Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse border border-slate-400 font-sans">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-400 font-bold uppercase text-[10px] text-slate-800">
                      <th className="border border-slate-400 p-2 text-center">Date</th>
                      <th className="border border-slate-400 p-2 text-center">Time In</th>
                      <th className="border border-slate-400 p-2 text-center">Time Out</th>
                      <th className="border border-slate-400 p-2 text-center">Break</th>
                      <th className="border border-slate-400 p-2 text-center">Hours</th>
                      <th className="border border-slate-400 p-2">Notes / Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dtrReportLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center italic text-slate-500">
                          No approved daily time logs recorded for this period.
                        </td>
                      </tr>
                    ) : (
                      dtrReportLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-300">
                          <td className="border border-slate-300 p-2 font-mono text-center font-bold">{log.date}</td>
                          <td className="border border-slate-300 p-2 font-mono text-center">{log.timeIn}</td>
                          <td className="border border-slate-300 p-2 font-mono text-center">{log.timeOut}</td>
                          <td className="border border-slate-300 p-2 font-mono text-center">{log.breakMinutes || 0}m</td>
                          <td className="border border-slate-300 p-2 font-mono text-center font-bold">{log.hoursRendered.toFixed(2)}</td>
                          <td className="border border-slate-300 p-2">{log.notes || ''}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats Box */}
              {dtrReportStudent && (
                <div className="bg-slate-50 border border-slate-300 p-4 rounded text-xs font-sans grid grid-cols-3 gap-4 text-center">
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Total Approved Hours</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{dtrReportTotalHours.toFixed(2)} hrs</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Required Hours</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{dtrReportStudent.hoursRequired} hrs</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-bold uppercase text-[10px]">Remaining Hours</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {Math.max(0, dtrReportStudent.hoursRequired - dtrReportTotalHours).toFixed(2)} hrs
                    </span>
                  </div>
                </div>
              )}

              {/* Signature Blocks */}
              <div className="pt-12 grid grid-cols-3 gap-8 text-center font-sans text-xs">
                <div>
                  <div className="border-b border-slate-600 mb-1" />
                  <p className="font-bold text-slate-900 uppercase">{dtrReportStudent ? `${dtrReportStudent.firstName} ${dtrReportStudent.lastName}` : 'Student'}</p>
                  <p className="text-[10px] text-slate-500">Student Intern Signature</p>
                </div>

                <div>
                  <div className="border-b border-slate-600 mb-1" />
                  <p className="font-bold text-slate-900 uppercase">Supervisor / Head</p>
                  <p className="text-[10px] text-slate-500">Company/Office Training Supervisor</p>
                </div>

                <div>
                  <div className="border-b border-slate-600 mb-1" />
                  <p className="font-bold text-slate-900 uppercase">{userName || 'Coordinator'}</p>
                  <p className="text-[10px] text-slate-500">University Coordinator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
