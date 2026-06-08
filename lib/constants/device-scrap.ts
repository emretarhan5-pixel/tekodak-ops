export const DEVICE_SCRAP_REASONS = [
  "ekonomik_omur",
  "tamir_maliyeti",
  "fiziksel_hasar",
  "yedek_parca_yok",
  "diger",
] as const;

export type DeviceScrapReason = (typeof DEVICE_SCRAP_REASONS)[number];

export const DEVICE_SCRAP_REASON_LABELS: Record<DeviceScrapReason, string> = {
  ekonomik_omur: "Ekonomik ömrünü tamamladı",
  tamir_maliyeti: "Tamir maliyeti çok yüksek",
  fiziksel_hasar: "Fiziksel hasar — tamir mümkün değil",
  yedek_parca_yok: "Yedek parça bulunamıyor",
  diger: "Diğer",
};

export const DEVICE_SCRAP_STATUSES = [
  "pending_approval",
  "approved",
  "rejected",
] as const;

export type DeviceScrapStatus = (typeof DEVICE_SCRAP_STATUSES)[number];

export const DEVICE_SCRAP_STATUS_LABELS: Record<DeviceScrapStatus, string> = {
  pending_approval: "Onay Bekliyor",
  approved: "Hek",
  rejected: "Reddedildi",
};

export const DEVICE_SCRAP_NEXT_STEPS = [
  "new_machine_sale",
  "second_hand",
  "return_only",
  "customer_decides",
] as const;

export type DeviceScrapNextStep = (typeof DEVICE_SCRAP_NEXT_STEPS)[number];

export const DEVICE_SCRAP_NEXT_STEP_LABELS: Record<DeviceScrapNextStep, string> =
  {
    new_machine_sale: "Yeni makine satışı (TEKODAK'tan teklif verilecek)",
    second_hand: "İkinci el / yenileme teklifi",
    return_only: "Sadece iade (başka öneri yok)",
    customer_decides: "Müşteri karar verecek (henüz beklemede)",
  };
