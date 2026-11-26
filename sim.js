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
  // finG = số giây đồng hồ đứng của câu về đích dùng chung (round.finGrace, server.js markFinish): mọi lịch gõ của câu đó dời theo
let finG = 0;
const later = (sec, fn) => timers.push(setTimeout(fn, (sec + finG) * 1000));

  setInterval(() => Math.random() < 0.3 && onJoin({ name: pick(NAMES) }), 4000);

  return {
    cancel() {
      timers.splice(0).forEach(clearTimeout);
    },
    // Thế chữ: sảnh chờ thì khán giả ảo lần lượt gõ join; tới lượt đội nào thì vài người của đội đó gõ từ (đa số hợp lệ, thỉnh thoảng sai hoặc không ai kịp)
    // Thế chữ (không đội): vài người thử thế từ, không ai tự thế từ mình đang giữ; chuỗi càng dài càng dễ "bí" → người giữ từ thắng ván
    onChain(round, h) {
      timers.splice(0).forEach(clearTimeout);
      if (round.stage !== 'turn' || Math.random() < 0.1 + 0.04 * round.chain.length) return;
      const cand = h.neighbors(round.cur).filter((w) => !round.used.has(w));
      if (!cand.length) return;
      const who = crowd.filter((u) => u.uid !== round.holder?.uid).sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
      for (const p of who) later((round.grace || 0) + rand(1, round.sec - 1), () => onChat(p, Math.random() < 0.15 ? pick(['xxxx', 'haha', 'word']) : pick(cand)));
    },
    // Giải ô chữ: người giỏi gõ đúng hàng (chữ thường) sớm; thỉnh thoảng có người gõ sai. Khi đã mở từ khoá, vài người đoán CHỮ HOA (đa số sai trước khi có người đúng)
    onCross(round, C) {
      finG = round.finGrace || 0;
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
      finG = round.finGrace || 0;
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
        // Săn từ: mỗi người gõ vài từ đang có trên bảng (từ đã có người tìm thì thành tán gẫu), đôi khi gõ hai từ một bình luận hoặc gõ từ lạ.
        // Khoảng 1/6 số lượt cả đám đến muộn (sau 12 giây) để thấy từ gợi ý nhấp nháy; 1/12 số lượt không ai gõ đúng để thấy cảnh nổ cả bảng.
        const words = [...round.hunt.map.keys()], mood = Math.random(), from = mood < 0.17 ? 13 : 3;
        for (const u of crowd) {
          if (Math.random() < 0.3) continue;
          let t = rand(from, from + 12);
          for (let i = 0; i < 1 + Math.floor(Math.random() * 3) && t < round.sec - 1; i++) {
            const word = mood > 0.92 || Math.random() < 0.15 ? pick(['hello', 'qwerty', 'banana', 'hay quá']) : Math.random() < 0.15 ? `${pick(words)} ${pick(words)}` : pick(words);
            later(t, () => onChat(u, word));
            t += rand(3, 9);
          }
        }
        return;
      }
      if (round.mode === 'haitu') {
        // Hái từ: mỗi người gõ tên vài ô bất kỳ trên lưới (quả đã rụng thì thành tán gẫu); thỉnh thoảng gõ kèm chữ ô, gõ sai chính tả hoặc tán gẫu
        const tiles = round.fr.tiles;
        for (const u of crowd) {
          if (Math.random() < 0.25) continue;
          let t = rand(3, 20);
          for (let i = 0, n = 1 + Math.floor(Math.random() * (2 + 4 * u.skill)); i < n && t < round.sec - 1.5; i++) {
            const k = Math.floor(Math.random() * tiles.length), w = tiles[k].w;
            const text = Math.random() < 0.1 ? pick(['khó quá', 'quả gì đây', 'hello']) : Math.random() < 0.12 ? w.slice(0, -1) : Math.random() < 0.2 ? `${'ABCDEFGHIJKLMNOP'[k]} ${w}` : w;
            later(t, () => onChat(u, text));
            t += rand(3, 9) * (1.3 - u.skill);
          }
        }
        return;
      }
      if (round.mode === 'bricky') {
        // Bricky: người giỏi gõ lần lượt các từ trên bảng (có thể điền đủ bảng), người khác gõ lẫn từ trên bảng và từ thêm; thỉnh thoảng gõ từ lạ
        // hoặc gõ hai từ trong một bình luận.
        const B = round.bk, board = B.board.map((x) => x.w), all = [...B.valid];
        for (const u of crowd) {
          if (Math.random() < 0.2) continue;
          const pro = Math.random() < u.skill * 0.6;
          const list = pro ? [...board].sort(() => Math.random() - 0.5) : Array.from({ length: 2 + Math.floor(Math.random() * 5) }, () => pick(all));
          let t = (round.grace || 0) + rand(3, 12);
          for (let i = 0; i < list.length && t < (round.grace || 0) + round.sec - 1.5; i++) {
            const text = Math.random() < 0.12 ? pick(['hello', 'xin chào', 'khó quá', 'tea time']) : Math.random() < 0.15 && list[i + 1] ? `${list[i]} ${list[++i]}` : list[i];
            later(t, () => onChat(u, text));
            t += rand(2.5, 7) * (1.2 - u.skill);
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
        const ok = round.word.w.toLowerCase(); // 16/11: gõ cả từ, không gõ thứ tự số
        for (const u of crowd) {
          if (Math.random() < 0.2) continue;
          const right = Math.random() < u.skill + 0.25;
          later(rand(3, roundSec - 1), () => onChat(u, right ? ok : [...ok].sort(() => Math.random() - 0.5).join('')));
        }
        return;
      }
      const g = round.grace || 0; // câu về đích đầu tiên (Thêm bớt 1 chữ): đồng hồ đứng g giây cho màn chuyển
      for (const u of crowd) {
        // Người giỏi trả lời sớm; người khác chờ gợi ý (35% / 70% thời gian).
        if (Math.random() < u.skill) {
          const at = Math.random() < 0.5 ? rand(3, roundSec * 0.4) : rand(roundSec * 0.35, roundSec * 0.95);
          later(g + at, () => onChat(u, w));
        } else if (Math.random() < 0.5) {
          // Thêm bớt 1 chữ: người chưa giỏi hay gõ lại nguyên chữ trên màn (hiện ✗ chưa đúng)
          later(g + rand(2, roundSec * 0.9), () => onChat(u, round.one && Math.random() < 0.5 ? round.one.q.s : pick(bank()).w));
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
