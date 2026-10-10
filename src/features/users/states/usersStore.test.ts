import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useUsersStore } from "./usersStore";
import {
  getMe,
  getUsers,
  postMePhoto,
  putMe,
  putMePassword,
} from "../api/userApi";

vi.mock("../api/userApi", () => ({
  getUsers: vi.fn(),
  getMe: vi.fn(),
  putMe: vi.fn(),
  postMePhoto: vi.fn(),
  putMePassword: vi.fn(),
}));

const getUsersMock = vi.mocked(getUsers);
const getMeMock = vi.mocked(getMe);
const putMeMock = vi.mocked(putMe);
const postMePhotoMock = vi.mocked(postMePhoto);
const putMePasswordMock = vi.mocked(putMePassword);

const budi = { id: "1", name: "Budi", email: "budi@mail.com" };
const budiBaru = { id: "1", name: "Budi Baru", email: "baru@mail.com" };

function createStore() {
  setActivePinia(createPinia());
  return useUsersStore();
}

function deferred() {
  let resolve!: (value: any) => void;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  [getUsersMock, getMeMock, putMeMock, postMePhotoMock, putMePasswordMock].forEach(
    (mock) => mock.mockReset()
  );
});

describe("state awal", () => {
  it("kosong dan tidak ada proses yang berjalan", () => {
    const store = createStore();

    expect(store.users).toEqual([]);
    expect(store.profile).toBeNull();
    expect(store.isUsers).toBe(false);
    expect(store.isProfile).toBe(false);
    expect(store.isProfileChange).toBe(false);
    expect(store.isPhotoChange).toBe(false);
    expect(store.isPasswordChange).toBe(false);
  });
});

describe("fetchUsers", () => {
  it("menyimpan daftar pengguna", async () => {
    getUsersMock.mockResolvedValue({
      success: true,
      message: "Berhasil mengambil data",
      data: { users: [budi] },
    });
    const store = createStore();

    const result = await store.fetchUsers();

    expect(result).toEqual({ success: true, message: "Berhasil mengambil data" });
    expect(store.users).toEqual([budi]);
    expect(store.isUsers).toBe(false);
  });

  it("menandai isUsers selama proses berlangsung", async () => {
    const pending = deferred();
    getUsersMock.mockReturnValue(pending.promise as any);
    const store = createStore();

    const action = store.fetchUsers();
    expect(store.isUsers).toBe(true);

    pending.resolve({ success: true, message: "ok", data: { users: [] } });
    await action;

    expect(store.isUsers).toBe(false);
  });

  it("mengembalikan pesan error saat gagal", async () => {
    getUsersMock.mockRejectedValue(new Error("Gagal memuat"));
    const store = createStore();

    const result = await store.fetchUsers();

    expect(result).toEqual({ success: false, message: "Gagal memuat" });
    expect(store.users).toEqual([]);
    expect(store.isUsers).toBe(false);
  });
});

describe("fetchProfile", () => {
  it("menyimpan profil pengguna", async () => {
    getMeMock.mockResolvedValue({
      success: true,
      message: "ok",
      data: { user: budi },
    });
    const store = createStore();

    const result = await store.fetchProfile();

    expect(result).toEqual({ success: true, message: "ok" });
    expect(store.profile).toEqual(budi);
    expect(store.isProfile).toBe(false);
  });

  it("menandai isProfile selama proses berlangsung", async () => {
    const pending = deferred();
    getMeMock.mockReturnValue(pending.promise as any);
    const store = createStore();

    const action = store.fetchProfile();
    expect(store.isProfile).toBe(true);

    pending.resolve({ success: true, message: "ok", data: { user: budi } });
    await action;

    expect(store.isProfile).toBe(false);
  });

  it("mengembalikan pesan error saat gagal", async () => {
    getMeMock.mockRejectedValue(new Error("Token tidak valid"));
    const store = createStore();

    const result = await store.fetchProfile();

    expect(result).toEqual({ success: false, message: "Token tidak valid" });
    expect(store.profile).toBeNull();
    expect(store.isProfile).toBe(false);
  });
});

describe("changeProfile", () => {
  const payload = { name: "Budi Baru", email: "baru@mail.com" };

  it("menyimpan perubahan lalu memuat ulang profil", async () => {
    putMeMock.mockResolvedValue({ success: true, message: "Profil diubah", data: null });
    getMeMock.mockResolvedValue({
      success: true,
      message: "ok",
      data: { user: budiBaru },
    });
    const store = createStore();

    const result = await store.changeProfile(payload);

    expect(putMeMock).toHaveBeenCalledWith(payload);
    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, message: "Profil diubah" });
    expect(store.profile).toEqual(budiBaru);
    expect(store.isProfileChange).toBe(false);
  });

  it("menandai isProfileChange selama proses berlangsung", async () => {
    const pending = deferred();
    putMeMock.mockReturnValue(pending.promise as any);
    getMeMock.mockResolvedValue({ success: true, message: "ok", data: { user: budi } });
    const store = createStore();

    const action = store.changeProfile(payload);
    expect(store.isProfileChange).toBe(true);

    pending.resolve({ success: true, message: "ok", data: null });
    await action;

    expect(store.isProfileChange).toBe(false);
  });

  it("tetap berhasil bila pemuatan ulang profil gagal", async () => {
    putMeMock.mockResolvedValue({ success: true, message: "Profil diubah", data: null });
    getMeMock.mockRejectedValue(new Error("Gagal memuat"));
    const store = createStore();

    const result = await store.changeProfile(payload);

    expect(result).toEqual({ success: true, message: "Profil diubah" });
    expect(store.profile).toBeNull();
  });

  it("mengembalikan pesan error dan tidak memuat ulang profil saat gagal", async () => {
    putMeMock.mockRejectedValue(new Error("Email sudah dipakai"));
    const store = createStore();

    const result = await store.changeProfile(payload);

    expect(result).toEqual({ success: false, message: "Email sudah dipakai" });
    expect(getMeMock).not.toHaveBeenCalled();
    expect(store.isProfileChange).toBe(false);
  });
});

describe("changePhoto", () => {
  const file = new File(["isi"], "foto.png", { type: "image/png" });

  it("mengunggah foto lalu memuat ulang profil", async () => {
    postMePhotoMock.mockResolvedValue({ success: true, message: "Foto diubah", data: null });
    getMeMock.mockResolvedValue({
      success: true,
      message: "ok",
      data: { user: { ...budi, photo: "uploads/foto.png" } },
    });
    const store = createStore();

    const result = await store.changePhoto(file);

    expect(postMePhotoMock).toHaveBeenCalledWith(file);
    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, message: "Foto diubah" });
    expect(store.profile?.photo).toBe("uploads/foto.png");
    expect(store.isPhotoChange).toBe(false);
  });

  it("menandai isPhotoChange selama proses berlangsung", async () => {
    const pending = deferred();
    postMePhotoMock.mockReturnValue(pending.promise as any);
    getMeMock.mockResolvedValue({ success: true, message: "ok", data: { user: budi } });
    const store = createStore();

    const action = store.changePhoto(file);
    expect(store.isPhotoChange).toBe(true);

    pending.resolve({ success: true, message: "ok", data: null });
    await action;

    expect(store.isPhotoChange).toBe(false);
  });

  it("mengembalikan pesan error saat gagal", async () => {
    postMePhotoMock.mockRejectedValue(new Error("Unggah gagal"));
    const store = createStore();

    const result = await store.changePhoto(file);

    expect(result).toEqual({ success: false, message: "Unggah gagal" });
    expect(getMeMock).not.toHaveBeenCalled();
    expect(store.isPhotoChange).toBe(false);
  });
});

describe("changePassword", () => {
  const payload = { password: "lama123", new_password: "baru1234" };

  it("mengirim perubahan kata sandi tanpa memuat ulang profil", async () => {
    putMePasswordMock.mockResolvedValue({
      success: true,
      message: "Kata sandi diubah",
      data: null,
    });
    const store = createStore();

    const result = await store.changePassword(payload);

    expect(putMePasswordMock).toHaveBeenCalledWith(payload);
    expect(getMeMock).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, message: "Kata sandi diubah" });
    expect(store.isPasswordChange).toBe(false);
  });

  it("menandai isPasswordChange selama proses berlangsung", async () => {
    const pending = deferred();
    putMePasswordMock.mockReturnValue(pending.promise as any);
    const store = createStore();

    const action = store.changePassword(payload);
    expect(store.isPasswordChange).toBe(true);

    pending.resolve({ success: true, message: "ok", data: null });
    await action;

    expect(store.isPasswordChange).toBe(false);
  });

  it("mengembalikan pesan error saat gagal", async () => {
    putMePasswordMock.mockRejectedValue(new Error("Kata sandi lama salah"));
    const store = createStore();

    const result = await store.changePassword(payload);

    expect(result).toEqual({ success: false, message: "Kata sandi lama salah" });
    expect(store.isPasswordChange).toBe(false);
  });
});