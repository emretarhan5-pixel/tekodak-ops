export function normalizeTaxNumber(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

export function isValidTaxNumber(input: string): boolean {
  const digits = normalizeTaxNumber(input);
  return digits.length === 10 || digits.length === 11;
}
