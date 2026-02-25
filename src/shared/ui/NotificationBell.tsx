import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { request } from '../api/client';
import { useTranslation } from '../i18n';
import { formatDateTime } from '../i18n/date';
import type { Locale } from '../i18n/config';
import './NotificationBell.css';

interface NotificationDto {
  id: string;
  templateKey: string;
  params: Record<string, string>;
  data: Record<string, string>;
  createdAt: string;
  readAt: string | null;
  archivedAt: string | null;
}

interface NotificationPage {
  items: NotificationDto[];
  nextCursor: string | null;
}

const POLL_INTERVAL = 30_000;

function resolveNotificationLink(data: Record<string, string>, dashboardPrefix: string): string | null {
  const route = data?.route;
  if (!route) return null;

  if (route === 'sessionAttendance' && data.sessionId) {
    return `${dashboardPrefix}/lessons/${data.sessionId}`;
  }
  if (route === 'studentAttendance' && data.sessionId) {
    return `${dashboardPrefix}/lessons/${data.sessionId}`;
  }
  return null;
}

function getIconVariant(templateKey: string): 'absence' | 'attendance' | 'default' {
  if (templateKey.startsWith('attendance.absenceNotice')) return 'absence';
  if (templateKey.startsWith('attendance.record')) return 'attendance';
  return 'default';
}

function BellIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function renderIcon(variant: 'absence' | 'attendance' | 'default') {
  switch (variant) {
    case 'absence':
      return <AlertTriangle size={18} />;
    case 'attendance':
      return <CheckCircle2 size={18} />;
    default:
      return <BellIcon size={22} />;
  }
}

function renderNotificationText(
  n: NotificationDto,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const p = n.params;
  switch (n.templateKey) {
    case 'attendance.absenceNotice.submitted': {
      const typeKey = p.noticeType === 'LATE' ? 'notifNoticeTypeLate' : 'notifNoticeTypeAbsent';
      return t('notifAbsenceSubmitted', { type: t(typeKey) });
    }
    case 'attendance.absenceNotice.updated': {
      const typeKey = p.noticeType === 'LATE' ? 'notifNoticeTypeLate' : 'notifNoticeTypeAbsent';
      return t('notifAbsenceUpdated', { type: t(typeKey) });
    }
    case 'attendance.record.marked': {
      const statusKey = `notifAttendanceStatus_${p.status}`;
      return t('notifAttendanceMarked', { status: t(statusKey) });
    }
    default:
      return n.templateKey;
  }
}

function timeAgo(isoDate: string, locale: Locale): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return locale === 'ru' ? 'только что' : locale === 'zh-Hans' ? '刚刚' : 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}${locale === 'ru' ? ' мин' : locale === 'zh-Hans' ? '分钟前' : 'm'}`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}${locale === 'ru' ? ' ч' : locale === 'zh-Hans' ? '小时前' : 'h'}`;
  return formatDateTime(isoDate, locale);
}

interface NotificationBellProps {
  dashboardPrefix: string;
}

export function NotificationBell({ dashboardPrefix }: NotificationBellProps) {
  const { t, locale } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    const res = await request<{ count: number }>('/api/notifications/mine/unread-count');
    if (res.data) setUnreadCount(res.data.count);
  }, []);

  const fetchNotifications = useCallback(async (status: 'all' | 'unread', cursor?: string | null) => {
    setLoading(true);
    const params = new URLSearchParams({ status, limit: '20' });
    if (cursor) params.set('cursor', cursor);
    const res = await request<NotificationPage>(`/api/notifications/mine?${params}`);
    setLoading(false);
    if (res.data) {
      if (cursor) {
        setNotifications(prev => [...prev, ...res.data!.items]);
      } else {
        setNotifications(res.data.items);
      }
      setNextCursor(res.data.nextCursor);
    }
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      setInitialLoad(true);
      fetchNotifications(tab);
    }
  }, [open, tab, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    await request(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await request('/api/notifications/mine/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
  };

  const handleItemClick = (n: NotificationDto) => {
    if (!n.readAt) handleMarkAsRead(n.id);
    const link = resolveNotificationLink(n.data, dashboardPrefix);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  const loadMore = () => {
    if (nextCursor && !loading) fetchNotifications(tab, nextCursor);
  };

  return (
    <div className="notification-bell" style={{ minWidth: 40, minHeight: 40 }}>
      <button
        ref={triggerRef}
        type="button"
        className="notification-bell-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t('notifBellLabel')}
      >
        <BellIcon size={22} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel" ref={panelRef}>
          <div className="notification-panel-header">
            <h3>{t('notifTitle')}</h3>
            <button
              type="button"
              className="notification-panel-mark-all"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              {t('notifMarkAllRead')}
            </button>
          </div>

          <div className="notification-panel-tabs">
            <button
              type="button"
              className={`notification-panel-tab${tab === 'all' ? ' notification-panel-tab--active' : ''}`}
              onClick={() => setTab('all')}
            >
              {t('notifTabAll')}
            </button>
            <button
              type="button"
              className={`notification-panel-tab${tab === 'unread' ? ' notification-panel-tab--active' : ''}`}
              onClick={() => setTab('unread')}
            >
              {t('notifTabUnread')}
              {unreadCount > 0 && ` (${unreadCount})`}
            </button>
          </div>

          <div className="notification-panel-body">
            {initialLoad && loading ? (
              <div className="notification-panel-loading">
                <Clock size={16} style={{ marginRight: 6 }} />
                {t('loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-panel-empty">
                <BellIcon size={48} />
                <span>{t('notifEmpty')}</span>
              </div>
            ) : (
              notifications.map(n => {
                const variant = getIconVariant(n.templateKey);
                const isUnread = !n.readAt;
                const link = resolveNotificationLink(n.data, dashboardPrefix);
                return (
                  <div
                    key={n.id}
                    className={`notification-item${isUnread ? ' notification-item--unread' : ''}`}
                    onClick={() => handleItemClick(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') handleItemClick(n); }}
                  >
                    <div className={`notification-item-icon notification-item-icon--${variant}`}>
                      {renderIcon(variant)}
                    </div>
                    <div className="notification-item-content">
                      <p className="notification-item-text">
                        {renderNotificationText(n, t)}
                      </p>
                      <div className="notification-item-meta">
                        <span className="notification-item-time">
                          {timeAgo(n.createdAt, locale as Locale)}
                        </span>
                        {link && (
                          <span className="notification-item-link">
                            {t('notifGoToLesson')}
                          </span>
                        )}
                      </div>
                    </div>
                    {isUnread && <span className="notification-item-dot" />}
                  </div>
                );
              })
            )}
          </div>

          {nextCursor && !loading && (
            <div className="notification-panel-load-more">
              <button type="button" onClick={loadMore}>
                {t('notifLoadMore')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
