import {
  EMAIL_BRAND,
  EMAIL_LOGO_URL,
} from "@/lib/email/config";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function wrapEmailLayout(options: {
  title: string;
  previewText?: string;
  bodyHtml: string;
}): string {
  const preview = options.previewText
    ? `<div style="display:none;font-size:1px;color:${EMAIL_BRAND.background};line-height:1px;max-height:0;overflow:hidden;">${escapeHtml(options.previewText)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.background};">
  ${preview}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid ${EMAIL_BRAND.border};">
          <tr>
            <td style="padding:24px 28px 16px;border-bottom:1px solid ${EMAIL_BRAND.border};">
              <img src="${EMAIL_LOGO_URL}" alt="TEKODAK" width="120" height="36" style="display:block;max-width:120px;"/>
              <p style="margin:12px 0 0;font-size:18px;font-weight:700;color:${EMAIL_BRAND.primary};">${escapeHtml(options.title)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;color:${EMAIL_BRAND.text};">
              ${options.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid ${EMAIL_BRAND.border};font-size:12px;color:${EMAIL_BRAND.muted};">
              TEKODAK Şirketler Grubu — TEKODAK OPS<br/>
              Bu e-posta otomatik gönderilmiştir; lütfen yanıtlamayın.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButtonHtml(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<p style="margin:24px 0 0;">
    <a href="${safeHref}" style="display:inline-block;padding:12px 24px;background-color:${EMAIL_BRAND.accent};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${safeLabel}</a>
  </p>`;
}

export function emailDetailRowHtml(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:14px;color:${EMAIL_BRAND.muted};vertical-align:top;width:140px;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:${EMAIL_BRAND.text};font-weight:500;">${escapeHtml(value)}</td>
  </tr>`;
}
