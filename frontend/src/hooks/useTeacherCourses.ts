import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  crearNota,
  getTeacherCourseGrades,
  getTeacherCourseStudents,
  getTeacherCourses,
  getTeacherGradeSources,
} from "../services/teacherCourses.service";

export function useTeacherCourses() {
  return useQuery({ queryKey: ["teacher-courses"], queryFn: getTeacherCourses });
}

export function useTeacherCourseStudents(courseId: string | null) {
  return useQuery({
    queryKey: ["teacher-courses", courseId ?? "", "students"],
    queryFn: () => getTeacherCourseStudents(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useTeacherCourseGrades(courseId: string | null) {
  return useQuery({
    queryKey: ["teacher-courses", courseId ?? "", "grades"],
    queryFn: () => getTeacherCourseGrades(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useTeacherGradeSources(courseId: string | null) {
  return useQuery({
    queryKey: ["teacher-courses", courseId ?? "", "grade-sources"],
    queryFn: () => getTeacherGradeSources(courseId as string),
    enabled: Boolean(courseId),
  });
}

export function useCreateNota(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof crearNota>[1]) => crearNota(courseId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teacher-courses", courseId, "grades"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-courses", courseId, "students"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher-courses", courseId, "grade-sources"] });
      void queryClient.invalidateQueries({ queryKey: ["progress"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}