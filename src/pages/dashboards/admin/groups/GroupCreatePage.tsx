import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../../../../entities/group';
import { fetchPrograms, type ProgramDto } from '../../../../entities/program';
import { fetchCurriculaByProgramId, type CurriculumDto } from '../../../../entities/curriculum';
import { listTeachers } from '../../../../shared/api';
import type { TeacherProfileItem } from '../../../../shared/api';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { parseFieldErrors, formatDurationYears } from '../../../../shared/lib';
import { FormPageLayout, FormGroup, FormActions } from '../../../../shared/ui';

const CODE_MAX = 50;
const NAME_MAX = 255;

export function GroupCreatePage() {
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const [programId, setProgramId] = useState('');
  const [curriculumId, setCurriculumId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startYear, setStartYear] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [curatorUserId, setCuratorUserId] = useState('');
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [curricula, setCurricula] = useState<CurriculumDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfileItem[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [curriculaLoading, setCurriculaLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!canEdit) {
      navigate('/dashboards/admin/groups', { replace: true, state: { actionUnavailable: true } });
    }
  }, [canEdit, navigate]);

  useEffect(() => {
    fetchPrograms().then(({ data, error: err }) => {
      setProgramsLoading(false);
      if (!err && data) setPrograms(data);
    });
  }, []);

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
    if (!programId) {
      setCurricula([]);
      setCurriculumId('');
      setCurriculaLoading(false);
      return;
    }
    setCurriculumId('');
    setCurriculaLoading(true);
    fetchCurriculaByProgramId(programId).then(({ data, error: err }) => {
      setCurriculaLoading(false);
      if (!err && data) setCurricula(data);
      else setCurricula([]);
    });
  }, [programId]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    const codeTrim = code.trim();
    if (!codeTrim) err.code = t('groupErrorCodeRequired');
    else if (codeTrim.length > CODE_MAX) err.code = t('errorCodeMax', { max: CODE_MAX });
    if (!programId) err.programId = t('groupErrorProgramNotFound');
    if (!curriculumId) err.curriculumId = t('groupErrorCurriculumNotFound');
    const start = startYear.trim() ? parseInt(startYear, 10) : NaN;
    if (!startYear.trim()) err.startYear = t('groupErrorStartYearRange');
    else if (Number.isNaN(start) || start < 1900 || start > 2100)
      err.startYear = t('groupErrorStartYearRange');
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!validate()) return;
    setSubmitting(true);
    const body = {
      programId,
      curriculumId,
      code: code.trim(),
      name: name.trim() || undefined,
      description: description.trim() || undefined,
      startYear: parseInt(startYear, 10),
      graduationYear: graduationYear.trim() ? parseInt(graduationYear, 10) : undefined,
      curatorUserId: curatorUserId.trim() || undefined,
    };
    const { data, error: err } = await createGroup(body);
    setSubmitting(false);
    if (err) {
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setFieldErrors(parseFieldErrors(err.details));
        setError(err.message ?? t('groupErrorValidation'));
      } else if (err.status === 409) {
        setFieldErrors((prev) => ({ ...prev, code: t('groupErrorCodeExists') }));
        setError(t('groupErrorCodeExists'));
      } else if (err.status === 404) {
        setError(err.message ?? t('groupErrorProgramNotFound'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 400) {
        setError(err.message ?? t('groupErrorValidation'));
      } else {
        setError(err.message ?? t('groupErrorLoadList'));
      }
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
    return (
      <div className="department-form-page">
        <p>{t('loadingList')}</p>
      </div>
    );
  }

  return (
    <FormPageLayout
      title={t('groupCreatePageTitle')}
      error={error}
      onSubmit={handleSubmit}
    >
      <FormGroup label={t('groupProgram')} htmlFor="group-create-programId" error={fieldErrors.programId}>
        <select
          id="group-create-programId"
          value={programId}
          onChange={(e) => setProgramId(e.target.value)}
          aria-invalid={!!fieldErrors.programId}
        >
          <option value="">— {t('groupProgram')} —</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
        {programsLoading && (
          <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('loadingList')}</small>
        )}
      </FormGroup>
      <FormGroup label={t('groupCurriculum')} htmlFor="group-create-curriculumId" error={fieldErrors.curriculumId}>
        <select
          id="group-create-curriculumId"
          value={curriculumId}
          onChange={(e) => setCurriculumId(e.target.value)}
          disabled={!programId}
          aria-invalid={!!fieldErrors.curriculumId}
        >
          <option value="">— {t('groupCurriculum')} —</option>
          {curricula.map((c) => (
            <option key={c.id} value={c.id}>
              {c.version} ({formatDurationYears(c.durationYears, t, locale)})
            </option>
          ))}
        </select>
        {curriculaLoading && (
          <small style={{ color: '#718096', fontSize: '0.8rem' }}>{t('loadingList')}</small>
        )}
      </FormGroup>
      <FormGroup label={t('groupCodeRequired')} htmlFor="group-create-code" error={fieldErrors.code}>
        <input
          id="group-create-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={CODE_MAX}
          placeholder="напр. CS-2024-1"
          autoComplete="off"
          aria-invalid={!!fieldErrors.code}
        />
      </FormGroup>
      <FormGroup label={t('name')} htmlFor="group-create-name">
        <input
          id="group-create-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          placeholder={t('groupNamePlaceholder')}
          aria-invalid={!!fieldErrors.name}
        />
      </FormGroup>
      <FormGroup label={t('description')} htmlFor="group-create-description">
        <textarea
          id="group-create-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('groupDescriptionPlaceholder')}
          rows={3}
        />
      </FormGroup>
      <FormGroup label={t('groupStartYearRequired')} htmlFor="group-create-startYear" error={fieldErrors.startYear}>
        <input
          id="group-create-startYear"
          type="number"
          min={1900}
          max={2100}
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
          placeholder="2024"
          aria-invalid={!!fieldErrors.startYear}
        />
      </FormGroup>
      <FormGroup label={t('groupGraduationYear')} htmlFor="group-create-graduationYear">
        <input
          id="group-create-graduationYear"
          type="number"
          min={1900}
          max={2100}
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          placeholder={t('groupGraduationYearPlaceholder')}
        />
      </FormGroup>
      <FormGroup label={t('groupCuratorSelect')} htmlFor="group-create-curatorUserId">
        <select
          id="group-create-curatorUserId"
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
        submitLabel={submitting ? tCommon('submitting') : tCommon('create')}
        submitting={submitting}
        cancelTo="/dashboards/admin/groups"
        cancelLabel={tCommon('cancelButton')}
      />
    </FormPageLayout>
  );
}
