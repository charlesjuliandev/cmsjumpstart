import {
  draftMode
} from "next/headers";

import {
  notFound
} from "next/navigation";

import Link from "next/link";

import {
  getPage,
  getPreviewPage
} from "../../lib/pages";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({
  params
}: PageProps) {
  const {
    id
  } =
    await params;

  const {
    isEnabled: isDraftMode
  } =
    await draftMode();

  const page =
    isDraftMode
      ? await getPreviewPage(id)
      : await getPage(id);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/"
          className="rounded-sm text-sm font-semibold text-blue-600 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          ← Back to pages
        </Link>

        {isDraftMode ? (
          <div
            role="status"
            className="mt-8 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          >
            Draft Mode is enabled. You are
            viewing Drupal working-copy content.
          </div>
        ) : null}

        <article className="mt-8 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <header>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Drupal Page
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              {page.title}
            </h1>
          </header>

          {page.summary ? (
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {page.summary}
            </p>
          ) : (
            <p className="mt-6 text-sm italic text-slate-500">
              No summary available.
            </p>
          )}

          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-sm text-slate-500">
              ID:{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                {page.id}
              </code>
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}

