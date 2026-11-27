// Người chơi ảo (bot) cho live thật: lấp chỗ trống lúc mới mở live, khi còn ít người xem, để khung nào cũng chạy được
// (Thế chữ cần đủ 2 người mỗi đội mới bắt đầu; ô chữ cần có người giải hàng mới mở được từ khoá…).
// Chơi như người thật: lúc đúng lúc sai, có độ trễ, đôi khi gõ sai rồi sửa. Tên không gắn nhãn trên màn live, NHƯNG
// (server.js lo phần này): không lên bục vinh danh / bảng vàng, không được khen "nhanh nhất", không chiếm thứ hạng điểm
// của người thật, không làm MVP và không lập kỷ lục Thế chữ. Màn điều khiển đánh dấu 🤖 để người dẫn phân biệt.
// Số bot mỗi câu do server.js tính (botCtx): càng nhiều người thật bình luận thì càng ít bot.
// Khung "ai đúng trước thì ăn" (ô chữ, Thế chữ): khi có người thật thì bot trả lời muộn và ít hơn để nhường.
const NAMES = [
  'Minh Anh', 'Thu Trang', 'Hoàng Long', 'Ngọc Hân', 'Bảo Ngọc', 'Tuấn Kiệt', 'Linh Chi', 'Quang Huy',
  'Phương Thảo', 'Khánh Vy', 'Đức Anh', 'Mai Phương', 'Hải Yến', 'Thanh Tùng', 'Gia Bảo', 'Ngân Hà',
];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

// Gõ sai kiểu người thật: thiếu 1 chữ cái hoặc đảo 2 chữ cái
function typo(w) {
  const c = [...w];
  if (c.length < 2) return w + w;
  const i = Math.floor(Math.random() * (c.length - 1));
  if (Math.random() < 0.5) c.splice(i, 1);
  else [c[i], c[i + 1]] = [c[i + 1], c[i]];
  return c.join('');
}

// Săn lỗi: người nghi nhầm một từ đúng thường "sửa" nó sang dạng khác (thêm/bớt s, ed), không gõ ra chữ vô nghĩa
function misfix(w) {
  const opts = [w.endsWith('s') ? w.slice(0, -1) : w + 's', w.endsWith('ed') ? w.slice(0, -2) : w.endsWith('e') ? w + 'd' : w + 'ed'];
  return pick(opts);
}

// onChat(user, text): đưa bình luận vào game như bình luận TikTok. isLive(round): câu đó còn đang hỏi không
// (đã sang công bố / câu khác thì bot thôi gõ, để đáp án không rơi vào màn công bố).
exports.create = ({ onChat, isLive = () => true }) => {
  const timers = [];
  const clear = () => timers.splice(0).forEach(clearTimeout);
  const userOf = (n) => ({ uid: `bot:${n}`, name: n, avatar: '', bot: true });
  const crowd = (k, skip = new Set()) => shuffle(NAMES.filter((n) => !skip.has(`bot:${n}`))).slice(0, k).map(userOf);
  const later = (r, s, fn) => timers.push(setTimeout(() => isLive(r) && fn(), Math.max(0.3, s) * 1000));
  // r.finGrace = giây đồng hồ đứng của câu về đích dùng chung (server.js markFinish): bot chờ hết màn chuyển rồi mới gõ
  const at = (r, u, s, text) => later(r, s + (r.finGrace || 0), () => onChat(u, text));

  // Trắc nghiệm (Word, Điền từ, Đọc nhanh, Nghe – nghĩa, Đố nhanh…): ~60% đúng, chỉ tính lần chọn đầu.
  // Khung mới ghi đáp án A–D (round.wq) thì bot gõ chữ cái; khung gốc ghi 1–4 thì gõ số.
  function mcq(r, users) {
    const sec = r.sec, letters = !!r.wq;
    for (const u of users) {
      if (Math.random() < 0.25) continue; // không phải bot nào cũng trả lời mọi câu
      const k = Math.random() < 0.6 ? r.answerIdx : pick([0, 1, 2, 3].filter((i) => i !== r.answerIdx));
      const label = letters ? (Math.random() < 0.7 ? 'ABCD' : 'abcd')[k] : String(k + 1);
      at(r, u, Math.random() < 0.4 ? rand(0.3, 0.6) * sec : rand(0.35 * sec, sec - 1.5), label);
    }
  }

  // Ghép chữ (16/11: gõ cả từ): ~55% gõ đúng; số còn lại gõ sai thứ tự chữ (✗), một nửa trong đó gõ lại đúng sau
  function scramble(r, users) {
    const ok = r.word.w.toLowerCase();
    for (const u of users) {
      if (Math.random() < 0.25) continue;
      const t = rand(0.3 * r.sec, r.sec - 2);
      if (Math.random() < 0.55) { at(r, u, t, ok); continue; }
      let bad = shuffle([...ok]).join('');
      if (bad === ok) bad = [...ok].reverse().join('');
      at(r, u, t, bad);
      if (Math.random() < 0.5) at(r, u, Math.min(r.sec - 1, t + rand(1.5, 4)), ok);
    }
  }

  // Start or End (45 giây): gõ 5 từ trong một bình luận. Hay lẫn 1 từ gõ sai lần đầu (màn báo "4/5 từ đúng") rồi gõ lại.
  function startend(r, users) {
    const ex = r.pat.examples, sec = r.sec;
    if (ex.length < 5) return;
    for (const u of users) {
      if (Math.random() < 0.45) continue;
      const words = shuffle(ex).slice(0, 5), sep = Math.random() < 0.5 ? ' ' : ', ';
      let t = rand(0.35 * sec, 0.8 * sec);
      if (Math.random() < 0.4) {
        const bad = [...words], i = Math.floor(Math.random() * 5);
        bad[i] = typo(bad[i]);
        at(r, u, t, bad.join(sep));
        t += rand(6, 12);
        if (Math.random() < 0.4) continue; // không phải ai cũng gõ lại
      }
      if (t < sec - 1.5) at(r, u, t, words.join(sep));
    }
  }

  // Săn từ (luật 26/11/2026: lượt 30 giây, ai gõ một từ trước thì ăn điểm từ đó): như Hái từ, bot chỉ gõ chậm vài từ NGẮN của kho Migii để
  // bảng không đứng im lúc vắng người; có người thật thì ít bot hơn, gõ muộn hơn và mỗi bot một từ. Không bao giờ gõ từ gợi ý
  // (r.hunt.easy = từ Migii trên bảng, server đã bỏ từ gợi ý ra). Từ đã có người tìm thì bình luận của bot thành tán gẫu.
  function hunt(r, users, real) {
    const sec = r.sec, words = shuffle(r.hunt.easy.filter((w) => w.length <= 5));
    let k = 0;
    for (const u of users.slice(0, real ? 2 : 4)) {
      if (Math.random() < (real ? 0.4 : 0.15)) continue;
      let t = rand(real ? 0.4 : 0.15, real ? 0.75 : 0.45) * sec;
      for (let i = 0, n = real ? 1 : 1 + Math.floor(Math.random() * 2); i < n && k < words.length && t < sec - 1.5; i++) {
        at(r, u, t, Math.random() < 0.1 ? typo(words[k]) : words[k]);
        k++;
        t += rand(5, 10);
      }
    }
  }

  // Săn lỗi (30 giây): gõ "từ sai - từ đúng". Có bot nghi nhầm một từ khác trước, gõ lại được.
  function errhunt(r, users) {
    const q = r.err, sec = r.sec;
    const toks = q.s.split(/\s+/).map((t) => t.replace(/[^A-Za-z']/g, '').toLowerCase()).filter((t) => t.length > 2 && t !== q.wrong.toLowerCase());
    for (const u of users) {
      if (Math.random() < 0.4) continue;
      const sep = pick([' - ', ' - ', '-', ' -> ']);
      let t = rand(0.35 * sec, 0.8 * sec);
      if (toks.length && Math.random() < 0.35) {
        const w = pick(toks);
        at(r, u, t, `${w}${sep}${misfix(w)}`);
        t += rand(4, 8);
      }
      if (t < sec - 1.5 && Math.random() < 0.7) at(r, u, t, `${q.wrong.toLowerCase()}${sep}${q.right.toLowerCase()}`);
    }
  }

  // Nghe – chép (40 giây): gõ cả câu. Hay sai 1 từ lần đầu (màn báo "k/n từ đúng") rồi gõ lại.
  function dictate(r, users) {
    const s = r.dict.q.s, sec = r.sec, plain = s.replace(/[,.?!;:]/g, ''), words = plain.split(/\s+/);
    const slip = () => { const w = [...words], k = Math.floor(Math.random() * w.length); w[k] = typo(w[k]); return w.join(' ').toLowerCase(); };
    for (const u of users) {
      if (Math.random() < 0.5) continue;
      let t = rand(0.45 * sec, 0.8 * sec);
      if (Math.random() < 0.5) {
        at(r, u, t, slip());
        t += rand(6, 10);
      }
      if (t < sec - 1.5 && Math.random() < 0.75) at(r, u, t, Math.random() < 0.5 ? s : plain.toLowerCase());
    }
  }

  // Nghe & gõ chính tả: phần lớn đợi gợi ý; thỉnh thoảng gõ sai chính tả trước rồi sửa.
  // Dùng chung cho Thêm bớt 1 chữ ('oneletter'): r.grace = giây đồng hồ đứng của câu về đích đầu tiên (màn chuyển) → bot chờ hết rồi mới gõ;
  // gõ trật thì hay gõ lại nguyên chữ trên màn (r.one.q.s) như người thật.
  function typeWord(r, users, bank) {
    const sec = r.sec, { w } = r.word, g = r.grace || 0, shown = r.one?.q.s;
    const miss = () => (shown && Math.random() < 0.5 ? shown : typo(w));
    for (const u of users) {
      if (Math.random() < 0.25) continue;
      if (Math.random() < 0.5) {
        if (Math.random() < 0.2) at(r, u, g + rand(0.2, 0.45) * sec, miss());
        at(r, u, g + rand(0.4 * sec, sec - 1.5), w);
      } else at(r, u, g + rand(0.2 * sec, sec - 1.5), Math.random() < 0.6 ? pick(bank()).w : miss());
    }
  }

  // Đoán quốc kỳ (26/11/2026): bot KHÔNG gõ đúng trước mốc 10 giây (FLAG_OPTS_SEC của server.js), để lúc chưa có người thật đoán đúng thì
  // 4 gợi ý vẫn hiện như luật người dùng đặt. Trước mốc chỉ có vài bot đoán trật sang nước khác (hiện ✗); sau mốc ~55% gõ đúng, số còn lại
  // gõ nhầm một trong 3 tên nhiễu. Có người thật đang chơi thì ít bot gõ đúng hơn và gõ muộn hơn.
  const FLAG_OPTS = 10;
  function flag(r, users, real) {
    const sec = r.sec, F = r.flag, ok = F.q.en.toLowerCase(), wrong = F.options.filter((_, i) => i !== F.answerIdx).map((w) => w.toLowerCase());
    for (const u of users) {
      if (Math.random() < 0.25) continue;
      if (Math.random() < 0.3) at(r, u, rand(3, FLAG_OPTS - 1), pick(wrong));
      if (Math.random() < (real ? 0.4 : 0.55)) at(r, u, rand(FLAG_OPTS + (real ? 3 : 1.2), sec - 1.5), ok);
      else if (Math.random() < 0.4) at(r, u, rand(FLAG_OPTS + 1, sec - 1.5), pick(wrong));
    }
  }

  // Bricky (người dùng chốt 19/11/2026): bot chỉ gõ chậm vài từ NGẮN trên bảng để bảng không đứng im lúc vắng người; không bao giờ gõ
  // từ dài nhất (từ dùng hết bộ chữ) nên không thể điền đủ bảng và không bao giờ nhận +10. Có người thật thì ít bot gõ hơn và gõ muộn hơn.
  // Hái từ: bot hái chậm vài ô để lưới không đứng im lúc vắng người; có người thật thì ít bot hơn, hái muộn hơn và mỗi bot chỉ 1 quả.
  // Quả đã có người hái trước thì bình luận của bot thành tán gẫu (server không cộng). Thưởng "hái nhiều nhất" server chỉ tính người thật.
  function haitu(r, users, real) {
    const sec = r.sec, tiles = shuffle(r.fr.tiles.map((t) => t.w));
    let k = 0;
    for (const u of users.slice(0, real ? 2 : 4)) {
      if (Math.random() < (real ? 0.4 : 0.15)) continue;
      let t = rand(real ? 0.35 : 0.1, real ? 0.7 : 0.4) * sec;
      for (let i = 0, n = real ? 1 : 1 + Math.floor(Math.random() * 3); i < n && k < tiles.length && t < sec - 1.5; i++) {
        at(r, u, t, Math.random() < 0.12 ? typo(tiles[k]) : tiles[k]);
        k++;
        t += rand(6, 14);
      }
    }
  }

  function bricky(r, users, real) {
    const sec = r.sec, B = r.bk, max = B.tiles.length, g = r.grace || 0; // bảng cuối: chờ hết khoảng đồng hồ đứng (màn chuyển) rồi mới gõ
    const short = B.board.map((x) => x.w).filter((w) => w.length < max);
    if (!short.length) return;
    for (const u of users.slice(0, real ? 2 : 4)) {
      if (Math.random() < (real ? 0.5 : 0.2)) continue;
      const mine = shuffle(short).slice(0, Math.min(short.length, Math.random() < 0.4 ? 2 : 1));
      let t = g + rand(real ? 0.45 : 0.15, real ? 0.7 : 0.5) * sec;
      for (const w of mine) {
        if (t > g + sec - 1.5) break;
        at(r, u, t, w);
        t += rand(5, 11);
      }
      if (Math.random() < 0.25) at(r, u, g + rand(0.3, 0.9) * sec, typo(pick(short))); // gõ trật như người thật (từ trật thường không hợp lệ)
    }
  }

  return {
    names: () => [...NAMES],
    cancel: clear,

    // ctx = { active: số bot câu này, real: số người thật đang chơi, bank(): kho từ }
    onQuestion(r, { active, bank, real = 0 }) {
      clear();
      if (active <= 0) return;
      const users = crowd(active);
      if (r.mode === 'mcq') return mcq(r, users);
      if (r.mode === 'scramble') return scramble(r, users);
      if (r.mode === 'startend') return startend(r, users);
      if (r.mode === 'hunt') return hunt(r, users, real);
      if (r.mode === 'errhunt') return errhunt(r, users);
      if (r.mode === 'dictate') return dictate(r, users);
      if (r.mode === 'bricky') return bricky(r, users, real);
      if (r.mode === 'haitu') return haitu(r, users, real);
      if (r.mode === 'flag') return flag(r, users, real);
      return typeWord(r, users, bank); // 'type', 'emoji', 'irrfill', 'oneletter' (Đoán emoji, Chia động từ, Thêm bớt 1 chữ: r.word.w là đáp án; Tìm bất quy tắc là 'mcq') và chế độ gõ từ cũ
    },

    // Giải ô chữ. C = game.cross. Chữ thường = giải hàng (người đầu tiên điền hàng, người sau còn 10 giây);
    // CHỮ HOA = đoán từ khoá (+50, kết thúc ô chữ). Bot chỉ đoán ĐÚNG từ khoá khi chưa có người thật, để không cướp khoảnh khắc lớn nhất.
    onCross(r, C, { active, real, bank }) {
      clear();
      if (active <= 0) return;
      const users = crowd(Math.min(active, 4)), sec = r.sec, key = C.p.key;
      const decoys = bank().map((x) => x.w.toLowerCase()).filter((w) => /^[a-z]{4,10}$/.test(w));
      const keyDecoys = decoys.filter((w) => w.length === key.length && w !== key);
      const bigOpen = () => C.solved * 2 > C.p.rows.length;
      const guessKey = (u, s, right) => later(r, s + (r.finGrace || 0), () => bigOpen() && onChat(u, (right ? key : pick(keyDecoys.length ? keyDecoys : decoys)).toUpperCase()));
      if (r.stage === 'clue') {
        const ans = C.p.rows[r.idx].w;
        // chưa có người thật: thường có 1 bot giải giữa giờ để ô chữ chạy tiếp; có người thật: ít khi giải và giải muộn
        const solveAt = Math.random() < (real ? 0.3 : 0.75) ? rand(real ? 0.65 : 0.35, real ? 0.9 : 0.7) * sec : null;
        users.forEach((u, i) => {
          if (Math.random() < 0.3) at(r, u, rand(3, 0.6 * sec), pick(decoys));
          if (solveAt != null && (i === 0 || Math.random() < 0.35)) at(r, u, i === 0 ? solveAt : solveAt + rand(2, 8), ans);
          if (Math.random() < 0.2) guessKey(u, rand(0.4, 0.9) * sec, !real && C.solved >= 0.75 * C.p.rows.length && Math.random() < 0.3);
        });
        return;
      }
      // vòng từ khoá cuối
      const winner = !real && Math.random() < 0.6 ? Math.floor(Math.random() * users.length) : -1;
      users.forEach((u, i) => {
        if (i === winner) guessKey(u, rand(0.5, 0.8) * sec, true);
        else if (Math.random() < 0.5) guessKey(u, rand(0.2, 0.7) * sec, false);
      });
    },

    // Thế chữ. h = chainHelpers() của server.js.
    // Sảnh chờ: bot chỉ vào cho đủ mỗi đội 2 người; người thật vào trước thì bot khỏi vào.
    // Lượt chơi: đội có người thật thì bot nhường, chỉ đỡ khi sắp hết giờ; đội toàn bot thì đi nhanh nhưng chuỗi càng dài càng dễ bí
    // (để phiên tự kết thúc). Thỉnh thoảng gõ một từ không hợp lệ trước cho giống người.
    // Thế chữ (luật 13/11: không đội, ai thế được từ thì giữ từ, hết giờ không ai thế thì người giữ từ thắng).
    // Bot chờ hết khoảng đồng hồ đứng (r.grace) rồi mới gõ, và không tự thế từ mình đang giữ. Có người thật đang chơi (real > 0) thì bot
    // gõ muộn và nhường dần: chuỗi càng dài bot càng ít thế, để ván thường kết thúc bằng người thật giữ từ.
    onChain(r, h, { active, real = 0 }) {
      clear();
      if (active <= 0 || r.stage !== 'turn') return;
      const sec = r.sec, g = r.grace || 0, len = r.chain.length;
      const cand = h.neighbors(r.cur).filter((w) => !r.used.has(w)), common = cand.filter((w) => h.common.has(w));
      const u = crowd(1, new Set(r.holder ? [r.holder.uid] : []))[0];
      if (!u) return;
      const miss = () => {
        for (let i = 0; i < 12; i++) {
          const p = Math.floor(Math.random() * r.cur.length), x = r.cur.slice(0, p) + pick([...LETTERS]) + r.cur.slice(p + 1);
          if (x !== r.cur && !h.isWord(x)) return x;
        }
        return null;
      };
      const realHolder = r.holder && !r.holder.bot;
      // người thật đang giữ: bot thế ít dần · bot đang giữ mà có người thật: để người thật giành · phòng chưa có ai: bot tự nối chuỗi
      const base = realHolder ? Math.max(0.15, 0.7 - 0.1 * len) : real > 0 && r.holder ? 0.3 : Math.max(0.35, 0.95 - 0.07 * len);
      const okP = base * (common.length ? 1 : 0.5);
      if (!cand.length || Math.random() > okP) {
        const x = miss();
        if (x && Math.random() < 0.5) at(r, u, g + rand(2, sec - 1), x);
        return;
      }
      const t = g + (real > 0 ? rand(0.55, 0.9) * sec : rand(2, 6));
      if (Math.random() < 0.2) { const x = miss(); if (x) at(r, crowd(1, new Set([u.uid, r.holder?.uid]))[0] || u, t * 0.6, x); }
      at(r, u, t, pick(common.length ? common : cand));
    },
  };
};
