import { EMAIL_BRAND } from "@/lib/email/config";
import {
  emailButtonHtml,
  escapeHtml,
  wrapEmailLayout,
} from "@/lib/email/templates/email-layout";

export type WelcomeEmailProps = {
  fullName: string;
  loginUrl: string;
  temporaryPassword?: string | null;
};

export function getWelcomeSubject(): string {
  return "TEKODAK OPS'a Hoş Geldiniz";
}

export function welcomeEmailHtml(data: WelcomeEmailProps): string {
  const passwordBlock = data.temporaryPassword
    ? `<div style="margin:16px 0;padding:16px;background-color:${EMAIL_BRAND.background};border-radius:8px;border:1px solid ${EMAIL_BRAND.border};">
        <p style="margin:0 0 8px;font-size:13px;color:${EMAIL_BRAND.muted};">Geçici şifreniz</p>
        <p style="margin:0;font-size:18px;font-weight:700;font-family:monospace;letter-spacing:2px;color:${EMAIL_BRAND.text};">${escapeHtml(data.temporaryPassword)}</p>
        <p style="margin:12px 0 0;font-size:12px;color:${EMAIL_BRAND.muted};">İlk girişten sonra şifrenizi değiştirmenizi öneririz.</p>
      </div>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Merhaba <strong>${escapeHtml(data.fullName)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      TEKODAK Operasyon Yönetim Sistemi (OPS) hesabınız oluşturuldu. Aşağıdaki bağlantı ile giriş yapabilirsiniz.
    </p>
    ${passwordBlock}
    ${emailButtonHtml(data.loginUrl, "Giriş yap")}
  `;

  return wrapEmailLayout({
    title: "TEKODAK OPS'a hoş geldiniz",
    previewText: "Hesabınız oluşturuldu — giriş bilgileriniz",
    bodyHtml,
  });
}
