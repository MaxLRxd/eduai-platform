import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { DEFAULT_PATH_BY_ROLE } from "./router/navConfig";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
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

function Shell({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return <AppShell title={title}>{children}</AppShell>;
}

export function App(): React.ReactElement {
  const { user } = useAuth();

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

      {/* Docente — placeholders, nav ya armada en navConfig.ts */}
      {["/teacher/corrections", "/teacher/analytics", "/teacher/ai", "/teacher/content", "/teacher/messages", "/teacher/profile"].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute allow="PROFESOR">
              <Shell title="Panel docente">
                <PlaceholderPage title="Panel docente" />
              </Shell>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Admin — placeholders, nav ya armada en navConfig.ts */}
      {["/admin", "/admin/materias", "/admin/claves", "/admin/usuarios", "/admin/licencias", "/admin/reports", "/admin/settings"].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute allow="ADMIN">
              <Shell title="Panel de administración">
                <PlaceholderPage title="Panel de administración" />
              </Shell>
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="*" element={<Navigate to={user ? DEFAULT_PATH_BY_ROLE[user.role] : "/login"} replace />} />
    </Routes>
  );
}
