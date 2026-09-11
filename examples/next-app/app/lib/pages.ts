import {
  cacheLife,
  cacheTag
} from "next/cache";

import {
  cms
} from "./cms";

export interface PageListItem {
  id: string;

  title: string;

  summary: string;
}

type DrupalPageAttributes =
  Record<string, unknown> & {
    title?: string;

    body?: {
      value?: string;

      summary?: string;

      processed?: string;

      format?: string;
    };
  };

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

function toPageListItem(
  page: {
    id: string;

    attributes: DrupalPageAttributes;
  }
): PageListItem {
  return {
    id: page.id,

    title: String(
      page.attributes.title ??
        "Untitled"
    ),

    summary:
      createSummary(
        page.attributes.body
      )
  };
}

export async function getPages(): Promise<
  PageListItem[]
> {
  "use cache";

  cacheLife("hours");

  cacheTag(
    "cmsjumpstart:drupal:node--page"
  );

  const response =
    await cms
      .resource<
        DrupalPageAttributes
      >("node--page")
      .fields(
        "title",
        "body"
      )
      .sort("-created")
      .limit(5)
      .get();

  const pages =
    response.getAll();

  return pages.map(
    toPageListItem
  );
}

export async function getPage(
  id: string
): Promise<
  PageListItem | null
> {
  "use cache";

  cacheLife("hours");

  cacheTag(
    "cmsjumpstart:drupal:node--page"
  );

  cacheTag(
    `cmsjumpstart:drupal:node--page:${id}`
  );

  const response =
    await cms
      .resource<
        DrupalPageAttributes
      >("node--page")
      .id(id)
      .fields(
        "title",
        "body"
      )
      .get();

  const page =
    response.getAll()[0];

  if (!page) {
    return null;
  }

  return toPageListItem(
    page
  );
}

export async function getPreviewPage(
  id: string
): Promise<
  PageListItem | null
> {
  const response =
    await cms
      .resource<
        DrupalPageAttributes
      >("node--page")
      .id(id)
      .resourceVersion(
        "rel:working-copy"
      )
      .fields(
        "title",
        "body"
      )
      .get();

  const page =
    response.getAll()[0];

  if (!page) {
    return null;
  }

  return toPageListItem(
    page
  );
}

export async function getPreviewPages(): Promise<
  PageListItem[]
> {
  const response =
    await cms
      .resource<
        DrupalPageAttributes
      >("node--page")
      .resourceVersion(
        "rel:working-copy"
      )
      .fields(
        "title",
        "body"
      )
      .sort("-created")
      .limit(5)
      .get();

  const pages =
    response.getAll();

  return pages.map(
    toPageListItem
  );
}

