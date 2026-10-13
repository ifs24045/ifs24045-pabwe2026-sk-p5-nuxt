import { defineEventHandler, getRequestURL, getRouterParam, proxyRequest, setResponseStatus } from "h3";

/**
 * Proxy same-origin ke Delcom Open API.
 * Browser memanggil /api/delcom/<path>; server meneruskannya ke VITE_DELCOM_BASEURL.
 */
export default defineEventHandler(async (event) => {
  const envUrl = process.env.VITE_DELCOM_BASEURL || "";
  const upstream = (/^https?:\/\//.test(envUrl) ? envUrl : "https://open-api.delcom.org/api/v1").replace(/\/+$/, "");
  const path = getRouterParam(event, "path") || "";
  const search = getRequestURL(event).search;

  try {
    const upstreamUrl = new URL(upstream);
    return await proxyRequest(event, `${upstream}/${path}${search}`, {
      headers: {
        host: upstreamUrl.host,
      },
    });
  } catch (error) {
    setResponseStatus(event, 502);
    return { status: "error", message: `Gagal menghubungi server Delcom: ${(error as Error).message}` };
  }
});