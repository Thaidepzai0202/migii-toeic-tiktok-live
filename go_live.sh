#!/bin/bash
# Lên live TikTok.
#   ./go_live.sh studio   → (kênh KHÔNG có stream key) chạy server đọc chat @TIKTOK_USER + mở cửa sổ game dọc
#                           để TikTok LIVE Studio chụp; bấm Go LIVE trong LIVE Studio. Chỉ cần TIKTOK_USER trong .env.
#   ./go_live.sh studio --sim → như trên nhưng khán giả ảo, để canh khung trong LIVE Studio trước
#   Kênh theo mức điểm (game của kênh nào): KENH trong .env hoặc thêm tên kênh sau lệnh, vd ./go_live.sh studio 450-650
#     duoi450 (mặc định) · 450-650 · 650-800 · tren800 — giống npm run demo:<kênh>
#   ./go_live.sh          → phát thẳng bằng OBS (cần .env có TIKTOK_USER, TIKTOK_RTMP_URL, TIKTOK_STREAM_KEY)
#   ./go_live.sh --sim    → mở OBS xem khung hình với khán giả ảo, KHÔNG phát
#   ./go_live.sh stop     → hiện màn cảm ơn cuối phiên ~20s rồi dừng phát + tắt OBS + tắt server
#   ./go_live.sh stop now → tắt ngay, không màn cảm ơn
# Hẹn phiên sau hiện trên màn cảm ơn: NEXT_LIVE="20h tối mai" ./go_live.sh stop  (hoặc ghi vào .env)
set -euo pipefail
cd "$(dirname "$0")"
[[ -f .env ]] && { set -a; source .env; set +a; }
OBS_DIR="$HOME/Library/Application Support/obs-studio"
OBS_NAME=MigiiToeicLive
LOG=data/server.log
PIDFILE=data/server.pid
PORT="${PORT:-8788}"            # 8788: không đụng bản Jaemy (8787) nếu chạy chung máy
export QUIZ_PORT="$PORT"        # obs/setup_obs.js đọc biến này
mkdir -p data
# Chrome profile riêng cho cửa sổ game: không đụng Chrome của bro, tắt riêng được
GAME_PROFILE="$PWD/data/chrome-game"

# Game của từng kênh (giữ giống các lệnh demo:<kênh> trong package.json)
kenh_args() {
  case "$1" in
    duoi450) echo "--program-order word,startend,hunt,chain --word-file data/word-300.json,data/word-400.json" ;;
    450-650) echo "--program-order word,fillin,listenmean,errhunt,crossword --word-file data/word-500.json,data/word-600.json --err-file data/san-loi-600.json --cross-file data/o-chu-600.json" ;;
    650-800) echo "--program-order word,speedread,dictate --word-file data/word-700.json --read-file data/doc-nhanh-700.json --dict-file data/nghe-chep-700.json" ;;
    tren800) echo "--program-order word,speedread --word-file data/word-800.json,data/word-900.json --read-file data/doc-nhanh-800.json" ;;
    *) echo "Kênh không hợp lệ: '$1' (chọn duoi450 · 450-650 · 650-800 · tren800)" >&2; exit 1 ;;
  esac
}
# Đọc tham số sau lệnh chính: --sim và tên kênh, theo thứ tự nào cũng được
SIM_FLAG=""
for a in "$@"; do
  case "$a" in
    --sim) SIM_FLAG="--sim" ;;
    studio|stop|now) ;;
    *) KENH="$a" ;;
  esac
done
KENH="${KENH:-duoi450}"
GAME_STR="$(kenh_args "$KENH")" # set -e: tên kênh sai thì dừng ngay ở đây
read -r -a GAME_ARGS <<< "$GAME_STR"

# Chỉ tắt server CỦA REPO NÀY (theo PID đã ghi), không pkill mọi "node server.js" trên máy như bản gốc
stop_server() {
  if [[ -f "$PIDFILE" ]]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
  fi
}
# Server chết giữa live (lỗi lạ) thì tự bật lại sau 2 giây; lần bật lại có --autostart để lượt mới tự chạy, không cần ai bấm.
# Màn live và màn điều khiển tự nối lại. Điểm bảng vàng đọc lại từ file nên không mất. Bật hỏng 5 lần liền trong 10 giây (vd trùng cổng) thì thôi.
SUPERVISE='
  trap "kill \$child 2>/dev/null; exit 0" TERM INT
  extra=(); quick=0
  while true; do
    started=$(date +%s)
    node server.js "$@" "${extra[@]}" & child=$!
    wait $child; code=$?
    if (( $(date +%s) - started < 10 )); then quick=$((quick + 1)); else quick=0; fi
    if (( quick >= 5 )); then echo "$(date +%T) ❌ server bật lên là dừng 5 lần liền, thôi không bật lại (xem lỗi ở trên)"; exit 1; fi
    echo "$(date +%T) ⚠️ server dừng (mã $code), bật lại sau 2 giây…"
    extra=(--autostart); sleep 2
  done'
start_server() {
  stop_server
  nohup bash -c "$SUPERVISE" _ --port "$PORT" "${GAME_ARGS[@]}" "$@" > "$LOG" 2>&1 &
  local pid=$!
  echo "$pid" > "$PIDFILE"
  # Giữ Mac + màn hình không ngủ khi server còn chạy (máy ngủ = live đứng). Server tắt thì caffeinate tự thoát.
  if command -v caffeinate >/dev/null; then nohup caffeinate -dims -w "$pid" >/dev/null 2>&1 & fi
}

stop_all() {
  if [[ "${1:-}" != "now" ]]; then
    if curl -s -X POST --get --data-urlencode "next=${NEXT_LIVE:-}" "localhost:$PORT/outro" >/dev/null; then
      echo "Đang chiếu màn cảm ơn ${OUTRO_SEC:-20}s…"
      sleep "${OUTRO_SEC:-20}"
    fi
  fi
  osascript -e 'tell application "OBS" to quit' >/dev/null 2>&1 || true
  sleep 3
  pkill -x OBS 2>/dev/null || true
  stop_server
  pkill -f "user-data-dir=$GAME_PROFILE" 2>/dev/null || true
  echo "Đã dừng: tắt OBS, cửa sổ game và server. (LIVE Studio thì bro bấm End LIVE)"
}

if [[ "${1:-}" == "stop" ]]; then stop_all "${2:-}"; exit 0; fi
echo "Kênh: $KENH"

if [[ "${1:-}" == "studio" ]]; then
  osascript -e 'tell application "OBS" to quit' >/dev/null 2>&1 || true
  # Cửa sổ game đang mở (vd vừa canh khung bằng --sim) thì GIỮ NGUYÊN: trang tự nối lại server mới, LIVE Studio
  # không phải chọn lại nguồn chụp cửa sổ. Muốn mở lại cửa sổ mới thì tắt cửa sổ game trước.
  GAME_WIN_OPEN=""
  pgrep -f "user-data-dir=$GAME_PROFILE" >/dev/null && GAME_WIN_OPEN=1
  if [[ -n "$SIM_FLAG" ]]; then
    start_server --sim
  else
    : "${TIKTOK_USER:?thiếu TIKTOK_USER trong .env}"
    start_server --user "$TIKTOK_USER"
  fi
  sleep 2
  # Cửa sổ dọc 9:16 CAO HẾT MÀN HÌNH: LIVE Studio chụp cửa sổ theo điểm ảnh thật — màn 1080p thường (không Retina)
  # thì cửa sổ càng to càng nét (Retina: 540×960 điểm đã = 1080×1920 điểm ảnh).
  SCREEN_H=$(osascript -e 'tell application "Finder" to get item 4 of (bounds of window of desktop)' 2>/dev/null || echo 1080)
  WIN_H=$(( SCREEN_H - 25 - 4 ))            # trừ thanh menu
  CONTENT_H=$(( WIN_H - 28 ))               # trừ thanh tiêu đề
  WIN_W=$(( CONTENT_H * 9 / 16 ))
  if [[ -n "$GAME_WIN_OPEN" ]]; then
    echo "Giữ cửa sổ game đang mở (trang tự nối lại) — LIVE Studio không phải chọn lại nguồn."
  else
  # 3 cờ disable-*: Chrome KHÔNG giảm khung hình / hoãn đồng hồ khi cửa sổ bị LIVE Studio che → hình không đứng, tiếng không trễ
  open -na "Google Chrome" --args --user-data-dir="$GAME_PROFILE" --app="http://localhost:$PORT/" \
    --window-size=$WIN_W,$WIN_H --window-position=0,25 --autoplay-policy=no-user-gesture-required \
    --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling \
    --no-first-run --no-default-browser-check
  echo "Cửa sổ game ${WIN_W}×${CONTENT_H} điểm ảnh (màn cao ${SCREEN_H})."
  fi
  # Camera ảo NÉT 1080×1920: OBS chạy ngầm dựng trang game (tắt tiếng) → LIVE Studio nguồn Camera "OBS Virtual Camera".
  # Tiếng vẫn do cửa sổ game Chrome phát. User chốt dùng 04/11. Tắt: NO_VCAM=1 ./go_live.sh studio
  if [[ -z "${NO_VCAM:-}" && -d /Applications/OBS.app ]]; then
    osascript -e 'tell application "OBS" to quit' >/dev/null 2>&1 || true
    sleep 2; pkill -x OBS 2>/dev/null || true
    OBS_VCAM=1 node obs/setup_obs.js >/dev/null
    open -a OBS --args --profile "$OBS_NAME" --collection "$OBS_NAME" --scene Game --disable-shutdown-check --startvirtualcam --minimize-to-tray
    echo "OBS Camera ảo 1080×1920 đang chạy → trong LIVE Studio: thêm nguồn Camera → 'OBS Virtual Camera'."
  fi
  # Màn điều khiển mở bằng trình duyệt thường của bro (KHÔNG đưa lên sóng)
  open "http://localhost:$PORT/control"
  echo "Cửa sổ game đã mở (tiêu đề 'Đố từ vựng TOEIC · Migii'). Màn điều khiển: http://localhost:$PORT/control"
  grep -m1 "control?key=" "$LOG" | sed 's/^ *//' || true
  echo "Log: $LOG"
  echo "Trong LIVE Studio: thêm nguồn chụp cửa sổ đó → bấm Go LIVE. Kết thúc: ./go_live.sh stop"
  exit 0
fi

pgrep -x OBS >/dev/null && { echo "OBS đang mở — chạy './go_live.sh stop' trước."; exit 1; }
node obs/setup_obs.js

if [[ "${1:-}" == "--sim" ]]; then
  start_server --sim
  sleep 2
  open -a OBS --args --profile "$OBS_NAME" --collection "$OBS_NAME" --scene Game --disable-shutdown-check
  open "http://localhost:$PORT/control"
  echo "OBS mở với khán giả ảo (không phát). Log: $LOG"
  exit 0
fi

[[ -f .env ]] || { echo "Thiếu .env (TIKTOK_USER, TIKTOK_RTMP_URL, TIKTOK_STREAM_KEY)"; exit 1; }
: "${TIKTOK_USER:?thiếu TIKTOK_USER}" "${TIKTOK_RTMP_URL:?thiếu TIKTOK_RTMP_URL}" "${TIKTOK_STREAM_KEY:?thiếu TIKTOK_STREAM_KEY}"

# service.json chỉ ghi lúc phát; key mới mỗi phiên LIVE Producer thì sửa .env rồi chạy lại.
node -e '
const fs=require("fs");
fs.writeFileSync(process.argv[1], JSON.stringify({type:"rtmp_custom",settings:{server:process.env.TIKTOK_RTMP_URL,key:process.env.TIKTOK_STREAM_KEY,use_auth:false,bwtest:false}}));
' "$OBS_DIR/basic/profiles/$OBS_NAME/service.json"
chmod 600 "$OBS_DIR/basic/profiles/$OBS_NAME/service.json"

start_server --user "$TIKTOK_USER"
sleep 2
open -a OBS --args --profile "$OBS_NAME" --collection "$OBS_NAME" --scene Game --disable-shutdown-check --startstreaming
open "http://localhost:$PORT/control"
echo "Đang lên live @$TIKTOK_USER. Log server: $LOG — dừng: ./go_live.sh stop"
