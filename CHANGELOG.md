# Changelog

Bu projedeki önemli değişiklikler bu dosyada belgelenir.

## TURKUA Phase 2.6 - 2026-07-01

### Final Production Audit

- Public site; hero, tracker, statik haberler, navigasyon, TR/UA geçişi,
  reklam modalı, lazy servisler, kurlar ve mağaza kartlarıyla birlikte yeniden
  doğrulandı.
- Mobil, 1080p ve 4K görünümlerinde navigasyon modu, konteyner genişlikleri,
  hero tipografisi ve yatay taşma kontrol edildi.
- RSS ve yönetilen haber bulunmadığında oluşan boş gündem alanı, veritabanından
  yönetilebilir erişilebilir hata durumuyla değiştirildi.
- Supabase dil tablosu bağlı değilken Ukraynaca belge dilinin geçersiz `ua`
  yerine standart `uk` kodunu kullanması sağlandı.
- Service Worker'ın offline public sayfa fallback'ini `/admin/` isteklerine
  uygulaması engellendi; admin sayfaları kendi HTTP sonucunu koruyor.
- Hiçbir yerde kullanılmayan eski `shop-data.min.js` çıktısı kaldırıldı.
- Doğrulanmış `dist/` klasörünü GitHub Pages'e yayınlayan GitHub Actions
  workflow'u eklendi.
- Kısa local release, GitHub Pages, Supabase variable ve özel alan adı
  yönergelerini içeren `DEPLOYMENT.md` oluşturuldu.
- Gereksiz macOS `.DS_Store` dosyası kaldırıldı.

### Doğrulama

- Production release 115 kaynak ve 42 dağıtım dosyasıyla başarılı.
- Public ve admin asset/modül isteklerinde 404 bulunmadı.
- Public sayfa, admin giriş ve oturum koruma akışlarında konsol hata/uyarısı
  görülmedi.
- Admin dashboard geçerli oturum olmadığında giriş sayfasına yönlendiriliyor.
- Supabase yapılandırılmamış release'te admin formu güvenli biçimde pasif
  kalıyor ve yapılandırma durumu kullanıcıya bildiriliyor.

## TURKUA Phase 2.5 - 2026-07-01

### Düzeltildi

- RSS proxy'sinin HTTP hata veya geçersiz JSON cevabı başarı kabul edilmek
  yerine kontrollü hata ve retry akışına alındı.
- Tüm RSS kaynakları boş/başarısız olduğunda gündem iskeletinin sonsuza kadar
  ekranda kalması engellendi.
- Süresi dolmuş gündem önbelleği, ağ yenilemesi başarısız olsa bile son bilinen
  içeriği gösterecek şekilde korundu.
- Kur API'sinde HTTP hata durumları JSON işlenmeden önce kontrol ediliyor.
- Haber servisi `file://` ortamında desteklenmeyen Supabase ES modül importunu
  artık başlatmıyor.
- Service Worker 404 ve diğer başarısız HTTP yanıtlarını cache'e yazmıyor.
- Frontend ve Service Worker varlık sürümü yenilenerek eski runtime
  dosyalarının istemci cache'inde kalması önlendi.

### Doğrulama

- Public JavaScript'teki tüm literal DOM ID ve selector referansları üretim
  HTML'iyle karşılaştırıldı; eksik selector bulunmadı.
- Tracker, haber filtresi, TR/UA geçişi, reklam modalı, Escape listener'ı,
  manuel gündem yenilemesi, kurlar ve lazy servisler gerçek tarayıcıda test
  edildi.
- Public site ilk yükleme, etkileşim ve Service Worker sonrası yeniden
  yükleme aşamalarında konsol hata/uyarısı üretmedi.
- Admin giriş modülü ayrıca açıldı; CSS ve ES modül yüklemesi temiz bulundu.
- Yerel sunucu isteklerinde 404 yanıtı görülmedi.

## TURKUA Phase 2.4 - 2026-07-01

### Dağıtım Uyumluluğu

- Public CSS, JavaScript, data, manifest ve ikon bağlantıları site köküne bağlı
  `/...` yollarından belgeye göre çözülen `./...` yollarına geçirildi.
- Lazy yüklenen haber ve servis paketleri, çalıştıkları `site.min.js` dosyasının
  konumundan türetilir hale getirildi.
- PWA `id`, `start_url`, `scope` ve ikon yolları GitHub Pages proje alt
  klasörleriyle uyumlu hale getirildi.
- Service Worker önbellek listesi ve offline fallback adresi kendi scope'una
  göre çözülecek şekilde düzenlendi.
- Service Worker ve asset sürümü yükseltilerek eski kök-yol önbelleğinin
  production istemcilerinde kalması engellendi.
- Panelden gelen göreli reklam ve ürün görseli yolları deployment base path'ine
  göre güvenli biçimde çözümleniyor.
- `file://` açılışında desteklenmeyen Service Worker ve Supabase ES modül
  başlangıçları güvenli biçimde atlanıyor; statik site içeriği korunuyor.
- Apache HTTPS/canonical yönlendirmesi yalnız TürkUA production alan adlarıyla
  sınırlandı; localhost artık production alan adına yönlenmiyor.

### Doğrulama

- Release kontrolü root-relative HTML, manifest, Service Worker ve JavaScript
  import yollarını reddedecek şekilde genişletildi.
- Tüm production HTML bağlantıları, manifest ikonları, Service Worker
  varlıkları ve statik/dinamik modül importları dosya varlığı açısından
  doğrulanıyor.
- Site hem sunucu kökünde hem `/dist/` alt klasöründe gerçek tarayıcıyla
  test edildi.
- CSS, data, ana JavaScript, lazy haber/servis paketleri, ikon, manifest,
  Service Worker ve Supabase modülleri `200/304` yanıtlarıyla yüklendi.
- Tarayıcı konsolunda hata/uyarı ve yerel sunucu günlüğünde 404 bulunmadı.

## TURKUA Phase 2.3 - 2026-07-01

### Performans

- Public JavaScript kritik başlangıç, canlı içerik ve servisler olmak üzere üç
  pakete ayrıldı.
- Canlı haber paketi boş zamanda veya ilgili bölüme yaklaşınca; kur, form ve
  mağaza paketi yalnız ilgili bölümlere yaklaşınca yüklenir hale getirildi.
- Kritik `site.min.js` paketi 37,3 KB'tan 20,7 KB'a düşürüldü.
- Google Fonts isteği tek değişken font kaynağına indirildi; kritik veri
  dosyası preload edildi ve release varlıkları sürümlendirildi.
- Hero ızgara animasyonu boya maliyeti oluşturan arka plan hareketinden GPU
  destekli transform hareketine geçirildi.

### JavaScript

- Navigasyonun her scroll olayında bölüm konumu taraması kaldırıldı; aktif
  bölüm takibi tek bir `IntersectionObserver` ile yapılıyor.
- Tracker, içerik, mağaza ve dil kontrollerinde tekrar eden DOM sorguları ile
  gereksiz yeniden render işlemleri azaltıldı.
- Haber kartları ve gelişme listeleri tek DOM güncellemesiyle oluşturulur hale
  getirildi.
- Haber, reklam ve içerik Realtime yenilemeleri kısa süreli birleştirildi;
  aynı anda başlayan yinelenen istekler tek istek altında toplandı.
- Gündem ve kur yenilemeleri tek, görünürlük duyarlı zamanlayıcıya geçirildi.
- Hero animasyonu sayfa görünür değilken duruyor; resize ve pointer işlemleri
  animasyon karesi başına sınırlandırılıyor.
- Sayfa gizleme, geri dönüş ve bfcache durumları için timer, observer ve
  animasyon yaşam döngüsü temizliği eklendi.
- Service Worker kaydı ilk yükleme tamamlandıktan sonraya ertelendi.

### Doğrulama

- Tracker, haber paketi, döviz kurları, mağaza kartları, TR/UA dil geçişi ve
  reklam penceresi gerçek tarayıcı etkileşimleriyle doğrulandı.
- Servis paketinin başlangıçta yüklenmediği ve yalnız ilgili bölüme yaklaşınca
  bir kez yüklendiği doğrulandı.
- 390 piksel mobil, 1920 piksel masaüstü ve 3840 piksel 4K görünümlerinde
  yatay taşma olmadığı kontrol edildi.
- Tarayıcı konsolunda hata veya uyarı bulunmadı.
- Admin paneli ve Supabase iş mantığı değiştirilmedi.

## TURKUA Phase 2.2 - 2026-06-30

### Eklendi

- Hero bölümüne mavi, altın ve yeşil tonları birlikte kullanan animasyonlu
  ışık çizgileri, perspektif derinlik ızgarası ve ufuk katmanı.
- Ekranda olmadığı zaman otomatik duran, cihaz yoğunluğunu sınırlayan ve
  hareket azaltma tercihini destekleyen hafif canvas parçacık sistemi.
- Fare konumuna tepki veren spotlight ve düşük hareket mesafeli parallax
  derinlik efekti.
- Public arayüz için bağımsız `polish.css` görsel iyileştirme katmanı.

### Değiştirildi

- Mevcut canlı olasılık kartları yeni veri alanı oluşturmadan premium stat
  widget görünümüne geçirildi.
- Tracker durum panelleri masaüstünde daha sıkı iki kolonlu düzene,
  mobilde tek kolona uyarlandı.
- Navbar, butonlar, reklam alanları, form odak durumları, kartlar, bölüm
  geçişleri ve footer daha güçlü gölge, cam ve mikro etkileşimlerle yenilendi.
- Emoji tarzı dekoratif ikonların gizlendiği mevcut yaklaşım korunarak görsel
  vurgu CSS çizgileri, ışıklar ve durum noktalarıyla sağlandı.
- Aktif navbar durumu inline stil yerine ortak `active` sınıfına taşındı.
- 769-1100 piksel aralığı için ayrı hero tipografi adımı eklendi.

### Doğrulama

- Hero, spotlight ve parallax hareketi gerçek fare girdisiyle doğrulandı.
- 390, 768, 769, 1366, 1920, 2560, 3440 ve 3840 piksel genişliklerinde
  responsive görünüm kontrol edildi.
- Tüm hedef genişliklerde yatay taşma sıfır ve tarayıcı konsolu temiz bulundu.
- Kaynak CSS'te tekrar eden seçici/bağlam grubu kalmadığı doğrulandı.
- 114 kaynak dosyası ve 41 dosyalık yaklaşık 322 KB production paketi
  başarıyla doğrulandı.
- Admin paneli ve Supabase bağlantı mantığı değiştirilmedi.

## TURKUA Phase 2.1 - 2026-06-30

### Değiştirildi

- Public site CSS'i temel, özellik, tema, geniş ekran, mobil ve erişilebilirlik
  katmanlarına ayrıldı; admin paneli ve iş mantığı değiştirilmedi.
- Ortak renk, panel, boşluk, konteyner ve tipografi değerleri CSS değişkenleri
  altında toplandı.
- Çakışan tema kuralları sahip oldukları modüllere taşındı; tekrar eden
  seçici grupları kaldırıldı.
- Mobil responsive kurallar tek bir öngörülebilir breakpoint akışında
  birleştirildi.
- 1920, 2560, 3440 ve 3840 piksel genişlikleri için kontrollü konteyner,
  kart, boşluk ve tipografi adımları eklendi.
- Az sayıda kart içeren bölümlerin ultrawide ekranlarda gereksiz uzaması
  engellendi.
- Dinamik reklam ve içerik sınıfları production CSS temizleme güvenli listesine
  eklendi.

### Düzeltildi

- Tracker ve haber iskeletlerinin aynı `shimmer` animasyon adını kullanmasından
  kaynaklanan stil çakışması giderildi.
- Mobil alt navigasyonun genel navigasyon konum kuralından etkilenmesi
  engellendi.
- Mobil görünümde animasyonları topluca devre dışı bırakan eski kural
  kaldırıldı; hareket azaltma tercihi korunmaya devam ediyor.

### Doğrulama

- Kaynak CSS'te tekrar eden seçici/bağlam grubu kalmadığı doğrulandı.
- 375, 768, 769, 960, 961, 1366, 1920, 2560, 3440 ve 3840 piksel
  genişliklerinde responsive davranış test edildi.
- Mobil, 1080p, ultrawide ve 4K görünümler tarayıcıda görsel olarak incelendi.
- Tüm hedef genişliklerde yatay taşma sıfır ve tarayıcı konsolu temiz bulundu.
- 41 dosyalık, yaklaşık 308 KB production paketi başarıyla doğrulandı.

## [1.1.0] - 2026-06-30

### Eklendi

- Yalnız yayınlanması gereken dosyaları `dist/` altında toplayan production
  release sistemi.
- `pnpm lint`, `pnpm check:source`, `pnpm check` ve `pnpm release` komutları.
- JavaScript için ESLint, CSS kullanım analizi için PurgeCSS ve Edge Function
  sözdizimi kontrolü için TypeScript doğrulaması.
- HTML, CSS, JSON, TypeScript, yerel dosya bağlantıları, duplicate ID, görsel
  alt metni, buton tipi, service worker ve secret taraması yapan otomatik
  kontroller.
- Admin yöneticilerinin kullandığı ortak `utils.js` yardımcı modülü.
- Supabase public bağlantı bilgilerini release sırasında
  `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` değişkenlerinden üretme desteği.
- Supabase Edge Function secret değerleri için `.env.example`.
- Production kullanımı ve dağıtım akışını açıklayan `README.md`.

### Değiştirildi

- Paket sürümü `1.1.0`, minimum Node.js sürümü `20.19` olarak tanımlandı.
- Site CSS'i production derlemesinde kullanım analizinden geçirilip
  küçültülüyor.
- Admin CSS'i release sırasında kullanım analizinden geçirilip küçültülüyor.
- Admin ve Supabase ES modülleri release paketinde ayrı ayrı küçültülüyor.
- Production JavaScript paketlerinden console çağrıları çıkarılıyor.
- Admin font yüklemesi CSS `@import` yerine HTML bağlantılarına taşındı.
- Admin paneli Supabase bağlantısı veya geçerli oturum yoksa güvenli biçimde
  giriş sayfasına yönleniyor.
- Yönetim dokümantasyonu ortam değişkenli release akışına göre güncellendi.
- Eski Studio aracı artık bulunmayan `site-content.js` dosyasını istemiyor;
  mevcut Türkçe seed içeriğini kullanıyor.

### Düzeltildi

- Mobil alt navigasyonun genel `nav { top: 0 }` kuralı nedeniyle ekranın üstüne
  yerleşmesi düzeltildi.
- `diplomacy` ve `diplomatic` kategori uyuşmazlığı giderildi; diplomatik haber
  filtresi yeniden çalışır hale getirildi.
- Admin sayfalarındaki eksik favicon isteği ve 404 yanıtı giderildi.
- Dil değiştiricinin başka dosyalardaki render fonksiyonlarına örtük global
  değişkenlerle ulaşması kaldırıldı.
- Supabase Realtime yenileme callback'lerinde console hatası oluşturan
  referanslar kaldırıldı.
- Haber, gündem ve mağaza metinlerinin dinamik HTML içine güvenli yazılması
  güçlendirildi.

### Kaldırıldı

- Production akışında kullanılmayan eski `assets/js/app.js` component
  yükleyicisi.
- Production akışında kullanılmayan `assets/css/style.css` import toplayıcısı.
- Eski `index.html.before-premium-update` yedek dosyası.
- Kullanılmayan reklam iletişim sekmesi kodu, mağaza stok yazıcısı ve eski
  iletişim formu göndericisi.
- Site production CSS'inden 54, admin production CSS'inden 8 kullanılmayan
  seçici.
- Production paketinden SQL, Python, Markdown, component kaynakları, geliştirme
  araçları ve eski tek-dosyalı admin yardımcıları.

### Güvenlik

- Release paketinde `service_role`, secret anahtar, development kaynağı ve
  console çağrısı bulunmadığı otomatik doğrulanıyor.
- Supabase URL ve publishable key birlikte ve geçerli formatta değilse
  yapılandırılmış release durduruluyor.
- Admin paneli yapılandırılmamış durumda açık yönetim kabuğuna erişim vermiyor.
- Dinamik haber kategorileri izin verilen sınıf listesiyle sınırlandırıldı.
- Dinamik metinlerde HTML kaçışları ortaklaştırıldı.

### Doğrulama

- 110 proje dosyası kaynak kontrolünden geçirildi.
- 41 dosyalık, yaklaşık 309 KB production paketi doğrulandı.
- Masaüstü, 768px tablet ve 390px mobil görünümler kontrol edildi.
- Ana site ve admin girişinde yatay taşma veya console hatası bulunmadı.
- Diplomatik haber filtresi ve admin güvenli yönlendirme akışı tarayıcıda
  doğrulandı.

## [1.0.0] - 2026-06-29

### Eklendi

- Hero, tracker, gündem, haber, eğitim, vize, ticaret, para transferi, mağaza,
  iletişim ve footer component yapısı.
- Ortak CSS ve JavaScript modülleri.
- Responsive, site temasıyla uyumlu admin paneli.
- Supabase Authentication, Database, Storage, Realtime ve Edge Function
  bağlantı katmanı.
- TR ve UA dilleri için veritabanı tabanlı içerik ve canlı güncelleme sistemi.
- Haber, kategori, görsel, yayın tarihi, öne çıkan, canlı ve taslak yönetimi.
- Banner, sidebar, popup, sponsor ve leaderboard reklam yönetimi ile günlük
  istatistik sistemi.
- Supabase kayıtlı iletişim formları, Telegram bildirimi, spam koruması ve rate
  limit altyapısı.
- Statik ve taranabilir production HTML, Schema.org, OpenGraph, Twitter Card,
  canonical, robots ve sitemap desteği.
- Minify, preload, preconnect, lazy loading, görsel optimizasyonu ve
  erişilebilirlik iyileştirmeleri.
