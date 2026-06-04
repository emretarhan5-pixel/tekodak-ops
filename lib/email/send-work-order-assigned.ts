import { sendEmail } from "@/lib/email/send-email";
import {
  getWorkOrderAssignedSubject,
  workOrderAssignedEmailHtml,
  type WorkOrderAssignedEmailProps,
} from "@/lib/email/templates/work-order-assigned";

export type SendWorkOrderAssignedEmailInput = WorkOrderAssignedEmailProps & {
  to: string;
};

export async function sendWorkOrderAssignedEmail(
  input: SendWorkOrderAssignedEmailInput,
) {
  const { to, ...props } = input;
  const subject = getWorkOrderAssignedSubject(props.workOrderNumber);
  const html = workOrderAssignedEmailHtml(props);

  return sendEmail({ to, subject, html });
}
