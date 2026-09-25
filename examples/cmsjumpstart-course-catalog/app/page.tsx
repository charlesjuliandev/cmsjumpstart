import {
  draftMode
} from "next/headers";

import {
  CourseList
} from "./components/CourseList";

import {
  getCourses,
  getPreviewCourses
} from "./lib/courses";

export default async function HomePage() {
  const { isEnabled: isPreview } =
    await draftMode();

  const courses =
    isPreview
      ? await getPreviewCourses()
      : await getCourses();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          CMSJumpstart Example
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
          Course Catalog
        </h1>

        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Real Drupal Course content delivered through
          Drupal JSON:API, CMSJumpstart, and Next.js.
        </p>
      </header>

      <CourseList
        courses={courses}
        preview={isPreview}
      />
    </main>
  );
}