import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchGroupById, updateGroup } from '../../../../entities/group';
import { listTeachers } from '../../../../shared/api';
import type { TeacherProfileItem } from '../../../../shared/api';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { FormPageLayout, FormGroup, FormActions, PageMessage } from '../../../../shared/ui';

const NAME_MAX = 255;

export function GroupEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [curatorUserId, setCuratorUserId] = useState('');
  const [teachers, setTeachers] = useState<TeacherProfileItem[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/groups', { replace: true, state: { actionUnavailable: true } });
    }
  }, [canEdit, navigate]);

  useEffect(() => {
    let cursor: string | null = null;
    const load = async () => {
      const items: TeacherProfileItem[] = [];
      do {
        const res = await listTeachers({ cursor: cursor ?? undefined, limit: 30 });
        if (res.data?.items) {
          items.push(...res.data.items);
          cursor = res.data.nextCursor ?? null;
        } else break;
      } while (cursor);
      setTeachers(items);
      setTeachersLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGroupById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) {
        if (err.status === 404) setNotFound(true);
        else setError(err.message ?? t('groupErrorLoad'));
        return;
      }
      if (data) {
        setCode(data.code);
        setName(data.name ?? '');
        setDescription(data.description ?? '');
        setGraduationYear(data.graduationYear != null ? String(data.graduationYear) : '');
        setCuratorUserId(data.curatorUserId ?? '');
      } else {
        setNotFound(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (name.trim().length > NAME_MAX) err.name = t('errorNameMax', { max: NAME_MAX });
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const body = {
      name: name.trim() || null,
      description: description.trim() || null,
      graduationYear: graduationYear.trim() ? parseInt(graduationYear, 10) : null,
      curatorUserId: curatorUserId.trim() || null,
    };
    const { data, error: err } = await updateGroup(id, body);
    setSubmitting(false);
    if (err) {
      if (err.status === 404) {
        setNotFound(true);
        return;
      }
      setError(err.message ?? t('groupErrorValidation'));
      return;
    }
    if (data) {
      navigate(`/dashboards/admin/groups/${data.id}`, { replace: true });
      return;
    }
    navigate('/dashboards/admin/groups', { replace: true });
  };

  const { t: tCommon } = useTranslation('common');

  if (!canEdit) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (loading) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('groupNotFound')}
        backTo="/dashboards/admin/groups"
        backLabel={tCommon('back')}
      />
    );
  }

  return (
    <FormPageLayout title={t('groupEditPageTitle')} error={error} onSubmit={handleSubmit}>
      <FormGroup label={t('code')} htmlFor="group-edit-code">
        <input
          id="group-edit-code"
          type="text"
          value={code}
          readOnly
          className="read-only"
          aria-readonly="true"
        />
      </FormGroup>
      <FormGroup label={t('name')} htmlFor="group-edit-name" error={fieldErrors.name}>
        <input
          id="group-edit-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          placeholder={t('groupNamePlaceholder')}
          aria-invalid={!!fieldErrors.name}
        />
      </FormGroup>
      <FormGroup label={t('description')} htmlFor="group-edit-description">
        <textarea
          id="group-edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('groupDescriptionPlaceholder')}
          rows={3}
        />
      </FormGroup>
      <FormGroup label={t('groupGraduationYear')} htmlFor="group-edit-graduationYear">
        <input
          id="group-edit-graduationYear"
          type="number"
          min={1900}
          max={2100}
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          placeholder={t('groupGraduationYearPlaceholder')}
        />
      </FormGroup>
      <FormGroup label={t('groupCuratorSelect')} htmlFor="group-edit-curatorUserId">
        <select
          id="group-edit-curatorUserId"
          value={curatorUserId}
          onChange={(e) => setCuratorUserId(e.target.value)}
        >
          <option value="">{t('groupCuratorNone')}</option>
          {teachers.map((item) => (
            <option key={item.profile.userId} value={item.profile.userId}>
              {item.displayName}
            </option>
          ))}
        </select>
        {teachersLoading && (
          <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('loadingList')}</small>
        )}
      </FormGroup>
      <FormActions
        submitLabel={submitting ? tCommon('submitting') : tCommon('save')}
        submitting={submitting}
        cancelTo={id ? `/dashboards/admin/groups/${id}` : '/dashboards/admin/groups'}
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}
