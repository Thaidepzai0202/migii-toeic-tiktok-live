// Khán giả ảo để chạy thử game khi chưa lên live thật (node server.js --sim).
const NAMES = [
  'Thu Trang', 'minh.tuan99', 'Hà Linh 🌸', 'Ngọc Ánh', 'duyhoang.dev', 'Bảo Ngân', 'Kim Chi', 'phuongthao_',
  'Lan Anh', 'Quang Huy', 'Mai Phương', 'tranvy.2k3', 'Hoàng Nam', 'Yến Nhi', 'Đức Anh', 'Thảo My',
  'toeic.750', 'Tuấn Kiệt', 'Hồng Nhung', 'Gia Bảo', 'Thanh Tâm', 'Khánh Linh', 'trung.ielts', 'Như Quỳnh',
];
const CHATTER = ['hay quá', 'khó vậy', 'câu này dễ mà', 'ai biết không', '???', 'từ này học rồi mà quên', 'hihi', '😂😂', 'cho gợi ý đi',
  'mình đang ôn TOEIC 650', 'part 5 khó quá ad ơi', 'app tên gì vậy?'];
// [tên, số xu, độ hay gặp]. Số xu lấy gần đúng theo bảng quà TikTok, chỉ để thử hiệu ứng.
// Chỉ giả lập 2 quà phổ biến nhất. Quà thật khác (tên lửa…) vẫn được cảm ơn theo mức xu ở trang game.
const GIFTS = [['Hoa hồng', 1, 70], ['Tim', 5, 30]];
exports.GIFTS = GIFTS;
const pickGift = () => {
  let r = Math.random() * GIFTS.reduce((s, g) => s + g[2], 0);
  for (const g of GIFTS) if ((r -= g[2]) <= 0) return g;
  return GIFTS[0];
};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

exports.start = ({ onChat, onGift, onJoin, bank }) => {
  const crowd = NAMES.map((name, i) => ({ uid: `sim:${i}`, name, avatar: '', skill: rand(0.15, 0.7) }));
  const timers = [];
  const later = (sec, fn) => timers.push(setTimeout(fn, sec * 1000));

  setInterval(() => Math.random() < 0.3 && onJoin({ name: pick(NAMES) }), 4000);

  return {
    cancel() {
      timers.splice(0).forEach(clearTimeout);
    },
    // Thế chữ: sảnh chờ thì khán giả ảo lần lượt gõ join; tới lượt đội nào thì vài người của đội đó gõ từ (đa số hợp lệ, thỉnh thoảng sai hoặc không ai kịp)
    onChain(round, h) {
      timers.splice(0).forEach(clearTimeout);
      if (round.stage === 'lobby') {
        crowd.filter((u) => !h.isMember(u.uid)).slice(0, 12).forEach((u, i) => later(0.4 + i * 0.5 + Math.random(), () => onChat(u, Math.random() < 0.5 ? 'join' : 'tham gia')));
        return;
      }
      if (round.stage !== 'turn' || Math.random() < 0.07) return;
      const cand = h.neighbors(round.cur).filter((w) => !round.used.has(w));
      const team = h.members(round.turn).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
      if (!cand.length) return;
      for (const p of team) later(rand(1, 6.5), () => onChat(p, Math.random() < 0.12 ? pick(['xxxx', 'hello', 'word']) : pick(cand)));
    },
    // Giải ô chữ: người giỏi gõ đúng hàng (chữ thường) sớm; thỉnh thoảng có người gõ sai. Khi đã mở từ khoá, vài người đoán CHỮ HOA (đa số sai trước khi có người đúng)
    onCross(round, C) {
      timers.splice(0).forEach(clearTimeout);
      const key = C.p.key;
      if (round.stage === 'clue') {
        const ans = C.p.rows[round.idx].w;
        for (const u of crowd) {
          if (Math.random() < 0.3) continue;
          if (Math.random() < u.skill + 0.1) later(rand(2, round.sec - 4), () => onChat(u, ans));
          else if (Math.random() < 0.4) later(rand(2, round.sec - 2), () => onChat(u, pick(['class', 'object', 'market', 'bank', 'house'])));
          // đoán từ khoá khi hàng ngang đã giải hơn một nửa: lần đoán là chữ hoa, đúng chỉ khi gần đủ chữ
          if (C.solved * 2 > C.p.rows.length && Math.random() < 0.2) {
            const known = C.p.rows.filter((r, i) => C.rows[i].state === 'solved').length / C.p.rows.length;
            later(rand(3, round.sec - 3), () => onChat(u, (Math.random() < known * u.skill * 0.9 ? key : pick(['CLASS', 'OBJECT', 'MARKET'])).toUpperCase()));
          }
        }
      } else {
        for (const u of crowd) if (Math.random() < 0.5) later(rand(2, round.sec - 3), () => onChat(u, (Math.random() < u.skill ? key : pick(['CLASS', 'OBJECT'])).toUpperCase()));
      }
    },
    onQuestion(round) {
      timers.splice(0).forEach(clearTimeout);
      if (round.mode === 'dictate') {
        // Nghe – chép: gõ cả câu cần 10–25 giây; người kém hơn gõ sai (thiếu chữ ở một từ) rồi gõ lại; thỉnh thoảng chỉ gõ nửa câu
        const s = round.dict.q.s, words = s.replace(/[,.?]/g, '').split(' ');
        const typo = () => { const w = [...words]; const k = Math.floor(Math.random() * w.length); w[k] = w[k].slice(0, -1) || 'x'; return w.join(' '); };
        for (const u of crowd) {
          if (Math.random() < 0.25) continue;
          let t = rand(9, 24);
          if (Math.random() < 0.15) later(rand(5, 12), () => onChat(u, words.slice(0, Math.ceil(words.length / 2) - 1).join(' ')));
          if (Math.random() > u.skill + 0.3) { later(t, () => onChat(u, typo())); t += rand(5, 11); }
          if (t < round.sec - 2) later(t, () => onChat(u, Math.random() < 0.5 ? s : words.join(' ').toLowerCase()));
        }
        return;
      }
      if (round.mode === 'errhunt') {
        // Săn lỗi: người giỏi gõ đúng "từ sai - từ đúng"; người khác nghi nhầm một từ khác trong câu hoặc gõ sai từ sửa (gõ lại được)
        const q = round.err, toks = q.s.split(/\s+/).map((t) => t.replace(/[^A-Za-z']/g, '')).filter((t) => t && t.toLowerCase() !== q.wrong.toLowerCase());
        for (const u of crowd) {
          if (Math.random() < 0.2) continue;
          const sep = pick([' - ', ' → ', '-', ' > ']);
          if (Math.random() > u.skill + 0.2) later(rand(3, round.sec * 0.6), () => onChat(u, `${pick(toks)}${sep}${pick(toks)}`));
          later(rand(5, round.sec - 2), () => onChat(u, `${q.wrong}${sep}${q.right}`));
        }
        return;
      }
      if (round.mode === 'hunt') {
        // Săn từ: mỗi người tìm lần lượt từng từ (ngẫu nhiên trong danh sách hợp lệ của bảng), người giỏi về đích sớm; thỉnh thoảng gõ từ lạ
        const words = [...round.hunt.map.keys()];
        for (const u of crowd) {
          if (Math.random() < 0.2) continue;
          const n = 5 + (Math.random() < u.skill ? 1 : 0), pace = rand(6, 26) * (1.15 - u.skill);
          let t = rand(5, 14);
          for (let i = 0; i < n + (Math.random() < 0.3 ? 1 : 0); i++) {
            const word = i === n ? pick(['hello', 'qwerty', 'banana']) : pick(words);
            later(t, () => onChat(u, word));
            t += pace * rand(0.6, 1.4);
            if (t > round.sec - 3) break;
          }
        }
        return;
      }
      const { w } = round.word;
      const roundSec = round.sec;
      if (round.mode === 'mcq') {
        for (const u of crowd) {
          if (Math.random() < 0.15) continue;
          const right = Math.random() < u.skill + 0.3;
          const k = right ? round.answerIdx : pick([0, 1, 2, 3].filter((i) => i !== round.answerIdx));
          later(rand(2, roundSec - 1), () => onChat(u, String(k + 1)));
          if (Math.random() < 0.1) later(rand(1, roundSec), () => onChat(u, pick(CHATTER)));
        }
        return;
      }
      if (round.mode === 'startend') {
        // Start or End: người giỏi gõ đủ 5 từ đúng (lấy từ ví dụ của cụm chữ), người khác lẫn 1 từ sai để thấy báo "x/5 từ đúng"
        for (const u of crowd) {
          if (Math.random() < 0.25) continue;
          const words = [...round.pat.examples].sort(() => Math.random() - 0.5).slice(0, 5);
          if (Math.random() > u.skill + 0.2) words[Math.floor(Math.random() * 5)] = pick(['hello', 'banana', 'xyz', 'qwerty']);
          later(rand(6, roundSec - 4), () => onChat(u, words.join(Math.random() < 0.5 ? ' ' : ', ')));
        }
        return;
      }
      if (round.mode === 'scramble') {
        const ok = round.order.map((i) => i + 1).join('');
        for (const u of crowd) {
          if (Math.random() < 0.2) continue;
          const right = Math.random() < u.skill + 0.25;
          later(rand(3, roundSec - 1), () => onChat(u, right ? ok : [...ok].sort(() => Math.random() - 0.5).join('')));
        }
        return;
      }
      for (const u of crowd) {
        // Người giỏi trả lời sớm; người khác chờ gợi ý (35% / 70% thời gian).
        if (Math.random() < u.skill) {
          const at = Math.random() < 0.5 ? rand(3, roundSec * 0.4) : rand(roundSec * 0.35, roundSec * 0.95);
          later(at, () => onChat(u, w));
        } else if (Math.random() < 0.5) {
          later(rand(2, roundSec * 0.9), () => onChat(u, pick(bank()).w));
        }
        if (Math.random() < 0.12) later(rand(1, roundSec), () => onChat(u, pick(CHATTER)));
      }
      if (Math.random() < 0.3) {
        const [g, d] = pickGift();
        // hoa hồng hay được tặng theo chuỗi
        const count = d === 1 && Math.random() < 0.4 ? 1 + Math.floor(Math.random() * 9) : 1;
        later(rand(2, roundSec - 2), () => onGift(pick(crowd), g, d, count));
      }
    },
  };
};
