export const CONTRACT_FILE_BUCKET = "contract-files";

export const CONTRACT_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const CONTRACT_FILE_CATEGORIES = [
  { value: "signed_contract", label: "İmzalı Sözleşme" },
  { value: "amendment", label: "Ek Protokol" },
  { value: "invoice_ref", label: "Fatura" },
  { value: "tender_doc", label: "Yazışma" },
  { value: "other", label: "Diğer" },
] as const;

export type ContractFileCategory =
  (typeof CONTRACT_FILE_CATEGORIES)[number]["value"];

export const CONTRACT_FILE_CATEGORY_ORDER: ContractFileCategory[] = [
  "signed_contract",
  "amendment",
  "invoice_ref",
  "tender_doc",
  "other",
];

export const CONTRACT_FILE_CATEGORY_LABELS: Record<
  ContractFileCategory,
  string
> = {
  signed_contract: "İmzalı Sözleşme",
  amendment: "Ek Protokol",
  invoice_ref: "Fatura",
  tender_doc: "Yazışma",
  other: "Diğer",
};

export function getContractFileCategoryLabel(
  category: string | null | undefined,
): string {
  if (!category) return "Diğer";
  return (
    CONTRACT_FILE_CATEGORY_LABELS[category as ContractFileCategory] ??
    category
  );
}
