import { Outlet } from 'react-router-dom';

/** Общий layout для публичных страниц (логин, приглашение, главная) */
export function MainLayout() {
  return (
    <div className="app-main-layout">
      <Outlet />
    </div>
  );
}
