#!/usr/bin/env node
// Xuất màn live ĐANG CHẠY của mọi dạng bài thành HTML tĩnh để import vào Figma (plugin html.to.design).
// Khác build.py (bản vẽ lại tay theo Design System, chỉ 13 khung của game gốc): file này chạy từng game với khán giả ảo,
// chụp DOM + CSS thật của public/index.html ở các thời điểm chọn sẵn, nên có đủ mọi game và giống màn đang lên sóng.
//
//   node design/src/xuat_man_that.js                     tất cả (khoảng 4–5 phút, Săn từ chờ lâu nhất)
//   node design/src/xuat_man_that.js --only word,hunt    vài game (bảng vẽ chỉ gồm các game đó)
//   node design/src/xuat_man_that.js --ref <thư mục>     lưu thêm ảnh chụp màn thật cùng lúc (540×960) để đối chiếu
//
// Ghi ra design/out/ (nằm ngoài git):
//   migii-live-man-that.html     mọi khung trên một bảng vẽ, nhóm theo kênh
//   man-that/NN-<game>-<lúc>.html  mỗi khung một file 1080×1920, dùng khi import từng khung
// Cần Google Chrome (đổi đường dẫn bằng biến CHROME). Mỗi game chạy server riêng ở cổng 18950+ (--tag figma-…), không đụng
// gateway hay server live; file điểm ảo của các server này bị xoá khi xong, kỷ lục Thế chữ được trả lại như cũ.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const ROOT = path.resolve(__dirname, '..', '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(ROOT, 'design', 'out');
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const ONLY = arg('only', '') ? String(arg('only')).split(',') : null;
const REF = arg('ref', '') ? path.resolve(arg('ref')) : null;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_PORT = Number(arg('base-port', 18950));
const PARALLEL = Number(arg('parallel', 6));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'migii-figma-'));

// ------------------------------------------------------------------ các game và các lúc cần chụp
// Tham số game chép từ gateway.js (đổi kênh ở đó thì sửa cả đây).
const W = (...n) => `--word-file ${n.map((x) => `data/word-${x}.json`).join(',')}`;
const SHOT = {
  play: 'đang chơi',
  fin: '3 giây cuối',
  reveal: 'công bố đáp án',
  teach: 'Ninja dạy từ',
  break: 'giới thiệu game kế tiếp',
  podium: 'vinh danh sau mỗi game',
  outro: 'cảm ơn, cuối phiên',
};
const GROUPS = [
  { title: 'Kênh dưới 450', games: [
    { id: 'word', name: 'Word (có ở cả 4 kênh)', args: `--program-order word ${W(300, 400)}`, shots: ['play', 'fin', 'reveal'] },
    { id: 'startend', name: 'Start or End', args: `--program-order startend ${W(300, 400)}` },
    { id: 'hunt', name: 'Săn từ', args: `--program-order hunt ${W(300, 400)}` },
    { id: 'chain', name: 'Thế chữ', args: `--program-order chain ${W(300, 400)}` },
  ] },
  { title: 'Kênh 450–650', games: [
    { id: 'fillin', name: 'Điền từ', args: `--program-order fillin ${W(500, 600)}` },
    { id: 'listenmean', name: 'Nghe – nghĩa', args: `--program-order listenmean ${W(500, 600)}` },
    { id: 'errhunt', name: 'Săn lỗi', args: '--program-order errhunt --err-file data/san-loi-600.json' },
    { id: 'crossword', name: 'Giải ô chữ', args: '--program-order crossword --cross-file data/o-chu-600.json' },
  ] },
  { title: 'Kênh 650–800 và 800+', games: [
    { id: 'speedread', name: 'Đọc nhanh (bài mốc 700; kênh 800+ cùng bố cục)', args: '--program-order speedread --read-file data/doc-nhanh-700.json' },
    { id: 'dictate', name: 'Nghe – chép', args: '--program-order dictate --dict-file data/nghe-chep-700.json' },
  ] },
  { title: 'Game gốc từ bản Jaemy (chưa thuộc kênh nào)', games: [
    { id: 'class', name: 'Giờ học', args: '--program-order class', shots: ['teach', 'play', 'reveal'] },
    { id: 'quiz', name: 'Đố nhanh', args: '--program-order quiz' },
    { id: 'scramble', name: 'Ghép chữ', args: '--program-order scramble' },
    { id: 'reverse', name: 'Chọn từ tiếng Anh', args: '--program-order reverse' },
    { id: 'listen', name: 'Luyện tai', args: '--program-order listen' },
    { id: 'type', name: 'Nghe & gõ chính tả', args: '--program-order type' },
    { id: 'team', name: 'So găng 2 đội (đang không chơi)', args: '--program-order team' },
  ] },
  { title: 'Màn chung', games: [
    { id: 'chung', name: 'Giữa các game và cuối phiên', args: `--program-order word,startend ${W(300, 400)} --questions 5`, shots: ['podium', 'break', 'outro'] },
  ] },
];
const GAMES = GROUPS.flatMap((g) => g.games).filter((g) => !ONLY || ONLY.includes(g.id));
GAMES.forEach((g, i) => { g.port = BASE_PORT + i; g.shots = g.shots || ['play', 'reveal']; });

// Điều kiện chụp, chạy trong trang (state, clockSkew là biến của public/index.html). f = phần thời gian còn lại của câu.
// play lấy lúc còn 52–68% (đã có người trả lời, thanh giờ chưa đổi đỏ); quá 90 giây không gặp thì nhận bất kỳ lúc đang hỏi.
const COND = {
  play: { when: `s.phase === 'question' && !s.paused && (late || (total > 0 && f >= .52 && f <= .68))`, wait: 0 },
  fin: { when: `s.phase === 'question' && !s.paused && left > 1500 && left < 2600`, wait: 0 },
  reveal: { when: `s.phase === 'reveal'`, wait: 1200 },
  teach: { when: `s.phase === 'teach' && (late || document.querySelectorAll('#room .desk:not(.empty)').length >= 10)`, wait: 3000 }, // lớp đã đông
  break: { when: `s.phase === 'break'`, wait: 1500 },
  podium: { when: `s.phase === 'podium'`, wait: 2000 },
  outro: { when: `s.phase === 'outro'`, wait: 2500, cmd: { cmd: 'outro', next: '20:00 tối mai' } },
};
const condExpr = (c, late) => `(() => { const s = typeof state === 'undefined' ? null : state; if (!s) return false;
  const left = Math.max(0, s.endsAt - (Date.now() + clockSkew)), total = s.endsAt - s.startedAt, f = total > 0 ? left / total : 0, late = ${late};
  return !!(${c.when}); })()`;

// Chụp khung trong trang: cho hiệu ứng đang chạy về trạng thái cuối, bỏ phần đang ẩn, trả HTML của #stage (không JS).
// Chạy một lần đồng bộ nên JS của trang không chen vào giữa chừng.
const SNAP = `(() => {
  const stage = document.getElementById('stage');
  const keep = new Set([...document.querySelectorAll('#hurry .hn')]); // số đếm 3-2-1: hiệu ứng hiện rồi mờ, giữ lúc rõ nhất
  const filled = new Set();
  for (const a of document.getAnimations()) {
    const e = a.effect; if (!e) continue;
    const t = e.getComputedTiming();
    if (t.endTime === Infinity || t.activeDuration === Infinity) { a.cancel(); continue; }
    try { a.finish(); } catch (_) { a.cancel(); continue; }
    if ((t.fill === 'forwards' || t.fill === 'both') && e.target && !e.pseudoElement) filled.add(e.target);
  }
  const clone = stage.cloneNode(true);
  const A = [stage, ...stage.querySelectorAll('*')], B = [clone, ...clone.querySelectorAll('*')];
  const drop = [];
  A.forEach((el, i) => {
    const c = B[i];
    if (keep.has(el)) { c.style.opacity = '1'; c.style.transform = 'none'; return; }
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || Number(cs.opacity) === 0) { drop.push(c); return; }
    if (filled.has(el)) { c.style.opacity = cs.opacity; c.style.transform = cs.transform; }
    // 'Migii UI' là tên tạm trỏ tới Avenir Next (theme-light.css); Figma không biết tên này → ghi thẳng Avenir Next + độ đậm đã gom
    if (/Migii UI/.test(cs.fontFamily)) { const w = Number(cs.fontWeight); c.style.fontFamily = "'Avenir Next', 'Be Vietnam Pro', sans-serif"; c.style.fontWeight = w < 550 ? '500' : w < 750 ? '600' : '700'; }
    for (const at of [...c.attributes]) if (/^on/i.test(at.name)) c.removeAttribute(at.name);
  });
  drop.forEach((c) => c.remove());
  clone.style.transform = '';
  if (!clone.getAttribute('style')) clone.removeAttribute('style');
  const ld = clone.querySelector('#livedot'); if (ld) { ld.className = 'livedot live'; ld.textContent = '● LIVE'; } // trên sóng thật là LIVE, không phải THỬ
  return { html: clone.outerHTML, phase: state.phase, seg: stage.dataset.seg || '' };
})()`;

// ------------------------------------------------------------------ tiện ích
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (u) => new Promise((res, rej) => http.get(u, (x) => { let d = ''; x.on('data', (c) => (d += c)); x.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej));
const post = (port, p, body) => new Promise((res) => {
  const r = http.request({ host: '127.0.0.1', port, path: p, method: 'POST', headers: { 'Content-Type': 'application/json' } }, (x) => { x.resume(); x.on('end', res); });
  r.on('error', res); r.end(JSON.stringify(body));
});
const waitPort = async (port, ms = 30000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { await getJSON(`http://127.0.0.1:${port}/state`); return; } catch (e) { if (e instanceof SyntaxError) return; } await sleep(300); }
  throw new Error(`server cổng ${port} không lên`);
};
const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const dataUri = (rel) => {
  const f = path.join(PUB, rel.replace(/^\.?\//, '').split(/[?#]/)[0]);
  if (!f.startsWith(PUB + path.sep) || !fs.existsSync(f)) return null;
  return `data:${MIME[path.extname(f).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(f).toString('base64')}`;
};
// ảnh trong public/ (src="img/…", url('img/…'), url(&quot;img/…&quot;)) → nhúng thẳng vào file
const inlineAssets = (s) => s
  .replace(/(\ssrc=")(?!data:|https?:)([^"]+)"/g, (m, a, u) => { const d = dataUri(u); return d ? `${a}${d}"` : m; })
  .replace(/url\((&quot;|'|")?(?!data:|https?:)([^)'"&]+)\1\)/g, (m, q, u) => { const d = dataUri(u); return d ? `url("${d}")` : m; });

// ------------------------------------------------------------------ chạy server + Chrome, chụp từng game
function startServer(g) {
  const log = fs.openSync(path.join(TMP, `${g.id}.log`), 'w');
  g.proc = spawn(process.execPath, ['server.js', '--sim', '--no-ai', '--autostart', '--mute', '--port', String(g.port), '--tag', `figma-${g.id}`,
    '--break', '6', '--podium', '8', ...g.args.split(/\s+/)], { cwd: ROOT, stdio: ['ignore', log, log] });
}

async function captureGame(g) {
  const prof = fs.mkdtempSync(path.join(TMP, 'chrome-'));
  const dbg = 9600 + g.port - BASE_PORT;
  const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--mute-audio', '--window-size=540,960', '--force-device-scale-factor=1',
    `--user-data-dir=${prof}`, `--remote-debugging-port=${dbg}`, 'about:blank'], { stdio: 'ignore' });
  const out = [];
  try {
    let targets = [];
    for (let i = 0; i < 60 && !targets.some((t) => t.type === 'page'); i++) { try { targets = await getJSON(`http://127.0.0.1:${dbg}/json`); } catch {} await sleep(200); }
    const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
    await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); });
    let id = 0; const wait = new Map();
    ws.on('message', (m) => { const o = JSON.parse(m); if (o.id && wait.has(o.id)) { wait.get(o.id)(o); wait.delete(o.id); } });
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const evalJS = async (expression) => { const o = await send('Runtime.evaluate', { expression, returnByValue: true }); if (o.result?.exceptionDetails) throw new Error(o.result.exceptionDetails.exception?.description || 'lỗi JS'); return o.result?.result?.value; };
    await send('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 1, mobile: false });
    await send('Page.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${g.port}/?mute=1` });
    await sleep(['play', 'teach'].includes(g.shots[0]) ? 20000 : 2500); // chờ khán giả ảo vào đủ để bảng điểm, lớp học không trống
    for (const shot of g.shots) {
      const c = COND[shot];
      if (c.cmd) await post(g.port, '/cmd', c.cmd);
      const t0 = Date.now();
      let ok = false;
      while (Date.now() - t0 < 160000) {
        if (await evalJS(condExpr(c, Date.now() - t0 > 90000))) { ok = true; break; }
        await sleep(60);
      }
      if (!ok) { console.log(`  ⚠️  ${g.id}: không gặp lúc "${SHOT[shot]}", bỏ khung này`); continue; }
      if (c.wait) await sleep(c.wait);
      const snap = await evalJS(SNAP);
      if (REF) {
        const r = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(REF, `${g.id}-${shot}.png`), Buffer.from(r.result.data, 'base64'));
      }
      out.push({ shot, ...snap });
      console.log(`  ✓ ${g.id} · ${SHOT[shot]} (phase ${snap.phase}${snap.seg ? ', ' + snap.seg : ''})`);
    }
    ws.close();
  } finally {
    chrome.kill();
  }
  return out;
}

// ------------------------------------------------------------------ dựng file HTML
function pageCss() {
  const src = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  const inline = [...src.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const theme = fs.readFileSync(path.join(PUB, 'theme-light.css'), 'utf8');
  return inlineAssets(`${inline}\n/* ===== theme-light.css ===== */\n${theme}`).replace(/'Migii UI', /g, "'Avenir Next', ");
}
const BOARD_CSS = `
/* ===== bảng vẽ (chỉ cho file xuất, không thuộc màn live) ===== */
html[data-theme="light"], html[data-theme="light"] body { height: auto !important; overflow: visible !important; background: #dfe5e3 !important; }
body.board { width: max-content; padding: 160px; color: #10201e; }
body.one { width: 1080px; height: 1920px; }
.head h1 { font: 800 96px/1.1 'Be Vietnam Pro', sans-serif; color: #10201e; }
.head p { margin-top: 24px; max-width: 4400px; font: 500 36px/1.5 'Be Vietnam Pro', sans-serif; color: #33403d; }
.grp { margin-top: 220px; }
.grp > h2 { margin-bottom: 72px; font: 800 80px/1.2 'Be Vietnam Pro', sans-serif; color: #1c7a6c; }
.games { display: flex; flex-wrap: wrap; gap: 140px 160px; width: 4640px; }
.game > h3 { margin-bottom: 36px; font: 800 56px/1.2 'Be Vietnam Pro', sans-serif; color: #10201e; }
.shots { display: flex; gap: 80px; }
.fr { flex: none; width: 1080px; }
.fr > figcaption { margin-bottom: 24px; font: 700 40px/1.2 'Be Vietnam Pro', sans-serif; color: #33403d; }
#stage { position: relative !important; left: 0 !important; top: 0 !important; transform: none !important; }
/* khung tĩnh: tắt chuyển động (vị trí lúc chụp đã ghi sẵn) */
*, *::before, *::after { animation: none !important; transition: none !important; }
`;
const head = (title, css) => `<!doctype html>
<html lang="vi" data-theme="light">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="color-scheme" content="light">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>${css}${BOARD_CSS}</style>
</head>`;
const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function main() {
  if (REF) fs.mkdirSync(REF, { recursive: true });
  const chainRec = path.join(ROOT, 'data', 'the-chu-record.json');
  const chainRecBefore = fs.existsSync(chainRec) ? fs.readFileSync(chainRec) : null;
  const dataBefore = new Set(fs.readdirSync(path.join(ROOT, 'data')));
  console.log(`Chụp ${GAMES.length} game, ${GAMES.reduce((n, g) => n + g.shots.length, 0)} khung (log server ở ${TMP})`);
  GAMES.forEach(startServer);
  const stop = () => GAMES.forEach((g) => g.proc?.kill());
  process.on('SIGINT', () => { stop(); process.exit(1); });
  try {
    await Promise.all(GAMES.map((g) => waitPort(g.port)));
    const queue = [...GAMES];
    await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
      for (let g; (g = queue.shift());) {
        try { g.frames = await captureGame(g); } catch (e) { console.log(`  ⚠️  ${g.id}: ${e.message}`); g.frames = []; }
        g.proc.kill(); // xong game nào tắt server game đó
      }
    }));
  } finally {
    stop();
    await sleep(500);
    // dọn file điểm/từ đã hỏi của các server chụp, trả lại kỷ lục Thế chữ
    for (const f of fs.readdirSync(path.join(ROOT, 'data'))) if (!dataBefore.has(f) && f.includes('figma-')) fs.rmSync(path.join(ROOT, 'data', f), { force: true });
    if (chainRecBefore) fs.writeFileSync(chainRec, chainRecBefore); else fs.rmSync(chainRec, { force: true });
  }

  const css = pageCss();
  fs.rmSync(path.join(OUT, 'man-that'), { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'man-that'), { recursive: true });
  let n = 0, body = '';
  for (const grp of GROUPS) {
    const games = grp.games.filter((g) => g.frames?.length);
    if (!games.length) continue;
    body += `<section class="grp"><h2>${esc(grp.title)}</h2><div class="games">`;
    for (const g of games) {
      body += `<div class="game"><h3>${esc(g.name)}</h3><div class="shots">`;
      for (const f of g.frames) {
        const stage = inlineAssets(f.html);
        const label = `${g.name.replace(/ \(.*\)$/, '')} · ${SHOT[f.shot]}`;
        body += `<figure class="fr"><figcaption>${esc(SHOT[f.shot])}</figcaption>${stage}</figure>`;
        const file = `${String(++n).padStart(2, '0')}-${g.id}-${f.shot}.html`;
        fs.writeFileSync(path.join(OUT, 'man-that', file), `${head(`${label} · Migii TOEIC Live`, css)}\n<body class="one">${stage}</body>\n</html>\n`);
      }
      body += '</div></div>';
    }
    body += '</div></section>';
  }
  const today = new Date().toLocaleDateString('vi-VN');
  const board = `${head('Migii TOEIC Live · màn thật cho Figma', css)}
<body class="board">
<div class="head"><h1>Migii TOEIC Live · màn đang chạy (${today})</h1>
<p>Chụp từ game thật với khán giả ảo (tên người chơi là mẫu). Mỗi khung 1080 × 1920; nội dung chính phải nằm trong y 150–1600 vì thanh tên kênh TikTok che mép trên, khung bình luận che góc dưới trái. Câu miễn trừ ETS phải có trên mọi màn.</p></div>
${body}
</body>
</html>
`;
  const boardFile = path.join(OUT, 'migii-live-man-that.html');
  fs.writeFileSync(boardFile, board);
  const urls = [...board.matchAll(/https?:\/\/[^\s"')]+/g)].map((m) => m[0]).filter((u) => !u.startsWith('https://fonts.g') && !u.startsWith('http://www.w3.org/')); // xmlns của SVG không phải tải ngoài
  console.log(`\nXong: ${n} khung → ${path.relative(ROOT, boardFile)} (${(fs.statSync(boardFile).size / 1048576).toFixed(1)} MB) và design/out/man-that/`);
  if (urls.length) console.log(`⚠️  còn ${urls.length} liên kết ngoài chưa nhúng, ví dụ ${urls[0]}`);
  fs.rmSync(TMP, { recursive: true, force: true });
}

main().catch((e) => { console.error(e); process.exit(1); });
