import { useState } from 'react';
import { Link } from 'react-router-dom';
import universityLogo from '../assets/university-logo.png';
import { forgotPassword } from '../shared/api';
import { useTranslation } from '../shared/i18n';
import { LanguageSwitcher } from '../shared/i18n';

type ForgotState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }
  | { status: 'network-error' };

const FORGOT_REQUEST_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<ForgotState>({ status: 'idle' });
  const [emailError, setEmailError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t('email'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(t('email'));
      return;
    }
    setState({ status: 'submitting' });

    withTimeout(forgotPassword({ email: trimmed }), FORGOT_REQUEST_TIMEOUT_MS)
      .then((result) => {
        if (result.ok) {
          setState({
            status: 'success',
            message: result.data.message || t('codeSentMessage'),
          });
          return;
        }
        if (result.status === 0) {
          setState({ status: 'network-error' });
          return;
        }
        setState({
          status: 'error',
          message: result.error?.message ?? t('errorGeneric'),
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
            <h1 className="auth-card-title">{t('forgotPasswordTitle')}</h1>
            <p className="auth-card-subtitle">{state.message}</p>
            <LanguageSwitcher className="auth-card-lang" variant="select" />
          </div>
          <div className="auth-card-body">
            <p className="auth-card-text">
              <Link to="/login" className="auth-card-link auth-card-btn auth-card-btn--primary" style={{ display: 'inline-block', textAlign: 'center', marginTop: '0.5rem' }}>
                {t('backToLogin')}
              </Link>
            </p>
            <p className="auth-card-footer">
              <Link to="/reset-password">{t('resetPasswordTitle')}</Link>
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
          <h1 className="auth-card-title">{t('forgotPasswordTitle')}</h1>
          <p className="auth-card-subtitle">{t('forgotPasswordSubtitle')}</p>
          <LanguageSwitcher className="auth-card-lang" variant="select" />
        </div>
        <div className="auth-card-body">
          <form onSubmit={handleSubmit} className="auth-card-form">
            <div className="auth-card-field">
              <label htmlFor="forgot-email">{t('email')}</label>
              <input
                id="forgot-email"
                type="email"
                className="auth-card-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                  setState({ status: 'idle' });
                }}
                placeholder="student@neusoft.edu.cn"
                autoComplete="email"
                disabled={state.status === 'submitting'}
              />
              {emailError && (
                <span className="auth-card-field-error">{emailError}</span>
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
              {state.status === 'submitting' ? t('sendingCode') : t('sendCode')}
            </button>
            <p className="auth-card-footer">
              <Link to="/login">{t('backToLogin')}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
