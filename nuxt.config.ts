import tailwindcss from "@tailwindcss/vite";
import type { ThemeRegistrationRaw } from "shiki";
import digitalseraphDarkRaw from "./app/assets/shiki/digitalseraph-dark.json";
// Deep-clone the raw JSON. Without this, @nuxt/content's config serialization
// (via klona) crashes with "Maximum call stack size exceeded" because Shiki
// mutates the imported module object with circular references during theme
// normalization.
const digitalseraphDark = JSON.parse(JSON.stringify(digitalseraphDarkRaw));

export default defineNuxtConfig({
  compatibilityDate: "2026-04-18",
  devtools: { enabled: true },

  modules: [
    "@pinia/nuxt",
    "@nuxt/content",
  ],

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: "digitalseraph",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "David Miller — engineer, builder, maker." },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  content: {
    // Node 22+ has a built-in sqlite module; use it so @nuxt/content
    // does not require the optional better-sqlite3 native dep.
    experimental: { sqliteConnector: "native" },
    build: {
      markdown: {
        highlight: {
          // @nuxt/content 3.13 requires the multi-theme object shape for the
          // `theme` option even when you only ship one theme. A flat
          // `theme: digitalseraphDark` fails schema validation — it iterates
          // the theme's keys via Object.entries and tries to resolve each
          // value as a bundled Shiki theme name.
          theme: { default: digitalseraphDark as ThemeRegistrationRaw },
          langs: [
            "ts",
            "js",
            "vue",
            "bash",
            "shell",
            "css",
            "html",
            "json",
            "yaml",
            "md",
            "diff",
          ],
        },
      },
    },
  },

  nitro: {
    preset: "static",
    prerender: {
      crawlLinks: true,
      routes: ["/"],
    },
  },
});
