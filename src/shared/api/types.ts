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

/** Тело PATCH /api/account/me (UpdateProfileRequest) */
export interface UpdateProfileRequest {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: string | null;
}

/** Тело PATCH /api/account/users/{id} (UpdateUserRequest) */
export interface UpdateUserRequest {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  roles?: string[] | null;
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
