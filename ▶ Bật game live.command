#!/bin/bash
# Bấm đúp để bật game live: server đọc chat TikTok (tự nối khi kênh lên sóng) + cửa sổ game + màn điều khiển.
cd "$(dirname "$0")" && ./go_live.sh studio
echo; echo "Xong. Có thể đóng cửa sổ Terminal này (game vẫn chạy nền)."
