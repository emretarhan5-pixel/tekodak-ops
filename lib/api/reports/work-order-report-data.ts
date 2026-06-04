import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import {
  WORK_ORDER_STATUS_LABELS,
  WORK_ORDER_TYPE_LABELS,
} from "@/lib/constants/work-order";
import type { WorkOrderStatus, WorkOrderType } from "@/lib/constants/work-order";
import {
  isTimestampInPeriod,
  resolveReportPeriod,
} from "@/lib/api/reports/report-period";
import type {
  TechnicianDistributionRow,
  WorkOrderReportData,
  WorkOrderReportRow,
  WorkOrderReportSummary,
} from "@/lib/api/reports/types";
import type { ReportFilterInput } from "@/schemas/report";

const IN_PROGRESS_STATUSES: WorkOrderStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "on_hold",
];

type RawWorkOrderRow = {
  work_order_number: string;
  work_type: WorkOrderType;
  status: WorkOrderStatus;
  scheduled_date: string | null;
  created_at: string;
  actual_duration_hours: number | null;
  work_started_at: string | null;
  work_ended_at: string | null;
  customers: { name: string } | null;
  assignee: { full_name: string } | null;
};

function computeDurationHours(row: RawWorkOrderRow): number | null {
  if (row.actual_duration_hours != null) {
    return Number(row.actual_duration_hours);
  }
  if (row.work_started_at && row.work_ended_at) {
    const ms =
      new Date(row.work_ended_at).getTime() -
      new Date(row.work_started_at).getTime();
    if (ms > 0) {
      return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
    }
  }
  return null;
}

function buildSummary(
  periodRows: RawWorkOrderRow[],
): WorkOrderReportSummary {
  const completedRows = periodRows.filter((row) => row.status === "completed");
  const durations = completedRows
    .map(computeDurationHours)
    .filter((value): value is number => value != null);

  const averageCompletionHours =
    durations.length > 0
      ? Math.round(
          (durations.reduce((sum, value) => sum + value, 0) / durations.length) *
            10,
        ) / 10
      : null;

  return {
    totalCount: periodRows.length,
    completedCount: completedRows.length,
    inProgressCount: periodRows.filter((row) =>
      IN_PROGRESS_STATUSES.includes(row.status),
    ).length,
    cancelledCount: periodRows.filter((row) => row.status === "cancelled")
      .length,
    averageCompletionHours,
  };
}

function buildTechnicianDistribution(
  periodRows: RawWorkOrderRow[],
): TechnicianDistributionRow[] {
  const counts = new Map<string, number>();

  for (const row of periodRows) {
    const name = row.assignee?.full_name ?? "Atanmadı";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([assignee_name, count]) => ({ assignee_name, count }))
    .sort((a, b) => b.count - a.count);
}

function mapRows(periodRows: RawWorkOrderRow[]): WorkOrderReportRow[] {
  return periodRows
    .map((row) => ({
      work_order_number: row.work_order_number,
      customer_name: row.customers?.name ?? "—",
      work_type: row.work_type,
      work_type_label: WORK_ORDER_TYPE_LABELS[row.work_type],
      assignee_name: row.assignee?.full_name ?? "Atanmadı",
      scheduled_date: row.scheduled_date,
      duration_hours: computeDurationHours(row),
      status: row.status,
      status_label: WORK_ORDER_STATUS_LABELS[row.status],
    }))
    .sort((a, b) =>
      (b.scheduled_date ?? "9999").localeCompare(a.scheduled_date ?? "9999"),
    );
}

export async function fetchWorkOrderReportData(
  supabase: AppSupabaseClient,
  filters: ReportFilterInput,
  branchId?: string,
): Promise<WorkOrderReportData> {
  const period = resolveReportPeriod(
    filters.period,
    filters.dateFrom,
    filters.dateTo,
  );

  let query = supabase
    .from("work_orders")
    .select(
      `
      work_order_number,
      work_type,
      status,
      scheduled_date,
      created_at,
      actual_duration_hours,
      work_started_at,
      work_ended_at,
      customers!work_orders_customer_id_fkey ( name ),
      assignee:users!work_orders_assigned_to_fkey ( full_name )
    `,
    )
    .is("deleted_at", null)
    .gte("created_at", `${period.from}T00:00:00`)
    .lte("created_at", `${period.to}T23:59:59.999`)
    .order("created_at", { ascending: false });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as RawWorkOrderRow[];
  const periodRows = rows.filter((row) =>
    isTimestampInPeriod(row.created_at, period),
  );

  return {
    summary: buildSummary(periodRows),
    technicianDistribution: buildTechnicianDistribution(periodRows),
    rows: mapRows(periodRows),
    period,
  };
}

export function workOrderReportToCsvRows(
  data: WorkOrderReportData,
): string[][] {
  return [
    [
      "İş Emri No",
      "Müşteri",
      "Tip",
      "Atanan",
      "Planlanan Tarih",
      "Süre (sa)",
      "Durum",
    ],
    ...data.rows.map((row) => [
      row.work_order_number,
      row.customer_name,
      row.work_type_label,
      row.assignee_name,
      row.scheduled_date ?? "—",
      row.duration_hours != null
        ? row.duration_hours.toLocaleString("tr-TR")
        : "—",
      row.status_label,
    ]),
  ];
}
