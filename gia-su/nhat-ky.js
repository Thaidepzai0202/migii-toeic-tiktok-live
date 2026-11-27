// Nhật ký live của gia sư tự động: ghi từng sự kiện ra data/gia-su-stats/<ngày>.jsonl (chạy --sim: sim-<ngày>.jsonl) để tối ưu về sau.
// Khác game (stats.js không ghi nội dung): ở đây GHI NỘI DUNG MỌI BÌNH LUẬN, cả lúc làm bài lẫn lúc không — người dùng chốt
// 23/11/2026: tìm cách dịch đúng còn thiếu trong đáp án, đọc lại góp ý của người xem. Không ghi tên; mã người xem băm cùng muối
// và cùng cách với game (data/stats/.salt) nên đếm được người khác nhau, khớp được với số liệu game, không đọc ngược ra tài khoản.
// Đọc lại: node gia-su/xem-binh-luan.js
//
// Mỗi dòng một sự kiện { t (ms), k (mã phiên server), e, … }:
//   start (sim) · live (on 1/0, r: phòng) · phan (bai, so, chuong, phan: bài và phần trang live đang phát)
//   xem (v: số người xem, bai, phan — mỗi 30 giây khi đã nối TikTok)
//   hoi (q: câu hỏi, kieu: tn|dich) · chot (q, kieu, n: số người trả lời, dung, dem: số chọn A/B/C/D)
//   bl (u, x: nội dung, bai, phan, q?: câu đang mở, ms?: tới sau khi mở bao lâu, kq: kết quả chấm, thu?/ao?: bình luận thử / người xem ảo)
//   join · follow · share · like (n) · gift (n, d: kim cương) — kèm u
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'data', 'gia-su-stats');
const VN = 7 * 3600e3; // giờ Việt Nam
const ngayCua = (t) => new Date(t + VN).toISOString().slice(0, 10);

function muoi() {
  const f = path.join(ROOT, 'data', 'stats', '.salt');
  try {
    return fs.readFileSync(f, 'utf8').trim();
  } catch {
    fs.mkdirSync(path.dirname(f), { recursive: true });
    const s = crypto.randomBytes(16).toString('hex');
    fs.writeFileSync(f, s);
    return s;
  }
}

// tat: không ghi (server demo trong app, không nối TikTok, không --sim)
function taoNhatKy({ sim, k, tat = false }) {
  if (tat) return { ghi() {}, bam: () => null };
  fs.mkdirSync(DIR, { recursive: true });
  const salt = muoi();
  let ngay = null;
  let file = null;
  let baoLoi = false;
  const ghi = (e, o = {}) => {
    const t = Date.now();
    const d = ngayCua(t);
    if (d !== ngay) { ngay = d; file = path.join(DIR, `${sim ? 'sim-' : ''}${d}.jsonl`); }
    try {
      fs.appendFileSync(file, `${JSON.stringify({ t, k, e, ...o })}\n`);
    } catch (err) {
      if (!baoLoi) console.warn(`⚠️  Không ghi được nhật ký ${file}: ${err.message}`);
      baoLoi = true;
    }
  };
  const bam = (uid) => crypto.createHash('sha256').update(salt + String(uid)).digest('base64url').slice(0, 10);
  return { ghi, bam };
}

module.exports = { taoNhatKy, DIR, ngayCua };
