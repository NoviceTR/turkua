#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TürkUA Otomatik Haber Güncelleyici
Haberleri tarar → Groq analiz eder → data.js oluşturur → GitHub'a yükler
"""

import subprocess, sys, os, re
from datetime import datetime
from urllib.request import urlopen, Request
import html

G="\033[92m"; Y="\033[93m"; B="\033[94m"; C="\033[96m"; W="\033[0m"; BOLD="\033[1m"; R="\033[91m"
def ok(m): print(f"{G}✅ {m}{W}")
def warn(m): print(f"{Y}⚠️  {m}{W}")
def err(m): print(f"{R}❌ {m}{W}")
def info(m): print(f"{C}ℹ️  {m}{W}")

def install(pkg):
    subprocess.check_call([sys.executable,"-m","pip","install",pkg,"-q"])

def ensure_deps():
    info("Kütüphaneler kontrol ediliyor...")
    for pkg in ["feedparser","groq"]:
        try:
            __import__(pkg)
        except ImportError:
            warn(f"{pkg} yükleniyor...")
            install(pkg)
    ok("Kütüphaneler hazır")

SOURCES = [
    {"name":"Ukrinform","url":"https://www.ukrinform.net/rss/block-lastnews"},
    {"name":"BBC Ukraine","url":"https://feeds.bbci.co.uk/news/world/europe/rss.xml"},
    {"name":"Al Jazeera","url":"https://www.aljazeera.com/xml/rss/all.xml"},
    {"name":"DW Ukraine","url":"https://rss.dw.com/rdf/rss-en-all"},
    {"name":"Euromaidan","url":"https://euromaidanpress.com/feed/"},
]

KEYWORDS = [
    "ukraine","russia","zelensky","zelenskyy","putin","kyiv","donbas",
    "donetsk","kharkiv","odesa","crimea","nato","ukrayna","rusya",
    "savaş","ateşkes","barış","cephe","war","ceasefire","peace"
]

def clean(text):
    text = re.sub(r'<[^>]+>','',text)
    text = html.unescape(text)
    return re.sub(r'\s+',' ',text).strip()[:400]

def fetch_rss(source):
    import feedparser
    try:
        req = Request(source["url"], headers={"User-Agent":"Mozilla/5.0"})
        feed = feedparser.parse(urlopen(req,timeout=10).read())
        out = []
        for e in feed.entries[:15]:
            t = e.get("title","")
            s = clean(e.get("summary",e.get("description","")))
            if any(k in (t+s).lower() for k in KEYWORDS):
                out.append({"source":source["name"],"title":t,"summary":s})
        return out
    except Exception as ex:
        warn(f"{source['name']} okunamadı: {ex}")
        return []

def collect_news():
    print(f"\n{BOLD}📡 Haberler toplanıyor...{W}")
    all_a = []
    for s in SOURCES:
        info(f"  {s['name']} taranıyor...")
        a = fetch_rss(s)
        all_a.extend(a)
        ok(f"  {s['name']}: {len(a)} haber")
    print(f"\nToplam: {B}{len(all_a)}{W} haber bulundu")
    return all_a

def call_groq(articles, api_key):
    from groq import Groq
    client = Groq(api_key=api_key)
    print(f"\n{BOLD}🤖 Groq haberleri analiz ediyor...{W}")

    today = datetime.now().strftime("%-d %B %Y")
    now_iso = datetime.now().strftime("%Y-%m-%dT%H:%M:00")

    articles_text = "\n".join([
        f"- {a['title']} — {a['summary'][:200]}"
        for a in articles[:20]
    ])

    prompt = f"""Sen TürkUA sitesi için data.js dosyası oluşturuyorsun.
Bugün: {today}

KURALLAR:
- Hiçbir marka adı, kuruluş adı, site adı, URL, kaynak adı YAZMA
- ISW, BBC, Reuters, Ukrinform, Al Jazeera, DW gibi isimler KESİNLİKLE yazma
- Haberleri kendi cümlelenle yeniden yaz, alıntı yapma
- Tüm metinleri hem Türkçe (tr) hem Ukraynaca (ua) yaz
- SADECE JavaScript kodu yaz, başka hiçbir şey yazma
- Kod bloku işareti kullanma

HABERLER:
{articles_text}

TAM OLARAK BU FORMATTA YAZ:

// ============================================================
// DATA.JS — TürkUA Savaş Takip Verileri
// Son Güncelleme: {today}
// ============================================================
// DATA_START
window.WAR_DATA = {{
  "prob1d": SAYI,
  "prob1m": SAYI,
  "prob1y": SAYI,
  "confidence": 3,
  "lastUpdate": "{now_iso}",
  "trendPct": SAYI,
  "statusSavas": {{"tr": "AKTİF", "ua": "АКТИВНА"}},
  "statusMuzakere": {{"tr": "DURUM_YAZ", "ua": "UKRAYNACA_YAZ"}},
  "trend": {{"tr": "...", "ua": "..."}},
  "label1d": {{"tr": "...", "ua": "..."}},
  "label1m": {{"tr": "...", "ua": "..."}},
  "label1y": {{"tr": "...", "ua": "..."}},
  "reasoning": {{"tr": "...", "ua": "..."}},
  "developments": [
    {{
      "date": {{"tr": "GÜN AY YIL", "ua": "UKRAYNACA TARİH"}},
      "text": {{"tr": "...", "ua": "..."}},
      "impact": -2,
      "type": "negative"
    }}
  ],
  "newsItems": [
    {{
      "category": "military",
      "date": {{"tr": "...", "ua": "..."}},
      "title": {{"tr": "...", "ua": "..."}},
      "body": {{"tr": "...", "ua": "..."}},
      "impact": 1,
      "type": "positive"
    }}
  ],
  "gundemLastUpdate": "{now_iso}"
}};
// DATA_END"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role":"user","content":prompt}],
        max_tokens=4000,
        temperature=0.3
    )
    return response.choices[0].message.content

def save_and_push(code, repo_path):
    code = re.sub(r'```javascript\n?|```js\n?|```\n?','',code).strip()
    data_path = os.path.join(repo_path,"data.js")
    with open(data_path,'w',encoding='utf-8') as f:
        f.write(code)
    ok("data.js kaydedildi")

    print(f"\n{BOLD}🚀 GitHub'a gönderiliyor...{W}")
    today_str = datetime.now().strftime("%d.%m.%Y %H:%M")
    for cmd in [
        ["git","-C",repo_path,"add","data.js"],
        ["git","-C",repo_path,"commit","-m",f"Otomatik güncelleme - {today_str}"],
        ["git","-C",repo_path,"push","origin","main"]
    ]:
        r = subprocess.run(cmd,capture_output=True,text=True)
        if "nothing to commit" in r.stdout+r.stderr:
            warn("Değişiklik yok, push atlandı")
            return
    ok("Site başarıyla güncellendi!")

def main():
    os.system('clear')
    print(f"""
{BOLD}{B}╔══════════════════════════════════════╗
║   TürkUA Otomatik Haber Güncelleyici  ║
║   Powered by Groq (Ücretsiz)          ║
╚══════════════════════════════════════╝{W}
""")
    ensure_deps()

    api_key = os.environ.get("GROQ_API_KEY","")
    if not api_key:
        print(f"\n{Y}Groq API anahtarı gerekli.{W}")
        api_key = input("API anahtarını gir: ").strip()
        if not api_key:
            err("API anahtarı olmadan devam edilemez.")
            sys.exit(1)

    repo_path = os.path.expanduser("~/Documents/turkua")
    if not os.path.exists(repo_path):
        err(f"Repo bulunamadı: {repo_path}")
        sys.exit(1)
    ok(f"Repo: {repo_path}")

    articles = collect_news()
    if not articles:
        err("Hiç haber bulunamadı!")
        sys.exit(1)

    code = call_groq(articles, api_key)
    ok("Analiz tamamlandı")

    save_and_push(code, repo_path)

    print(f"""
{BOLD}{G}══════════════════════════════════════
  Tamamlandı! turkua.net güncellendi.
══════════════════════════════════════{W}
""")

if __name__ == "__main__":
    main()
