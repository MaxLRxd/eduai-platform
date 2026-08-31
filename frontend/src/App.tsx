import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { DEFAULT_PATH_BY_ROLE } from "./router/navConfig";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboardPage } from "./pages/student/StudentDashboardPage";
import { StudentCoursesPage } from "./pages/student/StudentCoursesPage";
import { StudentCourseDetailPage } from "./pages/student/StudentCourseDetailPage";
import { StudentAssignmentsPage } from "./pages/student/StudentAssignmentsPage";
import { StudentProgressPage } from "./pages/student/StudentProgressPage";
import { StudentProfilePage } from "./pages/student/StudentProfilePage";
import { StudentEnrollPage } from "./pages/student/StudentEnrollPage";
import { TeacherDashboardPage } from "./pages/teacher/TeacherDashboardPage";
import { TeacherCoursesPage } from "./pages/teacher/TeacherCoursesPage";
import { TeacherStudentsPage } from "./pages/teacher/TeacherStudentsPage";
import { TeacherGradesPage } from "./pages/teacher/TeacherGradesPage";
import { TeacherAttendancePage } from "./pages/teacher/TeacherAttendancePage";
import { TeacherCorrectionsPage } from "./pages/teacher/TeacherCorrectionsPage";
import { TeacherAnalyticsPage } from "./pages/teacher/TeacherAnalyticsPage";
import { TeacherAIPage } from "./pages/teacher/TeacherAIPage";
import { TeacherPlanningPage } from "./pages/teacher/TeacherPlanningPage";
import { TeacherMessagesPage } from "./pages/teacher/TeacherMessagesPage";
import { TeacherContentPage } from "./pages/teacher/TeacherContentPage";
import { TeacherProfilePage } from "./pages/teacher/TeacherProfilePage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminMateriasPage } from "./pages/admin/AdminMateriasPage";
import { AdminClavesPage } from "./pages/admin/AdminClavesPage";
import { AdminUsuariosPage } from "./pages/admin/AdminUsuariosPage";
import { AdminLicenciasPage } from "./pages/admin/AdminLicenciasPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage";

function Shell({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return <AppShell title={title}>{children}</AppShell>;
}

export function App(): React.ReactElement {
  const { user, isAuthenticating } = useAuth();

  if (isAuthenticating) {
    return <div className="p-10 text-sm text-text-2">Cargando sesión…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={DEFAULT_PATH_BY_ROLE[user.role]} replace /> : <LoginPage />} />

      {/* Alumno */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allow="ALUMNO">
            <Shell title="Panel principal">
              <StudentDashboardPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute allow="ALUMNO">
            <Shell title="Mis materias">
              <StudentCoursesPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses/:courseId"
        element={
          <ProtectedRoute allow="ALUMNO">
            <Shell title="Aula virtual">
              <StudentCourseDetailPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assignments"
        element={
          <ProtectedRoute allow="ALUMNO">
            <Shell title="Entregas">
              <StudentAssignmentsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/progress"
        element={
          <ProtectedRoute allow="ALUMNO">
            <Shell title="Mis estadísticas">
              <StudentProgressPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/enroll"
        element={
          <ProtectedRoute allow="ALUMNO">
            <Shell title="Inscribirse a materia">
              <StudentEnrollPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allow="ALUMNO">
            <Shell title="Mi perfil">
              <StudentProfilePage />
            </Shell>
          </ProtectedRoute>
        }
      />

      {/* Docente — núcleo operativo */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Panel docente">
              <TeacherDashboardPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Mis materias">
              <TeacherCoursesPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Mis estudiantes">
              <TeacherStudentsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/grades"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Calificaciones">
              <TeacherGradesPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Asistencia">
              <TeacherAttendancePage />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/corrections"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Correcciones">
              <TeacherCorrectionsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/analytics"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Analytics">
              <TeacherAnalyticsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/ai"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Asistente IA">
              <TeacherAIPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/planning"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Planificación">
              <TeacherPlanningPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/messages"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Mensajes">
              <TeacherMessagesPage />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/content"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Contenidos">
              <TeacherContentPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/profile"
        element={
          <ProtectedRoute allow="PROFESOR">
            <Shell title="Mi perfil">
              <TeacherProfilePage />
            </Shell>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allow="ADMIN">
            <Shell title="Panel institucional">
              <AdminDashboardPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/materias"
        element={
          <ProtectedRoute allow="ADMIN">
            <Shell title="Materias">
              <AdminMateriasPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/claves"
        element={
          <ProtectedRoute allow="ADMIN">
            <Shell title="Claves de Matriculación">
              <AdminClavesPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <ProtectedRoute allow="ADMIN">
            <Shell title="Usuarios">
              <AdminUsuariosPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/licencias"
        element={
          <ProtectedRoute allow="ADMIN">
            <Shell title="Licencias">
              <AdminLicenciasPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allow="ADMIN">
            <Shell title="Reportes">
              <AdminReportsPage />
            </Shell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allow="ADMIN">
            <Shell title="Apariencia">
              <AdminSettingsPage />
            </Shell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={user ? DEFAULT_PATH_BY_ROLE[user.role] : "/login"} replace />} />
    </Routes>
  );
}
