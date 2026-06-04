import type { InventoryMovementType } from "@/lib/constants/stock-movement";
import {
  getMovementDisplayTone,
  isTransferMovementType,
} from "@/lib/constants/stock-movement";
import { cn } from "@/lib/utils";

export function getMovementTypeBadgeClass(
  movementType: InventoryMovementType,
): string {
  const tone = getMovementDisplayTone(movementType);
  if (isTransferMovementType(movementType)) {
    return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200";
  }
  switch (tone) {
    case "in":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
    case "out":
      return "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
    case "adjustment":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function getMovementQuantityClass(
  movementType: InventoryMovementType,
  quantityChange: number,
): string {
  if (isTransferMovementType(movementType)) {
    return "text-blue-600 dark:text-blue-400";
  }
  const tone = getMovementDisplayTone(movementType);
  if (tone === "adjustment") {
    return quantityChange >= 0
      ? "text-amber-600 dark:text-amber-400"
      : "text-amber-700 dark:text-amber-300";
  }
  if (quantityChange > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (quantityChange < 0) {
    return "text-red-600 dark:text-red-400";
  }
  return "text-muted-foreground";
}

export function formatMovementQuantityPrefix(
  movementType: InventoryMovementType,
  quantityChange: number,
): string {
  if (isTransferMovementType(movementType)) {
    return quantityChange > 0 ? "↔ +" : "↔ −";
  }
  if (movementType === "adjustment") {
    return quantityChange >= 0 ? "~ +" : "~ −";
  }
  if (quantityChange > 0) return "+";
  if (quantityChange < 0) return "−";
  return "";
}

export function movementToneDotClass(
  movementType: InventoryMovementType,
): string {
  const base = "size-2 shrink-0 rounded-full";
  if (isTransferMovementType(movementType)) {
    return cn(base, "bg-blue-500");
  }
  if (movementType === "adjustment") {
    return cn(base, "bg-amber-500");
  }
  const tone = getMovementDisplayTone(movementType);
  if (tone === "in") return cn(base, "bg-emerald-500");
  if (tone === "out") return cn(base, "bg-red-500");
  return cn(base, "bg-muted-foreground/50");
}

export function resolveMovementCreatedAt(
  movementDate?: string | null,
): string | undefined {
  if (!movementDate) return undefined;
  return `${movementDate}T12:00:00.000Z`;
}
