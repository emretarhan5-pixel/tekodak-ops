"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type DeleteConfirmCheckboxProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function DeleteConfirmCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: DeleteConfirmCheckboxProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3",
        className,
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
        className="mt-0.5 shrink-0"
      />
      <label
        htmlFor={id}
        className="cursor-pointer text-sm leading-snug text-foreground"
      >
        {label}
      </label>
    </div>
  );
}
