#!/bin/bash
# Bấm đúp để kết thúc: chiếu màn cảm ơn 20s rồi tắt server + cửa sổ game. (LIVE Studio thì tự bấm End LIVE)
cd "$(dirname "$0")" && ./go_live.sh stop
