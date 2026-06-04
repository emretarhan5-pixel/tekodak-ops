export const WORK_ORDER_FILE_BUCKET = "work-order-files";

export const WORK_ORDER_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const WORK_ORDER_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const WORK_ORDER_FILE_CATEGORIES = [
  { value: "customer_request", label: "Müşteri Talebi" },
  { value: "previous_report", label: "Önceki Rapor" },
  { value: "technical_doc", label: "Teknik Doküman" },
  { value: "invoice", label: "Fatura" },
  { value: "other", label: "Diğer" },
] as const;

export type WorkOrderFileCategory =
  (typeof WORK_ORDER_FILE_CATEGORIES)[number]["value"];

const FILE_CATEGORY_LABEL_MAP = Object.fromEntries(
  WORK_ORDER_FILE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<WorkOrderFileCategory, string>;

export function getWorkOrderFileCategoryLabel(
  category: string | null | undefined,
): string {
  if (!category) return "Diğer";
  return (
    FILE_CATEGORY_LABEL_MAP[category as WorkOrderFileCategory] ?? category
  );
}

export const WORK_ORDER_FILE_CATEGORY_ORDER: WorkOrderFileCategory[] = [
  "customer_request",
  "previous_report",
  "technical_doc",
  "invoice",
  "other",
];

export const WORK_ORDER_PHOTO_TYPES = [
  { value: "before", label: "Öncesi" },
  { value: "during", label: "Sırasında" },
  { value: "after", label: "Sonrası" },
  { value: "evidence", label: "Kanıt" },
] as const;

export type WorkOrderPhotoType =
  (typeof WORK_ORDER_PHOTO_TYPES)[number]["value"];

const PHOTO_TYPE_LABEL_MAP = Object.fromEntries(
  WORK_ORDER_PHOTO_TYPES.map((t) => [t.value, t.label]),
) as Record<WorkOrderPhotoType, string>;

export function getWorkOrderPhotoTypeLabel(
  photoType: string | null | undefined,
): string {
  if (!photoType) return "Fotoğraf";
  return PHOTO_TYPE_LABEL_MAP[photoType as WorkOrderPhotoType] ?? photoType;
}

export const WORK_ORDER_PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic";
