# TürkUA

TürkUA, component kaynaklarından statik ve taranabilir bir production sitesi
üreten, Supabase tabanlı yönetim altyapısına sahip iki dilli bilgi platformudur.

## Gereksinimler

- Node.js 20.19 veya üzeri
- pnpm 11
- İsteğe bağlı ücretsiz Supabase projesi

## Komutlar

```bash
pnpm install
pnpm build
pnpm release
```

- `pnpm build`: Component kaynaklarını birleştirir; kullanılmayan site CSS'ini
  çıkarır ve küçültülmüş ana sayfa varlıklarını üretir.
- `pnpm release`: Lint, build, production paketleme ve bütünlük kontrolünü
  çalıştırır. Yayına hazır çıktı yalnızca `dist/` klasöründedir.
- `pnpm check`: Mevcut `dist/` paketinin dosya, bağlantı, secret, console ve
  service worker kontrollerini tekrar çalıştırır.

## Supabase Yapılandırması

Public URL ve publishable key kaynak koduna yazılmadan release sırasında
verilebilir:

```bash
SUPABASE_URL="https://proje.supabase.co" \
SUPABASE_PUBLISHABLE_KEY="sb_publishable_..." \
pnpm release
```

Yerel kullanımda aynı değerler proje kökündeki `.env.local` dosyasından da
otomatik okunur. Başlangıç için `.env.local.example` dosyasını örnek alın.
Shell veya GitHub Actions tarafından verilen değerler `.env.local`
değerlerinden önceliklidir.

Bu iki değer birlikte verilmezse release durur. Değerler verilmediğinde site
statik içerikle çalışır; yönetim girişi ve veri yazan formlar kapalı kalır.

Telegram bot token'ı ve diğer secret değerler tarayıcı paketine girmez. Bunlar
yalnızca Supabase Edge Function secret alanında tutulur.

## Kaynak Yapısı

- `index.template.html`: Ana production şablonu.
- `assets/components/`: Site bölümleri.
- `assets/css/`: Düzenlenebilir stil kaynakları.
- `assets/js/`: Site modülleri ve Supabase istemci katmanı.
- `admin/`: Yönetim paneli kaynakları.
- `backend/supabase/`: SQL migration ve Edge Function kaynakları.
- `scripts/`: Build, release ve doğrulama araçları.
- `dist/`: Yayına gönderilecek, otomatik üretilen paket.

Production dağıtımında proje kökü yerine yalnızca `dist/` klasörü
yayınlanmalıdır.

## Statik Hosting

Production dosyaları göreli yollar kullanır. Bu nedenle `dist/` içeriği alan
adı kökünde, bir alt klasörde veya GitHub Pages proje dizininde yayınlanabilir.
GitHub Pages kullanırken yayın kaynağı olarak `dist/` klasörünün içeriğini
seçin; repository adı için ayrıca base path tanımlamak gerekmez.

Public `index.html` dosyası doğrudan tarayıcıda da açılabilir. Service Worker ve
Supabase ES modülleri tarayıcı güvenlik kuralları gereği `file://` altında
çalıştırılmaz; tam çevrim içi özellik testi için `dist/` klasörünü yerel bir
HTTP sunucusuyla açın.
