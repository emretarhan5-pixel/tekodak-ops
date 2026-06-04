export const DEVICE_FILE_BUCKET = "device-files";

export const DEVICE_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const DEVICE_FILE_CATEGORIES = [
  { value: "invoice", label: "Fatura" },
  { value: "warranty", label: "Garanti Belgesi" },
  { value: "photo", label: "Fotoğraf" },
  { value: "technical", label: "Teknik Doküman" },
  { value: "other", label: "Diğer" },
] as const;

export type DeviceFileCategory =
  (typeof DEVICE_FILE_CATEGORIES)[number]["value"];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  DEVICE_FILE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<DeviceFileCategory, string>;

export function getDeviceFileCategoryLabel(
  category: string | null | undefined,
): string {
  if (!category) return "Diğer";
  return (
    CATEGORY_LABEL_MAP[category as DeviceFileCategory] ?? category
  );
}

export const DEVICE_FILE_CATEGORY_ORDER: DeviceFileCategory[] = [
  "invoice",
  "warranty",
  "photo",
  "technical",
  "other",
];
