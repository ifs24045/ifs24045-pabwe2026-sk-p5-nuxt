<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-vue-next";
import { useInput } from "../../../hooks/useInput";
import { useAuthStore } from "../states/authStore";
import {
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";

const router = useRouter();
const authStore = useAuthStore();

const [name, onNameChange] = useInput("");
const [email, onEmailChange] = useInput("");
const [password, onPasswordChange] = useInput("");
const [confirmPassword, onConfirmPasswordChange] = useInput("");
const showPassword = ref(false);

const errors = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

function validate(): boolean {
  errors.name = "";
  errors.email = "";
  errors.password = "";
  errors.confirmPassword = "";

  if (!name.value.trim()) {
    errors.name = "Nama lengkap wajib diisi.";
  }

  if (!email.value.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    errors.email = "Format email tidak valid.";
  }

  if (!password.value) {
    errors.password = "Kata sandi wajib diisi.";
  } else if (password.value.length < 6) {
    errors.password = "Kata sandi minimal 6 karakter.";
  }

  if (!confirmPassword.value) {
    errors.confirmPassword = "Konfirmasi kata sandi wajib diisi.";
  } else if (confirmPassword.value !== password.value) {
    errors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
  }

  return (
    !errors.name &&
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword
  );
}

async function handleSubmit() {
  if (!validate()) return;

  const result = await authStore.register({
    name: name.value.trim(),
    email: email.value.trim(),
    password: password.value,
  });

  if (result.success) {
    await showSuccessDialog(result.message || "Registrasi berhasil. Silakan login.");
    await router.push("/auth/login");
  } else {
    await showErrorDialog(result.message);
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">
        Buat akun baru
      </h1>
      <p class="mt-2 text-sm text-slate-500">
        Daftar untuk mulai mencatat arus kas Anda.
      </p>
    </div>

    <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="name" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Nama Lengkap
        </label>
        <div class="relative">
          <User
            class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="name"
            type="text"
            autocomplete="name"
            placeholder="Nama lengkap Anda"
            :value="name"
            class="w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-4"
            :class="
              errors.name
                ? 'border-red-400 focus:ring-red-100'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
            "
            @input="onNameChange"
          />
        </div>
        <p v-if="errors.name" class="mt-1.5 text-xs text-red-500">
          {{ errors.name }}
        </p>
      </div>

      <div>
        <label for="email" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Email
        </label>
        <div class="relative">
          <Mail
            class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="email"
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
        <label for="password" class="mb-1.5 block text-sm font-semibold text-slate-700">
          Kata Sandi
        </label>
        <div class="relative">
          <Lock
            class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Minimal 6 karakter"
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

      <div>
        <label
          for="confirmPassword"
          class="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          Konfirmasi Kata Sandi
        </label>
        <div class="relative">
          <Lock
            class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
          />
          <input
            id="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Ulangi kata sandi"
            :value="confirmPassword"
            class="w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-4"
            :class="
              errors.confirmPassword
                ? 'border-red-400 focus:ring-red-100'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
            "
            @input="onConfirmPasswordChange"
          />
        </div>
        <p v-if="errors.confirmPassword" class="mt-1.5 text-xs text-red-500">
          {{ errors.confirmPassword }}
        </p>
      </div>

      <button
        type="submit"
        :disabled="authStore.isAuthRegister"
        class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LoaderCircle
          v-if="authStore.isAuthRegister"
          class="size-5 animate-spin"
        />
        {{ authStore.isAuthRegister ? "Memproses..." : "Daftar" }}
      </button>
    </form>

    <p class="mt-8 text-center text-sm text-slate-500">
      Sudah punya akun?
      <RouterLink
        to="/auth/login"
        class="font-semibold text-emerald-600 hover:text-emerald-700"
      >
        Masuk di sini
      </RouterLink>
    </p>
  </div>
</template>