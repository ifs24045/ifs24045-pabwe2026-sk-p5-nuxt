<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, Pencil, SearchX, Trash2 } from "lucide-vue-next";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { getSourceLabel, getTypeLabel } from "../cashFlowOptions";
import ChangeModal from "../modals/ChangeModal.vue";
import {
  formatDateTime,
  formatRupiah,
  showConfirmDialog,
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";

const route = useRoute();
const router = useRouter();
const cashFlowsStore = useCashFlowsStore();

const showChange = ref(false);
const errorMessage = ref("");

const cashFlowId = computed(() => String(route.params.cashFlowId));
const item = computed(() => cashFlowsStore.cashFlow);
const isInflow = computed(() => item.value?.type === "inflow");

async function loadDetail() {
  const result = await cashFlowsStore.fetchCashFlow(cashFlowId.value);
  errorMessage.value = result.success ? "" : result.message;
}

async function handleSaved() {
  showChange.value = false;
  await loadDetail();
}

async function handleDelete() {
  const confirmed = await showConfirmDialog(
    "Transaksi ini akan dihapus permanen.",
    "Hapus transaksi?",
    "Ya, hapus"
  );
  if (!confirmed) return;

  const result = await cashFlowsStore.removeCashFlow(cashFlowId.value);
  if (result.success) {
    await showSuccessDialog(result.message || "Transaksi berhasil dihapus.");
    await router.push("/");
  } else {
    await showErrorDialog(result.message);
  }
}

onMounted(async () => {
  cashFlowsStore.cashFlow = null;
  await Promise.all([loadDetail(), cashFlowsStore.fetchLabels()]);
});
</script>

<template>
  <section class="space-y-6">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
    >
      <ArrowLeft class="size-4" />
      Kembali ke Ringkasan
    </RouterLink>

    <!-- Loading -->
    <div
      v-if="cashFlowsStore.isCashFlow && !item"
      class="h-80 animate-pulse rounded-2xl bg-slate-200/70"
    ></div>

    <!-- Error -->
    <div
      v-else-if="!item"
      class="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"
    >
      <span class="grid size-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <SearchX class="size-7" />
      </span>
      <p class="mt-4 font-semibold text-slate-700">Transaksi tidak ditemukan</p>
      <p class="mt-1 text-sm text-slate-500">
        {{ errorMessage || "Data transaksi tidak tersedia." }}
      </p>
    </div>

    <!-- Detail -->
    <article
      v-else
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div
        class="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
        :class="isInflow ? 'bg-emerald-50' : 'bg-red-50'"
      >
        <div>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold"
            :class="isInflow ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'"
          >
            {{ getTypeLabel(item.type) }}
          </span>
          <h1 class="mt-3 text-2xl font-extrabold text-slate-900">{{ item.label }}</h1>
        </div>

        <p
          class="text-3xl font-extrabold"
          :class="isInflow ? 'text-emerald-600' : 'text-red-600'"
        >
          {{ isInflow ? "+" : "-" }} {{ formatRupiah(item.nominal) }}
        </p>
      </div>

      <dl class="grid gap-6 p-6 sm:grid-cols-2">
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Jenis Arus Kas
          </dt>
          <dd class="mt-1 font-semibold text-slate-900">{{ getTypeLabel(item.type) }}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Kategori Label
          </dt>
          <dd class="mt-1 font-semibold text-slate-900">{{ item.label }}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sumber Dana
          </dt>
          <dd class="mt-1 font-semibold text-slate-900">{{ getSourceLabel(item.source) }}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">Nominal</dt>
          <dd class="mt-1 font-semibold text-slate-900">{{ formatRupiah(item.nominal) }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Keterangan
          </dt>
          <dd class="mt-1 whitespace-pre-line text-slate-700">
            {{ item.description || "-" }}
          </dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Dibuat Pada
          </dt>
          <dd class="mt-1 text-slate-700">{{ formatDateTime(item.created_at) }}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Diperbarui Pada
          </dt>
          <dd class="mt-1 text-slate-700">{{ formatDateTime(item.updated_at) }}</dd>
        </div>
      </dl>

      <div class="flex flex-wrap justify-end gap-3 border-t border-slate-100 p-6">
        <button
          type="button"
          class="btn-danger"
          :disabled="cashFlowsStore.isCashFlowDelete"
          @click="handleDelete"
        >
          <Trash2 class="size-4" />
          Hapus
        </button>
        <button type="button" class="btn-primary" @click="showChange = true">
          <Pencil class="size-4" />
          Ubah
        </button>
      </div>
    </article>

    <ChangeModal
      :open="showChange"
      :cash-flow="item"
      @close="showChange = false"
      @saved="handleSaved"
    />
  </section>
</template>