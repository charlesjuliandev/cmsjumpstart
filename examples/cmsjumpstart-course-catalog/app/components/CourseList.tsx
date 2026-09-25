"use client";

import {
  Link
} from "react-aria-components";

import type {
  CourseListItem
} from "../lib/courses";

interface CourseListProps {
  courses: CourseListItem[];
  preview?: boolean;
}

export function CourseList({
  courses,
  preview = false
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-600">
          No courses were found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {preview && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Preview mode — showing Drupal working-copy content.
        </div>
      )}

      {courses.map((course) => (
        <article
          key={course.id}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {course.courseCode}
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {course.title}
              </h2>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              {course.credits ?? "—"} credits
            </span>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">
                Department
              </dt>
              <dd className="text-slate-900">
                {course.department}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">
                Instructor
              </dt>
              <dd className="text-slate-900">
                {course.instructor}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">
                Schedule
              </dt>
              <dd className="text-slate-900">
                {course.meetingDays}{" "}
                {course.startTime}–{course.endTime}
              </dd>
            </div>

            <div>
              <dt className="font-medium text-slate-500">
                Location
              </dt>
              <dd className="text-slate-900">
                {course.location}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <Link
              href={`/courses/${course.id}`}
              className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
            >
              View course
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}