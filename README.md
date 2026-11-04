# TikTok Live Quiz — game livestream học tiếng Hàn

> ⚠️ **Tool thô sơ, làm nhanh cho kênh TikTok của Jaemy.** Mọi người cứ clone về rồi tuỳ chỉnh theo nhu cầu
> (đổi ngôn ngữ, kho từ, giao diện, luật chơi…). Cách nhanh nhất: mở thư mục này bằng **Claude Code** rồi bảo
> nó sửa cho, ví dụ *"đổi kho từ sang tiếng Nhật JLPT N5"* hay *"đổi logo và tên app thành Migii"*.

Game chạy trên một trang web dọc 1080×1920. Bạn đưa trang này lên sóng bằng TikTok LIVE Studio, OBS hoặc chia sẻ
màn hình điện thoại. Server đọc **bình luận + quà** của phiên live TikTok theo thời gian thực, tự chấm điểm, đọc lời
dẫn bằng giọng tiếng Việt và vinh danh người chơi. Không cần người dẫn; có màn điều khiển riêng để can thiệp.

**Người chơi chỉ gõ số hoặc chữ Latin vào bình luận** (không phải gõ chữ Hàn — bàn phím điện thoại khó gõ).

## Chương trình xoay vòng (mặc định)

Mỗi **lượt** (8 câu) là một khung. Giữa 2 khung có màn **vinh danh top 3** (kèm ảnh đại diện TikTok) và màn chờ
báo khung tiếp theo. Giờ học và giờ giải trí xen kẽ, mỗi khung một màu nền riêng.

| Khung | Loại | Cách chơi | Người xem gõ |
|---|---|---|---|
| 📖 Giờ học | học | Cô Cáo giảng 3 từ cùng bài → kiểm tra, **gọi tên** từng bạn. Người xem có chỗ ngồi trong lớp (ảnh đại diện làm mặt); lớp đầy thì đứng ở **hành lang**, lên top được vào lớp | `1`–`4` |
| ⚡ Đố nhanh | giải trí | Hiện từ Hàn + đọc, chọn nghĩa đúng | `1`–`4` |
| 🧩 Ghép chữ | giải trí | Các thẻ âm tiết bị xáo, mỗi thẻ có số | thứ tự số, vd `312` (hoặc romaja) |
| 🎧 Luyện tai | học | Chỉ đọc, không hiện chữ | `1`–`4` |
| 🥊 So găng 2 đội | giải trí | 2 đội (Kimchi/Gà rán…), thanh kéo co; trả lời đúng + tặng quà kéo điểm cho đội; đội thắng cả đội +10 | tên đội, rồi `1`–`4` |
| 🔁 Chọn từ Hàn | học | Hiện nghĩa tiếng Việt, chọn đúng từ tiếng Hàn | `1`–`4` |

Đổi thứ tự / bỏ khung: `--program-order class,quiz,scramble,listen,team,reverse`. Muốn chơi một kiểu cố định:
`--quiz` (đố liên tục) hoặc `--class` (chỉ lớp học), hoặc đổi ở màn điều khiển.

Điểm: đúng nhanh nhất +10, rồi 8, 6, 4… (tối thiểu 3); mỗi người chỉ tính **lần chọn đầu**. Được gọi tên mà đúng +5.
Tặng quà: +điểm (tối đa 50) và x2 điểm cho 3 câu tiếp. Bảng vàng theo ngày lưu ở `data/scores-YYYY-MM-DD.json`.
Từ đã hỏi ghi vào `data/used-words.json` nên tắt bật server cũng không lặp câu.

## Cài đặt

Cần: macOS, Node 18+, Google Chrome. Tuỳ chọn: OBS (`brew install --cask obs`) nếu muốn camera ảo nét 1080×1920.

```bash
npm install
cp .env.example .env          # điền TIKTOK_USER = id kênh TikTok (không có @)
node server.js --sim          # chạy thử với khán giả ảo, không cần TikTok
```

Mở `http://localhost:8787/` (màn live) và `http://localhost:8787/control` (màn điều khiển).

## Lên live bằng TikTok LIVE Studio

1. Bấm đúp **`▶ Bật game live.command`** (= `./go_live.sh studio`): bật server đọc chat của `TIKTOK_USER`, mở cửa sổ
   Chrome dọc cho LIVE Studio chụp, mở OBS camera ảo (nếu có OBS) và màn điều khiển.
2. LIVE Studio: chế độ dọc, thêm nguồn **Camera → "OBS Virtual Camera"** (nét nhất) hoặc **chụp cửa sổ**
   "Đố từ tiếng Hàn · Jaemy". Bật âm thanh ứng dụng để có giọng đọc.
3. Bấm **Go LIVE**. Server tự nối chat khi kênh lên sóng (log `data/server.log` hiện "Đã nối live @…").
4. Trên màn điều khiển bấm **▶ Bắt đầu**.
5. Kết thúc: bấm đúp **`■ Tắt game live.command`** (= `./go_live.sh stop`). Lệnh này chiếu màn cảm ơn 20s rồi tắt.
   Sau đó bấm **End LIVE** trong LIVE Studio.

Có stream key (LIVE Producer): điền `TIKTOK_RTMP_URL`, `TIKTOK_STREAM_KEY` vào `.env`, chạy `./go_live.sh` để OBS phát thẳng.
Live bằng điện thoại: mở `http://<IP máy Mac>:8787/` trên điện thoại cùng Wi-Fi rồi dùng chế độ chia sẻ màn hình của TikTok.

## Màn điều khiển (`/control`, không lên sóng)

Xem đáp án, tạm dừng (Space), câu tiếp (N), đổi từ (R), +10s (E), kết thúc lượt, đổi thể loại live, bỏ qua khung,
số câu/giây mỗi câu, nhạc nền, giọng đọc, AI trả lời bình luận, số người chơi ảo, thử bình luận/quà, màn cảm ơn cuối phiên.
Từ điện thoại cùng Wi-Fi: dùng link có `?key=…` mà server in ra lúc khởi động (hoặc đặt `CONTROL_KEY` trong `.env`).

## Các thành phần

| File | Vai trò |
|---|---|
| `server.js` | vòng chơi, chấm điểm, đọc chat TikTok (`tiktok-live-connector`), WebSocket cho 2 màn |
| `public/index.html` | màn live 1080×1920 (giao diện, hiệu ứng, lời dẫn, hàng đợi giọng đọc) |
| `public/control.html` | màn điều khiển |
| `bots.js` | người chơi ảo khi vắng người (không lên vinh danh/bảng vàng, tự giảm khi đông người thật) |
| `sim.js` | khán giả ảo cho chế độ `--sim` |
| `tts.js` | giọng đọc tiếng Việt VieNeu-TTS chạy local (không có thì dùng giọng của trình duyệt) |
| `ai.js` | MC AI "Cáo Jaemy" trả lời bình luận (qua gateway nội bộ; không có token thì tự tắt) |
| `build_bank.js`, `build_exclude.js` | tạo kho từ `data/bank.json` từ khoá học Jaemy (đã có sẵn file) |
| `go_live.sh`, `obs/setup_obs.js` | bật/tắt live, cấu hình OBS |

### Tuỳ chỉnh cho app khác

- **Kho từ**: `data/bank.json` là mảng `{ w, r, m, cid, course, lesson }` (từ, phiên âm, nghĩa, id khoá, tên khoá, tên bài).
  Thay bằng kho của bạn (JLPT, HSK, tiếng Anh…) là chạy được; mức `easy/mid` lọc theo `cid` trong `LEVELS` (`server.js`).
- **Âm thanh từ**: `audioUrl()` trong `server.js` trỏ CDN của Jaemy; đổi sang CDN của bạn.
- **Thương hiệu**: `public/img/` (icon, QR, huy hiệu store) và chữ "Jaemy" trong `public/index.html`.
- **Giọng đọc**: VieNeu cần môi trường Python riêng (`VIENEU_PY=/đường/dẫn/python`); tắt bằng `VIENEU=0`.
- **AI**: đặt `CLAUDE_API_TOKEN` + `AI_GATEWAY_URL`, hoặc tắt trong màn điều khiển.
- **Chạy thử khi đang có live thật trên cùng máy**: `node server.js --sim --mute --port 8789` (trang tự im lặng, không lọt tiếng vào live).

## Lưu ý

- `tiktok-live-connector` là thư viện **không chính thức**, có thể hỏng khi TikTok đổi giao thức.
- ~140px mép trên bị thanh tên kênh TikTok che, góc dưới trái bị khung bình luận che: nội dung chính để trong y 150–1600.
- Nền màu phẳng (không gradient/chấm bi) vì video live bị nén mạnh.
- Không dùng ảnh người nổi tiếng/idol (bản quyền, dễ bị TikTok cắt live). Ảnh đại diện của người xem thì dùng được.
- Đừng commit `.env` và `data/scores-*.json` (chứa tên người xem) — đã có trong `.gitignore`.
