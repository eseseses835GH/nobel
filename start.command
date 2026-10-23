#!/bin/bash
# לחיצה כפולה (Mac): מפעיל שרת מקומי ופותח את המצגת ב-Chrome. בלי אינטרנט.
cd "$(dirname "$0")"
URL="http://localhost:8000/"
if command -v node >/dev/null 2>&1; then
  ( sleep 1; open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL" ) &
  node tools/serve.mjs
else
  echo "Node לא מותקן — פותח את index.html ישירות (גם זה עובד)."
  open -a "Google Chrome" index.html 2>/dev/null || open index.html
fi
