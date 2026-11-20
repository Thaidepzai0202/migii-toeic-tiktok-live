# Cần cung cấp và xác nhận trước khi lên live

Bản này đã chạy được ở chế độ thử (`npm run demo`). Để lên live thật cho kênh Migii TOEIC, cần các mục dưới đây.
Mục nào điền vào `.env` thì đã có sẵn dòng trong `.env.example`.

## A. Bắt buộc

| # | Cần gì | Ai cung cấp | Điền / làm ở đâu |
|---|---|---|---|
| 1 | **Xác nhận được dùng kho từ vựng và câu ví dụ của app trên live công khai.** Ngân hàng câu đề thi (Part 1–7) đang có vấn đề bản quyền nên bản này không dùng (`yc-004`). Phát live là phát công khai, cần pháp chế gật đầu cả với phần từ vựng | Anh Thái / pháp chế | — |
| 2 | **Tài khoản TikTok** sẽ phát live: ID kênh (không có `@`), đã đủ điều kiện mở LIVE / LIVE Studio. **12/11/2026 đã có ID** (`user6248655105596`, kênh mua, đã điền `.env`; kênh từng live trước đây). Còn: đăng nhập LIVE Studio bằng tài khoản này và xem có nút Go LIVE không; Marketing đổi mật khẩu TikTok + hotmail + email khôi phục (người bán vẫn biết). **Đổi tên kênh thì sửa `TIKTOK_USER` theo tên mới** | Marketing | `TIKTOK_USER` trong `.env` |
| 3 | **Link tải app cho mã QR**: nên là 1 link thông minh tự chuyển App Store / Google Play, có tham số chiến dịch (vd `utm_source=tiktok_live`) để đo người tải từ live. App đã có TikTok Business SDK | Marketing / growth | `APP_LINK` trong `.env`, rồi `npm run build:qr` |
| 4 | **Duyệt nội dung thương hiệu** đang hiện trên màn: tên "Migii TOEIC", câu "Luyện thi TOEIC trên điện thoại" (lấy từ landing page dùng thử, chưa chắc đang dùng), ảnh Ninja Migii, bộ màu sáng (bản tối xem bằng `?theme=dark`), lời dẫn đọc "Mi gi Tô ích". Câu miễn trừ ETS đã ẩn trên mọi màn (12/11/2026, người dùng quyết): nếu pháp chế yêu cầu thì bật lại | Design / marketing | `public/index.html` |
| 5 | ~~Quyết định người chơi ảo (bot)~~ **Đã chốt 12/11/2026: bật**, mặc định 6 bot, tự giảm khi đông người thật, chơi được mọi khung. Tên như người thật, **không gắn nhãn** trên màn live (bị phát hiện thì ảnh hưởng uy tín). Còn để ngỏ: có gắn nhãn bot không. Tắt: `--bots 0` hoặc kéo thanh trên màn điều khiển | Người dùng | — |
| 6 | **Máy Mac để chạy live**: macOS, Node 18+, Google Chrome, TikTok LIVE Studio; OBS nếu muốn camera ảo nét 1080×1920 | IT / người chạy live | — |

## B. Nên có (không có thì game vẫn chạy)

| # | Cần gì | Không có thì sao | Điền ở đâu |
|---|---|---|---|
| 7 | **Token gateway AI** cho MC "Ninja Migii" trả lời bình luận | AI tự tắt | `CLAUDE_API_TOKEN`, `AI_GATEWAY_URL` |
| 8 | ~~Giọng đọc VieNeu~~ **Đã cài 16/11/2026 trên máy này**: `uv venv --python 3.12 ~/.venvs/vieneu` rồi `uv pip install vieneu` (bản 3.8.4, chạy CPU). Đang dùng giọng Ngọc Linh, chờ người dùng nghe và chốt giọng. Máy live khác thì cài lại như vậy | Dùng giọng tiếng Việt của trình duyệt, kém tự nhiên hơn | `VIENEU_PY`, đổi giọng: `VIENEU_VOICE` |
| 9 | **Khoá Euler Stream** (dịch vụ ký request cho thư viện đọc chat) | Gói miễn phí bị giới hạn số lần nối/giờ; server tự lùi 2 phút khi bị chặn | `EULER_API_KEY` |
| 10 | **Chạy `npm run build:audio` một lần trên máy live** để tạo sẵn phát âm ~1.400 từ | Phát âm được lấy lúc chơi; mất mạng thì chuyển sang giọng tiếng Anh của trình duyệt | — |
| 11 | **Lịch live** để hiện trên màn cảm ơn cuối buổi | Màn cảm ơn ghi "Hẹn gặp lại ở phiên sau" | `NEXT_LIVE` |
| 12 | **Mã mở màn điều khiển từ điện thoại** | Tự sinh mỗi lần chạy, in ra trong `data/server.log` | `CONTROL_KEY` |
| 13 | **Repo GitHub** để đẩy code lên (tên, org, private/public) | Code chỉ nằm trên máy | `git remote add origin …` |

## C. Cần xác nhận thêm

- **App Store ID `1615348376`**: lấy từ code iOS (`HomeVC.swift`), chưa kiểm tra trên store. Chỉ ảnh hưởng nếu dùng làm link QR.
- **Font SVN-Avo** (font chữ chính của app): bản quyền dùng trên web/quảng bá chưa xác nhận, nên màn live đang dùng
  Be Vietnam Pro. Tiêu đề dùng Migii Serif (giấy phép SIL OFL, kèm file `public/fonts/OFL-MigiiSerif.txt`).
- **Quà đổi quyền trong Thế chữ** (thêm 19/11/2026 theo yêu cầu người dùng: 1 hoa ×2 điểm, 3 hoa đổi 2 chữ, 10 hoa ra từ mới và giữ từ;
  dải ưu đãi hiện ngay trên màn chơi). Chưa đối chiếu với quy định của TikTok: một nguồn bên thứ ba dẫn lại mục
  *Inauthentic Gift Requests* (trong app: Live Center → Rules and Guidance) nói không chạy game tính điểm dựa trên quà. Cần đọc mục đó
  trong app trước khi lên live; nếu vướng thì tắt bằng cách cho `CHAIN_GIFT` giá trị rất lớn và bỏ dải `.cgift`.
- **Lời mời trên màn hình**: hiện chỉ ghi "Ôn lại từ vừa chơi trong app". Nếu muốn ghi "1.677 từ vựng", "miễn phí Part 1, 2, 5"
  hay mã ưu đãi riêng cho người xem live thì cần marketing chốt câu chữ (theo `thuong-hieu.md`: phải nói rõ phần nào miễn phí,
  không hứa "dự đoán chính xác điểm").

## Sửa kho từ

Muốn bỏ từ, sửa nghĩa hay thêm từ: ghi vào `data/chinh-sua-tu.json` rồi chạy `npm run build:bank` (hướng dẫn và ví dụ có trong file).
Nếu pháp chế / marketing duyệt danh sách từ, gửi họ `data/bank.json` (mỗi từ một dòng) và ghi phần cần bỏ/sửa vào file trên.

## D. Việc chưa làm (đề xuất bước sau)

- Vòng **điền từ vào câu** (kiểu Part 5) sinh từ câu ví dụ của kho từ vựng, cần người duyệt câu.
- Vòng dùng **bộ câu hỏi mới có giấy phép** khi bộ của YC-004 được giao.
- **Đo lường**: số người quét QR / tải app theo từng phiên live.
