import { sendEmail } from "@/lib/email/send-email";
import {
  getWelcomeSubject,
  welcomeEmailHtml,
  type WelcomeEmailProps,
} from "@/lib/email/templates/welcome";

export type SendWelcomeEmailInput = WelcomeEmailProps & {
  to: string;
};

export async function sendWelcomeEmail(input: SendWelcomeEmailInput) {
  const { to, ...props } = input;
  const subject = getWelcomeSubject();
  const html = welcomeEmailHtml(props);

  return sendEmail({ to, subject, html });
}
