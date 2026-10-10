import { defineStore } from "pinia";
import {
  postLogin,
  postRegister,
  type LoginPayload,
  type RegisterPayload,
} from "../api/authApi";
import {
  getAccessToken,
  putAccessToken,
  removeAccessToken,
} from "../../../helpers/apiHelper";

export interface AuthState {
  token: string | null;
  isAuthLogin: boolean;
  isAuthRegister: boolean;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: getAccessToken(),
    isAuthLogin: false,
    isAuthRegister: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => Boolean(state.token),
  },

  actions: {
    async login(payload: LoginPayload): Promise<AuthResult> {
      this.isAuthLogin = true;
      try {
        const response = await postLogin(payload);
        this.token = response.data.token;
        putAccessToken(response.data.token);
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isAuthLogin = false;
      }
    },

    async register(payload: RegisterPayload): Promise<AuthResult> {
      this.isAuthRegister = true;
      try {
        const response = await postRegister(payload);
        return { success: true, message: response.message };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      } finally {
        this.isAuthRegister = false;
      }
    },

    logout(): void {
      this.token = null;
      removeAccessToken();
    },
  },
});