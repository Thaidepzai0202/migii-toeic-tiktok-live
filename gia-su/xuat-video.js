// Xuất một bài gia sư thành video dọc 1080×1920 (MP4, có tiếng) để đăng TikTok — người dùng yêu cầu 23/11/2026 (bài học hợp
// video hơn live). node gia-su/xuat-video.js <số bài> [--ra <thư mục>]   → data/video/<NNN>-<id bài>.mp4
//
// KHÔNG PHÁT RA TIẾNG trên máy (dùng được lúc đang live game): Chrome chạy ẩn với --mute-audio, chỉ để trang chạy đúng nhịp đọc;
// tiếng của video ghép riêng từ file giọng đã sinh sẵn (data/tts-cache, data/en-audio) theo đúng lúc trang bắt đầu đọc từng câu.
// Không gọi VieNeu, không nối TikTok, không đụng server live/game: tự dựng server tạm trên cổng trống. Chrome và ffmpeg chạy nice.
// Trang chạy ở chế độ ?live=1&video=1 (gia-su-live.js): một bài, lời đọc bản video (gia-su/bai/video: chỉ tiếng Anh + tiếng Việt),
// không phụ đề; câu hỏi hiện ra, đếm 10 giây rồi hiện đáp án; hết bài là màn kết "Nhớ follow kênh + tải app Migii TOEIC"
// (người dùng chốt 25/11/2026). Tên kênh: --kenh <tên> / GIA_SU_KENH / TIKTOK_USER trong .env.
//
// XEM TRƯỚC (có tiếng, để duyệt hiệu ứng trước khi xuất): node gia-su/xuat-video.js --xem [số bài] [--port 8796] [--khong-mo]
//   mở http://localhost:8796/… : chọn bài, chỗ bắt đầu (đầu bài / một phần / chỉ màn kết), bấm Xem. Ctrl+C để tắt.
// Câu tiếng Việt chưa có file giọng thì sinh bằng VieNeu trên máy (miễn phí); từ tiếng Anh chưa có thì lấy ở dịch vụ đọc của Migii.
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const WebSocket = require('ws');

const ROOT = path.join(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch {}
const PUB = path.join(__dirname, 'public');
const BAI = fs.existsSync(path.join(__dirname, 'bai', 'video')) ? path.join(__dirname, 'bai', 'video') : path.join(__dirname, 'bai', 'live');
const argv = process.argv.slice(2);
const CO_GIA_TRI = new Set(['--ra', '--nhac', '--them-nhac', '--port', '--kenh']);
const SO = Number(argv.find((a, i) => /^\d+$/.test(a) && !CO_GIA_TRI.has(argv[i - 1]))) || 0;
const XEM = argv.includes('--xem');
const giaTri = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const KENH = (giaTri('--kenh') || process.env.GIA_SU_KENH || process.env.TIKTOK_USER || '').replace(/^@/, '');
const thamSo = () => (KENH ? `&kenh=${encodeURIComponent(KENH)}` : '');
const tts = require('../tts');
const enAudio = require('../en_audio');
const { tachLoi } = require('./public/tach-loi');
const RA = path.resolve(argv.includes('--ra') ? argv[argv.indexOf('--ra') + 1] : path.join(ROOT, 'data', 'video'));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Nhạc nền ----------
// Các bản nhạc cho video (CC0, nguồn ghi ở public/audio/CREDITS.md), bản đầu là mặc định; trang xem trước cho chọn và nghe thử.
// Lặp suốt video, nhỏ dưới giọng, tự hạ thêm lúc gia sư đọc (sidechain), vào/ra êm; cả bản chuẩn hoá âm lượng về -14 LUFS (mức hay
// dùng trên TikTok). --khong-nhac: bỏ · --nhac <tên file trong public/audio hoặc đường dẫn>: nhạc khác.
// Thêm nhạc vào video đã xuất (không ghi hình lại): node gia-su/xuat-video.js --them-nhac data/video/<file>.mp4
const DS_NHAC = [
  { file: 'video-chill-lofi.m4a', ten: 'Chill lofi (piano jazz)' },
  { file: 'video-lofi-again.m4a', ten: 'Lofi again (nhẹ, đều)' },
  { file: 'video-lofi-loop.m4a', ten: 'Lofi hip hop (có nhịp)' },
  { file: 'video-midsummer.m4a', ten: 'Midsummer (lofi 8-bit, vui)' },
  { file: 'bgm.m4a', ten: 'Menu chill (bản cũ, đoạn lặp 17 giây)' },
].filter((n) => fs.existsSync(path.join(ROOT, 'public', 'audio', n.file)));
const tepNhac = (x) => (x.includes('/') ? path.resolve(x) : path.join(ROOT, 'public', 'audio', x));
const NHAC = argv.includes('--khong-nhac') ? null : tepNhac(argv.includes('--nhac') ? argv[argv.indexOf('--nhac') + 1] : (DS_NHAC[0]?.file || 'bgm.m4a'));
// Âm lượng đặt cố định (không chuẩn hoá tự động: kiểu đó kéo nhạc to lên ở chỗ gia sư ngừng đọc): đo độ to (LUFS) của giọng và nhạc,
// đưa giọng về GIONG_LUFS, nhạc thấp hơn giọng NHAC_DUOI dB; lúc gia sư đọc nhạc hạ thêm (sidechain); chặn đỉnh -1 dB.
const GIONG_LUFS = -14.5;
const NHAC_DUOI = Number(process.env.GIA_SU_NHAC_DUOI) || 12;
const doTo = (f) => {
  const r = require('child_process').spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-vn', '-af', 'ebur128=framelog=quiet', '-f', 'null', '-']);
  const m = r.stderr.toString().match(/I:\s+(-?[\d.]+) LUFS/);
  return m ? Number(m[1]) : -20;
};
const locNhac = (giong, nhac, giay, toGiong, toNhac) => [
  `[${nhac}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${(GIONG_LUFS - NHAC_DUOI - toNhac).toFixed(1)}dB,atrim=0:${giay},afade=t=in:d=1.5,afade=t=out:st=${Math.max(0, giay - 2.5)}:d=2.5[nhac]`,
  `[${giong}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${(GIONG_LUFS - toGiong).toFixed(1)}dB,asplit=2[g1][g2]`,
  '[nhac][g1]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=450[nen]',
  '[g2][nen]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.891:attack=5:release=50:level=0[ra]',
].join(';');
const thoiLuong = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

if (argv.includes('--them-nhac')) {
  const vao = path.resolve(argv[argv.indexOf('--them-nhac') + 1]);
  if (!NHAC || !fs.existsSync(NHAC) || !fs.existsSync(vao)) { console.error('Thiếu file video hoặc file nhạc'); process.exit(1); }
  const goc = vao.replace(/\.mp4$/, '-khong-nhac.mp4');
  if (!fs.existsSync(goc)) fs.renameSync(vao, goc); // giữ bản không nhạc (để so, và để chạy lại không bị chồng nhạc hai lần)
  const tam = vao.replace(/\.mp4$/, '.tam.mp4');
  execFileSync('nice', ['-n', '15', 'ffmpeg', '-y', '-loglevel', 'error', '-i', goc, '-stream_loop', '-1', '-i', NHAC,
    '-filter_complex', locNhac(0, 1, thoiLuong(goc), doTo(goc), doTo(NHAC)),
    '-map', '0:v', '-map', '[ra]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', tam]);
  fs.renameSync(tam, vao);
  console.log(`✅ ${path.relative(process.cwd(), vao)} (đã thêm nhạc nền) · bản không nhạc: ${path.relative(process.cwd(), goc)}`);
  process.exit(0);
}
if (!SO && !XEM) { console.error('Dùng: node gia-su/xuat-video.js <số bài, vd 1> [--khong-nhac] [--kenh <tên kênh>]   ·   xem trước: --xem [số bài]'); process.exit(1); }

// ---------- File giọng có sẵn (cùng cách đặt tên với tts.js / en_audio.js; thiếu thì báo, không sinh mới) ----------
const VOICE = process.env.VIENEU_VOICE || 'Ngọc Linh';
const TALK_ID = Number(process.env.EN_TALK_ID || 500);
const sach = (t) => String(t).replace(/[ᄀ-ᇿ㄰-㆏가-힯]+/g, '').replace(/\(\s*\)|\[\s*\]/g, '')
  .replace(/\p{Extended_Pictographic}|️/gu, '').replace(/\s+([,.!?])/g, '$1').replace(/\s+/g, ' ').trim().slice(0, 300);
function fileGiong(l, t) {
  if (l === 'vi') return path.join(ROOT, 'data', 'tts-cache', `${crypto.createHash('md5').update(`${VOICE}|${sach(t)}`).digest('hex').slice(0, 16)}.wav`);
  return path.join(ROOT, 'data', 'en-audio', `${crypto.createHash('md5').update(`${TALK_ID}|${String(t).toLowerCase()}`).digest('hex')}.mp3`);
}

// ---------- Server tạm ----------
const dsBai = fs.readdirSync(BAI).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(BAI, f), 'utf8')));
const bai = dsBai.find((b) => b.so === (SO || 1));
if (!bai) { console.error(`Không có bài số ${SO} trong ${path.relative(ROOT, BAI)} (dựng bằng npm run build:gia-su)`); process.exit(1); }
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4' };
const thieu = new Set();
const guiFile = (res, f) => (fs.existsSync(f) ? (res.writeHead(200, { 'Content-Type': LOAI[path.extname(f)] || 'application/octet-stream' }), fs.createReadStream(f).pipe(res)) : res.writeHead(404).end());
// Giọng của một đoạn: có sẵn thì dùng (chạm file để tts.js không dọn), chưa có thì sinh (VieNeu trên máy / dịch vụ đọc tiếng Anh của Migii)
async function layGiong(l, t) {
  const f = fileGiong(l, t);
  if (l === 'vi' && tts.enabled) return tts.synth(t);
  if (fs.existsSync(f)) return f;
  if (l === 'en') return enAudio.get(t);
  throw new Error('chưa có giọng');
}
// Mọi câu một bài sẽ đọc lúc chạy video (lời giảng bản video, màn kết) — trùng LOI_KET ở gia-su-live.js
const LOI_CO_DINH = ['Bạn nhớ [follow] kênh để học bài tiếp theo nhé.', 'Và tải app Mi gi Tô ích để luyện thi mỗi ngày!'];
function cauCuaBai(b) {
  const out = [];
  const di = (x) => { if (Array.isArray(x)) x.forEach(di); else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) (k === 'noi' && typeof v === 'string' ? out.push(v) : di(v)); };
  di(b);
  return [...out, ...LOI_CO_DINH].flatMap((n) => tachLoi(n)).filter((d) => d.l !== 'nghi');
}
// Câu tiếng Anh dài chỉ đọc được khi đã đăng ký (en_audio.js không đọc chữ tuỳ ý): mọi đoạn [tiếng Anh] trong lời đọc các bài
enAudio.allowText([...new Set(dsBai.flatMap(cauCuaBai).filter((d) => d.l === 'en').map((d) => d.doc))]);

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = decodeURIComponent(u.pathname);
  if (p === '/' || p === '/index.html') return guiFile(res, path.join(PUB, 'index.html'));
  if (p === '/bai') return res.writeHead(200, { 'Content-Type': LOAI['.json'] }).end(JSON.stringify(dsBai.map((b) => ({ id: b.id, ten: b.ten, nhom: b.nhom, so_phan: b.phan.length, live: true, so: b.so }))));
  if (p.startsWith('/bai/')) { const b = dsBai.find((x) => x.id === p.slice(5)); return b ? res.writeHead(200, { 'Content-Type': LOAI['.json'] }).end(JSON.stringify({ ...b, live: true })) : res.writeHead(404).end(); }
  if (p === '/nhac') return res.writeHead(200, { 'Content-Type': LOAI['.json'] }).end(JSON.stringify(DS_NHAC));
  if (p === '/live/vi-tri') return res.writeHead(200, { 'Content-Type': LOAI['.json'] }).end('{"i":0}');
  if (p === '/am') {
    const l = u.searchParams.get('l');
    const t = u.searchParams.get('t') || '';
    if (XEM) return layGiong(l, t).then((f) => guiFile(res, f), () => res.writeHead(404).end());
    const f = fileGiong(l, t);
    if (!fs.existsSync(f)) thieu.add(`${l}: ${t}`);
    return guiFile(res, f);
  }
  if (/^\/(fonts|img|audio)\/[\w.-]+$/.test(p)) return guiFile(res, path.join(ROOT, 'public', p));
  if (/^\/[\w.-]+\.(js|css)$/.test(p)) return guiFile(res, path.join(PUB, p));
  res.writeHead(404).end();
});

// ---------- Chrome ẩn, tắt tiếng ----------
async function cdp(port) {
  for (let k = 0; k < 60; k++) { try { const t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const pg = t.find((x) => x.type === 'page'); if (pg) return pg.webSocketDebuggerUrl; } catch {} await ngu(250); }
  throw new Error('Chrome không mở được cổng điều khiển');
}

if (XEM) {
  const cong = Number(giaTri('--port')) || 8796;
  server.listen(cong, '127.0.0.1', () => {
    const url = `http://localhost:${cong}/?live=1&video=1&xem=1&bai-so=${SO || 1}${thamSo()}`;
    console.log(`👀 Xem trước video: ${url}\n   Chọn bài / chỗ bắt đầu, bấm Xem (có tiếng). Ctrl+C để tắt.`);
    if (!argv.includes('--khong-mo')) {
      const env = { ...process.env };
      delete env.ELECTRON_RUN_AS_NODE; // shell của VS Code đặt biến này, làm hỏng app mở từ đây
      spawn('open', [url], { stdio: 'ignore', env });
    }
  });
} else (async () => {
  // Sinh sẵn giọng còn thiếu trước khi ghi hình (thiếu lúc đang ghi thì video im ở đó)
  const doan = cauCuaBai(bai).filter((d) => d.l === 'en' || tts.enabled);
  const moi = doan.filter((d) => !fs.existsSync(fileGiong(d.l, d.doc)));
  if (moi.length) console.log(`🗣️  Sinh ${moi.length} câu giọng còn thiếu…`);
  for (const d of doan) { try { await layGiong(d.l, d.doc); } catch (e) { console.warn(`⚠️  Không sinh được giọng ${d.l} "${d.doc.slice(0, 40)}": ${e.message}`); } }
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const cong = server.address().port;
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'gia-su-video-'));
  const anh = path.join(tam, 'anh');
  fs.mkdirSync(anh);
  const cdpPort = 9400 + Math.floor(Math.random() * 400);
  const chrome = spawn('nice', ['-n', '10', CHROME, '--headless=new', `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${path.join(tam, 'chrome')}`,
    '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', '--window-size=540,960', '--no-first-run',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  const xong = (code) => { try { chrome.kill(); } catch {} server.close(); fs.rmSync(tam, { recursive: true, force: true }); process.exit(code); };
  try {
    const ws = new WebSocket(await cdp(cdpPort));
    await new Promise((r) => ws.on('open', r));
    let id = 0;
    const cho = new Map();
    const khung = [];
    const loi = [];
    const goi = (method, params = {}) => new Promise((r) => { const i = ++id; cho.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    ws.on('message', (m) => {
      const d = JSON.parse(m);
      if (d.id && cho.has(d.id)) { cho.get(d.id)(d); cho.delete(d.id); return; }
      if (d.method === 'Page.screencastFrame') {
        const f = path.join(anh, `${String(khung.length).padStart(6, '0')}.jpg`);
        fs.writeFileSync(f, Buffer.from(d.params.data, 'base64'));
        khung.push({ f, t: d.params.metadata.timestamp * 1000 });
        ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId: d.params.sessionId } }));
      }
      if (d.method === 'Runtime.exceptionThrown') loi.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    });
    const js = async (e) => (await goi('Runtime.evaluate', { expression: e, returnByValue: true })).result.result?.value;
    await goi('Runtime.enable');
    await goi('Page.enable');
    await goi('Emulation.setDeviceMetricsOverride', { width: 450, height: 800, deviceScaleFactor: 2.4, mobile: false });
    await goi('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
    await goi('Page.navigate', { url: `http://127.0.0.1:${cong}/?live=1&video=1&bai-so=${SO}${thamSo()}` });
    for (let k = 0; !(await js('!!window.__sanSang')); k++) { if (k > 200) throw new Error('Trang không sẵn sàng'); await ngu(100); }
    await ngu(1500); // font, hình Ninja tải xong
    console.log(`🎬 Ghi bài ${SO}: ${bai.ten}…`);
    await goi('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
    await ngu(600);
    await js('window.__batDau = 1');
    const t0 = Date.now();
    let bao = 0;
    while (!(await js('window.__xongVideo || 0'))) {
      if (Date.now() - t0 > 15 * 60e3) throw new Error('Quá 15 phút chưa hết bài');
      if (Date.now() - bao > 30e3) { bao = Date.now(); console.log(`   … ${Math.round((Date.now() - t0) / 1000)} giây, phần ${(await js('S.buoc[S.i]?.phanSo')) + 1}/${bai.phan.length}`); }
      await ngu(300);
    }
    await ngu(1500); // giữ màn cuối một chút
    await goi('Page.stopScreencast');
    await ngu(300);
    const am = (await js('window.__am || []')) || [];
    if (!khung.length) throw new Error('Không ghi được khung hình nào');
    if (loi.length) console.warn('⚠️  Lỗi JS trên trang:', loi.slice(0, 3));
    if (thieu.size) console.warn(`⚠️  ${thieu.size} câu chưa có file giọng (video sẽ im ở đó):`, [...thieu].slice(0, 5));

    // ---------- Ghép hình: mỗi khung đứng tới lúc khung sau tới ----------
    const T0 = khung[0].t;
    const tCuoi = Date.now();
    const ds = khung.map((k, i) => `file '${k.f}'\nduration ${(((khung[i + 1]?.t ?? tCuoi) - k.t) / 1000).toFixed(3)}`);
    ds.push(`file '${khung[khung.length - 1].f}'`);
    fs.writeFileSync(path.join(tam, 'hinh.txt'), ds.join('\n'));
    // ---------- Ghép tiếng: mỗi câu đọc đặt đúng lúc trang bắt đầu phát ----------
    const vao = [];
    const loc = [];
    am.forEach((a, i) => {
      const u = new URL(a.src);
      const f = fileGiong(u.searchParams.get('l'), u.searchParams.get('t') || '');
      if (!fs.existsSync(f)) return;
      const tre = Math.max(0, Math.round(a.t - T0));
      vao.push('-i', f);
      loc.push(`[${vao.length / 2 - 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${tre}:all=1[a${i}]`);
    });
    const tong = ((tCuoi - T0) / 1000).toFixed(3);
    fs.mkdirSync(RA, { recursive: true });
    const ra = path.join(RA, `${String(SO).padStart(3, '0')}-${bai.id}.mp4`);
    const tieng = path.join(tam, 'tieng.wav');
    if (loc.length) {
      const nhan = loc.map((l) => l.match(/\[(a\d+)\]$/)[1]);
      fs.writeFileSync(path.join(tam, 'tieng.txt'), `${loc.join(';\n')};\n${nhan.map((n) => `[${n}]`).join('')}amix=inputs=${nhan.length}:normalize=0:dropout_transition=0,apad,atrim=0:${tong}[ra]`);
      execFileSync('nice', ['-n', '15', 'ffmpeg', '-y', '-loglevel', 'error', ...vao, '-/filter_complex', path.join(tam, 'tieng.txt'), '-map', '[ra]', '-ar', '48000', tieng]);
    } else {
      execFileSync('nice', ['-n', '15', 'ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', tong, tieng]);
    }
    console.log(`   ${khung.length} khung hình, ${am.length} câu đọc, ${tong} giây → ${NHAC ? 'thêm nhạc nền, ' : ''}mã hoá…`);
    let tiengCuoi = tieng;
    if (NHAC && fs.existsSync(NHAC)) {
      tiengCuoi = path.join(tam, 'tieng-nhac.wav');
      execFileSync('nice', ['-n', '15', 'ffmpeg', '-y', '-loglevel', 'error', '-i', tieng, '-stream_loop', '-1', '-i', NHAC,
        '-filter_complex', locNhac(0, 1, Number(tong), doTo(tieng), doTo(NHAC)), '-map', '[ra]', tiengCuoi]);
    } else if (NHAC) console.warn(`⚠️  Không thấy file nhạc ${NHAC}, xuất không nhạc`);
    execFileSync('nice', ['-n', '15', 'ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tam, 'hinh.txt'), '-i', tiengCuoi,
      '-vf', 'fps=30,scale=1080:1920:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-threads', '2',
      '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', ra]);
    console.log(`✅ ${path.relative(process.cwd(), ra)}`);
    ws.close();
    xong(0);
  } catch (e) {
    console.error('❌', e.message);
    xong(1);
  }
})();
