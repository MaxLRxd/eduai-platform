import React from "react";
import type { TeacherCourse } from "../../types/domain";

export function CourseFilter({
  courses,
  value,
  onChange,
}: {
  courses: TeacherCourse[];
  value: string;
  onChange: (courseId: string) => void;
}): React.ReactElement {
  return (
    <div className="bg-surface border border-border rounded-lg px-4.5 py-3.5 mb-4 shadow-xs flex items-center gap-2 flex-wrap">
      <label htmlFor="course-filter" className="text-xs font-bold text-text-2">
        📚 Curso / Materia:
      </label>
      <select
        id="course-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[200px] px-2.5 py-1.5 border border-border rounded text-[13px] bg-surface"
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label} — {c.curso}
          </option>
        ))}
      </select>
    </div>
  );
}
