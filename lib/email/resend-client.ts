import { Resend } from "resend";

import { getResendApiKey, isResendConfigured } from "@/lib/email/config";

let cachedClient: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!isResendConfigured()) {
    return null;
  }

  if (!cachedClient) {
    const apiKey = getResendApiKey();
    if (!apiKey) {
      return null;
    }
    cachedClient = new Resend(apiKey);
  }

  return cachedClient;
}
