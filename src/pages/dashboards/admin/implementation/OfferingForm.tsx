import { useState, useEffect } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import { FormGroup, FormActions, Alert } from '../../../../shared/ui';
import { listTeachers } from '../../../../shared/api';
import { fetchRooms } from '../../../../entities/schedule';
import type { GroupSubjectOfferingDto } from '../../../../entities/offering';
import { createOffering, updateOffering } from '../../../../entities/offering';

export interface OfferingFormProps {
  groupId: string;
  curriculumSubjectId: string;
  offering: GroupSubjectOfferingDto | null;
  onSaved: (offering: GroupSubjectOfferingDto) => void;
  onError?: (message: string) => void;
}

export function OfferingForm({
  groupId,
  curriculumSubjectId,
  offering,
  onSaved,
}: OfferingFormProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const [teacherId, setTeacherId] = useState<string>(offering?.teacherId ?? '');
  const [roomId, setRoomId] = useState<string>(offering?.roomId ?? '');
  const [format, setFormat] = useState<string>(offering?.format ?? '');
  const [notes, setNotes] = useState<string>(offering?.notes ?? '');
  const [teachers, setTeachers] = useState<{ id: string; displayName: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (offering) {
      setTeacherId(offering.teacherId ?? '');
      setRoomId(offering.roomId ?? '');
      setFormat(offering.format ?? '');
      setNotes(offering.notes ?? '');
    } else {
      setTeacherId('');
      setRoomId('');
      setFormat('');
      setNotes('');
    }
  }, [offering]);

  useEffect(() => {
    listTeachers({ limit: 100 }).then(({ data }) => {
      if (data?.items) {
        setTeachers(data.items.map((i) => ({ id: i.profile.id, displayName: i.displayName })));
      }
    });
    fetchRooms().then(({ data }) => {
      if (data) {
        setRooms(data.map((r) => ({ id: r.id, label: `${r.buildingName} — ${r.number}` })));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    if (offering) {
      const { data, error } = await updateOffering(offering.id, {
        teacherId: teacherId || null,
        roomId: roomId || null,
        format: format || null,
        notes: notes || null,
      });
      setSubmitting(false);
      if (error) {
        setFormError(error.message ?? t('implementationErrorLoadOfferings'));
        return;
      }
      if (data) onSaved(data);
    } else {
      const { data, error } = await createOffering({
        groupId,
        curriculumSubjectId,
        teacherId: teacherId || undefined,
        roomId: roomId || undefined,
        format: format || undefined,
        notes: notes || undefined,
      });
      setSubmitting(false);
      if (error) {
        if (error.code === 'CONFLICT' || error.status === 409) {
          setFormError(t('implementationDuplicateOffering'));
        } else {
          setFormError(error.message ?? t('implementationErrorLoadOfferings'));
        }
        return;
      }
      if (data) onSaved(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="department-form">
      <h3 className="entity-view-card-title" style={{ marginTop: 0 }}>
        {t('implementationOfferingDefaults')}
      </h3>
      {formError && (
        <div style={{ marginBottom: '0.75rem' }}>
          <Alert variant="error" role="alert">
            {formError}
          </Alert>
        </div>
      )}
      <FormGroup label={t('implementationTeacher')} htmlFor="offering-teacher">
        <select
          id="offering-teacher"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
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
      <FormGroup label={t('implementationRoom')} htmlFor="offering-room">
        <select
          id="offering-room"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="">—</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </FormGroup>
      <FormGroup label={t('implementationFormat')} htmlFor="offering-format">
        <select
          id="offering-format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="">—</option>
          <option value="offline">{t('implementationFormatOffline')}</option>
          <option value="online">{t('implementationFormatOnline')}</option>
          <option value="mixed">{t('implementationFormatMixed')}</option>
        </select>
      </FormGroup>
      <FormGroup label={t('implementationNotes')} htmlFor="offering-notes">
        <textarea
          id="offering-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </FormGroup>
      <FormActions
        submitLabel={submitting ? t('implementationSaving') : t('implementationSave')}
        submitting={submitting}
        cancelLabel={tCommon('cancel')}
        onCancel={() => {}}
      />
    </form>
  );
}
