import { defineEventHandler, getRequestURL, getRouterParam, proxyRequest, setResponseStatus } from "h3";

/**
 * Proxy same-origin ke Delcom Open API.
 * Browser memanggil /api/delcom/<path>; server meneruskannya ke VITE_DELCOM_BASEURL.
 * Dengan begitu tidak ada request lintas origin (tidak ada preflight CORS).
 */
export default defineEventHandler(async (event) => {
  const upstream = (process.env.VITE_DELCOM_BASEURL || "https://open-api.delcom.org/api/v1").replace(/\/+$/, "");
  const path = getRouterParam(event, "path") || "";
  const search = getRequestURL(event).search;

  try {
    return await proxyRequest(event, `${upstream}/${path}${search}`);
  } catch (error) {
    setResponseStatus(event, 502);
    return { status: "error", message: `Gagal menghubungi server Delcom: ${(error as Error).message}` };
  }
});