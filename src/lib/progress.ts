import { OJTStudent } from '../types';

export interface ProgressConfig {
  halfwayThreshold?: number; // default 0.50 (50%)
  trackingWindowDays?: number; // default 7 days post-start
  hoursPerWeekday?: number; // default 8
}

export interface StudentProgressResult {
  studentId: string;
  hoursRequired: number;
  hoursElapsed: number; // working hours elapsed (Mon-Fri, 8h/day)
  progressPercentage: number;
  daysSinceStart: number;
  isWithinTrackingWindow: boolean;
  isHalfway: boolean;
  isCompleted: boolean;
}

/**
 * Calculates working hours between two dates (inclusive of startDate, up to current/endDate).
 * Only counts Mondays through Fridays (8 working hours/day).
 */
export function calculateWorkingHoursElapsed(
  startDateStr?: string,
  endDateStr?: string,
  targetDate: Date = new Date(),
  hoursPerWeekday: number = 8
): { hoursElapsed: number; daysSinceStart: number } {
  if (!startDateStr) {
    return { hoursElapsed: 0, daysSinceStart: 0 };
  }

  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);

  const today = new Date(targetDate);
  today.setHours(23, 59, 59, 999);

  let limit = today;
  if (endDateStr) {
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    if (end < today) {
      limit = end;
    }
  }

  const msDiff = today.getTime() - start.getTime();
  const daysSinceStart = Math.floor(msDiff / (1000 * 60 * 60 * 24));

  if (limit < start) {
    return { hoursElapsed: 0, daysSinceStart };
  }

  let workingDays = 0;
  const current = new Date(start);

  while (current <= limit) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  const hoursElapsed = workingDays * hoursPerWeekday;
  return { hoursElapsed, daysSinceStart };
}

/**
 * Computes progress metrics for a given OJT student.
 */
export function computeStudentProgress(
  student: OJTStudent,
  config: ProgressConfig = {}
): StudentProgressResult {
  const halfwayThreshold = config.halfwayThreshold ?? 0.50;
  const trackingWindowDays = config.trackingWindowDays ?? 7;
  const hoursPerWeekday = config.hoursPerWeekday ?? 8;

  const hoursRequired = student.hoursRequired || 480;

  const { hoursElapsed: computedElapsed, daysSinceStart } = calculateWorkingHoursElapsed(
    student.startDate,
    student.endDate,
    new Date(),
    hoursPerWeekday
  );

  // Use max of recorded hoursCompleted or computed elapsed hours
  const hoursElapsed = Math.max(student.hoursCompleted || 0, computedElapsed);
  const progressPercentage = Math.min(100, Math.round((hoursElapsed / hoursRequired) * 100));

  // Initial Tracking rule: begin tracking once current date is within 7 days after start date or start date has passed
  const isWithinTrackingWindow = Boolean(student.startDate) && daysSinceStart >= -trackingWindowDays;

  const isHalfway = progressPercentage >= (halfwayThreshold * 100) && progressPercentage < 100;
  const isCompleted = progressPercentage >= 100 || student.status === 'Completed';

  return {
    studentId: student.id,
    hoursRequired,
    hoursElapsed,
    progressPercentage,
    daysSinceStart,
    isWithinTrackingWindow,
    isHalfway,
    isCompleted,
  };
}
