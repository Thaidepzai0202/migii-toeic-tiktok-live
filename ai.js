// AI dẫn chương trình "Cáo Jaemy": đọc bình luận (không phải đáp án), chọn câu đáng trả lời rồi đáp bằng chữ + giọng.
// LLM đi qua gateway nội bộ claude-api (gói thuê bao, KHÔNG API trả tiền theo token) — mặc định Claude Haiku ~6s/câu.
//   AI_GATEWAY_URL (mặc định http://127.0.0.1:8765) · AI_MODEL (mặc định claude-haiku-5-5)
//   Token: CLAUDE_API_TOKEN trong env hoặc ../../claude-api/.env
const fs = require('fs');
const path = require('path');

const GATEWAY = (process.env.AI_GATEWAY_URL || 'http://127.0.0.1:8765').replace(/\/$/, '');
const MODEL = process.env.AI_MODEL || 'claude-haiku-5-5';
const GAP_MS = 9000; // tối thiểu giữa 2 câu trả lời (không nói át game)
const MAX_AGE_MS = 25000; // bình luận cũ hơn thì bỏ, trả lời muộn vô duyên

function token() {
  if (process.env.CLAUDE_API_TOKEN) return process.env.CLAUDE_API_TOKEN;
  try {
    const env = fs.readFileSync(path.join(__dirname, '../../claude-api/.env'), 'utf8');
    return env.match(/^CLAUDE_API_TOKEN=(.+)$/m)?.[1].trim();
  } catch {
    return null;
  }
}

// Chấm điểm bình luận: câu hỏi / gọi bot / nhờ giúp được ưu tiên; spam, 1-2 ký tự, toàn emoji thì bỏ.
function interest(text) {
  const t = text.toLowerCase();
  if (t.replace(/[\p{Emoji}\s\p{P}]/gu, '').length < 3) return 0;
  if (/^[가-힣ㄱ-ㅎㅏ-ㅣ\s]+$/.test(t) || /^[a-z\s]{2,14}$/.test(t)) return 0; // đoán đáp án (chữ Hàn / romaja) — không phải để AI đáp
  let s = 1;
  if (/\?|là gì|nghĩa|sao|thế nào|như nào|cách|tại sao|why|how|what/.test(t)) s += 3;
  if (/\b(bot|ad|admin|cáo|jaemy|mc|chị|anh ơi|em ơi)\b/.test(t)) s += 3;
  if (/gợi ý|khó|dễ|app|tải|học|topik|eps|hàn quốc|tiếng hàn/.test(t)) s += 2;
  if (/xin chào|hello|hi |chào/.test(t)) s += 1;
  return s;
}

const SYSTEM = `Bạn là "Cáo Jaemy" — MC AI dễ thương của livestream TikTok "Đố từ tiếng Hàn" do app Jaemy (từ điển & học tiếng Hàn) tổ chức.
Người xem gõ đáp án tiếng Hàn vào bình luận để ghi điểm; bạn trò chuyện với họ.
Luật trả lời:
- Tiếng Việt, thân thiện, vui, xưng "Cáo" gọi người xem là "bạn" hoặc tên. TỐI ĐA 22 từ, 1 câu (2 câu nếu thật cần).
- Gọi đúng tên người hỏi ở đầu câu.
- TUYỆT ĐỐI không nói ra đáp án câu đang đố (kể cả romaja, tách chữ, gợi ý quá lộ). Được gợi ý nhẹ: số âm tiết, chủ đề.
- Câu hỏi về tiếng Hàn khác (từ khác, ngữ pháp, phát âm, TOPIK, EPS): trả lời ngắn, đúng.
- Thỉnh thoảng (không phải mọi câu) nhắc khéo: tải app Jaemy để ôn lại từ vừa chơi.
- Bình luận tục tĩu, chính trị, quấy rối, đòi thông tin cá nhân, hay không cần đáp: đặt "skip": true.
Trả về JSON đúng dạng: {"skip": false, "reply": "..."}`;

exports.create = ({ getContext, onReply, log = console.log }) => {
  const TOKEN = token();
  const queue = []; // {user, text, at, score}
  let busy = false;
  let lastAt = 0;
  const lastByUser = new Map(); // không trả lời 1 người liên tục
  const stats = { asked: 0, replied: 0, skipped: 0, errors: 0, lastError: null, lastMs: 0 };

  async function ask(item, ctx) {
    const prompt = `${SYSTEM}

Tình hình game lúc này: ${ctx.summary}
Bảng điểm lượt: ${ctx.board || 'chưa có ai'}
Người xem "${item.user.name}" vừa bình luận: "${item.text}"`;
    const t0 = Date.now();
    const res = await fetch(`${GATEWAY}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ prompt, model: MODEL, expect_json: true, timeout: 40 }),
      signal: AbortSignal.timeout(45000),
    });
    const data = await res.json();
    stats.lastMs = Date.now() - t0;
    if (!data.success) throw new Error(String(data.error || data.detail || res.status).slice(0, 160));
    let r = data.result;
    if (typeof r === 'string') {
      try {
        r = JSON.parse(r.replace(/^```\w*|```$/g, ''));
      } catch {
        r = { reply: r };
      }
    }
    return r || {};
  }

  // Lưới chặn cuối: câu trả lời lỡ chứa đáp án câu đang hỏi → bỏ.
  function leaks(reply, ctx) {
    if (!ctx.secret) return false;
    const n = (s) => String(s || '').toLowerCase().replace(/[\s\-'.]/g, '');
    const r = n(reply);
    return [ctx.secret.w, ctx.secret.r].some((x) => x && n(x).length >= 2 && r.includes(n(x)));
  }

  async function pump() {
    if (busy || !TOKEN || !queue.length || Date.now() - lastAt < GAP_MS) return;
    const ctx = getContext();
    if (!ctx.enabled) return void (queue.length = 0);
    const now = Date.now();
    for (let i = queue.length - 1; i >= 0; i--) if (now - queue[i].at > MAX_AGE_MS) queue.splice(i, 1);
    if (!queue.length) return;
    queue.sort((a, b) => b.score - a.score || b.at - a.at);
    const item = queue.shift();
    busy = true;
    stats.asked++;
    try {
      const r = await ask(item, ctx);
      const reply = String(r.reply || '').trim().slice(0, 220);
      const ctxNow = getContext(); // câu hỏi có thể đã đổi trong lúc chờ
      if (r.skip || !reply) stats.skipped++;
      else if (leaks(reply, ctxNow) || leaks(reply, ctx)) {
        stats.skipped++;
        log(`AI: chặn câu lộ đáp án → ${reply}`);
      } else {
        stats.replied++;
        lastAt = Date.now();
        lastByUser.set(item.user.uid, lastAt);
        onReply({ name: item.user.name, avatar: item.user.avatar, q: item.text, reply });
      }
    } catch (e) {
      stats.errors++;
      stats.lastError = e.message;
      log(`AI lỗi: ${e.message}`);
    } finally {
      busy = false;
    }
  }
  setInterval(pump, 1000);

  return {
    ready: !!TOKEN,
    model: MODEL,
    stats,
    // Gọi với mọi bình luận KHÔNG phải đáp án đúng
    hear(user, text) {
      if (!TOKEN) return;
      const score = interest(text);
      if (!score) return;
      const recent = Date.now() - (lastByUser.get(user.uid) || 0) < 60000;
      queue.push({ user, text, at: Date.now(), score: recent ? score - 2 : score });
      if (queue.length > 30) queue.splice(0, queue.length - 30);
    },
  };
};
