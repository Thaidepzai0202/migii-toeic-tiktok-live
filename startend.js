// Khung 🎯 Start or End: tìm 5 từ tiếng Anh bắt đầu (hoặc kết thúc) bằng một chữ/cụm chữ cho trước.
//
//   "ca ____"  → can, cap, car, card, care…        "____ tion" → action, station, nation…
//
// Người xem gõ cả 5 từ trong MỘT bình luận, cách nhau bằng dấu cách hoặc dấu phẩy. Đúng khi cả 5 từ:
//   - khác nhau, bắt đầu/kết thúc đúng bằng cụm chữ cho trước và dài hơn cụm đó,
//   - là từ tiếng Anh thật (từ điển Hunspell, xem dict.js), không phải tên người/địa danh.
// Số chữ trong từ không bị giới hạn. Gõ sai thì gõ lại được; chỉ lần đúng đầu tiên được tính điểm.
//
//   node startend.js     in các cụm chữ dùng được và thử vài câu trả lời
const dict = require('./dict');

const PER_ANSWER = 5;
const MIN_COMMON = 6; // cụm chữ chỉ được dùng khi có ít nhất ngần này từ thông dụng khớp (để có ví dụ công bố và cho khán giả ảo)
// 17/11/2026: người dùng nâng lên 100 cụm (trước 62, lặp sau khoảng 2 giờ live). Cụm thêm đều có ≥ 10 từ khớp trong kho kênh dưới 450,
// thêm nhiều cụm kết thúc hơn để hai loại gần ngang nhau (52 bắt đầu · 48 kết thúc). In danh sách: node startend.js
const PREFIX = ['b', 'c', 'd', 'f', 'g', 'h', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w', 'ca', 'co', 'de', 'ex', 'in', 'ma', 'mo', 'pa', 'pl', 'pr', 're', 'st', 'su', 'tr', 'un', 'ch', 'sh', 'th', 'pre', 'pro', 'con', 'dis', 'com', 'int',
  'a', 'e', 'i', 'o', 'u', 'v', 'ba', 'be', 'di', 'fa', 'fi', 'me', 'po', 'se'];
const SUFFIX = ['ing', 'ed', 'er', 'ly', 'tion', 'ment', 'ness', 'able', 'ful', 'less', 'al', 'ity', 'ous', 'ive', 'ship', 'y', 'e', 't', 'n', 'r', 'd', 'l', 'k', 'st', 'nt', 'ck', 'ty',
  'h', 'm', 'p', 'w', 'ow', 'ay', 'ar', 'or', 'on', 'le', 'se', 're', 'te', 'ce', 'ge', 've', 'ry', 'ate', 'ure', 'age', 'ent', 'nd', 'll', 'ch'];

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

// common: các từ thông dụng (kho từ của game) dùng để chọn cụm chữ và làm ví dụ khi công bố
exports.create = (common) => {
  const words = [...new Set(common.map((w) => String(w).toLowerCase()).filter((w) => /^[a-z]+$/.test(w)))];
  const patterns = [];
  for (const [k, list] of [['start', PREFIX], ['end', SUFFIX]]) {
    for (const s of list) {
      const matches = words.filter((w) => w.length > s.length && (k === 'start' ? w.startsWith(s) : w.endsWith(s)) && dict.isWord(w));
      if (matches.length >= MIN_COMMON) patterns.push({ k, s, matches });
    }
  }
  const recent = [], done = new Set();
  let lastKind = null;

  return {
    patterns,
    // chọn cụm chữ cho câu mới: ra hết mọi cụm rồi mới lặp (17/11/2026; trước đó chọn ngẫu nhiên nên lặp sau ~20 câu),
    // sang vòng mới thì tránh 10 cụm vừa ra; luân phiên bắt đầu/kết thúc
    pick() {
      if (done.size >= patterns.length) done.clear();
      const left = patterns.filter((p) => !done.has(p.k + p.s));
      const fresh = left.filter((p) => !recent.includes(p.k + p.s));
      const pool = fresh.length ? fresh : left;
      const alt = pool.filter((p) => p.k !== lastKind);
      const p = (alt.length ? alt : pool)[Math.floor(Math.random() * (alt.length ? alt.length : pool.length))];
      done.add(p.k + p.s);
      recent.push(p.k + p.s);
      if (recent.length > 10) recent.shift();
      lastKind = p.k;
      return { k: p.k, s: p.s, examples: shuffle(p.matches).slice(0, 12) };
    },
    // text: bình luận của người xem. Trả về { attempt, ok, good, words }
    //   attempt: có đúng 5 mục (mới tính là một lần trả lời; bình luận khác bỏ qua như tán gẫu)
    //   good: số từ hợp lệ và khác nhau; ok: đủ 5 từ hợp lệ
    check(text, pat) {
      const tokens = String(text).toLowerCase().split(/[\s,;]+/).map((t) => t.replace(/^[^a-z]+|[^a-z]+$/g, '')).filter(Boolean);
      if (tokens.length !== PER_ANSWER) return { attempt: false, ok: false, good: 0, words: tokens };
      const seen = new Set();
      for (const t of tokens) {
        const fits = t.length > pat.s.length && (pat.k === 'start' ? t.startsWith(pat.s) : t.endsWith(pat.s));
        if (fits && !seen.has(t) && dict.isWord(t)) seen.add(t);
      }
      return { attempt: true, ok: seen.size === PER_ANSWER, good: seen.size, words: tokens };
    },
  };
};

if (require.main === module) {
  const common = [...require('./data/bank.json').map((x) => x.w), ...require('./data/word-300.json').words.map((x) => x.w)];
  const g = exports.create(common);
  console.log(`${g.patterns.length} cụm chữ dùng được:`);
  for (const k of ['start', 'end']) console.log(`  ${k}: ` + g.patterns.filter((p) => p.k === k).map((p) => `${p.s}(${p.matches.length})`).join(' '));
  const t = { k: 'start', s: 'ca' };
  const show = (txt, pat = t) => console.log(JSON.stringify(txt).padEnd(46), JSON.stringify(g.check(txt, pat)));
  show('can cap car card care');
  show('can, cap, car, card, care');
  show('Can Cap CAR card, care!');
  show('can cap car card cart'.replace('cart', 'cat'));
  show('can cap car card');
  show('can can cap car card');
  show('can cap car card carxyz');
  show('can cap car card calcium');
  show('can cap car card canada');
  show('hello world', t);
  show('stations actions nations options motions', { k: 'end', s: 'tion' });
  show('station action nation option motion', { k: 'end', s: 'tion' });
  show('tion', { k: 'end', s: 'tion' });
}
