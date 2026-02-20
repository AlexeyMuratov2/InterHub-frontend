import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './app/providers';
import { RequireAuth, RequireDashboardRole } from './app/routes';
import { DashboardLayout, StudentDashboardLayout, TeacherDashboardLayout } from './app/layout';
import { DashboardSelectorPage } from './pages/dashboards/selector';
import { dashboardRegistry } from './app/routes/dashboardRegistry';
import {
  DepartmentListPage,
  DepartmentCreatePage,
  DepartmentEditPage,
  DepartmentViewPage,
  ProgramListPage,
  ProgramCreatePage,
  ProgramEditPage,
  ProgramViewPage,
  CurriculumCreatePage,
  CurriculumEditPage,
  CurriculumSubjectsPage,
  CurriculumSubjectCreatePage,
  CurriculumSubjectEditPage,
  GroupListPage,
  GroupCreatePage,
  GroupEditPage,
  GroupViewPage,
  InvitationListPage,
  InvitationCreatePage,
  InvitationViewPage,
  UserListPage,
  UserViewPage,
  ProfilePage,
  SubjectListPage,
  SubjectCreatePage,
  SubjectViewPage,
  SubjectEditPage,
  AssessmentTypeCreatePage,
  AssessmentTypeEditPage,
  SystemSettingsPage,
  AcademicYearViewPage,
  AcademicYearCreatePage,
  AcademicYearEditPage,
  BuildingViewPage,
  BuildingCreatePage,
  BuildingEditPage,
  ImplementationPage,
} from './pages/dashboards/admin';
import { SchedulePage as StudentSchedulePage } from './pages/dashboards/student';
import { SchedulePage as TeacherSchedulePage, SubjectsPage as TeacherSubjectsPage, AbsenceRequestsPage as TeacherAbsenceRequestsPage } from './pages/dashboards/teacher';
import { SubjectDetailPage } from './pages/dashboards/teacher/subjects/[id]';
import { LessonFullDetailsPage } from './pages/dashboards/teacher/lessons/[lessonId]';
import { LessonsListPage } from './pages/dashboards/teacher/lessons';
import InvitePage from './pages/InvitePage';
import LoginPage from './pages/LoginPage';
import { HomePage } from './pages/home';
import { I18nProvider } from './shared/i18n';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route
            path="/dashboards"
            element={
              <RequireAuth>
                <DashboardSelectorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboards/admin"
            element={
              <RequireAuth>
                <RequireDashboardRole dashboard="admin">
                  <DashboardLayout />
                </RequireDashboardRole>
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="departments" replace />} />
            <Route path="settings" element={<SystemSettingsPage />} />
            <Route path="settings/years/new" element={<AcademicYearCreatePage />} />
            <Route path="settings/years/:id" element={<AcademicYearViewPage />} />
            <Route path="settings/years/:id/edit" element={<AcademicYearEditPage />} />
            <Route path="settings/buildings/new" element={<BuildingCreatePage />} />
            <Route path="settings/buildings/:id" element={<BuildingViewPage />} />
            <Route path="settings/buildings/:id/edit" element={<BuildingEditPage />} />
            <Route path="departments" element={<DepartmentListPage />} />
            <Route path="departments/new" element={<DepartmentCreatePage />} />
            <Route path="departments/:id" element={<DepartmentViewPage />} />
            <Route path="departments/:id/edit" element={<DepartmentEditPage />} />
            <Route path="invitations" element={<InvitationListPage />} />
            <Route path="invitations/new" element={<InvitationCreatePage />} />
            <Route path="invitations/:id" element={<InvitationViewPage />} />
            <Route path="accounts" element={<UserListPage />} />
            <Route path="accounts/:id" element={<UserViewPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="subjects" element={<SubjectListPage />} />
            <Route path="subjects/new" element={<SubjectCreatePage />} />
            <Route path="subjects/assessment-types/new" element={<AssessmentTypeCreatePage />} />
            <Route path="subjects/assessment-types/:id/edit" element={<AssessmentTypeEditPage />} />
            <Route path="subjects/:id" element={<SubjectViewPage />} />
            <Route path="subjects/:id/edit" element={<SubjectEditPage />} />
            <Route path="groups" element={<GroupListPage />} />
            <Route path="groups/new" element={<GroupCreatePage />} />
            <Route path="groups/:id" element={<GroupViewPage />} />
            <Route path="groups/:id/edit" element={<GroupEditPage />} />
            <Route path="implementation" element={<ImplementationPage />} />
            <Route path="programs" element={<ProgramListPage />} />
            <Route path="programs/new" element={<ProgramCreatePage />} />
            <Route path="programs/curricula/:curriculumId/edit" element={<CurriculumEditPage />} />
            <Route path="programs/curricula/:curriculumId/subjects" element={<CurriculumSubjectsPage />} />
            <Route path="programs/curricula/:curriculumId/subjects/new" element={<CurriculumSubjectCreatePage />} />
            <Route path="programs/curriculum-subjects/:id/edit" element={<CurriculumSubjectEditPage />} />
            <Route path="programs/:programId/curricula/new" element={<CurriculumCreatePage />} />
            <Route path="programs/:id" element={<ProgramViewPage />} />
            <Route path="programs/:id/edit" element={<ProgramEditPage />} />
          </Route>
          <Route
            path="/dashboards/teacher"
            element={
              <RequireAuth>
                <RequireDashboardRole dashboard="teacher">
                  <TeacherDashboardLayout />
                </RequireDashboardRole>
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<TeacherSchedulePage />} />
            <Route path="subjects" element={<TeacherSubjectsPage />} />
            <Route path="subjects/:id" element={<SubjectDetailPage />} />
            <Route path="lessons" element={<LessonsListPage />} />
            <Route path="lessons/:lessonId" element={<LessonFullDetailsPage />} />
            <Route path="absence-requests" element={<TeacherAbsenceRequestsPage />} />
          </Route>
          <Route
            path="/dashboards/student"
            element={
              <RequireAuth>
                <RequireDashboardRole dashboard="student">
                  <StudentDashboardLayout />
                </RequireDashboardRole>
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<StudentSchedulePage />} />
          </Route>
          <Route path="*" element={<RequireAuth><Navigate to="/" replace /></RequireAuth>} />
        </Routes>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

function LazyDashboard({ name }: { name: 'teacher' | 'student' }) {
  const entry = dashboardRegistry.find((e) => e.path === `/dashboards/${name}`);
  if (!entry) return null;
  const Component = entry.Component;
  return <Component />;
}

export default App;
