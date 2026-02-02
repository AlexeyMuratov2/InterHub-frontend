/** Ответ валидации токена приглашения (GET /api/invitations/validate) */
export interface TokenValidationResult {
  valid: boolean;
  invitationId?: string;
  userId?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  /** true, если токен истёк, но письмо с новой ссылкой отправлено */
  tokenRegenerated?: boolean;
  error?: string;
}

/** Тело запроса принятия приглашения (POST /api/invitations/accept) */
export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

/** Ответ об ошибке от API */
export interface ErrorResponse {
  code?: string;
  message: string;
  timestamp?: string;
  details?: Record<string, string> | string[];
}

// --- Auth ---

/** Тело запроса входа (POST /api/auth/login) */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Успешный ответ входа / refresh (200) */
export interface AuthResult {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  message?: string;
}

/** Текущий пользователь (GET /api/auth/me) */
export interface UserDto {
  userId: string;
  email: string;
  role: string;
  fullName?: string;
}
