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
import { getAssessmentTypeDisplayName } from '../subjects/utils';

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
    if (semesterNo === '' || semesterNo < 1) {
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
        const newErrors: FormErrors = {};
        Object.entries(err.details).forEach(([field, msg]) => {
          newErrors[field as keyof CreateCurriculumSubjectRequest] = msg;
        });
        setErrors(newErrors);
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
      <div className="department-form-page">
        <div className="department-alert department-alert--error">
          {t('actionUnavailableForRole')}
        </div>
        <Link to="/dashboards/admin/programs" className="btn-secondary">
          {t('programBackToList')}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="department-form-page">
        <div className="entity-view-card">
          <p style={{ margin: 0, color: '#6b7280' }}>{t('loadingList')}</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="department-form-page">
        <div className="department-alert department-alert--error">
          {t('curriculumNotFoundOrDeleted')}
        </div>
        <Link to="/dashboards/admin/programs" className="btn-secondary">
          {t('programBackToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="department-form-page curriculum-subject-form-page">
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

      <h1 className="department-form-title">{t('curriculumSubjectCreatePageTitle')}</h1>
      <p className="department-page-subtitle">
        {program?.name} • {curriculum?.version} ({curriculum?.startYear}–{curriculum?.endYear ?? '...'})
      </p>

      {error && (
        <div className="department-alert department-alert--error" role="alert">
          {error}
        </div>
      )}

      <form className="department-form curriculum-subject-form" onSubmit={handleSubmit}>
        {/* Выбор предмета */}
        <section className="form-section">
          <h2 className="form-section-title">{t('curriculumSubjectSectionSelectSubject')}</h2>
          
          <div className="form-group">
            <label className="form-label">{t('curriculumSubjectSubjectSearch')}</label>
            <input
              type="search"
              className="department-page-search"
              placeholder={t('curriculumSubjectSubjectSearchPlaceholder')}
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('curriculumSubjectSubject')} <span className="required">*</span>
            </label>
            <select
              className="department-form-select"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">{t('curriculumSubjectSelectSubject')}</option>
              {filteredSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.chineseName} {s.englishName ? `(${s.englishName})` : ''}
                </option>
              ))}
            </select>
            {errors.subjectId && <span className="field-error">{errors.subjectId}</span>}
          </div>

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
            <div className="form-group">
              <label className="form-label">
                {t('curriculumSubjectSemester')} <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="12"
                className="department-form-input"
                value={semesterNo}
                onChange={(e) => setSemesterNo(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
              {errors.semesterNo && <span className="field-error">{errors.semesterNo}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectCourseYear')}</label>
              <input
                type="number"
                min="1"
                max="6"
                className="department-form-input"
                value={courseYear}
                onChange={(e) => setCourseYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('curriculumSubjectCourseYearPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('curriculumSubjectDurationWeeks')} <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="52"
                className="department-form-input"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
              {errors.durationWeeks && <span className="field-error">{errors.durationWeeks}</span>}
            </div>
          </div>

          <div className="form-row form-row--2">
            <div className="form-group">
              <label className="form-label">
                {t('curriculumSubjectAssessmentType')} <span className="required">*</span>
              </label>
              <select
                className="department-form-select"
                value={assessmentTypeId}
                onChange={(e) => setAssessmentTypeId(e.target.value)}
                required
              >
                <option value="">{t('curriculumSubjectSelectAssessmentType')}</option>
                {assessmentTypes.map((at) => (
                  <option key={at.id} value={at.id}>
                    {getAssessmentTypeDisplayName(at.code, t, { chineseName: at.chineseName, englishName: at.englishName })}
                  </option>
                ))}
              </select>
              {errors.assessmentTypeId && <span className="field-error">{errors.assessmentTypeId}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectCredits')}</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                className="department-form-input"
                value={credits}
                onChange={(e) => setCredits(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('curriculumSubjectCreditsPlaceholder')}
              />
            </div>
          </div>
        </section>

        {/* Часы */}
        <section className="form-section">
          <h2 className="form-section-title">{t('curriculumSubjectSectionHours')}</h2>
          
          <div className="form-row form-row--4">
            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectHoursTotal')}</label>
              <input
                type="number"
                min="0"
                className="department-form-input"
                value={hoursTotal}
                onChange={(e) => setHoursTotal(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectHoursLecture')}</label>
              <input
                type="number"
                min="0"
                className="department-form-input"
                value={hoursLecture}
                onChange={(e) => setHoursLecture(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectHoursPractice')}</label>
              <input
                type="number"
                min="0"
                className="department-form-input"
                value={hoursPractice}
                onChange={(e) => setHoursPractice(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectHoursLab')}</label>
              <input
                type="number"
                min="0"
                className="department-form-input"
                value={hoursLab}
                onChange={(e) => setHoursLab(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row form-row--4">
            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectHoursSeminar')}</label>
              <input
                type="number"
                min="0"
                className="department-form-input"
                value={hoursSeminar}
                onChange={(e) => setHoursSeminar(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectHoursSelfStudy')}</label>
              <input
                type="number"
                min="0"
                className="department-form-input"
                value={hoursSelfStudy}
                onChange={(e) => setHoursSelfStudy(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectHoursConsultation')}</label>
              <input
                type="number"
                min="0"
                className="department-form-input"
                value={hoursConsultation}
                onChange={(e) => setHoursConsultation(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('curriculumSubjectHoursCourseWork')}</label>
              <input
                type="number"
                min="0"
                className="department-form-input"
                value={hoursCourseWork}
                onChange={(e) => setHoursCourseWork(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Кнопки */}
        <div className="department-form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? tCommon('submitting') : t('curriculumSubjectCreate')}
          </button>
          <Link
            to={`/dashboards/admin/programs/curricula/${curriculumId}/subjects`}
            className="btn-secondary"
          >
            {tCommon('cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}
