// Game live TikTok "X tiếng Hàn là gì?" — người xem gõ đáp án vào bình luận.
//
//   node server.js --sim                 # chạy thử với khán giả ảo, không cần TikTok
//   node server.js --user <tiktok_id>    # đọc chat live thật của @tiktok_id
//
// Màn livestream:  http://localhost:8787/          (khung 1080×1920 cho OBS / LIVE Studio / điện thoại)
// Màn điều khiển:  http://localhost:8787/control   (chỉ mở được từ máy chạy server, hoặc ?key=CONTROL_KEY)
//
// Vòng chơi: nghỉ giữa lượt (luật + bảng vàng) → N câu → vinh danh top 3 → nghỉ → lượt mới …
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const tts = require('./tts');

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return def;
  const v = args[i + 1];
  return v === undefined || v.startsWith('--') ? true : v;
};

const PORT = Number(arg('port', 8787));
const TIKTOK_USER = arg('user', null);
const SIM = !!arg('sim', false);
// Mở màn điều khiển từ điện thoại cùng Wi-Fi cần khoá; không đặt trong .env thì tự sinh mỗi lần chạy.
// --mute: chạy thử im lặng tuyệt đối (trang live không phát giọng/nhạc/hiệu ứng) — dùng khi đang có phiên live thật trên máy
const MUTE = !!arg('mute', false);
const CONTROL_KEY = process.env.CONTROL_KEY || crypto.randomBytes(4).toString('hex');

// Mức độ theo khoá học (id khoá trên CDN). "easy" = sơ cấp + chủ đề đời sống.
const LEVELS = {
  easy: ['1100', '1200', '1700', '2000', '2100', '2800', '3000', '3100'],
  mid: ['1300', '1400', '1800', '2200', '2300', '2700', '3200', '3300'],
};
// data/exclude.json (node build_exclude.js): từ khoá 2800 không có trong từ điển — có từ sai chính tả, không ra đề.
let EXCLUDE = new Set();
try {
  EXCLUDE = new Set(require('./data/exclude.json').map((x) => x.w));
} catch {}
const BANK_ALL = require('./data/bank.json').filter((x) => !EXCLUDE.has(x.w));
const bankFor = (level) => (level === 'all' ? BANK_ALL : BANK_ALL.filter((x) => LEVELS[level]?.includes(x.cid)));

// Cấu hình đổi được lúc chạy từ màn điều khiển. Số câu / mức từ áp dụng từ lượt sau.
const clamp = (v, lo, hi, def) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, Math.round(+v))) : def);
const CFG = {
  questions: clamp(arg('questions', 25), 5, 50, 25), // số câu mỗi lượt
  roundSec: clamp(arg('round', 15), 5, 60, 15), // giây mỗi câu
  revealSec: clamp(arg('reveal', 3), 2, 20, 3), // giây dừng giữa 2 câu: hiện đáp án + đọc, rồi chuyển câu
  podiumSec: clamp(arg('podium', 15), 5, 60, 15), // giây màn vinh danh
  breakSec: clamp(arg('break', 20), 5, 180, 20), // giây nghỉ trước lượt mới
  level: ['easy', 'mid', 'all'].includes(arg('level')) ? arg('level') : 'easy',
  autoNext: true, // tắt = hết vinh danh thì chờ người dẫn bấm "Bắt đầu lượt"
  music: 0.25, // âm lượng nhạc nền 0..1 (0 = tắt)
  voice: true, // giọng đọc câu hỏi / cảm ơn / lời dẫn
  ai: !arg('no-ai', false), // AI "Cáo Jaemy" trả lời bình luận (ai.js)
  // mcq = trắc nghiệm: hiện từ Hàn (+ đọc), chọn nghĩa 1–4 bằng bình luận; type = gõ chữ Hàn (kiểu cũ, khó)
  mode: arg('mode') === 'type' ? 'type' : 'mcq',
  bots: clamp(arg('bots', 6), 0, 12, 6), // người chơi ảo 🤖 mỗi câu (bots.js); tự giảm khi có người thật, tối thiểu MIN_BOTS
  // style: quiz = đố liên tục · class = LỚP HỌC: cô Cáo giảng nhóm từ cùng bài (teach) rồi kiểm tra từng từ, gọi tên học sinh,
  // người xem bình luận/vào live được xếp chỗ ngồi trong lớp. Bật: --class hoặc đổi trong màn điều khiển (áp dụng từ lượt sau).
  // program = CHƯƠNG TRÌNH XOAY VÒNG (04/11): mỗi lượt một khung khác nhau (giờ học ↔ giải trí), giữa các khung có vinh danh.
  style: arg('class', false) ? 'class' : arg('quiz', false) ? 'quiz' : 'program',
  teachSec: clamp(arg('teach', 12), 5, 30, 12), // giây giảng mỗi từ
  group: clamp(arg('group', 3), 2, 5, 3), // số từ mỗi nhóm giảng → kiểm tra
};
// Các khung của chương trình xoay vòng. kind: 'học' | 'giải trí' (màn chờ báo "Giờ học" / "Giờ giải trí").
const SEGMENTS = {
  class: { icon: '📖', name: 'Giờ học', kind: 'học', rule: 'Cô Cáo dạy 3 từ mới rồi kiểm tra, gọi tên từng bạn' },
  quiz: { icon: '⚡', name: 'Đố nhanh', kind: 'giải trí', rule: 'Gõ số 1–4 chọn nghĩa đúng, nhanh nhất +10' },
  scramble: { icon: '🧩', name: 'Ghép chữ', kind: 'giải trí', rule: 'Các thẻ chữ bị xáo trộn — gõ THỨ TỰ SỐ đúng (vd 312) hoặc gõ romaja' },
  reverse: { icon: '🔁', name: 'Chọn từ Hàn', kind: 'học', rule: 'Nhìn nghĩa tiếng Việt, gõ số 1–4 chọn đúng từ tiếng Hàn' },
  listen: { icon: '🎧', name: 'Luyện tai', kind: 'học', rule: 'Nghe cô đọc (không hiện chữ), gõ số 1–4 chọn nghĩa' },
  team: { icon: '🥊', name: 'So găng 2 đội', kind: 'giải trí', rule: 'Gõ tên đội để vào đội · trả lời đúng & tặng quà kéo điểm cho đội' },
  type: { icon: '✍️', name: 'Thử thách gõ chữ', kind: 'học', rule: 'Nhìn nghĩa, gõ chữ Hàn — gợi ý phụ âm đầu mở dần' },
};
const PROGRAM = String(arg('program-order', 'class,quiz,scramble,listen,team,reverse')).split(',').filter((k) => SEGMENTS[k]);
let progIdx = 0;
const segFor = () => (CFG.style === 'program' ? PROGRAM[progIdx % PROGRAM.length] : CFG.style); // khung của lượt KẾ TIẾP
const curSeg = () => (game && phase !== 'break' ? game.seg : segFor());
const segPub = (id) => ({ id, ...SEGMENTS[id] });
// So găng: mỗi lượt một cặp đội; gõ tên đội để chọn (không gõ thì tự xếp vào đội ít người hơn khi trả lời đúng/tặng quà)
const TEAM_PAIRS = [
  [['🌶️', 'Kimchi', 'kimchi|kim chi'], ['🍗', 'Gà rán', 'gà rán|ga ran|gà|ga']],
  [['🍜', 'Ramyeon', 'ramyeon|ramen|mì|mi'], ['🍙', 'Kimbap', 'kimbap|kim bap|cơm cuộn']],
  [['🐯', 'Hổ', 'hổ|ho|cọp'], ['🐻', 'Gấu', 'gấu|gau']],
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

// ---------- chuẩn hoá đáp án ----------
const norm = (s) => String(s || '').toLowerCase().normalize('NFC').replace(/[\s\-'’.,!?~"]/g, '');

// Phụ âm đầu (초성) của từng âm tiết — gợi ý kiểu "ㄱㅇㅇ" cho 고양이.
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const chosung = (ch) => {
  const c = ch.charCodeAt(0) - 0xac00;
  return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch;
};

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
const SCORE_FILE = path.join(__dirname, 'data', `scores-${SIM ? 'sim-' : ''}${new Date().toISOString().slice(0, 10)}.json`);
try {
  for (const s of JSON.parse(fs.readFileSync(SCORE_FILE, 'utf8'))) scores.set(s.uid, { wins: 0, ...s });
  console.log(`Nạp ${scores.size} người chơi từ ${path.basename(SCORE_FILE)}`);
} catch {}

function saveScores() {
  fs.writeFile(SCORE_FILE, JSON.stringify([...scores.values()]), () => {});
}

// Từ đã hỏi được ghi ra file → không lặp lại giữa các lần chạy server. Chỉ khi đã hỏi hết kho của mức đang chọn
// mới quay vòng lại (mức easy 3,6k từ ≈ 146 lượt × 25 câu). Chạy thử --sim ghi file riêng để không ăn vào kho live.
const USED_FILE = path.join(__dirname, 'data', `used-words${SIM ? '-sim' : ''}.json`);
let used = new Set();
try {
  used = new Set(JSON.parse(fs.readFileSync(USED_FILE, 'utf8')));
  console.log(`Đã hỏi ${used.size} từ ở các lần trước (${path.basename(USED_FILE)}) — bỏ qua các từ này`);
} catch {}
const saveUsed = () => fs.writeFile(USED_FILE, JSON.stringify([...used]), () => {});

// QUY TẮC (user 04/11): người chơi CHỈ gõ số / chữ Latin-tiếng Việt vào bình luận — không bắt gõ chữ Hàn (khó bàn phím).
// Khung 'type' (gõ chữ Hàn) vẫn còn nhưng không nằm trong chương trình mặc định.
// Ghép chữ: từ thuần Hangul 2–5 âm tiết, các âm tiết không trùng hết (xáo mới có nghĩa)
const scrambleOK = (x) => /^[가-힣]{2,5}$/.test(x.w) && new Set(x.w).size > 1;
const scramble3 = (x) => /^[가-힣]{3,5}$/.test(x.w) && new Set(x.w).size > 1; // ưu tiên 3–5 âm tiết (2 âm tiết dễ quá)
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
// Mức gợi ý theo thời gian: 0 = ô trống, 1 = hiện 초성, 2 = mở thêm 1 âm tiết.
function hintLevel() {
  const t = (now() - timer.startedAt) / (timer.endsAt - timer.startedAt);
  return t >= 0.7 ? 2 : t >= 0.35 ? 1 : 0;
}

function slots(level) {
  return [...round.word.w].map((ch, i) => {
    if (phase === 'reveal') return { ch, kind: 'full' };
    if (level >= 2 && i === round.openIdx) return { ch, kind: 'full' };
    if (level >= 1) return { ch: chosung(ch), kind: 'cho' };
    return { ch: '', kind: 'empty' };
  });
}

const audioUrl = (w) => `https://data.jaemy.net/study/vi/audios/0/${crypto.createHash('md5').update(w).digest('hex')}.mp3`;
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
    players: phase === 'break' ? scores.size : game?.players.size || 0,
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
    s.lesson = { title: x.lesson, course: x.course, i: L.i, n: L.words.length, w: x.w, r: x.r, m: x.m, audio: audioUrl(x.w), done: L.words.slice(0, L.i).map((y) => ({ w: y.w, m: y.m })) };
    s.board = gameBoard();
  } else if (phase === 'podium') {
    s.podium = podium;
  } else {
    const rev = phase === 'reveal';
    if (round.mode === 'mcq') {
      // Từ Hàn + âm đọc hiện NGAY (đáp án là nghĩa). Câu "nghe": giấu chữ/romaja tới lúc công bố.
      const showWord = rev || !round.listen;
      s.q = {
        mode: 'mcq',
        listen: round.listen,
        rev: !!round.rev,
        mean: round.rev ? round.word.m : undefined,
        w: showWord && (!round.rev || rev) ? round.word.w : null,
        r: showWord ? round.word.r : null,
        audio: audioUrl(round.word.w),
        options: round.options,
        answer: rev ? round.answerIdx : null,
        votes: rev ? round.votes : null,
        m: rev || round.rev ? round.word.m : null,
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
      course: round.word.course,
      slots: slots(hintLevel()),
      r: rev ? round.word.r : null,
      w: rev ? round.word.w : null,
      audio: rev ? audioUrl(round.word.w) : null,
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
          mode: round.mode, options: round.options, answerIdx: round.answerIdx, votes: round.votes, listen: round.listen, answered: round.answered.size, called: round.called }
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
  game = { no: gameNo, seg, total: CFG.questions, qNo: 0, players: new Map(), gifters: new Map(), correct: 0, startedAt: Date.now() };
  if (seg === 'team') {
    game.teams = makeTeams();
    game.teamOf = new Map();
  }
  podium = null;
  prev = null;
  console.log(`▶ Lượt ${gameNo}: ${game.total} câu · ${CFG.roundSec}s/câu · mức ${CFG.level} · ${SEGMENTS[seg]?.icon || ''} ${SEGMENTS[seg]?.name || seg}`);
  if (seg === 'class') {
    game.style = 'class';
    if (!SIM && CFG.bots > 0) {
      const names = bots.names().sort(() => Math.random() - 0.5).slice(0, CFG.bots);
      for (const n of names) seat({ uid: `bot:${n}`, name: n, avatar: '', bot: true });
    }
    return startTeach();
  }
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

// 4 lựa chọn nghĩa: 1 đúng + 3 nhiễu (ưu tiên cùng khoá học, nghĩa khác hẳn, độ dài gần giống)
const nkey = (m) => String(m).toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');
function makeOptions(word) {
  const seen = new Set([nkey(word.m)]);
  const pool = BANK.filter((x) => x.w !== word.w && !seen.has(nkey(x.m)));
  const same = pool.filter((x) => x.cid === word.cid && Math.abs(x.m.length - word.m.length) <= 10);
  const out = [];
  for (const src of [same, pool]) {
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

// Chọn từ Hàn: hiện nghĩa, 4 lựa chọn là 4 từ Hàn (1 đúng + 3 nhiễu cùng khoá, nghĩa khác, độ dài gần giống)
function makeOptionsRev(word) {
  const seenW = new Set([word.w]), seenM = new Set([nkey(word.m)]);
  const pool = BANK.filter((x) => x.w !== word.w && !seenM.has(nkey(x.m)));
  const same = pool.filter((x) => x.cid === word.cid && Math.abs([...x.w].length - [...word.w].length) <= 1);
  const out = [];
  for (const src of [same, pool]) {
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

function startQuestion(replace = false) {
  const cls = game.style === 'class';
  const seg = game.seg;
  const word = cls && !replace && game.quiz?.length ? game.quiz.shift() : (seg === 'scramble' ? pickWord(scramble3) : pickWord());
  if (!replace) {
    game.qNo++;
    questionsTotal++;
  }
  round = { word, sec: CFG.roundSec, openIdx: Math.floor(Math.random() * [...word.w].length), winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0,
    mode: { listen: 'mcq', team: 'mcq', type: 'type', scramble: 'scramble', class: 'mcq', reverse: 'mcq', quiz: CFG.style === 'program' ? 'mcq' : CFG.mode }[seg] || CFG.mode };
  if (round.mode === 'mcq') {
    Object.assign(round, seg === 'reverse' ? makeOptionsRev(word) : makeOptions(word));
    round.rev = seg === 'reverse';
    round.votes = [0, 0, 0, 0];
    round.listen = seg === 'listen' || (seg === 'quiz' && Math.random() < LISTEN_RATE); // 🎧 nghe chọn nghĩa: giấu chữ, chỉ phát âm
  }
  if (round.mode === 'scramble') {
    // thẻ đánh số 1..n; đáp án = thứ tự số (vd "312"). perm[j] = vị trí trong từ của thẻ j
    const sy = [...word.w];
    let perm = sy.map((_, i) => i);
    for (let k = 0; k < 30 && perm.map((i) => sy[i]).join('') === word.w; k++) perm = [...perm].sort(() => Math.random() - 0.5);
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
  setPhase('question', CFG.roundSec);
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
  setPhase('reveal', CFG.revealSec);
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
  if (phase === 'question') return reveal();
  if (phase === 'reveal') {
    if (game.qNo >= game.total) return endGame();
    if (game.style === 'class') return game.quiz?.length ? startQuestion() : startTeach();
    return startQuestion();
  }
  if (phase === 'podium') return startBreak();
}

function tick() {
  if (outro || pausedAt) return;
  if (!phase) return startBreak(true);
  if (timer.endsAt != null && Date.now() >= timer.endsAt) return advance();
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
  const msg = String(text).slice(0, 80);
  const item = { name: user.name, avatar: user.avatar, text: msg, ...(user.bot && { bot: true }) };
  // So găng: gõ tên đội để vào đội (cả lúc đang hỏi lẫn công bố)
  if (game?.teams && !game.teamOf.has(user.uid) && ['question', 'reveal'].includes(phase) && game.teams.some((t) => t.re.test(msg))) {
    const r = teamOf(user, msg);
    logFeed({ ...item, text: `→ vào đội ${r.team.icon} ${r.team.name}` });
    broadcast({ type: 'teamJoin', name: user.name, avatar: user.avatar, team: r.team.i, icon: r.team.icon, tname: r.team.name });
    push();
    return;
  }
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
      // gõ romaja đúng cũng tính đủ điểm (Latin); chữ Hàn vẫn nhận nếu ai gõ được
      const digits = msg.trim().replace(/[\s,.\-→>]/g, '');
      const n = norm(msg);
      if (/^[1-9]+$/.test(digits) && digits.length === round.tiles.length) {
        const got = [...digits].map((d) => round.tiles[+d - 1] ?? '?').join('');
        round.answered.add(user.uid);
        byHangul = got === round.word.w;
        if (!byHangul) {
          item.choice = digits;
          logFeed(item);
          round.feed.push(item);
          if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
          broadcast({ type: 'feed', feed: round.feed.slice(-12) });
          return;
        }
      } else byHangul = n === norm(round.word.w) || (round.word.r && n === norm(round.word.r));
    } else {
      const n = norm(msg);
      byHangul = n === norm(round.word.w);
      byRomaja = !byHangul && round.word.r && n === norm(round.word.r);
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
      // Đúng nhanh nhất +10, rồi 8, 6, 4… tối thiểu 3; gõ romaja được một nửa.
      let pts = Math.max(3, 10 - 2 * rank);
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
  if (['easy', 'mid', 'all'].includes(c.level) && bankFor(c.level).length) CFG.level = c.level;
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
const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
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
      if (tiktok.attempts % 6 === 1) console.warn(`Chưa nối được @${TIKTOK_USER} (${msg.slice(0, 90)}) — tự thử lại mỗi ${RETRY_SEC}s`);
      scheduleConnect(RETRY_SEC);
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
    if (phase === 'question' && round.mode === 'mcq')
      summary = round.rev
        ? `đang đố câu ${game.qNo}/${game.total}: nghĩa "${round.word.m}" là từ tiếng Hàn nào, người xem gõ số 1–4 (đáp án BÍ MẬT, không được nói từ tiếng Hàn đúng hay số đúng)`
        : `đang đố câu ${game.qNo}/${game.total} lượt ${game.no}: từ ${round.listen ? '(nghe, giấu chữ)' : `"${round.word.w}"`} nghĩa là gì, người xem gõ số 1–4 chọn trong: ${round.options.map((o, i) => `${i + 1}. ${o}`).join('; ')} (đáp án đúng là BÍ MẬT, không được nói số hay nghĩa đúng)`;
    else if (phase === 'question') summary = `đang đố câu ${game.qNo}/${game.total} lượt ${game.no}: "${round.word.m}" tiếng Hàn là gì (đáp án BÍ MẬT)`;
    else if (phase === 'reveal') summary = `vừa công bố đáp án: "${round.word.m}" = ${round.word.w} (${round.word.r})`;
    else if (phase === 'teach') summary = `đang là LỚP HỌC: cô Cáo đang giảng từ "${game.lesson.words[game.lesson.i].w}" = ${game.lesson.words[game.lesson.i].m} (bài ${game.lesson.words[0].lesson}), lát nữa kiểm tra trắc nghiệm`;
    else if (phase === 'podium') summary = `vừa hết lượt ${podium?.no}, đang vinh danh: ${podium?.top.map((p) => p.name).join(', ') || 'không ai'}`;
    return {
      enabled: CFG.ai && !outro,
      summary,
      board: b,
      secret: phase === 'question' && round ? (round.mode === 'mcq' ? { w: round.word.m } : { w: round.word.w, r: round.word.r }) : null,
    };
  },
  onReply(r) {
    console.log(`🦊 → ${r.name}: ${r.reply}`);
    logFeed({ name: '🦊 Cáo Jaemy', text: `@${r.name} ${r.reply}`, ai: true });
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
