# TürkUA Admin Paneli

Bu klasör Supabase Auth, Database, Storage ve Realtime kullanan yönetim panelini
içerir. Panelin çalışması için proje bağlantısı ve CMS migration dosyaları gerekir.

## Yapı

- `login.html`: Supabase Auth e-posta/şifre girişi.
- `dashboard.html`: Ortak panel kabuğu.
- `components/`: Sidebar ve header gibi paylaşılan parçalar.
- `views/`: Her yönetim ekranının bağımsız HTML görünümü.
- `assets/css/admin.css`: Ortak tema ve responsive düzen.
- `assets/js/admin-app.js`: Görünüm yönlendirme ve panel etkileşimleri.
- `assets/js/auth.js`: Supabase Auth oturum akışı.
- `assets/js/news-manager.js`: Haber CRUD ve görsel yükleme.
- `assets/js/ads-manager.js`: Mevcut reklam kampanyaları ve istatistikler.
- `assets/js/cms-content-managers.js`: Hero, savaş takibi ve iletişim ayarları.
- `assets/js/sponsors-manager.js`: Sponsor reklam CRUD ve medya kayıtları.
- `assets/js/media-manager.js`: Medya kütüphanesi, güvenli silme ve değiştirme.
- `assets/js/media-tools.js`: Ortak drag-drop ve Storage yükleme işlemleri.

## Kullanım

1. Production release sırasında `SUPABASE_URL` ve
   `SUPABASE_PUBLISHABLE_KEY` ortam değişkenlerini ver.
2. `backend/supabase/README.md` içindeki migration sırasını uygula.
3. Supabase Auth kullanıcısına `app_metadata.role = admin` yetkisi ver.
4. `admin/login.html` adresinden e-posta ve şifreyle giriş yap.

Secret veya `service_role` anahtarlarını hiçbir zaman istemci dosyalarına yazma.

Hero, savaş takibi, iletişim, haber, çeviri, klasik reklam ve sponsor reklam
değişiklikleri kaydedildikten sonra public sitede Realtime ile uygulanır. Bu
normal içerik işlemleri için Git, terminal veya yeniden build gerekmez.
