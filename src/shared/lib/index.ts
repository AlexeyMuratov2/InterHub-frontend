/** Общие утилиты, форматтеры, хелперы дат — добавлять по мере необходимости */
export { truncate } from './truncate';
export { getDisplayName } from './displayName';
export {
  getAssessmentTypeDisplayName,
  KNOWN_ASSESSMENT_TYPE_CODES,
  type KnownAssessmentTypeCode,
} from './assessmentTypeDisplayName';
export { parseFieldErrors } from './parseFieldErrors';
export {
  timeToMinutes,
  minutesToTime,
  durationMinutes,
  getTimeBoundaries,
  getTimeSegments,
  buildAxisRange,
  buildTimeTicks,
} from './timeUtils';
export {
  mapLessonsForScheduleToEvents,
  getDisplayTeacher,
  formatRoomLine,
  type ScheduleEvent,
} from './schedule';
export { getIsoWeekStart, getIsoWeekEnd } from './weekUtils';
