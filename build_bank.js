// Tạo kho câu đố data/bank.json từ gói từ vựng của app Migii TOEIC (gói SQLite mà app tải về khi mở phần Lý thuyết).
// Chạy: node build_bank.js            (chạy lại khi muốn cập nhật kho)
//       node build_bank.js path/vi.db  (dùng file SQLite có sẵn, không tải)
// Cần lệnh hệ thống: curl, unzip, sqlite3 (macOS có sẵn).
//
// Chỉ dùng TỪ VỰNG (dữ liệu của Migii). KHÔNG dùng ngân hàng câu hỏi đề thi: bộ đó đang có vấn đề bản quyền
// (migii_toeic_docs/05-yeu-cau-thay-doi/yc-004). Xem CAN-CUNG-CAP.md.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PACK_URL = process.env.VOCAB_PACK_URL || 'https://migiitoeic.eupgroup.net/uploads/theory/vi/vi.zip';
const TMP = path.join(__dirname, 'data', 'tmp');
const LESSON_SIZE = 20; // app chia mỗi bài 20 từ theo thứ tự id trong từng mức

function getDb() {
  if (process.argv[2]) return process.argv[2];
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  const zip = path.join(TMP, 'pack.zip');
  console.log(`Tải ${PACK_URL}`);
  execFileSync('curl', ['-sSfL', '-o', zip, PACK_URL]);
  execFileSync('unzip', ['-o', '-q', zip, '-d', TMP]);
  const db = fs.readdirSync(TMP).find((f) => f.endsWith('.db'));
  if (!db) throw new Error('Gói từ vựng không có file .db');
  return path.join(TMP, db);
}

const sql = (db, q) => JSON.parse(execFileSync('sqlite3', ['-readonly', '-json', db, q], { maxBuffer: 1 << 28, encoding: 'utf8' }) || '[]');

// "Công ty (n)" → { m: "Công ty", pos: "n" }. Ngoặc không phải từ loại ("tập (thể dục)") thì giữ nguyên.
const POS = /^(n|v|adj|adv|pre|prep|conj|pron|ving|hđt|liên từ|đại từ|cụm v|linking v|trợ động từ|hạn định từ|thành ngữ|adj-er|[a-z]+\s*[\/-]\s*[a-z]+)$/i;
function splitMean(s) {
  const t = String(s || '').trim().replace(/\s+/g, ' ');
  const mm = t.match(/^(.*?)\s*\(([^()]{1,12})\)\s*$/);
  return mm && POS.test(mm[2].trim()) ? { m: mm[1].trim(), pos: mm[2].trim().toLowerCase() } : { m: t, pos: '' };
}
const fold = (s) => String(s || '').toLowerCase().normalize('NFC');

// id các câu ví dụ gắn với từ (trong cột means dạng JSON)
function exampleIds(means) {
  try {
    return JSON.parse(means || '[]').flatMap((k) => (k.means || []).flatMap((x) => x.examples || []));
  } catch {
    return [];
  }
}

const db = getDb();
const words = sql(db, 'SELECT id, word, pronounce, level, descript_level, short_mean, means FROM words ORDER BY level, id');
const ids = [...new Set(words.flatMap((w) => exampleIds(w.means).slice(0, 12)))].filter(Number.isInteger);
const examples = new Map();
for (let i = 0; i < ids.length; i += 500) {
  for (const e of sql(db, `SELECT id, e, m FROM examples WHERE id IN (${ids.slice(i, i + 500).join(',')})`)) examples.set(e.id, e);
}

const seen = new Map();
const idxInLevel = new Map();
let skipped = 0;
for (const x of words) {
  const level = String(x.level);
  const i = idxInLevel.get(level) || 0;
  idxInLevel.set(level, i + 1);
  const w = String(x.word || '').trim();
  const { m, pos } = splitMean(x.short_mean);
  // Chỉ từ/cụm chữ Latin gọn (bỏ "Mr.", số, ký hiệu); nghĩa ngắn, rõ (bỏ nghĩa kiểu "thêm / nhiều hơn")
  if (!/^[A-Za-z][A-Za-z' -]{0,18}[A-Za-z]$/.test(w) || !m || m.length > 26 || /[\/;()]/.test(m) || seen.has(w.toLowerCase())) {
    skipped++;
    continue;
  }
  // Câu ví dụ hiện ở Giờ học: chứa đúng từ đó, bản dịch có đúng nghĩa đang dạy (tránh ví dụ của nghĩa khác), đủ ngắn
  const re = new RegExp(`\\b${w.replace(/[-' ]/g, '.')}`, 'i');
  const ex = exampleIds(x.means).map((id) => examples.get(id))
    .find((e) => e && e.e && e.e.length <= 70 && re.test(e.e) && fold(e.m).includes(fold(m)));
  seen.set(w.toLowerCase(), {
    w,
    r: String(x.pronounce || '').split(',')[0].trim(),
    m: m.charAt(0).toLowerCase() + m.slice(1),
    pos,
    cid: level,
    course: x.descript_level || `Mức ${level}`,
    lesson: `Bài ${Math.floor(i / LESSON_SIZE) + 1}`,
    ...(ex && { ex: ex.e.trim(), exm: String(ex.m || '').trim() }),
  });
}

// Chỉnh sửa tay: data/chinh-sua-tu.json. Áp SAU khi đọc gói của app, nên chạy lại build không mất phần đã sửa.
//   "bo":   ["từ", …]                              bỏ khỏi kho
//   "sua":  { "từ": { "m": "nghĩa mới", … } }      ghi đè từng trường; giá trị null = xoá trường đó (vd "ex": null)
//   "them": [{ "w": "invoice", "m": "hoá đơn", "r": "ˈɪnvɔɪs", "pos": "n", "cid": "2" }, …]   thêm từ app chưa có
// Khoá bắt đầu bằng "_" (vd "_huong_dan") bị bỏ qua.
const EDITS = path.join(__dirname, 'data', 'chinh-sua-tu.json');
const edits = fs.existsSync(EDITS) ? JSON.parse(fs.readFileSync(EDITS, 'utf8')) : {};
const courseOf = new Map([...seen.values()].map((x) => [x.cid, x.course]));
const notes = [];
let nBo = 0, nSua = 0, nThem = 0;
for (const w of edits.bo || []) {
  if (seen.delete(String(w).toLowerCase())) nBo++;
  else notes.push(`bo: không có từ "${w}" trong kho`);
}
for (const [w, patch] of Object.entries(edits.sua || {})) {
  if (w.startsWith('_')) continue;
  const x = seen.get(w.toLowerCase());
  if (!x) { notes.push(`sua: không có từ "${w}" trong kho`); continue; }
  for (const [k, v] of Object.entries(patch)) v === null ? delete x[k] : (x[k] = v);
  nSua++;
}
for (const x of edits.them || []) {
  if (!x?.w || !x?.m) { notes.push(`them: thiếu "w" hoặc "m" ở ${JSON.stringify(x)}`); continue; }
  const key = x.w.toLowerCase();
  const old = seen.get(key);
  // Đã có thì GỘP vào mục cũ (giữ câu ví dụ, bài…), không thay cả mục
  if (old) notes.push(`them: "${x.w}" đã có trong kho, gộp vào mục cũ (lần sau nên dùng "sua")`);
  if (!/^[A-Za-z][A-Za-z' .-]*$/.test(x.w)) notes.push(`them: "${x.w}" có ký tự lạ, sẽ không lấy được phát âm của Migii`);
  const cid = String(x.cid || old?.cid || '1');
  const base = old || { w: x.w, r: '', m: '', pos: '', lesson: 'Bổ sung' };
  seen.set(key, { ...base, ...x, cid, course: courseOf.get(cid) || base.course || `Mức ${cid}` });
  nThem++;
}

// Mỗi từ một dòng: sửa tay / xem thay đổi trên git cho dễ
const out = path.join(__dirname, 'data', 'bank.json');
fs.writeFileSync(out, `[\n${[...seen.values()].map((x) => JSON.stringify(x)).join(',\n')}\n]\n`);
if (!process.argv[2]) fs.rmSync(TMP, { recursive: true, force: true });
if (fs.existsSync(EDITS)) console.log(`Chỉnh sửa tay: bỏ ${nBo}, sửa ${nSua}, thêm ${nThem}`);
for (const n of notes) console.warn(`  ! ${n}`);
const byLevel = {};
for (const x of seen.values()) byLevel[`${x.cid} ${x.course}`] = (byLevel[`${x.cid} ${x.course}`] || 0) + 1;
console.log(`=> ${seen.size} từ (bỏ ${skipped} dòng) → ${out}`);
console.log(byLevel);
