export type OnboardingTooltipPosition = "top" | "bottom" | "left" | "right";

export type OnboardingStep = {
  id: string;
  target?: string;
  title: string;
  description: string;
  position: OnboardingTooltipPosition;
  variant?: "target" | "center";
};

export const DASHBOARD_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "dashboard-header",
    target: "dashboard-header",
    title: "📊 Kontrol Panelin",
    description:
      "Burası senin ana ekranın. Günlük işlerini, açık servis taleplerini ve bakımlarını buradan takip edebilirsin. Her sabah buradan başla!",
    position: "bottom",
  },
  {
    id: "new-service-request",
    target: "new-service-request",
    title: "🔧 Yeni Servis Talebi Aç",
    description:
      "Bir müşteri seni aradığında veya arıza bildirdiğinde buraya tıkla. Müşteri ve cihaz bilgilerini girerek yeni bir servis talebi oluşturursun.",
    position: "bottom",
  },
  {
    id: "service-requests-section",
    target: "service-requests-section",
    title: "📋 Servis Talebi Akışı",
    description:
      "Her servis talebinin 5 adımı vardır:\n1️⃣ Kayıt — Müşteri ve cihaz bilgileri\n2️⃣ Arıza Tespit — Teknik inceleme\n3️⃣ Teklif — Fiyat ve onay\n4️⃣ Bakım — Tamir/bakım işlemi\n5️⃣ Fatura — Ödeme ve kapanış\nHer adımı tamamladıkça ilerlersin.",
    position: "right",
  },
  {
    id: "maintenance-section",
    target: "maintenance-section",
    title: "📅 Periyodik Bakımlar",
    description:
      "Sözleşmeli müşterilerin düzenli bakımları burada görünür. Planlanan bakım yaklaştığında kart kırmızıya döner. Bakıma başlamak için ilgili kartı aç ve 'Başlat' butonuna tıkla.",
    position: "right",
  },
  {
    id: "notifications",
    target: "notifications",
    title: "🔔 Bildirimler",
    description:
      "Sana yeni iş atandığında veya önemli bir güncelleme olduğunda buradan bildirim alırsın. Zili tıklayarak tüm bildirimleri görebilirsin.",
    position: "bottom",
  },
];

/** @deprecated Use DASHBOARD_ONBOARDING_STEPS */
export const ONBOARDING_STEPS = DASHBOARD_ONBOARDING_STEPS;

export const SERVICE_REQUESTS_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "sr-list",
    target: "sr-tour-list",
    title: "📋 Servis Taleplerim",
    description:
      "Burası tüm servis taleplerinin listelendiği yerdir. Açık, devam eden ve tamamlanan tüm taleplerini buradan görebilirsin.",
    position: "bottom",
  },
  {
    id: "sr-new-button",
    target: "sr-tour-new-button",
    title: "➕ Yeni Talep Nasıl Açılır?",
    description:
      "Müşteri seni aradığında bu butona tıkla. Açılan formda müşteri bilgilerini, cihaz bilgilerini ve bildirilen arızayı gir.",
    position: "bottom",
  },
  {
    id: "sr-filters",
    target: "sr-tour-filters",
    title: "🔍 Talepleri Filtrele",
    description:
      "Çok sayıda talep olduğunda buradan arama yapabilir veya duruma göre filtreleyebilirsin. Örneğin sadece 'Teklif Bekleniyor' olanları görmek için durum filtresini kullan.",
    position: "bottom",
  },
  {
    id: "sr-colors",
    title: "🎨 Renk Sistemi",
    description:
      "Talepler aciliyetlerine göre renklendirilir:\n🔴 Kırmızı → Bugün veya gecikmiş\n🟠 Turuncu → 1-2 gün kaldı\n🟡 Sarı → 3-6 gün kaldı\n⚪ Gri → 7+ gün var\nEn acil işleri önce tamamla!",
    position: "bottom",
    variant: "center",
  },
];

export const NOTIFICATIONS_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "notif-list",
    target: "notif-tour-list",
    title: "🔔 Bildirimlerim",
    description:
      "Sana atanan yeni işler, yaklaşan bakımlar ve önemli güncellemeler burada görünür. Okunmamış bildirimler koyu renkte gösterilir.",
    position: "bottom",
  },
  {
    id: "notif-mark-all",
    target: "notif-tour-mark-all",
    title: "✓ Bildirimleri Temizle",
    description:
      "Tüm bildirimleri tek seferde okundu olarak işaretlemek için bu butonu kullanabilirsin.",
    position: "bottom",
  },
  {
    id: "notif-click",
    target: "notif-tour-first-item",
    title: "👆 Bildirime Tıkla",
    description:
      "Bir bildirime tıkladığında sistem seni doğrudan o işin sayfasına götürür.\n\nÖrneğin:\n- 'Yeni servis talebi atandı' → Talebin detayına gider\n- 'Bakım yaklaşıyor' → Bakım planına gider\n\nTıkladığın bildirim otomatik olarak okundu işaretlenir. 📖",
    position: "right",
  },
];
