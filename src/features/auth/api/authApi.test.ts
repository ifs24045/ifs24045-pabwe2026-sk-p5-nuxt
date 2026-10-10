import { beforeEach, describe, expect, it, vi } from "vitest";
import { postLogin, postRegister } from "./authApi";
import { fetchApi } from "../../../helpers/apiHelper";

vi.mock("../../../helpers/apiHelper", () => ({
  fetchApi: vi.fn(),
}));

const fetchApiMock = vi.mocked(fetchApi);

beforeEach(() => {
  fetchApiMock.mockReset();
});

describe("postLogin", () => {
  it("mengirim POST ke /auth/login tanpa token", async () => {
    const response = {
      success: true,
      message: "Login berhasil",
      data: { token: "abc" },
    };
    fetchApiMock.mockResolvedValue(response);

    const payload = { email: "a@b.com", password: "rahasia" };
    const result = await postLogin(payload);

    expect(fetchApiMock).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    });
    expect(result).toBe(response);
  });
});

describe("postRegister", () => {
  it("mengirim POST ke /auth/register tanpa token", async () => {
    const response = { success: true, message: "Registrasi berhasil", data: null };
    fetchApiMock.mockResolvedValue(response);

    const payload = { name: "Budi", email: "a@b.com", password: "rahasia" };
    const result = await postRegister(payload);

    expect(fetchApiMock).toHaveBeenCalledWith("/auth/register", {
      method: "POST",
      body: payload,
      auth: false,
    });
    expect(result).toBe(response);
  });
});