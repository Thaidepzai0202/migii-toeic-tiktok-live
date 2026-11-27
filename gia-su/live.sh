#!/bin/bash
# Live thử "gia sư tự động" trên TikTok (bài học tự chạy, người xem trả lời câu hỏi bằng bình luận).
#   ./gia-su/live.sh        → server đọc bình luận live của @TIKTOK_USER (.env) + mở cửa sổ phát dọc cho TikTok LIVE Studio chụp
#   ./gia-su/live.sh --sim  → như trên nhưng người xem ảo (canh khung, nghe thử trước khi lên sóng)
#   ./gia-su/live.sh stop   → tắt server và cửa sổ phát
# Chỉ MỘT cửa sổ phát được dẫn bài (mở thêm thì cửa sổ cũ tự dừng). Không dùng chung lúc với game live (./go_live.sh):
# hai bên cùng đọc bình luận một kênh.
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -f .env ]] && { set -a; source .env; set +a; }
PORT="${GIA_SU_PORT:-8795}"
LOG=data/gia-su-live.log
PIDFILE=data/gia-su-live.pid
PROFILE="$PWD/data/chrome-gia-su"
mkdir -p data

dung() {
  if [[ -f "$PIDFILE" ]]; then kill "$(cat "$PIDFILE")" 2>/dev/null || true; rm -f "$PIDFILE"; fi
  pkill -f "user-data-dir=$PROFILE" 2>/dev/null || true
}

if [[ "${1:-}" == "stop" ]]; then dung; echo "Đã tắt server gia sư và cửa sổ phát. (LIVE Studio thì bấm End LIVE)"; exit 0; fi

dung
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Cổng $PORT đang có chương trình khác chạy (vd npm run demo:gia-su). Tắt nó trước rồi chạy lại."; exit 1
fi
if [[ "${1:-}" == "--sim" ]]; then
  nohup node gia-su/server.js --port "$PORT" --sim > "$LOG" 2>&1 &
else
  : "${TIKTOK_USER:?thiếu TIKTOK_USER trong .env}"
  nohup node gia-su/server.js --port "$PORT" --user "$TIKTOK_USER" > "$LOG" 2>&1 &
fi
PID=$!
echo "$PID" > "$PIDFILE"
# Máy ngủ là live đứng: giữ máy thức tới khi server tắt
command -v caffeinate >/dev/null && nohup caffeinate -dims -w "$PID" >/dev/null 2>&1 &
sleep 3

# Cửa sổ dọc 9:16 cao hết màn hình (giống ./go_live.sh studio). 3 cờ disable-*: bị LIVE Studio che vẫn chạy đều, không trễ tiếng.
SCREEN_H=$(osascript -e 'tell application "Finder" to get item 4 of (bounds of window of desktop)' 2>/dev/null || echo 1080)
WIN_H=$(( SCREEN_H - 25 - 4 ))
CONTENT_H=$(( WIN_H - 28 ))
WIN_W=$(( CONTENT_H * 9 / 16 ))
env -u ELECTRON_RUN_AS_NODE open -na "Google Chrome" --args --user-data-dir="$PROFILE" --app="http://localhost:$PORT/?live=1" \
  --window-size=$WIN_W,$WIN_H --window-position=0,25 --autoplay-policy=no-user-gesture-required \
  --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling \
  --no-first-run --no-default-browser-check

echo "Cửa sổ phát ${WIN_W}×${CONTENT_H} đã mở (tiêu đề là tên bài đang giảng). Log: $LOG"
grep -m3 -E "Giọng đọc|Trang live|bài" "$LOG" || true
if [[ "${1:-}" == "--sim" ]]; then
  echo "Người xem ảo đang trả lời. Bình luận thử: curl -s -X POST localhost:$PORT/chat -d '{\"name\":\"An\",\"text\":\"B\"}'"
else
  echo "Trong LIVE Studio: thêm nguồn chụp cửa sổ đó → Go LIVE. Server tự nối bình luận @$TIKTOK_USER khi kênh lên sóng."
fi
echo "Tắt: ./gia-su/live.sh stop"
