// Khung 🚩 Đoán quốc kỳ (người dùng đặt 26/11/2026, kênh dưới 450): màn hiện quốc kỳ một nước, người xem gõ TÊN NƯỚC BẰNG TIẾNG ANH
// vào bình luận (gõ tiếng Việt không tính). 20 giây mỗi cờ; sau 10 giây mà chưa ai đúng thì hiện 4 tên nước, trong đó có 1 tên đúng,
// để người xem chọn và gõ lại cho dễ. Kho soạn tay ở data/quoc-ky.json (kiểm bằng node check_quoc_ky.js), ảnh ở public/img/co/<mã>.svg
// (bộ flag-icons, giấy phép MIT). Nước chưa có ảnh thì bỏ qua.
const fs = require('fs');
const path = require('path');

// Giống norm() của server.js: không phân biệt hoa thường, bỏ dấu cách và dấu câu
const norm = (s) => String(s || '').toLowerCase().normalize('NFC').replace(/[\s\-'’.,!?~"]/g, '');
// Bỏ cả dấu tiếng Việt / dấu phụ (Türkiye → turkiye, Hàn Quốc → hanquoc)
const bare = (s) => norm(String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd'));
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

// Mọi cách gõ tiếng Anh được tính của một nước (đã chuẩn hoá)
const enKeys = (x) => [...new Set([x.en, ...(x.alt || [])].flatMap((s) => [norm(s), bare(s)]))];
// Mọi cách gọi tiếng Việt (không dấu): "Mỹ (Hoa Kỳ)" → my, hoaky; kèm bản có chữ "nước" đứng đầu
const viKeys = (x) => [...new Set([...String(x.vi).split(/[()]/), ...(x.vx || [])].map(bare).filter(Boolean).flatMap((s) => [s, `nuoc${s}`]))];

// EASY_RATE = tỉ lệ câu thường lấy nước quen thuộc (lv 1); câu về đích luôn lấy nước khó hơn (lv 2)
const EASY_RATE = 0.7;

exports.create = (data, imgDir) => {
  const all = (data.countries || []).filter((x) => fs.existsSync(path.join(imgDir, `${x.c}.svg`)));
  const byCode = new Map(all.map((x) => [x.c, x]));
  const byName = new Map();
  for (const x of all) {
    x.ok = new Set(enKeys(x));
    x.viOk = new Set(viKeys(x).filter((k) => !x.ok.has(k)));
    for (const k of x.ok) byName.set(k, x);
  }
  const pool = { 1: all.filter((x) => x.lv !== 2), 2: all.filter((x) => x.lv === 2) }, bag = { 1: [], 2: [] };
  const draw = (lv) => {
    if (!pool[lv].length) lv = lv === 1 ? 2 : 1;
    if (!bag[lv].length) bag[lv] = shuffle(pool[lv]);
    return bag[lv].pop();
  };
  // Bỏ "the" đứng đầu (the Philippines, the UK); không nước nào trong kho có tên bắt đầu bằng "the"
  const forms = (msg) => {
    const n = norm(msg), b = bare(msg);
    return [...new Set([n, b, ...(n.startsWith('the') ? [n.slice(3)] : []), ...(b.startsWith('the') ? [b.slice(3)] : [])])].filter(Boolean);
  };

  return {
    all,
    easy: pool[1].length,
    hard: pool[2].length,

    // final = câu về đích
    pick: (final) => draw(final || Math.random() >= EASY_RATE ? 2 : 1),

    // 4 tên nước (tiếng Anh) đã xáo, có đúng 1 tên đúng. Đáp án nhiễu: ưu tiên tối đa 2 nước có cờ dễ nhầm (sim), rồi cùng khu vực, rồi bất kỳ.
    options(x) {
      const out = shuffle((x.sim || []).map((c) => byCode.get(c)).filter(Boolean)).slice(0, 2);
      for (const src of [all.filter((y) => y.r === x.r), all]) {
        for (const y of shuffle(src)) {
          if (out.length >= 3) break;
          if (y !== x && !out.includes(y)) out.push(y);
        }
      }
      const options = shuffle([x, ...out.slice(0, 3)]);
      return { options: options.map((y) => y.en), answerIdx: options.indexOf(x) };
    },

    // Chấm một bình luận cho cờ của nước x:
    //   'ok'  = đúng tên tiếng Anh (hoặc một cách viết khác trong alt)
    //   'vi'  = đúng nước nhưng gõ tiếng Việt: không tính, màn nhắc gõ tiếng Anh
    //   { other } = gõ tên tiếng Anh của một nước KHÁC trong kho: một lần đoán sai (hiện ✗), được gõ lại
    //   null  = tán gẫu
    check(x, msg) {
      const fs2 = forms(msg);
      if (fs2.some((f) => x.ok.has(f))) return 'ok';
      const b = bare(msg);
      if (x.viOk.has(b)) return 'vi';
      const o = fs2.map((f) => byName.get(f)).find(Boolean);
      return o ? { other: o.en } : null;
    },
  };
};
exports.norm = norm;
exports.bare = bare;
exports.enKeys = enKeys;
exports.viKeys = viKeys;
