# Demo gia sư tự động

Bản thử phần **trình bày bài giảng**: bài chạy theo kịch bản soạn sẵn, gia sư chỉ bằng thước, đổi màu chữ, gạch chân, khoanh,
thêm ví dụ, có bài tập xen giữa.

Luật trình bày (người dùng chốt 23/11/2026):
- **Đọc tới đâu hiện tới đó.** Chế độ Gia sư chỉ bày phần đang giảng; khối, dòng bảng, ý danh sách nào kịch bản nhắc tới mới hiện ra.
  Khối không được nhắc tới thì hiện ngay khi vào phần.
- **Không nền màu cho từng phần/khối.** Nhấn bằng màu chữ; tách khối bằng khoảng trắng. Chỉ nút bấm (lựa chọn bài tập) giữ nền nhạt.
- **Không loè loẹt.** Mỗi lúc một điểm nhấn cam (chỗ đang nói tới); chỗ đã giảng dịu về teal đậm.
- **Chỉ bằng cây thước**, không dùng ngón tay.
- **Nhường chỗ cho bài:** đang giảng thì ẩn phần đầu màn (tên bài, chọn mode), chỉ còn vạch tiến độ mảnh; tạm dừng thì hiện lại.
  Phần đang giảng nằm **giữa màn**; khối mới hiện thì cả phần trượt êm để giữ ở giữa.
- **Hiệu ứng nhấn:** thước lướt từ đầu tới cuối chỗ nhấn, sau lưng để lại vệt sáng như laze; chữ nào thước đi qua thì đổi màu,
  đậm lên, phóng to rồi thu lại. Khối mới hiện thì từng chữ trồi lên lần lượt.
- **Đủ thời gian xem** (người dùng chốt 23/11/2026): giữa hai câu nghỉ 0,8 giây; hết một phần thì cả phần còn đứng trên màn
  2,5–6 giây tuỳ lượng chữ (`giuPhan` trong `gia-su.js`) để kịp đọc nghĩa tiếng Việt của câu ví dụ, rồi mới sang phần sau.

Chưa có hỏi đáp AI (nút "Nhắn tin hỏi", "Nói để hỏi" ở bảng tạm dừng mới là chỗ giữ sẵn). Nội dung bài là nội dung tạm,
không lấy từ kho của app.

```bash
npm run demo:gia-su     # http://localhost:8795/  (điện thoại cùng Wi-Fi: địa chỉ LAN in ra lúc bật)
npm run build:gia-su    # dựng lại 100 bài live từ gia-su/nguon/*.js
./gia-su/live.sh        # live TikTok thật (@TIKTOK_USER trong .env) · --sim: người xem ảo · stop: tắt
```

- Giọng tiếng Việt: VieNeu (cần `VIENEU_PY` trong `.env`). Tiếng Anh: dịch vụ đọc của Migii (`en_audio.js`).
  Lúc bật, server sinh sẵn mọi câu (2 hàng song song: Việt lần lượt, Anh 3 luồng; ~2.200 câu của 100 bài mất khoảng 20–30 phút
  lần đầu, lần sau lấy từ `data/tts-cache` + `data/en-audio`). Câu chưa có giọng: trang demo đọc bằng giọng trình duyệt,
  trang live chỉ chạy phụ đề.
- Sửa file bài rồi tải lại trang là thấy. Câu mới được sinh giọng ngay lúc mở bài. Server in cảnh báo nếu bài chỉ tới id không có.

| File | Vai trò |
|---|---|
| `server.js` | Phục vụ trang, kiểm bài, sinh sẵn giọng đọc, `/am` chỉ đọc đúng câu có trong bài; live: đọc bình luận, chấm, soạn câu cảm ơn/sửa |
| `bai/*.json` | 2 bài demo viết tay |
| `nguon/*.js` → `build_bai.js` → `bai/live/*.json` | 100 bài live: nguồn viết gọn (50 ngữ pháp, 50 từ vựng), bộ dựng sinh kịch bản, xáo đáp án |
| `nguon/0-chuong.js` | Thứ tự phát: 11 chương theo chủ đề, ví dụ ngữ pháp theo chủ đề từng chương |
| `public/gia-su.js` | Trình phát: dựng trang chữ, chạy kịch bản, bài tập, tạm dừng, đổi mode |
| `public/gia-su-live.js` | Trang live: bài nối tiếp, câu hỏi chờ bình luận, tương tác ≤ 5 giây; dịch câu (nêu bật bình luận ≤ 10 giây) |
| `public/tach-loi.js` | Tách lời giảng thành đoạn tiếng Việt / tiếng Anh (dùng chung server và trang) |
| `live.sh` | Bật server + cửa sổ phát dọc cho TikTok LIVE Studio chụp |
| `xuat-video.js` | Xuất một bài thành video dọc 1080×1920 có tiếng: `node gia-su/xuat-video.js <số bài>` → `data/video/`. Không phát tiếng trên máy (Chrome ẩn tắt tiếng, tiếng ghép từ file giọng), không đụng server live/game: chạy được lúc đang live. Câu chưa có giọng thì sinh trước khi ghi (VieNeu trên máy; từ tiếng Anh qua dịch vụ đọc của Migii). Hết bài là **màn kết** nền trắng (25/11/2026): Ninja lướt qua như đổi màn ở game live, avatar kênh có chấm "+" đỏ kiểu TikTok (chạm vào thành dấu tích rồi thu lại), "Nhớ follow kênh nhé!", thẻ app Migii TOEIC + App Store / Google Play (~10 giây; `doanKet` trong `gia-su-live.js`). Chữ dùng font của app (SVN-Avo, `public/fonts/`). Tên kênh: `--kenh <tên>` / `GIA_SU_KENH` / `TIKTOK_USER`. **Xem trước có tiếng**: `npm run xem-video:gia-su` (cổng 8796, chọn bài / phần / chỉ màn kết). Trang chạy `?live=1&video=1` với lời đọc bản video (`bai/video/`, cùng `build_bai.js` dựng: chỉ đọc tiếng Anh + tiếng Việt, bỏ câu dẫn), không phụ đề / Ninja nhỏ; câu hỏi hiện ra, đếm 10 giây rồi hiện đáp án (không mời bình luận); giữ màn ngắn hơn live. Có nhạc nền (4 bản CC0 `public/audio/video-*.m4a`, bản đầu mặc định, nguồn trong `CREDITS.md`) lặp suốt video, thấp hơn giọng 12 dB, tự hạ khi gia sư đọc; giọng đặt ~-14,5 LUFS. `--nhac <file>`. `--khong-nhac` bỏ nhạc · `--them-nhac <video>` thêm nhạc vào video đã xuất (giữ bản `-khong-nhac`) |
| `control.js` | Trang control cho người dẫn (`npm run control:gia-su` → http://localhost:8798/): đang phát gì, đáp án câu đang hỏi và cả bài, số chọn A/B/C/D, bình luận kèm kết quả chấm. Chạy riêng, chỉ đọc file bài + nhật ký + `/trang-thai`, không nối trang live: bật/tắt lúc đang live được |
| `nhat-ky.js`, `xem-binh-luan.js` | Ghi nhật ký live (mọi bình luận, câu hỏi, số người xem) · đọc lại bình luận, góp ý, câu dịch cần soát |

## Live

`./gia-su/live.sh` bật server đọc bình luận `@TIKTOK_USER` và mở cửa sổ Chrome dọc 9:16 (`?live=1`); trong LIVE Studio thêm nguồn
chụp cửa sổ đó rồi Go LIVE. Các bài chạy nối tiếp từ bài đang dở (`data/gia-su-live.json`), hết 100 bài thì quay lại bài 1.

Thứ tự bài theo **11 chương chủ đề** (`nguon/0-chuong.js`, người dùng yêu cầu 23/11/2026: bài liên kết với nhau, ưu tiên từ cùng
chủ đề): Văn phòng · Họp và sự kiện · Nhân sự · Tài chính · Ngân hàng và cuộc sống · Marketing và sản phẩm · Bán hàng và khách hàng ·
Sản xuất và giao hàng · Công nghệ và công trình · Đi lại và công tác · Khách sạn và du lịch. Trong chương: các bài từ vựng cùng chủ đề
(mỗi từ 2 câu ví dụ) rồi tới ngữ pháp; ngữ pháp đi dần qua các chương (các thì → bị động → điều kiện → …) và mỗi bài có phần
"Theo chủ đề": 2 câu dùng chính các từ vừa học. Đầu màn ghi "Chương 3 · Nhân sự / Bài 2/11 · Từ 1/4"; đầu chương gia sư giới thiệu
chương, bài sau nối "Tiếp chủ đề …". Đổi thứ tự hay thêm bài: sửa `0-chuong.js` (bài nào cũng phải nằm đúng một chương) rồi
`npm run build:gia-su`; dựng lại thì đặt `data/gia-su-live.json` về `{"i":0}` vì vị trí lưu theo số thứ tự bài.
Không chạy cùng lúc với game live (`./go_live.sh`): hai bên cùng đọc bình luận một kênh. Chỉ một cửa sổ live được dẫn bài.
Server tự nối bình luận khi kênh lên sóng và tự nối lại như game: mất kết nối thì nối lại sau 3 giây; đã nối mà 90 giây không có
sự kiện nào (bình luận, người vào, số người xem…) thì coi như bám phòng live cũ, bỏ phòng đó nối lại. Xem trạng thái:
`curl -s localhost:8795/trang-thai` (`tiktok.noi`, `phong`, `im_lang_s`); log có dòng "✅ Đã nối live" và "💬" sau mỗi câu hỏi.

Câu hỏi trên live:
1. Gia sư mời bình luận, mở **12 giây** (đồng hồ + số người chọn từng đáp án + tên người vừa trả lời), nhận thêm **3 giây** vì
   bình luận TikTok tới trễ.
2. Người xem trả lời bằng chữ cái (`B`, `đáp án là C`, `d nhé`) hoặc gõ thẳng đáp án; mỗi người tính câu đầu tiên.
   Gõ sai chính tả 1–2 chữ vẫn nhận ra ("sai một chút").
3. Chốt: tô đáp án đúng, rồi **tương tác tối đa 5 giây**: cảm ơn người đúng đầu tiên ("Cảm ơn Lan, đúng đầu tiên!") và sửa cho một
   người: gõ gần đúng thì "Minh gần đúng rồi, viết là arrives nhé", chọn sai thì "Mai ơi, đáp án là arrives nhé". Hai câu này sinh giọng
   ngay lúc người xem trả lời nên chốt xong là đọc được. Quá 5 giây thì cắt.
4. Gia sư nói lý do rồi chạy tiếp.

**Dịch câu** (bài từ vựng, người dùng chốt 23/11/2026): mỗi bài 2 đề Việt → Anh, đề 1 ngay sau từ thứ 2, đề 2 sau từ thứ 4, dùng
chính từ vừa học (`dich` trong `nguon/3,4-tu-vung-*.js`); trắc nghiệm cuối bài từ vựng còn 1 câu.
1. Đề tiếng Việt to + gợi ý "Dùng từ … · n từ". Mở **25 giây** + 3 giây bù trễ; câu người xem gửi lên chạy trên màn
   (3 câu mới nhất, chưa báo đúng sai).
2. Chấm theo đáp án soạn sẵn, **không dùng AI**: chuẩn hoá (thường hoá, mở viết tắt `don't` → `do not`, số → chữ, bỏ dấu câu)
   rồi so từng từ. Khớp một đáp án = đúng; có từ vựng cần dùng và lệch 1–2 từ (sai chính tả tính nửa lỗi) = gần đúng.
   Chỉ câu giống đáp án mới lên màn; bình luận tiếng Việt, chữ khác, thô tục (`TU_CAM`) bị bỏ.
3. Chốt: thước lướt câu mẫu, đọc câu mẫu, rồi nêu bật tối đa 3 bình luận trong **tối đa 10 giây** (riêng mode này; trắc nghiệm
   vẫn 5 giây): đúng đầu tiên ("Cảm ơn Lan, chuẩn từng chữ!"), một câu đúng viết khác, một câu gần đúng (chữ sai gạch đỏ, chữ đúng
   ghi cạnh; gia sư chỉ đọc chữ của đáp án, không đọc chữ người xem gõ).
4. Bản demo (không live): chưa có ô gõ, gia sư chờ bấm "Xem đáp án".

Thêm cách dịch được chấp nhận: thêm vào cuối mảng đề trong `dich` rồi `npm run build:gia-su`.

Tên người xem: bỏ biểu tượng/ký tự lạ, cắt còn 18 ký tự; tên có từ thô tục thì gọi là "bạn" (`TU_CAM` trong `server.js`).
Không có người xem ảo trên live thật (`--sim` chỉ để tập dượt). Bình luận thử: `curl -s -X POST localhost:8795/chat -d '{"name":"An","text":"B"}'`.

**Nhật ký** (`nhat-ky.js` → `data/gia-su-stats/<ngày>.jsonl`, ngoài git; `--sim` ghi `sim-<ngày>.jsonl`; server demo không ghi):
**mọi bình luận kèm nội dung**, cả lúc làm bài lẫn lúc không (người dùng chốt 23/11/2026: đọc lại góp ý, tìm cách dịch đúng còn
thiếu), kèm bài · phần đang phát, câu đang mở, tới sau bao lâu, kết quả chấm; mỗi câu hỏi lúc mở/chốt (số người trả lời, số đúng,
số chọn A/B/C/D); số người xem mỗi 30 giây; người vào, theo dõi, chia sẻ, thả tim, quà. Không ghi tên, mã người xem băm cùng muối với game.
Đọc lại: `npm run binh-luan:gia-su` (hôm nay) · `-- --ngoai` (chỉ bình luận ngoài giờ hỏi: góp ý, câu hỏi) ·
`-- --dich` (câu dịch chưa được chấm đúng, gom theo đề: thêm cách dịch đúng vào đáp án) · `-- 2026-11-23` / `--tu … --den …` · `--sim`.

Giao diện luôn sáng (trình duyệt trong LIVE Studio báo "ưu tiên tối" cũng không đổi); bản tối chỉ khi thêm `?theme=dark`.
Bật lại server thì trang live tự tải lại (mã phiên server đổi) và dạy tiếp từ đầu bài đang dở: sửa code xong chỉ cần bật lại server,
không phải đụng vào nguồn Link trong LIVE Studio.

Khung live 450×800 phóng vừa cửa sổ; nội dung nằm trong y 63–667 của khung (= y 150–1600 của 1080×1920, chỗ TikTok không che).
Thử từ bài bất kỳ: `?live=1&bai-so=12`.

## Cách viết một bài

Bài live viết gọn trong `nguon/*.js` (cú pháp ở đầu `build_bai.js`: `{…}` chỗ nhấn, `[…]` tiếng Anh; bài tập ghi đáp án ở vị trí đầu,
lúc dựng sẽ xáo), xếp bài vào một chương trong `nguon/0-chuong.js` (bài ngữ pháp thêm 2 câu `vd` theo chủ đề chương) rồi
`npm run build:gia-su`. Muốn viết tay đủ kịch bản thì theo định dạng dưới đây.

Một bài gồm các **phần**. Mỗi phần có `khoi` (nội dung trên trang, mode Tự đọc chỉ thấy phần này) và `giang` (kịch bản gia sư).

**Khối** (`kieu`): `doan`, `cong_thuc` (+ `chu_thich`), `vi_du` (`en`, `vi`, `sai: true` cho câu sai, `nhan`), `ghi_nho`,
`danh_sach` (`y: [{id, chu}]`), `bang` (`cot`, `dong: [{id, o: [...]}]`, ô có id `<id dòng>-<số cột>`), `bai_tap`
(`cau` với `___` là chỗ trống, `lua_chon`, `dap_an`, `giai_thich` theo từng lựa chọn cho mode Tự đọc).
`chi_gia_su: true`: khối chỉ hiện khi gia sư thêm vào (hành động `hien`).

**Chữ trong khối**: `[[id|chữ]]` đánh dấu chỗ gia sư có thể chỉ tới, `**đậm**`.

**Bước giảng**: `{ "noi": "...", "lam": [ ... ] }`
- `noi`: câu gia sư nói. Chữ tiếng Anh để trong `[ngoặc vuông]` để đọc bằng giọng tiếng Anh. Viết theo văn nói, không ký hiệu
  (`S + V` thì nói "chủ ngữ cộng động từ").
- `lam`: `tro` (chỉ thước), `to` (đổi màu chữ), `gach` (gạch chân), `khoanh`, `hien` (chỉ cho hiện ra).
  Thao tác nào cũng làm khối chứa chỗ đó hiện ra nếu chưa hiện. Thêm `"sau": <ms>` để làm sau khi bắt đầu nói
  (khớp với lúc nói tới chữ đó).
- Bước bài tập: `{ "bai_tap": "<id>", "noi", "lam", "dung": {noi}, "sai": { "<số lựa chọn>": {noi} }, "bo_qua": {noi} }`.
  Tới bước này bài dừng chờ người học chọn. Sai thì gia sư giảng đáp án đó rồi chờ chọn lại.

## Chụp thử

Tham số: `?bai=<id>&che-do=doc|gia-su&buoc=<n>&tat-tieng=1&tu-chay=1&dung=1&rong=390`.
Chrome chạy ẩn không cho cửa sổ hẹp hơn ~500px: chụp ở `--window-size=540,844`, thêm `rong=390` để khung app đúng bề rộng điện thoại.
