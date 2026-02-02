import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

type LoginState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; code?: string; message: string; fieldErrors?: Record<string, string> }
  | { status: 'network-error' };

const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_ACTIVE: 'USER_NOT_ACTIVE',
  USER_DISABLED: 'USER_DISABLED',
} as const;

function getLoginErrorMessage(code: string | undefined, message: string): string {
  if (code === AUTH_ERROR_CODES.INVALID_CREDENTIALS) {
    return 'Неверный email или пароль.';
  }
  if (code === AUTH_ERROR_CODES.USER_NOT_ACTIVE) {
    return 'Аккаунт не активирован. Проверьте почту — там ссылка для активации. Не пришло письмо? Проверьте папку «Спам» или обратитесь к администратору для повторной отправки приглашения.';
  }
  if (code === AUTH_ERROR_CODES.USER_DISABLED) {
    return 'Аккаунт отключён. Обратитесь к администратору.';
  }
  return message || 'Не удалось войти. Проверьте подключение и попробуйте снова.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<LoginState>({ status: 'idle' });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setState({ status: 'submitting' });

    login({ email, password }).then((result) => {
      if (result.ok) {
        setUser(result.data);
        navigate('/', { replace: true });
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
          message: getLoginErrorMessage(code, message),
        });
        setPassword('');
        return;
      }

      if (status === 403) {
        setState({
          status: 'error',
          code,
          message: getLoginErrorMessage(code, message),
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
        message: getLoginErrorMessage(code, message),
      });
      setPassword('');
    });
  };

  const showGeneralError =
    state.status === 'error' &&
    state.code !== 'VALIDATION_FAILED' &&
    state.message;

  return (
    <div className="login-page">
      <h1>Вход</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">Email</label>
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
          <label htmlFor="login-password">Пароль</label>
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
        {showGeneralError && <p className="error">{state.message}</p>}
        {state.status === 'network-error' && (
          <p className="error">
            Не удалось войти. Проверьте подключение и попробуйте снова.
          </p>
        )}
        <button type="submit" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? 'Вход…' : 'Войти'}
        </button>
      </form>
      <p className="login-links">
        <Link to="/invite">Принять приглашение</Link>
        {/* Опционально: <Link to="/forgot-password">Забыли пароль?</Link> */}
      </p>
    </div>
  );
}
