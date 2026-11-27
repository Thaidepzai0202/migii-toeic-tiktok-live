// Chụp mọi bước của bài thành PNG 1080×1920 (không kèm nút của trang xem thử).
//   node gia-su/thu-chua-bai/dung/5-chup.js [tên bài, mặc định cau-dieu-kien]
// Ra: png/<bài>/tung-buoc/NN-<cảnh>.png (mỗi bước một ảnh) và png/<bài>/canh-day-du/ (mỗi cảnh lúc đã hiện đủ).
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const WebSocket = require('ws');
const GOC = path.join(__dirname, '..');
const ten = process.argv[2] || 'cau-dieu-kien';
const bai = JSON.parse(fs.readFileSync(path.join(GOC, `${ten}.json`), 'utf8'));
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const port = 9334, tam = fs.mkdtempSync(path.join(os.tmpdir(), 'chup-bai-'));
  const ch = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--mute-audio', '--hide-scrollbars',
    '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${tam}`, 'about:blank'], { stdio: 'ignore' });
  let tab;
  for (let i = 0; i < 40 && !tab; i++) { await ngu(250); try { tab = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
  const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise((r) => ws.on('open', r));
  let id = 0; const cho = new Map();
  ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && cho.has(d.id)) cho.get(d.id)(d.result); });
  const goi = (method, params = {}) => new Promise((r) => { cho.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  await goi('Page.enable');
  await goi('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1984, deviceScaleFactor: 1, mobile: false }); // 1920 + 64 cho hàng nút
  const dir = (d) => { const p = path.join(GOC, 'png', ten, d); fs.rmSync(p, { recursive: true, force: true }); fs.mkdirSync(p, { recursive: true }); return p; };
  const buoc = dir('tung-buoc'), canh = dir('canh-day-du');
  let n = 0;
  for (let i = 0; i < bai.buoc.length; i++) {
    await goi('Page.navigate', { url: `file://${path.join(GOC, `${ten}.html`)}?xem=${i}` });
    await ngu(700);
    const png = Buffer.from((await goi('Page.captureScreenshot', { clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 } })).data, 'base64');
    const c = bai.buoc[i].canh, so = String(i + 1).padStart(2, '0');
    fs.writeFileSync(path.join(buoc, `${so}-${c}.png`), png);
    const het = i === bai.buoc.length - 1 || bai.buoc[i + 1].canh !== c;
    if (het || bai.buoc[i].viec === 'dem') fs.writeFileSync(path.join(canh, `${String(++n).padStart(2, '0')}-${c}${het ? '' : '-dang-dem'}.png`), png);
  }
  console.log(`${bai.buoc.length} ảnh từng bước, ${n} ảnh cảnh đầy đủ → ${path.join(GOC, 'png', ten)}`);
  ws.close(); ch.kill();
  await new Promise((r) => ch.on('exit', r)); // Chrome còn ghi hồ sơ tạm tới lúc thoát hẳn
  try { fs.rmSync(tam, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
})();
