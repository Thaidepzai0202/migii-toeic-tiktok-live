// Bước 6: xuất bài thành video dọc 1080×1920 (MP4, có tiếng) để đăng TikTok. Cùng cách với gia-su/xuat-video.js:
// Chrome chạy ẩn, TẮT TIẾNG, trang tự chạy đúng nhịp đọc và được ghi hình; tiếng ghép riêng từ am/ theo đúng lúc trang phát từng câu.
//   node gia-su/thu-chua-bai/dung/6-video.js [tên bài, mặc định cau-dieu-kien] [--nhac <file trong public/audio>] [--khong-nhac]
// Ra: data/video/chua-bai-<bài>.mp4 (có nhạc nền) và …-khong-nhac.mp4. Mức tiếng như video gia sư: giọng -14,5 LUFS, nhạc thấp hơn 12 dB.
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync, spawnSync } = require('child_process');
const GOC = path.join(__dirname, '..'), ROOT = path.join(GOC, '..', '..');
const WebSocket = require(path.join(ROOT, 'node_modules', 'ws'));
const argv = process.argv.slice(2);
const giaTri = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const ten = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--nhac') || 'cau-dieu-kien';
const NHAC = argv.includes('--khong-nhac') ? null : path.join(ROOT, 'public', 'audio', giaTri('--nhac') || 'video-chill-lofi.m4a');
const RA = path.join(ROOT, 'data', 'video');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const GIONG_LUFS = -14.5, NHAC_DUOI = 12;
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
const ff = (...a) => execFileSync('nice', ['-n', '15', 'ffmpeg', '-y', '-loglevel', 'error', ...a]);
const doTo = (f) => Number((spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-vn', '-af', 'ebur128=framelog=quiet', '-f', 'null', '-']).stderr.toString().match(/I:\s+(-?[\d.]+) LUFS/) || [0, -20])[1]);

(async () => {
  const tam = fs.mkdtempSync(path.join(require('os').tmpdir(), 'chua-bai-video-'));
  const anh = path.join(tam, 'anh'); fs.mkdirSync(anh);
  const cdpPort = 9400 + Math.floor(Math.random() * 400);
  const chrome = spawn('nice', ['-n', '10', CHROME, '--headless=new', `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${path.join(tam, 'chrome')}`,
    '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files', '--hide-scrollbars', '--window-size=540,960', '--no-first-run',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  const don = async () => { try { chrome.kill(); } catch {} await ngu(800); try { fs.rmSync(tam, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {} };
  try {
    let tab; for (let i = 0; i < 60 && !tab; i++) { await ngu(250); try { tab = (await (await fetch(`http://127.0.0.1:${cdpPort}/json`)).json()).find((t) => t.type === 'page'); } catch {} }
    const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise((r) => ws.on('open', r));
    let id = 0; const cho = new Map(), khung = [], loi = [];
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
    await goi('Runtime.enable'); await goi('Page.enable');
    await goi('Emulation.setDeviceMetricsOverride', { width: 540, height: 960, deviceScaleFactor: 2, mobile: false });
    await goi('Page.navigate', { url: `file://${path.join(GOC, `${ten}.html`)}?video=1` });
    for (let k = 0; !(await js('!!window.__sanSang')); k++) { if (k > 100) throw new Error('Trang không sẵn sàng'); await ngu(100); }
    await ngu(1200); // ảnh nền, mây, Ninja tải xong
    console.log(`🎬 Ghi bài ${ten}…`);
    await goi('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
    await ngu(400);
    await js('chay(0); 1');
    const t0 = Date.now(); let bao = Date.now();
    while (!(await js('window.__xongVideo || 0'))) {
      if (Date.now() - t0 > 10 * 60e3) throw new Error('Quá 10 phút chưa hết bài');
      if (Date.now() - bao > 30e3) { bao = Date.now(); console.log(`   … ${Math.round((Date.now() - t0) / 1000)} giây, cảnh ${await js("document.querySelector('.canh.bat')?.id")}`); }
      await ngu(300);
    }
    await ngu(800);
    await goi('Page.stopScreencast'); await ngu(300);
    const am = (await js('window.__am || []')) || [];
    if (!khung.length) throw new Error('Không ghi được khung hình nào');
    if (loi.length) console.warn('⚠️  Lỗi JS trên trang:', loi.slice(0, 3));

    // Hình: mỗi khung đứng tới lúc khung sau tới
    const T0 = khung[0].t, tCuoi = Date.now(), tong = ((tCuoi - T0) / 1000).toFixed(3);
    const ds = khung.map((k, i) => `file '${k.f}'\nduration ${(((khung[i + 1]?.t ?? tCuoi) - k.t) / 1000).toFixed(3)}`);
    ds.push(`file '${khung[khung.length - 1].f}'`);
    fs.writeFileSync(path.join(tam, 'hinh.txt'), ds.join('\n'));
    // Tiếng: mỗi câu đặt đúng lúc trang bắt đầu phát
    const vao = [], loc = [];
    am.forEach((a, i) => { vao.push('-i', path.join(GOC, 'am', a.file)); loc.push(`[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.max(0, Math.round(a.t - T0))}:all=1[a${i}]`); });
    fs.writeFileSync(path.join(tam, 'tieng.txt'), `${loc.join(';\n')};\n${am.map((_, i) => `[a${i}]`).join('')}amix=inputs=${am.length}:normalize=0:dropout_transition=0,apad,atrim=0:${tong}[ra]`);
    const tho = path.join(tam, 'tho.wav'), giong = path.join(tam, 'giong.wav');
    ff(...vao, '-/filter_complex', path.join(tam, 'tieng.txt'), '-map', '[ra]', '-ar', '48000', tho);
    ff('-i', tho, '-af', `volume=${(GIONG_LUFS - doTo(tho)).toFixed(1)}dB,alimiter=limit=0.891:attack=5:release=50:level=0`, giong);
    console.log(`   ${khung.length} khung hình (${(khung.length / tong).toFixed(1)} khung/giây), ${am.length} câu đọc, ${tong} giây → mã hoá…`);
    fs.mkdirSync(RA, { recursive: true });
    const khongNhac = path.join(RA, `chua-bai-${ten}-khong-nhac.mp4`), coNhac = path.join(RA, `chua-bai-${ten}.mp4`);
    ff('-f', 'concat', '-safe', '0', '-i', path.join(tam, 'hinh.txt'), '-i', giong, '-vf', 'fps=30,scale=1080:1920:flags=lanczos,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-threads', '4', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', khongNhac);
    console.log(`✅ ${path.relative(process.cwd(), khongNhac)}`);
    if (NHAC && fs.existsSync(NHAC)) {
      const g = Number(tong), toNhac = doTo(NHAC);
      ff('-i', khongNhac, '-stream_loop', '-1', '-i', NHAC, '-filter_complex', [
        `[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=${(GIONG_LUFS - NHAC_DUOI - toNhac).toFixed(1)}dB,atrim=0:${g},afade=t=in:d=1.5,afade=t=out:st=${Math.max(0, g - 2.5)}:d=2.5[nhac]`,
        '[0:a]aresample=48000,aformat=channel_layouts=stereo,asplit=2[g1][g2]',
        '[nhac][g1]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=450[nen]',
        '[g2][nen]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.891:attack=5:release=50:level=0[ra]'].join(';'),
        '-map', '0:v', '-map', '[ra]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', coNhac);
      console.log(`✅ ${path.relative(process.cwd(), coNhac)} (nhạc nền: ${path.basename(NHAC)})`);
    } else if (NHAC) console.warn(`⚠️  Không thấy file nhạc ${NHAC}`);
    ws.close(); await don(); process.exit(0);
  } catch (e) { console.error('❌', e.message); await don(); process.exit(1); }
})();
