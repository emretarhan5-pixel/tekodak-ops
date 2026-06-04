/** Hedef listesi sayfa boyutu (URL `pageSize` ile değiştirilebilir). */
export const TARGET_LIST_PAGE_SIZE = 50;

/** Formda oluşturulabilen metrik tipleri. */
export const TARGET_METRIC_TYPES = [
  "revenue_contracts",
  "work_orders_completed",
  "contracts_new",
  "contracts_renewed",
  "customers_new",
  "response_time",
  "first_time_fix",
] as const;

export type TargetMetricType = (typeof TARGET_METRIC_TYPES)[number];

/** Liste/filtre için tüm DB metrik tipleri (form ile aynı küme). */
export const TARGET_ALL_METRIC_TYPES = TARGET_METRIC_TYPES;

export type TargetDbMetricType = (typeof TARGET_ALL_METRIC_TYPES)[number];

export const TARGET_METRIC_TYPE_LABELS: Record<TargetMetricType, string> = {
  revenue_contracts: "Sözleşme Geliri",
  work_orders_completed: "Tamamlanan İş Emri",
  contracts_new: "Yeni Sözleşme",
  contracts_renewed: "Yenilenen Sözleşme",
  customers_new: "Yeni Müşteri",
  response_time: "Yanıt Süresi",
  first_time_fix: "İlk Seferinde Çözüm",
};

/** Liste tablosunda gösterilen metrik etiketleri. */
export const TARGET_METRIC_TYPE_DISPLAY_LABELS: Record<
  TargetDbMetricType,
  string
> = {
  revenue_contracts: "Sözleşme Geliri",
  work_orders_completed: "Tamamlanan İş Emri",
  contracts_new: "Yeni Sözleşme",
  contracts_renewed: "Yenilenen Sözleşme",
  customers_new: "Yeni Müşteri",
  response_time: "Yanıt Süresi",
  first_time_fix: "İlk Seferinde Çözüm",
};

export function getTargetMetricDisplayLabel(metricType: string): string {
  return (
    TARGET_METRIC_TYPE_DISPLAY_LABELS[
      metricType as TargetDbMetricType
    ] ?? metricType
  );
}

/** Liste filtre dropdown — aylık / yıllık. */
export const TARGET_FILTER_PERIOD_TYPES = ["monthly", "yearly"] as const;

export type TargetFilterPeriodType =
  (typeof TARGET_FILTER_PERIOD_TYPES)[number];

/** Satış hedefi para birimi ile gösterilir; diğerleri adet/saat/yüzde. */
export function targetMetricUsesCurrency(metricType: string): boolean {
  return metricType === "revenue_contracts";
}

export const TARGET_CURRENCIES = ["TRY", "EUR"] as const;
export type TargetCurrency = (typeof TARGET_CURRENCIES)[number];

export const TARGET_CURRENCY_LABELS: Record<TargetCurrency, string> = {
  TRY: "TL (TRY)",
  EUR: "Euro (EUR)",
};

/** Form dönem seçenekleri. */
export const TARGET_FORM_PERIOD_TYPES = [
  "monthly",
  "quarterly",
  "yearly",
] as const;

export type TargetFormPeriodType = (typeof TARGET_FORM_PERIOD_TYPES)[number];

export const TARGET_PERIOD_TYPES = [
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const;

export type TargetPeriodType = (typeof TARGET_PERIOD_TYPES)[number];

export const TARGET_PERIOD_TYPE_LABELS: Record<TargetPeriodType, string> = {
  monthly: "Aylık",
  quarterly: "Çeyreklik",
  yearly: "Yıllık",
  custom: "Özel dönem",
};

export const TARGET_STATUSES = [
  "draft",
  "active",
  "completed",
  "cancelled",
] as const;

export type TargetStatus = (typeof TARGET_STATUSES)[number];

export const TARGET_STATUS_LABELS: Record<TargetStatus, string> = {
  draft: "Taslak",
  active: "Aktif",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

/** `target_progress.progress_status` view alanı. */
export const TARGET_PROGRESS_STATUSES = [
  "achieved",
  "on_track",
  "at_risk",
  "finished",
] as const;

export type TargetProgressStatus = (typeof TARGET_PROGRESS_STATUSES)[number];

export const TARGET_PROGRESS_STATUS_LABELS: Record<
  TargetProgressStatus,
  string
> = {
  achieved: "Ulaşıldı",
  on_track: "Devam ediyor",
  at_risk: "Geride",
  finished: "Dönem bitti",
};

export const TARGET_PROGRESS_STATUS_VARIANTS = {
  achieved: "success",
  on_track: "warning",
  at_risk: "destructive",
  finished: "secondary",
} as const;

export type TargetProgressStatusVariant =
  (typeof TARGET_PROGRESS_STATUS_VARIANTS)[keyof typeof TARGET_PROGRESS_STATUS_VARIANTS];

/** Liste satırı durum renk kodu (ilerleme yüzdesine göre). */
export const TARGET_DISPLAY_STATUSES = [
  "achieved",
  "in_progress",
  "behind",
  "inactive",
] as const;

export type TargetDisplayStatus = (typeof TARGET_DISPLAY_STATUSES)[number];

export const TARGET_DISPLAY_STATUS_LABELS: Record<TargetDisplayStatus, string> =
  {
    achieved: "Ulaşıldı",
    in_progress: "Devam",
    behind: "Geride",
    inactive: "İptal / Süresi Geçmiş",
  };
