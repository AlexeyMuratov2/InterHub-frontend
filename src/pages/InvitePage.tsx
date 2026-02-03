import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import universityLogo from '../assets/university-logo.png';
import { validateToken, acceptInvitation, login } from '../shared/api';
import type { TokenValidationResult } from '../shared/api';
import { INVITATION_VALIDATION_CODE } from '../shared/api/types';
import { useAuth } from '../app/providers';
import { getRolesFromUser, getDefaultDashboardPath } from '../shared/config';
import { useTranslation } from '../shared/i18n';
import { LanguageSwitcher } from '../shared/i18n';

type ValidationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'no-token' }
  | { status: 'valid'; data: TokenValidationResult }
  | { status: 'token-regenerated'; email?: string }
  | { status: 'error'; error?: string; code?: string }
  | { status: 'network-error' };

type AcceptState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'logging-in' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string>; linkInvalidated?: boolean };

const MIN_PASSWORD_LENGTH = 8;

function getValidationErrorMessage(
  t: (key: string) => string,
  error: string | undefined,
  code?: string
): string {
  if (code === INVITATION_VALIDATION_CODE.TOKEN_INVALID) return t('invalidOrAlreadyUsed');
  if (code === INVITATION_VALIDATION_CODE.INVITATION_EXPIRED) return t('expired');
  if (code === INVITATION_VALIDATION_CODE.NOT_ACCEPTABLE) return t('unavailable');
  if (!error) return t('networkError');
  if (error === 'Invalid token') return t('invalidLink');
  if (error === 'Invitation has expired') return t('expired');
  if (error.includes('CANCELLED')) return t('cancelled');
  if (error.includes('ACCEPTED')) return t('alreadyAccepted');
  if (error.includes('status:')) return t('unavailable');
  const lower = error.toLowerCase();
  if (
    (error.includes('недействительна') && error.includes('использована')) ||
    (lower.includes('invalid') && lower.includes('already used'))
  ) {
    return t('invalidOrAlreadyUsed');
  }
  return error;
}

function showLoginLinkForValidationCode(code?: string): boolean {
  return code === INVITATION_VALIDATION_CODE.NOT_ACCEPTABLE;
}

function InvitePageContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const token = searchParams.get('token') ?? '';
  const { t } = useTranslation('invite');

  const [validation, setValidation] = useState<ValidationState>({ status: 'idle' });
  const [acceptState, setAcceptState] = useState<AcceptState>({ status: 'idle' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  /** Первый финальный ответ побеждает: после tokenRegenerated/valid/error не перезаписывать из повторного запроса */
  const terminalValidationSetRef = useRef(false);

  useEffect(() => {
    if (!token.trim()) {
      setValidation({ status: 'no-token' });
      return;
    }
    terminalValidationSetRef.current = false;
    setValidation({ status: 'loading' });
    setAcceptState({ status: 'idle' });

    validateToken(token).then((result) => {
      const apply = (next: ValidationState) => {
        if (terminalValidationSetRef.current) return;
        terminalValidationSetRef.current = true;
        setValidation(next);
      };

      if (result.ok) {
        const { data } = result;
        if (data.valid === true) {
          apply({ status: 'valid', data });
        } else if (data.tokenRegenerated === true || data.code === INVITATION_VALIDATION_CODE.TOKEN_EXPIRED_EMAIL_RESENT) {
          apply({ status: 'token-regenerated', email: data.email ?? undefined });
        } else {
          apply({ status: 'error', error: data.error ?? undefined, code: data.code ?? undefined });
        }
      } else {
        if (result.status === 0) {
          apply({ status: 'network-error' });
        } else {
          apply({
            status: 'error',
            error: result.error?.message,
            code: result.error?.code,
          });
        }
      }
    });
  }, [token]);

  const handleRetryValidation = () => {
    if (!token.trim()) return;
    terminalValidationSetRef.current = false;
    setValidation({ status: 'loading' });
    validateToken(token).then((result) => {
      if (result.ok) {
        const { data } = result;
        if (data.valid === true) {
          setValidation({ status: 'valid', data });
        } else if (data.tokenRegenerated === true || data.code === INVITATION_VALIDATION_CODE.TOKEN_EXPIRED_EMAIL_RESENT) {
          setValidation({ status: 'token-regenerated', email: data.email ?? undefined });
        } else {
          setValidation({ status: 'error', error: data.error ?? undefined, code: data.code ?? undefined });
        }
      } else {
        if (result.status === 0) {
          setValidation({ status: 'network-error' });
        } else {
          setValidation({
            status: 'error',
            error: result.error?.message,
            code: result.error?.code,
          });
        }
      }
    });
  };

  const validateForm = (): boolean => {
    let ok = true;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t('passwordMin'));
      ok = false;
    } else {
      setPasswordError('');
    }
    if (password !== confirmPassword) {
      setConfirmError(t('passwordsMismatch'));
      ok = false;
    } else {
      setConfirmError('');
    }
    return ok;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation.status !== 'valid' || !token) return;
    if (!validateForm()) return;

    setAcceptState({ status: 'submitting' });
    acceptInvitation({ token, password }).then((result) => {
      if (result.ok) {
        setAcceptState({ status: 'logging-in' });
        const email = validation.status === 'valid' ? validation.data.email : '';
        if (!email) {
          setAcceptState({ status: 'error', message: t('errorActivation') });
          return;
        }
        login({ email, password }).then((loginResult) => {
          if (loginResult.ok) {
            setUser(loginResult.data);
            const roles = getRolesFromUser(loginResult.data);
            const dashboardPath = getDefaultDashboardPath(roles);
            navigate(dashboardPath ?? '/dashboards', { replace: true });
          } else {
            setAcceptState({
              status: 'error',
              message: loginResult.error?.message ?? t('errorActivation'),
            });
          }
        });
        return;
      }
      const { status, error } = result;
      const code = error?.code;
      const msg = error?.message ?? t('errorActivation');

      if (status === 400) {
        if (code === 'VALIDATION_FAILED' && error?.details) {
          const details = error.details as Record<string, string>;
          setAcceptState({ status: 'error', message: msg, fieldErrors: details });
        } else if (code === 'INVITATION_TOKEN_INVALID' || code === 'INVITATION_TOKEN_EXPIRED') {
          setAcceptState({ status: 'error', message: t('errorUseFreshLink') });
        } else {
          setAcceptState({ status: 'error', message: msg });
        }
      } else if (status === 409) {
        if (code === 'INVITATION_ALREADY_ACTIVATED') {
          setAcceptState({
            status: 'error',
            message: t('errorAlreadyActivated'),
            linkInvalidated: true,
          });
        } else if (code === 'INVITATION_NOT_ACCEPTABLE') {
          setAcceptState({
            status: 'error',
            message: t('errorCannotAccept'),
            linkInvalidated: true,
          });
        } else {
          setAcceptState({
            status: 'error',
            message: msg,
            linkInvalidated: true,
          });
        }
      } else {
        setAcceptState({ status: 'error', message: msg });
      }
    });
  };

  if (validation.status === 'no-token') {
    return (
      <div className="auth-card-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <img src={universityLogo} alt="" className="auth-card-icon" />
            <h1 className="auth-card-title">{t('title')}</h1>
            <LanguageSwitcher className="auth-card-lang" variant="select" />
          </div>
          <div className="auth-card-body">
            <p className="auth-card-text">{t('noToken')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (validation.status === 'loading') {
    return (
      <div className="auth-card-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <img src={universityLogo} alt="" className="auth-card-icon" />
            <h1 className="auth-card-title">{t('title')}</h1>
            <LanguageSwitcher className="auth-card-lang" variant="select" />
          </div>
          <div className="auth-card-body">
            <p className="auth-card-text">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (validation.status === 'network-error') {
    return (
      <div className="auth-card-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <img src={universityLogo} alt="" className="auth-card-icon" />
            <h1 className="auth-card-title">{t('title')}</h1>
            <LanguageSwitcher className="auth-card-lang" variant="select" />
          </div>
          <div className="auth-card-body">
            <p className="auth-card-error">{t('networkError')}</p>
            <button type="button" className="auth-card-btn" onClick={handleRetryValidation}>
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (validation.status === 'error') {
    const message = getValidationErrorMessage(t, validation.error, validation.code);
    const showLoginLink = showLoginLinkForValidationCode(validation.code);
    return (
      <div className="auth-card-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <img src={universityLogo} alt="" className="auth-card-icon" />
            <h1 className="auth-card-title">{t('title')}</h1>
            <LanguageSwitcher className="auth-card-lang" variant="select" />
          </div>
          <div className="auth-card-body">
            <p className="auth-card-error">{message}</p>
            {showLoginLink && (
              <Link to="/login" className="auth-card-link">
                {t('goToLogin')}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (validation.status === 'token-regenerated') {
    const email = validation.email;
    const detailMsg = email
      ? t('tokenRegenerated', { email })
      : t('tokenRegeneratedNoEmail');
    return (
      <div className="auth-card-page">
        <div className="auth-card auth-card--info">
          <div className="auth-card-header">
            <span className="auth-card-icon auth-card-icon--success" aria-hidden>✉️</span>
            <h1 className="auth-card-title">{t('emailSentAgainTitle')}</h1>
            <LanguageSwitcher className="auth-card-lang" variant="select" />
          </div>
          <div className="auth-card-body">
            <p className="auth-card-highlight">{t('emailSentAgainLead')}</p>
            <p className="auth-card-text">{detailMsg}</p>
            {email && <p className="auth-card-email">{email}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (validation.status === 'valid') {
    const { data } = validation;
    const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email;

    if (acceptState.status === 'error' && acceptState.linkInvalidated) {
      return (
        <div className="auth-card-page">
          <div className="auth-card">
            <div className="auth-card-header">
              <img src={universityLogo} alt="" className="auth-card-icon" />
              <h1 className="auth-card-title">{t('title')}</h1>
              <LanguageSwitcher className="auth-card-lang" variant="select" />
            </div>
            <div className="auth-card-body">
              <p className="auth-card-error">{acceptState.message}</p>
              <Link to="/login" className="auth-card-link">{t('goToLogin')}</Link>
            </div>
          </div>
        </div>
      );
    }

    if (acceptState.status === 'logging-in') {
      return (
        <div className="auth-card-page">
          <div className="auth-card">
            <div className="auth-card-header">
              <img src={universityLogo} alt="" className="auth-card-icon" />
              <h1 className="auth-card-title">{t('title')}</h1>
              <LanguageSwitcher className="auth-card-lang" variant="select" />
            </div>
            <div className="auth-card-body">
              <p className="auth-card-text">{t('loggingIn')}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="auth-card-page">
        <div className="auth-card">
          <div className="auth-card-header">
            <img src={universityLogo} alt="" className="auth-card-icon" />
            <h1 className="auth-card-title">{t('title')}</h1>
            <LanguageSwitcher className="auth-card-lang" variant="select" />
          </div>
          <div className="auth-card-body">
            {name && <p className="auth-card-text">{t('hello', { name })}</p>}
            {data.email && <p className="auth-card-text auth-card-email-label">{t('emailLabel')}: {data.email}</p>}

            <form onSubmit={handleSubmit} className="auth-card-form">
              <div className="auth-card-field">
                <label htmlFor="password">{t('passwordLabel')}</label>
                <input
                  id="password"
                  type="password"
                  className="auth-card-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  autoComplete="new-password"
                  disabled={acceptState.status === 'submitting'}
                />
                {(passwordError || (acceptState.status === 'error' && acceptState.fieldErrors?.password)) && (
                  <span className="auth-card-field-error">
                    {passwordError || (acceptState.status === 'error' ? acceptState.fieldErrors?.password : undefined)}
                  </span>
                )}
              </div>
              <div className="auth-card-field">
                <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="auth-card-input"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmError('');
                  }}
                  autoComplete="new-password"
                  disabled={acceptState.status === 'submitting'}
                />
                {(confirmError || (acceptState.status === 'error' && acceptState.fieldErrors?.confirmPassword)) && (
                  <span className="auth-card-field-error">
                    {confirmError || (acceptState.status === 'error' ? acceptState.fieldErrors?.confirmPassword : undefined)}
                  </span>
                )}
              </div>
              {acceptState.status === 'error' && acceptState.message && !acceptState.fieldErrors && (
                <p className="auth-card-error">{acceptState.message}</p>
              )}
              <button type="submit" className="auth-card-btn auth-card-btn--primary" disabled={acceptState.status === 'submitting'}>
                {acceptState.status === 'submitting' ? t('submitting') : t('submit')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function InvitePage() {
  return <InvitePageContent />;
}
