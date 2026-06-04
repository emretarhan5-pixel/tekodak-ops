"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { renewContract } from "@/lib/api/contracts/renew-contract";
import {
  isRenewableStatus,
  suggestRenewalDates,
} from "@/lib/api/contracts/renewal-helpers";
import type { ContractDetail } from "@/lib/api/contracts/types";

type RenewContractButtonProps = {
  contract: ContractDetail;
  canEdit: boolean;
};

export function RenewContractButton({
  contract,
  canEdit,
}: RenewContractButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const canRenew = canEdit && isRenewableStatus(contract.status);

  useEffect(() => {
    if (!open) return;
    const suggested = suggestRenewalDates(
      contract.start_date,
      contract.end_date,
    );
    setStartDate(suggested.start_date);
    setEndDate(suggested.end_date);
  }, [open, contract.start_date, contract.end_date]);

  if (!canRenew) {
    return null;
  }

  async function handleRenew() {
    if (!startDate || !endDate) {
      toast.error("Başlangıç ve bitiş tarihlerini girin");
      return;
    }

    if (endDate < startDate) {
      toast.error("Bitiş tarihi başlangıçtan önce olamaz");
      return;
    }

    setLoading(true);

    try {
      const result = await renewContract({
        contractId: contract.id,
        start_date: startDate,
        end_date: endDate,
      });

      if (!result.success) {
        toast.error(result.error ?? "Sözleşme yenilenemedi");
        return;
      }

      toast.success(
        `Yeni sözleşme oluşturuldu: ${result.data.contractNumber}`,
      );
      setOpen(false);
      router.push(`/contracts/${result.data.contractId}`);
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <RefreshCw className="size-4" />
        Yenile
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sözleşmeyi yenile</DialogTitle>
            <DialogDescription>
              <span className="font-mono">{contract.contract_number}</span>{" "}
              kopyalanarak yeni bir sözleşme oluşturulur. Mevcut kayıt
              &quot;Yenilendi&quot; olarak işaretlenir.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="renew_start_date">Başlangıç *</FieldLabel>
              <Input
                id="renew_start_date"
                type="date"
                className="h-10"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="renew_end_date">Bitiş *</FieldLabel>
              <Input
                id="renew_end_date"
                type="date"
                className="h-10"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setOpen(false)}
            >
              Vazgeç
            </Button>
            <Button type="button" disabled={loading} onClick={handleRenew}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Oluşturuluyor…
                </>
              ) : (
                "Yenile ve oluştur"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
