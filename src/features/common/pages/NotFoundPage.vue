<script setup lang="ts">
import { ArrowLeft, SearchX } from "lucide-vue-next";
</script>

<template>
  <div class="grid min-h-screen place-items-center bg-slate-50 px-6">
    <div class="max-w-md text-center">
      <span
        class="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-600"
      >
        <SearchX class="size-10" />
      </span>

      <p class="mt-6 text-6xl font-extrabold tracking-tight text-slate-900">404</p>
      <h1 class="mt-2 text-xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p class="mt-2 text-sm text-slate-500">
        Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan.
      </p>

      <RouterLink to="/" class="btn-primary mt-8">
        <ArrowLeft class="size-4" />
        Kembali ke Beranda
      </RouterLink>
    </div>
  </div>
</template>