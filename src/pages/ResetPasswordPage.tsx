import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import universityLogo from '../assets/university-logo.png';
import { resetPassword } from '../shared/api';
import { useTranslation } from '../shared/i18n';
import { LanguageSwitcher } from '../shared/i18n';

const AUTH_RESET_CODE_INVALID_OR_EXPIRED = 'AUTH_RESET_CODE_INVALID_OR_EXPIRED';

type ResetState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }
  | { status: 'network-error' };

const RESET_REQUEST_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') ?? '';
  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, setState] = useState<ResetState>({ status: 'idle' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (emailFromUrl) setEmail(emailFromUrl);
  }, [emailFromUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const errors: Record<string, string> = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) errors.email = t('email');
    if (!code.trim()) errors.code = t('codeLabel');
    if (newPassword.length < 8) errors.newPassword = t('errorPasswordTooShort');
    if (newPassword !== confirmPassword) errors.confirmPassword = t('errorPasswordsMismatch');
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setState({ status: 'submitting' });

    withTimeout(
      resetPassword({
        email: trimmedEmail,
        code: code.trim(),
        newPassword,
      }),
      RESET_REQUEST_TIMEOUT_MS
    )
      .then((result) => {
        if (result.ok) {
          setState({
            status: 'success',
            message: result.data.message || t('resetSuccessMessage'),
          });
          return;
        }
        if (result.status === 0) {
          setState({ status: 'network-error' });
          return;
        }
        const codeInvalid =
          result.error?.code === AUTH_RESET_CODE_INVALID_OR_EXPIRED;
        setState({
          status: 'error',
          message: codeInvalid
            ? t('errorResetCodeInvalid')
            : (result.error?.message ?? t('errorGeneric')),
        });
      })
      .catch(() => {
        setState({ status: 'error', message: t('errorGeneric') });
      });
  };

  if (state.status === 'success') {
    return (
      <div className="auth-card-page">
        <div className="auth-card auth-card--info">
          <div className="auth-card-header">
            <div className="auth-card-icon auth-card-icon--success" aria-hidden>
              ✓
            </div>
            <h1 className="auth-card-title">{t('resetPasswordTitle')}</h1>
            <p className="auth-card-subtitle">{state.message}</p>
            <LanguageSwitcher className="auth-card-lang" variant="select" />
          </div>
          <div className="auth-card-body">
            <p className="auth-card-text">
              <Link
                to="/login"
                className="auth-card-link auth-card-btn auth-card-btn--primary"
                style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  marginTop: '0.5rem',
                }}
              >
                {t('backToLogin')}
              </Link>
            </p>
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
          <h1 className="auth-card-title">{t('resetPasswordTitle')}</h1>
          <p className="auth-card-subtitle">{t('resetPasswordSubtitle')}</p>
          <LanguageSwitcher className="auth-card-lang" variant="select" />
        </div>
        <div className="auth-card-body">
          <form onSubmit={handleSubmit} className="auth-card-form">
            <div className="auth-card-field">
              <label htmlFor="reset-email">{t('email')}</label>
              <input
                id="reset-email"
                type="email"
                className="auth-card-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="student@neusoft.edu.cn"
                autoComplete="email"
                disabled={state.status === 'submitting'}
              />
              {fieldErrors.email && (
                <span className="auth-card-field-error">{fieldErrors.email}</span>
              )}
            </div>
            <div className="auth-card-field">
              <label htmlFor="reset-code">{t('codeLabel')}</label>
              <input
                id="reset-code"
                type="text"
                className="auth-card-input"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, code: '' }));
                }}
                placeholder={t('codePlaceholder')}
                autoComplete="one-time-code"
                disabled={state.status === 'submitting'}
              />
              {fieldErrors.code && (
                <span className="auth-card-field-error">{fieldErrors.code}</span>
              )}
            </div>
            <div className="auth-card-field">
              <label htmlFor="reset-new-password">{t('newPasswordLabel')}</label>
              <input
                id="reset-new-password"
                type="password"
                className="auth-card-input"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                }}
                placeholder={t('newPasswordPlaceholder')}
                autoComplete="new-password"
                disabled={state.status === 'submitting'}
              />
              {fieldErrors.newPassword && (
                <span className="auth-card-field-error">
                  {fieldErrors.newPassword}
                </span>
              )}
            </div>
            <div className="auth-card-field">
              <label htmlFor="reset-confirm-password">
                {t('confirmPasswordLabel')}
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                className="auth-card-input"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder={t('confirmPasswordPlaceholder')}
                autoComplete="new-password"
                disabled={state.status === 'submitting'}
              />
              {fieldErrors.confirmPassword && (
                <span className="auth-card-field-error">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>
            {state.status === 'error' && (
              <p className="auth-card-error">{state.message}</p>
            )}
            {state.status === 'network-error' && (
              <p className="auth-card-error">{t('errorNetwork')}</p>
            )}
            <button
              type="submit"
              className="auth-card-btn auth-card-btn--primary"
              disabled={state.status === 'submitting'}
            >
              {state.status === 'submitting' ? t('resetting') : t('resetSubmit')}
            </button>
            <p className="auth-card-footer">
              <Link to="/forgot-password">{t('forgotPasswordTitle')}</Link>
              {' · '}
              <Link to="/login">{t('backToLogin')}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
