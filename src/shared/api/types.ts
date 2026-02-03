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

/** Ответ валидации токена приглашения (GET /api/invitations/validate) */
export interface TokenValidationResult {
  valid: boolean;
  invitationId?: string;
  userId?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  tokenRegenerated?: boolean;
  error?: string;
}

/** Тело запроса принятия приглашения (POST /api/invitations/accept) */
export interface AcceptInvitationRequest {
  token: string;
  password: string;
}
