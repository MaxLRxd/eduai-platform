import { useQuery } from "@tanstack/react-query";
import { getCourseById, getCourses } from "../services/courses.service";

export function useCourses() {
  return useQuery({ queryKey: ["courses"], queryFn: getCourses });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => getCourseById(id as string),
    enabled: Boolean(id),
  });
}
