
interface PreviewModeBannerProps {
  returnPath: string;
}

export function PreviewModeBanner({
  returnPath
}: PreviewModeBannerProps) {
  return (
    <aside
      role="status"
      className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p>
        <strong>Preview mode</strong>
        {" — "}showing Drupal working-copy content.
      </p>

      <form
        action="/exit-preview"
        method="post"
      >
        <input
          type="hidden"
          name="path"
          value={returnPath}
        />

        <button
          type="submit"
          className="rounded-md border border-amber-700 px-3 py-2 font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
        >
          Exit preview
        </button>
      </form>
    </aside>
  );
}
