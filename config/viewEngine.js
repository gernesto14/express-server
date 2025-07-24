import path from "path";

export function setupViewEngine(app) {
  app.set(
    "views",
    path.join(path.dirname(new URL(import.meta.url).pathname), "views")
  );
  app.set("view engine", "jade");
}
