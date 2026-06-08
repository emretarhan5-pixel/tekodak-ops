import { revalidatePath } from "next/cache";

export function revalidateMaintenancePaths(
  planId: string,
  contractId: string,
): void {
  revalidatePath("/dashboard");
  revalidatePath(`/maintenance/${planId}`);
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/contracts");
}
