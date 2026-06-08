/** DB `periodic_maintenance_plans.status` CHECK değerleri ile birebir aynı olmalıdır. */
export const MAINTENANCE_PLAN_STATUSES = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type MaintenancePlanStatus = (typeof MAINTENANCE_PLAN_STATUSES)[number];

export const MAINTENANCE_PLAN_STATUS_LABELS: Record<
  MaintenancePlanStatus,
  string
> = {
  planned: "Planlandı",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export const MAINTENANCE_PLAN_STATUS_VARIANTS = {
  planned: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "muted",
} as const satisfies Record<MaintenancePlanStatus, string>;

export type MaintenancePlanStatusBadgeVariant =
  (typeof MAINTENANCE_PLAN_STATUS_VARIANTS)[MaintenancePlanStatus];

/** Teknisyen paneli ve aktif işler. */
export const OPEN_MAINTENANCE_PLAN_STATUSES = [
  "planned",
  "in_progress",
] as const satisfies readonly MaintenancePlanStatus[];

export const TERMINAL_MAINTENANCE_PLAN_STATUSES = [
  "completed",
  "cancelled",
] as const satisfies readonly MaintenancePlanStatus[];
