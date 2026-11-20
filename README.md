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
| Dưới 450 | Word (từ mốc 300 + 400) · Đoán emoji (17/11) · Chia động từ (17/11) · Ghép chữ · Start or End · Tìm bất quy tắc (17/11) · Bricky (19/11) · Hái từ (19/11) · Nghe – nghĩa · Thêm bớt 1 chữ (19/11) · Săn từ · Thế chữ — 20/11 người dùng tăng gấp đôi số câu để người xem kịp quen luật (`--seg-total`, trừ Start or End, Săn từ, Thế chữ) | `npm run demo:duoi450` (cũng là mặc định của `npm run demo`) |
| 450–650 | Word (từ mốc 500 + 600, 20 câu/lượt) · Ghép chữ (17/11, từ app mức Basic + 500–650: `--level mid`) · Điền từ (10 câu/lượt) · Nghe – nghĩa · Săn lỗi · Giải ô chữ — số câu đặt bằng `--seg-total` (17/11) | `npm run demo:450-650` |
| 650–800 | Word (từ mốc 700) · Đọc nhanh (bài mốc 700) · Nghe – chép | `npm run demo:650-800` |
| 800+ | Word (từ mốc 800 + 900) · Đọc nhanh (bài mốc 800) | `npm run demo:tren800` |

Tiêu chí chọn game (rút ra từ buổi chơi thử): mỗi câu **ngắn**, **không phải nghĩ phức tạp**, **ít thao tác** (thường chỉ gõ
`A`–`D`), **hiệu ứng bắt mắt**. Người xem lướt TikTok để giải trí, gặp bài khó là lướt qua. Người chơi thử đề nghị bỏ các khung
nghe, Săn từ, Giải ô chữ, Săn lỗi và Giờ học; **chưa bỏ**, vẫn chạy trong kênh như cũ cho tới khi quyết.

| Khung | Cách chơi | Người xem gõ |
|---|---|---|
| 🔤 Word | 4 kiểu đề xen kẽ: cho từ chọn nghĩa, cho nghĩa chọn từ, tìm từ đồng nghĩa, tìm từ trái nghĩa. **10 giây** mỗi câu | `A`–`D` |
| 🤔 Đoán emoji | Màn hiện 2–3 emoji, đoán từ hoặc cụm từ tiếng Anh. Ô chữ theo số chữ cái; 35% thời gian thì mở chữ đầu mỗi từ, 70% thì mở thêm. 20 giây (đáp án từ 12 chữ cái: 30 giây), công bố 5 giây kèm nghĩa và phát âm, 10 câu mỗi lượt | từ tiếng Anh |
| 📝 Chia động từ | Game Động từ bất quy tắc, mode "Chia từ". Bảng V1 – V2 – V3 ba hàng: một hàng khuyết 1 ô, hai hàng đủ chữ làm ví dụ để nhìn là hiểu đề. Ô khuyết có ô chữ theo số chữ cái; 35% thời gian mở chữ đầu, 70% mở thêm 1 chữ (đáp án từ 5 chữ cái). Luôn hiện nghĩa tiếng Việt. 15 giây, công bố 7 giây kèm đọc cả bộ ba, 8 câu mỗi lượt | gõ từ còn thiếu (hoặc cả hàng), sai được gõ lại |
| 👀 Tìm bất quy tắc | Game Động từ bất quy tắc, mode "Tìm từ". 4 động từ nguyên mẫu, 1 từ bất quy tắc + 3 từ có quy tắc. Công bố: tô từ bất quy tắc, hiện bộ ba V1 – V2 – V3 và nghĩa của nó, mỗi đáp án kèm dạng quá khứ để so sánh (từ có quy tắc tô đuôi "ed"). 14 giây (20/11/2026 tăng từ 10), công bố 7 giây, 8 câu mỗi lượt | `A`–`D` |
| 🍎 Hái từ | Mỗi bảng một chủ đề (30 chủ đề: trái cây, trường học, gia đình, văn phòng…). Lưới 4×4 ảnh; mỗi ô có chữ A–P, ảnh và tên tiếng Việt. Gõ tên tiếng Anh (gõ kèm chữ ô như `A apple` cũng được): người gõ đúng đầu tiên làm ô rụng và +2, mỗi ô chỉ một người hái, mỗi bình luận chỉ hái một ô. Ô rụng thì hiện tên tiếng Anh và tên người hái. Còn nửa thời gian, ô chưa ai hái hiện chữ cái đầu. Hết bảng (hết 60 giây hoặc hết ô) người thật hái nhiều nhất +5 (hoà: ai đạt số đó trước). Công bố 8 giây, 3 bảng mỗi lượt | gõ tên tiếng Anh |
| 🧱 Bricky | Cho 4–5 chữ cái (khay chữ nằm dưới bảng), ghép thành các từ tiếng Anh từ 3 chữ trở lên. Bảng có 5–7 từ định sẵn, đều là từ Migii có nghĩa: từ nào có người gõ đúng đầu tiên thì mở ô kèm nghĩa và tên người mở; từ hợp lệ ngoài bảng hiện ở dải "Từ thêm". **Điểm riêng**: mỗi từ +1 (mỗi người một lần cho mỗi từ, người khác gõ lại từ đã mở vẫn +1), người thật đầu tiên tự gõ đủ mọi từ trên bảng +10; bảng chạy tới hết giờ. Còn nửa thời gian mở chữ đầu các từ chưa ai tìm. 40 giây, công bố 8 giây (mở hết bảng, đọc từ dài nhất), 4 bảng mỗi lượt. **Bảng cuối** của lượt là chặng "Về đích" (giao diện lửa và màn chuyển Ninja đỏ dùng chung với ván tăng tốc Thế chữ): 6 chữ cái, 8 từ trên bảng, 60 giây (×1,5), mọi điểm ×2 (mỗi từ +2, điền đủ +20) | gõ từ, một bình luận gõ được nhiều từ |
| ✂️ Thêm bớt 1 chữ | Màn hiện một chữ viết sai (ô chữ thường) kèm nghĩa tiếng Việt của từ đúng và lệnh **THÊM 1 chữ** (vd `ofice` → office) hoặc **BỚT 1 chữ** (vd `ninne` → nine): thêm hoặc bớt đúng 1 chữ cái để thành từ có nghĩa. 35% thời gian có gợi ý: THÊM hiện ô "+" ở chỗ thiếu, BỚT khoanh cặp 2 chữ có chữ thừa. Công bố: chữ được thêm nảy vào (xanh) / chữ thừa rơi ra (đỏ). 15 giây, công bố 6 giây, 10 câu mỗi lượt. **3 câu cuối là chặng "Về đích"** (giao diện lửa và màn chuyển Ninja đỏ như bảng cuối Bricky): từ rất dễ nhầm, điểm ×2; cặp từ thật (desert → dessert) thì công bố hiện nghĩa cả hai từ để so | gõ cả từ đúng, sai được gõ lại |
| 🎯 Start or End | Tìm 5 từ tiếng Anh bắt đầu hoặc kết thúc bằng chữ cho trước (`ca____`, `____tion`), 45 giây, 3 câu mỗi lượt (20/11/2026 giảm từ 5) | 5 từ cách nhau bằng dấu cách hoặc dấu phẩy |
| 🔎 Săn từ | Ma trận chữ 10×10, tìm từ nối liền theo 8 hướng (cả ngược); ai tìm đủ 5 từ trước ăn điểm; 90 giây, 2 bảng mỗi lượt (20/11/2026 giảm từ 120 giây × 3 bảng) | các từ tìm được |
| 🔗 Thế chữ | Mọi người chơi chung (không chia đội): đổi đúng 1 chữ cái để ra từ mới, ai nhanh tay thì giữ từ và hiện hình dưới từ; người khác thế được thì đổi người giữ. Hết 12 giây không ai thế được thì người giữ từ thắng ván, chỉ người thắng +10 | gõ từ mới |
| ✏️ Điền từ | Câu thiếu 1 từ, chọn A–D; sau đó có lời giải bằng chữ và giọng nói, kèm phương án sai được chọn nhiều nhất (số phiếu thật) và lý do hay nhầm. 20 giây, giải thích 18 giây, 5 câu mỗi lượt | `A`–`D` |
| 🎧 Nghe – nghĩa | Phát audio một lần, ô chữ theo số chữ cái, hiện sẵn một nửa số loại chữ cái, mỗi giây thêm một loại (20/11/2026, trước: bắt đầu trống, 2 giây thêm 1, cho người xem tắt tiếng), 3 giây cuối hiện hết; chọn nghĩa tiếng Việt, đáp án nhiễu cùng chủ đề. 12 giây, 8 câu mỗi lượt | `A`–`D` |
| 🔍 Săn lỗi | Câu có đúng 1 từ sai (chính tả hoặc ngữ pháp). 30 giây, 5 câu mỗi lượt, công bố 15 giây | `từ sai - từ đúng` |
| 🔠 Giải ô chữ | Mỗi hàng là một từ mốc 600 (đề: nghĩa tiếng Việt + số chữ cái), 30 giây mỗi hàng; từ khoá hàng dọc +50 | chữ thường giải hàng, CHỮ HOA đoán từ khoá |
| 📰 Đọc nhanh | Văn bản ngắn kiểu Part 7 + 1 câu hỏi chi tiết + 4 phương án **hiện cùng lúc**, 20 giây; công bố tô vàng đoạn chứa đáp án, lời giải, phương án sai chọn nhiều nhất. 5 bài mỗi lượt | `A`–`D` |
| 🎙️ Nghe – chép | Nghe câu tiếng Anh (phát lặp lại, cách 5 giây), gõ lại cả câu; cứ 2 giây hiện thêm 1 loại chữ cái. 40 giây, 5 câu mỗi lượt | cả câu tiếng Anh |

**Chặng về đích (màu đỏ)** — mọi khung đều có (người dùng chốt 20/11/2026). Word (đua phi cơ, câu cuối), Bricky (bảng cuối), Thế chữ (ván tăng tốc), Thêm bớt 1 chữ (3 câu cuối) có cách riêng; các khung còn lại (Đoán emoji, Chia động từ, Ghép chữ, Start or End, Tìm bất quy tắc, Hái từ, Nghe – nghĩa, Săn từ, Điền từ, Săn lỗi, Giải ô chữ, Đọc nhanh, Nghe – chép) dùng chung `markFinish()` trong `server.js`: **câu / bảng cuối của lượt** là về đích (Giải ô chữ: hàng cuối, hoặc vòng đoán từ khoá cuối nếu có), màn chuyển Ninja đỏ "VỀ ĐÍCH" + giao diện lửa, **mọi điểm ×2**, đồng hồ đứng 4 giây cho màn chuyển (bot và khán giả ảo chờ hết rồi mới gõ). Màn chờ, vinh danh, cảm ơn luôn về nền thường. Thêm khung mới muốn có về đích kiểu chung thì thêm id vào `FINISH_SEGS`; chữ trên thẻ tối thì thêm màu ở khối "Chặng về đích dùng chung" cuối `public/theme-light.css`.

Điểm các khung trên: đúng nhanh nhất **+10**, hạng 2 **+5**, hạng 3 **+3**, những người đúng sau đó **+1**; sai thì 0, không trừ.
Khung `A`–`D` chỉ tính **lần chọn đầu**; khung gõ chữ (Đoán emoji, Chia động từ, Bricky, Hái từ, Thêm bớt 1 chữ, Start or End, Săn lỗi, Nghe – chép, Giải ô chữ) được gõ lại. Thế chữ chỉ người thắng ván có điểm (+10, có quà thì ×2).

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
  (`node startend.js` liệt kê và thử). Nhịp riêng: 45 giây, 3 câu mỗi lượt, công bố 8 giây (khai báo trong `SEGMENTS`).
- **Thế chữ** (luật 13/11/2026): ván = một chuỗi, ra từ 4 chữ, không chia đội, không cần `join`. Từ hợp lệ = đổi đúng 1 chữ cái, có trong từ điển (`dict.js`), chưa dùng trong ván; người đang giữ từ không được tự thế. Mỗi lượt: đồng hồ đứng 4 giây (`CHAIN_GRACE`) → đếm 12 giây (`SEGMENTS.chain.sec`) → về 0 thì ngầm chờ thêm 3 giây (`CHAIN_LATE`, bù độ trễ TikTok) rồi mới chốt người thắng (+10, `CHAIN_WIN`). Kỷ lục chuỗi lưu `data/the-chu-record.json`. Bot có chơi nhưng nhường dần khi có người thật.
- **Word = đua phi cơ** (người dùng chốt 20/11/2026, áp dụng cho Word ở mọi kênh; các khung A–D khác giữ bảng điểm cũ):
  - Điểm tính như cũ (10/5/3/1), màn live chỉ ghi kèm "km/h", Ninja đọc "cây số giờ" (`kmh()` trong `public/index.html`). Bảng vàng không đổi.
  - Server gửi `s.race` (`raceState()` trong `server.js`): tối đa 20 phi cơ (`RACE_MAX`), chỉ hiện ai trên 2 điểm (`RACE_MIN`), người thật được ưu tiên chỗ trước bot.
  - Màn live (`raceUpdate()`; CSS khối "Word = đua phi cơ" trong `theme-light.css`): bầu trời `#sky` làm nền. Lúc đang hỏi phi cơ xếp đội hình ở cột giữa
    hai ô Bảng điểm / Câu trả lời (hai ô thu nhỏ về mép trái, mép phải). Lúc công bố (7 giây, `SEGMENTS.word.reveal`): sau ~2 giây thẻ câu hỏi lùi đi,
    bầu trời chiếm cả màn và phi cơ đổi chỗ. Vị trí = điểm so với chiếc dẫn đầu × tiến độ lượt, nên chiếc dẫn đầu chạm vạch đích ở câu cuối.
  - Sai hoặc bỏ câu: bốc khói, tụt nhẹ, chỉ là hình ảnh (không trừ điểm). Đúng nhanh nhất: lộn vòng. Quà (×2 ba câu): lửa đuôi.
  - Câu cuối = chặng về đích: đồng hồ đứng 4 giây (`RACE_FINAL_GRACE`) cho màn chuyển "VỀ ĐÍCH", cả màn và phi cơ chuyển đỏ (`#stage.fire`),
    công bố xong thì chiếc dẫn đầu (người thật) băng qua vạch đích. Bot không bao giờ ngang hay vượt chiếc dẫn đầu của người thật.
- **Thế chữ, bản nâng cấp 19/11/2026** (người dùng chốt; hằng số ở khối Thế chữ trong `server.js`):
  - Chữ khoá: mỗi ván có 1 vị trí bị khoá (`round.lock`, ô có 🔒), chữ ở đó không được đổi.
  - Ván cuối của lượt là **tăng tốc**: từ 5 chữ (`CHAIN_FINAL_LEN`), ai cũng được đổi 1 hoặc 2 chữ. Màn live chạy màn chuyển "TĂNG TỐC" có Ninja đỏ
    (`boostFx()`, `public/img/ninja-dash-red.png` = 12 khung của `ninja-dash.gif` tô đỏ) rồi mang giao diện lửa (`#stage.fire` trong `theme-light.css`).
  - Chuỗi đủ 30 từ (`CHAIN_SWAP`): hệ thống tự ra từ mới, người giữ từ vẫn giữ. Trần 40 từ / 180 giây vẫn như cũ.
  - Quà trong lượt Thế chữ (`CHAIN_GIFT`, tính theo xu của một lần tặng, 1 hoa hồng = 1 xu; bot không có; hết lượt thì mất):
    từ 1 xu: thắng ván nào thì điểm ván đó ×2 · mỗi 3 xu: một lần đổi 2 chữ ở ván 4 chữ · từ 10 xu: ra từ mới ngay và người tặng giữ từ,
    mỗi người một lần mỗi lượt (tặng lúc đang công bố thì giữ từ mở ván kế). Điểm cộng thẳng cho quà (`onGift`, tối đa 50) vẫn áp dụng như mọi khung.
- **Điền từ**: câu trong `data/dien-tu-500.json` (`--fill-file` để đổi). Câu do AI viết mới rồi được hai lượt kiểm chứng độc lập (không dùng ngân hàng Part 5 của `migii_toeic_svc` vì chưa có xác nhận bản quyền, xem YC-004). Mỗi câu có `why` (vì sao đúng), `wrong` (lý do từng phương án sai) và `tip`. Công bố: ô lời giải thay bảng điểm, đọc thành tiếng phần `why` và lý do của phương án sai được chọn nhiều nhất.
- **Đọc nhanh**: bài trong `data/doc-nhanh-700.json` (kênh 650–800) và `data/doc-nhanh-800.json` (kênh 800+), chọn bằng `--read-file`.
  Mỗi file 100 bài AI viết (email, thông báo, quảng cáo, ghi nhớ, tin nhắn, lịch trình; 28–48 từ), mỗi bài dùng một từ vựng của mốc.
  Bài 800 khó hơn: từ mốc 800–900 và phần lớn đáp án là cách **diễn đạt lại** câu trong bài như đề thi thật. Mỗi bộ đã kiểm chứng mù
  (người kiểm chứng tự làm bài khi chưa biết đáp án, phương án đã xáo); **cần người Migii duyệt**.
- **Đoán emoji**: 400 câu soạn tay trong `data/emoji-400.json` (`--emoji-file` để đổi): 170 từ ghép (mỗi emoji là một nửa của từ, vd ☀️🌸 = sunflower), 150 câu emoji tả nghĩa (🦷👨‍⚕️ = dentist), 80 cụm từ (🌧️🐱🐶 = raining cats and dogs). Mỗi câu có `a` (đáp án hiện ở ô chữ), `alt` (cách viết khác cũng tính đúng), `m` (nghĩa). Chấm bỏ qua hoa thường, dấu cách, dấu câu; câu đúng không hiện chữ lên màn. Sửa kho xong chạy `node check_emoji.js` (bắt trùng đáp án, trùng emoji, đáp án dài quá hàng ô chữ). Kho này **không lấy từ kho từ vựng Migii** (từ đời thường, dễ vẽ bằng emoji) và **cần người Migii duyệt**. Phát âm tải khi cần lần đầu, sau đó dùng cache.
- **Hái từ**: bộ từ soạn tay, mỗi chủ đề một file `data/hai-tu/<chủ đề>.json` (`--haitu-dir` để đổi thư mục): `id`, `w` (tên tiếng Anh), `vi` (tên tiếng Việt hiện trên ô, không được chứa sẵn đáp án), `ok` (cách gõ khác vẫn tính), `p` (mô tả hình để sinh ảnh). 30 chủ đề, ~1.290 từ. **Không lấy từ kho từ vựng Migii** (kho không có từ cụ thể theo chủ đề), cần người của Migii duyệt. Ảnh ở `public/img/hai-tu/<chủ đề>/<id>.jpg` (360×360), không dùng emoji, nguồn từng ảnh ghi ở `data/hai-tu-anh.json`. Từ 20/11 toàn bộ là ảnh sinh bằng AI (`npm run build:anh-hai-tu`, `build_hai_tu_anh.js`) qua cổng AI công ty llm.eup.ai, model `gpt-image-2`, key `LLM_EUP_KEY` trong `.env`: mỗi lần gọi vẽ 9 vật trong lưới 3×3 rồi cắt từng ô (~0,042 USD/lần, cả bộ ~1.290 ảnh hết ~6,5 USD). Script chạy không kèm `--dong-y` thì chỉ in số ảnh × giá, không gọi API; ảnh gốc và trang duyệt ở `data/hai-tu-goc/` (ngoài git). 38 ảnh chụp thật (Wikimedia Commons, phạm vi công cộng / CC0) dùng trước đó cất ở `data/hai-tu-goc/anh-chup/`. Mục chưa có ảnh thì bỏ qua; chủ đề chưa đủ 16 ảnh thì chưa lên bảng.
- **Bricky**: 35 đề thường (`sets`) và 10 đề bảng cuối 6 chữ cái (`finals`, trần 30 từ hợp lệ) trong `data/bricky.json` (`--bricky-file` để đổi), sinh bằng `npm run build:bricky` (`build_bricky.js`), build lại sẽ ghi đè. Từ lên bảng lấy từ kho từ vựng Migii (`data/bank.json`, thiếu thì lấy thêm ở `data/word-300.json`, `data/word-400.json`; riêng bank.json chỉ đủ 18 đề có 5 từ trở lên); từ được tính thêm là mọi từ có trong từ điển `dict.js` (Hunspell, đã chặn từ tục), kể cả từ hiếm, **không có nghĩa tiếng Việt và chưa qua Migii duyệt**. Chữ viết tắt và dạng cổ mà từ điển vẫn nhận (etc, hrs, hast…) cùng vài từ thô loại tay ở `BO` / `THO` trong `build_bricky.js`; soát danh sách bằng `node build_bricky.js --list`. Bộ chữ ra hơn 20 từ hợp lệ bị bỏ để một người gõ hết không lệch điểm so với khung khác.
- **Thêm bớt 1 chữ**: `data/mot-chu.json` (`--mot-chu-file` để đổi), sinh bằng `npm run build:motchu` (`build_mot_chu.js`), build lại sẽ ghi đè. Câu thường (860) sinh tự động từ `data/word-300.json` + `word-400.json` (từ 4–8 chữ cái, nghĩa của kho): THÊM = bỏ 1 chữ (không bỏ chữ đầu, ưu tiên một chữ của cặp chữ đôi hoặc nguyên âm), BỚT = nhân đôi 1 chữ ở chỗ người viết hay nhầm (phụ âm giữa hai nguyên âm, e/o giữa hai phụ âm, l/f cuối từ). Chữ hiện ra không được là từ có thật, và thêm/bớt 1 chữ bất kỳ chỉ ra đúng một từ trong từ điển (`dict.js`), nên câu chỉ có một đáp án. Câu về đích (113) soạn tay ở `RED` trong `build_mot_chu.js`: cặp từ thật dễ nhầm (lunch → launch, contact → contract, có `sm` = nghĩa của chữ hiện ra) và lỗi chính tả hay gặp (adress, untill, wellcome); nghĩa trên màn là nghĩa của từ đáp án. Câu về đích **chưa qua Migii duyệt**. Soát mẫu câu thường bằng `node build_mot_chu.js --list`.
- **Động từ bất quy tắc** (hai khung Chia động từ, Tìm bất quy tắc): kho soạn tay trong `data/dong-tu-bqt.json` (`--irr-file` để đổi), **không lấy từ kho từ vựng Migii, cần người của Migii duyệt**. 111 động từ bất quy tắc thông dụng (`v1`, `v2`, `v3`, nghĩa `m`; hai dạng cùng đúng ghi `was/were`, dạng khác vẫn chấm đúng ghi ở `alt2`/`alt3`) và 133 động từ có quy tắc làm đáp án nhiễu. Không đưa vào: động từ có cả hai kiểu chia (learn, dream, burn…), cặp dễ nhầm (lie/lay), từ đọc khác nhau theo nghĩa (tear, wind), từ hiếm. Câu hỏi dựng lúc chạy ở `irregular.js`: ô khuyết không bao giờ là từ đã nằm sẵn trong hàng (buy – bought – bought chỉ khuyết V1, come – came – come chỉ khuyết V2), nên 14 từ ba dạng giống nhau (cut, put, read…) chỉ ra ở Tìm bất quy tắc; hai hàng ví dụ không chứa đáp án (không ghép rise với arise). Sửa kho xong chạy `node check_bqt.js`.
- **Săn từ**: 50 ma trận dựng sẵn trong `data/san-tu-400.json` (17/11/2026 nâng từ 20; hết 50 bảng mới lặp, khoảng 10 giờ live) (`--hunt-file` để đổi). Mỗi bảng giấu 10 từ (4–8 chữ cái, từ mốc 400) theo 8 hướng, rồi quét kỹ toàn bảng: mọi từ thật từ 4 chữ cái trở lên nằm trong bảng đều ghi vào danh sách của bảng đó, người xem gõ từ nào thì chỉ tra danh sách này. Bảng bị loại nếu có từ tục tĩu mọc ra (trừ khi nằm trọn trong từ dài hơn như `ass` trong `class`). Mỗi người cộng dồn các từ hợp lệ, đủ 5 từ khác nhau trước thì ăn điểm.
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

`npm run demo:all` (= `node gateway.js --port 8789`) bật **30 tiến trình** (mỗi kênh 1 mục "cả kênh" chạy xen kẽ như lúc live, từng game của kênh, và 7 game gốc), mỗi tiến trình một server riêng (khán giả ảo `--sim`, tự chạy lặp, không cần bấm Bắt đầu) dưới **một cổng**, mỗi game một đường dẫn:

- `http://localhost:8789/` — danh sách game, ô chép địa chỉ để gửi người khác (kèm địa chỉ LAN `http://<IP máy>:8789/<tên>/`).
- `http://localhost:8789/<tên>/` — màn live của game; `http://localhost:8789/<tên>/control` — màn điều khiển.
- Tên: `duoi-450 bat-quy-tac hai-tu bricky mot-chu emoji word-duoi-450 startend hunt chain scramble` · `450-650 word-450-650 fillin listenmean errhunt crossword` · `650-800 word-650-800 speedread dictate` · `tren-800 word-tren-800 speedread-tren-800` · game gốc `class quiz reverse listen team type`. Link cũ `word300`, `word400`, `word500` tự chuyển sang Word của kênh mới. Chỉ bật vài game: `node gateway.js --only speedread,fillin`.
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
Server sau cổng chạy thử 30 game (`npm run demo:all`) và script xuất ảnh không ghi.

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
| Ghép chữ | Âm tiết Hangul, nhận romaja | Chữ cái tiếng Anh (chữ thường), thẻ không đánh số: chỉ gõ cả từ, sai được gõ lại (16/11) |
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
| `public/kich-ban.js` | kịch bản lời dẫn của Ninja (giọng đọc): mỗi tình huống một danh sách câu, đọc hết vòng mới lặp lại |
| `public/control.html` | màn điều khiển |
| `build_bank.js` | tạo `data/bank.json` từ gói từ vựng Migii |
| `build_word.js`, `data/word-300.json`, `data/word-400.json` | câu hỏi khung Word (mốc 300, 400), sinh từ danh sách từ trong chính file JSON (`node build_word.js 400`) |
| `build_san_tu.js`, `data/san-tu-400.json` | ma trận khung Săn từ dựng sẵn (`node build_san_tu.js --count 10 --append` để thêm bảng) |
| `data/emoji-400.json`, `check_emoji.js` | 400 câu khung Đoán emoji và script kiểm kho sau khi sửa tay |
| `data/hai-tu/`, `data/hai-tu-anh.json`, `public/img/hai-tu/`, `build_hai_tu_anh.js` | bộ từ khung Hái từ (mỗi chủ đề một file), nguồn từng ảnh, ảnh, và script sinh ảnh AI |
| `data/bricky.json`, `build_bricky.js` | bộ đề khung Bricky (file sinh ra) và script dựng đề từ kho Migii + từ điển |
| `data/mot-chu.json`, `build_mot_chu.js` | bộ đề khung Thêm bớt 1 chữ (file sinh ra) và script dựng đề (câu thường từ word-300/400, câu về đích soạn tay trong script) |
| `data/dong-tu-bqt.json`, `irregular.js`, `check_bqt.js` | kho động từ của hai khung Động từ bất quy tắc, phần dựng câu hỏi và script kiểm kho sau khi sửa tay |
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
