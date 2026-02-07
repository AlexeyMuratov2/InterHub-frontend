import type { CurriculumSubjectDto } from '../../../../entities/curriculum-subject';
import type { GroupSubjectOfferingDto } from '../../../../entities/offering';
import { useTranslation } from '../../../../shared/i18n';
import { getAssessmentTypeDisplayName } from '../../../../shared/lib';
import type { SubjectDto, AssessmentTypeDto } from '../../../../entities/subject';

export type CurriculumSubjectRow = CurriculumSubjectDto & {
  subjectCode: string;
  subjectChineseName: string;
  subjectEnglishName: string | null;
  assessmentTypeName: string;
};

export type ImplementationStatus = 'none' | 'noSlots' | 'hasSlots';

export interface CurriculumSubjectsTableWithImplementationProps {
  rows: CurriculumSubjectRow[];
  offeringsByCurriculumSubjectId: Record<string, GroupSubjectOfferingDto>;
  slotsCountByOfferingId: Record<string, number>;
  statusByCurriculumSubjectId: Record<string, ImplementationStatus>;
  onConfigure: (row: CurriculumSubjectRow) => void;
}

export function CurriculumSubjectsTableWithImplementation({
  rows,
  offeringsByCurriculumSubjectId,
  statusByCurriculumSubjectId,
  onConfigure,
}: CurriculumSubjectsTableWithImplementationProps) {
  const { t } = useTranslation('dashboard');

  if (rows.length === 0) {
    return (
      <div className="department-empty">
        <p>{t('noResults')}</p>
      </div>
    );
  }

  const statusLabel = (status: ImplementationStatus) => {
    switch (status) {
      case 'none':
        return t('implementationStatusNone');
      case 'noSlots':
        return t('implementationStatusNoSlots');
      case 'hasSlots':
        return t('implementationStatusHasSlots');
      default:
        return '—';
    }
  };

  const statusBadgeVariant = (status: ImplementationStatus) => {
    switch (status) {
      case 'none':
        return 'secondary';
      case 'noSlots':
        return 'warning';
      case 'hasSlots':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="department-table-wrap">
      <table className="department-table curriculum-subjects-table">
        <thead>
          <tr>
            <th>{t('code')}</th>
            <th>{t('name')}</th>
            <th>{t('curriculumSubjectSemesterN', { n: '' }).replace(' ', '')}</th>
            <th>{t('implementationDurationWeeks')}</th>
            <th>{t('implementationStatus')}</th>
            <th>{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = statusByCurriculumSubjectId[row.id] ?? 'none';
            return (
              <tr key={row.id}>
                <td className="code-cell">
                  <span className="subject-code">{row.subjectCode}</span>
                </td>
                <td className="name-cell">
                  <div className="subject-name-primary">{row.subjectChineseName}</div>
                  {row.subjectEnglishName && (
                    <div className="subject-name-secondary">{row.subjectEnglishName}</div>
                  )}
                </td>
                <td>{row.semesterNo}</td>
                <td className="numeric-cell">{row.durationWeeks}</td>
                <td>
                  <span
                    className={
                      statusBadgeVariant(status) === 'success'
                        ? 'assessment-type-badge'
                        : statusBadgeVariant(status) === 'warning'
                        ? 'credits-badge'
                        : 'stat-label'
                    }
                    style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 6,
                      fontSize: '0.8125rem',
                      background: statusBadgeVariant(status) === 'success' ? '#dcfce7' : statusBadgeVariant(status) === 'warning' ? '#fef3c7' : '#f1f5f9',
                      color: statusBadgeVariant(status) === 'success' ? '#166534' : statusBadgeVariant(status) === 'warning' ? '#92400e' : '#64748b',
                    }}
                  >
                    {statusLabel(status)}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-action-sm department-table-btn"
                    onClick={() => onConfigure(row)}
                  >
                    {offeringsByCurriculumSubjectId[row.id] ? t('implementationOpen') : t('implementationConfigure')}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function buildCurriculumSubjectRows(
  curriculumSubjects: CurriculumSubjectDto[],
  subjects: SubjectDto[],
  assessmentTypes: AssessmentTypeDto[],
  t: (key: string, opts?: Record<string, string | number>) => string
): CurriculumSubjectRow[] {
  return curriculumSubjects.map((cs) => {
    const subject = subjects.find((s) => s.id === cs.subjectId);
    const at = assessmentTypes.find((a) => a.id === cs.assessmentTypeId);
    return {
      ...cs,
      subjectCode: subject?.code ?? '—',
      subjectChineseName: subject?.chineseName ?? '—',
      subjectEnglishName: subject?.englishName ?? null,
      assessmentTypeName: at ? getAssessmentTypeDisplayName(at.code, t, { chineseName: at.chineseName, englishName: at.englishName }) : '—',
    };
  });
}
