// Khán giả ảo để chạy thử game khi chưa lên live thật (node server.js --sim).
const NAMES = [
  'Thu Trang', 'minh.tuan99', 'Hà Linh 🌸', 'Ngọc Ánh', 'duyhoang.kr', 'Bảo Ngân', 'Kim Chi', 'phuongthao_',
  'Lan Anh', 'Quang Huy', 'Mai Phương', 'tranvy.2k3', 'Hoàng Nam', 'Yến Nhi', 'Đức Anh', 'Thảo My',
  'kpop.lover', 'Tuấn Kiệt', 'Hồng Nhung', 'Gia Bảo', 'Thanh Tâm', 'Khánh Linh', 'trung.eps', 'Như Quỳnh',
];
const CHATTER = ['hay quá', 'khó vậy', 'câu này dễ mà', 'ai biết không', '???', 'từ này học rồi mà quên', 'hihi', '😂😂', 'cho gợi ý đi'];
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
    onQuestion(round) {
      timers.splice(0).forEach(clearTimeout);
      const { w, r } = round.word;
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
          const text = Math.random() < 0.8 || !r ? w : r;
          later(at, () => onChat(u, text));
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
