export const CUSTOMER_FILE_BUCKET = "customer-files";

export const CUSTOMER_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const CUSTOMER_FILE_CATEGORIES = [
  { value: "contract", label: "Sözleşme" },
  { value: "tender", label: "İhale" },
  { value: "invoice", label: "Fatura" },
  { value: "correspondence", label: "Yazışma" },
  { value: "other", label: "Diğer" },
] as const;

export type CustomerFileCategory =
  (typeof CUSTOMER_FILE_CATEGORIES)[number]["value"];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  CUSTOMER_FILE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<CustomerFileCategory, string>;

export function getCustomerFileCategoryLabel(
  category: string | null | undefined,
): string {
  if (!category) return "Diğer";
  return (
    CATEGORY_LABEL_MAP[category as CustomerFileCategory] ?? category
  );
}

export const CUSTOMER_FILE_CATEGORY_ORDER: CustomerFileCategory[] = [
  "contract",
  "tender",
  "invoice",
  "correspondence",
  "other",
];
