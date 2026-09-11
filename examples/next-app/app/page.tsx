import {
  draftMode
} from "next/headers";

import {
  getPages,
  getPreviewPages
} from "./lib/pages";

import {
  PageList
} from "./components/PageList";

export default async function HomePage() {
  const {
    isEnabled: isDraftMode
  } =
    await draftMode();

  const pages =
    isDraftMode
      ? await getPreviewPages()
      : await getPages();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
            CMSJumpstart
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Next.js Example
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            A production-oriented Next.js example
            powered by Drupal JSON:API,
            CMSJumpstart, Tailwind CSS, and
            React Aria Components.
          </p>

          {isDraftMode ? (
            <div
              role="status"
              className="mt-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
            >
              Draft Mode is enabled. You are
              viewing Drupal working-copy content.
            </div>
          ) : null}
        </header>

        <PageList
          pages={pages}
        />
      </div>
    </main>
  );
}