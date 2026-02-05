import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMe, patchMe } from '../../../../shared/api';
import type { AccountUserDto, UpdateProfileRequest } from '../../../../shared/api';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getRoleLabelKey, getDisplayName } from '../accounts/utils';

type EditableField = 'firstName' | 'lastName' | 'phone' | 'birthDate';

const MANAGING_ROLES_ORDER: string[] = ['STAFF', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];

const ROLE_DESC_KEYS: Record<string, string> = {
  STAFF: 'permissionStaffDesc',
  MODERATOR: 'permissionModeratorDesc',
  ADMIN: 'permissionAdminDesc',
  SUPER_ADMIN: 'permissionSuperAdminDesc',
};

const ROLE_COLOR_CLASS: Record<string, string> = {
  STAFF: 'profile-permission--staff',
  MODERATOR: 'profile-permission--moderator',
  ADMIN: 'profile-permission--admin',
  SUPER_ADMIN: 'profile-permission--superadmin',
};

export function ProfilePage() {
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const tRef = useRef(t);
  tRef.current = t;
  const [profile, setProfile] = useState<AccountUserDto | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMe().then(({ data: res, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        setError(err.message ?? tRef.current('profileErrorLoad'));
        return;
      }
      if (res) setProfile(res);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editingField]);

  const startEdit = useCallback((field: EditableField) => {
    if (!profile) return;
    const raw =
      field === 'firstName'
        ? profile.firstName ?? ''
        : field === 'lastName'
          ? profile.lastName ?? ''
          : field === 'phone'
            ? profile.phone ?? ''
            : profile.birthDate ?? '';
    setEditingField(field);
    setEditValue(raw);
    setFieldError(null);
  }, [profile]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
    setFieldError(null);
  }, []);

  const saveField = useCallback(async () => {
    if (!profile || !editingField) return;
    const trimmed = editValue.trim() || null;
    const current =
      editingField === 'firstName'
        ? profile.firstName ?? ''
        : editingField === 'lastName'
          ? profile.lastName ?? ''
          : editingField === 'phone'
            ? profile.phone ?? ''
            : profile.birthDate ?? '';
    if (trimmed === (current ?? '')) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setFieldError(null);
    const payload: UpdateProfileRequest = {};
    if (editingField === 'firstName') payload.firstName = trimmed;
    if (editingField === 'lastName') payload.lastName = trimmed;
    if (editingField === 'phone') payload.phone = trimmed;
    if (editingField === 'birthDate') payload.birthDate = trimmed;
    const { data: updated, error: err } = await patchMe(payload);
    setSaving(false);
    if (err) {
      setFieldError(err.message ?? tRef.current('profileErrorUpdate'));
      const details = err.details && typeof err.details === 'object' && !Array.isArray(err.details)
        ? (err.details as Record<string, string>)[editingField]
        : undefined;
      if (details) setFieldError(details);
      return;
    }
    if (updated) setProfile(updated);
    cancelEdit();
  }, [profile, editingField, editValue, cancelEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveField();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    },
    [saveField, cancelEdit]
  );

  if (loading) {
    return (
      <div className="profile-page">
        <p className="profile-loading">{t('loadingList')}</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page">
        <div className="department-alert department-alert--error">{error}</div>
        <Link to="/dashboards/admin/departments" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const displayName = getDisplayName(profile.firstName, profile.lastName, profile.email);
  const userRoles = profile.roles ?? [];
  const managingRoles = MANAGING_ROLES_ORDER.filter((r) => userRoles.includes(r));

  const renderEditableRow = (
    field: EditableField,
    label: string,
    inputType: 'text' | 'date'
  ) => {
    const isEditing = editingField === field;
    const displayVal =
      field === 'firstName'
        ? profile.firstName ?? '—'
        : field === 'lastName'
          ? profile.lastName ?? '—'
          : field === 'phone'
            ? profile.phone ?? '—'
            : profile.birthDate ?? '—';

    return (
      <div
        key={field}
        className={`profile-field profile-field--editable ${isEditing ? 'profile-field--editing' : ''}`}
      >
        <span className="profile-field-label">{label}</span>
        {isEditing ? (
          <div className="profile-field-edit">
            <input
              ref={inputRef}
              type={inputType}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveField()}
              onKeyDown={handleKeyDown}
              className="profile-field-input"
              aria-label={label}
            />
            <span className="profile-field-hint">{t('profilePressEnterToSave')}</span>
          </div>
        ) : (
          <span
            className="profile-field-value"
            onDoubleClick={() => startEdit(field)}
            title={t('profileDoubleClickToEdit')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEdit(field);
              }
            }}
          >
            {displayVal}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="profile-page">
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      {fieldError && (
        <div className="department-alert department-alert--error" role="alert">
          {fieldError}
        </div>
      )}
      <header className="profile-header">
        <h1 className="profile-title">{t('profilePageTitle', { name: displayName })}</h1>
        <Link to="/dashboards/admin/departments" className="btn-secondary">
          {t('backToList')}
        </Link>
      </header>

      <div className="profile-layout">
        <div className="profile-column-left">
          <section className="profile-summary">
            <div className="profile-avatar" aria-hidden="true">
              {(displayName || profile.email || 'A').charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-summary-name">{displayName}</h2>
            <p className="profile-summary-email">{profile.email}</p>
            <div className="profile-summary-roles">
              {(profile.roles ?? []).map((r) => (
                <span key={r} className="profile-role-tag">
                  {t(getRoleLabelKey(r))}
                </span>
              ))}
            </div>
            <p className="profile-summary-meta">
              <span className="profile-summary-meta-label">{t('profileMemberSince')}</span>
              {formatDateTime(profile.createdAt, locale)}
            </p>
          </section>

          {managingRoles.length > 0 && (
            <section className="profile-section profile-section--permissions">
              <h3 className="profile-section-title profile-section-title--with-icon">
                <span className="profile-section-title-icon" aria-hidden="true" />
                {t('profilePermissionsTitle')}
              </h3>
              <ul className="profile-permissions-list">
                {managingRoles.map((role) => (
                  <li
                    key={role}
                    className={`profile-permission ${ROLE_COLOR_CLASS[role] ?? ''}`}
                  >
                    <div className="profile-permission-content">
                      <span className="profile-permission-name">{t(getRoleLabelKey(role))}</span>
                      <p className="profile-permission-desc">
                        {t(ROLE_DESC_KEYS[role] ?? 'profilePermissionDefaultDesc')}
                      </p>
                    </div>
                    <span className="profile-permission-badge">{t('profilePermissionActive')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="profile-column-right">
          <section className="profile-section profile-section--personal">
            <h3 className="profile-section-title">{t('profileCardPersonal')}</h3>
            <p className="profile-section-hint">{t('profileDoubleClickToEdit')}</p>
            <div className="profile-fields">
              {renderEditableRow('firstName', t('invitationFirstName'), 'text')}
              {renderEditableRow('lastName', t('invitationLastName'), 'text')}
              <div className="profile-field">
                <span className="profile-field-label">{t('invitationEmail')}</span>
                <span className="profile-field-value profile-field-value--readonly">
                  {profile.email ?? '—'}
                </span>
              </div>
              {renderEditableRow('phone', t('invitationPhone'), 'text')}
              {renderEditableRow('birthDate', t('invitationBirthDate'), 'date')}
            </div>
            {saving && (
              <p className="profile-saving" aria-live="polite">
                {tCommon('submitting')}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
