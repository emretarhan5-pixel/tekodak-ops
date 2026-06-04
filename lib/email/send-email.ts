import { EMAIL_FROM } from "@/lib/email/config";
import { getResendClient } from "@/lib/email/resend-client";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export type SendEmailResult = {
  sent: boolean;
  id?: string;
  error?: string;
};

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const client = getResendClient();

  if (!client) {
    console.warn(
      "[email] RESEND_API_KEY yapılandırılmadı — e-posta atlandı:",
      input.subject,
    );
    return {
      sent: false,
      error: "No API key configured",
    };
  }

  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      console.error("[email] Gönderim hatası:", error.message, input.subject);
      return { sent: false, error: error.message };
    }

    return { sent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    console.error("[email] Gönderim hatası:", message, input.subject);
    return { sent: false, error: message };
  }
}
