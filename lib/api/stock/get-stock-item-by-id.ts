"use server";

import {
  assertCanAccessBranch,
  getStockApiContext,
  resolveBranchFilter,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import {
  mapPartCategoryLabel,
  mapStockRowStatus,
} from "@/lib/api/stock/stock-helpers";
import {
  mapStockMovementRows,
  type RawMovementRow,
} from "@/lib/api/stock/stock-movement-helpers";
import type { StockItemDetail } from "@/lib/api/stock/types";
import type { PartCategory, PartUnit } from "@/lib/constants/stock-item";
import type { WorkOrderStatus } from "@/lib/constants/work-order";

const RELATED_WORK_ORDERS_SELECT = `
  id,
  quantity,
  added_at,
  work_orders!work_order_parts_work_order_id_fkey!inner (
    id,
    work_order_number,
    status,
    branch_id,
    deleted_at
  ),
  added_by_user:users!work_order_parts_added_by_fkey (
    full_name
  )
`;

type RawRelatedWorkOrderRow = {
  id: string;
  quantity: number;
  added_at: string;
  work_orders: {
    id: string;
    work_order_number: string;
    status: WorkOrderStatus;
    branch_id: string;
    deleted_at: string | null;
  };
  added_by_user: { full_name: string };
};

async function resolveDetailBranchId(
  ctx: Awaited<ReturnType<typeof getStockApiContext>>,
  partId: string,
  branchId?: string,
): Promise<string> {
  const scoped = resolveBranchFilter(ctx, branchId);
  if (scoped) {
    return scoped;
  }

  const { data: branchRows, error } = await ctx.supabase
    .from("part_branch_stock")
    .select("branch_id")
    .eq("part_id", partId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const fallback = branchRows?.[0]?.branch_id;
  if (!fallback) {
    throw new StockApiError("Şube seçimi gereklidir", "FORBIDDEN");
  }

  return fallback;
}

async function fetchRelatedWorkOrders(
  ctx: Awaited<ReturnType<typeof getStockApiContext>>,
  partId: string,
  branchId: string,
) {
  const { data, error } = await ctx.supabase
    .from("work_order_parts")
    .select(RELATED_WORK_ORDERS_SELECT)
    .eq("part_id", partId)
    .eq("work_orders.branch_id", branchId)
    .is("work_orders.deleted_at", null)
    .order("added_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as RawRelatedWorkOrderRow[]).map((row) => ({
    id: row.id,
    work_order_id: row.work_orders.id,
    work_order_number: row.work_orders.work_order_number,
    work_order_status: row.work_orders.status,
    quantity: Number(row.quantity),
    added_at: row.added_at,
    added_by_name: row.added_by_user.full_name,
  }));
}

const PART_DETAIL_SELECT = `
  id,
  part_code,
  description,
  category,
  unit,
  brand_id,
  list_price,
  minimum_price,
  unit_cost,
  supplier_name,
  supplier_code,
  notes,
  created_at,
  updated_at,
  brands!parts_brand_id_fkey (
    name
  ),
  creator:users!parts_created_by_fkey (
    full_name
  )
`;

const MOVEMENTS_SELECT = `
  id,
  part_id,
  branch_id,
  movement_type,
  quantity_change,
  reason,
  notes,
  reference_type,
  reference_id,
  created_at,
  created_by,
  branches!inventory_movements_branch_id_fkey (
    name
  ),
  creator:users!inventory_movements_created_by_fkey (
    full_name
  )
`;

type RawPartRow = {
  id: string;
  part_code: string;
  description: string;
  category: PartCategory;
  unit: PartUnit;
  brand_id: string | null;
  list_price: number | null;
  minimum_price: number | null;
  unit_cost: number | null;
  supplier_name: string | null;
  supplier_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  brands: { name: string } | null;
  creator: { full_name: string } | null;
};

export async function getStockItemById(
  partId: string,
  branchId?: string,
): Promise<StockItemDetail> {
  try {
    const ctx = await getStockApiContext();
    const resolvedBranchId = await resolveDetailBranchId(ctx, partId, branchId);

    assertCanAccessBranch(ctx, resolvedBranchId);

    const { data: part, error: partError } = await ctx.supabase
      .from("parts")
      .select(PART_DETAIL_SELECT)
      .eq("id", partId)
      .is("deleted_at", null)
      .maybeSingle();

    if (partError) {
      throw new Error(partError.message);
    }

    if (!part) {
      throw new StockApiError("Stok ürünü bulunamadı", "NOT_FOUND");
    }

    const rawPart = part as unknown as RawPartRow;

    const { data: branchStock, error: branchStockError } = await ctx.supabase
      .from("part_branch_stock")
      .select(
        `
        min_stock,
        max_stock,
        branches!part_branch_stock_branch_id_fkey (
          id,
          name,
          code
        )
      `,
      )
      .eq("part_id", partId)
      .eq("branch_id", resolvedBranchId)
      .maybeSingle();

    if (branchStockError) {
      throw new Error(branchStockError.message);
    }

    if (!branchStock) {
      throw new StockApiError(
        "Bu ürün seçilen şubede tanımlı değil",
        "NOT_FOUND",
      );
    }

    const { data: stockRow, error: stockError } = await ctx.supabase
      .from("current_stock")
      .select("current_quantity, stock_status")
      .eq("part_id", partId)
      .eq("branch_id", resolvedBranchId)
      .maybeSingle();

    if (stockError) {
      throw new Error(stockError.message);
    }

    const currentQuantity = Number(stockRow?.current_quantity ?? 0);
    const { stock_status, status_variant } = mapStockRowStatus(
      stockRow?.stock_status ?? null,
      currentQuantity,
    );

    const branchInfo = branchStock.branches as {
      id: string;
      name: string;
      code: string;
    };

    const { data: movementRows, error: movementsError } = await ctx.supabase
      .from("inventory_movements")
      .select(MOVEMENTS_SELECT)
      .eq("part_id", partId)
      .eq("branch_id", resolvedBranchId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (movementsError) {
      throw new Error(movementsError.message);
    }

    const movements = await mapStockMovementRows(
      ctx.supabase,
      (movementRows ?? []) as unknown as RawMovementRow[],
    );

    const related_work_orders = await fetchRelatedWorkOrders(
      ctx,
      partId,
      resolvedBranchId,
    );

    return {
      part_id: rawPart.id,
      part_code: rawPart.part_code,
      description: rawPart.description,
      category: rawPart.category,
      category_label: mapPartCategoryLabel(rawPart.category),
      unit: rawPart.unit,
      brand_id: rawPart.brand_id,
      brand_name: rawPart.brands?.name ?? null,
      list_price: rawPart.list_price,
      minimum_price: rawPart.minimum_price,
      unit_cost: rawPart.unit_cost,
      supplier_name: rawPart.supplier_name,
      supplier_code: rawPart.supplier_code,
      notes: rawPart.notes,
      created_at: rawPart.created_at,
      updated_at: rawPart.updated_at,
      created_by_name: rawPart.creator?.full_name ?? "—",
      branch: {
        branch_id: branchInfo.id,
        branch_name: branchInfo.name,
        branch_code: branchInfo.code,
        min_stock: Number(branchStock.min_stock ?? 0),
        max_stock:
          branchStock.max_stock != null ? Number(branchStock.max_stock) : null,
        current_quantity: currentQuantity,
        stock_status,
        status_variant,
      },
      movements,
      related_work_orders,
    };
  } catch (error) {
    if (error instanceof StockApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}
