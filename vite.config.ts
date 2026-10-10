import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import process from "process";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.APP_PORT || env.PORT) || 3000;

  return {
       plugins: [
      vue({
        template: { transformAssetUrls: { includeAbsolute: false } },
      }),
      tailwindcss(),
    ],
    preview: {
      port,
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(
        env.VITE_DELCOM_BASEURL || "https://open-api.delcom.org/api/v1"
      ),
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        include: ["src/**/*.{js,ts,vue}"],
        exclude: [
          "src/main.ts",
          "src/router.options.ts",
          "src/setupTests.ts",
          "src/test-utils.ts",
          "src/**/*.d.ts",
          "**/*.test.{js,ts,jsx,tsx}",
          "node_modules/**",
          ".docs/**",
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  };
});