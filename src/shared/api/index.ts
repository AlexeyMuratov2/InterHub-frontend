export { request, API_BASE, setSessionExpiredHandler } from './client';
export type { ErrorResponse } from './client';
export * from './auth';
export {
  validateToken,
  acceptInvitation,
  listInvitations,
  getInvitation,
  createInvitation,
  resendInvitation,
  cancelInvitation,
} from './invitations';
export type {
  ApiResult as InvitationsApiResult,
  ValidateTokenResult,
  AcceptInvitationResult,
  ListInvitationsParams,
} from './invitations';

export {
  getMe,
  patchMe,
  listUsers,
  getUser,
  patchUser,
  deleteUser,
  listTeachers,
  listStudents,
} from './account';
export type { ApiResult as AccountApiResult, ListUsersParams, ListTeachersParams, ListStudentsParams } from './account';
export type {
  LoginRequest,
  AuthResult,
  UserDto,
  TokenValidationResult,
  AcceptInvitationRequest,
  InvitationDto,
  InvitationPage,
  InvitationStatus,
  CreateInvitationRequest,
  CreateStudentRequest,
  CreateTeacherRequest,
  AccountUserDto,
  AccountUserPage,
  TeacherProfileDto,
  StudentProfileDto,
  UserWithProfilesDto,
  UpdateProfileRequest,
  UpdateUserRequest,
  UpdateStudentProfileRequest,
  UpdateTeacherProfileRequest,
  TeacherDto,
  TeacherProfileItem,
  TeacherListPage,
  StudentDto,
  StudentProfileItem,
  StudentListPage,
  LessonDto,
  OfferingSummaryDto,
  SlotSummaryDto,
  TeacherRoleDto,
  RoomSummaryDto,
  TeacherSummaryDto,
  GroupSummaryDto,
  LessonForScheduleDto,
  RoomDto,
  UpdateLessonRequest,
  SemesterByDateDto,
  AcademicYearDto,
  SemesterDto,
  GroupInfoDto,
  TeacherSubjectListItemDto,
} from './types';
export { INVITATION_STATUS, INVITATION_VALIDATION_CODE } from './types';

export {
  getGroupLessonsWeek,
  getTeacherLessonsWeek,
  getLesson,
  updateLesson,
  deleteLesson,
  listRooms,
} from './schedule';
export {
  getSemesterByDate,
  getAcademicYears,
  getSemestersByYear,
  getCurrentSemester,
} from './academic';
export type { AcademicApiResult } from './academic';
export { getTeacherMySubjects, getTeacherSubjectDetail } from './subjects';
export type { SubjectsApiResult, GetTeacherMySubjectsParams } from './subjects';
export {
  uploadFile,
  addCourseMaterial,
  getOfferingMaterials,
  getMaterial,
  deleteMaterial,
  getFileDownloadUrl,
  getFilePreviewUrl,
} from './materials';
export type { MaterialsApiResult } from './materials';
export type {
  TeacherSubjectDetailDto,
  SubjectInfoDto,
  CurriculumSubjectInfoDto,
  CurriculumSubjectAssessmentInfoDto,
  StoredFileInfoDto,
  CourseMaterialInfoDto,
  GroupSubjectOfferingInfoDto,
  StoredFileDto,
  CourseMaterialDto,
  AddCourseMaterialRequest,
  PresignedUrlResponse,
} from './types';

export { getLessonFullDetails } from './composition';
export type { CompositionApiResult } from './composition';
export {
  listLessonMaterials,
  createLessonMaterial,
  getLessonMaterial,
  deleteLessonMaterial,
  addLessonMaterialFiles,
  removeLessonMaterialFile,
} from './lessonMaterials';
export type { LessonMaterialsApiResult } from './lessonMaterials';
export {
  listLessonHomework,
  getHomework,
  createHomework,
  updateHomework,
  deleteHomework,
} from './homework';
export type { HomeworkApiResult } from './homework';
export type {
  LessonFullDetailsDto,
  CompositionLessonDto,
  CompositionSubjectDto,
  CompositionStudentGroupDto,
  CompositionOfferingDto,
  CompositionOfferingSlotDto,
  CompositionCurriculumSubjectDto,
  CompositionRoomDto,
  CompositionTeacherDto,
  CompositionStoredFileDto,
  CompositionLessonMaterialDto,
  CompositionHomeworkDto,
  LessonMaterialDto,
  CreateLessonMaterialRequest,
  AddLessonMaterialFilesRequest,
  HomeworkDto,
  CreateHomeworkRequest,
  UpdateHomeworkRequest,
} from './types';

export { listTeacherNotices, approveNotice, rejectNotice, ABSENCE_NOTICE_STATUS } from './attendance';
export type {
  AttendanceApiResult,
  AbsenceNoticeDto,
  AbsenceNoticeStatus,
  RespondToAbsenceNoticeRequest,
  TeacherNoticeStudentSummary,
  TeacherNoticeLessonSummary,
  TeacherNoticeOfferingSummary,
  TeacherNoticeSlotSummary,
  TeacherNoticeGroupSummary,
  TeacherAbsenceNoticeItemDto,
  TeacherAbsenceNoticePage,
  ListTeacherNoticesParams,
} from './attendance';
