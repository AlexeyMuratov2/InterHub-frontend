import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchBuildingById,
  fetchRooms,
  deleteBuilding,
  createRoom,
  createRoomsBulk,
  updateRoom,
  deleteRoom,
  type BuildingDto,
  type RoomDto,
  type CreateRoomRequest,
} from '../../../../../entities/schedule';
import { useCanEditInAdmin } from '../../../../../app/hooks/useCanEditInAdmin';
import { useCanDeleteInAdmin } from '../../../../../app/hooks/useCanDeleteInAdmin';
import { useTranslation, formatDate } from '../../../../../shared/i18n';
import { EntityViewLayout } from '../../../../../widgets/entity-view-layout';
import { Alert, ConfirmModal, FormGroup, FormActions, Modal } from '../../../../../shared/ui';
import { parseFieldErrors } from '../../../../../shared/lib';
import type { ErrorResponse } from '../../../../../shared/api/types';

const BULK_PLACEHOLDER = '101\n102\n103\n201\n202';

export function BuildingViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const canDelete = useCanDeleteInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  const [building, setBuilding] = useState<BuildingDto | null>(null);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [deleteBuildingOpen, setDeleteBuildingOpen] = useState(false);
  const [deletingBuilding, setDeletingBuilding] = useState(false);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);
  const [deletingRoom, setDeletingRoom] = useState(false);

  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<RoomDto | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [roomForm, setRoomForm] = useState({ number: '', capacity: '', type: '' });
  const [bulkText, setBulkText] = useState('');
  const [roomSubmitting, setRoomSubmitting] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [roomFieldErrors, setRoomFieldErrors] = useState<Record<string, string>>({});

  const loadRooms = useCallback(() => {
    fetchRooms().then(({ data }) => {
      if (data && id) setRooms(data.filter((r) => r.buildingId === id));
    });
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchBuildingById(id).then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err || !data) {
        setNotFound(true);
        setBuilding(null);
        return;
      }
      setBuilding(data);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleDeleteBuilding = async () => {
    if (!id) return;
    setDeletingBuilding(true);
    setError(null);
    const { error: err } = await deleteBuilding(id);
    setDeletingBuilding(false);
    setDeleteBuildingOpen(false);
    if (err) {
      if (err.status === 409) {
        setError(t('buildingErrorDeleteHasRooms'));
      } else {
        setError(err.message ?? t('buildingErrorDelete', { status: String(err.status ?? '') }));
      }
      return;
    }
    setSuccess(t('buildingSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
    navigate('/dashboards/admin/settings', { replace: true });
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomId) return;
    setDeletingRoom(true);
    setError(null);
    const { error: err } = await deleteRoom(deleteRoomId);
    setDeletingRoom(false);
    setDeleteRoomId(null);
    if (err) {
      setError(err.message ?? t('roomErrorDelete', { status: String(err.status ?? '') }));
      return;
    }
    setSuccess(t('roomSuccessDeleted'));
    setTimeout(() => setSuccess(null), 3000);
    loadRooms();
  };

  const openCreateRoom = () => {
    setRoomForm({ number: '', capacity: '', type: '' });
    setRoomError(null);
    setRoomFieldErrors({});
    setCreateRoomOpen(true);
  };

  const openEditRoom = (r: RoomDto) => {
    setEditRoom(r);
    setRoomForm({
      number: r.number,
      capacity: r.capacity != null ? String(r.capacity) : '',
      type: r.type ?? '',
    });
    setRoomError(null);
    setRoomFieldErrors({});
  };

  const closeRoomModal = () => {
    setCreateRoomOpen(false);
    setEditRoom(null);
  };

  const closeBulkModal = () => {
    setBulkOpen(false);
    setBulkText('');
    setRoomError(null);
  };

  const validateRoomForm = (): boolean => {
    const err: Record<string, string> = {};
    if (!roomForm.number.trim()) err.number = t('roomErrorNumberRequired');
    const cap = roomForm.capacity.trim();
    if (cap) {
      const n = parseInt(cap, 10);
      if (isNaN(n) || n < 0) err.capacity = t('roomErrorCapacityMin');
    }
    setRoomFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setRoomError(null);
    setRoomFieldErrors({});
    if (!validateRoomForm()) return;
    setRoomSubmitting(true);
    const capacity = roomForm.capacity.trim() ? parseInt(roomForm.capacity, 10) : null;
    const { data, error: err } = await createRoom({
      buildingId: id,
      number: roomForm.number.trim(),
      capacity: capacity ?? undefined,
      type: roomForm.type.trim() || null,
    });
    setRoomSubmitting(false);
    if (err) {
      if (typeof (err as unknown as ErrorResponse).details === 'object') {
        setRoomFieldErrors(parseFieldErrors((err as unknown as ErrorResponse).details));
        setRoomError(t('roomErrorValidation'));
      } else {
        setRoomError(err.message ?? t('roomErrorCreate'));
      }
      return;
    }
    if (data) {
      closeRoomModal();
      loadRooms();
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRoom) return;
    setRoomError(null);
    setRoomFieldErrors({});
    if (!validateRoomForm()) return;
    setRoomSubmitting(true);
    const capacity = roomForm.capacity.trim() ? parseInt(roomForm.capacity, 10) : null;
    const { error: err } = await updateRoom(editRoom.id, {
      number: roomForm.number.trim(),
      capacity: capacity ?? undefined,
      type: roomForm.type.trim() || null,
    });
    setRoomSubmitting(false);
    if (err) {
      if (typeof (err as unknown as ErrorResponse).details === 'object') {
        setRoomFieldErrors(parseFieldErrors((err as unknown as ErrorResponse).details));
        setRoomError(t('roomErrorValidation'));
      } else {
        setRoomError(err.message ?? t('roomErrorUpdate'));
      }
      return;
    }
    closeRoomModal();
    loadRooms();
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setRoomError(null);
    const lines = bulkText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setRoomError(t('roomBulkEmpty'));
      return;
    }
    setRoomSubmitting(true);
    const items: CreateRoomRequest[] = lines.map((number) => ({
      buildingId: id,
      number,
    }));
    const { data, error: err } = await createRoomsBulk(items);
    setRoomSubmitting(false);
    if (err) {
      setRoomError(err.message ?? t('roomBulkError'));
      return;
    }
    if (data?.length) {
      closeBulkModal();
      loadRooms();
      setSuccess(t('roomBulkSuccess', { count: String(data.length) }));
      setTimeout(() => setSuccess(null), 3000);
    } else {
      closeBulkModal();
      loadRooms();
    }
  };

  return (
    <>
      <EntityViewLayout
        loading={loading}
        notFound={notFound}
        error={error}
        notFoundMessage={t('buildingNotFound')}
        errorMessage={error ?? undefined}
        backTo="/dashboards/admin/settings"
        backLabel={t('buildingBackToSettings')}
        viewOnly={!canEdit}
        viewOnlyMessage={t('viewOnlyNotice')}
        title={building ? t('buildingViewTitle', { name: building.name }) : ''}
        onEditClick={canEdit && building ? () => navigate(`/dashboards/admin/settings/buildings/${id}/edit`) : undefined}
        editLabel={t('editTitle')}
        extraActions={
          canDelete && building ? (
            <button
              type="button"
              className="department-table-btn department-table-btn--danger"
              onClick={() => setDeleteBuildingOpen(true)}
              title={t('deleteTitle')}
              aria-label={t('deleteTitle')}
            >
              🗑
            </button>
          ) : null
        }
      >
        {building && (
          <>
            {success && (
              <div className="building-view-message">
                <Alert variant="success" role="status">
                  {success}
                </Alert>
              </div>
            )}

            <div className="building-info academic-year-info">
              <div className="academic-year-info-row">
                <span className="academic-year-info-label">{t('buildingAddress')}</span>
                <span className="academic-year-info-value">{building.address || '—'}</span>
              </div>
              <div className="academic-year-info-row">
                <span className="academic-year-info-label">{t('buildingUpdatedAt')}</span>
                <span className="academic-year-info-value">{formatDate(building.updatedAt, locale)}</span>
              </div>
            </div>

            <h2 className="academic-semesters-heading">{t('roomSectionTitle')}</h2>
            <p className="academic-semesters-subtitle">{t('roomSectionSubtitle')}</p>
            {canEdit && (
              <div className="academic-semesters-toolbar building-rooms-toolbar">
                <button
                  type="button"
                  className="department-table-btn department-table-btn--primary"
                  onClick={openCreateRoom}
                >
                  + {t('roomAdd')}
                </button>
                <button
                  type="button"
                  className="department-table-btn"
                  onClick={() => {
                    setBulkText('');
                    setRoomError(null);
                    setBulkOpen(true);
                  }}
                >
                  {t('roomBulkAdd')}
                </button>
              </div>
            )}
            <div className="department-table-wrap">
              {rooms.length === 0 ? (
                <p className="department-empty building-rooms-empty">{t('roomNoRooms')}</p>
              ) : (
                <table className="department-table">
                  <thead>
                    <tr>
                      <th>{t('roomNumber')}</th>
                      <th>{t('roomCapacity')}</th>
                      <th>{t('roomType')}</th>
                      {canEdit && <th>{t('actions')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r) => (
                      <tr key={r.id}>
                        <td>{r.number}</td>
                        <td>{r.capacity != null ? r.capacity : '—'}</td>
                        <td>{r.type ?? '—'}</td>
                        {canEdit && (
                          <td>
                            <div className="department-table-actions">
                              <button
                                type="button"
                                className="department-table-btn"
                                onClick={() => openEditRoom(r)}
                                title={t('editTitle')}
                                aria-label={t('editTitle')}
                              >
                                ✎
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  className="department-table-btn department-table-btn--danger"
                                  onClick={() => setDeleteRoomId(r.id)}
                                  title={t('deleteTitle')}
                                  aria-label={t('deleteTitle')}
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </EntityViewLayout>

      <ConfirmModal
        open={deleteBuildingOpen}
        title={t('buildingDeleteConfirmTitle')}
        message={t('buildingDeleteConfirmText')}
        onCancel={() => setDeleteBuildingOpen(false)}
        onConfirm={handleDeleteBuilding}
        cancelLabel={tCommon('cancelButton')}
        confirmLabel={deletingBuilding ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deletingBuilding}
        confirmVariant="danger"
      />

      <ConfirmModal
        open={deleteRoomId != null}
        title={t('roomDeleteConfirmTitle')}
        message={t('roomDeleteConfirmText')}
        onCancel={() => setDeleteRoomId(null)}
        onConfirm={handleDeleteRoom}
        cancelLabel={tCommon('cancelButton')}
        confirmLabel={deletingRoom ? tCommon('submitting') : tCommon('delete')}
        confirmDisabled={deletingRoom}
        confirmVariant="danger"
      />

      <Modal
        open={createRoomOpen}
        onClose={closeRoomModal}
        title={t('roomCreateTitle')}
        variant="form"
        modalClassName="building-room-modal"
      >
        <form className="department-form" onSubmit={handleCreateRoom}>
          {roomError && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <Alert variant="error" role="alert">
                {roomError}
              </Alert>
            </div>
          )}
          <FormGroup label={t('roomNumberRequired')} htmlFor="room-number" error={roomFieldErrors.number}>
            <input
              id="room-number"
              type="text"
              value={roomForm.number}
              onChange={(e) => setRoomForm((p) => ({ ...p, number: e.target.value }))}
              placeholder={t('roomNumberPlaceholder')}
              aria-invalid={!!roomFieldErrors.number}
            />
          </FormGroup>
          <FormGroup label={t('roomCapacity')} htmlFor="room-capacity" error={roomFieldErrors.capacity}>
            <input
              id="room-capacity"
              type="number"
              min={0}
              value={roomForm.capacity}
              onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))}
              placeholder={t('roomCapacityPlaceholder')}
              aria-invalid={!!roomFieldErrors.capacity}
            />
          </FormGroup>
          <FormGroup label={t('roomType')} htmlFor="room-type">
            <input
              id="room-type"
              type="text"
              value={roomForm.type}
              onChange={(e) => setRoomForm((p) => ({ ...p, type: e.target.value }))}
              placeholder={t('roomTypePlaceholder')}
            />
          </FormGroup>
          <FormActions
            submitLabel={roomSubmitting ? t('roomCreating') : tCommon('create')}
            submitting={roomSubmitting}
            onCancel={closeRoomModal}
            cancelLabel={tCommon('cancelButton')}
          />
        </form>
      </Modal>

      <Modal
        open={editRoom != null}
        onClose={closeRoomModal}
        title={t('roomEditTitle')}
        variant="form"
        modalClassName="building-room-modal"
      >
        <form className="department-form" onSubmit={handleUpdateRoom}>
          {roomError && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <Alert variant="error" role="alert">
                {roomError}
              </Alert>
            </div>
          )}
          <FormGroup label={t('roomNumberRequired')} htmlFor="edit-room-number" error={roomFieldErrors.number}>
            <input
              id="edit-room-number"
              type="text"
              value={roomForm.number}
              onChange={(e) => setRoomForm((p) => ({ ...p, number: e.target.value }))}
              placeholder={t('roomNumberPlaceholder')}
              aria-invalid={!!roomFieldErrors.number}
            />
          </FormGroup>
          <FormGroup label={t('roomCapacity')} htmlFor="edit-room-capacity" error={roomFieldErrors.capacity}>
            <input
              id="edit-room-capacity"
              type="number"
              min={0}
              value={roomForm.capacity}
              onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))}
              placeholder={t('roomCapacityPlaceholder')}
              aria-invalid={!!roomFieldErrors.capacity}
            />
          </FormGroup>
          <FormGroup label={t('roomType')} htmlFor="edit-room-type">
            <input
              id="edit-room-type"
              type="text"
              value={roomForm.type}
              onChange={(e) => setRoomForm((p) => ({ ...p, type: e.target.value }))}
              placeholder={t('roomTypePlaceholder')}
            />
          </FormGroup>
          <FormActions
            submitLabel={roomSubmitting ? t('roomSaving') : tCommon('save')}
            submitting={roomSubmitting}
            onCancel={closeRoomModal}
            cancelLabel={tCommon('cancelButton')}
          />
        </form>
      </Modal>

      <Modal
        open={bulkOpen}
        onClose={closeBulkModal}
        title={t('roomBulkTitle')}
        variant="form"
        modalClassName="building-room-bulk-modal"
      >
        <form className="department-form" onSubmit={handleBulkAdd}>
          {roomError && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <Alert variant="error" role="alert">
                {roomError}
              </Alert>
            </div>
          )}
          <FormGroup
            label={t('roomBulkLabel')}
            htmlFor="room-bulk-numbers"
            hint={t('roomBulkHint')}
          >
            <textarea
              id="room-bulk-numbers"
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={BULK_PLACEHOLDER}
              className="building-bulk-textarea"
            />
          </FormGroup>
          <FormActions
            submitLabel={roomSubmitting ? t('roomCreating') : tCommon('create')}
            submitting={roomSubmitting}
            onCancel={closeBulkModal}
            cancelLabel={tCommon('cancelButton')}
          />
        </form>
      </Modal>
    </>
  );
}
