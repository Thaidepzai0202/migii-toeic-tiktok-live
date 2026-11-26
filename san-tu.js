// Bảng chữ khung 🔎 Săn từ (luật người dùng chốt 26/11/2026, thay bản ma trận 10×10 giấu từ theo 8 hướng).
//
// Bảng N×N chữ cái (16×16). Từ chỉ tính theo hai chiều: hàng ngang trái → phải (d = 0) và cột dọc trên → xuống (d = 1), từ 3 chữ cái,
// từ nằm trong từ khác cũng tính ("her" trong "there"). Bảng không còn file dựng sẵn: dựng ngay lúc chơi vì sau mỗi lượt các chữ của từ
// đã tìm nổ đi, chữ phía trên rơi xuống, chữ mới rơi vào chỗ trống (như game xếp kim cương) nên bảng sau phụ thuộc bảng trước.
//
// "Chữ hiện có chủ đích": ô trống được xếp từ thật của kho Migii (word-300, word-400: bộ từ của kênh dưới 450) theo hai chiều trên, khớp với
// chữ đang có nếu chạm nhau; phần lẻ còn lại điền chữ cái hay gặp. Sau mỗi lần rơi bảng luôn có ít nhất MIN_MIGII từ Migii có nghĩa.
// Bảng không được chứa từ tục / thô đọc xuôi theo hai chiều tính điểm (trừ khi nằm trọn trong một từ hợp lệ dài hơn, như "ass" trong "class").
const fs = require('fs');
const path = require('path');
const dict = require('./dict');

const N = 16, MIN_LEN = 3, MIN_MIGII = 8;
const PLANT_MIN = 3, PLANT_MAX = 8;   // độ dài từ Migii đem xếp lên bảng
const FREE = 0.22;                    // phần ô trống chừa cho chữ ngẫu nhiên (bảng toàn từ xếp sát nhau thì không còn "tự nhiên")
const BAD = new Set([...dict.BAD_IN_GRID, ...dict.THO]);
// chữ điền ô lẻ: theo tần suất tiếng Anh, bỏ j q x z (ít ghép ra từ, dễ thành chuỗi vô nghĩa)
const FILL = 'eeeeeeeeeeeetttttttttaaaaaaaaooooooooiiiiiiinnnnnnnsssssshhhhhhrrrrrrddddllllcccuuummwwffggyyppbbvk';

const rnd = (n) => Math.floor(Math.random() * n);
const idx = (r, c) => r * N + c;

// mean: từ a–z có nghĩa tiếng Việt → nghĩa (word-300, word-400 trước, rồi kho bài học bank.json) · plant: từ của word-300/400 đem xếp lên bảng
let KHO = null;
function kho() {
  if (KHO) return KHO;
  const mean = new Map(), plant = [];
  let exclude = new Set();
  try { exclude = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'exclude.json'), 'utf8')).map((x) => x.w)); } catch {}
  const add = (word, m, canPlant) => {
    const w = String(word || '').toLowerCase();
    if (!/^[a-z]{3,}$/.test(w) || !m || exclude.has(word) || BAD.has(w) || dict.isOffensive(w) || mean.has(w)) return;
    mean.set(w, m);
    if (canPlant && w.length >= PLANT_MIN && w.length <= PLANT_MAX) plant.push(w);
  };
  for (const n of [300, 400]) {
    const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', `word-${n}.json`), 'utf8'));
    for (const x of d.words || d) add(x.w, String((x.vi || [])[0] || '').trim(), true);
  }
  try {
    for (const x of JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'bank.json'), 'utf8'))) add(x.w, String(x.m || '').split(/[,;]/)[0].trim(), false);
  } catch {}
  return (KHO = { mean, plant });
}

// "Từ có nghĩa": từ Migii có nghĩa, hoặc từ điển nhận (dict.isPlayable đã chặn chữ viết tắt, số La Mã, từ thô). Kết quả nhớ lại vì mỗi lượt quét ~3.400 chuỗi.
const memo = new Map();
function playable(w) {
  let v = memo.get(w);
  if (v === undefined) {
    if (memo.size > 300000) memo.clear();
    v = w.length >= MIN_LEN && !BAD.has(w) && (kho().mean.has(w) || dict.isPlayable(w));
    memo.set(w, v);
  }
  return v;
}

// 2N đường đọc được: N hàng ngang, N cột dọc. g = mảng N hàng, mỗi hàng là mảng N chữ.
function lines(g) {
  const out = [];
  for (let r = 0; r < N; r++) out.push({ s: g[r].join(''), r, c: 0, d: 0 });
  for (let c = 0; c < N; c++) out.push({ s: g.map((row) => row[c]).join(''), r: 0, c, d: 1 });
  return out;
}

// Mọi từ hợp lệ đang có trên bảng → các chỗ nó nằm [{ r, c, d }] (một từ có thể nằm nhiều chỗ: mỗi chỗ một lần điểm).
function scan(grid) {
  const g = grid.map((row) => [...row]), map = new Map();
  for (const ln of lines(g)) {
    for (let i = 0; i + MIN_LEN <= N; i++) {
      for (let L = MIN_LEN; i + L <= N; L++) {
        const w = ln.s.substr(i, L);
        if (!playable(w)) continue;
        const o = { r: ln.r + (ln.d ? i : 0), c: ln.c + (ln.d ? 0 : i), d: ln.d };
        (map.get(w) || map.set(w, []).get(w)).push(o);
      }
    }
  }
  return map;
}
const cellsOf = (w, o) => Array.from({ length: w.length }, (_, k) => [o.r + (o.d ? k : 0), o.c + (o.d ? 0 : k)]);

// Từ tục / thô đọc được trên bảng: [[r, c], …] của từng chỗ. Đọc xuôi theo hai chiều tính điểm thì chặn cả nhóm nhẹ; đọc ngược chỉ chặn từ tục nặng.
function findBad(g) {
  const out = [];
  for (const ln of lines(g)) {
    const at = (i, k) => [ln.r + (ln.d ? i + k : 0), ln.c + (ln.d ? 0 : i + k)];
    const rev = [...ln.s].reverse().join('');
    for (let i = 0; i + 3 <= N; i++) {
      for (let L = 3; L <= 8 && i + L <= N; L++) {
        if (BAD.has(ln.s.substr(i, L)) || dict.isOffensive(ln.s.substr(i, L))) {
          // được phép nếu nằm trọn trong một từ hợp lệ dài hơn trên cùng đường
          let inside = false;
          for (let a = Math.max(0, i - 12); a <= i && !inside; a++) for (let b = i + L; b <= N; b++) if (b - a > L && playable(ln.s.slice(a, b))) { inside = true; break; }
          if (!inside) out.push(Array.from({ length: L }, (_, k) => at(i, k)));
        }
        if (L >= 4 && dict.isOffensive(rev.substr(i, L))) out.push(Array.from({ length: L }, (_, k) => at(N - 1 - i - k, 0)));
      }
    }
  }
  return out;
}

// Xếp từ Migii vào các ô trống (null) của g rồi điền chữ lẻ. fresh[r][c] = ô vừa điền lần này · kept = ô thuộc một từ vừa xếp.
function fill(g) {
  const P = kho().plant, fresh = g.map((row) => row.map((x) => x == null)), kept = g.map((row) => row.map(() => false));
  const nulls = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (g[r][c] == null) nulls.push([r, c]);
  const total = nulls.length;
  let left = total, budget = Math.min(40000, 600 + total * 160);
  while (left > total * FREE && budget-- > 0) {
    const [r, c] = nulls[rnd(total)];
    if (g[r][c] != null) continue;
    const w = P[rnd(P.length)], L = w.length, d = rnd(2), k = rnd(L);
    const r0 = r - (d ? k : 0), c0 = c - (d ? 0 : k);
    if (r0 < 0 || c0 < 0 || (d ? r0 + L > N : c0 + L > N)) continue;
    let ok = true, cover = 0;
    for (let i = 0; i < L; i++) {
      const x = g[r0 + (d ? i : 0)][c0 + (d ? 0 : i)];
      if (x == null) cover++;
      else if (x !== w[i]) { ok = false; break; }
    }
    if (!ok) continue;
    for (let i = 0; i < L; i++) {
      const rr = r0 + (d ? i : 0), cc = c0 + (d ? 0 : i);
      g[rr][cc] = w[i];
      kept[rr][cc] = true;
    }
    left -= cover;
  }
  for (const [r, c] of nulls) if (g[r][c] == null) g[r][c] = FILL[rnd(FILL.length)];
  return { fresh, kept };
}

// Gỡ từ tục khỏi bảng vừa điền: đổi một chữ trong các ô vừa điền (ưu tiên ô lẻ, không phá từ vừa xếp). Trả về ô cũ không sửa được (cả từ
// tục nằm trên chữ cũ, do các cột rơi lệch nhau ghép lại) để nơi gọi cho ô đó nổ luôn; null = bảng sạch.
function clean(g, { fresh, kept }) {
  for (let round = 0; round < 60; round++) {
    const bad = findBad(g);
    if (!bad.length) return null;
    for (const cells of bad) {
      const mine = cells.filter(([r, c]) => fresh[r][c]);
      if (!mine.length) return cells[rnd(cells.length)];
      const loose = mine.filter(([r, c]) => !kept[r][c]);
      const [r, c] = (loose.length ? loose : mine)[rnd((loose.length ? loose : mine).length)];
      g[r][c] = FILL[rnd(FILL.length)];
    }
  }
  return findBad(g)[0]?.[0] || null;
}

const migiiCount = (map) => { let n = 0; const M = kho().mean; for (const w of map.keys()) if (M.has(w)) n++; return n; };
const toRows = (g) => g.map((row) => row.join(''));

// Bảng mới tinh (lượt đầu, hoặc lượt không ai tìm được từ nào: nổ cả bảng).
function newBoard() {
  for (let t = 0; ; t++) {
    const g = Array.from({ length: N }, () => Array(N).fill(null));
    const info = fill(g);
    if (clean(g, info) && t < 50) continue;
    if (migiiCount(scan(g)) >= MIN_MIGII || t >= 50) return toRows(g);
  }
}

// Sau một lượt: các ô `cleared` (Set chỉ số r * N + c) nổ, chữ phía trên rơi xuống, ô trống ở đầu cột được điền mới.
// Có thể phải cho nổ thêm ô (từ tục ghép từ chữ cũ, hoặc bảng còn dưới MIN_MIGII từ Migii thì nổ thêm hai hàng trên cùng để có chỗ xếp từ):
// trả về `cleared` đã mở rộng để màn live cho nổ đúng những ô đó.
function refill(grid, cleared) {
  const old = grid.map((row) => [...row]);
  cleared = new Set(cleared);
  let best = null;
  for (let t = 0; t < 80; t++) {
    if (cleared.size >= N * N) return { grid: newBoard(), cleared: [...cleared], all: true };
    const g = Array.from({ length: N }, () => Array(N).fill(null)), src = Array.from({ length: N }, () => Array(N).fill(-1));
    for (let c = 0; c < N; c++) {
      let w = N - 1;
      for (let r = N - 1; r >= 0; r--) if (!cleared.has(idx(r, c))) { g[w][c] = old[r][c]; src[w][c] = r; w--; }
    }
    const info = fill(g), stuck = clean(g, info);
    if (stuck) { if (src[stuck[0]][stuck[1]] >= 0) cleared.add(idx(src[stuck[0]][stuck[1]], stuck[1])); continue; }
    const n = migiiCount(scan(g));
    if (!best || n > best.n) best = { n, grid: toRows(g), cleared: [...cleared] };
    if (n >= MIN_MIGII) break;
    if (t % 6 === 5) { // thử vài lần vẫn thiếu từ: nổ thêm hàng trên cùng còn nguyên của mỗi cột
      for (let c = 0; c < N; c++) for (let r = 0; r < N; r++) if (!cleared.has(idx(r, c))) { cleared.add(idx(r, c)); break; }
      best = null;
    }
  }
  return best || { grid: newBoard(), cleared: Array.from({ length: N * N }, (_, i) => i), all: true };
}

// Từ gợi ý (nhấp nháy sau 10 giây chưa ai tìm được gì): một từ Migii có nghĩa, chỉ nằm một chỗ, ưu tiên 4–6 chữ cho dễ nhận.
function pickHint(map) {
  const M = kho().mean, all = [...map.keys()].filter((w) => M.has(w) && map.get(w).length === 1);
  const nice = all.filter((w) => w.length >= 4 && w.length <= 6);
  const from = nice.length ? nice : all;
  return from.length ? from[rnd(from.length)] : null;
}

module.exports = { N, MIN_LEN, MIN_MIGII, kho, playable, scan, cellsOf, findBad, newBoard, refill, pickHint, migiiCount, mean: (w) => kho().mean.get(w) || '' };
