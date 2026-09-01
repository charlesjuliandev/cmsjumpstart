"use client";

import {
  useRouter
} from "next/navigation";

import {
  Button
} from "react-aria-components";

import type {
  PageListItem
} from "../lib/pages";

interface PageListProps {
  pages: PageListItem[];
}

export function PageList({
  pages
}: PageListProps) {
  const router =
    useRouter();

  return (
    <section
      aria-labelledby="pages-heading"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2
            id="pages-heading"
            className="text-2xl font-semibold text-slate-900"
          >
            Pages
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            The five most recently created
            Drupal pages.
          </p>
        </div>

        <Button
          onPress={() => router.refresh()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-blue-700 data-[focus-visible]:ring-2 data-[focus-visible]:ring-blue-600 data-[focus-visible]:ring-offset-2 data-[pressed]:bg-blue-800 motion-reduce:transition-none"
        >
          Refresh
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            No pages were returned.
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {pages.map(page => (
            <li
              key={page.id}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <article>
                <h3 className="text-xl font-semibold text-slate-900">
                  {page.title}
                </h3>

                {page.summary ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {page.summary}
                  </p>
                ) : (
                  <p className="mt-3 text-sm italic text-slate-500">
                    No summary available.
                  </p>
                )}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">
                    ID:{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                      {page.id}
                    </code>
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}