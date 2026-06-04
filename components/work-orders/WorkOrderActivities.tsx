"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import type {
  AddWorkOrderNoteAction,
  WorkOrderActivityItem,
} from "@/lib/api/work-orders/types";
import {
  WORK_ORDER_ACTIVITY_TYPE_LABELS,
  type WorkOrderActivityType,
} from "@/lib/constants/work-order";
import { cn } from "@/lib/utils";

const textareaClassName = cn(
  "flex min-h-[88px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

type WorkOrderActivitiesProps = {
  workOrderId: string;
  activities: WorkOrderActivityItem[];
  canEdit: boolean;
  addNoteAction: AddWorkOrderNoteAction;
};

function formatDateTime(value: string): string {
  try {
    return format(new Date(value), "d MMMM yyyy HH:mm", { locale: tr });
  } catch {
    return "—";
  }
}

export function WorkOrderActivities({
  workOrderId,
  activities,
  canEdit,
  addNoteAction,
}: WorkOrderActivitiesProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAddNote() {
    const trimmed = note.trim();
    if (!trimmed) {
      toast.error("Not metni girin");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addNoteAction({
        workOrderId,
        description: trimmed,
      });

      if (!result.success) {
        toast.error(result.error ?? "Not eklenemedi");
        return;
      }

      toast.success("Aktivite eklendi");
      setNote("");
      router.refresh();
    } catch {
      toast.error("Beklenmeyen bir hata oluştu");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktivite ekle</CardTitle>
            <CardDescription>
              Manuel not veya saha gözlemi ekleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field>
              <FieldLabel htmlFor="work-order-note">Not *</FieldLabel>
              <textarea
                id="work-order-note"
                className={textareaClassName}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Örn. müşteri ile görüşüldü, parça sipariş edildi…"
                disabled={isSubmitting}
              />
            </Field>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={isSubmitting || !note.trim()}
              onClick={() => void handleAddNote()}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Aktivite Ekle
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Henüz aktivite kaydı yok. Durum değişiklikleri ve notlar burada
            listelenir.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Aktivite geçmişi</CardTitle>
            <CardDescription>En yeni kayıt üstte</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary" className="font-normal">
                      {WORK_ORDER_ACTIVITY_TYPE_LABELS[
                        activity.activity_type as WorkOrderActivityType
                      ] ?? activity.activity_type}
                    </Badge>
                    <time className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(activity.created_at)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {activity.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.user_name}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
