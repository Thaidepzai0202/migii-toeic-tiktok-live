#!/usr/bin/env node
// Dựng sẵn các ma trận 10×10 cho khung 🔎 Săn từ → data/san-tu-400.json
//
//   node build_san_tu.js                     dựng 20 bảng mới, GHI ĐÈ file
//   node build_san_tu.js --count 10 --append dựng thêm 10 bảng vào file đã có (bỏ bảng trùng)
//   node build_san_tu.js --from <json>       nguồn từ giấu (mặc định data/word-400.json; nhận {words:[{w}]} hoặc [{w}])
//
// Mỗi bảng: 10 từ giấu (4–8 chữ cái, lấy từ bộ từ của mốc) đặt theo 8 hướng (ngang, dọc, chéo, cả chiều ngược), các ô còn lại điền
// chữ ngẫu nhiên theo tần suất tiếng Anh. Rồi QUÉT KỸ toàn bảng: mọi chuỗi liền nhau từ 4 chữ cái trở lên theo cả 8 hướng mà là từ thật
// trong từ điển (dict.js) đều được ghi vào danh sách của bảng đó. Khi live, người xem gõ từ nào thì chỉ cần tra danh sách này:
// từ có trong danh sách = hợp lệ (kể cả từ thật vô tình nằm trong bảng), không có trong danh sách = không tính.
// Bảng bị loại (và điền lại) nếu có từ tục tĩu mọc ra trong bảng (trừ khi nó nằm trọn trong một từ hợp lệ dài hơn, vd "ass" trong "class")
// hoặc có quá nhiều từ vô tình.
const fs = require('fs');
const path = require('path');
const dict = require('./dict');

const N = 10, HIDDEN = 10, MIN_LEN = 4, MAX_LEN = 8, MAX_ACCIDENTAL = 14;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]]; // phải · xuống · chéo xuống-phải · chéo xuống-trái · và 4 chiều ngược
const FREQ = 'eeeeeeeeeeeeettttttttaaaaaaaooooooiiiiiiinnnnnnnsssssshhhhhrrrrrrdddlllcccuuummmwwffggyyppbbvkjxqz';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : args[i + 1] === undefined || args[i + 1].startsWith('--') ? true : args[i + 1]; };
const COUNT = Number(opt('count', 20));
const APPEND = !!opt('append', false);
const SRC = path.resolve(String(opt('from', path.join(__dirname, 'data', 'word-400.json'))));
const OUT = path.join(__dirname, 'data', 'san-tu-400.json');

const rnd = (n) => Math.floor(Math.random() * n);
const letter = () => FREQ[rnd(FREQ.length)];
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = rnd(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// ---------- nguồn từ giấu ----------
let src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
src = Array.isArray(src) ? src : src.words;
const pool = [...new Set(src.map((x) => String(x.w).toLowerCase()))].filter((w) => /^[a-z]+$/.test(w) && w.length >= MIN_LEN && w.length <= MAX_LEN && dict.isWord(w));
if (pool.length < 100) throw new Error(`Chỉ có ${pool.length} từ dùng được làm từ giấu`);

// ---------- quét ma trận ----------
const inside = (r, c) => r >= 0 && r < N && c >= 0 && c < N;
function run(g, r, c, d) { // chuỗi từ (r,c) đi theo hướng d tới hết bảng
  let s = ''; const [dr, dc] = DIRS[d];
  for (let rr = r, cc = c; inside(rr, cc); rr += dr, cc += dc) s += g[rr][cc];
  return s;
}
function scan(g) {
  const words = new Map(); // từ → [r, c, d] (lần xuất hiện đầu tiên)
  let bad = false;
  for (let r = 0; r < N && !bad; r++) for (let c = 0; c < N && !bad; c++) for (let d = 0; d < 8; d++) {
    const L = run(g, r, c, d);
    for (let k = 3; k <= L.length; k++) {
      const sub = L.slice(0, k);
      if (k >= MIN_LEN && !words.has(sub) && dict.isWord(sub)) words.set(sub, [r, c, d]);
      if (dict.BAD_IN_GRID.has(sub) && !coveredByLongerWord(g, r, c, d, k)) { bad = true; break; }
    }
  }
  return { words, bad };
}
// từ nhạy cảm dài k bắt đầu tại (r,c) hướng d có nằm trọn trong một từ hợp lệ dài hơn trên cùng đường thẳng không? (vd "ass" trong "class")
function coveredByLongerWord(g, r, c, d, k) {
  const [dr, dc] = DIRS[d];
  let pre = '';
  for (let rr = r - dr, cc = c - dc; inside(rr, cc); rr -= dr, cc -= dc) pre = g[rr][cc] + pre;
  const full = pre + run(g, r, c, d), off = pre.length;
  for (let a = 0; a <= off; a++) for (let b = off + k; b <= Math.min(full.length, a + 12); b++) {
    if (b - a > k && dict.isWord(full.slice(a, b))) return true;
  }
  return false;
}

// ---------- dựng một bảng ----------
function makeBoard() {
  for (let attempt = 0; attempt < 300; attempt++) {
    const g = Array.from({ length: N }, () => Array(N).fill(''));
    const placed = [];
    for (const w of shuffle(pool)) {
      if (placed.length >= HIDDEN) break;
      if (placed.some((p) => p.w.includes(w) || w.includes(p.w))) continue;
      for (let t = 0; t < 150; t++) {
        const d = rnd(8), [dr, dc] = DIRS[d], r = rnd(N), c = rnd(N);
        if (!inside(r + dr * (w.length - 1), c + dc * (w.length - 1))) continue;
        let ok = true;
        for (let i = 0; i < w.length && ok; i++) { const cell = g[r + dr * i][c + dc * i]; if (cell && cell !== w[i]) ok = false; }
        if (!ok) continue;
        for (let i = 0; i < w.length; i++) g[r + dr * i][c + dc * i] = w[i];
        placed.push({ w, r, c, d });
        break;
      }
    }
    if (placed.length < HIDDEN) continue;
    const fixed = g.map((row) => row.map((x) => !!x));
    for (let fill = 0; fill < 60; fill++) {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!fixed[r][c]) g[r][c] = letter();
      const { words, bad } = scan(g);
      if (bad) continue;
      const hidden = placed.map((p) => p.w);
      if (!hidden.every((w) => words.has(w))) continue; // phòng hờ: từ giấu phải nằm trong danh sách quét
      if (words.size - hidden.length > MAX_ACCIDENTAL) continue;
      // từ giấu ghi đúng vị trí đã đặt (từ có thể xuất hiện nhiều chỗ; tô màu theo chỗ đã đặt)
      for (const p of placed) words.set(p.w, [p.r, p.c, p.d]);
      return { grid: g.map((row) => row.join('')), hidden, words: [...words].map(([w, [r, c, d]]) => [w, r, c, d]) };
    }
  }
  return null;
}

// ---------- chạy ----------
let boards = [];
if (APPEND && fs.existsSync(OUT)) boards = JSON.parse(fs.readFileSync(OUT, 'utf8')).boards;
const have = new Set(boards.map((b) => b.grid.join('')));
let made = 0, tries = 0;
while (made < COUNT && tries++ < COUNT * 10) {
  const b = makeBoard();
  if (!b || have.has(b.grid.join(''))) continue;
  have.add(b.grid.join('')); boards.push(b); made++;
}
const acc = boards.map((b) => b.words.length - b.hidden.length);
console.log(`Từ giấu lấy từ ${pool.length} từ (4–${MAX_LEN} chữ cái, là từ thật trong từ điển) của ${path.relative(__dirname, SRC)}`);
console.log(`Dựng thêm ${made} bảng, tổng ${boards.length}. Từ hợp lệ mỗi bảng: TB ${(boards.reduce((s, b) => s + b.words.length, 0) / boards.length).toFixed(1)} (trong đó vô tình: TB ${(acc.reduce((s, v) => s + v, 0) / acc.length).toFixed(1)}, tối đa ${Math.max(...acc)})`);

const line = (o) => '    ' + JSON.stringify(o);
fs.writeFileSync(OUT, '{\n  "moc": 400,\n  "size": 10,\n  "nguon": ' + JSON.stringify(`Từ giấu lấy từ bộ từ mốc 400 (migii_toeic_svc · vocab); từ hợp lệ quét bằng từ điển Hunspell; sinh bằng build_san_tu.js`) +
  ',\n  "boards": [\n' + boards.map(line).join(',\n') + '\n  ]\n}\n');
console.log('Đã ghi', path.relative(__dirname, OUT));
if (made < COUNT) { console.error(`Chỉ dựng được ${made}/${COUNT} bảng`); process.exit(1); }
