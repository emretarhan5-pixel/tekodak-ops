/** Strip to national digits (10 digits, no leading 0). */
export function normalizeTurkishPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length >= 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length >= 11) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function isValidTurkishPhone(input: string): boolean {
  const digits = normalizeTurkishPhone(input);
  return digits.length === 10 && /^[1-9]\d{9}$/.test(digits);
}

export function formatTurkishPhoneDisplay(input: string): string {
  const d = normalizeTurkishPhone(input);
  if (d.length !== 10) return input;
  return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
}
