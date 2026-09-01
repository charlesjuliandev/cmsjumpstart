export default function Loading() {
  return (
    <main
      className="min-h-screen bg-slate-50"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
            CMSJumpstart
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Next.js Example
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Loading content from Drupal JSON:API...
          </p>
        </header>

        <section
          aria-labelledby="loading-heading"
        >
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2
                id="loading-heading"
                className="text-2xl font-semibold text-slate-900"
              >
                Pages
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                The five most recently created
                Drupal pages.
              </p>
            </div>

            <div
              className="h-9 w-20 animate-pulse rounded-md bg-slate-200"
              aria-hidden="true"
            />
          </div>

          <ul
            className="grid gap-6 md:grid-cols-2"
            aria-hidden="true"
          >
            {Array.from({
              length: 5
            }).map((_, index) => (
              <li
                key={index}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <article className="animate-pulse">
                  <div className="h-7 w-3/4 rounded bg-slate-200" />

                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-full rounded bg-slate-200" />

                    <div className="h-4 w-11/12 rounded bg-slate-200" />

                    <div className="h-4 w-2/3 rounded bg-slate-200" />
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <p className="sr-only">
            Loading the latest Drupal pages.
          </p>
        </section>
      </div>
    </main>
  );
}