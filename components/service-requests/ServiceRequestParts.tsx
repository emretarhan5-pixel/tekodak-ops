"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SubmitButton } from "@/components/auth/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { selectClassName } from "@/components/service-requests/service-request-form-styles";
import { formatStockQuantity } from "@/components/stock/stock-utils";
import type {
  AddServiceRequestPartAction,
  RemoveServiceRequestPartAction,
  ServiceRequestPartItem,
  ServiceRequestPartOption,
} from "@/lib/api/service-requests/types";

type ServiceRequestPartsProps = {
  serviceRequestId: string;
  parts: ServiceRequestPartItem[];
  canEdit: boolean;
  getPartOptionsAction: (serviceRequestId: string) => Promise<ServiceRequestPartOption[]>;
  addPartAction: AddServiceRequestPartAction;
  removePartAction: RemoveServiceRequestPartAction;
};

function formatDateTime(value: string): string {
  try {
    return format(new Date(value), "d MMMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

export function ServiceRequestParts({
  serviceRequestId,
  parts,
  canEdit,
  getPartOptionsAction,
  addPartAction,
  removePartAction,
}: ServiceRequestPartsProps) {
  const router = useRouter();
  const [options, setOptions] = useState<ServiceRequestPartOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!canEdit) return;

    let cancelled = false;
    setOptionsLoading(true);

    getPartOptionsAction(serviceRequestId)
      .then((data) => {
        if (!cancelled) {
          setOptions(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Parça listesi yüklenemedi");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canEdit, getPartOptionsAction, serviceRequestId]);

  const selectedOption = useMemo(
    () => options.find((option) => option.part_id === selectedPartId) ?? null,
    [options, selectedPartId],
  );

  async function handleAddPart() {
    if (!selectedPartId) {
      toast.error("Parça seçin");
      return;
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error("Geçerli bir miktar girin");
      return;
    }

    if (
      selectedOption &&
      parsedQuantity > selectedOption.current_quantity
    ) {
      toast.error(
        `Yetersiz stok. Mevcut: ${formatStockQuantity(selectedOption.current_quantity, selectedOption.unit)}`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addPartAction({
        serviceRequestId,
        partId: selectedPartId,
        quantity: parsedQuantity,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Parça eklendi ve stoktan düşüldü");
      setSelectedPartId("");
      setQuantity("1");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemovePart(partRowId: string) {
    if (
      !window.confirm(
        "Bu parçayı kaldırmak stok iadesi oluşturur. Devam edilsin mi?",
      )
    ) {
      return;
    }

    setRemovingId(partRowId);
    try {
      const result = await removePartAction(partRowId);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Parça kaldırıldı, stok iade edildi");
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <p className="text-sm font-medium">Parça Ekle</p>
            <p className="text-sm text-muted-foreground">
              Şube stokundan parça seçin; kayıt otomatik stok çıkışı oluşturur.
            </p>
          </div>

          {optionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Parçalar yükleniyor…
            </div>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bu şubede tanımlı stok parçası bulunamadı.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
              <Field>
                <FieldLabel htmlFor="sr-part-select">Parça *</FieldLabel>
                <select
                  id="sr-part-select"
                  className={selectClassName}
                  disabled={isSubmitting}
                  value={selectedPartId}
                  onChange={(event) => setSelectedPartId(event.target.value)}
                >
                  <option value="">Parça seçin</option>
                  {options.map((option) => (
                    <option key={option.part_id} value={option.part_id}>
                      {option.part_code} — {option.description} (
                      {formatStockQuantity(
                        option.current_quantity,
                        option.unit,
                      )}{" "}
                      mevcut)
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <FieldLabel htmlFor="sr-part-quantity">Miktar *</FieldLabel>
                <Input
                  id="sr-part-quantity"
                  type="number"
                  min={0.01}
                  step="any"
                  className="h-10 tabular-nums"
                  disabled={isSubmitting}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </Field>

              <SubmitButton
                type="button"
                className="h-10 w-full gap-2 sm:w-auto"
                isLoading={isSubmitting}
                loadingText="Ekleniyor…"
                onClick={() => void handleAddPart()}
              >
                <Plus className="size-4" />
                Parça Ekle
              </SubmitButton>
            </div>
          )}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        {parts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Henüz parça eklenmemiş.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parça</TableHead>
                <TableHead className="text-right">Miktar</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Ekleyen</TableHead>
                <TableHead>Tarih</TableHead>
                {canEdit ? (
                  <TableHead className="text-right">İşlem</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {part.part_code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {part.part_description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatStockQuantity(part.quantity, part.part_unit)}
                  </TableCell>
                  <TableCell>
                    {part.inventory_movement_id ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                      >
                        Stoktan düşüldü
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Bekliyor</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{part.created_by_name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(part.created_at)}
                  </TableCell>
                  {canEdit ? (
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={removingId === part.id}
                        onClick={() => void handleRemovePart(part.id)}
                      >
                        {removingId === part.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        <span className="sr-only">Kaldır</span>
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
