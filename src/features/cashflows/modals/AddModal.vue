<script setup lang="ts">
import { reactive, watch } from "vue";
import { LoaderCircle, X } from "lucide-vue-next";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { useInput } from "../../../hooks/useInput";
import { SOURCE_OPTIONS, TYPE_OPTIONS } from "../cashFlowOptions";
import type { CashFlowSource, CashFlowType } from "../api/cashFlowApi";
import {
  formatRupiah,
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void; (e: "saved"): void }>();

const cashFlowsStore = useCashFlowsStore();

const [type, onTypeChange, resetType] = useInput<CashFlowType>("inflow");
const [source, onSourceChange, resetSource] = useInput<CashFlowSource>("cash");
const [label, onLabelChange, resetLabel] = useInput("");
const [nominal, onNominalChange, resetNominal] = useInput("");
const [description, onDescriptionChange, resetDescription] = useInput("");

const errors = reactive({ label: "", nominal: "", description: "" });

function clearErrors() {
  errors.label = "";
  errors.nominal = "";
  errors.description = "";
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetType();
      resetSource();
      resetLabel();
      resetNominal();
      resetDescription();
      clearErrors();
    }
  }
);

function validate(): boolean {
  clearErrors();

  if (!label.value.trim()) {
    errors.label = "Label wajib diisi.";
  }

  const amount = Number(nominal.value);
  if (!nominal.value) {
    errors.nominal = "Nominal wajib diisi.";
  } else if (Number.isNaN(amount) || amount <= 0) {
    errors.nominal = "Nominal harus lebih dari 0.";
  }

  if (!description.value.trim()) {
    errors.description = "Keterangan wajib diisi.";
  }

  return !errors.label && !errors.nominal && !errors.description;
}

async function handleSubmit() {
  if (!validate()) return;

  const result = await cashFlowsStore.addCashFlow({
    type: type.value,
    source: source.value,
    label: label.value.trim(),
    nominal: Number(nominal.value),
    description: description.value.trim(),
  });

  if (result.success) {
    await showSuccessDialog(result.message || "Transaksi berhasil ditambahkan.");
    emit("saved");
  } else {
    await showErrorDialog(result.message);
  }
}
</script>

<template>
  <dialog
    v-if="open"
    open
    class="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-end justify-center border-0 bg-slate-900/50 p-4 text-inherit sm:items-center"
    aria-label="Tambah transaksi"
    @click.self="emit('close')"
  >
    <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <header class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-lg font-bold text-slate-900">Tambah Transaksi</h2>
        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Tutup"
          @click="emit('close')"
        >
          <X class="size-5" />
        </button>
      </header>

      <form class="space-y-5 p-6" novalidate @submit.prevent="handleSubmit">
        <div>
          <span class="field-label">Jenis Arus Kas</span>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="option in TYPE_OPTIONS"
              :key="option.value"
              type="button"
              class="rounded-xl border px-4 py-2.5 text-sm font-semibold transition"
              :class="
                type === option.value
                  ? option.value === 'inflow'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              "
              @click="onTypeChange(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div>
          <label for="add-source" class="field-label">Sumber Dana</label>
          <select
            id="add-source"
            class="field-input"
            :value="source"
            @change="onSourceChange"
          >
            <option v-for="option in SOURCE_OPTIONS" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

        <div>
          <label for="add-label" class="field-label">Label Kategori</label>
          <input
            id="add-label"
            type="text"
            list="add-label-options"
            placeholder="Contoh: Gaji, Makan, Transport"
            class="field-input"
            :value="label"
            :aria-invalid="Boolean(errors.label)"
            @input="onLabelChange"
          />
          <datalist id="add-label-options">
            <option v-for="item in cashFlowsStore.labels" :key="item" :value="item" />
          </datalist>
          <p v-if="errors.label" class="field-error">{{ errors.label }}</p>
        </div>

        <div>
          <label for="add-nominal" class="field-label">Nominal (Rp)</label>
          <input
            id="add-nominal"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            placeholder="0"
            class="field-input"
            :value="nominal"
            :aria-invalid="Boolean(errors.nominal)"
            @input="onNominalChange"
          />
          <p v-if="nominal && Number(nominal) > 0" class="mt-1.5 text-xs text-slate-500">
            {{ formatRupiah(nominal) }}
          </p>
          <p v-if="errors.nominal" class="field-error">{{ errors.nominal }}</p>
        </div>

        <div>
          <label for="add-description" class="field-label">Keterangan</label>
          <textarea
            id="add-description"
            rows="3"
            placeholder="Catatan singkat transaksi"
            class="field-input resize-none"
            :value="description"
            :aria-invalid="Boolean(errors.description)"
            @input="onDescriptionChange"
          ></textarea>
          <p v-if="errors.description" class="field-error">{{ errors.description }}</p>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="emit('close')">Batal</button>
          <button type="submit" class="btn-primary" :disabled="cashFlowsStore.isCashFlowAdd">
            <LoaderCircle v-if="cashFlowsStore.isCashFlowAdd" class="size-4 animate-spin" />
            {{ cashFlowsStore.isCashFlowAdd ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>