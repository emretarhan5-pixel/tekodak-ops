/** Sözleşme listesi sayfa boyutu (URL `pageSize` ile değiştirilebilir). */
export const CONTRACT_LIST_PAGE_SIZE = 50;

export const CONTRACT_CURRENCIES = ["TRY", "EUR"] as const;
export type ContractCurrency = (typeof CONTRACT_CURRENCIES)[number];

export const CONTRACT_CURRENCY_LABELS: Record<ContractCurrency, string> = {
  TRY: "TL (TRY)",
  EUR: "Euro (EUR)",
};

export const CONTRACT_TYPES = [
  "annual_maintenance",
  "semi_annual_maintenance",
  "periodic_project",
  "warranty_extension",
  "one_time_service",
  "other",
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  annual_maintenance: "Yıllık bakım",
  semi_annual_maintenance: "6 aylık bakım",
  periodic_project: "Periyodik proje",
  warranty_extension: "Garanti uzatma",
  one_time_service: "Tek seferlik hizmet",
  other: "Diğer",
};

/** DB `contracts.status` CHECK değerleri ile birebir aynı olmalıdır. */
export const CONTRACT_STATUSES = [
  "draft",
  "active",
  "renewal_approaching",
  "expiring_soon",
  "renewed",
  "expired",
  "cancelled",
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Taslak",
  active: "Aktif",
  renewal_approaching: "Yenileme yaklaşıyor",
  expiring_soon: "Süresi doluyor",
  renewed: "Yenilendi",
  expired: "Sona erdi",
  cancelled: "İptal",
};

export const CONTRACT_PAYMENT_METHODS = [
  "annual_prepaid",
  "semi_annual",
  "quarterly",
  "monthly",
  "per_service",
] as const;

export type ContractPaymentMethod = (typeof CONTRACT_PAYMENT_METHODS)[number];

export const CONTRACT_PAYMENT_METHOD_LABELS: Record<
  ContractPaymentMethod,
  string
> = {
  annual_prepaid: "Yıllık peşin",
  semi_annual: "6 aylık",
  quarterly: "Üç aylık",
  monthly: "Aylık",
  per_service: "İş başı",
};

export const CONTRACT_WORKING_HOURS = ["business", "24/7"] as const;
export type ContractWorkingHours = (typeof CONTRACT_WORKING_HOURS)[number];

export const CONTRACT_WORKING_HOURS_LABELS: Record<
  ContractWorkingHours,
  string
> = {
  business: "Mesai saatleri",
  "24/7": "7/24",
};

/** Liste/detay renk rozeti (kalan güne göre). */
export const CONTRACT_RENEWAL_BADGES = [
  "active",
  "warning_90",
  "critical_30",
  "ended",
] as const;

export type ContractRenewalBadge = (typeof CONTRACT_RENEWAL_BADGES)[number];

export const CONTRACT_RENEWAL_BADGE_LABELS: Record<
  ContractRenewalBadge,
  string
> = {
  active: "Aktif",
  warning_90: "Yenileme yaklaşıyor",
  critical_30: "Süresi doluyor",
  ended: "Sona erdi / iptal",
};

/** Liste sayfası durum filtresi (URL `listFilter`). */
export const CONTRACT_LIST_FILTERS = [
  "draft",
  "active",
  "renewal_near",
  "ended",
  "cancelled",
] as const;

export type ContractListFilter = (typeof CONTRACT_LIST_FILTERS)[number];

export const CONTRACT_LIST_FILTER_LABELS: Record<ContractListFilter, string> = {
  draft: "Taslak",
  active: "Aktif",
  renewal_near: "Yenileme yakın",
  ended: "Bitmiş",
  cancelled: "İptal",
};
