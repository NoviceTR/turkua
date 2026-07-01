-- TurkUA CMS - complete Supabase migration bundle.
-- Run this file once in Supabase SQL Editor.
-- Generated from the six ordered source migrations; keep source files as canonical.

begin;

-- ============================================================================
-- SOURCE: 000_bootstrap_functions.sql
-- ============================================================================
-- TurkUA Supabase bootstrap prerequisites.
-- Run this file before every other migration.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regnamespace('auth') is null
    or to_regclass('auth.users') is null
    or to_regprocedure('auth.uid()') is null
    or to_regprocedure('auth.jwt()') is null
  then
    raise exception
      'Supabase Auth prerequisites are missing. Run these migrations in a Supabase project.';
  end if;

  if to_regnamespace('storage') is null
    or to_regclass('storage.buckets') is null
    or to_regclass('storage.objects') is null
  then
    raise exception
      'Supabase Storage prerequisites are missing. Enable Storage, then rerun this bootstrap.';
  end if;

  if not exists (select 1 from pg_roles where rolname = 'anon')
    or not exists (select 1 from pg_roles where rolname = 'authenticated')
    or not exists (select 1 from pg_roles where rolname = 'service_role')
  then
    raise exception
      'Required Supabase database roles are missing.';
  end if;
end
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

revoke all on function public.set_updated_at() from public;
grant execute on function public.set_updated_at() to authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    execute 'create publication supabase_realtime';
  end if;
end
$$;

comment on function public.is_admin() is
  'Returns true when the current Supabase JWT has app_metadata.role=admin.';

comment on function public.set_updated_at() is
  'Shared trigger function that refreshes an updated_at column before update.';

-- ============================================================================
-- SOURCE: 20260629_i18n_content.sql
-- ============================================================================
-- TürkUA i18n schema and seed
-- Run this in Supabase SQL editor after configuring the project.

create table if not exists public.languages (
  code text primary key,
  name text not null,
  native_name text not null,
  short_label text not null default '',
  html_code text not null default '',
  enabled boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.languages add column if not exists short_label text not null default '';
alter table public.languages add column if not exists html_code text not null default '';

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  content_key text not null,
  locale text not null references public.languages(code) on update cascade on delete restrict,
  section text not null default 'general',
  content_type text not null default 'html' check (content_type in ('text', 'html')), 
  status text not null default 'published' check (status in ('draft', 'review', 'published')), 
  value text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_key, locale)
);

alter table public.languages enable row level security;
alter table public.translations enable row level security;

drop policy if exists "Languages are readable" on public.languages;
create policy "Languages are readable" on public.languages for select using (enabled = true or public.is_admin());
drop policy if exists "Translations are readable" on public.translations;
create policy "Translations are readable" on public.translations for select using (status = 'published' or public.is_admin());
drop policy if exists "Authenticated users manage languages" on public.languages;
drop policy if exists "Authenticated users manage translations" on public.translations;
drop policy if exists "Admins manage languages" on public.languages;
create policy "Admins manage languages" on public.languages for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage translations" on public.translations;
create policy "Admins manage translations" on public.translations for all using (public.is_admin()) with check (public.is_admin());

drop trigger if exists set_languages_updated_at on public.languages;
create trigger set_languages_updated_at before update on public.languages for each row execute function public.set_updated_at();
drop trigger if exists set_translations_updated_at on public.translations;
create trigger set_translations_updated_at before update on public.translations for each row execute function public.set_updated_at();

insert into public.languages (code, name, native_name, short_label, html_code, enabled, sort_order) values
  ('tr', 'Turkish', 'Türkçe', 'TR', 'tr', true, 10),
  ('ua', 'Ukrainian', 'Українська', 'UA', 'uk', true, 20)
on conflict (code) do update set name = excluded.name, native_name = excluded.native_name, short_label = excluded.short_label, html_code = excluded.html_code, enabled = excluded.enabled, sort_order = excluded.sort_order;

insert into public.translations (content_key, locale, section, content_type, status, value) values
  ('ads.span.001', 'tr', 'ads', 'text', 'published', 'Reklam Al'),
  ('ads.span.001', 'ua', 'ads', 'text', 'published', 'Замовити Рекламу'),
  ('ads.span.002', 'tr', 'ads', 'text', 'published', 'Reklam Al'),
  ('ads.span.002', 'ua', 'ads', 'text', 'published', 'Замовити Рекламу'),
  ('contact.label.001', 'tr', 'contact', 'html', 'published', 'Firma / Kişi Adı <span class="required-mark">*</span>'),
  ('contact.label.001', 'ua', 'contact', 'html', 'published', 'Компанія / Ім''я <span class="required-mark">*</span>'),
  ('contact.label.002', 'tr', 'contact', 'text', 'published', 'Sektör'),
  ('contact.label.002', 'ua', 'contact', 'text', 'published', 'Сектор'),
  ('contact.label.003', 'tr', 'contact', 'text', 'published', 'Reklam Türü'),
  ('contact.label.003', 'ua', 'contact', 'text', 'published', 'Тип реклами'),
  ('contact.label.004', 'tr', 'contact', 'text', 'published', 'Yayın Onayı'),
  ('contact.label.004', 'ua', 'contact', 'text', 'published', 'Підтвердження публікації'),
  ('contact.select.001', 'tr', 'contact', 'html', 'published', '<option value="">— Seçiniz —</option>
            
            <option>Eğitim / Üniversite</option>
            
            <option>Taşıma Otobüs / Taşımacılık</option>
            
            <option>Vize Vize / Göç Acentesi</option>
            
            <option>Ticaret / Lojistik</option>
            
            <option>Sağlık</option>
            
            <option>Emlak</option>
            
            <option>Diğer</option>'),
  ('contact.select.001', 'ua', 'contact', 'html', 'published', '<option value="">— Оберіть —</option>
            
            <option>Освіта / Університет</option>
            
            <option>Taşıma Автобус / Перевезення</option>
            
            <option>Vize Візи / Міграція</option>
            
            <option>Торгівля / Логістика</option>
            
            <option>Медицина</option>
            
            <option>Нерухомість</option>
            
            <option>Інше</option>'),
  ('contact.span.001', 'tr', 'contact', 'text', 'published', 'Reklam İş Birliği'),
  ('contact.span.001', 'ua', 'contact', 'text', 'published', 'Рекламна Співпраця'),
  ('contact.span.002', 'tr', 'contact', 'html', 'published', 'TürkUA, Türkiye ile Ukrayna arasında bilgi arayan on binlerce kişiye ulaşan bir platformdur. Reklam alanı satın alarak hedef kitlenize doğrudan ulaşabilirsiniz.<br>Başvuru formunu doldurun, <strong class="content-link">24 saat</strong> içinde size dönelim.'),
  ('contact.span.002', 'ua', 'contact', 'html', 'published', 'TürkUA — це платформа, яка охоплює десятки тисяч людей, що шукають інформацію між Туреччиною та Україною. Придбайте рекламний простір і напряму зв''яжіться з вашою аудиторією.<br>Заповніть форму — ми відповімо протягом <strong class="content-link">24 годин</strong>.'),
  ('contact.span.003', 'tr', 'contact', 'html', 'published', '<strong>Reklam kuralı:</strong> Statik görsel veya GIF kabul edilir. GIF dosyaları yayına alınmadan önce hız, içerik ve marka güvenliği açısından manuel kontrol edilir. Yetişkin içerik, yasa dışı hizmet, yanıltıcı vaat, siyasi propaganda, nefret söylemi ve üçüncü kişi haklarını ihlal eden reklamlar yayınlanmaz.'),
  ('contact.span.003', 'ua', 'contact', 'html', 'published', '<strong>Правило реклами:</strong> Приймаються статичні зображення або GIF. GIF перевіряється вручну перед публікацією щодо швидкості, змісту та безпеки бренду. Не публікуються матеріали для дорослих, незаконні послуги, оманливі обіцянки, політична пропаганда, мова ворожнечі або порушення прав третіх осіб.'),
  ('contact.span.004', 'tr', 'contact', 'html', 'published', 'İletişim Bilgileri <span class="contact-requirement">* En az 2 kanal zorunlu</span>'),
  ('contact.span.004', 'ua', 'contact', 'html', 'published', 'Контактні Дані <span class="contact-requirement">* Мінімум 2 канали обов''язково</span>'),
  ('contact.span.005', 'tr', 'contact', 'text', 'published', 'Ülke koduyla yazın (+90, +380)'),
  ('contact.span.005', 'ua', 'contact', 'text', 'published', 'З кодом країни (+90, +380)'),
  ('contact.span.006', 'tr', 'contact', 'text', 'published', 'Ülke koduyla yazın (+90, +380)'),
  ('contact.span.006', 'ua', 'contact', 'text', 'published', 'З кодом країни (+90, +380)'),
  ('contact.span.007', 'tr', 'contact', 'text', 'published', '@ ile başlayan kullanıcı adı'),
  ('contact.span.007', 'ua', 'contact', 'text', 'published', 'Ім''я користувача з @'),
  ('contact.span.008', 'tr', 'contact', 'text', 'published', 'İş e-posta adresiniz'),
  ('contact.span.008', 'ua', 'contact', 'text', 'published', 'Ваша робоча електронна пошта'),
  ('contact.span.009', 'tr', 'contact', 'text', 'published', 'Uyarı: En az 2 iletişim kanalı doldurmanız gerekiyor.'),
  ('contact.span.009', 'ua', 'contact', 'text', 'published', 'Uyarı: Необхідно заповнити мінімум 2 канали зв''язку.'),
  ('contact.span.010', 'tr', 'contact', 'text', 'published', 'Firma Logosu / Görseli (isteğe bağlı)'),
  ('contact.span.010', 'ua', 'contact', 'text', 'published', 'Логотип / Зображення (необов''язково)'),
  ('contact.span.011', 'tr', 'contact', 'text', 'published', 'Tıklayarak görsel veya GIF seçin'),
  ('contact.span.011', 'ua', 'contact', 'text', 'published', 'Натисніть, щоб вибрати зображення або GIF'),
  ('contact.span.012', 'tr', 'contact', 'text', 'published', 'Notlar / Mesaj'),
  ('contact.span.012', 'ua', 'contact', 'text', 'published', 'Нотатки / Повідомлення'),
  ('contact.span.013', 'tr', 'contact', 'text', 'published', 'BAŞVURUYU GÖNDER →'),
  ('contact.span.013', 'ua', 'contact', 'text', 'published', 'НАДІСЛАТИ ЗАЯВКУ →'),
  ('contact.span.014', 'tr', 'contact', 'html', 'published', 'En geç <strong>24 saat</strong> içinde dönüş yapılacaktır.'),
  ('contact.span.014', 'ua', 'contact', 'html', 'published', 'Ми відповімо протягом <strong>24 годин</strong>..'),
  ('contact.span.015', 'tr', 'contact', 'text', 'published', 'Başvurunuz Alındı!'),
  ('contact.span.015', 'ua', 'contact', 'text', 'published', 'Вашу Заявку Отримано!'),
  ('contact.span.016', 'tr', 'contact', 'text', 'published', 'Kısa süre içinde sizinle iletişime geçeceğiz.'),
  ('contact.span.016', 'ua', 'contact', 'text', 'published', 'Ми зв''яжемося з вами найближчим часом.'),
  ('education.feature.heading.title.001', 'tr', 'education', 'text', 'published', 'Ukraynalı Öğrenciler için Türkiye Üniversiteleri'),
  ('education.feature.heading.title.001', 'ua', 'education', 'text', 'published', 'Турецькі університети для українських студентів'),
  ('education.feature.intro.001', 'tr', 'education', 'text', 'published', 'Ukraynalı öğrenciler Türkiye''deki devlet ve vakıf üniversitelerine başvurabilir. Savaş döneminde özel kolaylıklar tanınmıştır.'),
  ('education.feature.intro.001', 'ua', 'education', 'text', 'published', 'Українські студенти можуть подати заявки до державних і приватних університетів Туреччини. У воєнний час запроваджено спеціальні пільги.'),
  ('education.h3.001', 'tr', 'education', 'text', 'published', 'YÖK Denklik İşlemi'),
  ('education.h3.001', 'ua', 'education', 'text', 'published', 'Нострифікація YÖK'),
  ('education.h3.002', 'tr', 'education', 'text', 'published', 'Türk Öğrenciler için Ukrayna Üniversiteleri'),
  ('education.h3.002', 'ua', 'education', 'text', 'published', 'Українські університети для турецьких студентів'),
  ('education.highlight.box.001', 'tr', 'education', 'html', 'published', '<strong>Türkiye Bursları (YTB):</strong> Her yıl yabancı öğrencilere burs verilir. Burs kapsamı: aylık burs + yurt + sağlık sigortası + Türkçe dil kursu. Başvuru: <strong>turkiyeburslari.gov.tr</strong>'),
  ('education.highlight.box.001', 'ua', 'education', 'html', 'published', '<strong>Стипендії Туреччини (YTB):</strong> Щороку іноземні студенти отримують стипендії. Покриття: щомісячна стипендія + гуртожиток + медичне страхування + курс турецької мови. Сайт: <strong>turkiyeburslari.gov.tr</strong>'),
  ('education.highlight.box.002', 'tr', 'education', 'html', 'published', 'Uyarı: <strong>Savaş Nedeniyle Önemli Uyarı:</strong> Ukrayna''daki kurumlarla iletişim kurmanın güç olduğu durumlarda belge temininde gecikmeler yaşanabilir. Sürecinizi hızlandırmak için <strong>YÖK''ü doğrudan Türkiye''den aramanız</strong> önerilir.<br><br>
        
        <strong>YÖK Denklik Birimi:</strong>  <a class="content-link" href="tel:+903122982000">+90 (312) 298 20 00</a><br>
        
        <a class="content-link" href="https://denklik.yok.gov.tr" target="_blank">denklik.yok.gov.tr</a>'),
  ('education.highlight.box.002', 'ua', 'education', 'html', 'published', 'Uyarı: <strong>Важливе попередження через війну:</strong> Через труднощі зв''язку з українськими установами можливі затримки в отриманні документів. Для пришвидшення процесу рекомендується <strong>безпосередньо зв''язатися з YÖK з Туреччини</strong>..<br><br>
        
        <strong>Відділ нострифікації YÖK:</strong>  <a class="content-link" href="tel:+903122982000">+90 (312) 298 20 00</a><br>
        
        <a class="content-link" href="https://denklik.yok.gov.tr" target="_blank">denklik.yok.gov.tr</a>'),
  ('education.highlight.box.003', 'tr', 'education', 'html', 'published', 'Uyarı: <strong>Dikkat:</strong> Savaş nedeniyle bazı şehirlerde eğitim sekteye uğrayabilir. Başvurmadan önce üniversitenin güncel durumunu kontrol edin.'),
  ('education.highlight.box.003', 'ua', 'education', 'html', 'published', 'Uyarı: <strong>Увага:</strong> Через війну навчання в деяких містах може бути порушено. Перевіряйте актуальний стан університету перед подачею заяви.'),
  ('education.p.001', 'tr', 'education', 'text', 'published', 'Ukrayna''da alınan diplomaların Türkiye''de tanınması için YÖK''e denklik başvurusu yapılmalıdır.'),
  ('education.p.001', 'ua', 'education', 'text', 'published', 'Для визнання дипломів, отриманих в Україні в Туреччині, необхідно подати заяву на нострифікацію до YÖK.'),
  ('education.p.002', 'tr', 'education', 'text', 'published', 'Ukrayna''daki üniversiteler Türk öğrencilere düşük maliyetli tıp, mühendislik ve hukuk eğitimi sunmaktadır.'),
  ('education.p.002', 'ua', 'education', 'text', 'published', 'Університети України пропонують турецьким студентам доступну медичну, інженерну та юридичну освіту.'),
  ('education.section.sub.001', 'tr', 'education', 'text', 'published', 'Ukraynalı öğrenciler için Türk üniversitelerine başvuru rehberi ve Türk öğrenciler için Ukrayna üniversiteleri hakkında kapsamlı bilgi.'),
  ('education.section.sub.001', 'ua', 'education', 'text', 'published', 'Посібник для українських студентів щодо вступу до турецьких університетів та інформація для турецьких студентів про українські університети.'),
  ('education.section.title.001', 'tr', 'education', 'html', 'published', 'Türkiye & Ukrayna<br>Üniversite İşlemleri'),
  ('education.section.title.001', 'ua', 'education', 'html', 'published', 'Туреччина та Україна<br>Університетські Процедури'),
  ('education.span.001', 'tr', 'education', 'text', 'published', 'ÜNİVERSİTE REHBERİ'),
  ('education.span.001', 'ua', 'education', 'text', 'published', 'УНІВЕРСИТЕТСЬКИЙ ПУТІВНИК'),
  ('education.span.002', 'tr', 'education', 'text', 'published', 'Diploma + transkript Apostil onaylı olmalı'),
  ('education.span.002', 'ua', 'education', 'text', 'published', 'Диплом + транскрипт мають бути з апостилем'),
  ('education.span.003', 'tr', 'education', 'text', 'published', 'Yeminli tercüman ile Türkçe''ye çevir'),
  ('education.span.003', 'ua', 'education', 'text', 'published', 'Перекладіть турецькою присяжним перекладачем'),
  ('education.span.004', 'tr', 'education', 'text', 'published', 'denklik.yok.gov.tr üzerinden e-başvuru'),
  ('education.span.004', 'ua', 'education', 'text', 'published', 'Електронна заявка через denklik.yok.gov.tr'),
  ('education.span.005', 'tr', 'education', 'text', 'published', 'Tıp/diş/eczacılık için STS sınavı zorunlu'),
  ('education.span.005', 'ua', 'education', 'text', 'published', 'Для медицини/стоматології — іспит STS обов''язковий'),
  ('education.span.006', 'tr', 'education', 'text', 'published', '90 güne kadar vizesiz giriş (çipli kimlik yeterli)'),
  ('education.span.006', 'ua', 'education', 'text', 'published', 'Безвізовий в''їзд до 90 днів (достатньо чіпованого посвідчення)'),
  ('education.span.007', 'tr', 'education', 'text', 'published', 'Üniversiteye kabul mektubunu al'),
  ('education.span.007', 'ua', 'education', 'text', 'published', 'Отримай лист про зарахування від університету'),
  ('education.span.008', 'tr', 'education', 'text', 'published', '90 gün sonrası için D tipi öğrenci vizesi başvur'),
  ('education.span.008', 'ua', 'education', 'text', 'published', 'Для перебування понад 90 днів — подайся на студентську візу типу D'),
  ('education.span.009', 'tr', 'education', 'text', 'published', 'Türkiye''ye döndükten sonra YÖK denklik başvurusu yap'),
  ('education.span.009', 'ua', 'education', 'text', 'published', 'Після повернення до Туреччини — заявка на нострифікацію YÖK'),
  ('education.step.list.001', 'tr', 'education', 'html', 'published', '<li><span class="step-num">1</span>YÖK Atlas veya üniversite web sitesinden program seç</li>
          
          <li><span class="step-num">2</span>Lise/üniversite transkriptini Türkçe''ye tercüme ettir ve noter onaylat</li>
          
          <li><span class="step-num">3</span>YÖS sınavına gir (devlet üniv.) veya üniversite sınavına başvur</li>
          
          <li><span class="step-num">4</span>Kabul mektubu al, öğrenci vizesi başvurusu yap</li>
          
          <li><span class="step-num">5</span>Türkiye''ye geldikten sonra İkamet İzni başvurusu yap</li>'),
  ('education.step.list.001', 'ua', 'education', 'html', 'published', '<li><span class="step-num">1</span>Обери програму через YÖK Atlas або сайт університету</li>
          
          <li><span class="step-num">2</span>Перекладіть та нотаріально завірте шкільний/університетський транскрипт турецькою</li>
          
          <li><span class="step-num">3</span>Складіть іспит YÖS (держ. ун-т) або вступний іспит університету</li>
          
          <li><span class="step-num">4</span>Отримай лист про зарахування, подайся на студентську візу</li>
          
          <li><span class="step-num">5</span>Після приїзду до Туреччини — заявка на посвідку на проживання</li>'),
  ('education.tag.001', 'tr', 'education', 'text', 'published', 'Burs İmkânı'),
  ('education.tag.001', 'ua', 'education', 'text', 'published', 'Стипендія'),
  ('education.tag.002', 'tr', 'education', 'text', 'published', 'YÖS Sınavı'),
  ('education.tag.002', 'ua', 'education', 'text', 'published', 'Іспит YÖS'),
  ('education.tag.003', 'tr', 'education', 'text', 'published', 'Apostil Şart'),
  ('education.tag.003', 'ua', 'education', 'text', 'published', 'Потрібен Апостиль'),
  ('education.tag.004', 'tr', 'education', 'text', 'published', '3–6 Ay Süreç'),
  ('education.tag.004', 'ua', 'education', 'text', 'published', '3–6 Місяців'),
  ('education.tag.005', 'tr', 'education', 'text', 'published', 'Online Başvuru'),
  ('education.tag.005', 'ua', 'education', 'text', 'published', 'Онлайн Заявка'),
  ('footer.legal', 'tr', 'footer', 'text', 'published', 'Yasal not: TürkUA üzerindeki haber, olasılık, vize, eğitim, para transferi ve ticaret içerikleri genel bilgilendirme niteliğindedir; resmi kurum, hukuk, finans, seyahat veya yatırım tavsiyesi değildir. Otomatik haber akışında reklam, marka tanıtımı ve uzun alıntı filtreleri uygulanır. Reklam başvuruları yayın öncesi manuel incelenir; yanıltıcı, yasa dışı veya üçüncü kişi haklarını ihlal eden içerikler kabul edilmez. Üçüncü taraf bağlantılar, başvurular ve nihai kararlar kullanıcının sorumluluğundadır.'),
  ('footer.legal', 'ua', 'footer', 'text', 'published', 'Юридична примітка: новини, прогнози, візова, освітня, фінансова та торговельна інформація на TürkUA мають загальний інформаційний характер і не є офіційною, юридичною, фінансовою, туристичною чи інвестиційною порадою. Для автоматичних новин застосовуються фільтри реклами, брендових згадок і довгих цитат. Рекламні заявки перевіряються вручну перед публікацією; оманливі, незаконні матеріали або матеріали, що порушують права третіх осіб, не приймаються. Відповідальність за сторонні посилання, заявки та остаточні рішення несе користувач.'),
  ('footer.p.001', 'tr', 'footer', 'text', 'published', 'Savaş olasılık tahminleri her 6 saatte güncellenir  ·  Bu site bilgi amaçlıdır, resmi tavsiye değildir'),
  ('footer.p.001', 'ua', 'footer', 'text', 'published', 'Прогнози імовірності оновлюються кожні 6 годин  ·  Цей сайт є інформаційним, а не офіційною порадою'),
  ('footer.span.001', 'tr', 'footer', 'text', 'published', 'Türkiye & Ukrayna Bilgi Merkezi'),
  ('footer.span.001', 'ua', 'footer', 'text', 'published', 'Інформаційний центр Туреччина & Україна'),
  ('gundem.category.diplomatic', 'tr', 'gundem', 'text', 'published', 'DİPLOMASİ'),
  ('gundem.category.diplomatic', 'ua', 'gundem', 'text', 'published', 'ДИПЛОМАТІЯ'),
  ('gundem.category.economic', 'tr', 'gundem', 'text', 'published', 'EKONOMİ'),
  ('gundem.category.economic', 'ua', 'gundem', 'text', 'published', 'ЕКОНОМІКА'),
  ('gundem.category.general', 'tr', 'gundem', 'text', 'published', 'GÜNDEM'),
  ('gundem.category.general', 'ua', 'gundem', 'text', 'published', 'НОВИНИ'),
  ('gundem.category.humanitarian', 'tr', 'gundem', 'text', 'published', 'İNSANİ'),
  ('gundem.category.humanitarian', 'ua', 'gundem', 'text', 'published', 'ГУМАНІТАРНЕ'),
  ('gundem.category.military', 'tr', 'gundem', 'text', 'published', 'ASKERİ'),
  ('gundem.category.military', 'ua', 'gundem', 'text', 'published', 'ВІЙСЬКОВЕ'),
  ('gundem.category.parliamentary', 'tr', 'gundem', 'text', 'published', 'MECLİS'),
  ('gundem.category.parliamentary', 'ua', 'gundem', 'text', 'published', 'ПАРЛАМЕНТ'),
  ('gundem.loadError', 'tr', 'gundem', 'text', 'published', 'Haberler yüklenemedi — lütfen daha sonra deneyin.'),
  ('gundem.loadError', 'ua', 'gundem', 'text', 'published', 'Новини не завантажились — спробуйте пізніше.'),
  ('gundem.section.sub.001', 'tr', 'gundem', 'text', 'published', 'Ukrinform RSS akışından derlenen haber başlıkları. Reklam, marka tanıtımı ve uzun alıntı filtreleri uygulanır; 6 saatte bir otomatik güncellenir.'),
  ('gundem.section.sub.001', 'ua', 'gundem', 'text', 'published', 'Заголовки з RSS-стрічки Ukrinform. Застосовуються фільтри реклами, брендових згадок і довгих цитат; оновлення кожні 6 годин.'),
  ('gundem.section.title.001', 'tr', 'gundem', 'text', 'published', 'Ukrayna Gündemi'),
  ('gundem.section.title.001', 'ua', 'gundem', 'text', 'published', 'Актуальні Новини України'),
  ('gundem.span.001', 'tr', 'gundem', 'text', 'published', 'CANLI GÜNDEM'),
  ('gundem.span.001', 'ua', 'gundem', 'text', 'published', 'АКТУАЛЬНІ НОВИНИ'),
  ('gundem.span.002', 'tr', 'gundem', 'text', 'published', 'CANLI'),
  ('gundem.span.002', 'ua', 'gundem', 'text', 'published', 'НАЖИВО'),
  ('gundem.span.003', 'tr', 'gundem', 'text', 'published', '↻ GÜNCELLE'),
  ('gundem.span.003', 'ua', 'gundem', 'text', 'published', '↻ ОНОВИТИ'),
  ('gundem.updated.prefix', 'tr', 'gundem', 'text', 'published', 'güncellendi: '),
  ('gundem.updated.prefix', 'ua', 'gundem', 'text', 'published', 'оновлено: '),
  ('header.a.001', 'tr', 'header', 'text', 'published', 'Savaş Takip'),
  ('header.a.001', 'ua', 'header', 'text', 'published', 'Відстеження'),
  ('header.a.002', 'tr', 'header', 'text', 'published', 'Gündem'),
  ('header.a.002', 'ua', 'header', 'text', 'published', 'Новини'),
  ('header.a.003', 'tr', 'header', 'text', 'published', 'Üniversite'),
  ('header.a.003', 'ua', 'header', 'text', 'published', 'Університет'),
  ('header.a.004', 'tr', 'header', 'text', 'published', 'Vize'),
  ('header.a.004', 'ua', 'header', 'text', 'published', 'Віза'),
  ('header.a.005', 'tr', 'header', 'text', 'published', 'Ticaret'),
  ('header.a.005', 'ua', 'header', 'text', 'published', 'Торгівля'),
  ('header.a.006', 'tr', 'header', 'text', 'published', 'Para Transferi'),
  ('header.a.006', 'ua', 'header', 'text', 'published', 'Переказ Грошей'),
  ('header.a.007', 'tr', 'header', 'text', 'published', 'TURKUA Drop'),
  ('header.a.007', 'ua', 'header', 'text', 'published', 'TURKUA Drop'),
  ('header.nav.promo.text.001', 'tr', 'header', 'text', 'published', 'Reklam İş Birliği'),
  ('header.nav.promo.text.001', 'ua', 'header', 'text', 'published', 'Реклама'),
  ('header.span.001', 'tr', 'header', 'text', 'published', 'GÜNDEM'),
  ('header.span.001', 'ua', 'header', 'text', 'published', 'НОВИНИ'),
  ('header.span.002', 'tr', 'header', 'text', 'published', 'Ukrayna haberleri yükleniyor…'),
  ('header.span.002', 'ua', 'header', 'text', 'published', 'Завантаження новин України…'),
  ('header.span.003', 'tr', 'header', 'text', 'published', 'Reklam Al'),
  ('header.span.003', 'ua', 'header', 'text', 'published', 'Замовити Рекламу'),
  ('header.trust.consent.btn.001', 'tr', 'header', 'text', 'published', 'Reddet ve devam et'),
  ('header.trust.consent.btn.001', 'ua', 'header', 'text', 'published', 'Відхилити й продовжити'),
  ('header.trust.consent.btn.002', 'tr', 'header', 'text', 'published', 'Kabul et'),
  ('header.trust.consent.btn.002', 'ua', 'header', 'text', 'published', 'Прийняти'),
  ('header.trust.consent.text.001', 'tr', 'header', 'text', 'published', 'Site temel çalışması için gerekli yerel kayıtları kullanır. Reklam/analitik amaçlı takip çerezi çalıştırmıyoruz. Kabul etmeseniz de siteye girebilir ve tüm içerikleri görüntüleyebilirsiniz. İçerikler genel bilgilendirmedir; resmi, hukuki, finansal veya seyahat tavsiyesi değildir.'),
  ('header.trust.consent.text.001', 'ua', 'header', 'text', 'published', 'Сайт використовує лише необхідні локальні записи для роботи. Рекламні або аналітичні tracking-cookie не запускаються. Навіть якщо ви не погодитесь, ви можете користуватись сайтом і переглядати весь контент. Матеріали мають загальний інформаційний характер.'),
  ('header.trust.consent.title.001', 'tr', 'header', 'text', 'published', 'Çerez ve bilgilendirme tercihi'),
  ('header.trust.consent.title.001', 'ua', 'header', 'text', 'published', 'Cookie та інформаційне повідомлення'),
  ('hero.label', 'tr', 'hero', 'text', 'published', 'CANLI TAKİP SİSTEMİ - HER 6 SAATTE GÜNCELLENİR'),
  ('hero.label', 'ua', 'hero', 'text', 'published', 'СИСТЕМА ВІДСТЕЖЕННЯ В РЕАЛЬНОМУ ЧАСІ - ОНОВЛЕННЯ КОЖНІ 6 ГОДИН'),
  ('hero.sub', 'tr', 'hero', 'text', 'published', 'YARIN • 1 AY • 1 YIL — CANLI TAHMİN'),
  ('hero.sub', 'ua', 'hero', 'text', 'published', 'ЗАВТРА • 1 МІСЯЦЬ • 1 РІК — ЖИВИЙ ПРОГНОЗ'),
  ('hero.title', 'tr', 'hero', 'html', 'published', 'RUSYA–UKRAYNA SAVAŞI<br>ATEŞKES &amp; BİTİŞ OLASILIĞI'),
  ('hero.title', 'ua', 'hero', 'html', 'published', 'ВІЙНА УКРАЇНА–РОСІЯ<br>ЙМОВІРНІСТЬ ЗАВЕРШЕННЯ'),
  ('legal.h3.001', 'tr', 'legal', 'text', 'published', 'Kullanım Şartları'),
  ('legal.h3.001', 'ua', 'legal', 'text', 'published', 'Умови Користування'),
  ('legal.h3.002', 'tr', 'legal', 'text', 'published', 'Gizlilik ve Çerez'),
  ('legal.h3.002', 'ua', 'legal', 'text', 'published', 'Конфіденційність та Cookie'),
  ('legal.h3.003', 'tr', 'legal', 'text', 'published', 'Reklam Politikası'),
  ('legal.h3.003', 'ua', 'legal', 'text', 'published', 'Рекламна Політика'),
  ('legal.section.sub.001', 'tr', 'legal', 'text', 'published', 'Bu alan, ziyaretçiye site kurallarını sade şekilde açıklar. Ayrıntılı sözleşmeler ödeme ve üyelik aşamasında ayrıca genişletilebilir.'),
  ('legal.section.sub.001', 'ua', 'legal', 'text', 'published', 'Цей блок коротко пояснює правила сайту. Детальні умови можна розширити на етапі оплати та реєстрації.'),
  ('legal.section.title.001', 'tr', 'legal', 'text', 'published', 'Kullanım, Gizlilik ve Reklam İlkeleri'),
  ('legal.section.title.001', 'ua', 'legal', 'text', 'published', 'Умови, Конфіденційність та Реклама'),
  ('legal.span.001', 'tr', 'legal', 'text', 'published', 'HUKUKİ BİLGİLENDİRME'),
  ('legal.span.001', 'ua', 'legal', 'text', 'published', 'ЮРИДИЧНА ІНФОРМАЦІЯ'),
  ('legal.ul.001', 'tr', 'legal', 'html', 'published', '<li>Site bilgi, haber özeti, reklam başvurusu ve ön sipariş amacıyla kullanılır.</li>
        
        <li>İçerikler resmi tavsiye değildir; nihai karar kullanıcıya aittir.</li>
        
        <li>Yanıltıcı, yasa dışı veya hak ihlali içeren talep ve reklamlar reddedilebilir.</li>'),
  ('legal.ul.001', 'ua', 'legal', 'html', 'published', '<li>Сайт використовується для інформації, новин, рекламних заявок і попередніх замовлень.</li>
        
        <li>Матеріали не є офіційною порадою; остаточне рішення приймає користувач.</li>
        
        <li>Оманливі, незаконні або правопорушні заявки можуть бути відхилені.</li>'),
  ('legal.ul.002', 'tr', 'legal', 'html', 'published', '<li>Temel site tercihleri tarayıcıda yerel olarak saklanabilir.</li>
        
        <li>Reklam/analitik takip çerezi şu an çalıştırılmamaktadır.</li>
        
        <li>Formlarla iletilen bilgiler yalnızca başvuruyu yanıtlamak için kullanılır.</li>'),
  ('legal.ul.002', 'ua', 'legal', 'html', 'published', '<li>Основні налаштування можуть зберігатися локально у браузері.</li>
        
        <li>Рекламні або аналітичні tracking-cookie зараз не використовуються.</li>
        
        <li>Дані з форм використовуються лише для відповіді на заявку.</li>'),
  ('legal.ul.003', 'tr', 'legal', 'html', 'published', '<li>Statik görsel ve GIF reklam başvuruları manuel incelenir.</li>
        
        <li>Yetişkin, yasa dışı, nefret, propaganda veya yanıltıcı içerik yayınlanmaz.</li>
        
        <li>Reklam yayın kararı ve süreleri TürkUA tarafından ayrıca onaylanır.</li>'),
  ('legal.ul.003', 'ua', 'legal', 'html', 'published', '<li>Статичні та GIF-реклами перевіряються вручну.</li>
        
        <li>Не публікуються матеріали для дорослих, незаконний, ворожий, пропагандистський або оманливий контент.</li>
        
        <li>Рішення та строки розміщення реклами окремо підтверджуються TürkUA.</li>'),
  ('mobile.nav.span.001', 'tr', 'mobile.nav', 'text', 'published', 'Savaş'),
  ('mobile.nav.span.001', 'ua', 'mobile.nav', 'text', 'published', 'Війна'),
  ('mobile.nav.span.002', 'tr', 'mobile.nav', 'text', 'published', 'Gündem'),
  ('mobile.nav.span.002', 'ua', 'mobile.nav', 'text', 'published', 'Новини'),
  ('mobile.nav.span.003', 'tr', 'mobile.nav', 'text', 'published', 'Vize'),
  ('mobile.nav.span.003', 'ua', 'mobile.nav', 'text', 'published', 'Віза'),
  ('mobile.nav.span.004', 'tr', 'mobile.nav', 'text', 'published', 'Drop'),
  ('mobile.nav.span.004', 'ua', 'mobile.nav', 'text', 'published', 'Drop'),
  ('money.li.001', 'tr', 'money', 'text', 'published', 'Ukrayna''ya getirilen dövizi döviz bürosunda (обмінник) bozdurun — banka kuru daha düşük olabilir'),
  ('money.li.001', 'ua', 'money', 'text', 'published', 'Обмінюйте іноземну валюту в обмінниках, а не в банках — курс може бути вигіднішим'),
  ('money.li.002', 'tr', 'money', 'text', 'published', 'Rubl kabul edilmez — Ukrayna''da Rus rublesi işlem görmez'),
  ('money.li.002', 'ua', 'money', 'text', 'published', 'Рублі не приймаються — російський рубль не є платіжним засобом в Україні'),
  ('money.li.003', 'tr', 'money', 'text', 'published', 'Transfer belgelerini saklayın — gümrükte veya hesap açılışında istenebilir'),
  ('money.li.003', 'ua', 'money', 'text', 'published', 'Зберігайте документи про перекази — можуть знадобитися на митниці або при відкритті рахунку'),
  ('money.li.004', 'tr', 'money', 'text', 'published', 'Bu bilgiler genel rehber niteliğindedir — güncel limitler için NBU ve resmi banka kanallarını takip edin'),
  ('money.li.004', 'ua', 'money', 'text', 'published', 'Ця інформація є загальним посібником — для актуальних лімітів слідкуйте за НБУ та офіційними банківськими каналами'),
  ('money.money.card.sub.001', 'tr', 'money', 'text', 'published', 'Gümrük sınırı & beyan zorunluluğu'),
  ('money.money.card.sub.001', 'ua', 'money', 'text', 'published', 'Митний ліміт та вимоги декларування'),
  ('money.money.card.sub.002', 'tr', 'money', 'text', 'published', 'Banka & dijital yöntemler'),
  ('money.money.card.sub.002', 'ua', 'money', 'text', 'published', 'Банківські та цифрові методи'),
  ('money.money.card.sub.003', 'tr', 'money', 'text', 'published', 'Savaş dönemi kısıtlamaları dahil'),
  ('money.money.card.sub.003', 'ua', 'money', 'text', 'published', 'Включно з обмеженнями воєнного часу'),
  ('money.money.card.title.001', 'tr', 'money', 'text', 'published', 'Ukrayna''ya Nakit Götürme'),
  ('money.money.card.title.001', 'ua', 'money', 'text', 'published', 'Ввезення Готівки до України'),
  ('money.money.card.title.002', 'tr', 'money', 'text', 'published', 'Türkiye → Ukrayna Transfer'),
  ('money.money.card.title.002', 'ua', 'money', 'text', 'published', 'Туреччина → Україна Переказ'),
  ('money.money.card.title.003', 'tr', 'money', 'text', 'published', 'Ukrayna → Türkiye Transfer'),
  ('money.money.card.title.003', 'ua', 'money', 'text', 'published', 'Україна → Туреччина Переказ'),
  ('money.money.limit.label.001', 'tr', 'money', 'text', 'published', 'Eşdeğerine kadar beyan zorunluluğu yok. Bu tutarın üzerinde gümrükte yazılı beyan şart.'),
  ('money.money.limit.label.001', 'ua', 'money', 'text', 'published', 'До еквіваленту декларування не потрібно. Понад цю суму — письмова декларація на митниці обов''язкова.'),
  ('money.money.method.detail.001', 'tr', 'money', 'text', 'published', '10.000 €''ya kadar serbest'),
  ('money.money.method.detail.001', 'ua', 'money', 'text', 'published', 'До 10.000 € вільно'),
  ('money.money.method.detail.002', 'tr', 'money', 'text', 'published', 'Ukrayna''da kabul sınırlı, dövize çevir'),
  ('money.money.method.detail.002', 'ua', 'money', 'text', 'published', 'В Україні обмежено приймається, конвертуй у валюту'),
  ('money.money.method.detail.003', 'tr', 'money', 'text', 'published', 'Gümrük CD formu zorunlu'),
  ('money.money.method.detail.003', 'ua', 'money', 'text', 'published', 'Обов''язкова форма митної декларації'),
  ('money.money.method.detail.004', 'tr', 'money', 'text', 'published', 'Türkiye''den nakit gönder, Ukrayna''da nakit al'),
  ('money.money.method.detail.004', 'ua', 'money', 'text', 'published', 'Надсилай готівку з Туреччини, отримуй готівку в Україні'),
  ('money.money.method.detail.005', 'tr', 'money', 'text', 'published', 'Düşük komisyon, UAH hesabına aktarım'),
  ('money.money.method.detail.005', 'ua', 'money', 'text', 'published', 'Низька комісія, переказ на рахунок у гривнях'),
  ('money.money.method.detail.006', 'tr', 'money', 'text', 'published', 'Türk banka → Ukrayna bankası (2-5 iş günü)'),
  ('money.money.method.detail.006', 'ua', 'money', 'text', 'published', 'Турецький банк → Український банк (2-5 робочих днів)'),
  ('money.money.method.detail.007', 'tr', 'money', 'text', 'published', 'PTT şubeleri üzerinden gönderi'),
  ('money.money.method.detail.007', 'ua', 'money', 'text', 'published', 'Переказ через відділення PTT'),
  ('money.money.method.detail.008', 'tr', 'money', 'text', 'published', 'Visa/MC çekimlerde ~%3-4 komisyon'),
  ('money.money.method.detail.008', 'ua', 'money', 'text', 'published', 'Зняття Visa/MC ~3-4% комісія'),
  ('money.money.method.detail.009', 'tr', 'money', 'text', 'published', 'Ukrayna''dan uluslararası Visa kart gönderimi'),
  ('money.money.method.detail.009', 'ua', 'money', 'text', 'published', 'Міжнародний переказ карткою Visa з України'),
  ('money.money.method.detail.010', 'tr', 'money', 'text', 'published', 'Ukrayna şubelerinden Türkiye''ye nakit gönderim'),
  ('money.money.method.detail.010', 'ua', 'money', 'text', 'published', 'З відділень в Україні готівкою до Туреччини'),
  ('money.money.method.detail.011', 'tr', 'money', 'text', 'published', 'Belirli tutarlar için NBU onayı gerekebilir'),
  ('money.money.method.detail.011', 'ua', 'money', 'text', 'published', 'Для певних сум може знадобитися дозвіл НБУ'),
  ('money.money.method.detail.012', 'tr', 'money', 'text', 'published', 'Ukrayna Visa kartı Türkiye''de çalışır (~%2-3 komisyon)'),
  ('money.money.method.detail.012', 'ua', 'money', 'text', 'published', 'Картка Visa України працює в Туреччині (~2-3% комісія)'),
  ('money.money.method.name.001', 'tr', 'money', 'text', 'published', 'USD / EUR nakit'),
  ('money.money.method.name.001', 'ua', 'money', 'text', 'published', 'Готівка USD / EUR'),
  ('money.money.method.name.002', 'tr', 'money', 'text', 'published', 'Türk Lirası'),
  ('money.money.method.name.002', 'ua', 'money', 'text', 'published', 'Турецька Ліра'),
  ('money.money.method.name.003', 'tr', 'money', 'text', 'published', '10.000 € üzeri'),
  ('money.money.method.name.003', 'ua', 'money', 'text', 'published', 'Понад 10.000 €'),
  ('money.money.method.name.004', 'tr', 'money', 'text', 'published', 'Uluslararası Para Transferi (Nakit)'),
  ('money.money.method.name.004', 'ua', 'money', 'text', 'published', 'Міжнародний переказ (готівка)'),
  ('money.money.method.name.005', 'tr', 'money', 'text', 'published', 'Dijital Transfer Servisi'),
  ('money.money.method.name.005', 'ua', 'money', 'text', 'published', 'Цифровий сервіс переказу'),
  ('money.money.method.name.006', 'tr', 'money', 'text', 'published', 'SWIFT Banka Havalesi'),
  ('money.money.method.name.006', 'ua', 'money', 'text', 'published', 'SWIFT-переказ'),
  ('money.money.method.name.007', 'tr', 'money', 'text', 'published', 'PTT Para Gönderme'),
  ('money.money.method.name.007', 'ua', 'money', 'text', 'published', 'Відправка через відділення PTT'),
  ('money.money.method.name.008', 'tr', 'money', 'text', 'published', 'Türk banka kartı (Ukrayna ATM)'),
  ('money.money.method.name.008', 'ua', 'money', 'text', 'published', 'Турецька картка (банкомат в Україні)'),
  ('money.money.method.name.009', 'tr', 'money', 'text', 'published', 'Ukrayna bankası kartı (Visa)'),
  ('money.money.method.name.009', 'ua', 'money', 'text', 'published', 'Картка українського банку (Visa)'),
  ('money.money.method.name.010', 'tr', 'money', 'text', 'published', 'Uluslararası para transferi'),
  ('money.money.method.name.010', 'ua', 'money', 'text', 'published', 'Міжнародний грошовий переказ'),
  ('money.money.method.name.011', 'tr', 'money', 'text', 'published', 'SWIFT (NBU izinli)'),
  ('money.money.method.name.011', 'ua', 'money', 'text', 'published', 'SWIFT (за дозволом НБУ)'),
  ('money.money.method.name.012', 'tr', 'money', 'text', 'published', 'Ukrayna kartıyla Türkiye ATM'),
  ('money.money.method.name.012', 'ua', 'money', 'text', 'published', 'Карта України в банкоматі Туреччини'),
  ('money.section.sub.001', 'tr', 'money', 'text', 'published', 'Türkiye ↔ Ukrayna arasında para taşıma sınırları, banka transferi seçenekleri ve pratik tavsiyeler.'),
  ('money.section.sub.001', 'ua', 'money', 'text', 'published', 'Ліміти перевезення грошей між Туреччиною та Україною, варіанти банківських переказів і практичні поради.'),
  ('money.section.title.001', 'tr', 'money', 'text', 'published', 'Para Transferi & Nakit Kuralları'),
  ('money.section.title.001', 'ua', 'money', 'text', 'published', 'Грошові Перекази та Готівкові Правила'),
  ('money.span.001', 'tr', 'money', 'text', 'published', 'FİNANSAL REHBER'),
  ('money.span.001', 'ua', 'money', 'text', 'published', 'ФІНАНСОВИЙ ПУТІВНИК'),
  ('money.span.002', 'tr', 'money', 'text', 'published', 'Savaş dönemi kısıtlaması: Ukrayna gümrüğü yabancı döviz çıkışını sıkı denetlemektedir. Giriş serbest ancak çıkışta bankadan alınan dekont veya döviz bozdurma belgesi istenebilir.'),
  ('money.span.002', 'ua', 'money', 'text', 'published', 'Обмеження воєнного часу: митниця України суворо контролює вивезення іноземної валюти. Ввезення вільне, але при виїзді можуть вимагати банківські виписки або документи про обмін валюти.'),
  ('money.span.003', 'tr', 'money', 'text', 'published', 'DİKKAT'),
  ('money.span.003', 'ua', 'money', 'text', 'published', 'УВАГА'),
  ('money.span.004', 'tr', 'money', 'text', 'published', 'BEYAN'),
  ('money.span.004', 'ua', 'money', 'text', 'published', 'ДЕКЛАРАЦІЯ'),
  ('money.span.005', 'tr', 'money', 'text', 'published', 'Tavsiye: Büyük miktarı nakit taşımak yerine banka kartı (Visa/Mastercard) ya da uluslararası transfer hizmeti kullanmak hem daha güvenli hem de gümrük sorunu yaratmaz.'),
  ('money.span.005', 'ua', 'money', 'text', 'published', 'Порада: Замість перевезення великих сум готівки краще використовувати банківську карту (Visa/Mastercard) або міжнародний сервіс переказів — це безпечніше і не створює митних проблем.'),
  ('money.span.006', 'tr', 'money', 'text', 'published', 'HIZLI'),
  ('money.span.006', 'ua', 'money', 'text', 'published', 'ШВИДКО'),
  ('money.span.007', 'tr', 'money', 'text', 'published', 'DÜŞÜK MALİYET'),
  ('money.span.007', 'ua', 'money', 'text', 'published', 'НИЗЬКА ВАРТІСТЬ'),
  ('money.span.008', 'tr', 'money', 'text', 'published', 'KOMİSYON'),
  ('money.span.008', 'ua', 'money', 'text', 'published', 'КОМІСІЯ'),
  ('money.span.009', 'tr', 'money', 'text', 'published', 'Canlı Döviz Kuru'),
  ('money.span.009', 'ua', 'money', 'text', 'published', 'Курс Валют Онлайн'),
  ('money.span.010', 'tr', 'money', 'text', 'published', 'Savaş dönemi: Ukrayna Merkez Bankası (NBU) yurt dışına döviz transferini kısıtlamıştır. Bireysel transferlerde limit uygulanmakta olup güncel NBU duyurularını takip edin.'),
  ('money.span.010', 'ua', 'money', 'text', 'published', 'Воєнний час: НБУ обмежив переказ іноземної валюти за кордон. На індивідуальні перекази діють ліміти — слідкуйте за актуальними оголошеннями НБУ.'),
  ('money.span.011', 'tr', 'money', 'text', 'published', 'LİMİTLİ'),
  ('money.span.011', 'ua', 'money', 'text', 'published', 'ОБМЕЖЕНО'),
  ('money.span.012', 'tr', 'money', 'text', 'published', 'MEVCUT'),
  ('money.span.012', 'ua', 'money', 'text', 'published', 'ДОСТУПНО'),
  ('money.span.013', 'tr', 'money', 'text', 'published', 'ONAY GEREKLİ'),
  ('money.span.013', 'ua', 'money', 'text', 'published', 'ПОТРІБЕН ДОЗВІЛ'),
  ('money.span.014', 'tr', 'money', 'text', 'published', 'ÇALIŞIYOR'),
  ('money.span.014', 'ua', 'money', 'text', 'published', 'ПРАЦЮЄ'),
  ('money.span.015', 'tr', 'money', 'html', 'published', 'Tavsiye: NBU''nun güncel transfer limitlerini öğrenmek için <strong class="content-link">bank.gov.ua</strong> adresini veya bankanızın müşteri hizmetlerini arayın. Limitler sık değişiyor.'),
  ('money.span.015', 'ua', 'money', 'html', 'published', 'Порада: Для отримання актуальних лімітів переказів НБУ відвідайте <strong class="content-link">bank.gov.ua</strong> або зверніться до служби підтримки вашого банку. Ліміти часто змінюються.'),
  ('money.strong.001', 'tr', 'money', 'text', 'published', 'Önemli Hatırlatmalar'),
  ('money.strong.001', 'ua', 'money', 'text', 'published', 'Важливі Нагадування'),
  ('news.section.sub.001', 'tr', 'news', 'text', 'published', 'Cephe hattı, müzakereler ve insani duruma ilişkin en güncel gelişmeler. Her 6 saatte bir güncellenir.'),
  ('news.section.sub.001', 'ua', 'news', 'text', 'published', 'Найсвіжіші новини про лінію фронту, переговори та гуманітарну ситуацію. Оновлення кожні 6 годин.'),
  ('news.section.title.001', 'tr', 'news', 'text', 'published', 'Son Savaş Gelişmeleri'),
  ('news.section.title.001', 'ua', 'news', 'text', 'published', 'Останні Воєнні Новини'),
  ('news.source.policy.text.001', 'tr', 'news', 'text', 'published', 'Tüm haberler yalnızca resmi açıklamalar ve uluslararası haber ajanslarından derlenmektedir. Askeri konum veya operasyonel bilgi içermez.'),
  ('news.source.policy.text.001', 'ua', 'news', 'text', 'published', 'Усі новини взяті лише з офіційних заяв та міжнародних агентств. Не містить військових позицій або оперативних даних.'),
  ('news.span.001', 'tr', 'news', 'text', 'published', 'CEPHE & DİPLOMASİ'),
  ('news.span.001', 'ua', 'news', 'text', 'published', 'ФРОНТ І ДИПЛОМАТІЯ'),
  ('news.span.002', 'tr', 'news', 'text', 'published', 'Tümü'),
  ('news.span.002', 'ua', 'news', 'text', 'published', 'Всі'),
  ('news.span.003', 'tr', 'news', 'text', 'published', 'Askeri'),
  ('news.span.003', 'ua', 'news', 'text', 'published', 'Військове'),
  ('news.span.004', 'tr', 'news', 'text', 'published', 'Diplomatik'),
  ('news.span.004', 'ua', 'news', 'text', 'published', 'Дипломатія'),
  ('news.span.005', 'tr', 'news', 'text', 'published', 'Ekonomik'),
  ('news.span.005', 'ua', 'news', 'text', 'published', 'Економіка'),
  ('news.span.006', 'tr', 'news', 'text', 'published', 'İnsani'),
  ('news.span.006', 'ua', 'news', 'text', 'published', 'Гуманітарне'),
  ('shop.cart.note.001', 'tr', 'shop', 'text', 'published', 'Sepete eklenen ürünler gerçek ödeme almaz. Talep gönderildiğinde sana e-posta hazırlanır ve stok bu cihazda düşer.'),
  ('shop.cart.note.001', 'ua', 'shop', 'text', 'published', 'Додавання в кошик не приймає оплату. Після відправки заявки формується e-mail, а запас зменшується на цьому пристрої.'),
  ('shop.h3.001', 'tr', 'shop', 'text', 'published', 'Drop Talebi'),
  ('shop.h3.001', 'ua', 'shop', 'text', 'published', 'Заявка Drop'),
  ('shop.kicker', 'tr', 'shop', 'text', 'published', 'Eski Türk tamgasından ilham alan ilk seri'),
  ('shop.kicker', 'ua', 'shop', 'text', 'published', 'Перша серія, натхненна давньою тюркською тамгою'),
  ('shop.shop.btn.001', 'tr', 'shop', 'text', 'published', 'Talep Gönder'),
  ('shop.shop.btn.001', 'ua', 'shop', 'text', 'published', 'Надіслати Заявку'),
  ('shop.shop.chip.001', 'tr', 'shop', 'text', 'published', 'Başlangıç stoku: 10 adet'),
  ('shop.shop.chip.001', 'ua', 'shop', 'text', 'published', 'Початковий запас: 10 шт.'),
  ('shop.shop.chip.002', 'tr', 'shop', 'text', 'published', 'Ödeme: onay sonrası'),
  ('shop.shop.chip.002', 'ua', 'shop', 'text', 'published', 'Оплата: після підтвердження'),
  ('shop.shop.chip.003', 'tr', 'shop', 'text', 'published', 'Satış manuel onaylı'),
  ('shop.shop.chip.003', 'ua', 'shop', 'text', 'published', 'Продаж після ручного схвалення'),
  ('shop.span.001', 'tr', 'shop', 'text', 'published', 'TURKUA Drop şu anda talep toplama aşamasındadır. Form göndermek ödeme veya kesin satış oluşturmaz; ürün, beden, stok, teslimat ve fiyat TURKUA tarafından ayrıca onaylandıktan sonra satış süreci başlar. İade, teslimat ve mesafeli satış koşulları ödeme entegrasyonu açılmadan önce ayrıca yayınlanacaktır.'),
  ('shop.span.001', 'ua', 'shop', 'text', 'published', 'TURKUA Drop зараз працює на етапі збору заявок. Надсилання форми не є оплатою або остаточним продажем; товар, розмір, запас, доставка і ціна окремо підтверджуються TURKUA. Умови повернення, доставки та дистанційного продажу будуть опубліковані перед запуском оплати.'),
  ('shop.span.002', 'tr', 'shop', 'text', 'published', 'Tahmini toplam'),
  ('shop.span.002', 'ua', 'shop', 'text', 'published', 'Орієнтовно'),
  ('shop.sub', 'tr', 'shop', 'text', 'published', 'Tişörtle başlayan sınırlı üretim çizgisi. Ardından saat, hediyelik obje ve gözlük gibi ürünlerle büyüyecek. Şimdilik talep alınıyor; stok, beden ve teslimat senin onayından sonra kesinleşir.'),
  ('shop.sub', 'ua', 'shop', 'text', 'published', 'Лімітована лінія стартує з футболки. Далі з''являться годинники, сувеніри та окуляри. Наразі приймаються заявки; запас, розмір і доставка підтверджуються після вашого схвалення.'),
  ('shop.title', 'tr', 'shop', 'html', 'published', 'TURKUA <span>TAMGA</span>'),
  ('shop.title', 'ua', 'shop', 'html', 'published', 'TURKUA <span>TAMGA</span>'),
  ('ads.sub', 'tr', 'sponsored', 'text', 'published', 'TürkUA, Türkiye–Ukrayna ve Ukrayna–Türkiye arasında bilgi ve hizmet arayan binlerce kişiye ulaşan bir platformdur. Reklam alanı satın alarak hedef kitlenize doğrudan ulaşabilirsiniz. Başvuru formunu doldurun, 24 saat içinde size dönelim.'),
  ('ads.sub', 'ua', 'sponsored', 'text', 'published', 'Охопіть тисячі відвідувачів, які шукають інформацію між Туреччиною та Україною. Натисніть на площу нижче, щоб подати заявку.'),
  ('ads.title', 'tr', 'sponsored', 'text', 'published', 'Hedef Kitlenize Doğrudan Ulaşın'),
  ('ads.title', 'ua', 'sponsored', 'text', 'published', 'Зв''яжіться Напряму з Вашою Аудиторією'),
  ('sponsored.slot.title.001', 'tr', 'sponsored', 'text', 'published', 'Premium: Otobüs / Taşımacılık'),
  ('sponsored.slot.title.001', 'ua', 'sponsored', 'text', 'published', 'Автобус / Перевезення'),
  ('sponsored.slot.title.002', 'tr', 'sponsored', 'text', 'published', 'Premium: Vize & Göç Acentesi'),
  ('sponsored.slot.title.002', 'ua', 'sponsored', 'text', 'published', 'Візове & Міграційне Агентство'),
  ('sponsored.slot.title.003', 'tr', 'sponsored', 'text', 'published', 'Premium: Ticaret / Lojistik'),
  ('sponsored.slot.title.003', 'ua', 'sponsored', 'text', 'published', 'Торгівля / Логістика'),
  ('sponsored.span.001', 'tr', 'sponsored', 'text', 'published', 'REKLAM ALANLARI'),
  ('sponsored.span.001', 'ua', 'sponsored', 'text', 'published', 'РЕКЛАМНІ ПЛОЩІ'),
  ('sponsored.sponsor.slot.action.text.001', 'tr', 'sponsored', 'text', 'published', 'Reklam Ver'),
  ('sponsored.sponsor.slot.action.text.001', 'ua', 'sponsored', 'text', 'published', 'Розмістити Рекламу'),
  ('sponsored.sponsor.slot.action.text.002', 'tr', 'sponsored', 'text', 'published', 'Reklam Ver'),
  ('sponsored.sponsor.slot.action.text.002', 'ua', 'sponsored', 'text', 'published', 'Розмістити Рекламу'),
  ('sponsored.sponsor.slot.action.text.003', 'tr', 'sponsored', 'text', 'published', 'Reklam Ver'),
  ('sponsored.sponsor.slot.action.text.003', 'ua', 'sponsored', 'text', 'published', 'Розмістити Рекламу'),
  ('tracker.card.title.001', 'tr', 'tracker', 'text', 'published', 'Durum Göstergeleri'),
  ('tracker.card.title.001', 'ua', 'tracker', 'text', 'published', 'Показники Стану'),
  ('tracker.card.title.002', 'tr', 'tracker', 'text', 'published', 'Son Gelişmeler'),
  ('tracker.card.title.002', 'ua', 'tracker', 'text', 'published', 'Останні Події'),
  ('tracker.card.title.003', 'tr', 'tracker', 'text', 'published', 'Analiz & Gerekçe'),
  ('tracker.card.title.003', 'ua', 'tracker', 'text', 'published', 'Аналіз та Обґрунтування'),
  ('tracker.conf.lbl.001', 'tr', 'tracker', 'text', 'published', 'Güven:'),
  ('tracker.conf.lbl.001', 'ua', 'tracker', 'text', 'published', 'Впевненість:'),
  ('tracker.prob.card.badge.001', 'tr', 'tracker', 'text', 'published', 'YARIN'),
  ('tracker.prob.card.badge.001', 'ua', 'tracker', 'text', 'published', 'ЗАВТРА'),
  ('tracker.prob.card.badge.002', 'tr', 'tracker', 'text', 'published', '1 AY İÇİNDE'),
  ('tracker.prob.card.badge.002', 'ua', 'tracker', 'text', 'published', 'ЗА 1 МІСЯЦЬ'),
  ('tracker.prob.card.badge.003', 'tr', 'tracker', 'text', 'published', '1 YIL İÇİNDE'),
  ('tracker.prob.card.badge.003', 'ua', 'tracker', 'text', 'published', 'ЗА 1 РІК'),
  ('tracker.prob.card.sublabel.001', 'tr', 'tracker', 'text', 'published', 'Yarın Olasılığı'),
  ('tracker.prob.card.sublabel.001', 'ua', 'tracker', 'text', 'published', 'Ймовірність на завтра'),
  ('tracker.prob.card.sublabel.002', 'tr', 'tracker', 'text', 'published', '1 Ay İçin Olasılık'),
  ('tracker.prob.card.sublabel.002', 'ua', 'tracker', 'text', 'published', 'Ймовірність за місяць'),
  ('tracker.prob.card.sublabel.003', 'tr', 'tracker', 'text', 'published', '1 Yıl İçin Olasılık'),
  ('tracker.prob.card.sublabel.003', 'ua', 'tracker', 'text', 'published', 'Ймовірність за рік'),
  ('tracker.status.key.001', 'tr', 'tracker', 'text', 'published', 'Savaş Durumu'),
  ('tracker.status.key.001', 'ua', 'tracker', 'text', 'published', 'Стан Війни'),
  ('tracker.status.key.002', 'tr', 'tracker', 'text', 'published', 'Müzakereler'),
  ('tracker.status.key.002', 'ua', 'tracker', 'text', 'published', 'Переговори'),
  ('tracker.status.key.003', 'tr', 'tracker', 'text', 'published', 'Süre'),
  ('tracker.status.key.003', 'ua', 'tracker', 'text', 'published', 'Тривалість'),
  ('tracker.trend.label.001', 'tr', 'tracker', 'text', 'published', 'Trend:'),
  ('tracker.trend.label.001', 'ua', 'tracker', 'text', 'published', 'Тренд:'),
  ('trade.h3.001', 'tr', 'trade', 'text', 'published', 'Serbest Ticaret Anlaşması (STA)'),
  ('trade.h3.001', 'ua', 'trade', 'text', 'published', 'Угода про Вільну Торгівлю (УВТ)'),
  ('trade.h3.002', 'tr', 'trade', 'text', 'published', 'Öne Çıkan Sektörler'),
  ('trade.h3.002', 'ua', 'trade', 'text', 'published', 'Провідні Сектори'),
  ('trade.h3.003', 'tr', 'trade', 'text', 'published', 'İş Dünyası için Fırsatlar'),
  ('trade.h3.003', 'ua', 'trade', 'text', 'published', 'Можливості для Бізнесу'),
  ('trade.highlight.box.001', 'tr', 'trade', 'html', 'published', '<strong>Kapsam:</strong> Tekstil, otomotiv, beyaz eşya, tarım ürünleri, kimya — gümrük vergisi ve kota engelleri kaldırıldı.'),
  ('trade.highlight.box.001', 'ua', 'trade', 'html', 'published', '<strong>Охоплення:</strong> Текстиль, автомобілі, побутова техніка, сільгоспродукти, хімікати — усунуто мита та квоти.'),
  ('trade.p.001', 'tr', 'trade', 'text', 'published', '3 Şubat 2022''de imzalanan STA, 4 Ekim 2024''te yürürlüğe girdi. Türk ihracatçılar AB''li rakipleriyle aynı koşullarda Ukrayna pazarına girebiliyor.'),
  ('trade.p.001', 'ua', 'trade', 'text', 'published', 'УВТ підписана 3 лютого 2022 р. та набула чинності 4 жовтня 2024 р. Турецькі експортери отримали рівні умови з конкурентами з ЄС на ринку України.'),
  ('trade.section.copy.spaced.001', 'tr', 'trade', 'text', 'published', 'İki ülke arasında en fazla ticaret yapılan sektörler:'),
  ('trade.section.copy.spaced.001', 'ua', 'trade', 'text', 'published', 'Найбільш активні сектори торгівлі між двома країнами:'),
  ('trade.section.sub.001', 'tr', 'trade', 'text', 'published', '4 Ekim 2024''te yürürlüğe giren Serbest Ticaret Anlaşması ile iki ülke arasındaki ticaret yeni bir döneme girdi.'),
  ('trade.section.sub.001', 'ua', 'trade', 'text', 'published', 'Угода про вільну торгівлю, що набула чинності 4 жовтня 2024 р., відкрила нову еру в торгівлі між двома країнами.'),
  ('trade.section.title.001', 'tr', 'trade', 'text', 'published', 'Türkiye–Ukrayna Ticaret Anlaşmaları'),
  ('trade.section.title.001', 'ua', 'trade', 'text', 'published', 'Торговельні Угоди Туреччина–Україна'),
  ('trade.span.001', 'tr', 'trade', 'text', 'published', 'TİCARİ İLİŞKİLER'),
  ('trade.span.001', 'ua', 'trade', 'text', 'published', 'ТОРГОВЕЛЬНІ ВІДНОСИНИ'),
  ('trade.span.002', 'tr', 'trade', 'text', 'published', 'Tekstil & Hazır Giyim'),
  ('trade.span.002', 'ua', 'trade', 'text', 'published', 'Текстиль'),
  ('trade.span.003', 'tr', 'trade', 'text', 'published', 'Otomotiv'),
  ('trade.span.003', 'ua', 'trade', 'text', 'published', 'Автомобілі'),
  ('trade.span.004', 'tr', 'trade', 'text', 'published', 'Tarım & Gıda'),
  ('trade.span.004', 'ua', 'trade', 'text', 'published', 'Сільгосп'),
  ('trade.span.005', 'tr', 'trade', 'text', 'published', 'Makina & Ekipman'),
  ('trade.span.005', 'ua', 'trade', 'text', 'published', 'Обладнання'),
  ('trade.span.006', 'tr', 'trade', 'text', 'published', 'Kimya'),
  ('trade.span.006', 'ua', 'trade', 'text', 'published', 'Хімія'),
  ('trade.span.007', 'tr', 'trade', 'text', 'published', 'İnşaat'),
  ('trade.span.007', 'ua', 'trade', 'text', 'published', 'Будівництво'),
  ('trade.stat.label.001', 'tr', 'trade', 'text', 'published', '2024 Ticaret Hacmi'),
  ('trade.stat.label.001', 'ua', 'trade', 'text', 'published', 'Обсяг торгівлі 2024'),
  ('trade.stat.label.002', 'tr', 'trade', 'text', 'published', 'Hedef Ticaret Hacmi'),
  ('trade.stat.label.002', 'ua', 'trade', 'text', 'published', 'Цільовий Обсяг'),
  ('trade.stat.label.003', 'tr', 'trade', 'html', 'published', 'STA Yürürlük Tarihi<br>2024'),
  ('trade.stat.label.003', 'ua', 'trade', 'html', 'published', 'Набуття Чинності УВТ<br>2024'),
  ('trade.stat.label.004', 'tr', 'trade', 'html', 'published', 'Pek Çok Üründe<br>Gümrük Vergisi'),
  ('trade.stat.label.004', 'ua', 'trade', 'html', 'published', 'Мито на Більшість<br>ТоварівТоварів'),
  ('trade.step.list.001', 'tr', 'trade', 'html', 'published', '<li><span class="step-num">▸</span>Ukrayna''nın yeniden yapılanması sürecinde inşaat ve altyapı yatırımları</li>
        
        <li><span class="step-num">▸</span>STA ile tekstil ve hazır giyimde yeni ihracat kapıları</li>
        
        <li><span class="step-num">▸</span>Tarım ürünleri ve gıda ticaretinde büyüme potansiyeli</li>
        
        <li><span class="step-num">▸</span>Ukraynalı şirketler için Türkiye üzerinden üçüncü ülkelere erişim</li>
        
        <li><span class="step-num">▸</span>Ortak lojistik ve taşımacılık projeleri</li>'),
  ('trade.step.list.001', 'ua', 'trade', 'html', 'published', '<li><span class="step-num">▸</span>Інвестиції в будівництво та інфраструктуру в рамках відбудови України</li>
        
        <li><span class="step-num">▸</span>Нові можливості для текстильного та швейного експорту завдяки УВТ</li>
        
        <li><span class="step-num">▸</span>Потенціал зростання в торгівлі сільгосппродуктами та продовольством</li>
        
        <li><span class="step-num">▸</span>Доступ до третіх країн через Туреччину для українських компаній</li>
        
        <li><span class="step-num">▸</span>Спільні логістичні та транспортні проекти</li>'),
  ('visa.h3.001', 'tr', 'visa', 'text', 'published', 'Ukraynalılar için Türkiye'),
  ('visa.h3.001', 'ua', 'visa', 'text', 'published', 'Туреччина для Українців'),
  ('visa.h3.002', 'tr', 'visa', 'text', 'published', 'Türkler için Ukrayna'),
  ('visa.h3.002', 'ua', 'visa', 'text', 'published', 'Україна для Турків'),
  ('visa.highlight.box.001', 'tr', 'visa', 'html', 'published', '<strong>İkamet İzni için:</strong> İl Göç İdaresi Müdürlüğü''ne başvur. Gerekli: pasaport, kira sözleşmesi, sağlık sigortası, fotoğraf, başvuru harcı.'),
  ('visa.highlight.box.001', 'ua', 'visa', 'html', 'published', '<strong>Для посвідки на проживання:</strong> Звернись до Провінційного управління з питань міграції. Потрібно: паспорт, договір оренди, медичне страхування, фото, збір за подачу.'),
  ('visa.highlight.box.002', 'tr', 'visa', 'html', 'published', '<strong>Kimlik &amp; Pasaport Uyarısı:</strong> Normal koşullarda Türk kimliği (çipli) Ukrayna girişi için yeterlidir. Ancak savaş dolayısıyla alınan olağanüstü tedbirler kapsamında sınır kapılarında ek kontroller uygulanabilmektedir. Güvenli geçiş için <strong>pasaportunuzu yanınızda bulundurmanız kesinlikle tavsiye edilir.</strong> Güncel bilgi için T.C. Büyükelçiliği''ni (Kyiv) arayın.'),
  ('visa.highlight.box.002', 'ua', 'visa', 'html', 'published', '<strong>Попередження щодо посвідчення особи та паспорта:</strong> За звичайних умов для в''їзду до України достатньо турецького посвідчення (з чіпом). Однак у зв''язку з надзвичайними заходами воєнного часу на кордонних пунктах можуть проводитися додаткові перевірки. Для безпечного перетину <strong>настійно рекомендується мати при собі паспорт.</strong> За актуальною інформацією звертайтесь до Посольства Туреччини (Київ).'),
  ('visa.highlight.box.003', 'tr', 'visa', 'html', 'published', 'Uyarı: <strong>Önemli:</strong> Aktif çatışma bölgelerine seyahat etmeyiniz. Seyahat öncesi T.C. Dışişleri Bakanlığı''nın güncel seyahat uyarılarını kontrol edin.'),
  ('visa.highlight.box.003', 'ua', 'visa', 'html', 'published', 'Uyarı: <strong>Важливо:</strong> Не їздіть до зон активних бойових дій. Перевіряйте актуальні попередження МЗС Туреччини перед поїздкою.'),
  ('visa.lbl.001', 'tr', 'visa', 'text', 'published', 'Kısa Ziyaret'),
  ('visa.lbl.001', 'ua', 'visa', 'text', 'published', 'Коротке Перебування'),
  ('visa.lbl.002', 'tr', 'visa', 'text', 'published', 'Uzun Kalış'),
  ('visa.lbl.002', 'ua', 'visa', 'text', 'published', 'Тривале Перебування'),
  ('visa.lbl.003', 'tr', 'visa', 'text', 'published', 'Öğrenci İzni'),
  ('visa.lbl.003', 'ua', 'visa', 'text', 'published', 'Студентський Дозвіл'),
  ('visa.lbl.004', 'tr', 'visa', 'text', 'published', 'Çalışma İzni'),
  ('visa.lbl.004', 'ua', 'visa', 'text', 'published', 'Дозвіл на Роботу'),
  ('visa.lbl.005', 'tr', 'visa', 'text', 'published', 'Geçici Koruma'),
  ('visa.lbl.005', 'ua', 'visa', 'text', 'published', 'Тимчасовий Захист'),
  ('visa.lbl.006', 'tr', 'visa', 'text', 'published', 'Kısa Ziyaret'),
  ('visa.lbl.006', 'ua', 'visa', 'text', 'published', 'Коротке Перебування'),
  ('visa.lbl.007', 'tr', 'visa', 'text', 'published', 'Pasaport'),
  ('visa.lbl.007', 'ua', 'visa', 'text', 'published', 'Паспорт'),
  ('visa.lbl.008', 'tr', 'visa', 'text', 'published', 'Uzun Kalış'),
  ('visa.lbl.008', 'ua', 'visa', 'text', 'published', 'Тривале Перебування'),
  ('visa.lbl.009', 'tr', 'visa', 'text', 'published', 'Öğrenci Vizesi'),
  ('visa.lbl.009', 'ua', 'visa', 'text', 'published', 'Студентська Віза'),
  ('visa.lbl.010', 'tr', 'visa', 'text', 'published', 'Savaş Etkisi'),
  ('visa.lbl.010', 'ua', 'visa', 'text', 'published', 'Вплив Війни'),
  ('visa.section.title.001', 'tr', 'visa', 'text', 'published', 'Vize & İkamet İşlemleri'),
  ('visa.section.title.001', 'ua', 'visa', 'text', 'published', 'Оформлення Візи та Проживання'),
  ('visa.span.001', 'tr', 'visa', 'text', 'published', 'VİZE & İKAMET REHBERİ'),
  ('visa.span.001', 'ua', 'visa', 'text', 'published', 'ПУТІВНИК З ВІЗИ ТА ПРОЖИВАННЯ'),
  ('visa.val.001', 'tr', 'visa', 'text', 'published', '90 gün'),
  ('visa.val.001', 'ua', 'visa', 'text', 'published', '90 днів'),
  ('visa.val.002', 'tr', 'visa', 'text', 'published', 'İkamet İzni Gerekli'),
  ('visa.val.002', 'ua', 'visa', 'text', 'published', 'Потрібний Дозвіл'),
  ('visa.val.003', 'tr', 'visa', 'text', 'published', 'Üniv. kabul + başvuru'),
  ('visa.val.003', 'ua', 'visa', 'text', 'published', 'Зарахування + заявка'),
  ('visa.val.004', 'tr', 'visa', 'text', 'published', 'İşveren başvurusu'),
  ('visa.val.004', 'ua', 'visa', 'text', 'published', 'Заявка роботодавця'),
  ('visa.val.005', 'tr', 'visa', 'text', 'published', 'Savaş dönemi hakkı'),
  ('visa.val.005', 'ua', 'visa', 'text', 'published', 'Право воєнного часу'),
  ('visa.val.006', 'tr', 'visa', 'text', 'published', '90 gün (çipli kimlik)'),
  ('visa.val.006', 'ua', 'visa', 'text', 'published', '90 днів (посвідчення з чіпом)'),
  ('visa.val.007', 'tr', 'visa', 'text', 'published', 'Uyarı: Savaş dönemi — pasaport tavsiye edilir'),
  ('visa.val.007', 'ua', 'visa', 'text', 'published', 'Uyarı: Воєнний час — паспорт рекомендований'),
  ('visa.val.008', 'tr', 'visa', 'text', 'published', 'D tipi uzun süreli vize'),
  ('visa.val.008', 'ua', 'visa', 'text', 'published', 'Довгострокова віза типу D'),
  ('visa.val.009', 'tr', 'visa', 'text', 'published', 'D tipi — konsolosluktan öğrenin'),
  ('visa.val.009', 'ua', 'visa', 'text', 'published', 'Тип D — уточніть у консульстві'),
  ('visa.val.010', 'tr', 'visa', 'text', 'published', 'Bazı bölgeler kısıtlı'),
  ('visa.val.010', 'ua', 'visa', 'text', 'published', 'Деякі регіони обмежені'),
  ('visa.visa.free.badge.001', 'tr', 'visa', 'text', 'published', 'VİZESİZ — 90 GÜN'),
  ('visa.visa.free.badge.001', 'ua', 'visa', 'text', 'published', 'БЕЗ ВІЗИ — 90 ДНІВ'),
  ('visa.visa.hero.copy.001', 'tr', 'visa', 'text', 'published', '17 Şubat 2012 tarihli anlaşma ile her iki ülke vatandaşları 180 günde 90 güne kadar vizesiz giriş yapabilmektedir.'),
  ('visa.visa.hero.copy.001', 'ua', 'visa', 'text', 'published', 'Відповідно до угоди від 17 лютого 2012 р. громадяни обох країн можуть перебувати до 90 днів протягом 180 днів без візи.'),
  ('visa.visa.hero.title.001', 'tr', 'visa', 'text', 'published', 'Türkiye ↔ Ukrayna Vizesiz Anlaşma'),
  ('visa.visa.hero.title.001', 'ua', 'visa', 'text', 'published', 'Безвізовий режим Туреччина ↔ Україна')
on conflict (content_key, locale) do update set section = excluded.section, content_type = excluded.content_type, status = excluded.status, value = excluded.value;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'translations'
  ) then
    alter publication supabase_realtime add table public.translations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'languages'
  ) then
    alter publication supabase_realtime add table public.languages;
  end if;
end;
$$;

-- ============================================================================
-- SOURCE: 20260629_i18n_runtime.sql
-- ============================================================================
-- Dynamic interface strings used by tracker, news feed and shop renderers.
-- Run after 20260629_i18n_content.sql.

insert into public.translations (content_key, locale, section, content_type, status, value) values
  ('tracker.status.war', 'tr', 'tracker', 'text', 'published', 'AKTİF'),
  ('tracker.status.war', 'ua', 'tracker', 'text', 'published', 'АКТИВНА'),
  ('tracker.status.negotiation', 'tr', 'tracker', 'text', 'published', 'DURDU'),
  ('tracker.status.negotiation', 'ua', 'tracker', 'text', 'published', 'ЗУПИНИВСЯ'),
  ('tracker.trend', 'tr', 'tracker', 'text', 'published', 'Savaşın yoğunluğunda artış var'),
  ('tracker.trend', 'ua', 'tracker', 'text', 'published', 'Збільшення інтенсивності війни'),
  ('tracker.label.1d', 'tr', 'tracker', 'text', 'published', 'Savaşın yoğunluğu'),
  ('tracker.label.1d', 'ua', 'tracker', 'text', 'published', 'Інтенсивність війни'),
  ('tracker.label.1m', 'tr', 'tracker', 'text', 'published', 'Savaşın seyri'),
  ('tracker.label.1m', 'ua', 'tracker', 'text', 'published', 'Хід війни'),
  ('tracker.label.1y', 'tr', 'tracker', 'text', 'published', 'Savaşın sonucu'),
  ('tracker.label.1y', 'ua', 'tracker', 'text', 'published', 'Результат війни'),
  ('tracker.reasoning', 'tr', 'tracker', 'text', 'published', 'Son günlerde savaşın yoğunluğunda artış var'),
  ('tracker.reasoning', 'ua', 'tracker', 'text', 'published', 'Останніми днями спостерігається зростання інтенсивності війни'),
  ('tracker.development.1.date', 'tr', 'tracker', 'text', 'published', '28 Haziran 2026'),
  ('tracker.development.1.date', 'ua', 'tracker', 'text', 'published', '28 червня 2026'),
  ('tracker.development.1.text', 'tr', 'tracker', 'text', 'published', 'Rus güçleri Dnipropetrovsk bölgesini 40''dan fazla kez vurdu'),
  ('tracker.development.1.text', 'ua', 'tracker', 'text', 'published', 'Російські війська обстріляли Дніпропетровську область понад 40 раз'),
  ('tracker.development.2.date', 'tr', 'tracker', 'text', 'published', '27 Haziran 2026'),
  ('tracker.development.2.date', 'ua', 'tracker', 'text', 'published', '27 червня 2026'),
  ('tracker.development.2.text', 'tr', 'tracker', 'text', 'published', 'Ukrayna ve Polonya bilim adamları Arktika ve Antarktika''da ortak araştırmalar yapacak'),
  ('tracker.development.2.text', 'ua', 'tracker', 'text', 'published', 'Українські та польські вчені проведуть спільні дослідження в Арктиці та Антарктиці'),
  ('tracker.news.1.date', 'tr', 'tracker', 'text', 'published', '28 Haziran 2026'),
  ('tracker.news.1.date', 'ua', 'tracker', 'text', 'published', '28 червня 2026'),
  ('tracker.news.1.title', 'tr', 'tracker', 'text', 'published', 'Rus güçleri Herson bölgesini vurdu'),
  ('tracker.news.1.title', 'ua', 'tracker', 'text', 'published', 'Російські війська обстріляли Херсонську область'),
  ('tracker.news.1.body', 'tr', 'tracker', 'text', 'published', 'Rus güçleri Herson bölgesini vurdu, 7 sivil yaralandı'),
  ('tracker.news.1.body', 'ua', 'tracker', 'text', 'published', 'Російські війська обстріляли Херсонську область, 7 цивільних осіб поранено'),
  ('tracker.news.2.date', 'tr', 'tracker', 'text', 'published', '27 Haziran 2026'),
  ('tracker.news.2.date', 'ua', 'tracker', 'text', 'published', '27 червня 2026'),
  ('tracker.news.2.title', 'tr', 'tracker', 'text', 'published', 'Ukrayna ve AB, dual-use teknolojileri desteklemek için program başlattı'),
  ('tracker.news.2.title', 'ua', 'tracker', 'text', 'published', 'Україна та ЄС запустили програму з підтримки двоїстого використання технологій'),
  ('tracker.news.2.body', 'tr', 'tracker', 'text', 'published', 'Ukrayna ve AB, dual-use teknolojileri desteklemek için 343 milyon euroluk bir program başlattı'),
  ('tracker.news.2.body', 'ua', 'tracker', 'text', 'published', 'Україна та ЄС запустили програму з підтримки двоїстого використання технологій на суму 343 млн євро'),
  ('tracker.category.military', 'tr', 'tracker', 'text', 'published', 'ASKERİ'),
  ('tracker.category.military', 'ua', 'tracker', 'text', 'published', 'ВІЙСЬКОВЕ'),
  ('tracker.category.diplomatic', 'tr', 'tracker', 'text', 'published', 'DİPLOMASİ'),
  ('tracker.category.diplomatic', 'ua', 'tracker', 'text', 'published', 'ДИПЛОМАТІЯ'),
  ('tracker.category.economic', 'tr', 'tracker', 'text', 'published', 'EKONOMİ'),
  ('tracker.category.economic', 'ua', 'tracker', 'text', 'published', 'ЕКОНОМІКА'),
  ('tracker.category.humanitarian', 'tr', 'tracker', 'text', 'published', 'İNSANİ'),
  ('tracker.category.humanitarian', 'ua', 'tracker', 'text', 'published', 'ГУМАНІТАРНЕ'),
  ('tracker.impact.label', 'tr', 'tracker', 'text', 'published', 'olasılık etkisi'),
  ('tracker.impact.label', 'ua', 'tracker', 'text', 'published', 'вплив на ймов.'),
  ('tracker.news.empty', 'tr', 'tracker', 'text', 'published', 'Bu kategoride gelişme yok.'),
  ('tracker.news.empty', 'ua', 'tracker', 'text', 'published', 'Новини у цій категорії відсутні.'),
  ('tracker.updated.short', 'tr', 'tracker', 'text', 'published', 'son güncelleme: '),
  ('tracker.updated.short', 'ua', 'tracker', 'text', 'published', 'оновлено: '),
  ('tracker.updated.long', 'tr', 'tracker', 'text', 'published', 'SON GÜNCELLEME: '),
  ('tracker.updated.long', 'ua', 'tracker', 'text', 'published', 'ОСТАННЄ ОНОВЛЕННЯ: '),
  ('tracker.duration.year.one', 'tr', 'tracker', 'text', 'published', 'yıl'),
  ('tracker.duration.year.one', 'ua', 'tracker', 'text', 'published', 'рік'),
  ('tracker.duration.year.few', 'tr', 'tracker', 'text', 'published', 'yıl'),
  ('tracker.duration.year.few', 'ua', 'tracker', 'text', 'published', 'роки'),
  ('tracker.duration.year.many', 'tr', 'tracker', 'text', 'published', 'yıl'),
  ('tracker.duration.year.many', 'ua', 'tracker', 'text', 'published', 'років'),
  ('tracker.duration.day.one', 'tr', 'tracker', 'text', 'published', 'gün'),
  ('tracker.duration.day.one', 'ua', 'tracker', 'text', 'published', 'день'),
  ('tracker.duration.day.few', 'tr', 'tracker', 'text', 'published', 'gün'),
  ('tracker.duration.day.few', 'ua', 'tracker', 'text', 'published', 'дні'),
  ('tracker.duration.day.many', 'tr', 'tracker', 'text', 'published', 'gün'),
  ('tracker.duration.day.many', 'ua', 'tracker', 'text', 'published', 'днів'),
  ('contact.validation.required', 'tr', 'contact', 'text', 'published', 'Lütfen tüm alanları doldurunuz.'),
  ('contact.validation.required', 'ua', 'contact', 'text', 'published', 'Будь ласка, заповніть усі поля.'),
  ('contact.success', 'tr', 'contact', 'text', 'published', 'Mesajınız alındı! En kısa sürede dönüş yapacağız.'),
  ('contact.success', 'ua', 'contact', 'text', 'published', 'Повідомлення отримано! Ми зв''яжемося з вами найближчим часом.'),
  ('shop.product.tee.kind', 'tr', 'shop', 'text', 'published', 'Tişört'),
  ('shop.product.tee.kind', 'ua', 'shop', 'text', 'published', 'Футболка'),
  ('shop.product.tee.title', 'tr', 'shop', 'text', 'published', 'Tamga Oversize Tişört'),
  ('shop.product.tee.title', 'ua', 'shop', 'text', 'published', 'Tamga Oversize Футболка'),
  ('shop.product.tee.description', 'tr', 'shop', 'text', 'published', 'İlk seri için yıkamalı siyah kumaş, göğüste TURKUA tamga işareti. Beden notunu talepte yaz.'),
  ('shop.product.tee.description', 'ua', 'shop', 'text', 'published', 'Перший дроп: washed black тканина, знак TURKUA Tamga на грудях. Розмір вкажіть у заявці.'),
  ('shop.product.watch.kind', 'tr', 'shop', 'text', 'published', 'Saat'),
  ('shop.product.watch.kind', 'ua', 'shop', 'text', 'published', 'Годинник'),
  ('shop.product.watch.title', 'tr', 'shop', 'text', 'published', 'Tamga Saat'),
  ('shop.product.watch.title', 'ua', 'shop', 'text', 'published', 'Tamga Годинник'),
  ('shop.product.watch.description', 'tr', 'shop', 'text', 'published', 'Metal kasa, koyu kadran, küçük tamga detayı. İkinci seri için hazırlanıyor.'),
  ('shop.product.watch.description', 'ua', 'shop', 'text', 'published', 'Металевий корпус, темний циферблат, маленька деталь Tamga. Готується для другої серії.'),
  ('shop.product.gift.kind', 'tr', 'shop', 'text', 'published', 'Hediyelik'),
  ('shop.product.gift.kind', 'ua', 'shop', 'text', 'published', 'Сувенір'),
  ('shop.product.gift.title', 'tr', 'shop', 'text', 'published', 'Tamga Hediye Obje'),
  ('shop.product.gift.title', 'ua', 'shop', 'text', 'published', 'Tamga Сувенір'),
  ('shop.product.gift.description', 'tr', 'shop', 'text', 'published', 'Masa üstü küçük obje, anahtarlık ve koleksiyon parçaları için ayrılan seri.'),
  ('shop.product.gift.description', 'ua', 'shop', 'text', 'published', 'Серія для настільних обʼєктів, брелоків та колекційних речей.'),
  ('shop.product.glasses.kind', 'tr', 'shop', 'text', 'published', 'Gözlük'),
  ('shop.product.glasses.kind', 'ua', 'shop', 'text', 'published', 'Окуляри'),
  ('shop.product.glasses.title', 'tr', 'shop', 'text', 'published', 'Tamga Gözlük'),
  ('shop.product.glasses.title', 'ua', 'shop', 'text', 'published', 'Tamga Окуляри'),
  ('shop.product.glasses.description', 'tr', 'shop', 'text', 'published', 'Yaz drop için planlanan sade, koyu camlı aksesuar çizgisi.'),
  ('shop.product.glasses.description', 'ua', 'shop', 'text', 'published', 'Лаконічна лінія аксесуарів із темними лінзами для літнього drop.'),
  ('shop.status.soon', 'tr', 'shop', 'text', 'published', 'Yakında'),
  ('shop.status.soon', 'ua', 'shop', 'text', 'published', 'Скоро'),
  ('shop.status.available', 'tr', 'shop', 'text', 'published', '{count} adet kaldı'),
  ('shop.status.available', 'ua', 'shop', 'text', 'published', '{count} шт. доступно'),
  ('shop.status.soldout', 'tr', 'shop', 'text', 'published', 'Tükendi'),
  ('shop.status.soldout', 'ua', 'shop', 'text', 'published', 'Вичерпано'),
  ('shop.action.add', 'tr', 'shop', 'text', 'published', 'Talep Ekle'),
  ('shop.action.add', 'ua', 'shop', 'text', 'published', 'Додати запит'),
  ('shop.action.remove', 'tr', 'shop', 'text', 'published', 'Sil'),
  ('shop.action.remove', 'ua', 'shop', 'text', 'published', 'Видалити'),
  ('shop.cart.empty', 'tr', 'shop', 'text', 'published', 'Henüz ürün eklenmedi.'),
  ('shop.cart.empty', 'ua', 'shop', 'text', 'published', 'Поки що немає товару.'),
  ('shop.validation.stock', 'tr', 'shop', 'text', 'published', 'Bu ürün için görünen stoktan fazla talep eklenemez.'),
  ('shop.validation.stock', 'ua', 'shop', 'text', 'published', 'Не можна додати запит, що перевищує наявний запас.'),
  ('shop.validation.empty', 'tr', 'shop', 'text', 'published', 'Önce ürün ekleyin.'),
  ('shop.validation.empty', 'ua', 'shop', 'text', 'published', 'Спочатку додайте товар.'),
  ('shop.validation.contact', 'tr', 'shop', 'text', 'published', 'Ad ve iletişim bilgisi zorunlu.'),
  ('shop.validation.contact', 'ua', 'shop', 'text', 'published', 'Імʼя та контакт обовʼязкові.'),
  ('rates.updated', 'tr', 'money', 'text', 'published', 'güncellendi'),
  ('rates.updated', 'ua', 'money', 'text', 'published', 'оновлено'),
  ('rates.unavailable', 'tr', 'money', 'text', 'published', 'kur alınamadı'),
  ('rates.unavailable', 'ua', 'money', 'text', 'published', 'курс недоступний'),
  ('ads.validation.file', 'tr', 'contact', 'text', 'published', 'Lütfen PNG, JPG, WEBP veya GIF formatında en fazla 4MB dosya seçin.'),
  ('ads.validation.file', 'ua', 'contact', 'text', 'published', 'Виберіть файл PNG, JPG, WEBP або GIF розміром до 4 МБ.'),
  ('ads.validation.name', 'tr', 'contact', 'text', 'published', 'Lütfen adınızı girin.'),
  ('ads.validation.name', 'ua', 'contact', 'text', 'published', 'Будь ласка, введіть ім''я.'),
  ('static.ads.div.001', 'tr', 'ads', 'text', 'published', '300 × 250 px'),
  ('static.ads.div.001', 'ua', 'ads', 'text', 'published', '300 × 250 px'),
  ('static.ads.div.002', 'tr', 'ads', 'text', 'published', '300 × 250 px'),
  ('static.ads.div.002', 'ua', 'ads', 'text', 'published', '300 × 250 px'),
  ('static.contact.input.001.placeholder', 'tr', 'contact', 'text', 'published', 'Şirket veya Ad Soyad'),
  ('static.contact.input.001.placeholder', 'ua', 'contact', 'text', 'published', 'Şirket veya Ad Soyad'),
  ('static.contact.option.002', 'tr', 'contact', 'text', 'published', 'Statik görsel / Static image'),
  ('static.contact.option.002', 'ua', 'contact', 'text', 'published', 'Statik görsel / Static image'),
  ('static.contact.option.003', 'tr', 'contact', 'text', 'published', 'GIF animasyon / GIF animation'),
  ('static.contact.option.003', 'ua', 'contact', 'text', 'published', 'GIF animasyon / GIF animation'),
  ('static.contact.option.004', 'tr', 'contact', 'text', 'published', 'Metin + görsel / Text + image'),
  ('static.contact.option.004', 'ua', 'contact', 'text', 'published', 'Metin + görsel / Text + image'),
  ('static.contact.input.005.placeholder', 'tr', 'contact', 'text', 'published', '+90 5XX XXX XX XX'),
  ('static.contact.input.005.placeholder', 'ua', 'contact', 'text', 'published', '+90 5XX XXX XX XX'),
  ('static.contact.span.006', 'tr', 'contact', 'text', 'published', 'PTT'),
  ('static.contact.span.006', 'ua', 'contact', 'text', 'published', 'PTT'),
  ('static.contact.input.007.placeholder', 'tr', 'contact', 'text', 'published', '+38 0XX XXX XX XX'),
  ('static.contact.input.007.placeholder', 'ua', 'contact', 'text', 'published', '+38 0XX XXX XX XX'),
  ('static.contact.label.008', 'tr', 'contact', 'text', 'published', 'Telegram'),
  ('static.contact.label.008', 'ua', 'contact', 'text', 'published', 'Telegram'),
  ('static.contact.input.009.placeholder', 'tr', 'contact', 'text', 'published', '@kullaniciadi'),
  ('static.contact.input.009.placeholder', 'ua', 'contact', 'text', 'published', '@kullaniciadi'),
  ('static.contact.label.010', 'tr', 'contact', 'text', 'published', 'E-posta'),
  ('static.contact.label.010', 'ua', 'contact', 'text', 'published', 'E-posta'),
  ('static.contact.input.011.placeholder', 'tr', 'contact', 'text', 'published', 'ornek@firma.com'),
  ('static.contact.input.011.placeholder', 'ua', 'contact', 'text', 'published', 'ornek@firma.com'),
  ('static.contact.span.012', 'tr', 'contact', 'text', 'published', 'PNG, JPG, WEBP, GIF — maks. 4MB'),
  ('static.contact.span.012', 'ua', 'contact', 'text', 'published', 'PNG, JPG, WEBP, GIF — maks. 4MB'),
  ('static.contact.img.013.alt', 'tr', 'contact', 'text', 'published', 'Logo'),
  ('static.contact.img.013.alt', 'ua', 'contact', 'text', 'published', 'Logo'),
  ('static.contact.textarea.014.placeholder', 'tr', 'contact', 'text', 'published', 'Hedef kitle, yayın süresi, bütçe vb. / Цільова аудиторія, термін розміщення, бюджет тощо'),
  ('static.contact.textarea.014.placeholder', 'ua', 'contact', 'text', 'published', 'Hedef kitle, yayın süresi, bütçe vb. / Цільова аудиторія, термін розміщення, бюджет тощо'),
  ('static.education.span.001', 'tr', 'education', 'text', 'published', 'UA -> TR'),
  ('static.education.span.001', 'ua', 'education', 'text', 'published', 'UA -> TR'),
  ('static.education.div.002', 'tr', 'education', 'text', 'published', 'Banka'),
  ('static.education.div.002', 'ua', 'education', 'text', 'published', 'Banka'),
  ('static.education.div.003', 'tr', 'education', 'text', 'published', 'TR -> UA'),
  ('static.education.div.003', 'ua', 'education', 'text', 'published', 'TR -> UA'),
  ('static.header.div.001.aria.label', 'tr', 'header', 'text', 'published', 'Bilgilendirme ve onay'),
  ('static.header.div.001.aria.label', 'ua', 'header', 'text', 'published', 'Bilgilendirme ve onay'),
  ('static.header.a.002', 'tr', 'header', 'text', 'published', 'TürkUA'),
  ('static.header.a.002', 'ua', 'header', 'text', 'published', 'TürkUA'),
  ('static.header.button.003.aria.label', 'tr', 'header', 'text', 'published', 'Menü'),
  ('static.header.button.003.aria.label', 'ua', 'header', 'text', 'published', 'Menü'),
  ('static.header.span.004', 'tr', 'header', 'text', 'published', 'CANLI'),
  ('static.header.span.004', 'ua', 'header', 'text', 'published', 'CANLI'),
  ('static.header.div.005', 'tr', 'header', 'text', 'published', '728 × 90 px'),
  ('static.header.div.005', 'ua', 'header', 'text', 'published', '728 × 90 px'),
  ('static.mobile.nav.button.001.aria.label', 'tr', 'mobile.nav', 'text', 'published', 'Dil degistir'),
  ('static.mobile.nav.button.001.aria.label', 'ua', 'mobile.nav', 'text', 'published', 'Dil degistir'),
  ('static.money.span.001', 'tr', 'money', 'text', 'published', 'Uyarı:'),
  ('static.money.span.001', 'ua', 'money', 'text', 'published', 'Uyarı:'),
  ('static.money.span.002', 'tr', 'money', 'text', 'published', 'Nakit'),
  ('static.money.span.002', 'ua', 'money', 'text', 'published', 'Nakit'),
  ('static.money.span.003', 'tr', 'money', 'text', 'published', '✓ OK'),
  ('static.money.span.003', 'ua', 'money', 'text', 'published', '✓ OK'),
  ('static.money.span.004', 'tr', 'money', 'text', 'published', 'Belge'),
  ('static.money.span.004', 'ua', 'money', 'text', 'published', 'Belge'),
  ('static.money.span.005', 'tr', 'money', 'text', 'published', 'Not:'),
  ('static.money.span.005', 'ua', 'money', 'text', 'published', 'Not:'),
  ('static.money.div.006', 'tr', 'money', 'text', 'published', 'Banka'),
  ('static.money.div.006', 'ua', 'money', 'text', 'published', 'Banka'),
  ('static.money.span.007', 'tr', 'money', 'text', 'published', 'Hızlı'),
  ('static.money.span.007', 'ua', 'money', 'text', 'published', 'Hızlı'),
  ('static.money.span.008', 'tr', 'money', 'text', 'published', 'Kart'),
  ('static.money.span.008', 'ua', 'money', 'text', 'published', 'Kart'),
  ('static.money.span.009', 'tr', 'money', 'text', 'published', 'Banka'),
  ('static.money.span.009', 'ua', 'money', 'text', 'published', 'Banka'),
  ('static.money.span.010', 'tr', 'money', 'text', 'published', 'SWIFT'),
  ('static.money.span.010', 'ua', 'money', 'text', 'published', 'SWIFT'),
  ('static.money.span.011', 'tr', 'money', 'text', 'published', 'PTT'),
  ('static.money.span.011', 'ua', 'money', 'text', 'published', 'PTT'),
  ('static.money.span.012', 'tr', 'money', 'text', 'published', 'OK'),
  ('static.money.span.012', 'ua', 'money', 'text', 'published', 'OK'),
  ('static.money.span.013', 'tr', 'money', 'text', 'published', 'Limit'),
  ('static.money.span.013', 'ua', 'money', 'text', 'published', 'Limit'),
  ('static.money.span.014', 'tr', 'money', 'text', 'published', 'TL → UAH'),
  ('static.money.span.014', 'ua', 'money', 'text', 'published', 'TL → UAH'),
  ('static.money.span.015', 'tr', 'money', 'text', 'published', 'UAH → TL'),
  ('static.money.span.015', 'ua', 'money', 'text', 'published', 'UAH → TL'),
  ('static.money.span.016', 'tr', 'money', 'text', 'published', 'USD → UAH'),
  ('static.money.span.016', 'ua', 'money', 'text', 'published', 'USD → UAH'),
  ('static.money.div.017', 'tr', 'money', 'text', 'published', 'Transfer'),
  ('static.money.div.017', 'ua', 'money', 'text', 'published', 'Transfer'),
  ('static.money.span.018', 'tr', 'money', 'text', 'published', 'Uyarı:'),
  ('static.money.span.018', 'ua', 'money', 'text', 'published', 'Uyarı:'),
  ('static.money.span.019', 'tr', 'money', 'text', 'published', 'Limitli'),
  ('static.money.span.019', 'ua', 'money', 'text', 'published', 'Limitli'),
  ('static.money.span.020', 'tr', 'money', 'text', 'published', 'Hızlı'),
  ('static.money.span.020', 'ua', 'money', 'text', 'published', 'Hızlı'),
  ('static.money.span.021', 'tr', 'money', 'text', 'published', 'Banka'),
  ('static.money.span.021', 'ua', 'money', 'text', 'published', 'Banka'),
  ('static.money.span.022', 'tr', 'money', 'text', 'published', 'Kart'),
  ('static.money.span.022', 'ua', 'money', 'text', 'published', 'Kart'),
  ('static.money.span.023', 'tr', 'money', 'text', 'published', 'Not:'),
  ('static.money.span.023', 'ua', 'money', 'text', 'published', 'Not:'),
  ('static.shop.span.001', 'tr', 'shop', 'text', 'published', 'TURKUA FIRST DROP'),
  ('static.shop.span.001', 'ua', 'shop', 'text', 'published', 'TURKUA FIRST DROP'),
  ('static.shop.span.002', 'tr', 'shop', 'text', 'published', '10 PIECE START'),
  ('static.shop.span.002', 'ua', 'shop', 'text', 'published', '10 PIECE START'),
  ('static.shop.span.003', 'tr', 'shop', 'text', 'published', 'TAMGA SERIES'),
  ('static.shop.span.003', 'ua', 'shop', 'text', 'published', 'TAMGA SERIES'),
  ('static.shop.span.004', 'tr', 'shop', 'text', 'published', 'PRE-ORDER MODE'),
  ('static.shop.span.004', 'ua', 'shop', 'text', 'published', 'PRE-ORDER MODE'),
  ('static.shop.span.005', 'tr', 'shop', 'text', 'published', 'TURKUA FIRST DROP'),
  ('static.shop.span.005', 'ua', 'shop', 'text', 'published', 'TURKUA FIRST DROP'),
  ('static.shop.span.006', 'tr', 'shop', 'text', 'published', '10 PIECE START'),
  ('static.shop.span.006', 'ua', 'shop', 'text', 'published', '10 PIECE START'),
  ('static.shop.span.007', 'tr', 'shop', 'text', 'published', 'TAMGA SERIES'),
  ('static.shop.span.007', 'ua', 'shop', 'text', 'published', 'TAMGA SERIES'),
  ('static.shop.span.008', 'tr', 'shop', 'text', 'published', 'PRE-ORDER MODE'),
  ('static.shop.span.008', 'ua', 'shop', 'text', 'published', 'PRE-ORDER MODE'),
  ('static.shop.div.009.aria.label', 'tr', 'shop', 'text', 'published', 'TURKUA tamga logo'),
  ('static.shop.div.009.aria.label', 'ua', 'shop', 'text', 'published', 'TURKUA tamga logo'),
  ('static.shop.strong.010', 'tr', 'shop', 'text', 'published', '0 TL'),
  ('static.shop.strong.010', 'ua', 'shop', 'text', 'published', '0 TL'),
  ('static.shop.input.011.placeholder', 'tr', 'shop', 'text', 'published', 'Ad Soyad / Ім''я'),
  ('static.shop.input.011.placeholder', 'ua', 'shop', 'text', 'published', 'Ad Soyad / Ім''я'),
  ('static.shop.input.012.placeholder', 'tr', 'shop', 'text', 'published', 'Telefon veya e-posta / Телефон або e-mail'),
  ('static.shop.input.012.placeholder', 'ua', 'shop', 'text', 'published', 'Telefon veya e-posta / Телефон або e-mail'),
  ('static.shop.textarea.013.placeholder', 'tr', 'shop', 'text', 'published', 'Beden, renk, teslimat notu / Розмір, колір, доставка'),
  ('static.shop.textarea.013.placeholder', 'ua', 'shop', 'text', 'published', 'Beden, renk, teslimat notu / Розмір, колір, доставка'),
  ('static.trade.div.001', 'tr', 'trade', 'text', 'published', '$7.5B'),
  ('static.trade.div.001', 'ua', 'trade', 'text', 'published', '$7.5B'),
  ('static.trade.div.002', 'tr', 'trade', 'text', 'published', '$10B'),
  ('static.trade.div.002', 'ua', 'trade', 'text', 'published', '$10B'),
  ('static.trade.div.003', 'tr', 'trade', 'text', 'published', '4 Eki'),
  ('static.trade.div.003', 'ua', 'trade', 'text', 'published', '4 Eki'),
  ('static.trade.div.004', 'tr', 'trade', 'text', 'published', 'STA'),
  ('static.trade.div.004', 'ua', 'trade', 'text', 'published', 'STA'),
  ('static.trade.div.005', 'tr', 'trade', 'text', 'published', 'Sektör'),
  ('static.trade.div.005', 'ua', 'trade', 'text', 'published', 'Sektör'),
  ('static.trade.span.006', 'tr', 'trade', 'text', 'published', 'Tekstil'),
  ('static.trade.span.006', 'ua', 'trade', 'text', 'published', 'Tekstil'),
  ('static.trade.span.007', 'tr', 'trade', 'text', 'published', 'Otomotiv'),
  ('static.trade.span.007', 'ua', 'trade', 'text', 'published', 'Otomotiv'),
  ('static.trade.span.008', 'tr', 'trade', 'text', 'published', 'Tarım'),
  ('static.trade.span.008', 'ua', 'trade', 'text', 'published', 'Tarım'),
  ('static.trade.span.009', 'tr', 'trade', 'text', 'published', 'Makina'),
  ('static.trade.span.009', 'ua', 'trade', 'text', 'published', 'Makina'),
  ('static.trade.span.010', 'tr', 'trade', 'text', 'published', 'Kimya'),
  ('static.trade.span.010', 'ua', 'trade', 'text', 'published', 'Kimya'),
  ('static.trade.span.011', 'tr', 'trade', 'text', 'published', 'İnşaat'),
  ('static.trade.span.011', 'ua', 'trade', 'text', 'published', 'İnşaat'),
  ('static.trade.div.012', 'tr', 'trade', 'text', 'published', 'Not:'),
  ('static.trade.div.012', 'ua', 'trade', 'text', 'published', 'Not:'),
  ('static.visa.div.001', 'tr', 'visa', 'text', 'published', 'TR / UA'),
  ('static.visa.div.001', 'ua', 'visa', 'text', 'published', 'TR / UA'),
  ('static.visa.div.002', 'tr', 'visa', 'text', 'published', 'UA -> TR'),
  ('static.visa.div.002', 'ua', 'visa', 'text', 'published', 'UA -> TR'),
  ('static.visa.div.003', 'tr', 'visa', 'text', 'published', 'TR -> UA'),
  ('static.visa.div.003', 'ua', 'visa', 'text', 'published', 'TR -> UA'),
  ('static.footer.brand', 'tr', 'footer', 'text', 'published', 'TürkUA  ·  '),
  ('static.footer.brand', 'ua', 'footer', 'text', 'published', 'TürkUA  ·  '),
  ('static.money.rate.prefix', 'tr', 'money', 'text', 'published', 'Kur '),
  ('static.money.rate.prefix', 'ua', 'money', 'text', 'published', 'Курс '),
  ('static.contact.whatsapp', 'tr', 'contact', 'text', 'published', ' WhatsApp'),
  ('static.contact.whatsapp', 'ua', 'contact', 'text', 'published', ' WhatsApp'),
  ('static.contact.viber', 'tr', 'contact', 'text', 'published', ' Viber'),
  ('static.contact.viber', 'ua', 'contact', 'text', 'published', ' Viber'),
  ('site.meta.title', 'tr', 'site', 'text', 'published', 'TürkUA — Türkiye & Ukrayna Bilgi Merkezi'),
  ('site.meta.title', 'ua', 'site', 'text', 'published', 'TürkUA — Інформаційний центр Туреччини та України'),
  ('site.meta.description', 'tr', 'site', 'text', 'published', 'Ukrayna-Rusya savaşı bitiş olasılığı takibi, Türkiye-Ukrayna üniversite, vize ve ticaret rehberi.'),
  ('site.meta.description', 'ua', 'site', 'text', 'published', 'Моніторинг війни Росії проти України та довідник з освіти, віз і торгівлі між Україною й Туреччиною.'),
  ('site.meta.keywords', 'tr', 'site', 'text', 'published', 'ukrayna rusya savaş, türkiye ukrayna vize, ukrayna üniversite, türkiye ukrayna ticaret, STA'),
  ('site.meta.keywords', 'ua', 'site', 'text', 'published', 'україна росія війна, туреччина україна віза, університет, торгівля'),
  ('site.meta.appTitle', 'tr', 'site', 'text', 'published', 'TürkUA'),
  ('site.meta.appTitle', 'ua', 'site', 'text', 'published', 'TürkUA')
on conflict (content_key, locale) do update set
  section = excluded.section,
  content_type = excluded.content_type,
  status = excluded.status,
  value = excluded.value,
  updated_at = now();

-- ============================================================================
-- SOURCE: 20260629_content_management.sql
-- ============================================================================
-- TürkUA news, advertising and media management.
-- Run after the i18n migrations.

create table if not exists public.news_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]+$'),
  sort_order integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.news_category_localizations (
  category_id uuid not null references public.news_categories(id) on delete cascade,
  locale text not null references public.languages(code) on update cascade on delete restrict,
  name text not null,
  primary key (category_id, locale)
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  category_id uuid not null references public.news_categories(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published')),
  image_path text,
  image_url text,
  source_url text,
  published_at timestamptz,
  is_featured boolean not null default false,
  is_live boolean not null default false,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_localizations (
  news_id uuid not null references public.news(id) on delete cascade,
  locale text not null references public.languages(code) on update cascade on delete restrict,
  title text not null default '',
  summary text not null default '',
  body text not null default '',
  primary key (news_id, locale)
);

create table if not exists public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9_-]+$'),
  slot_type text not null check (slot_type in ('banner', 'sidebar', 'popup', 'sponsor', 'leaderboard')),
  name text not null,
  width integer,
  height integer,
  sort_order integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.ad_slots(id) on delete restrict,
  name text not null,
  headline text not null default '',
  image_path text,
  image_url text,
  target_url text,
  alt_text text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default false,
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.ad_daily_stats (
  ad_id uuid not null references public.ads(id) on delete cascade,
  stat_date date not null default current_date,
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  primary key (ad_id, stat_date)
);

create index if not exists news_publication_idx on public.news (status, published_at desc);
create index if not exists news_category_idx on public.news (category_id);
create index if not exists ads_schedule_idx on public.ads (is_active, starts_at, ends_at);
create index if not exists ad_daily_stats_date_idx on public.ad_daily_stats (stat_date desc);

drop trigger if exists set_news_updated_at on public.news;
create trigger set_news_updated_at before update on public.news
for each row execute function public.set_updated_at();

drop trigger if exists set_ads_updated_at on public.ads;
create trigger set_ads_updated_at before update on public.ads
for each row execute function public.set_updated_at();

alter table public.news_categories enable row level security;
alter table public.news_category_localizations enable row level security;
alter table public.news enable row level security;
alter table public.news_localizations enable row level security;
alter table public.ad_slots enable row level security;
alter table public.ads enable row level security;
alter table public.ad_daily_stats enable row level security;

drop policy if exists "Public reads enabled news categories" on public.news_categories;
create policy "Public reads enabled news categories" on public.news_categories
for select using (enabled or public.is_admin());

drop policy if exists "Public reads category localizations" on public.news_category_localizations;
create policy "Public reads category localizations" on public.news_category_localizations
for select using (
  public.is_admin() or exists (
    select 1 from public.news_categories category
    where category.id = category_id and category.enabled
  )
);

drop policy if exists "Public reads published news" on public.news;
create policy "Public reads published news" on public.news
for select using (
  public.is_admin() or (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  )
);

drop policy if exists "Public reads published news localizations" on public.news_localizations;
create policy "Public reads published news localizations" on public.news_localizations
for select using (
  public.is_admin() or exists (
    select 1 from public.news item
    where item.id = news_id
      and item.status = 'published'
      and item.published_at is not null
      and item.published_at <= now()
  )
);

drop policy if exists "Admins manage news categories" on public.news_categories;
create policy "Admins manage news categories" on public.news_categories
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage category localizations" on public.news_category_localizations;
create policy "Admins manage category localizations" on public.news_category_localizations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage news" on public.news;
create policy "Admins manage news" on public.news
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage news localizations" on public.news_localizations;
create policy "Admins manage news localizations" on public.news_localizations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads enabled ad slots" on public.ad_slots;
create policy "Public reads enabled ad slots" on public.ad_slots
for select using (enabled or public.is_admin());

drop policy if exists "Public reads scheduled ads" on public.ads;
create policy "Public reads scheduled ads" on public.ads
for select using (
  public.is_admin() or (
    is_active
    and starts_at <= now()
    and ends_at > now()
  )
);

drop policy if exists "Admins manage ad slots" on public.ad_slots;
create policy "Admins manage ad slots" on public.ad_slots
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage ads" on public.ads;
create policy "Admins manage ads" on public.ads
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read ad statistics" on public.ad_daily_stats;
create policy "Admins read ad statistics" on public.ad_daily_stats
for select using (public.is_admin());

create or replace function public.record_ad_event(p_ad_id uuid, p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event not in ('impression', 'click') then
    raise exception 'Unsupported advertising event';
  end if;

  if not exists (
    select 1 from public.ads
    where id = p_ad_id
      and is_active
      and starts_at <= now()
      and ends_at > now()
  ) then
    return;
  end if;

  update public.ads
  set impressions = impressions + case when p_event = 'impression' then 1 else 0 end,
      clicks = clicks + case when p_event = 'click' then 1 else 0 end
  where id = p_ad_id;

  insert into public.ad_daily_stats (ad_id, stat_date, impressions, clicks)
  values (
    p_ad_id,
    current_date,
    case when p_event = 'impression' then 1 else 0 end,
    case when p_event = 'click' then 1 else 0 end
  )
  on conflict (ad_id, stat_date) do update
  set impressions = public.ad_daily_stats.impressions + excluded.impressions,
      clicks = public.ad_daily_stats.clicks + excluded.clicks;
end;
$$;

revoke all on function public.record_ad_event(uuid, text) from public;
grant execute on function public.record_ad_event(uuid, text) to anon, authenticated;

insert into public.news_categories (code, sort_order) values
  ('general', 10),
  ('military', 20),
  ('diplomatic', 30),
  ('economic', 40),
  ('humanitarian', 50),
  ('education', 60),
  ('visa', 70),
  ('trade', 80)
on conflict (code) do update set sort_order = excluded.sort_order;

insert into public.news_category_localizations (category_id, locale, name)
select category.id, seed.locale, seed.name
from public.news_categories category
join (values
  ('general', 'tr', 'Gündem'), ('general', 'ua', 'Новини'),
  ('military', 'tr', 'Askeri'), ('military', 'ua', 'Військове'),
  ('diplomatic', 'tr', 'Diplomasi'), ('diplomatic', 'ua', 'Дипломатія'),
  ('economic', 'tr', 'Ekonomi'), ('economic', 'ua', 'Економіка'),
  ('humanitarian', 'tr', 'İnsani'), ('humanitarian', 'ua', 'Гуманітарне'),
  ('education', 'tr', 'Eğitim'), ('education', 'ua', 'Освіта'),
  ('visa', 'tr', 'Vize'), ('visa', 'ua', 'Віза'),
  ('trade', 'tr', 'Ticaret'), ('trade', 'ua', 'Торгівля')
) as seed(code, locale, name) on seed.code = category.code
on conflict (category_id, locale) do update set name = excluded.name;

insert into public.ad_slots (code, slot_type, name, width, height, sort_order) values
  ('top', 'leaderboard', 'Üst LeaderBoard', 728, 90, 10),
  ('midLeft', 'banner', 'Orta Sol Banner', 300, 250, 20),
  ('midRight', 'banner', 'Orta Sağ Banner', 300, 250, 30),
  ('sidebar', 'sidebar', 'Sabit Sidebar', 300, 600, 40),
  ('popup', 'popup', 'Popup', 600, 500, 50),
  ('sponsor1', 'sponsor', 'Sponsor Alanı 1', 360, 180, 60),
  ('sponsor2', 'sponsor', 'Sponsor Alanı 2', 360, 180, 70),
  ('sponsor3', 'sponsor', 'Sponsor Alanı 3', 360, 180, 80)
on conflict (code) do update set
  slot_type = excluded.slot_type,
  name = excluded.name,
  width = excluded.width,
  height = excluded.height,
  sort_order = excluded.sort_order;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('ads', 'ads', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins upload media" on storage.objects;
create policy "Admins upload media" on storage.objects
for insert to authenticated with check (
  bucket_id in ('media', 'ads') and public.is_admin()
);

drop policy if exists "Admins update media" on storage.objects;
create policy "Admins update media" on storage.objects
for update to authenticated using (
  bucket_id in ('media', 'ads') and public.is_admin()
) with check (
  bucket_id in ('media', 'ads') and public.is_admin()
);

drop policy if exists "Admins delete media" on storage.objects;
create policy "Admins delete media" on storage.objects
for delete to authenticated using (
  bucket_id in ('media', 'ads') and public.is_admin()
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'news'
  ) then
    alter publication supabase_realtime add table public.news;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'news_localizations'
  ) then
    alter publication supabase_realtime add table public.news_localizations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ads'
  ) then
    alter publication supabase_realtime add table public.ads;
  end if;
end
$$;

-- ============================================================================
-- SOURCE: 20260629_contact_system.sql
-- ============================================================================
-- TürkUA contact, application, spam protection and rate limiting.
-- Run after the i18n and content-management migrations.

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('contact', 'advertising', 'shop')),
  locale text not null default 'tr',
  name text not null,
  email text,
  phone text,
  subject text not null default '',
  message text not null default '',
  details jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'read', 'closed', 'spam')),
  attachment_path text,
  attachment_name text,
  telegram_notified boolean not null default false,
  telegram_error text,
  internal_notes text not null default '',
  ip_hash text not null,
  dedupe_hash text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submission_rate_limits (
  key_hash text not null,
  form_type text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (key_hash, form_type)
);

create index if not exists submissions_status_date_idx
on public.submissions (status, created_at desc);

create index if not exists submissions_type_date_idx
on public.submissions (form_type, created_at desc);

create index if not exists submissions_dedupe_idx
on public.submissions (dedupe_hash, created_at desc);

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at before update on public.submissions
for each row execute function public.set_updated_at();

alter table public.submissions enable row level security;
alter table public.submission_rate_limits enable row level security;

drop policy if exists "Admins manage submissions" on public.submissions;
create policy "Admins manage submissions" on public.submissions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins inspect submission rate limits" on public.submission_rate_limits;
create policy "Admins inspect submission rate limits" on public.submission_rate_limits
for select using (public.is_admin());

create or replace function public.create_public_submission(
  p_form_type text,
  p_locale text,
  p_name text,
  p_email text,
  p_phone text,
  p_subject text,
  p_message text,
  p_details jsonb,
  p_ip_hash text,
  p_dedupe_hash text,
  p_user_agent text,
  p_rate_limit integer
)
returns table (submission_id uuid, accepted boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  created_id uuid;
begin
  if p_form_type not in ('contact', 'advertising', 'shop') then
    return query select null::uuid, false, 'invalid_form';
    return;
  end if;

  if random() < 0.02 then
    delete from public.submission_rate_limits
    where updated_at < now() - interval '7 days';
  end if;

  insert into public.submission_rate_limits (
    key_hash, form_type, window_started_at, request_count, updated_at
  ) values (
    p_ip_hash, p_form_type, now(), 1, now()
  )
  on conflict (key_hash, form_type) do update set
    request_count = case
      when public.submission_rate_limits.window_started_at <= now() - interval '1 hour' then 1
      else public.submission_rate_limits.request_count + 1
    end,
    window_started_at = case
      when public.submission_rate_limits.window_started_at <= now() - interval '1 hour' then now()
      else public.submission_rate_limits.window_started_at
    end,
    updated_at = now()
  returning request_count into current_count;

  if current_count > greatest(1, least(p_rate_limit, 20)) then
    return query select null::uuid, false, 'rate_limited';
    return;
  end if;

  if exists (
    select 1 from public.submissions
    where dedupe_hash = p_dedupe_hash
      and created_at > now() - interval '15 minutes'
  ) then
    return query select null::uuid, false, 'duplicate';
    return;
  end if;

  insert into public.submissions (
    form_type, locale, name, email, phone, subject, message, details,
    ip_hash, dedupe_hash, user_agent
  ) values (
    p_form_type,
    left(coalesce(nullif(p_locale, ''), 'tr'), 10),
    left(trim(p_name), 120),
    nullif(left(trim(coalesce(p_email, '')), 180), ''),
    nullif(left(trim(coalesce(p_phone, '')), 80), ''),
    left(trim(coalesce(p_subject, '')), 180),
    left(trim(coalesce(p_message, '')), 5000),
    coalesce(p_details, '{}'::jsonb),
    p_ip_hash,
    p_dedupe_hash,
    left(coalesce(p_user_agent, ''), 500)
  )
  returning id into created_id;

  return query select created_id, true, 'accepted';
end;
$$;

revoke all on function public.create_public_submission(
  text, text, text, text, text, text, text, jsonb, text, text, text, integer
) from public;

grant execute on function public.create_public_submission(
  text, text, text, text, text, text, text, jsonb, text, text, text, integer
) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins read submission files" on storage.objects;
create policy "Admins read submission files" on storage.objects
for select to authenticated using (
  bucket_id = 'submissions' and public.is_admin()
);

drop policy if exists "Admins delete submission files" on storage.objects;
create policy "Admins delete submission files" on storage.objects
for delete to authenticated using (
  bucket_id = 'submissions' and public.is_admin()
);

insert into public.translations (content_key, locale, section, content_type, status, value) values
  ('submission.success', 'tr', 'contact', 'text', 'published', 'Başvurunuz alındı. En kısa sürede dönüş yapacağız.'),
  ('submission.success', 'ua', 'contact', 'text', 'published', 'Вашу заявку отримано. Ми зв''яжемося з вами найближчим часом.'),
  ('submission.rateLimited', 'tr', 'contact', 'text', 'published', 'Çok kısa sürede fazla başvuru yapıldı. Lütfen daha sonra tekrar deneyin.'),
  ('submission.rateLimited', 'ua', 'contact', 'text', 'published', 'Забагато заявок за короткий час. Спробуйте пізніше.'),
  ('submission.duplicate', 'tr', 'contact', 'text', 'published', 'Bu başvuru kısa süre önce alındı.'),
  ('submission.duplicate', 'ua', 'contact', 'text', 'published', 'Цю заявку вже було отримано нещодавно.'),
  ('submission.error', 'tr', 'contact', 'text', 'published', 'Başvuru gönderilemedi. Lütfen daha sonra tekrar deneyin.'),
  ('submission.error', 'ua', 'contact', 'text', 'published', 'Не вдалося надіслати заявку. Спробуйте пізніше.')
on conflict (content_key, locale) do update set
  value = excluded.value,
  status = excluded.status,
  updated_at = now();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end
$$;

-- ============================================================================
-- SOURCE: 20260701_cms_data_model.sql
-- ============================================================================
-- TurkUA CMS phase 2 data model.
-- Run after the 20260629 migrations. Existing frontend tables remain unchanged.

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_name text not null default 'media',
  object_path text not null,
  public_url text,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text not null default '',
  caption text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_name, object_path)
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique check (setting_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  value jsonb not null default '{}'::jsonb,
  description text not null default '',
  is_public boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null default 'main' check (content_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  locale text not null references public.languages(code) on update cascade on delete restrict,
  eyebrow text not null default '',
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  primary_action_label text not null default '',
  primary_action_url text,
  secondary_action_label text not null default '',
  secondary_action_url text,
  background_media_id uuid references public.media_assets(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_key, locale)
);

create table if not exists public.news_items (
  id uuid primary key default gen_random_uuid(),
  legacy_news_id uuid references public.news(id) on delete set null,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  locale text not null references public.languages(code) on update cascade on delete restrict,
  category_code text not null default 'general',
  title text not null default '',
  summary text not null default '',
  body text not null default '',
  media_asset_id uuid references public.media_assets(id) on delete set null,
  source_url text,
  status text not null default 'draft' check (status in ('draft', 'review', 'published')),
  published_at timestamptz,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, locale),
  unique (legacy_news_id, locale)
);

create table if not exists public.tracker_data (
  id uuid primary key default gen_random_uuid(),
  dataset_key text not null default 'current' check (dataset_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  probability_1d numeric(5, 2) not null default 0 check (probability_1d between 0 and 100),
  probability_1m numeric(5, 2) not null default 0 check (probability_1m between 0 and 100),
  probability_1y numeric(5, 2) not null default 0 check (probability_1y between 0 and 100),
  confidence smallint not null default 0 check (confidence between 0 and 5),
  trend_percent numeric(6, 2) not null default 0,
  war_status_key text not null default '',
  negotiation_status_key text not null default '',
  trend_key text not null default '',
  reasoning_key text not null default '',
  developments jsonb not null default '[]'::jsonb check (jsonb_typeof(developments) = 'array'),
  news_items jsonb not null default '[]'::jsonb check (jsonb_typeof(news_items) = 'array'),
  observed_at timestamptz not null default now(),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.section_cards (
  id uuid primary key default gen_random_uuid(),
  section_key text not null check (section_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  card_key text not null check (card_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  locale text not null references public.languages(code) on update cascade on delete restrict,
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  badge text not null default '',
  icon_name text not null default '',
  action_label text not null default '',
  action_url text,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_key, card_key, locale)
);

create table if not exists public.sponsored_ads (
  id uuid primary key default gen_random_uuid(),
  legacy_ad_id uuid references public.ads(id) on delete set null,
  campaign_key text not null check (campaign_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  slot_code text not null,
  locale text not null references public.languages(code) on update cascade on delete restrict,
  advertiser_name text not null default '',
  title text not null default '',
  body text not null default '',
  media_asset_id uuid references public.media_assets(id) on delete set null,
  target_url text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_active boolean not null default false,
  sort_order integer not null default 100,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_key, locale),
  unique (legacy_ad_id, locale),
  check (end_date > start_date)
);

create table if not exists public.contact_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null default 'main' check (setting_key ~ '^[a-z0-9][a-z0-9._-]*$'),
  locale text not null references public.languages(code) on update cascade on delete restrict,
  email text,
  phone text,
  whatsapp text,
  telegram text,
  address text not null default '',
  working_hours text not null default '',
  form_enabled boolean not null default true,
  response_time_text text not null default '',
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (setting_key, locale)
);

create index if not exists media_assets_active_order_idx
on public.media_assets (is_active, sort_order);

create index if not exists site_settings_public_order_idx
on public.site_settings (is_public, is_active, sort_order);

create index if not exists hero_content_locale_order_idx
on public.hero_content (locale, is_active, sort_order);

create index if not exists news_items_publication_idx
on public.news_items (locale, status, is_active, is_featured, published_at desc);

create index if not exists tracker_data_current_idx
on public.tracker_data (dataset_key, is_active, observed_at desc);

create index if not exists section_cards_section_order_idx
on public.section_cards (section_key, locale, is_active, sort_order);

create index if not exists sponsored_ads_schedule_idx
on public.sponsored_ads (slot_code, locale, is_active, start_date, end_date);

create index if not exists contact_settings_locale_order_idx
on public.contact_settings (locale, is_active, sort_order);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'media_assets',
    'site_settings',
    'hero_content',
    'news_items',
    'tracker_data',
    'section_cards',
    'sponsored_ads',
    'contact_settings'
  ]
  loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format(
      'create trigger %I before update on public.%I ' ||
      'for each row execute function public.set_updated_at()',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end
$$;

drop policy if exists "Public reads active media metadata" on public.media_assets;
create policy "Public reads active media metadata" on public.media_assets
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage media metadata" on public.media_assets;
create policy "Admins manage media metadata" on public.media_assets
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads public site settings" on public.site_settings;
create policy "Public reads public site settings" on public.site_settings
for select using ((is_public and is_active) or public.is_admin());
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active hero content" on public.hero_content;
create policy "Public reads active hero content" on public.hero_content
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage hero content" on public.hero_content;
create policy "Admins manage hero content" on public.hero_content
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads published news items" on public.news_items;
create policy "Public reads published news items" on public.news_items
for select using (
  public.is_admin() or (
    is_active
    and status = 'published'
    and published_at is not null
    and published_at <= now()
  )
);
drop policy if exists "Admins manage news items" on public.news_items;
create policy "Admins manage news items" on public.news_items
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active tracker data" on public.tracker_data;
create policy "Public reads active tracker data" on public.tracker_data
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage tracker data" on public.tracker_data;
create policy "Admins manage tracker data" on public.tracker_data
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active section cards" on public.section_cards;
create policy "Public reads active section cards" on public.section_cards
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage section cards" on public.section_cards;
create policy "Admins manage section cards" on public.section_cards
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads scheduled sponsored ads" on public.sponsored_ads;
create policy "Public reads scheduled sponsored ads" on public.sponsored_ads
for select using (
  public.is_admin() or (
    is_active
    and start_date <= now()
    and end_date > now()
  )
);
drop policy if exists "Admins manage sponsored ads" on public.sponsored_ads;
create policy "Admins manage sponsored ads" on public.sponsored_ads
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active contact settings" on public.contact_settings;
create policy "Public reads active contact settings" on public.contact_settings
for select using (is_active or public.is_admin());
drop policy if exists "Admins manage contact settings" on public.contact_settings;
create policy "Admins manage contact settings" on public.contact_settings
for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.replace_media_asset_references(
  p_old_media_id uuid,
  p_new_media_id uuid,
  p_old_object_path text,
  p_new_object_path text,
  p_new_public_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator permission is required';
  end if;

  update public.hero_content
  set background_media_id = p_new_media_id
  where background_media_id = p_old_media_id;

  update public.news_items
  set media_asset_id = p_new_media_id
  where media_asset_id = p_old_media_id;

  update public.section_cards
  set media_asset_id = p_new_media_id
  where media_asset_id = p_old_media_id;

  update public.sponsored_ads
  set media_asset_id = p_new_media_id
  where media_asset_id = p_old_media_id;

  update public.news
  set image_path = p_new_object_path,
      image_url = p_new_public_url
  where image_path = p_old_object_path;

  update public.ads
  set image_path = p_new_object_path,
      image_url = p_new_public_url
  where image_path = p_old_object_path;
end;
$$;

revoke all on function public.replace_media_asset_references(
  uuid, uuid, text, text, text
) from public;
grant execute on function public.replace_media_asset_references(
  uuid, uuid, text, text, text
) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_settings',
    'hero_content',
    'news_items',
    'tracker_data',
    'section_cards',
    'sponsored_ads',
    'contact_settings',
    'media_assets'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;

commit;
