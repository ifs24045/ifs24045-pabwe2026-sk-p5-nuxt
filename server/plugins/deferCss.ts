import { defineNitroPlugin } from "nitropack/runtime";
import { deferNuxtCss } from "../utils/deferCss";

// Berlaku untuk HTML yang dirender saat runtime (mis. fallback SPA di server/function).
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:response", (response) => {
    if (typeof response.body === "string" && response.body.includes("/_nuxt/")) {
      response.body = deferNuxtCss(response.body);
    }
  });
});