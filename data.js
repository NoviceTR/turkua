// ============================================================
// DATA.JS — TürkUA Savaş Takip Verileri
// Son Güncelleme: 27 June 2026
// ============================================================
// DATA_START
window.WAR_DATA = {
  "prob1d": 0.5,
  "prob1m": 0.3,
  "prob1y": 0.2,
  "confidence": 3,
  "lastUpdate": "2026-06-27T16:30:00",
  "trendPct": -0.1,
  "statusSavas": {"tr": "AKTİF", "ua": "АКТИВНА"},
  "statusMuzakere": {"tr": "DURDU", "ua": "ПЕРЕРВА"},
  "trend": {"tr": "Durağan", "ua": "Стабільний"},
  "label1d": {"tr": "1 Günlük Savaş Durumu", "ua": "Стан війни за 1 добу"},
  "label1m": {"tr": "1 Aylık Savaş Durumu", "ua": "Стан війни за 1 місяць"},
  "label1y": {"tr": "1 Yıllık Savaş Durumu", "ua": "Стан війни за 1 рік"},
  "reasoning": {"tr": "Son gelişmeler savaşın devam ettiği yönünde.", "ua": "Останні події свідчать про продовження війни."},
  "developments": [
    {
      "date": {"tr": "27 Haziran 2026", "ua": "27 червня 2026"},
      "text": {"tr": "Rus forces Sumy bölgesini 60'dan fazla kez vurdu.", "ua": "Російські війська обстріляли Сумську область понад 60 разів."},
      "impact": -2,
      "type": "negative"
    },
    {
      "date": {"tr": "27 Haziran 2026", "ua": "27 червня 2026"},
      "text": {"tr": "Ukrayna forces Rus Pantsir-S1 sistemini vurdu.", "ua": "Українські війська обстріляли російську систему Панцир-С1."},
      "impact": 1,
      "type": "positive"
    }
  ],
  "newsItems": [
    {
      "category": "military",
      "date": {"tr": "27 Haziran 2026", "ua": "27 червня 2026"},
      "title": {"tr": "Rus forces Sumy bölgesini vurdu.", "ua": "Російські війська обстріляли Сумську область."},
      "body": {"tr": "Rus forces Sumy bölgesini 60'dan fazla kez vurdu, 1 kişi öldü, 14 kişi yaralandı.", "ua": "Російські війська обстріляли Сумську область понад 60 разів, 1 людина загинула, 14 людей поранено."},
      "impact": -2,
      "type": "negative"
    },
    {
      "category": "military",
      "date": {"tr": "27 Haziran 2026", "ua": "27 червня 2026"},
      "title": {"tr": "Ukrayna forces Rus Pantsir-S1 sistemini vurdu.", "ua": "Українські війська обстріляли російську систему Панцир-С1."},
      "body": {"tr": "Ukrayna forces Rus Pantsir-S1 sistemini vurdu, sistem hasar gördü.", "ua": "Українські війська обстріляли російську систему Панцир-С1, система отримала пошкодження."},
      "impact": 1,
      "type": "positive"
    }
  ],
  "gundemLastUpdate": "2026-06-27T16:30:00"
};
// DATA_END