import {
  emailButtonHtml,
  emailDetailRowHtml,
  escapeHtml,
  wrapEmailLayout,
} from "@/lib/email/templates/email-layout";

export type WorkOrderAssignedEmailProps = {
  assigneeName: string;
  workOrderNumber: string;
  customerName: string;
  scheduledLabel: string;
  workOrderUrl: string;
};

export function getWorkOrderAssignedSubject(workOrderNumber: string): string {
  return `Yeni İş Emri Atandı — ${workOrderNumber}`;
}

export function workOrderAssignedEmailHtml(
  data: WorkOrderAssignedEmailProps,
): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Merhaba <strong>${escapeHtml(data.assigneeName)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Size yeni bir iş emri atandı. Detaylar aşağıdadır.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        ${emailDetailRowHtml("İş emri no", data.workOrderNumber)}
        ${emailDetailRowHtml("Müşteri", data.customerName)}
        ${emailDetailRowHtml("Planlanan", data.scheduledLabel)}
      </tbody>
    </table>
    ${emailButtonHtml(data.workOrderUrl, "İş emrine git")}
  `;

  return wrapEmailLayout({
    title: "Yeni iş emri atandı",
    previewText: `${data.workOrderNumber} size atandı`,
    bodyHtml,
  });
}
