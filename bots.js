// Người chơi ảo (theo video-live/bots.js): trả lời giống người thật — lúc đúng lúc sai, có độ trễ, đôi khi gõ sai —
// để màn hình không trống khi ít người xem. Tên không gắn nhãn trên màn live (user chốt 04/11) NHƯNG vẫn: không lên
// bục vinh danh / bảng vàng / "nhanh nhất", không được khen "đúng đầu tiên", không cướp thứ hạng điểm của người thật.
// Màn điều khiển đánh dấu 🤖 để người dẫn phân biệt. Càng nhiều người thật thì càng ít bot (server.js).
const NAMES = [
  'Minh Anh', 'Thu Trang', 'Hoàng Long', 'Ngọc Hân', 'Bảo Ngọc', 'Tuấn Kiệt', 'Linh Chi', 'Quang Huy',
  'Phương Thảo', 'Khánh Vy', 'Đức Anh', 'Mai Phương', 'Hải Yến', 'Thanh Tùng', 'Gia Bảo', 'Ngân Hà',
];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Gõ sai kiểu người thật: thiếu 1 âm tiết hoặc đảo 2 âm tiết
function typo(w) {
  const c = [...w];
  if (c.length < 2) return w + w;
  const i = Math.floor(Math.random() * (c.length - 1));
  if (Math.random() < 0.5) c.splice(i, 1);
  else [c[i], c[i + 1]] = [c[i + 1], c[i]];
  return c.join('');
}

exports.create = ({ onChat }) => {
  const timers = [];
  return {
    names: () => [...NAMES],
    cancel() {
      timers.splice(0).forEach(clearTimeout);
    },
    // active: số bot tham gia câu này; bank(): kho từ để đoán sai
    onQuestion(round, { active, bank }) {
      timers.splice(0).forEach(clearTimeout);
      if (active <= 0) return;
      const sec = round.sec;
      const { w, r } = round.word;
      const mcq = round.mode === 'mcq';
      const names = [...NAMES].sort(() => Math.random() - 0.5).slice(0, active);
      for (const n of names) {
        if (Math.random() < 0.25) continue; // không phải bot nào cũng trả lời mọi câu
        const user = { uid: `bot:${n}`, name: n, avatar: '', bot: true };
        const at = (s, text) => timers.push(setTimeout(() => onChat(user, text), s * 1000));
        if (mcq) {
          // Trắc nghiệm: ~60% chọn đúng, có người chọn nhanh (3–6s), có người chờ gần hết giờ
          const right = Math.random() < 0.6;
          const k = right ? round.answerIdx : pick([0, 1, 2, 3].filter((i) => i !== round.answerIdx));
          at(Math.random() < 0.4 ? rand(3, 6) : rand(0.35 * sec, sec - 1.5), String(k + 1));
          continue;
        }
        if (round.mode === 'scramble') {
          // Ghép chữ: gõ thứ tự số như người thật (đúng ~55%)
          const ok = round.order.map((i) => i + 1).join('');
          at(rand(0.3 * sec, sec - 1.5), Math.random() < 0.55 ? ok : [...ok].sort(() => Math.random() - 0.5).join(''));
          continue;
        }
        if (Math.random() < 0.5) {
          // Đúng: phần lớn đợi gợi ý (sau 35% thời gian); thỉnh thoảng gõ sai trước rồi sửa; ít khi gõ romaja
          if (Math.random() < 0.2) at(rand(0.2, 0.45) * sec, typo(w));
          at(rand(0.4 * sec, sec - 1.5), r && Math.random() < 0.15 ? r : w);
        } else {
          at(rand(0.2 * sec, sec - 1.5), Math.random() < 0.6 ? pick(bank()).w : typo(w));
        }
      }
    },
  };
};
