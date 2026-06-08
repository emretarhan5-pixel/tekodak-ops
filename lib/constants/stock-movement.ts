/** UI hareket türleri — form ve filtreler için. */
export const STOCK_MOVEMENT_KINDS = [
  "in",
  "out",
  "transfer",
  "adjustment",
] as const;

export type StockMovementKind = (typeof STOCK_MOVEMENT_KINDS)[number];

export const STOCK_MOVEMENT_KIND_LABELS: Record<StockMovementKind, string> = {
  in: "Giriş",
  out: "Çıkış",
  transfer: "Transfer",
  adjustment: "Sayım Düzeltme",
};

/** DB `inventory_movements.movement_type` CHECK değerleri. */
export const INVENTORY_MOVEMENT_TYPES = [
  "stock_in",
  "work_order_usage",
  "service_request_usage",
  "manual_out",
  "transfer_out",
  "transfer_in",
  "adjustment",
  "return",
] as const;

export type InventoryMovementType =
  (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const INVENTORY_MOVEMENT_TYPE_LABELS: Record<
  InventoryMovementType,
  string
> = {
  stock_in: "Giriş",
  work_order_usage: "İş Emri Kullanımı",
  service_request_usage: "Servis Talebi Kullanımı",
  manual_out: "Çıkış",
  transfer_out: "Transfer Çıkış",
  transfer_in: "Transfer Giriş",
  adjustment: "Sayım Düzeltme",
  return: "İade",
};

/** UI kind → DB movement_type (transfer ayrı işlenir). */
export const STOCK_MOVEMENT_KIND_TO_DB: Record<
  Exclude<StockMovementKind, "transfer">,
  InventoryMovementType
> = {
  in: "stock_in",
  out: "manual_out",
  adjustment: "adjustment",
};

export type MovementDisplayTone =
  | "in"
  | "out"
  | "transfer"
  | "adjustment"
  | "neutral";

export function getMovementDisplayTone(
  movementType: InventoryMovementType,
): MovementDisplayTone {
  switch (movementType) {
    case "stock_in":
    case "return":
    case "transfer_in":
      return "in";
    case "manual_out":
    case "work_order_usage":
    case "service_request_usage":
    case "transfer_out":
      return "out";
    case "adjustment":
      return "adjustment";
    default:
      return "neutral";
  }
}

export function isTransferMovementType(
  movementType: InventoryMovementType,
): boolean {
  return (
    movementType === "transfer_in" || movementType === "transfer_out"
  );
}
