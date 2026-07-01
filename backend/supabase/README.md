# Supabase Bağlantı Katmanı

Bu klasör Supabase bağlantısını, içerik şemasını ve başlangıç verilerini tutar.

## Bağlantıyı Etkinleştirme

1. Supabase üzerinde ücretsiz bir proje oluştur.
2. Project Connect ekranından proje URL'sini ve `sb_publishable_...` anahtarını al.
3. Yeni bir kurulumda SQL Editor içinde `ALL_MIGRATIONS.sql` dosyasını bir kez
   çalıştır. Alternatif olarak `000_bootstrap_functions.sql`,
   `20260629_i18n_content.sql`, `20260629_i18n_runtime.sql`,
   `20260629_content_management.sql`, `20260629_contact_system.sql` ve
   `20260701_cms_data_model.sql` dosyalarını bu sırayla ayrı ayrı çalıştır.
4. Değerleri `assets/js/supabase/config.js` dosyasına ekle.
5. Supabase Auth içinde e-posta/şifre girişini etkinleştir.
6. Yönetici kullanıcısını Supabase Dashboard üzerinden oluştur ve kullanıcının
   `app_metadata.role` değerini `admin` olarak ayarla.

Tarayıcı koduna yalnızca publishable key yazılabilir. `sb_secret_...`,
`service_role` veya veritabanı parolası hiçbir istemci dosyasına eklenmemelidir.
Birleşik migration ile ayrı migration dizisini aynı kurulumda peş peşe
çalıştırmayın; kurulum için bu iki yöntemden yalnızca birini seçin.

## Hazır Servisler

- `auth.js`: Oturum, kullanıcı, e-posta/şifre girişi ve çıkış.
- `database.js`: Tablo ve RPC erişim sınırı.
- `storage.js`: Bucket, yükleme, silme ve public URL erişimi.
- `realtime.js`: Postgres Changes kanal abonelikleri.

## İçerik Mimarisi

- `languages` etkin dilleri ve sıralarını tutar.
- `translations` tüm sayfa ve çalışma zamanı metinlerini dil bazında tutar.
- Yayındaki kayıtlar anonim okunabilir; yazma işlemleri yalnızca `admin` rolüne açıktır.
- `translations` ve `languages` Realtime publication içindedir.
- Yeni dil, yönetim panelindeki Çeviri Yönetimi ekranından eklenebilir.
- Haberler çok dilli alt kayıtlarla, reklamlar süre kontrollü kampanyalarla yönetilir.
- Reklam istatistikleri ücretsiz katmanı korumak için günlük toplulaştırılır.
- Başvurular Edge Function üzerinden doğrulanır, hız sınırından geçirilir ve
  `submissions` tablosuna kaydedilir.
- `20260701_cms_data_model.sql`; site ayarları, hero, yeni haber modeli, takip
  verileri, bölüm kartları, sponsor reklamlar, iletişim ayarları ve merkezi medya
  kayıtlarını mevcut frontend tablolarını değiştirmeden hazırlar.

## Storage ve Medya Kütüphanesi

- `media` bucket'ı Hero ve haber görsellerini tutar. JPG, PNG ve WEBP kabul eder.
- `ads` bucket'ı sponsor logoları ve reklam banner'larını tutar. JPG, PNG, WEBP
  ve GIF kabul eder.
- İki bucket için dosya sınırı 5 MB'dir.
- Yüklenen her dosya `media_assets` tablosuna kaydedilir.
- Silme işleminden önce Hero, haber, bölüm kartı, sponsor ve eski reklam
  kayıtlarındaki kullanımlar kontrol edilir.
- Güvenli medya değiştirme işlemi `replace_media_asset_references` RPC'si ile
  tüm referansları tek transaction içinde günceller.
- Bucket oluşturma ve Storage RLS politikaları
  `20260629_content_management.sql` migration dosyasındadır.

Migration daha önce çalıştırıldıysa yeni RPC ve medya modeli güncellemelerini
almak için `20260701_cms_data_model.sql` dosyasını tekrar çalıştırmak güvenlidir.

## Public CMS Çalışma Zamanı

- Hero, savaş takip verileri ve iletişim bilgileri `cms-service.js` tarafından
  yüklenir ve Realtime değişikliklerinde yeniden uygulanır.
- Haberler `news-service.js`, klasik reklamlar ve sponsor reklamlar
  `ad-service.js` üzerinden canlı güncellenir.
- Pasif, taslak, tarihi gelmemiş veya süresi dolmuş kayıtlar public sorgulara
  dahil edilmez.
- Supabase erişilemezse derlenmiş Türkçe içerik, `data.js`, reklam yer tutucuları
  ve RSS akışı çalışmaya devam eder.
- CMS içerik değişiklikleri build veya deploy gerektirmez. Tasarım, JavaScript,
  SQL şeması, RLS ve statik SEO fallback değişiklikleri yeni release gerektirir.

## İletişim ve Telegram

1. `backend/supabase/functions/.env.example` dosyasındaki değişkenleri Supabase
   Dashboard > Edge Functions > Secrets alanına ekle.
2. `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` ve uzun, rastgele bir
   `SUBMISSION_HASH_SALT` değeri tanımla.
3. Canlı site adreslerini virgülle ayrılmış biçimde `ALLOWED_ORIGINS` olarak ekle.
4. Projenin `backend` klasöründen fonksiyonu dağıt:

```bash
supabase functions deploy submit-application --project-ref PROJE_REFERANSI
```

Fonksiyon herkese açık form uç noktası olduğu için JWT doğrulaması kapalıdır;
tablolara doğrudan anonim yazma izni verilmemiştir. Rate limit ve spam kontrolü
fonksiyon ile veritabanı işlemi içinde uygulanır. Telegram bot anahtarı kesinlikle
`assets/js/supabase/config.js` dosyasına yazılmamalıdır.
