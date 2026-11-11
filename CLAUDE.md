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
- Câu miễn trừ ETS (`#ets` trong `public/index.html`) hiện ở mọi màn, kể cả màn mới thêm.
- Nói về điểm thì dùng "ước tính"; phần miễn phí là Part 1, 2, 5. Luật cho MC AI nằm trong prompt ở `ai.js`.
- Người chơi ảo mặc định tắt (`--bots 0`): bot không gắn nhãn, kênh của thương hiệu giáo dục bị lộ thì mất uy tín.
  Chỉ bật khi người phụ trách kênh quyết.

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
