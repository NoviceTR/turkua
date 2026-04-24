// ============================================================
// DATA.JS — TürkUA Savaş Takip Verileri
// Otomatik güncelleme: Zamanlanmış görev tarafından yönetilir.
// Kaynak: ISW, Kyiv Independent, Ukrinform, Reuters
// ============================================================
// DATA_START
window.WAR_DATA = {
  "prob1d": 2,
  "prob1m": 6,
  "prob1y": 32,
  "confidence": 3,
  "lastUpdate": "2026-04-25T12:00:00",
  "trendPct": 28,
  "statusSavas": { "tr": "AKTİF", "ua": "АКТИВНА" },
  "statusMuzakere": { "tr": "DURDU", "ua": "ЗУПИНЕНО" },
  "trend": { "tr": "düşük / sabit", "ua": "низький / стабільний" },
  "label1d": { "tr": "Odessa'ya gece saldırısı: 2 ölü, 15 yaralı", "ua": "Нічний удар по Одесі: 2 загиблих, 15 поранених" },
  "label1m": { "tr": "ISW: Rusya Nisan'da 2 mil kare net kayıp yaşadı", "ua": "ISW: Росія втратила 2 кв. милі у квітні" },
  "label1y": { "tr": "AB 90 milyar Euro onayladı; barış müzakereleri İstanbul'a dönebilir", "ua": "ЄС схвалив €90 млрд; переговори можуть повернутись до Стамбула" },
  "reasoning": {
    "tr": "25 Nisan 2026 itibarıyla cephe hattında Rusya net toprak kaybetmeye devam ediyor: ISW verilerine göre 24 Nisan haftasında 5 mil kare net kayıp yaşandı. Ukrayna Neptune füzeleriyle Taganrog'daki Rusya drone fabrikasını imha etti. Odessa'ya gece saldırısında 2 sivil hayatını kaybetti, 15 kişi yaralandı. Esir takasında her iki taraf 193'er savaş esirini karşılıklı serbest bıraktı. Lavrov, İstanbul'da yeniden müzakere olasılığını olumlu karşıladığını açıkladı ancak ön koşullardan vazgeçmedi. AB Konseyi, Ukrayna'ya 90 milyar Euro'luk finansmanı ve Rusya'ya yönelik 20. yaptırım paketini onayladı.",
    "ua": "Станом на 25 квітня 2026 р. Росія продовжує зазнавати чистих втрат на фронті: за даними ISW, за тиждень 24 квітня вона втратила 5 кв. миль. Україна знищила завод з виробництва дронів у Таганрозі ракетами «Нептун». Вночі Одеса зазнала удару: 2 загиблих, 15 поранених. Відбувся обмін по 193 полонених. Лавров допустив відновлення переговорів у Стамбулі, але не відмовився від передумов. ЄС затвердив €90 млрд для України та 20-й санкційний пакет проти Росії."
  },
  "developments": [
    {
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "text": { "tr": "Odessa'ya gece saldırısında konut binaları ve limandaki ticaret gemisi vuruldu. 2 kişi hayatını kaybetti, 15 kişi yaralandı (9 kadın, 8 erkek, 18-83 yaş arası).", "ua": "Вночі вдарили по Одесі: жилі будинки та суховантаж у порту. 2 загиблих, 15 поранених (9 жінок, 8 чоловіків, 18–83 роки)." },
      "impact": -3,
      "type": "negative"
    },
    {
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "text": { "tr": "Ukrayna ve Rusya karşılıklı 193'er savaş esirini serbest bıraktı. Zelenskiy, Rusya'nın haklarında ceza davası açtığı kişilerin de takas edildiğini açıkladı.", "ua": "Україна та Росія обмінялися по 193 полонених. Зеленський: серед звільнених — ті, проти кого РФ відкрила кримінальні справи." },
      "impact": 2,
      "type": "positive"
    },
    {
      "date": { "tr": "19 Nisan 2026", "ua": "19 квітня 2026" },
      "text": { "tr": "Ukrayna Neptune füzeleriyle Rostov Oblastı'ndaki Atlant Aero drone fabrikasını vurdu. Fabrika tasarım, üretim ve test aşamalarının tamamını kapsıyordu.", "ua": "Україна вдарила ракетами «Нептун» по заводу «Атлант Аеро» в Ростовській обл. Завод охоплював повний цикл виробництва дронів." },
      "impact": 3,
      "type": "positive"
    },
    {
      "date": { "tr": "22 Nisan 2026", "ua": "22 квітня 2026" },
      "text": { "tr": "ISW: 14-21 Nisan haftasında Rusya 5 mil kare net toprak kaybetti. 24 Mart-21 Nisan döneminde toplam 2 mil kare net kayıp.", "ua": "ISW: за тиждень 14–21 квітня Росія зазнала чистих втрат 5 кв. миль. За 24 берез. – 21 квіт. загалом -2 кв. милі." },
      "impact": 2,
      "type": "positive"
    },
    {
      "date": { "tr": "20 Nisan 2026", "ua": "20 квітня 2026" },
      "text": { "tr": "Lavrov, Antalya Diplomasi Forumu'nda İstanbul'da müzakerelerin yeniden başlatılması olasılığını olumlu karşıladıklarını açıkladı.", "ua": "Лавров на Анталійському дипломатичному форумі заявив, що Росія позитивно ставиться до можливості відновлення переговорів у Стамбулі." },
      "impact": 1,
      "type": "positive"
    },
    {
      "date": { "tr": "23 Nisan 2026", "ua": "23 квітня 2026" },
      "text": { "tr": "AB Konseyi, Ukrayna'ya 90 milyar Euro'luk askeri ve bütçe desteğini ve Rusya'ya yönelik 20. yaptırım paketini resmen onayladı.", "ua": "Рада ЄС офіційно схвалила €90 млрд фінансування для України та 20-й пакет санкцій проти Росії." },
      "impact": 3,
      "type": "positive"
    }
  ],
  "newsItems": [
    {
      "category": "military",
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "title": { "tr": "Odessa'ya gece saldırısı: 2 ölü, 15 yaralı", "ua": "Нічний удар по Одесі: 2 загиблих, 15 поранених" },
      "body": { "tr": "Rusya'nın Odessa'ya düzenlediği gece saldırısında konut binaları ve limandaki ticaret gemisi vuruldu. 2 sivil hayatını kaybetti, 15 kişi yaralandı. Ukrayna Donanması aynı gece Odessa limanına yaklaşmaya çalışan bir Rus insansız deniz aracını imha etti.", "ua": "У нічному ударі Росії по Одесі постраждали житлові будинки та суховантаж у порту. 2 цивільних загинули, 15 поранені. Того ж вечора ВМС України знищили російський безпілотний катер біля Одеси." },
      "impact": -3,
      "type": "negative"
    },
    {
      "category": "military",
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "title": { "tr": "Ukrayna ve Rusya 193'er esiri karşılıklı serbest bıraktı", "ua": "Україна і Росія обмінялися по 193 полонених" },
      "body": { "tr": "Zelenskiy'nin açıklamasına göre serbest bırakılanlar arasında Rusya'nın ceza davası açtığı askerler ve yaralı askerler de yer alıyor. Takas, Türkiye'nin arabuluculuğuyla gerçekleşti.", "ua": "Зеленський: серед звільнених — ті, кому РФ пред'явила звинувачення, а також поранені. Обмін відбувся за посередництва Туреччини." },
      "impact": 2,
      "type": "positive"
    },
    {
      "category": "military",
      "date": { "tr": "19 Nisan 2026", "ua": "19 квітня 2026" },
      "title": { "tr": "Ukrayna Neptune füzeleriyle Rusya'nın drone fabrikasını imha etti", "ua": "Україна знищила завод дронів РФ ракетами «Нептун»" },
      "body": { "tr": "Ukrayna Genel Kurmayı, Neptune füzelerinin Rostov Oblastı'ndaki Atlant Aero tesisini vurduğunu doğruladı. Tesis, drone tasarımı, üretimi ve testinin tamamını kapsıyordu.", "ua": "Генштаб ЗСУ підтвердив удар ракетами «Нептун» по «Атлант Аеро» в Ростовській обл. Підприємство охоплювало повний цикл: проєктування, виробництво, випробування." },
      "impact": 3,
      "type": "positive"
    },
    {
      "category": "military",
      "date": { "tr": "22 Nisan 2026", "ua": "22 квітня 2026" },
      "title": { "tr": "ISW: Rusya son haftada 5 mil kare toprak kaybetti", "ua": "ISW: Росія втратила 5 кв. миль за останній тиждень" },
      "body": { "tr": "Russia Matters'ın ISW verisi analizine göre 14-21 Nisan haftasında Rusya 5 mil kare net toprak kaybetti. Mart 2026'da Rusya'nın drone saldırılarına karşı Ukrayna'nın önleme oranı %92'ye yükseldi.", "ua": "За аналізом Russia Matters на основі даних ISW, за 14–21 квітня Росія зазнала чистих втрат 5 кв. миль. У березні 2026 Україна збивала 92% дронів РФ." },
      "impact": 2,
      "type": "positive"
    },
    {
      "category": "diplomatic",
      "date": { "tr": "20 Nisan 2026", "ua": "20 квітня 2026" },
      "title": { "tr": "Lavrov: İstanbul müzakerelerini olumlu karşılıyoruz", "ua": "Лавров: позитивно ставимось до переговорів у Стамбулі" },
      "body": { "tr": "Antalya Diplomasi Forumu'nda konuşan Lavrov, Rusya-Ukrayna müzakerelerinin İstanbul'da yeniden başlaması olasılığını olumlu karşıladıklarını söyledi. Ancak Ukrayna'nın müzakere masasına hazır olması gerektiğini vurguladı.", "ua": "На Анталійському форумі Лавров заявив, що Росія позитивно ставиться до відновлення переговорів у Стамбулі, але наголосив: Україна має бути готова сісти за стіл." },
      "impact": 1,
      "type": "positive"
    },
    {
      "category": "diplomatic",
      "date": { "tr": "23 Nisan 2026", "ua": "23 квітня 2026" },
      "title": { "tr": "AB Ukrayna'ya 90 milyar Euro onayladı, Rusya'ya 20. yaptırım paketi", "ua": "ЄС затвердив €90 млрд для України та 20-й санкційний пакет" },
      "body": { "tr": "AB Konseyi Başkanı Costa, Ukrayna'nın 2026-2027 dönemi askeri ve bütçe ihtiyaçlarını karşılamak üzere 90 milyar Euro'luk finansmanı ve Rusya'ya yönelik 20. yaptırım paketini resmen onayladığını açıkladı.", "ua": "Голова Ради ЄС Коста оголосив офіційне схвалення €90 млрд для покриття військових і бюджетних потреб України на 2026–2027 рр. та 20-го санкційного пакету проти Росії." },
      "impact": 3,
      "type": "positive"
    },
    {
      "category": "military",
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "title": { "tr": "Rusya toplam 1.323.460 personel kaybetti", "ua": "Загальні втрати Росії — 1 323 460 особового складу" },
      "body": { "tr": "Ukrinform'a göre Rusya'nın 24 Şubat 2022'den 24 Nisan 2026'ya kadar toplam personel kaybı yaklaşık 1.323.460'a ulaştı. Son 24 saatte 910 personel kaybı yaşandı.", "ua": "За даними Укрінформу, загальні втрати Росії з 24 лютого 2022 по 24 квітня 2026 р. сягнули 1 323 460 осіб. За останню добу — 910 осіб." },
      "impact": 2,
      "type": "positive"
    },
    {
      "category": "diplomatic",
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "title": { "tr": "ABD'li senatörler Ukrayna'da din özgürlüğüne karşı Rusya'ya yaptırım tasarısı sundu", "ua": "Сенатори США внесли законопроєкт про санкції проти Росії за порушення свободи віросповідання в Україні" },
      "body": { "tr": "Çift partili ABD senatörleri grubu, Rusya'nın Ukrayna'da din özgürlüğüne saldırılarını hedef alan yaptırım yasası tasarısını 23 Nisan'da Kongre'ye sundu.", "ua": "Двопартійна група сенаторів США 23 квітня внесла до Конгресу законопроєкт про санкції, спрямований проти атак Росії на свободу віросповідання в Україні." },
      "impact": 1,
      "type": "positive"
    }
  ],
  "gundemNews": [
    {
      "category": "military",
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "title": { "tr": "Odessa'ya gece saldırısı: 2 ölü, 15 yaralı", "ua": "Нічний удар по Одесі: 2 загиблих, 15 поранених" },
      "body": { "tr": "Rusya'nın Odessa'ya düzenlediği gece saldırısında konut binaları ve limandaki ticaret gemisi vuruldu. 2 sivil hayatını kaybetti, 15 kişi yaralandı.", "ua": "У нічному ударі по Одесі постраждали житлові будинки та суховантаж у порту. 2 загиблих, 15 поранених." },
      "url": "https://www.ukrinform.net/rubric-ato",
      "impact": -3,
      "type": "negative"
    },
    {
      "category": "military",
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "title": { "tr": "193 esir takası: Türkiye arabuluculuğuyla gerçekleşti", "ua": "Обмін 193 полоненими: за посередництва Туреччини" },
      "body": { "tr": "Ukrayna ve Rusya karşılıklı 193'er savaş esirini serbest bıraktı. Serbest bırakılanlar arasında Rusya'nın haklarında ceza davası açtığı askerler de var.", "ua": "Україна та Росія обмінялися по 193 полонених. Серед звільнених — ті, кому РФ пред'явила кримінальні звинувачення." },
      "url": "https://kyivindependent.com/",
      "impact": 2,
      "type": "positive"
    },
    {
      "category": "military",
      "date": { "tr": "19 Nisan 2026", "ua": "19 квітня 2026" },
      "title": { "tr": "Ukrayna Neptune füzeleriyle Rusya drone fabrikasını vurdu", "ua": "Україна вдарила «Нептунами» по заводу дронів РФ" },
      "body": { "tr": "Neptune füzeleri Rostov Oblastı'ndaki Atlant Aero tesisini vurdu. Tesis drone tasarımı, üretimi ve testinin tamamını kapsıyordu.", "ua": "Ракети «Нептун» вразили «Атлант Аеро» в Ростовській обл. — повний цикл виробництва дронів." },
      "url": "https://kyivindependent.com/",
      "impact": 3,
      "type": "positive"
    },
    {
      "category": "military",
      "date": { "tr": "22 Nisan 2026", "ua": "22 квітня 2026" },
      "title": { "tr": "ISW: Rusya son haftada 5 mil kare net toprak kaybetti", "ua": "ISW: Росія втратила 5 кв. миль за тиждень" },
      "body": { "tr": "14-21 Nisan haftasında Rusya 5 mil kare net toprak kaybetti. Mart 2026'da Ukrayna drone önleme oranı %92'ye yükseldi.", "ua": "За 14–21 квітня Росія зазнала -5 кв. миль. У березні 2026 Україна збивала 92% дронів РФ." },
      "url": "https://www.russiamatters.org/news/russia-ukraine-war-report-card/russia-ukraine-war-report-card-april-22-2026",
      "impact": 2,
      "type": "positive"
    },
    {
      "category": "diplomatic",
      "date": { "tr": "20 Nisan 2026", "ua": "20 квітня 2026" },
      "title": { "tr": "Lavrov Antalya'da: İstanbul müzakerelerine açığız", "ua": "Лавров в Анталії: відкриті до переговорів у Стамбулі" },
      "body": { "tr": "Antalya Diplomasi Forumu'nda Lavrov, İstanbul'da yeniden müzakere olasılığını olumlu karşıladıklarını açıkladı.", "ua": "На Анталійському форумі Лавров заявив про позитивне ставлення до відновлення переговорів у Стамбулі." },
      "url": "https://www.haber7.com/dunya/haber/3621126-rusyadan-turkiye-mesaji-olumlu-karsiliyoruz",
      "impact": 1,
      "type": "positive"
    },
    {
      "category": "diplomatic",
      "date": { "tr": "23 Nisan 2026", "ua": "23 квітня 2026" },
      "title": { "tr": "AB 90 milyar Euro ve 20. yaptırım paketini onayladı", "ua": "ЄС затвердив €90 млрд та 20-й санкційний пакет" },
      "body": { "tr": "AB Konseyi Başkanı Costa, Ukrayna'ya 2026-2027 dönemi için 90 milyar Euro'luk finansmanı ve Rusya'ya 20. yaptırım paketini onayladığını açıkladı.", "ua": "Голова Ради ЄС Коста оголосив про схвалення €90 млрд для України на 2026–2027 рр. та 20-го санкційного пакету проти РФ." },
      "url": "https://kyivindependent.com/",
      "impact": 3,
      "type": "positive"
    },
    {
      "category": "military",
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "title": { "tr": "Rusya toplam 1.323.460 personel kaybetti — günlük 910", "ua": "Загальні втрати РФ — 1 323 460, за добу — 910" },
      "body": { "tr": "Ukrinform'a göre Rusya'nın 24 Şubat 2022'den bu yana toplam personel kaybı 1.323.460'a ulaştı. Son 24 saatte 910 personel kaybı yaşandı.", "ua": "За даними Укрінформу, з 24 лютого 2022 р. Росія втратила 1 323 460 осіб. За останню добу — 910." },
      "url": "https://www.ukrinform.net/rubric-ato",
      "impact": 2,
      "type": "positive"
    },
    {
      "category": "military",
      "date": { "tr": "24 Nisan 2026", "ua": "24 квітня 2026" },
      "title": { "tr": "Ukrayna yeni hava savunma seviyesi başlatıyor", "ua": "Україна запускає новий рівень 'малої' ППО" },
      "body": { "tr": "Ukrayna, küçük çaplı hava savunma sistemlerinin yeni bir seviyesini hayata geçiriyor. Sistem özellikle Shahed tipi İHA saldırılarına karşı tasarlandı.", "ua": "Україна запускає новий рівень системи «малої» протиповітряної оборони, розробленої проти дронів типу «Шахед»." },
      "url": "https://www.ukrinform.net/rubric-ato",
      "impact": 2,
      "type": "positive"
    }
  ],
  "gundemLastUpdate": "2026-04-25T12:00:00"
};
// DATA_END
