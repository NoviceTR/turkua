# TurkUA Deployment

## Local Release

```bash
pnpm install --frozen-lockfile
pnpm release
pnpm check
```

Yayınlanacak tek klasör `dist/` klasörüdür. Yerel kontrol:

```bash
python3 -m http.server 8080 --directory dist
```

Ardından `http://127.0.0.1:8080/` adresini açın.

## GitHub Pages

1. Projeyi GitHub repository'sine gönderin.
2. Repository içinde **Settings > Pages > Build and deployment** bölümünden
   kaynak olarak **GitHub Actions** seçin.
3. Tam Supabase özellikleri kullanılacaksa **Settings > Secrets and variables
   > Actions > Variables** altında `SUPABASE_URL` ve
   `SUPABASE_PUBLISHABLE_KEY` değişkenlerini ekleyin.
4. `main` branch'ine push yapın veya **Actions > Deploy GitHub Pages >
   Run workflow** komutunu çalıştırın.
5. Workflow, doğrulanmış `dist/` klasörünü GitHub Pages artifact'i olarak
   yayınlar.

`CNAME` dosyası `www.turkua.net` alan adına ayarlıdır. GitHub'ın varsayılan
`github.io` adresi kullanılacaksa `CNAME` dosyasını kaldırın. Özel alan adı
kullanılacaksa GitHub Pages ayarlarında aynı alan adını tanımlayıp DNS
kayıtlarını tamamlayın.
