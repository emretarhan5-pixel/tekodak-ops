import { NextResponse } from "next/server";

import { getAppBaseUrl, isResendConfigured } from "@/lib/email/config";
import { sendContractRenewalEmail } from "@/lib/email/send-contract-renewal";
import { sendWelcomeEmail } from "@/lib/email/send-welcome";
import { sendWorkOrderAssignedEmail } from "@/lib/email/send-work-order-assigned";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (!isResendConfigured()) {
      console.warn("[test-email] RESEND_API_KEY yapılandırılmadı");
      return NextResponse.json({
        success: false,
        reason: "No API key configured",
      });
    }

    const { searchParams } = new URL(request.url);
    const to =
      searchParams.get("to")?.trim() ||
      process.env.TEST_EMAIL_TO?.trim() ||
      "test@example.com";
    const type = searchParams.get("type") ?? "welcome";
    const baseUrl = getAppBaseUrl();

    let result: { sent: boolean; id?: string; error?: string };

    switch (type) {
      case "contract-renewal":
        result = await sendContractRenewalEmail({
          to,
          customerName: "Örnek Müşteri A.Ş.",
          contractNumber: "SZ-2026-001",
          endDateLabel: "15 Temmuz 2026",
          daysRemaining: 28,
          renewUrl: `${baseUrl}/contracts`,
        });
        break;
      case "work-order":
        result = await sendWorkOrderAssignedEmail({
          to,
          assigneeName: "Test Kullanıcı",
          workOrderNumber: "İE-2026-014",
          customerName: "ABC Ltd.",
          scheduledLabel: "5 Haziran 2026, 10:00",
          workOrderUrl: `${baseUrl}/work-orders`,
        });
        break;
      case "welcome":
      default:
        result = await sendWelcomeEmail({
          to,
          fullName: "Test Kullanıcı",
          loginUrl: `${baseUrl}/login`,
          temporaryPassword: "Tekodak2026!",
        });
        break;
    }

    if (!result.sent) {
      console.error("[test-email] Gönderim başarısız:", result.error ?? type);
      return NextResponse.json({
        success: false,
        reason: result.error ?? "Email send failed",
        type,
        to,
      });
    }

    return NextResponse.json({
      success: true,
      type,
      to,
      id: result.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen test e-posta hatası";
    console.error("[test-email]", message, error);
    return NextResponse.json({
      success: false,
      reason: message,
    });
  }
}
