import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getPageMetadata, SITE_STRUCTURED_DATA } from "../../seo/metadata.js";

function updateMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = getPageMetadata(pathname);
    document.title = page.title;
    updateMeta("name", "description", page.description);
    updateMeta("name", "robots", page.robots);
    updateMeta("property", "og:title", page.socialTitle);
    updateMeta("property", "og:description", page.socialDescription);
    updateMeta("property", "og:url", page.url);
    updateMeta("name", "twitter:title", page.twitterTitle);
    updateMeta("name", "twitter:description", page.twitterDescription);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    let structuredData = document.getElementById("site-structured-data");
    if (page.canonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = page.canonical;
      if (!structuredData) {
        structuredData = document.createElement("script");
        structuredData.id = "site-structured-data";
        structuredData.type = "application/ld+json";
        document.head.appendChild(structuredData);
      }
      structuredData.textContent = JSON.stringify(SITE_STRUCTURED_DATA);
    } else {
      canonical?.remove();
      structuredData?.remove();
    }
  }, [pathname]);

  return null;
}

export default RouteMetadata;
