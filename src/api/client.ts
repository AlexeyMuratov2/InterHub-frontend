/**
 * Re-exports the shared HTTP client (credentials, refresh, optional Bearer session for Telegram).
 */
export {
  request,
  requestBlob,
  API_BASE,
  setSessionExpiredHandler,
  isBearerSession,
  persistBearerSession,
  clearBearerSession,
  getStoredRefreshToken,
} from '../shared/api/client';
export type { ErrorResponse } from '../shared/api/client';
