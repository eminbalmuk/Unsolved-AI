export const locales = ["en", "tr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "unsolved_locale";

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "tr" ? "tr" : defaultLocale;
}

export const dictionaries = {
  en: {
    common: {
      nav: {
        home: "Home",
        explora: "Explora",
        dashboard: "Dashboard",
        reports: "Reports",
        admin: "Admin",
      },
      brandTagline: "Problem discovery radar",
      authSetupNeeded: "Auth setup needed",
      signIn: "Sign in",
      signOut: "Sign out",
      createAccount: "Create account",
      lightTheme: "Light theme",
      darkTheme: "Dark theme",
    },
    landing: {
      badge: "Problem-driven discovery for SaaS founders",
      headline: "Stop guessing. Start from the pain people already posted.",
      subhead:
        "Unsolved scans public frustration, clusters repeated needs, and turns them into opportunity signals you can inspect, validate, and act on.",
      openExplora: "Open Explora",
      previewReport: "Preview B2B report",
      risingSignal: "Rising signal",
      painScore: "Pain Score",
      stats: {
        liveSignals: "live signals",
        marketLanes: "market lanes",
        averagePain: "avg. Pain Score",
      },
      howItWorks: "How it works",
      howHeadline: "From scattered complaints to ranked opportunity.",
      steps: [
        {
          title: "Collect public evidence",
          text: "Reddit threads, reviews, forums, and social signals become structured market evidence.",
        },
        {
          title: "Cluster the repeated pain",
          text: "AI groups complaints into problems, removes noise, and keeps source snippets attached.",
        },
        {
          title: "Rank by real urgency",
          text: "Frequency, emotional intensity, and willingness to pay combine into one usable Pain Score.",
        },
      ],
      featureBullets: [
        "Source-backed summaries",
        "Market saturation warnings",
        "Founder validation loop",
      ],
      ctaEyebrow: "Build from demand, not vibes",
      ctaTitle: "Explore the first SaaS pain map.",
      ctaText:
        "Explora now uses live public signals and arranges them as a horizontal board built for repeated product research sessions.",
      launchExplora: "Launch Explora",
      viewDashboard: "View founder dashboard",
    },
    explore: {
      liveRefresh: "Live public data refreshes every 15 minutes",
      headline: "Explore live SaaS pain as a horizontal market board.",
      subhead:
        "Swipe through vertical lanes of critical pain, rising signals, fresh evidence, and validated interest. Each card stays tied to live public sources.",
      hotProblems: "Hot problems",
      liveSources: "Live sources",
      signals: "Signals",
      publicSignals: "Public signals",
      averagePain: "Avg pain",
      weightedScore: "Weighted score",
      liveOpportunity: "Live opportunity signal",
    },
    discovery: {
      liveBoard: "Live board",
      cards: "cards",
      signals: "signals",
      exploraHeadline: "Explora board turns live pain into movable market lanes.",
      exploraText:
        "Scan critical pain, fresh public evidence, and validated interest as vertical stacks. Swipe horizontally on smaller screens.",
      windowCriticalProblem: "Window critical problem",
      noWindowProblem: "No matching problem in this window.",
      expandWindow: "Select a wider time window to grow the signal pool.",
      refresh: "Refresh",
      refreshing: "Refreshing...",
      lastRefresh: "Last refresh:",
      refreshError: "Live sources could not be refreshed. Showing the latest loaded board.",
      searchPlaceholder: "Search live pain...",
      all: "All",
      dev: "Dev",
      sort: "Sort",
      painWindow: "Pain window",
      painWindowDescription: "Narrow the source date range for the critical problem.",
      source: "Source",
      sourceDescription: "Separate Reddit, HackerNews, or App Store signals.",
      scoreFloor: "Score floor",
      scoreFloorDescription: "Choose the minimum problem score.",
      sortBoard: "Sort board",
      sortDescription: "Re-rank every column by the signal that matters right now.",
      sortPain: "Highest Pain Score",
      sortNew: "Newest evidence",
      sortValidated: "Most validated",
      sources: {
        all: "All sources",
        reddit: "Reddit only",
        hackerNews: "HackerNews only",
        appStore: "App Store only",
      },
      windows: {
        today: "Today",
        threeDays: "Last 3 days",
        week: "Last week",
        month: "Last month",
        all: "All",
      },
      columns: {
        critical: {
          title: "Critical pain",
          description: "Highest-scored signals in the current filtered board.",
        },
        rising: {
          title: "Rising signals",
          description: "Problems gaining traction but still early enough to enter.",
        },
        watch: {
          title: "Watchlist",
          description: "Lower-score signals worth scanning before they cluster.",
        },
        fresh: {
          title: "Fresh evidence",
          description: "Recent public posts and reviews from the last 7 days.",
        },
        validated: {
          title: "Validated interest",
          description: "Cards with stronger social proof or validation count.",
        },
      },
      noColumnSignals: "No new signal in this lane for this date range.",
      validators: "validators",
      publicSignalsCount: "public signals",
      inspect: "Inspect",
      emptyTitle: "This discovery window is empty.",
      emptyText:
        "Clear search, lower the score threshold, expand source/sector filters, or choose a longer date range.",
      scrollLeft: "Scroll board left",
      scrollRight: "Scroll board right",
    },
  },
  tr: {
    common: {
      nav: {
        home: "Ana sayfa",
        explora: "Explora",
        dashboard: "Panel",
        reports: "Raporlar",
        admin: "Admin",
      },
      brandTagline: "Problem keşif radarı",
      authSetupNeeded: "Auth kurulumu gerekli",
      signIn: "Giriş yap",
      signOut: "Çıkış yap",
      createAccount: "Hesap oluştur",
      lightTheme: "Açık tema",
      darkTheme: "Koyu tema",
    },
    landing: {
      badge: "SaaS kurucuları için problem odaklı keşif",
      headline: "Proje fikri aramayı bırak. İnsanların güncel yaşadığı problemlerden başla.",
      subhead:
        "Unsolved herkese açık şikayetleri tarar, tekrarlanan ihtiyaçları kümeler ve inceleyip doğrulayabileceğin fırsat sinyallerine dönüştürür.",
      openExplora: "Explora'yı aç",
      previewReport: "B2B raporu önizle",
      risingSignal: "Yükselen sinyal",
      painScore: "Acı skoru",
      stats: {
        liveSignals: "canlı sinyal",
        marketLanes: "pazar şeridi",
        averagePain: "ort. Acı Skoru",
      },
      howItWorks: "Nasıl çalışır",
      howHeadline: "Dağınık şikayetlerden sıralanmış fırsata.",
      steps: [
        {
          title: "Kamusal kanıtı topla",
          text: "Reddit başlıkları, yorumlar, forumlar ve sosyal sinyaller yapılandırılmış pazar kanıtına dönüşür.",
        },
        {
          title: "Tekrarlanan acıyı kümele",
          text: "AI şikayetleri problemlere ayırır, gürültüyü temizler ve kaynak parçalarını bağlı tutar.",
        },
        {
          title: "Gerçek aciliyete göre sırala",
          text: "Sıklık, duygusal yoğunluk ve ödeme isteği tek bir kullanılabilir Acı Skoru'na dönüşür.",
        },
      ],
      featureBullets: [
        "Kaynağa bağlı özetler",
        "Pazar doygunluğu uyarıları",
        "Kurucu doğrulama döngüsü",
      ],
      ctaEyebrow: "Hissi değil talebi takip et",
      ctaTitle: "İlk SaaS acı haritasını keşfet.",
      ctaText:
        "Explora canlı kamusal sinyalleri kullanır ve tekrarlı ürün araştırmaları için yatay bir pano halinde düzenler.",
      launchExplora: "Explora'yı başlat",
      viewDashboard: "Kurucu panelini aç",
    },
    explore: {
      liveRefresh: "Canlı kamusal veri her 15 dakikada yenilenir",
      headline: "Canlı SaaS problemlerini yatay pazar panosunda keşfet.",
      subhead:
        "Kritik acı, yükselen sinyal, taze kanıt ve doğrulanmış ilgi şeritleri arasında gez. Her kart canlı kamusal kaynaklara bağlı kalır.",
      hotProblems: "Sıcak problemler",
      liveSources: "Canlı kaynaklar",
      signals: "Sinyaller",
      publicSignals: "Kamusal sinyaller",
      averagePain: "Ort. acı",
      weightedScore: "Ağırlıklı skor",
      liveOpportunity: "Canlı fırsat sinyali",
    },
    discovery: {
      liveBoard: "Canlı pano",
      cards: "kart",
      signals: "sinyal",
      exploraHeadline: "Explora panosu canlı acıyı hareketli pazar şeritlerine çevirir.",
      exploraText:
        "Kritik acıyı, taze kamusal kanıtı ve doğrulanmış ilgiyi dikey yığınlar halinde tara. Küçük ekranlarda yatay kaydır.",
      windowCriticalProblem: "Pencerenin kritik problemi",
      noWindowProblem: "Bu aralıkta eşleşen problem yok.",
      expandWindow: "Sinyal havuzunu büyütmek için daha geniş tarih aralığı seç.",
      refresh: "Yenile",
      refreshing: "Yenileniyor...",
      lastRefresh: "Son yenileme:",
      refreshError: "Canlı kaynaklar yenilenemedi. Son yüklenen pano gösteriliyor.",
      searchPlaceholder: "Canlı acı ara...",
      all: "Tümü",
      dev: "Dev",
      sort: "Sırala",
      painWindow: "Acı penceresi",
      painWindowDescription: "Kritik problemi seçmek için kaynak tarih aralığını daralt.",
      source: "Kaynak",
      sourceDescription: "Reddit, HackerNews veya App Store sinyallerini ayır.",
      scoreFloor: "Skor alt limiti",
      scoreFloorDescription: "Minimum problem skorunu seç.",
      sortBoard: "Panoyu sırala",
      sortDescription: "Her kolonu şu an önemli olan sinyale göre yeniden sırala.",
      sortPain: "En yüksek Acı Skoru",
      sortNew: "En yeni kanıt",
      sortValidated: "En çok doğrulanan",
      sources: {
        all: "Tüm kaynaklar",
        reddit: "Sadece Reddit",
        hackerNews: "Sadece HackerNews",
        appStore: "Sadece App Store",
      },
      windows: {
        today: "Bugün",
        threeDays: "Son 3 gün",
        week: "Son 1 hafta",
        month: "Son 1 ay",
        all: "Tümü",
      },
      columns: {
        critical: {
          title: "Kritik acı",
          description: "Mevcut filtreli panodaki en yüksek skorlu sinyaller.",
        },
        rising: {
          title: "Yükselen sinyaller",
          description: "İlgi kazanan ama hâlâ erken girilebilecek problemler.",
        },
        watch: {
          title: "İzleme listesi",
          description: "Kümelenmeden önce taranmaya değer düşük skorlu sinyaller.",
        },
        fresh: {
          title: "Taze kanıt",
          description: "Son 7 günün herkese açık gönderileri ve yorumları.",
        },
        validated: {
          title: "Doğrulanmış ilgi",
          description: "Daha güçlü sosyal kanıt veya doğrulama sayısı olan kartlar.",
        },
      },
      noColumnSignals: "Bu tarih aralığında bu şeride düşen yeni sinyal yok.",
      validators: "doğrulayan",
      publicSignalsCount: "kamusal sinyal",
      inspect: "İncele",
      emptyTitle: "Bu keşif penceresi boş.",
      emptyText:
        "Aramayı temizle, skor eşiğini düşür, kaynak/sektör filtresini genişlet veya daha uzun tarih aralığı seç.",
      scrollLeft: "Panoyu sola kaydır",
      scrollRight: "Panoyu sağa kaydır",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
