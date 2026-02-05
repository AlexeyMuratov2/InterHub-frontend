import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './app/providers';
import { RequireAuth, RequireDashboardRole } from './app/routes';
import { DashboardLayout } from './app/layout';
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
} from './pages/dashboards/admin';
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
                  <LazyDashboard name="teacher" />
                </RequireDashboardRole>
              </RequireAuth>
            }
          />
          <Route
            path="/dashboards/student"
            element={
              <RequireAuth>
                <RequireDashboardRole dashboard="student">
                  <LazyDashboard name="student" />
                </RequireDashboardRole>
              </RequireAuth>
            }
          />
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
