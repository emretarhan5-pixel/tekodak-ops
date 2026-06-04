export const REPORT_TYPES = [
  "contracts",
  "work_orders",
  "stock",
  "customers",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  contracts: "Sözleşme Raporu",
  work_orders: "İş Emri Raporu",
  stock: "Stok Raporu",
  customers: "Müşteri Raporu",
};

export const REPORT_PERIODS = ["month", "quarter", "year", "custom"] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  month: "Bu ay",
  quarter: "Bu çeyrek",
  year: "Bu yıl",
  custom: "Özel tarih aralığı",
};

export const DEFAULT_REPORT_TYPE: ReportType = "contracts";
export const DEFAULT_REPORT_PERIOD: ReportPeriod = "month";
