import { OJTStudent, RecordItem, OJTNotification, NotificationType, NotificationState } from '../types';
import { computeStudentProgress, StudentProgressResult, ProgressConfig } from './progress';

export interface EvaluationContext {
  records: RecordItem[];
  progressConfig?: ProgressConfig;
  now?: Date;
}

export interface NotificationEvaluator {
  id: string;
  type: NotificationType;
  evaluate(
    student: OJTStudent,
    progress: StudentProgressResult,
    context: EvaluationContext
  ): OJTNotification | null;
}

// Helper to construct deterministic hash keys for duplicate suppression
export function generateNotificationHashKey(studentId: string | undefined, type: NotificationType): string {
  return `${studentId || 'global'}:${type}`;
}

// Helper to format proper student names
function formatStudentName(student: OJTStudent): string {
  const parts = [student.firstName];
  if (student.middleName) parts.push(student.middleName);
  parts.push(student.lastName);
  return parts.filter(Boolean).join(' ');
}

// --------------------------------------------------
// Rule Evaluator 1: Halfway Progress Reminder
// --------------------------------------------------
export const HalfwayProgressEvaluator: NotificationEvaluator = {
  id: 'halfway-progress-evaluator',
  type: 'HALFWAY_PROGRESS',
  evaluate(student, progress, context) {
    if (!progress.isWithinTrackingWindow || !progress.isHalfway) {
      return null;
    }

    const studentName = formatStudentName(student);
    const hashKey = generateNotificationHashKey(student.id, 'HALFWAY_PROGRESS');

    return {
      id: `notif-halfway-${student.id}`,
      hashKey,
      studentId: student.id,
      studentName,
      type: 'HALFWAY_PROGRESS',
      state: 'Unread',
      title: 'Halfway Internship Milestone',
      message: `Student ${studentName} has reached approximately ${progress.progressPercentage}% of their internship (${progress.hoursElapsed} of ${progress.hoursRequired} hrs). Please review their Time In/Time Out records.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actionPayload: {
        tab: 'students',
        studentId: student.id,
      },
    };
  },
};

// --------------------------------------------------
// Rule Evaluator 2: Missing MOA Document Reminder
// --------------------------------------------------
export const MissingMoaEvaluator: NotificationEvaluator = {
  id: 'missing-moa-evaluator',
  type: 'MISSING_MOA',
  evaluate(student, progress, context) {
    if (!progress.isWithinTrackingWindow || !progress.isHalfway) {
      return null;
    }

    // Check if MOA is unassigned or assigned MOA record doesn't exist/active
    const hasLinkedMoa = Boolean(student.moaId);
    const linkedRecord = context.records.find((r) => r.id === student.moaId && r.type === 'MOA');
    const isMoaValid = hasLinkedMoa && linkedRecord && linkedRecord.status === 'Active';

    if (isMoaValid) {
      return null; // Condition resolved or valid
    }

    const studentName = formatStudentName(student);
    const hashKey = generateNotificationHashKey(student.id, 'MISSING_MOA');

    return {
      id: `notif-moa-${student.id}`,
      hashKey,
      studentId: student.id,
      studentName,
      type: 'MISSING_MOA',
      state: 'Unread',
      title: 'Missing MOA Document',
      message: `Student ${studentName} has reached 50% progress, but their Memorandum of Agreement (MOA) has not yet been submitted or assigned.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actionPayload: {
        tab: 'students',
        studentId: student.id,
      },
    };
  },
};

// --------------------------------------------------
// Rule Evaluator 3: Missing Letter of Acceptance (LO) Reminder
// --------------------------------------------------
export const MissingLoEvaluator: NotificationEvaluator = {
  id: 'missing-lo-evaluator',
  type: 'MISSING_LO',
  evaluate(student, progress, context) {
    if (!progress.isWithinTrackingWindow || !progress.isHalfway) {
      return null;
    }

    // Check if student has an active LO attached or issued LO record
    const hasLoRecord = context.records.some(
      (r) => r.type === 'LO' && (r.title.toLowerCase().includes(student.lastName.toLowerCase()) || r.studentIds?.includes(student.id))
    );

    if (hasLoRecord) {
      return null;
    }

    const studentName = formatStudentName(student);
    const hashKey = generateNotificationHashKey(student.id, 'MISSING_LO');

    return {
      id: `notif-lo-${student.id}`,
      hashKey,
      studentId: student.id,
      studentName,
      type: 'MISSING_LO',
      state: 'Unread',
      title: 'Missing Letter of Acceptance',
      message: `Student ${studentName} has reached 50% progress, but their Letter of Acceptance (LO) document is missing.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actionPayload: {
        tab: 'students',
        studentId: student.id,
      },
    };
  },
};

// --------------------------------------------------
// Development Placeholder Generator
// --------------------------------------------------
export function createDevelopmentPlaceholderNotification(): OJTNotification {
  return {
    id: 'notif-dev-placeholder',
    hashKey: 'global:DEV_PLACEHOLDER',
    type: 'DEV_PLACEHOLDER',
    state: 'Unread',
    title: 'Development Placeholder',
    message: 'Development Placeholder — Notification system is active. No students currently meet the notification criteria.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPlaceholder: true,
  };
}

// --------------------------------------------------
// Notification Engine (Registry & Lifecycle State Manager)
// --------------------------------------------------
export class NotificationEngine {
  private evaluators: NotificationEvaluator[] = [];

  constructor() {
    // Register default evaluators
    this.registerEvaluator(HalfwayProgressEvaluator);
    this.registerEvaluator(MissingMoaEvaluator);
    this.registerEvaluator(MissingLoEvaluator);
  }

  /**
   * Registers a new independent notification evaluator module.
   */
  public registerEvaluator(evaluator: NotificationEvaluator): void {
    if (!this.evaluators.some((e) => e.id === evaluator.id)) {
      this.evaluators.push(evaluator);
    }
  }

  /**
   * Evaluates all students against registered rule modules, manages lifecycle states,
   * suppresses duplicates, and returns active notifications.
   */
  public evaluateAll(
    students: OJTStudent[],
    records: RecordItem[],
    storedState: OJTNotification[] = [],
    config?: ProgressConfig
  ): OJTNotification[] {
    const context: EvaluationContext = { records, progressConfig: config, now: new Date() };
    const activeHashes = new Set<string>();
    const newlyGenerated: OJTNotification[] = [];

    // Map existing stored state by hash key
    const stateMap = new Map<string, OJTNotification>();
    storedState.forEach((n) => {
      stateMap.set(n.hashKey, n);
    });

    for (const student of students) {
      const progress = computeStudentProgress(student, config);

      for (const evaluator of this.evaluators) {
        const notif = evaluator.evaluate(student, progress, context);
        if (notif) {
          activeHashes.add(notif.hashKey);

          const existing = stateMap.get(notif.hashKey);
          if (existing) {
            // Preserve user lifecycle states (Read / Archived) unless auto-reopening
            newlyGenerated.push({
              ...notif,
              id: existing.id,
              state: existing.state,
              createdAt: existing.createdAt,
            });
          } else {
            // Brand new notification
            newlyGenerated.push(notif);
          }
        }
      }
    }

    // Filter out resolved notifications (whose conditions are no longer met)
    const activeList = newlyGenerated.filter((n) => n.state !== 'Resolved' && n.state !== 'Archived');

    // Preserve notifications that were created outside the engine (e.g. PROFILE_REQUEST)
    for (const stored of storedState) {
      if (!activeHashes.has(stored.hashKey) && stored.state !== 'Resolved' && stored.state !== 'Archived') {
        activeList.push(stored);
      }
    }

    // If zero notifications exist, append Development Placeholder
    if (activeList.length === 0) {
      const existingDev = stateMap.get('global:DEV_PLACEHOLDER');
      if (existingDev && existingDev.state === 'Read') {
        activeList.push(existingDev);
      } else {
        activeList.push(createDevelopmentPlaceholderNotification());
      }
    }

    // Sort newest first
    activeList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return activeList;
  }
}

// Global engine singleton instance
export const defaultNotificationEngine = new NotificationEngine();
