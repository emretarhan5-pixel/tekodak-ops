/** İş emri listesi sayfa boyutu (URL `pageSize` ile değiştirilebilir). */
export const WORK_ORDER_LIST_PAGE_SIZE = 50;

/** DB `work_orders.work_type` CHECK değerleri ile birebir aynı olmalıdır. */
export const WORK_ORDER_TYPES = [
  "repair",
  "periodic_maintenance",
  "installation",
  "part_replacement",
  "inspection",
  "other",
] as const;

export type WorkOrderType = (typeof WORK_ORDER_TYPES)[number];

export const WORK_ORDER_TYPE_LABELS: Record<WorkOrderType, string> = {
  repair: "Onarım",
  periodic_maintenance: "Periyodik Bakım",
  installation: "Kurulum",
  part_replacement: "Parça Değişimi",
  inspection: "Muayene / Garanti",
  other: "Diğer",
};

/** Yeni iş emri formu — sadeleştirilmiş iş tipleri (DB enum değerleri). */
export const WORK_ORDER_FORM_WORK_TYPES = [
  { value: "periodic_maintenance" as const, label: "Bakım" },
  { value: "repair" as const, label: "Onarım" },
  { value: "installation" as const, label: "Kurulum" },
  { value: "inspection" as const, label: "Garanti" },
];

/** DB `work_orders.priority` CHECK değerleri ile birebir aynı olmalıdır. */
export const WORK_ORDER_PRIORITIES = [
  "urgent",
  "high",
  "normal",
  "low",
] as const;

export type WorkOrderPriority = (typeof WORK_ORDER_PRIORITIES)[number];

export const WORK_ORDER_PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
  urgent: "Acil",
  high: "Yüksek",
  normal: "Normal",
  low: "Düşük",
};

/** DB `work_orders.status` CHECK değerleri ile birebir aynı olmalıdır. */
export const WORK_ORDER_STATUSES = [
  "new",
  "assigned",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  new: "Yeni",
  assigned: "Atandı",
  in_progress: "Devam Ediyor",
  on_hold: "Beklemede",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

/** Liste / kart için sadeleştirilmiş durum grupları (renk kodu). */
export const WORK_ORDER_STATUS_VARIANTS = {
  new: "info",
  assigned: "info",
  in_progress: "warning",
  on_hold: "muted",
  completed: "success",
  cancelled: "muted",
} as const satisfies Record<WorkOrderStatus, string>;

export const TERMINAL_WORK_ORDER_STATUSES = [
  "completed",
  "cancelled",
] as const satisfies readonly WorkOrderStatus[];

/** Spec: öncelik → varsayılan SLA (saat). Sözleşme varsa `sla_response_hours` kullanılır. */
export const WORK_ORDER_DEFAULT_SLA_HOURS: Record<WorkOrderPriority, number> = {
  urgent: 24,
  high: 48,
  normal: 168,
  low: 336,
};

/** `work_order_activities.activity_type` CHECK değerleri. */
export const WORK_ORDER_ACTIVITY_TYPES = [
  "created",
  "assigned",
  "reassigned",
  "status_changed",
  "priority_changed",
  "started",
  "paused",
  "resumed",
  "completed",
  "cancelled",
  "note_added",
  "part_added",
  "part_removed",
  "file_uploaded",
  "edited",
] as const;

export type WorkOrderActivityType = (typeof WORK_ORDER_ACTIVITY_TYPES)[number];

export const WORK_ORDER_ACTIVITY_TYPE_LABELS: Record<
  WorkOrderActivityType,
  string
> = {
  created: "Oluşturuldu",
  assigned: "Atandı",
  reassigned: "Yeniden atandı",
  status_changed: "Durum değişti",
  priority_changed: "Öncelik değişti",
  started: "İşe başlandı",
  paused: "Beklemeye alındı",
  resumed: "Devam edildi",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  note_added: "Not eklendi",
  part_added: "Parça eklendi",
  part_removed: "Parça kaldırıldı",
  file_uploaded: "Dosya yüklendi",
  edited: "Düzenlendi",
};
