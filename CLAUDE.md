# Migii TOEIC Live

Game đố từ vựng TOEIC phát trên TikTok LIVE để kéo người xem về app Migii TOEIC. Fork của `tiktok-live-quiz`
(bản cho app Jaemy, tiếng Hàn); remote `upstream` trỏ về repo đó.

- Cách chạy, các khung chơi, vai trò từng file: [README.md](README.md).
- Việc còn thiếu trước khi lên live (pháp chế, kênh TikTok, link QR, duyệt thương hiệu…): [CAN-CUNG-CAP.md](CAN-CUNG-CAP.md).
  Đọc trước mọi việc liên quan tới lên live; xong mục nào thì cập nhật file đó.

## Nội dung lên sóng

Live là phát công khai, nên mọi chữ trên màn và lời đọc theo luật thương hiệu của Migii
(`../migii_toeic_docs/01-tong-quan/thuong-hieu.md`):

- Câu hỏi lấy từ **kho từ vựng** của Migii. Ngân hàng câu đề thi Part 1–7 đang vướng bản quyền
  (`../migii_toeic_docs/05-yeu-cau-thay-doi/yc-004`): chỉ dùng khi YC-004 đã giao bộ câu mới và pháp chế đồng ý.
- Câu miễn trừ ETS (`#ets` trong `public/index.html`) **ẩn trên mọi màn** theo yêu cầu người dùng 12/11/2026
  (`display: none` trong `public/theme-light.css`). Đừng tự thêm lại, kể cả khi bản Figma mới không có: người dùng đã quyết,
  dù `thuong-hieu.md` ghi câu này bắt buộc trên tài liệu quảng bá có chữ TOEIC.
- Khung Bricky (`bricky`) tính điểm cho **mọi từ có trong từ điển** (`dict.js`), không riêng kho Migii: người dùng chốt 19/11/2026
  ("chỉ cần là từ tiếng Anh có nghĩa, có trong từ điển"). Từ lên bảng ô (5–7 từ mỗi bảng; bảng cuối "Về đích" 6 chữ cái, 8 từ, thời gian ×1,5, điểm ×2) vẫn là từ Migii có nghĩa (`bank.json`, thiếu thì `word-300/400.json`); từ thêm hiện trên màn không kèm nghĩa.
  Gặp từ thô hoặc chữ viết tắt lọt lên màn thì thêm vào `THO` / `BO` trong `dict.js` (dùng chung với Săn từ) rồi `npm run build:bricky`.
- Khung Săn từ (`hunt`) theo luật người dùng chốt 26/11/2026, thay hẳn bản ma trận 10×10: bảng 16×16 dựng lúc chơi (`san-tu.js`), từ chỉ tính
  hàng ngang trái → phải và cột dọc trên → xuống, từ 3 chữ cái; ai gõ trước +2 cho mỗi chỗ từ đó nằm; lượt 30 giây, 10 giây chưa ai đúng thì một từ
  nhấp nháy gợi ý; hết lượt từ đã tìm nổ, chữ rơi xuống (không ai đúng: nổ cả bảng); 15 lượt + lượt 16 về đích ×2. Thanh mana: mỗi từ +1, hết lượt
  đủ 10 / 20 / 30 thì tiêu hết mana để bắn 2 tên lửa 3×3 (ưu tiên gần đáy) / bom chữ thập dày 3 ô / nổ ô đen bàn cờ (`HUNT_MANA`, `huntPower` trong `server.js`).
  Chiêu chỉ đánh SAU khi từ đã tìm nổ và chữ rơi xuống xong; bom rung màn, bàn cờ có tia sét lan giữa các ô đen (người dùng chốt 26/11/2026). Nền mây trôi là nền của bản
  video TikTok, chỉ dùng cho khung này. Đừng tự đổi các con số trên; "từ có nghĩa" là `dict.isPlayable` (sau mỗi lần rơi bảng còn ít nhất 8 từ Migii).
- Khung Hái từ (`haitu`, lúc đầu tên Fruity): hình phải là **ảnh thật hoặc ảnh vẽ dễ nhận, không dùng emoji** (người dùng chốt 19/11/2026).
  Ảnh sinh bằng AI qua cổng llm.eup.ai (`build_hai_tu_anh.js`, 9 vật/lần gọi): báo người dùng số lần gọi × giá và chờ đồng ý trước khi chạy
  kèm `--dong-y` (luật chi phí của PM). Nếu dùng ảnh chụp thì chỉ phạm vi công cộng / CC0; nguồn từng ảnh ghi vào `data/hai-tu-anh.json`. Bộ từ soạn tay theo
  30 chủ đề (`data/hai-tu/`), không từ kho Migii, cần Migii duyệt; `vi` trên ô không được chứa sẵn đáp án tiếng Anh.
- Khung Đoán quốc kỳ (`flag`, người dùng đặt 26/11/2026): 20 giây mỗi cờ; chỉ tính khi gõ tên nước bằng **tiếng Anh**; đúng 10 giây mà chưa ai
  đúng thì hiện 4 tên nước (1 tên đúng) để chọn và gõ lại, ô gợi ý không gắn A–D vì người xem phải gõ tên chứ không gõ chữ cái. Bot không được
  gõ đúng trước mốc 10 giây (`bots.js`), kẻo gợi ý không bao giờ hiện lúc vắng người. Kho `data/quoc-ky.json` soạn tay, chỉ nước thành viên
  Liên Hợp Quốc, chưa ai duyệt; sửa xong chạy `node check_quoc_ky.js`.
- Nói về điểm thì dùng "ước tính"; phần miễn phí là Part 1, 2, 5. Luật cho MC AI nằm trong prompt ở `ai.js`.
- Lời dẫn Ninja đọc nằm ở `public/kich-ban.js` (lấy bằng `kb('mục', {…})` trong `public/index.html`); lời đọc đủ luật từng khung ở
  `SEG_INTRO`. Thêm khung mới thì thêm mục `khung.<id>` (tên, luật gọn, câu chào, câu mời). Sửa xong nghe lại bằng `npm run demo`.
- Người chơi ảo (bot, `bots.js`) **mặc định bật 6** từ 12/11/2026: người dùng chốt cần bot để mọi khung chạy được lúc mới mở live.
  Bot không gắn nhãn trên màn live (lộ ra thì ảnh hưởng uy tín, đã nói với người dùng), nên giữ các chặn: không lên vinh danh /
  bảng vàng, không được khen "nhanh nhất", không chiếm hạng của người thật, không làm MVP / kỷ lục Thế chữ. Tắt: `--bots 0`.
  Thêm khung mới thì thêm cách chơi cho bot trong `bots.js` và gọi `botsAsk`/`botsCross`/`botsChain` ở `server.js`.

## Demo gia sư (`gia-su/`)

Bản thử "gia sư tự động" cho app (bài học tự chạy theo kịch bản, chỉ trỏ, highlight, bài tập xen giữa), tách hẳn khỏi game live:
`npm run demo:gia-su` (cổng 8795). Đang ở bước chốt **phần trình bày**; hỏi đáp AI (nhắn tin, giọng nói) làm sau khi người dùng duyệt.
Nội dung bài là nội dung tạm, **không lấy kho của app** (người dùng chốt 23/11/2026); nội dung bài lên kế hoạch riêng cùng người dùng.
Cách viết bài và chụp thử: [gia-su/README.md](gia-su/README.md).

- **Live thử** (người dùng yêu cầu 23/11/2026): `./gia-su/live.sh` phát 100 bài (`gia-su/nguon/*.js` → `npm run build:gia-su`) lên TikTok,
  người xem trả lời câu hỏi bằng bình luận. Tương tác mỗi câu **không quá 5 giây** (cảm ơn người đúng đầu tiên, sửa cho người sai một chút):
  người dùng chốt, đừng kéo dài. 100 bài do AI soạn, **chưa ai duyệt** mà lên sóng công khai: sửa lỗi thì sửa ở `nguon/` rồi dựng lại.
  Thứ tự phát theo 11 chương chủ đề (`nguon/0-chuong.js`: từ vựng cùng chủ đề liền nhau, ví dụ ngữ pháp dùng từ của chương) và nội dung
  phải đứng trên màn đủ lâu để đọc kịp (`giuPhan` trong `gia-su.js`): người dùng chốt 23/11/2026, đừng xếp xen kẽ hay rút nhịp lại.
  Bài từ vựng có mode **Dịch câu** (người xem bình luận câu tiếng Anh, chấm theo đáp án soạn sẵn, không AI; nêu bật bình luận
  ≤ 10 giây, riêng mode này): người dùng duyệt kế hoạch 23/11/2026. Muốn chấm bằng AI (llm.eup.ai) phải xin duyệt chi phí trước.
- Không chạy cùng lúc với game live (cùng đọc bình luận một kênh). Không có người xem ảo trên live thật (`--sim` chỉ để tập).
- **Video TikTok** (từ 25/11/2026 người dùng chuyển phần học sang đăng video): `gia-su/xuat-video.js`. Người dùng chốt: chỉ đọc tiếng Anh
  + tiếng Việt, xúc tích, không câu dẫn ("Nghĩa là", "Thử dịch…", "Đáp án:"), không phụ đề; câu hỏi đếm 10 giây rồi hiện đáp án, không
  mời bình luận; cuối video có màn kết nền trắng, đơn giản (Ninja lướt qua như game live, follow kiểu TikTok, tải app); chữ dùng font
  của app (SVN-Avo). Lời đọc bản video là trường `video` trong `build_bai.js` (→ `bai/video/`).
  Người dùng duyệt animation trên trang xem trước (`npm run xem-video:gia-su`) rồi mới xuất vào `data/video/`.

## Thống kê

- `stats.js` ghi sự kiện ra `data/stats/*.jsonl` (ngoài git, mã người xem đã băm) và dựng trang `/stats`.
  Thêm khung mới không phải sửa gì: sự kiện ghi theo id khung. Thêm nguồn tương tác mới thì gọi `stats.user(<loại>, user, …)` ở `server.js`.
- Không ghi bot (`bot:`) và bình luận thử từ màn điều khiển (`test:`). Bot phải luôn có `bot: true` để không lọt vào số liệu.
- Đổi cách tính thì kiểm bằng dữ liệu dựng tay qua `analyze()` (xem `module.exports`) trước khi xem trang.
- Gia sư live có nhật ký riêng (`gia-su/nhat-ky.js` → `data/gia-su-stats/`) và **ghi nội dung mọi bình luận**, cả lúc không làm bài
  (khác game: người dùng chốt 23/11/2026 để đọc góp ý và soát đáp án dịch). Vẫn không ghi tên, mã người xem băm cùng muối với game.
  Đọc: `npm run binh-luan:gia-su` (`-- --ngoai`, `-- --dich`).

## Kho từ

- Nguồn: gói `vi.zip` mà app tải ở phần Lý thuyết, đọc lúc build bằng `build_bank.js`. Game không gọi API lúc live
  (đã chốt 09/11/2026): `migii_toeic_api` không có API từ vựng; `migii_toeic_svc` có bảng vocab nhưng chỉ nghĩa
  tiếng Anh và cần token. Khi có API từ vựng kèm nghĩa tiếng Việt thì chỉ đổi nguồn trong `build_bank.js`.
- Sửa kho: ghi vào `data/chinh-sua-tu.json` rồi `npm run build:bank`. `data/bank.json` là file sinh ra, build lại sẽ ghi đè.

## Kiểm tra thay đổi

- Chạy thử: `npm run demo`, mở `http://localhost:8788/`. Cổng 8788 để chạy chung máy với bản Jaemy (8787).
- Thay đổi giao diện xong khi **mọi khung bị ảnh hưởng đã được chụp và xem**, nội dung chính nằm gọn trong y 150–1600
  (mép trên bị thanh tên kênh che, góc dưới trái bị khung bình luận che), chữ dài không tràn. Cách chụp:
  1. `node server.js --sim --mute --port 8790 --program-order <các khung cần xem> --round 60 --questions 5 &`
  2. Đổi màn: `curl -s -X POST localhost:8790/cmd -d '{"cmd":"startGame"}'` (các lệnh khác: `next`, `endGame`, `outro`).
  3. Chụp 540×960 (= 1080×1920 thu nhỏ 1/2): Chrome `--headless=new --hide-scrollbars --mute-audio --window-size=540,960
     --force-device-scale-factor=1 --virtual-time-budget=2500 --user-data-dir=<thư mục tạm> --screenshot=<file>.png
     "http://localhost:8790/?mute=1"`.
  4. Tắt server thử theo PID của nó. Server live chỉ tắt bằng `./go_live.sh stop` (đọc `data/server.pid`).
- Đổi luật chấm: chạy `--sim`, gửi bình luận giả `curl -s -X POST localhost:8790/chat -d '{"name":"An","text":"2"}'`
  (quà: `{"name","gift","diamonds","count"}`), xem điểm trên màn điều khiển `/control`.

## Git

- Chưa có remote `origin`: đẩy lên GitHub khi người dùng cho tên repo. Commit message viết tiếng Việt như repo gốc.
- `.env`, `data/scores-*.json` (chứa tên người xem), `data/en-audio/` nằm ngoài git.
- Kéo sửa lỗi từ bản Jaemy: `git fetch upstream && git merge upstream/main`. Xung đột thường ở `public/index.html`
  và `server.js` (chữ, màu, kho từ): giữ phần Migii, nhận phần sửa logic.
