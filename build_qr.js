// Tạo mã QR tải app cho màn live: public/img/qr-app.svg (màn chờ + màn vinh danh).
//   APP_LINK=https://… node build_qr.js   (hoặc điền APP_LINK trong .env rồi: npm run build:qr)
// Nên dùng 1 link thông minh (tự chuyển App Store / Google Play) có tham số chiến dịch để đo người tải từ live.
// Chưa có file này thì trang tự ẩn ô QR.
const fs = require('fs');
const path = require('path');
const QR = require('qrcode');

// Đọc APP_LINK từ .env nếu chưa có trong biến môi trường (không cần thư viện dotenv)
function fromDotEnv(key) {
  try {
    return fs.readFileSync(path.join(__dirname, '.env'), 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1].trim();
  } catch {
    return '';
  }
}
const link = process.argv[2] || process.env.APP_LINK || fromDotEnv('APP_LINK');
if (!link || !/^https?:\/\//.test(link)) {
  console.error('Thiếu APP_LINK (link tải app bắt đầu bằng https://). Xem CAN-CUNG-CAP.md');
  process.exit(1);
}
const out = path.join(__dirname, 'public', 'img', 'qr-app.svg');
QR.toString(link, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#081615', light: '#ffffff' } }).then((svg) => {
  fs.writeFileSync(out, svg);
  console.log(`QR → ${out}\n   ${link}`);
});
