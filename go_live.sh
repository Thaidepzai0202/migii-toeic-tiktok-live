#!/bin/bash
# Lên live TikTok.
#   ./go_live.sh studio   → (kênh KHÔNG có stream key) chạy server đọc chat @TIKTOK_USER + mở cửa sổ game dọc
#                           để TikTok LIVE Studio chụp; bấm Go LIVE trong LIVE Studio. Chỉ cần TIKTOK_USER trong .env.
#   ./go_live.sh studio --sim → như trên nhưng khán giả ảo, để canh khung trong LIVE Studio trước
#   ./go_live.sh          → phát thẳng bằng OBS (cần .env có TIKTOK_USER, TIKTOK_RTMP_URL, TIKTOK_STREAM_KEY)
#   ./go_live.sh --sim    → mở OBS xem khung hình với khán giả ảo, KHÔNG phát
#   ./go_live.sh stop     → hiện màn cảm ơn cuối phiên ~20s rồi dừng phát + tắt OBS + tắt server
#   ./go_live.sh stop now → tắt ngay, không màn cảm ơn
# Hẹn phiên sau hiện trên màn cảm ơn: NEXT_LIVE="20h tối mai" ./go_live.sh stop  (hoặc ghi vào .env)
set -euo pipefail
cd "$(dirname "$0")"
OBS_DIR="$HOME/Library/Application Support/obs-studio"
LOG=data/server.log
PORT=8787
# Chrome profile riêng cho cửa sổ game: không đụng Chrome của bro, tắt riêng được
GAME_PROFILE="$PWD/data/chrome-game"

stop_all() {
  if [[ "${1:-}" != "now" ]]; then
    [[ -f .env ]] && { set -a; source .env; set +a; }
    if curl -s -X POST --get --data-urlencode "next=${NEXT_LIVE:-}" "localhost:$PORT/outro" >/dev/null; then
      echo "Đang chiếu màn cảm ơn ${OUTRO_SEC:-20}s…"
      sleep "${OUTRO_SEC:-20}"
    fi
  fi
  osascript -e 'tell application "OBS" to quit' >/dev/null 2>&1 || true
  sleep 3
  pkill -x OBS 2>/dev/null || true
  pkill -f "node server.js" 2>/dev/null || true
  pkill -f "user-data-dir=$GAME_PROFILE" 2>/dev/null || true
  echo "Đã dừng: tắt OBS, cửa sổ game và server. (LIVE Studio thì bro bấm End LIVE)"
}

if [[ "${1:-}" == "stop" ]]; then stop_all "${2:-}"; exit 0; fi

if [[ "${1:-}" == "studio" ]]; then
  osascript -e 'tell application "OBS" to quit' >/dev/null 2>&1 || true
  pkill -f "node server.js" 2>/dev/null || true
  pkill -f "user-data-dir=$GAME_PROFILE" 2>/dev/null || true
  if [[ "${2:-}" == "--sim" ]]; then
    nohup node server.js --sim > "$LOG" 2>&1 &
  else
    [[ -f .env ]] && { set -a; source .env; set +a; }
    : "${TIKTOK_USER:?thiếu TIKTOK_USER trong .env}"
    nohup node server.js --user "$TIKTOK_USER" > "$LOG" 2>&1 &
  fi
  sleep 2
  # Cửa sổ dọc 9:16 CAO HẾT MÀN HÌNH: LIVE Studio chụp cửa sổ theo điểm ảnh thật — màn 1080p thường (không Retina)
  # thì cửa sổ càng to càng nét (Retina: 540×960 điểm đã = 1080×1920 điểm ảnh).
  SCREEN_H=$(osascript -e 'tell application "Finder" to get item 4 of (bounds of window of desktop)' 2>/dev/null || echo 1080)
  WIN_H=$(( SCREEN_H - 25 - 4 ))            # trừ thanh menu
  CONTENT_H=$(( WIN_H - 28 ))               # trừ thanh tiêu đề
  WIN_W=$(( CONTENT_H * 9 / 16 ))
  # 3 cờ disable-*: Chrome KHÔNG giảm khung hình / hoãn đồng hồ khi cửa sổ bị LIVE Studio che → hình không đứng, tiếng không trễ
  open -na "Google Chrome" --args --user-data-dir="$GAME_PROFILE" --app="http://localhost:$PORT/" \
    --window-size=$WIN_W,$WIN_H --window-position=0,25 --autoplay-policy=no-user-gesture-required \
    --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling \
    --no-first-run --no-default-browser-check
  echo "Cửa sổ game ${WIN_W}×${CONTENT_H} điểm ảnh (màn cao ${SCREEN_H})." 
  # Camera ảo NÉT 1080×1920: OBS chạy ngầm dựng trang game (tắt tiếng) → LIVE Studio nguồn Camera "OBS Virtual Camera".
  # Tiếng vẫn do cửa sổ game Chrome phát. User chốt dùng 04/11. Tắt: NO_VCAM=1 ./go_live.sh studio
  if [[ -z "${NO_VCAM:-}" && -d /Applications/OBS.app ]]; then
    osascript -e 'tell application "OBS" to quit' >/dev/null 2>&1 || true
    sleep 2; pkill -x OBS 2>/dev/null || true
    OBS_VCAM=1 node obs/setup_obs.js >/dev/null
    open -a OBS --args --profile JaemyLive --collection JaemyLive --scene Game --disable-shutdown-check --startvirtualcam --minimize-to-tray
    echo "OBS Camera ảo 1080×1920 đang chạy → trong LIVE Studio: thêm nguồn Camera → 'OBS Virtual Camera'."
  fi
  # Màn điều khiển mở bằng trình duyệt thường của bro (KHÔNG đưa lên sóng)
  open "http://localhost:$PORT/control"
  echo "Cửa sổ game đã mở (tiêu đề 'Đố từ tiếng Hàn · Jaemy'). Màn điều khiển: http://localhost:$PORT/control"
  grep -m1 "control?key=" "$LOG" | sed 's/^ *//' || true
  echo "Log: $LOG"
  echo "Trong LIVE Studio: thêm nguồn chụp cửa sổ đó → bấm Go LIVE. Kết thúc: ./go_live.sh stop"
  exit 0
fi

pgrep -x OBS >/dev/null && { echo "OBS đang mở — chạy './go_live.sh stop' trước."; exit 1; }
pkill -f "node server.js" 2>/dev/null || true
node obs/setup_obs.js

if [[ "${1:-}" == "--sim" ]]; then
  nohup node server.js --sim > "$LOG" 2>&1 &
  sleep 2
  open -a OBS --args --profile JaemyLive --collection JaemyLive --scene Game --disable-shutdown-check
  open "http://localhost:$PORT/control"
  echo "OBS mở với khán giả ảo (không phát). Log: $LOG"
  exit 0
fi

[[ -f .env ]] || { echo "Thiếu .env (TIKTOK_USER, TIKTOK_RTMP_URL, TIKTOK_STREAM_KEY)"; exit 1; }
set -a; source .env; set +a
: "${TIKTOK_USER:?thiếu TIKTOK_USER}" "${TIKTOK_RTMP_URL:?thiếu TIKTOK_RTMP_URL}" "${TIKTOK_STREAM_KEY:?thiếu TIKTOK_STREAM_KEY}"

# service.json chỉ ghi lúc phát; key mới mỗi phiên LIVE Producer thì sửa .env rồi chạy lại.
node -e '
const fs=require("fs");
fs.writeFileSync(process.argv[1], JSON.stringify({type:"rtmp_custom",settings:{server:process.env.TIKTOK_RTMP_URL,key:process.env.TIKTOK_STREAM_KEY,use_auth:false,bwtest:false}}));
' "$OBS_DIR/basic/profiles/JaemyLive/service.json"
chmod 600 "$OBS_DIR/basic/profiles/JaemyLive/service.json"

nohup node server.js --user "$TIKTOK_USER" > "$LOG" 2>&1 &
sleep 2
open -a OBS --args --profile JaemyLive --collection JaemyLive --scene Game --disable-shutdown-check --startstreaming
open "http://localhost:$PORT/control"
echo "Đang lên live @$TIKTOK_USER. Log server: $LOG — dừng: ./go_live.sh stop"
