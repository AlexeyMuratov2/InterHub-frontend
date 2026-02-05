import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  fetchCurriculumSubjectById,
  updateCurriculumSubject,
  deleteCurriculumSubject,
  type CurriculumSubjectDto,
  type UpdateCurriculumSubjectRequest,
} from '../../../../entities/curriculum-subject';
import { fetchCurriculumById, type CurriculumDto } from '../../../../entities/curriculum';
import { fetchProgramById, type ProgramDto } from '../../../../entities/program';
import { fetchSubjectById, fetchAssessmentTypes, type SubjectDto, type AssessmentTypeDto } from '../../../../entities/subject';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDateTime } from '../../../../shared/i18n';
import { getAssessmentTypeDisplayName, parseFieldErrors } from '../../../../shared/lib';
import { PageMessage, Alert, FormGroup, FormActions, ConfirmModal } from '../../../../shared/ui';

type FormErrors = Partial<Record<keyof UpdateCurriculumSubjectRequest, string>>;

export function CurriculumSubjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [curriculumSubject, setCurriculumSubject] = useState<CurriculumSubjectDto | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumDto | null>(null);
  const [program, setProgram] = useState<ProgramDto | null>(null);
  const [subject, setSubject] = useState<SubjectDto | null>(null);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentTypeDto[]>([]);

  // Форма
  const [courseYear, setCourseYear] = useState<number | ''>('');
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

  // Модалка удаления
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Загрузка данных
  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);

    fetchCurriculumSubjectById(id).then(async (csRes) => {
      if (cancelled) return;

      if (csRes.error || !csRes.data) {
        setLoading(false);
        if (csRes.error?.status === 404) {
          setNotFound(true);
        } else {
          setError(csRes.error?.message ?? t('curriculumSubjectErrorLoad'));
        }
        return;
      }

      const cs = csRes.data;
      setCurriculumSubject(cs);

      // Заполняем форму
      setCourseYear(cs.courseYear ?? '');
      setHoursTotal(cs.hoursTotal ?? '');
      setHoursLecture(cs.hoursLecture ?? '');
      setHoursPractice(cs.hoursPractice ?? '');
      setHoursLab(cs.hoursLab ?? '');
      setHoursSeminar(cs.hoursSeminar ?? '');
      setHoursSelfStudy(cs.hoursSelfStudy ?? '');
      setHoursConsultation(cs.hoursConsultation ?? '');
      setHoursCourseWork(cs.hoursCourseWork ?? '');
      setAssessmentTypeId(cs.assessmentTypeId);
      setCredits(cs.credits ? parseFloat(cs.credits) : '');

      // Загружаем связанные данные
      const [curriculumRes, subjectRes, atRes] = await Promise.all([
        fetchCurriculumById(cs.curriculumId),
        fetchSubjectById(cs.subjectId),
        fetchAssessmentTypes(),
      ]);

      if (cancelled) return;

      if (curriculumRes.data) {
        setCurriculum(curriculumRes.data);
        const progRes = await fetchProgramById(curriculumRes.data.programId);
        if (!cancelled && progRes.data) {
          setProgram(progRes.data);
        }
      }

      if (subjectRes.data) {
        setSubject(subjectRes.data);
      }

      setAssessmentTypes(atRes.data ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t is not stable; load only when id changes
  }, [id]);

  // Текущий тип контроля
  const currentAssessmentType = useMemo(() => {
    return assessmentTypes.find((at) => at.id === assessmentTypeId) ?? null;
  }, [assessmentTypes, assessmentTypeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !id) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const body: UpdateCurriculumSubjectRequest = {};
    
    // Отправляем только измененные поля
    if (courseYear !== (curriculumSubject?.courseYear ?? '')) {
      body.courseYear = courseYear === '' ? null : courseYear;
    }
    if (hoursTotal !== (curriculumSubject?.hoursTotal ?? '')) {
      body.hoursTotal = hoursTotal === '' ? null : hoursTotal;
    }
    if (hoursLecture !== (curriculumSubject?.hoursLecture ?? '')) {
      body.hoursLecture = hoursLecture === '' ? null : hoursLecture;
    }
    if (hoursPractice !== (curriculumSubject?.hoursPractice ?? '')) {
      body.hoursPractice = hoursPractice === '' ? null : hoursPractice;
    }
    if (hoursLab !== (curriculumSubject?.hoursLab ?? '')) {
      body.hoursLab = hoursLab === '' ? null : hoursLab;
    }
    if (hoursSeminar !== (curriculumSubject?.hoursSeminar ?? '')) {
      body.hoursSeminar = hoursSeminar === '' ? null : hoursSeminar;
    }
    if (hoursSelfStudy !== (curriculumSubject?.hoursSelfStudy ?? '')) {
      body.hoursSelfStudy = hoursSelfStudy === '' ? null : hoursSelfStudy;
    }
    if (hoursConsultation !== (curriculumSubject?.hoursConsultation ?? '')) {
      body.hoursConsultation = hoursConsultation === '' ? null : hoursConsultation;
    }
    if (hoursCourseWork !== (curriculumSubject?.hoursCourseWork ?? '')) {
      body.hoursCourseWork = hoursCourseWork === '' ? null : hoursCourseWork;
    }
    if (assessmentTypeId !== curriculumSubject?.assessmentTypeId) {
      body.assessmentTypeId = assessmentTypeId;
    }
    const currentCredits = curriculumSubject?.credits ? parseFloat(curriculumSubject.credits) : '';
    if (credits !== currentCredits) {
      body.credits = credits === '' ? null : credits;
    }

    // Если ничего не изменилось
    if (Object.keys(body).length === 0) {
      setSubmitting(false);
      setSuccess(t('curriculumSubjectNoChanges'));
      setTimeout(() => setSuccess(null), 3000);
      return;
    }

    const { data, error: err } = await updateCurriculumSubject(id, body);
    setSubmitting(false);

    if (err) {
      if (err.code === 'VALIDATION_FAILED' && err.details) {
        setErrors(parseFieldErrors(err.details) as FormErrors);
        setError(t('curriculumSubjectErrorValidation'));
      } else if (err.status === 403) {
        setError(t('programErrorForbidden'));
      } else if (err.status === 404) {
        setError(t('curriculumSubjectNotFoundOrDeleted'));
      } else {
        setError(err.message ?? t('curriculumSubjectErrorUpdate'));
      }
      return;
    }

    if (data) {
      setCurriculumSubject(data);
    }
    setSuccess(t('curriculumSubjectSuccessUpdated'));
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError(null);

    const { error: err } = await deleteCurriculumSubject(id);
    setDeleting(false);

    if (err) {
      setShowDeleteModal(false);
      setError(
        err.status === 403
          ? t('programErrorForbidden')
          : err.status === 404
            ? t('curriculumSubjectNotFoundOrDeleted')
            : err.message ?? t('curriculumSubjectErrorDelete')
      );
      return;
    }

    navigate(`/dashboards/admin/programs/curricula/${curriculumSubject?.curriculumId}/subjects`);
  };

  if (loading) {
    return <PageMessage variant="loading" message={t('loadingList')} />;
  }

  if (notFound) {
    return (
      <PageMessage
        variant="error"
        message={t('curriculumSubjectNotFoundOrDeleted')}
        backTo="/dashboards/admin/programs"
        backLabel={tCommon('back')}
      />
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
        <Link to={`/dashboards/admin/programs/curricula/${curriculumSubject?.curriculumId}/subjects`}>
          {t('curriculumSubjectsSectionTitle')}
        </Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{t('curriculumSubjectEditPageTitle')}</span>
      </div>

      <h1 className="department-form-title">{t('curriculumSubjectEditPageTitle')}</h1>

      {!canEdit && (
        <Alert variant="info" role="status">
          {t('viewOnlyNotice')}
        </Alert>
      )}
      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" role="status">
          {success}
        </Alert>
      )}

      {/* Информация о предмете (только для чтения) */}
      <div className="curriculum-subject-info-card">
        <div className="info-card-header">
          <h2>{t('curriculumSubjectInfoTitle')}</h2>
          <Link to={`/dashboards/admin/subjects/${subject?.id}`} className="btn-link">
            {t('curriculumSubjectViewSubject')} →
          </Link>
        </div>
        <div className="info-card-content">
          <div className="info-row">
            <span className="info-label">{t('code')}</span>
            <span className="info-value subject-code">{subject?.code ?? '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('name')}</span>
            <span className="info-value">
              {subject?.chineseName}
              {subject?.englishName && <span className="secondary"> ({subject.englishName})</span>}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('curriculumSubjectSemester')}</span>
            <span className="info-value">
              <span className="semester-badge">{curriculumSubject?.semesterNo}</span>
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('curriculumSubjectDurationWeeks')}</span>
            <span className="info-value">{curriculumSubject?.durationWeeks} {t('curriculumSubjectWeeks')}</span>
          </div>
          <div className="info-row">
            <span className="info-label">{t('createdAt')}</span>
            <span className="info-value">{formatDateTime(curriculumSubject?.createdAt ?? '', locale)}</span>
          </div>
        </div>
      </div>

      <form className="department-form curriculum-subject-form" onSubmit={handleSubmit}>
        {/* Редактируемые параметры */}
        <section className="form-section">
          <h2 className="form-section-title">{t('curriculumSubjectSectionEditableParams')}</h2>

          <div className="form-row form-row--3">
            <FormGroup label={t('curriculumSubjectCourseYear')} htmlFor="cs-edit-courseYear">
              <input
                id="cs-edit-courseYear"
                type="number"
                min="1"
                max="6"
                className="department-form-input"
                value={courseYear}
                onChange={(e) => setCourseYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('curriculumSubjectCourseYearPlaceholder')}
                disabled={!canEdit}
              />
            </FormGroup>

            <FormGroup
              label={t('curriculumSubjectAssessmentType')}
              htmlFor="cs-edit-assessmentTypeId"
              error={errors.assessmentTypeId}
            >
              <select
                id="cs-edit-assessmentTypeId"
                className="department-form-select"
                value={assessmentTypeId}
                onChange={(e) => setAssessmentTypeId(e.target.value)}
                disabled={!canEdit}
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

            <FormGroup label={t('curriculumSubjectCredits')} htmlFor="cs-edit-credits">
              <input
                id="cs-edit-credits"
                type="number"
                step="0.5"
                min="0"
                max="20"
                className="department-form-input"
                value={credits}
                onChange={(e) => setCredits(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={t('curriculumSubjectCreditsPlaceholder')}
                disabled={!canEdit}
              />
            </FormGroup>
          </div>
        </section>

        {/* Часы */}
        <section className="form-section">
          <h2 className="form-section-title">{t('curriculumSubjectSectionHours')}</h2>

          <div className="form-row form-row--4">
            <FormGroup label={t('curriculumSubjectHoursTotal')} htmlFor="cs-edit-hoursTotal">
              <input
                id="cs-edit-hoursTotal"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursTotal}
                onChange={(e) => setHoursTotal(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canEdit}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursLecture')} htmlFor="cs-edit-hoursLecture">
              <input
                id="cs-edit-hoursLecture"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursLecture}
                onChange={(e) => setHoursLecture(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canEdit}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursPractice')} htmlFor="cs-edit-hoursPractice">
              <input
                id="cs-edit-hoursPractice"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursPractice}
                onChange={(e) => setHoursPractice(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canEdit}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursLab')} htmlFor="cs-edit-hoursLab">
              <input
                id="cs-edit-hoursLab"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursLab}
                onChange={(e) => setHoursLab(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canEdit}
              />
            </FormGroup>
          </div>

          <div className="form-row form-row--4">
            <FormGroup label={t('curriculumSubjectHoursSeminar')} htmlFor="cs-edit-hoursSeminar">
              <input
                id="cs-edit-hoursSeminar"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursSeminar}
                onChange={(e) => setHoursSeminar(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canEdit}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursSelfStudy')} htmlFor="cs-edit-hoursSelfStudy">
              <input
                id="cs-edit-hoursSelfStudy"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursSelfStudy}
                onChange={(e) => setHoursSelfStudy(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canEdit}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursConsultation')} htmlFor="cs-edit-hoursConsultation">
              <input
                id="cs-edit-hoursConsultation"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursConsultation}
                onChange={(e) => setHoursConsultation(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canEdit}
              />
            </FormGroup>

            <FormGroup label={t('curriculumSubjectHoursCourseWork')} htmlFor="cs-edit-hoursCourseWork">
              <input
                id="cs-edit-hoursCourseWork"
                type="number"
                min="0"
                className="department-form-input"
                value={hoursCourseWork}
                onChange={(e) => setHoursCourseWork(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!canEdit}
              />
            </FormGroup>
          </div>
        </section>

        <div className="department-form-actions">
          {canEdit && (
            <button
              type="button"
              className="btn-delete"
              onClick={() => setShowDeleteModal(true)}
            >
              {t('deleteTitle')}
            </button>
          )}
          <FormActions
            submitLabel={submitting ? tCommon('submitting') : tCommon('save')}
            submitting={submitting}
            cancelTo={`/dashboards/admin/programs/curricula/${curriculumSubject?.curriculumId}/subjects`}
            cancelLabel={t('curriculumBackToProgram')}
          />
        </div>
      </form>

      <ConfirmModal
        open={showDeleteModal}
        title={t('curriculumSubjectDeleteConfirmTitle')}
        message={t('curriculumSubjectDeleteConfirmText')}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        cancelLabel={tCommon('cancel')}
        confirmLabel={deleting ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deleting}
      />
    </div>
  );
}
