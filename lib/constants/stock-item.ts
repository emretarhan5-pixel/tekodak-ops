/** Stok listesi sayfa boyutu (URL `pageSize` ile değiştirilebilir). */
export const STOCK_LIST_PAGE_SIZE = 50;

/** DB `parts.category` CHECK değerleri ile birebir aynı olmalıdır. */
export const PART_CATEGORIES = [
  "blade_cutter",
  "motor_electric",
  "sensor_electronic",
  "oil_fluid",
  "rubber_roller",
  "filter",
  "screw_bolt",
  "cable_connection",
  "other",
] as const;

export type PartCategory = (typeof PART_CATEGORIES)[number];

export const PART_CATEGORY_LABELS: Record<PartCategory, string> = {
  blade_cutter: "Bıçak / Kesici",
  motor_electric: "Motor / Elektrik",
  sensor_electronic: "Sensör / Elektronik",
  oil_fluid: "Yağ / Sıvı",
  rubber_roller: "Kauçuk / Rulo",
  filter: "Filtre",
  screw_bolt: "Vida / Cıvata",
  cable_connection: "Kablo / Bağlantı",
  other: "Diğer",
};

/** DB `parts.unit` CHECK değerleri ile birebir aynı olmalıdır. */
export const PART_UNITS = [
  "piece",
  "liter",
  "meter",
  "kg",
  "package",
  "box",
] as const;

export type PartUnit = (typeof PART_UNITS)[number];

export const PART_UNIT_LABELS: Record<PartUnit, string> = {
  piece: "Adet",
  liter: "Litre",
  meter: "Metre",
  kg: "Kg",
  package: "Paket",
  box: "Kutu",
};

/** Yeni ürün formu birim seçenekleri (sıralı). */
export const STOCK_FORM_UNIT_OPTIONS = [
  { value: "piece" as const, label: "Adet" },
  { value: "kg" as const, label: "Kg" },
  { value: "liter" as const, label: "Litre" },
  { value: "meter" as const, label: "Metre" },
  { value: "package" as const, label: "Paket" },
  { value: "box" as const, label: "Kutu" },
];

/** `current_stock.stock_status` — materialized view hesaplaması. */
export const STOCK_STATUSES = [
  "ok",
  "warning",
  "critical",
  "excess",
] as const;

export type StockStatus = (typeof STOCK_STATUSES)[number];

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  ok: "Yeterli",
  warning: "Düşük",
  critical: "Kritik",
  excess: "Fazla",
};

/** Liste filtresi — UI durum grupları. */
export const STOCK_STATUS_FILTERS = [
  "ok",
  "warning",
  "critical",
  "empty",
  "excess",
] as const;

export type StockStatusFilter = (typeof STOCK_STATUS_FILTERS)[number];

export const STOCK_STATUS_FILTER_LABELS: Record<StockStatusFilter, string> = {
  ok: "Yeterli",
  warning: "Düşük",
  critical: "Kritik",
  empty: "Stokta yok",
  excess: "Fazla",
};

export const STOCK_STATUS_VARIANTS = {
  ok: "success",
  warning: "warning",
  critical: "destructive",
  empty: "secondary",
  excess: "outline",
} as const;

export type StockStatusBadgeVariant =
  (typeof STOCK_STATUS_VARIANTS)[keyof typeof STOCK_STATUS_VARIANTS];
