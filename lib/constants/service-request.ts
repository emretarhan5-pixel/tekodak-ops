/** Servis talebi listesi sayfa boyutu. */
export const SERVICE_REQUEST_LIST_PAGE_SIZE = 50;

/** DB `service_requests.status` CHECK değerleri ile birebir aynı olmalıdır. */
export const SERVICE_REQUEST_STATUSES = [
  "draft",
  "ariza_tespit",
  "teklif_hazir",
  "teklif_onaylandi",
  "bakim_yapiliyor",
  "tamamlandi",
  "rejected",
] as const;

export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  draft: "Taslak",
  ariza_tespit: "Arıza Tespit",
  teklif_hazir: "Teklif Hazırlanıyor",
  teklif_onaylandi: "Teklif Onaylandı",
  bakim_yapiliyor: "Bakım / Fatura",
  tamamlandi: "Tamamlandı",
  rejected: "Reddedildi",
};

export const SERVICE_REQUEST_STATUS_VARIANTS = {
  draft: "muted",
  ariza_tespit: "info",
  teklif_hazir: "warning",
  teklif_onaylandi: "info",
  bakim_yapiliyor: "warning",
  tamamlandi: "success",
  rejected: "destructive",
} as const satisfies Record<ServiceRequestStatus, string>;

export const TERMINAL_SERVICE_REQUEST_STATUSES = [
  "tamamlandi",
  "rejected",
] as const satisfies readonly ServiceRequestStatus[];

/** Teknisyen panelinde listelenen açık talep durumları. */
export const OPEN_SERVICE_REQUEST_STATUSES = [
  "draft",
  "ariza_tespit",
  "teklif_hazir",
  "teklif_onaylandi",
  "bakim_yapiliyor",
] as const satisfies readonly ServiceRequestStatus[];

/** Planlanan tarih hesabı için varsayılan SLA (gün). */
export const SERVICE_REQUEST_DEFAULT_SLA_DAYS = 7;

/** DB `service_requests.vat_option` CHECK değerleri ile birebir aynı olmalıdır. */
export const SERVICE_REQUEST_VAT_OPTIONS = [
  "vat_20",
  "vat_10",
  "vat_1",
  "vat_included",
  "no_vat",
] as const;

export type ServiceRequestVatOption = (typeof SERVICE_REQUEST_VAT_OPTIONS)[number];

export const SERVICE_REQUEST_VAT_OPTION_LABELS: Record<
  ServiceRequestVatOption,
  string
> = {
  vat_20: "%20 KDV",
  vat_10: "%10 KDV",
  vat_1: "%1 KDV",
  vat_included: "KDV Dahil",
  no_vat: "KDV Yok",
};

/** DB `service_requests.delivery_method` CHECK değerleri ile birebir aynı olmalıdır. */
export const SERVICE_REQUEST_DELIVERY_METHODS = [
  "on_site",
  "customer_pickup",
  "shipped_cod",
] as const;

export type ServiceRequestDeliveryMethod =
  (typeof SERVICE_REQUEST_DELIVERY_METHODS)[number];

export const SERVICE_REQUEST_DELIVERY_METHOD_LABELS: Record<
  ServiceRequestDeliveryMethod,
  string
> = {
  on_site: "Yerinde yapıldı",
  customer_pickup: "Müşteri servise geldi — müşteri aldı",
  shipped_cod: "Müşteri servise geldi — kargo ile gönderildi (karşı ödemeli)",
};

/** DB `service_requests.customer_decision` CHECK değerleri ile birebir aynı olmalıdır. */
export const SERVICE_REQUEST_CUSTOMER_DECISIONS = [
  "pending",
  "approved",
  "rejected",
] as const;

export type ServiceRequestCustomerDecision =
  (typeof SERVICE_REQUEST_CUSTOMER_DECISIONS)[number];

export const SERVICE_REQUEST_CUSTOMER_DECISION_LABELS: Record<
  ServiceRequestCustomerDecision,
  string
> = {
  pending: "Beklemede",
  approved: "Onayladı",
  rejected: "Reddetti",
};

export const SERVICE_REQUEST_STEPS = [1, 2, 3, 4, 5] as const;

export type ServiceRequestStep = (typeof SERVICE_REQUEST_STEPS)[number];

export const SERVICE_REQUEST_STEP_LABELS: Record<ServiceRequestStep, string> = {
  1: "Kayıt",
  2: "Arıza Tespit",
  3: "Teklif",
  4: "Bakım / Tamir",
  5: "Fatura + Ödeme",
};

/** Fotoğraf yüklenebilen adımlar (DB CHECK). */
export const SERVICE_REQUEST_PHOTO_STEPS = [2, 4] as const;

export type ServiceRequestPhotoStep = (typeof SERVICE_REQUEST_PHOTO_STEPS)[number];
