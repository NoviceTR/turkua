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
