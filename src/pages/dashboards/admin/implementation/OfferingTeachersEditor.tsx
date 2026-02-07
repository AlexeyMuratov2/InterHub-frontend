import { useState, useEffect } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import { FormGroup, FormActions, Alert } from '../../../../shared/ui';
import { listTeachers } from '../../../../shared/api';
import {
  fetchOfferingTeachers,
  addOfferingTeacher,
  deleteOfferingTeacher,
  type OfferingTeacherDto,
} from '../../../../entities/offering';
import { OFFERING_TEACHER_ROLES } from '../../../../entities/offering';

export interface OfferingTeachersEditorProps {
  offeringId: string;
  onUpdate: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  LECTURE: 'implementationLessonTypeLecture',
  PRACTICE: 'implementationLessonTypePractice',
  LAB: 'implementationLessonTypeLab',
};

export function OfferingTeachersEditor({ offeringId, onUpdate }: OfferingTeachersEditorProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [list, setList] = useState<OfferingTeacherDto[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addRole, setAddRole] = useState<string>(OFFERING_TEACHER_ROLES[0]);
  const [addTeacherId, setAddTeacherId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOfferingTeachers(offeringId).then(({ data, error: err }) => {
      setLoading(false);
      if (err) setError(err.message ?? null);
      else setList(data ?? []);
    });
    listTeachers({ limit: 100 }).then(({ data }) => {
      if (data?.items) {
        setTeachers(data.items.map((i) => ({ id: i.profile.id, displayName: i.displayName })));
      }
    });
  }, [offeringId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTeacherId) return;
    setAddError(null);
    setAdding(true);
    const { error: err } = await addOfferingTeacher(offeringId, { teacherId: addTeacherId, role: addRole });
    setAdding(false);
    if (err) {
      setAddError(err.status === 409 ? t('implementationDuplicateTeacherRole') : (err.message ?? t('implementationErrorLoadOfferings')));
      return;
    }
    setAddTeacherId('');
    fetchOfferingTeachers(offeringId).then(({ data }) => setList(data ?? []));
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteOfferingTeacher(id);
    setDeletingId(null);
    fetchOfferingTeachers(offeringId).then(({ data }) => setList(data ?? []));
    onUpdate();
  };

  const teacherDisplayName = (teacherId: string) => {
    const t = teachers.find((x) => x.id === teacherId);
    return t?.displayName ?? teacherId;
  };

  if (loading) return <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t('loading')}</p>;
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <section style={{ marginTop: '1.25rem' }}>
      <h3 className="entity-view-card-title">{t('implementationOfferingTeachers')}</h3>
      <p className="form-hint" style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.75rem' }}>
        {t('implementationOfferingTeachersHint')}
      </p>
      <div className="department-table-wrap" style={{ marginBottom: '1rem' }}>
        <table className="department-table">
          <thead>
            <tr>
              <th>{t('implementationRole')}</th>
              <th>{t('implementationTeacher')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id}>
                <td>{t(ROLE_LABELS[item.role] ?? item.role)}</td>
                <td>{teacherDisplayName(item.teacherId)}</td>
                <td>
                  <button
                    type="button"
                    className="btn-action-sm department-table-btn department-table-btn--danger"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form onSubmit={handleAdd} className="department-form">
        {addError && (
          <div style={{ marginBottom: '0.5rem' }}>
            <Alert variant="error">{addError}</Alert>
          </div>
        )}
        <FormGroup label={t('implementationRole')} htmlFor="add-teacher-role">
          <select
            id="add-teacher-role"
            value={addRole}
            onChange={(e) => setAddRole(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            {OFFERING_TEACHER_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(ROLE_LABELS[r] ?? r)}
              </option>
            ))}
          </select>
        </FormGroup>
        <FormGroup label={t('implementationTeacher')} htmlFor="add-teacher">
          <select
            id="add-teacher"
            value={addTeacherId}
            onChange={(e) => setAddTeacherId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">—</option>
            {teachers.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.displayName}
              </option>
            ))}
          </select>
        </FormGroup>
        <FormActions
          submitLabel={adding ? tCommon('submitting') : t('implementationAddTeacher')}
          submitting={adding}
          cancelLabel={tCommon('cancel')}
          onCancel={() => setAddError(null)}
        />
      </form>
    </section>
  );
}
