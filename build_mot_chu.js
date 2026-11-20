#!/usr/bin/env node
// Dựng sẵn bộ đề cho khung ✂️ Thêm bớt 1 chữ (kênh dưới 450) → data/mot-chu.json
//
//   node build_mot_chu.js           dựng lại toàn bộ, GHI ĐÈ file (npm run build:motchu)
//   node build_mot_chu.js --list    in thêm 40 câu thường ngẫu nhiên để soát bằng mắt
//
// Luật (người dùng chốt 19/11/2026): màn hiện một chữ viết sai kèm nghĩa tiếng Việt và lệnh THÊM 1 chữ hoặc BỚT 1 chữ;
// người xem thêm / bớt đúng 1 chữ cái để thành từ có nghĩa rồi gõ cả từ vào bình luận. "Về đích" (các câu cuối lượt) là từ rất dễ nhầm.
//
// questions: câu thường, sinh tự động từ bộ từ của kênh (data/word-300.json + word-400.json, cùng nguồn với khung Word), từ 4–8 chữ cái.
//   add (THÊM): bỏ 1 chữ cái của từ (không bỏ chữ đầu) · cut (BỚT): chèn thêm 1 chữ cái (không chèn trước chữ đầu).
//   Ưu tiên kiểu sai người học hay mắc: bỏ một chữ của cặp chữ đôi (office → ofice), nhân đôi một chữ (budget → buddget).
//   Điều kiện để mỗi câu chỉ có MỘT đáp án: chữ hiện ra không phải từ có thật (tra dict.js), và trong mọi cách thêm (hoặc bớt)
//   1 chữ cái vào chữ hiện ra chỉ có đúng từ đáp án là từ có trong từ điển.
// red: câu về đích, soạn tay ở RED bên dưới, hai loại:
//   a) cặp từ thật dễ nhầm (desert ↔ dessert, lunch ↔ launch…): chữ hiện ra là từ có thật, `sm` = nghĩa của nó (hiện lúc công bố để so sánh)
//   b) lỗi chính tả hay gặp (adress, untill, wellcome…)
//   Nghĩa trên màn là nghĩa của TỪ ĐÁP ÁN nên câu về đích không cần duy nhất theo từ điển.
//
// Mỗi câu: { k: 'add'|'cut', s: chữ hiện ra, w: đáp án, m: nghĩa, pos?, i: vị trí trong `s` (add: chỗ chèn; cut: chữ thừa), ch: chữ cái thêm/bớt, sm? }
const fs = require('fs');
const path = require('path');
const dict = require('./dict');

const OUT = path.join(__dirname, 'data', 'mot-chu.json');
const MIN_LEN = 4, MAX_LEN = 8;
const ABC = 'abcdefghijklmnopqrstuvwxyz';
const VOWEL = new Set('aeiou');
const DOUBLE_OK = new Set('bcdfglmnprst' + 'eo'); // chữ hay bị nhân đôi nhầm (ll, ss, tt, ee, oo…); không nhân đôi h, w, y, j, q, x, v, k

// Về đích. [k, s, w, m, sm]: sm chỉ có ở loại a (từ thật dễ nhầm). Nghĩa ngắn, đúng nghĩa của từ đáp án.
const RED = [
  // a) THÊM: từ thật → từ thật
  ['add', 'desert', 'dessert', 'món tráng miệng', 'sa mạc'],
  ['add', 'lose', 'loose', 'lỏng, rộng', 'đánh mất'],
  ['add', 'breath', 'breathe', 'thở (động từ)', 'hơi thở'],
  ['add', 'later', 'latter', 'cái sau (trong hai cái)', 'lát nữa, sau đó'],
  ['add', 'lunch', 'launch', 'ra mắt (sản phẩm)', 'bữa trưa'],
  ['add', 'rise', 'raise', 'nâng lên, tăng (cái gì)', 'tự tăng lên'],
  ['add', 'were', 'where', 'ở đâu', 'đã là (quá khứ của be)'],
  ['add', 'hole', 'whole', 'toàn bộ', 'cái lỗ'],
  ['add', 'our', 'hour', 'giờ (60 phút)', 'của chúng ta'],
  ['add', 'now', 'know', 'biết', 'bây giờ'],
  ['add', 'cost', 'coast', 'bờ biển', 'chi phí'],
  ['add', 'diner', 'dinner', 'bữa tối', 'thực khách'],
  ['add', 'chose', 'choose', 'chọn', 'đã chọn'],
  ['add', 'moral', 'morale', 'tinh thần (làm việc)', 'đạo đức'],
  ['add', 'bought', 'brought', 'đã mang đến', 'đã mua'],
  ['add', 'though', 'thought', 'đã nghĩ; suy nghĩ', 'mặc dù'],
  ['add', 'quit', 'quite', 'khá là', 'bỏ, nghỉ (việc)'],
  ['add', 'sit', 'site', 'địa điểm, công trường', 'ngồi'],
  ['add', 'not', 'note', 'ghi chú', 'không'],
  ['add', 'plan', 'plane', 'máy bay', 'kế hoạch'],
  ['add', 'mad', 'made', 'đã làm, đã tạo ra', 'điên, tức giận'],
  ['add', 'through', 'thorough', 'kỹ lưỡng', 'xuyên qua'],
  ['add', 'here', 'there', 'ở đó', 'ở đây'],
  ['add', 'ever', 'every', 'mỗi, mọi', 'từng, bao giờ'],
  ['add', 'state', 'statue', 'bức tượng', 'tình trạng; bang'],
  ['add', 'contact', 'contract', 'hợp đồng', 'liên hệ'],
  ['add', 'beside', 'besides', 'ngoài ra', 'bên cạnh'],
  ['add', 'broad', 'abroad', 'ở nước ngoài', 'rộng'],
  ['add', 'live', 'alive', 'còn sống', 'sống'],
  ['add', 'like', 'alike', 'giống nhau', 'thích'],
  ['add', 'head', 'ahead', 'phía trước', 'cái đầu'],
  // a) BỚT: từ thật → từ thật
  ['cut', 'dessert', 'desert', 'sa mạc', 'món tráng miệng'],
  ['cut', 'loose', 'lose', 'đánh mất', 'lỏng, rộng'],
  ['cut', 'breathe', 'breath', 'hơi thở (danh từ)', 'thở'],
  ['cut', 'latter', 'later', 'lát nữa, sau đó', 'cái sau (trong hai cái)'],
  ['cut', 'launch', 'lunch', 'bữa trưa', 'ra mắt (sản phẩm)'],
  ['cut', 'raise', 'rise', 'tự tăng lên', 'nâng lên, tăng (cái gì)'],
  ['cut', 'where', 'were', 'đã là (quá khứ của be)', 'ở đâu'],
  ['cut', 'whole', 'hole', 'cái lỗ', 'toàn bộ'],
  ['cut', 'coast', 'cost', 'chi phí', 'bờ biển'],
  ['cut', 'dinner', 'diner', 'thực khách', 'bữa tối'],
  ['cut', 'choose', 'chose', 'đã chọn', 'chọn'],
  ['cut', 'morale', 'moral', 'đạo đức', 'tinh thần (làm việc)'],
  ['cut', 'brought', 'bought', 'đã mua', 'đã mang đến'],
  ['cut', 'through', 'though', 'mặc dù', 'xuyên qua'],
  ['cut', 'quite', 'quit', 'bỏ, nghỉ (việc)', 'khá là'],
  ['cut', 'plane', 'plan', 'kế hoạch', 'máy bay'],
  ['cut', 'thorough', 'through', 'xuyên qua; thông qua', 'kỹ lưỡng'],
  ['cut', 'contract', 'contact', 'liên hệ', 'hợp đồng'],
  ['cut', 'statue', 'state', 'tình trạng; bang', 'bức tượng'],
  ['cut', 'besides', 'beside', 'bên cạnh', 'ngoài ra'],
  ['cut', 'every', 'ever', 'từng, bao giờ', 'mỗi, mọi'],
  ['cut', 'abroad', 'broad', 'rộng', 'ở nước ngoài'],
  ['cut', 'alive', 'live', 'sống', 'còn sống'],
  ['cut', 'there', 'here', 'ở đây', 'ở đó'],
  ['cut', 'know', 'now', 'bây giờ', 'biết'],
  ['cut', 'hour', 'our', 'của chúng ta', 'giờ (60 phút)'],
  ['cut', 'made', 'mad', 'điên, tức giận', 'đã làm, đã tạo ra'],
  ['cut', 'note', 'not', 'không', 'ghi chú'],
  // b) THÊM: lỗi chính tả hay gặp (thiếu 1 chữ)
  ['add', 'adress', 'address', 'địa chỉ'],
  ['add', 'goverment', 'government', 'chính phủ'],
  ['add', 'enviroment', 'environment', 'môi trường'],
  ['add', 'begining', 'beginning', 'sự bắt đầu'],
  ['add', 'recomend', 'recommend', 'giới thiệu, đề xuất'],
  ['add', 'comittee', 'committee', 'ủy ban'],
  ['add', 'necesary', 'necessary', 'cần thiết'],
  ['add', 'sucess', 'success', 'thành công'],
  ['add', 'tomorow', 'tomorrow', 'ngày mai'],
  ['add', 'busness', 'business', 'kinh doanh'],
  ['add', 'libary', 'library', 'thư viện'],
  ['add', 'diffrent', 'different', 'khác nhau'],
  ['add', 'intresting', 'interesting', 'thú vị'],
  ['add', 'restarant', 'restaurant', 'nhà hàng'],
  ['add', 'coleague', 'colleague', 'đồng nghiệp'],
  ['add', 'realy', 'really', 'thật sự'],
  ['add', 'finaly', 'finally', 'cuối cùng'],
  ['add', 'stoped', 'stopped', 'đã dừng lại'],
  ['add', 'shoping', 'shopping', 'mua sắm'],
  ['add', 'studing', 'studying', 'đang học'],
  ['add', 'ninty', 'ninety', 'chín mươi'],
  ['add', 'exellent', 'excellent', 'xuất sắc'],
  ['add', 'occured', 'occurred', 'đã xảy ra'],
  ['add', 'probaly', 'probably', 'có lẽ'],
  ['add', 'hapened', 'happened', 'đã xảy ra'],
  ['add', 'mispell', 'misspell', 'viết sai chính tả'],
  ['add', 'tomatos', 'tomatoes', 'những quả cà chua'],
  ['add', 'knowlege', 'knowledge', 'kiến thức'],
  ['add', 'intrest', 'interest', 'sự quan tâm; lãi suất'],
  ['add', 'temprature', 'temperature', 'nhiệt độ'],
  ['add', 'vegtable', 'vegetable', 'rau củ'],
  ['add', 'choclate', 'chocolate', 'sô-cô-la'],
  ['add', 'accomodate', 'accommodate', 'cung cấp chỗ ở'],
  ['add', 'managment', 'management', 'sự quản lý'],
  ['add', 'planed', 'planned', 'đã lên kế hoạch'],
  // b) BỚT: lỗi chính tả hay gặp (thừa 1 chữ)
  ['cut', 'writting', 'writing', 'việc viết'],
  ['cut', 'comming', 'coming', 'đang đến'],
  ['cut', 'untill', 'until', 'cho đến khi'],
  ['cut', 'accross', 'across', 'băng qua'],
  ['cut', 'usefull', 'useful', 'hữu ích'],
  ['cut', 'carefull', 'careful', 'cẩn thận'],
  ['cut', 'beautifull', 'beautiful', 'đẹp'],
  ['cut', 'fourty', 'forty', 'bốn mươi'],
  ['cut', 'allready', 'already', 'đã… rồi'],
  ['cut', 'truely', 'truly', 'thật sự'],
  ['cut', 'arguement', 'argument', 'cuộc tranh luận'],
  ['cut', 'dissappoint', 'disappoint', 'làm thất vọng'],
  ['cut', 'wellcome', 'welcome', 'chào mừng'],
  ['cut', 'hopeing', 'hoping', 'đang hy vọng'],
  ['cut', 'makeing', 'making', 'đang làm'],
  ['cut', 'mounth', 'month', 'tháng'],
  ['cut', 'nineth', 'ninth', 'thứ chín'],
  ['cut', 'occassion', 'occasion', 'dịp'],
  ['cut', 'loosing', 'losing', 'đang thua, đang mất'],
];

// RNG có hạt giống: build lại ra cùng bộ đề (dễ so diff)
let seed = 20261119;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// mọi từ có trong từ điển khi thêm 1 chữ cái vào s (ở bất kỳ vị trí nào) / khi bớt 1 chữ cái của s
const adds = (s) => { const o = new Set(); for (let i = 0; i <= s.length; i++) for (const c of ABC) { const x = s.slice(0, i) + c + s.slice(i); if (dict.isWord(x)) o.add(x); } return o; };
const cuts = (s) => { const o = new Set(); for (let i = 0; i < s.length; i++) { const x = s.slice(0, i) + s.slice(i + 1); if (dict.isWord(x)) o.add(x); } return o; };
const only = (set, w) => set.size === 1 && set.has(w);

// Chữ hiện ra phải đọc được: không sinh ra cụm 3 phụ âm liền nhau mà từ gốc không có (chrch, cnfirm, momnt; còn helth, extr giữ được), hai chữ đầu không thành cặp phụ âm mới (bcome). y tính là nguyên âm.
const readable = (s, w) => { if (!/[aeiouy]/.test(s.slice(0, 2)) && s.slice(0, 2) !== w.slice(0, 2)) return false; /* bcome, mjority */ for (let k = 0; k + 3 <= s.length; k++) { const x = s.slice(k, k + 3); if (!/[aeiouy]/.test(x) && !w.includes(x)) return false; } return true; };
// Ứng viên THÊM của từ w: bỏ chữ ở vị trí j (j ≥ 1). Điểm ưu tiên: chữ đôi 3 · nguyên âm 2 · phụ âm 1.
function addCands(w) {
  const out = [], seen = new Set();
  if (w.length < 5) return out; // từ 4 chữ bỏ 1 chữ còn 3 chữ: quá ít để đoán (sfe, jmp)
  for (let j = 1; j < w.length; j++) {
    const s = w.slice(0, j) + w.slice(j + 1);
    if (seen.has(s) || !readable(s, w) || dict.isWord(s) || !only(adds(s), w)) continue;
    seen.add(s);
    const dbl = w[j] === w[j - 1] || w[j] === w[j + 1];
    out.push({ k: 'add', s, i: j, ch: w[j], score: dbl ? 3 : VOWEL.has(w[j]) ? 2 : 1 });
  }
  return out;
}
// Ứng viên BỚT của từ w: nhân đôi một chữ (chèn bản sao ngay sau nó), chỉ ở chỗ người viết hay nhân đôi nhầm:
//   phụ âm đứng giữa hai nguyên âm (posittive, managger) · e/o đứng giữa hai phụ âm (leevel, moovie) · l/f cuối từ sau nguyên âm (untill).
// Không nhân đôi chữ cái đầu (sstill), không chèn chữ lạ (balol, toaol): từ không có chỗ nhân đôi tự nhiên thì chỉ ra câu THÊM.
const isV = (c) => VOWEL.has(c);
function cutCands(w) {
  const out = [], seen = new Set();
  for (let j = 2; j <= w.length; j++) {
    const opts = [];
    const L = w[j - 1], A = w[j - 2], B = w[j]; // nhân đôi L; A, B = chữ đứng trước và sau L
    if (L !== A && L !== B && DOUBLE_OK.has(L)) {
      if (B === undefined) { if ('lf'.includes(L) && isV(A)) opts.push([L, 2]); }
      else if (isV(L) ? !isV(A) && !isV(B) : isV(A) && isV(B)) opts.push([L, 3]);
    }
    for (const [c, score] of opts) {
      const s = w.slice(0, j) + c + w.slice(j);
      if (seen.has(s) || dict.isWord(s) || !only(cuts(s), w)) continue;
      seen.add(s);
      out.push({ k: 'cut', s, i: j, ch: c, score });
    }
  }
  return out;
}
// chọn một ứng viên: ưu tiên điểm cao nhất, cùng điểm thì ngẫu nhiên
const best = (cands) => { if (!cands.length) return null; const top = Math.max(...cands.map((c) => c.score)); return pick(cands.filter((c) => c.score === top)); };

// ---------- câu thường ----------
let exclude = new Set();
try { exclude = new Set(JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'exclude.json'), 'utf8')).map((x) => x.w)); } catch {}
const words = new Map();
for (const n of [300, 400]) {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', `word-${n}.json`), 'utf8'));
  for (const x of d.words || d) {
    const w = String(x.w || '');
    const m = String((x.vi || [])[0] || '').trim();
    if (new RegExp(`^[a-z]{${MIN_LEN},${MAX_LEN}}$`).test(w) && m && !exclude.has(w) && !dict.BAD_IN_GRID.has(w) && dict.isWord(w) && !words.has(w)) words.set(w, { w, m, pos: x.pos || '' });
  }
}
const questions = [];
let nAdd = 0, nCut = 0, none = 0;
for (const x of shuffle([...words.values()])) {
  const a = best(addCands(x.w)), c = best(cutCands(x.w));
  // mỗi từ một câu; cân hai loại: loại đang ít hơn được chọn trước nếu từ này làm được cả hai
  const q = a && c ? (nAdd <= nCut ? a : c) : a || c;
  if (!q) { none++; continue; }
  q.k === 'add' ? nAdd++ : nCut++;
  questions.push({ k: q.k, s: q.s, w: x.w, m: x.m, ...(x.pos && { pos: x.pos }), i: q.i, ch: q.ch });
}

// ---------- về đích ----------
const red = [], bad = [];
for (const [k, s, w, m, sm] of RED) {
  // tìm vị trí: add = chèn ch vào s ở i ra w · cut = bỏ s[i] ra w
  let i = -1, ch = '';
  if (k === 'add' && w.length === s.length + 1) for (let j = 0; j < w.length && i < 0; j++) if (w.slice(0, j) + w.slice(j + 1) === s) { i = j; ch = w[j]; }
  if (k === 'cut' && s.length === w.length + 1) for (let j = 0; j < s.length && i < 0; j++) if (s.slice(0, j) + s.slice(j + 1) === w) { i = j; ch = s[j]; }
  const why = i < 0 ? 'không đúng 1 chữ' : !dict.isWord(w) ? 'đáp án không có trong từ điển' : sm && !dict.isWord(s) ? 'loại a mà chữ hiện ra không phải từ' : null;
  if (why) { bad.push(`${s} → ${w}: ${why}`); continue; }
  red.push({ k, s, w, m, i, ch, ...(sm && { sm }) });
}
if (bad.length) { console.error('❌ Câu về đích hỏng:\n  ' + bad.join('\n  ')); process.exit(1); }

fs.writeFileSync(OUT, JSON.stringify({
  note: 'Sinh bởi build_mot_chu.js (npm run build:motchu), build lại sẽ ghi đè. questions: câu thường · red: câu về đích (từ rất dễ nhầm, soạn tay trong RED của build_mot_chu.js).',
  questions, red,
}, null, 0).replace(/},{/g, '},\n{').replace(/\[{/g, '[\n{'));
console.log(`✂️ ${path.relative(__dirname, OUT)}: ${questions.length} câu thường (THÊM ${nAdd} · BỚT ${nCut}; ${none} từ không ra được đề duy nhất) + ${red.length} câu về đích (THÊM ${red.filter((x) => x.k === 'add').length} · BỚT ${red.filter((x) => x.k === 'cut').length})`);
if (process.argv.includes('--list')) for (const q of shuffle(questions).slice(0, 40)) console.log(`  ${q.k === 'add' ? 'THÊM' : 'BỚT '} ${q.s.padEnd(10)} → ${q.w.padEnd(9)} ${q.m}`);
