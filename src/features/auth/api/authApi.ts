import { fetchApi } from "../../../helpers/apiHelper";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  token: string;
}

export function postLogin(payload: LoginPayload) {
  return fetchApi<LoginData>("/auth/login", {
    method: "POST",
    body: { ...payload },
    auth: false,
  });
}

export function postRegister(payload: RegisterPayload) {
  return fetchApi<null>("/auth/register", {
    method: "POST",
    body: { ...payload },
    auth: false,
  });
}