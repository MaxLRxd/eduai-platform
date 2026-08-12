import type { Course } from "../types/domain";
import { MOCK_COURSES } from "../data/mock/courses.mock";

// Mock por ahora. Cuando exista el backend real, esta es la única capa a
// reemplazar (fetch a `${API_URL}/api/courses`) — los hooks y componentes
// que la consumen no cambian.
export async function getCourses(): Promise<Course[]> {
  return Promise.resolve(MOCK_COURSES);
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  return Promise.resolve(MOCK_COURSES.find((c) => c.id === id));
}
