import { sendEmail } from "@/lib/email/send-email";
import {
  contractRenewalEmailHtml,
  getContractRenewalSubject,
  type ContractRenewalEmailProps,
} from "@/lib/email/templates/contract-renewal";

export type SendContractRenewalEmailInput = ContractRenewalEmailProps & {
  to: string;
};

export async function sendContractRenewalEmail(
  input: SendContractRenewalEmailInput,
) {
  const { to, ...props } = input;
  const subject = getContractRenewalSubject(props.customerName);
  const html = contractRenewalEmailHtml(props);

  return sendEmail({ to, subject, html });
}
