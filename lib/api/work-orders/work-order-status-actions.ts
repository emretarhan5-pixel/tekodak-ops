import type { WorkOrderStatus } from "@/lib/constants/work-order";

export type WorkOrderStatusAction = "start" | "complete" | "cancel";

/** Detay sayfasında gösterilecek durum aksiyonları. */
export function getAvailableStatusActions(
  status: WorkOrderStatus,
  hasAssignee: boolean,
): WorkOrderStatusAction[] {
  if (status === "completed" || status === "cancelled") {
    return [];
  }

  const actions: WorkOrderStatusAction[] = [];

  if (
    status === "assigned" ||
    status === "on_hold" ||
    (status === "new" && hasAssignee)
  ) {
    actions.push("start");
  }

  if (status === "in_progress") {
    actions.push("complete");
    actions.push("cancel");
  }

  return actions;
}

export function resolveStatusAfterAction(
  current: WorkOrderStatus,
  action: WorkOrderStatusAction,
): WorkOrderStatus | null {
  switch (action) {
    case "start":
      if (
        current === "assigned" ||
        current === "on_hold" ||
        current === "new"
      ) {
        return "in_progress";
      }
      return null;
    case "complete":
      if (current === "in_progress") {
        return "completed";
      }
      return null;
    case "cancel":
      if (current !== "completed" && current !== "cancelled") {
        return "cancelled";
      }
      return null;
    default:
      return null;
  }
}

/** `new` + atanan varsa önce `assigned` (timer trigger için). */
export function needsAssignedBeforeStart(status: WorkOrderStatus): boolean {
  return status === "new";
}
