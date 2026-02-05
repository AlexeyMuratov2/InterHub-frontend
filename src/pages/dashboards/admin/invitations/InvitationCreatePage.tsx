import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createInvitation } from '../../../../shared/api';
import { useCanManageInvitations } from '../../../../app/hooks/useCanManageInvitations';
import { useTranslation } from '../../../../shared/i18n';
import type { CreateInvitationRequest, CreateStudentRequest, CreateTeacherRequest } from '../../../../shared/api';
import {
  ALL_ROLES_ORDER,
  MAX_ROLES,
  getRoleLabelKey,
  isManagingRole,
  hasStudent,
  hasTeacher,
} from './utils';

export function InvitationCreatePage() {
  const navigate = useNavigate();
  const canManage = useCanManageInvitations();
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [studentData, setStudentData] = useState<CreateStudentRequest | null>(null);
  const [teacherData, setTeacherData] = useState<CreateTeacherRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const addRoleRef = useRef<HTMLDivElement>(null);
  /** Ref с актуальным списком выбранных ролей — используется в handleSubmit, чтобы всегда отправлять выбранные роли, а не устаревший closure. */
  const rolesRef = useRef<string[]>([]);
  rolesRef.current = roles;

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
    if (!canManage) {
      navigate('/dashboards/admin/invitations', { replace: true, state: { actionUnavailable: true } });
    }
  }, [canManage, navigate]);

  const hasManagingRole = useMemo(() => roles.some(isManagingRole), [roles]);

  const availableRolesToAdd = useMemo(() => {
    if (roles.length >= MAX_ROLES) return [];
    return ALL_ROLES_ORDER.filter((r) => {
      if (roles.includes(r)) return false;
      if (hasManagingRole && isManagingRole(r)) return false;
      return true;
    });
  }, [roles, hasManagingRole]);

  useEffect(() => {
    if (hasStudent(roles)) {
      setStudentData((prev) => prev ?? { studentId: '', faculty: '' });
    } else {
      setStudentData(null);
    }
  }, [roles]);

  useEffect(() => {
    if (hasTeacher(roles)) {
      setTeacherData((prev) => prev ?? { teacherId: '', faculty: '' });
    } else {
      setTeacherData(null);
    }
  }, [roles]);

  const addRole = (role: string) => {
    if (roles.length >= MAX_ROLES || roles.includes(role)) return;
    if (hasManagingRole && isManagingRole(role)) return;
    setRoles((prev) => [...prev, role].sort(compareRolesOrder));
    setFieldErrors((prev) => ({ ...prev, roles: '' }));
    setAddRoleOpen(false);
  };

  const removeRole = (role: string) => {
    setRoles((prev) => prev.filter((r) => r !== role));
    setFieldErrors((prev) => ({ ...prev, roles: '' }));
  };

  function compareRolesOrder(a: string, b: string): number {
    const i = ALL_ROLES_ORDER.indexOf(a);
    const j = ALL_ROLES_ORDER.indexOf(b);
    return i - j;
  }

  if (!canManage) {
    return (
      <div className="department-form-page">
        <p>{t('loadingList')}</p>
      </div>
    );
  }

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const emailTrim = email.trim();
    if (!emailTrim) err.email = t('invitationEmailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) err.email = t('errorInvalidData');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const selectedRoles = rolesRef.current;
    const body: CreateInvitationRequest = {
      email: email.trim(),
      roles: selectedRoles.length > 0 ? [...selectedRoles] : undefined,
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      phone: phone.trim() || null,
      birthDate: birthDate.trim() || null,
      studentData: hasStudent(selectedRoles) && studentData ? studentData : null,
      teacherData: hasTeacher(selectedRoles) && teacherData ? teacherData : null,
    };
    // Временный лог для отладки: что форма отправляет
    console.log('[InvitationCreate] selectedRoles (что выбрали на форме):', selectedRoles);
    console.log('[InvitationCreate] body.roles (что уходит в createInvitation):', body.roles);
    const { data, error: err } = await createInvitation(body);
    setSubmitting(false);
    if (err) {
      if (err.details && typeof err.details === 'object') {
        setFieldErrors(err.details as Record<string, string>);
      }
      setError(err.message ?? t('invitationErrorCreate'));
      return;
    }
    if (data) {
      navigate(`/dashboards/admin/invitations/${data.id}`, { replace: true });
      return;
    }
    navigate('/dashboards/admin/invitations', { replace: true });
  };

  return (
    <div className="department-form-page invitation-create-page">
      <h1 className="department-form-title">{t('invitationCreatePageTitle')}</h1>
      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}
      <form className="department-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="inv-email">{t('invitationEmailRequired')}</label>
          <input
            id="inv-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            placeholder="user@example.com"
            autoComplete="email"
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
        </div>

        <div className="form-group">
          <label>{t('invitationRoles')} *</label>
          <p className="invitation-roles-hint">{t('invitationRolesHint')}</p>
          <div className="invitation-roles-chips">
            {roles.map((role) => (
              <span key={role} className="invitation-role-chip">
                <span className="invitation-role-chip-label">{t(getRoleLabelKey(role))}</span>
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
          {roles.length < MAX_ROLES && availableRolesToAdd.length > 0 && (
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
          {fieldErrors.roles && <div className="field-error">{fieldErrors.roles}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="inv-firstName">{t('invitationFirstName')}</label>
          <input
            id="inv-firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="inv-lastName">{t('invitationLastName')}</label>
          <input
            id="inv-lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="inv-phone">{t('invitationPhone')}</label>
          <input
            id="inv-phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="inv-birthDate">{t('invitationBirthDate')}</label>
          <input
            id="inv-birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>

        {hasStudent(roles) && studentData && (
          <fieldset className="invitation-create-fieldset">
            <legend>{t('invitationStudentData')}</legend>
            <div className="form-group">
              <label htmlFor="inv-studentId">{t('invitationStudentId')}</label>
              <input
                id="inv-studentId"
                type="text"
                value={studentData.studentId}
                onChange={(e) => setStudentData({ ...studentData, studentId: e.target.value })}
                aria-invalid={!!fieldErrors.studentId}
              />
              {fieldErrors.studentId && <div className="field-error">{fieldErrors.studentId}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="inv-chineseName">{t('invitationChineseName')}</label>
              <input
                id="inv-chineseName"
                type="text"
                value={studentData.chineseName ?? ''}
                onChange={(e) => setStudentData({ ...studentData, chineseName: e.target.value || null })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="inv-studentFaculty">{t('invitationFaculty')}</label>
              <input
                id="inv-studentFaculty"
                type="text"
                value={studentData.faculty}
                onChange={(e) => setStudentData({ ...studentData, faculty: e.target.value })}
                aria-invalid={!!fieldErrors.faculty}
              />
              {fieldErrors.faculty && hasStudent(roles) && (
                <div className="field-error">{fieldErrors.faculty}</div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="inv-course">{t('invitationCourse')}</label>
              <input
                id="inv-course"
                type="text"
                value={studentData.course ?? ''}
                onChange={(e) => setStudentData({ ...studentData, course: e.target.value || null })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="inv-enrollmentYear">{t('invitationEnrollmentYear')}</label>
              <input
                id="inv-enrollmentYear"
                type="number"
                value={studentData.enrollmentYear ?? ''}
                onChange={(e) =>
                  setStudentData({
                    ...studentData,
                    enrollmentYear: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
              />
            </div>
            <div className="form-group">
              <label htmlFor="inv-groupName">{t('invitationGroupName')}</label>
              <input
                id="inv-groupName"
                type="text"
                value={studentData.groupName ?? ''}
                onChange={(e) => setStudentData({ ...studentData, groupName: e.target.value || null })}
              />
            </div>
          </fieldset>
        )}

        {hasTeacher(roles) && teacherData && (
          <fieldset className="invitation-create-fieldset">
            <legend>{t('invitationTeacherData')}</legend>
            <div className="form-group">
              <label htmlFor="inv-teacherId">{t('invitationTeacherId')}</label>
              <input
                id="inv-teacherId"
                type="text"
                value={teacherData.teacherId}
                onChange={(e) => setTeacherData({ ...teacherData, teacherId: e.target.value })}
                aria-invalid={!!fieldErrors.teacherId}
              />
              {fieldErrors.teacherId && <div className="field-error">{fieldErrors.teacherId}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="inv-teacherFaculty">{t('invitationFaculty')}</label>
              <input
                id="inv-teacherFaculty"
                type="text"
                value={teacherData.faculty}
                onChange={(e) => setTeacherData({ ...teacherData, faculty: e.target.value })}
                aria-invalid={!!fieldErrors.faculty}
              />
              {fieldErrors.faculty && hasTeacher(roles) && (
                <div className="field-error">{fieldErrors.faculty}</div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="inv-englishName">{t('invitationEnglishName')}</label>
              <input
                id="inv-englishName"
                type="text"
                value={teacherData.englishName ?? ''}
                onChange={(e) => setTeacherData({ ...teacherData, englishName: e.target.value || null })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="inv-position">{t('invitationPosition')}</label>
              <input
                id="inv-position"
                type="text"
                value={teacherData.position ?? ''}
                onChange={(e) => setTeacherData({ ...teacherData, position: e.target.value || null })}
              />
            </div>
          </fieldset>
        )}

        <div className="department-form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('invitationCreating') : tCommon('create')}
          </button>
          <Link to="/dashboards/admin/invitations" className="btn-secondary">
            {tCommon('cancelButton')}
          </Link>
        </div>
      </form>
    </div>
  );
}
