import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getPageMetadata,
  PAGE_METADATA,
  routePattern,
  SITE_STRUCTURED_DATA,
} from "./src/seo/metadata.js";

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]
  );
}

export function renderPageMetadata(html, pathname) {
  const page = getPageMetadata(pathname);
  const meta = (attribute, name, content) =>
    `<meta ${attribute}="${name}" content="${escapeHtml(content)}" />`;
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    meta("name", "description", page.description),
    meta("name", "robots", page.robots),
    meta("property", "og:title", page.socialTitle),
    meta("property", "og:description", page.socialDescription),
    meta("name", "twitter:title", page.twitterTitle),
    meta("name", "twitter:description", page.twitterDescription),
  ];
  if (page.url) tags.push(meta("property", "og:url", page.url));
  if (page.canonical) {
    tags.push(`<link rel="canonical" href="${page.canonical}" />`);
    tags.push(
      `<script id="site-structured-data" type="application/ld+json">${JSON.stringify(SITE_STRUCTURED_DATA)}</script>`
    );
  }

  const result = html.replace(
    /<!-- route-metadata:start -->[\s\S]*?<!-- route-metadata:end -->/,
    `<!-- route-metadata:start -->\n${tags.join("\n")}\n<!-- route-metadata:end -->`
  );
  if (page.indexable) return result;

  return result.replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    `<noscript><main><h1>${escapeHtml(page.title)}</h1><p>Habilitá JavaScript para usar Ganker.</p></main></noscript>`
  );
}

// Solo varía el <head>; el contenido de React sigue renderizándose en el cliente.
export default function routeMetadataPlugin() {
  return {
    name: "ganker-route-metadata",
    transformIndexHtml(html, context) {
      const pathname = context.server
        ? new URL(context.originalUrl ?? "/", "http://localhost").pathname
        : "/";
      return renderPageMetadata(html, pathname);
    },
    async writeBundle(options, bundle) {
      const html = bundle["index.html"]?.source;
      if (typeof html !== "string") {
        throw new Error(
          "No se encontró index.html para generar los metadatos por ruta."
        );
      }
      const directory = join(options.dir, "_seo");
      await mkdir(directory, { recursive: true });
      const locations = [];
      for (const [index, page] of PAGE_METADATA.entries()) {
        const entry = index === 0 ? "/index.html" : `/_seo/page-${index}.html`;
        if (index !== 0) {
          await writeFile(
            join(options.dir, entry.slice(1)),
            renderPageMetadata(html, page.path)
          );
        }
        locations.push(
          `location ~* "^${routePattern(page.path)}$" {\n` +
            `    root /usr/share/nginx/html;\n` +
            `    try_files ${entry} =404;\n}`
        );
      }
      await writeFile(
        join(options.dir, "404.html"),
        renderPageMetadata(html, "/404")
      );
      await writeFile(
        join(directory, "routes.conf"),
        "# Generado por seo.config.js desde PAGE_METADATA. No editar.\n\n" +
          locations.join("\n\n") +
          "\n"
      );
    },
  };
}
