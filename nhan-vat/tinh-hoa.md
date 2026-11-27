# Tinh hoa: điều rút ra từ các video và buổi live mẫu

> File tổng của thư mục `nhan-vat/`. Mỗi file `nhan-vat-N.md` tả kỹ một nguồn; file này chỉ giữ những điều **dùng lại được** cho Migii.
> Dữ liệu cho AI học cách làm: **không đóng giả** người hay kênh nào, không lấy câu đề của họ.
> Khi áp dụng vẫn theo luật thương hiệu trong `CLAUDE.md` và `ai.js`.
> Cập nhật lần cuối: 25/11/2026, sau 3 nguồn (2 người).

## Cách đọc và cách bổ sung

- Mỗi điều có mã: `C` chung, `L` riêng live, `V` riêng video, `G` giọng nói, `H` giả thuyết.
- `[NV1]` là nguồn (file `nhan-vat-1.md`). **Độ chắc** tính theo số *người* khác nhau cùng làm như vậy: NV2 và NV3 là một người nên chỉ tính 1.
- Có nguồn mới:
  - Điều đã có mà nguồn mới cũng làm: thêm mã nguồn, tăng độ chắc.
  - Điều mới: thêm mã kế tiếp.
  - Nguồn mới làm ngược lại: đừng xoá điều cũ, ghi cả hai vào mục 8 (giả thuyết) cho tới khi đủ nguồn.
- Điều người dùng tự rút ra ghi ở mục 10, kèm `[ND ngày/tháng]`.

## 1. Nguồn đã học

| Mã | Ai | Dạng | Nhịp | Tốc độ nói | Kết quả |
|---|---|---|---|---|---|
| [NV1](nhan-vat-1.md) | Cô giáo live dạy giao tiếp bằng dịch câu Việt → Anh | Live có tương tác, 24 phút | 9 câu, 1,5–3 phút/câu | ~162 từ/phút | 760–980 người xem cùng lúc; bản ghi đăng lại 77K lượt xem, 568 bình luận, 166 chia sẻ |
| [NV2](nhan-vat-2.md) | Kênh giải đề TOEIC không lộ mặt | Video dựng sẵn, 13 phút | 30 câu, 26 giây/câu | ~246 âm tiết/phút | 81,2K lượt xem, 28 bình luận, 235 chia sẻ |
| [NV3](nhan-vat-3.md) | Cùng người với NV2 | Video dựng sẵn, 12 phút | 30 câu, 24 giây/câu | ~226 âm tiết/phút | 10,4K lượt xem, 5 bình luận, 21 chia sẻ |

## 2. Chung cho cả live và video (2 người cùng làm)

**C1. Một khuôn cố định cho mọi câu, lặp y nguyên.** [NV1][NV2][NV3]
- Thấy: NV1 lặp đúng 8 bước cho cả 9 câu (đọc đề 2 lần, ghép từng mảnh, mời bình luận, đọc lại câu đúng, sửa lỗi phổ biến, đưa cách nói khác). NV2–3 lặp 6 bước cho cả 60 câu (gọi tên dạng, chỉ dấu hiệu, chốt, dịch cả câu, nghĩa các phương án khác). Người vào giữa chừng xem một câu là hiểu luật.
- Ở Migii: mỗi khung game và mỗi loại bài gia sư giữ một trình tự duy nhất, không đổi giữa các câu.

**C2. Nói trước mình sắp làm gì.** [NV1][NV2][NV3]
- Thấy: "Câu 101 là dạng đại từ", "Câu 110 khác nhau, dịch nghĩa nha"; slide NV1 luôn có công thức và nghĩa của công thức ở hai dòng đầu.
- Ở Migii: trước mỗi câu có một dòng tên dạng hoặc chủ đề.

**C3. Để người xem nghĩ trước khi có đáp án.** [NV1][NV2][NV3]
- Thấy: NV1 hỏi chọn rồi đếm "3, 2, 1", có lúc gài bẫy ("viết Thanks you được không các bạn?"). NV2–3 không chờ nhưng vẫn tự hỏi "…như thế nào đây?" trước khi chốt.
- Ở Migii: game đã có đồng hồ, video đã chốt đếm 10 giây. Lời nói ngay trước lúc chốt nên là một câu hỏi.

**C4. Chốt bằng một câu cố định, rồi xác nhận bằng nghĩa.** [NV1][NV2][NV3]
- Thấy: "Chốt đáp án là câu D nha", "Mình chọn câu C"; NV1 đọc lại câu đúng 2–4 lần. Sau khi chốt, cả hai đều dịch nghĩa cả câu.
- Ở Migii: mỗi khung một câu chốt quen tai; sau đáp án luôn có nghĩa tiếng Việt.

**C5. Giảng theo thứ tự: dấu hiệu, quy tắc gói trong một câu, dùng ngay.** [NV1][NV3]
- Thấy: "Có than thì là so sánh hơn, tính từ ngắn thêm er, tính từ dài thì more" rồi loại đáp án luôn. NV1: quy tắc một câu, ví dụ đúng, ví dụ sai, "được chưa ạ?". Không ai giảng lý thuyết quá khoảng một phút.
- Ở Migii: mỗi lời giải thích của AI chỉ một quy tắc, nói được trong một câu, kèm một ví dụ.

**C6. Mỗi câu cho thêm một thứ mang về ngoài đáp án.** [NV1][NV2][NV3]
- Thấy: NV1 đưa 2–3 cách nói khác và cặp dễ nhầm (job/work, at/in, a/the). NV2–3 nói nghĩa các phương án còn lại, chuỗi đồng nghĩa (because of = due to = owing to), nhóm cụm hay gặp (a range of / a variety of / an assortment of). Không phải câu nào cũng mở rộng.
- Ở Migii: sau đáp án thêm đúng một thứ (từ đồng nghĩa, cặp dễ nhầm hoặc nghĩa phương án sai).

**C7. Cái sai cũng là nội dung.** [NV1][NV2][NV3]
- Thấy: NV1 đọc câu sai phổ biến và chỉ đúng một lỗi. NV2–3 nói vì sao phương án nhiễu sai ("evaluator là người, không thể thực hiện một cái người được").
- Ở Migii: khi nhiều người chọn cùng một đáp án sai, nói một câu vì sao sai.

**C8. Nói tới đâu, đánh dấu trên màn tới đó.** [NV1][NV2][NV3]
- Thấy: NV1 viết tay từng chữ theo lời nói. NV2–3 dùng một bộ ký hiệu ít và cố định: ngoặc vuông quanh cụm, nhãn loại từ trên chỗ trống (N, Adj, Adv, V-ing), gạch chéo phương án sai, khoanh đáp án, ghi nghĩa bên lề.
- Ở Migii: trùng luật trình bày gia sư đã chốt (đọc tới đâu hiện tới đó, thước chỉ + vệt laze). Bộ ký hiệu trên có thể mượn cho bài ngữ pháp.

**C9. Tiếng Việt đời thường, ví dụ đời thường.** [NV1][NV2][NV3]
- Thấy: store credit "giống như cái voucher"; "job là nghề nghiệp, work là công việc hằng ngày". Từ tiếng Anh nói xong dịch ngay ("impresses, có nghĩa là làm ấn tượng").
- Ở Migii: giải thích từ bằng một thứ người xem đã biết, tránh thuật ngữ khi có cách nói thường.

**C10. Vào việc ngay.** [NV1][NV2][NV3]
- Thấy: NV2–3 bắt đầu câu đầu tiên ở giây thứ 3. NV1 chào người mới bằng "vào là tham gia được luôn" rồi vào câu. Không ai giới thiệu bản thân.
- Ở Migii: lời chào không quá một câu, câu thứ hai đã là nội dung.

## 3. Riêng cho live (mới có NV1, 1 người)

- **L1. Việc người xem phải làm thật nhỏ.** Hỏi chọn một chữ ("have hay has?") trước, mời gõ cả câu sau. Người xem gõ một chữ là tham gia được.
- **L2. Ít nội dung, luyện kỹ.** 24 phút chỉ 2 công thức, 9 câu. Mỗi câu 1,5–3 phút.
- **L3. Không để im.** Không có khoảng lặng nào quá 2,5 giây. Khoảng 45 giây hỏi một câu kiểm tra ("đúng không?", "được chưa ạ?").
- **L4. Câu hỏi của người xem: đọc to rồi mới trả lời.** 6 câu trong 24 phút, mỗi câu 30–60 giây.
- **L5. Người sai thì gọi tên và chỉ một lỗi, không chê. Người đúng thì khen chung.** Bình luận ngoài lề thì lờ đi.
- **L6. Kêu gọi ngắn và thưa.** 4 lần trong 24 phút, mỗi lần dưới 10 giây, chen vào lúc chờ người xem gõ, luôn đổi lấy một thứ có giá trị (tài liệu, lịch học).
- **L7. Nối các buổi với nhau.** Lịch live cố định, nhắc lại bài hôm trước, hứa gửi tài liệu cuối buổi.
- **L8. Bản ghi live đăng lại vẫn có người xem.** Bản ghi buổi này được 77K lượt xem.

## 4. Riêng cho video (mới có NV2–3, 1 người)

- **V1. Dày và nhanh.** 30 câu trong 12–13 phút. Không chừa thời gian vì người xem tua lại được.
- **V2. Dạy luôn cách phân loại câu.** Bốn phương án cùng gốc từ thì là câu ngữ pháp, khác hẳn nhau thì dịch nghĩa.
- **V3. Đọc chỗ trống là "chấm chấm"** khi dịch đề, để người nghe vẫn theo được câu.
- **V4. Tiêu đề có số cụ thể.** "30 câu", "15 phút".
- **V5. Video giải đề được gửi đi nhiều hơn được bàn.** NV2 có 235 chia sẻ nhưng chỉ 28 bình luận. Buổi live NV1 thì ngược lại (568 bình luận).

## 5. Giọng nói

| Mã | Điều | Số liệu |
|---|---|---|
| G1 | Live nói chậm hơn video vì phải chờ người xem gõ | NV1 ~162; NV2–3 ~226–246 mỗi phút |
| G2 | Gần như không im lặng | Khoảng lặng dài nhất: NV1 2,5 giây; NV2 3,2 giây; NV3 4,8 giây |
| G3 | Một từ chuyển ý dùng suốt buổi | "rồi": NV1 70 lần, NV2 74 lần, NV3 43 lần |
| G4 | Xưng hô một kiểu từ đầu tới cuối | NV1 tự xưng bằng tên 41 lần, gọi "các bạn" 123 lần; NV2–3 xưng "mình" |
| G5 | Câu ngắn, có từ đệm cuối câu | NV1 "ạ", "nhé"; NV2–3 "nha", "ha", "nè" |
| G6 | Lặp từ khoá và đáp án | NV1 lặp 2–3 lần liền khi viết lên màn |

## 6. Kho câu mẫu theo chức năng

Đã bỏ tên riêng. Câu nguyên văn và ngữ cảnh nằm ở mục 6 và mục 8 của từng file nhân vật.

| Chức năng | Mẫu câu | Nguồn |
|---|---|---|
| Mở câu mới | "Rồi, tiếp theo nào." · "Tiếp theo câu … là dạng …" | NV1, NV2–3 |
| Gọi tên dạng | "Câu này khác nhau, dịch nghĩa nha." · "Đây là dạng ngữ pháp." | NV2–3 |
| Hỏi chọn + đếm | "Theo các bạn dùng have hay has? 3, 2, 1." | NV1 |
| Mời bình luận | "Mọi người viết cả câu vào nào." | NV1 |
| Chỉ dấu hiệu | "Phía trước có …, phía sau là danh từ." · "Trong câu chưa có động từ chính." | NV2–3 |
| Tự hỏi trước khi chốt | "Thì doanh thu nó như thế nào đây?" | NV2–3 |
| Chốt | "Chốt đáp án là câu D nha." | NV2–3 |
| Khen | "Rất tốt." · "Đúng rồi." | NV1 |
| Kiểm tra hiểu | "Đúng không?" · "Được chưa ạ?" | NV1, NV3 |
| Gài bẫy | "Thế nếu viết … thì được không các bạn?" | NV1 |
| Cách nói khác | "Hoặc các bạn có thể dùng … Đều được nhé." | NV1 |
| Mở rộng | "Trong TOEIC hay có những cụm cùng nghĩa này: …" | NV2–3 |
| Mẹo nhớ | "Cứ nhớ là … để xuống cuối câu." · "… thì nhớ theo sau là V-ing hoặc danh từ." | NV1, NV3 |
| Kêu gọi | "Cuối buổi sẽ gửi tài liệu cho mọi người nhé." | NV1 |

## 7. Không học

- Tên, kênh, lịch, nhóm, câu tự giới thiệu của người mẫu (đóng giả).
- Quay hoặc chép câu đề sách ETS (NV2–3). Câu hỏi của Migii lấy từ kho từ vựng hoặc tự soạn.
- Người đứng che slide, phiên âm chữ quá nhỏ (NV1).
- Kết video cụt giữa câu, không có màn kết (NV2–3).
- Nói nhanh tới mức lời chép tự động sai nhiều (NV2).

## 8. Giả thuyết chưa kiểm

- **H1. Câu mở dạng thử thách hút người mới hơn câu mở "tiếp tục series".** NV2 ("xem mình giải trong bao lâu") 81,2K lượt xem; NV3 ("series tập 3") 10,4K. Cùng người, cùng dạng, nhưng mới có 2 video.
- **H2. Hỏi chọn một chữ làm tăng số bình luận.** NV1 làm vậy và bình luận nhiều, nhưng chưa có buổi không làm để so.
- **H3. Dạng nội dung quyết định kiểu phản ứng.** Giải đề thì được chia sẻ, live dịch câu thì được bình luận (xem V5). Mới so 1 live với 2 video.
- **H4. Hứa tài liệu cuối buổi giữ người xem ở lại.** Số người xem NV1 giữ 760–980 suốt 24 phút, chưa có buổi đối chứng.

## 9. Chỗ nguồn làm khác điều Migii đã chốt

Giữ điều Migii đã chốt. Muốn thử theo nguồn thì người dùng quyết.

| Nguồn làm | Migii đã chốt |
|---|---|
| NV1 trả lời mỗi câu hỏi 30–60 giây | Gia sư live: tương tác mỗi câu không quá 5 giây |
| NV1 khen chung, không đọc tên người đúng | Gia sư live: cảm ơn người đúng đầu tiên |
| NV1 không cảm ơn quà | Game: có cảm ơn quà |
| NV2–3 có lời dẫn cố định ("Câu … là dạng …", "Chốt đáp án …") | Video gia sư: chỉ đọc tiếng Anh + tiếng Việt, không câu dẫn. Khuôn C1, C2, C4 khi đó thể hiện bằng hình |
| NV2–3 có phụ đề chạy theo lời | Video gia sư: không phụ đề |
| NV2–3 không chờ người xem, không màn kết | Video gia sư: đếm 10 giây, có màn kết follow + tải app |

## 10. Người dùng rút ra

(Chưa có. Ghi mỗi điều một dòng, kèm `[ND ngày/tháng]`.)

## 11. Còn thiếu nguồn nào

Cả 3 nguồn đều là giáo viên người thật giảng bài. Migii là game do nhân vật Ninja và AI dẫn, nên còn thiếu:

- Live dạng đố vui hoặc game, người xem trả lời bằng bình luận hay quà.
- Live không lộ mặt, hoặc do nhân vật ảo / AI dẫn.
- Live kéo người xem về tải app.
- Video từ vựng ngắn dưới 60 giây (gần với video gia sư Migii).
- Một kênh giải đề TOEIC khác, để phần video có 2 người.

## Nhật ký cập nhật

- 25/11/2026: tạo file từ NV1, NV2, NV3.
