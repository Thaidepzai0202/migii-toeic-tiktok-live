// Đọc lại bình luận live của gia sư tự động (nhật ký data/gia-su-stats/<ngày>.jsonl, ghi bởi nhat-ky.js).
//   node gia-su/xem-binh-luan.js                  mọi bình luận hôm nay: giờ, bài · phần, câu đang mở, kết quả chấm
//   node gia-su/xem-binh-luan.js 2026-11-23       ngày khác (nhiều ngày: --tu 2026-11-20 --den 2026-11-23)
//   --ngoai   chỉ bình luận NGOÀI lúc làm bài (góp ý, câu hỏi, trò chuyện của người xem)
//   --dich    câu trả lời đề dịch chưa được chấm đúng, gom theo đề và đếm số lần: soát cách dịch đúng còn thiếu trong đáp án
//             (thêm vào cuối mảng đề trong nguon/3,4-tu-vung-*.js rồi npm run build:gia-su)
//   --sim     đọc nhật ký chạy thử (--sim)
const fs = require('fs');
const path = require('path');
const { DIR, ngayCua } = require('./nhat-ky');

const argv = process.argv.slice(2);
const co = (k) => argv.includes(`--${k}`);
const lay = (k) => { const i = argv.indexOf(`--${k}`); return i < 0 ? null : argv[i + 1]; };
const SIM = co('sim');
const homNay = ngayCua(Date.now());
const tu = lay('tu') || argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) || homNay;
const den = lay('den') || tu;

const cacNgay = [];
for (let t = Date.parse(`${tu}T00:00:00Z`); t <= Date.parse(`${den}T00:00:00Z`); t += 864e5) cacNgay.push(new Date(t).toISOString().slice(0, 10));
const dong = cacNgay.flatMap((d) => {
  const f = path.join(DIR, `${SIM ? 'sim-' : ''}${d}.jsonl`);
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
});
if (!dong.length) {
  console.log(`Chưa có nhật ký ${SIM ? 'chạy thử ' : ''}cho ${tu === den ? tu : `${tu} → ${den}`} (thư mục ${path.relative(process.cwd(), DIR)}).`);
  process.exit(0);
}

const gio = (t) => new Date(t + 7 * 3600e3).toISOString().slice(11, 19);
const ketQua = (kq) => {
  if (kq == null) return '';
  if (typeof kq === 'string') return { 'da-tra-loi': 'đã trả lời trước đó', 'khong-phai-dap-an': 'không phải đáp án', 'khong-phai-cau-anh': 'không phải câu tiếng Anh', tuc: 'thô tục (bị bỏ)', 'xa-dap-an': 'khác xa đáp án', rong: 'rỗng' }[kq] || kq;
  if (kq.chon) return `chọn ${kq.chon} · ${kq.dung ? 'đúng' : kq.gan_dung ? 'gõ gần đúng đáp án (chưa tính đúng)' : 'sai'}`;
  const muc = { dung: 'đúng', gan: 'gần đúng', lq: 'giống một phần' }[kq.muc] || kq.muc;
  return `${muc}${kq.loi ? ` (${kq.loi} lỗi)` : ''}${kq.khong_hon_cau_truoc ? ' · không hơn câu trước' : ''}`;
};
const bl = dong.filter((e) => e.e === 'bl' && (SIM || !e.ao));

if (co('dich')) {
  // Câu trả lời đề dịch chưa đúng, gom theo đề → cách viết → số lần
  const deDich = new Set(dong.filter((e) => e.e === 'hoi' && e.kieu === 'dich').map((e) => e.q));
  const theoDe = new Map();
  for (const e of bl) {
    if (!e.q || !deDich.has(e.q) || typeof e.kq !== 'object' && e.kq !== 'xa-dap-an') continue;
    if (e.kq?.muc === 'dung') continue;
    const cau = String(e.x).trim().replace(/\s+/g, ' ');
    if (e.kq === 'xa-dap-an' && cau.split(' ').length < 3) continue; // "ok", "hello": không phải câu dịch
    const m = theoDe.get(e.q) || new Map();
    const c = m.get(cau.toLowerCase()) || { cau, n: 0, kq: ketQua(e.kq) };
    c.n++;
    m.set(cau.toLowerCase(), c);
    theoDe.set(e.q, m);
  }
  if (!theoDe.size) console.log('Không có câu trả lời đề dịch nào bị chấm chưa đúng.');
  for (const [q, m] of theoDe) {
    console.log(`\n${q}`);
    for (const c of [...m.values()].sort((a, b) => b.n - a.n)) console.log(`  ${String(c.n).padStart(3)}×  "${c.cau}"  → ${c.kq}`);
  }
  process.exit(0);
}

const chon = co('ngoai') ? bl.filter((e) => !e.q) : bl;
let ngay = null;
for (const e of chon) {
  const d = ngayCua(e.t);
  if (d !== ngay) { ngay = d; console.log(`\n── ${d} ──`); }
  const noi = e.q ? `[${e.q.split('/').pop()}, ${(e.ms / 1000).toFixed(1)}s]` : '[ngoài giờ hỏi]';
  const kq = ketQua(e.kq);
  console.log(`${gio(e.t)}  ${e.bai || '—'}${e.phan ? ` · ${e.phan}` : ''}  ${noi}  ${e.u}${e.thu ? ' (thử)' : ''}${e.ao ? ' (ảo)' : ''}  "${e.x}"${kq ? `  → ${kq}` : ''}`);
}
const nguoi = new Set(bl.map((e) => e.u));
const ngoai = bl.filter((e) => !e.q).length;
console.log(`\n${bl.length} bình luận · ${nguoi.size} người · ${bl.length - ngoai} lúc làm bài, ${ngoai} ngoài giờ hỏi${co('ngoai') ? ' (đang chỉ hiện ngoài giờ hỏi)' : ''}`);
