import { useQuery } from "@tanstack/react-query";
import { getTeacherCourseGrades, getTeacherCourses, getTeacherCourseStudents } from "../services/teacherCourses.service";

export function useTeacherCourses() {
  return useQuery({ queryKey: ["teacher-courses"], queryFn: getTeacherCourses });
}

export function useTeacherCourseStudents(courseId: string) {
  return useQuery({ queryKey: ["teacher-courses", courseId, "students"], queryFn: () => getTeacherCourseStudents(courseId) });
}

export function useTeacherCourseGrades(courseId: string) {
  return useQuery({ queryKey: ["teacher-courses", courseId, "grades"], queryFn: () => getTeacherCourseGrades(courseId) });
}
