import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  createCurriculumSubject,
  type CreateCurriculumSubjectRequest,
} from '../../../../entities/curriculum-subject';
import { fetchCurriculumById, type CurriculumDto } from '../../../../entities/curriculum';
import { fetchProgramById, type ProgramDto } from '../../../../entities/program';
import { fetchSubjects, fetchAssessmentTypes, type SubjectDto, type AssessmentTypeDto } from '../../../../entities/subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation } from '../../../../shared/i18n';
import { getAssessmentTypeDisplayName, parseFieldErrors } from '../../../../shared/lib';
import { PageMessage, FormPageLayout, FormGroup, FormActions } from '../../../../shared/ui';

type FormErrors = Partial<Record<keyof CreateCurriculumSubjectRequest, string>>;

export function CurriculumSubjectCreatePage() {
  const { curriculumId } = useParams<{ curriculumId: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [curriculum, setCurriculum] = useState<CurriculumDto | null>(null);
  const [program, setProgram] = useState<ProgramDto | null>(null);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentTypeDto[]>([]);

  // Форма
  const [subjectId, setSubjectId] = useState('');
  const [semesterNo, setSemesterNo] = useState<number | ''>('');
  const [courseYear, setCourseYear] = useState<number | ''>('');
  const [durationWeeks, setDurationWeeks] = useState<number | ''>(18);
  const [hoursTotal, setHoursTotal] = useState<number | ''>('');
  const [hoursLecture, setHoursLecture] = useState<number | ''>('');
  const [hoursPractice, setHoursPractice] = useState<number | ''>('');
  const [hoursLab, setHoursLab] = useState<number | ''>('');
  const [hoursSeminar, setHoursSeminar] = useState<number | ''>('');
  const [hoursSelfStudy, setHoursSelfStudy] = useState<number | ''>('');
  const [hoursConsultation, setHoursConsultation] = useState<number | ''>('');
  const [hoursCourseWork, setHoursCourseWork] = useState<number | ''>('');
  const [assessmentTypeId, setAssessmentTypeId] = useState('');
  const [credits, setCredits] = useState<number | ''>('');

  // Поиск предмета
  const [subjectSearch, setSubjectSearch] = useState('');

  // Загрузка данных
  useEffect(() => {
    if (!curriculumId) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetchCurriculumById(curriculumId),
      fetchSubjects(),
      fetchAssessmentTypes(),
    ]).then(async ([curriculumRes, subjectsRes, atRes]) => {
      if (cancelled) return;

      if (curriculumRes.error || !curriculumRes.data) {
        setLoading(false);
        if (curriculumRes.error?.status === 404) {
          setNotFound(true);
        } else {
          setError(curriculumRes.error?.message ?? t('curriculumErrorLoad'));
        }
        return;
      }

      setCurriculum(curriculumRes.data);

      const progRes = await fetchProgramById(curriculumRes.data.programId);
      if (!cancelled && progRes.data) {
        setProgram(progRes.data);
      }

      setSubjects(subjectsRes.data ?? []);
      setAssessmentTypes(atRes.data ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is not stable; load only when curriculumId changes
  }, [curriculumId]);

  // Фильтрация предметов для выбора
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const q = subjectSearch.trim().toLowerCase();
    return subjects.filter(
      (s) =>
        s.code.toLowerCase().includes(q) ||
        s.chineseName.toLowerCase().includes(q) ||
        (s.englishName ?? '').toLowerCase().includes(q)
    );
  }, [subjects, subjectSearch]);

  // Выбранный предмет
  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === subjectId) ?? null;
  }, [subjects, subjectId]);

  // Валидация
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!subjectId) {
      newErrors.subjectId = t('curriculumSubjectErrorSubjectRequired');
    }
    if (semesterNo === '' || (semesterNo !== 1 && semesterNo !== 2)) {
      newErrors.semesterNo = t('curriculumSubjectErrorSemesterRequired');
    }
    if (durationWeeks === '' || durationWeeks < 1) {
      newErrors.durationWeeks = t('curriculumSubjectErrorDurationRequired');
    }
    if (!assessmentTypeId) {
      newErrors.assessmentTypeId = t('curriculumSubjectErrorAssessmentRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !curriculumId) return;
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    const body: CreateCurriculumSubjectRequest = {
      subjectId,
      semesterNo: semesterNo as number,
      durationWeeks: durationWeeks as number,
      assessmentTypeId,
    };
    if (courseYear !== '') body.courseYear = courseYear;
    if (hoursTotal !== '') body.hoursTotal = hoursTotal;
    if (hoursLecture !== '') body.hoursLecture = hoursLecture;
    if (hoursPractice !== '') body.hoursPractice = hoursPractice;
    if (hoursLab !== '') body.hoursLab = hoursLab;
    if (hoursSeminar !== '') body.hoursSeminar = hoursSeminar;
    if (hoursSelfStudy !== '') body.hoursSelfStudy = hoursSelfStudy;
    if (hoursConsultation !== '') body.hoursConsultation = hoursConsultation;
    if (hoursCourseWork !== '') body.hoursCourseWork = hoursCourseWork;
    if (credits !== '') body.credits = credits;

    const { data, error: err } = await createCurriculumSubject(curriculumId, body);
    setSubmitting(false);

    if (err) {
      if (err.code === 'CONFLICT') {
        setError(t('curriculumSubjectErrorConflict'));
      } else if (err.code === 'VALIDATION_FAILED' && err.details) {
        setErrors(parseFieldErrors(err.details) as FormErrors);
        setError(t('curriculumSubjectErrorValidation'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 404) {
        setError(t('curriculumSubjectErrorNotFound'));
      } else {
        setError(err.message ?? t('curriculumSubjectErrorCreate'));
      }
      return;
    }

    navigate(`/dashboards/admin/programs/curricula/${curriculumId}/subjects`);
  };

  if (!canEdit) {
    return (
      <PageMessage
        variant="error"
        message={t('actionUnavailableForRole')}
        backTo="/dashboards/admin/programs"
        backLabel={tCommon('back')}
      />
    );
  }

  if (loading) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('curriculumNotFoundOrDeleted')}
        backTo="/dashboards/admin/programs"
        backLabel={tCommon('back')}
      />
    );
  }

  return (
    <div className="curriculum-subject-form-page">
      <div className="curriculum-subjects-breadcrumb">
        <Link to="/dashboards/admin/programs">{t('menuProgramsAndCurricula')}</Link>
        <span className="breadcrumb-separator">/</span>
        {program && (
          <>
            <Link to={`/dashboards/admin/programs/${program.id}`}>{program.name}</Link>
            <span className="breadcrumb-separator">/</span>
          </>
        )}
        <Link to={`/dashboards/admin/programs/curricula/${curriculumId}/subjects`}>
          {t('curriculumSubjectsSectionTitle')}
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{t('curriculumSubjectCreatePageTitle')}</span>
      </div>

      <FormPageLayout
        title={t('curriculumSubjectCreatePageTitle')}
        error={error}
        onSubmit={handleSubmit}
      >
        <p className="department-page-subtitle">
          {program?.name} • {curriculum?.version} ({curriculum?.startYear}–{curriculum?.endYear ?? '...'})
        </p>

        {/* Выбор предмета */}
        <section className="form-section">
          <h2 className="form-section-title">{t('curriculumSubjectSectionSelectSubject')}</h2>

          <FormGroup label={t('curriculumSubjectSubjectSearch')} htmlFor="cs-create-subject-search">
            <input
              id="cs-create-subject-search"
              type="search"
              className="department-page-search"
              placeholder={t('curriculumSubjectSubjectSearchPlaceholder')}
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
            />
          </FormGroup>

          <FormGroup
            label={t('curriculumSubjectSubject')}
            htmlFor="cs-create-subjectId"
            error={errors.subjectId}
            required
          >
            <select
              id="cs-create-subjectId"
              className="department-form-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              aria-invalid={!!errors.subjectId}
            >
              <option value="">{t('curriculumSubjectSelectSubject')}</option>
              {filteredSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.chineseName} {s.englishName ? `(${s.englishName})` : ''}
                </option>
              ))}
            </select>
          </FormGroup>

          {selectedSubject && (
            <div className="selected-subject-preview">
              <div className="preview-title">{t('curriculumSubjectSelectedSubject')}</div>
              <div className="preview-content">
                <strong>{selectedSubject.code}</strong> — {selectedSubject.chineseName}
                {selectedSubject.englishName && <span className="secondary"> ({selectedSubject.englishName})</span>}
                {selectedSubject.description && (
                  <p className="preview-description">{selectedSubject.description}</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Основные параметры */}
        <section className="form-section">
          <h2 className="form-section-title">{t('curriculumSubjectSectionBasicParams')}</h2>

          <div className="form-row form-row--3">
            <FormGroup
              label={t('curriculumSubjectSemester')}
              htmlFor="cs-create-semesterNo"
              error={errors.semesterNo}
              required
            >
              <select
                id="cs-create-semesterNo"
                className="department-form-select"
                value={semesterNo}
                onChange={(e) => setSemesterNo(e.target.value === '' ? '' : Number(e.target.value))}
                required
                aria-invalid={!!errors.semesterNo}
              >
                <option value="">{t('curriculumSubjectSelectSemester')}</option>
                <option value={1}>{t('curriculumSubjectSemesterN', { n: 1 })}</option>
                <option value={2}>{t('curriculumSubjectSemesterN', { n: 2 })}</option>
              </select>
            </FormGroup>

            <FormGroup label={t('curriculumSubjectCourseYear')} htmlFor="cs-create-courseYear">
              <input
                id="cs-create-courseYear"
                type="number"
                min="1"
                max="6"
                className="department-form-input"
                value={courseYear}
                onChange={(e) => setCourseYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('curriculumSubjectCourseYearPlaceholder')}
              />
            </FormGroup>

            <FormGroup
              label={t('curriculumSubjectDurationWeeks')}
              htmlFor="cs-create-durationWeeks"
              error={errors.durationWeeks}
              required
            >
              <input
                id="cs-create-durationWeeks"
                type="number"
                min="1"
                max="52"
                className="department-form-input"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value === '' ? '' : Number(e.target.value))}
                required
                aria-invalid={!!errors.durationWeeks}
              />
            </FormGroup>
          </div>

          <div className="form-row form-row--2">
            <FormGroup
              label={t('curriculumSubjectAssessmentType')}
              htmlFor="cs-create-assessmentTypeId"
              error={errors.assessmentTypeId}
              required
            >
              <select
                id="cs-create-assessmentTypeId"
                className="department-form-select"
                value={assessmentTypeId}
                onChange={(e) => setAssessmentTypeId(e.target.value)}
                required
                aria-invalid={!!errors.assessmentTypeId}
              >
                <option value="">{t('curriculumSubjectSelectAssessmentType')}</option>
                {assessmentTypes.map((at) => (
                  <option key={at.id} value={at.id}>
                    {getAssessmentTypeDisplayName(at.code, t, { chineseName: at.chineseName, englishName: at.englishName })}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label={t('curriculumSubjectCredits')} htmlFor="cs-create-credits">
              <input
                id="cs-create-credits"
                type="number"
                step="0.5"
                min="0"
                max="20"
                className="department-form-input"
                value={credits}
                onChange={(e) => setCredits(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('curriculumSubjectCreditsPlaceholder')}
              />
            </FormGroup>
          </div>
        </section>

        {/* Часы */}
        <section className="form-section">
          <h2 className="form-section-title">{t('curriculumSubjectSectionHours')}</h2>

          <div className="form-row form-row--4">
            <FormGroup label={t('curriculumSubjectHoursTotal')} htmlFor="cs-create-hoursTotal">
              <input
                id="cs-create-hoursTotal"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursTotal}
                onChange={(e) => setHoursTotal(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursLecture')} htmlFor="cs-create-hoursLecture">
              <input
                id="cs-create-hoursLecture"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursLecture}
                onChange={(e) => setHoursLecture(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursPractice')} htmlFor="cs-create-hoursPractice">
              <input
                id="cs-create-hoursPractice"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursPractice}
                onChange={(e) => setHoursPractice(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursLab')} htmlFor="cs-create-hoursLab">
              <input
                id="cs-create-hoursLab"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursLab}
                onChange={(e) => setHoursLab(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </FormGroup>
          </div>

          <div className="form-row form-row--4">
            <FormGroup label={t('curriculumSubjectHoursSeminar')} htmlFor="cs-create-hoursSeminar">
              <input
                id="cs-create-hoursSeminar"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursSeminar}
                onChange={(e) => setHoursSeminar(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursSelfStudy')} htmlFor="cs-create-hoursSelfStudy">
              <input
                id="cs-create-hoursSelfStudy"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursSelfStudy}
                onChange={(e) => setHoursSelfStudy(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursConsultation')} htmlFor="cs-create-hoursConsultation">
              <input
                id="cs-create-hoursConsultation"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursConsultation}
                onChange={(e) => setHoursConsultation(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursCourseWork')} htmlFor="cs-create-hoursCourseWork">
              <input
                id="cs-create-hoursCourseWork"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursCourseWork}
                onChange={(e) => setHoursCourseWork(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </FormGroup>
          </div>
        </section>

        <FormActions
          submitLabel={submitting ? tCommon('submitting') : t('curriculumSubjectCreate')}
          submitting={submitting}
          cancelLabel={tCommon('cancel')}
          cancelTo={`/dashboards/admin/programs/curricula/${curriculumId}/subjects`}
        />
      </FormPageLayout>
    </div>
  );
}
