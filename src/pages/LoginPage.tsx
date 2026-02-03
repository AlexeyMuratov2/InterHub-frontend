import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import universityLogo from '../assets/university-logo.png';
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
    <div className="auth-card-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <img src={universityLogo} alt="" className="auth-card-icon" />
          <h1 className="auth-card-title">{t('title')}</h1>
          <p className="auth-card-subtitle">{t('loginSubtitle')}</p>
          <LanguageSwitcher className="auth-card-lang" variant="select" />
        </div>
        <div className="auth-card-body">
          <form onSubmit={handleSubmit} className="auth-card-form">
            <div className="auth-card-field">
              <label htmlFor="login-email">{t('email')}</label>
              <input
                id="login-email"
                type="email"
                className="auth-card-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="student@neusoft.edu.cn"
                autoComplete="email"
                disabled={state.status === 'submitting'}
              />
              {(emailError || (state.status === 'error' && state.fieldErrors?.email)) && (
                <span className="auth-card-field-error">
                  {emailError || (state.status === 'error' ? state.fieldErrors?.email : undefined)}
                </span>
              )}
            </div>
            <div className="auth-card-field">
              <label htmlFor="login-password">{t('password')}</label>
              <input
                id="login-password"
                type="password"
                className="auth-card-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder={t('passwordPlaceholder')}
                autoComplete="current-password"
                disabled={state.status === 'submitting'}
              />
              {(passwordError || (state.status === 'error' && state.fieldErrors?.password)) && (
                <span className="auth-card-field-error">
                  {passwordError || (state.status === 'error' ? state.fieldErrors?.password : undefined)}
                </span>
              )}
              <a href="#" className="auth-card-forgot" onClick={(e) => e.preventDefault()}>
                {t('forgotPassword')}
              </a>
            </div>
            {showSessionExpired && !showGeneralError && (
              <p className="auth-card-error">{t('sessionExpired')}</p>
            )}
            {showGeneralError && (
              <p className="auth-card-error">
                {state.message}
                {state.code === AUTH_ERROR_CODES.USER_NOT_ACTIVE && (
                  <> <Link to="/invite" className="auth-card-link">{t('linkInvite')}</Link></>
                )}
              </p>
            )}
            {state.status === 'network-error' && (
              <p className="auth-card-error">{t('errorNetwork')}</p>
            )}
            <button type="submit" className="auth-card-btn auth-card-btn--primary" disabled={state.status === 'submitting'}>
              {state.status === 'submitting' ? t('submitting') : t('submit')}
            </button>

            <p className="auth-card-footer">
              {t('noAccount')}{' '}
              <Link to="/invite">{t('contactAdmissions')}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
