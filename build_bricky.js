#!/usr/bin/env node
// Dựng sẵn bộ đề cho khung 🧱 Bricky → data/bricky.json
//
//   node build_bricky.js            dựng lại toàn bộ, GHI ĐÈ file
//   node build_bricky.js --list     in thêm mọi "từ thêm" (từ hợp lệ ngoài bảng) để soát bằng mắt
//
// Mỗi đề = một bộ 4–5 chữ cái (lấy từ một từ 4–5 chữ của kho Migii) kèm:
//   board: 5–7 từ ĐỊNH SẴN lên bảng ô, đều là từ Migii có nghĩa tiếng Việt, luôn có từ dùng hết bộ chữ. Nguồn, theo thứ tự ưu tiên:
//          data/bank.json (kho bài học) rồi data/word-300.json, data/word-400.json (bộ từ của kênh dưới 450, cùng nguồn với khung Word).
//          Riêng bank.json không đủ: chỉ 18 bộ chữ ra được 5 từ trở lên.
//   extra: mọi từ tiếng Anh hợp lệ KHÁC ghép được từ bộ chữ (3 chữ cái trở lên), tra từ điển dict.js (Hunspell en_US, đã chặn từ tục).
// Khi live, người xem gõ từ nào thì chỉ tra hai danh sách này: có = hợp lệ (+1), không có = bình luận thường.
// Luật chọn đề (người dùng chốt 19/11/2026): bảng 5–7 từ (lúc đầu 3–6, cùng ngày người dùng tăng lên vì bảng 3 từ trông thưa); bộ chữ ra quá MAX_VALID từ hợp lệ thì bỏ (một người gõ hết sẽ lệch điểm so với khung khác).
const fs = require('fs');
const path = require('path');
const dict = require('./dict');

const MIN_BOARD = 5, MAX_BOARD = 7, MAX_VALID = 20;
// Bảng CUỐI mỗi lượt (người dùng 19/11/2026: "màn cuối khó hơn, nhiều từ hơn, thời gian x1,5, điểm x2"): bộ 6 chữ cái, đúng FINAL_BOARD từ lên bảng
// (8 từ = 4 hàng 2 cột, vừa chỗ bảng 7 từ thường), trần từ hợp lệ nới lên FINAL_MAX_VALID vì bộ 6 chữ ghép được nhiều từ hơn. Ghi vào `finals`.
const FINAL_LEN = 6, FINAL_BOARD = 8, FINAL_MAX_VALID = 30;
const OUT = path.join(__dirname, 'data', 'bricky.json');

// Người dùng chốt 19/11/2026: tính mọi từ tiếng Anh CÓ TRONG TỪ ĐIỂN, kể cả từ hiếm (awn, erg, tarn…). Hunspell còn nhận thêm những thứ
// không phải từ: chữ viết tắt (etc, hrs, amt), dạng cổ / phương ngữ (hast, nae), mảnh từ chỉ đi trong cụm (situ) → loại tay ở đây.
// Danh sách này soát bằng mắt từ mọi từ ngoài kho mà các bộ chữ (kể cả bộ 6 chữ của bảng cuối) ghép được (node build_bricky.js --list); kho đổi thì soát lại.
// Danh sách loại (BO = chữ viết tắt, dạng cổ, mảnh từ · THO = từ thô / nhạy cảm nhẹ) nằm ở dict.js, dùng chung với khung Săn từ.
const { BO, THO } = dict;

let exclude = new Set();
try { exclude = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'exclude.json'), 'utf8')).map((x) => x.w)); } catch {}
// kho từ có nghĩa: chỉ từ đơn a–z, 3–6 chữ (6 chữ chỉ dùng cho bảng cuối); `i` = thứ tự ưu tiên (bank.json trước theo thứ tự bài học, rồi word-300, word-400): số nhỏ = quen hơn
const bank = new Map();
const add = (word, m) => {
  const w = String(word || '').toLowerCase();
  if (/^[a-z]{3,6}$/.test(w) && m && !exclude.has(word) && !dict.BAD_IN_GRID.has(w) && !bank.has(w)) bank.set(w, { w, m, i: bank.size });
};
for (const x of JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'bank.json'), 'utf8'))) add(x.w, String(x.m || '').split(/[,;]/)[0].trim());
for (const n of [300, 400]) {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', `word-${n}.json`), 'utf8'));
  for (const x of d.words || d) add(x.w, String((x.vi || [])[0] || '').trim());
}

// mọi chuỗi 3..n chữ ghép được từ bộ chữ (mỗi chữ dùng tối đa số lần nó có trong bộ)
function arrangements(letters) {
  const out = new Set(), n = letters.length, used = Array(n).fill(false);
  (function rec(s) {
    if (s.length >= 3) out.add(s);
    if (s.length === n) return;
    const seen = new Set();
    for (let i = 0; i < n; i++) {
      if (used[i] || seen.has(letters[i])) continue;
      seen.add(letters[i]);
      used[i] = true;
      rec(s + letters[i]);
      used[i] = false;
    }
  })('');
  return [...out];
}

const isValid = (w) => bank.has(w) || (!BO.has(w) && !THO.has(w) && !dict.BAD_IN_GRID.has(w) && dict.isWord(w));
// Dựng đề cho các bộ chữ dài `lens`: bảng lấy minB..maxB từ có nghĩa, bỏ bộ ra hơn maxValid từ hợp lệ
function build(lens, minB, maxB, maxValid) {
  const out = [], seenKey = new Set(), skipped = { it: 0, nhieu: 0 };
  for (const base of [...bank.values()].filter((x) => lens.includes(x.w.length))) {
    const key = [...base.w].sort().join('');
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    const valid = arrangements([...base.w]).filter(isValid);
    const inBank = valid.filter((w) => bank.has(w)).map((w) => bank.get(w));
    if (inBank.length < minB) { skipped.it++; continue; }
    if (valid.length > maxValid) { skipped.nhieu++; continue; }
    // lên bảng: các từ dùng hết bộ chữ trước (tối đa 2), rồi tới các từ quen nhất theo thứ tự trong kho
    const full = inBank.filter((x) => x.w.length === base.w.length).sort((a, b) => a.i - b.i).slice(0, 2);
    const rest = inBank.filter((x) => !full.includes(x)).sort((a, b) => a.i - b.i).slice(0, maxB - full.length);
    const board = [...full, ...rest].sort((a, b) => a.w.length - b.w.length || a.i - b.i).map(({ w, m }) => ({ w, m }));
    const onBoard = new Set(board.map((x) => x.w));
    out.push({ letters: base.w, board, extra: valid.filter((w) => !onBoard.has(w)).sort() });
  }
  return { out, skipped };
}
const { out: sets, skipped } = build([4, 5], MIN_BOARD, MAX_BOARD, MAX_VALID);
const { out: finals, skipped: skippedF } = build([FINAL_LEN], FINAL_BOARD, FINAL_BOARD, FINAL_MAX_VALID);

const note = 'Bộ đề khung Bricky, sinh bằng build_bricky.js từ data/bank.json + data/word-300.json + data/word-400.json (từ lên bảng) và từ điển dict.js (từ thêm). File sinh ra, build lại sẽ ghi đè. ' +
  'Muốn bỏ một từ thêm: ghi vào BO trong build_bricky.js rồi chạy lại.';
fs.writeFileSync(OUT, JSON.stringify({ note, sets, finals }, null, 0).replace(/\{"letters"/g, '\n{"letters"').replace(/\]\}$/, '\n]}') + '\n');

const nb = sets.map((s) => s.board.length), nv = sets.map((s) => s.board.length + s.extra.length);
const dem = (a) => Object.entries(a.reduce((o, n) => ((o[n] = (o[n] || 0) + 1), o), {})).map(([k, v]) => `${k} từ: ${v}`).join(' · ');
console.log(`🧱 ${sets.length} đề → ${path.relative(__dirname, OUT)} (bỏ ${skipped.it} bộ chữ không đủ ${MIN_BOARD} từ trong kho, ${skipped.nhieu} bộ ra hơn ${MAX_VALID} từ hợp lệ)`);
console.log(`   bộ 4 chữ: ${sets.filter((s) => s.letters.length === 4).length} · bộ 5 chữ: ${sets.filter((s) => s.letters.length === 5).length}`);
console.log(`   số từ trên bảng — ${dem(nb)}`);
console.log(`   tổng từ hợp lệ mỗi đề: ít nhất ${Math.min(...nv)}, nhiều nhất ${Math.max(...nv)}`);
console.log(`🔥 ${finals.length} đề bảng cuối (bộ ${FINAL_LEN} chữ, ${FINAL_BOARD} từ trên bảng; bỏ ${skippedF.it} bộ không đủ ${FINAL_BOARD} từ có nghĩa, ${skippedF.nhieu} bộ ra hơn ${FINAL_MAX_VALID} từ hợp lệ) · ` +
  `tổng từ hợp lệ: ${Math.min(...finals.map((s) => s.board.length + s.extra.length))}–${Math.max(...finals.map((s) => s.board.length + s.extra.length))}`);
if (args('list')) {
  const all = new Set([...sets, ...finals].flatMap((s) => s.extra));
  console.log(`\nTừ thêm (${all.size}):\n${[...all].sort().join(' ')}`);
}
function args(n) { return process.argv.includes('--' + n); }
