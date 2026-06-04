"use client";

import { Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ToggleCustomerPinAction } from "@/lib/api/customers/types";
import { cn } from "@/lib/utils";

type CustomerPinButtonProps = {
  customerId: string;
  isPinned: boolean;
  togglePinAction: ToggleCustomerPinAction;
};

export function CustomerPinButton({
  customerId,
  isPinned,
  togglePinAction,
}: CustomerPinButtonProps) {
  const router = useRouter();
  const [pinned, setPinned] = useState(isPinned);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);

    try {
      const result = await togglePinAction(customerId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setPinned(result.data.is_pinned);
      toast.success(
        result.data.is_pinned ? "Müşteri pinlendi" : "Pin kaldırıldı",
      );
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5"
      disabled={loading}
      onClick={handleToggle}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Star
          className={cn(
            "size-4",
            pinned && "fill-amber-400 text-amber-500",
          )}
        />
      )}
      {pinned ? "Pin'i Kaldır" : "Pinle"}
    </Button>
  );
}
