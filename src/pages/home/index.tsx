import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import { useTranslation } from '../../shared/i18n';
import { LanguageSwitcher } from '../../shared/i18n';

/** Главная страница (публичная) */
export function HomePage() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div>
        <p>{tCommon('loading')}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1>{t('title')}</h1>
        <LanguageSwitcher variant="buttons" />
      </div>
      <p>{t('mainPage')}</p>
      {user ? (
        <p>
          {t('signedInAs', {
            email: user.email ?? '',
            fullName: user.fullName ? ` (${user.fullName})` : '',
          })}{' '}
          <Link to="/dashboards">{t('dashboard')}</Link>
          {' · '}
          <button type="button" onClick={handleLogout}>
            {t('logout')}
          </button>
        </p>
      ) : (
        <p>
          <Link to="/login">{t('login')}</Link>
        </p>
      )}
    </div>
  );
}
