import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMe,
  getUserInitials,
  getUsers,
  postMePhoto,
  putMe,
  putMePassword,
  resolvePhotoUrl,
} from "./userApi";
import { fetchApi } from "../../../helpers/apiHelper";

vi.mock("../../../helpers/apiHelper", () => ({
  fetchApi: vi.fn(),
}));

const fetchApiMock = vi.mocked(fetchApi);

beforeEach(() => {
  fetchApiMock.mockReset();
});

describe("pemanggilan API", () => {
  it("getUsers memanggil GET /users", async () => {
    const response = { success: true, message: "ok", data: { users: [] } };
    fetchApiMock.mockResolvedValue(response);

    const result = await getUsers();

    expect(fetchApiMock).toHaveBeenCalledWith("/users");
    expect(result).toBe(response);
  });

  it("getMe memanggil GET /users/me", async () => {
    const response = { success: true, message: "ok", data: { user: {} } };
    fetchApiMock.mockResolvedValue(response);

    const result = await getMe();

    expect(fetchApiMock).toHaveBeenCalledWith("/users/me");
    expect(result).toBe(response);
  });

  it("putMe mengirim PUT /users/me dengan nama dan email", async () => {
    fetchApiMock.mockResolvedValue({ success: true, message: "ok", data: null });
    const payload = { name: "Budi", email: "budi@mail.com" };

    await putMe(payload);

    expect(fetchApiMock).toHaveBeenCalledWith("/users/me", {
      method: "PUT",
      body: payload,
    });
  });

  it("postMePhoto mengirim berkas sebagai FormData bernama 'photo'", async () => {
    fetchApiMock.mockResolvedValue({ success: true, message: "ok", data: null });
    const file = new File(["isi"], "foto.png", { type: "image/png" });

    await postMePhoto(file);

    const [path, options] = fetchApiMock.mock.calls[0];
    expect(path).toBe("/users/me/photo");
    expect(options?.method).toBe("POST");
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get("photo")).toBe(file);
  });

  it("putMePassword mengirim PUT /users/me/password", async () => {
    fetchApiMock.mockResolvedValue({ success: true, message: "ok", data: null });
    const payload = { password: "lama123", new_password: "baru1234" };

    await putMePassword(payload);

    expect(fetchApiMock).toHaveBeenCalledWith("/users/me/password", {
      method: "PUT",
      body: payload,
    });
  });
});

describe("resolvePhotoUrl", () => {
  it("mengembalikan null untuk nilai kosong", () => {
    expect(resolvePhotoUrl(null)).toBeNull();
    expect(resolvePhotoUrl(undefined)).toBeNull();
    expect(resolvePhotoUrl("")).toBeNull();
  });

  it("mengembalikan URL absolut apa adanya", () => {
    expect(resolvePhotoUrl("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png"
    );
    expect(resolvePhotoUrl("HTTP://cdn.example.com/a.png")).toBe(
      "HTTP://cdn.example.com/a.png"
    );
  });

  it("menggabungkan path relatif dengan base URL", () => {
    expect(resolvePhotoUrl("uploads/a.png")).toBe(`${DELCOM_BASEURL}/uploads/a.png`);
  });

  it("membuang garis miring di awal path relatif", () => {
    expect(resolvePhotoUrl("/uploads/a.png")).toBe(
      `${DELCOM_BASEURL}/uploads/a.png`
    );
  });
});

describe("getUserInitials", () => {
  it("mengembalikan tanda tanya bila nama kosong", () => {
    expect(getUserInitials(undefined)).toBe("?");
    expect(getUserInitials(null)).toBe("?");
    expect(getUserInitials("")).toBe("?");
  });

  it("mengambil satu huruf dari nama satu kata", () => {
    expect(getUserInitials("budi")).toBe("B");
  });

  it("mengambil dua huruf awal dari nama lebih dari satu kata", () => {
    expect(getUserInitials("budi santoso")).toBe("BS");
    expect(getUserInitials("Thimoty Geraldino Sianipar")).toBe("TG");
  });

  it("mengabaikan spasi berlebih", () => {
    expect(getUserInitials("   ani    wijaya  ")).toBe("AW");
  });
});