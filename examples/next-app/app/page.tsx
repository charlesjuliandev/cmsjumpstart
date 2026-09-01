import {
  getPages
} from "./lib/pages";

import {
  PageList
} from "./components/PageList";

function createSummary(
  value: unknown,
  maxLength = 160
): string {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return "";
  }

  const body =
    value as {
      value?: unknown;

      summary?: unknown;

      processed?: unknown;
    };

  const source =
    typeof body.summary === "string" &&
    body.summary.trim()
      ? body.summary
      : typeof body.processed === "string" &&
          body.processed.trim()
        ? body.processed
        : typeof body.value === "string"
          ? body.value
          : "";

  if (!source) {
    return "";
  }

  const text =
    source
      .replace(
        /<[^>]*>/g,
        " "
      )
      .replace(
        /&nbsp;/gi,
        " "
      )
      .replace(
        /&amp;/gi,
        "&"
      )
      .replace(
        /&lt;/gi,
        "<"
      )
      .replace(
        /&gt;/gi,
        ">"
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    text.length <= maxLength
  ) {
    return text;
  }

  return `${text
    .slice(0, maxLength)
    .trimEnd()}…`;
}

export default async function HomePage() {
  const pages =
    await getPages();

  const pageItems =
    pages.map(page => ({
      id: page.id,

      title: String(
        page.attributes.title ??
          "Untitled"
      ),

      summary:
        createSummary(
          page.attributes.body
        )
    }));

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
        </header>

        <PageList
          pages={pageItems}
        />
      </div>
    </main>
  );
}