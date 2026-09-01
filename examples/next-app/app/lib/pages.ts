import { cms } from "./cms";
export interface PageListItem {
  id: string;
  title: string;
  summary: string;
}
type DrupalPageAttributes = Record<string, unknown> & {
  title?: string;
  body?: {
    value?: string;
    summary?: string;
    processed?: string;
    format?: string;
  };
};
export async function getPages() {
  const response = await cms
    .resource<DrupalPageAttributes>("node--page")
    .fields("title", "body")
    .sort("-created")
    .limit(5)
    .get();
  return response.getAll();
}
