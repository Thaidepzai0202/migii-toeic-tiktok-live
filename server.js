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
  // Giây NGẦM nhận thêm bình luận sau khi đồng hồ trên màn về 0 (xem setPhase). 20/11/2026: người dùng đo màn live TikTok trễ ~4 giây so với server.
  lateSec: clamp(arg('late', 4), 0, 8, 4),
  level: ['easy', 'mid', 'hard', 'all'].includes(arg('level')) ? arg('level') : 'easy',
  autoNext: true, // tắt = hết vinh danh thì chờ người dẫn bấm "Bắt đầu lượt"
  music: 0.25, // âm lượng nhạc nền 0..1 (0 = tắt)
  voice: true, // giọng đọc câu hỏi / cảm ơn / lời dẫn
  ai: !arg('no-ai', false), // AI "Ninja Migii" trả lời bình luận (ai.js)
  // mcq = trắc nghiệm: hiện từ tiếng Anh (+ đọc), chọn nghĩa 1–4 bằng bình luận; type = nghe + gõ từ tiếng Anh
  mode: arg('mode') === 'type' ? 'type' : 'mcq',
  // người chơi ảo 🤖 mỗi câu (bots.js), chỉ ở live thật. 12/11/2026 người dùng chốt cần bot để mọi khung chạy được lúc mới mở live
  // → mặc định 6 (tự giảm khi đông người thật, tối thiểu 2). Tên không gắn nhãn trên màn live. Tắt: --bots 0 hoặc kéo thanh trên màn điều khiển.
  bots: clamp(arg('bots', 6), 0, 12, 6),
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
  scramble: { icon: '🧩', name: 'Ghép chữ', kind: 'giải trí', rule: 'Các chữ cái bị xáo trộn — ghép lại, gõ từ tiếng Anh vào bình luận (sai được gõ lại)' },
  reverse: { icon: '🔁', name: 'Chọn từ tiếng Anh', kind: 'học', rule: 'Nhìn nghĩa tiếng Việt, gõ số 1–4 chọn đúng từ tiếng Anh' },
  listen: { icon: '🎧', name: 'Luyện tai', kind: 'học', rule: 'Nghe Ninja đọc (không hiện chữ), gõ số 1–4 chọn nghĩa', sec: 15 },
  team: { icon: '🥊', name: 'So găng 2 đội', kind: 'giải trí', rule: 'Gõ tên đội để vào đội · trả lời đúng & tặng quà kéo điểm cho đội' },
  type: { icon: '✍️', name: 'Nghe & gõ chính tả', kind: 'học', rule: 'Nghe đọc + nhìn nghĩa, gõ từ tiếng Anh — gợi ý chữ cái mở dần', sec: 15 },
  // 4 kênh theo mốc TOEIC (11/11/2026): dưới 450 · 450–650 · 650–800 · 800+. Lệnh chạy từng kênh: npm run demo:duoi450 … (package.json).
  //   dưới 450: word (từ 300+400), emoji (17/11), irrfill + irrfind (17/11, động từ bất quy tắc), bricky (19/11), oneletter (19/11, Thêm bớt 1 chữ), scramble, startend, listenmean, hunt, chain (16/11 thêm Ghép chữ + Nghe – nghĩa cho nhiều game) · 450–650: word (500+600), scramble (17/11, --level mid), fillin, listenmean, errhunt, crossword
  //   650–800: word (700), speedread, dictate · 800+: word (800+900), speedread (bài 800)
  // Các khung mới (word trở xuống) tính điểm riêng: nhanh nhất +10, hạng 2 +5, hạng 3 +3, người đúng sau đó +1.
  // Người chơi thử 11/11 đề nghị bỏ khung nghe, Săn từ, Giải ô chữ, Săn lỗi, Giờ học; người dùng chưa muốn bỏ nên vẫn giữ trong kênh.
  word: { icon: '🔤', name: 'Word', kind: 'học', rule: 'Đua phi cơ: gõ A, B, C hoặc D, trả lời đúng thì phi cơ tăng tốc, nhanh nhất +10 km/h; câu cuối về đích', reveal: 7 },
  // sec/total/reveal: khung này có nhịp riêng (45 giây mỗi câu, 3 câu mỗi lượt, công bố 8 giây để đọc ví dụ).
  // 20/11/2026: 5 → 3 câu (người dùng duyệt): số liệu 16–20/11 tương tác thấp thứ hai (0,91 bình luận / người / phút, Word 2,61).
  startend: { icon: '🎯', name: 'Start or End', kind: 'giải trí', rule: 'Gõ 5 từ tiếng Anh bắt đầu hoặc kết thúc bằng chữ cho trước', sec: 45, total: 3, reveal: 8 },
  // Săn từ (luật mới người dùng chốt 26/11/2026, thay hẳn bản ma trận 10×10 giấu từ 8 hướng): bảng chữ 16×16, từ chỉ tính hàng ngang trái → phải
  //   và cột dọc trên → xuống. total = số LƯỢT (15 lượt thường + lượt 16 về đích ×2), mỗi lượt 30 giây; `reveal` = 4 giây cho các từ đã tìm nổ và chữ
  //   rơi xuống lấp bảng. Điểm RIÊNG của khung: ai gõ một từ trước tiên +2 cho mỗi chỗ từ đó nằm trên bảng. Xem khối Săn từ bên dưới và san-tu.js.
  hunt: { icon: '🔎', name: 'Săn từ', kind: 'giải trí', rule: 'Bảng chữ 16×16: tìm từ tiếng Anh theo hàng ngang (trái sang phải) hoặc cột dọc (trên xuống) rồi gõ vào bình luận; ai gõ trước được +2 cho mỗi chỗ từ đó xuất hiện. Hết 30 giây các từ đã tìm nổ, chữ rơi xuống cho lượt mới. Mỗi từ nạp 1 mana: hết lượt đủ 10 mana thì 2 tên lửa nổ 3×3, đủ 20 thì bom nổ chữ thập, đủ 30 thì nổ nửa bảng kiểu bàn cờ. Lượt cuối về đích, điểm ×2', sec: 30, total: 16, reveal: 4 },
  // Thế chữ: Black vs White, mỗi lượt 12 giây đổi đúng 1 chữ cái (13/11: người dùng tăng từ 8 lên 12 và thêm 4 giây nghỉ trước khi đếm, CHAIN_GRACE). Luật 13/11: không chia đội, người giữ từ cuối cùng thắng ván +10 (xem khối Thế chữ bên dưới). total = số ván mỗi lượt.
  chain: { icon: '🔗', name: 'Thế chữ', kind: 'giải trí', rule: 'Mọi người cùng chơi: đổi 1 chữ cái để ra từ mới và giữ từ; hết 12 giây không ai thế được, hoặc chuỗi đủ 40 từ, thì người giữ từ thắng +10. Ván cuối tăng tốc: từ 5 chữ, được đổi 2 chữ', sec: 12, total: 3, reveal: 10 },
  // Điền từ (kênh 450–650, câu dùng từ mốc 500). Điểm 10/5/3/1 (như Word).
  fillin: { icon: '✏️', name: 'Điền từ', kind: 'học', rule: 'Câu thiếu 1 từ: chọn A, B, C hoặc D; có lời giải và các lỗi hay nhầm', sec: 20, total: 5, reveal: 18 },
  listenmean: { icon: '🎧', name: 'Nghe – nghĩa', kind: 'học', rule: 'Nghe audio một lần, chữ cái hiện sẵn một nửa rồi mỗi giây thêm 1, chọn nghĩa đúng', sec: 12, total: 8, reveal: 4 },
  // Săn lỗi: --err-file data/san-loi-600.json
  errhunt: { icon: '🔍', name: 'Săn lỗi', kind: 'học', rule: 'Câu có 1 từ sai: gõ "từ sai - từ đúng", ví dụ goning - going', sec: 30, total: 5, reveal: 15 },
  // Nghe – chép: --dict-file data/nghe-chep-700.json. Nghe câu tiếng Anh (phát lặp lại, cách 5 giây), gõ lại nguyên câu trong 40 giây; cứ 2 giây hiện thêm 1 loại chữ cái. Điểm 10/5/3/1.
  dictate: { icon: '🎙️', name: 'Nghe – chép', kind: 'học', rule: 'Nghe câu tiếng Anh (phát lặp lại), gõ lại cả câu vào bình luận; cứ 2 giây hiện thêm 1 chữ cái, nhanh nhất +10', sec: 40, total: 5, reveal: 10 },
  // Đọc nhanh (kênh 650–800 dùng bài 700, kênh 800+ dùng bài 800): văn bản ngắn kiểu Part 7 + câu hỏi chi tiết + 4 phương án hiện cùng lúc `sec` giây. Điểm 10/5/3/1.
  speedread: { icon: '📰', name: 'Đọc nhanh', kind: 'học', rule: 'Đọc văn bản ngắn, tìm chi tiết được hỏi: gõ A, B, C hoặc D', sec: 20, total: 5, reveal: 12 },
  // Giải ô chữ: sec = thời gian mỗi hàng (câu nhỏ); total chỉ là chỗ giữ, số "câu" mỗi lượt = số hàng của ô chữ
  crossword: { icon: '🔠', name: 'Giải ô chữ', kind: 'giải trí', rule: 'Gõ chữ thường giải từng hàng, gõ CHỮ HOA để giải từ khoá hàng dọc (+50)', sec: 30, total: 1, reveal: 4 },
  // Đoán emoji (17/11/2026, kênh dưới 450): --emoji-file data/emoji-400.json. 20 giây mỗi câu (đáp án từ 12 chữ cái: 30 giây). Điểm 10/5/3/1.
  emoji: { icon: '🤔', name: 'Đoán emoji', kind: 'giải trí', rule: 'Nhìn emoji đoán từ tiếng Anh, gõ vào bình luận (sai được gõ lại); chữ cái gợi ý mở dần', sec: 20, total: 10, reveal: 5 },
  // Động từ bất quy tắc (17/11/2026, kênh dưới 450): một game, hai mode chơi chạy thành hai khung, dùng chung --irr-file data/dong-tu-bqt.json. Điểm 10/5/3/1.
  //   irrfill = mode "Chia từ": bảng 3 hàng V1–V2–V3, một hàng khuyết 1 ô, gõ từ còn thiếu · irrfind = mode "Tìm từ": chọn động từ bất quy tắc trong 4 từ.
  irrfill: { icon: '📝', name: 'Chia động từ', kind: 'học', rule: 'Bảng động từ bất quy tắc V1 – V2 – V3 khuyết 1 ô: gõ từ còn thiếu vào bình luận (sai được gõ lại); chữ cái gợi ý mở dần', sec: 15, total: 8, reveal: 7 },
  // Bricky (19/11/2026, kênh dưới 450): --bricky-file data/bricky.json (build_bricky.js). Mỗi bảng 40 giây, 4 bảng mỗi lượt. Điểm RIÊNG của khung:
  //   mỗi từ hợp lệ +1 (mỗi người một lần cho mỗi từ, không giới hạn số từ), người thật đầu tiên tự gõ đủ mọi từ trên bảng +10. Xem khối Bricky bên dưới.
  bricky: { icon: '🧱', name: 'Bricky', kind: 'giải trí', rule: 'Cho 4–5 chữ cái: ghép thành các từ tiếng Anh (3 chữ trở lên) rồi gõ vào bình luận; mỗi từ đúng +1, người đầu tiên điền đủ bảng +10. Bảng cuối: 6 chữ cái, 8 từ, thời gian ×1,5, điểm ×2', sec: 40, total: 4, reveal: 8 },
  // Hái từ (19/11/2026, kênh dưới 450; lúc đầu tên Fruity, chỉ có trái cây; 20/11 người dùng mở thành 30 chủ đề): --haitu-dir data/hai-tu.
  //   Mỗi bảng một chủ đề, lưới 4×4 ảnh, mỗi ô có chữ A–P, ảnh và tên tiếng Việt; gõ tên tiếng Anh: người gõ đúng ĐẦU TIÊN làm "quả" rụng và +2,
  //   mỗi ô chỉ một người hái; hết bảng ai hái nhiều nhất +5. Xem khối Hái từ bên dưới.
  haitu: { icon: '🍎', name: 'Hái từ', kind: 'giải trí', rule: 'Lưới 16 ảnh cùng một chủ đề kèm tên tiếng Việt: gõ tên tiếng Anh để hái; mỗi ô ai gõ đúng trước được +2, hết bảng ai hái nhiều nhất +5', sec: 60, total: 3, reveal: 8 },
  // 20/11/2026: người dùng tăng 10 → 14 giây mỗi câu (Tìm bất quy tắc).
  irrfind: { icon: '👀', name: 'Tìm bất quy tắc', kind: 'học', rule: 'Trong 4 động từ, chọn A, B, C hoặc D: từ nào là động từ bất quy tắc; công bố kèm dạng quá khứ của cả 4 từ', sec: 14, total: 8, reveal: 7 },
  // Thêm bớt 1 chữ (19/11/2026, kênh dưới 450): --mot-chu-file data/mot-chu.json (build_mot_chu.js). Điểm 10/5/3/1; VỀ ĐÍCH = ONE_RED câu cuối lượt
  // (từ rất dễ nhầm), điểm ×ONE_RED_MULT, giao diện lửa dùng chung với Bricky / Thế chữ. Xem khối Thêm bớt 1 chữ bên dưới.
  oneletter: { icon: '✂️', name: 'Thêm bớt 1 chữ', kind: 'học', rule: 'Thêm hoặc bớt đúng 1 chữ cái (theo lệnh trên màn) để thành từ có nghĩa, gõ cả từ vào bình luận (sai được gõ lại). Câu cuối là VỀ ĐÍCH: từ rất dễ nhầm, điểm ×2', sec: 15, total: 10, reveal: 6 },
};
// Mặc định = kênh dưới 450 (11/11/2026). Chương trình cũ của bản Jaemy: --program-order class,quiz,scramble,listen,reverse,type
const PROGRAM = String(arg('program-order', 'word,emoji,irrfill,scramble,startend,irrfind,bricky,haitu,listenmean,oneletter,hunt,chain')).split(',').filter((k) => SEGMENTS[k]);
// Số câu mỗi lượt riêng từng khung, vd --seg-total word=20,fillin=10 (17/11/2026: kênh 450–650 gấp đôi Word, Điền từ).
// Khung không đặt thì giữ `total` ở SEGMENTS, không có thì theo --questions. Đổi lúc đang chạy: /cmd {"cmd":"config","cfg":{"segTotal":{…}}}.
function setSegTotals(m) {
  for (const [k, n] of Object.entries(m || {})) if (SEGMENTS[k] && k !== 'crossword') SEGMENTS[k].total = clamp(n, 1, 50, SEGMENTS[k].total);
}
setSegTotals(Object.fromEntries(String(arg('seg-total', '')).split(',').map((x) => x.split('=')).filter(([k, n]) => k && n)));
let progIdx = 0;
const segFor = () => (CFG.style === 'program' ? PROGRAM[progIdx % PROGRAM.length] : CFG.style); // khung của lượt KẾ TIẾP
const curSeg = () => (game && phase !== 'break' ? game.seg : segFor());
// fin: chỉ khi lượt có từ 2 câu / bảng (markFinish cũng vậy), để màn giới thiệu không hứa "về đích" ở lượt 1 câu
const segPub = (id) => ({ id, ...SEGMENTS[id], ...(FINISH_SEGS.has(id) && (id === 'crossword' || (SEGMENTS[id].total || CFG.questions) > 1) && { fin: { mult: FINISH_MULT, unit: finUnit(id) } }) });
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
const ptsFor = (seg, rank) => (['word', 'startend', 'fillin', 'listenmean', 'errhunt', 'crossword', 'dictate', 'speedread', 'emoji', 'irrfill', 'irrfind', 'oneletter'].includes(seg) ? RANK_PTS[rank] ?? 1 : Math.max(3, 10 - 2 * rank));

// Săn từ: bảng dựng lúc chơi bằng san-tu.js (không còn file ma trận dựng sẵn). HUNT_PTS = điểm cho mỗi chỗ một từ nằm trên bảng;
// HUNT_HINT_SEC = sau ngần ấy giây của lượt mà chưa ai tìm được từ nào thì một từ nhấp nháy gợi ý.
const sanTu = require('./san-tu');
const HUNT_PTS = 2, HUNT_HINT_SEC = 10;
// Thanh mana (người dùng đặt 26/11/2026): mỗi từ có người tìm được +1 mana (tối đa 30), mana giữ qua các lượt. Hết lượt, mana đạt mốc nào cao nhất
// thì dùng chiêu của mốc đó và mana về 0 (chưa tới 10 thì giữ nguyên cho lượt sau): 10 = hai tên lửa nhỏ, mỗi quả nổ 3×3 ở chỗ bất kỳ, ưu tiên gần đáy ·
// 20 = một quả bom ở chỗ bất kỳ, nổ chữ thập ngang + dọc suốt bảng, dày 3 ô · 30 = coi bảng như bàn cờ vua, nổ hết ô đen. Ô bị chiêu phá nổ cùng các
// chiêu phá cũng nổ rồi chữ rơi xuống; chiêu không cộng điểm cho ai. Thứ tự (người dùng chốt 26/11/2026): từ đã tìm nổ → chữ rơi xuống xong (bảng `mid`)
// → chiêu đánh lên bảng `mid` → chữ rơi lần nữa (bảng `next`). HUNT_POWER_SEC = giây công bố cộng thêm để diễn chiêu và lần rơi thứ hai.
const HUNT_MANA = [10, 20, 30], HUNT_POWER_SEC = 2.6;
function huntPower(mana) {
  const N = sanTu.N, lv = HUNT_MANA.filter((x) => mana >= x).length, rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  if (!lv) return null;
  const cells = new Set(), add = (r, c) => { if (r >= 0 && c >= 0 && r < N && c < N) cells.add(r * N + c); };
  let at;
  if (lv === 1) {
    // tâm cách mép 1 ô để đủ 3×3; hàng lệch về đáy (mũ 1.8: nửa số lần rơi vào 3 hàng dưới cùng); hai quả không chồng vùng nổ
    const pick = () => [N - 2 - Math.floor(Math.pow(Math.random(), 1.8) * 9), rnd(1, N - 2)];
    const a = pick();
    let b = pick();
    for (let i = 0; i < 40 && Math.abs(a[0] - b[0]) < 3 && Math.abs(a[1] - b[1]) < 3; i++) b = pick();
    at = [a, b];
    for (const [r, c] of at) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) add(r + i, c + j);
  } else if (lv === 2) {
    at = [[rnd(1, N - 2), rnd(1, N - 2)]];
    const [r, c] = at[0];
    for (let k = 0; k < N; k++) for (let i = -1; i <= 1; i++) { add(r + i, k); add(k, c + i); }
  } else {
    at = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if ((r + c) % 2) add(r, c); // ô đen: góc trên trái là ô trắng
  }
  return { kind: ['rocket', 'bomb', 'checker'][lv - 1], need: HUNT_MANA[lv - 1], at, cells: [...cells] };
}

// ---------- khung 🍎 Hái từ ----------
// Bộ từ soạn tay, mỗi chủ đề một file data/hai-tu/<chủ đề>.json { id, name, items: [{ id, w, vi, ok, p }] } (không lấy từ kho Migii: kho thiếu
// từ cụ thể theo chủ đề; cần Migii duyệt). Ảnh (người dùng chốt: ảnh thật hoặc ảnh vẽ, KHÔNG emoji) ở public/img/hai-tu/<chủ đề>/<id>.jpg, nguồn
// từng ảnh ghi ở data/hai-tu-anh.json; mục chưa có ảnh thì bỏ qua, chủ đề chưa đủ HAITU_N mục có ảnh thì chưa lên bảng.
// Mỗi bảng bốc một chủ đề (xoay vòng hết các chủ đề mới lặp), trong chủ đề bốc HAITU_N mục (xoay vòng hết mục mới lặp).
// Luật (người dùng chốt 19/11/2026): ô hiện chữ A–P, ảnh, tên tiếng Việt; gõ tên tiếng Anh (gõ kèm chữ ô như "A apple" cũng được). Mỗi bình luận
// hợp lệ làm rụng ĐÚNG 1 ô: người gõ đúng đầu tiên +HAITU_PTS, ô đó hết với người khác. Hết bảng (hết giờ hoặc hết ô) người THẬT hái nhiều
// nhất +HAITU_TOP (hoà thì người đạt số đó trước). Còn nửa thời gian thì ô chưa ai hái hiện chữ cái đầu.
const HAITU_DIR = path.resolve(__dirname, String(arg('haitu-dir', 'data/hai-tu')));
const HAITU_N = 16, HAITU_PTS = 2, HAITU_TOP = 5;
let HAITUQ = null;
function haituBank() {
  if (!HAITUQ) {
    const topics = [], thin = [];
    let files = [];
    try { files = fs.readdirSync(HAITU_DIR).filter((f) => f.endsWith('.json')).sort(); } catch {}
    for (const f of files) {
      const t = JSON.parse(fs.readFileSync(path.join(HAITU_DIR, f), 'utf8'));
      const items = (t.items || []).filter((x) => fs.existsSync(path.join(__dirname, 'public', 'img', 'hai-tu', t.id, `${x.id}.jpg`)));
      if (items.length >= HAITU_N) topics.push({ id: t.id, name: t.name, items, bag: [] });
      else thin.push(`${t.name} ${items.length}/${(t.items || []).length}`);
    }
    HAITUQ = { topics, bag: [] };
    console.log(`🍎 Hái từ: ${topics.length} chủ đề đủ ảnh (${topics.map((t) => `${t.name} ${t.items.length}`).join(', ') || 'chưa có'})${thin.length ? ` · chưa đủ ${HAITU_N} ảnh: ${thin.join(', ')}` : ''}`);
  }
  return HAITUQ;
}
function pickHaiTu() {
  const Q = haituBank();
  if (!Q.topics.length) throw new Error(`Hái từ: chưa có chủ đề nào đủ ${HAITU_N} ảnh trong public/img/hai-tu/`);
  if (!Q.bag.length) Q.bag = shuffle(Q.topics);
  const T = Q.bag.pop(), out = [];
  while (out.length < HAITU_N) {
    if (!T.bag.length) T.bag = shuffle(T.items.filter((x) => !out.includes(x)));
    out.push(T.bag.pop());
  }
  return { topic: T, items: shuffle(out) };
}

// ---------- khung 🧱 Bricky ----------
// Bộ đề dựng sẵn trong data/bricky.json (build_bricky.js): mỗi đề một bộ 4–5 chữ cái, `board` = 5–7 từ định sẵn lên bảng (từ Migii có nghĩa: bank.json + word-300/400),
// `extra` = mọi từ tiếng Anh hợp lệ khác ghép được từ bộ chữ. Người xem gõ từ nào thì chỉ tra hai danh sách đó.
// Luật (người dùng chốt 19/11/2026): mỗi người có tiến độ riêng; từ trên bảng mở ô khi có người gõ đúng đầu tiên (kèm tên), người khác gõ lại vẫn +1;
// từ hợp lệ ngoài bảng cũng +1 và hiện ở dải "Từ thêm"; mỗi người chỉ được +1 một lần cho mỗi từ; người THẬT đầu tiên tự gõ đủ mọi từ trên bảng
// +BRICKY_WIN. Bảng chỉ kết thúc khi hết giờ. Còn nửa thời gian thì mở chữ cái đầu của các từ chưa ai tìm ra.
const BRICKY_FILE = path.resolve(__dirname, String(arg('bricky-file', 'data/bricky.json')));
const BRICKY_WIN = 10;
// Bảng CUỐI mỗi lượt (người dùng 19/11/2026): khó hơn và nhiều từ hơn (đề `finals`: bộ 6 chữ cái, 8 từ trên bảng), thời gian ×1,5, mọi điểm ×2,
// giao diện "về đích" dùng chung với ván tăng tốc của Thế chữ (#stage.fire + màn chuyển Ninja đỏ). Đồng hồ đứng BRICKY_FINAL_GRACE giây đầu bảng
// để màn chuyển (~3,4 giây) không ăn vào giờ chơi. File đề không có `finals` (hoặc lượt chỉ 1 bảng) thì không có bảng cuối.
const BRICKY_FINAL_TIME = 1.5, BRICKY_FINAL_MULT = 2, BRICKY_FINAL_GRACE = 4;
let BRICKYQ = null;
function brickyBank() {
  if (!BRICKYQ) {
    const d = JSON.parse(fs.readFileSync(BRICKY_FILE, 'utf8'));
    BRICKYQ = { sets: d.sets, finals: d.finals || [], bag: [], fbag: [] };
    console.log(`🧱 Bricky: ${BRICKYQ.sets.length} đề + ${BRICKYQ.finals.length} đề bảng cuối từ ${path.relative(__dirname, BRICKY_FILE)}`);
  }
  return BRICKYQ;
}
function pickBricky(final) {
  const Q = brickyBank();
  if (final) {
    if (!Q.fbag.length) Q.fbag = shuffle(Q.finals);
    return Q.fbag.pop();
  }
  if (!Q.bag.length) Q.bag = shuffle(Q.sets);
  return Q.bag.pop();
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
// Khung Đoán emoji: câu làm sẵn trong data/emoji-400.json ({t, e, a, alt, m}; kiểm kho bằng node check_emoji.js).
// t: ghep = từ ghép, mỗi emoji một nửa từ · mota = emoji tả nghĩa · cum = cụm từ. Gõ đúng a hoặc một alt (bỏ dấu cách, hoa thường) là đúng.
const EMOJI_FILE = path.resolve(__dirname, String(arg('emoji-file', 'data/emoji-400.json')));
let EMOJIQ = null;
function pickEmoji() {
  if (!EMOJIQ) {
    EMOJIQ = { qs: JSON.parse(fs.readFileSync(EMOJI_FILE, 'utf8')).questions, bag: [] };
    console.log(`🤔 Đoán emoji: ${EMOJIQ.qs.length} câu từ ${path.relative(__dirname, EMOJI_FILE)}`);
  }
  if (!EMOJIQ.bag.length) EMOJIQ.bag = shuffle(EMOJIQ.qs);
  return EMOJIQ.bag.pop();
}
// Ô chữ theo từng từ của đáp án. Gợi ý theo hintLevel(): 1 = chữ cái đầu mỗi từ, 2 = mở thêm các chữ ở round.emoji.open; công bố thì hiện hết.
function emojiSlots(rev) {
  const E = round.emoji, lv = rev ? 0 : hintLevel();
  return E.words.map((w, k) => [...w].map((ch, i) => (rev ? { ch, kind: 'full' } : (lv >= 1 && i === 0) || (lv >= 2 && E.open[k].includes(i)) ? { ch, kind: 'cho' } : { ch: '', kind: 'empty' })));
}
// Hai khung Động từ bất quy tắc: kho soạn tay trong data/dong-tu-bqt.json (kiểm bằng node check_bqt.js), câu hỏi dựng ở irregular.js.
const IRR_FILE = path.resolve(__dirname, String(arg('irr-file', 'data/dong-tu-bqt.json')));
let IRR = null;
function irrBank() {
  if (!IRR) {
    IRR = require('./irregular').create(JSON.parse(fs.readFileSync(IRR_FILE, 'utf8')));
    console.log(`📝 Động từ bất quy tắc: ${IRR.verbs.length} từ (Chia động từ dùng ${IRR.fillable.length}) + ${IRR.regular.length} động từ có quy tắc từ ${path.relative(__dirname, IRR_FILE)}`);
  }
  return IRR;
}
// ---------- khung ✂️ Thêm bớt 1 chữ ----------
// Đề dựng sẵn trong data/mot-chu.json (build_mot_chu.js): { k: 'add'|'cut', s: chữ hiện ra, w: đáp án, m: nghĩa của đáp án, pos?, i, ch, sm? }.
// add = THÊM 1 chữ (s thiếu chữ ch, chèn vào trước s[i]) · cut = BỚT 1 chữ (s[i] = ch là chữ thừa). Người xem gõ cả từ đáp án, sai được gõ lại.
// Câu thường mỗi câu chỉ có MỘT từ trong từ điển thêm/bớt 1 chữ mà ra (build đã kiểm), nên chỉ chấm đúng từ w.
// VỀ ĐÍCH (người dùng chốt 19/11/2026 "về đích sẽ là từ rất dễ nhầm"): ONE_RED câu cuối lượt lấy từ `red` (cặp từ thật dễ nhầm như desert → dessert,
// hoặc lỗi chính tả hay gặp như adress), điểm ×ONE_RED_MULT, giao diện lửa (#stage.fire). Câu đỏ đầu tiên đứng đồng hồ ONE_RED_GRACE giây cho màn chuyển Ninja đỏ.
const MOTCHU_FILE = path.resolve(__dirname, String(arg('mot-chu-file', 'data/mot-chu.json')));
const ONE_RED = 3, ONE_RED_MULT = 2, ONE_RED_GRACE = 4;
let MOTCHU = null;
function pickOneLetter(red) {
  if (!MOTCHU) {
    const d = JSON.parse(fs.readFileSync(MOTCHU_FILE, 'utf8'));
    MOTCHU = { qs: d.questions, red: d.red || [], bag: [], rbag: [] };
    console.log(`✂️ Thêm bớt 1 chữ: ${MOTCHU.qs.length} câu + ${MOTCHU.red.length} câu về đích từ ${path.relative(__dirname, MOTCHU_FILE)}`);
  }
  if (red && MOTCHU.red.length) {
    if (!MOTCHU.rbag.length) MOTCHU.rbag = shuffle(MOTCHU.red);
    return MOTCHU.rbag.pop();
  }
  if (!MOTCHU.bag.length) MOTCHU.bag = shuffle(MOTCHU.qs);
  return MOTCHU.bag.pop();
}
// Số câu về đích của lượt: 3 câu cuối khi lượt đủ 9 câu, lượt ngắn thì ít hơn (lượt dưới 4 câu không có về đích)
const oneRedN = () => (game.total >= 4 ? Math.min(ONE_RED, Math.floor(game.total / 3)) : 0);
// Gợi ý (từ mức hintLevel() 1): THÊM = đánh dấu chỗ thiếu chữ · BỚT = khoanh cặp 2 chữ có chữ thừa. Không bao giờ hiện chính chữ cái thêm/bớt.
function oneHint(rev) {
  const O = round.one;
  if (rev || hintLevel() < 1) return null;
  return O.q.k === 'add' ? { gap: O.q.i } : { pair: O.pair };
}

// Ô chữ của ô khuyết (khung Chia động từ). Gợi ý theo hintLevel(): 1 = chữ cái đầu, 2 = mở thêm chữ ở round.irr.open; công bố thì hiện hết.
function irrSlots(rev) {
  const I = round.irr, lv = rev ? 0 : hintLevel();
  return [...I.ans].map((ch, i) => (rev ? { ch, kind: 'full' } : (lv >= 1 && i === 0) || (lv >= 2 && I.open.includes(i)) ? { ch, kind: 'cho' } : { ch: '', kind: 'empty' }));
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
  botsCross(round);
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
  botsCross(round);
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
  let pts = base * (round.mult || 1); // về đích (hàng cuối / vòng từ khoá cuối): ×2
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
// Số loại chữ cái đã hiện; 99 = hiện hết (3 giây cuối). 20/11/2026 (người dùng duyệt): người xem lướt TikTok hay tắt tiếng và khung này
// mất người xem nhanh nhất (−5,5%/phút) → hiện sẵn MỘT NỬA số loại chữ ngay từ đầu, mỗi GIÂY thêm 1 (trước: bắt đầu trống, 2 giây thêm 1),
// nên vài giây là đọc được cả từ; người nghe được vẫn đoán sớm hơn nên vẫn có lợi.
function lmLevel() {
  const t = (now() - timer.startedAt) / 1000;
  if (t >= SEGMENTS.listenmean.sec - 3) return 99;
  return Math.floor((round?.lm?.order.length || 0) / 2) + Math.max(0, Math.floor(t));
}
function lmSlots(rev) { // chỉ gửi những chữ ĐÃ hiện, chữ chưa hiện là '' (không để lộ đáp án trong trạng thái gửi đi)
  const lv = rev ? 99 : lmLevel(), shown = new Set(lv >= 99 ? round.lm.order : round.lm.order.slice(0, lv));
  return [...round.lm.word].map((ch) => (shown.has(ch) ? ch : ''));
}

// ---------- khung 🔗 Thế chữ (mốc 400) ----------
// Luật từ 13/11/2026 (người dùng đổi): KHÔNG chia đội, mọi người chơi chung. Ván = một chuỗi: ra một từ 4 chữ, ai nhanh tay đổi ĐÚNG 1 chữ cái
// thành từ có nghĩa (toàn từ điển, dict.js; không lặp từ đã dùng trong ván) thì từ đó thay vào ngay và người đó thành NGƯỜI GIỮ TỪ
// (hiện hình ngay dưới từ). Lượt kế, người KHÁC thế được thì thay người giữ. Hết CHAIN_SEC giây không ai thế được → người giữ từ thắng ván,
// chỉ người thắng được +CHAIN_WIN điểm. Chưa ai thế được từ đầu tiên thì ván không có người thắng.
// Nhịp mỗi lượt: đồng hồ đứng CHAIN_GRACE giây (từ mới vừa hiện) → đếm ngược CHAIN_SEC giây → về 0 thì NGẦM chờ thêm CHAIN_LATE giây
// (TikTok trễ ~4 giây so với màn live: cứu bình luận gõ kịp giờ nhưng tới muộn). Trong lúc đồng hồ đứng vẫn nhận từ; bot chờ hết mới gõ.
// Kỷ lục chuỗi lưu data/the-chu-record.json (chuỗi toàn bot không tính).
const CHAIN_SEC = SEGMENTS.chain.sec;
const CHAIN_GRACE = 4;
const CHAIN_LATE = 3;
const CHAIN_WIN = 10;
// 17/11/2026 (người dùng đồng ý): ván quá dài làm người xem bỏ đi (ván 135 từ ≈ 11 phút, người vào mới giảm một nửa) →
// chuỗi đủ CHAIN_MAX từ hoặc ván đã chạy CHAIN_MAX_SEC giây thì người vừa thế được từ thắng luôn. Kỷ lục cũ (243 từ) vì thế không phá được nữa.
const CHAIN_MAX = 40;
const CHAIN_MAX_SEC = 180;
// 19/11/2026 (người dùng chốt bản nâng cấp):
// · Chữ khoá: mỗi ván có 1 vị trí bị khoá (round.lock), chữ ở đó không được đổi.
// · Ván CUỐI của lượt là "tăng tốc": từ CHAIN_FINAL_LEN chữ, ai cũng được đổi 1 hoặc 2 chữ (round.max = 2), màn live chuyển sang giao diện lửa.
// · Chuỗi đủ CHAIN_SWAP từ: hệ thống tự ra một từ mới, người giữ từ vẫn giữ (chống quẩn quanh một cụm từ).
// · Quà (tính theo xu của MỘT lần tặng, 1 hoa hồng = 1 xu), chỉ có tác dụng trong lượt Thế chữ đang chơi, bot không có:
//     ≥ x2 xu   : thắng ván nào trong lượt thì điểm ván đó nhân đôi
//     ≥ extra xu: mỗi extra xu được MỘT lần đổi 2 chữ cái ở ván từ 4 chữ (ván 5 chữ ai cũng đổi 2 chữ được nên không cần)
//     ≥ swap xu : ra từ mới ngay và người tặng thành người giữ từ; mỗi người một lần trong lượt. Tặng lúc đang công bố thì áp vào ván kế.
const CHAIN_SWAP = 30;
// 20/11/2026: người dùng TẠM bỏ chữ khoá (ván nào cũng round.lock = -1). Bật lại: đặt true, rồi thêm lại câu "chữ có khoá/🔒 thì giữ nguyên"
// ở SEGMENTS.chain.rule, tóm tắt cho MC AI (tìm "chữ đang bị khoá"), dòng luật + SEG_INTRO chain trong public/index.html, chain.gon + hoi_chain trong public/kich-ban.js.
const CHAIN_LOCK = false;
const CHAIN_FINAL_LEN = 5;
const CHAIN_FINAL_GRACE = 4; // ván tăng tốc: đồng hồ đứng thêm chừng này giây cho màn chuyển "TĂNG TỐC"
const CHAIN_GIFT = { x2: 1, extra: 3, swap: 10 };
function chainClock(extra = 0) {
  setPhase('question', CHAIN_SEC);
  if (round) round.grace = CHAIN_GRACE + extra; // bot chờ hết khoảng đồng hồ đứng mới gõ
  timer.startedAt += (CHAIN_GRACE + extra) * 1000; // màn live: chưa tới startedAt thì đồng hồ đứng ở CHAIN_SEC
  timer.endsAt += (CHAIN_GRACE + extra + CHAIN_LATE) * 1000; // màn live nhận endsAt đã trừ CHAIN_LATE (publicState) nên thấy 0 rồi mới hết thật
}
const CHAIN_REC_FILE = path.join(__dirname, 'data', 'the-chu-record.json');
let chainRec = { len: 0 };
try { chainRec = JSON.parse(fs.readFileSync(CHAIN_REC_FILE, 'utf8')); } catch {}
const CHAIN_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
// Bộ từ hợp lệ theo độ dài: thử mọi chuỗi chữ cái qua từ điển. 4 chữ ~0,2 giây; 5 chữ ~4 giây nên dựng dần theo chữ cái đầu
// (chainWarm, mỗi nhịp ~0,15 giây) ngay lúc bật server để ván tăng tốc không làm đứng màn live.
const chainSets = {};
function chainSet(L, budget = 26) {
  const S = chainSets[L] || (chainSets[L] = { set: new Set(), k: 0 });
  const rec = (p, str) => { if (p === L) { if (dict.isWord(str)) S.set.add(str); return; } for (const c of CHAIN_LETTERS) rec(p + 1, str + c); };
  while (S.k < 26 && budget-- > 0) rec(1, CHAIN_LETTERS[S.k++]);
  return S;
}
function chainWarm(L) { if (chainSet(L, 1).k < 26) setImmediate(() => chainWarm(L)); }
const CHAINDICTS = {};
function chainDict(L = 4) {
  if (CHAINDICTS[L]) return CHAINDICTS[L];
  const { set } = chainSet(L);
  // láng giềng: đổi 1 chữ (max = 1) hoặc 1–2 chữ (max = 2), không đụng vị trí khoá
  const neighbors = (w, max = 1, lock = -1) => {
    const r = new Set();
    for (let i = 0; i < L; i++) {
      if (i === lock) continue;
      for (const c of CHAIN_LETTERS) {
        if (c === w[i]) continue;
        const x = w.slice(0, i) + c + w.slice(i + 1);
        if (set.has(x)) r.add(x);
        if (max < 2) continue;
        for (let j = i + 1; j < L; j++) {
          if (j === lock) continue;
          for (const d of CHAIN_LETTERS) { if (d === w[j]) continue; const y = x.slice(0, j) + d + x.slice(j + 1); if (set.has(y)) r.add(y); }
        }
      }
    }
    return [...r];
  };
  // từ bắt đầu: từ L chữ trong bộ từ của mốc, có ít nhất 3 láng giềng (để ván không kẹt ngay)
  let pool = [];
  try { pool = loadWordQ().words; } catch {}
  if (!pool.length) pool = BANK_ALL.map((x) => x.w);
  const mine = [...new Set(pool.map((w) => String(w).toLowerCase()))].filter((w) => w.length === L && set.has(w));
  const starts = mine.filter((w) => neighbors(w, L === 4 ? 1 : 2).length >= 3);
  const D = CHAINDICTS[L] = { L, set, neighbors, starts, common: new Set(mine), recent: [] };
  console.log(`🔗 Thế chữ: ${set.size} từ ${L} chữ hợp lệ, ${starts.length} từ bắt đầu · kỷ lục hiện tại ${chainRec.len || 0} từ`);
  return D;
}
// Chọn từ mới (đầu ván, quà đổi từ, tự đổi sau CHAIN_SWAP từ) sao cho còn ít nhất 3 cách thế chưa dùng.
// lock = null: chọn luôn vị trí khoá cho ván · lock = số: ván đã có vị trí khoá, giữ nguyên.
function chainPick(D, max, used, lock = null) {
  if (!CHAIN_LOCK) lock = -1;
  const ok = (w) => !used.has(w);
  let pool = D.starts.filter((w) => ok(w) && !D.recent.includes(w));
  if (!pool.length) pool = D.starts.filter(ok);
  if (!pool.length) pool = D.starts;
  const left = (w, p) => D.neighbors(w, max, p).filter(ok).length;
  let w = pool[Math.floor(Math.random() * pool.length)], lk = lock ?? -1;
  for (let k = 0; k < 60; k++) {
    const c = pool[Math.floor(Math.random() * pool.length)];
    const locks = lock != null ? (left(c, lock) >= 3 ? [lock] : []) : [...Array(D.L).keys()].filter((p) => left(c, p) >= 3);
    if (locks.length) { w = c; lk = locks[Math.floor(Math.random() * locks.length)]; break; }
  }
  D.recent.push(w);
  if (D.recent.length > 20) D.recent.shift();
  return { w, lock: lk };
}
const chainPlayer = (user) => {
  const P = game.chain.players;
  return P.get(user.uid) || P.set(user.uid, { uid: user.uid, name: user.name, avatar: user.avatar || '', attempts: 0, valid: 0, wins: 0, ...(user.bot && { bot: true }) }).get(user.uid);
};

const chainHolder = (user) => ({ uid: user.uid, name: user.name, avatar: user.avatar || '', ...(user.bot && { bot: true }) });
function startChainMatch() {
  game.qNo++;
  questionsTotal++;
  const final = game.total > 1 && game.qNo >= game.total; // ván cuối của lượt: tăng tốc
  const L = final ? CHAIN_FINAL_LEN : 4, max = final ? 2 : 1, D = chainDict(L);
  const { w: start, lock } = chainPick(D, max, new Set());
  round = { mode: 'chain', stage: 'turn', sec: CHAIN_SEC, grace: CHAIN_GRACE, late: CHAIN_LATE, cur: start, holder: null, used: new Set([start]), log: [], t0: now(),
    len: L, max, lock, final,
    chain: [{ w: start, by: null }], word: { w: start, m: '', r: '', pos: '' }, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0 };
  // quà "đổi từ" tặng lúc ván trước đang công bố: người tặng giữ luôn từ mở ván này
  const pend = game.chain.swapNext;
  if (pend) { game.chain.swapNext = null; round.holder = chainHolder(pend); round.chain[0] = { w: start, by: pend.name, sys: true }; }
  chainClock(final ? CHAIN_FINAL_GRACE : 0);
  push();
  sim?.onChain?.(round, chainHelpers());
  botsChain(round);
}

function chainHelpers() {
  const D = chainDict(round?.len || 4), R = round;
  // cho bot / khán giả ảo: láng giềng theo luật của ván (số chữ được đổi, vị trí khoá), kiểm từ, từ thông dụng (từ trong bộ từ mốc) để bot không gõ từ hiếm
  return { neighbors: (w) => D.neighbors(w, R?.max || 1, R?.lock ?? -1), isWord: (w) => D.set.has(w), common: D.common };
}

// Ra từ mới giữa ván. user: người tặng quà đổi từ (thành người giữ từ) · không có user: hệ thống tự đổi, người giữ từ giữ nguyên.
function chainNewWord(user) {
  const R = round, { w } = chainPick(chainDict(R.len), R.max, R.used, R.lock);
  R.used.add(w);
  R.chain.push({ w, by: user ? user.name : null, sys: true });
  R.cur = w;
  R.word.w = w;
  if (user) R.holder = chainHolder(user);
  broadcast({ type: 'chainFx', kind: user ? 'swap' : 'auto', name: user?.name || null, w, len: R.chain.length });
}

// Quà trong lượt Thế chữ (gọi từ onGift). total = số xu của lần tặng này.
function chainGift(user, total) {
  const C = game.chain, R = round;
  const P = C.perks.get(user.uid) || C.perks.set(user.uid, { x2: false, extra: 0, swapped: false }).get(user.uid);
  const got = [];
  let left = total;
  if (!P.x2 && total >= CHAIN_GIFT.x2) { P.x2 = true; got.push('x2'); }
  if (left >= CHAIN_GIFT.swap && !P.swapped) {
    const live = R?.mode === 'chain' && R.stage === 'turn' && phase === 'question';
    if (live || game.qNo < game.total) { // hết ván cuối rồi thì không còn gì để đổi: phần xu này tính sang quyền đổi 2 chữ
      P.swapped = true; left -= CHAIN_GIFT.swap; got.push('swap');
      if (live) {
        chainNewWord(user);
        if (R.chain.length >= CHAIN_MAX) return endChainMatch();
        chainClock();
        sim?.onChain?.(R, chainHelpers());
        botsChain(R);
      } else C.swapNext = { uid: user.uid, name: user.name, avatar: user.avatar || '' };
    }
  }
  const n = Math.floor(left / CHAIN_GIFT.extra);
  if (n > 0) { P.extra += n; got.push('extra'); }
  if (got.length) broadcast({ type: 'chainFx', kind: 'perk', name: user.name, got, extra: P.extra });
}

// hết giờ (hoặc người dẫn bấm "Công bố"): không ai thế được nữa → người đang giữ từ thắng ván, +CHAIN_WIN điểm (chỉ người thắng có điểm)
function endChainMatch() {
  const C = game.chain, W = round.holder, len = round.chain.length;
  const x2 = !!(W && !W.bot && C.perks.get(W.uid)?.x2), pts = CHAIN_WIN * (x2 ? 2 : 1);
  if (W) {
    chainPlayer(W).wins++;
    const gp = gamePlayer(W), dp = W.bot ? { score: 0, correct: 0 } : dayPlayer(W);
    gp.score += pts; gp.correct++;
    dp.score += pts; dp.correct++;
    if (!W.bot) correctTotal++;
  }
  const isNew = len > (chainRec.len || 0) && round.chain.some((c) => c.by && !c.bot); // chuỗi toàn bot không lập kỷ lục
  if (isNew) {
    chainRec = { len, words: round.chain.map((c) => c.w), at: new Date().toISOString().slice(0, 10), winner: W?.name || null };
    fs.writeFile(CHAIN_REC_FILE, JSON.stringify(chainRec), () => {});
  }
  C.matches.push({ len, winner: W?.name || null });
  round.stage = 'over';
  round.stats = { winner: W ? { name: W.name, avatar: W.avatar } : null, pts, x2, len, isNew, record: chainRec.len || 0 };
  console.log(`🔗 Ván ${game.qNo}: ${W ? W.name + ' thắng' : 'không ai thế được từ đầu'}, chuỗi ${len} từ${isNew ? ' (KỶ LỤC MỚI)' : ''}: ${round.chain.map((c) => c.w).join(' → ')}`);
  prev = { w: round.chain[0].w, m: `chuỗi ${len} từ`, n: 0 };
  saveScores();
  setPhase('reveal', SEGMENTS.chain.reveal);
  push();
}

function advanceChain() {
  return endChainMatch();
}

function chainSummary() {
  const C = game.chain;
  return { matches: C.matches, players: [...C.players.values()].filter((m) => !m.bot).length, record: chainRec, longest: Math.max(0, ...C.matches.map((m) => m.len)) };
}

// Mọi bình luận trong khung Thế chữ đi qua đây (không dùng đường chấm điểm chung). Bình luận là chữ cái liền, dài đúng bằng từ hiện tại thì tính là một lần thử.
function onChainChat(user, msg, item) {
  const R = round;
  const w = msg.trim().toLowerCase().replace(/[.!?]+$/, '');
  if (R?.mode === 'chain' && R.stage === 'turn' && phase === 'question' && /^[a-z]+$/.test(w) && w.length === R.cur.length) {
    const m = chainPlayer(user), cur = R.cur;
    m.attempts++;
    let why = null, diff = 0, lockHit = false;
    for (let i = 0; i < w.length; i++) if (w[i] !== cur[i]) { diff++; if (i === R.lock) lockHit = true; }
    // ván 4 chữ: ai có quyền từ quà (perks.extra) thì được đổi 2 chữ một lần; ván 5 chữ: ai cũng được đổi 2 chữ
    const perk = user.bot ? null : game.chain.perks.get(user.uid);
    const allow = Math.max(R.max, R.max < 2 && perk?.extra > 0 ? 2 : 1);
    if (diff === 0) why = 'giống từ hiện tại';
    else if (diff > allow) why = allow > 1 ? 'chỉ được đổi tối đa 2 chữ cái' : 'chỉ được đổi 1 chữ cái';
    else if (lockHit) why = `chữ ${cur[R.lock].toUpperCase()} bị khoá`;
    if (!why && R.holder?.uid === user.uid) why = 'bạn đang giữ từ, chờ người khác thế';
    if (!why && R.used.has(w)) why = 'từ đã dùng';
    if (!why && !dict.isWord(w)) why = 'không có trong từ điển';
    R.log.push({ name: user.name, w, ok: !why, why });
    if (R.log.length > 4) R.log.shift();
    logFeed({ ...item, text: why ? `${w} ✗ ${why}` : `${w} ✓` });
    // ô "Câu trả lời" trên màn live: đúng thì ✓ kèm từ, sai thì ✗
    R.feed.push(why ? { ...item, choice: w } : { ...item, ok: true, words: w, pts: 0 });
    if (R.feed.length > 40) R.feed.splice(0, R.feed.length - 40);
    if (why) return push();
    m.valid++;
    const usedPerk = diff > R.max; // đổi 2 chữ ở ván 4 chữ: trừ một quyền từ quà
    if (usedPerk) perk.extra--;
    R.used.add(w);
    R.chain.push({ w, by: user.name, ...(user.bot && { bot: true }) });
    R.cur = w;
    R.word.w = w;
    R.holder = chainHolder(user);
    if (usedPerk) broadcast({ type: 'chainFx', kind: 'used', name: user.name, extra: perk.extra });
    if (R.chain.length >= CHAIN_MAX || now() - R.t0 >= CHAIN_MAX_SEC * 1000) return endChainMatch(); // ván đủ dài: người vừa thế thắng
    if (R.chain.length % CHAIN_SWAP === 0) chainNewWord(); // chuỗi đủ dài: hệ thống ra từ mới, người vừa thế vẫn giữ từ
    chainClock();
    push();
    sim?.onChain?.(R, chainHelpers());
    return botsChain(R);
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
// Thống kê (stats.js): ghi bình luận / quà / like / follow / share / người vào kèm game, pha, số người xem lúc đó → trang /stats.
// Không ghi khi chạy sau cổng thử 25 game (gateway.js) hoặc có --no-stats (script xuất ảnh): toàn khán giả ảo, file phình nhanh.
const stats = require('./stats').create({
  sim: SIM, tag: TAG, program: PROGRAM, off: !!process.env.GATEWAY_TOKEN || !!arg('no-stats', false),
  ctx: () => ({ s: game && phase !== 'break' ? game.seg : null, p: outro ? 'outro' : phase, g: game?.no || 0, q: game?.qNo || 0, v: viewers, c: SIM || tiktok.connected ? 1 : 0 }),
  room: () => tiktok.roomId,
});

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
// Khung Word = đua phi cơ (người dùng chốt 20/11/2026): điểm giữ nguyên cách tính, màn live ghi kèm "km/h" và vẽ mỗi người một phi cơ,
// khoảng cách giữa các phi cơ theo điểm. Chỉ hiện ai TRÊN RACE_MIN điểm, tối đa RACE_MAX chiếc, người thật được ưu tiên chỗ trước bot.
// ok (chỉ gửi khi công bố): câu này trả lời đúng hay không (sai hoặc bỏ câu = hỏng động cơ, chỉ là hình ảnh, không trừ điểm) · fast: người thật đúng nhanh nhất.
const RACE_MIN = 2, RACE_MAX = 20, RACE_FINAL_GRACE = 4;
function raceState(rev) {
  const all = ranked(game.players).filter((p) => p.score > RACE_MIN);
  const list = [...all.filter((p) => !p.bot), ...all.filter((p) => p.bot)].slice(0, RACE_MAX).sort((a, b) => b.score - a.score || b.correct - a.correct);
  const ok = new Set(round.winners);
  return { no: game.qNo, total: game.total, final: !!round.final, more: all.length - list.length,
    planes: list.map((p) => ({ name: p.name, avatar: p.avatar || '', score: p.score, ...(boosts.get(p.uid) && { x2: true }), ...(p.bot && { bot: true }),
      ...(rev && { ok: ok.has(p.uid), ...(round.fastUid === p.uid && { fast: true }) }) })) };
}

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
    endsAt: timer.endsAt == null ? null : timer.endsAt - (phase === 'question' && round?.late ? round.late * 1000 : 0), // Thế chữ: giấu 3 giây chờ bình luận tới muộn
    pausedAt,
    now: Date.now(),
    game: gameInfo(),
    nextGame: gameNo + 1,
    cfg: { questions: CFG.questions, roundSec: CFG.roundSec, music: CFG.music, voice: CFG.voice, neu: tts.enabled, neuVoice: tts.VOICE, mode: CFG.mode, style: CFG.style, teachSec: CFG.teachSec, ...(MUTE && { mute: true }) },
    seg: segPub(curSeg()),
    next: segPub(segFor()),
    program: CFG.style === 'program' ? PROGRAM.map((k) => ({ id: k, icon: SEGMENTS[k].icon, name: SEGMENTS[k].name })) : null,
    players: phase === 'break' ? scores.size : (game?.chain ? [...game.chain.players.values()].filter((m) => !m.bot).length : game?.players.size) || 0,
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
    // chặng về đích dùng chung (markFinish): first = câu mở màn chuyển, unit = "Câu" / "Bảng" / "Hàng" cho thanh trên và màn chuyển
    if (round.fin) s.fin = { mult: round.mult, first: !!round.finGrace, unit: round.stage === 'key' ? 'Từ khoá' : finUnit(game.seg) };
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
        // Tìm bất quy tắc: dạng quá khứ của cả 4 từ, bộ ba và nghĩa của từ bất quy tắc chỉ gửi khi công bố
        ...(round.irrfind && { irr: rev ? { forms: round.irrfind.forms, show: round.irrfind.v.show, m: round.irrfind.v.m, say: round.irrfind.say.map(audioUrl) } : {} }),
        ...(round.read && { read: { kind: round.read.q.kind, title: round.read.q.title, p: round.read.q.p, q: round.read.q.q, key: rev ? round.read.q.key : null } }),
      };
      s.winners = round.winners.length;
      s.answered = round.answered.size;
      if (round.called) s.called = { name: round.called.name, avatar: round.called.avatar, result: rev ? round.called.result || 'none' : null };
      if (round.right) s.right = rev ? round.right : null; // tên người đúng (lớp học: tô xanh bàn)
      if (rev) s.wrongNames = round.feed.filter((f) => f.choice && !f.ok).map((f) => f.name);
      if (game.seg === 'word') s.race = raceState(rev);
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
      const hx2 = !!(round.holder && !round.holder.bot && game.chain.perks.get(round.holder.uid)?.x2);
      s.q = { mode: 'chain', stage: round.stage, match: game.qNo, matches: game.total, cur: round.cur || null, sec: round.sec, pts: CHAIN_WIN * (hx2 ? 2 : 1),
        len: round.len, max: round.max, lock: round.lock, final: !!round.final, swapAt: CHAIN_SWAP, gift: CHAIN_GIFT,
        holder: round.holder ? { name: round.holder.name, avatar: round.holder.avatar, ...(hx2 && { x2: true }) } : null,
        chain: round.chain.slice(-16).map(({ w, by, sys }) => ({ w, by, ...(sys && { sys: true }) })), chainLen: round.chain.length, log: round.log,
        record: { len: chainRec.len || 0, at: chainRec.at || null }, stats: round.stage === 'over' ? round.stats : null,
        turnKey: `${game.qNo}.${round.stage}.${round.chain.length}` };
      s.winners = game.chain.matches.filter((m) => m.winner).length; // số ván đã có người thắng
      s.prev = prev;
      s.board = gameBoard(); // điểm = số ván thắng × CHAIN_WIN
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'hunt') {
      // grid = bảng của lượt này · found = từ đã có người tìm (ô để tô màu, tên, nghĩa, điểm) · hint = các ô của từ gợi ý đang nhấp nháy.
      // Công bố: boom = các ô nổ (chỉ số r * 16 + c; all = nổ cả bảng vì không ai tìm được gì), next = bảng sau khi chữ rơi xuống.
      const h = round.hunt;
      // mana = mana hiện có (lúc công bố đã về 0 nếu vừa dùng chiêu) · power = chiêu vừa dùng { kind, need, at: tâm nổ, zone: vùng chiêu, cells: mọi ô nổ vì chiêu },
      // toạ độ theo bảng `mid` (bảng sau khi các từ đã tìm nổ và chữ rơi xuống); không có chiêu thì không có mid, chữ rơi thẳng thành `next`
      s.q = { mode: 'hunt', turn: game.qNo, turns: game.total, grid: h.grid, pts: HUNT_PTS * (round.mult || 1), words: h.found.size, mana: game.hunt.mana, manaLv: HUNT_MANA,
        found: [...h.found.values()].map(({ w, by, n, pts, m, cells }) => ({ w, by, n, pts, m, cells })),
        hint: !rev && h.hintOn && !h.found.has(h.hint) ? h.hintCells : null,
        ...(rev && h.next && { boom: h.boom, all: h.all, next: h.next, ...(h.power && { power: h.power, mid: h.mid }) }) };
      s.winners = h.found.size;
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
    if (round.mode === 'emoji') {
      // Nghĩa tiếng Việt và đáp án chỉ gửi khi công bố; lúc hỏi chỉ có emoji, loại câu và ô chữ đã mở
      const q = round.emoji.q;
      s.q = { mode: 'emoji', e: q.e, t: q.t, n: norm(q.a).length, slots: emojiSlots(rev), ...(rev && { w: q.a, m: q.m, audio: audioUrl(q.a) }) };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'haitu') {
      // Ô chưa ai hái: chỉ gửi ảnh, tên tiếng Việt, số chữ cái (và chữ đầu khi tới mức gợi ý); tên tiếng Anh chỉ gửi khi đã rụng hoặc lúc công bố.
      const F = round.fr, hint = !rev && brickyHint(), lead = haituLead();
      s.q = { mode: 'haitu', topic: F.topic, left: F.tiles.filter((t) => !t.by).length, top: lead && { name: lead.name, n: lead.n }, pts: HAITU_PTS * (round.mult || 1), win: HAITU_TOP * (round.mult || 1),
        tiles: F.tiles.map((t, i) => ({ k: 'ABCDEFGHIJKLMNOP'[i], img: t.img, vi: t.vi, n: norm(t.w).length,
          ...(t.by ? { w: t.w, by: t.by, ...(t.av && { av: t.av }) } : rev ? { w: t.w } : hint ? { h: t.w[0] } : {}) })),
        ...(rev && { bonus: F.bonus, say: F.tiles.filter((t) => !t.by).map((t) => audioUrl(t.w)) }) };
      s.winners = F.picks.size;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'bricky') {
      // Từ chưa ai mở chỉ gửi số chữ cái (và chữ đầu khi đã tới mức gợi ý); chữ và nghĩa chỉ gửi khi đã có người mở hoặc lúc công bố.
      const B = round.bk, hint = !rev && brickyHint();
      s.q = { mode: 'bricky', tiles: B.tiles, all: B.valid.size, found: B.found.size, done: B.done, final: !!round.final, mult: round.mult, win: BRICKY_WIN * round.mult,
        board: B.board.map((x) => (x.by || rev ? { n: x.w.length, w: x.w, m: x.m, ...(x.by && { by: x.by }) } : { n: x.w.length, ...(hint && { h: x.w[0] }) })),
        extra: B.extra.slice(-10), more: Math.max(0, B.extra.length - 10),
        ...(rev && { rest: B.p.extra.filter((w) => !B.found.has(w)).slice(0, 6), say: audioUrl(B.p.letters), top: B.p.board.find((x) => x.w === B.p.letters) }) };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'irrfill') {
      // Ô khuyết của hàng đố gửi đi là null (chỉ có các chữ đã mở trong slots); đáp án và audio chỉ gửi khi công bố. Nghĩa tiếng Việt hiện từ đầu.
      const I = round.irr, q = I.q;
      s.q = { mode: 'irrfill', at: q.at, col: q.col, n: I.ans.length, m: q.v.m, slots: irrSlots(rev),
        rows: q.rows.map((r, i) => (i === q.at ? r.map((x, c) => (c === q.col ? null : x)) : r)),
        ...(rev && { w: q.v.show[q.col], audio: audioUrl(I.ans), say: q.say.map(audioUrl) }) };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'oneletter') {
      // Lúc hỏi chỉ gửi chữ hiện ra, lệnh THÊM/BỚT, nghĩa và gợi ý đang mở; đáp án, chữ cái thêm/bớt, nghĩa của chữ hiện ra (về đích) chỉ gửi khi công bố
      const q = round.one.q;
      s.q = { mode: 'oneletter', k: q.k, s: q.s, m: q.m, pos: q.pos || '', n: q.w.length, red: !!round.red, redFirst: !!round.grace, mult: round.mult,
        redNo: round.red ? round.one.redNo : 0, redN: round.red ? oneRedN() : 0, hint: oneHint(rev),
        ...(rev && { w: q.w, i: q.i, ch: q.ch, sm: q.sm || null, audio: audioUrl(q.w), say: q.sm ? audioUrl(q.s) : null }) };
      s.winners = round.winners.length;
      s.prev = prev;
      s.board = gameBoard();
      s.feed = round.feed.slice(-12);
      return s;
    }
    if (round.mode === 'scramble') {
      const lv = rev ? 2 : hintLevel();
      s.q = { mode: 'scramble', m: round.word.m, tiles: round.tiles, hint: rev ? [] : round.order.slice(0, lv), order: rev ? round.order : null,
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
    endsAt: timer.endsAt == null ? null : timer.endsAt - (phase === 'question' && round?.late ? round.late * 1000 : 0), // Thế chữ: giấu 3 giây chờ bình luận tới muộn
    pausedAt,
    now: Date.now(),
    game: gameInfo(),
    gameNo,
    answer: round && (phase === 'question' || phase === 'reveal')
      ? { ...round.word, winners: round.winners.length, hint: phase === 'question' && round.mode === 'type' ? hintLevel() : 2,
          mode: round.mode, options: round.options, answerIdx: round.answerIdx, votes: round.votes, listen: round.listen, answered: round.answered.size, called: round.called,
          wq: round.wq, demo: round.demo, ...(round.fill && { fillS: round.fill.s }), ...(round.err && { errS: round.err.s }), ...(round.dict && { dictS: round.dict.q.s }), ...(round.read && { readQ: round.read.q.q }),
          ...(round.mode === 'cross' && { cross: { stage: round.stage, idx: round.idx, solved: game.cross.solved, n: game.cross.p.rows.length, key: game.cross.p.key, open: crossBigOpen() } }),
          ...(round.mode === 'chain' && { chain: { stage: round.stage, cur: round.cur, len: round.chain.length, holder: round.holder?.name || null, players: game.chain.players.size } }),
          ...(round.mode === 'oneletter' && { one: { k: round.one.q.k, s: round.one.q.s, red: !!round.red } }) }
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
  // Chốt đáp án trễ (20/11/2026): màn live TikTok trễ ~4 giây so với server, nên người xem thấy câu hỏi muộn và gõ ở giây cuối thì bình luận
  // tới server khi câu đã công bố → mất. Mọi câu có đếm giờ: server nhận thêm CFG.lateSec giây; màn live nhận endsAt đã trừ round.late
  // (publicState) nên đồng hồ vẫn về 0 đúng giờ rồi mới công bố. Thế chữ có nhịp riêng (CHAIN_LATE trong chainClock).
  if (p === 'question' && sec != null && round && round.mode !== 'chain' && CFG.lateSec > 0) {
    round.late = CFG.lateSec;
    timer.endsAt += CFG.lateSec * 1000;
  }
  if (p === 'question') markFinish();
  stats.rec('phase');
}

// ---------- chặng VỀ ĐÍCH dùng chung ----------
// Người dùng 20/11/2026: mọi game đều phải có chặng về đích màu đỏ. Word (đua phi cơ), Bricky (bảng cuối), Thế chữ (ván tăng tốc),
// Thêm bớt 1 chữ (3 câu cuối) có cách riêng; các khung trong FINISH_SEGS dùng chung luật này: câu / bảng CUỐI của lượt là về đích:
// màn chuyển Ninja đỏ "VỀ ĐÍCH" + giao diện lửa (#stage.fire), mọi điểm ×FINISH_MULT (kể cả quà x2 thì nhân tiếp), đồng hồ đứng
// FINISH_GRACE giây cho màn chuyển (round.finGrace; bots.js / sim.js chờ hết rồi mới gõ). Giải ô chữ: về đích = hàng cuối, hoặc vòng
// đoán từ khoá cuối nếu có (từ khoá lúc đó +100). Màn chuyển chạy một lần mỗi lượt (game.finShown), "Đổi từ khác" không chạy lại.
// Gắn ở setPhase('question') ngay sau khi câu mới vừa dựng xong (round.fin chưa đặt), trước push() / bot / mô phỏng.
const FINISH_SEGS = new Set(['emoji', 'irrfill', 'scramble', 'startend', 'irrfind', 'listenmean', 'hunt', 'haitu', 'fillin', 'errhunt', 'speedread', 'dictate', 'crossword']);
const FINISH_MULT = 2, FINISH_GRACE = 4;
function markFinish() {
  if (!round || !game || round.fin !== undefined || !FINISH_SEGS.has(game.seg) || CFG.style !== 'program') return;
  round.fin = game.seg === 'crossword' ? round.stage === 'key' || game.qNo >= game.total : game.total > 1 && game.qNo >= game.total;
  if (!round.fin) return;
  round.mult = FINISH_MULT;
  if (!game.finShown) {
    game.finShown = true;
    round.finGrace = FINISH_GRACE; // màn live: chưa tới startedAt thì đồng hồ đứng ở mức đầy
    timer.startedAt += FINISH_GRACE * 1000;
    if (timer.endsAt != null) timer.endsAt += FINISH_GRACE * 1000;
  }
}
const finUnit = (seg) => ({ hunt: 'Lượt', haitu: 'Bảng', crossword: 'Hàng' })[seg] || 'Câu';

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
  stats.rec('game', { s: seg, n: game.total });
  if (seg === 'class') {
    game.style = 'class';
    if (!SIM && CFG.bots > 0) {
      const names = bots.names().sort(() => Math.random() - 0.5).slice(0, CFG.bots);
      for (const n of names) seat({ uid: `bot:${n}`, name: n, avatar: '', bot: true });
    }
    return startTeach();
  }
  if (seg === 'chain') {
    game.chain = { players: new Map(), matches: [], perks: new Map(), swapNext: null };
    return startChainMatch();
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
    options, answerIdx: options.indexOf(cap(q.a)), votes: [0, 0, 0, 0], rev: q.t === 'm2w', listen: false, wq: { t: q.t }, secret: cap(q.a),
    final: game.total > 1 && game.qNo >= game.total }; // câu cuối của lượt = chặng về đích
  setPhase('question', CFG.roundSec);
  if (round.final) { timer.startedAt += RACE_FINAL_GRACE * 1000; timer.endsAt += RACE_FINAL_GRACE * 1000; } // đồng hồ đứng trong lúc chạy màn chuyển "VỀ ĐÍCH"
  push();
  sim?.onQuestion(round);
  botsAsk(round);
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
  botsAsk(round);
}

// ---------- khung 🔎 Săn từ ----------
// Một LƯỢT = một "câu" của khung (game.qNo), 30 giây trên cùng một bảng; bảng sống suốt lượt chơi ở game.hunt.grid và đổi dần sau mỗi lượt.
// round.hunt: grid = bảng lượt này · map = mọi từ hợp lệ đang có trên bảng → các chỗ nó nằm (san-tu.js scan) · found = từ → { w, by, n, pts, m, cells }
// (by = người gõ ĐẦU TIÊN, n = số chỗ từ đó nằm, cells = mọi ô của từ) · x2 = uid được nhân đôi lượt này (quà) · hint = từ gợi ý chọn sẵn từ đầu lượt
// (bot không gõ từ này), hintOn = đã cho nhấp nháy · boom / next / all / power = đặt lúc công bố (huntReveal). game.hunt.mana = thanh mana (xem HUNT_MANA).
// "Đổi từ khác" trên màn điều khiển (replace) = thay cả bảng mới, không tính thêm lượt.
function startHuntQuestion(replace = false) {
  if (!game.hunt || replace) game.hunt = { grid: sanTu.newBoard(), mana: game.hunt?.mana || 0 };
  if (!replace) {
    game.qNo++;
    questionsTotal++;
  }
  const grid = game.hunt.grid, map = sanTu.scan(grid), sec = SEGMENTS.hunt.sec;
  const hint = sanTu.pickHint(map);
  const migii = [...map.keys()].filter((w) => sanTu.mean(w));
  round = { word: { w: 'Săn từ', m: `${map.size} từ trên bảng, ví dụ: ${migii.slice(0, 8).join(', ')}`, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(),
    feed: [], lastHint: 0, mode: 'hunt', demo: migii.slice(0, 5).join(' '),
    hunt: { grid, map, found: new Map(), x2: new Map(), hint, hintCells: hint ? sanTu.cellsOf(hint, map.get(hint)[0]) : null, hintOn: false, easy: migii.filter((w) => w !== hint) } };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
  botsAsk(round);
}
// Một bình luận gõ được nhiều từ (tối đa 8). Mỗi từ: có nghĩa (san-tu.js playable, đã nằm sẵn trong map của bảng) và CHƯA ai tìm trong lượt này thì
// người gõ được HUNT_PTS × số chỗ từ đó nằm trên bảng (có hai "her" thì ×2); người gõ sau không có điểm. Trả về true nếu có ít nhất một từ ăn điểm.
function onHuntChat(user, msg, item) {
  const h = round.hunt;
  const toks = [...new Set(msg.toLowerCase().split(/[\s,;.]+/).map((t) => t.replace(/^[^a-z]+|[^a-z]+$/g, '')).filter((t) => t.length >= sanTu.MIN_LEN))].slice(0, 8);
  const fresh = toks.filter((t) => h.map.has(t) && !h.found.has(t));
  if (!fresh.length) return false;
  if (!h.x2.has(user.uid)) { // quà x2: tính một lần cho cả lượt
    const b = boosts.get(user.uid) || 0;
    h.x2.set(user.uid, b > 0);
    if (b > 0) boosts.set(user.uid, b - 1);
  }
  let pts = 0;
  for (const w of fresh) {
    const at = h.map.get(w), p = HUNT_PTS * at.length * (h.x2.get(user.uid) ? 2 : 1) * (round.mult || 1); // lượt cuối = về đích: ×2
    h.found.set(w, { w, by: user.name, n: at.length, pts: p, m: sanTu.mean(w), cells: at.flatMap((o) => sanTu.cellsOf(w, o)), ...(user.bot && { bot: true }) });
    pts += p;
  }
  const gp = gamePlayer(user);
  if (user.bot) gp.bot = true;
  const dp = user.bot ? { score: 0, correct: 0 } : dayPlayer(user); // bot không vào bảng vàng ngày
  gp.score += pts;
  gp.correct += fresh.length;
  dp.score += pts;
  dp.correct += fresh.length;
  const st = seats.get(user.uid);
  if (st) st.stars++;
  if (!user.bot) {
    game.correct += fresh.length;
    correctTotal += fresh.length;
    gp.first = (gp.first || 0) + fresh.length; // mỗi từ là một lần "gõ đầu tiên" (giải Nhanh tay nhất ở màn vinh danh)
  }
  if (!round.winners.includes(user.uid)) round.winners.push(user.uid);
  game.hunt.mana = Math.min(HUNT_MANA[HUNT_MANA.length - 1], game.hunt.mana + fresh.length); // mỗi từ +1 mana (từ nằm nhiều chỗ vẫn +1)
  const words = fresh.map((w) => (h.map.get(w).length > 1 ? `${w} ×${h.map.get(w).length}` : w)).join(', ');
  Object.assign(item, { ok: true, pts, words, text: words, bot: !!user.bot });
  round.feed.push(item);
  if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
  logFeed(item);
  broadcast({ type: 'correct', ...item });
  push();
  return true;
}
// Hết lượt: các ô của mọi từ đã tìm nổ, chữ phía trên rơi xuống, chữ mới lấp đầy (san-tu.js refill). Không ai tìm được từ nào: nổ cả bảng, thả
// bảng mới (người dùng chốt 26/11/2026). Bảng sau được tính ngay lúc này và gửi kèm trạng thái công bố để màn live diễn cảnh nổ + rơi;
// lượt kế bắt đầu trên đúng bảng đó.
function huntReveal() {
  const h = round.hunt;
  if (h.next) return;
  const cleared = new Set();
  for (const f of h.found.values()) for (const [r, c] of f.cells) cleared.add(r * sanTu.N + c);
  if (!cleared.size) {
    Object.assign(h, { all: true, boom: null, next: sanTu.newBoard(), power: null });
  } else {
    const R = sanTu.refill(h.grid, cleared);
    Object.assign(h, { all: !!R.all, boom: R.all ? null : R.cleared, next: R.grid, power: null });
    // chiêu mana: đánh lên bảng SAU khi chữ đã rơi (mid). Ô chiêu phá có thể rộng hơn vùng chiêu vài ô (san-tu.js cho nổ thêm để gỡ từ tục / đủ từ Migii).
    const pw = R.all ? null : huntPower(game.hunt.mana);
    if (pw) {
      const R2 = sanTu.refill(R.grid, new Set(pw.cells));
      game.hunt.mana = 0;
      Object.assign(h, { mid: R.grid, next: R2.grid, power: { ...pw, cells: R2.all ? Array.from({ length: sanTu.N * sanTu.N }, (_, i) => i) : R2.cleared, zone: pw.cells } });
    }
  }
  game.hunt.grid = h.next;
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
  botsAsk(round);
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
  botsAsk(round);
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
  botsAsk(round);
}

// Khung Đoán emoji. round.word.w = đáp án (màn điều khiển, "Câu trước", chặn AI lộ đáp án dùng chung với khung gõ từ)
function startEmojiQuestion() {
  const q = pickEmoji(), words = q.a.split(' ');
  const sec = norm(q.a).length >= 12 ? 30 : SEGMENTS.emoji.sec; // cụm dài cần thêm giờ gõ
  game.qNo++;
  questionsTotal++;
  // gợi ý mức 2: mỗi từ từ 3 chữ cái mở thêm 1 chữ (từ 8 chữ cái: 2 chữ), không tính chữ đầu
  const open = words.map((w) => shuffle([...w].map((_, i) => i).slice(1)).slice(0, w.length >= 8 ? 2 : w.length >= 3 ? 1 : 0));
  round = { word: { w: q.a, m: q.m, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'emoji', demo: q.a,
    emoji: { q, words, open, ok: new Set([q.a, ...(q.alt || [])].map(norm)) } };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
  botsAsk(round);
}

// Khung Chia động từ (mode "Chia từ" của game Động từ bất quy tắc). round.word.w = đáp án (màn điều khiển, "Câu trước", chặn AI lộ đáp án, bot và
// người xem ảo gõ đáp án đều dùng chung với khung gõ từ). Chấm đúng: gõ đúng từ còn thiếu (mọi dạng được chấp nhận) hoặc gõ lại cả hàng.
function startIrrFillQuestion() {
  const q = irrBank().pickFill(), sec = SEGMENTS.irrfill.sec, ans = q.ok[0];
  game.qNo++;
  questionsTotal++;
  // gợi ý mức 2: đáp án từ 5 chữ cái mở thêm 1 chữ (không tính chữ đầu); từ ngắn hơn chỉ có chữ đầu
  const open = ans.length >= 5 ? [1 + Math.floor(Math.random() * (ans.length - 1))] : [];
  const row = (f) => q.say.map((x, c) => (c === q.col ? f : x)).join('');
  round = { word: { w: ans, m: `${q.v.show.join(' – ')} (${q.v.m})`, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'irrfill', demo: ans,
    irr: { q, ans, open, ok: new Set(q.ok.flatMap((f) => [f, row(f)]).map(norm)) } };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
  botsAsk(round);
}

// Khung Hái từ: một bảng HAITU_N ô cùng một chủ đề (round.fr.topic = tên chủ đề). round.fr: tiles = các ô (ok = mọi cách gõ được tính, by = tên người hái) · picks = uid → { name, n, at, bot }
// (n = số quả đã hái, at = lúc đạt số đó, để phân hoà) · x2 = uid được nhân đôi bảng này · bonus = người nhận +HAITU_TOP (đặt lúc công bố).
function startHaiTuQuestion() {
  const { topic, items } = pickHaiTu(), sec = SEGMENTS.haitu.sec;
  game.qNo++;
  questionsTotal++;
  const tiles = items.map((x) => ({ id: x.id, w: x.w, vi: x.vi, img: `img/hai-tu/${topic.id}/${x.id}.jpg`, ok: new Set([x.w, ...(x.ok || [])].map(norm)), by: null }));
  round = { word: { w: topic.name, m: `${topic.name}: ${tiles.map((t) => t.w).join(', ')}`, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0,
    mode: 'haitu', demo: tiles[0].w, fr: { topic: topic.name, tiles, picks: new Map(), x2: new Map(), bonus: null } };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
  botsAsk(round);
}
// Người THẬT đang hái nhiều nhất (hoà: người đạt số quả đó trước). Bot không được tính để không chiếm thưởng của người thật.
function haituLead() {
  let best = null;
  for (const p of round.fr.picks.values()) if (!p.bot && (!best || p.n > best.n || (p.n === best.n && p.at < best.at))) best = p;
  return best;
}
// Một bình luận chỉ hái được MỘT quả. Nhận "apple", "A apple", "a. apple": bỏ chữ ô đứng đầu (nếu có) rồi so cả bình luận với tên quả,
// không dò tên quả nằm lẫn trong câu tán gẫu. Trả về true nếu hái được.
function onHaiTuChat(user, msg, item) {
  const F = round.fr, m = msg.trim().match(/^([a-p])[\s.:)\-]+(.+)$/i);
  const tries = [norm(msg), ...(m ? [norm(m[2])] : [])];
  const tile = F.tiles.find((t) => !t.by && tries.some((x) => t.ok.has(x)));
  if (!tile) return false;
  tile.by = user.name;
  tile.av = user.avatar || ''; // ảnh đại diện TikTok: ô đã hái thay chữ A–P bằng avatar + tên (người dùng 20/11)
  if (!F.x2.has(user.uid)) { // quà x2: tính một lần cho cả bảng
    const b = boosts.get(user.uid) || 0;
    F.x2.set(user.uid, b > 0);
    if (b > 0) boosts.set(user.uid, b - 1);
  }
  const me = F.picks.get(user.uid) || { uid: user.uid, name: user.name, n: 0, at: 0, bot: !!user.bot };
  me.n++;
  me.at = Date.now();
  F.picks.set(user.uid, me);
  const pts = HAITU_PTS * (F.x2.get(user.uid) ? 2 : 1) * (round.mult || 1); // bảng cuối = về đích: ×2
  const gp = gamePlayer(user);
  if (user.bot) gp.bot = true;
  const dp = user.bot ? { score: 0, correct: 0 } : dayPlayer(user); // bot không vào bảng vàng ngày
  gp.score += pts;
  gp.correct++;
  dp.score += pts;
  dp.correct++;
  const st = seats.get(user.uid);
  if (st) st.stars++;
  if (!user.bot) {
    game.correct++;
    correctTotal++;
  }
  Object.assign(item, { ok: true, pts, words: tile.w, text: `${tile.w} · ${me.n} từ`, bot: !!user.bot });
  round.feed.push(item);
  if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
  logFeed(item);
  broadcast({ type: 'correct', ...item });
  // hết ô: công bố sớm (để 1,5 giây cho ô cuối rụng xong)
  if (F.tiles.every((t) => t.by) && timer.endsAt - Date.now() > 1500) timer.endsAt = Date.now() + 1500;
  push();
  return true;
}
// Công bố Hái từ (người dùng 20/11/2026): màn ẩn hết, các từ chưa ai hái hiện thành flash card lớn chạy lần lượt qua giữa màn (ảnh · tiếng Anh ·
// tiếng Việt), Ninja đọc từng từ, để người xem học từ mới. Mỗi thẻ ~1,9 giây: 8 giây khi còn ít từ, tối đa 36 giây khi còn cả 16 từ.
const haituRevealSec = () => Math.max(SEGMENTS.haitu.reveal, Math.min(36, Math.ceil(4 + 1.9 * round.fr.tiles.filter((t) => !t.by).length)));
// Lúc công bố: người thật hái nhiều nhất +HAITU_TOP (có quà x2 thì nhân đôi). Không ai hái thì không có thưởng.
function haituBonus() {
  const F = round.fr, lead = haituLead();
  if (!lead || F.bonus) return;
  const pts = HAITU_TOP * (F.x2.get(lead.uid) ? 2 : 1) * (round.mult || 1), gp = game.players.get(lead.uid), dp = scores.get(lead.uid);
  if (gp) { gp.score += pts; gp.first = (gp.first || 0) + 1; }
  if (dp) dp.score += pts;
  F.bonus = { name: lead.name, n: lead.n, pts };
  round.winners.push(lead.uid);
  const item = { name: lead.name, text: `hái nhiều nhất: ${lead.n} từ`, ok: true, pts, words: `${lead.n} từ` };
  round.feed.push(item);
  logFeed(item);
}

// Khung Bricky: một bảng 40 giây. round.word.w = từ dùng hết bộ chữ (màn điều khiển, "Câu trước"); KHÔNG dùng để chấm.
// round.bk: tiles = bộ chữ đã xáo (không trùng một từ hợp lệ) · board = từ trên bảng kèm `by` (tên người mở đầu tiên) · valid = mọi từ được tính
// mine = uid → các từ người đó đã được điểm · found = từ đã có người tìm · extra = từ ngoài bảng theo thứ tự tìm ra · done = tên người thật điền đủ bảng đầu tiên
function startBrickyQuestion() {
  game.qNo++;
  questionsTotal++;
  const final = game.total > 1 && game.qNo >= game.total && brickyBank().finals.length > 0;
  const p = pickBricky(final), sec = Math.round(SEGMENTS.bricky.sec * (final ? BRICKY_FINAL_TIME : 1));
  const valid = new Set([...p.board.map((x) => x.w), ...p.extra]);
  let tiles = shuffle([...p.letters]);
  for (let i = 0; i < 20 && valid.has(tiles.join('')); i++) tiles = shuffle([...p.letters]);
  round = { word: { w: p.letters, m: `từ trên bảng: ${p.board.map((x) => x.w).join(', ')}`, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0,
    mode: 'bricky', demo: p.board.map((x) => x.w).join(' '),
    final, mult: final ? BRICKY_FINAL_MULT : 1, grace: final ? BRICKY_FINAL_GRACE : 0,
    bk: { p, tiles, board: p.board.map((x) => ({ ...x, by: null })), valid, mine: new Map(), found: new Set(), extra: [], x2: new Map(), done: null } };
  setPhase('question', sec);
  if (final) { // màn live: chưa tới startedAt thì đồng hồ đứng ở mức đầy (như ván tăng tốc của Thế chữ)
    timer.startedAt += BRICKY_FINAL_GRACE * 1000;
    timer.endsAt += BRICKY_FINAL_GRACE * 1000;
  }
  push();
  sim?.onQuestion(round);
  botsAsk(round);
}
// Gợi ý Bricky: còn nửa thời gian thì mở chữ cái đầu của các từ trên bảng chưa ai tìm ra
const brickyHint = () => ((now() - timer.startedAt) / (timer.endsAt - timer.startedAt) >= 0.5 ? 1 : 0); // bảng cuối đang đứng đồng hồ: tỉ lệ âm → 0

// Bình luận trong khung Bricky. Một bình luận có thể chứa nhiều từ (tối đa 8); chỉ nhận mục viết liền bằng chữ a–z để tiếng Việt có dấu
// không bị cắt thành mảnh trùng một từ tiếng Anh. Trả về true nếu có ít nhất một từ được điểm (bình luận đã xử lý xong).
function onBrickyChat(user, msg, item) {
  const B = round.bk;
  const toks = msg.toLowerCase().split(/[\s,;.!?/|+-]+/).filter((t) => /^[a-z]{3,8}$/.test(t)).slice(0, 8); // bảng cuối có từ 6 chữ
  let mine = B.mine.get(user.uid);
  const fresh = [];
  for (const t of toks) {
    if (!B.valid.has(t) || mine?.has(t)) continue;
    (mine ||= new Set()).add(t);
    fresh.push(t);
    const slot = B.board.find((x) => x.w === t);
    if (slot) slot.by ||= user.name;
    else if (!B.found.has(t)) B.extra.push({ w: t, by: user.name });
    B.found.add(t);
  }
  if (!fresh.length) return false;
  B.mine.set(user.uid, mine);
  // quà x2: tính một lần cho cả bảng (không trừ theo từng từ), mọi điểm của người đó trong bảng này nhân đôi
  if (!B.x2.has(user.uid)) {
    const b = boosts.get(user.uid) || 0;
    B.x2.set(user.uid, b > 0);
    if (b > 0) boosts.set(user.uid, b - 1);
  }
  const gp = gamePlayer(user);
  if (user.bot) gp.bot = true;
  const dp = user.bot ? { score: 0, correct: 0 } : dayPlayer(user); // bot không vào bảng vàng ngày
  let pts = fresh.length * round.mult, first = false; // bảng cuối: mỗi từ +2, thưởng điền đủ +20
  // điền đủ bảng: tính theo từ của chính người đó. Bot không bao giờ nhận thưởng (bots.js cũng không cho bot gõ đủ bảng).
  if (!round.winners.includes(user.uid) && B.board.every((x) => mine.has(x.w))) {
    round.winners.push(user.uid);
    if (!user.bot) {
      round.realWinners++;
      if (!B.done) {
        B.done = user.name;
        first = true;
        pts += BRICKY_WIN * round.mult;
        gp.first++;
      }
    }
  }
  if (B.x2.get(user.uid)) pts *= 2;
  gp.score += pts;
  gp.correct += fresh.length;
  dp.score += pts;
  dp.correct += fresh.length;
  const st = seats.get(user.uid);
  if (st) st.stars++;
  if (!user.bot) {
    game.correct += fresh.length;
    correctTotal += fresh.length;
  }
  Object.assign(item, { ok: true, pts, words: fresh.join(' '), text: `${fresh.join(', ')}${first ? ' · điền đủ bảng đầu tiên' : ''}`, bot: !!user.bot, ...(first && { rank: 1, bricky: true, final: !!round.final }) });
  round.feed.push(item);
  if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
  logFeed(item);
  broadcast({ type: 'correct', ...item });
  push();
  return true;
}

// Khung Thêm bớt 1 chữ. round.word.w = đáp án (màn điều khiển, "Câu trước", chặn AI lộ đáp án, bot và người xem ảo gõ đáp án dùng chung với khung gõ từ).
// round.red = câu về đích, round.mult = hệ số điểm, round.grace = số giây đồng hồ đứng (chỉ câu đỏ đầu tiên, cho màn chuyển).
// replace = người dẫn bấm "Đổi từ khác": đổi câu khác cùng số thứ tự (không tính thêm câu, không chạy lại màn chuyển về đích)
function startOneLetterQuestion(replace = false) {
  if (!replace) {
    game.qNo++;
    questionsTotal++;
  }
  const redN = oneRedN(), redNo = game.qNo - (game.total - redN), red = redN > 0 && redNo >= 1;
  const q = pickOneLetter(red), sec = SEGMENTS.oneletter.sec, grace = red && redNo === 1 && !replace ? ONE_RED_GRACE : 0;
  // BỚT: cặp 2 chữ khoanh làm gợi ý = chữ thừa + chữ bên cạnh (chữ đôi thì đúng cặp đó)
  const i = q.i, pair = q.k !== 'cut' ? null : q.s[i - 1] === q.s[i] ? [i - 1, i] : q.s[i + 1] === q.s[i] || i === 0 ? [i, i + 1] : i === q.s.length - 1 || Math.random() < 0.5 ? [i - 1, i] : [i, i + 1];
  round = { word: { w: q.w, m: q.m, r: '', pos: q.pos || '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'oneletter', demo: q.w,
    red, mult: red ? ONE_RED_MULT : 1, grace, one: { q, pair, redNo } };
  setPhase('question', sec);
  if (grace) { // màn live: chưa tới startedAt thì đồng hồ đứng ở mức đầy (như bảng cuối Bricky)
    timer.startedAt += grace * 1000;
    timer.endsAt += grace * 1000;
  }
  push();
  sim?.onQuestion(round);
  botsAsk(round);
}

// Khung Tìm bất quy tắc (mode "Tìm từ"): round.mode vẫn là 'mcq' (chấm điểm, mô phỏng, bot dùng lại phần trắc nghiệm); round.word.w KHÔNG phải đáp án
function startIrrFindQuestion() {
  const q = irrBank().pickFind(), sec = SEGMENTS.irrfind.sec;
  game.qNo++;
  questionsTotal++;
  round = { word: { w: 'Bất quy tắc', m: `${q.v.show.join(' – ')} (${q.v.m})`, r: '', pos: '' }, sec, winners: [], realWinners: 0, answered: new Set(), feed: [], lastHint: 0, mode: 'mcq',
    options: q.options, answerIdx: q.answerIdx, votes: [0, 0, 0, 0], rev: false, listen: false, wq: { t: 'irr' }, irrfind: q, secret: q.options[q.answerIdx] };
  setPhase('question', sec);
  push();
  sim?.onQuestion(round);
  botsAsk(round);
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
  botsAsk(round);
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
  botsAsk(round);
}

function startQuestion(replace = false) {
  if (game.seg === 'word') return startWordQuestion();
  if (game.seg === 'startend') return startEndQuestion();
  if (game.seg === 'hunt') return startHuntQuestion(replace);
  if (game.seg === 'fillin') return startFillQuestion();
  if (game.seg === 'listenmean') return startListenMeanQuestion();
  if (game.seg === 'errhunt') return startErrQuestion();
  if (game.seg === 'dictate') return startDictQuestion();
  if (game.seg === 'speedread') return startReadQuestion();
  if (game.seg === 'emoji') return startEmojiQuestion();
  if (game.seg === 'irrfill') return startIrrFillQuestion();
  if (game.seg === 'irrfind') return startIrrFindQuestion();
  if (game.seg === 'bricky') return startBrickyQuestion();
  if (game.seg === 'haitu') return startHaiTuQuestion();
  if (game.seg === 'oneletter') return startOneLetterQuestion(replace);
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
    // xáo chữ cái thành thẻ (16/11: thẻ không còn đánh số, người xem gõ cả từ). perm[j] = vị trí trong từ của thẻ j
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
  botsAsk(round);
}

function reveal() {
  if (round.mode === 'haitu') haituBonus();
  if (round.mode === 'hunt') huntReveal();
  setPhase('reveal', round.mode === 'haitu' ? haituRevealSec() : (SEGMENTS[game.seg]?.reveal || CFG.revealSec) + (round.hunt?.power ? HUNT_POWER_SEC : 0));
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
    // lượt đúng tính cả bot: người xem vừa thấy các lượt đúng đó trên màn, ghi 0 thì vô lý (bot vẫn không lên bục)
    stats: { questions: game.qNo, players: game.chain ? [...game.chain.players.values()].filter((m) => !m.bot).length : game.players.size, correct: [...game.players.values()].reduce((a, p) => a + (p.correct || 0), 0) },
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
  stats.rec('gameEnd', { s: game.seg, qs: game.qNo });
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
    if (game.seg === 'chain') return startChainMatch();
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
  // Săn từ: quá HUNT_HINT_SEC giây của lượt mà chưa ai tìm được từ nào → từ gợi ý nhấp nháy (màn chuyển về đích đang đứng đồng hồ thì chưa tính)
  if (phase === 'question' && round.mode === 'hunt' && !round.hunt.hintOn && round.hunt.hint && !round.hunt.found.size && now() - timer.startedAt >= HUNT_HINT_SEC * 1000) {
    round.hunt.hintOn = true;
    push();
  }
  if (phase === 'question' && (round.mode === 'bricky' || round.mode === 'haitu')) {
    const lv = brickyHint();
    if (lv !== round.lastHint) {
      round.lastHint = lv;
      push();
    }
  }
  if (phase === 'question' && (round.mode === 'type' || round.mode === 'scramble' || round.mode === 'emoji' || round.mode === 'irrfill' || round.mode === 'oneletter')) {
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
  if (!text) return;
  stats.user('chat', user);
  if (outro) return;
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
  if (phase === 'question' && round?.mode === 'bricky' && onBrickyChat(user, msg, item)) return;
  if (phase === 'question' && round?.mode === 'haitu' && onHaiTuChat(user, msg, item)) return;
  if (phase === 'question' && round?.mode === 'hunt' && onHuntChat(user, msg, item)) return;
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
      // 16/11/2026 người dùng bỏ gõ thứ tự số: chỉ gõ từ tiếng Anh. Gõ đúng từ = đúng. Gõ một từ dùng đúng bộ chữ cái trên thẻ
      // nhưng sai thứ tự = 1 lần thử sai (hiện ✗, được gõ lại); bình luận khác là tán gẫu.
      const t = msg.trim().toLowerCase();
      byHangul = norm(msg) === norm(round.word.w);
      if (!byHangul && /^[a-z]+$/.test(t) && [...t].sort().join('') === [...round.tiles].sort().join('')) {
        item.choice = t;
        logFeed(item);
        round.feed.push(item);
        if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
        broadcast({ type: 'feed', feed: round.feed.slice(-12) });
        return;
      }
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
    } else if (round.mode === 'emoji') {
      // Gõ đúng đáp án hoặc một cách viết khác trong alt. Đúng thì KHÔNG hiện chữ lên màn (không để người sau chép); sai là tán gẫu, gõ lại được.
      if (round.emoji.ok.has(norm(msg))) {
        byHangul = true;
        item.text = '✓ đoán đúng';
      }
    } else if (round.mode === 'irrfill') {
      // Gõ đúng từ còn thiếu (hoặc cả hàng V1 V2 V3). Đúng thì KHÔNG hiện chữ lên màn; sai là tán gẫu, gõ lại được.
      if (round.irr.ok.has(norm(msg))) {
        byHangul = true;
        item.text = '✓ chia đúng';
      }
    } else if (round.mode === 'oneletter') {
      // Gõ đúng từ đáp án = đúng; màn KHÔNG hiện chữ (không để người sau chép). Gõ một từ a–z dài gần bằng đáp án mà sai
      // (hay gặp nhất: gõ lại nguyên chữ trên màn) = 1 lần thử sai: hiện ✗ cho vui, vẫn gõ lại được. Bình luận khác là tán gẫu.
      const t = msg.trim().toLowerCase(), w = round.word.w;
      if (norm(msg) === norm(w)) {
        byHangul = true;
        item.text = '✓ đúng';
      } else if (/^[a-z]+$/.test(t) && Math.abs(t.length - w.length) <= 2) {
        item.choice = t;
        logFeed(item);
        round.feed.push(item);
        if (round.feed.length > 40) round.feed.splice(0, round.feed.length - 40);
        broadcast({ type: 'feed', feed: round.feed.slice(-12) });
        return;
      }
    } else if (round.mode === 'cross' || round.mode === 'bricky' || round.mode === 'haitu' || round.mode === 'hunt') {
      // đã xử lý ở onCrossChat / onBrickyChat / onHaiTuChat / onHuntChat; bình luận còn lại là tán gẫu
    } else if (round.mode === 'startend') {
      // Chỉ bình luận có đúng 5 mục mới tính là một lần trả lời. Sai thì gõ lại được (chưa vào answered), báo số từ đúng.
      const c = startEnd().check(msg, round.pat);
      if (c.attempt) {
        byHangul = c.ok;
        item.text = c.ok ? c.words.join(' ') : `${msg} · ${c.good}/5 từ đúng`;
        if (c.ok) item.words = c.words.join(' ');
      }
    } else {
      // Nghe & gõ: phải đúng chính tả (không phân biệt hoa thường, bỏ dấu cách/dấu câu). byRomaja (½ điểm) không dùng ở bản tiếng Anh.
      byHangul = norm(msg) === norm(round.word.w);
    }
    if (byHangul || byRomaja) {
      if (round.mode === 'mcq') item.choice = round.answerIdx + 1;
      else round.answered.add(user.uid);
      if (round.mode === 'scramble') item.choice = round.word.w.toLowerCase();
      const gp = gamePlayer(user);
      if (user.bot) gp.bot = true;
      // Bot 🤖 không vào bảng vàng ngày; người thật xếp hạng nhanh chỉ tính giữa người thật (bot không cướp điểm)
      const dp = user.bot ? { score: 0, correct: 0 } : dayPlayer(user);
      const rank = user.bot ? round.winners.length : round.realWinners++;
      // Đúng nhanh nhất +10, rồi 8, 6, 4… tối thiểu 3 (khung Word/Start or End: 10, 5, 3, rồi +1); gõ romaja được một nửa.
      let pts = ptsFor(game.seg, rank);
      if (round.mult > 1) pts *= round.mult; // chặng về đích: Thêm bớt 1 chữ và các khung dùng chung markFinish()
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
      if (rank === 0 && !user.bot) { gp.first++; round.fastUid = user.uid; }
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
  stats.user('gift', user, { d: total, n: count });
  // Trần 50 điểm: quà to không được át người trả lời giỏi (mất vui → người xem bỏ đi).
  const bonus = Math.min(50, 5 + total);
  dayPlayer(user).score += bonus;
  const inGame = game && (phase === 'question' || phase === 'reveal');
  if (inGame) gamePlayer(user).score += bonus;
  boosts.set(user.uid, (boosts.get(user.uid) || 0) + GIFT_BOOST);
  if (inGame && game.chain && !user.bot) chainGift(user, total); // Thế chữ: quà đổi lấy quyền trong ván (xem khối Thế chữ)
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
  stats.user('join', user);
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
  if (c.segTotal && typeof c.segTotal === 'object') setSegTotals(c.segTotal); // áp dụng từ lượt sau của khung đó
  if (c.roundSec != null) CFG.roundSec = clamp(c.roundSec, 5, 60, CFG.roundSec);
  if (c.revealSec != null) CFG.revealSec = clamp(c.revealSec, 2, 20, CFG.revealSec);
  if (c.podiumSec != null) CFG.podiumSec = clamp(c.podiumSec, 5, 60, CFG.podiumSec);
  if (c.breakSec != null) CFG.breakSec = clamp(c.breakSec, 5, 180, CFG.breakSec);
  if (c.lateSec != null) CFG.lateSec = clamp(c.lateSec, 0, 8, CFG.lateSec); // áp dụng từ câu sau
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
    stats.rec('phase');
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
  if (url.pathname === '/stats' || url.pathname === '/stats.csv') {
    if (!allowed(req, url.searchParams.get('key'))) return res.writeHead(403).end('forbidden');
    return stats.handle(req, res, url, Object.fromEntries(Object.entries(SEGMENTS).map(([id, s]) => [id, `${s.icon} ${s.name}`])));
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
  // Tắt fetchRoomInfoOnConnect thì connect() KHÔNG kiểm tra kênh còn phát: kênh từng live sẽ "nối" vào phòng cũ đã tắt,
  // màn điều khiển báo đã nối mà không có bình luận nào. Hỏi trạng thái trước (đọc trang TikTok, không tốn lượt Euler).
  // Không hỏi được thì cứ nối như cũ (còn chốt "im lặng 90s" bên dưới).
  if ((await conn.fetchIsLive().catch(() => null)) === false) throw new Error('offline: kênh chưa lên sóng');
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
  // like / follow / share: game không dùng, chỉ ghi thống kê (phòng đông TikTok có thể không gửi đủ like)
  conn.on(WebcastEvent.LIKE, (d) => (alive(), stats.user('like', fromTikTok(d.user), { n: Number(d.likeCount) || 1 })));
  conn.on(WebcastEvent.FOLLOW, (d) => (alive(), stats.user('follow', fromTikTok(d.user))));
  conn.on(WebcastEvent.SHARE, (d) => (alive(), stats.user('share', fromTikTok(d.user))));
  conn.on(ControlEvent.DISCONNECTED, () => {
    if (conn !== liveConn) return; // kết nối cũ đã bị thay
    console.warn('Mất kết nối TikTok, đang nối lại…');
    Object.assign(tiktok, { connected: false, error: 'mất kết nối, đang nối lại' });
    stats.rec('live', { on: 0 });
    push();
    scheduleConnect(3);
  });
  const state = await conn.connect();
  Object.assign(tiktok, { connected: true, roomId: state.roomId, error: null, since: Date.now() });
  stats.rec('live', { on: 1, r: String(state.roomId) });
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
    stats.rec('live', { on: 0 });
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
      summary = `đang đố câu ${game.qNo}/${game.total} khung Word (${{ w2m: 'cho từ chọn nghĩa', m2w: 'cho nghĩa chọn từ', syn: 'tìm từ đồng nghĩa', ant: 'tìm từ trái nghĩa', read: 'đọc nhanh một văn bản ngắn rồi trả lời một chi tiết', fill: 'điền từ còn thiếu trong câu', lm: 'nghe audio rồi chọn nghĩa tiếng Việt', irr: 'khung Tìm bất quy tắc: tìm động từ bất quy tắc trong bốn động từ tiếng Anh' }[round.wq.t]}): người xem gõ A, B, C hoặc D (đáp án BÍ MẬT, không được nói chữ cái hay từ đúng)`;
    else if (phase === 'question' && round.mode === 'irrfill')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Chia động từ: màn hiện bảng động từ bất quy tắc V1 – V2 – V3, một hàng khuyết một ô, người xem gõ từ còn thiếu; chữ cái gợi ý mở dần (không được nói đáp án, không đánh vần hay gợi ý chữ cái)`;
    else if (phase === 'question' && round.mode === 'oneletter')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Thêm bớt 1 chữ: màn hiện một chữ viết sai kèm nghĩa tiếng Việt và lệnh ${round.one.q.k === 'add' ? 'THÊM' : 'BỚT'} 1 chữ cái, người xem thêm hoặc bớt đúng 1 chữ để thành từ có nghĩa rồi gõ cả từ${round.red ? '; đây là chặng về đích cuối lượt: từ rất dễ nhầm, điểm nhân đôi' : ''} (không được nói đáp án, không đánh vần hay gợi ý chữ cái nào cần thêm hoặc bớt)`;
    else if (phase === 'question' && round.mode === 'haitu')
      summary = `đang chơi bảng ${game.qNo}/${game.total} khung Hái từ, chủ đề "${round.fr.topic}": màn hiện lưới ${round.fr.tiles.length} ảnh kèm tên tiếng Việt, người xem gõ tên tiếng Anh để hái; mỗi ô ai gõ đúng trước được +2, hết bảng ai hái nhiều nhất +5 (không được nói tên tiếng Anh của ô nào chưa ai hái)`;
    else if (phase === 'question' && round.mode === 'bricky')
      summary = `đang chơi bảng ${game.qNo}/${game.total} khung Bricky: màn cho ${round.bk.tiles.length} chữ cái, người xem ghép thành các từ tiếng Anh từ 3 chữ trở lên rồi gõ vào bình luận, mỗi từ đúng +1, người đầu tiên điền đủ các từ trên bảng +10${round.final ? '; đây là bảng cuối của lượt: khó hơn, mọi điểm nhân đôi' : ''} (không được nói hay gợi ý từ nào ghép được)`;
    else if (phase === 'question' && round.mode === 'dictate')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Nghe – chép: người xem nghe một câu tiếng Anh (phát lặp lại) rồi gõ lại nguyên câu; cứ 2 giây màn hiện thêm một loại chữ cái (không được nói nội dung câu). Bảng điểm: ${b}`;
    else if (phase === 'question' && round.mode === 'emoji')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Đoán emoji: màn hiện vài emoji, người xem đoán rồi gõ từ hoặc cụm từ tiếng Anh; chữ cái gợi ý mở dần (không được nói đáp án, nghĩa tiếng Việt hay gợi ý chữ cái)`;
    else if (phase === 'question' && round.mode === 'errhunt')
      summary = `đang đố câu ${game.qNo}/${game.total} khung Săn lỗi: một câu tiếng Anh có đúng 1 từ sai (chính tả hoặc ngữ pháp), người xem gõ "từ sai - từ đúng" (không được nói từ nào sai hay cách sửa)`;
    else if (phase === 'question' && round.mode === 'cross')
      summary = `đang chơi Giải ô chữ: ${round.stage === 'key' ? 'vòng từ khoá hàng dọc (gõ CHỮ HOA)' : `hàng ${round.idx + 1}, người xem gõ từ tiếng Anh theo nghĩa tiếng Việt`}, đã giải ${game.cross.solved}/${game.cross.p.rows.length} hàng (không được nói đáp án)`;
    else if (phase === 'question' && round.mode === 'chain')
      summary = `đang chơi Thế chữ (mọi người cùng chơi: đổi ${round.max > 1 ? '1 hoặc 2' : '1'} chữ cái của từ ${round.len} chữ hiện tại${round.lock >= 0 ? ', không đổi chữ đang bị khoá' : ''}, để ra từ mới và thành người giữ từ, hết 12 giây không ai thế được thì người giữ từ thắng ván +10 điểm; chuỗi đang có ${round.chain.length} từ${round.holder ? `, người giữ từ: ${round.holder.name}` : ''})`;
    else if (phase === 'question' && round.mode === 'hunt')
      summary = `đang chơi lượt ${game.qNo}/${game.total} khung Săn từ: bảng chữ cái 16x16, người xem tìm từ tiếng Anh theo hàng ngang (trái sang phải) hoặc cột dọc (trên xuống) rồi gõ vào bình luận, ai gõ trước được điểm; đã có ${round.hunt.found.size} từ được tìm (không được nói từ nào đang nằm trên bảng)`;
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
      secret: phase === 'question' && round ? (['startend', 'hunt', 'chain', 'errhunt', 'cross', 'dictate', 'bricky', 'haitu'].includes(round.mode) ? null : round.secret ? { w: round.secret } : round.mode === 'mcq' && !round.rev ? { w: round.word.m } : { w: round.word.w }) : null,
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

// Người chơi ảo (bots.js), chỉ chạy ở live thật (--sim đã có khán giả ảo riêng). Số bot mỗi câu: CFG.bots khi chưa có ai,
// mỗi người thật bình luận trong 3 câu gần nhất thì bớt 1 bot, giữ tối thiểu MIN_BOTS khi đang bật. CFG.bots = 0 là tắt hẳn.
const MIN_BOTS = 2;
const bots = require('./bots').create({ onChat: (u, t) => onChat(u, t), isLive: (r) => round === r && phase === 'question' && !pausedAt });
function botCtx() {
  const real = [...realSeen.values()].filter((n) => questionsTotal - n <= 3).length;
  return { active: CFG.bots > 0 ? Math.max(Math.min(MIN_BOTS, CFG.bots), CFG.bots - real) : 0, real, bank: () => BANK };
}
function botsAsk(r) { if (!SIM) bots.onQuestion(r, botCtx()); }
function botsCross(r) { if (!SIM) bots.onCross(r, game.cross, botCtx()); }
function botsChain(r) { if (!SIM) bots.onChain(r, chainHelpers(), botCtx()); }

let sim = null;
if (SIM) {
  sim = require('./sim').start({ onChat, onGift, onJoin, bank: () => BANK });
  // số người xem giả (lên xuống trong khoảng 30–150) để màn điều khiển và trang thống kê có số mà xem
  viewers = 60;
  setInterval(() => (viewers = Math.max(30, Math.min(150, viewers + Math.round((Math.random() - 0.45) * 12)))), 5000).unref();
}

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
  if (PROGRAM.includes('chain')) { chainDict(4); chainWarm(CHAIN_FINAL_LEN); } // dựng sẵn bộ từ Thế chữ (5 chữ dựng dần, không chặn server)
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
