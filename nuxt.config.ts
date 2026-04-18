import tailwindcss from "@tailwindcss/vite";

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
    highlight: false,
    // Node 22+ has a built-in sqlite module; use it so @nuxt/content
    // does not require the optional better-sqlite3 native dep.
    experimental: { nativeSqlite: true },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ["/"],
    },
  },
});
