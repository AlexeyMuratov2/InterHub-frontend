import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchGroupById, getSemesterIdByGroup } from '../../../../entities/group';
import { fetchCurriculumSubjects } from '../../../../entities/curriculum-subject';
import { fetchSubjects, fetchAssessmentTypes } from '../../../../entities/subject';
import { fetchOfferingsByGroupId, fetchOfferingSlots, generateLessonsForGroup } from '../../../../entities/offering';
import { useTranslation } from '../../../../shared/i18n';
import { Alert, PageMessage } from '../../../../shared/ui';
import { GroupSemesterPicker, type SemesterNo } from './GroupSemesterPicker';
import {
  CurriculumSubjectsTableWithImplementation,
  buildCurriculumSubjectRows,
  type CurriculumSubjectRow,
  type ImplementationStatus,
} from './CurriculumSubjectsTableWithImplementation';
import { OfferingConfigDrawer } from './OfferingConfigDrawer';
import type { GroupSubjectOfferingDto } from '../../../../entities/offering';

export function ImplementationPage() {
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get('groupId');
  const { t } = useTranslation('dashboard');
  const tRef = useRef(t);
  tRef.current = t;

  const [groupId, setGroupId] = useState<string | null>(null);
  const [curriculumId, setCurriculumId] = useState<string | null>(null);
  const [semesterId, setSemesterId] = useState<string | null>(null);
  const [semesterNo, setSemesterNo] = useState<SemesterNo>(1);
  const [courseFilter, setCourseFilter] = useState<number | ''>('');
  const [semesterResolveError, setSemesterResolveError] = useState<string | null>(null);
  const [resolvingSemesterId, setResolvingSemesterId] = useState(false);

  const [curriculumSubjects, setCurriculumSubjects] = useState<CurriculumSubjectRow[]>([]);
  const [offerings, setOfferings] = useState<GroupSubjectOfferingDto[]>([]);
  const [slotsCountByOfferingId, setSlotsCountByOfferingId] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerSubject, setDrawerSubject] = useState<CurriculumSubjectRow | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generateAllError, setGenerateAllError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedGroupId) setGroupId(preselectedGroupId);
  }, [preselectedGroupId]);

  useEffect(() => {
    if (!groupId) {
      setCurriculumId(null);
      setSemesterId(null);
      setSemesterResolveError(null);
      setCurriculumSubjects([]);
      setOfferings([]);
      setSlotsCountByOfferingId({});
      return;
    }
    let cancelled = false;
    setCurriculumId(null);
    setSemesterId(null);
    setSemesterResolveError(null);
    setLoading(true);
    setError(null);
    const getT = () => tRef.current;
    fetchGroupById(groupId).then(({ data: group, error: groupErr }) => {
      if (cancelled) return;
      if (groupErr || !group) {
        setLoading(false);
        setCurriculumId(null);
        setSemesterId(null);
        setError(groupErr?.message ?? getT()('implementationErrorLoadCurriculum'));
        setCurriculumSubjects([]);
        setOfferings([]);
        return;
      }
      const nextCurriculumId = group.curriculumId;
      setCurriculumId(nextCurriculumId);
      Promise.all([
        fetchCurriculumSubjects(nextCurriculumId),
        fetchOfferingsByGroupId(groupId),
        fetchSubjects(),
        fetchAssessmentTypes(),
      ]).then(([csRes, offRes, subjRes, atRes]) => {
        if (cancelled) return;
        setLoading(false);
        if (csRes.error) {
          setError(csRes.error.message ?? getT()('implementationErrorLoadSubjects'));
          return;
        }
        const csList = csRes.data ?? [];
        const subjects = subjRes.data ?? [];
        const assessmentTypes = atRes.data ?? [];
        const rows = buildCurriculumSubjectRows(csList, subjects, assessmentTypes, getT());
        setCurriculumSubjects(rows);
        const offeringList = offRes.data ?? [];
        setOfferings(offeringList);

        if (offeringList.length === 0) {
          setSlotsCountByOfferingId({});
          return;
        }
        Promise.all(offeringList.map((o) => fetchOfferingSlots(o.id))).then((slotResults) => {
          if (cancelled) return;
          const next: Record<string, number> = {};
          slotResults.forEach((r, i) => {
            next[offeringList[i].id] = r.data?.length ?? 0;
          });
          setSlotsCountByOfferingId((prev) => ({ ...prev, ...next }));
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  useEffect(() => {
    if (!groupId || courseFilter === '') {
      setSemesterId(null);
      setSemesterResolveError(null);
      return;
    }
    let cancelled = false;
    setSemesterResolveError(null);
    setResolvingSemesterId(true);
    getSemesterIdByGroup(groupId, courseFilter, semesterNo).then(({ data, error: err }) => {
      if (cancelled) return;
      setResolvingSemesterId(false);
      if (err) {
        setSemesterResolveError(err.message ?? tRef.current('implementationErrorLoadSemesters'));
        setSemesterId(null);
        return;
      }
      if (data?.semesterId) {
        setSemesterId(data.semesterId);
      } else {
        setSemesterId(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [groupId, courseFilter, semesterNo]);

  const offeringsByCurriculumSubjectId = useMemo(() => {
    const map: Record<string, GroupSubjectOfferingDto> = {};
    offerings.forEach((o) => {
      map[o.curriculumSubjectId] = o;
    });
    return map;
  }, [offerings]);

  const statusByCurriculumSubjectId = useMemo((): Record<string, ImplementationStatus> => {
    const map: Record<string, ImplementationStatus> = {};
    curriculumSubjects.forEach((row) => {
      const offering = offeringsByCurriculumSubjectId[row.id];
      if (!offering) {
        map[row.id] = 'none';
        return;
      }
      const count = slotsCountByOfferingId[offering.id] ?? 0;
      map[row.id] = count > 0 ? 'hasSlots' : 'noSlots';
    });
    return map;
  }, [curriculumSubjects, offeringsByCurriculumSubjectId, slotsCountByOfferingId]);

  /** Фильтр: семестр учебного плана по номеру семестра (1 или 2) и курсу. */
  const filteredRows = useMemo(() => {
    let result = curriculumSubjects.filter((r) => r.semesterNo === semesterNo);
    if (courseFilter !== '') {
      const course = courseFilter;
      result = result.filter((r) => {
        if (r.courseYear != null) return r.courseYear === course;
        const derivedCourse = Math.ceil(r.semesterNo / 2);
        return derivedCourse === course;
      });
    }
    return result.sort((a, b) => {
      if (a.semesterNo !== b.semesterNo) return a.semesterNo - b.semesterNo;
      return a.subjectChineseName.localeCompare(b.subjectChineseName);
    });
  }, [curriculumSubjects, semesterNo, courseFilter]);

  const drawerOffering = drawerSubject ? offeringsByCurriculumSubjectId[drawerSubject.id] ?? null : null;

  const handleDrawerSaved = () => {
    if (!groupId) return;
    fetchOfferingsByGroupId(groupId).then(({ data: list }) => {
      const offeringList = list ?? [];
      setOfferings(offeringList);
      if (offeringList.length === 0) {
        setSlotsCountByOfferingId({});
        return;
      }
      Promise.all(offeringList.map((o) => fetchOfferingSlots(o.id))).then((slotResults) => {
        const next: Record<string, number> = {};
        slotResults.forEach((r, i) => {
          next[offeringList[i].id] = r.data?.length ?? 0;
        });
        setSlotsCountByOfferingId((prev) => ({ ...prev, ...next }));
      });
    });
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const blockActions = !groupId || !semesterId || resolvingSemesterId;

  /** Кнопка «Сгенерировать все уроки» — активна только при выбранных группе, семестре и курсе и если у каждого предмета в этом семестре/курсе у офферинга задан хотя бы один слот */
  const hasSubjectWithoutSlots = useMemo(
    () =>
      filteredRows.some((row) => {
        const offering = offeringsByCurriculumSubjectId[row.id];
        return offering != null && (slotsCountByOfferingId[offering.id] ?? 0) === 0;
      }),
    [filteredRows, offeringsByCurriculumSubjectId, slotsCountByOfferingId]
  );
  const canGenerateAll =
    !!groupId &&
    !!semesterId &&
    courseFilter !== '' &&
    !loading &&
    !generatingAll &&
    filteredRows.length > 0 &&
    !hasSubjectWithoutSlots;

  const handleGenerateAll = async () => {
    if (!groupId || !semesterId) return;
    setGenerateAllError(null);
    setGeneratingAll(true);
    const { data, error: err } = await generateLessonsForGroup(groupId, semesterId);
    setGeneratingAll(false);
    if (err) {
      setGenerateAllError(err.message ?? tRef.current('implementationErrorLoadOfferings'));
      return;
    }
    if (data) {
      showToast(tRef.current('implementationGenerateAllSuccess', { count: data.lessonsCreated }));
      handleDrawerSaved();
    }
  };

  return (
    <div className="curriculum-subjects-page department-page implementation-page">
      <h1 className="department-page-title">{t('implementationPageTitle')}</h1>

      <GroupSemesterPicker
        initialGroupId={preselectedGroupId}
        groupId={groupId}
        onGroupIdChange={setGroupId}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        semesterNo={semesterNo}
        onSemesterNoChange={setSemesterNo}
      />

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}
      {semesterResolveError && curriculumId && courseFilter !== '' && (
        <Alert variant="error" role="alert" style={{ marginTop: '0.5rem' }}>
          {semesterResolveError}
        </Alert>
      )}
      {toastMessage && (
        <div style={{ marginTop: '0.5rem' }}>
          <Alert variant="success" role="status">
            {toastMessage}
          </Alert>
        </div>
      )}

      {groupId && semesterId && !loading && !resolvingSemesterId && (
        <div className="implementation-generate-all-wrap" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleGenerateAll}
            disabled={!canGenerateAll}
            title={!canGenerateAll ? t('implementationGenerateAllDisabledHint') : undefined}
          >
            {generatingAll ? t('loading') : t('implementationGenerateAllButton')}
          </button>
          {!canGenerateAll && offerings.length > 0 && (
            <span className="form-hint" style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {t('implementationGenerateAllDisabledHint')}
            </span>
          )}
          {generateAllError && (
            <Alert variant="error" style={{ marginLeft: 0 }}>
              {generateAllError}
            </Alert>
          )}
        </div>
      )}

      {!groupId || !semesterId || courseFilter === '' ? (
        <div className="department-empty curriculum-subjects-empty" style={{ marginTop: '2rem' }}>
          <p>{t('implementationEmptyHint')}</p>
        </div>
      ) : loading ? (
        <PageMessage variant="loading" message={t('loadingList')} />
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <CurriculumSubjectsTableWithImplementation
            rows={filteredRows}
            offeringsByCurriculumSubjectId={offeringsByCurriculumSubjectId}
            slotsCountByOfferingId={slotsCountByOfferingId}
            statusByCurriculumSubjectId={statusByCurriculumSubjectId}
            onConfigure={setDrawerSubject}
          />
        </div>
      )}

      <OfferingConfigDrawer
        open={drawerSubject != null}
        onClose={() => setDrawerSubject(null)}
        groupId={groupId}
        semesterId={semesterId}
        semesterLabel={
          courseFilter !== '' && semesterId
            ? `${t('implementationFilterCourse')} ${courseFilter}, ${t('implementationSemesterNoOption', { number: semesterNo })}`
            : null
        }
        curriculumSubject={drawerSubject}
        offering={drawerOffering}
        slotsCount={drawerOffering ? slotsCountByOfferingId[drawerOffering.id] ?? 0 : 0}
        onSaved={handleDrawerSaved}
        onToast={showToast}
        blockActions={blockActions}
      />
    </div>
  );
}
