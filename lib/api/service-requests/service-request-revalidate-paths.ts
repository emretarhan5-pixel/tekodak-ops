import { revalidatePath } from "next/cache";

export function revalidateServiceRequestPaths(serviceRequestId: string): void {
  revalidatePath("/service-requests");
  revalidatePath(`/service-requests/${serviceRequestId}`);
  revalidatePath("/dashboard");
}
