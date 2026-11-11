// Phát âm tiếng Anh cho từ vựng: dùng dịch vụ đọc của Migii (audio.eupgroup.net — cùng dịch vụ app Migii TOEIC
// gọi trong SpeakTextHelper.kt), lưu cache mp3 ở data/en-audio/ để lúc live không phụ thuộc mạng.
//   GET /api/say?w=company  → audio/mpeg (503 nếu lỗi → trang tự đọc bằng giọng tiếng Anh của trình duyệt)
//   Tạo sẵn cả kho trước buổi live: node build_audio.js
//   Tắt: EN_AUDIO=0 · đổi giọng: EN_TALK_ID (mặc định 500, giống app)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENABLED = process.env.EN_AUDIO !== '0';
const BASE = (process.env.EN_AUDIO_URL || 'https://audio.eupgroup.net').replace(/\/$/, '');
const TALK_ID = Number(process.env.EN_TALK_ID || 500);
const CACHE = path.join(__dirname, 'data', 'en-audio');
const pending = new Map();

// Chỉ nhận từ/cụm từ tiếng Anh ngắn — server mở trong mạng LAN, không để thành proxy đọc chữ tuỳ ý
// Câu dài (khung Nghe – chép) chỉ đọc được khi đã được đăng ký bằng allowText(): chỉ nhận đúng những câu có trong kho, không đọc chữ tuỳ ý.
const SENTENCES = new Set();
const allowText = (list) => { for (const t of list) SENTENCES.add(String(t).toLowerCase()); };
const valid = (w) => typeof w === 'string' && ((w.length <= 40 && /^[A-Za-z][A-Za-z' .-]*$/.test(w)) || (w.length <= 160 && SENTENCES.has(w.toLowerCase())));
const fileOf = (w) => path.join(CACHE, `${crypto.createHash('md5').update(`${TALK_ID}|${w.toLowerCase()}`).digest('hex')}.mp3`);

async function fetchAudio(w) {
  const form = new URLSearchParams({ text: w, talkID: String(TALK_ID), volume: '100', speed: '100', pitch: '96', dict: '3' });
  const r = await fetch(`${BASE}/tomcat/servlet/vt`, { method: 'POST', body: form, signal: AbortSignal.timeout(8000) });
  const body = (await r.text()).trim();
  const name = body.slice(body.indexOf('=') + 1);
  if (!r.ok || !/^[\w.-]+\.mp3$/.test(name)) throw new Error(`dịch vụ đọc trả về "${body.slice(0, 60)}"`);
  const a = await fetch(`${BASE}/audios/${name}`, { signal: AbortSignal.timeout(8000) });
  if (!a.ok) throw new Error(`tải audio ${a.status}`);
  const buf = Buffer.from(await a.arrayBuffer());
  if (buf.length < 500) throw new Error('audio rỗng');
  return buf;
}

// Trả về đường dẫn file mp3 trong cache (tải nếu chưa có). Nhiều yêu cầu cùng từ chỉ tải 1 lần.
function get(w) {
  if (!ENABLED) return Promise.reject(new Error('EN_AUDIO=0'));
  if (!valid(w)) return Promise.reject(new Error('từ không hợp lệ'));
  const file = fileOf(w);
  if (fs.existsSync(file)) return Promise.resolve(file);
  if (pending.has(file)) return pending.get(file);
  const job = fetchAudio(w).then((buf) => {
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(file, buf);
    return file;
  });
  pending.set(file, job);
  job.finally(() => pending.delete(file)).catch(() => {});
  return job;
}

async function handle(req, res, url) {
  try {
    const file = await get(url.searchParams.get('w'));
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': fs.statSync(file).size, 'Cache-Control': 'max-age=86400' });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.warn(`Phát âm "${url.searchParams.get('w')}": ${e.message}`);
    res.writeHead(503).end();
  }
}

module.exports = { get, handle, valid, allowText };
