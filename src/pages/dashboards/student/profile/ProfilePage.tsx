import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getMe,
  patchMe,
  getMyStudent,
  patchMyStudentProfile,
} from '../../../../shared/api';
import type {
  AccountUserDto,
  UpdateProfileRequest,
  StudentProfileItem,
  CreateStudentRequest,
} from '../../../../shared/api';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getDisplayName, parseFieldErrors } from '../../../../shared/lib';
import { Alert, PageMessage } from '../../../../shared/ui';
import { getRoleLabelKey } from '../../admin/accounts/utils';

type UserEditableField = 'firstName' | 'lastName' | 'phone' | 'birthDate';
type StudentEditableField = 'studentId' | 'chineseName' | 'faculty' | 'course' | 'enrollmentYear' | 'groupName';

const STUDENT_SCHEDULE_PATH = '/dashboards/student/schedule';

export function StudentProfilePage() {
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const tRef = useRef(t);
  tRef.current = t;

  const [profile, setProfile] = useState<AccountUserDto | undefined>(undefined);
  const [studentItem, setStudentItem] = useState<StudentProfileItem | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUserField, setEditingUserField] = useState<UserEditableField | null>(null);
  const [editingStudentField, setEditingStudentField] = useState<StudentEditableField | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getMe(), getMyStudent()]).then(([userRes, studentRes]) => {
      if (cancelled) return;
      setLoading(false);
      if (userRes.error) {
        setError(userRes.error.message ?? tRef.current('profileErrorLoad'));
        return;
      }
      if (userRes.data) setProfile(userRes.data);
      if (studentRes.data) setStudentItem(studentRes.data);
      if (studentRes.error && studentRes.error.status === 404) {
        setStudentItem(undefined);
      } else if (studentRes.error) {
        setError(studentRes.error.message ?? tRef.current('profileErrorLoad'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if ((editingUserField || editingStudentField) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editingUserField, editingStudentField]);

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
    setEditingStudentField(null);
    setEditValue(raw);
    setFieldError(null);
  }, [profile]);

  const startEditStudent = useCallback((field: StudentEditableField) => {
    if (!studentItem?.profile) return;
    const p = studentItem.profile;
    const raw =
      field === 'studentId'
        ? p.studentId ?? ''
        : field === 'chineseName'
          ? p.chineseName ?? ''
          : field === 'faculty'
            ? p.faculty ?? ''
            : field === 'course'
              ? p.course ?? ''
              : field === 'enrollmentYear'
                ? (p.enrollmentYear != null ? String(p.enrollmentYear) : '')
                : p.groupName ?? '';
    setEditingStudentField(field);
    setEditingUserField(null);
    setEditValue(raw);
    setFieldError(null);
  }, [studentItem]);

  const cancelEdit = useCallback(() => {
    setEditingUserField(null);
    setEditingStudentField(null);
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

  const saveStudentField = useCallback(async () => {
    if (!studentItem?.profile || !editingStudentField) return;
    const p = studentItem.profile;
    const trimmed = editValue.trim() || null;
    const numVal =
      editingStudentField === 'enrollmentYear' && trimmed
        ? parseInt(trimmed, 10)
        : null;
    const current =
      editingStudentField === 'studentId'
        ? p.studentId ?? ''
        : editingStudentField === 'chineseName'
          ? p.chineseName ?? ''
          : editingStudentField === 'faculty'
            ? p.faculty ?? ''
            : editingStudentField === 'course'
              ? p.course ?? ''
              : editingStudentField === 'enrollmentYear'
                ? (p.enrollmentYear != null ? String(p.enrollmentYear) : '')
                : p.groupName ?? '';
    if (trimmed === (current ?? '')) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setFieldError(null);
    const payload: CreateStudentRequest = {
      studentId: editingStudentField === 'studentId' ? (trimmed ?? p.studentId ?? '') : (p.studentId ?? ''),
      chineseName: editingStudentField === 'chineseName' ? trimmed : (p.chineseName ?? null),
      faculty: editingStudentField === 'faculty' ? (trimmed ?? p.faculty ?? '') : (p.faculty ?? ''),
      course: editingStudentField === 'course' ? trimmed : (p.course ?? null),
      enrollmentYear:
        editingStudentField === 'enrollmentYear'
          ? (numVal != null && !Number.isNaN(numVal) ? numVal : null)
          : (p.enrollmentYear ?? null),
      groupName: editingStudentField === 'groupName' ? trimmed : (p.groupName ?? null),
    };
    const { data: updated, error: err } = await patchMyStudentProfile(payload);
    setSaving(false);
    if (err) {
      const fieldErrors = parseFieldErrors(err.details);
      const detailsMsg = fieldErrors[editingStudentField];
      setFieldError(detailsMsg ?? err.message ?? tRef.current('profileErrorUpdate'));
      return;
    }
    if (updated && studentItem) {
      setStudentItem({ ...studentItem, profile: updated });
    }
    cancelEdit();
  }, [studentItem, editingStudentField, editValue, cancelEdit]);

  const saveField = useCallback(() => {
    if (editingUserField) saveUserField();
    else if (editingStudentField) saveStudentField();
  }, [editingUserField, editingStudentField, saveUserField, saveStudentField]);

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
            backTo={STUDENT_SCHEDULE_PATH}
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

  const renderStudentEditableRow = (field: StudentEditableField, label: string) => {
    if (!studentItem?.profile) return null;
    const p = studentItem.profile;
    const isEditing = editingStudentField === field;
    const displayVal =
      field === 'studentId'
        ? p.studentId ?? '—'
        : field === 'chineseName'
          ? p.chineseName ?? '—'
          : field === 'faculty'
            ? p.faculty ?? '—'
            : field === 'course'
              ? p.course ?? '—'
              : field === 'enrollmentYear'
                ? (p.enrollmentYear != null ? String(p.enrollmentYear) : '—')
                : p.groupName ?? '—';

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
              type={field === 'enrollmentYear' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveStudentField()}
              onKeyDown={handleKeyDown}
              className="profile-field-input"
              aria-label={label}
            />
            <span className="profile-field-hint">{t('profilePressEnterToSave')}</span>
          </div>
        ) : (
          <span
            className="profile-field-value"
            onDoubleClick={() => startEditStudent(field)}
            title={t('profileDoubleClickToEdit')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startEditStudent(field);
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
          <Link to={STUDENT_SCHEDULE_PATH} className="btn-secondary">
            {tCommon('back')}
          </Link>
        </header>

        <div className="profile-layout">
          <div className="profile-column-left">
            <section className="profile-summary profile-summary--student">
              <div className="profile-avatar profile-avatar--student" aria-hidden="true">
                {(displayName || profile.email || 'S').charAt(0).toUpperCase()}
              </div>
              <h2 className="profile-summary-name">{studentItem?.displayName ?? displayName}</h2>
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

            {studentItem?.profile && (
              <section className="profile-section profile-section--student-info">
                <h3 className="profile-section-title profile-section-title--student">
                  {t('profileCardStudent')}
                </h3>
                <p className="profile-section-hint">{t('profileDoubleClickToEdit')}</p>
                <div className="profile-fields">
                  {renderStudentEditableRow('studentId', t('profileStudentId'))}
                  {renderStudentEditableRow('chineseName', t('profileChineseName'))}
                  {renderStudentEditableRow('faculty', t('profileFaculty'))}
                  {renderStudentEditableRow('course', t('profileCourse'))}
                  {renderStudentEditableRow('enrollmentYear', t('profileEnrollmentYear'))}
                  {renderStudentEditableRow('groupName', t('profileGroupName'))}
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
