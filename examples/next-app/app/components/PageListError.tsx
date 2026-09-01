export interface PageListErrorProps {
  message?: string;
}

export function PageListError({
  message =
    "We couldn't load pages from Drupal right now."
}: PageListErrorProps) {
  return (
    <section
      aria-labelledby="pages-error-heading"
      className="rounded-lg border border-red-200 bg-red-50 p-8"
    >
      <h2
        id="pages-error-heading"
        className="text-lg font-semibold text-red-900"
      >
        Unable to load pages
      </h2>

      <p className="mt-2 text-sm leading-6 text-red-800">
        {message}
      </p>

      <p className="mt-4 text-sm leading-6 text-red-700">
        The Drupal API may be temporarily unavailable.
        Please try again later.
      </p>
    </section>
  );
}
