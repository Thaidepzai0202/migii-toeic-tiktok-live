// Demo "gia sư tự động": bài học tự chạy theo kịch bản soạn sẵn, gia sư chỉ thước, nhấn chữ, lấy ví dụ, bài tập xen giữa.
// Nội dung bài là nội dung tạm, không lấy từ kho của app.
//
//   npm run demo:gia-su                     → http://localhost:8795/  (xem trên máy / điện thoại cùng Wi-Fi)
//   node gia-su/server.js --sim             → thêm người xem ảo trả lời câu hỏi ở trang live (tập dượt)
//   node gia-su/server.js --user <tiktok>   → đọc bình luận live thật của @<tiktok> (gia-su/live.sh lo việc này)
//   Trang live (cho TikTok LIVE Studio chụp): http://localhost:8795/?live=1
//
// Bài: gia-su/bai/*.json (bài demo) và gia-su/bai/live/*.json (100 bài cho live, dựng bằng npm run build:gia-su).
// Giọng: tiếng Việt bằng VieNeu (tts.js, cần VIENEU_PY trong .env), tiếng Anh bằng dịch vụ đọc của Migii (en_audio.js).
// Lúc bật server sinh sẵn mọi câu trong bài; câu nào chưa có giọng thì trang đọc bằng giọng trình duyệt (live: chỉ hiện phụ đề).
//
// Live: tới câu hỏi, trang báo server mở phiên; người xem bình luận A/B/C/D hoặc gõ đáp án. Chốt xong server trả về
// câu cảm ơn người đúng đầu tiên và câu sửa cho một người sai (đã sinh sẵn giọng có tên người xem); trang đọc tối đa 5 giây.
// Mode "Dịch câu" (bài từ vựng): người xem bình luận câu tiếng Anh; server chấm theo đáp án soạn sẵn (không AI), gửi lên trang
// những câu giống đáp án, chốt thì chọn ra người đúng đầu tiên, một câu đúng khác, một câu gần đúng để sửa.
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { WebSocketServer } = require('ws');

const ROOT = path.join(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}
const tts = require('../tts');
const enAudio = require('../en_audio');
const { tachLoi } = require('./public/tach-loi');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const PORT = Number(arg('port', process.env.GIA_SU_PORT || 8795));
const SIM = argv.includes('--sim');
const TIKTOK_USER = arg('user', null);
const BAI = path.join(__dirname, 'bai');
const PUB = path.join(__dirname, 'public');
const VI_TRI = path.join(ROOT, 'data', 'gia-su-live.json'); // bài live đang phát tới đâu (bật lại server thì phát tiếp)

// Câu cố định của chế độ live (sinh giọng sẵn cùng bài)
const LOI_LIVE = { moi: 'Bạn bình luận đáp án nhé!', dich: 'Bình luận câu tiếng Anh của bạn nhé!' };

// ---------- Bài học ----------
const idTrongChu = (s) => [...String(s || '').matchAll(/\[\[([\w-]+)\|/g)].map((m) => m[1]);

// Mọi id có thể chỉ tới trong một bài: phần, khối, chữ đánh dấu [[id|…]], dòng/ô bảng, ý trong danh sách.
function cacId(bai) {
  const ids = new Set();
  for (const p of bai.phan || []) {
    ids.add(p.id);
    for (const k of p.khoi || []) {
      ids.add(k.id);
      for (const f of ['chu', 'en', 'cau', 'chu_thich']) idTrongChu(k[f]).forEach((i) => ids.add(i));
      for (const d of k.dong || []) { ids.add(d.id); d.o.forEach((_, j) => ids.add(`${d.id}-${j}`)); }
      for (const y of k.y || []) { ids.add(y.id); idTrongChu(y.chu).forEach((i) => ids.add(i)); }
    }
  }
  return ids;
}

// Mọi lời gia sư nói trong bài (lời giảng, lời khen, giảng đáp án sai, đáp án khi bỏ qua, lý do khi live) kèm hành động đi cùng.
function cacLoi(bai) {
  const out = [];
  for (const p of bai.phan || []) {
    for (const b of p.giang || []) {
      out.push(b);
      for (const k of ['dung', 'bo_qua', 'giai', 'dap']) if (b[k]) out.push(b[k]);
      for (const s of Object.values(b.sai || {})) out.push(s);
    }
  }
  return out;
}

const HANH_DONG = ['tro', 'to', 'gach', 'khoanh', 'hien'];
const daBao = {};

function kiemBai(bai, ten) {
  const loi = [];
  if (!bai.id || !bai.ten || !Array.isArray(bai.phan)) loi.push('thiếu id, ten hoặc phan');
  const ids = cacId(bai);
  const baiTap = new Set(bai.phan.flatMap((p) => (p.khoi || []).filter((k) => k.kieu === 'bai_tap').map((k) => k.id)));
  for (const l of cacLoi(bai)) {
    for (const h of l.lam || []) {
      const kieu = HANH_DONG.find((k) => k in h);
      if (!kieu) loi.push(`hành động lạ: ${JSON.stringify(h)}`);
      else if (!ids.has(h[kieu])) loi.push(`không có id "${h[kieu]}" (${kieu})`);
    }
  }
  for (const p of bai.phan) for (const b of p.giang || []) if (b.bai_tap && !baiTap.has(b.bai_tap)) loi.push(`không có bài tập "${b.bai_tap}"`);
  // Bài được nạp lại mỗi lần mở: chỉ báo khi lỗi đổi so với lần trước
  if (daBao[ten] === loi.join('\n')) return;
  daBao[ten] = loi.join('\n');
  for (const l of loi) console.warn(`⚠️  ${ten}: ${l}`);
}

function napBai() {
  const ds = {};
  const tep = [
    ...fs.readdirSync(BAI).filter((f) => f.endsWith('.json')).sort().map((f) => [path.join(BAI, f), false]),
    ...(fs.existsSync(path.join(BAI, 'live')) ? fs.readdirSync(path.join(BAI, 'live')).filter((f) => f.endsWith('.json')).sort().map((f) => [path.join(BAI, 'live', f), true]) : []),
  ];
  for (const [f, live] of tep) {
    try {
      const b = JSON.parse(fs.readFileSync(f, 'utf8'));
      kiemBai(b, path.basename(f));
      ds[b.id] = { ...b, live };
    } catch (e) {
      console.error(`❌ ${path.basename(f)}: ${e.message}`);
    }
  }
  return ds;
}

// ---------- Giọng đọc ----------
// Chỉ đọc đúng những câu có trong bài (và câu live server tự soạn), để server mở trong mạng LAN không thành chỗ đọc chữ tuỳ ý.
const choPhep = new Set();
// Hai hàng sinh giọng chạy song song: tiếng Việt (VieNeu, một tiến trình, lần lượt) và tiếng Anh (dịch vụ qua mạng, 3 luồng)
const hang = { vi: [], en: [] };
const dangChay = { vi: 0, en: 0 };
const LUONG = { vi: 1, en: 3 };
const tienDo = { xong: 0, loi: 0, tong: 0 };

function doanCuaBai(bai) {
  const out = [];
  for (const l of cacLoi(bai)) for (const d of tachLoi(l.noi)) if (d.l !== 'nghi') out.push(d);
  for (const p of bai.phan) {
    for (const k of p.khoi || []) {
      // Câu ví dụ có nút loa, từ trong bảng (trừ cột nghĩa cuối) chạm để nghe
      if (k.kieu === 'vi_du' && k.en && !k.sai) out.push({ l: 'en', doc: k.en.replace(/\[\[[\w-]+\|([^\]]+)\]\]/g, '$1') });
      for (const d of k.dong || []) d.o.slice(0, -1).forEach((w) => out.push({ l: 'en', doc: w }));
      // Đáp án đúng: câu sửa cho người xem lúc live đọc "đáp án là […]"
      if (k.kieu === 'bai_tap') out.push({ l: 'en', doc: k.lua_chon[k.dap_an] });
    }
  }
  return out;
}

// Thêm câu vào danh sách được đọc và hàng sinh giọng. uuTien: đẩy lên đầu hàng (câu live có tên người xem, cần ngay).
function themDoan(ds, uuTien = false) {
  const enMoi = [];
  for (const d of ds) {
    const k = `${d.l}|${d.doc}`;
    if (choPhep.has(k)) continue;
    choPhep.add(k);
    if (d.l === 'en') enMoi.push(d.doc);
    const h = hang[d.l === 'en' ? 'en' : 'vi'];
    if (uuTien) h.unshift(d); else h.push(d);
    tienDo.tong++;
  }
  if (enMoi.length) enAudio.allowText(enMoi);
  sinhSan();
}

function capNhatGiong(ds) {
  themDoan(Object.values(ds).flatMap(doanCuaBai));
  themDoan(Object.values(LOI_LIVE).flatMap((s) => tachLoi(s).filter((d) => d.l !== 'nghi')));
}

const layFile = (l, t) => (l === 'vi' ? (tts.enabled ? tts.synth(t) : Promise.reject(new Error('chưa bật VieNeu'))) : enAudio.get(t));

function sinhSan() {
  for (const l of ['vi', 'en']) {
    while (dangChay[l] < LUONG[l] && hang[l].length) {
      const d = hang[l].shift();
      dangChay[l]++;
      layFile(d.l, d.doc)
        .then(() => tienDo.xong++)
        .catch((e) => { tienDo.loi++; console.warn(`⚠️  Giọng ${d.l} "${d.doc.slice(0, 40)}": ${e.message}`); })
        .finally(() => {
          dangChay[l]--;
          const n = tienDo.xong + tienDo.loi;
          if (n % 100 === 0 || n === tienDo.tong) console.log(`🗣️  Giọng đọc: ${n}/${tienDo.tong} câu${tienDo.loi ? ` (${tienDo.loi} lỗi)` : ''}`);
          sinhSan();
        });
    }
  }
}

// ---------- Live: người xem trả lời bằng bình luận ----------
// Tên người xem để hiện và đọc: bỏ biểu tượng/ký tự lạ, cắt ngắn; tên có từ thô tục thì gọi chung là "bạn".
const TU_CAM = /(^|\s)(đụ|địt|đit|lồn|lon|cặc|cac|buồi|đéo|đĩ|fuck|fuk|shit|bitch|dick|pussy|cunt|sex|porn|vcl|vkl|clm|cmm|đm|đmm|dmm|dcm|đcm|óc chó|ngu)(\s|$)/i;
function tenGon(name) {
  let t = String(name || '').normalize('NFC').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (t.length > 18) t = t.slice(0, 18).replace(/\s\S*$/, '').trim() || t.slice(0, 18);
  if (!/\p{L}/u.test(t) || TU_CAM.test(t.toLowerCase())) return 'bạn';
  return t;
}

const bo = (s) => String(s).toLowerCase().normalize('NFC').replace(/[^a-z' ]/g, '').replace(/\s+/g, ' ').trim();
function khoangCach(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

// Đọc câu trả lời: gõ thẳng lựa chọn ("a few"), chữ cái (A, b, "đáp án là C", "d nhé"); gõ gần đúng (sai 1–2 chữ) thì kieu 'gan'.
// Chữ cái phải đứng riêng ("bạn ơi" không phải chọn B).
function docDapAn(text, chon) {
  const t = String(text).trim();
  const nt = bo(t);
  const j0 = chon.findIndex((c) => nt.length >= 2 && nt === bo(c));
  if (j0 >= 0) return { j: j0, kieu: 'tu' };
  const m = t.match(/^(?:đáp án|dap an|chọn|chon|câu|cau)?\s*(?:là|la)?\s*([a-f])(?=$|[\s.,!:)?])/i);
  if (m) { const j = 'abcdef'.indexOf(m[1].toLowerCase()); if (j < chon.length) return { j, kieu: 'chu' }; }
  if (nt.length < 3) return null;
  let tot = null;
  chon.forEach((c, j) => {
    const nc = bo(c);
    const d = khoangCach(nt, nc);
    if (d > 0 && d <= (nc.length >= 8 ? 2 : 1) && (!tot || d < tot.d)) tot = { j, kieu: 'gan', d };
  });
  return tot;
}

let phien = null;   // câu hỏi đang mở: { id, chon, dap, da: Map(uid → j), dem: [..], camOn, sua }
const dangPhat = { bai: null, phan: null }; // bài / phần trang live đang phát (trang báo lúc sang phần mới), ghi kèm nhật ký
let trang = null;   // trang live đang dẫn (chỉ một trang được mở phiên)
const gui = (ws, m) => { try { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); } catch {} };

function loiNguoiXem(noi) {
  themDoan(tachLoi(noi).filter((d) => d.l !== 'nghi'), true); // sinh giọng ngay, trước hàng câu bài học
  return noi;
}

// Mọi bình luận (lúc làm bài lẫn lúc không) đều vào nhật ký kèm kết quả chấm, để đọc lại góp ý và tối ưu đề / đáp án về sau
function onChat(user, text) {
  if (text == null || text === '') return;
  const uid = String(user.uid || user.name);
  const p = phien;
  const kq = !p ? null : p.kieu === 'dich' ? onDich(user, text) : onTraLoi(user, text);
  nhatKy.ghi('bl', {
    u: nhatKy.bam(uid), x: String(text).slice(0, 500), bai: dangPhat.bai, phan: dangPhat.phan,
    ...(p && { q: p.id, ms: Date.now() - p.mo }), kq,
    ...(uid.startsWith('thu:') && { thu: 1 }), ...(uid.startsWith('ao:') && { ao: 1 }),
  });
}

// Trắc nghiệm. Trả về kết quả chấm cho nhật ký.
function onTraLoi(user, text) {
  const uid = String(user.uid || user.name);
  if (phien.da.has(uid)) return 'da-tra-loi'; // mỗi người tính câu trả lời đầu tiên
  const r = docDapAn(text, phien.chon);
  if (!r) return 'khong-phai-dap-an';
  const ten = tenGon(user.name);
  phien.da.set(uid, r.j);
  phien.dem[r.j]++;
  const dung = r.j === phien.dap && r.kieu !== 'gan';
  gui(trang, { t: 'tl', ten, j: r.j, dung });
  const dap = phien.chon[phien.dap];
  if (dung && !phien.camOn) phien.camOn = { ten, noi: loiNguoiXem(`Cảm ơn ${ten}, đúng đầu tiên!`) };
  // Sửa cho người "sai một chút": gõ gần đúng đáp án thì ưu tiên sửa chính tả; không thì sửa cho người chọn sai đầu tiên
  if (r.kieu === 'gan' && r.j === phien.dap && phien.sua?.kieu !== 'gan') phien.sua = { ten, kieu: 'gan', noi: loiNguoiXem(`${ten} gần đúng rồi, viết là [${dap}] nhé.`) };
  else if (r.j !== phien.dap && !phien.sua) phien.sua = { ten, kieu: 'sai', noi: loiNguoiXem(`${ten} ơi, đáp án là [${dap}] nhé.`) };
  return { chon: 'ABCDEF'[r.j], cach: r.kieu, dung, ...(r.kieu === 'gan' && r.j === phien.dap && { gan_dung: 1 }) };
}

function moPhien(m) {
  phien = { id: m.id, mo: Date.now(), chon: m.chon.map(String), dap: Number(m.dap), da: new Map(), dem: m.chon.map(() => 0), camOn: null, sua: null };
  nhatKy.ghi('hoi', { q: phien.id, kieu: 'tn', bai: dangPhat.bai });
  if (SIM) nguoiXemAo(phien);
}

// ---------- Live: dịch câu ----------
// Chấm câu dịch theo đáp án soạn sẵn: chuẩn hoá (thường hoá, mở viết tắt, số → chữ, bỏ dấu câu) rồi so từng từ.
const SO_CHU = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
const VIET_TAT = [[/\bwon't\b/g, 'will not'], [/\bcan't\b/g, 'can not'], [/\bcannot\b/g, 'can not'], [/n't\b/g, ' not'], [/\blet's\b/g, 'let us'],
  [/'m\b/g, ' am'], [/'re\b/g, ' are'], [/'ll\b/g, ' will'], [/'ve\b/g, ' have'], [/'d\b/g, ' would'], [/\b(it|he|she|that|there|what|where|who|here)'s\b/g, '$1 is']];
function tuCau(s) {
  let t = String(s).toLowerCase().normalize('NFC').replace(/[’‘`´]/g, "'");
  for (const [re, x] of VIET_TAT) t = t.replace(re, x);
  return t.replace(/'s\b/g, 's').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean)
    .map((w) => (/^\d+$/.test(w) && Number(w) <= 20 ? SO_CHU[Number(w)] : w));
}
const gan = (a, b) => a.length >= 4 && b.length >= 4 && khoangCach(a, b) <= 1; // gõ sai một chữ cái
const trungNhan = (w, t) => w === t || w.startsWith(t) || gan(w, t);

// So câu người xem (a) với đáp án (b) theo từng từ: đúng 0, sai chính tả 0,5, sai/thừa/thiếu 1. Trả về các bước sửa.
function soCau(a, b) {
  const c = (x, y) => (x === y ? 0 : gan(x, y) ? 0.5 : 1);
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...b.map((_, j) => (i ? 0 : j + 1))]);
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c(a[i - 1], b[j - 1]));
  const ops = [];
  for (let i = a.length, j = b.length; i > 0 || j > 0;) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + c(a[i - 1], b[j - 1])) {
      ops.unshift(a[i - 1] === b[j - 1] ? { k: 'giu', w: a[i - 1] } : { k: 'sai', w: a[i - 1], dung: b[j - 1], go: gan(a[i - 1], b[j - 1]) });
      i--; j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { ops.unshift({ k: 'bo', w: a[i - 1] }); i--; }
    else { ops.unshift({ k: 'them', w: b[j - 1] }); j--; }
  }
  return { cost: d[a.length][b.length], ops };
}

// muc: 'dung' (khớp một đáp án), 'gan' (có từ vựng cần dùng, lệch 1–2 từ), 'lq' (khá giống, chỉ hiện ở dòng bình luận), null (bỏ qua)
function chamDich(text, p) {
  const toks = tuCau(text);
  if (toks.length < 2 || toks.length > 30) return null;
  let tot = null;
  p.dapTu.forEach((b) => { const r = soCau(toks, b); if (!tot || r.cost < tot.cost) tot = { ...r, L: b.length }; });
  const coNhan = p.nhanTu.every((t) => toks.some((w) => trungNhan(w, t)));
  const muc = tot.cost === 0 ? 'dung' : coNhan && tot.cost <= Math.max(1, Math.min(2, tot.L * 0.35)) ? 'gan' : tot.cost <= tot.L * 0.6 ? 'lq' : null;
  return muc && { muc, cost: tot.cost, ops: tot.ops, chuan: toks.join(' ') };
}

// Câu người xem để hiện: từng chữ, đánh dấu chữ của từ vựng cần dùng
const cacGoc = (hien, nhanTu) => hien.split(' ').map((w) => { const n = tuCau(w).join(''); return { w, n: !!n && nhanTu.some((t) => trungNhan(n, t)) }; });

// Lời sửa cho người gần đúng: chỉ đọc chữ của đáp án (không đọc chữ người xem gõ)
function loiSua(ten, ops) {
  const o = ops.find((x) => x.k !== 'giu');
  if (o?.k === 'sai' && o.go) return `${ten} gần đúng rồi, xem lại chính tả chữ [${o.dung}] nhé.`;
  if (o?.k === 'sai') return `${ten} gần đúng rồi, chỗ này dùng [${o.dung}] nhé.`;
  if (o?.k === 'them') return `${ten} gần đúng rồi, thêm chữ [${o.w}] nữa là chuẩn.`;
  return `${ten} gần đúng rồi, bỏ bớt một chữ là chuẩn.`;
}

function moPhienDich(m) {
  const dap = (m.dap || []).map(String).slice(0, 12);
  phien = {
    kieu: 'dich', id: m.id, dap, dapTu: dap.map(tuCau),
    nhanTu: [...new Set((m.nhan || []).flatMap(tuCau))].filter((t) => t.length >= 3),
    nguoi: new Map(), camOn: null, khac: null, sua: null, mo: Date.now(),
  };
  nhatKy.ghi('hoi', { q: phien.id, kieu: 'dich', bai: dangPhat.bai });
  if (SIM) nguoiXemAoDich(phien);
}

function onDich(user, text) {
  const p = phien;
  const goc = String(text).normalize('NFC').replace(/\p{Extended_Pictographic}|️|‍/gu, ' ').replace(/\s+/g, ' ').trim();
  // Chỉ nhận câu chữ Latin không dấu (bình luận tiếng Việt, chữ khác thì bỏ), không thô tục
  // Trả về kết quả chấm cho nhật ký (lý do bị loại, hoặc mức + số lỗi)
  if (!goc) return 'rong';
  if (/[^\x20-\x7E’‘´]/.test(goc)) return 'khong-phai-cau-anh';
  if (TU_CAM.test(goc.toLowerCase())) return 'tuc';
  const r = chamDich(goc, p);
  if (!r) return 'xa-dap-an';
  const uid = String(user.uid || user.name);
  const cu = p.nguoi.get(uid);
  if (cu && cu.cost <= r.cost) return { muc: r.muc, loi: r.cost, khong_hon_cau_truoc: 1 }; // mỗi người giữ câu tốt nhất
  const ten = tenGon(user.name);
  const hien = goc.length > 90 ? `${goc.slice(0, 88).replace(/\s\S*$/, '')}…` : goc;
  const cac = cacGoc(hien, p.nhanTu);
  p.nguoi.set(uid, { ten, muc: r.muc, cost: r.cost });
  gui(trang, { t: 'bl', ten, cac, moi: !cu });
  if (r.muc === 'dung') {
    if (p.sua?.uid === uid) p.sua = null; // đã tự sửa đúng
    if (!p.camOn) p.camOn = { uid, ten, chuan: r.chuan, cac, noi: loiNguoiXem(`Cảm ơn ${ten}, chuẩn từng chữ!`) };
    else if (uid !== p.camOn.uid) {
      const giong = r.chuan === p.camOn.chuan;
      // Ưu tiên một câu đúng viết khác người đầu tiên (thấy được nhiều cách dịch); không có thì lấy người đúng thứ hai
      if (!p.khac || (p.khac.giong && !giong)) p.khac = { uid, ten, giong, cac, noi: loiNguoiXem(giong ? `${ten} cũng đúng rồi!` : `${ten} cũng đúng, cách viết khác.`) };
    }
  } else if (r.muc === 'gan' && (!p.sua || r.cost < p.sua.cost)) {
    p.sua = { uid, ten, cost: r.cost, cac: r.ops, noi: loiNguoiXem(loiSua(ten, r.ops)) };
  }
  return { muc: r.muc, loi: r.cost };
}

function dongPhienDich(p) {
  const dung = [...p.nguoi.values()].filter((x) => x.muc === 'dung').length;
  nhatKy.ghi('chot', { q: p.id, kieu: 'dich', n: p.nguoi.size, dung, gan: [...p.nguoi.values()].filter((x) => x.muc === 'gan').length, cam_on: !!p.camOn, khac: !!p.khac, sua: !!p.sua });
  console.log(`💬 ${p.id} (dịch): ${p.nguoi.size} người gửi câu, ${dung} đúng${p.camOn ? ` · cảm ơn ${p.camOn.ten}` : ''}${p.khac ? ` · ${p.khac.ten} cũng đúng` : ''}${p.sua ? ` · sửa cho ${p.sua.ten}` : ''}`);
  const gon = (x) => x && { ten: x.ten, cac: x.cac, noi: x.noi };
  return { t: 'ket', kieu: 'dich', dem: p.nguoi.size, cam_on: gon(p.camOn), khac: gon(p.khac), sua: gon(p.sua) };
}

function dongPhien() {
  if (!phien) return null;
  const p = phien;
  phien = null;
  if (p.kieu === 'dich') return dongPhienDich(p);
  const dung = [...p.da.values()].filter((j) => j === p.dap).length;
  nhatKy.ghi('chot', { q: p.id, kieu: 'tn', n: p.da.size, dung, dem: p.dem, dap: 'ABCDEF'[p.dap] });
  console.log(`💬 ${p.id}: ${p.da.size} người trả lời, ${dung} đúng${p.camOn ? ` · cảm ơn ${p.camOn.ten}` : ''}${p.sua ? ` · sửa cho ${p.sua.ten}` : ''}`);
  return { t: 'ket', dem: p.dem, cam_on: p.camOn, sua: p.sua };
}

// Người xem ảo (--sim): trả lời rải rác trong lúc mở câu hỏi, có người đúng, người sai, người gõ sai chính tả
const TEN_AO = ['Lan Anh', 'Minh', 'Thu Hà', 'Quang', 'Ngọc', 'Tuấn', 'Phương', 'Hải', 'Mai', 'Đức', 'Linh', 'Bảo'];
function nguoiXemAo(p) {
  const n = 2 + Math.floor(Math.random() * 5);
  const ten = [...TEN_AO].sort(() => Math.random() - 0.5).slice(0, n);
  ten.forEach((name, k) => setTimeout(() => {
    if (phien !== p) return;
    const r = Math.random();
    let text;
    if (r < 0.55) text = 'ABCDEF'[p.dap];
    else if (r < 0.7) { const w = p.chon[p.dap]; text = w.length > 4 ? w.slice(0, -2) + w.slice(-1) : w; } // gõ thiếu một chữ
    else text = 'ABCDEF'[(p.dap + 1 + Math.floor(Math.random() * (p.chon.length - 1))) % p.chon.length];
    onChat({ uid: `ao:${name}`, name }, text);
  }, 2500 + k * 1500 + Math.random() * 1200));
}

// Người xem ảo cho đề dịch: người gõ đúng, người thiếu/sai một chữ, người gõ sai chính tả, người bình luận linh tinh
const RAC = ['hay quá', 'khó quá ạ', 'hello cô', 'chào mọi người', 'ok', '❤️❤️❤️', 'I love you'];
function nguoiXemAoDich(p) {
  const n = 3 + Math.floor(Math.random() * 5);
  const ten = [...TEN_AO].sort(() => Math.random() - 0.5).slice(0, n);
  ten.forEach((name, k) => setTimeout(() => {
    if (phien !== p) return;
    const goc = p.dap[Math.floor(Math.random() * p.dap.length)];
    const w = goc.replace(/[.?!]$/, '').split(' ');
    const r = Math.random();
    let text;
    if (r < 0.4) text = Math.random() < 0.5 ? goc : w.join(' ').toLowerCase();
    else if (r < 0.65) { // thiếu một chữ nhỏ (hoặc chữ cuối)
      const i = w.findIndex((x, j) => j > 0 && /^(the|a|an|to|is|are|my|your|will|very)$/i.test(x));
      text = w.filter((_, j) => j !== (i > 0 ? i : w.length - 1)).join(' ');
    } else if (r < 0.8) { // gõ thiếu một chữ cái ở chữ dài nhất
      const i = w.reduce((m, x, j) => (x.length > w[m].length ? j : m), 0);
      w[i] = w[i].slice(0, -2) + w[i].slice(-1);
      text = w.join(' ');
    } else text = RAC[Math.floor(Math.random() * RAC.length)];
    onChat({ uid: `ao:${name}`, name }, text);
  }, 4000 + k * 2500 + Math.random() * 2000));
}

// ---------- TikTok ----------
const RETRY_SEC = 10;
// Chốt tự nối lại (như game live): đã nối mà lâu không có sự kiện nào (bình luận, người vào, số người xem, thả tim…) thì coi như
// đang bám phòng live cũ hoặc kết nối chết lặng → bỏ phòng hiện tại, nối lại từ đầu. Số người xem TikTok gửi đều nên phòng vắng vẫn có sự kiện.
const IM_LANG_MS = Number(process.env.GIA_SU_IM_LANG_MS) || 90000;
let liveConn = null;
const tiktok = { noi: false, dangNoi: false, phong: null, suKien: 0, hen: null };
function noiTikTok(user) {
  const { TikTokLiveConnection, WebcastEvent, ControlEvent } = require('tiktok-live-connector');
  const tu = (u = {}) => ({ uid: u.id || u.userId || u.displayId || u.nickname, name: u.nickname || u.displayId || 'bạn' });
  const song = () => { tiktok.suKien = Date.now(); };
  const henNoi = (s) => { clearTimeout(tiktok.hen); tiktok.hen = setTimeout(lap, s * 1000); };
  const thu = async () => {
    try { liveConn?.disconnect(); } catch {}
    const conn = new TikTokLiveConnection(user, { signApiKey: process.env.EULER_API_KEY || undefined, enableExtendedGiftInfo: false, fetchRoomInfoOnConnect: false });
    liveConn = conn;
    if ((await conn.fetchIsLive().catch(() => null)) === false) throw new Error('kênh chưa lên sóng');
    conn.on(WebcastEvent.CHAT, (d) => { song(); onChat(tu(d.user), d.content ?? d.comment); });
    for (const ev of [WebcastEvent.MEMBER, WebcastEvent.ROOM_USER, WebcastEvent.LIKE, WebcastEvent.GIFT, WebcastEvent.FOLLOW, WebcastEvent.SHARE]) if (ev) conn.on(ev, song);
    // Nhật ký: số người xem (ghi mỗi 30 giây), người vào, theo dõi, chia sẻ, thả tim, quà — kèm mã người đã băm
    const u = (d) => nhatKy.bam(tu(d.user).uid);
    conn.on(WebcastEvent.ROOM_USER, (d) => { tiktok.xem = Number(d.total ?? d.viewerCount) || tiktok.xem; });
    conn.on(WebcastEvent.MEMBER, (d) => nhatKy.ghi('join', { u: u(d) }));
    conn.on(WebcastEvent.FOLLOW, (d) => nhatKy.ghi('follow', { u: u(d) }));
    conn.on(WebcastEvent.SHARE, (d) => nhatKy.ghi('share', { u: u(d) }));
    conn.on(WebcastEvent.LIKE, (d) => nhatKy.ghi('like', { u: u(d), n: Number(d.likeCount) || 1 }));
    conn.on(WebcastEvent.GIFT, (d) => {
      const g = d.gift || {};
      if (g.type === 1 && !d.repeatEnd) return; // quà chuỗi: chỉ tính lúc chuỗi kết thúc (như game)
      nhatKy.ghi('gift', { u: u(d), n: d.repeatCount || 1, d: g.diamondCount || 1, qua: g.name || null });
    });
    conn.on(ControlEvent.DISCONNECTED, () => {
      if (conn !== liveConn) return; // kết nối cũ đã bị thay
      tiktok.noi = false;
      nhatKy.ghi('live', { on: 0 });
      console.warn('Mất kết nối TikTok, nối lại sau 3 giây…');
      henNoi(3);
    });
    const st = await conn.connect();
    if (conn !== liveConn) { try { conn.disconnect(); } catch {} return; }
    Object.assign(tiktok, { noi: true, phong: st.roomId });
    nhatKy.ghi('live', { on: 1, r: String(st.roomId) });
    song();
    console.log(`✅ Đã nối live @${user}, phòng ${st.roomId}`);
  };
  const lap = () => {
    if (tiktok.dangNoi) return;
    tiktok.dangNoi = true;
    thu().catch((e) => {
      const msg = e.message || String(e);
      const gioiHan = /rate.?limit|too many/i.test(msg); // Euler giới hạn số lần nối: thử dồn thì càng bị chặn lâu
      console.warn(`Chưa nối được @${user} (${msg.slice(0, 80)}) — thử lại sau ${gioiHan ? 120 : RETRY_SEC}s`);
      henNoi(gioiHan ? 120 : RETRY_SEC);
    }).finally(() => { tiktok.dangNoi = false; });
  };
  lap();
  setInterval(() => {
    if (!tiktok.noi || Date.now() - tiktok.suKien <= IM_LANG_MS) return;
    console.warn(`TikTok im lặng ${Math.round(IM_LANG_MS / 1000)}s (phòng ${tiktok.phong}) — có thể đang bám phòng live cũ, nối lại…`);
    const cu = liveConn;
    liveConn = null; // DISCONNECTED của kết nối cũ sẽ bị bỏ qua
    Object.assign(tiktok, { noi: false, phong: null });
    nhatKy.ghi('live', { on: 0, im_lang: 1 });
    try { cu?.disconnect(); } catch {}
    henNoi(0);
  }, Math.min(30000, IM_LANG_MS / 3));
  setInterval(() => { if (tiktok.noi) nhatKy.ghi('xem', { v: tiktok.xem ?? null, bai: dangPhat.bai, phan: dangPhat.phan }); }, 30000);
}

// ---------- HTTP ----------
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.gif': 'image/gif', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };

function guiFile(res, file, cache = 'no-cache') {
  fs.stat(file, (e, st) => {
    if (e || !st.isFile()) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': LOAI[path.extname(file)] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache });
    fs.createReadStream(file).pipe(res);
  });
}

const json = (res, data) => res.writeHead(200, { 'Content-Type': LOAI['.json'], 'Cache-Control': 'no-cache' }).end(JSON.stringify(data));
const tuMayNay = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

let ds = napBai();
capNhatGiong(ds);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);
  if (p === '/' || p === '/index.html') return guiFile(res, path.join(PUB, 'index.html'));
  if (p === '/bai') {
    ds = napBai();
    capNhatGiong(ds);
    return json(res, Object.values(ds).map((b) => ({ id: b.id, ten: b.ten, nhom: b.nhom, so_phan: b.phan.length, live: b.live, so: b.so })));
  }
  if (p.startsWith('/bai/')) {
    ds = napBai(); // nạp lại mỗi lần mở bài: sửa file bài rồi tải lại trang là thấy
    capNhatGiong(ds);
    const b = ds[p.slice(5)];
    return b ? json(res, b) : res.writeHead(404).end();
  }
  if (p === '/trang-thai') return json(res, { ...tienDo, vieneu: tts.enabled, sim: SIM, tiktok: TIKTOK_USER && { kenh: TIKTOK_USER, noi: tiktok.noi, phong: tiktok.phong, im_lang_s: tiktok.noi ? Math.round((Date.now() - tiktok.suKien) / 1000) : null } });
  if (p === '/live/vi-tri') {
    try { return json(res, JSON.parse(fs.readFileSync(VI_TRI, 'utf8'))); } catch { return json(res, { i: 0 }); }
  }
  // Bình luận thử từ máy chạy server: curl -X POST localhost:8795/chat -d '{"name":"An","text":"B"}'
  if (p === '/chat' && req.method === 'POST' && tuMayNay(req)) {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { const m = JSON.parse(body); onChat({ uid: `thu:${m.name}`, name: m.name }, m.text); } catch {}
      json(res, { ok: true, mo: !!phien });
    });
    return;
  }
  if (p === '/am') {
    const l = url.searchParams.get('l');
    const t = url.searchParams.get('t') || '';
    if (!choPhep.has(`${l}|${t}`)) return res.writeHead(404).end();
    try { return guiFile(res, await layFile(l, t), 'max-age=86400'); } catch { return res.writeHead(503).end(); }
  }
  // Font và hình Ninja dùng chung với game live
  if (/^\/(fonts|img)\/[\w.-]+$/.test(p)) return guiFile(res, path.join(ROOT, 'public', p), 'max-age=86400');
  if (/^\/[\w.-]+\.(js|css)$/.test(p)) return guiFile(res, path.join(PUB, p));
  res.writeHead(404).end();
});

// Mỗi lần bật server một mã khác: trang live thấy mã đổi (server vừa bật lại, có thể với code mới) thì tự tải lại trang.
// Nhờ vậy trang nằm trong LIVE Studio (nguồn Link, không bấm tải lại được) nhận code mới chỉ bằng cách bật lại server.
const PHIEN_SERVER = Date.now().toString(36);
// Nhật ký live: mọi bình luận (kèm kết quả chấm), câu hỏi, số người xem, người vào/theo dõi/chia sẻ/thả tim/quà → data/gia-su-stats/
const nhatKy = require('./nhat-ky').taoNhatKy({ sim: SIM, k: PHIEN_SERVER, tat: !TIKTOK_USER && !SIM });

// Trang live nói chuyện với server qua WebSocket: mở/chốt câu hỏi, nhận câu trả lời của người xem
const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.t === 'chao') {
      if (trang && trang !== ws) gui(trang, { t: 'thay' }); // trang cũ nhường quyền dẫn cho trang mới
      trang = ws;
      gui(ws, { t: 'phien', id: PHIEN_SERVER });
    }
    if (ws !== trang) return;
    if (m.t === 'mo') (m.kieu === 'dich' ? moPhienDich : moPhien)(m);
    if (m.t === 'dong') gui(ws, dongPhien() || { t: 'ket', dem: [], cam_on: null, sua: null });
    if (m.t === 'phan') {
      Object.assign(dangPhat, { bai: String(m.bai).slice(0, 80), phan: String(m.phan).slice(0, 20) });
      nhatKy.ghi('phan', { ...dangPhat, so: Number(m.so) || null, chuong: Number(m.chuong) || null });
    }
    if (m.t === 'vi_tri') { try { fs.mkdirSync(path.dirname(VI_TRI), { recursive: true }); fs.writeFileSync(VI_TRI, JSON.stringify({ i: m.i })); } catch {} }
  });
  ws.on('close', () => { if (ws === trang) { trang = null; phien = null; } });
});

server.listen(PORT, () => {
  tts.init();
  nhatKy.ghi('start', { sim: SIM ? 1 : 0 });
  const lan = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
  console.log(`🎓 Demo gia sư: http://localhost:${PORT}/${lan ? `  ·  điện thoại cùng Wi-Fi: http://${lan}:${PORT}/` : ''}`);
  console.log(`📺 Trang live: http://localhost:${PORT}/?live=1${SIM ? '  (người xem ảo đang bật)' : ''}`);
  const live = Object.values(ds).filter((b) => b.live).length;
  console.log(`📚 ${Object.keys(ds).length} bài (${live} bài live)`);
  if (TIKTOK_USER) noiTikTok(TIKTOK_USER);
});
