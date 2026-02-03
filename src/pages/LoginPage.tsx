import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../shared/api';
import { useAuth } from '../app/providers';
import { getRolesFromUser, getDefaultDashboardPath } from '../shared/config';
import { useTranslation } from '../shared/i18n';
import { LanguageSwitcher } from '../shared/i18n';

type LoginState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; code?: string; message: string; fieldErrors?: Record<string, string> }
  | { status: 'network-error' };

const LOGIN_REQUEST_TIMEOUT_MS = 20_000;

const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_ACTIVE: 'USER_NOT_ACTIVE',
  USER_DISABLED: 'USER_DISABLED',
} as const;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

function getLoginErrorMessage(
  t: (key: string) => string,
  code: string | undefined,
  message: string
): string {
  if (code === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
    return t('errorInvalidCredentials');
  }
  if (code === AUTH_ERROR_CODES.USER_NOT_ACTIVE) {
    return t('errorUserNotActive');
  }
  if (code === AUTH_ERROR_CODES.USER_DISABLED) {
    return t('errorUserDisabled');
  }
  return message || t('errorGeneric');
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, sessionExpired, clearSessionExpired } = useAuth();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<LoginState>({ status: 'idle' });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const showSessionExpired = sessionExpired || (location.state as { sessionExpired?: boolean } | null)?.sessionExpired === true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearSessionExpired();
    setEmailError('');
    setPasswordError('');
    setState({ status: 'submitting' });

    withTimeout(login({ email, password }), LOGIN_REQUEST_TIMEOUT_MS).then((result) => {
      if (result.ok) {
        setUser(result.data);
        const roles = getRolesFromUser(result.data);
        const dashboardPath = getDefaultDashboardPath(roles);
        navigate(dashboardPath ?? '/dashboards', { replace: true });
        return;
      }
      const { status, error } = result;
      const code = error?.code;
      const message = error?.message ?? '';
      const details = error?.details as Record<string, string> | undefined;

      if (status === 400 && code === 'VALIDATION_FAILED') {
        const fieldErrors = details ?? {};
        setState({
          status: 'error',
          code: 'VALIDATION_FAILED',
          message: message,
          fieldErrors,
        });
        setEmailError(fieldErrors.email ?? '');
        setPasswordError(fieldErrors.password ?? '');
        return;
      }

      if (status === 401 && code === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
        setState({
          status: 'error',
          code,
          message: getLoginErrorMessage(t, code, message),
        });
        setPassword('');
        return;
      }

      if (status === 403) {
        setState({
          status: 'error',
          code,
          message: getLoginErrorMessage(t, code, message),
        });
        setPassword('');
        return;
      }

      if (status === 0) {
        setState({ status: 'network-error' });
        return;
      }

      setState({
        status: 'error',
        code,
        message: getLoginErrorMessage(t, code, message),
      });
      setPassword('');
    }).catch(() => {
      setState({
        status: 'error',
        message: t('errorGeneric'),
      });
    });
  };

  const showGeneralError =
    state.status === 'error' &&
    state.code !== 'VALIDATION_FAILED' &&
    state.message;

  return (
    <div className="login-page">
      <div className="login-page-header">
        <h1>{t('title')}</h1>
        <LanguageSwitcher className="login-page-lang" variant="buttons" />
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">{t('email')}</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            autoComplete="email"
            disabled={state.status === 'submitting'}
          />
          {(emailError || (state.status === 'error' && state.fieldErrors?.email)) && (
            <span className="error">
              {emailError || (state.status === 'error' ? state.fieldErrors?.email : undefined)}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="login-password">{t('password')}</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            autoComplete="current-password"
            disabled={state.status === 'submitting'}
          />
          {(passwordError || (state.status === 'error' && state.fieldErrors?.password)) && (
            <span className="error">
              {passwordError || (state.status === 'error' ? state.fieldErrors?.password : undefined)}
            </span>
          )}
        </div>
        {showSessionExpired && !showGeneralError && (
          <p className="error">{t('sessionExpired')}</p>
        )}
        {showGeneralError && (
          <p className="error">
            {state.message}
            {state.code === AUTH_ERROR_CODES.USER_NOT_ACTIVE && (
              <> <Link to="/invite">{t('linkInvite')}</Link></>
            )}
          </p>
        )}
        {state.status === 'network-error' && (
          <p className="error">{t('errorNetwork')}</p>
        )}
        <button type="submit" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? t('submitting') : t('submit')}
        </button>
      </form>
      <p className="login-links">
        <Link to="/invite">{t('linkInvite')}</Link>
      </p>
    </div>
  );
}
