import { defineNitroPlugin } from "nitropack/runtime";
import { deferNuxtCss } from "../utils/deferCss";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (htmlContext: any) => {
    if (Array.isArray(htmlContext.head)) {
      htmlContext.head = htmlContext.head.map((tag: string) => deferNuxtCss(tag));
    }
  });

  nitroApp.hooks.hook("beforeResponse", (_event: any, response: any) => {
    if (typeof response?.body === "string" && response.body.includes(".css")) {
      response.body = deferNuxtCss(response.body);
    }
  });
});