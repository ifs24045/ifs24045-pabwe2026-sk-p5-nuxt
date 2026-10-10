import { spawn } from "child_process";
import { config } from "dotenv";

config();

const port = process.env.APP_PORT || process.env.PORT || 3000;
process.env.PORT = port;

console.log(`Menjalankan Nuxt preview pada port ${port}...`);

const nuxtPreview = spawn("npx", ["nuxt", "preview", "--port", port], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

nuxtPreview.on("close", (code) => {
  process.exit(code);
});