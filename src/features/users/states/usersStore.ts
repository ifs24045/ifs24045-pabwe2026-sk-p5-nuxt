import { defineStore } from "pinia";
import {
  getUsers,
  getMe,
  putMe,
  postMePhoto,
  putMePassword,
  type User,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
} from "../api/userApi";

export interface UsersState {
  users: User[];
  profile: User | null;
  isUsers: boolean;
  isProfile: boolean;
  isProfileChange: boolean;
  isPhotoChange: boolean;
  isPasswordChange: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export const useUsersStore = defineStore("users", {
  state: (): UsersState => ({
    users: [],
    profile: null,
    isUsers: false,
    isProfile: false,
    isProfileChange: false,
    isPhotoChange: false,
    isPasswordChange: false,
  }),

  actions: {
    async fetchUsers(): Promise<ActionResult> {
      this.isUsers = true;
      try {
        const response = await getUsers();
        this.users = response.data.users;
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isUsers = false;
      }
    },

    async fetchProfile(): Promise<ActionResult> {
      this.isProfile = true;
      try {
        const response = await getMe();
        this.profile = response.data.user;
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isProfile = false;
      }
    },

    async changeProfile(payload: UpdateProfilePayload): Promise<ActionResult> {
      this.isProfileChange = true;
      try {
        const response = await putMe(payload);
        await this.fetchProfile();
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isProfileChange = false;
      }
    },

    async changePhoto(file: File): Promise<ActionResult> {
      this.isPhotoChange = true;
      try {
        const response = await postMePhoto(file);
        await this.fetchProfile();
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isPhotoChange = false;
      }
    },

    async changePassword(payload: ChangePasswordPayload): Promise<ActionResult> {
      this.isPasswordChange = true;
      try {
        const response = await putMePassword(payload);
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isPasswordChange = false;
      }
    },
  },
});