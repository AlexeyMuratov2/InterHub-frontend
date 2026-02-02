import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { validateToken, acceptInvitation } from '../api/invitations';
import type { TokenValidationResult } from '../api/types';

type ValidationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'no-token' }
  | { status: 'valid'; data: TokenValidationResult }
  | { status: 'token-regenerated'; email: string }
  | { status: 'error'; message: string }
  | { status: 'network-error' };

type AcceptState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> };

const MIN_PASSWORD_LENGTH = 8;

function getValidationErrorMessage(error: string | undefined): string {
  if (!error) return 'Не удалось проверить ссылку. Проверьте интернет и попробуйте снова.';
  if (error === 'Invalid token')
    return 'Ссылка недействительна. Проверьте ссылку или запросите новое приглашение.';
  if (error === 'Invitation has expired')
    return 'Срок действия приглашения истёк. Обратитесь к администратору за новым приглашением.';
  if (error.includes('CANCELLED'))
    return 'Приглашение отозвано. Обратитесь к администратору.';
  if (error.includes('ACCEPTED'))
    return 'Это приглашение уже было использовано. Вы можете войти в систему.';
  if (error.includes('status:'))
    return `Приглашение недоступно (${error}). Обратитесь к администратору.`;
  return error;
}

function InvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [validation, setValidation] = useState<ValidationState>({ status: 'idle' });
  const [acceptState, setAcceptState] = useState<AcceptState>({ status: 'idle' });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  // Валидация токена при наличии token в URL
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
        } else if (data.tokenRegenerated === true && data.email) {
          setValidation({ status: 'token-regenerated', email: data.email });
        } else {
          setValidation({
            status: 'error',
            message: getValidationErrorMessage(data.error),
          });
        }
      } else {
        if (result.status === 0) {
          setValidation({
            status: 'network-error',
          });
        } else {
          const message = getValidationErrorMessage(result.error?.message);
          setValidation({ status: 'error', message });
        }
      }
    });
  }, [token]);

  const handleRetryValidation = () => {
    if (!token.trim()) return;
    setValidation({ status: 'loading' });
    validateToken(token).then((result) => {
      if (result.ok) {
        const { data } = result;
        if (data.valid === true) {
          setValidation({ status: 'valid', data });
        } else if (data.tokenRegenerated === true && data.email) {
          setValidation({ status: 'token-regenerated', email: data.email });
        } else {
          setValidation({
            status: 'error',
            message: getValidationErrorMessage(data.error),
          });
        }
      } else {
        if (result.status === 0) {
          setValidation({ status: 'network-error' });
        } else {
          setValidation({
            status: 'error',
            message: getValidationErrorMessage(result.error?.message),
          });
        }
      }
    });
  };

  const validateForm = (): boolean => {
    let ok = true;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError('Пароль должен быть не менее 8 символов');
      ok = false;
    } else {
      setPasswordError('');
    }
    if (password !== confirmPassword) {
      setConfirmError('Пароли не совпадают');
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
        setAcceptState({ status: 'success' });
        return;
      }
      const { status, error } = result;
      const msg = error?.message ?? 'Ошибка при активации';

      if (status === 400) {
        if (error?.code === 'VALIDATION_FAILED' && error?.details) {
          const details = error.details as Record<string, string>;
          setAcceptState({ status: 'error', message: msg, fieldErrors: details });
        } else {
          setAcceptState({
            status: 'error',
            message:
              'Используйте актуальную ссылку из письма или запросите новое приглашение.',
          });
        }
      } else if (status === 409) {
        if (msg.toLowerCase().includes('accepted') || msg.includes('уже'))
          setAcceptState({
            status: 'error',
            message: 'Вы уже активировали аккаунт — войдите в систему.',
          });
        else
          setAcceptState({ status: 'error', message: 'Приглашение больше нельзя принять.' });
      } else {
        setAcceptState({ status: 'error', message: msg });
      }
    });
  };

  // Нет токена
  if (validation.status === 'no-token') {
    return (
      <div className="invite-page">
        <p>Не указана ссылка приглашения. Перейдите по ссылке из письма.</p>
      </div>
    );
  }

  // Загрузка валидации
  if (validation.status === 'loading') {
    return (
      <div className="invite-page">
        <p>Проверка ссылки…</p>
      </div>
    );
  }

  // Сетевой сбой
  if (validation.status === 'network-error') {
    return (
      <div className="invite-page">
        <p>Не удалось проверить ссылку. Проверьте интернет и попробуйте снова.</p>
        <button type="button" onClick={handleRetryValidation}>
          Повторить
        </button>
      </div>
    );
  }

  // Ошибка валидации (400 и т.д.)
  if (validation.status === 'error') {
    return (
      <div className="invite-page">
        <p>{validation.message}</p>
        {validation.message.includes('войти в систему') && (
          <Link to="/login">Перейти к входу</Link>
        )}
      </div>
    );
  }

  // Токен перегенерирован, письмо отправлено
  if (validation.status === 'token-regenerated') {
    return (
      <div className="invite-page">
        <p>
          Ссылка устарела. На вашу почту ({validation.email}) отправлено новое письмо со
          ссылкой. Проверьте почту и перейдите по новой ссылке.
        </p>
      </div>
    );
  }

  // Успешная валидация — форма пароля
  if (validation.status === 'valid') {
    const { data } = validation;
    const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email;

    if (acceptState.status === 'success') {
      return (
        <div className="invite-page">
          <p>Аккаунт активирован. Теперь вы можете войти.</p>
          <Link to="/login">Перейти к входу</Link>
        </div>
      );
    }

    return (
      <div className="invite-page">
        <h1>Принятие приглашения</h1>
        {name && <p>Здравствуйте, {name}.</p>}
        {data.email && <p>Email: {data.email}</p>}

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password">Пароль (не менее 8 символов)</label>
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
            <label htmlFor="confirmPassword">Подтверждение пароля</label>
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
            {acceptState.status === 'submitting' ? 'Отправка…' : 'Активировать'}
          </button>
        </form>
      </div>
    );
  }

  return null;
}

export default InvitePage;
