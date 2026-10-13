<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Mail, Lock, Eye, EyeOff, LoaderCircle } from "lucide-vue-next";
import { useInput } from "../../../hooks/useInput";
import { useAuthStore } from "../states/authStore";
import {
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";

// Nilai autocomplete dikirim lewat variabel karena type input bersifat dinamis (tampil/sembunyi).
const currentPasswordHint = "current-password";

const router = useRouter();
const authStore = useAuthStore();

const [email, onEmailChange] = useInput("");
const [password, onPasswordChange] = useInput("");
const showPassword = ref(false);

const errors = reactive({ email: "", password: "" });

function validate(): boolean {
  errors.email = "";
  errors.password = "";

  if (!email.value.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    errors.email = "Format email tidak valid.";
  }

  if (!password.value) {
    errors.password = "Kata sandi wajib diisi.";
  }

  return !errors.email && !errors.password;
}

async function handleSubmit() {
  if (!validate()) return;

  const result = await authStore.login({
    email: email.value.trim(),
    password: password.value,
  });

  if (result.success) {
    showSuccessDialog(result.message || "Login berhasil.");
    await router.push("/");
  } else {
    await showErrorDialog(result.message);
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
        Selamat datang kembali
      </h1>
      <p class="mt-2 text-sm text-slate-500">
        Masuk untuk mengelola arus kas Anda.
      </p>
    </div>

    <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="login-email-input" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Email
        </label>
        <div class="relative">
          <Mail
            class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="login-email-input"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
            :value="email"
            class="w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-4"
            :class="
              errors.email
                ? 'border-red-400 focus:ring-red-100'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
            "
            @input="onEmailChange"
          />
        </div>
        <p v-if="errors.email" class="mt-1.5 text-xs text-red-500">
          {{ errors.email }}
        </p>
      </div>

      <div>
        <label for="login-password-input" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Kata Sandi
        </label>
        <div class="relative">
          <Lock
            class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="login-password-input"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="currentPasswordHint"
            placeholder="Masukkan kata sandi"
            :value="password"
            class="w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm outline-none transition focus:ring-4"
            :class="
              errors.password
                ? 'border-red-400 focus:ring-red-100'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
            "
            @input="onPasswordChange"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-600"
            :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="size-5" />
            <Eye v-else class="size-5" />
          </button>
        </div>
        <p v-if="errors.password" class="mt-1.5 text-xs text-red-500">
          {{ errors.password }}
        </p>
      </div>

      <button
        id="login-submit-button"
        type="submit"
        :disabled="authStore.isAuthLogin"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LoaderCircle v-if="authStore.isAuthLogin" class="size-5 animate-spin" />
        {{ authStore.isAuthLogin ? "Memproses..." : "Masuk" }}
      </button>
    </form>

    <p class="mt-8 text-center text-sm text-slate-500">
      Belum punya akun?
      <RouterLink
        to="/auth/register"
        class="font-semibold text-emerald-600 hover:text-emerald-700"
      >
        Daftar sekarang
      </RouterLink>
    </p>
  </div>
</template>