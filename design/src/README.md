# Màn live Migii TOEIC cho Figma

HTML tĩnh dựng lại màn live theo Design System của app (`../migii_design_system/docs/design/`), để import vào Figma bằng
plugin html.to.design (cách team đã làm ở nhánh `feature/MigiiToeic-KB-19573-redesign-onboarding-v2` của `migii_toeic_ios`).
Đây là bản thiết kế để chỉnh trong Figma, **chưa thay `public/index.html`** (màn live đang chạy).

## Màn đang chạy của mọi game (`xuat_man_that.js`)

Bản vẽ tay bên dưới chỉ có 13 khung của game gốc. Muốn có đủ mọi dạng bài đúng như đang lên sóng (các game kênh 300–900,
hiệu ứng 3 giây cuối, màn chung), dùng `xuat_man_that.js`. Script chạy từng game với khán giả ảo (server riêng ở cổng 18950+,
không đụng gateway hay server live), chụp DOM và CSS thật của `public/index.html` ở các lúc đang chơi, công bố đáp án…,
rồi nhúng ảnh và font Migii Serif vào file:

```sh
npm run design:figma                                # tất cả, khoảng 5 phút; cần Google Chrome
node design/src/xuat_man_that.js --only word,hunt   # vài game
```

Ghi ra `design/out/migii-live-man-that.html` (mọi khung trên một bảng vẽ, nhóm theo kênh) và `design/out/man-that/`
(mỗi khung một file 1080 × 1920). Chữ dùng Be Vietnam Pro (Google Fonts, Figma có sẵn). Tên người chơi là tên ảo của `sim.js`.
Chip góc phải đổi thành "● LIVE" như trên sóng thật. Thêm game hay đổi kênh thì sửa bảng `GROUPS` trong script (chép từ `gateway.js`).

## Phương án màn vinh danh (`vinh_danh_mau.js`)

`node design/src/vinh_danh_mau.js` vẽ 4 phương án màn vinh danh (bục 3 bậc, quán quân + Ninja, bảng xếp hạng, thẻ chúc mừng)
theo ngôn ngữ màn chuẩn bị đã duyệt (Figma 46:12, thẻ tải app 46:119), ra `design/out/vinh-danh-phuong-an.html` và
`design/out/vinh-danh-phuong-an/<a–d>.html`. Màn vinh danh đang chạy: `node design/src/xuat_man_that.js --only vinh-danh --file man-vinh-danh`
(script chơi ~40 giây rồi gửi lệnh kết thúc game để vào màn vinh danh).

## Dựng lại file

Chạy từ thư mục gốc repo:

```sh
python3 -I design/src/build.py                 # bản sáng (mặc định)
python3 -I design/src/build.py --theme dark    # bản tối
```

Ghi ra `design/out/` (nằm ngoài git vì file có nhúng font SVN-Avo, giấy phép chưa xác nhận):

- `migii-live-figma-sang.html`: cả 13 khung trên một bảng vẽ rộng 4800 px.
- `frames-sang/NN-<tên>.html`: mỗi khung một file rộng 1080 px, dùng khi import từng khung.

Font lấy từ `../migii_toeic_ios/Migii Toeic/viewmodel/source/font/` (đổi bằng `--fonts <thư mục>`).
Ảnh Ninja và icon app lấy từ `public/img/`. Mã QR là mẫu trỏ `https://example.com` (`design/src/qr-mau.svg`), thay bằng link thật.

## Sửa giao diện

- `styles.css`: kiểu dáng. Mọi số viết bằng dp, build đổi 1 dp = 3 px (khung 360 × 640 dp = 1080 × 1920 px).
- `build.py`: token màu cho cả hai theme (chép từ `design-tokens.json`), icon, và nội dung từng khung.
- Thêm `--preview <thư mục>` để ghi bản có script đo tràn nội dung: khung nào có `over1600` > 0 là đang lấn vào vùng TikTok che.

## Luật đã áp

Không đổ bóng, không viền (trừ viền ô màu trong bảng token). 3 lớp nền background, surface, surfaceInner. Mỗi màn tối đa
một điểm cam (accent). Chữ chỉ có 2 độ đậm 400 và 700, Migii Serif chỉ cho cấp `title`. Nội dung chính nằm trong y 150–1600 px.

## Lệch so với Design System (có chủ ý, cần designer duyệt)

- Thanh đồng hồ cao 8 dp (DS: 4 dp) vì video live bị nén mạnh.
- Câu miễn trừ ETS cỡ 12 dp (mức nhỏ nhất của DS) để vừa 2 dòng; bản cũ chỉ ~6 dp.
- Vệt sáng `glow` nâng tâm lên 90% chiều cao khung (DS: đáy màn) vì đáy khung live bị TikTok che.
- Khung "Câu trả lời" của bản cũ gộp vào bảng điểm top 3.
- Không có khung So găng 2 đội: thiết kế chỉ gồm chơi lớp bình thường (người chơi chung một lớp, không chia đội).
- Icon nét dạng tạm, chưa phải bộ Phosphor của DS (app iOS/Android hiện cũng chưa thống nhất bộ icon, xem `assets/icons/README.md` của design system).

## Font

SVN-Avo không có ký tự phiên âm IPA, ®, dấu `·`, `–`, `→`, `✓`. Phiên âm dùng font hệ thống; các dấu phân cách đã thay bằng hình vẽ.
Tên nội bộ trong file font SVN-Avo là "UTM Aptima": Figma cần cài font này (và Migii Serif) thì chữ mới đúng.

## 10 phương án màn vinh danh (`vinh_danh_10.js`)

`node design/src/vinh_danh_10.js` ghi `design/out/vinh-danh-10.html` (cả 10 khung thu nhỏ, bấm để xem cỡ lớn) và `design/out/vinh-danh-10/<số>.html`.
Người dùng chọn bản nào thì port bản đó vào `#podiumScr` (`public/index.html` + `public/theme-light.css`).

## Ba thẻ bài: 5 biến thể (`vinh_danh_the_bai.js`)

Người dùng chọn phương án 7 (ba thẻ bài) ngày 13/11/2026. `node design/src/vinh_danh_the_bai.js` ghi `design/out/vinh-danh-the-bai.html` và 5 file cỡ lớn; dùng chung mảnh ghép của `vinh_danh_10.js`.

**Đã chốt (13/11/2026):** người dùng chọn bản 2 "Thẻ sưu tầm ánh kim", tự chỉnh trên canvas Claude Design rồi cho đưa vào game.
Màn đang chạy: `renderPodium()` trong `public/index.html`, kiểu dáng và hiệu ứng xuất hiện ở cuối `public/theme-light.css` (khối "Màn vinh danh: ba thẻ bài ánh kim").
Khác bản vẽ: bỏ nhãn "Kết thúc <game>", chữ "Vinh danh" kim loại (Playfair Display, tải từ Google Fonts), nội dung giữ trong y 262–1590 thay vì kéo xuống 1756 như trên canvas.
