#!/bin/bash
# TürkUA Otomatik Güncelleyici - Mac'te çift tıkla çalışır

cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   TürkUA Otomatik Güncelleyici       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Python kontrolü
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 bulunamadı. Yükleniyor..."
    brew install python3
fi

# Script'i çalıştır
python3 "$(dirname "$0")/turkua_updater.py"

echo ""
echo "Kapatmak için Enter'a bas..."
read
