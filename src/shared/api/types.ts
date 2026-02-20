/** Ответ об ошибке от API */
export interface ErrorResponse {
  code?: string;
  message: string;
  timestamp?: string;
  details?: Record<string, string> | string[];
}

/** Тело запроса входа (POST /api/auth/login) */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Успешный ответ входа / refresh (200). Бэкенд может отдавать role или roles. */
export interface AuthResult {
  userId: string;
  email: string;
  /** Одна роль (если бэкенд отдаёт так) */
  role?: string;
  /** Несколько ролей (если бэкенд отдаёт массив) */
  roles?: string[];
  fullName: string;
  message?: string;
}

/** Текущий пользователь (GET /api/auth/me). Нормализованные roles доступны через getRolesFromUser(). */
export interface UserDto {
  userId: string;
  email: string;
  role?: string;
  roles?: string[];
  fullName?: string;
}

/** Коды исходов валидации токена приглашения */
export const INVITATION_VALIDATION_CODE = {
  /** Токен истёк — письмо переотправлено (200) */
  TOKEN_EXPIRED_EMAIL_RESENT: 'INVITATION_TOKEN_EXPIRED_EMAIL_RESENT',
  /** Токен недействителен или уже использован (400) */
  TOKEN_INVALID: 'INVITATION_TOKEN_INVALID',
  /** Срок действия приглашения истёк, 90 дней (400) */
  INVITATION_EXPIRED: 'INVITATION_EXPIRED',
  /** Приглашение недоступно — принято/отменено (400) */
  NOT_ACCEPTABLE: 'INVITATION_NOT_ACCEPTABLE',
} as const;

/** Ответ валидации токена приглашения (GET /api/invitations/validate) */
export interface TokenValidationResult {
  valid: boolean;
  /** Код исхода; null при успехе */
  code?: string | null;
  invitationId?: string | null;
  userId?: string | null;
  email?: string | null;
  role?: string;
  roles?: string[] | null;
  firstName?: string | null;
  lastName?: string | null;
  tokenRegenerated?: boolean;
  error?: string | null;
}

/** Тело запроса принятия приглашения (POST /api/invitations/accept) */
export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

/** Статусы приглашения (InvitationStatus) */
export const INVITATION_STATUS = {
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  ACCEPTED: 'ACCEPTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type InvitationStatus = (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

/** Приглашение (InvitationDto) */
export interface InvitationDto {
  id: string;
  userId: string;
  email: string | null;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  status: InvitationStatus;
  invitedById: string | null;
  emailSentAt: string | null;
  emailAttempts: number;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

/** Страница списка приглашений с курсорной пагинацией (GET /api/invitations) */
export interface InvitationPage {
  items: InvitationDto[];
  nextCursor: string | null;
}

/** Данные студента при создании приглашения (CreateStudentRequest) */
export interface CreateStudentRequest {
  studentId: string;
  chineseName?: string | null;
  faculty: string;
  course?: string | null;
  enrollmentYear?: number | null;
  groupName?: string | null;
}

/** Данные преподавателя при создании приглашения (CreateTeacherRequest) */
export interface CreateTeacherRequest {
  teacherId: string;
  faculty: string;
  englishName?: string | null;
  position?: string | null;
}

// --- Модуль Account (GET/PATCH /api/account/me, GET/PATCH/DELETE /api/account/users) ---

/** Пользователь в API account: текущий пользователь и пользователи списка/по id (UserDto) */
export interface AccountUserDto {
  id: string;
  email: string;
  roles: string[];
  status: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthDate: string | null;
  createdAt: string;
  activatedAt: string | null;
  lastLoginAt: string | null;
}

/** Постраничный список пользователей (UserPage) */
export interface AccountUserPage {
  items: AccountUserDto[];
  nextCursor: string | null;
}

/** Профиль преподавателя (TeacherDto). GET /api/account/users/{id} → teacherProfile. */
export interface TeacherProfileDto {
  id: string;
  userId: string;
  teacherId: string | null;
  faculty: string;
  englishName: string | null;
  position: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Профиль студента (StudentDto). GET /api/account/users/{id} → studentProfile. */
export interface StudentProfileDto {
  id: string;
  userId: string;
  studentId: string | null;
  chineseName: string | null;
  faculty: string;
  course: string | null;
  enrollmentYear: number | null;
  groupName: string | null;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Тело PATCH профиля студента (если бэкенд поддерживает). */
export interface UpdateStudentProfileRequest {
  studentId?: string | null;
  chineseName?: string | null;
  faculty?: string | null;
  course?: string | null;
  enrollmentYear?: number | null;
  groupName?: string | null;
}

/** Тело PATCH профиля преподавателя (если бэкенд поддерживает). */
export interface UpdateTeacherProfileRequest {
  teacherId?: string | null;
  faculty?: string | null;
  englishName?: string | null;
  position?: string | null;
}

/** Ответ GET /api/account/users/{id}: пользователь и профили по ролям. */
export interface UserWithProfilesDto {
  user: AccountUserDto;
  teacherProfile: TeacherProfileDto | null;
  studentProfile: StudentProfileDto | null;
}

/** Тело PATCH /api/account/me (UpdateProfileRequest) */
export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: string | null;
}

/** Тело PATCH /api/account/users/{id} (UpdateUserRequest). Профили передаются в том же запросе. */
export interface UpdateUserRequest {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  roles?: string[] | null;
  /** Данные профиля студента — передавать при роли STUDENT (создание/обновление в одном PATCH). */
  studentProfile?: UpdateStudentProfileRequest | null;
  /** Данные профиля преподавателя — передавать при роли TEACHER (создание/обновление в одном PATCH). */
  teacherProfile?: UpdateTeacherProfileRequest | null;
}

/** Учитель из GET /api/account/teachers (TeacherDto). userId передаётся в curatorUserId группы. */
export interface TeacherDto {
  id: string;
  userId: string;
  teacherId: string | null;
  faculty: string | null;
  englishName: string | null;
  position: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Элемент списка учителей (TeacherProfileItem) */
export interface TeacherProfileItem {
  profile: TeacherDto;
  displayName: string;
}

/** Постраничный список учителей (TeacherListPage) */
export interface TeacherListPage {
  items: TeacherProfileItem[];
  nextCursor: string | null;
}

// --- Список студентов для добавления в группу (GET /api/account/students) ---

/** Студент из GET /api/account/students (StudentDto). profile.id передаётся в studentId при добавлении в группу. */
export interface StudentDto {
  id: string;
  userId: string;
  studentId: string | null;
  chineseName: string | null;
  faculty: string | null;
  course: string | null;
  enrollmentYear: number | null;
  groupName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Элемент списка студентов (StudentProfileItem) */
export interface StudentProfileItem {
  profile: StudentDto;
  displayName: string;
}

/** Постраничный список студентов (StudentListPage) */
export interface StudentListPage {
  items: StudentProfileItem[];
  nextCursor: string | null;
}

/** Запрос на создание приглашения (CreateInvitationRequest) */
export interface CreateInvitationRequest {
  email: string;
  role?: string;
  roles?: string[];
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  studentData?: CreateStudentRequest | null;
  teacherData?: CreateTeacherRequest | null;
}

// --- Schedule module (GET /api/schedule/lessons/week/group/{groupId}, etc.) ---

/** Занятие (LessonDto) */
export interface LessonDto {
  id: string;
  offeringId: string;
  offeringSlotId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  timeslotId: string | null;
  roomId: string | null;
  topic: string | null;
  status: 'PLANNED' | 'CANCELLED' | 'DONE';
  createdAt: string;
  updatedAt: string;
}

/** Краткие данные офферинга (OfferingSummaryDto) */
export interface OfferingSummaryDto {
  id: string;
  groupId: string;
  curriculumSubjectId: string;
  teacherId: string | null;
}

/** Слот офферинга (SlotSummaryDto) */
export interface SlotSummaryDto {
  id: string;
  offeringId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeslotId: string | null;
  lessonType: string;
  roomId: string | null;
  teacherId: string | null;
  createdAt: string;
}

/** Учитель с ролью (TeacherRoleDto) */
export interface TeacherRoleDto {
  teacherId: string;
  role: string;
}

/** Аудитория для отображения (RoomSummaryDto) */
export interface RoomSummaryDto {
  id: string;
  number: string;
  buildingName: string | null;
}

/** Преподаватель для отображения (TeacherSummaryDto) */
export interface TeacherSummaryDto {
  id: string;
  displayName: string;
}

/** Группа для отображения (GroupSummaryDto) */
export interface GroupSummaryDto {
  id: string;
  code: string;
  name: string | null;
}

/** Занятие с контекстом для расписания (LessonForScheduleDto) */
export interface LessonForScheduleDto {
  lesson: LessonDto;
  offering: OfferingSummaryDto | null;
  slot: SlotSummaryDto | null;
  teachers: TeacherRoleDto[];
  room: RoomSummaryDto | null;
  mainTeacher: TeacherSummaryDto | null;
  subjectName: string | null;
  group: GroupSummaryDto | null;
}

/** Аудитория (RoomDto). GET /api/schedule/rooms */
export interface RoomDto {
  id: string;
  buildingId: string;
  buildingName: string;
  number: string;
  capacity: number | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Тело PUT /api/schedule/lessons/{id} */
export interface UpdateLessonRequest {
  startTime?: string;
  endTime?: string;
  roomId?: string | null;
  topic?: string | null;
  status?: 'PLANNED' | 'CANCELLED' | 'DONE';
}

// --- Academic module (GET /api/academic/semesters/by-date, years, semesters) ---

/** Семестр по дате (SemesterDto from by-date endpoint) */
export interface SemesterByDateDto {
  id: string;
  academicYearId: string;
  number: number;
  name: string | null;
  startDate: string;
  endDate: string;
  examStartDate: string | null;
  examEndDate: string | null;
  weekCount: number | null;
  isCurrent: boolean;
  createdAt: string;
}

/** Учебный год (AcademicYearDto). GET /api/academic/years */
export interface AcademicYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
}

/** Семестр (SemesterDto). GET /api/academic/years/{id}/semesters, GET /api/academic/semesters/current */
export type SemesterDto = SemesterByDateDto;

// --- Teacher subjects (GET /api/subjects/teacher/my, ...) ---

/** Группа в списке предметов (GroupInfoDto) */
export interface GroupInfoDto {
  id: string;
  code: string | null;
  name: string | null;
}

/** Элемент списка предметов преподавателя (TeacherSubjectListItemDto) */
export interface TeacherSubjectListItemDto {
  curriculumSubjectId: string;
  subjectId: string;
  subjectCode: string;
  subjectChineseName: string | null;
  subjectEnglishName: string | null;
  subjectDescription: string | null;
  departmentId: string | null;
  departmentName: string | null;
  semesterNo: number;
  courseYear: number | null;
  durationWeeks: number;
  assessmentTypeId: string;
  assessmentTypeName: string | null;
  credits: number | null;
  groups: GroupInfoDto[];
}

// --- Teacher subject details (GET /api/subjects/teacher/my/{curriculumSubjectId}) ---

/** Данные предмета из каталога (SubjectInfoDto) */
export interface SubjectInfoDto {
  id: string;
  code: string;
  chineseName: string | null;
  englishName: string | null;
  description: string | null;
  departmentId: string | null;
  departmentName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Предмет в учебном плане (CurriculumSubjectInfoDto) */
export interface CurriculumSubjectInfoDto {
  id: string;
  curriculumId: string;
  subjectId: string;
  semesterNo: number;
  courseYear: number | null;
  durationWeeks: number;
  hoursTotal: number | null;
  hoursLecture: number | null;
  hoursPractice: number | null;
  hoursLab: number | null;
  hoursSeminar: number | null;
  hoursSelfStudy: number | null;
  hoursConsultation: number | null;
  hoursCourseWork: number | null;
  assessmentTypeId: string;
  assessmentTypeName: string | null;
  credits: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Элемент контроля (CurriculumSubjectAssessmentInfoDto) */
export interface CurriculumSubjectAssessmentInfoDto {
  id: string;
  assessmentTypeId: string;
  assessmentTypeName: string | null;
  weekNumber: number | null;
  isFinal: boolean;
  weight: number | null;
  notes: string | null;
  createdAt: string;
}

/** Файл в хранилище (StoredFileInfoDto) */
export interface StoredFileInfoDto {
  id: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

/** Материал курса (CourseMaterialInfoDto) */
export interface CourseMaterialInfoDto {
  id: string;
  title: string;
  description: string | null;
  authorId: string;
  authorName: string | null;
  uploadedAt: string;
  file: StoredFileInfoDto;
}

/** Реализация предмета для группы (GroupSubjectOfferingInfoDto) */
export interface GroupSubjectOfferingInfoDto {
  id: string;
  groupId: string;
  groupCode: string | null;
  groupName: string | null;
  teacherId: string | null;
  roomId: string | null;
  roomName: string | null;
  format: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  materials: CourseMaterialInfoDto[];
}

/** Детальная информация по предмету преподавателя (TeacherSubjectDetailDto) */
export interface TeacherSubjectDetailDto {
  subject: SubjectInfoDto;
  curriculumSubject: CurriculumSubjectInfoDto;
  assessments: CurriculumSubjectAssessmentInfoDto[];
  offerings: GroupSubjectOfferingInfoDto[];
}

// --- Course materials (POST /api/offerings/{offeringId}/materials, etc.) ---

/** Файл в хранилище (StoredFileDto) */
export interface StoredFileDto {
  id: string;
  size: number;
  contentType: string;
  originalName: string;
  uploadedAt: string;
  uploadedBy: string;
}

/** Материал курса (CourseMaterialDto) */
export interface CourseMaterialDto {
  id: string;
  offeringId: string;
  title: string;
  description: string | null;
  authorId: string;
  uploadedAt: string;
  file: StoredFileDto;
}

/** Запрос на создание материала (AddCourseMaterialRequest) */
export interface AddCourseMaterialRequest {
  storedFileId: string;
  title: string;
  description?: string | null;
}

/** Ответ с presigned URL для скачивания/просмотра */
export interface PresignedUrlResponse {
  url: string;
}

// --- Composition module (GET /api/composition/lessons/{id}/full-details) ---

/** Урок в ответе composition (status может быть null) */
export interface CompositionLessonDto {
  id: string;
  offeringId: string;
  offeringSlotId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  timeslotId: string | null;
  roomId: string | null;
  topic: string | null;
  status: 'PLANNED' | 'CANCELLED' | 'DONE' | null;
  createdAt: string;
  updatedAt: string;
}

/** Предмет из каталога (SubjectDto в composition) */
export interface CompositionSubjectDto {
  id: string;
  code: string | null;
  chineseName: string | null;
  englishName: string | null;
  description: string | null;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Группа студентов (StudentGroupDto) */
export interface CompositionStudentGroupDto {
  id: string;
  programId: string;
  curriculumId: string;
  code: string | null;
  name: string | null;
  description: string | null;
  startYear: number;
  graduationYear: number | null;
  curatorUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Офферинг (GroupSubjectOfferingDto в composition) */
export interface CompositionOfferingDto {
  id: string;
  groupId: string;
  curriculumSubjectId: string;
  teacherId: string | null;
  roomId: string | null;
  format: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Слот офферинга (OfferingSlotDto) */
export interface CompositionOfferingSlotDto {
  id: string;
  offeringId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timeslotId: string | null;
  lessonType: string | null;
  roomId: string | null;
  teacherId: string | null;
  createdAt: string;
}

/** Элемент учебного плана (CurriculumSubjectDto) */
export interface CompositionCurriculumSubjectDto {
  id: string;
  curriculumId: string;
  subjectId: string;
  semesterNo: number;
  courseYear: number | null;
  durationWeeks: number;
  hoursTotal: number | null;
  hoursLecture: number | null;
  hoursPractice: number | null;
  hoursLab: number | null;
  hoursSeminar: number | null;
  hoursSelfStudy: number | null;
  hoursConsultation: number | null;
  hoursCourseWork: number | null;
  assessmentTypeId: string;
  credits: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Аудитория в composition (RoomDto, buildingName может быть null) */
export interface CompositionRoomDto {
  id: string;
  buildingId: string;
  buildingName: string | null;
  number: string | null;
  capacity: number | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Профиль преподавателя (TeacherDto в composition) */
export interface CompositionTeacherDto {
  id: string;
  userId: string;
  teacherId: string | null;
  faculty: string | null;
  englishName: string | null;
  position: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Файл в хранилище в composition (contentType/originalName могут быть null) */
export interface CompositionStoredFileDto {
  id: string;
  size: number;
  contentType: string | null;
  originalName: string | null;
  uploadedAt: string;
  uploadedBy: string;
}

/** Материал урока (LessonMaterialDto) */
export interface CompositionLessonMaterialDto {
  id: string;
  lessonId: string;
  name: string | null;
  description: string | null;
  authorId: string;
  publishedAt: string;
  files: CompositionStoredFileDto[];
}

// --- Lesson materials (POST /api/lessons/{lessonId}/materials, etc.) ---

/** Материал урока (LessonMaterialDto) - API response */
export interface LessonMaterialDto {
  id: string;
  lessonId: string;
  name: string;
  description: string | null;
  authorId: string;
  publishedAt: string;
  files: StoredFileDto[];
}

/** Запрос на создание материала урока (CreateLessonMaterialRequest) */
export interface CreateLessonMaterialRequest {
  name: string;
  description?: string | null;
  publishedAt: string;
  storedFileIds?: string[] | null;
}

/** Запрос на добавление файлов к материалу урока (AddLessonMaterialFilesRequest) */
export interface AddLessonMaterialFilesRequest {
  storedFileIds: string[];
}

/** Домашнее задание (HomeworkDto) */
export interface CompositionHomeworkDto {
  id: string;
  lessonId: string;
  title: string | null;
  description: string | null;
  points: number | null;
  file: CompositionStoredFileDto | null;
  createdAt: string;
  updatedAt: string;
}

/** Полная информация по уроку (LessonFullDetailsDto) */
export interface LessonFullDetailsDto {
  lesson: CompositionLessonDto;
  subject: CompositionSubjectDto;
  group: CompositionStudentGroupDto;
  offering: CompositionOfferingDto;
  offeringSlot: CompositionOfferingSlotDto | null;
  curriculumSubject: CompositionCurriculumSubjectDto;
  room: CompositionRoomDto | null;
  mainTeacher: CompositionTeacherDto | null;
  materials: CompositionLessonMaterialDto[];
  homework: CompositionHomeworkDto[];
}

// --- Composition: roster-attendance (GET /api/composition/lessons/{id}/roster-attendance) ---

/** Урок в ростере посещаемости (LessonDto) */
export interface LessonRosterLessonDto {
  id: string;
  offeringId: string;
  offeringSlotId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  timeslotId: string | null;
  roomId: string | null;
  topic: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Группа в ростере (StudentGroupDto) */
export interface LessonRosterGroupDto {
  id: string;
  programId: string;
  curriculumId: string;
  code: string | null;
  name: string | null;
  description: string | null;
  startYear: number;
  graduationYear: number | null;
  curatorUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Студент в ростере (StudentDto) */
export interface LessonRosterStudentDto {
  id: string;
  userId: string;
  studentId: string | null;
  chineseName: string | null;
  faculty: string | null;
  course: string | null;
  enrollmentYear: number | null;
  groupName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Краткая заявка на пропуск в ростере (StudentNoticeDto) */
export interface LessonRosterNoticeDto {
  id: string;
  type: string;
  status: string;
  reasonText: string | null;
  submittedAt: string;
  fileIds: string[];
}

/** Строка таблицы посещаемости по уроку */
export interface LessonRosterAttendanceRowDto {
  student: LessonRosterStudentDto;
  status: string | null;
  minutesLate: number | null;
  teacherComment: string | null;
  markedAt: string | null;
  markedBy: string | null;
  attachedAbsenceNoticeId: string | null;
  notices: LessonRosterNoticeDto[];
  lessonPoints: number;
}

/** Ростер посещаемости по уроку */
export interface LessonRosterAttendanceDto {
  lesson: LessonRosterLessonDto;
  group: LessonRosterGroupDto;
  subjectName: string;
  counts: Record<string, number>;
  unmarkedCount: number;
  rows: LessonRosterAttendanceRowDto[];
}

// --- Grades module (POST/PUT/GET /api/grades/entries, etc.) ---

/** Запись баллов (GradeEntryDto) */
export interface GradeEntryDto {
  id: string;
  studentId: string;
  offeringId: string;
  points: number;
  typeCode: string;
  typeLabel: string | null;
  description: string | null;
  lessonSessionId: string | null;
  homeworkSubmissionId: string | null;
  gradedBy: string;
  gradedAt: string;
  status: string;
}

/** Запрос на создание записи баллов */
export interface CreateGradeEntryRequest {
  studentId: string;
  offeringId: string;
  points: number;
  typeCode: string;
  typeLabel?: string | null;
  description?: string | null;
  lessonSessionId?: string | null;
  homeworkSubmissionId?: string | null;
  gradedAt?: string | null;
}

/** Запрос на обновление записи баллов */
export interface UpdateGradeEntryRequest {
  points?: number;
  typeCode?: string;
  typeLabel?: string | null;
  description?: string | null;
  lessonSessionId?: string | null;
  homeworkSubmissionId?: string | null;
  gradedAt?: string | null;
}

/** Баллы студента по офферингу */
export interface StudentOfferingGradesDto {
  studentId: string;
  offeringId: string;
  entries: GradeEntryDto[];
  totalPoints: number;
  breakdownByType: Record<string, number>;
}

// --- Homework module (GET/POST /api/lessons/{lessonId}/homework, GET/PUT/DELETE /api/homework/{homeworkId}) ---

/** Домашнее задание (HomeworkDto) - API response */
export interface HomeworkDto {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  points: number | null;
  file: StoredFileDto | null;
  createdAt: string;
  updatedAt: string;
}

/** Запрос на создание домашнего задания (CreateHomeworkRequest) */
export interface CreateHomeworkRequest {
  title: string;
  description?: string | null;
  points?: number | null;
  storedFileId?: string | null;
}

/** Запрос на обновление домашнего задания (UpdateHomeworkRequest) */
export interface UpdateHomeworkRequest {
  title?: string | null;
  description?: string | null;
  points?: number | null;
  clearFile?: boolean;
  storedFileId?: string | null;
}
