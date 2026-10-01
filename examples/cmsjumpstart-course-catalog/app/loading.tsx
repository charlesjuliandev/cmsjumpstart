export default function Loading() {
  return (
    <main
      className="min-h-screen bg-slate-50"
      aria-busy="true"
      aria-label="Loading course catalog"
    >
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            CMSJumpstart Example
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Course Catalog
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            Loading course data from Drupal JSON:API...
          </p>
        </header>

        <section
          aria-labelledby="loading-heading"
        >
          <div className="mb-6">
            <h2
              id="loading-heading"
              className="text-2xl font-semibold text-slate-900"
            >
              Courses
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Loading courses from Drupal.
            </p>
          </div>

          <div
            className="space-y-4"
            aria-hidden="true"
          >
            {Array.from({
              length: 5
            }).map((_, index) => (
              <article
                key={index}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="animate-pulse">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="h-4 w-20 rounded bg-slate-200" />

                      <div className="mt-2 h-6 w-2/3 rounded bg-slate-200" />
                    </div>

                    <div className="h-7 w-20 rounded-full bg-slate-200" />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="h-4 w-24 rounded bg-slate-200" />

                      <div className="mt-2 h-4 w-32 rounded bg-slate-200" />
                    </div>

                    <div>
                      <div className="h-4 w-20 rounded bg-slate-200" />

                      <div className="mt-2 h-4 w-36 rounded bg-slate-200" />
                    </div>

                    <div>
                      <div className="h-4 w-20 rounded bg-slate-200" />

                      <div className="mt-2 h-4 w-40 rounded bg-slate-200" />
                    </div>

                    <div>
                      <div className="h-4 w-20 rounded bg-slate-200" />

                      <div className="mt-2 h-4 w-36 rounded bg-slate-200" />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="h-5 w-24 rounded bg-slate-200" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <p className="sr-only">
            Loading the latest Drupal courses.
          </p>
        </section>
      </div>
    </main>
  );
}