const ACCESS_TOKEN_KEY = "access_token";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface FetchApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: QueryParams;
  body?: Record<string, any> | FormData;
  auth?: boolean;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function putAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function buildUrl(path: string, params?: QueryParams): string {
    const url = new URL(`${DELCOM_BASEURL}${path}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function fetchApi<T = any>(
  path: string,
  options: FetchApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", params, body, auth = true } = options;

  const headers: Record<string, string> = {};

  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    // Content-Type multipart di-set otomatis oleh browser
    requestBody = body;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: requestBody,
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
  }

  let result: ApiResponse<T>;
  try {
    result = await response.json();
  } catch {
    throw new Error("Respons server tidak valid.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(result.message || "Terjadi kesalahan pada server.");
  }

  return result;
}