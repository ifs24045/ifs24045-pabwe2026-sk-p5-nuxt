import Swal from "sweetalert2";

export function showSuccessDialog(message: string, title = "Berhasil") {
  return Swal.fire({
    icon: "success",
    title,
    text: message,
    confirmButtonColor: "#059669",
  });
}

export function showErrorDialog(message: string, title = "Gagal") {
  return Swal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonColor: "#059669",
  });
}

export async function showConfirmDialog(
  message: string,
  title = "Apakah Anda yakin?",
  confirmText = "Ya"
): Promise<boolean> {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Batal",
    confirmButtonColor: "#059669",
    cancelButtonColor: "#64748b",
  });

  return result.isConfirmed;
}

export function formatRupiah(value: number | string | null | undefined): string {
  const amount = Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isNaN(amount) ? 0 : amount);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}