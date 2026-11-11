// Game live TikTok "Đố từ vựng TOEIC" cho app Migii TOEIC — người xem gõ đáp án vào bình luận.
// (Fork từ tiktok-live-quiz của Jaemy; remote `upstream` trỏ về repo gốc để kéo bản sửa lỗi.)
//
//   node server.js --sim                 # chạy thử với khán giả ảo, không cần TikTok
//   node server.js --user <tiktok_id>    # đọc chat live thật của @tiktok_id
//
// Màn livestream:  http://localhost:8788/          (khung 1080×1920 cho OBS / LIVE Studio / điện thoại)
// Màn điều khiển:  http://localhost:8788/control   (chỉ mở được từ máy chạy server, hoặc ?key=CONTROL_KEY)
//
// Vòng chơi: nghỉ giữa lượt (luật + bảng vàng) → N câu → vinh danh top 3 → nghỉ → lượt mới …
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const tts = require('./tts');
const enAudio = require('./en_audio');
const dict = require('./dict');

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = args[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};

const PORT = Number(arg('port', process.env.PORT || 8788)); // 8788: không đụng bản Jaemy (8787) nếu chạy chung máy
const TIKTOK_USER = arg('user', null);
const SIM = !!arg('sim', false);
const AUTOSTART = !!arg('autostart', false); // tự bắt đầu lượt đầu sau giờ nghỉ (bản thử nhiều game, không có người bấm); mặc định đứng chờ người dẫn bấm Bắt đầu
const TAG = String(arg('tag', '')).replace(/[^a-z0-9_-]/gi, ''); // chạy nhiều tiến trình thử cùng lúc (gateway.js): mỗi tiến trình ghi file điểm / từ đã hỏi riêng
// Mở màn điều khiển từ điện thoại cùng Wi-Fi cần khoá; không đặt trong .env thì tự sinh mỗi lần chạy.
// --mute: chạy thử im lặng tuyệt đối (trang live không phát giọng/nhạc/hiệu ứng) — dùng khi đang có phiên live thật trên máy
const MUTE = !!arg('mute', false);
const CONTROL_KEY = process.env.CONTROL_KEY || crypto.randomBytes(4).toString('hex');

// Mức độ theo mức từ vựng trong app (cid = level): 1 Basic · 2 500–650 · 3 650–800 · 4 800+.
const LEVELS = {
  easy: ['1'],
  mid: ['1', '2'],
  hard: ['2', '3', '4'],
};
// data/exclude.json (tuỳ chọn, tự tạo): [{ "w": "từ" }, …] — từ không muốn đưa lên sóng.
let EXCLUDE = new Set();
try {
  EXCLUDE = new Set(require('./data/exclude.json').map((x) => x.w));
} catch {}
const BANK_ALL = require('./data/bank.json').filter((x) => !EXCLUDE.has(x.w));
const bankFor = (level) => (level === 'all' ? BANK_ALL : BANK_ALL.filter((x) => LEVELS[level]?.includes(x.cid)));

// Cấu hình đổi được lúc chạy từ màn điều khiển. Số câu / mức từ áp dụng từ lượt sau.
const clamp = (v, lo, hi, def) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, Math.round(+v))) : def);
const CFG = {
  questions: clamp(arg('questions', 10), 5, 50, 10), // số câu mỗi lượt (mỗi khung chương trình)
  roundSec: clamp(arg('round', 10), 5, 60, 10), // giây mỗi câu (Word, Đố nhanh…). 11/11: người chơi thử thấy 15 giây dài, giảm còn 10
  revealSec: clamp(arg('reveal', 3), 2, 20, 3), // giây dừng giữa 2 câu: hiện đáp án + đọc, rồi chuyển câu
  podiumSec: clamp(arg('podium', 15), 5, 60, 15), // giây màn vinh danh
  breakSec: clamp(arg('break', 20), 5, 180, 20), // giây nghỉ trước lượt mới
  level: ['easy', 'mid', 'hard', 'all'].includes(arg('level')) ? arg('level') : 'easy',
  autoNext: true, // tắt = hết vinh danh thì chờ người dẫn bấm "Bắt đầu lượt"
  music: 0.25, // âm lượng nhạc nền 0..1 (0 = tắt)
  voice: true, // giọng đọc câu hỏi / cảm ơn / lời dẫn
  ai: !arg('no-ai', false), // AI "Ninja Migii" trả lời bình luận (ai.js)
  // mcq = trắc nghiệm: hiện từ tiếng Anh (+ đọc), chọn nghĩa 1–4 bằng bình luận; type = nghe + gõ từ tiếng Anh
  mode: arg('mode') === 'type' ? 'type' : 'mcq',
  // người chơi ảo 🤖 mỗi câu (bots.js). MẶC ĐỊNH TẮT ở bản Migii: trên màn live không gắn nhãn bot → xem CAN-CUNG-CAP.md
  bots: clamp(arg('bots', 0), 0, 12, 0),
  // style: quiz = đố liên tục · class = LỚP HỌC: Ninja Migii giảng nhóm từ cùng bài (teach) rồi kiểm tra từng từ, gọi tên học sinh,
  // người xem bình luận/vào live được xếp chỗ ngồi trong lớp. Bật: --class hoặc đổi trong màn điều khiển (áp dụng từ lượt sau).
  // program = CHƯƠNG TRÌNH XOAY VÒNG (04/11): mỗi lượt một khung khác nhau (giờ học ↔ giải trí), giữa các khung có vinh danh.
  style: arg('class', false) ? 'class' : arg('quiz', false) ? 'quiz' : 'program',
  teachSec: clamp(arg('teach', 12), 5, 30, 12), // giây giảng mỗi từ
  group: clamp(arg('group', 3), 2, 5, 3), // số từ mỗi nhóm giảng → kiểm tra
};
// Các khung của chương trình xoay vòng. kind: 'học' | 'giải trí' (màn chờ báo "Giờ học" / "Giờ giải trí").
const SEGMENTS = {
  // sec: 15 = giữ nhịp cũ cho Giờ học và 2 khung nghe. 11/11 thời gian mặc định (--round) giảm 15 → 10 cho Word và các khung trắc nghiệm nhanh,
  // người dùng không đổi giờ các khung này.
  class: { icon: '📖', name: 'Giờ học', kind: 'học', rule: 'Ninja Migii dạy 3 từ mới rồi kiểm tra, gọi tên từng bạn', sec: 15 },
  quiz: { icon: '⚡', name: 'Đố nhanh', kind: 'giải trí', rule: 'Gõ số 1–4 chọn nghĩa đúng, nhanh nhất +10' },
  scramble: { icon: '🧩', name: 'Ghép chữ', kind: 'giải trí', rule: 'Các chữ cái bị xáo trộn — gõ THỨ TỰ SỐ đúng (vd 31254) hoặc gõ luôn từ' },
  reverse: { icon: '🔁', name: 'Chọn từ tiếng Anh', kind: 'học', rule: 'Nhìn nghĩa tiếng Việt, gõ số 1–4 chọn đúng từ tiếng Anh' },
  listen: { icon: '🎧', name: 'Luyện tai', kind: 'học', rule: 'Nghe Ninja đọc (không hiện chữ), gõ số 1–4 chọn nghĩa', sec: 15 },
  team: { icon: '🥊', name: 'So găng 2 đội', kind: 'giải trí', rule: 'Gõ tên đội để vào đội · trả lời đúng & tặng quà kéo điểm cho đội' },
  type: { icon: '✍️', name: 'Nghe & gõ chính tả', kind: 'học', rule: 'Nghe đọc + nhìn nghĩa, gõ từ tiếng Anh — gợi ý chữ cái mở dần', sec: 15 },
  // 4 kênh theo mốc TOEIC (11/11/2026): dưới 450 · 450–650 · 650–800 · 800+. Lệnh chạy từng kênh: npm run demo:duoi450 … (package.json).
  //   dưới 450: word (từ 300+400), startend, hunt, chain · 450–650: word (500+600), fillin, listenmean, errhunt, crossword
  //   650–800: word (700), speedread, dictate · 800+: word (800+900), speedread (bài 800)
  // Các khung mới (word trở xuống) tính điểm riêng: nhanh nhất +10, hạng 2 +5, hạng 3 +3, người đúng sau đó +1.
  // Người chơi thử 11/11 đề nghị bỏ khung nghe, Săn từ, Giải ô chữ, Săn lỗi, Giờ học; người dùng chưa muốn bỏ nên vẫn giữ trong kênh.
  word: { icon: '🔤', name: 'Word', kind: 'học', rule: 'Gõ A, B, C hoặc D: chọn nghĩa, chọn từ, tìm từ đồng nghĩa hoặc trái nghĩa' },
  // sec/total/reveal: khung này có nhịp riêng (45 giây mỗi câu, 5 câu mỗi lượt, công bố 8 giây để đọc ví dụ)
  startend: { icon: '🎯', name: 'Start or End', kind: 'giải trí', rule: 'Gõ 5 từ tiếng Anh bắt đầu hoặc kết thúc bằng chữ cho trước', sec: 45, total: 5, reveal: 8 },
  // Săn từ: 120 giây mỗi bảng, 3 bảng mỗi lượt. Điểm 10/5/3/1.
  hunt: { icon: '🔎', name: 'Săn từ', kind: 'giải trí', rule: 'Ma trận 10×10: tìm từ nối liền theo mọi hướng, ai tìm đủ 5 từ trước ăn điểm', sec: 120, total: 3, reveal: 10 },
  // Thế chữ: Black vs White, mỗi lượt 8 giây đổi đúng 1 chữ cái. KHÔNG có điểm: chỉ thắng/thua, kỷ lục chuỗi, tỉ lệ hợp lệ, MVP. total = số phiên mỗi lượt.
  chain: { icon: '🔗', name: 'Thế chữ', kind: 'giải trí', rule: 'Hai đội Black và White luân phiên đổi 1 chữ cái để ra từ mới, hết 8 giây là thua', sec: 8, total: 3, reveal: 10 },
  // Điền từ (kênh 450–650, câu dùng từ mốc 500). Điểm 10/5/3/1 (như Word).
  fillin: { icon: '✏️', name: 'Điền từ', kind: 'học', rule: 'Câu thiếu 1 từ: chọn A, B, C hoặc D; có lời giải và các lỗi hay nhầm', sec: 20, total: 5, reveal: 18 },
  listenmean: { icon: '🎧', name: 'Nghe – nghĩa', kind: 'học', rule: 'Nghe audio một lần, chữ cái hiện dần mỗi 2 giây, chọn nghĩa đúng', sec: 12, total: 8, reveal: 4 },
  // Săn lỗi: --err-file data/san-loi-600.json
  errhunt: { icon: '🔍', name: 'Săn lỗi', kind: 'học', rule: 'Câu có 1 từ sai: gõ "từ sai - từ đúng", ví dụ goning - going', sec: 30, total: 5, reveal: 15 },
  // Nghe – chép: --dict-file data/nghe-chep-700.json. Nghe câu tiếng Anh (phát lặp lại, cách 5 giây), gõ lại nguyên câu trong 40 giây; cứ 2 giây hiện thêm 1 loại chữ cái. Điểm 10/5/3/1.
  dictate: { icon: '🎙️', name: 'Nghe – chép', kind: 'học', rule: 'Nghe câu tiếng Anh (phát lặp lại), gõ lại cả câu vào bình luận; cứ 2 giây hiện thêm 1 chữ cái, nhanh nhất +10', sec: 40, total: 5, reveal: 10 },
  // Đọc nhanh (kênh 650–800 dùng bài 700, kênh 800+ dùng bài 800): văn bản ngắn kiểu Part 7 + câu hỏi chi tiết + 4 phương án hiện cùng lúc `sec` giây. Điểm 10/5/3/1.
  speedread: { icon: '📰', name: 'Đọc nhanh', kind: 'học', rule: 'Đọc văn bản ngắn, tìm chi tiết được hỏi: gõ A, B, C hoặc D', sec: 20, total: 5, reveal: 12 },
  // Giải ô chữ: sec = thời gian mỗi hàng (câu nhỏ); total chỉ là chỗ giữ, số "câu" mỗi lượt = số hàng của ô chữ
  crossword: { icon: '🔠', name: 'Giải ô chữ', kind: 'giải trí', rule: 'Gõ chữ thường giải từng hàng, gõ CHỮ HOA để giải từ khoá hàng dọc (+50)', sec: 30, total: 1, reveal: 4 },
};
// Mặc định = kênh dưới 450 (11/11/2026). Chương trình cũ của bản Jaemy: --program-order class,quiz,scramble,listen,reverse,type
const PROGRAM = String(arg('program-order', 'word,startend,hunt,chain')).split(',').filter((k) => SEGMENTS[k]);
let progIdx = 0;
const segFor = () => (CFG.style === 'program' ? PROGRAM[progIdx % PROGRAM.length] : CFG.style); // khung của lượt KẾ TIẾP
const curSeg = () => (game && phase !== 'break' ? game.seg : segFor());
const segPub = (id) => ({ id, ...SEGMENTS[id] });
// So găng: mỗi lượt một cặp đội; gõ tên đội để chọn (không gõ thì tự xếp vào đội ít người hơn khi trả lời đúng/tặng quà)
const TEAM_PAIRS = [
  [['🎧', 'Listening', 'listening|listen|nghe'], ['📖', 'Reading', 'reading|read|đọc|doc']],
  [['☕', 'Cà phê', 'cà phê|ca phe|cafe|coffee'], ['🧋', 'Trà sữa', 'trà sữa|tra sua|milk tea|milktea']],
  [['🐯', 'Hổ', 'hổ|ho|cọp|tiger'], ['🐻', 'Gấu', 'gấu|gau|bear']],
  [['🍓', 'Dâu', 'dâu|dau'], ['🍑', 'Đào', 'đào|dao']],
];
let teamPairNo = 0;
function makeTeams() {
  const pair = TEAM_PAIRS[teamPairNo++ % TEAM_PAIRS.length];
  return pair.map(([icon, name, re], i) => ({ i, icon, name, re: new RegExp(`^\\s*(?:đội|doi|team|vào|vao)?\\s*(?:${re})\\s*[!.~]*$`, 'i'), score: 0, members: new Map() }));
}
function teamOf(user, text) {
  const T = game?.teams;
  if (!T) return null;
  let t = game.teamOf.get(user.uid);
  const chosen = text ? T.find((x) => x.re.test(text)) : null;
  if (chosen && t == null) t = chosen.i; // chọn 1 lần, không đổi phe giữa chừng
  if (t == null) t = T[0].members.size <= T[1].members.size ? 0 : 1;
  game.teamOf.set(user.uid, t);
  const m = upsert(T[t].members, user, { score: 0, gift: 0 });
  if (user.bot) m.bot = true;
  return { team: T[t], m, chosen: !!chosen };
}
const teamPub = (t) => ({ icon: t.icon, name: t.name, score: t.score, n: t.members.size,
  top: [...t.members.values()].sort((a, b) => b.score - a.score).slice(0, 6).map(({ name, avatar, score, gift }) => ({ name, avatar, score, gift: gift > 0 })) });

let BANK = bankFor(CFG.level);
if (!BANK.length) throw new Error(`Kho rỗng với --level ${CFG.level}`);

// ---------- khung 🔤 Word và 🎯 Start or End (mốc 300) ----------
// Word: câu hỏi làm sẵn trong data/word-300.json (build_word_300.js): w2m cho từ chọn nghĩa · m2w cho nghĩa chọn từ · syn đồng nghĩa · ant trái nghĩa.
// Mỗi loại một túi xáo trộn, rút hết túi mới xáo lại; loại câu luân phiên ngẫu nhiên, không lặp loại vừa ra.
// --word-file nhận nhiều file cách nhau dấu phẩy (kênh dưới 450 = word-300 + word-400, kênh 800+ = word-800 + word-900): gộp câu hỏi và danh sách từ
const WORD_FILES = String(arg('word-file', 'data/word-300.json,data/word-400.json')).split(',').map((f) => path.resolve(__dirname, f.trim())).filter(Boolean);
let WORDQ = null;
function loadWordQ() {
  if (WORDQ) return WORDQ;
  const ds = WORD_FILES.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
  const questions = ds.flatMap((d) => d.questions), seen = new Set(), list = [];
  for (const d of ds) for (const x of d.words) if (!seen.has(x.w)) { seen.add(x.w); list.push(x); }
  const byT = {};
  for (const q of questions) (byT[q.t] ||= []).push(q);
  WORDQ = { byT, bag: {}, last: null, pos: new Map(list.map((x) => [x.w, x.pos])), words: list.map((x) => x.w), list };
  console.log(`🔤 Word: ${questions.length} câu từ ${WORD_FILES.map((f) => path.relative(__dirname, f)).join(' + ')} (${Object.entries(byT).map(([t, a]) => `${t} ${a.length}`).join(' · ')})`);
  return WORDQ;
}
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
function pickWordQ() {
  const W = loadWordQ();
  const types = Object.keys(W.byT);
  const pool = types.length > 1 ? types.filter((x) => x !== W.last) : types;
  const t = pool[Math.floor(Math.random() * pool.length)];
  W.last = t;
  if (!W.bag[t]?.length) W.bag[t] = shuffle(W.byT[t]);
  return W.bag[t].pop();
}
// Start or End: cụm chữ chọn trong số từ thông dụng của kho + danh sách Word; kiểm từ bằng từ điển Hunspell (dict.js)
let SE = null;
function startEnd() {
  if (!SE) {
    let extra = [];
    try { extra = loadWordQ().words; } catch {}
    SE = require('./startend').create([...BANK_ALL.map((x) => x.w), ...extra]);
    console.log(`🎯 Start or End: ${SE.patterns.length} cụm chữ dùng được`);
  }
  return SE;
}
// Khung Word / Start or End: nhanh nhất +10, hạng 2 +5, hạng 3 +3, những người đúng sau đó +1. Khung khác: 10, 8, 6, 4… tối thiểu 3.
const RANK_PTS = [10, 5, 3];
const ptsFor = (seg, rank) => (['word', 'startend', 'hunt', 'fillin', 'listenmean', 'errhunt', 'crossword', 'dictate', 'speedread'].includes(seg) ? RANK_PTS[rank] ?? 1 : Math.max(3, 10 - 2 * rank));

// Săn từ: ma trận dựng sẵn trong data/san-tu-400.json (build_san_tu.js), mỗi bảng kèm danh sách MỌI từ hợp lệ có trong bảng
// (từ giấu + từ thật vô tình mọc ra). Người xem gõ từ nào thì tra danh sách của bảng đó; tìm đủ HUNT_NEED từ khác nhau trước thì ăn điểm.
const HUNT_FILE = path.resolve(__dirname, String(arg('hunt-file', 'data/san-tu-400.json')));
const HUNT_NEED = 5;
let HUNT = null;
function pickBoard() {
  if (!HUNT) {
    HUNT = { boards: JSON.parse(fs.readFileSync(HUNT_FILE, 'utf8')).boards, bag: [] };
    console.log(`🔎 Săn từ: ${HUNT.boards.length} ma trận từ ${path.relative(__dirname, HUNT_FILE)}`);
  }
  if (!HUNT.bag.length) HUNT.bag = shuffle(HUNT.boards);
  return HUNT.bag.pop();
}

// ---------- khung 🔍 Săn lỗi và 🔠 Giải ô chữ (mốc 600) ----------
// Săn lỗi: câu làm sẵn trong data/san-loi-600.json: đúng 1 từ sai (chính tả hoặc ngữ pháp). Người xem gõ "từ sai - từ đúng" (dấu ngăn - – — : = / > -> => → hoặc chỉ khoảng trắng).
// Cả hai từ phải khớp mới đúng; gõ sai thì gõ lại được; ai đúng trước ăn điểm 10/5/3/1. Công bố có lời giải và từ bị nghi nhầm nhiều nhất.
const ERR_FILE = path.resolve(__dirname, String(arg('err-file', 'data/san-loi-600.json')));
let ERRQ = null;
function pickErr() {
  if (!ERRQ) {
    ERRQ = { qs: JSON.parse(fs.readFileSync(ERR_FILE, 'utf8')).questions, bag: [] };
    console.log(`🔍 Săn lỗi: ${ERRQ.qs.length} câu từ ${path.relative(__dirname, ERR_FILE)}`);
  }
  if (!ERRQ.bag.length) ERRQ.bag = shuffle(ERRQ.qs);
  return ERRQ.bag.pop();
}
// Khung Nghe – chép: câu làm sẵn trong data/nghe-chep-700.json ({s, vi, w}). Chấm theo từng từ sau khi chuẩn hoá (chữ thường, bỏ dấu câu và dấu nháy).
const DICT_FILE = path.resolve(__dirname, String(arg('dict-file', 'data/nghe-chep-700.json')));
let DICTQ = null;
const dictate = require('./dictate'); // chuẩn hoá & so khớp câu (số, biến thể Anh–Mỹ, liền/tách…)
function pickDict() {
  if (!DICTQ) {
    DICTQ = { qs: JSON.parse(fs.readFileSync(DICT_FILE, 'utf8')).questions, bag: [] };
    enAudio.allowText(DICTQ.qs.map((q) => q.s)); // cho phép /api/say đọc đúng các câu này
    console.log(`🎙️ Nghe – chép: ${DICTQ.qs.length} câu từ ${path.relative(__dirname, DICT_FILE)}`);
  }
  if (!DICTQ.bag.length) DICTQ.bag = shuffle(DICTQ.qs);
  return DICTQ.bag.pop();
}
// Chữ cái hiện dần: 0,1,2… = số loại chữ đã hiện (mỗi 2 giây thêm 1, không tự hiện hết); hiện hết khi công bố
function dictLevel() { return Math.floor((now() - timer.startedAt) / 2000); }
function dictWords(rev) { // chỉ gửi những chữ ĐÃ hiện (chưa hiện = ''), dấu câu luôn hiện
  const D = round.dict, shown = new Set(rev ? D.order : D.order.slice(0, dictLevel()));
  return D.q.s.split(' ').map((t) => {
    const m = t.match(/^([A-Za-z]+)([^A-Za-z]*)$/);
    return { c: [...m[1]].map((ch) => (shown.has(ch.toLowerCase()) ? ch : '')), p: m[2] };
  });
}
function errReveal() {
  const q = round.err;
  let top = null;
  for (const [w, set] of round.guess) if (w !== q.wrong.toLowerCase() && set.size >= 2 && (!top || set.size > top.n)) top = { w, n: set.size };
  return { wrong: q.wrong, right: q.right, loai: q.loai, why: q.why, tip: q.tip || null, top };
}

// Giải ô chữ: ô chữ làm sẵn trong data/o-chu-600.json (build_o_chu.js): từ khoá n chữ cái + n hàng, hàng i là một từ tiếng Anh chứa chữ cái thứ i của từ khoá
// (chữ đó nằm ở cột dọc chung). Gợi ý mỗi hàng là nghĩa tiếng Việt + số chữ cái. Mỗi lượt chọn ngẫu nhiên một hàng chưa chơi, 30 giây:
//   chữ thường = giải hàng (đúng thì 10/5/3/1 theo thứ tự; hàng điền ngay khi có người đúng, những người sau còn CROSS_GRACE giây),
//   CHỮ HOA (≥2 chữ cái, toàn in hoa) = thử từ khoá: chỉ khi đã giải HƠN 50% số hàng, mỗi người một lần cho mỗi hàng; đúng đầu tiên +50 và hết ô chữ.
// Hàng hết giờ không ai giải thì hiện đáp án, không tính điểm và không tính vào ">50%". Hết hàng mà chưa ai giải từ khoá (và đã >50%) thì có một vòng từ khoá cuối.
const CROSS_FILE = path.resolve(__dirname, String(arg('cross-file', 'data/o-chu-600.json')));
const CROSS_GRACE = 10;
let CROSS = null;
function pickPuzzle() {
  if (!CROSS) {
    CROSS = { ps: JSON.parse(fs.readFileSync(CROSS_FILE, 'utf8')).puzzles, bag: [] };
    console.log(`🔠 Giải ô chữ: ${CROSS.ps.length} ô chữ từ ${path.relative(__dirname, CROSS_FILE)}`);
  }
  if (!CROSS.bag.length) CROSS.bag = shuffle(CROSS.ps);
  return CROSS.bag.pop();
}
const crossBigOpen = () => game.cross.solved * 2 > game.cross.p.rows.length;
function startCross() {
  const p = pickPuzzle();
  game.cross = { p, rows: p.rows.map(() => ({ state: 'open', by: null })), solved: 0, done: false, keyBy: null, keyRound: false, queue: shuffle(p.rows.map((_, i) => i)) };
  game.total = p.rows.length;
  startCrossClue(game.cross.queue.pop());
}
function startCrossClue(idx) {
  const C = game.cross, row = C.p.rows[idx];
  game.qNo++;
  questionsTotal++;
  round = { mode: 'cross', stage: 'clue', idx, sec: SEGMENTS.crossword.sec, word: { w: 'Ô chữ', m: row.w, r: '', pos: '' }, accept: new Set([row.w, ...(row.acc || [])].map((x) => x.toLowerCase())),
    bigTried: new Set(), solved: null, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, demo: row.w };
  setPhase('question', round.sec);
  push();
  sim?.onCross?.(round, C);
}
function startCrossKey() { // vòng cuối: mọi hàng đã có kết quả, đã >50% nhưng chưa ai giải từ khoá
  const C = game.cross;
  C.keyRound = true;
  game.qNo++;
  questionsTotal++;
  round = { mode: 'cross', stage: 'key', idx: -1, sec: SEGMENTS.crossword.sec, word: { w: 'Ô chữ', m: C.p.key, r: '', pos: '' }, accept: new Set(), bigTried: new Set(), solved: null,
    winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, demo: C.p.key.toUpperCase() };
  setPhase('question', round.sec);
  push();
  sim?.onCross?.(round, C);
}
function advanceCross() { // hết giờ một hàng (hoặc người dẫn bấm "Công bố"): hàng chưa ai giải thì thành "hết giờ"
  const C = game.cross;
  if (round.stage === 'clue' && !round.solved) C.rows[round.idx] = { state: 'missed', by: null };
  setPhase('reveal', C.done ? 8 : SEGMENTS.crossword.reveal);
  push();
}
function crossAfterReveal() {
  const C = game.cross;
  if (C.done) return endGame();
  const next = C.queue.pop();
  if (next != null) return startCrossClue(next);
  if (!C.keyRound && crossBigOpen()) return startCrossKey();
  return endGame();
}
function crossScore(user, item, base, rank, big) {
  const gp = gamePlayer(user), dp = user.bot ? { score: 0, correct: 0 } : dayPlayer(user);
  let pts = base;
  if (!big) {
    const b = boosts.get(user.uid) || 0;
    if (b > 0) { pts *= 2; boosts.set(user.uid, b - 1); }
  }
  gp.score += pts; gp.correct++; dp.score += pts; dp.correct++;
  if (rank === 0 && !user.bot) gp.first++;
  if (!user.bot) { game.correct++; correctTotal++; }
  round.winners.push(user.uid);
  Object.assign(item, { ok: true, pts, rank: rank + 1, bot: !!user.bot, words: big ? `🔑 ${item.text}` : item.text });
  round.feed.push(item);
  logFeed(item);
  broadcast({ type: 'correct', ...item });
}
// true = đã xử lý (trả lời hàng / thử từ khoá); false = coi như bình luận thường
function onCrossChat(user, msg, item) {
  const C = game.cross, R = round, t = msg.trim();
  if (!/^[A-Za-z]{2,}$/.test(t)) return false;
  if (/^[A-Z]{2,}$/.test(t)) { // CHỮ HOA = thử từ khoá (chữ đầu viết hoa kiểu "Class" vẫn tính là chữ thường vì điện thoại hay tự viết hoa)
    if (!crossBigOpen() || R.bigTried.has(user.uid)) return false;
    R.bigTried.add(user.uid);
    if (t.toLowerCase() !== C.p.key) {
      item.text = `${t} ✗ chưa đúng từ khoá`;
      logFeed(item);
      R.feed.push(item);
      push();
      return true;
    }
    item.text = t;
    crossScore(user, item, 50, 0, true);
    C.done = true;
    C.keyBy = user.name;
    advanceCross();
    return true;
  }
  if (R.stage !== 'clue' || R.answered.has(user.uid) || !R.accept.has(t.toLowerCase())) return false;
  const rank = R.realWinners++;
  item.text = t.toLowerCase();
  crossScore(user, item, ptsFor('crossword', rank), rank, false);
  R.answered.add(user.uid);
  if (!R.solved) { // người đúng đầu tiên: hàng điền ngay; những người sau còn CROSS_GRACE giây
    R.solved = user.name;
    C.rows[R.idx] = { state: 'solved', by: user.name };
    C.solved++;
    if (timer.endsAt != null) timer.endsAt = Math.min(timer.endsAt, Date.now() + CROSS_GRACE * 1000);
  }
  push();
  return true;
}

// ---------- khung ✏️ Điền từ và 🎧 Nghe – nghĩa (mốc 500) ----------
// Điền từ: câu làm sẵn trong data/dien-tu-500.json (câu thiếu 1 từ, 4 phương án, lời giải, lý do từng phương án sai). Sau khi chọn: hiện lời giải bằng chữ
// và đọc thành tiếng, kèm phương án SAI được chọn nhiều nhất (số phiếu thật của buổi live) với lý do "hay nhầm" soạn sẵn.
const FILL_FILE = path.resolve(__dirname, String(arg('fill-file', 'data/dien-tu-500.json')));
let FILL = null;
function pickFill() {
  if (!FILL) {
    FILL = { qs: JSON.parse(fs.readFileSync(FILL_FILE, 'utf8')).questions, bag: [] };
    console.log(`✏️ Điền từ: ${FILL.qs.length} câu từ ${path.relative(__dirname, FILL_FILE)}`);
  }
  if (!FILL.bag.length) FILL.bag = shuffle(FILL.qs);
  return FILL.bag.pop();
}
function fillReveal() {
  const q = round.fill, v = round.votes, total = v.reduce((a, b) => a + b, 0);
  const wrong = round.options.map((o, i) => (i === round.answerIdx ? null : { i, opt: o, reason: q.wrong[o] || '', pct: total ? Math.round((100 * v[i]) / total) : 0 })).filter(Boolean);
  const top = [...wrong].sort((a, b) => v[b.i] - v[a.i])[0];
  return { a: q.a, why: q.why, tip: q.tip || null, wrong, top: top && v[top.i] > 0 ? top.i : null, total };
}
// Nghe – nghĩa: phát audio một lần, ô chữ theo số chữ cái; cứ 2 giây hiện thêm 1 LOẠI chữ cái (hiện mọi chỗ chữ đó xuất hiện), 3 giây cuối hiện hết.
// Người xem chọn 1 trong 4 nghĩa tiếng Việt; 3 đáp án nhiễu cùng chủ đề (trường `topic` của từ) để gây nhiễu.
const viStop = new Set(['của', 'và', 'ở', 'là', 'được', 'một', 'các', 'những', 'cho', 'số']);
const viTok = (x) => { const t = new Set(); for (const m of x.vi) for (const k of m.toLowerCase().replace(/\(.*?\)/g, ' ').split(/\s+/)) if (k && !viStop.has(k)) t.add(k); return t; };
const viDisp = (x) => x.vi.slice(0, 2).join(', ');
function pickLmWord() {
  const W = loadWordQ();
  if (!W.lmBag?.length) W.lmBag = shuffle(W.list.filter((x) => x.w.length >= 3 && x.w.length <= 14 && x.vi?.length));
  return W.lmBag.pop();
}
function makeLmOptions(x) {
  const W = loadWordQ(), tx = viTok(x);
  const ok = (c) => c.w !== x.w && !(x.syn || []).includes(c.w) && !(c.syn || []).includes(x.w) && !(x.ant || []).includes(c.w) && !(c.ant || []).includes(x.w) && ![...viTok(c)].some((t) => tx.has(t));
  const cand = W.list.filter(ok);
  // ưu tiên: cùng chủ đề + cùng từ loại → cùng chủ đề → cùng từ loại → bất kỳ
  const tiers = [cand.filter((c) => c.topic && c.topic === x.topic && c.pos === x.pos), cand.filter((c) => c.topic && c.topic === x.topic), cand.filter((c) => c.pos === x.pos), cand];
  const out = [], seen = new Set([viDisp(x).toLowerCase()]), chosen = [];
  for (const tier of tiers) for (const c of shuffle(tier)) {
    if (out.length >= 3) break;
    const d = viDisp(c), tc = viTok(c);
    if (seen.has(d.toLowerCase()) || chosen.some((o) => [...tc].some((t) => viTok(o).has(t)))) continue;
    seen.add(d.toLowerCase());
    chosen.push(c);
    out.push(d);
  }
  const cap = (m) => m.charAt(0).toUpperCase() + m.slice(1);
  const options = shuffle([viDisp(x), ...out]).map(cap);
  return { options, answerIdx: options.indexOf(cap(viDisp(x))) };
}
function lmLevel() { // 0,1,2… = số loại chữ cái đã hiện (mỗi 2 giây thêm 1); 99 = hiện hết (3 giây cuối)
  const t = (now() - timer.startedAt) / 1000;
  return t >= SEGMENTS.listenmean.sec - 3 ? 99 : Math.floor(t / 2);
}
function lmSlots(rev) { // chỉ gửi những chữ ĐÃ hiện, chữ chưa hiện là '' (không để lộ đáp án trong trạng thái gửi đi)
  const lv = rev ? 99 : lmLevel(), shown = new Set(lv >= 99 ? round.lm.order : round.lm.order.slice(0, lv));
  return [...round.lm.word].map((ch) => (shown.has(ch) ? ch : ''));
}

// ---------- khung 🔗 Thế chữ (mốc 400) ----------
// Phiên = một chuỗi: ra một từ 4 chữ, hai đội luân phiên (Black đi trước ở phiên lẻ, White ở phiên chẵn) đổi ĐÚNG 1 chữ cái của từ hiện tại
// thành từ có nghĩa (toàn từ điển, dict.js), không lặp từ nào đã dùng trong phiên. Trong CHAIN_SEC giây người nào TRONG ĐỘI ĐANG ĐẾN LƯỢT gõ
// được từ hợp lệ đầu tiên thì từ đó thành đề bài của lượt sau (đội kia); hết giờ mà chưa có từ hợp lệ thì đội đó thua phiên.
// Không có điểm: chỉ thắng/thua, kỷ lục chuỗi (lưu data/the-chu-record.json), tỉ lệ hợp lệ của từng người và MVP (nhiều từ được dùng nhất).
// Vào đội: gõ "join" hoặc "tham gia" → tự vào đội ít người hơn (bằng nhau thì Black). Mỗi đội cần ít nhất CHAIN_MIN_TEAM người mới bắt đầu phiên.
const CHAIN_SEC = SEGMENTS.chain.sec;
const CHAIN_MIN_TEAM = 2;
const CHAIN_LOBBY_SEC = 10; // sảnh chờ / khoảng nghỉ trước phiên mới
const CHAIN_LOBBY_MAX = 90; // chờ quá ngần này giây mà chưa đủ người thì kết thúc lượt, sang khung khác
const CHAIN_REC_FILE = path.join(__dirname, 'data', 'the-chu-record.json');
const JOIN_RE = /^\s*(?:join|tham\s*gia|thamgia)\s*[!.~]*\s*$/i;
let chainRec = { len: 0 };
try { chainRec = JSON.parse(fs.readFileSync(CHAIN_REC_FILE, 'utf8')); } catch {}
const CHAIN_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
let CHAINDICT = null;
function chainDict() { // mọi chuỗi 4 chữ cái là từ hợp lệ (~2.700 từ, dựng một lần ~0,2 giây) + hàm láng giềng (đổi đúng 1 chữ cái)
  if (CHAINDICT) return CHAINDICT;
  const set = new Set();
  const rec = (p, str) => { if (p === 4) { if (dict.isWord(str)) set.add(str); return; } for (const c of CHAIN_LETTERS) rec(p + 1, str + c); };
  rec(0, '');
  const neighbors = (w) => { const r = []; for (let i = 0; i < w.length; i++) for (const c of CHAIN_LETTERS) if (c !== w[i]) { const x = w.slice(0, i) + c + w.slice(i + 1); if (set.has(x)) r.push(x); } return r; };
  // từ bắt đầu: từ 4 chữ trong bộ từ của mốc, có ít nhất 3 láng giềng (để đội đi trước không bị kẹt ngay)
  let pool = [];
  try { pool = loadWordQ().words; } catch {}
  if (!pool.length) pool = BANK_ALL.map((x) => x.w);
  const starts = [...new Set(pool.map((w) => String(w).toLowerCase()))].filter((w) => w.length === 4 && set.has(w) && neighbors(w).length >= 3);
  CHAINDICT = { set, neighbors, starts, recent: [] };
  console.log(`🔗 Thế chữ: ${set.size} từ 4 chữ hợp lệ, ${starts.length} từ bắt đầu · kỷ lục hiện tại ${chainRec.len || 0} từ`);
  return CHAINDICT;
}
const otherTeam = (t) => (t === 'black' ? 'white' : 'black');
const chainMembers = (team) => [...game.chain.members.values()].filter((m) => !team || m.team === team);
const teamsReady = () => chainMembers('black').length >= CHAIN_MIN_TEAM && chainMembers('white').length >= CHAIN_MIN_TEAM;

function chainJoin(user) {
  const C = game.chain;
  if (C.members.has(user.uid)) return;
  const b = chainMembers('black').length, w = chainMembers('white').length;
  const team = w < b ? 'white' : 'black'; // đội ít người hơn; bằng nhau → Black
  const z = () => ({ attempts: 0, valid: 0, adopted: 0 });
  C.members.set(user.uid, { uid: user.uid, name: user.name, avatar: user.avatar || '', team, cur: z(), tot: z() });
  logFeed({ name: user.name, avatar: user.avatar, text: `→ vào đội ${team === 'black' ? '⚫ Black' : '⚪ White'}` });
  broadcast({ type: 'chainJoin', name: user.name, team });
  push();
}

function startChainLobby(waited = 0) {
  round = { mode: 'chain', stage: 'lobby', waited, sec: CHAIN_LOBBY_SEC, word: { w: 'Thế chữ', m: '', r: '', pos: '' }, chain: [], used: new Set(), log: [],
    winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0 };
  setPhase('question', CHAIN_LOBBY_SEC);
  push();
  sim?.onChain?.(round, chainHelpers());
}

function startChainMatch() {
  const D = chainDict(), C = game.chain;
  game.qNo++;
  questionsTotal++;
  for (const m of C.members.values()) m.cur = { attempts: 0, valid: 0, adopted: 0 };
  const fresh = D.starts.filter((w) => !D.recent.includes(w));
  const pool = fresh.length ? fresh : D.starts;
  const start = pool[Math.floor(Math.random() * pool.length)];
  D.recent.push(start);
  if (D.recent.length > 20) D.recent.shift();
  round = { mode: 'chain', stage: 'turn', sec: CHAIN_SEC, cur: start, turn: game.qNo % 2 === 1 ? 'black' : 'white', used: new Set([start]), log: [],
    chain: [{ w: start, team: null, by: null }], word: { w: start, m: '', r: '', pos: '' }, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0 };
  setPhase('question', CHAIN_SEC);
  push();
  sim?.onChain?.(round, chainHelpers());
}

function chainHelpers() {
  return { members: (team) => chainMembers(team).map((m) => ({ uid: m.uid, name: m.name, avatar: m.avatar })), isMember: (uid) => game.chain.members.has(uid), neighbors: chainDict().neighbors };
}

// lượt hiện tại hết giờ (hoặc người dẫn bấm "Công bố") → đội đang đến lượt thua phiên
function endChainMatch() {
  const C = game.chain, loser = round.turn, winner = otherTeam(loser), len = round.chain.length;
  C.wins[winner]++;
  const row = (m) => ({ name: m.name, avatar: m.avatar, attempts: m.cur.attempts, valid: m.cur.valid, adopted: m.cur.adopted });
  const best = (list) => [...list].filter((m) => m.adopted > 0).sort((a, b) => b.adopted - a.adopted || b.valid / b.attempts - a.valid / a.attempts)[0] || null;
  const teamStat = (t) => { const rows = chainMembers(t).map(row).filter((r) => r.attempts > 0 || r.adopted > 0).sort((a, b) => b.adopted - a.adopted || b.valid - a.valid);
    return { n: chainMembers(t).length, rows: rows.slice(0, 6), mvp: best(rows)?.name || null }; };
  const all = chainMembers().map((m) => ({ ...row(m), team: m.team }));
  const mvp = best(all);
  const isNew = len > (chainRec.len || 0);
  if (isNew) {
    chainRec = { len, words: round.chain.map((c) => c.w), at: new Date().toISOString().slice(0, 10), winner, mvp: mvp?.name || null };
    fs.writeFile(CHAIN_REC_FILE, JSON.stringify(chainRec), () => {});
  }
  const stats = { winner, loser, len, isNew, record: chainRec.len, black: teamStat('black'), white: teamStat('white'), mvp: mvp ? { name: mvp.name, avatar: mvp.avatar, team: mvp.team, adopted: mvp.adopted } : null };
  C.matches.push({ len, winner, mvp: stats.mvp?.name || null });
  round.stage = 'over';
  round.stats = stats;
  console.log(`🔗 Phiên ${game.qNo}: ${winner} thắng, chuỗi ${len} từ${isNew ? ' (KỶ LỤC MỚI)' : ''}: ${round.chain.map((c) => c.w).join(' → ')}`);
  prev = { w: round.chain[0].w, m: `chuỗi ${len} từ`, n: 0 };
  setPhase('reveal', SEGMENTS.chain.reveal);
  push();
}

function advanceChain() {
  if (round.stage === 'lobby') {
    if (teamsReady()) return startChainMatch();
    if (round.waited + CHAIN_LOBBY_SEC >= CHAIN_LOBBY_MAX) {
      console.log('🔗 Thế chữ: chưa đủ người mỗi đội sau ' + CHAIN_LOBBY_MAX + 's → kết thúc lượt, sang khung khác');
      return endGame();
    }
    return startChainLobby(round.waited + CHAIN_LOBBY_SEC);
  }
  return endChainMatch();
}

function chainSummary() {
  const C = game.chain;
  const top = chainMembers().sort((a, b) => b.tot.adopted - a.tot.adopted || b.tot.valid / (b.tot.attempts || 1) - a.tot.valid / (a.tot.attempts || 1))[0];
  return { wins: C.wins, matches: C.matches, players: C.members.size, record: chainRec, longest: Math.max(0, ...C.matches.map((m) => m.len)),
    mvp: top && top.tot.adopted > 0 ? { name: top.name, avatar: top.avatar, team: top.team, adopted: top.tot.adopted } : null };
}

// Mọi bình luận trong khung Thế chữ đi qua đây (không dùng đường chấm điểm chung). Người xem gõ từ khi đúng đội đang đến lượt thì mới tính lần thử.
function onChainChat(user, msg, item) {
  const C = game.chain, R = round;
  if (JOIN_RE.test(msg)) return chainJoin(user);
  const m = C?.members.get(user.uid);
  const w = msg.trim().toLowerCase().replace(/[.!?]+$/, '');
  if (m && R?.mode === 'chain' && R.stage === 'turn' && phase === 'question' && m.team === R.turn && /^[a-z]{2,15}$/.test(w)) {
    m.cur.attempts++;
    m.tot.attempts++;
    const cur = R.cur;
    let why = null;
    if (w.length !== cur.length) why = `phải đủ ${cur.length} chữ cái`;
    else {
      let diff = 0;
      for (let i = 0; i < w.length; i++) if (w[i] !== cur[i]) diff++;
      if (diff !== 1) why = diff === 0 ? 'giống từ hiện tại' : 'chỉ được đổi 1 chữ cái';
    }
    if (!why && R.used.has(w)) why = 'từ đã dùng';
    if (!why && !dict.isWord(w)) why = 'không có trong từ điển';
    R.log.push({ name: user.name, w, ok: !why, why });
    if (R.log.length > 4) R.log.shift();
    logFeed({ ...item, text: why ? `${w} ✗ ${why}` : `${w} ✓` });
    if (why) return push();
    m.cur.valid++; m.tot.valid++; m.cur.adopted++; m.tot.adopted++;
    R.used.add(w);
    R.chain.push({ w, team: m.team, by: m.name });
    R.cur = w;
    R.word.w = w;
    R.turn = otherTeam(m.team);
    setPhase('question', CHAIN_SEC);
    push();
    return sim?.onChain?.(R, chainHelpers());
  }
  logFeed(item);
  if (!user.bot) ai.hear(user, msg);
}

// ---------- chuẩn hoá đáp án ----------
const norm = (s) => String(s || '').toLowerCase().normalize('NFC').replace(/[\s\-'’.,!?~"]/g, '');


// ---------- trạng thái ----------
// Điểm cả ngày (bảng vàng): uid -> {uid, name, avatar, score, correct, wins}
const scores = new Map();
const boosts = new Map(); // uid -> số câu còn được x2 (từ quà), giữ qua các lượt
let phase = null; // 'break' | 'question' | 'reveal' | 'podium'
let timer = { startedAt: 0, endsAt: null }; // endsAt null = chờ người dẫn
let pausedAt = null;
let round = null; // câu hiện tại
let game = null; // lượt hiện tại / vừa xong
let gameNo = 0;
let podium = null; // kết quả lượt vừa xong (màn vinh danh)
let prev = null;
let outro = null; // màn cảm ơn cuối phiên: khi bật thì đứng yên
const sessionGifters = new Map();
let questionsTotal = 0;
let correctTotal = 0;
let sessionStart = Date.now();
let viewers = 0;
const controlFeed = []; // mọi bình luận/quà cho màn điều khiển
const tiktok = { mode: SIM ? 'sim' : TIKTOK_USER ? 'tiktok' : 'none', user: TIKTOK_USER, connected: false, roomId: null, error: null };

// Chạy thử (--sim) ghi file riêng để điểm ảo không lẫn vào bảng điểm live thật.
const SCORE_FILE = path.join(__dirname, 'data', `scores-${SIM ? 'sim-' : ''}${TAG ? TAG + '-' : ''}${new Date().toISOString().slice(0, 10)}.json`);
try {
  for (const s of JSON.parse(fs.readFileSync(SCORE_FILE, 'utf8'))) scores.set(s.uid, { wins: 0, ...s });
  console.log(`Nạp ${scores.size} người chơi từ ${path.basename(SCORE_FILE)}`);
} catch {}

function saveScores() {
  fs.writeFile(SCORE_FILE, JSON.stringify([...scores.values()]), () => {});
}

// Từ đã hỏi được ghi ra file → không lặp lại giữa các lần chạy server. Chỉ khi đã hỏi hết kho của mức đang chọn
// mới quay vòng lại (mức easy 3,6k từ ≈ 146 lượt × 25 câu). Chạy thử --sim ghi file riêng để không ăn vào kho live.
const USED_FILE = path.join(__dirname, 'data', `used-words${SIM ? '-sim' : ''}${TAG ? '-' + TAG : ''}.json`);
let used = new Set();
try {
  used = new Set(JSON.parse(fs.readFileSync(USED_FILE, 'utf8')));
  console.log(`Đã hỏi ${used.size} từ ở các lần trước (${path.basename(USED_FILE)}) — bỏ qua các từ này`);
} catch {}
const saveUsed = () => fs.writeFile(USED_FILE, JSON.stringify([...used]), () => {});

// Ghép chữ: xáo CHỮ CÁI của 1 từ đơn 4–7 chữ (thẻ đánh số 1–9), đủ chữ khác nhau để xáo mới có nghĩa
const scrambleOK = (x) => /^[a-z]{4,7}$/i.test(x.w) && new Set(x.w.toLowerCase()).size > 2;
const scramble3 = (x) => /^[a-z]{5,6}$/i.test(x.w) && new Set(x.w.toLowerCase()).size > 3; // ưu tiên 5–6 chữ (4 chữ dễ quá, 7 chữ dài)
// Nghe & gõ chính tả: 1 từ đơn 3–10 chữ (cụm từ có dấu cách khó gõ cho đúng)
const typeOK = (x) => /^[a-z]{3,10}$/i.test(x.w);
function pickWord(pred) {
  if (pred === scramble3 && !BANK.some((x) => !used.has(x.w) && scramble3(x))) pred = scrambleOK;
  if (pred) {
    const p = BANK.filter((x) => !used.has(x.w) && pred(x));
    if (p.length) {
      const w = p[Math.floor(Math.random() * p.length)];
      used.add(w.w);
      saveUsed();
      return w;
    }
  }
  let pool = BANK.filter((x) => !used.has(x.w));
  if (!pool.length) {
    // Hết sạch kho mức này: xoá các từ của mức này khỏi danh sách đã hỏi rồi quay vòng
    console.log(`Đã hỏi hết ${BANK.length} từ mức ${CFG.level} → bắt đầu vòng mới`);
    for (const x of BANK) used.delete(x.w);
    pool = BANK;
  }
  const w = pool[Math.floor(Math.random() * pool.length)];
  used.add(w.w);
  saveUsed();
  return w;
}

// ---------- Lớp học ----------
const SEATS = 24; // 6 cột × 4 hàng
const seats = new Map(); // uid -> {uid, name, avatar, bot, idx, lastAt, stars}
function seat(user) {
  if (CFG.style === 'quiz' || !user?.uid) return null;
  let st = seats.get(user.uid);
  if (st) {
    st.lastAt = Date.now();
    st.name = user.name;
    if (user.avatar) st.avatar = user.avatar;
    return st;
  }
  const taken = new Set([...seats.values()].map((x) => x.idx));
  let idx = [...Array(SEATS).keys()].find((i) => !taken.has(i));
  if (idx == null) {
    // lớp đầy: mời bạn ảo trước, rồi người lâu không nói gì ra về nhường chỗ (người thật mới không bao giờ phải đứng)
    const out = [...seats.values()].sort((a, b) => (b.bot ? 1 : 0) - (a.bot ? 1 : 0) || a.lastAt - b.lastAt)[0];
    if (!user.bot || out.bot) {
      seats.delete(out.uid);
      idx = out.idx;
    } else return null;
  }
  st = { uid: user.uid, name: user.name, avatar: user.avatar || '', bot: !!user.bot, idx, lastAt: Date.now(), stars: 0 };
  seats.set(user.uid, st);
  return st;
}
const seatList = () => [...seats.values()].map(({ name, avatar, idx, stars, uid }) => ({ name, avatar, idx, stars, called: round?.called?.uid === uid }));
function pickGroup(n) {
  const fresh = BANK.filter((x) => !used.has(x.w));
  if (fresh.length < n) for (const x of BANK) used.delete(x.w);
  const first = pickWord();
  // cùng khoá + cùng bài → nhóm từ cùng chủ đề như một bài học thật
  const mates = BANK.filter((x) => !used.has(x.w) && x.cid === first.cid && x.lesson === first.lesson).sort(() => Math.random() - 0.5);
  const out = [first];
  for (const x of mates) {
    if (out.length >= n) break;
    used.add(x.w);
    out.push(x);
  }
  while (out.length < n) out.push(pickWord());
  saveUsed();
  return out;
}
// Gọi tên: ưu tiên người thật vừa hoạt động (3 phút) và lâu chưa được gọi; không có ai thì gọi một bạn ảo đang ngồi.
const lastCalled = new Map();
function pickCalled() {
  const list = [...seats.values()];
  const real = list.filter((x) => !x.bot && Date.now() - x.lastAt < 180000);
  const pool = real.length ? real : list.filter((x) => x.bot);
  if (!pool.length) return null;
  pool.sort((a, b) => (lastCalled.get(a.uid) || 0) - (lastCalled.get(b.uid) || 0) || Math.random() - 0.5);
  const c = pool[Math.floor(Math.random() * Math.min(2, pool.length))];
  lastCalled.set(c.uid, Date.now());
  return { uid: c.uid, name: c.name, avatar: c.avatar, bot: c.bot };
}

function upsert(map, user, extra) {
  let p = map.get(user.uid);
  if (!p) {
    p = { uid: user.uid, name: user.name, avatar: user.avatar, ...extra };
    map.set(user.uid, p);
  }
  p.name = user.name || p.name;
  if (user.avatar) p.avatar = user.avatar;
  return p;
}
const dayPlayer = (u) => upsert(scores, u, { score: 0, correct: 0, wins: 0 });
const gamePlayer = (u) => upsert(game.players, u, { score: 0, correct: 0, first: 0 });

const pub = ({ name, avatar, score, correct, wins, first, uid, bot }) => ({ name, avatar, score, correct, wins, first, x2: boosts.get(uid) || 0, ...(bot && { bot: true }) });
const ranked = (map) => [...map.values()].sort((a, b) => b.score - a.score || b.correct - a.correct);
const dayBoard = (n = 8) => ranked(scores).slice(0, n).map(pub);
const gameBoard = (n = 8) => (game ? ranked(game.players).slice(0, n).map(pub) : []);

const now = () => pausedAt || Date.now();
// Mức gợi ý theo thời gian: 0 = ô trống (biết số chữ cái), 1 = hiện chữ cái đầu, 2 = mở thêm 1 chữ.
function hintLevel() {
  const t = (now() - timer.startedAt) / (timer.endsAt - timer.startedAt);
  return t >= 0.7 ? 2 : t >= 0.35 ? 1 : 0;
}

function slots(level) {
  return [...round.word.w].map((ch, i) => {
    if (phase === 'reveal') return { ch, kind: 'full' };
    if ((level >= 1 && i === 0) || (level >= 2 && i === round.openIdx)) return { ch, kind: 'cho' };
    return { ch: '', kind: 'empty' };
  });
}

// Phát âm tiếng Anh: server lấy từ dịch vụ đọc của Migii (audio.eupgroup.net, cùng dịch vụ app dùng) rồi lưu cache
// ở data/en-audio/ — xem /api/say bên dưới. Lỗi thì trang tự đọc bằng giọng tiếng Anh của trình duyệt.
const audioUrl = (w) => `api/say?w=${encodeURIComponent(w)}`;
// Phiên bản giao diện (giờ sửa file trang): màn live thấy đổi thì tự tải lại lúc nghỉ giữa khung, khỏi chạy bản trang cũ sau khi sửa code
let UI_VER = { t: 0, v: '' };
function uiVer() {
  const n = Date.now();
  if (n - UI_VER.t > 2000) UI_VER = { t: n, v: ['index.html', 'theme-light.css'].map((f) => { try { return Math.round(fs.statSync(path.join(__dirname, 'public', f)).mtimeMs); } catch { return 0; } }).join('.') };
  return UI_VER.v;
}
const gameInfo = () => game && { no: game.no, qNo: game.qNo, total: game.total };

function outroState() {
  return {
    type: 'state',
    phase: 'outro',
    top: dayBoard(3),
    gifters: [...sessionGifters.values()].sort((a, b) => b.diamonds - a.diamonds).slice(0, 8),
    stats: { games: gameNo, rounds: questionsTotal, players: scores.size, correct: correctTotal, minutes: Math.round((Date.now() - sessionStart) / 60000) },
    next: outro.next || '',
  };
}

// Trạng thái gửi màn livestream — KHÔNG bao giờ chứa đáp án khi đang hỏi.
function publicState() {
  if (outro) return outroState();
  if (!phase) return { type: 'state', phase: 'idle' };
  const s = {
    type: 'state',
    ui: uiVer(),
    phase,
    paused: !!pausedAt,
    startedAt: timer.startedAt,
    endsAt: timer.endsAt,
    pausedAt,
    now: Date.now(),
    game: gameInfo(),
    nextGame: gameNo + 1,
    cfg: { questions: CFG.questions, roundSec: CFG.roundSec, music: CFG.music, voice: CFG.voice, neu: tts.enabled, mode: CFG.mode, style: CFG.style, teachSec: CFG.teachSec, ...(MUTE && { mute: true }) },
    seg: segPub(curSeg()),
    next: segPub(segFor()),
    program: CFG.style === 'program' ? PROGRAM.map((k) => ({ id: k, icon: SEGMENTS[k].icon, name: SEGMENTS[k].name })) : null,
    players: phase === 'break' ? scores.size : (game?.chain ? game.chain.members.size : game?.players.size) || 0,
    viewers,
    live: tiktok.mode === 'sim' ? 'sim' : tiktok.connected ? 'live' : 'off',
  };
  if (curSeg() === 'class') s.seats = seatList();
  if (game?.teams && phase !== 'break') s.teams = game.teams.map(teamPub);
  if (phase === 'break') {
    s.board = dayBoard(3);
  } else if (phase === 'teach') {
    const L = game.lesson;
    const x = L.words[L.i];
    s.lesson = { title: `${x.course} · ${x.lesson}`, course: x.course, i: L.i, n: L.words.length, w: x.w, r: x.r, m: x.m, pos: x.pos, ex: x.ex, exm: x.exm,
      audio: audioUrl(x.w), done: L.words.slice(0, L.i).map((y) => ({ w: y.w, m: y.m })) };
    s.board = gameBoard();
  } else if (phase === 'podium') {
    s.podium = podium;
  } else {
    const rev = phase === 'reveal';
    if (round.mode === 'mcq') {
      // Từ tiếng Anh + phiên âm hiện NGAY (đáp án là nghĩa). Câu "nghe": giấu chữ/phiên âm tới lúc công bố.
      const showWord = rev || !round.listen;
      s.q = {
        mode: 'mcq',
        listen: round.listen,
        rev: !!round.rev,
        mean: round.rev ? round.word.m : undefined,
        w: showWord && (!round.rev || rev) ? round.word.w : null,
        r: showWord ? round.word.r : null,
        pos: showWord && !round.rev ? round.word.pos : null,
        audio: audioUrl(round.word.w),
        options: round.options,
        answer: rev ? round.answerIdx : null,
        votes: rev ? round.votes : null,
        m: rev || round.rev ? round.word.m : null,
        // khung Word: đáp án hiện A–D; wq.t = w2m | m2w | syn | ant; ansAudio = phát âm đáp án (khi công bố)
        ...(round.wq && { wq: round.wq, ansAudio: rev && ['m2w', 'syn', 'ant', 'fill'].includes(round.wq.t) ? audioUrl(round.options[round.answerIdx]) : null }),
        ...(round.fill && { fill: { s: round.fill.s, ...(rev && fillReveal()) } }), // lời giải chỉ gửi khi công bố
        ...(round.lm && { lm: { slots: lmSlots(rev) } }),
        ...(round.read && { read: { kind: round.read.q.kind, title: round.read.q.title, p: round.read.q.p, q: round.read.q.q, key: rev ? round.read.q.key : null } }),
      };
      s.winners = round.winners.length;
      s.answered = round.answered.size;
      if (round.called) s.called = { name: round.called.name, avatar: round.called.avatar, result: rev ? round.called.result || 'none' : null };
      if (round.right) s.right = rev ? round.right : null; // tên người đúng (lớp học: tô xanh bàn)
      if (rev) s.wrongNames = round.feed.filter((f) => f.choice && !f.ok).map((f) => f.name);
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'dictate') {
      const q = round.dict.q;
      s.q = { mode: 'dictate', words: dictWords(rev), n: round.dict.words.length, audio: audioUrl(q.s), ...(rev && { s: q.s, vi: q.vi, w: q.w }) };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'errhunt') {
      s.q = { mode: 'errhunt', s: round.err.s, ...(rev && errReveal()) };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'cross') {
      const C = game.cross, p = C.p, n = p.rows.length, full = C.done || (rev && round.stage === 'key');
      const rows = p.rows.map((r, i) => ({ len: r.w.length, pos: r.pos, state: C.rows[i].state, by: C.rows[i].by, letters: full || C.rows[i].state !== 'open' ? r.w : null }));
      const cur = round.idx >= 0 ? p.rows[round.idx] : null;
      s.q = { mode: 'cross', stage: round.stage, n, rows, active: round.stage === 'clue' ? round.idx : -1, solved: C.solved, need: Math.floor(n / 2) + 1, done: C.done, keyBy: C.keyBy,
        clue: cur ? { no: round.idx + 1, vi: cur.vi, len: cur.w.length } : null,
        key: { len: p.key.length, vi: p.keyVi, open: crossBigOpen(), letters: p.rows.map((r, i) => (full || C.rows[i].state !== 'open' ? r.w[r.pos] : '')), word: full ? p.key : null },
        result: rev && cur ? { answer: cur.w, by: C.rows[round.idx].by } : null, turnKey: `${game.qNo}.${phase}` };
      s.winners = round.winners.length;
      s.prev = null;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'chain') {
      const C = game.chain, T = (t) => { const ms = chainMembers(t); return { n: ms.length, names: ms.slice(0, 14).map((m) => m.name) }; };
      s.q = { mode: 'chain', stage: round.stage, match: round.stage === 'lobby' ? game.qNo + 1 : game.qNo, matches: game.total, cur: round.cur || null, turn: round.turn || null,
        min: CHAIN_MIN_TEAM, waited: round.waited || 0, chain: round.chain.slice(-16).map(({ w, team }) => ({ w, team })), chainLen: round.chain.length, log: round.log,
        teams: { black: T('black'), white: T('white') }, wins: C.wins, record: { len: chainRec.len || 0, at: chainRec.at || null, mvp: chainRec.mvp || null },
        stats: round.stage === 'over' ? round.stats : null, turnKey: `${game.qNo}.${round.stage}.${round.chain.length}` };
      s.winners = 0;
      s.prev = prev;
      s.board = [];
      s.feed = [];
      return s;
    }
    if (round.mode === 'hunt') {
      const h = round.hunt, cell = ({ w, r, c, d, by }) => ({ w, r, c, d, ...(by && { by }) });
      s.q = { mode: 'hunt', grid: h.grid, need: HUNT_NEED, total: h.hidden.length, finished: round.winners.length,
        found: [...h.found.values()].map(cell), hidden: rev ? h.hidden.map((w) => cell(h.found.get(w) || h.map.get(w))) : null };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'startend') {
      s.q = { mode: 'startend', k: round.pat.k, s: round.pat.s, n: 5, examples: rev ? round.pat.examples.slice(0, 8) : null };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'scramble') {
      const lv = rev ? 2 : hintLevel();
      s.q = { mode: 'scramble', m: round.word.m, tiles: round.tiles, hint: rev ? [] : round.order.slice(0, lv), answer: rev ? round.order.map((i) => i + 1).join('') : null,
        r: rev ? round.word.r : null, w: rev ? round.word.w : null, audio: rev ? audioUrl(round.word.w) : null };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    s.q = {
      mode: 'type',
      m: round.word.m,
      pos: round.word.pos,
      course: round.word.course,
      slots: slots(hintLevel()),
      r: rev ? round.word.r : null,
      w: rev ? round.word.w : null,
      audio: audioUrl(round.word.w), // nghe & gõ: phát âm ngay từ đầu câu
    };
    s.winners = round.winners.length;
    s.prev = prev;
    s.board = gameBoard();
    s.feed = round.feed.slice(-12);
  }
  return s;
}

// Trạng thái cho màn điều khiển: có đáp án, cấu hình, trạng thái kết nối, bảng đầy đủ.
function controlState() {
  return {
    type: 'control',
    phase: outro ? 'outro' : phase,
    paused: !!pausedAt,
    startedAt: timer.startedAt,
    endsAt: timer.endsAt,
    pausedAt,
    now: Date.now(),
    game: gameInfo(),
    gameNo,
    answer: round && (phase === 'question' || phase === 'reveal')
      ? { ...round.word, winners: round.winners.length, hint: phase === 'question' && round.mode === 'type' ? hintLevel() : 2,
          mode: round.mode, options: round.options, answerIdx: round.answerIdx, votes: round.votes, listen: round.listen, answered: round.answered.size, called: round.called,
          wq: round.wq, demo: round.demo, ...(round.fill && { fillS: round.fill.s }), ...(round.err && { errS: round.err.s }), ...(round.dict && { dictS: round.dict.q.s }), ...(round.read && { readQ: round.read.q.q }),
          ...(round.mode === 'cross' && { cross: { stage: round.stage, idx: round.idx, solved: game.cross.solved, n: game.cross.p.rows.length, key: game.cross.p.key, open: crossBigOpen() } }),
          ...(round.mode === 'chain' && { chain: { stage: round.stage, cur: round.cur, turn: round.turn, len: round.chain.length, black: chainMembers('black').length, white: chainMembers('white').length } }) }
      : null,
    lesson: phase === 'teach' && game?.lesson ? (({ words, i }) => ({ i, n: words.length, w: words[i].w, m: words[i].m, title: words[i].lesson }))(game.lesson) : null,
    cfg: CFG,
    seg: segPub(curSeg()),
    next: segPub(segFor()),
    program: PROGRAM,
    teams: game?.teams ? game.teams.map(teamPub) : null,
    bankSize: BANK.length,
    bankLeft: BANK.filter((x) => !used.has(x.w)).length,
    tts: { enabled: tts.enabled, voice: tts.VOICE },
    ai: { ready: ai.ready, model: ai.model, enabled: CFG.ai, ...ai.stats },
    tiktok,
    viewers,
    gameBoard: gameBoard(15),
    dayBoard: dayBoard(15),
    dayPlayers: scores.size,
    podium,
    outroNext: outro?.next ?? null,
    feed: controlFeed.slice(-40),
    stats: { games: gameNo, questions: questionsTotal, correct: correctTotal, minutes: Math.round((Date.now() - sessionStart) / 60000) },
  };
}

function push() {
  broadcast(publicState());
  sendControl();
}

// ---------- vòng chơi ----------
function setPhase(p, sec) {
  phase = p;
  pausedAt = null;
  const t = Date.now();
  timer = { startedAt: t, endsAt: sec == null ? null : t + sec * 1000 };
}

// hold = đứng ở màn chờ tới khi người dẫn bấm Bắt đầu (lúc mới bật server và sau "Chơi lại từ đầu")
let holdBreak = false;
function startBreak(hold = false) {
  round = null;
  holdBreak = hold;
  setPhase('break', CFG.autoNext && !hold ? CFG.breakSec : null);
  push();
}

function startGame() {
  BANK = bankFor(CFG.level);
  gameNo++;
  const seg = segFor();
  if (CFG.style === 'program') progIdx++;
  game = { no: gameNo, seg, total: SEGMENTS[seg]?.total || CFG.questions, qNo: 0, players: new Map(), gifters: new Map(), correct: 0, startedAt: Date.now() };
  if (seg === 'team') {
    game.teams = makeTeams();
    game.teamOf = new Map();
  }
  podium = null;
  prev = null;
  console.log(`▶ Lượt ${gameNo}: ${game.total} câu · ${SEGMENTS[seg]?.sec || CFG.roundSec}s/câu · mức ${CFG.level} · ${SEGMENTS[seg]?.icon || ''} ${SEGMENTS[seg]?.name || seg}`);
  if (seg === 'class') {
    game.style = 'class';
    if (!SIM && CFG.bots > 0) {
      const names = bots.names().sort(() => Math.random() - 0.5).slice(0, CFG.bots);
      for (const n of names) seat({ uid: `bot:${n}`, name: n, avatar: '', bot: true });
    }
    return startTeach();
  }
  if (seg === 'chain') {
    game.chain = { members: new Map(), wins: { black: 0, white: 0 }, matches: [] };
    return startChainLobby();
  }
  if (seg === 'crossword') return startCross();
  startQuestion();
}

// Lớp học: giảng một nhóm từ (mỗi từ teachSec giây) rồi kiểm tra lần lượt các từ vừa học.
function startTeach() {
  const n = Math.min(CFG.group, game.total - game.qNo);
  if (n <= 0) return endGame();
  game.lesson = { words: pickGroup(n), i: 0 };
  round = null;
  setPhase('teach', CFG.teachSec);
  push();
}

// Tỉ lệ câu 🎧 nghe (giấu chữ). User bỏ 04/11 → 0; bật lại: --listen 0.3
const LISTEN_RATE = Math.min(1, Math.max(0, Number(arg('listen', 0)) || 0));

// 4 lựa chọn nghĩa: 1 đúng + 3 nhiễu (ưu tiên cùng từ loại + cùng mức, nghĩa khác hẳn, độ dài gần giống)
const nkey = (m) => String(m).toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');
function makeOptions(word) {
  const seen = new Set([nkey(word.m)]);
  const pool = BANK.filter((x) => x.w !== word.w && !seen.has(nkey(x.m)));
  const same = pool.filter((x) => x.cid === word.cid && Math.abs(x.m.length - word.m.length) <= 10);
  const samePos = word.pos ? same.filter((x) => x.pos === word.pos) : [];
  const out = [];
  for (const src of [samePos, same, pool]) {
    for (let i = 0; i < 60 && out.length < 3; i++) {
      const x = src[Math.floor(Math.random() * src.length)];
      if (!x || seen.has(nkey(x.m))) continue;
      seen.add(nkey(x.m));
      out.push(x.m);
    }
  }
  const options = [word.m, ...out].map((m) => m.charAt(0).toUpperCase() + m.slice(1));
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, answerIdx: options.findIndex((m) => nkey(m) === nkey(word.m)) };
}

// Chọn từ tiếng Anh: hiện nghĩa, 4 lựa chọn là 4 từ tiếng Anh (1 đúng + 3 nhiễu cùng từ loại/mức, nghĩa khác, độ dài gần giống)
function makeOptionsRev(word) {
  const seenW = new Set([word.w]), seenM = new Set([nkey(word.m)]);
  const pool = BANK.filter((x) => x.w !== word.w && !seenM.has(nkey(x.m)));
  const same = pool.filter((x) => x.cid === word.cid && Math.abs(x.w.length - word.w.length) <= 3);
  const samePos = word.pos ? same.filter((x) => x.pos === word.pos) : [];
  const out = [];
  for (const src of [samePos, same, pool]) {
    for (let i = 0; i < 60 && out.length < 3; i++) {
      const x = src[Math.floor(Math.random() * src.length)];
      if (!x || seenW.has(x.w) || seenM.has(nkey(x.m))) continue;
      seenW.add(x.w); seenM.add(nkey(x.m));
      out.push(x.w);
    }
  }
  const options = [word.w, ...out].sort(() => Math.random() - 0.5);
  return { options, answerIdx: options.indexOf(word.w) };
}

// Khung Word: câu làm sẵn, trả lời A–D. round.mode vẫn là 'mcq' nên chấm điểm, mô phỏng, bot dùng lại phần trắc nghiệm có sẵn.
function startWordQuestion() {
  const W = loadWordQ();
  const q = pickWordQ();
  game.qNo++;
  questionsTotal++;
  // m2w: đề là nghĩa tiếng Việt (round.rev như khung "Chọn từ tiếng Anh"); w2m/syn/ant: đề là từ tiếng Anh
  const word =
    q.t === 'm2w' ? { w: q.a, m: q.q, r: '', pos: W.pos.get(q.a) || '' }
    : q.t === 'w2m' ? { w: q.q, m: q.a, r: '', pos: W.pos.get(q.q) || '' }
    : { w: q.q, m: `${q.a} (${q.t === 'syn' ? 'đồng nghĩa' : 'trái nghĩa'})`, r: '', pos: '' };
  const cap = (s) => (q.t === 'w2m' ? s.charAt(0).toUpperCase() + s.slice(1) : s); // đáp án tiếng Việt viết hoa chữ đầu như các khung khác
  const options = shuffle([q.a, ...q.d]).map(cap);
  round = { word, sec: CFG.roundSec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'mcq',
    options, answerIdx: options.indexOf(cap(q.a)), votes: [0, 0, 0, 0], rev: q.t === 'm2w', listen: false, wq: { t: q.t }, secret: cap(q.a) };
  setPhase('question', CFG.roundSec);
  push();
  sim?.onQuestion(round);
  if (!SIM) {
    const realActive = [...realSeen.values()].filter((n) => questionsTotal - n <= 3).length;
    bots.onQuestion(round, { active: CFG.bots > 0 ? Math.max(Math.min(MIN_BOTS, CFG.bots), CFG.bots - realActive) : 0, bank: () => BANK });
  }
}

// Khung Start or End: một cụm chữ, 45 giây, người xem gõ 5 từ trong một bình luận (kiểm tra ở onChat)
function startEndQuestion() {
  const pat = startEnd().pick();
  game.qNo++;
  questionsTotal++;
  const label = pat.k === 'start' ? `${pat.s}…` : `…${pat.s}`;
  const sec = SEGMENTS.startend.sec;
  round = { word: { w: label, m: `ví dụ: ${pat.examples.slice(0, 5).join(', ')}`, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(),
    feed: [], lastHint: 0, mode: 'startend', pat, demo: pat.examples.slice(0, 5).join(' ') };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
}

// Khung Săn từ: một ma trận, 120 giây. round.hunt.map = mọi từ hợp lệ của bảng → vị trí; found = từ đã có người tìm (để tô màu trên ma trận)
function startHuntQuestion() {
  const b = pickBoard();
  game.qNo++;
  questionsTotal++;
  const sec = SEGMENTS.hunt.sec;
  round = { word: { w: 'Săn từ', m: `${b.hidden.length} từ giấu: ${b.hidden.join(', ')}`, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(),
    feed: [], lastHint: 0, mode: 'hunt', demo: b.hidden.slice(0, HUNT_NEED).join(' '),
    hunt: { grid: b.grid, hidden: b.hidden, map: new Map(b.words.map(([w, r, c, d]) => [w, { w, r, c, d }])), found: new Map(), progress: new Map() } };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
}

// Khung Điền từ: round.mode vẫn là 'mcq' (chấm điểm, mô phỏng, bot dùng lại phần trắc nghiệm); round.word.w KHÔNG phải đáp án để trạng thái gửi đi không lộ
function startFillQuestion() {
  const q = pickFill();
  game.qNo++;
  questionsTotal++;
  const options = shuffle(q.o), sec = SEGMENTS.fillin.sec;
  round = { word: { w: 'Điền từ', m: q.a, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'mcq',
    options, answerIdx: options.indexOf(q.a), votes: [0, 0, 0, 0], rev: false, listen: false, wq: { t: 'fill' }, fill: q, secret: q.a };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
  if (!SIM) {
    const realActive = [...realSeen.values()].filter((n) => questionsTotal - n <= 3).length;
    bots.onQuestion(round, { active: CFG.bots > 0 ? Math.max(Math.min(MIN_BOTS, CFG.bots), CFG.bots - realActive) : 0, bank: () => BANK });
  }
}

// Khung Đọc nhanh: bài làm sẵn trong data/doc-nhanh-700.json ({kind, title, p, q, o, a, key, why, wrong, tip}).
// round.mode vẫn là 'mcq' (chấm, mô phỏng, bot, lời giải dùng lại phần trắc nghiệm / Điền từ). Bài, câu hỏi và 4 phương án hiện cùng lúc
// (11/11: người chơi thử thấy ẩn bài rồi mới hỏi là khó, nên bỏ chặng đọc riêng).
const READ_FILE = path.resolve(__dirname, String(arg('read-file', 'data/doc-nhanh-700.json')));
let READQ = null;
function pickRead() {
  if (!READQ) {
    READQ = { qs: JSON.parse(fs.readFileSync(READ_FILE, 'utf8')).questions, bag: [] };
    console.log(`📰 Đọc nhanh: ${READQ.qs.length} bài từ ${path.relative(__dirname, READ_FILE)}`);
  }
  if (!READQ.bag.length) READQ.bag = shuffle(READQ.qs);
  return READQ.bag.pop();
}
function startReadQuestion() {
  const q = pickRead(), S = SEGMENTS.speedread, options = shuffle(q.o);
  game.qNo++;
  questionsTotal++;
  round = { word: { w: 'Đọc nhanh', m: q.a, r: '', pos: '' }, sec: S.sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'mcq',
    options, answerIdx: options.indexOf(q.a), votes: [0, 0, 0, 0], rev: false, listen: false, wq: { t: 'read' }, fill: q, read: { q }, secret: q.a };
  setPhase('question', S.sec);
  push();
  sim?.onQuestion(round);
  if (!SIM) {
    const realActive = [...realSeen.values()].filter((n) => questionsTotal - n <= 3).length;
    bots.onQuestion(round, { active: CFG.bots > 0 ? Math.max(Math.min(MIN_BOTS, CFG.bots), CFG.bots - realActive) : 0, bank: () => BANK });
  }
}

// Khung Nghe – chép
function startDictQuestion() {
  const q = pickDict(), sec = SEGMENTS.dictate.sec;
  game.qNo++;
  questionsTotal++;
  const norm = dictate.joined(q.s);
  round = { word: { w: 'Nghe – chép', m: q.s, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'dictate', demo: q.s,
    dict: { q, words: dictate.tokens(q.s), order: shuffle([...new Set(norm)]) } };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
}

// Khung Săn lỗi: một câu có đúng 1 từ sai
function startErrQuestion() {
  const q = pickErr(), sec = SEGMENTS.errhunt.sec;
  game.qNo++;
  questionsTotal++;
  round = { word: { w: 'Săn lỗi', m: `${q.wrong} → ${q.right}`, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'errhunt', err: q, guess: new Map() };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
}

// Khung Nghe – nghĩa: listen=true giấu từ đến lúc công bố; chữ cái hiện dần theo lmSlots()
function startListenMeanQuestion() {
  const x = pickLmWord(), { options, answerIdx } = makeLmOptions(x), sec = SEGMENTS.listenmean.sec;
  game.qNo++;
  questionsTotal++;
  round = { word: { w: x.w, m: viDisp(x), r: '', pos: x.pos || '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'mcq',
    options, answerIdx, votes: [0, 0, 0, 0], rev: false, listen: true, wq: { t: 'lm' }, lm: { word: x.w, order: shuffle([...new Set([...x.w])]) }, secret: options[answerIdx] };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
  if (!SIM) {
    const realActive = [...realSeen.values()].filter((n) => questionsTotal - n <= 3).length;
    bots.onQuestion(round, { active: CFG.bots > 0 ? Math.max(Math.min(MIN_BOTS, CFG.bots), CFG.bots - realActive) : 0, bank: () => BANK });
  }
}

function startQuestion(replace = false) {
  if (game.seg === 'word') return startWordQuestion();
  if (game.seg === 'startend') return startEndQuestion();
  if (game.seg === 'hunt') return startHuntQuestion();
  if (game.seg === 'fillin') return startFillQuestion();
  if (game.seg === 'listenmean') return startListenMeanQuestion();
  if (game.seg === 'errhunt') return startErrQuestion();
  if (game.seg === 'dictate') return startDictQuestion();
  if (game.seg === 'speedread') return startReadQuestion();
  const cls = game.style === 'class';
  const seg = game.seg;
  const word = cls && !replace && game.quiz?.length ? game.quiz.shift() : seg === 'scramble' ? pickWord(scramble3) : seg === 'type' || (CFG.style !== 'program' && CFG.mode === 'type') ? pickWord(typeOK) : pickWord();
  if (!replace) {
    game.qNo++;
    questionsTotal++;
  }
  const sec = SEGMENTS[seg]?.sec || CFG.roundSec;
  round = { word, sec, openIdx: 1 + Math.floor(Math.random() * Math.max(1, [...word.w].length - 1)), winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0,
    mode: { listen: 'mcq', team: 'mcq', type: 'type', scramble: 'scramble', class: 'mcq', reverse: 'mcq', quiz: CFG.style === 'program' ? 'mcq' : CFG.mode }[seg] || CFG.mode };
  if (round.mode === 'mcq') {
    Object.assign(round, seg === 'reverse' ? makeOptionsRev(word) : makeOptions(word));
    round.rev = seg === 'reverse';
    round.votes = [0, 0, 0, 0];
    round.listen = seg === 'listen' || (seg === 'quiz' && Math.random() < LISTEN_RATE); // 🎧 nghe chọn nghĩa: giấu chữ, chỉ phát âm
  }
  if (round.mode === 'scramble') {
    // thẻ đánh số 1..n; đáp án = thứ tự số (vd "312"). perm[j] = vị trí trong từ của thẻ j
    const sy = [...word.w.toLowerCase()]; // chữ thường hết: chữ hoa (August) sẽ lộ chữ cái đầu
    let perm = sy.map((_, i) => i);
    for (let k = 0; k < 30 && perm.map((i) => sy[i]).join('') === sy.join(''); k++) perm = [...perm].sort(() => Math.random() - 0.5);
    round.tiles = perm.map((i) => sy[i]);
    round.order = sy.map((_, k) => perm.indexOf(k)); // order[k] = thẻ (0-based) chứa âm tiết thứ k
  }
  if (cls) {
    round.mode = 'mcq';
    if (!round.options) {
      Object.assign(round, makeOptions(word));
      round.votes = [0, 0, 0, 0];
      round.listen = false;
    }
    round.right = [];
    round.called = pickCalled();
    // bạn ảo được gọi tên thì luôn giơ tay trả lời (70% đúng) — lớp học không bị im
    if (round.called?.bot) {
      const c = round.called, r = round;
      const k = Math.random() < 0.7 ? r.answerIdx : [0, 1, 2, 3].filter((i) => i !== r.answerIdx)[Math.floor(Math.random() * 3)];
      setTimeout(() => round === r && phase === 'question' && onChat({ uid: c.uid, name: c.name, avatar: '', bot: true }, String(k + 1)), (4 + Math.random() * 5) * 1000);
    }
  }
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
  if (!SIM) {
    // Càng nhiều người thật bình luận trong 3 câu gần nhất thì càng ít bot (giữ tối thiểu MIN_BOTS nếu đang bật)
    const realActive = [...realSeen.values()].filter((q) => questionsTotal - q <= 3).length;
    const active = CFG.bots > 0 ? Math.max(Math.min(MIN_BOTS, CFG.bots), CFG.bots - realActive) : 0;
    bots.onQuestion(round, { active, bank: () => BANK });
  }
}

function reveal() {
  setPhase('reveal', SEGMENTS[game.seg]?.reveal || CFG.revealSec);
  prev = { w: round.word.w, m: round.word.m, n: round.winners.length };
  saveScores();
  push();
}

function endGame() {
  if (phase === 'teach') round = null;
  if (phase === 'question') prev = { w: round.word.w, m: round.word.m, n: round.winners.length };
  const list = ranked(game.players).filter((p) => !p.bot); // bot 🤖 không lên bục vinh danh
  const top = list.slice(0, 3).map(pub);
  const fastest = list.filter((p) => p.first).sort((a, b) => b.first - a.first)[0];
  if (list[0]?.score > 0) dayPlayer(list[0]).wins++;
  podium = {
    no: game.no,
    top,
    fastest: fastest ? { name: fastest.name, avatar: fastest.avatar, first: fastest.first } : null,
    gifters: [...game.gifters.values()].sort((a, b) => b.diamonds - a.diamonds).slice(0, 8),
    stats: { questions: game.qNo, players: game.players.size, correct: game.correct },
    last: prev,
    seg: segPub(game.seg),
  };
  if (game.seg === 'chain') podium.chain = chainSummary();
  if (game.cross) podium.cross = { key: game.cross.p.key, keyBy: game.cross.keyBy, solved: game.cross.solved, n: game.cross.p.rows.length };
  if (game.teams) {
    const [a, b] = game.teams;
    const win = a.score === b.score ? null : a.score > b.score ? a : b;
    podium.teams = game.teams.map(teamPub);
    podium.teamWin = win ? win.i : null;
    // cả đội thắng (người thật) +10 điểm bảng vàng ngày
    if (win) for (const m of win.members.values()) if (!m.bot) dayPlayer(m).score += 10;
  }
  saveScores();
  round = null;
  console.log(`🏆 Hết lượt ${game.no}: ${top.map((p) => `${p.name} ${p.score}`).join(' · ') || 'không ai ghi điểm'}`);
  setPhase('podium', CFG.podiumSec);
  push();
}

// Chuyển sang pha kế tiếp (hết giờ, hoặc người dẫn bấm "Tiếp").
function advance() {
  if (phase === 'break') return startGame();
  if (phase === 'teach') {
    const L = game.lesson;
    if (++L.i < L.words.length) {
      setPhase('teach', CFG.teachSec);
      return push();
    }
    game.quiz = [...L.words].sort(() => Math.random() - 0.5); // kiểm tra theo thứ tự xáo
    return startQuestion();
  }
  if (phase === 'question' && round?.mode === 'chain') return advanceChain();
  if (phase === 'question' && round?.mode === 'cross') return advanceCross();
  if (phase === 'question') return reveal();
  if (phase === 'reveal') {
    if (game.seg === 'crossword') return crossAfterReveal();
    if (game.qNo >= game.total) return endGame();
    if (game.seg === 'chain') return teamsReady() ? startChainMatch() : startChainLobby();
    if (game.style === 'class') return game.quiz?.length ? startQuestion() : startTeach();
    return startQuestion();
  }
  if (phase === 'podium') return startBreak();
}

function tick() {
  if (outro || pausedAt) return;
  if (!phase) return startBreak(!AUTOSTART);
  if (timer.endsAt != null && Date.now() >= timer.endsAt) return advance();
  if (phase === 'question' && round.dict) {
    const lv = dictLevel();
    if (lv !== round.lastHint) {
      round.lastHint = lv;
      push();
    }
  }
  if (phase === 'question' && round.lm) {
    const lv = lmLevel();
    if (lv !== round.lastHint) {
      round.lastHint = lv;
      push();
    }
  }
  if (phase === 'question' && (round.mode === 'type' || round.mode === 'scramble')) {
    const lv = hintLevel();
    if (lv !== round.lastHint) {
      round.lastHint = lv;
      push();
    }
  }
}

// ---------- xử lý sự kiện từ live ----------
function logFeed(item) {
  controlFeed.push({ ...item, at: Date.now() });
  if (controlFeed.length > 200) controlFeed.splice(0, controlFeed.length - 200);
}

const realSeen = new Map(); // uid người thật -> số thứ tự câu gần nhất họ bình luận (để bớt bot)
function onChat(user, text) {
  if (!text || outro) return;
  if (!user.bot) realSeen.set(user.uid, questionsTotal);
  seat(user);
  const msg = String(text).slice(0, game?.seg === 'dictate' ? 160 : 80); // câu Nghe – chép dài tới 95 ký tự
  const item = { name: user.name, avatar: user.avatar, text: msg, ...(user.bot && { bot: true }) };
  // So găng: gõ tên đội để vào đội (cả lúc đang hỏi lẫn công bố)
  if (game?.teams && !game.teamOf.has(user.uid) && ['question', 'reveal'].includes(phase) && game.teams.some((t) => t.re.test(msg))) {
    const r = teamOf(user, msg);
    logFeed({ ...item, text: `→ vào đội ${r.team.icon} ${r.team.name}` });
    broadcast({ type: 'teamJoin', name: user.name, avatar: user.avatar, team: r.team.i, icon: r.team.icon, tname: r.team.name });
    push();
    return;
  }
  if (game?.seg === 'chain') return onChainChat(user, msg, item);
  if (game?.seg === 'crossword' && phase === 'question' && round?.mode === 'cross' && onCrossChat(user, msg, item)) return;
  if (phase === 'question' && round && !round.answered.has(user.uid)) {
    let byHangul = false, byRomaja = false;
    if (round.mode === 'mcq') {
      // "2", "số 2", "chọn 3", "đáp án 1", "B" … — mỗi người chỉ tính LẦN CHỌN ĐẦU (gõ cả 4 số không ăn gian được)
      const mm = msg.trim().replace(/([1-4])\uFE0F?\u20E3/g, '$1').match(/^(?:số|so|chọn|chon|đáp án|dap an|câu|cau)?\s*([1-4]|[abcd])\s*[.!~ạa nhé]*$/i);
      if (mm) {
        const idx = /\d/.test(mm[1]) ? +mm[1] - 1 : 'abcd'.indexOf(mm[1].toLowerCase());
        round.answered.add(user.uid);
        round.votes[idx]++;
        if (idx === round.answerIdx) byHangul = true;
        else {
          item.choice = idx + 1;
          if (round.called?.uid === user.uid) round.called.result = 'wrong';
          logFeed(item);
          round.feed.push(item);
          if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
          broadcast({ type: 'feed', feed: round.feed.slice(-12) });
          return;
        }
      }
    } else if (round.mode === 'scramble') {
      // gõ thứ tự số "312" / "3 1 2" / "3-1-2" — chỉ tính LẦN ĐẦU gõ đủ số thẻ (không dò hết hoán vị được);
      // gõ luôn từ tiếng Anh đúng cũng tính đủ điểm. Chữ cái trùng → thứ tự nào ra đúng từ đều được.
      const digits = msg.trim().replace(/[\s,.\-→>]/g, '');
      const n = norm(msg);
      if (/^[1-9]+$/.test(digits) && digits.length === round.tiles.length) {
        const got = [...digits].map((d) => round.tiles[+d - 1] ?? '?').join('');
        round.answered.add(user.uid);
        byHangul = got.toLowerCase() === round.word.w.toLowerCase();
        if (!byHangul) {
          item.choice = digits;
          logFeed(item);
          round.feed.push(item);
          if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
          broadcast({ type: 'feed', feed: round.feed.slice(-12) });
          return;
        }
      } else byHangul = n === norm(round.word.w);
    } else if (round.mode === 'errhunt') {
      // "goning - going": tách 2 từ (bỏ dấu ngăn), so với từ sai và từ đúng (hoặc cách sửa khác trong accept). Đếm từ bị nghi nhầm để công bố.
      const parts = msg.trim().replace(/\s*(?:->|=>|→|[-–—:=/>])+\s*/g, ' ').split(/\s+/).filter(Boolean);
      if (parts.length === 2 && parts.every((x) => /^[A-Za-z']+$/.test(x))) {
        const [a, b] = parts.map((x) => x.toLowerCase()), q = round.err;
        (round.guess.get(a) || round.guess.set(a, new Set()).get(a)).add(user.uid);
        if (a === q.wrong.toLowerCase() && [q.right, ...(q.accept || [])].some((r) => r.toLowerCase() === b)) {
          byHangul = true;
          item.words = `${q.wrong} → ${q.right}`;
        }
      }
    } else if (round.mode === 'dictate') {
      // Gõ lại cả câu. Chỉ tính là một lần thử khi gõ được ít nhất nửa số từ (bình luận ngắn là tán gẫu). Đếm số từ đúng đúng vị trí.
      // Câu đúng KHÔNG hiện chữ lên màn (không để người khác chép nguyên văn); sai thì hiện "k/n từ đúng", gõ lại được.
      const q = round.dict.q, want = round.dict.words;
      if (dictate.isAttempt(msg, q.s)) {
        if (dictate.same(msg, q.s)) {
          byHangul = true;
          item.text = '✓ gõ đúng cả câu';
        } else {
          item.text = `${Math.min(dictate.goodWords(msg, q.s), want.length)}/${want.length} từ đúng`;
        }
      }
    } else if (round.mode === 'cross') {
      // đã xử lý ở onCrossChat; bình luận còn lại là tán gẫu
    } else if (round.mode === 'startend') {
      // Chỉ bình luận có đúng 5 mục mới tính là một lần trả lời. Sai thì gõ lại được (chưa vào answered), báo số từ đúng.
      const c = startEnd().check(msg, round.pat);
      if (c.attempt) {
        byHangul = c.ok;
        item.text = c.ok ? c.words.join(' ') : `${msg} · ${c.good}/5 từ đúng`;
        if (c.ok) item.words = c.words.join(' ');
      }
    } else if (round.mode === 'hunt') {
      // Mỗi từ hợp lệ của bảng (tra danh sách) được cộng dồn cho người đó; đủ HUNT_NEED từ khác nhau thì về đích và ăn điểm theo thứ tự về đích.
      // Bình luận có thể chứa nhiều từ. Từ lạ hoặc từ đã tìm rồi thì bỏ qua như tán gẫu.
      const h = round.hunt;
      const toks = msg.toLowerCase().split(/[\s,;]+/).map((t) => t.replace(/^[^a-z]+|[^a-z]+$/g, '')).filter(Boolean).slice(0, 8);
      let mine = h.progress.get(user.uid);
      const fresh = [];
      for (const t of toks) {
        const e = h.map.get(t);
        if (!e || mine?.has(t)) continue;
        (mine ||= new Set()).add(t);
        fresh.push(t);
        if (!h.found.has(t)) h.found.set(t, { ...e, by: user.name });
      }
      if (fresh.length) {
        h.progress.set(user.uid, mine);
        item.words = fresh.join(' ');
        item.text = `${fresh.join(', ')} · ${mine.size}/${HUNT_NEED}`;
        if (mine.size >= HUNT_NEED) byHangul = true;
        else {
          item.progress = mine.size;
          logFeed(item);
          round.feed.push(item);
          if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
          push();
          return;
        }
      }
    } else {
      // Nghe & gõ: phải đúng chính tả (không phân biệt hoa thường, bỏ dấu cách/dấu câu). byRomaja (½ điểm) không dùng ở bản tiếng Anh.
      byHangul = norm(msg) === norm(round.word.w);
    }
    if (byHangul || byRomaja) {
      if (round.mode === 'mcq') item.choice = round.answerIdx + 1;
      else round.answered.add(user.uid);
      if (round.mode === 'scramble') item.choice = round.order.map((i) => i + 1).join('');
      const gp = gamePlayer(user);
      if (user.bot) gp.bot = true;
      // Bot 🤖 không vào bảng vàng ngày; người thật xếp hạng nhanh chỉ tính giữa người thật (bot không cướp điểm)
      const dp = user.bot ? { score: 0, correct: 0 } : dayPlayer(user);
      const rank = user.bot ? round.winners.length : round.realWinners++;
      // Đúng nhanh nhất +10, rồi 8, 6, 4… tối thiểu 3 (khung Word/Start or End: 10, 5, 3, rồi +1); gõ romaja được một nửa.
      let pts = ptsFor(game.seg, rank);
      if (byRomaja) pts = Math.ceil(pts / 2);
      const b = boosts.get(user.uid) || 0;
      if (b > 0) {
        pts *= 2;
        boosts.set(user.uid, b - 1);
      }
      // lớp học: bạn được cô gọi tên mà trả lời đúng → +5
      if (round.called?.uid === user.uid) {
        round.called.result = 'right';
        pts += 5;
        item.called = true;
      }
      if (round.right) round.right.push(user.name);
      const st = seats.get(user.uid);
      if (st) st.stars++;
      gp.score += pts;
      gp.correct++;
      const tm = teamOf(user);
      if (tm) {
        tm.team.score += pts;
        tm.m.score += pts;
        item.team = tm.team.i;
      }
      if (rank === 0 && !user.bot) gp.first++;
      dp.score += pts;
      dp.correct++;
      if (!user.bot) {
        game.correct++;
        correctTotal++;
      }
      round.winners.push(user.uid);
      Object.assign(item, { ok: true, pts, rank: rank + 1, romaja: byRomaja, bot: !!user.bot });
      round.feed.push(item);
      logFeed(item);
      broadcast({ type: 'correct', ...item });
      push();
      return;
    }
  }
  // Bình luận sai/tán gẫu: chỉ hiện mờ trong feed; AI chọn câu đáng đáp.
  logFeed(item);
  if (!user.bot) ai.hear(user, msg);
  if (round && (phase === 'question' || phase === 'reveal')) {
    round.feed.push(item);
    if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
    broadcast({ type: 'feed', feed: round.feed.slice(-12) });
  }
}

const GIFT_BOOST = 3; // số câu được nhân đôi điểm sau khi tặng quà

function onGift(user, giftName, diamonds, count) {
  const total = diamonds * count;
  // Trần 50 điểm: quà to không được át người trả lời giỏi (mất vui → người xem bỏ đi).
  const bonus = Math.min(50, 5 + total);
  dayPlayer(user).score += bonus;
  const inGame = game && (phase === 'question' || phase === 'reveal');
  if (inGame) gamePlayer(user).score += bonus;
  boosts.set(user.uid, (boosts.get(user.uid) || 0) + GIFT_BOOST);
  // So găng: quà kéo điểm cho đội (trần 100/lần — quà to vẫn không quyết định một mình)
  let teamBonus = 0, tm = null;
  if (inGame && game.teams) {
    tm = teamOf(user);
    teamBonus = Math.min(100, 10 + total * 2);
    tm.team.score += teamBonus;
    tm.m.score += teamBonus;
    tm.m.gift += total;
  }
  for (const map of inGame ? [sessionGifters, game.gifters] : [sessionGifters]) {
    const g = upsert(map, user, { diamonds: 0, count: 0 });
    g.diamonds += total;
    g.count += count;
  }
  logFeed({ name: user.name, gift: giftName, count, diamonds: total });
  broadcast({ type: 'gift', name: user.name, avatar: user.avatar, gift: giftName, count, diamonds: total, bonus, boost: GIFT_BOOST,
    ...(tm && { team: tm.team.i, teamIcon: tm.team.icon, teamName: tm.team.name, teamBonus }) });
  push();
}

function onJoin(user) {
  if (seat(user)) push();
  broadcast({ type: 'join', name: user.name });
}

// ---------- lệnh từ màn điều khiển ----------
function resumeClock() {
  if (!pausedAt) return;
  const shift = Date.now() - pausedAt;
  timer.startedAt += shift;
  if (timer.endsAt != null) timer.endsAt += shift;
  pausedAt = null;
}

function applyConfig(c = {}) {
  if (c.questions != null) CFG.questions = clamp(c.questions, 5, 50, CFG.questions);
  if (c.roundSec != null) CFG.roundSec = clamp(c.roundSec, 5, 60, CFG.roundSec);
  if (c.revealSec != null) CFG.revealSec = clamp(c.revealSec, 2, 20, CFG.revealSec);
  if (c.podiumSec != null) CFG.podiumSec = clamp(c.podiumSec, 5, 60, CFG.podiumSec);
  if (c.breakSec != null) CFG.breakSec = clamp(c.breakSec, 5, 180, CFG.breakSec);
  if (['easy', 'mid', 'hard', 'all'].includes(c.level) && bankFor(c.level).length) CFG.level = c.level;
  if (c.autoNext != null) CFG.autoNext = !!c.autoNext;
  if (c.music != null && Number.isFinite(+c.music)) CFG.music = Math.min(1, Math.max(0, +c.music));
  if (c.voice != null) CFG.voice = !!c.voice;
  if (c.ai != null) CFG.ai = !!c.ai;
  if (c.bots != null) CFG.bots = clamp(c.bots, 0, 12, CFG.bots);
  if (c.mode === 'mcq' || c.mode === 'type') CFG.mode = c.mode; // áp dụng từ câu sau
  if (['quiz', 'class', 'program'].includes(c.style)) CFG.style = c.style; // áp dụng từ lượt sau
  if (c.skipSeg && CFG.style === 'program') progIdx++; // bỏ qua khung kế tiếp (màn điều khiển)
  if (c.teachSec != null) CFG.teachSec = clamp(c.teachSec, 5, 30, CFG.teachSec);
  if (c.group != null) CFG.group = clamp(c.group, 2, 5, CFG.group);
  // Lượt đang chạy: chỉ được tăng/giảm tổng câu nhưng không thấp hơn câu hiện tại.
  if (game && (phase === 'question' || phase === 'reveal') && c.applyNow) game.total = Math.max(game.qNo, CFG.questions);
  // Đang nghỉ: bật/tắt tự chuyển lượt có hiệu lực ngay.
  if (phase === 'break' && !holdBreak) {
    if (!CFG.autoNext) timer.endsAt = null;
    else if (timer.endsAt == null) timer.endsAt = now() + CFG.breakSec * 1000;
  }
  console.log('Cấu hình:', JSON.stringify(CFG));
}

function command(m) {
  const c = m.cmd;
  if (c === 'pause') {
    if (!pausedAt && phase && !outro) pausedAt = Date.now();
  } else if (c === 'resume') {
    resumeClock();
  } else if (c === 'next') {
    if (phase === 'break') tryConnect();
    // Hỏi → công bố đáp án; đáp án → câu sau; vinh danh → nghỉ; nghỉ → bắt đầu lượt
    if (outro || !phase) return;
    resumeClock();
    return advance();
  } else if (c === 'replace') {
    if (phase !== 'question') return;
    return startQuestion(true);
  } else if (c === 'extend') {
    if (timer.endsAt != null) timer.endsAt += 10000;
    else if (phase === 'break' && !holdBreak) timer.endsAt = now() + 10000;
  } else if (c === 'endGame') {
    if (!game || !['question', 'reveal', 'teach'].includes(phase)) return;
    resumeClock();
    return endGame();
  } else if (c === 'startGame') {
    if (outro || phase === 'question' || phase === 'reveal' || phase === 'teach') return;
    tryConnect(); // chưa nối chat TikTok thì thử nối ngay lúc bấm Bắt đầu
    return startGame();
  } else if (c === 'connect') {
    tryConnect(true);
    return sendControl();
  } else if (c === 'config') {
    applyConfig(m.cfg);
  } else if (c === 'outro') {
    if (phase === 'question') reveal();
    saveScores();
    outro = { next: String(m.next ?? process.env.NEXT_LIVE ?? '').slice(0, 60) };
  } else if (c === 'restart') {
    // Chơi lại từ đầu: bỏ lượt dở, đếm lại từ Lượt 1, về màn chờ. Từ đã hỏi vẫn giữ (không lặp câu).
    // clearDay: xoá luôn bảng vàng hôm nay (điểm, số 🏆, quà, x2).
    if (m.clearDay) {
      scores.clear();
      boosts.clear();
      sessionGifters.clear();
    }
    seats.clear();
    sim?.cancel(); // huỷ câu trả lời ảo còn chờ
    bots.cancel();
    game = null;
    round = null;
    podium = null;
    prev = null;
    outro = null;
    gameNo = 0;
    questionsTotal = 0;
    correctTotal = 0;
    sessionStart = Date.now();
    controlFeed.length = 0;
    saveScores();
    console.log(`↺ Chơi lại từ đầu${m.clearDay ? ' (xoá bảng vàng hôm nay)' : ''} — chờ bấm Bắt đầu`);
    return startBreak(true);
  } else if (c === 'resumeLive') {
    if (!outro) return;
    outro = null;
    return startBreak(true);
  } else if (c === 'reloadStage') {
    return broadcast({ type: 'reload' }); // màn live tải lại trang (sau khi sửa giao diện) — không cần đụng cửa sổ game
  } else if (c === 'chat') {
    onChat({ uid: `test:${m.name}`, name: m.name || 'Bạn', avatar: '' }, m.text);
    return;
  } else if (c === 'gift') {
    onGift({ uid: `test:${m.name}`, name: m.name || 'Bạn', avatar: '' }, m.gift || 'Hoa hồng', Number(m.diamonds) || 1, Number(m.count) || 1);
    return;
  } else return;
  push();
}

// ---------- HTTP + WebSocket ----------
// Chạy sau cổng chung (gateway.js): cổng chuyển tiếp qua loopback nên phải tin địa chỉ khách mà cổng báo lại (kèm mã bí mật chỉ cổng và các tiến trình con biết)
const GW_TOKEN = process.env.GATEWAY_TOKEN || null;
const clientAddr = (req) => (GW_TOKEN && req.headers['x-gw-token'] === GW_TOKEN ? String(req.headers['x-gw-client'] || '') : req.socket.remoteAddress);
const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(clientAddr(req));
const allowed = (req, key) => isLocal(req) || (CONTROL_KEY && key === CONTROL_KEY);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  // API cũ (go_live.sh, curl): /chat {name,text|gift,diamonds,count}, /outro?next=…, /resume
  if (req.method === 'POST' && ['/chat', '/outro', '/resume', '/cmd'].includes(url.pathname)) {
    if (!allowed(req, url.searchParams.get('key'))) return res.writeHead(403).end('forbidden');
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        if (url.pathname === '/outro') command({ cmd: 'outro', next: url.searchParams.get('next') || undefined });
        else if (url.pathname === '/resume') command({ cmd: 'resumeLive' });
        else if (url.pathname === '/cmd') command(JSON.parse(body));
        else {
          const { name = 'Bạn', text, gift, diamonds = 1, count = 1 } = JSON.parse(body);
          command(gift ? { cmd: 'gift', name, gift, diamonds, count } : { cmd: 'chat', name, text });
        }
      } catch {}
      res.end('ok');
    });
    return;
  }
  if (url.pathname === '/api/tts') return tts.handle(req, res, url);
  if (url.pathname === '/api/say') return enAudio.handle(req, res, url);
  if (url.pathname === '/gifts') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(require('./sim').GIFTS.map(([name, diamonds]) => ({ name, diamonds }))));
  }
  const file = url.pathname === '/' ? 'index.html' : ['/control', '/control.html'].includes(url.pathname) ? 'control.html' : url.pathname.slice(1);
  const full = path.join(__dirname, 'public', path.normalize(file));
  if (!full.startsWith(path.join(__dirname, 'public'))) return res.writeHead(403).end();
  fs.readFile(full, (err, data) => {
    if (err) return res.writeHead(404).end();
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg' }[path.extname(full)];
    res.writeHead(200, { 'Content-Type': `${type || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  ws.send(JSON.stringify(publicState()));
  ws.on('message', (raw) => {
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    if (m.type === 'hello' && m.role === 'control') {
      if (!allowed(req, m.key)) return ws.send(JSON.stringify({ type: 'denied' }));
      ws.role = 'control';
      return ws.send(JSON.stringify(controlState()));
    }
    if (m.type === 'cmd' && ws.role === 'control') command(m);
  });
});
function broadcast(msg) {
  const s = JSON.stringify(msg);
  for (const c of wss.clients) if (c.readyState === 1 && c.role !== 'control') c.send(s);
}
function sendControl() {
  let s;
  for (const c of wss.clients) if (c.readyState === 1 && c.role === 'control') c.send((s ??= JSON.stringify(controlState())));
}

// ---------- nguồn sự kiện ----------
// Bản 2.5 trả object proto thô: user.id / nickname / avatarThumb.urlList, chat ở `content`.
const fromTikTok = (u = {}) => ({
  uid: u.id || u.userId || u.displayId || u.nickname,
  name: u.nickname || u.displayId || 'ẩn danh',
  avatar: u.avatarThumb?.urlList?.[0] || '',
});

// Kết nối chat TikTok: tự thử lại liên tục (server thường bật TRƯỚC khi bấm Go LIVE). Bấm ▶ Bắt đầu hoặc
// "Nối TikTok ngay" trên màn điều khiển thì thử ngay, không chờ hết nhịp.
const RETRY_SEC = 10;
let liveConn = null;
let retryTimer = null;
let lastEventAt = 0; // lần cuối nhận được BẤT KỲ sự kiện nào từ TikTok (chat/quà/người vào/số người xem)
const alive = () => (lastEventAt = Date.now());

async function connectTikTok(uniqueId) {
  const { TikTokLiveConnection, WebcastEvent, ControlEvent } = require('tiktok-live-connector');
  try {
    liveConn?.disconnect();
  } catch {}
  const conn = new TikTokLiveConnection(uniqueId, {
    signApiKey: process.env.EULER_API_KEY || undefined,
    // 2 tuỳ chọn này cần ký request HTTP → Euler đòi gói Business. Tắt thì gói miễn phí vẫn đọc được chat/quà.
    enableExtendedGiftInfo: false,
    fetchRoomInfoOnConnect: false,
  });
  liveConn = conn;
  conn.on(WebcastEvent.CHAT, (d) => (alive(), onChat(fromTikTok(d.user), d.content ?? d.comment)));
  conn.on(WebcastEvent.GIFT, (d) => {
    alive();
    // Quà chuỗi (type 1) bắn nhiều lần — chỉ tính khi chuỗi kết thúc.
    const g = d.gift || {};
    if (g.type === 1 && !d.repeatEnd) return;
    onGift(fromTikTok(d.user), g.name || 'quà', g.diamondCount || 1, d.repeatCount || 1);
  });
  conn.on(WebcastEvent.MEMBER, (d) => (alive(), onJoin(fromTikTok(d.user))));
  conn.on(WebcastEvent.ROOM_USER, (d) => (alive(), (viewers = Number(d.total ?? d.viewerCount) || viewers)));
  conn.on(ControlEvent.DISCONNECTED, () => {
    if (conn !== liveConn) return; // kết nối cũ đã bị thay
    console.warn('Mất kết nối TikTok, đang nối lại…');
    Object.assign(tiktok, { connected: false, error: 'mất kết nối, đang nối lại' });
    push();
    scheduleConnect(3);
  });
  const state = await conn.connect();
  Object.assign(tiktok, { connected: true, roomId: state.roomId, error: null, since: Date.now() });
  alive();
  push();
  console.log(`Đã nối live @${uniqueId}, roomId ${state.roomId}`);
}

// force: bỏ kết nối hiện tại, nối lại từ đầu (lấy phòng live MỚI — tắt/bật live trên TikTok là đổi roomId)
function tryConnect(force = false) {
  if (!TIKTOK_USER || tiktok.connecting) return;
  if (tiktok.connected && !force) return;
  if (force && tiktok.connected) {
    console.log(`↻ Nối lại TikTok (bỏ phòng ${tiktok.roomId})`);
    const old = liveConn;
    liveConn = null; // DISCONNECTED của kết nối cũ sẽ bị bỏ qua
    try {
      old?.disconnect();
    } catch {}
    Object.assign(tiktok, { connected: false, roomId: null });
  }
  clearTimeout(retryTimer);
  tiktok.connecting = true;
  tiktok.attempts = (tiktok.attempts || 0) + 1;
  sendControl();
  connectTikTok(TIKTOK_USER)
    .catch((e) => {
      const msg = e.message || String(e);
      // "Room ID" = kênh chưa lên sóng → nói rõ cho người dẫn
      tiktok.error = /room ?id|offline|not.*live/i.test(msg) ? 'kênh chưa lên sóng' : msg.slice(0, 120);
      // Euler giới hạn số lần nối/giờ: bị chặn mà vẫn thử mỗi 10s thì càng bị chặn lâu → lùi 2 phút
      const limited = /rate.?limit|too many/i.test(msg);
      if (limited) tiktok.error = 'bị giới hạn số lần nối, chờ 2 phút';
      if (limited || tiktok.attempts % 6 === 1) console.warn(`Chưa nối được @${TIKTOK_USER} (${msg.slice(0, 90)}) — thử lại sau ${limited ? 120 : RETRY_SEC}s`);
      scheduleConnect(limited ? 120 : RETRY_SEC);
    })
    .finally(() => {
      tiktok.connecting = false;
      sendControl();
    });
}

function scheduleConnect(sec) {
  clearTimeout(retryTimer);
  tiktok.nextTry = Date.now() + sec * 1000;
  retryTimer = setTimeout(tryConnect, sec * 1000);
}

// ---------- AI dẫn chương trình ----------
const ai = require('./ai').create({
  getContext() {
    const b = gameBoard(3).map((p, i) => `${i + 1}. ${p.name} ${p.score}đ`).join(', ');
    let summary = 'đang nghỉ giữa lượt, sắp vào lượt mới';
    if (phase === 'question' && round.wq)
      summary = `đang đố câu ${game.qNo}/${game.total} khung Word (${{ w2m: 'cho từ chọn nghĩa', m2w: 'cho nghĩa chọn từ', syn: 'tìm từ đồng nghĩa', ant: 'tìm từ trái nghĩa', read: 'đọc nhanh một văn bản ngắn rồi trả lời một chi tiết', fill: 'điền từ còn thiếu trong câu', lm: 'nghe audio rồi chọn nghĩa tiếng Việt' }[round.wq.t]}): người xem gõ A, B, C hoặc D (đáp án BÍ MẬT, không được nói chữ cái hay từ đúng)`;
    else if (phase === 'question' && round.mode === 'dictate')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Nghe – chép: người xem nghe một câu tiếng Anh (phát lặp lại) rồi gõ lại nguyên câu; cứ 2 giây màn hiện thêm một loại chữ cái (không được nói nội dung câu). Bảng điểm: ${b}`;
    else if (phase === 'question' && round.mode === 'errhunt')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Săn lỗi: một câu tiếng Anh có đúng 1 từ sai (chính tả hoặc ngữ pháp), người xem gõ "từ sai - từ đúng" (không được nói từ nào sai hay cách sửa)`;
    else if (phase === 'question' && round.mode === 'cross')
      summary = `đang chơi Giải ô chữ: ${round.stage === 'key' ? 'vòng từ khoá hàng dọc (gõ CHỮ HOA)' : `hàng ${round.idx + 1}, người xem gõ từ tiếng Anh theo nghĩa tiếng Việt`}, đã giải ${game.cross.solved}/${game.cross.p.rows.length} hàng (không được nói đáp án)`;
    else if (phase === 'question' && round.mode === 'chain')
      summary = `đang chơi Thế chữ (${round.stage === 'lobby' ? 'sảnh chờ: người xem gõ join để vào đội Black hoặc White, mỗi đội cần ít nhất 2 người' : `hai đội Black và White luân phiên đổi 1 chữ cái của từ hiện tại, chuỗi đang có ${round.chain.length} từ`})`;
    else if (phase === 'question' && round.mode === 'hunt')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Săn từ: ma trận chữ cái 10x10 có ${round.hunt.hidden.length} từ giấu theo mọi hướng, ai tìm đủ ${HUNT_NEED} từ trước thắng (không được nói từ nào nằm trong ma trận)`;
    else if (phase === 'question' && round.mode === 'startend')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Start or End: người xem gõ 5 từ tiếng Anh ${round.pat.k === 'start' ? 'bắt đầu' : 'kết thúc'} bằng "${round.pat.s}" trong một bình luận (không được liệt kê từ đáp án)`;
    else if (phase === 'question' && round.mode === 'mcq')
      summary = round.rev
        ? `đang đố câu ${game.qNo}/${game.total}: nghĩa "${round.word.m}" là từ tiếng Anh nào, người xem gõ số 1–4 (đáp án BÍ MẬT, không được nói từ tiếng Anh đúng hay số đúng)`
        : `đang đố câu ${game.qNo}/${game.total} lượt ${game.no}: từ ${round.listen ? '(nghe, giấu chữ)' : `"${round.word.w}"`} nghĩa là gì, người xem gõ số 1–4 chọn trong: ${round.options.map((o, i) => `${i + 1}. ${o}`).join('; ')} (đáp án đúng là BÍ MẬT, không được nói số hay nghĩa đúng)`;
    else if (phase === 'question') summary = `đang đố câu ${game.qNo}/${game.total} lượt ${game.no}: "${round.word.m}" tiếng Anh là gì, người xem gõ từ tiếng Anh (đáp án BÍ MẬT, không được đánh vần hay gợi ý chữ cái)`;
    else if (phase === 'reveal') summary = `vừa công bố đáp án: "${round.word.m}" = ${round.word.w} (${round.word.r})`;
    else if (phase === 'teach') summary = `đang là LỚP HỌC: Ninja Migii đang giảng từ "${game.lesson.words[game.lesson.i].w}" = ${game.lesson.words[game.lesson.i].m} (${game.lesson.words[0].course}, ${game.lesson.words[0].lesson}), lát nữa kiểm tra trắc nghiệm`;
    else if (phase === 'podium') summary = `vừa hết lượt ${podium?.no}, đang vinh danh: ${podium?.top.map((p) => p.name).join(', ') || 'không ai'}`;
    return {
      enabled: CFG.ai && !outro,
      summary,
      board: b,
      // mcq thường: đáp án là nghĩa; mcq ngược / gõ / ghép chữ: đáp án là từ tiếng Anh
      secret: phase === 'question' && round ? (['startend', 'hunt', 'chain', 'errhunt', 'cross', 'dictate'].includes(round.mode) ? null : round.secret ? { w: round.secret } : round.mode === 'mcq' && !round.rev ? { w: round.word.m } : { w: round.word.w }) : null,
    };
  },
  onReply(r) {
    console.log(`🥷 → ${r.name}: ${r.reply}`);
    logFeed({ name: '🥷 Ninja Migii', text: `@${r.name} ${r.reply}`, ai: true });
    broadcast({ type: 'ai', ...r });
    sendControl();
  },
  log: (m) => console.log(m),
});

const MIN_BOTS = 2;
const bots = require('./bots').create({ onChat: (u, t) => onChat(u, t) });

let sim = null;
if (SIM) sim = require('./sim').start({ onChat, onGift, onJoin, bank: () => BANK });

server.listen(PORT, () => {
  console.log(`Màn live:       http://localhost:${PORT}/`);
  console.log(`Màn điều khiển: http://localhost:${PORT}/control`);
  const lan = Object.values(require('os').networkInterfaces()).flat().find((n) => n?.family === 'IPv4' && !n.internal)?.address;
  if (lan) {
    console.log(`Máy khác trong mạng — màn live:  http://${lan}:${PORT}/`);
    console.log(`                  — điều khiển: http://${lan}:${PORT}/control?key=${CONTROL_KEY}`);
  }
  console.log(`Kho ${BANK.length} từ (đã loại ${EXCLUDE.size} từ lỗi) · mức ${CFG.level} · ${CFG.questions} câu/lượt · ${CFG.roundSec}s/câu`);
  tts.init();
  if (TIKTOK_USER) tryConnect();
  setInterval(tick, 250);
  setInterval(sendControl, 1000); // màn điều khiển: số người xem, đồng hồ, bình luận
  // Phòng "chết": báo đã nối mà 90s không có sự kiện nào (vd. đã tắt live rồi bật phiên mới → roomId đổi) → tự nối lại
  setInterval(() => {
    if (TIKTOK_USER && tiktok.connected && Date.now() - lastEventAt > 90000) {
      console.warn('TikTok im lặng 90s — có thể đang bám phòng live cũ, nối lại…');
      tryConnect(true);
    }
  }, 30000);
});
