# TürkUA Production Kurulumu

## Yerel Hazırlık

```bash
cd ~/Documents/turkua
pnpm install
pnpm release
```

Başarılı release sonunda yalnızca `dist/` klasörü yayınlanır. Kaynak
component'ler, SQL dosyaları, geliştirme araçları ve eski yönetim yardımcıları
production paketine alınmaz.

## Supabase

1. Ücretsiz Supabase projesi oluştur.
2. `backend/supabase/README.md` içindeki sırayla migration dosyalarını çalıştır.
3. Auth yöneticisini ve `app_metadata.role = admin` değerini tanımla.
4. Public bağlantı bilgileriyle release üret:

```bash
SUPABASE_URL="https://proje.supabase.co" \
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..." \
pnpm release
```

Secret veya `service_role` anahtarı hiçbir zaman bu komuta ya da tarayıcı
dosyalarına eklenmez.

## Telegram Bildirimi

`backend/supabase/functions/.env.example` içindeki değerleri Supabase Edge
Functions secret alanında tanımla. Telegram ve hash salt değerleri yalnız
sunucu tarafında tutulur.

## Yayınlama

Statik hosting servisinin yayın klasörünü `dist/` olarak ayarla. Apache
kullanılıyorsa `.htaccess` otomatik olarak pakete eklenir. Yayın sonrasında:

```bash
pnpm check
```

komutuyla release bütünlüğü yeniden doğrulanabilir.
