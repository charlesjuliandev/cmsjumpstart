import {
  cms
} from "./cms";

export async function getPages() {
  const response =
    await cms
      .resource("node--page")
      .fields(
        "title",
        "body"
      )
      .sort("-created")
      .limit(5)
      .get();

  return response.getAll();
}