#!/usr/bin/env node
// Sinh câu hỏi cho game Word từ danh sách từ trong data/word-<mốc>.json (mốc 300, 400…).
//
// Nguồn từ: bảng `vocab` (cột moc_diem) của migii_toeic_svc. Danh sách đã được lấy về một lần và chế biến
// (nghĩa tiếng Việt, đồng nghĩa, trái nghĩa) nên file JSON là nguồn gốc: sửa `words` rồi chạy lại script
// này để sinh lại `questions`. Đừng sửa `questions` bằng tay, lần chạy sau sẽ ghi đè.
//
//   node build_word.js [mốc]            sinh lại câu hỏi, ghi vào data/word-<mốc>.json (mặc định 300)
//   node build_word.js 400 --sample 8   in thử vài câu mỗi loại để xem
//
// Bốn loại câu (người xem gõ A/B/C/D):
//   w2m  cho từ tiếng Anh, chọn nghĩa tiếng Việt     q = từ, a = nghĩa đúng
//   m2w  cho nghĩa tiếng Việt, chọn từ tiếng Anh     q = nghĩa, a = từ đúng
//   syn  tìm từ đồng nghĩa                           q = từ, a = một từ đồng nghĩa
//   ant  tìm từ trái nghĩa                           q = từ, a = một từ trái nghĩa
// Mỗi câu có `d` = 3 đáp án sai. Game trộn thứ tự 4 đáp án khi hiện.
//
// Đáp án sai được chọn để KHÔNG vô tình đúng: loại từ có nghĩa tiếng Việt trùng/gần với từ đang hỏi, loại mọi từ nằm trong
// danh sách đồng nghĩa/trái nghĩa của nhau. Câu đồng nghĩa luôn có 1 đáp án nhiễu là từ trái nghĩa (nếu có), và ngược lại,
// vì đó là cái bẫy quen thuộc của đề thi.
const fs = require('fs');
const path = require('path');

const MOC = process.argv.find((a) => /^\d{3}$/.test(a)) || '300';
const FILE = path.join(__dirname, 'data', `word-${MOC}.json`);
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const words = data.words;
// Từ người chơi mốc này chắc chắn biết: mọi từ của mốc này và các mốc thấp hơn (data/word-<mốc>.json), kể cả từ chức năng đã loại
const inList = new Set();
for (const f of fs.readdirSync(path.join(__dirname, 'data'))) {
  const m = /^word-(\d{3})\.json$/.exec(f);
  if (!m || Number(m[1]) > Number(MOC)) continue;
  const d = Number(m[1]) === Number(MOC) ? data : JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8'));
  for (const x of [...d.words.map((y) => y.w), ...(d.loai || [])]) inList.add(x);
}

// ---------- số ngẫu nhiên có hạt giống: cùng dữ liệu thì ra cùng câu hỏi ----------
function hash(s) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const shuffle = (arr, r) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- nghĩa tiếng Việt ----------
const display = (x) => x.vi.slice(0, 2).join(', ');
const STOP = new Set(['của', 'và', 'ở', 'là', 'được', 'một', 'các', 'những', 'cho', 'số']);
// Các "mảnh" của nghĩa (bỏ phần trong ngoặc): hai từ có chung mảnh thì coi là gần nghĩa, không đặt cạnh nhau làm đáp án nhiễu.
const tokens = (x) => {
  const t = new Set();
  for (const m of x.vi) for (const tok of m.toLowerCase().replace(/\(.*?\)/g, ' ').split(/\s+/)) if (tok && !STOP.has(tok)) t.add(tok);
  return t;
};
const TOK = new Map(words.map((x) => [x.w, tokens(x)]));
const viConflict = (a, b) => {
  const ta = TOK.get(a.w), tb = TOK.get(b.w);
  for (const t of ta) if (tb.has(t)) return true;
  return false;
};
const byW = new Map(words.map((x) => [x.w, x]));
const syn = (x) => x.syn || [];
const ant = (x) => x.ant || [];
const related = (a, b) => syn(a).includes(b.w) || syn(b).includes(a.w) || ant(a).includes(b.w) || ant(b).includes(a.w);

// chọn đáp án đúng ưu tiên từ nằm trong danh sách mốc 300 (người xem 300+ biết chắc những từ này)
const pickAnswer = (list, r) => {
  const inl = list.filter((w) => inList.has(w));
  const pool = inl.length ? inl : list;
  return pool[Math.floor(r() * pool.length)];
};

// lấy n từ làm đáp án nhiễu: ưu tiên cùng từ loại, đủ điều kiện `ok`, không trùng nhau
function pickWrong(target, ok, n, r, pre = [], labelOf = (c) => c.w, mutual = false) {
  const out = [...pre];
  const chosen = []; // các từ đã chọn làm nhiễu: với w2m/m2w không cho hai đáp án nhiễu gần nghĩa nhau (vd hai đáp án cùng là "hoàn toàn")
  const taken = new Set(out.map((s) => s.toLowerCase()));
  const cand = words.filter((c) => c.w !== target.w && ok(c));
  const same = shuffle(cand.filter((c) => c.pos === target.pos), r);
  const other = shuffle(cand.filter((c) => c.pos !== target.pos), r);
  for (const c of [...same, ...other]) {
    if (out.length >= n) break;
    const label = labelOf(c);
    if (taken.has(label.toLowerCase())) continue;
    if (mutual && chosen.some((o) => viConflict(o, c))) continue;
    taken.add(label.toLowerCase());
    chosen.push(c);
    out.push(label);
  }
  return out;
}

const questions = [];
const problems = [];

for (const x of words) {
  const r = rng(hash(x.w));

  // 1) cho từ, chọn nghĩa
  {
    const d = pickWrong(x, (c) => !viConflict(x, c) && !related(x, c), 3, r, [], display, true);
    questions.push({ t: 'w2m', w: x.w, q: x.w, a: display(x), d });
  }

  // 2) cho nghĩa, chọn từ
  {
    const d = pickWrong(x, (c) => !viConflict(x, c) && !related(x, c), 3, r, [], undefined, true);
    questions.push({ t: 'm2w', w: x.w, q: display(x), a: x.w, d });
  }

  // 3) đồng nghĩa
  if (syn(x).length) {
    const a = pickAnswer(syn(x), r);
    const pre = [];
    const trap = ant(x).length ? pickAnswer(ant(x), r) : null; // bẫy: từ trái nghĩa
    if (trap) pre.push(trap);
    const ansW = byW.get(a);
    const d = pickWrong(
      x,
      (c) => !viConflict(x, c) && !related(x, c) && c.w !== a && !(ansW && (viConflict(ansW, c) || related(ansW, c))) && !syn(c).includes(a),
      3,
      r,
      pre
    );
    questions.push({ t: 'syn', w: x.w, q: x.w, a, d });
  }

  // 4) trái nghĩa
  if (ant(x).length) {
    const a = pickAnswer(ant(x), r);
    const pre = [];
    const trap = syn(x).length ? pickAnswer(syn(x), r) : null; // bẫy: từ đồng nghĩa
    if (trap) pre.push(trap);
    const ansW = byW.get(a);
    const d = pickWrong(
      x,
      (c) => !related(x, c) && c.w !== a && !ant(x).includes(c.w) && !ant(c).includes(x.w) && !syn(c).includes(a) && !(ansW && (viConflict(ansW, c) || related(ansW, c))),
      3,
      r,
      pre
    );
    questions.push({ t: 'ant', w: x.w, q: x.w, a, d });
  }
}

// ---------- kiểm tra ----------
for (const x of words) {
  if (!x.vi?.length) problems.push(`${x.w}: thiếu nghĩa tiếng Việt`);
  for (const s of [...syn(x), ...ant(x)]) if (s === x.w) problems.push(`${x.w}: tự đồng nghĩa/trái nghĩa với chính nó`);
  for (const s of syn(x)) if (ant(x).includes(s)) problems.push(`${x.w}: "${s}" vừa đồng nghĩa vừa trái nghĩa`);
}
for (const q of questions) {
  const all = [q.a, ...q.d];
  const where = `${q.t} ${q.w}`;
  if (q.d.length !== 3) problems.push(`${where}: chỉ có ${q.d.length} đáp án nhiễu`);
  if (new Set(all.map((s) => s.toLowerCase())).size !== all.length) problems.push(`${where}: đáp án trùng nhau (${all.join(' | ')})`);
  if (q.t !== 'w2m' && q.t !== 'm2w' && all.map((s) => s.toLowerCase()).includes(q.q.toLowerCase())) problems.push(`${where}: đáp án trùng với đề`);
}

const count = (t) => questions.filter((q) => q.t === t).length;
console.log(`Từ: ${words.length} (loại ${data.loai?.length || 0} từ chức năng)`);
console.log(`Câu hỏi: ${questions.length} = w2m ${count('w2m')} + m2w ${count('m2w')} + syn ${count('syn')} + ant ${count('ant')}`);
const outList = (t) => questions.filter((q) => q.t === t && !inList.has(q.a)).length;
console.log(`Đáp án đồng nghĩa nằm ngoài danh sách từ đã học (mốc này và thấp hơn): ${outList('syn')}/${count('syn')} · trái nghĩa: ${outList('ant')}/${count('ant')}`);

const si = process.argv.indexOf('--sample');
if (si > 0) {
  const n = Number(process.argv[si + 1]) || 6;
  for (const t of ['w2m', 'm2w', 'syn', 'ant']) {
    console.log(`\n--- ${t} ---`);
    const r = rng(hash('mau' + t));
    for (const q of shuffle(questions.filter((q) => q.t === t), r).slice(0, n)) console.log(`${q.q}  →  ${q.a}   (sai: ${q.d.join(' · ')})`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} vấn đề:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

// ---------- ghi file: mỗi từ/câu một dòng cho dễ xem thay đổi trên git ----------
const line = (o) => '    ' + JSON.stringify(o);
const out =
  '{\n' +
  `  "moc": ${data.moc},\n` +
  `  "nguon": ${JSON.stringify(data.nguon)},\n` +
  `  "loai": ${JSON.stringify(data.loai || [])},\n` +
  '  "words": [\n' + words.map(line).join(',\n') + '\n  ],\n' +
  '  "questions": [\n' + questions.map(line).join(',\n') + '\n  ]\n' +
  '}\n';
fs.writeFileSync(FILE, out);
console.log(`\nĐã ghi ${path.relative(__dirname, FILE)}`);
