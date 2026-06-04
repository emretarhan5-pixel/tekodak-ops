import {
  emailButtonHtml,
  emailDetailRowHtml,
  wrapEmailLayout,
} from "@/lib/email/templates/email-layout";

export type ContractRenewalEmailProps = {
  customerName: string;
  contractNumber: string;
  endDateLabel: string;
  daysRemaining: number;
  renewUrl: string;
};

export function getContractRenewalSubject(customerName: string): string {
  return `Sözleşme Yenileme Hatırlatması — ${customerName}`;
}

export function contractRenewalEmailHtml(
  data: ContractRenewalEmailProps,
): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Aşağıdaki sözleşmenin bitiş tarihi yaklaşıyor. Lütfen yenileme sürecini başlatın.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tbody>
        ${emailDetailRowHtml("Müşteri", data.customerName)}
        ${emailDetailRowHtml("Sözleşme no", data.contractNumber)}
        ${emailDetailRowHtml("Bitiş tarihi", data.endDateLabel)}
        ${emailDetailRowHtml("Kalan süre", `${data.daysRemaining} gün`)}
      </tbody>
    </table>
    ${emailButtonHtml(data.renewUrl, "Sözleşmeyi görüntüle")}
  `;

  return wrapEmailLayout({
    title: "Sözleşme yenileme hatırlatması",
    previewText: `${data.contractNumber} sözleşmesi ${data.daysRemaining} gün içinde bitiyor`,
    bodyHtml,
  });
}
