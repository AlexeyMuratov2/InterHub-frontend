import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getMe,
  patchMe,
  getMyTeacher,
  patchMyTeacherProfile,
} from '../../../../shared/api';
import type {
  AccountUserDto,
  UpdateProfileRequest,
  TeacherProfileItem,
  CreateTeacherRequest,
} from '../../../../shared/api';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getDisplayName, parseFieldErrors } from '../../../../shared/lib';
import { Alert, PageMessage } from '../../../../shared/ui';
import { getRoleLabelKey } from '../../admin/accounts/utils';

type UserEditableField = 'firstName' | 'lastName' | 'phone' | 'birthDate';
type TeacherEditableField = 'teacherId' | 'faculty' | 'englishName' | 'position';

const TEACHER_SCHEDULE_PATH = '/dashboards/teacher/schedule';

export function TeacherProfilePage() {
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const tRef = useRef(t);
  tRef.current = t;

  const [profile, setProfile] = useState<AccountUserDto | undefined>(undefined);
  const [teacherItem, setTeacherItem] = useState<TeacherProfileItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUserField, setEditingUserField] = useState<UserEditableField | null>(null);
  const [editingTeacherField, setEditingTeacherField] = useState<TeacherEditableField | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getMe(), getMyTeacher()]).then(([userRes, teacherRes]) => {
      if (cancelled) return;
      setLoading(false);
      if (userRes.error) {
        setError(userRes.error.message ?? tRef.current('profileErrorLoad'));
        return;
      }
      if (userRes.data) setProfile(userRes.data);
      if (teacherRes.data) setTeacherItem(teacherRes.data);
      if (teacherRes.error && teacherRes.error.status === 404) {
        setTeacherItem(undefined);
      } else if (teacherRes.error) {
        setError(teacherRes.error.message ?? tRef.current('profileErrorLoad'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if ((editingUserField || editingTeacherField) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editingUserField, editingTeacherField]);

  const startEditUser = useCallback((field: UserEditableField) => {
    if (!profile) return;
    const raw =
      field === 'firstName'
        ? profile.firstName ?? ''
        : field === 'lastName'
          ? profile.lastName ?? ''
          : field === 'phone'
            ? profile.phone ?? ''
            : profile.birthDate ?? '';
    setEditingUserField(field);
    setEditingTeacherField(null);
    setEditValue(raw);
    setFieldError(null);
  }, [profile]);

  const startEditTeacher = useCallback((field: TeacherEditableField) => {
    if (!teacherItem?.profile) return;
    const p = teacherItem.profile;
    const raw =
      field === 'teacherId'
        ? p.teacherId ?? ''
        : field === 'faculty'
          ? p.faculty ?? ''
          : field === 'englishName'
            ? p.englishName ?? ''
            : p.position ?? '';
    setEditingTeacherField(field);
    setEditingUserField(null);
    setEditValue(raw);
    setFieldError(null);
  }, [teacherItem]);

  const cancelEdit = useCallback(() => {
    setEditingUserField(null);
    setEditingTeacherField(null);
    setEditValue('');
    setFieldError(null);
  }, []);

  const saveUserField = useCallback(async () => {
    if (!profile || !editingUserField) return;
    const trimmed = editValue.trim() || null;
    const current =
      editingUserField === 'firstName'
        ? profile.firstName ?? ''
        : editingUserField === 'lastName'
          ? profile.lastName ?? ''
          : editingUserField === 'phone'
            ? profile.phone ?? ''
            : profile.birthDate ?? '';
    if (trimmed === (current ?? '')) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setFieldError(null);
    const payload: UpdateProfileRequest = {};
    if (editingUserField === 'firstName') payload.firstName = trimmed;
    if (editingUserField === 'lastName') payload.lastName = trimmed;
    if (editingUserField === 'phone') payload.phone = trimmed;
    if (editingUserField === 'birthDate') payload.birthDate = trimmed;
    const { data: updated, error: err } = await patchMe(payload);
    setSaving(false);
    if (err) {
      const fieldErrors = parseFieldErrors(err.details);
      const detailsMsg = fieldErrors[editingUserField];
      setFieldError(detailsMsg ?? err.message ?? tRef.current('profileErrorUpdate'));
      return;
    }
    if (updated) setProfile(updated);
    cancelEdit();
  }, [profile, editingUserField, editValue, cancelEdit]);

  const saveTeacherField = useCallback(async () => {
    if (!teacherItem?.profile || !editingTeacherField) return;
    const p = teacherItem.profile;
    const trimmed = editValue.trim() || null;
    const current =
      editingTeacherField === 'teacherId'
        ? p.teacherId ?? ''
        : editingTeacherField === 'faculty'
          ? p.faculty ?? ''
          : editingTeacherField === 'englishName'
            ? p.englishName ?? ''
            : p.position ?? '';
    if (trimmed === (current ?? '')) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setFieldError(null);
    const payload: CreateTeacherRequest = {
      teacherId: editingTeacherField === 'teacherId' ? (trimmed ?? p.teacherId ?? '') : (p.teacherId ?? ''),
      faculty: editingTeacherField === 'faculty' ? (trimmed ?? p.faculty ?? '') : (p.faculty ?? ''),
      englishName: editingTeacherField === 'englishName' ? trimmed : (p.englishName ?? null),
      position: editingTeacherField === 'position' ? trimmed : (p.position ?? null),
    };
    const { data: updated, error: err } = await patchMyTeacherProfile(payload);
    setSaving(false);
    if (err) {
      const fieldErrors = parseFieldErrors(err.details);
      const detailsMsg = fieldErrors[editingTeacherField];
      setFieldError(detailsMsg ?? err.message ?? tRef.current('profileErrorUpdate'));
      return;
    }
    if (updated && teacherItem) {
      setTeacherItem({ ...teacherItem, profile: updated });
    }
    cancelEdit();
  }, [teacherItem, editingTeacherField, editValue, cancelEdit]);

  const saveField = useCallback(() => {
    if (editingUserField) saveUserField();
    else if (editingTeacherField) saveTeacherField();
  }, [editingUserField, editingTeacherField, saveUserField, saveTeacherField]);

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
      <div className="profile-page-bg">
        <div className="profile-page">
          <PageMessage variant="loading" message={t('loadingList')} />
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page-bg">
        <div className="profile-page">
          <PageMessage
            variant="error"
            message={error}
            backTo={TEACHER_SCHEDULE_PATH}
            backLabel={tCommon('back')}
          />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const displayName = getDisplayName(profile.firstName, profile.lastName, profile.email);

  const renderUserEditableRow = (
    field: UserEditableField,
    label: string,
    inputType: 'text' | 'date'
  ) => {
    const isEditing = editingUserField === field;
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
              onBlur={() => saveUserField()}
              onKeyDown={handleKeyDown}
              className="profile-field-input"
              aria-label={label}
            />
            <span className="profile-field-hint">{t('profilePressEnterToSave')}</span>
          </div>
        ) : (
          <span
            className="profile-field-value"
            onDoubleClick={() => startEditUser(field)}
            title={t('profileDoubleClickToEdit')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEditUser(field);
              }
            }}
          >
            {displayVal}
          </span>
        )}
      </div>
    );
  };

  const canEditProfileId = (profile?.roles ?? []).includes('SUPER_ADMIN');

  const renderTeacherEditableRow = (field: TeacherEditableField, label: string) => {
    if (!teacherItem?.profile) return null;
    const p = teacherItem.profile;
    const isEditing = editingTeacherField === field;
    const displayVal =
      field === 'teacherId'
        ? p.teacherId ?? '—'
        : field === 'faculty'
          ? p.faculty ?? '—'
          : field === 'englishName'
            ? p.englishName ?? '—'
            : p.position ?? '—';

    const readOnly = field === 'teacherId' && !canEditProfileId;

    if (readOnly) {
      return (
        <div key={field} className="profile-field">
          <span className="profile-field-label">{label}</span>
          <span className="profile-field-value profile-field-value--readonly">{displayVal}</span>
        </div>
      );
    }

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
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveTeacherField()}
              onKeyDown={handleKeyDown}
              className="profile-field-input"
              aria-label={label}
            />
            <span className="profile-field-hint">{t('profilePressEnterToSave')}</span>
          </div>
        ) : (
          <span
            className="profile-field-value"
            onDoubleClick={() => startEditTeacher(field)}
            title={t('profileDoubleClickToEdit')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEditTeacher(field);
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
    <div className="profile-page-bg">
      <div className="profile-page">
        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}
        {fieldError && (
          <Alert variant="error" role="alert">
            {fieldError}
          </Alert>
        )}
        <header className="profile-header">
          <h1 className="profile-title">{t('profilePageTitle', { name: displayName })}</h1>
          <Link to={TEACHER_SCHEDULE_PATH} className="btn-secondary">
            {tCommon('back')}
          </Link>
        </header>

        <div className="profile-layout">
          <div className="profile-column-left">
            <section className="profile-summary profile-summary--teacher">
              <div className="profile-avatar profile-avatar--teacher" aria-hidden="true">
                {(displayName || profile.email || 'T').charAt(0).toUpperCase()}
              </div>
              <h2 className="profile-summary-name">{teacherItem?.displayName ?? displayName}</h2>
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
          </div>

          <div className="profile-column-right">
            <section className="profile-section profile-section--personal">
              <h3 className="profile-section-title">{t('profileCardPersonal')}</h3>
              <p className="profile-section-hint">{t('profileDoubleClickToEdit')}</p>
              <div className="profile-fields">
                {renderUserEditableRow('firstName', t('invitationFirstName'), 'text')}
                {renderUserEditableRow('lastName', t('invitationLastName'), 'text')}
                <div className="profile-field">
                  <span className="profile-field-label">{t('invitationEmail')}</span>
                  <span className="profile-field-value profile-field-value--readonly">
                    {profile.email ?? '—'}
                  </span>
                </div>
                {renderUserEditableRow('phone', t('invitationPhone'), 'text')}
                {renderUserEditableRow('birthDate', t('invitationBirthDate'), 'date')}
              </div>
              {saving && (
                <p className="profile-saving" aria-live="polite">
                  {tCommon('submitting')}
                </p>
              )}
            </section>

            {teacherItem?.profile && (
              <section className="profile-section profile-section--teacher-info">
                <h3 className="profile-section-title profile-section-title--teacher">
                  {t('profileCardTeacher')}
                </h3>
                <p className="profile-section-hint">{t('profileDoubleClickToEdit')}</p>
                <div className="profile-fields">
                  {renderTeacherEditableRow('teacherId', t('profileTeacherId'))}
                  {renderTeacherEditableRow('faculty', t('profileFaculty'))}
                  {renderTeacherEditableRow('englishName', t('profileEnglishName'))}
                  {renderTeacherEditableRow('position', t('profilePosition'))}
                </div>
                {saving && (
                  <p className="profile-saving" aria-live="polite">
                    {tCommon('submitting')}
                  </p>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
