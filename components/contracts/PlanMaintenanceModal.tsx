"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { SubmitButton } from "@/components/auth/submit-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createMaintenancePlan } from "@/lib/api/maintenance/create-maintenance-plan";
import { getMaintenanceFormOptions } from "@/lib/api/maintenance/get-maintenance-form-options";
import type { MaintenanceFormOptions } from "@/lib/api/maintenance/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

const textareaClassName = cn(
  selectClassName,
  "min-h-[88px] resize-y py-2.5",
);

const planMaintenanceModalSchema = z.object({
  planned_date: z
    .string()
    .min(1, "Planlanan tarih gereklidir")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih girin"),
  assigned_technician_id: z.string().uuid("Teknisyen seçin"),
  device_ids: z
    .array(z.string().uuid())
    .min(1, "En az bir cihaz seçin"),
  notes: z.string().trim().max(5000).optional().nullable(),
});

type PlanMaintenanceModalValues = z.infer<typeof planMaintenanceModalSchema>;

type PlanMaintenanceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  currentUserId: string;
  isAdmin: boolean;
};

function emptyValues(): PlanMaintenanceModalValues {
  return {
    planned_date: "",
    assigned_technician_id: "",
    device_ids: [],
    notes: "",
  };
}

export function PlanMaintenanceModal({
  open,
  onOpenChange,
  contractId,
  currentUserId,
  isAdmin,
}: PlanMaintenanceModalProps) {
  const router = useRouter();
  const [options, setOptions] = useState<MaintenanceFormOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanMaintenanceModalValues>({
    resolver: zodResolver(planMaintenanceModalSchema),
    defaultValues: emptyValues(),
  });

  const deviceIds = watch("device_ids") ?? [];

  useEffect(() => {
    if (!open) {
      setOptions(null);
      reset(emptyValues());
      return;
    }

    let cancelled = false;
    setLoadingOptions(true);

    getMaintenanceFormOptions(contractId)
      .then((data) => {
        if (cancelled) return;
        setOptions(data);
        reset({
          ...emptyValues(),
          assigned_technician_id: isAdmin ? "" : currentUserId,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(
          error instanceof Error
            ? error.message
            : "Form seçenekleri yüklenemedi",
        );
        onOpenChange(false);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, contractId, currentUserId, isAdmin, onOpenChange, reset]);

  function toggleDevice(deviceId: string, checked: boolean) {
    const next = checked
      ? [...new Set([...deviceIds, deviceId])]
      : deviceIds.filter((id) => id !== deviceId);
    setValue("device_ids", next, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(values: PlanMaintenanceModalValues) {
    setIsSubmitting(true);

    try {
      const result = await createMaintenancePlan({
        contract_id: contractId,
        planned_date: values.planned_date,
        assigned_technician_id: values.assigned_technician_id,
        device_ids: values.device_ids,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      });

      if (!result.success) {
        toast.error(result.error ?? "Bakım planı oluşturulamadı");
        return;
      }

      toast.success("Bakım planı oluşturuldu");
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Yeni bakım planla</DialogTitle>
          <DialogDescription>
            Planlanan tarih, teknisyen ve kapsanan cihazları seçin.
          </DialogDescription>
        </DialogHeader>

        {loadingOptions ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Form yükleniyor…
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="planned_date">Planlanan tarih *</FieldLabel>
                <Input
                  id="planned_date"
                  type="date"
                  className="h-10"
                  {...register("planned_date")}
                />
                <FieldError errors={[errors.planned_date]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="assigned_technician_id">
                  Teknisyen *
                </FieldLabel>
                <select
                  id="assigned_technician_id"
                  className={selectClassName}
                  disabled={!isAdmin}
                  {...register("assigned_technician_id")}
                >
                  <option value="">Teknisyen seçin</option>
                  {(options?.technicians ?? []).map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </option>
                  ))}
                </select>
                {!isAdmin ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Personel yalnızca kendine plan oluşturabilir
                  </p>
                ) : null}
                <FieldError errors={[errors.assigned_technician_id]} />
              </Field>

              <Field>
                <FieldLabel>Kapsanan cihazlar *</FieldLabel>
                {(options?.devices.length ?? 0) === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                    Bu sözleşmeye bağlı cihaz bulunamadı
                  </p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
                    {(options?.devices ?? []).map((device) => {
                      const checked = deviceIds.includes(device.device_id);
                      return (
                        <label
                          key={device.device_id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50",
                            checked && "bg-muted/40",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) =>
                              toggleDevice(device.device_id, value === true)
                            }
                            className="mt-0.5"
                          />
                          <span className="text-sm leading-snug">
                            <span className="font-medium">{device.label}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <FieldError errors={[errors.device_ids]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="notes">Notlar</FieldLabel>
                <textarea
                  id="notes"
                  className={textareaClassName}
                  rows={3}
                  placeholder="Opsiyonel bakım notları…"
                  {...register("notes")}
                />
                <FieldError errors={[errors.notes]} />
              </Field>
            </FieldGroup>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <SubmitButton
                type="submit"
                className="h-10 min-h-10"
                isLoading={isSubmitting}
                loadingText="Kaydediliyor…"
                disabled={(options?.devices.length ?? 0) === 0}
              >
                Planı oluştur
              </SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
