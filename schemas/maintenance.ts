import { z } from "zod";

import { MAINTENANCE_PLAN_STATUSES } from "@/lib/constants/maintenance";

const optionalTrimmedText = (max = 5000) =>
  z.string().trim().max(max).optional().nullable();

export const createMaintenancePlanSchema = z.object({
  contract_id: z.string().uuid("Geçerli bir sözleşme seçin"),
  planned_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir planlanan tarih girin"),
  assigned_technician_id: z.string().uuid("Geçerli bir teknisyen seçin"),
  device_ids: z
    .array(z.string().uuid())
    .min(1, "En az bir cihaz seçin"),
  notes: optionalTrimmedText(5000),
});

export const updateMaintenanceDeviceSchema = z.object({
  device_row_id: z.string().uuid(),
  work_notes: optionalTrimmedText(10000),
  is_completed: z.boolean(),
});

export const startMaintenancePlanSchema = z.object({
  plan_id: z.string().uuid(),
});

export const completeMaintenancePlanSchema = z.object({
  plan_id: z.string().uuid(),
});

export const maintenancePlanFilterSchema = z.object({
  contract_id: z.string().uuid().optional(),
  assigned_technician_id: z.string().uuid().optional(),
  status: z.enum(MAINTENANCE_PLAN_STATUSES).optional(),
});

export type CreateMaintenancePlanInput = z.infer<
  typeof createMaintenancePlanSchema
>;
export type UpdateMaintenanceDeviceInput = z.infer<
  typeof updateMaintenanceDeviceSchema
>;
export type StartMaintenancePlanInput = z.infer<typeof startMaintenancePlanSchema>;
export type CompleteMaintenancePlanInput = z.infer<
  typeof completeMaintenancePlanSchema
>;
export type MaintenancePlanFilterInput = z.infer<
  typeof maintenancePlanFilterSchema
>;
