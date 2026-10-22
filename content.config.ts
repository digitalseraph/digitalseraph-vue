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
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
        tags: z.array(z.string()).default([]),
        description: z.string(),
        draft: z.boolean().default(false),
      }),
    }),
    resume: defineCollection({
      type: "data",
      source: "resume.yml",
      schema: z.object({
        header: z.object({
          name: z.string(),
          title: z.string(),
          subtitle: z.string().optional(),
          location: z.string(),
          email: z.string(),
          github: z.string(),
          linkedin: z.string(),
        }),
        summary: z.string(),
        experience: z.array(z.object({
          role: z.string(),
          company: z.string(),
          location: z.string(),
          start: z.string(),
          end: z.string(),
          bullets: z.array(z.string()),
          tech: z.array(z.string()),
          freelance: z.boolean().optional(),
        })),
        education: z.array(z.object({
          school: z.string(),
          location: z.string(),
          degree: z.string(),
          field: z.string().optional(),
          year: z.number(),
        })),
        certifications: z.array(z.object({
          name: z.string(),
          code: z.string().optional(),
          issued: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "issued must be YYYY-MM or YYYY-MM-DD"),
        })),
        skills: z.array(z.object({
          group: z.string(),
          items: z.array(z.string()),
        })),
        contact: z.object({
          email: z.string(),
          github: z.string(),
          linkedin: z.string(),
        }),
      }),
    }),
  },
});
