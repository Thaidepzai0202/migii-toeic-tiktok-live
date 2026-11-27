// Trang control cho người dẫn live gia sư: đang phát bài / phần nào, ĐÁP ÁN của câu đang hỏi và các câu trong bài,
// số người chọn từng đáp án, bình luận gần đây (kèm kết quả chấm), trạng thái TikTok, số người xem.
//   node gia-su/control.js            → http://localhost:8798/   (npm run control:gia-su)
//
// Chạy riêng, KHÔNG đụng server live (cổng 8795): chỉ đọc file bài (gia-su/bai/live), vị trí (data/gia-su-live.json),
// nhật ký server live đang ghi (data/gia-su-stats/<ngày>.jsonl) và hỏi GET /trang-thai của server live. Không nối WebSocket
// của trang live (nối vào là giành quyền dẫn bài) → bật/tắt lúc nào cũng được, kể cả đang live. Người dùng yêu cầu 23/11/2026.
// Chỉ nghe ở máy này (127.0.0.1): trang có đáp án, không để người khác trong mạng mở được.
const fs = require('fs');
const path = require('path');
const http = require('http');
const { DIR, ngayCua } = require('./nhat-ky');

const ROOT = path.join(__dirname, '..');
const BAI = path.join(__dirname, 'bai', 'live');
const VI_TRI = path.join(ROOT, 'data', 'gia-su-live.json');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const PORT = Number(arg('port', 8798));
const LIVE = `http://localhost:${Number(arg('live-port', 8795))}`;
const SIM = argv.includes('--sim'); // đọc nhật ký chạy thử

// ---------- Bài ----------
let dsBai = [];
let dsBaiLuc = 0;
function napDsBai() {
  if (Date.now() - dsBaiLuc < 10000 && dsBai.length) return dsBai;
  dsBaiLuc = Date.now();
  dsBai = fs.readdirSync(BAI).filter((f) => f.endsWith('.json')).sort().map((f) => {
    try { return JSON.parse(fs.readFileSync(path.join(BAI, f), 'utf8')); } catch { return null; }
  }).filter(Boolean).sort((a, b) => a.so - b.so);
  return dsBai;
}

// Câu hỏi trong bài (trắc nghiệm, dịch câu) kèm đáp án, theo thứ tự phần
function cauHoi(b) {
  const out = [];
  b.phan.forEach((p, n) => {
    for (const k of p.khoi || []) {
      if (k.kieu === 'bai_tap') out.push({ id: k.id, kieu: 'tn', phan: p.id, phanSo: n, cau: k.cau, lua_chon: k.lua_chon, dap_an: k.dap_an, giai_thich: k.giai_thich?.[k.dap_an] || '' });
      if (k.kieu === 'dich') out.push({ id: k.id, kieu: 'dich', phan: p.id, phanSo: n, vi: k.vi, tu: k.tu, dap: k.dap, so_tu: k.so_tu });
    }
  });
  return out;
}

// ---------- Nhật ký (đọc nối tiếp phần mới ghi thêm) ----------
const doc = new Map(); // file → { off, du: phần dòng dở, ev: [] }
function suKien(file) {
  if (!fs.existsSync(file)) return [];
  const c = doc.get(file) || { off: 0, du: '', ev: [] };
  const size = fs.statSync(file).size;
  if (size < c.off) Object.assign(c, { off: 0, du: '', ev: [] });
  if (size > c.off) {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(size - c.off);
    fs.readSync(fd, buf, 0, buf.length, c.off);
    fs.closeSync(fd);
    c.off = size;
    const ls = (c.du + buf.toString('utf8')).split('\n');
    c.du = ls.pop();
    for (const l of ls) { try { c.ev.push(JSON.parse(l)); } catch {} }
    if (c.ev.length > 20000) c.ev = c.ev.slice(-15000);
  }
  doc.set(file, c);
  return c.ev;
}

function nhatKyHomNay() {
  const t = Date.now();
  const ten = (d) => path.join(DIR, `${SIM ? 'sim-' : ''}${d}.jsonl`);
  const ev = suKien(ten(ngayCua(t)));
  if (ev.some((e) => e.e === 'start')) return ev;
  return [...suKien(ten(ngayCua(t - 864e5))), ...ev]; // vừa qua nửa đêm: phiên live bắt đầu từ hôm qua
}

function trangThaiLive() {
  return new Promise((r) => {
    const req = http.get(`${LIVE}/trang-thai`, { timeout: 800 }, (res) => {
      let s = '';
      res.on('data', (d) => (s += d));
      res.on('end', () => { try { r(JSON.parse(s)); } catch { r(null); } });
    });
    req.on('error', () => r(null));
    req.on('timeout', () => { req.destroy(); r(null); });
  });
}

async function duLieu() {
  const live = await trangThaiLive();
  const tatCa = nhatKyHomNay();
  // Chỉ lấy sự kiện của lần bật server live gần nhất
  let k = null;
  for (let i = tatCa.length - 1; i >= 0; i--) if (tatCa[i].e === 'start') { k = tatCa[i].k; break; }
  const ev = k ? tatCa.filter((e) => e.k === k) : [];
  const cuoi = (f) => { for (let i = ev.length - 1; i >= 0; i--) if (f(ev[i])) return ev[i]; return null; };
  const ds = napDsBai();
  const phan = cuoi((e) => e.e === 'phan');
  let b = phan && ds.find((x) => x.id === phan.bai);
  if (!b) { try { b = ds[JSON.parse(fs.readFileSync(VI_TRI, 'utf8')).i || 0]; } catch { b = ds[0]; } }
  if (!b) return { live, loi: 'Chưa có bài live (npm run build:gia-su)' };
  const phanSo = phan && phan.bai === b.id ? b.phan.findIndex((p) => p.id === phan.phan) : -1;
  // Câu đang mở: lần "hoi" gần nhất chưa có "chot"
  const hoi = cuoi((e) => e.e === 'hoi');
  const chot = hoi && ev.some((e) => e.e === 'chot' && e.q === hoi.q && e.t >= hoi.t);
  const dangHoi = hoi && !chot ? hoi : null;
  const blCau = dangHoi ? ev.filter((e) => e.e === 'bl' && e.q === dangHoi.q && e.t >= dangHoi.t) : [];
  const ketCuoi = hoi && chot ? cuoi((e) => e.e === 'chot' && e.q === hoi.q) : null;
  const xem = cuoi((e) => e.e === 'xem');
  const i = ds.indexOf(b);
  return {
    live, bay_gio: Date.now(),
    bai: { so: b.so, id: b.id, ten: b.ten, chuong: b.chuong, phan: b.phan.map((p) => ({ id: p.id, nhan: p.nhan })), cau: cauHoi(b) },
    phanSo,
    dang_hoi: dangHoi && { q: dangHoi.q, id: dangHoi.q.split('/').pop(), kieu: dangHoi.kieu, mo: dangHoi.t, bl: blCau.map((e) => ({ t: e.t, x: e.x, kq: e.kq })) },
    vua_chot: ketCuoi && { q: ketCuoi.q, ...ketCuoi },
    xem: xem?.v ?? null,
    binh_luan: ev.filter((e) => e.e === 'bl').slice(-40).reverse().map((e) => ({ t: e.t, x: e.x, q: e.q || null, kq: e.kq ?? null, bai: e.bai, phan: e.phan })),
    dem: { bl: ev.filter((e) => e.e === 'bl').length, nguoi: new Set(ev.filter((e) => e.e === 'bl').map((e) => e.u)).size },
    bai_sau: ds[(i + 1) % ds.length] && { so: ds[(i + 1) % ds.length].so, ten: ds[(i + 1) % ds.length].ten, chuong: ds[(i + 1) % ds.length].chuong },
  };
}

const TRANG = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Control gia sư</title>
<style>
:root { --bg:#EDF3F1; --surface:#fff; --inner:#E4EDEA; --text:#10201E; --text2:#3B524E; --hint:#506762; --primary:#48BCAA; --pt:#1C7A6C; --ps:#D3EEE8; --accent:#A85600; --as:#FBEBD9; --error:#D33A49; --es:#FBE3E5;
  --font: 'Avenir Next', 'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font: 400 15px/22px var(--font); }
main { max-width: 1100px; margin: 0 auto; padding: 16px; display: grid; gap: 14px; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); }
@media (max-width: 820px) { main { grid-template-columns: minmax(0, 1fr); } }
.the { background: var(--surface); border-radius: 16px; padding: 16px 18px; }
.full { grid-column: 1 / -1; }
h2 { font: 700 12px/16px var(--font); letter-spacing: .6px; text-transform: uppercase; color: var(--hint); margin: 0 0 10px; }
.tren { display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center; }
.cham { width: 10px; height: 10px; border-radius: 99px; display: inline-block; margin-right: 6px; background: var(--error); }
.cham.on { background: var(--primary); }
.lon { font: 700 20px/28px var(--font); }
.nho { color: var(--hint); font-size: 13px; }
.dang { outline: 3px solid var(--accent); }
.cau { font: 700 19px/27px var(--font); margin: 4px 0 10px; }
.cau .o { color: var(--pt); border-bottom: 2px solid var(--primary); }
.lc { display: flex; gap: 10px; align-items: center; padding: 7px 10px; border-radius: 10px; margin: 4px 0; background: var(--inner); }
.lc.dung { background: var(--ps); font-weight: 700; color: var(--pt); }
.lc b { width: 26px; height: 26px; border-radius: 99px; display: grid; place-items: center; background: var(--surface); flex: none; }
.lc.dung b { background: var(--primary); color: #06201C; }
.lc .so { margin-left: auto; font-weight: 700; }
.ly { color: var(--text2); margin-top: 6px; }
.de { font: 700 19px/27px var(--font); }
.dap { font: 700 18px/26px var(--font); color: var(--pt); margin: 8px 0 2px; }
.khac { color: var(--text2); margin: 2px 0; }
.dong { display: grid; grid-template-columns: 64px 1fr auto; gap: 8px; padding: 6px 0; border-top: 1px solid var(--inner); align-items: baseline; }
.dong:first-child { border-top: 0; }
.dong .gio { color: var(--hint); font-size: 12px; font-variant-numeric: tabular-nums; }
.tag { font: 700 11px/16px var(--font); padding: 1px 8px; border-radius: 99px; background: var(--inner); color: var(--hint); white-space: nowrap; }
.tag.dung { background: var(--ps); color: var(--pt); } .tag.gan { background: var(--as); color: var(--accent); } .tag.sai { background: var(--es); color: var(--error); }
.tag.ngoai { background: #E6E1F7; color: #4B3B8F; }
.ds-cau { display: grid; gap: 10px; }
.mot { padding: 10px 12px; border-radius: 12px; background: var(--inner); }
.mot.qua { opacity: .55; } .mot.hien-tai { background: var(--as); }
.mot .nhan { font: 700 11px/16px var(--font); letter-spacing: .5px; text-transform: uppercase; color: var(--hint); }
.trong { color: var(--hint); }
.loi { color: var(--error); font-weight: 700; }
</style></head><body><main id="app"><div class="the full">Đang tải…</div></main>
<script>
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const gio = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour12: false });
const ABC = 'ABCDEF';
function tagKq(kq, q) {
  if (!q) return '<span class="tag ngoai">ngoài giờ hỏi</span>';
  if (kq == null) return '';
  if (typeof kq === 'string') return '<span class="tag">' + esc({ 'da-tra-loi': 'đã trả lời', 'khong-phai-dap-an': 'không phải đáp án', 'khong-phai-cau-anh': 'không phải câu Anh', tuc: 'thô tục', 'xa-dap-an': 'khác xa', rong: 'rỗng' }[kq] || kq) + '</span>';
  if (kq.chon) return '<span class="tag ' + (kq.dung ? 'dung' : kq.gan_dung ? 'gan' : 'sai') + '">' + kq.chon + (kq.dung ? ' · đúng' : kq.gan_dung ? ' · gần đúng' : ' · sai') + '</span>';
  const m = { dung: ['dung', 'đúng'], gan: ['gan', 'gần đúng'], lq: ['', 'giống một phần'] }[kq.muc] || ['', kq.muc];
  return '<span class="tag ' + m[0] + '">' + m[1] + (kq.loi ? ' · ' + kq.loi + ' lỗi' : '') + '</span>';
}
function cauTn(c, dem) {
  const tong = dem ? dem.reduce((a, b) => a + b, 0) : 0;
  return '<div class="cau">' + esc(c.cau).replace(/_{3,}/, '<span class="o">' + esc(c.lua_chon[c.dap_an]) + '</span>') + '</div>'
    + c.lua_chon.map((x, j) => '<div class="lc' + (j === c.dap_an ? ' dung' : '') + '"><b>' + ABC[j] + '</b><span>' + esc(x) + '</span>'
      + (dem ? '<span class="so">' + dem[j] + (tong ? ' · ' + Math.round(dem[j] * 100 / tong) + '%' : '') + '</span>' : '') + '</div>').join('')
    + (c.giai_thich ? '<div class="ly">Vì: ' + esc(c.giai_thich) + '</div>' : '');
}
function cauDich(c) {
  return '<div class="de">' + esc(c.vi) + '</div><div class="nho">Từ cần dùng: <b>' + esc(c.tu) + '</b> · ' + c.so_tu + ' từ</div>'
    + '<div class="dap">' + esc(c.dap[0]) + '</div>'
    + (c.dap.length > 1 ? c.dap.slice(1).map((x) => '<div class="khac">hoặc: ' + esc(x) + '</div>').join('') : '');
}
function ve(d) {
  if (d.loi) { $('#app').innerHTML = '<div class="the full loi">' + esc(d.loi) + '</div>'; return; }
  const L = d.live, tk = L && L.tiktok;
  const b = d.bai, ph = b.phan[d.phanSo];
  let h = '<div class="the full tren">'
    + '<span><span class="cham ' + (tk && tk.noi ? 'on' : '') + '"></span>' + (!L ? '<span class="loi">Không thấy server live (cổng 8795)</span>' : tk ? (tk.noi ? 'Đã nối TikTok' : 'Chưa nối TikTok') : (L.sim ? 'Chạy thử (--sim)' : 'Không nối TikTok')) + '</span>'
    + (d.xem != null ? '<span><b>' + d.xem + '</b> người xem</span>' : '')
    + '<span><b>' + d.dem.bl + '</b> bình luận · <b>' + d.dem.nguoi + '</b> người</span>'
    + (tk && tk.noi && tk.im_lang_s > 45 ? '<span class="loi">TikTok im lặng ' + tk.im_lang_s + 's</span>' : '')
    + '<span class="nho" style="margin-left:auto">' + gio(d.bay_gio) + '</span></div>';
  h += '<div class="the full"><h2>Đang phát</h2><div class="lon">' + (b.chuong ? 'Chương ' + b.chuong.so + ' · ' + esc(b.chuong.ten) + ' — Bài ' + b.chuong.bai + '/' + b.chuong.tong + ': ' : 'Bài ' + b.so + ': ') + esc(b.ten) + '</div>'
    + '<div class="nho">Phần: <b>' + (ph ? esc(ph.nhan) : '—') + '</b>' + (ph ? ' (' + (d.phanSo + 1) + '/' + b.phan.length + ')' : '') + ' · Bài sau: ' + esc(d.bai_sau ? d.bai_sau.ten : '—') + '</div></div>';
  // Câu đang hỏi
  const dh = d.dang_hoi, c = dh && b.cau.find((x) => x.id === dh.id);
  if (dh && c) {
    const giay = Math.round((d.bay_gio - dh.mo) / 1000);
    let dem = null;
    if (c.kieu === 'tn') { dem = c.lua_chon.map(() => 0); for (const e of dh.bl) if (e.kq && e.kq.chon) dem[ABC.indexOf(e.kq.chon)]++; }
    h += '<div class="the full dang"><h2>Đang hỏi · ' + (c.kieu === 'tn' ? 'Trắc nghiệm' : 'Dịch câu') + ' · mở ' + giay + ' giây · ' + dh.bl.length + ' bình luận</h2>'
      + (c.kieu === 'tn' ? cauTn(c, dem) : cauDich(c))
      + (c.kieu === 'dich' && dh.bl.length ? '<div style="margin-top:10px">' + dh.bl.slice().reverse().map((e) => '<div class="dong"><span class="gio">' + gio(e.t) + '</span><span>' + esc(e.x) + '</span>' + tagKq(e.kq, 1) + '</div>').join('') + '</div>' : '')
      + '</div>';
  }
  // Mọi câu hỏi trong bài
  h += '<div class="the"><h2>Đáp án các câu trong bài</h2><div class="ds-cau">'
    + (b.cau.length ? b.cau.map((x) => {
      const tt = dh && x.id === dh.id ? 'hien-tai' : d.phanSo > x.phanSo ? 'qua' : '';
      const loai = x.kieu === 'tn' ? 'Trắc nghiệm' : 'Dịch câu', nhanPhan = b.phan[x.phanSo].nhan;
      return '<div class="mot ' + tt + '"><div class="nhan">' + loai + (nhanPhan !== loai ? ' · ' + esc(nhanPhan) : '') + ' · sau phần ' + x.phanSo + (tt === 'qua' ? ' · đã qua' : tt ? ' · đang hỏi' : '') + '</div>' + (x.kieu === 'tn' ? cauTn(x) : cauDich(x)) + '</div>';
    }).join('') : '<div class="trong">Bài này không có câu hỏi.</div>') + '</div></div>';
  // Bình luận gần đây
  h += '<div class="the"><h2>Bình luận gần đây</h2>'
    + (d.binh_luan.length ? d.binh_luan.map((e) => '<div class="dong"><span class="gio">' + gio(e.t) + '</span><span>' + esc(e.x) + '</span>' + tagKq(e.kq, e.q) + '</div>').join('') : '<div class="trong">Chưa có bình luận.</div>')
    + '</div>';
  $('#app').innerHTML = h;
}
async function lay() {
  try { ve(await (await fetch('/du-lieu', { cache: 'no-store' })).json()); }
  catch { $('#app').firstElementChild && ($('#app').firstElementChild.innerHTML = '<span class="loi">Mất kết nối trang control</span>'); }
  setTimeout(lay, 1000);
}
lay();
</script></body></html>`;

http.createServer(async (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }).end(TRANG);
  if (p === '/du-lieu') {
    try {
      return res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(await duLieu()));
    } catch (e) {
      return res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify({ loi: e.message }));
    }
  }
  res.writeHead(404).end();
}).listen(PORT, '127.0.0.1', () => console.log(`🎛️  Control gia sư: http://localhost:${PORT}/  (đọc server live ${LIVE}${SIM ? ', nhật ký chạy thử' : ''})`));
