import {
  emailButtonHtml,
  escapeHtml,
  wrapEmailLayout,
} from "@/lib/email/templates/email-layout";

export type PasswordResetEmailProps = {
  fullName: string;
  resetUrl: string;
};

export function getPasswordResetSubject(): string {
  return "TEKODAK OPS — Şifre sıfırlama";
}

export function passwordResetEmailHtml(data: PasswordResetEmailProps): string {
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Merhaba <strong>${escapeHtml(data.fullName)}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      TEKODAK OPS hesabınız için şifre sıfırlama talebi oluşturuldu. Yeni şifrenizi belirlemek için aşağıdaki bağlantıyı kullanın.
    </p>
    ${emailButtonHtml(data.resetUrl, "Şifremi sıfırla")}
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#64748b;">
      Bu talebi siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.
    </p>
  `;

  return wrapEmailLayout({
    title: "Şifre sıfırlama",
    previewText: "TEKODAK OPS şifrenizi sıfırlayın",
    bodyHtml,
  });
}
