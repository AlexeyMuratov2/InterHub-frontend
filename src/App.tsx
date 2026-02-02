import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import InvitePage from './pages/InvitePage';
import LoginPage from './pages/LoginPage';
import './App.css';

function Home() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div>
        <p>Загрузка…</p>
      </div>
    );
  }

  return (
    <div>
      <h1>InterHub</h1>
      <p>Главная страница</p>
      {user ? (
        <p>
          Вы вошли как {user.email}
          {user.fullName && ` (${user.fullName})`}.{' '}
          <button type="button" onClick={handleLogout}>
            Выйти
          </button>
        </p>
      ) : (
        <p>
          <Link to="/login">Войти</Link>
        </p>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
