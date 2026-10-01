import {
  Suspense
} from "react";

import {
  draftMode
} from "next/headers";

import {
  notFound
} from "next/navigation";

import Link from "next/link";

import {
  getCourse,
  getPreviewCourse
} from "../../lib/courses";

interface CoursePageProps {
  params: Promise<{
    id: string;
  }>;
}

function CourseDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
      >
        ← Back to course catalog
      </Link>

      <div
        className="mt-8 animate-pulse"
        aria-label="Loading course"
      >
        <div className="border-b border-slate-200 pb-8">
          <div className="h-4 w-20 rounded bg-slate-200" />

          <div className="mt-3 h-10 w-2/3 rounded bg-slate-200" />

          <div className="mt-4 h-6 w-24 rounded bg-slate-200" />
        </div>

        <div className="mt-8">
          <div className="h-6 w-48 rounded bg-slate-200" />

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {Array.from({
              length: 5
            }).map((_, index) => (
              <div key={index}>
                <div className="h-4 w-24 rounded bg-slate-200" />

                <div className="mt-2 h-5 w-40 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

async function CourseDetail({
  params
}: CoursePageProps) {
  const { id } = await params;

  const {
    isEnabled: isPreview
  } = await draftMode();

  const course =
    isPreview
      ? await getPreviewCourse(id)
      : await getCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/"
        className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
      >
        ← Back to course catalog
      </Link>

      {isPreview && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Preview mode — showing Drupal working-copy content.
        </div>
      )}

      <article className="mt-8">
        <header className="border-b border-slate-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {course.courseCode}
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            {course.title}
          </h1>

          <p className="mt-4 text-lg text-slate-600">
            {course.credits ?? "—"} credits
          </p>
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Course Information
          </h2>

          <dl className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">
                Department
              </dt>

              <dd className="mt-1 text-slate-900">
                {course.department}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">
                Instructor
              </dt>

              <dd className="mt-1 text-slate-900">
                {course.instructor}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">
                Meeting Days
              </dt>

              <dd className="mt-1 text-slate-900">
                {course.meetingDays}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">
                Time
              </dt>

              <dd className="mt-1 text-slate-900">
                {course.startTime}–{course.endTime}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-500">
                Location
              </dt>

              <dd className="mt-1 text-slate-900">
                {course.location}
              </dd>
            </div>
          </dl>
        </section>

        {course.description && (
          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Description
            </h2>

            <p className="mt-4 whitespace-pre-line leading-7 text-slate-600">
              {course.description}
            </p>
          </section>
        )}

        {course.prerequisites.length > 0 && (
          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Prerequisites
            </h2>

            <ul className="mt-4 space-y-2">
              {course.prerequisites.map(
                prerequisite => (
                  <li key={prerequisite.id}>
                    <Link
                      href={`/courses/${prerequisite.id}`}
                      className="text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      {prerequisite.title}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500">
            Drupal resource ID: {course.id}
          </p>
        </footer>
      </article>
    </main>
  );
}

export default function CoursePage({
  params
}: CoursePageProps) {
  return (
    <Suspense
      fallback={
        <CourseDetailLoading />
      }
    >
      <CourseDetail
        params={params}
      />
    </Suspense>
  );
}
