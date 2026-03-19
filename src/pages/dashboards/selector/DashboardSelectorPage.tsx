import type { ElementType } from 'react';
import { LayoutGrid, LoaderCircle, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import universityLogo from '../../../assets/university-logo.png';
import { useAuth } from '../../../app/providers';
import type { DashboardKind } from '../../../shared/config';
import { LanguageSwitcher, useTranslation } from '../../../shared/i18n';
import { DashboardUserMenu } from '../../../shared/ui';
import {
  DASHBOARD_SELECTOR_CTA_ICON,
  getDashboardSelectorCards,
  getDashboardSelectorCopy,
} from './dashboardSelectorContent';
import { useDashboardSelectorState } from './useDashboardSelectorState';
import './dashboard-selector.css';

type StatusPanelProps = {
  icon: typeof LayoutGrid;
  title: string;
  description: string;
  spin?: boolean;
};

type DashboardCardProps = {
  kind: DashboardKind;
  href: string;
  title: string;
  description: string;
  badge: string;
  cta: string;
  icon: ElementType;
};

function StatusPanel({
  icon: Icon,
  title,
  description,
  spin = false,
}: StatusPanelProps) {
  return (
    <div className="dashboard-selector-status" role="status">
      <div className="dashboard-selector-status-icon-wrap">
        <Icon
          className={
            'dashboard-selector-status-icon' +
            (spin ? ' dashboard-selector-status-icon--spin' : '')
          }
        />
      </div>
      <h2 className="dashboard-selector-status-title">{title}</h2>
      <p className="dashboard-selector-status-description">{description}</p>
    </div>
  );
}

function DashboardCard({
  kind,
  href,
  title,
  description,
  badge,
  cta,
  icon: Icon,
}: DashboardCardProps) {
  const CtaIcon = DASHBOARD_SELECTOR_CTA_ICON;

  return (
    <Link
      to={href}
      className={`dashboard-selector-card dashboard-selector-card--${kind}`}
    >
      <span className="dashboard-selector-card-badge">{badge}</span>
      <div className="dashboard-selector-card-icon">
        <Icon />
      </div>
      <h2 className="dashboard-selector-card-title">{title}</h2>
      <p className="dashboard-selector-card-description">{description}</p>
      <span className="dashboard-selector-card-cta">
        <span>{cta}</span>
        <CtaIcon />
      </span>
    </Link>
  );
}

export function DashboardSelectorPage() {
  const { locale } = useTranslation('dashboard');
  const { logout } = useAuth();
  const state = useDashboardSelectorState();
  const copy = getDashboardSelectorCopy(locale);

  if (state.status === 'unauthorized') {
    return null;
  }

  const showUserMenu = state.status !== 'loading';
  const cards =
    state.status === 'ready'
      ? getDashboardSelectorCards(locale, state.dashboards)
      : [];

  return (
    <div className="dashboard-selector-page">
      <div className="dashboard-selector-page-glow dashboard-selector-page-glow--top" />
      <div className="dashboard-selector-page-glow dashboard-selector-page-glow--bottom" />
      <div className="dashboard-selector-shell">
        <header className="dashboard-selector-header">
          <div className="dashboard-selector-container dashboard-selector-header-inner">
            <div className="dashboard-selector-brand">
              <div className="dashboard-selector-brand-logo">
                <img src={universityLogo} alt="" />
              </div>
              <div className="dashboard-selector-brand-text">
                <span className="dashboard-selector-brand-title">
                  {copy.brandTitle}
                </span>
                <span className="dashboard-selector-brand-subtitle">
                  {copy.brandSubtitle}
                </span>
              </div>
            </div>
            <div className="dashboard-selector-header-actions">
              <LanguageSwitcher
                className="dashboard-selector-header-lang"
                variant="select"
              />
              {showUserMenu ? (
                <DashboardUserMenu
                  userName={state.userName}
                  userEmail={state.userEmail}
                  logoutLabel={copy.logoutLabel}
                  onLogout={logout}
                />
              ) : null}
            </div>
          </div>
        </header>

        <main className="dashboard-selector-main">
          <div className="dashboard-selector-container">
            <section className="dashboard-selector-hero">
              <div className="dashboard-selector-hero-eyebrow">
                <LayoutGrid />
                <span>{copy.brandTitle}</span>
              </div>
              <h1 className="dashboard-selector-hero-title">{copy.heroTitle}</h1>
              <p className="dashboard-selector-hero-description">
                {copy.heroDescription}
              </p>
            </section>

            {state.status === 'loading' ? (
              <StatusPanel
                icon={LoaderCircle}
                title={copy.loadingTitle}
                description={copy.loadingDescription}
                spin
              />
            ) : null}

            {state.status === 'redirecting' ? (
              <StatusPanel
                icon={LoaderCircle}
                title={copy.redirectingTitle}
                description={copy.redirectingDescription}
                spin
              />
            ) : null}

            {state.status === 'empty' ? (
              <StatusPanel
                icon={ShieldAlert}
                title={copy.emptyTitle}
                description={copy.emptyDescription}
              />
            ) : null}

            {state.status === 'ready' ? (
              <>
                <section className="dashboard-selector-grid">
                  {cards.map((card) => (
                    <DashboardCard key={card.kind} {...card} />
                  ))}
                </section>
                <p className="dashboard-selector-footer">{copy.footerHint}</p>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
