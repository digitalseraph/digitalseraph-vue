import { queryCollection } from "@nuxt/content/server";

export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");

  const site = "https://digitalseraph.com";
  const today = new Date().toISOString().slice(0, 10);

  const staticRoutes = [
    { path: "/", priority: "1.0", changefreq: "monthly" },
    { path: "/about", priority: "0.8", changefreq: "monthly" },
    { path: "/resume", priority: "0.9", changefreq: "monthly" },
    { path: "/work", priority: "0.8", changefreq: "monthly" },
    { path: "/writing", priority: "0.7", changefreq: "weekly" },
    { path: "/contact", priority: "0.5", changefreq: "yearly" },
  ];

  const [projects, posts] = await Promise.all([
    queryCollection(event, "work").order("year", "DESC").all(),
    queryCollection(event, "writing").where("draft", "=", false).order("date", "DESC").all(),
  ]);

  const projectUrls = projects.map((p) => ({
    path: `/work/${p.stem.replace(/^work\//, "")}`,
    priority: "0.7",
    changefreq: "yearly",
    lastmod: today,
  }));

  const postUrls = posts.map((p) => ({
    path: `/writing/${p.stem.replace(/^writing\//, "")}`,
    priority: "0.6",
    changefreq: "yearly",
    lastmod: p.date,
  }));

  const all = [
    ...staticRoutes.map((r) => ({ ...r, lastmod: today })),
    ...projectUrls,
    ...postUrls,
  ];

  const urls = all
    .map(
      (r) => `
  <url>
    <loc>${site}${r.path}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
});
