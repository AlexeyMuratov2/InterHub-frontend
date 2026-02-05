import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getUser,
  patchUser,
  deleteUser,
  type UserWithProfilesDto,
  type UpdateUserRequest,
} from '../../../../shared/api';
import { useCanManageAccounts } from '../../../../app/hooks/useCanManageAccounts';
import { useCanDeleteUser } from '../../../../app/hooks/useCanDeleteUser';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getRoleLabelKey, getDisplayName } from './utils';
import {
  ALL_ROLES_ORDER,
  MAX_ROLES,
  isManagingRole,
} from '../invitations/utils';

export function UserViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canManage = useCanManageAccounts();
  const [data, setData] = useState<UserWithProfilesDto | undefined>(undefined);
  const canDeleteThis = useCanDeleteUser(id ?? '', data?.user?.roles ?? []);
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateUserRequest>({});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validationDetails, setValidationDetails] = useState<
    Record<string, string> | null
  >(null);
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const addRoleRef = useRef<HTMLDivElement>(null);
  const errorLoadRef = useRef(t('accountErrorLoad'));
  errorLoadRef.current = t('accountErrorLoad');

  useEffect(() => {
    if (!addRoleOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addRoleRef.current && !addRoleRef.current.contains(e.target as Node)) {
        setAddRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addRoleOpen]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);
    getUser(id).then(({ data: res, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404 || err.code === 'ACCOUNT_USER_NOT_FOUND')
          setNotFound(true);
        else setError(err.message ?? errorLoadRef.current);
        return;
      }
      if (res) setData(res);
      else setNotFound(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (data?.user && editing) {
      const u = data.user;
      setForm({
        firstName: u.firstName ?? undefined,
        lastName: u.lastName ?? undefined,
        phone: u.phone ?? undefined,
        birthDate: u.birthDate ?? undefined,
        roles: u.roles?.length ? [...u.roles] : undefined,
      });
    }
  }, [data, editing]);

  const handleSave = async () => {
    if (!id || !data) return;
    setSaving(true);
    setError(null);
    setValidationDetails(null);
    const payload: UpdateUserRequest = {};
    if (form.firstName !== undefined) payload.firstName = form.firstName || null;
    if (form.lastName !== undefined) payload.lastName = form.lastName || null;
    if (form.phone !== undefined) payload.phone = form.phone || null;
    if (form.birthDate !== undefined) payload.birthDate = form.birthDate || null;
    if (form.roles !== undefined) payload.roles = form.roles?.length ? form.roles : null;
    const { data: updated, error: err } = await patchUser(id, payload);
    setSaving(false);
    if (err) {
      setError(err.message ?? t('accountErrorUpdate'));
      if (err.details && typeof err.details === 'object' && !Array.isArray(err.details)) {
        setValidationDetails(err.details as Record<string, string>);
      }
      return;
    }
    if (updated && data) {
      setData({ ...data, user: updated });
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);
    const { error: err } = await deleteUser(id);
    setDeleting(false);
    setDeleteConfirm(false);
    if (err) {
      setError(err.message ?? t('accountErrorDelete'));
      return;
    }
    navigate('/dashboards/admin/accounts', { replace: true });
  };

  const currentRoles = form.roles ?? [];
  const hasManagingRole = currentRoles.some(isManagingRole);
  const availableRolesToAdd =
    currentRoles.length >= MAX_ROLES
      ? []
      : ALL_ROLES_ORDER.filter((r) => {
          if (currentRoles.includes(r)) return false;
          if (hasManagingRole && isManagingRole(r)) return false;
          return true;
        });

  const addRole = (role: string) => {
    if (currentRoles.length >= MAX_ROLES || currentRoles.includes(role)) return;
    if (hasManagingRole && isManagingRole(role)) return;
    if (isManagingRole(role)) {
      const withoutManaging = currentRoles.filter((r) => !isManagingRole(r));
      setForm({ ...form, roles: [...withoutManaging, role].sort(compareRolesOrder) });
      return;
    }
    setForm({ ...form, roles: [...currentRoles, role].sort(compareRolesOrder) });
  };

  const removeRole = (role: string) => {
    setForm({ ...form, roles: currentRoles.filter((r) => r !== role) });
  };

  function compareRolesOrder(a: string, b: string): number {
    const i = ALL_ROLES_ORDER.indexOf(a);
    const j = ALL_ROLES_ORDER.indexOf(b);
    return i - j;
  }

  if (loading) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="entity-view-card">
          <p style={{ margin: 0, color: '#6b7280' }}>{t('loadingList')}</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="department-alert department-alert--error">
          {t('accountUserNotFound')}
        </div>
        <Link to="/dashboards/admin/accounts" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="entity-view-page department-form-page">
        <div className="department-alert department-alert--error">{error}</div>
        <Link to="/dashboards/admin/accounts" className="btn-secondary">
          {t('backToList')}
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const user = data.user;
  const displayName = getDisplayName(user.firstName, user.lastName, user.email);
  const teacherDisplayName = data.teacherProfile?.englishName ?? displayName;
  const studentDisplayName = data.studentProfile?.chineseName ?? displayName;

  return (
    <div className="entity-view-page department-form-page account-view-page">
      {!canManage && (
        <div className="department-alert department-alert--info" role="status">
          {t('accountViewOnlyHint')}
        </div>
      )}
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      {validationDetails && Object.keys(validationDetails).length > 0 && (
        <ul className="department-alert department-alert--error" role="alert">
          {Object.entries(validationDetails).map(([field, msg]) => (
            <li key={field}>
              {field}: {msg}
            </li>
          ))}
        </ul>
      )}
      <header className="entity-view-header">
        <h1 className="entity-view-title">
          {editing ? t('accountEditPageTitle') : t('accountViewPageTitle', { name: displayName })}
        </h1>
        <div className="entity-view-actions department-form-actions">
          {canManage && !editing && (
            <button
              type="button"
              className="btn-primary btn-action-fixed"
              onClick={() => setEditing(true)}
            >
              {t('editTitle')}
            </button>
          )}
          {canManage && editing && (
            <span className="entity-view-actions-hint">
              {t('accountEditHint')}
            </span>
          )}
          {canDeleteThis && !editing && (
            <button
              type="button"
              className="btn-delete btn-action-fixed"
              onClick={() => setDeleteConfirm(true)}
            >
              {t('deleteTitle')}
            </button>
          )}
          <Link to="/dashboards/admin/accounts" className="btn-secondary">
            {t('backToList')}
          </Link>
        </div>
      </header>
      <div className="entity-view-card">
        {editing ? (
          <form
            id="account-edit-form"
            className="department-form account-edit-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="form-group">
              <label htmlFor="account-firstName">{t('invitationFirstName')}</label>
              <input
                id="account-firstName"
                type="text"
                value={form.firstName ?? ''}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value || null })
                }
                aria-label={t('invitationFirstName')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="account-lastName">{t('invitationLastName')}</label>
              <input
                id="account-lastName"
                type="text"
                value={form.lastName ?? ''}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value || null })
                }
                aria-label={t('invitationLastName')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="account-phone">{t('invitationPhone')}</label>
              <input
                id="account-phone"
                type="text"
                value={form.phone ?? ''}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value || null })
                }
                aria-label={t('invitationPhone')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="account-birthDate">{t('invitationBirthDate')}</label>
              <input
                id="account-birthDate"
                type="date"
                value={form.birthDate ?? ''}
                onChange={(e) =>
                  setForm({ ...form, birthDate: e.target.value || null })
                }
                aria-label={t('invitationBirthDate')}
                title={t('invitationBirthDate')}
              />
            </div>
            <div className="form-group">
              <label>{t('invitationRoles')}</label>
              <p className="invitation-roles-hint">{t('accountRolesHint')}</p>
              <div className="invitation-roles-chips">
                {currentRoles.map((role) => (
                  <span key={role} className="invitation-role-chip">
                    <span className="invitation-role-chip-label">
                      {t(getRoleLabelKey(role))}
                    </span>
                    <button
                      type="button"
                      className="invitation-role-chip-remove"
                      onClick={() => removeRole(role)}
                      title={t('invitationRemoveRole')}
                      aria-label={t('invitationRemoveRole')}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {currentRoles.length < MAX_ROLES && availableRolesToAdd.length > 0 && (
                <div className="invitation-add-role-wrap" ref={addRoleRef}>
                  <button
                    type="button"
                    className="invitation-add-role-btn"
                    onClick={() => setAddRoleOpen((v) => !v)}
                    aria-expanded={addRoleOpen}
                    aria-haspopup="listbox"
                  >
                    + {t('invitationAddRole')}
                  </button>
                  {addRoleOpen && (
                    <ul
                      className="invitation-add-role-list"
                      role="listbox"
                      aria-label={t('invitationAddRole')}
                    >
                      {availableRolesToAdd.map((role) => (
                        <li key={role} role="option">
                          <button
                            type="button"
                            className="invitation-add-role-item"
                            data-role={role}
                            onClick={(e) => {
                              const value = (e.currentTarget as HTMLButtonElement).dataset.role;
                              if (value) addRole(value);
                            }}
                          >
                            {t(getRoleLabelKey(role))}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="department-form-actions">
              <button
                type="submit"
                className="btn-primary btn-action-fixed"
                disabled={saving}
              >
                {saving ? tCommon('submitting') : t('accountSave')}
              </button>
              <button
                type="button"
                className="btn-cancel btn-action-fixed"
                disabled={saving}
                onClick={() => setEditing(false)}
              >
                {tCommon('cancel')}
              </button>
            </div>
          </form>
        ) : (
          <div className="account-view-sections">
            {/* Секция: аккаунт (общие данные пользователя) */}
            <section className="account-profile-section account-profile-section--account">
              <h2 className="account-profile-section-title">
                {t('accountSectionAccount')}
              </h2>
              <div className="account-view-readonly">
                <div className="account-view-row">
                  <span className="account-view-label">{t('invitationEmail')}</span>
                  <span className="account-view-value">{user.email ?? '—'}</span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('invitationRoles')}</span>
                  <span className="account-view-value">
                    {(user.roles ?? []).length === 0
                      ? '—'
                      : (user.roles ?? []).map((r) => (
                          <span key={r} className="account-view-role-chip">
                            {t(getRoleLabelKey(r))}
                          </span>
                        ))}
                  </span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('name')}</span>
                  <span className="account-view-value">{displayName}</span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('invitationFirstName')}</span>
                  <span className="account-view-value">{user.firstName ?? '—'}</span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('invitationLastName')}</span>
                  <span className="account-view-value">{user.lastName ?? '—'}</span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('invitationPhone')}</span>
                  <span className="account-view-value">{user.phone ?? '—'}</span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('invitationBirthDate')}</span>
                  <span className="account-view-value">{user.birthDate ?? '—'}</span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('accountStatus')}</span>
                  <span className="account-view-value">
                    <span
                      className={`invitation-status-badge invitation-status-badge--${(
                        user.status ?? 'PENDING'
                      ).toLowerCase()}`}
                    >
                      {t(
                        `accountStatus${(user.status ?? 'PENDING').charAt(0) + (user.status ?? 'PENDING').slice(1).toLowerCase()}`
                      )}
                    </span>
                  </span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('invitationCreatedAt')}</span>
                  <span className="account-view-value">
                    {formatDateTime(user.createdAt, locale)}
                  </span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('accountActivatedAt')}</span>
                  <span className="account-view-value">
                    {user.activatedAt
                      ? formatDateTime(user.activatedAt, locale)
                      : '—'}
                  </span>
                </div>
                <div className="account-view-row">
                  <span className="account-view-label">{t('accountLastLoginAt')}</span>
                  <span className="account-view-value">
                    {user.lastLoginAt
                      ? formatDateTime(user.lastLoginAt, locale)
                      : '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* Секция: профиль преподавателя (только если есть) */}
            {data.teacherProfile != null && (
              <section className="account-profile-section account-profile-section--teacher">
                <h2 className="account-profile-section-title">
                  {t('accountSectionTeacherProfile')}
                </h2>
                <p className="account-profile-section-subtitle">
                  {t('accountDisplayNameLabel')}: {teacherDisplayName}
                </p>
                <div className="account-view-readonly">
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationTeacherId')}</span>
                    <span className="account-view-value">{data.teacherProfile.teacherId}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationFaculty')}</span>
                    <span className="account-view-value">{data.teacherProfile.faculty}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationEnglishName')}</span>
                    <span className="account-view-value">{data.teacherProfile.englishName ?? '—'}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationPosition')}</span>
                    <span className="account-view-value">{data.teacherProfile.position ?? '—'}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationCreatedAt')}</span>
                    <span className="account-view-value">
                      {formatDateTime(data.teacherProfile.createdAt, locale)}
                    </span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('accountProfileUpdatedAt')}</span>
                    <span className="account-view-value">
                      {formatDateTime(data.teacherProfile.updatedAt, locale)}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Секция: профиль студента (только если есть) */}
            {data.studentProfile != null && (
              <section className="account-profile-section account-profile-section--student">
                <h2 className="account-profile-section-title">
                  {t('accountSectionStudentProfile')}
                </h2>
                <p className="account-profile-section-subtitle">
                  {t('accountDisplayNameLabel')}: {studentDisplayName}
                </p>
                <div className="account-view-readonly">
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationStudentId')}</span>
                    <span className="account-view-value">{data.studentProfile.studentId}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationFaculty')}</span>
                    <span className="account-view-value">{data.studentProfile.faculty}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationChineseName')}</span>
                    <span className="account-view-value">{data.studentProfile.chineseName ?? '—'}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationCourse')}</span>
                    <span className="account-view-value">{data.studentProfile.course ?? '—'}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationEnrollmentYear')}</span>
                    <span className="account-view-value">
                      {data.studentProfile.enrollmentYear ?? '—'}
                    </span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationGroupName')}</span>
                    <span className="account-view-value">{data.studentProfile.groupName ?? '—'}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationCreatedAt')}</span>
                    <span className="account-view-value">
                      {formatDateTime(data.studentProfile.createdAt, locale)}
                    </span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('accountProfileUpdatedAt')}</span>
                    <span className="account-view-value">
                      {formatDateTime(data.studentProfile.updatedAt, locale)}
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div
          className="department-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeleteConfirm(false)}
        >
          <div className="department-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('accountDeleteConfirmTitle')}</h3>
            <p>{t('accountDeleteConfirmText')}</p>
            <div className="department-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteConfirm(false)}
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                className="btn-delete"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? tCommon('submitting') : t('deleteTitle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
