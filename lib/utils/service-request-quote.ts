import type { ServiceRequestVatOption } from "@/lib/constants/service-request";
import type { ServiceRequestQuoteLineInput } from "@/schemas/service-request";

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateQuoteTotals(params: {
  quoteLines: ServiceRequestQuoteLineInput[];
  laborCost: number;
  shippingCost: number | null | undefined;
  vatOption: ServiceRequestVatOption;
}): { quoteSubtotal: number; quoteTotal: number } {
  const partsTotal = params.quoteLines.reduce(
    (sum, line) => sum + line.unit_price * line.quantity,
    0,
  );
  const quoteSubtotal = roundMoney(partsTotal);
  const base = roundMoney(
    quoteSubtotal + params.laborCost + (params.shippingCost ?? 0),
  );

  let quoteTotal = base;
  switch (params.vatOption) {
    case "vat_20":
      quoteTotal = roundMoney(base * 1.2);
      break;
    case "vat_10":
      quoteTotal = roundMoney(base * 1.1);
      break;
    case "vat_1":
      quoteTotal = roundMoney(base * 1.01);
      break;
    case "vat_included":
    case "no_vat":
      quoteTotal = base;
      break;
    default:
      quoteTotal = base;
  }

  return { quoteSubtotal, quoteTotal };
}
