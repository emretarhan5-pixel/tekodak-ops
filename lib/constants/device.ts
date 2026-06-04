/** Cihaz listesi sayfa boyutu (URL `pageSize` ile değiştirilebilir). */
export const DEVICE_LIST_PAGE_SIZE = 50;

/** DB `devices.status` CHECK değerleri ile birebir aynı olmalıdır. */
export const DEVICE_STATUSES = [
  "active",
  "faulty",
  "in_service",
  "scrap",
] as const;

export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  active: "Aktif",
  faulty: "Arızalı",
  in_service: "Serviste",
  scrap: "Hurda",
};
