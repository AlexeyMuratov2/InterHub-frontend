import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUser,
  patchUser,
  deleteUser,
  type UserWithProfilesDto,
  type UpdateUserRequest,
  type CreateStudentRequest,
  type CreateTeacherRequest,
} from '../../../../shared/api';
import { useCanManageAccounts } from '../../../../app/hooks/useCanManageAccounts';
import { useCanDeleteUser } from '../../../../app/hooks/useCanDeleteUser';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getDisplayName, parseFieldErrors } from '../../../../shared/lib';
import { Alert, ConfirmModal, FormActions, FormGroup } from '../../../../shared/ui';
import { EntityViewLayout } from '../../../../widgets/entity-view-layout';
import { getRoleLabelKey } from './utils';
import {
  ALL_ROLES_ORDER,
  MAX_ROLES,
  isManagingRole,
  hasStudent,
  hasTeacher,
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
  const [studentData, setStudentData] = useState<CreateStudentRequest | null>(null);
  const [teacherData, setTeacherData] = useState<CreateTeacherRequest | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
      setFieldErrors({});
      const u = data.user;
      setForm({
        firstName: u.firstName ?? undefined,
        lastName: u.lastName ?? undefined,
        phone: u.phone ?? undefined,
        birthDate: u.birthDate ?? undefined,
        roles: u.roles?.length ? [...u.roles] : undefined,
      });
      if (data.studentProfile) {
        const s = data.studentProfile;
        setStudentData({
          studentId: s.studentId ?? '',
          chineseName: s.chineseName ?? null,
          faculty: s.faculty ?? '',
          course: s.course ?? null,
          enrollmentYear: s.enrollmentYear ?? null,
          groupName: s.groupName ?? null,
        });
      } else if (hasStudent(u.roles ?? [])) {
        setStudentData((prev) => prev ?? { studentId: '', faculty: '' });
      } else {
        setStudentData(null);
      }
      if (data.teacherProfile) {
        const t = data.teacherProfile;
        setTeacherData({
          teacherId: t.teacherId ?? '',
          faculty: t.faculty ?? '',
          englishName: t.englishName ?? null,
          position: t.position ?? null,
        });
      } else if (hasTeacher(u.roles ?? [])) {
        setTeacherData((prev) => prev ?? { teacherId: '', faculty: '' });
      } else {
        setTeacherData(null);
      }
    }
  }, [data, editing]);

  useEffect(() => {
    if (!editing || !form.roles) return;
    if (hasStudent(form.roles)) {
      setStudentData((prev) => prev ?? { studentId: '', faculty: '' });
    } else {
      setStudentData(null);
    }
  }, [editing, form.roles]);

  useEffect(() => {
    if (!editing || !form.roles) return;
    if (hasTeacher(form.roles)) {
      setTeacherData((prev) => prev ?? { teacherId: '', faculty: '' });
    } else {
      setTeacherData(null);
    }
  }, [editing, form.roles]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const roles = form.roles ?? [];
    if (roles.length === 0) err.roles = t('invitationAtLeastOneRole');
    if (roles.length > MAX_ROLES) err.roles = t('invitationRolesMax');
    if (hasStudent(roles) && studentData) {
      if (!studentData.studentId?.trim()) err.studentId = t('invitationStudentId');
      if (!studentData.faculty?.trim()) err.faculty = t('invitationFaculty');
    }
    if (hasTeacher(roles) && teacherData) {
      if (!teacherData.teacherId?.trim()) err.teacherId = t('invitationTeacherId');
      if (!teacherData.faculty?.trim()) err.faculty = t('invitationFaculty');
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!id || !data) return;
    setError(null);
    setValidationDetails(null);
    setFieldErrors({});
    if (!validate()) return;
    setSaving(true);
    const roles = form.roles ?? [];
    const payload: UpdateUserRequest = {
      firstName: form.firstName ?? null,
      lastName: form.lastName ?? null,
      phone: form.phone ?? null,
      birthDate: form.birthDate ?? null,
      roles: roles.length > 0 ? [...roles] : null,
    };
    // Профили передаём в том же PATCH (контракт: PATCH /api/account/users/{id} с studentProfile/teacherProfile).
    if (hasStudent(roles) && studentData) {
      payload.studentProfile = {
        studentId: studentData.studentId?.trim() || null,
        chineseName: studentData.chineseName?.trim() || null,
        faculty: studentData.faculty?.trim() || null,
        course: studentData.course?.trim() || null,
        enrollmentYear: studentData.enrollmentYear ?? null,
        groupName: studentData.groupName?.trim() || null,
      };
    }
    if (hasTeacher(roles) && teacherData) {
      payload.teacherProfile = {
        teacherId: teacherData.teacherId?.trim() || null,
        faculty: teacherData.faculty?.trim() || null,
        englishName: teacherData.englishName?.trim() || null,
        position: teacherData.position?.trim() || null,
      };
    }
    const { error: err } = await patchUser(id, payload);
    if (err) {
      setSaving(false);
      setError(err.message ?? t('accountErrorUpdate'));
      if (err.details) {
        setValidationDetails(parseFieldErrors(err.details));
      }
      return;
    }
    // После успешного PATCH повторно запрашиваем пользователя с профилями (контракт, п. 4.3).
    const { data: fresh, error: getErr } = await getUser(id);
    if (getErr || !fresh) {
      setSaving(false);
      setError(getErr?.message ?? t('accountErrorLoad'));
      return;
    }
    setData(fresh);
    setSaving(false);
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

  const user = data?.user;
  const displayName = user ? getDisplayName(user.firstName, user.lastName, user.email) : '';
  const teacherDisplayName = data?.teacherProfile?.englishName ?? displayName;
  const studentDisplayName = data?.studentProfile?.chineseName ?? displayName;

  return (
    <EntityViewLayout
      loading={loading}
      notFound={notFound}
      error={error != null && !data ? error : null}
      notFoundMessage={t('accountUserNotFound')}
      errorMessage={error ?? t('accountErrorLoad')}
      backTo="/dashboards/admin/accounts"
      backLabel={tCommon('back')}
      viewOnly={!canManage}
      viewOnlyMessage={t('accountViewOnlyHint')}
      title={data ? (editing ? t('accountEditPageTitle') : t('accountViewPageTitle', { name: displayName })) : ''}
      onEditClick={canManage && !editing && data ? () => setEditing(true) : undefined}
      editLabel={t('editTitle')}
      extraActions={canDeleteThis && !editing && data ? (
        <button
          type="button"
          className="btn-delete btn-action-fixed"
          onClick={() => setDeleteConfirm(true)}
        >
          {t('deleteTitle')}
        </button>
      ) : undefined}
      loadingMessage={t('loadingList')}
    >
      {data && (
        <>
          {error != null && error !== '' && (
            <Alert variant="error" role="alert">
              {error}
            </Alert>
          )}
          {validationDetails != null && Object.keys(validationDetails).length > 0 && (
            <Alert variant="error" role="alert">
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {Object.entries(validationDetails).map(([field, msg]) => (
                  <li key={field}>
                    {field}: {msg}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          <div className="entity-view-card account-view-page">
        {editing ? (
          <form
            id="account-edit-form"
            className="department-form account-edit-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <FormGroup label={t('invitationFirstName')} htmlFor="account-firstName">
              <input
                id="account-firstName"
                type="text"
                value={form.firstName ?? ''}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value || null })
                }
                aria-label={t('invitationFirstName')}
              />
            </FormGroup>
            <FormGroup label={t('invitationLastName')} htmlFor="account-lastName">
              <input
                id="account-lastName"
                type="text"
                value={form.lastName ?? ''}
                onChange={(e) =>
                  setForm({ ...form, lastName: e.target.value || null })
                }
                aria-label={t('invitationLastName')}
              />
            </FormGroup>
            <FormGroup label={t('invitationPhone')} htmlFor="account-phone">
              <input
                id="account-phone"
                type="text"
                value={form.phone ?? ''}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value || null })
                }
                aria-label={t('invitationPhone')}
              />
            </FormGroup>
            <FormGroup label={t('invitationBirthDate')} htmlFor="account-birthDate">
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
            </FormGroup>
            <FormGroup label={t('invitationRoles')} htmlFor="account-add-role-btn" hint={t('accountRolesHint')} error={fieldErrors.roles}>
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
                    id="account-add-role-btn"
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
            </FormGroup>

            {hasStudent(currentRoles) && studentData && (
              <fieldset className="invitation-create-fieldset">
                <legend>{t('invitationStudentData')}</legend>
                <FormGroup label={t('invitationStudentId')} htmlFor="account-studentId" error={fieldErrors.studentId}>
                  <input
                    id="account-studentId"
                    type="text"
                    value={studentData.studentId}
                    onChange={(e) => setStudentData({ ...studentData, studentId: e.target.value })}
                    aria-invalid={!!fieldErrors.studentId}
                  />
                </FormGroup>
                <FormGroup label={t('invitationChineseName')} htmlFor="account-chineseName">
                  <input
                    id="account-chineseName"
                    type="text"
                    value={studentData.chineseName ?? ''}
                    onChange={(e) => setStudentData({ ...studentData, chineseName: e.target.value || null })}
                  />
                </FormGroup>
                <FormGroup label={t('invitationFaculty')} htmlFor="account-studentFaculty" error={hasStudent(currentRoles) ? fieldErrors.faculty : undefined}>
                  <input
                    id="account-studentFaculty"
                    type="text"
                    value={studentData.faculty}
                    onChange={(e) => setStudentData({ ...studentData, faculty: e.target.value })}
                    aria-invalid={!!fieldErrors.faculty}
                  />
                </FormGroup>
                <FormGroup label={t('invitationCourse')} htmlFor="account-course">
                  <input
                    id="account-course"
                    type="text"
                    value={studentData.course ?? ''}
                    onChange={(e) => setStudentData({ ...studentData, course: e.target.value || null })}
                  />
                </FormGroup>
                <FormGroup label={t('invitationEnrollmentYear')} htmlFor="account-enrollmentYear">
                  <input
                    id="account-enrollmentYear"
                    type="number"
                    value={studentData.enrollmentYear ?? ''}
                    onChange={(e) =>
                      setStudentData({
                        ...studentData,
                        enrollmentYear: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                  />
                </FormGroup>
                <FormGroup label={t('invitationGroupName')} htmlFor="account-groupName">
                  <input
                    id="account-groupName"
                    type="text"
                    value={studentData.groupName ?? ''}
                    onChange={(e) => setStudentData({ ...studentData, groupName: e.target.value || null })}
                  />
                </FormGroup>
              </fieldset>
            )}

            {hasTeacher(currentRoles) && teacherData && (
              <fieldset className="invitation-create-fieldset">
                <legend>{t('invitationTeacherData')}</legend>
                <FormGroup label={t('invitationTeacherId')} htmlFor="account-teacherId" error={fieldErrors.teacherId}>
                  <input
                    id="account-teacherId"
                    type="text"
                    value={teacherData.teacherId}
                    onChange={(e) => setTeacherData({ ...teacherData, teacherId: e.target.value })}
                    aria-invalid={!!fieldErrors.teacherId}
                  />
                </FormGroup>
                <FormGroup label={t('invitationFaculty')} htmlFor="account-teacherFaculty" error={hasTeacher(currentRoles) ? fieldErrors.faculty : undefined}>
                  <input
                    id="account-teacherFaculty"
                    type="text"
                    value={teacherData.faculty}
                    onChange={(e) => setTeacherData({ ...teacherData, faculty: e.target.value })}
                    aria-invalid={!!fieldErrors.faculty}
                  />
                </FormGroup>
                <FormGroup label={t('invitationEnglishName')} htmlFor="account-englishName">
                  <input
                    id="account-englishName"
                    type="text"
                    value={teacherData.englishName ?? ''}
                    onChange={(e) => setTeacherData({ ...teacherData, englishName: e.target.value || null })}
                  />
                </FormGroup>
                <FormGroup label={t('invitationPosition')} htmlFor="account-position">
                  <input
                    id="account-position"
                    type="text"
                    value={teacherData.position ?? ''}
                    onChange={(e) => setTeacherData({ ...teacherData, position: e.target.value || null })}
                  />
                </FormGroup>
              </fieldset>
            )}

            <FormActions
              submitLabel={saving ? tCommon('submitting') : t('accountSave')}
              submitting={saving}
              cancelLabel={tCommon('cancel')}
              onCancel={() => setEditing(false)}
            />
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
                    <span className="account-view-value">{data.teacherProfile.teacherId ?? '—'}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationFaculty')}</span>
                    <span className="account-view-value">{data.teacherProfile.faculty ?? '—'}</span>
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
                    <span className="account-view-value">{data.studentProfile.studentId ?? '—'}</span>
                  </div>
                  <div className="account-view-row">
                    <span className="account-view-label">{t('invitationFaculty')}</span>
                    <span className="account-view-value">{data.studentProfile.faculty ?? '—'}</span>
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

      <ConfirmModal
        open={deleteConfirm}
        title={t('accountDeleteConfirmTitle')}
        message={t('accountDeleteConfirmText')}
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        cancelLabel={tCommon('cancel')}
        confirmLabel={deleting ? tCommon('submitting') : t('deleteTitle')}
        confirmDisabled={deleting}
        confirmVariant="danger"
      />
        </>
      )}
    </EntityViewLayout>
  );
}
