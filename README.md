# Migii TOEIC Live — game livestream TikTok đố từ vựng TOEIC

Game chạy trên một trang web dọc 1080×1920 để phát lên TikTok LIVE và kéo người xem về app **Migii TOEIC**.
Server đọc **bình luận và quà** của phiên live theo thời gian thực, tự chấm điểm, đọc lời dẫn, phát âm từ tiếng Anh
và vinh danh người chơi. Không cần người dẫn; có màn điều khiển riêng để can thiệp.

> **Trước khi lên live thật, đọc [CAN-CUNG-CAP.md](CAN-CUNG-CAP.md)**: các thông tin cần điền và các việc cần xác nhận
> (pháp lý nội dung, tài khoản TikTok, link tải app, người chơi ảo…).

Repo này là bản fork của [tiktok-live-quiz](https://github.com/eup-repo/tiktok-live-quiz) (bản cho app Jaemy, tiếng Hàn).
Remote `upstream` trỏ về repo gốc. Repo này **chưa có remote riêng**: tạo repo trên GitHub rồi `git remote add origin …`.

## Nội dung câu hỏi

- **Chỉ dùng kho từ vựng của Migii**: lấy từ gói Lý thuyết mà app tải về (`migiitoeic.eupgroup.net/uploads/theory/vi/vi.zip`).
  `build_bank.js` lọc còn khoảng **1.397 từ** (đủ 4 mức: Basic, 500–650, 650–800, 800+), kèm phiên âm IPA, từ loại, nghĩa
  tiếng Việt, và câu ví dụ đúng nghĩa (khoảng 700 từ có).
- **Không dùng ngân hàng câu hỏi đề thi** (Part 1–7): bộ đó đang có vấn đề bản quyền
  (`migii_toeic_docs/05-yeu-cau-thay-doi/yc-004`). Phát live là phát công khai, rủi ro cao hơn trong app.
- Phát âm tiếng Anh: lấy từ dịch vụ đọc của Migii (`audio.eupgroup.net`, cùng dịch vụ app dùng), lưu cache ở `data/en-audio/`.
  Lỗi thì trang tự đọc bằng giọng tiếng Anh của trình duyệt.

Cập nhật kho: `npm run build:bank`. Tạo sẵn phát âm cả kho trước buổi live: `npm run build:audio` (khoảng 1.400 lượt gọi, chạy 1 lần).

**Sửa kho bằng tay:** ghi vào `data/chinh-sua-tu.json` (bỏ từ, sửa nghĩa/câu ví dụ, thêm từ app chưa có; có ví dụ trong file),
rồi chạy `npm run build:bank`. Đừng sửa thẳng `data/bank.json`: lần build sau sẽ ghi đè. Phần trong `chinh-sua-tu.json`
được áp sau khi tải gói của app nên luôn được giữ. `bank.json` ghi mỗi từ một dòng để xem thay đổi trên git.

## Bốn kênh theo mốc điểm

Chia kênh theo các mốc quen thuộc với người học TOEIC (chốt 11/11/2026 sau buổi chơi thử trong công ty). Mỗi kênh là một
server chạy các **khung** xen kẽ; giữa 2 khung có màn **vinh danh top 3** và màn chờ.

| Kênh | Khung chạy xen kẽ | Lệnh chạy thử |
|---|---|---|
| Dưới 450 | Word (từ mốc 300 + 400) · Start or End · Săn từ · Thế chữ | `npm run demo:duoi450` (cũng là mặc định của `npm run demo`) |
| 450–650 | Word (từ mốc 500 + 600) · Điền từ · Nghe – nghĩa · Săn lỗi · Giải ô chữ | `npm run demo:450-650` |
| 650–800 | Word (từ mốc 700) · Đọc nhanh (bài mốc 700) · Nghe – chép | `npm run demo:650-800` |
| 800+ | Word (từ mốc 800 + 900) · Đọc nhanh (bài mốc 800) | `npm run demo:tren800` |

Tiêu chí chọn game (rút ra từ buổi chơi thử): mỗi câu **ngắn**, **không phải nghĩ phức tạp**, **ít thao tác** (thường chỉ gõ
`A`–`D`), **hiệu ứng bắt mắt**. Người xem lướt TikTok để giải trí, gặp bài khó là lướt qua. Người chơi thử đề nghị bỏ các khung
nghe, Săn từ, Giải ô chữ, Săn lỗi và Giờ học; **chưa bỏ**, vẫn chạy trong kênh như cũ cho tới khi quyết.

| Khung | Cách chơi | Người xem gõ |
|---|---|---|
| 🔤 Word | 4 kiểu đề xen kẽ: cho từ chọn nghĩa, cho nghĩa chọn từ, tìm từ đồng nghĩa, tìm từ trái nghĩa. **10 giây** mỗi câu | `A`–`D` |
| 🎯 Start or End | Tìm 5 từ tiếng Anh bắt đầu hoặc kết thúc bằng chữ cho trước (`ca____`, `____tion`), 45 giây, 5 câu mỗi lượt | 5 từ cách nhau bằng dấu cách hoặc dấu phẩy |
| 🔎 Săn từ | Ma trận chữ 10×10, tìm từ nối liền theo 8 hướng (cả ngược); ai tìm đủ 5 từ trước ăn điểm; 120 giây, 3 bảng mỗi lượt | các từ tìm được |
| 🔗 Thế chữ | Mọi người chơi chung (không chia đội): đổi đúng 1 chữ cái để ra từ mới, ai nhanh tay thì giữ từ và hiện hình dưới từ; người khác thế được thì đổi người giữ. Hết 12 giây không ai thế được thì người giữ từ thắng ván, chỉ người thắng +10 | gõ từ mới |
| ✏️ Điền từ | Câu thiếu 1 từ, chọn A–D; sau đó có lời giải bằng chữ và giọng nói, kèm phương án sai được chọn nhiều nhất (số phiếu thật) và lý do hay nhầm. 20 giây, giải thích 18 giây, 5 câu mỗi lượt | `A`–`D` |
| 🎧 Nghe – nghĩa | Phát audio một lần, ô chữ theo số chữ cái, cứ 2 giây hiện thêm một loại chữ cái, 3 giây cuối hiện hết; chọn nghĩa tiếng Việt, đáp án nhiễu cùng chủ đề. 12 giây, 8 câu mỗi lượt | `A`–`D` |
| 🔍 Săn lỗi | Câu có đúng 1 từ sai (chính tả hoặc ngữ pháp). 30 giây, 5 câu mỗi lượt, công bố 15 giây | `từ sai - từ đúng` |
| 🔠 Giải ô chữ | Mỗi hàng là một từ mốc 600 (đề: nghĩa tiếng Việt + số chữ cái), 30 giây mỗi hàng; từ khoá hàng dọc +50 | chữ thường giải hàng, CHỮ HOA đoán từ khoá |
| 📰 Đọc nhanh | Văn bản ngắn kiểu Part 7 + 1 câu hỏi chi tiết + 4 phương án **hiện cùng lúc**, 20 giây; công bố tô vàng đoạn chứa đáp án, lời giải, phương án sai chọn nhiều nhất. 5 bài mỗi lượt | `A`–`D` |
| 🎙️ Nghe – chép | Nghe câu tiếng Anh (phát lặp lại, cách 5 giây), gõ lại cả câu; cứ 2 giây hiện thêm 1 loại chữ cái. 40 giây, 5 câu mỗi lượt | cả câu tiếng Anh |

Điểm các khung trên: đúng nhanh nhất **+10**, hạng 2 **+5**, hạng 3 **+3**, những người đúng sau đó **+1**; sai thì 0, không trừ.
Khung `A`–`D` chỉ tính **lần chọn đầu**; khung gõ chữ (Start or End, Săn lỗi, Nghe – chép, Giải ô chữ) được gõ lại. Thế chữ không có điểm.

**Hiệu ứng** (`public/theme-light.css`, phần cuối): thanh thời gian chuyển **đỏ khi chạy quá nửa**; **3 giây cuối** số giây thành
huy hiệu có lửa, số đếm lớn ⏰ 3-2-1 🔥 hiện giữa màn kèm tiếng tích tắc và viền đỏ nhấp nháy; **trả lời đúng** thì điểm bay lên
từ ô Câu trả lời kèm pháo hoa nhỏ, người nhanh nhất thêm mưa giấy và thẻ "⚡ nhanh nhất"; **trả lời sai** thì dòng hiện
"✗ chưa đúng" màu đỏ, rung nhẹ; **công bố** thì đáp án đúng nảy lên, toả sáng, phương án sai rung.

### Dữ liệu từng khung

- **Word** đọc câu hỏi làm sẵn trong `data/word-<mốc>.json`; `--word-file` nhận nhiều file cách nhau dấu phẩy
  (`--word-file data/word-300.json,data/word-400.json`). Từ lấy từ bảng `vocab` (`moc_diem`) của `migii_toeic_svc`; nghĩa tiếng Việt /
  đồng nghĩa / trái nghĩa / chủ đề (`topic`, để chọn đáp án nhiễu cùng chủ đề) soạn bằng AI, **cần người Migii duyệt trước khi lên sóng**.
  Từ chức năng và từ nhạy cảm bị loại (ghi trong `loai`). Sửa `words` rồi chạy `npm run build:word<mốc>` để sinh lại `questions`
  (đừng sửa `questions` bằng tay).

  | Mốc | Từ dùng | Câu | Ghi chú |
  |---|---|---|---|
  | 300 | 376 | 971 | loại 82 từ chức năng |
  | 400 | 982 | 2.437 | |
  | 500 | 981 | 2.603 | |
  | 600 | 895 | 2.122 | |
  | 700 | 814 | 2.341 | soạn 11/11/2026 |
  | 800 | 803 | 2.379 | soạn 11/11/2026 |
  | 900 | 750 | 2.238 | soạn 11/11/2026, loại nhiều từ nhạy cảm (chính trị, tôn giáo, bạo lực, rượu) |

- **Start or End** kiểm từ bằng từ điển Hunspell en_US (`dict.js`, gói `nspell` + `dictionary-en`): nhận mọi dạng chia từ, từ chối tên
  riêng/địa danh viết thường; vài tên Hunspell vẫn nhận (`john`, `china`…) nằm trong danh sách chặn ở `dict.js`. Cụm chữ chọn trong `startend.js`
  (`node startend.js` liệt kê và thử). Nhịp riêng: 45 giây, 5 câu mỗi lượt, công bố 8 giây (khai báo trong `SEGMENTS`).
- **Thế chữ** (luật 13/11/2026): ván = một chuỗi, ra từ 4 chữ, không chia đội, không cần `join`. Từ hợp lệ = đổi đúng 1 chữ cái, có trong từ điển (`dict.js`), chưa dùng trong ván; người đang giữ từ không được tự thế. Mỗi lượt: đồng hồ đứng 4 giây (`CHAIN_GRACE`) → đếm 12 giây (`SEGMENTS.chain.sec`) → về 0 thì ngầm chờ thêm 3 giây (`CHAIN_LATE`, bù độ trễ TikTok) rồi mới chốt người thắng (+10, `CHAIN_WIN`). Kỷ lục chuỗi lưu `data/the-chu-record.json`. Bot có chơi nhưng nhường dần khi có người thật.
- **Điền từ**: câu trong `data/dien-tu-500.json` (`--fill-file` để đổi). Câu do AI viết mới rồi được hai lượt kiểm chứng độc lập (không dùng ngân hàng Part 5 của `migii_toeic_svc` vì chưa có xác nhận bản quyền, xem YC-004). Mỗi câu có `why` (vì sao đúng), `wrong` (lý do từng phương án sai) và `tip`. Công bố: ô lời giải thay bảng điểm, đọc thành tiếng phần `why` và lý do của phương án sai được chọn nhiều nhất.
- **Đọc nhanh**: bài trong `data/doc-nhanh-700.json` (kênh 650–800) và `data/doc-nhanh-800.json` (kênh 800+), chọn bằng `--read-file`.
  Mỗi file 100 bài AI viết (email, thông báo, quảng cáo, ghi nhớ, tin nhắn, lịch trình; 28–48 từ), mỗi bài dùng một từ vựng của mốc.
  Bài 800 khó hơn: từ mốc 800–900 và phần lớn đáp án là cách **diễn đạt lại** câu trong bài như đề thi thật. Mỗi bộ đã kiểm chứng mù
  (người kiểm chứng tự làm bài khi chưa biết đáp án, phương án đã xáo); **cần người Migii duyệt**.
- **Săn từ**: 20 ma trận dựng sẵn trong `data/san-tu-400.json` (`--hunt-file` để đổi). Mỗi bảng giấu 10 từ (4–8 chữ cái, từ mốc 400) theo 8 hướng, rồi quét kỹ toàn bảng: mọi từ thật từ 4 chữ cái trở lên nằm trong bảng đều ghi vào danh sách của bảng đó, người xem gõ từ nào thì chỉ tra danh sách này. Bảng bị loại nếu có từ tục tĩu mọc ra (trừ khi nằm trọn trong từ dài hơn như `ass` trong `class`). Mỗi người cộng dồn các từ hợp lệ, đủ 5 từ khác nhau trước thì ăn điểm.
- **Nghe – nghĩa**: lấy từ bộ từ của `--word-file`; đáp án nhiễu ưu tiên cùng `topic` và cùng từ loại. Từ chưa có trong kho phát âm sẽ được tải khi cần; tạo sẵn trước buổi live bằng `node build_audio.js --words data/word-500.json --fill data/dien-tu-500.json` (làm thêm với `data/word-600.json`).
- **Săn lỗi**: câu trong `data/san-loi-600.json` (`--err-file` để đổi): nửa lỗi chính tả (`cupon`), nửa lỗi ngữ pháp / dạng từ. Phải đúng cả hai từ, không phân biệt hoa thường, ngăn cách bằng `-`, `→`, `->` hay `>`; gõ sai được gõ lại. Công bố bằng chữ và lời nói: lỗi gì, vì sao, mẹo nhớ, từ bị nghi nhầm nhiều nhất. Trường `accept` liệt kê các cách sửa khác cũng đúng. **Cần người Migii duyệt**.
- **Giải ô chữ**: ô chữ dựng sẵn bằng `npm run build:ochu600` → `data/o-chu-600.json` (24 ô; `--cross-file` để đổi). Mỗi ô có một **từ khoá** 5–9 chữ cái đọc theo cột dọc; người đầu tiên giải hàng thì hàng hiện chữ và những người đúng trong 10 giây sau vẫn được điểm. Từ khoá (CHỮ HOA) chỉ mở khi đã giải **hơn một nửa** số hàng; mỗi người đoán 1 lần sau mỗi hàng. Mỗi lượt khung chơi đúng 1 ô chữ.
- **Nghe – chép**: khoảng 230 câu trong `data/nghe-chep-700.json` (`--dict-file` để đổi), 8–14 từ, mỗi câu dùng một từ mốc 700, chỉ gồm chữ cái và `, . ?`. Chấm: đúng từng từ, đúng thứ tự, bỏ qua hoa thường và dấu câu; câu đúng không hiện lên màn để người khác không chép. Audio phát lặp lại mỗi 5 giây, `/api/say` chỉ đọc các câu có trong kho; tạo sẵn trước buổi live: `npm run build:audio700`. **Cần người Migii duyệt**.

Các khung gốc của bản Jaemy (dùng kho `bank.json`) chưa thuộc kênh nào: 📖 Giờ học (Ninja dạy 3 từ rồi kiểm tra, gọi tên từng bạn),
⚡ Đố nhanh, 🧩 Ghép chữ, 🔁 Chọn từ tiếng Anh, 🎧 Luyện tai (chỉ nghe, không hiện chữ), ✍️ Nghe & gõ chính tả, 🥊 So găng 2 đội.
Chạy bằng `--program-order class,quiz,scramble,listen,reverse,type` (chương trình cũ), thêm `team` để bật So găng. Chơi một kiểu cố định:
`--quiz` hoặc `--class`. Mức từ: `--level easy|mid|hard|all`. Giờ học, Luyện tai, Nghe & gõ chính tả giữ 15 giây mỗi câu; các khung còn
lại theo `--round` (mặc định 10 giây). Điểm: đúng nhanh nhất +10, rồi 8, 6, 4… (tối thiểu 3); được gọi tên mà đúng +5.

Tặng quà: +điểm (tối đa 50) và x2 điểm cho 3 câu tiếp. Bảng vàng theo ngày lưu ở `data/scores-YYYY-MM-DD.json`.

## Cài đặt và chạy thử

Cần: macOS, Node 18+, Google Chrome, các lệnh `curl`, `unzip`, `sqlite3` (macOS có sẵn). Tuỳ chọn: OBS.

```bash
npm install
cp .env.example .env          # điền theo CAN-CUNG-CAP.md
npm run demo                  # = node server.js --sim: khán giả ảo, không cần TikTok
```

Mở `http://localhost:8788/` (màn live) và `http://localhost:8788/control` (màn điều khiển). Cổng mặc định **8788**
(bản Jaemy dùng 8787) để hai bản chạy chung một máy không đụng nhau.

## Chạy thử mọi game cùng lúc

`npm run demo:all` (= `node gateway.js --port 8789`) bật **25 tiến trình** (mỗi kênh 1 mục "cả kênh" chạy xen kẽ như lúc live, từng game của kênh, và 7 game gốc), mỗi tiến trình một server riêng (khán giả ảo `--sim`, tự chạy lặp, không cần bấm Bắt đầu) dưới **một cổng**, mỗi game một đường dẫn:

- `http://localhost:8789/` — danh sách game, ô chép địa chỉ để gửi người khác (kèm địa chỉ LAN `http://<IP máy>:8789/<tên>/`).
- `http://localhost:8789/<tên>/` — màn live của game; `http://localhost:8789/<tên>/control` — màn điều khiển.
- Tên: `duoi-450 word-duoi-450 startend hunt chain` · `450-650 word-450-650 fillin listenmean errhunt crossword` · `650-800 word-650-800 speedread dictate` · `tren-800 word-tren-800 speedread-tren-800` · game gốc `class quiz scramble reverse listen team type`. Link cũ `word300`, `word400`, `word500` tự chuyển sang Word của kênh mới. Chỉ bật vài game: `node gateway.js --only speedread,fillin`.
- Máy khác trong mạng chỉ **xem** được; muốn điều khiển phải thêm `?key=<khoá>` (khoá in ra khi chạy, đổi bằng `--key`). Trang danh sách chỉ hiện link điều khiển kèm khoá khi mở từ chính máy chạy.
- Gõ bình luận / lệnh bằng curl nhớ thêm tên game vào đường dẫn: `curl -s -X POST localhost:8789/speedread/chat -d '{"name":"An","text":"B"}'`.
- Mỗi tiến trình ghi điểm và từ đã hỏi riêng (`--tag`), log ở thư mục tạm `migii-gateway/<tên>.log`. Cổng con 18800 trở lên, dừng cổng chung thì các game con tắt theo.

## Lên live

Giống bản gốc, chỉ đổi cổng và tên profile OBS (`MigiiToeicLive`):

1. Bấm đúp **`▶ Bật game live.command`** (= `./go_live.sh studio`): bật server đọc chat của `TIKTOK_USER`, mở cửa sổ Chrome
   dọc cho LIVE Studio chụp, mở OBS camera ảo (nếu có OBS) và màn điều khiển.
2. LIVE Studio: chế độ dọc, nguồn **Camera → "OBS Virtual Camera"** hoặc **chụp cửa sổ** "Đố từ vựng TOEIC · Migii".
   Bật âm thanh ứng dụng để có giọng đọc.
3. Bấm **Go LIVE**, rồi bấm **▶ Bắt đầu** trên màn điều khiển.
4. Kết thúc: bấm đúp **`■ Tắt game live.command`** (= `./go_live.sh stop`), rồi **End LIVE** trong LIVE Studio.

- **Chọn kênh** (game của mức điểm nào): ghi `KENH=` trong `.env` hoặc thêm tên kênh sau lệnh, vd `./go_live.sh studio 450-650`.
  Tên kênh: `duoi450` (mặc định) · `450-650` · `650-800` · `tren800`, giống các lệnh `npm run demo:<kênh>`.
- **Server tự bật lại** nếu chết giữa live: khoảng 3 giây, lượt mới tự chạy, màn live tự nối lại, bảng vàng không mất. Log ở `data/server.log`.
- **Độ nét**: LIVE Studio chụp cửa sổ theo điểm ảnh thật. Trên màn 1080p thường cửa sổ game chỉ khoảng 575×1023 nên hình lên sóng bị mờ.
  Cài OBS (miễn phí) để `go_live.sh` tự bật camera ảo 1080×1920 rồi chọn nguồn Camera "OBS Virtual Camera" trong LIVE Studio,
  hoặc kéo cửa sổ game sang màn Retina của MacBook.

Có stream key (LIVE Producer): điền `TIKTOK_RTMP_URL`, `TIKTOK_STREAM_KEY`, chạy `./go_live.sh` để OBS phát thẳng.

## Thống kê tương tác

Server ghi lại mọi bình luận, quà, like, follow, share và lượt vào phòng của người xem thật vào `data/stats/<ngày>.jsonl`.
Mỗi sự kiện kèm game đang chơi, câu, pha và số người xem lúc đó. Không ghi bot, tên hay nội dung bình luận; mã TikTok được băm.
Chỉ tính lúc đã nối TikTok. Chạy thử `--sim` ghi file riêng (`sim-…`) và có số người xem giả.
Server sau cổng chạy thử 25 game (`npm run demo:all`) và script xuất ảnh không ghi.

Xem báo cáo: nút **📊 Thống kê** trên màn điều khiển, hoặc `http://localhost:8788/stats` (máy khác cần `?key=CONTROL_KEY`).
Chọn khoảng ngày, kênh, live thật hay chạy thử. Trang gồm:

- **Theo game**: phút phát, người xem trung bình, người xem tăng/giảm trong lượt, người chơi mỗi lượt, tỉ lệ tham gia, bình luận / like /
  người vào mỗi phút, kim cương, follow, share, **chơi đến cuối** (người chơi nửa đầu còn chơi nửa sau) và **sang game sau**
  (người chơi lượt này còn chơi lượt kế).
- **Theo khung giờ** (giờ Việt Nam) và **game × khung giờ** (bình luận/phút, người xem, like/phút).
- **Các phiên live** và **từng lượt game**. Mỗi bảng tải được CSV để mở bằng Excel.

Báo cáo chạy thẳng trên file `jsonl` mỗi lần mở trang, mặc định 7 ngày gần nhất.

## Khác với bản Jaemy

| Phần | Bản Jaemy | Bản này |
|---|---|---|
| Kho từ | CDN Jaemy, tiếng Hàn | Gói từ vựng Migii TOEIC, tiếng Anh (`build_bank.js`) |
| Đáp án nhiễu | Cùng khoá học | Cùng **từ loại** + cùng mức |
| Phát âm | mp3 có sẵn trên CDN Jaemy | Dịch vụ đọc Migii + cache (`en_audio.js`, `/api/say`) |
| Ghép chữ | Âm tiết Hangul, nhận romaja | Chữ cái tiếng Anh (chữ thường), nhận gõ cả từ |
| Gõ chữ | Bỏ khỏi chương trình (chữ Hàn khó gõ) | Có khung ✍️ Nghe & gõ chính tả |
| Thương hiệu | Cáo Jaemy, nền navy | Ninja Migii, **giao diện sáng** theo design system Migii (`public/theme-light.css`) cho cả màn live, màn điều khiển và trang danh sách chạy thử; không còn bản tối, font tiêu đề Migii Serif (OFL) |
| Câu miễn trừ ETS | — | Ẩn trên mọi màn từ 12/11/2026 theo yêu cầu người dùng (`#ets` trong `theme-light.css`); hiện lại bằng cách bỏ `display: none` |
| MC AI | Cáo Jaemy | Ninja Migii, thêm luật thương hiệu (không hứa "dự đoán chính xác điểm"…) |
| Người chơi ảo | 6 bot/câu, không gắn nhãn, chỉ khung trắc nghiệm | 6 bot (tự giảm khi đông người thật, tối thiểu 2), chơi được **mọi khung**: vào đội Thế chữ cho đủ người, giải hàng ô chữ, Săn từ, Start or End… Tắt: `--bots 0` |
| Tắt server | `pkill` mọi `node server.js` trên máy | Chỉ tắt server của repo này (theo `data/server.pid`) |
| Mac ngủ giữa live | Không chặn | `caffeinate` giữ máy và màn hình thức khi server còn chạy |
| Đường dẫn ngoài repo | `../../claude-api`, `../../jaemy-feature-guide`… | Bỏ hết, chỉ đọc từ `.env` |
| Mã QR | Có sẵn (link Jaemy) | Tạo từ `APP_LINK`: `npm run build:qr`; chưa có thì ô QR tự ẩn |

## Các thành phần

| File | Vai trò |
|---|---|
| `server.js` | vòng chơi, chấm điểm, đọc chat TikTok (`tiktok-live-connector`), WebSocket cho 2 màn |
| `gateway.js` | cổng chung chạy thử mọi game cùng lúc (`npm run demo:all`): mỗi game một tiến trình, mỗi game một đường dẫn `/<tên>/` |
| `public/index.html` | màn live 1080×1920 |
| `public/control.html` | màn điều khiển |
| `build_bank.js` | tạo `data/bank.json` từ gói từ vựng Migii |
| `build_word.js`, `data/word-300.json`, `data/word-400.json` | câu hỏi khung Word (mốc 300, 400), sinh từ danh sách từ trong chính file JSON (`node build_word.js 400`) |
| `build_san_tu.js`, `data/san-tu-400.json` | ma trận khung Săn từ dựng sẵn (`node build_san_tu.js --count 10 --append` để thêm bảng) |
| `data/doc-nhanh-700.json` | bài khung Đọc nhanh (mốc 700) |
| `data/nghe-chep-700.json` | câu khung Nghe – chép (mốc 700); `node build_audio.js --sentences data/nghe-chep-700.json` tạo sẵn audio |
| `build_o_chu.js`, `data/o-chu-600.json`, `data/san-loi-600.json` | ô chữ dựng sẵn (khung Giải ô chữ) và câu khung Săn lỗi (mốc 600) |
| `startend.js`, `dict.js` | khung Start or End: chọn cụm chữ, kiểm 5 từ; `dict.js` là từ điển Hunspell và danh sách từ tục tĩu bị chặn |
| `en_audio.js`, `build_audio.js` | phát âm tiếng Anh (dịch vụ đọc Migii + cache) |
| `build_qr.js` | tạo mã QR tải app từ `APP_LINK` |
| `ai.js` | MC AI "Ninja Migii" trả lời bình luận (gateway nội bộ; không có token thì tự tắt) |
| `tts.js` | giọng đọc tiếng Việt VieNeu chạy local (không có thì dùng giọng trình duyệt) |
| `bots.js`, `sim.js` | người chơi ảo cho live thật (mặc định 6) và khán giả ảo cho `--sim` |
| `stats.js` | ghi sự kiện tương tác (`data/stats/`) và trang thống kê `/stats` |
| `go_live.sh`, `obs/setup_obs.js` | bật/tắt live, cấu hình OBS |

## Kéo bản sửa lỗi từ repo Jaemy

```bash
git fetch upstream
git merge upstream/main     # xung đột hay gặp ở public/index.html và server.js (chữ, màu, kho từ)
```

## Lưu ý

- `tiktok-live-connector` là thư viện **không chính thức**, có thể hỏng khi TikTok đổi giao thức.
- ~140px mép trên bị thanh tên kênh TikTok che, góc dưới trái bị khung bình luận che: nội dung chính để trong y 150–1600.
- Nền màu phẳng (không gradient) vì video live bị nén mạnh.
- Đừng commit `.env`, `data/scores-*.json` (chứa tên người xem) và `data/en-audio/`: đã có trong `.gitignore`.
