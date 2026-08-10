import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://www.lookforhelper.co.za";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/browse", changefreq: "daily", priority: "0.9" },
  { path: "/jobs", changefreq: "daily", priority: "0.8" },
  { path: "/institutions", changefreq: "daily", priority: "0.8" },
  { path: "/labour-security", changefreq: "monthly", priority: "0.8" },
  { path: "/contact", changefreq: "yearly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/cancellation-policy", changefreq: "yearly", priority: "0.3" },
];

function loadEnv() {
  try {
    const env = readFileSync(resolve(".env"), "utf-8");
    env.split("\n").forEach((line) => {
      const eq = line.indexOf("=");
      if (eq === -1) return;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch {
    // .env may not exist in CI; rely on process env
  }
}

async function fetchDynamicEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("Supabase env vars missing; skipping dynamic entries");
    return [];
  }

  const supabase = createClient(url, key);
  const entries: SitemapEntry[] = [];

  // Published helpers with the same gating as the public Browse page
  const { data: helpers, error: helpersError } = await supabase
    .from("helper_details")
    .select("user_id")
    .eq("is_published", true)
    .not("city", "is", null)
    .neq("city", "")
    .not("skills", "is", null)
    .not("skills", "eq", "{}");

  if (helpersError) {
    console.warn("helpers fetch failed:", helpersError.message);
  } else if (helpers) {
    helpers.forEach((h) =>
      entries.push({ path: `/helper/${h.user_id}`, changefreq: "weekly", priority: "0.6" })
    );
  }

  // Verified, non-suspended institutions (same gating as public Institutions page)
  const { data: institutions, error: instError } = await supabase
    .from("institutions")
    .select("id")
    .eq("verification_status", "verified")
    .eq("is_suspended", false);

  if (instError) {
    console.warn("institutions fetch failed:", instError.message);
  } else if (institutions) {
    institutions.forEach((i) =>
      entries.push({ path: `/institution/${i.id}`, changefreq: "weekly", priority: "0.6" })
    );
  }

  return entries;
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  loadEnv();
  const dynamic = await fetchDynamicEntries();
  const all = [...staticEntries, ...dynamic];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
  console.log(`sitemap.xml written with ${all.length} entries (${staticEntries.length} static + ${dynamic.length} dynamic)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
