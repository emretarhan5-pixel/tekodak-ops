import type { StockStatusBadgeVariant } from "@/lib/constants/stock-item";
import type {
  PartCategory,
  PartUnit,
  StockStatus,
} from "@/lib/constants/stock-item";
import type { InventoryMovementType } from "@/lib/constants/stock-movement";
import type { WorkOrderStatus } from "@/lib/constants/work-order";

export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = { success: false; error: string };
export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export type StockListItem = {
  part_id: string;
  branch_id: string;
  part_code: string;
  description: string;
  category: PartCategory;
  category_label: string;
  unit: PartUnit;
  branch_name: string;
  current_quantity: number;
  min_stock: number;
  max_stock: number | null;
  stock_status: StockStatus;
  status_variant: StockStatusBadgeVariant;
};

export type StockListResult = {
  data: StockListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type StockListSummary = {
  totalItems: number;
  criticalCount: number;
  warningCount: number;
};

export type StockMovementItem = {
  id: string;
  part_id: string;
  branch_id: string;
  branch_name: string;
  movement_type: InventoryMovementType;
  quantity_change: number;
  reason: string | null;
  notes: string | null;
  reference_type: string | null;
  reference_id: string | null;
  work_order_number: string | null;
  created_at: string;
  created_by: string;
  created_by_name: string;
};

export type StockMovementListResult = {
  data: StockMovementItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type StockItemBranchStock = {
  branch_id: string;
  branch_name: string;
  branch_code: string;
  min_stock: number;
  max_stock: number | null;
  current_quantity: number;
  stock_status: StockStatus;
  status_variant: StockStatusBadgeVariant;
};

export type StockItemDetail = {
  part_id: string;
  part_code: string;
  description: string;
  category: PartCategory;
  category_label: string;
  unit: PartUnit;
  brand_id: string | null;
  brand_name: string | null;
  list_price: number | null;
  minimum_price: number | null;
  unit_cost: number | null;
  supplier_name: string | null;
  supplier_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  branch: StockItemBranchStock;
  movements: StockMovementItem[];
  related_work_orders: StockRelatedWorkOrderItem[];
};

export type StockRelatedWorkOrderItem = {
  id: string;
  work_order_id: string;
  work_order_number: string;
  work_order_status: WorkOrderStatus;
  quantity: number;
  added_at: string;
  added_by_name: string;
};

export type StockFilterBranch = { id: string; name: string; code: string };

export type StockFilterCategory = {
  code: PartCategory;
  label: string;
};

export type StockFilterOptions = {
  branches: StockFilterBranch[];
  categories: StockFilterCategory[];
};

export type StockItemDeletionImpact = {
  movementCount: number;
  workOrderPartCount: number;
  branchStockCount: number;
};

export type StockFormCategoryOption = {
  code: PartCategory;
  label: string;
};

export type StockFormBrandOption = {
  id: string;
  name: string;
};

export type StockFormBranchOption = {
  id: string;
  name: string;
  code: string;
};

export type StockFormOptions = {
  categories: StockFormCategoryOption[];
  branches: StockFormBranchOption[];
  brands: StockFormBrandOption[];
  defaultBranchId: string | null;
};

export type DeleteStockItemAction = (
  partId: string,
) => Promise<ActionResult<{ partId: string; hadMovements: boolean }>>;

export type GetStockItemDeletionImpactAction = (
  partId: string,
) => Promise<StockItemDeletionImpact>;

export type StockMovementFormWorkOrder = {
  id: string;
  work_order_number: string;
};

export type StockMovementFormOptions = {
  part_id: string;
  part_code: string;
  description: string;
  unit: PartUnit;
  branch_id: string;
  branch_name: string;
  branch_code: string;
  current_quantity: number;
  target_branches: StockFormBranchOption[];
  work_orders: StockMovementFormWorkOrder[];
};
