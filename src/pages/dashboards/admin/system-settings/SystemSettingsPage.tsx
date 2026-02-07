import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchAcademicYears,
  fetchCurrentAcademicYear,
  fetchCurrentSemester,
} from '../../../../entities/academic';
import { fetchBuildings } from '../../../../entities/schedule';
import { TimeslotsSection } from './timeslots';
import { useCanEditInAdmin } from '../../../../app/hooks/useCanEditInAdmin';
import { useTranslation, formatDate } from '../../../../shared/i18n';
import { EntityListLayout } from '../../../../widgets/entity-list-layout';
import { Alert } from '../../../../shared/ui';

export function SystemSettingsPage() {
  const navigate = useNavigate();
  const canEdit = useCanEditInAdmin();
  const { t, locale } = useTranslation('dashboard');
  const [years, setYears] = useState<Array<{ id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }>>([]);
  const [currentYear, setCurrentYear] = useState<{ name: string; startDate: string; endDate: string } | null>(null);
  const [currentSemester, setCurrentSemester] = useState<{
    name: string | null;
    endDate: string;
    number: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [buildings, setBuildings] = useState<Array<{ id: string; name: string; address: string | null }>>([]);
  const [buildingsError, setBuildingsError] = useState<string | null>(null);
  const [buildingsSearch, setBuildingsSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAcademicYears(),
      fetchCurrentAcademicYear(),
      fetchCurrentSemester(),
      fetchBuildings(),
    ]).then(([yearsRes, yearRes, semesterRes, buildingsRes]) => {
      if (cancelled) return;
      setLoading(false);
      if (yearsRes.error) {
        setError(yearsRes.error.message ?? t('academicErrorLoadYears'));
        setYears([]);
        return;
      }
      setYears(yearsRes.data ?? []);
      if (!yearRes.error && yearRes.data) {
        setCurrentYear({
          name: yearRes.data.name,
          startDate: yearRes.data.startDate,
          endDate: yearRes.data.endDate,
        });
      } else {
        setCurrentYear(null);
      }
      if (!semesterRes.error && semesterRes.data) {
        setCurrentSemester({
          name: semesterRes.data.name,
          endDate: semesterRes.data.endDate,
          number: semesterRes.data.number,
        });
      } else {
        setCurrentSemester(null);
      }
      if (!buildingsRes.error && buildingsRes.data) {
        setBuildings(buildingsRes.data.map((b) => ({ id: b.id, name: b.name, address: b.address })));
        setBuildingsError(null);
      } else {
        setBuildings([]);
        setBuildingsError(buildingsRes.error?.message ?? t('buildingErrorLoadList'));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredYears = useMemo(() => {
    if (!search.trim()) return years;
    const q = search.trim().toLowerCase();
    return years.filter(
      (y) =>
        y.name.toLowerCase().includes(q) ||
        y.startDate.toLowerCase().includes(q) ||
        y.endDate.toLowerCase().includes(q)
    );
  }, [years, search]);

  const filteredBuildings = useMemo(() => {
    if (!buildingsSearch.trim()) return buildings;
    const q = buildingsSearch.trim().toLowerCase();
    return buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.address ?? '').toLowerCase().includes(q)
    );
  }, [buildings, buildingsSearch]);

  return (
    <div className="department-page">
      <h1 className="department-page-title">{t('systemSettingsTitle')}</h1>
      <p className="department-page-subtitle">{t('systemSettingsSubtitle')}</p>

      {error != null && error !== '' && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      {loading ? (
        <p style={{ color: '#6b7280' }}>{t('loadingList')}</p>
      ) : (
        <>
          <section className="academic-summary-section" aria-labelledby="academic-summary-heading">
            <h2 id="academic-summary-heading" className="academic-summary-heading">
              {t('academicSummaryTitle')}
            </h2>
            <div className="academic-summary-cards">
              <div className="academic-summary-card">
                <span className="academic-summary-label">{t('academicCurrentYear')}</span>
                {currentYear ? (
                  <>
                    <span className="academic-summary-value">{currentYear.name}</span>
                    <span className="academic-summary-meta">
                      {t('academicYearRange')}: {formatDate(currentYear.startDate, locale)} — {formatDate(currentYear.endDate, locale)}
                    </span>
                  </>
                ) : (
                  <span className="academic-summary-muted">{t('academicNoCurrentYear')}</span>
                )}
              </div>
              <div className="academic-summary-card">
                <span className="academic-summary-label">{t('academicCurrentSemester')}</span>
                {currentSemester ? (
                  <>
                    <span className="academic-summary-value">
                      {currentSemester.name ?? t('academicSemesterNumber').replace('№', '') + ' ' + currentSemester.number}
                    </span>
                    <span className="academic-summary-meta">
                      {t('academicSemesterEnds')}: {formatDate(currentSemester.endDate, locale)}
                    </span>
                  </>
                ) : (
                  <span className="academic-summary-muted">{t('academicNoCurrentSemester')}</span>
                )}
              </div>
            </div>
          </section>

          <section className="academic-years-section">
            <EntityListLayout
              title={t('academicYearsTitle')}
              subtitle={t('academicYearsSubtitle')}
              viewOnly={!canEdit}
              viewOnlyMessage={t('viewOnlyNotice')}
              error={null}
              success={null}
              showToolbar={true}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder={t('academicSearchYears')}
              searchAriaLabel={t('academicSearchYears')}
              createTo="/dashboards/admin/settings/years/new"
              createLabel={t('academicCreateYear')}
              showCreate={canEdit}
            >
              <div className="department-table-wrap">
                {filteredYears.length === 0 ? (
                  <div className="department-empty">
                    <p>{years.length === 0 ? t('academicNoYears') : t('noResults')}</p>
                    {years.length === 0 && canEdit && (
                      <Link to="/dashboards/admin/settings/years/new" className="department-page-create">
                        {t('academicAddYear')}
                      </Link>
                    )}
                  </div>
                ) : (
                  <table className="department-table">
                    <thead>
                      <tr>
                        <th>{t('name')}</th>
                        <th>{t('academicStartDate')}</th>
                        <th>{t('academicEndDate')}</th>
                        <th>{t('academicIsCurrent')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredYears.map((y) => (
                        <tr
                          key={y.id}
                          className="department-table-row-clickable"
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/dashboards/admin/settings/years/${y.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/dashboards/admin/settings/years/${y.id}`);
                            }
                          }}
                          aria-label={t('viewTitle')}
                        >
                          <td>{y.name}</td>
                          <td>{formatDate(y.startDate, locale)}</td>
                          <td>{formatDate(y.endDate, locale)}</td>
                          <td>{y.isCurrent ? '✓' : '—'}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="department-table-actions">
                              <button
                                type="button"
                                className="department-table-btn"
                                onClick={() => navigate(`/dashboards/admin/settings/years/${y.id}`)}
                                title={t('viewTitle')}
                                aria-label={t('viewTitle')}
                              >
                                👁
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </EntityListLayout>
          </section>

          <section className="buildings-section academic-years-section">
            {buildingsError && (
              <Alert variant="error" role="alert" style={{ marginBottom: '1rem' }}>
                {buildingsError}
              </Alert>
            )}
            <EntityListLayout
              title={t('buildingsTitle')}
              subtitle={t('buildingsSubtitle')}
              viewOnly={!canEdit}
              viewOnlyMessage={t('viewOnlyNotice')}
              error={null}
              success={null}
              showToolbar={true}
              searchValue={buildingsSearch}
              onSearchChange={setBuildingsSearch}
              searchPlaceholder={t('buildingsSearchPlaceholder')}
              searchAriaLabel={t('buildingsSearchPlaceholder')}
              createTo="/dashboards/admin/settings/buildings/new"
              createLabel={t('buildingCreate')}
              showCreate={canEdit}
            >
              <div className="department-table-wrap">
                {filteredBuildings.length === 0 ? (
                  <div className="department-empty">
                    <p>{buildings.length === 0 ? t('buildingsNoBuildings') : t('noResults')}</p>
                    {buildings.length === 0 && canEdit && (
                      <Link to="/dashboards/admin/settings/buildings/new" className="department-page-create">
                        {t('buildingAdd')}
                      </Link>
                    )}
                  </div>
                ) : (
                  <table className="department-table">
                    <thead>
                      <tr>
                        <th>{t('name')}</th>
                        <th>{t('buildingAddress')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBuildings.map((b) => (
                        <tr
                          key={b.id}
                          className="department-table-row-clickable"
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/dashboards/admin/settings/buildings/${b.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(`/dashboards/admin/settings/buildings/${b.id}`);
                            }
                          }}
                          aria-label={t('viewTitle')}
                        >
                          <td>{b.name}</td>
                          <td>{b.address || '—'}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="department-table-actions">
                              <button
                                type="button"
                                className="department-table-btn"
                                onClick={() => navigate(`/dashboards/admin/settings/buildings/${b.id}`)}
                                title={t('viewTitle')}
                                aria-label={t('viewTitle')}
                              >
                                👁
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </EntityListLayout>
          </section>

          <TimeslotsSection />
        </>
      )}
    </div>
  );
}
