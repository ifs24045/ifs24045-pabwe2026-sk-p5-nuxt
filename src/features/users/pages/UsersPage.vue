<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Search, RefreshCw, Users as UsersIcon } from "lucide-vue-next";
import { useUsersStore } from "../states/usersStore";
import { getUserInitials, resolvePhotoUrl } from "../api/userApi";
import { formatDate, showErrorDialog } from "../../../helpers/toolsHelper";

const usersStore = useUsersStore();
const keyword = ref("");
const failedPhotos = ref<Record<string, boolean>>({});

const filteredUsers = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return usersStore.users;

  return usersStore.users.filter(
    (user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
  );
});

async function loadUsers() {
  const result = await usersStore.fetchUsers();
  if (!result.success) {
    await showErrorDialog(result.message);
  }
}

onMounted(loadUsers);
</script>

<template>
  <section class="space-y-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">
          Direktori Pengguna
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          Daftar seluruh pengguna yang terdaftar di sistem.
        </p>
      </div>

      <button
        type="button"
        :disabled="usersStore.isUsers"
        class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        @click="loadUsers"
      >
        <RefreshCw class="size-4" :class="{ 'animate-spin': usersStore.isUsers }" />
        Muat Ulang
      </button>
    </header>

    <div class="relative max-w-md">
      <Search
        class="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400"
      />
      <input
        v-model="keyword"
        type="search"
        placeholder="Cari nama atau email..."
        class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />
    </div>

    <!-- Loading -->
    <div
      v-if="usersStore.isUsers && usersStore.users.length === 0"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="h-28 animate-pulse rounded-2xl bg-slate-200/70"
      ></div>
    </div>

    <!-- Kosong -->
    <div
      v-else-if="filteredUsers.length === 0"
      class="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
    >
      <span class="grid size-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <UsersIcon class="size-7" />
      </span>
      <p class="mt-4 font-semibold text-slate-700">Pengguna tidak ditemukan</p>
      <p class="mt-1 text-sm text-slate-500">
        Coba gunakan kata kunci pencarian yang lain.
      </p>
    </div>

    <!-- Daftar -->
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="user in filteredUsers"
        :key="user.id"
        class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
      >
        <img
          v-if="resolvePhotoUrl(user.photo) && !failedPhotos[user.id]"
          :src="resolvePhotoUrl(user.photo)!"
          :alt="user.name"
          width="56"
          height="56"
          class="size-14 shrink-0 rounded-full object-cover"
          @error="failedPhotos[user.id] = true"
        />
        <span
          v-else
          class="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700"
        >
          {{ getUserInitials(user.name) }}
        </span>

        <div class="min-w-0">
          <h2 class="truncate font-semibold text-slate-900">{{ user.name }}</h2>
          <p class="truncate text-sm text-slate-500">{{ user.email }}</p>
          <p class="mt-1 text-xs text-slate-400">
            Bergabung {{ formatDate(user.created_at) }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>