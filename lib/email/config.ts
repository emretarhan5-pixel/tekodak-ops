/** TEKODAK OPS e-posta gönderici */
export const EMAIL_FROM = "TEKODAK OPS <noreply@tekodak.com.tr>";

/** Marka renkleri (e-posta istemcileri için hex) */
export const EMAIL_BRAND = {
  primary: "#1e293b",
  accent: "#b91c1c",
  background: "#f8fafc",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
} as const;

export const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL ?? "https://tekodak.com.tr/logo.png";

export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

const RESEND_PLACEHOLDER_KEYS = new Set([
  "placeholder",
  "re_your_resend_api_key",
  "your_resend_api_key",
]);

export function getResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return null;
  }
  if (RESEND_PLACEHOLDER_KEYS.has(key.toLowerCase())) {
    return null;
  }
  if (key.length < 10) {
    return null;
  }
  return key;
}

export function isResendConfigured(): boolean {
  return getResendApiKey() !== null;
}
