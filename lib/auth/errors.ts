/** Map Supabase Auth API messages to Turkish UI copy */
export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "E-posta veya şifre hatalı.";
  }

  if (normalized.includes("email not confirmed")) {
    return "E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu kontrol edin.";
  }

  if (normalized.includes("user already registered")) {
    return "Bu e-posta adresi zaten kayıtlı.";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.";
  }

  if (normalized.includes("password should be at least")) {
    return "Şifre güvenlik gereksinimlerini karşılamıyor.";
  }

  if (normalized.includes("same as the old password")) {
    return "Yeni şifre mevcut şifrenizle aynı olamaz.";
  }

  if (normalized.includes("session missing") || normalized.includes("jwt")) {
    return "Oturum süresi doldu. Lütfen bağlantıyı yeniden açın.";
  }

  return "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
}

export const AUTH_MESSAGES = {
  profileNotFound:
    "Hesabınız sistemde tanımlı değil. Lütfen yöneticinize başvurun.",
  profileInactive: "Hesabınız pasif durumda. Lütfen yöneticinize başvurun.",
  resetEmailSent:
    "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Gelen kutunuzu kontrol edin.",
  passwordUpdated: "Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz…",
  invalidResetLink:
    "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir istek oluşturun.",
} as const;
