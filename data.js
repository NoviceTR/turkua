// ============================================================
// DATA.JS — TürkUA Savaş Takip Verileri
// Bu dosyayı admin.html üzerinden güncelleyebilirsiniz.
// ============================================================
window.WAR_DATA = {
  "prob1d": 1,
  "prob1m": 5,
  "prob1y": 18,
  "confidence": 4,
  "lastUpdate": "2026-03-30T22:00:00",
  "trendPct": -10,
  "statusSavas": {
    "tr": "AKTİF",
    "ua": "АКТИВНА"
  },
  "statusMuzakere": {
    "tr": "ASKIDA",
    "ua": "ПРИЗУПИНЕНО"
  },
  "trend": {
    "tr": "durağan / düşüş eğilimi",
    "ua": "стабільний / спадний тренд"
  },
  "label1d": {
    "tr": "Polymarket: Mart sonu ateşkes olasılığı %0",
    "ua": "Polymarket: шанс на перемир'я до кінця березня — 0%"
  },
  "label1m": {
    "tr": "Üçlü görüşmeler askıda, Rusya taleplerinde ısrarcı",
    "ua": "Тристоронні переговори на паузі, Росія наполягає"
  },
  "label1y": {
    "tr": "Polymarket: Aralık 2026 itibarıyla barış anlaşması %18",
    "ua": "Polymarket: мирна угода до грудня 2026 — 18%"
  },
  "reasoning": {
    "tr": "Polymarket'e göre 31 Mart'a kadar ateşkes olasılığı %0'a düştü. Kremlin sözcüsü Peskov, 19 Mart'ta ABD-Rusya-Ukrayna üçlü görüşmelerini askıya aldıklarını açıkladı; esir değişimi ve insani görüşmeler sürecek. ABD Dışişleri Bakanı Rubio, 27 Mart'ta Ukrayna'nın taviz vermemesi durumunda savaşın devam edeceğini belirtti. Miami'de 21-22 Mart'ta ABD-Ukrayna ikili görüşmeleri güvenlik garantileri odaklı sürdü. Polymarket Aralık 2026 için barış olasılığını %18 olarak fiyatlıyor.",
    "ua": "За даними Polymarket, шанс на перемир'я до 31 березня впав до 0%. Речник Кремля Пєсков 19 березня заявив про призупинення тристоронніх переговорів США-Росія-Україна; обмін полоненими й гуманітарні контакти тривають. Держсекретар США Рубіо 27 березня заявив, що якщо Україна відмовиться від поступок — війна продовжиться. 21-22 березня в Маямі пройшли двосторонні переговори США-України щодо гарантій безпеки. Polymarket оцінює шанс на мир до грудня 2026 у 18%."
  },
  "developments": [
    {
      "date": { "tr": "27 Mart 2026", "ua": "27 березня 2026" },
      "text": {
        "tr": "ABD Dışişleri Bakanı Rubio: Ukrayna taviz vermeyi reddederse savaş devam edecek. Rusya'nın öne sürdüğü şartları Zelensky'ye iletti.",
        "ua": "Держсекретар США Рубіо: якщо Україна відмовиться від поступок, війна продовжиться. Він передав Зеленському умови, що висуває Росія."
      },
      "impact": -2,
      "type": "negative"
    },
    {
      "date": { "tr": "21-22 Mart 2026", "ua": "21-22 березня 2026" },
      "text": {
        "tr": "Miami'de ABD-Ukrayna ikili görüşmeleri: Güvenlik garantileri ve insani izler (esir iadesi) görüşüldü. Rusya katılmadı.",
        "ua": "Двосторонні переговори США-Україна в Маямі: обговорено гарантії безпеки та гуманітарний трек (повернення полонених). Росія участі не брала."
      },
      "impact": 1,
      "type": "positive"
    },
    {
      "date": { "tr": "19 Mart 2026", "ua": "19 березня 2026" },
      "text": {
        "tr": "Kremlin sözcüsü Peskov: Üçlü müzakereler geçici olarak askıya alındı. Avrupa Konseyi aynı gün Rusya'yı tam ve koşulsuz ateşkese davet etti.",
        "ua": "Речник Кремля Пєсков: тристоронні переговори тимчасово призупинені. Того ж дня Єврорада закликала Росію до повного та безумовного припинення вогню."
      },
      "impact": -1,
      "type": "negative"
    },
    {
      "date": { "tr": "24 Şubat 2026", "ua": "24 лютого 2026" },
      "text": {
        "tr": "BM Genel Kurulu, savaşın 4. yıldönümünde acil ve koşulsuz ateşkes çağrısı yapan karar tasarısını kabul etti.",
        "ua": "Генасамблея ООН ухвалила резолюцію з вимогою негайного та безумовного припинення вогню на 4-ту річницю війни."
      },
      "impact": 1,
      "type": "positive"
    },
    {
      "date": { "tr": "3 Şubat 2026", "ua": "3 лютого 2026" },
      "text": {
        "tr": "Ukrayna, Batılı ortaklarla çok aşamalı ateşkes planı üzerinde anlaştı.",
        "ua": "Україна узгодила з західними партнерами багаторівневий план припинення вогню."
      },
      "impact": 2,
      "type": "positive"
    }
  ],
  "newsItems": [
    {
      "category": "diplomatic",
      "date": { "tr": "27 Mart 2026", "ua": "27 березня 2026" },
      "title": {
        "tr": "Rubio: Ukrayna taviz vermezse savaş devam eder",
        "ua": "Рубіо: якщо Україна не піде на поступки — війна продовжиться"
      },
      "body": {
        "tr": "ABD Dışişleri Bakanı Marco Rubio, Rusya'nın öne sürdüğü şartları Zelensky'ye ilettiğini açıkladı. Rubio, Ukrayna'nın belirli kararlar almayı ya da taviz vermeyi reddetmesi durumunda savaşın devam edeceğini vurguladı. Kaynak: Pravda Türkiye / Reuters.",
        "ua": "Держсекретар США Марко Рубіо заявив, що передав Зеленському умови, які висуває Росія. Рубіо наголосив: якщо Україна відмовиться від певних рішень або поступок, війна триватиме. Джерело: Reuters."
      },
      "impact": -2,
      "type": "negative"
    },
    {
      "category": "diplomatic",
      "date": { "tr": "21-22 Mart 2026", "ua": "21-22 березня 2026" },
      "title": {
        "tr": "Miami'de ABD-Ukrayna güvenlik garantileri görüşmesi",
        "ua": "Переговори США-Україна в Маямі щодо гарантій безпеки"
      },
      "body": {
        "tr": "ABD ve Ukrayna heyetleri Miami'de güvenlik garantileri ile insani izleri kapsayan ikili görüşmeler yaptı. Esir iadesi ve Ukrayna vatandaşlarının geri dönüşü gündemin önemli maddelerinden birini oluşturdu. Kaynak: Anadolu Ajansı.",
        "ua": "Делегації США та України в Маямі провели двосторонні переговори щодо гарантій безпеки та гуманітарних питань. Повернення полонених і громадян України стало одним із ключових пунктів порядку денного. Джерело: Anadolu Agency."
      },
      "impact": 1,
      "type": "positive"
    },
    {
      "category": "diplomatic",
      "date": { "tr": "19 Mart 2026", "ua": "19 березня 2026" },
      "title": {
        "tr": "AB: Rusya tam ve koşulsuz ateşkese davet edildi",
        "ua": "ЄС: Росію закликали до повного і безумовного припинення вогню"
      },
      "body": {
        "tr": "Avrupa Konseyi, Rusya'yı tam ve koşulsuz ateşkese davet eden açıklama yayımladı. Barışın adil ve kalıcı olması için Ukrayna'nın toprak bütünlüğüne saygı gösterilmesinin şart olduğu vurgulandı. Fransa ve İngiltere askeri üs taahhüdünü yineledi. Kaynak: Konsey.europa.eu",
        "ua": "Єврорада опублікувала заяву із закликом до Росії повністю та безумовно припинити вогонь. Наголошено, що для справедливого і тривалого миру необхідно поважати територіальну цілісність України. Франція і Великобританія підтвердили зобов'язання щодо військових баз. Джерело: consilium.europa.eu"
      },
      "impact": 1,
      "type": "positive"
    },
    {
      "category": "diplomatic",
      "date": { "tr": "19 Mart 2026", "ua": "19 березня 2026" },
      "title": {
        "tr": "ABD-Rusya-Ukrayna üçlü görüşmeleri askıya alındı",
        "ua": "Тристоронні переговори США-Росія-Україна призупинені"
      },
      "body": {
        "tr": "Kremlin sözcüsü Peskov, Amerikalı müzakerecilerin önceliklerinin değiştiğini öne sürerek üçlü görüşme formatını geçici olarak dondurduklarını açıkladı. Esir değişimi ve insani görüşmeler ise ayrı bir kanal üzerinden sürdürülecek. Kaynak: Euronews / Reuters.",
        "ua": "Речник Кремля Пєсков заявив про тимчасове призупинення тристороннього формату переговорів через зміну пріоритетів американських переговорників. Обмін полоненими та гуманітарні переговори тривають окремим каналом. Джерело: Euronews / Reuters."
      },
      "impact": -2,
      "type": "negative"
    },
    {
      "category": "humanitarian",
      "date": { "tr": "24 Şubat 2026", "ua": "24 лютого 2026" },
      "title": {
        "tr": "BM Genel Kurulu: Savaşın 4. yılında acil ateşkes kararı",
        "ua": "ГА ООН: резолюція про негайне припинення вогню на 4-й рік війни"
      },
      "body": {
        "tr": "BM Genel Kurulu, Rusya'nın Ukrayna'yı işgalinin 4. yıl dönümünde acil ve koşulsuz ateşkes talep eden karar tasarısını kabul etti. Karar bağlayıcı değil ancak uluslararası baskıyı yoğunlaştırıyor. Kaynak: press.un.org",
        "ua": "Генасамблея ООН ухвалила резолюцію з вимогою негайного та безумовного припинення вогню на 4-ту річницю вторгнення. Резолюція не є обов'язковою, але посилює міжнародний тиск. Джерело: press.un.org"
      },
      "impact": 1,
      "type": "positive"
    },
    {
      "category": "economic",
      "date": { "tr": "Mart 2026", "ua": "Березень 2026" },
      "title": {
        "tr": "Cenevre görüşmeleri tıkandı: Rusya toprak taleplerinde ısrarlı",
        "ua": "Переговори в Женеві зайшли в глухий кут: Росія наполягає на вимогах щодо території"
      },
      "body": {
        "tr": "Washington Post'a göre Cenevre'deki barış görüşmeleri, Rusya'nın Donbas'tan çekilme talebinde ısrar etmesi üzerine tıkandı. Ukrayna, güvenlik garantisi olmaksızın herhangi bir toprak tavizini reddediyor. Kaynak: Washington Post / NBC News.",
        "ua": "За даними Washington Post, мирні переговори в Женеві зайшли в глухий кут через наполягання Росії на вимозі щодо відступу з Донбасу. Україна відкидає будь-які територіальні поступки без залізних гарантій безпеки. Джерело: Washington Post / NBC News."
      },
      "impact": -1,
      "type": "negative"
    }
  ],
  "gundemNews": [
    {
      "category": "parliamentary",
      "date": { "tr": "25 Mart 2026", "ua": "25 березня 2026" },
      "title": {
        "tr": "Rada: Ulusal Direniş eğitimi yasalaştı",
        "ua": "Рада ухвалила закон про національний спротив"
      },
      "body": {
        "tr": "Verkhovna Rada, okul ve üniversitelerde 'Ulusal Direniş Temelleri' dersini zorunlu kılan yasayı kabul etti. Kaynak: rada.gov.ua",
        "ua": "Верховна Рада ухвалила закон, що вводить обов'язковий предмет «Основи національного спротиву» в школах і університетах. Джерело: rada.gov.ua"
      },
      "url": "https://www.rada.gov.ua/en/news/News//191082.html",
      "impact": 1,
      "type": "positive"
    },
    {
      "category": "economic",
      "date": { "tr": "2026", "ua": "2026" },
      "title": {
        "tr": "BMMYK: Ukrayna mültecileri için 614 milyon dolar",
        "ua": "УВКБ ООН: $614 млн для біженців з України"
      },
      "body": {
        "tr": "BM Mülteciler Yüksek Komiserliği, 2026 yılı için Ukrayna'daki savaştan etkilenen nüfus ve komşu ülkelerdeki mülteciler için 614 milyon dolarlık çağrı başlattı. Kaynak: unhcr.org",
        "ua": "УВКБ ООН оголосило запит на $614 млн для постраждалого населення в Україні та біженців у сусідніх країнах у 2026 р. Джерело: unhcr.org"
      },
      "url": "https://data.unhcr.org/en/documents/download/120716",
      "impact": 1,
      "type": "positive"
    },
    {
      "category": "economic",
      "date": { "tr": "Şubat 2026", "ua": "Лютий 2026" },
      "title": {
        "tr": "Ukrayna yeniden yapılanma maliyeti 588 milyar dolar",
        "ua": "Вартість відновлення України — $588 млрд"
      },
      "body": {
        "tr": "AB-Dünya Bankası güncellenmiş raporuna göre Ukrayna'nın on yıllık yeniden yapılanma maliyeti 588 milyar dolara ulaştı; bu rakam ülkenin 2025 GSYİH'sının yaklaşık 3 katı. Kaynak: ec.europa.eu",
        "ua": "Оновлений звіт ЄС-Світового банку: вартість десятирічного відновлення України досягла $588 млрд — близько 3 ВВП країни за 2025 р. Джерело: ec.europa.eu"
      },
      "url": "https://enlargement.ec.europa.eu/news/updated-ukraine-recovery-and-reconstruction-needs-assessment-released-2026-02-23_en",
      "impact": -1,
      "type": "negative"
    },
    {
      "category": "economic",
      "date": { "tr": "Mart 2026", "ua": "Березень 2026" },
      "title": {
        "tr": "AB: Ukrayna enerji sektörü yeniden inşasına katılım",
        "ua": "ЄС: участь у відновленні енергетики України"
      },
      "body": {
        "tr": "Zelensky'nin resmi sitesine göre AB, Ukrayna'nın enerji sektörünün yeniden inşasına ve kış hazırlığına katılacak; ortak strateji hazırlıkları başladı. Kaynak: president.gov.ua",
        "ua": "За даними офіційного сайту Зеленського, ЄС візьме участь у відновленні та захисті енергосектору України; підготовка спільної стратегії розпочата. Джерело: president.gov.ua"
      },
      "url": "https://www.president.gov.ua/en/news/yevrosoyuz-bratime-uchast-u-vidnovlenni-ta-onovlenni-zahistu-103109",
      "impact": 1,
      "type": "positive"
    },
    {
      "category": "humanitarian",
      "date": { "tr": "2026", "ua": "2026" },
      "title": {
        "tr": "IOM: 2025'te 1 milyon kişiye ulaşıldı",
        "ua": "МОМ: у 2025 р. допомогу отримав 1 млн людей"
      },
      "body": {
        "tr": "Uluslararası Göç Örgütü, 2025 yılında Ukrayna ve komşu ülkelerde 1 milyondan fazla kişiye ulaştığını bildirdi; 11 milyon kişi hâlâ yardıma muhtaç. Kaynak: iom.int",
        "ua": "Міжнародна організація з міграції повідомила, що у 2025 р. надала допомогу понад 1 млн осіб в Україні та сусідніх країнах; ще 11 млн потребують підтримки. Джерело: iom.int"
      },
      "url": "https://www.iom.int/news/over-1m-supported-2025-nearly-11m-still-need-assistance-ukraine",
      "impact": 0,
      "type": "neutral"
    }
  ],
  "gundemLastUpdate": "2026-03-30T22:00:00"
};
