import type { TeacherCourse, TeacherGradeRow, TeacherStudentRow } from "../types/domain";
import { MOCK_TEACHER_COURSES } from "../data/mock/teacherCourses.mock";
import { MOCK_TEACHER_STUDENTS } from "../data/mock/teacherStudents.mock";
import { MOCK_TEACHER_GRADES } from "../data/mock/teacherGrades.mock";

// TODO(backend): GET /api/teachers/me/courses (subjects.service.ts en el backend).
export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  return Promise.resolve(MOCK_TEACHER_COURSES);
}

// TODO(backend): GET /api/courses/:id/students.
export async function getTeacherCourseStudents(courseId: string): Promise<TeacherStudentRow[]> {
  return Promise.resolve(MOCK_TEACHER_STUDENTS[courseId] ?? MOCK_TEACHER_STUDENTS.prog2);
}

// TODO(backend): GET /api/courses/:id/grades (grades.service.ts).
export async function getTeacherCourseGrades(courseId: string): Promise<TeacherGradeRow[]> {
  return Promise.resolve(MOCK_TEACHER_GRADES[courseId] ?? MOCK_TEACHER_GRADES.prog2);
}
