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
  email: string;
  roles: string[];
  firstName: string | null;
  lastName: string | null;
  status: InvitationStatus;
  invitedById: string;
  emailSentAt: string | null;
  emailAttempts: number;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
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
