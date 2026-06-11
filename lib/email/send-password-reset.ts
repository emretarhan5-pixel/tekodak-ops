import { sendEmail } from "@/lib/email/send-email";
import {
  getPasswordResetSubject,
  passwordResetEmailHtml,
  type PasswordResetEmailProps,
} from "@/lib/email/templates/password-reset";

export type SendPasswordResetEmailInput = PasswordResetEmailProps & {
  to: string;
};

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const { to, ...props } = input;
  const subject = getPasswordResetSubject();
  const html = passwordResetEmailHtml(props);

  return sendEmail({ to, subject, html });
}
