"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ServiceRequestPhotos } from "@/components/service-requests/ServiceRequestPhotos";
import { ServiceRequestParts } from "@/components/service-requests/ServiceRequestParts";
import { formatServiceRequestMoney } from "@/components/service-requests/service-request-form-styles";
import { ServiceRequestStatusBadge } from "@/components/service-requests/service-request-status-badge";
import { ServiceRequestStep2Form } from "@/components/service-requests/ServiceRequestStep2Form";
import { ServiceRequestStep3Form } from "@/components/service-requests/ServiceRequestStep3Form";
import { ServiceRequestStep4Form } from "@/components/service-requests/ServiceRequestStep4Form";
import { ServiceRequestStep5Form } from "@/components/service-requests/ServiceRequestStep5Form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { advanceServiceRequestFromStep1 } from "@/lib/api/service-requests/advance-service-request";
import type {
  AddServiceRequestPartAction,
  DeleteServiceRequestPhotoAction,
  GetServiceRequestPhotoUrlAction,
  RemoveServiceRequestPartAction,
  ServiceRequestDetail as ServiceRequestDetailData,
  ServiceRequestPartOption,
  UploadServiceRequestPhotoAction,
} from "@/lib/api/service-requests/types";
import {
  SERVICE_REQUEST_CUSTOMER_DECISION_LABELS,
  SERVICE_REQUEST_DELIVERY_METHOD_LABELS,
  SERVICE_REQUEST_STEP_LABELS,
  SERVICE_REQUEST_VAT_OPTION_LABELS,
  type ServiceRequestStep,
} from "@/lib/constants/service-request";
import { cn } from "@/lib/utils";

type StepVisualState = "completed" | "active" | "upcoming" | "locked";

type ServiceRequestDetailProps = {
  serviceRequest: ServiceRequestDetailData;
  uploadPhotoAction: UploadServiceRequestPhotoAction;
  deletePhotoAction: DeleteServiceRequestPhotoAction;
  getPhotoUrlAction: GetServiceRequestPhotoUrlAction;
  getPartOptionsAction: (
    serviceRequestId: string,
  ) => Promise<ServiceRequestPartOption[]>;
  addPartAction: AddServiceRequestPartAction;
  removePartAction: RemoveServiceRequestPartAction;
};

function formatDateTime(value: string): string {
  try {
    return format(parseISO(value), "d MMMM yyyy, HH:mm", { locale: tr });
  } catch {
    return value;
  }
}

function getStepState(
  step: ServiceRequestStep,
  detail: ServiceRequestDetailData,
): StepVisualState {
  if (detail.status === "tamamlandi") {
    return "completed";
  }

  if (detail.status === "rejected") {
    if (step < 3) return "completed";
    if (step === 3) return "active";
    return "locked";
  }

  if (step < detail.current_step) {
    return "completed";
  }

  if (step === detail.current_step) {
    return "active";
  }

  return "upcoming";
}

function isStepEditable(
  step: ServiceRequestStep,
  detail: ServiceRequestDetailData,
): boolean {
  if (!detail.can_edit) return false;
  if (detail.status === "rejected" || detail.status === "tamamlandi") {
    return false;
  }
  return detail.active_edit_step === step;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function StepLockedMessage() {
  return (
    <p className="text-sm text-muted-foreground">
      Bu adım henüz açılmadı. Önceki adımları tamamlayın.
    </p>
  );
}

function Step1Content({
  serviceRequest,
  state,
}: {
  serviceRequest: ServiceRequestDetailData;
  state: StepVisualState;
}) {
  const router = useRouter();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const editable =
    state === "active" &&
    serviceRequest.status === "draft" &&
    serviceRequest.can_edit;

  async function handleAdvanceFromDraft() {
    setIsAdvancing(true);
    try {
      const result = await advanceServiceRequestFromStep1({
        id: serviceRequest.id,
        company_name: serviceRequest.company_name,
        contact_name: serviceRequest.contact_name,
        phone: serviceRequest.phone,
        address: serviceRequest.address,
        device_type: serviceRequest.device_type,
        brand_model: serviceRequest.brand_model,
        device_model_id: serviceRequest.device_model_id,
        serial_number: serviceRequest.serial_number,
        under_warranty: serviceRequest.under_warranty,
        reported_fault: serviceRequest.reported_fault,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Kayıt onaylandı, arıza tespit adımına geçildi");
      router.refresh();
    } finally {
      setIsAdvancing(false);
    }
  }

  if (state === "upcoming" || state === "locked") {
    return <StepLockedMessage />;
  }

  return (
    <div className="space-y-4">
      <dl className="space-y-4">
        <DetailRow label="Firma / Kurum" value={serviceRequest.company_name} />
        <DetailRow label="Ad Soyad" value={serviceRequest.contact_name} />
        <DetailRow label="Telefon" value={serviceRequest.phone} />
        <DetailRow label="Adres" value={serviceRequest.address} />
        <DetailRow label="Cihaz türü" value={serviceRequest.device_type} />
        <DetailRow label="Marka / Model" value={serviceRequest.brand_model} />
        <DetailRow
          label="Seri no"
          value={
            <span className="font-mono">{serviceRequest.serial_number}</span>
          }
        />
        <DetailRow
          label="Garanti"
          value={serviceRequest.under_warranty ? "Evet" : "Hayır"}
        />
        <DetailRow
          label="Bildirilen arıza"
          value={
            <span className="whitespace-pre-wrap">
              {serviceRequest.reported_fault}
            </span>
          }
        />
        <DetailRow
          label="Sorumlu teknisyen"
          value={serviceRequest.technician_name}
        />
        <DetailRow label="Şube" value={serviceRequest.branch_name} />
      </dl>

      {editable ? (
        <div className="flex justify-end border-t border-border pt-4">
          <Button
            type="button"
            className="h-11 w-full sm:w-auto"
            disabled={isAdvancing}
            onClick={() => void handleAdvanceFromDraft()}
          >
            {isAdvancing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                İşleniyor…
              </>
            ) : (
              "Arıza Tespit Adımına Geç"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Step2ReadOnly({
  serviceRequest,
  uploadPhotoAction,
  deletePhotoAction,
  getPhotoUrlAction,
}: {
  serviceRequest: ServiceRequestDetailData;
  uploadPhotoAction: UploadServiceRequestPhotoAction;
  deletePhotoAction: DeleteServiceRequestPhotoAction;
  getPhotoUrlAction: GetServiceRequestPhotoUrlAction;
}) {
  return (
    <div className="space-y-6">
      <dl className="space-y-4">
        <DetailRow
          label="Tespit edilen arıza"
          value={
            <span className="whitespace-pre-wrap">
              {serviceRequest.diagnosed_fault ?? "—"}
            </span>
          }
        />
        <DetailRow
          label="Müşteri beyanı"
          value={
            <span className="whitespace-pre-wrap">
              {serviceRequest.customer_statement ?? "—"}
            </span>
          }
        />
        <DetailRow
          label="Teknik inceleme"
          value={
            <span className="whitespace-pre-wrap">
              {serviceRequest.technical_inspection_result ?? "—"}
            </span>
          }
        />
        <DetailRow
          label="Yanlış kullanım"
          value={serviceRequest.wrong_usage_detected ? "Evet" : "Hayır"}
        />
      </dl>
      <div className="space-y-3">
        <p className="text-sm font-medium">Fotoğraflar</p>
        <ServiceRequestPhotos
          serviceRequestId={serviceRequest.id}
          step={2}
          photos={serviceRequest.photos}
          canEdit={false}
          uploadPhotoAction={uploadPhotoAction}
          deletePhotoAction={deletePhotoAction}
          getPhotoUrlAction={getPhotoUrlAction}
        />
      </div>
    </div>
  );
}

function Step3ReadOnly({ serviceRequest }: { serviceRequest: ServiceRequestDetailData }) {
  return (
    <div className="space-y-6">
      {serviceRequest.quote_lines.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Açıklama</TableHead>
                <TableHead className="text-right">Birim Fiyat</TableHead>
                <TableHead className="text-right">Adet</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceRequest.quote_lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{line.description}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatServiceRequestMoney(line.unit_price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatServiceRequestMoney(line.line_total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Teklif satırı yok.</p>
      )}

      <dl className="space-y-4">
        <DetailRow
          label="İşçilik"
          value={
            serviceRequest.labor_cost != null
              ? formatServiceRequestMoney(serviceRequest.labor_cost)
              : "—"
          }
        />
        <DetailRow
          label="Kargo"
          value={
            serviceRequest.shipping_cost != null
              ? formatServiceRequestMoney(serviceRequest.shipping_cost)
              : "—"
          }
        />
        <DetailRow
          label="KDV"
          value={
            serviceRequest.vat_option
              ? SERVICE_REQUEST_VAT_OPTION_LABELS[serviceRequest.vat_option]
              : "—"
          }
        />
        <DetailRow
          label="Toplam"
          value={
            serviceRequest.quote_total != null
              ? formatServiceRequestMoney(serviceRequest.quote_total)
              : "—"
          }
        />
        <DetailRow
          label="Müşteriye iletildi"
          value={serviceRequest.quote_sent_to_customer ? "Evet" : "Hayır"}
        />
        <DetailRow
          label="Müşteri kararı"
          value={
            SERVICE_REQUEST_CUSTOMER_DECISION_LABELS[
              serviceRequest.customer_decision
            ]
          }
        />
        {serviceRequest.customer_decision === "rejected" ? (
          <DetailRow
            label="Cihaz iade"
            value={serviceRequest.device_returned ? "Evet" : "Hayır"}
          />
        ) : null}
      </dl>
    </div>
  );
}

function Step4ReadOnly({
  serviceRequest,
  uploadPhotoAction,
  deletePhotoAction,
  getPhotoUrlAction,
  getPartOptionsAction,
  addPartAction,
  removePartAction,
}: {
  serviceRequest: ServiceRequestDetailData;
  uploadPhotoAction: UploadServiceRequestPhotoAction;
  deletePhotoAction: DeleteServiceRequestPhotoAction;
  getPhotoUrlAction: GetServiceRequestPhotoUrlAction;
  getPartOptionsAction: (
    serviceRequestId: string,
  ) => Promise<ServiceRequestPartOption[]>;
  addPartAction: AddServiceRequestPartAction;
  removePartAction: RemoveServiceRequestPartAction;
}) {
  return (
    <div className="space-y-6">
      <dl className="space-y-4">
        <DetailRow
          label="Yapılan iş"
          value={
            <span className="whitespace-pre-wrap">
              {serviceRequest.work_description ?? "—"}
            </span>
          }
        />
        <DetailRow
          label="Teslim şekli"
          value={
            serviceRequest.delivery_method
              ? SERVICE_REQUEST_DELIVERY_METHOD_LABELS[
                  serviceRequest.delivery_method
                ]
              : "—"
          }
        />
        <DetailRow
          label="Teslim edildi"
          value={serviceRequest.delivered ? "Evet" : "Hayır"}
        />
      </dl>

      <div className="space-y-3">
        <p className="text-sm font-medium">Kullanılan parçalar</p>
        <ServiceRequestParts
          serviceRequestId={serviceRequest.id}
          parts={serviceRequest.parts}
          canEdit={false}
          getPartOptionsAction={getPartOptionsAction}
          addPartAction={addPartAction}
          removePartAction={removePartAction}
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Fotoğraflar</p>
        <ServiceRequestPhotos
          serviceRequestId={serviceRequest.id}
          step={4}
          photos={serviceRequest.photos}
          canEdit={false}
          uploadPhotoAction={uploadPhotoAction}
          deletePhotoAction={deletePhotoAction}
          getPhotoUrlAction={getPhotoUrlAction}
        />
      </div>
    </div>
  );
}

function Step5ReadOnly({ serviceRequest }: { serviceRequest: ServiceRequestDetailData }) {
  if (serviceRequest.status === "tamamlandi") {
    return <ServiceRequestStep5Form serviceRequest={serviceRequest} />;
  }

  return (
    <dl className="space-y-4">
      <DetailRow
        label="Fatura kesildi"
        value={serviceRequest.invoice_issued ? "Evet" : "Hayır"}
      />
      <DetailRow
        label="Fatura no"
        value={
          serviceRequest.invoice_number ? (
            <span className="font-mono">{serviceRequest.invoice_number}</span>
          ) : (
            "—"
          )
        }
      />
      <DetailRow
        label="Ödeme alındı"
        value={serviceRequest.payment_received ? "Evet" : "Hayır"}
      />
    </dl>
  );
}

export function ServiceRequestDetail({
  serviceRequest,
  uploadPhotoAction,
  deletePhotoAction,
  getPhotoUrlAction,
  getPartOptionsAction,
  addPartAction,
  removePartAction,
}: ServiceRequestDetailProps) {
  const steps = [1, 2, 3, 4, 5] as const;

  function renderStepContent(step: ServiceRequestStep, state: StepVisualState) {
    if (state === "upcoming" || state === "locked") {
      return <StepLockedMessage />;
    }

    const editable = isStepEditable(step, serviceRequest);

    switch (step) {
      case 1:
        return <Step1Content serviceRequest={serviceRequest} state={state} />;
      case 2:
        if (editable) {
          return (
            <ServiceRequestStep2Form
              serviceRequest={serviceRequest}
              uploadPhotoAction={uploadPhotoAction}
              deletePhotoAction={deletePhotoAction}
              getPhotoUrlAction={getPhotoUrlAction}
            />
          );
        }
        return (
          <Step2ReadOnly
            serviceRequest={serviceRequest}
            uploadPhotoAction={uploadPhotoAction}
            deletePhotoAction={deletePhotoAction}
            getPhotoUrlAction={getPhotoUrlAction}
          />
        );
      case 3:
        if (editable && serviceRequest.status !== "rejected") {
          return <ServiceRequestStep3Form serviceRequest={serviceRequest} />;
        }
        return <Step3ReadOnly serviceRequest={serviceRequest} />;
      case 4:
        if (editable) {
          return (
            <ServiceRequestStep4Form
              serviceRequest={serviceRequest}
              uploadPhotoAction={uploadPhotoAction}
              deletePhotoAction={deletePhotoAction}
              getPhotoUrlAction={getPhotoUrlAction}
              getPartOptionsAction={getPartOptionsAction}
              addPartAction={addPartAction}
              removePartAction={removePartAction}
            />
          );
        }
        return (
          <Step4ReadOnly
            serviceRequest={serviceRequest}
            uploadPhotoAction={uploadPhotoAction}
            deletePhotoAction={deletePhotoAction}
            getPhotoUrlAction={getPhotoUrlAction}
            getPartOptionsAction={getPartOptionsAction}
            addPartAction={addPartAction}
            removePartAction={removePartAction}
          />
        );
      case 5:
        if (editable) {
          return <ServiceRequestStep5Form serviceRequest={serviceRequest} />;
        }
        return <Step5ReadOnly serviceRequest={serviceRequest} />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/service-requests"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1 px-0",
          )}
        >
          <ChevronLeft className="size-4" />
          Servis taleplerine dön
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-sm text-muted-foreground">
              {serviceRequest.request_number}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {serviceRequest.company_name}
            </h1>
            <p className="text-muted-foreground">
              {serviceRequest.contact_name} · {serviceRequest.phone}
            </p>
            <p className="text-sm text-muted-foreground">
              Oluşturulma: {formatDateTime(serviceRequest.created_at)}
            </p>
          </div>
          <ServiceRequestStatusBadge
            status={serviceRequest.status}
            variant={serviceRequest.status_variant}
            className="w-fit"
          />
        </div>
      </div>

      <nav aria-label="Servis talebi adımları">
        <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2">
          {steps.map((step, index) => {
            const state = getStepState(step, serviceRequest);
            return (
              <li key={step} className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-2 rounded-lg border px-2 py-3 text-center transition-colors sm:px-3",
                    state === "completed" &&
                      "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
                    state === "active" &&
                      "border-primary bg-primary/5 ring-2 ring-primary/20",
                    (state === "upcoming" || state === "locked") &&
                      "border-border bg-muted/30 text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                      state === "completed" &&
                        "bg-emerald-600 text-white dark:bg-emerald-500",
                      state === "active" && "bg-primary text-primary-foreground",
                      (state === "upcoming" || state === "locked") &&
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {state === "completed" ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      step
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium leading-tight sm:text-sm",
                      state === "active" && "text-foreground",
                    )}
                  >
                    {SERVICE_REQUEST_STEP_LABELS[step]}
                  </span>
                </div>
                {index < steps.length - 1 ? (
                  <div
                    aria-hidden
                    className="hidden h-px flex-1 bg-border sm:block"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>

      {steps.map((step) => {
        const state = getStepState(step, serviceRequest);
        const isMuted = state === "upcoming" || state === "locked";

        return (
          <Card
            key={step}
            className={cn(isMuted && "opacity-60")}
          >
            <CardHeader>
              <CardTitle>
                Adım {step} — {SERVICE_REQUEST_STEP_LABELS[step]}
              </CardTitle>
              {step === 1 ? (
                <CardDescription>Müşteri ve cihaz bilgileri</CardDescription>
              ) : null}
              {state === "active" && isStepEditable(step, serviceRequest) ? (
                <CardDescription className="text-primary">
                  Aktif adım — düzenleyebilirsiniz
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>{renderStepContent(step, state)}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}
