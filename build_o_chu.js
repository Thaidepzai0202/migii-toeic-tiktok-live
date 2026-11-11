#!/usr/bin/env node
// Dựng sẵn các ô chữ cho khung 🔠 Giải ô chữ (mốc 600+) → data/o-chu-600.json
//
//   node build_o_chu.js                  dựng 24 ô chữ mới, GHI ĐÈ file
//   node build_o_chu.js --count 10 --append   dựng thêm 10 ô chữ (bỏ từ khoá đã có)
//   node build_o_chu.js --seed 7         đổi hạt giống ngẫu nhiên
//
// Mỗi ô chữ = 1 từ khoá tiếng Anh (5–9 chữ cái) đọc theo cột dọc; mỗi chữ cái của nó nằm trong 1 hàng ngang, mà hàng ngang
// là 1 từ tiếng Anh của bộ từ mốc 600 (có nghĩa tiếng Việt làm đề). Người xem giải từng hàng (chữ thường), hơn nửa số hàng thì mới
// được đoán từ khoá (CHỮ HOA).
//
// Ràng buộc để mỗi hàng chỉ có 1 đáp án hợp lý:
//  - các hàng không là đồng nghĩa/trái nghĩa của nhau, không chung nghĩa tiếng Việt, không chung gốc từ (buy / buyer);
//  - `acc` của một hàng (đồng nghĩa cùng số chữ cái, do ta khai trong dữ liệu) không trùng đáp án của hàng khác;
//  - cả bảng rộng tối đa 13 cột để vừa khung 1080 px.
const fs = require('fs');
const path = require('path');
const dict = require('./dict');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1] === undefined || args[i + 1].startsWith('--') ? true : args[i + 1]; };
const COUNT = Number(opt('count', 24)), APPEND = !!opt('append', false), SEED = Number(opt('seed', 600));
const OUT = path.join(__dirname, 'data', 'o-chu-600.json');
const MAXW = 12, MIN_ROW = 5, MAX_ROW = 10, MAX_VI = 42;
// số ô chữ theo độ dài từ khoá (5–9 hàng), lặp lại cho tới đủ COUNT
const LENS = [7, 6, 8, 5, 9, 7, 6, 8, 7, 9, 5, 6];

let seed = SEED >>> 0;
const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const load = (moc) => JSON.parse(fs.readFileSync(path.join(__dirname, 'data', `word-${moc}.json`), 'utf8')).words;
const prep = (x, moc) => ({ w: x.w, vi: (x.vi || []).filter((v) => v.length <= MAX_VI && !v.toLowerCase().includes(x.w)), syn: x.syn || [], ant: x.ant || [], moc });
const ok = (x) => /^[a-z]+$/.test(x.w) && x.vi.length && dict.isWord(x.w) && !dict.isOffensive(x.w);
const W600 = load(600).map((x) => prep(x, 600)).filter(ok);
const W500 = load(500).map((x) => prep(x, 500)).filter(ok);
const have = new Set(W600.map((x) => x.w));
const POOL = [...W600, ...W500.filter((x) => !have.has(x.w))];
const byW = new Map(POOL.map((x) => [x.w, x]));

// từ khoá: 5–9 chữ cái, ưu tiên mốc 600 rồi 500; mỗi từ khoá 1 ô chữ
// từ khoá hiện lớn trên màn hình nên tránh đề tài nhạy cảm (chính trị, nhập cư, tai tiếng, vũ khí, chất kích thích)
const KEY_BLOCK = /immigra|scandal|sanction|senat|treaty|elect|tobacco|weapon|bomb|alcohol|drug|crime|prison|victim|violen|cancer|disease|divorce|racial|funeral|swear|horror/;
const keyOk = (x) => x.w.length >= 5 && x.w.length <= 9 && !KEY_BLOCK.test(x.w);
const used = new Map(); // số lần một từ đã làm hàng (để dàn đều các từ)
const prevKeys = new Set();
let puzzles = [];
if (APPEND && fs.existsSync(OUT)) { puzzles = JSON.parse(fs.readFileSync(OUT, 'utf8')).puzzles; for (const p of puzzles) { prevKeys.add(p.key); for (const r of p.rows) used.set(r.w, (used.get(r.w) || 0) + 1); } }

const stem = (w) => w.slice(0, 5);
const clash = (a, b) => a.w === b.w || stem(a.w) === stem(b.w) || a.syn.includes(b.w) || b.syn.includes(a.w) || a.ant.includes(b.w) || b.ant.includes(a.w)
  || a.vi.some((v) => b.vi.some((u) => v.includes(u) || u.includes(v))) || a.syn.some((s) => b.syn.includes(s));
const acc = (x) => x.syn.filter((s) => s.length === x.w.length && /^[a-z]+$/.test(s));

function build(key) {
  const rows = [];
  let left = 0, right = 0;
  // chữ khó (q, z, x, j, k, v...) làm trước vì ít từ chứa chúng
  const order = shuffle([...key].map((c, i) => i)).sort((i, j) => (POOL.filter((x) => x.w.includes(key[i])).length) - (POOL.filter((x) => x.w.includes(key[j])).length));
  const pick = {};
  for (const i of order) {
    const c = key[i];
    const cands = [];
    for (const x of POOL) {
      if (x.w === key || x.w.startsWith(key.slice(0, 5)) || key.startsWith(stem(x.w))) continue;
      if (x.w.length < MIN_ROW || x.w.length > MAX_ROW) continue;
      if (Object.values(pick).some((r) => clash(r.x, x))) continue;
      for (let p = 0; p < x.w.length; p++) {
        if (x.w[p] !== c) continue;
        const L = Math.max(left, p), R = Math.max(right, x.w.length - p - 1);
        if (L + R + 1 > MAXW) continue;
        // ưu tiên từ mốc 600, từ chưa dùng, chữ cái khoá ở giữa hoặc lệch (đa dạng nhưng không làm bảng rộng ra quá)
        const widen = (L - left) + (R - right);
        cands.push({ x, p, score: (x.moc === 600 ? 0 : 4) + (used.get(x.w) || 0) * 1.5 - Math.min(x.w.length, 8) * 0.35 + widen * 0.12 + rnd() * 2.5 });
      }
    }
    if (!cands.length) return null;
    cands.sort((a, b) => a.score - b.score);
    const best = cands[0];
    pick[i] = best;
    left = Math.max(left, best.p); right = Math.max(right, best.x.w.length - best.p - 1);
  }
  // từ khoá và đồng nghĩa của hàng không được trùng đáp án hàng khác
  const rs = [...key].map((_, i) => pick[i]);
  for (const r of rs) for (const o of rs) if (r !== o && acc(r.x).includes(o.x.w)) return null;
  for (const r of rs) { used.set(r.x.w, (used.get(r.x.w) || 0) + 1); rows.push({ w: r.x.w, pos: r.p, vi: r.x.vi[0], ...(acc(r.x).length ? { acc: acc(r.x) } : {}) }); }
  return rows;
}

const keys = POOL.filter(keyOk).filter((x) => !x.vi.some((v) => /\(/.test(v))).map((x) => x.w);
const keyPool = shuffle([...new Set([...W600.filter(keyOk).map((x) => x.w), ...keys])]).filter((k) => !prevKeys.has(k));
// khoá lấy từ mốc 600 trước (shuffle riêng từng nhóm)
const k600 = shuffle(W600.filter(keyOk).map((x) => x.w)).filter((k) => !prevKeys.has(k)), k500 = shuffle(keys).filter((k) => !have.has(k) && !prevKeys.has(k));
const keyQueue = [...k600, ...k500];

let made = 0, tries = 0;
const target = puzzles.length + COUNT;
while (puzzles.length < target && tries < 4000) {
  const len = LENS[(puzzles.length) % LENS.length];
  const idx = keyQueue.findIndex((k) => k.length === len && !prevKeys.has(k));
  if (idx < 0) { console.log(`hết từ khoá ${len} chữ cái`); break; }
  const key = keyQueue.splice(idx, 1)[0];
  tries++;
  const rows = build(key);
  if (!rows) continue;
  const kx = byW.get(key);
  puzzles.push({ key, keyVi: kx.vi[0].replace(/\s*\(.*\)\s*$/, ''), rows }); // gợi ý từ khoá: bỏ phần chú thích trong ngoặc
  prevKeys.add(key); made++;
}
fs.writeFileSync(OUT, JSON.stringify({ moc: 600, puzzles }, null, 1));
const cnt = {}; for (const p of puzzles) cnt[p.key.length] = (cnt[p.key.length] || 0) + 1;
console.log(`Đã dựng ${made} ô chữ mới, tổng ${puzzles.length} → ${path.relative(__dirname, OUT)} · theo độ dài từ khoá:`, cnt);
const wide = puzzles.map((p) => Math.max(...p.rows.map((r) => r.pos)) + Math.max(...p.rows.map((r) => r.w.length - r.pos - 1)) + 1);
console.log(`bảng rộng tối đa ${Math.max(...wide)} cột · số từ khác nhau làm hàng: ${new Set(puzzles.flatMap((p) => p.rows.map((r) => r.w))).size}`);
