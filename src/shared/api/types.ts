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

/** Занятие с контекстом для расписания (LessonForScheduleDto) */
export interface LessonForScheduleDto {
  lesson: LessonDto;
  offering: OfferingSummaryDto | null;
  slot: SlotSummaryDto | null;
  teachers: TeacherRoleDto[];
  room: RoomSummaryDto | null;
  mainTeacher: TeacherSummaryDto | null;
  subjectName: string | null;
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

// --- Academic module (GET /api/academic/semesters/by-date) ---

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
