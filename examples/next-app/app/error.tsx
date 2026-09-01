"use client";

import {
  Button
} from "react-aria-components";

interface ErrorPageProps {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
}

export default function ErrorPage({
  reset
}: ErrorPageProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
            CMSJumpstart
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Something went wrong
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            We were unable to load this page.
            This may be a temporary problem.
          </p>
        </header>

        <section
          aria-labelledby="error-heading"
          className="rounded-lg border border-red-200 bg-white p-8 shadow-sm"
        >
          <h2
            id="error-heading"
            className="text-xl font-semibold text-slate-900"
          >
            We couldn't load the content
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Please try again. If the problem
            continues, try again later.
          </p>

          <div className="mt-6">
            <Button
              onPress={reset}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 data-[pressed]:bg-blue-800"
            >
              Try again
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}