// Giọng đọc tiếng Việt VieNeu-TTS "Ngọc Linh" (giống video-live / video TikTok). Chạy local trên CPU, giữ 1 tiến trình
// Python suốt phiên (nạp model ~7s), mỗi câu ~0,5s. File wav cache theo md5 ở data/tts-cache/.
// Tắt: VIENEU=0 · đổi giọng: VIENEU_VOICE="Ngọc Linh" · đổi Python: VIENEU_PY=/đường/dẫn/python
// Không có VieNeu → /api/tts trả 503, trang game tự đọc bằng giọng của trình duyệt.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Mặc định dùng venv của auto-demo-tool (đã cài vieneu)
const PY = process.env.VIENEU_PY || path.join(__dirname, '../../jaemy-feature-guide/auto-demo-tool/server/.venv/bin/python');
const VOICE = process.env.VIENEU_VOICE || 'Ngọc Linh';
const CACHE = path.join(__dirname, 'data', 'tts-cache');
const SERVER = String.raw`
import sys, json, warnings
warnings.filterwarnings("ignore")
from vieneu import Vieneu
v = Vieneu()
sys.stdout.write("READY\n"); sys.stdout.flush()
for line in sys.stdin:
    req = json.loads(line)
    try:
        a = v.infer(req["text"], voice=req["voice"])
        v.save(a, req["out"])
        sys.stdout.write("OK\n")
    except Exception as e:
        sys.stdout.write("ERR " + str(e).replace("\n", " ") + "\n")
    sys.stdout.flush()
`;

const enabled = process.env.VIENEU !== '0' && fs.existsSync(PY);
let proc = null;
let ready = null;
let nextLine = null;
let chain = Promise.resolve(); // mỗi lúc chỉ sinh 1 câu
const pending = new Map(); // file -> Promise (nhiều yêu cầu cùng câu chỉ sinh 1 lần)

function start() {
  if (ready) return ready;
  fs.mkdirSync(CACHE, { recursive: true });
  proc = spawn(PY, ['-c', SERVER], { stdio: ['pipe', 'pipe', 'ignore'] });
  const waiters = [];
  readline.createInterface({ input: proc.stdout }).on('line', (l) => waiters.shift()?.(l.trim()));
  nextLine = () => new Promise((r) => waiters.push(r));
  ready = nextLine().then((l) => {
    if (l !== 'READY') throw new Error(`VieNeu không khởi động được: ${l}`);
    console.log(`🗣️  VieNeu-TTS sẵn sàng (giọng ${VOICE})`);
  });
  proc.on('exit', (code) => {
    console.error(`⚠️  VieNeu dừng (mã ${code}) — sẽ khởi động lại khi cần`);
    proc = null;
    ready = null;
    for (const w of waiters.splice(0)) w('ERR tiến trình đã dừng');
  });
  ready.catch((e) => console.error('❌', e.message));
  return ready;
}

// VieNeu là giọng tiếng Việt: chữ Hàn đọc sai → bỏ chữ Hàn (đã có romaja/âm CDN đi kèm), gọn khoảng trắng.
const clean = (t) =>
  String(t)
    .replace(/[ᄀ-ᇿ㄰-㆏가-힯]+/g, '')
    .replace(/\(\s*\)|\[\s*\]/g, '')
    .replace(/\p{Extended_Pictographic}|️/gu, '')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);

function synth(text, voice = VOICE) {
  const t = clean(text);
  if (!t) return Promise.reject(new Error('câu rỗng'));
  const file = path.join(CACHE, `${crypto.createHash('md5').update(`${voice}|${t}`).digest('hex').slice(0, 16)}.wav`);
  if (fs.existsSync(file)) return Promise.resolve(file);
  if (pending.has(file)) return pending.get(file);
  const job = (chain = chain
    .catch(() => {})
    .then(async () => {
      await start();
      proc.stdin.write(JSON.stringify({ text: t, voice, out: file }) + '\n');
      const resp = await nextLine();
      if (resp !== 'OK') throw new Error(`VieNeu lỗi: ${resp}`);
      return file;
    }));
  pending.set(file, job);
  job.finally(() => pending.delete(file)).catch(() => {});
  return job;
}

// GET /api/tts?text=… → audio/wav
async function handle(req, res, url) {
  const text = url.searchParams.get('text');
  if (!enabled || !text) return res.writeHead(503).end();
  try {
    const file = await synth(text);
    // Content-Length để trình duyệt biết độ dài file (thiếu thì duration = Infinity → hàng đợi giọng chạy sai)
    res.writeHead(200, { 'Content-Type': 'audio/wav', 'Content-Length': fs.statSync(file).size, 'Cache-Control': 'max-age=86400' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e.message);
    res.writeHead(503).end();
  }
}

function init() {
  if (enabled) start();
  else console.log('ℹ️  Không có VieNeu-TTS → dùng giọng đọc của trình duyệt');
}

module.exports = { enabled, VOICE, init, handle, synth };
