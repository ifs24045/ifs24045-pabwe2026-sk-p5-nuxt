<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import {
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  Save,
  User as UserIcon,
} from "lucide-vue-next";
import { useUsersStore } from "../states/usersStore";
import { getUserInitials, resolvePhotoUrl } from "../api/userApi";
import { useInput } from "../../../hooks/useInput";
import {
  formatDateTime,
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB

const usersStore = useUsersStore();

const [name, onNameChange] = useInput("");
const [email, onEmailChange] = useInput("");
const [oldPassword, onOldPasswordChange, resetOldPassword] = useInput("");
const [newPassword, onNewPasswordChange, resetNewPassword] = useInput("");
const [confirmPassword, onConfirmPasswordChange, resetConfirmPassword] =
  useInput("");

const showPassword = ref(false);
const photoFailed = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const profileErrors = reactive({ name: "", email: "" });
const passwordErrors = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

function fillForm() {
  if (usersStore.profile) {
    onNameChange(usersStore.profile.name);
    onEmailChange(usersStore.profile.email);
  }
}

watch(() => usersStore.profile?.photo, () => {
  photoFailed.value = false;
});

onMounted(async () => {
  const result = await usersStore.fetchProfile();
  if (result.success) {
    fillForm();
  } else {
    await showErrorDialog(result.message);
  }
});

async function handleProfileSubmit() {
  profileErrors.name = "";
  profileErrors.email = "";

  if (!name.value.trim()) {
    profileErrors.name = "Nama wajib diisi.";
  }

  if (!email.value.trim()) {
    profileErrors.email = "Email wajib diisi.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    profileErrors.email = "Format email tidak valid.";
  }

  if (profileErrors.name || profileErrors.email) return;

  const result = await usersStore.changeProfile({
    name: name.value.trim(),
    email: email.value.trim(),
  });

  if (result.success) {
    await showSuccessDialog(result.message || "Profil berhasil diperbarui.");
  } else {
    await showErrorDialog(result.message);
  }
}

async function handlePhotoChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    await showErrorDialog("Berkas harus berupa gambar.");
    input.value = "";
    return;
  }

  if (file.size > MAX_PHOTO_SIZE) {
    await showErrorDialog("Ukuran foto maksimal 2 MB.");
    input.value = "";
    return;
  }

  const result = await usersStore.changePhoto(file);
  input.value = "";

  if (result.success) {
    await showSuccessDialog(result.message || "Foto profil berhasil diperbarui.");
  } else {
    await showErrorDialog(result.message);
  }
}

async function handlePasswordSubmit() {
  passwordErrors.oldPassword = "";
  passwordErrors.newPassword = "";
  passwordErrors.confirmPassword = "";

  if (!oldPassword.value) {
    passwordErrors.oldPassword = "Kata sandi lama wajib diisi.";
  }

  if (!newPassword.value) {
    passwordErrors.newPassword = "Kata sandi baru wajib diisi.";
  } else if (newPassword.value.length < 6) {
    passwordErrors.newPassword = "Kata sandi baru minimal 6 karakter.";
  }

  if (!confirmPassword.value) {
    passwordErrors.confirmPassword = "Konfirmasi kata sandi wajib diisi.";
  } else if (confirmPassword.value !== newPassword.value) {
    passwordErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
  }

  if (
    passwordErrors.oldPassword ||
    passwordErrors.newPassword ||
    passwordErrors.confirmPassword
  ) {
    return;
  }

  const result = await usersStore.changePassword({
    password: oldPassword.value,
    new_password: newPassword.value,
  });

  if (result.success) {
    resetOldPassword();
    resetNewPassword();
    resetConfirmPassword();
    await showSuccessDialog(result.message || "Kata sandi berhasil diubah.");
  } else {
    await showErrorDialog(result.message);
  }
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
        Profil Saya
      </h1>
      <p class="mt-1 text-sm text-slate-500">
        Kelola informasi akun dan keamanan Anda.
      </p>
    </header>

    <div
      v-if="usersStore.isProfile && !usersStore.profile"
      class="h-64 animate-pulse rounded-2xl bg-slate-200/70"
    ></div>

    <div v-else class="grid gap-6 lg:grid-cols-3">
      <!-- Kartu foto -->
      <aside
        class="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm lg:self-start"
      >
        <div class="relative">
          <img
            v-if="resolvePhotoUrl(usersStore.profile?.photo) && !photoFailed"
            :src="resolvePhotoUrl(usersStore.profile?.photo)!"
            :alt="usersStore.profile?.name"
            class="size-28 rounded-full object-cover ring-4 ring-emerald-100"
            @error="photoFailed = true"
          />
          <span
            v-else
            class="grid size-28 place-items-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700 ring-4 ring-emerald-50"
          >
            {{ getUserInitials(usersStore.profile?.name) }}
          </span>

          <button
            type="button"
            :disabled="usersStore.isPhotoChange"
            class="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
            aria-label="Ganti foto profil"
            @click="fileInput?.click()"
          >
            <LoaderCircle v-if="usersStore.isPhotoChange" class="size-4 animate-spin" />
            <Camera v-else class="size-4" />
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            data-testid="photo-input"
            @change="handlePhotoChange"
          />
        </div>

        <h2 class="mt-4 text-lg font-bold text-slate-900">
          {{ usersStore.profile?.name }}
        </h2>
        <p class="text-sm text-slate-500">{{ usersStore.profile?.email }}</p>
        <p class="mt-4 text-xs text-slate-400">
          Bergabung {{ formatDateTime(usersStore.profile?.created_at) }}
        </p>
      </aside>

      <div class="space-y-6 lg:col-span-2">
        <!-- Form profil -->
        <form
          class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          novalidate
          @submit.prevent="handleProfileSubmit"
        >
          <h2 class="text-lg font-bold text-slate-900">Informasi Akun</h2>

          <div>
            <label for="name" class="mb-1.5 block text-sm font-semibold text-slate-700">
              Nama Lengkap
            </label>
            <div class="relative">
              <UserIcon
                class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
              />
              <input
                id="name"
                type="text"
                :value="name"
                class="w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-4"
                :class="
                  profileErrors.name
                    ? 'border-red-400 focus:ring-red-100'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                "
                @input="onNameChange"
              />
            </div>
            <p v-if="profileErrors.name" class="mt-1.5 text-xs text-red-500">
              {{ profileErrors.name }}
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
                :value="email"
                class="w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:ring-4"
                :class="
                  profileErrors.email
                    ? 'border-red-400 focus:ring-red-100'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                "
                @input="onEmailChange"
              />
            </div>
            <p v-if="profileErrors.email" class="mt-1.5 text-xs text-red-500">
              {{ profileErrors.email }}
            </p>
          </div>

          <button
            type="submit"
            :disabled="usersStore.isProfileChange"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LoaderCircle v-if="usersStore.isProfileChange" class="size-4 animate-spin" />
            <Save v-else class="size-4" />
            {{ usersStore.isProfileChange ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </form>

        <!-- Form password -->
        <form
          class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          novalidate
          @submit.prevent="handlePasswordSubmit"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-900">Ubah Kata Sandi</h2>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="size-4" />
              <Eye v-else class="size-4" />
              {{ showPassword ? "Sembunyikan" : "Tampilkan" }}
            </button>
          </div>

          <div>
            <label
              for="oldPassword"
              class="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Kata Sandi Lama
            </label>
            <input
              id="oldPassword"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :value="oldPassword"
              class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4"
              :class="
                passwordErrors.oldPassword
                  ? 'border-red-400 focus:ring-red-100'
                  : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
              "
              @input="onOldPasswordChange"
            />
            <p v-if="passwordErrors.oldPassword" class="mt-1.5 text-xs text-red-500">
              {{ passwordErrors.oldPassword }}
            </p>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                for="newPassword"
                class="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Kata Sandi Baru
              </label>
              <input
                id="newPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :value="newPassword"
                class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4"
                :class="
                  passwordErrors.newPassword
                    ? 'border-red-400 focus:ring-red-100'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                "
                @input="onNewPasswordChange"
              />
              <p v-if="passwordErrors.newPassword" class="mt-1.5 text-xs text-red-500">
                {{ passwordErrors.newPassword }}
              </p>
            </div>

            <div>
              <label
                for="confirmPassword"
                class="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Konfirmasi Kata Sandi
              </label>
              <input
                id="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :value="confirmPassword"
                class="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:ring-4"
                :class="
                  passwordErrors.confirmPassword
                    ? 'border-red-400 focus:ring-red-100'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                "
                @input="onConfirmPasswordChange"
              />
              <p
                v-if="passwordErrors.confirmPassword"
                class="mt-1.5 text-xs text-red-500"
              >
                {{ passwordErrors.confirmPassword }}
              </p>
            </div>
          </div>

          <button
            type="submit"
            :disabled="usersStore.isPasswordChange"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LoaderCircle v-if="usersStore.isPasswordChange" class="size-4 animate-spin" />
            <KeyRound v-else class="size-4" />
            {{ usersStore.isPasswordChange ? "Memproses..." : "Ubah Kata Sandi" }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>