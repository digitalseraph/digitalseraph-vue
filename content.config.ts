import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    about: defineCollection({
      type: "page",
      source: "about.md",
    }),
    work: defineCollection({
      type: "page",
      source: "work/*.md",
      schema: z.object({
        title: z.string(),
        year: z.number(),
        role: z.string(),
        stack: z.array(z.string()),
        cover: z.string().optional(),
        featured: z.boolean().default(false),
        summary: z.string(),
        links: z.object({
          live: z.string().optional(),
          repo: z.string().optional(),
          writeup: z.string().optional(),
        }).optional(),
      }),
    }),
    writing: defineCollection({
      type: "page",
      source: "writing/*.md",
      schema: z.object({
        title: z.string(),
        date: z.string(),
        tags: z.array(z.string()).default([]),
        excerpt: z.string(),
        draft: z.boolean().default(false),
      }),
    }),
  },
});
