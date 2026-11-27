// Dùng chung cho server (sinh giọng sẵn) và trang (phát lời giảng): tách một câu lời giảng thành các đoạn đọc.
// Chữ trong [ngoặc vuông] là tiếng Anh, đọc bằng giọng tiếng Anh; phần còn lại đọc bằng giọng tiếng Việt.
//   "Ví dụ nhé: [If it rains, we will stay home.] Nếu trời mưa…"
//   → [{l:'vi', hien:'Ví dụ nhé: ', doc:'Ví dụ nhé:'}, {l:'en', …}, {l:'vi', …}]
// l = 'nghi' khi đoạn chỉ có dấu câu (ví dụ dấu phẩy giữa hai từ tiếng Anh): không đọc, chỉ nghỉ ngắn.
(function (g) {
  function tachLoi(noi) {
    const out = [];
    const them = (l, hien) => {
      if (!hien) return;
      const doc = l === 'en' ? hien.trim() : hien.replace(/^[\s,.:;!?…–-]+/, '').trim();
      if (!/[\p{L}\p{N}]/u.test(doc)) return out.push({ l: 'nghi', hien, doc: '' });
      out.push({ l, hien, doc });
    };
    const re = /\[([^\]]+)\]/g;
    let cuoi = 0;
    let m;
    while ((m = re.exec(noi || ''))) {
      them('vi', noi.slice(cuoi, m.index));
      them('en', m[1]);
      cuoi = re.lastIndex;
    }
    them('vi', (noi || '').slice(cuoi));
    return out;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { tachLoi };
  else g.tachLoi = tachLoi;
})(this);
