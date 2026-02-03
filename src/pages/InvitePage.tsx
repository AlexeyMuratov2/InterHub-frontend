import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { validateToken, acceptInvitation, login } from '../shared/api';
import type { TokenValidationResult } from '../shared/api';
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
  | { status: 'error'; message: string }
  | { status: 'network-error' };

type AcceptState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'logging-in' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string>; linkInvalidated?: boolean };

const MIN_PASSWORD_LENGTH = 8;

function getValidationErrorMessage(t: (key: string) => string, error: string | undefined): string {
  if (!error) return t('networkError');
  if (error === 'Invalid token') return t('invalidLink');
  if (error === 'Invitation has expired') return t('expired');
  if (error.includes('CANCELLED')) return t('cancelled');
  if (error.includes('ACCEPTED')) return t('alreadyAccepted');
  if (error.includes('status:')) return t('unavailable');
  return error;
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

  useEffect(() => {
    if (!token.trim()) {
      setValidation({ status: 'no-token' });
      return;
    }
    setValidation({ status: 'loading' });
    setAcceptState({ status: 'idle' });

    validateToken(token).then((result) => {
      if (result.ok) {
        const { data } = result;
        if (data.valid === true) {
          setValidation({ status: 'valid', data });
        } else if (data.tokenRegenerated === true) {
          setValidation({ status: 'token-regenerated', email: data.email });
        } else {
          setValidation({
            status: 'error',
            message: getValidationErrorMessage(t, data.error),
          });
        }
      } else {
        if (result.status === 0) {
          setValidation({ status: 'network-error' });
        } else {
          const message = getValidationErrorMessage(t, result.error?.message);
          setValidation({ status: 'error', message });
        }
      }
    });
  }, [token, t]);

  const handleRetryValidation = () => {
    if (!token.trim()) return;
    setValidation({ status: 'loading' });
    validateToken(token).then((result) => {
      if (result.ok) {
        const { data } = result;
        if (data.valid === true) {
          setValidation({ status: 'valid', data });
        } else if (data.tokenRegenerated === true) {
          setValidation({ status: 'token-regenerated', email: data.email });
        } else {
          setValidation({
            status: 'error',
            message: getValidationErrorMessage(t, data.error),
          });
        }
      } else {
        if (result.status === 0) {
          setValidation({ status: 'network-error' });
        } else {
          setValidation({
            status: 'error',
            message: getValidationErrorMessage(t, result.error?.message),
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
      const msg = error?.message ?? t('errorActivation');

      if (status === 400) {
        if (error?.code === 'VALIDATION_FAILED' && error?.details) {
          const details = error.details as Record<string, string>;
          setAcceptState({ status: 'error', message: msg, fieldErrors: details });
        } else {
          setAcceptState({
            status: 'error',
            message: t('errorUseFreshLink'),
          });
        }
      } else if (status === 409) {
        if (msg.toLowerCase().includes('accepted') || msg.includes('уже') || msg.includes('already')) {
          setAcceptState({
            status: 'error',
            message: t('errorAlreadyActivated'),
            linkInvalidated: true,
          });
        } else {
          setAcceptState({
            status: 'error',
            message: t('errorCannotAccept'),
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
      <div className="invite-page">
        <div className="invite-page-header">
          <h1>{t('title')}</h1>
          <LanguageSwitcher className="invite-page-lang" variant="buttons" />
        </div>
        <p>{t('noToken')}</p>
      </div>
    );
  }

  if (validation.status === 'loading') {
    return (
      <div className="invite-page">
        <div className="invite-page-header">
          <LanguageSwitcher className="invite-page-lang" variant="buttons" />
        </div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (validation.status === 'network-error') {
    return (
      <div className="invite-page">
        <div className="invite-page-header">
          <LanguageSwitcher className="invite-page-lang" variant="buttons" />
        </div>
        <p>{t('networkError')}</p>
        <button type="button" onClick={handleRetryValidation}>
          {t('retry')}
        </button>
      </div>
    );
  }

  if (validation.status === 'error') {
    return (
      <div className="invite-page">
        <div className="invite-page-header">
          <LanguageSwitcher className="invite-page-lang" variant="buttons" />
        </div>
        <p>{validation.message}</p>
        {(validation.message.includes('войти') || validation.message.includes('sign in') || validation.message.includes('登录')) && (
          <Link to="/login">{t('goToLogin')}</Link>
        )}
      </div>
    );
  }

  if (validation.status === 'token-regenerated') {
    const msg = validation.email
      ? t('tokenRegenerated', { email: validation.email })
      : t('tokenRegeneratedNoEmail');
    return (
      <div className="invite-page">
        <div className="invite-page-header">
          <LanguageSwitcher className="invite-page-lang" variant="buttons" />
        </div>
        <p>{msg}</p>
      </div>
    );
  }

  if (validation.status === 'valid') {
    const { data } = validation;
    const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email;

    if (acceptState.status === 'error' && acceptState.linkInvalidated) {
      return (
        <div className="invite-page">
          <div className="invite-page-header">
            <h1>{t('title')}</h1>
            <LanguageSwitcher className="invite-page-lang" variant="buttons" />
          </div>
          <p className="error">{acceptState.message}</p>
          <p>{t('errorUseFreshLink')}</p>
          <Link to="/login">{t('goToLogin')}</Link>
        </div>
      );
    }

    if (acceptState.status === 'logging-in') {
      return (
        <div className="invite-page">
          <div className="invite-page-header">
            <LanguageSwitcher className="invite-page-lang" variant="buttons" />
          </div>
          <p>{t('loggingIn')}</p>
        </div>
      );
    }

    return (
      <div className="invite-page">
        <div className="invite-page-header">
          <h1>{t('title')}</h1>
          <LanguageSwitcher className="invite-page-lang" variant="buttons" />
        </div>
        {name && <p>{t('hello', { name })}</p>}
        {data.email && <p>{t('emailLabel')}: {data.email}</p>}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password">{t('passwordLabel')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              autoComplete="new-password"
              disabled={acceptState.status === 'submitting'}
            />
            {(passwordError || (acceptState.status === 'error' && acceptState.fieldErrors?.password)) && (
              <span className="error">
                {passwordError || (acceptState.status === 'error' ? acceptState.fieldErrors?.password : undefined)}
              </span>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setConfirmError('');
              }}
              autoComplete="new-password"
              disabled={acceptState.status === 'submitting'}
            />
            {(confirmError || (acceptState.status === 'error' && acceptState.fieldErrors?.confirmPassword)) && (
              <span className="error">
                {confirmError || (acceptState.status === 'error' ? acceptState.fieldErrors?.confirmPassword : undefined)}
              </span>
            )}
          </div>
          {acceptState.status === 'error' && acceptState.message && !acceptState.fieldErrors && (
            <p className="error">{acceptState.message}</p>
          )}
          <button type="submit" disabled={acceptState.status === 'submitting'}>
            {acceptState.status === 'submitting' ? t('submitting') : t('submit')}
          </button>
        </form>
      </div>
    );
  }

  return null;
}

export default function InvitePage() {
  return <InvitePageContent />;
}
