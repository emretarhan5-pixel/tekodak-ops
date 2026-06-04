"use client";

import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StockMovementAddButtonProps = {
  label?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  stopPropagation?: boolean;
  onOpen: () => void;
};

export function StockMovementAddButton({
  label = "Hareket",
  variant = "secondary",
  size = "sm",
  className,
  stopPropagation = false,
  onOpen,
}: StockMovementAddButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-1.5", className)}
      data-stock-actions=""
      onPointerDown={(event) => {
        if (stopPropagation) {
          event.stopPropagation();
        }
      }}
      onClick={(event) => {
        event.preventDefault();
        if (stopPropagation) {
          event.stopPropagation();
        }
        onOpen();
      }}
    >
      <ArrowLeftRight className="size-3.5" />
      {label}
    </Button>
  );
}
