import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchApi,
  getAccessToken,
  putAccessToken,
  removeAccessToken,
} from "./apiHelper";

function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("token storage", () => {
  it("mengembalikan null bila token belum tersimpan", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("menyimpan dan membaca token", () => {
    putAccessToken("abc123");
    expect(getAccessToken()).toBe("abc123");
  });

  it("menghapus token", () => {
    putAccessToken("abc123");
    removeAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});

describe("fetchApi", () => {
  it("melakukan GET tanpa params dan tanpa body", async () => {
    const fetchMock = mockFetch({ success: true, message: "ok", data: {} });

    await fetchApi("/cash-flows");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${DELCOM_BASEURL}/cash-flows`);
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });

  it("menambahkan query params dan melewati nilai kosong", async () => {
    const fetchMock = mockFetch({ success: true, message: "ok", data: {} });

    await fetchApi("/cash-flows", {
      params: {
        type: "inflow",
        label: "",
        source: undefined,
        start_date: null,
        page: 5,
        flag: false,
      },
    });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("type")).toBe("inflow");
    expect(url.searchParams.get("page")).toBe("5");
    expect(url.searchParams.get("flag")).toBe("false");
    expect(url.searchParams.has("label")).toBe(false);
    expect(url.searchParams.has("source")).toBe(false);
    expect(url.searchParams.has("start_date")).toBe(false);
  });

  it("menyertakan header Bearer bila token tersedia", async () => {
    putAccessToken("token-rahasia");
    const fetchMock = mockFetch({ success: true, message: "ok", data: {} });

    await fetchApi("/users/me");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer token-rahasia"
    );
  });

  it("tidak menyertakan Authorization bila token tidak ada", async () => {
    const fetchMock = mockFetch({ success: true, message: "ok", data: {} });

    await fetchApi("/users/me");

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("tidak menyertakan Authorization bila auth=false", async () => {
    putAccessToken("token-rahasia");
    const fetchMock = mockFetch({ success: true, message: "ok", data: {} });

    await fetchApi("/auth/login", { method: "POST", auth: false, body: {} });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("mengirim body JSON beserta Content-Type", async () => {
    const fetchMock = mockFetch({ success: true, message: "ok", data: {} });

    await fetchApi("/cash-flows", { method: "POST", body: { label: "Gaji" } });

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ label: "Gaji" }));
  });

  it("mengirim FormData apa adanya tanpa Content-Type manual", async () => {
    const fetchMock = mockFetch({ success: true, message: "ok", data: {} });
    const formData = new FormData();
    formData.append("photo", new File(["x"], "foto.png", { type: "image/png" }));

    await fetchApi("/users/me/photo", { method: "POST", body: formData });

    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe(formData);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("melempar error saat jaringan gagal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(fetchApi("/users")).rejects.toThrow(
      "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
    );
  });

  it("melempar error bila respons bukan JSON valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("bukan json");
        },
      })
    );

    await expect(fetchApi("/users")).rejects.toThrow(
      "Respons server tidak valid."
    );
  });

  it("melempar pesan dari server saat response tidak ok", async () => {
    mockFetch({ success: false, message: "Token tidak valid" }, false);

    await expect(fetchApi("/users")).rejects.toThrow("Token tidak valid");
  });

  it("memakai pesan bawaan bila server tidak mengirim pesan", async () => {
    mockFetch({}, false);

    await expect(fetchApi("/users")).rejects.toThrow(
      "Terjadi kesalahan pada server."
    );
  });

  it("melempar error bila success=false walau status ok", async () => {
    mockFetch({ success: false, message: "Gagal diproses" }, true);

    await expect(fetchApi("/users")).rejects.toThrow("Gagal diproses");
  });

  it("mengembalikan hasil bila sukses", async () => {
    const body = { success: true, message: "Berhasil", data: { id: 1 } };
    mockFetch(body);

    await expect(fetchApi("/users/1")).resolves.toEqual(body);
  });
});