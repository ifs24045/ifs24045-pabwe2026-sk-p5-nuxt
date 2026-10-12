// @ts-nocheck
import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";
import { deferNuxtCss } from "./server/utils/deferCss";

const customPort = Number(process.env.APP_PORT || process.env.PORT) || 3000;

const delcomBaseUrl =
  process.env.VITE_DELCOM_BASEURL || "https://open-api.delcom.org/api/v1";

// Browser memanggil API lewat proxy same-origin (server/api/delcom/[...path].ts),
// sehingga tidak ada request lintas origin (tanpa preflight CORS).
// Set VITE_DELCOM_DIRECT=true (lalu build ulang) untuk memanggil Delcom langsung.
const useDirectApi = process.env.VITE_DELCOM_DIRECT === "true";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  telemetry: false,

  // Disable SSR for SPA mode (client-side routing and storage)
  ssr: false,

  // Let Nuxt look into src/ for application source files
  srcDir: "src/",

  // Enable vue-router; routes are supplied by src/router.options.ts
  pages: true,

  css: ["~/index.css"],

  modules: ["@pinia/nuxt"],

  vite: {
    plugins: [tailwindcss()],
    define: {
      DELCOM_BASEURL: JSON.stringify(useDirectApi ? delcomBaseUrl : "/api/delcom"),
      DELCOM_UPSTREAM: JSON.stringify(delcomBaseUrl),
    },
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
    },
  },

  // HTML tidak boleh "no-store" agar halaman bisa dipulihkan dari back/forward cache.
  routeRules: {
    "/": { headers: { "cache-control": "public, max-age=0, must-revalidate" } },
    "/auth/**": { headers: { "cache-control": "public, max-age=0, must-revalidate" } },
    "/_nuxt/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
  },

  nitro: {
    preset: "node-server",
    hooks: {
      // Untuk HTML yang di-prerender saat build
      "prerender:generate"(route) {
        if (typeof route.contents === "string" && route.fileName?.endsWith(".html")) {
          route.contents = deferNuxtCss(route.contents);
        }
      },
    },
  },

  devServer: {
    host: "0.0.0.0",
    port: customPort,
  },

  app: {
    head: {
      title: "Delcom Cash Flow",
      meta: [
        {
          name: "description",
          content:
            "Delcom Cash Flow: aplikasi pencatatan pemasukan, pengeluaran, dan saldo arus kas pribadi.",
        },
      ],
      htmlAttrs: {
        lang: "id",
      },
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          // Dimuat non-blocking agar tidak menahan render pertama
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap",
          media: "print",
          onload: "this.media='all'",
        },
      ],
      noscript: [
        {
          innerHTML:
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">',
        },
      ],
      // CSS kritis minimal agar tidak ada flash putih sebelum stylesheet utama aktif
      style: [{ innerHTML: "body{background-color:#f8fafc;color:#0f172a}" }],
      bodyAttrs: {
        class: "bg-slate-50 text-slate-900 font-sans antialiased min-h-screen",
      },
    },
  },
});