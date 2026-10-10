import { fetchApi } from "../../../helpers/apiHelper";

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsersData {
  users: User[];
}

export interface UserData {
  user: User;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
}

export interface ChangePasswordPayload {
  password: string;
  new_password: string;
}

export function getUsers() {
  return fetchApi<UsersData>("/users");
}

export function getMe() {
  return fetchApi<UserData>("/users/me");
}

export function putMe(payload: UpdateProfilePayload) {
  return fetchApi<null>("/users/me", {
    method: "PUT",
    body: { ...payload },
  });
}

export function postMePhoto(file: File) {
  const formData = new FormData();
  formData.append("photo", file);

  return fetchApi<null>("/users/me/photo", {
    method: "POST",
    body: formData,
  });
}

export function putMePassword(payload: ChangePasswordPayload) {
  return fetchApi<null>("/users/me/password", {
    method: "PUT",
    body: { ...payload },
  });
}

/** Mengubah nilai `photo` dari API menjadi URL gambar yang bisa ditampilkan. */
export function resolvePhotoUrl(photo?: string | null): string | null {
  if (!photo) return null;
  if (/^https?:\/\//i.test(photo)) return photo;
  return `${DELCOM_BASEURL}/${photo.replace(/^\//, "")}`;
}

/** Mengambil inisial (maks. 2 huruf) dari nama pengguna. */
export function getUserInitials(name?: string | null): string {
  if (!name) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}