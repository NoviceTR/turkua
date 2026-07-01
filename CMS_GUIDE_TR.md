# TürkUA CMS Kullanım Rehberi

Bu rehber, TürkUA içeriklerini kod değiştirmeden yönetmek için gereken ilk
kurulumu ve günlük kullanım adımlarını açıklar.

## 1. İlk Kurulum

Supabase üzerinde ücretsiz bir proje oluşturun. Yeni kurulum için SQL Editor
içinde `backend/supabase/ALL_MIGRATIONS.sql` dosyasını tek sorgu olarak bir kez
çalıştırın.

İsterseniz birleşik dosya yerine aşağıdaki kaynak migration dosyalarını sırayla
çalıştırabilirsiniz:

1. `backend/supabase/000_bootstrap_functions.sql`
2. `backend/supabase/20260629_i18n_content.sql`
3. `backend/supabase/20260629_i18n_runtime.sql`
4. `backend/supabase/20260629_content_management.sql`
5. `backend/supabase/20260629_contact_system.sql`
6. `backend/supabase/20260701_cms_data_model.sql`

Son migration daha önce çalıştırıldıysa tekrar çalıştırılması güvenlidir.
Birleşik dosya ile ayrı migration listesini aynı kurulumda peş peşe
çalıştırmayın; yalnızca bir yöntemi kullanın.

## 2. Supabase Bağlantısı

GitHub repository ayarlarında veya production build ortamında şu değişkenleri
tanımlayın:

```text
SUPABASE_URL=https://PROJE.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Tarayıcıya `service_role`, secret key veya veritabanı parolası yazmayın.

## 3. Yönetici Kullanıcısı

Supabase Auth bölümünde e-posta/şifre kullanıcısı oluşturun. Kullanıcının
`app_metadata.role` değerini `admin` yapın. Panel adresi:

```text
/admin/login.html
```

## 4. Storage Kontrolü

Migration sonrasında Storage bölümünde şu bucket'lar bulunmalıdır:

- `media`: Hero ve haber görselleri
- `ads`: Reklam banner'ları ve sponsor logoları
- `submissions`: Başvuru ekleri; private

`media` ve `ads` için dosya sınırı 5 MB'dir. Haber ve Hero alanlarında JPG, PNG
ve WEBP; reklam ve sponsor alanlarında ayrıca GIF kullanılabilir.

## 5. Admin Panelinden Yönetilebilenler

- Haber ekleme, düzenleme, silme, taslak/yayın ve öne çıkarma
- Hero başlıkları ve arka plan görseli
- Savaş takip olasılıkları, güven, trend ve gelişmeler
- TR/UA çevirileri ve rehber metinleri
- İletişim bilgileri ve form durumu
- Klasik reklam kampanyaları
- Sponsor reklamlar
- Medya yükleme, önizleme, güvenli değiştirme ve silme
- İletişim, reklam ve ürün başvuruları

## 6. Deploy Gerektirmeyen İşlemler

Supabase bağlantısı ve ilk production deploy tamamlandıktan sonra yukarıdaki
normal içerik değişiklikleri Realtime ile public siteye aktarılır. Bu işlemler
için Git, terminal, pnpm veya yeniden build gerekmez.

## 7. Deploy Gerektiren İşlemler

- HTML, CSS veya JavaScript değişiklikleri
- Yeni tablo, migration, RPC veya RLS politikası
- Statik SEO fallback, OpenGraph, Schema, manifest veya Service Worker değişimi
- Yeni admin ekranı veya yeni public özellik
- Mağaza ürün kataloğu ve sayfa/bölüm sıralaması

## 8. Fallback Davranışı

Supabase geçici olarak çalışmazsa statik Türkçe HTML, SEO metinleri, `data.js`
takip verileri, RSS gündemi ve reklam yer tutucuları çalışmaya devam eder.
Supabase tekrar erişilebilir olduğunda CMS verileri yeniden yüklenir.

## 9. Yayına Alma Kontrolü

1. Tüm migration dosyalarının hata vermeden çalıştığını doğrulayın.
2. `media`, `ads` ve `submissions` bucket'larını kontrol edin.
3. Admin hesabıyla giriş yapın.
4. Test Hero, haber ve sponsor kaydı oluşturun.
5. Public sitede kayıtların göründüğünü kontrol edin.
6. Bir kaydı pasif yapıp public siteden kalktığını doğrulayın.
7. Test kayıtlarını silin.

## 10. Güvenlik

- Yalnızca publishable key public build içinde bulunabilir.
- Tüm yazma işlemleri RLS ile `admin` rolüne sınırlandırılmıştır.
- Formlar Edge Function üzerinden rate limit ve spam kontrolünden geçer.
- Kullanımdaki medya dosyaları silinmeye karşı kontrol edilir.
