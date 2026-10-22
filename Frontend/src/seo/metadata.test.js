import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getPageMetadata, NOT_FOUND_METADATA } from "./metadata.js";

// Lee las rutas declaradas en AppRouter, resolviendo las anidadas.
function routerPaths() {
  const source = readFileSync("src/routes/AppRouter.jsx", "utf8");
  const paths = [];
  const parents = [];
  const tags = /<Route\b|<\/Route>/g;
  let match;
  while ((match = tags.exec(source))) {
    if (match[0] === "</Route>") {
      parents.pop();
      continue;
    }
    // Avanza hasta el cierre del tag ignorando los ">" dentro de {...}.
    let depth = 0;
    let end = match.index;
    while (source[end] !== ">" || depth > 0) {
      if (source[end] === "{") depth++;
      if (source[end] === "}") depth--;
      end++;
    }
    const tag = source.slice(match.index, end);
    const path = tag.match(/\spath="([^"]*)"/)?.[1];
    const parent = parents.at(-1) ?? "";
    const full = path
      ? path.startsWith("/")
        ? path
        : `${parent}/${path}`
      : parent;
    if ((path || /\sindex\b/.test(tag)) && path !== "*") paths.push(full);
    if (!tag.endsWith("/")) parents.push(full);
    tags.lastIndex = end;
  }
  return [...new Set(paths)];
}

describe("PAGE_METADATA", () => {
  it.each(routerPaths())(
    "%s de AppRouter tiene metadatos (si no, Nginx la sirve como 404)",
    (path) => {
      const page = getPageMetadata(path.replace(/:[^/]+/g, "1"));
      expect(page.title).not.toBe(NOT_FOUND_METADATA.title);
      expect(page.path).toBe(path);
    }
  );
});
