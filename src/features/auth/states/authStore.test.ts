import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAuthStore } from "./authStore";
import { postLogin, postRegister } from "../api/authApi";
import { getAccessToken, putAccessToken } from "../../../helpers/apiHelper";

vi.mock("../api/authApi", () => ({
  postLogin: vi.fn(),
  postRegister: vi.fn(),
}));

const postLoginMock = vi.mocked(postLogin);
const postRegisterMock = vi.mocked(postRegister);

function createStore() {
  setActivePinia(createPinia());
  return useAuthStore();
}

beforeEach(() => {
  postLoginMock.mockReset();
  postRegisterMock.mockReset();
});

describe("state awal", () => {
  it("token null dan belum terautentikasi bila tidak ada token tersimpan", () => {
    const store = createStore();

    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.isAuthLogin).toBe(false);
    expect(store.isAuthRegister).toBe(false);
  });

  it("membaca token yang sudah tersimpan di localStorage", () => {
    putAccessToken("token-lama");

    const store = createStore();

    expect(store.token).toBe("token-lama");
    expect(store.isAuthenticated).toBe(true);
  });
});

describe("login", () => {
  const payload = { email: "a@b.com", password: "rahasia" };

  it("menyimpan token dan mengembalikan hasil sukses", async () => {
    postLoginMock.mockResolvedValue({
      success: true,
      message: "Login berhasil",
      data: { token: "token-baru" },
    });
    const store = createStore();

    const result = await store.login(payload);

    expect(postLoginMock).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, message: "Login berhasil" });
    expect(store.token).toBe("token-baru");
    expect(store.isAuthenticated).toBe(true);
    expect(getAccessToken()).toBe("token-baru");
    expect(store.isAuthLogin).toBe(false);
  });

  it("menandai isAuthLogin selama proses berlangsung", async () => {
    let resolveLogin!: (value: any) => void;
    postLoginMock.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );
    const store = createStore();

    const pending = store.login(payload);
    expect(store.isAuthLogin).toBe(true);

    resolveLogin({ success: true, message: "ok", data: { token: "t" } });
    await pending;

    expect(store.isAuthLogin).toBe(false);
  });

  it("mengembalikan pesan error dan tidak menyimpan token saat gagal", async () => {
    postLoginMock.mockRejectedValue(new Error("Email atau password salah"));
    const store = createStore();

    const result = await store.login(payload);

    expect(result).toEqual({
      success: false,
      message: "Email atau password salah",
    });
    expect(store.token).toBeNull();
    expect(getAccessToken()).toBeNull();
    expect(store.isAuthLogin).toBe(false);
  });
});

describe("register", () => {
  const payload = { name: "Budi", email: "a@b.com", password: "rahasia" };

  it("mengembalikan hasil sukses tanpa menyimpan token", async () => {
    postRegisterMock.mockResolvedValue({
      success: true,
      message: "Registrasi berhasil",
      data: null,
    });
    const store = createStore();

    const result = await store.register(payload);

    expect(postRegisterMock).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ success: true, message: "Registrasi berhasil" });
    expect(store.token).toBeNull();
    expect(store.isAuthRegister).toBe(false);
  });

  it("menandai isAuthRegister selama proses berlangsung", async () => {
    let resolveRegister!: (value: any) => void;
    postRegisterMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRegister = resolve;
      })
    );
    const store = createStore();

    const pending = store.register(payload);
    expect(store.isAuthRegister).toBe(true);

    resolveRegister({ success: true, message: "ok", data: null });
    await pending;

    expect(store.isAuthRegister).toBe(false);
  });

  it("mengembalikan pesan error saat gagal", async () => {
    postRegisterMock.mockRejectedValue(new Error("Email sudah terdaftar"));
    const store = createStore();

    const result = await store.register(payload);

    expect(result).toEqual({
      success: false,
      message: "Email sudah terdaftar",
    });
    expect(store.isAuthRegister).toBe(false);
  });
});

describe("logout", () => {
  it("menghapus token dari state dan localStorage", () => {
    putAccessToken("token-lama");
    const store = createStore();

    store.logout();

    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(getAccessToken()).toBeNull();
  });
});