import { z } from "zod";

import {
  DEFAULT_REPORT_PERIOD,
  DEFAULT_REPORT_TYPE,
  REPORT_PERIODS,
  REPORT_TYPES,
} from "@/lib/constants/report";

export const reportFilterSchema = z
  .object({
    type: z.enum(REPORT_TYPES).default(DEFAULT_REPORT_TYPE),
    period: z.enum(REPORT_PERIODS).default(DEFAULT_REPORT_PERIOD),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    branchId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.period === "custom") {
      if (!value.dateFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Başlangıç tarihi gerekli",
          path: ["dateFrom"],
        });
      }
      if (!value.dateTo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bitiş tarihi gerekli",
          path: ["dateTo"],
        });
      }
      if (
        value.dateFrom &&
        value.dateTo &&
        value.dateFrom > value.dateTo
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Başlangıç tarihi bitişten sonra olamaz",
          path: ["dateTo"],
        });
      }
    }
  });

export type ReportFilterInput = z.infer<typeof reportFilterSchema>;

export type ResolvedReportPeriod = {
  from: string;
  to: string;
  label: string;
};
