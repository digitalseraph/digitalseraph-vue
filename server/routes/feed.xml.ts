import { queryCollection } from "@nuxt/content/server";

export default defineEventHandler(async (event) => {
  setHeader(event, "Content-Type", "application/rss+xml; charset=utf-8");

  const posts = await queryCollection(event, "writing")
    .where("draft", "=", false)
    .order("date", "DESC")
    .all();

  const site = "https://digitalseraph.com";
  const now = new Date().toUTCString();

  const items = posts
    .map((p) => {
      const slug = p.stem.replace(/^writing\//, "");
      const url = `${site}/writing/${slug}`;
      const pubDate = new Date(p.date + "T00:00:00Z").toUTCString();
      const excerpt = escapeXml(p.excerpt ?? "");
      const title = escapeXml(p.title);
      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${excerpt}</description>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>digitalseraph — writing</title>
    <link>${site}/writing</link>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Occasional notes on engineering, systems, and shipping by David Miller.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>${items}
  </channel>
</rss>`;
});

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
