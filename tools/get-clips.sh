#!/bin/bash
# מוריד את הקליפים מ-media/clips.txt, חותך ושומר ב-media/video/ בשמות שהמצגת מחכה להם.
# דרישות (פעם אחת, ב-Mac):  brew install yt-dlp ffmpeg
# הרצה:  bash tools/get-clips.sh            (מוריד רק מה שחסר)
#        bash tools/get-clips.sh --force    (מוריד הכל מחדש)
set -u
cd "$(dirname "$0")/.."
command -v yt-dlp >/dev/null || { echo "חסר yt-dlp. התקן: brew install yt-dlp ffmpeg"; exit 1; }
command -v ffmpeg >/dev/null || { echo "חסר ffmpeg. התקן: brew install ffmpeg"; exit 1; }
FORCE="${1:-}"
mkdir -p media/video
TMP="$(mktemp -d)"
ok=0; fail=0
while IFS='|' read -r name src start dur; do
  name="$(echo "$name" | xargs)"; src="$(echo "$src" | xargs)"; start="$(echo "${start:-0}" | xargs)"; dur="$(echo "${dur:-30}" | xargs)"
  [[ -z "$name" || "$name" == \#* ]] && continue
  out="media/video/$name"
  if [[ -f "$out" && "$FORCE" != "--force" ]]; then echo "✔ קיים: $out"; continue; fi
  if [[ "$src" == http* ]]; then target="$src"; else target="ytsearch1:$src"; fi
  echo "⬇ $name  ←  $src"
  rm -f "$TMP"/dl.*
  if yt-dlp -q --no-playlist -f "bv*[height<=1080]+ba/b[height<=1080]/b" --merge-output-format mp4 -o "$TMP/dl.%(ext)s" --print "   מקור: %(title)s — %(webpage_url)s" --no-simulate "$target" < /dev/null; then
    f="$(ls "$TMP"/dl.* | head -1)"
    # חיתוך + המרה ל-H.264/AAC שעובד בכל דפדפן
    if ffmpeg -nostdin -loglevel error -y -ss "$start" -i "$f" -t "$dur" -vf "scale='min(1920,iw)':-2" -c:v libx264 -preset veryfast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart "$out"; then
      echo "   ✔ נשמר: $out"; ok=$((ok+1))
    else echo "   ✘ החיתוך נכשל"; fail=$((fail+1)); fi
  else
    echo "   ✘ ההורדה נכשלה (אפשר להדביק קישור מדויק ב-media/clips.txt)"; fail=$((fail+1))
  fi
done < media/clips.txt
rm -rf "$TMP"
echo; echo "הורדו: $ok · נכשלו: $fail"
echo "עכשיו: לפתוח את המצגת, לצפות בכל קליף (מקש M מראה מה קיים), ולכוונן זמנים ב-media/clips.txt אם צריך."
