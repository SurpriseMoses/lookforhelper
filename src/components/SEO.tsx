import { useEffect } from "react";

const SITE_URL = "https://www.lookforhelper.co.za";
const SITE_NAME = "Look For Helper";

interface SEOProps {
  title: string;
  description: string;
  /** Path including leading slash, e.g. "/browse". Defaults to current path. */
  path?: string;
  /** Optional JSON-LD object (single or array) — injected as application/ld+json */
  jsonLd?: object | object[];
  ogImage?: string;
  ogType?: "website" | "article" | "profile";
  noindex?: boolean;
}

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const SEO = ({ title, description, path, jsonLd, ogImage, ogType = "website", noindex }: SEOProps) => {
  useEffect(() => {
    const fullTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
    document.title = fullTitle;

    const url = `${SITE_URL}${path ?? window.location.pathname}`;

    setMeta('meta[name="description"]', "name", "description", description);
    setLink("canonical", url);

    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    setMeta('meta[property="og:type"]', "property", "og:type", ogType);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    if (ogImage) {
      setMeta('meta[property="og:image"]', "property", "og:image", ogImage);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", ogImage);
    }
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);

    if (noindex) {
      setMeta('meta[name="robots"]', "name", "robots", "noindex,nofollow");
    } else {
      const robots = document.head.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }

    // Per-route JSON-LD (tagged so we can clean up on unmount/route change)
    const existing = document.head.querySelectorAll('script[data-seo-jsonld="route"]');
    existing.forEach((n) => n.remove());
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "route");
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.head.querySelectorAll('script[data-seo-jsonld="route"]').forEach((n) => n.remove());
    };
  }, [title, description, path, ogImage, ogType, noindex, JSON.stringify(jsonLd)]);

  return null;
};

export default SEO;
