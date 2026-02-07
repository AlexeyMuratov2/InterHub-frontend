import { useState } from 'react';
import { useTranslation } from '../../../../shared/i18n';
import { Drawer } from '../../../../shared/ui';
import type { GroupSubjectOfferingDto } from '../../../../entities/offering';
import type { CurriculumSubjectRow } from './CurriculumSubjectsTableWithImplementation';
import { OfferingForm } from './OfferingForm';
import { OfferingTeachersEditor } from './OfferingTeachersEditor';
import { OfferingSlotsEditor } from './OfferingSlotsEditor';
import { GenerateLessonsPanel } from './GenerateLessonsPanel';

export interface OfferingConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  groupId: string | null;
  semesterId: string | null;
  /** Название/номер семестра для отображения (вместо id) */
  semesterLabel?: string | null;
  curriculumSubject: CurriculumSubjectRow | null;
  offering: GroupSubjectOfferingDto | null;
  slotsCount: number;
  onSaved: () => void;
  onToast: (message: string) => void;
  blockActions?: boolean;
}

export function OfferingConfigDrawer({
  open,
  onClose,
  groupId,
  semesterId,
  semesterLabel,
  curriculumSubject,
  offering,
  slotsCount,
  onSaved,
  onToast,
  blockActions,
}: OfferingConfigDrawerProps) {
  const { t } = useTranslation('dashboard');
  const [lessonsAlreadyExist, setLessonsAlreadyExist] = useState(false);

  const title = curriculumSubject
    ? `${curriculumSubject.subjectChineseName} (${curriculumSubject.subjectCode})`
    : t('implementationOfferingDefaults');

  const handleFormSaved = () => {
    onSaved();
  };

  if (!curriculumSubject || !groupId) return null;

  return (
    <Drawer open={open} onClose={onClose} title={title} width={640}>
      <OfferingForm
        groupId={groupId}
        curriculumSubjectId={curriculumSubject.id}
        offering={offering}
        onSaved={handleFormSaved}
        onError={(msg) => onToast(msg)}
      />

      {offering && (
        <>
          <OfferingTeachersEditor offeringId={offering.id} onUpdate={onSaved} />
          <OfferingSlotsEditor
            offeringId={offering.id}
            onUpdate={onSaved}
            highlightError={lessonsAlreadyExist && slotsCount === 0}
            defaultTeacherId={offering.teacherId}
            defaultRoomId={offering.roomId}
          />
          <GenerateLessonsPanel
            offeringId={offering.id}
            semesterId={semesterId}
            semesterLabel={semesterLabel}
            slotsCount={slotsCount}
            onSuccess={() => {}}
            onToast={onToast}
            lessonsAlreadyExist={lessonsAlreadyExist}
            onLessonsExistChange={setLessonsAlreadyExist}
            blockActions={blockActions}
          />
        </>
      )}
    </Drawer>
  );
}
