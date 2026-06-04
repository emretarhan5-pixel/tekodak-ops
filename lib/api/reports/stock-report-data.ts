import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import { isTrackedBranchStockRow } from "@/lib/api/stock/stock-helpers";
import {
  STOCK_STATUS_LABELS,
  type StockStatus,
} from "@/lib/constants/stock-item";
import { resolveReportPeriod } from "@/lib/api/reports/report-period";
import type {
  StockReportData,
  StockReportRow,
  StockReportSummary,
  TopUsedPartRow,
} from "@/lib/api/reports/types";
import type { ReportFilterInput } from "@/schemas/report";

type RawStockRow = {
  part_id: string | null;
  branch_id: string | null;
  part_code: string | null;
  description: string | null;
  branch_name: string | null;
  current_quantity: number | null;
  min_stock: number | null;
  stock_status: string | null;
};

type RawMovementRow = {
  part_id: string;
  quantity_change: number;
  movement_type: string;
  created_at: string;
  parts: { part_code: string | null; description: string | null } | null;
};

function buildSummary(
  stockRows: RawStockRow[],
  movements: RawMovementRow[],
): StockReportSummary {
  let criticalCount = 0;
  let warningCount = 0;
  let totalInbound = 0;
  let totalOutbound = 0;

  for (const row of stockRows) {
    if (row.stock_status === "critical") criticalCount += 1;
    if (row.stock_status === "warning") warningCount += 1;
  }

  for (const movement of movements) {
    const qty = Number(movement.quantity_change ?? 0);
    if (qty > 0) {
      totalInbound += qty;
    } else if (qty < 0) {
      totalOutbound += Math.abs(qty);
    }
  }

  return {
    totalItems: stockRows.length,
    criticalCount,
    warningCount,
    totalInbound: Math.round(totalInbound * 100) / 100,
    totalOutbound: Math.round(totalOutbound * 100) / 100,
  };
}

function buildTopUsedParts(movements: RawMovementRow[]): TopUsedPartRow[] {
  const totals = new Map<
    string,
    { part_code: string; description: string; total_quantity: number }
  >();

  for (const movement of movements) {
    if (movement.movement_type !== "work_order_usage") continue;
    const qty = Math.abs(Number(movement.quantity_change ?? 0));
    if (qty <= 0) continue;

    const partCode = movement.parts?.part_code ?? movement.part_id;
    const existing = totals.get(movement.part_id);
    if (existing) {
      existing.total_quantity += qty;
    } else {
      totals.set(movement.part_id, {
        part_code: partCode,
        description: movement.parts?.description ?? "—",
        total_quantity: qty,
      });
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 5);
}

function mapStockRows(stockRows: RawStockRow[]): StockReportRow[] {
  return stockRows
    .map((row) => {
      const status = (row.stock_status ?? "ok") as StockStatus;
      return {
        part_code: row.part_code ?? "—",
        description: row.description ?? "—",
        branch_name: row.branch_name ?? "—",
        current_quantity: Number(row.current_quantity ?? 0),
        min_stock: Number(row.min_stock ?? 0),
        stock_status: status,
        stock_status_label:
          STOCK_STATUS_LABELS[status as keyof typeof STOCK_STATUS_LABELS] ??
          status,
      };
    })
    .sort((a, b) => a.part_code.localeCompare(b.part_code, "tr"));
}

export async function fetchStockReportData(
  supabase: AppSupabaseClient,
  filters: ReportFilterInput,
  branchId?: string,
): Promise<StockReportData> {
  const period = resolveReportPeriod(
    filters.period,
    filters.dateFrom,
    filters.dateTo,
  );

  let stockQuery = supabase.from("current_stock").select("*");
  if (branchId) {
    stockQuery = stockQuery.eq("branch_id", branchId);
  }

  let movementQuery = supabase
    .from("inventory_movements")
    .select(
      `
      part_id,
      quantity_change,
      movement_type,
      created_at,
      parts!inventory_movements_part_id_fkey ( part_code, description )
    `,
    )
    .gte("created_at", `${period.from}T00:00:00`)
    .lte("created_at", `${period.to}T23:59:59.999`);

  if (branchId) {
    movementQuery = movementQuery.eq("branch_id", branchId);
  }

  const [stockRes, movementRes] = await Promise.all([stockQuery, movementQuery]);

  if (stockRes.error) {
    throw new Error(stockRes.error.message);
  }
  if (movementRes.error) {
    throw new Error(movementRes.error.message);
  }

  const stockRows = ((stockRes.data ?? []) as RawStockRow[]).filter(
    (row) =>
      row.part_id &&
      row.branch_id &&
      isTrackedBranchStockRow(
        row.min_stock,
        Number(row.current_quantity ?? 0),
      ),
  );

  const movements = (movementRes.data ?? []) as unknown as RawMovementRow[];

  return {
    summary: buildSummary(stockRows, movements),
    topUsedParts: buildTopUsedParts(movements),
    rows: mapStockRows(stockRows),
    period,
  };
}

export function stockReportToCsvRows(data: StockReportData): string[][] {
  return [
    [
      "Ürün Kodu",
      "Ürün Adı",
      "Şube",
      "Mevcut Stok",
      "Kritik Seviye",
      "Durum",
    ],
    ...data.rows.map((row) => [
      row.part_code,
      row.description,
      row.branch_name,
      row.current_quantity.toLocaleString("tr-TR"),
      row.min_stock.toLocaleString("tr-TR"),
      row.stock_status_label,
    ]),
  ];
}
