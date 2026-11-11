#!/usr/bin/env node
// Cổng chung để chạy thử nhiều game cùng lúc: mỗi game là một tiến trình server.js riêng (khán giả ảo --sim, tự chạy liên tục),
// tất cả nằm dưới MỘT địa chỉ, mỗi game một đường dẫn:
//
//   http://localhost:8789/            danh sách game + link để gửi người khác
//   http://localhost:8789/speedread/          màn live của game (1080×1920 thu vào khung)
//   http://localhost:8789/speedread/control   màn điều khiển (từ máy này, hoặc thêm ?key=… khi mở từ máy khác)
//
//   node gateway.js                  bật tất cả game
//   node gateway.js --only speedread,fillin   chỉ bật vài game
//   node gateway.js --port 8789 --base-port 18800 --key abcd1234
//
// Máy khác trong mạng mở được bằng địa chỉ LAN (in ra khi chạy). Link điều khiển kèm khoá chỉ hiện trên trang danh sách khi mở từ
// chính máy này; ai có khoá thì điều khiển được (đổi khung, gõ bình luận thử). Dừng: Ctrl+C hoặc kill tiến trình này (các game con tắt theo).
const http = require('http');
const net = require('net');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const PORT = Number(arg('port', 8789));
const BASE = Number(arg('base-port', 18800));
const KEY = String(arg('key', crypto.randomBytes(4).toString('hex')));
const TOKEN = crypto.randomBytes(16).toString('hex'); // chỉ cổng và các game con biết: để game con tin địa chỉ khách mà cổng báo lại
const ONLY = arg('only', '') ? String(arg('only')).split(',') : null;
const LOGDIR = path.join(os.tmpdir(), 'migii-gateway');
fs.mkdirSync(LOGDIR, { recursive: true });

// Mỗi game: chạy khung nào, kèm file dữ liệu nào. Nhịp nghỉ ngắn (--break/--podium) để người thử khỏi chờ lâu.
const W = (...n) => `--word-file ${n.map((x) => `data/word-${x}.json`).join(',')}`;
// 4 kênh theo mốc TOEIC (chốt 11/11/2026 sau buổi chơi thử): mỗi kênh có 1 mục "cả kênh" (các khung chạy xen kẽ như lúc live) và từng game riêng.
// Người chơi thử đề nghị bỏ game nghe, Săn từ, Giải ô chữ, Săn lỗi, Giờ học; người dùng chưa muốn bỏ nên vẫn giữ ở kênh theo mốc cũ của game.
const CH = {
  duoi450: `--program-order word,startend,hunt,chain ${W(300, 400)}`,
  k450: `--program-order word,fillin,listenmean,errhunt,crossword ${W(500, 600)} --err-file data/san-loi-600.json --cross-file data/o-chu-600.json`,
  k650: `--program-order word,speedread,dictate ${W(700)} --read-file data/doc-nhanh-700.json --dict-file data/nghe-chep-700.json`,
  tren800: `--program-order word,speedread ${W(800, 900)} --read-file data/doc-nhanh-800.json`,
};
const GAMES = [
  { id: 'duoi-450', ch: 'duoi450', icon: '📺', name: 'Cả kênh dưới 450', note: 'Word → Start or End → Săn từ → Thế chữ, xen kẽ như lúc live', args: CH.duoi450 },
  { id: 'word-duoi-450', ch: 'duoi450', icon: '🔤', name: 'Word', note: 'chọn nghĩa · nghĩa → từ · đồng nghĩa · trái nghĩa (từ mốc 300 + 400), 10 giây/câu', args: `--program-order word ${W(300, 400)}` },
  { id: 'startend', ch: 'duoi450', icon: '🎯', name: 'Start or End', note: 'tìm 5 từ bắt đầu / kết thúc bằng cụm chữ', args: `--program-order startend ${W(300, 400)}` },
  { id: 'hunt', ch: 'duoi450', icon: '🔎', name: 'Săn từ', note: 'ma trận 10×10, tìm từ theo 8 hướng', args: `--program-order hunt ${W(300, 400)}` },
  { id: 'chain', ch: 'duoi450', icon: '🔗', name: 'Thế chữ', note: 'hai đội Black / White đổi từng chữ cái', args: `--program-order chain ${W(300, 400)}` },
  { id: '450-650', ch: 'k450', icon: '📺', name: 'Cả kênh 450–650', note: 'Word → Điền từ → Nghe – nghĩa → Săn lỗi → Giải ô chữ, xen kẽ như lúc live', args: CH.k450 },
  { id: 'word-450-650', ch: 'k450', icon: '🔤', name: 'Word', note: 'từ mốc 500 + 600, 10 giây/câu', args: `--program-order word ${W(500, 600)}` },
  { id: 'fillin', ch: 'k450', icon: '✏️', name: 'Điền từ', note: 'câu thiếu 1 từ, có lời giải vì sao hay nhầm', args: `--program-order fillin ${W(500, 600)}` },
  { id: 'listenmean', ch: 'k450', icon: '🎧', name: 'Nghe – nghĩa', note: 'nghe một lần, chữ cái hiện dần, chọn nghĩa', args: `--program-order listenmean ${W(500, 600)}` },
  { id: 'errhunt', ch: 'k450', icon: '🔍', name: 'Săn lỗi', note: 'câu có 1 từ sai: gõ "từ sai - từ đúng"', args: '--program-order errhunt --err-file data/san-loi-600.json' },
  { id: 'crossword', ch: 'k450', icon: '🔠', name: 'Giải ô chữ', note: 'giải từng hàng (chữ thường), đoán từ khoá (CHỮ HOA)', args: '--program-order crossword --cross-file data/o-chu-600.json' },
  { id: '650-800', ch: 'k650', icon: '📺', name: 'Cả kênh 650–800', note: 'Word → Đọc nhanh → Nghe – chép, xen kẽ như lúc live', args: CH.k650 },
  { id: 'word-650-800', ch: 'k650', icon: '🔤', name: 'Word', note: 'từ mốc 700, 10 giây/câu', args: `--program-order word ${W(700)}` },
  { id: 'speedread', ch: 'k650', icon: '📰', name: 'Đọc nhanh', note: 'văn bản + câu hỏi + 4 đáp án cùng lúc, 20 giây (bài mốc 700)', args: '--program-order speedread --read-file data/doc-nhanh-700.json' },
  { id: 'dictate', ch: 'k650', icon: '🎙️', name: 'Nghe – chép', note: 'nghe câu tiếng Anh (phát lặp lại), gõ lại cả câu; chữ hiện dần', args: '--program-order dictate --dict-file data/nghe-chep-700.json' },
  { id: 'tren-800', ch: 'tren800', icon: '📺', name: 'Cả kênh 800+', note: 'Word → Đọc nhanh, xen kẽ như lúc live', args: CH.tren800 },
  { id: 'word-tren-800', ch: 'tren800', icon: '🔤', name: 'Word', note: 'từ mốc 800 + 900, 10 giây/câu', args: `--program-order word ${W(800, 900)}` },
  { id: 'speedread-tren-800', ch: 'tren800', icon: '📰', name: 'Đọc nhanh', note: 'bài khó hơn (từ mốc 800–900, đáp án diễn đạt lại), 20 giây', args: '--program-order speedread --read-file data/doc-nhanh-800.json' },
  // game gốc từ bản Jaemy (kho từ bank.json của Migii), chưa xếp vào kênh nào
  { id: 'class', ch: 0, icon: '📖', name: 'Giờ học', note: 'Ninja dạy 3 từ rồi kiểm tra, gọi tên', args: '--program-order class' },
  { id: 'quiz', ch: 0, icon: '⚡', name: 'Đố nhanh', note: 'chọn nghĩa đúng của từ', args: '--program-order quiz' },
  { id: 'scramble', ch: 0, icon: '🧩', name: 'Ghép chữ', note: 'ghép chữ cái bị xáo thành từ', args: '--program-order scramble' },
  { id: 'reverse', ch: 0, icon: '🔁', name: 'Chọn từ tiếng Anh', note: 'nhìn nghĩa, chọn từ tiếng Anh', args: '--program-order reverse' },
  { id: 'listen', ch: 0, icon: '🎧', name: 'Luyện tai', note: 'chỉ nghe, không hiện chữ', args: '--program-order listen' },
  { id: 'team', ch: 0, icon: '🥊', name: 'So găng 2 đội', note: 'hai đội đấu nhau', args: '--program-order team' },
  { id: 'type', ch: 0, icon: '✍️', name: 'Nghe & gõ chính tả', note: 'nghe + nhìn nghĩa, gõ từ tiếng Anh', args: '--program-order type' },
].filter((g) => !ONLY || ONLY.includes(g.id));
GAMES.forEach((g, i) => { g.port = BASE + i; g.ready = false; g.proc = null; });
const BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));
// link cũ (trước khi chia lại kênh 11/11) → game tương ứng
const OLD = { word300: 'word-duoi-450', word400: 'word-duoi-450', word500: 'word-450-650' };

const lanIp = () => { for (const l of Object.values(os.networkInterfaces())) for (const a of l || []) if (a.family === 'IPv4' && !a.internal) return a.address; return null; };
const LAN = lanIp();

function start(g) {
  const log = fs.openSync(path.join(LOGDIR, `${g.id}.log`), 'w');
  g.ready = false;
  g.proc = spawn(process.execPath, ['server.js', '--sim', '--no-ai', '--autostart', '--port', String(g.port), '--tag', g.id, '--break', '10', '--podium', '10', ...g.args.split(/\s+/)], {
    cwd: __dirname, stdio: ['ignore', log, log], env: { ...process.env, GATEWAY_TOKEN: TOKEN, CONTROL_KEY: KEY },
  });
  g.proc.on('exit', (code) => { g.proc = null; g.ready = false; if (!stopping) console.log(`⚠️  ${g.id} dừng (mã ${code}), xem ${path.join(LOGDIR, g.id + '.log')}`); });
  // chờ cổng mở
  const t0 = Date.now();
  const poll = () => {
    if (!g.proc) return;
    const c = net.connect(g.port, '127.0.0.1');
    c.on('connect', () => { c.destroy(); g.ready = true; });
    c.on('error', () => { c.destroy(); if (Date.now() - t0 < 60000) setTimeout(poll, 300); });
  };
  poll();
}
const waitReady = (g) => new Promise((resolve, reject) => {
  const t0 = Date.now();
  const tick = () => (g.ready ? resolve() : Date.now() - t0 > 15000 || !g.proc ? reject(new Error('chưa sẵn sàng')) : setTimeout(tick, 200));
  tick();
});

// Đường dẫn: /<id>/<phần còn lại> → game <id>, đường dẫn /<phần còn lại>
function route(rawUrl) {
  const url = new URL(rawUrl, 'http://x');
  const m = url.pathname.match(/^\/([a-z0-9-]+)(\/.*)?$/);
  const g = m && (BY_ID[m[1]] || BY_ID[OLD[m[1]]]);
  return g ? { g, rest: m[2], search: url.search, pathname: url.pathname } : null;
}
const fwdHeaders = (req) => ({ ...req.headers, host: `127.0.0.1`, 'x-gw-token': TOKEN, 'x-gw-client': req.socket.remoteAddress });
const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function menu(req, res) {
  const local = isLocal(req), host = LAN ? `${LAN}:${PORT}` : `localhost:${PORT}`;
  const groups = [['duoi450', 'Kênh dưới 450'], ['k450', 'Kênh 450–650'], ['k650', 'Kênh 650–800'], ['tren800', 'Kênh 800+'], [0, 'Game gốc từ bản Jaemy (kho từ chung của Migii, chưa thuộc kênh nào)']];
  const card = (g) => {
    const live = `http://${host}/${g.id}/`, ctl = `http://${host}/${g.id}/control?key=${KEY}`;
    return `<div class="g"><div class="h"><span class="ic">${g.icon}</span><div><b>${esc(g.name)}</b><div class="n">${esc(g.note)}</div></div><span class="st ${g.ready ? 'on' : ''}">${g.ready ? 'đang chạy' : g.proc ? 'đang khởi động…' : 'đã dừng'}</span></div>
      <div class="r"><a class="b" href="/${g.id}/" target="_blank">Mở game</a>${local ? `<a class="b o" href="/${g.id}/control" target="_blank">Điều khiển</a>` : ''}</div>
      <div class="u"><label>Địa chỉ gửi người khác (chỉ xem)</label><input readonly value="${esc(live)}" onclick="this.select()"><button onclick="cp(this)">Chép</button></div>
      ${local ? `<div class="u"><label>Có quyền điều khiển (đổi khung, gõ bình luận thử)</label><input readonly value="${esc(ctl)}" onclick="this.select()"><button onclick="cp(this)">Chép</button></div>` : ''}</div>`;
  };
  const body = groups.map(([ch, title]) => {
    const list = GAMES.filter((g) => g.ch === ch);
    if (!list.length) return '';
    return `<h2>${title}</h2>${list.map(card).join('')}`;
  }).join('');
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Migii TOEIC Live – chạy thử</title>
<style>:root{color-scheme:light;--bg:#eaf1ef;--card:#fff;--ink:#10201e;--mut:#5b716d;--g:#1c7a6c;--o:#e88a1a;--line:#d6e3e0}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.45 -apple-system,system-ui,"Segoe UI",sans-serif}
main{max-width:760px;margin:0 auto;padding:20px 16px 60px}h1{font-size:24px;margin:8px 0 4px;color:var(--g)}h2{font-size:18px;margin:26px 0 10px}
.n{color:var(--mut);font-size:14px}.g{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;margin:10px 0}
.h{display:flex;gap:12px;align-items:flex-start}.ic{font-size:30px;line-height:1}.h>div{flex:1}.ch{background:var(--g);color:#fff;border-radius:99px;padding:1px 8px;font-size:12px;font-weight:700;vertical-align:2px}
.st{font-size:12px;font-weight:700;color:var(--mut);white-space:nowrap}.st.on{color:var(--g)}
.r{display:flex;gap:8px;margin:10px 0 4px}.b{background:var(--g);color:#fff;text-decoration:none;border-radius:10px;padding:8px 14px;font-weight:700;font-size:14px}.b.o{background:var(--o)}
.u{margin-top:8px}.u label{display:block;font-size:12px;color:var(--mut);margin-bottom:3px}.u{display:grid;grid-template-columns:1fr auto;gap:6px}.u label{grid-column:1/3}
input{width:100%;min-width:0;border:1px solid var(--line);background:transparent;color:var(--ink);border-radius:8px;padding:7px 9px;font:13px ui-monospace,Menlo,monospace}
button{border:0;background:var(--line);color:var(--ink);border-radius:8px;padding:0 12px;font-weight:700;cursor:pointer}
.note{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:12px 0;font-size:14px}</style></head><body><main>
<h1>Migii TOEIC Live – chạy thử</h1>
<div class="n">Mỗi game chạy riêng với khán giả ảo, tự lặp liên tục. Mở nhiều game cùng lúc ở các tab khác nhau.</div>
<div class="note">${local ? 'Bạn đang mở từ máy chạy server, nên thấy cả link điều khiển. Chỉ gửi link <b>điều khiển</b> cho người bạn tin: có khoá là đổi được khung và gõ bình luận thử.' : 'Bạn đang xem từ máy khác: mở từng game ở nút “Mở game”. Link điều khiển do người chia sẻ gửi riêng.'}</div>
${body}</main>
<script>function cp(b){const i=b.previousElementSibling;i.select();try{navigator.clipboard.writeText(i.value)}catch(e){document.execCommand('copy')}b.textContent='Đã chép';setTimeout(()=>b.textContent='Chép',1200)}
setTimeout(()=>location.reload(),15000)</script></body></html>`;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/') return menu(req, res);
  if (url.pathname === '/favicon.ico') return res.writeHead(204).end();
  const r = route(req.url);
  if (!r) return res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Không có game này. Mở / để xem danh sách.');
  if (!r.rest) return res.writeHead(302, { Location: `/${r.g.id}/${r.search}` }).end(); // thiếu dấu / thì đường dẫn tương đối của trang sẽ sai
  try { await waitReady(r.g); } catch { return res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', Refresh: '3' }).end('Game đang khởi động, trang sẽ tự tải lại…'); }
  const p = http.request({ host: '127.0.0.1', port: r.g.port, path: r.rest + r.search, method: req.method, headers: fwdHeaders(req) }, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res);
  });
  p.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
  req.pipe(p);
});

server.on('upgrade', async (req, socket) => {
  const r = route(req.url);
  if (!r || !r.rest) return socket.destroy();
  try { await waitReady(r.g); } catch { return socket.destroy(); }
  const p = http.request({ host: '127.0.0.1', port: r.g.port, path: r.rest + r.search, method: 'GET', headers: fwdHeaders(req) });
  p.on('upgrade', (pr, ps, head) => {
    const lines = Object.entries(pr.headers).flatMap(([k, v]) => (Array.isArray(v) ? v : [v]).map((x) => `${k}: ${x}`));
    socket.write(`HTTP/1.1 101 Switching Protocols\r\n${lines.join('\r\n')}\r\n\r\n`);
    if (head?.length) socket.write(head);
    ps.pipe(socket); socket.pipe(ps);
    ps.on('error', () => socket.destroy()); socket.on('error', () => ps.destroy());
    ps.on('close', () => socket.destroy()); socket.on('close', () => ps.destroy());
  });
  p.on('response', () => socket.destroy());
  p.on('error', () => socket.destroy());
  p.end();
});

let stopping = false;
function stopAll() { stopping = true; for (const g of GAMES) g.proc?.kill(); setTimeout(() => process.exit(0), 300); }
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
process.on('exit', () => { for (const g of GAMES) g.proc?.kill(); });

GAMES.forEach(start);
server.listen(PORT, () => {
  console.log(`🎮 Chạy thử ${GAMES.length} game dưới một cổng ${PORT} (mỗi game một tiến trình, log ở ${LOGDIR})\n`);
  console.log(`  Danh sách:  http://localhost:${PORT}/${LAN ? `   ·   http://${LAN}:${PORT}/` : ''}`);
  console.log(`  Khoá điều khiển (cho máy khác): ${KEY}\n`);
  for (const g of GAMES) console.log(`  ${g.icon} ${g.id.padEnd(11)} http://${LAN || 'localhost'}:${PORT}/${g.id}/`);
});
