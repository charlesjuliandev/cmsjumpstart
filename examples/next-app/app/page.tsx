import {
  getPages
} from "./lib/pages";

export default async function HomePage() {
  const pages =
    await getPages();

  return (
    <main>
      <h1>
        CMSJumpstart Next.js Example
      </h1>

      <p>
        Successfully connected to Drupal.
      </p>

      <h2>
        Pages
      </h2>

      {pages.length === 0 ? (
        <p>
          No pages were returned.
        </p>
      ) : (
        <ul>
          {pages.map(page => (
            <li key={page.id}>
              <h3>
                {String(
                  page.attributes.title ??
                    "Untitled"
                )}
              </h3>

              <p>
                ID: {page.id}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}