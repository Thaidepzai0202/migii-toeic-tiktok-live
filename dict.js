// Kiểm tra một chuỗi có phải từ tiếng Anh thật không (cho khung Start or End).
//
// Dùng từ điển Hunspell en_US (gói dictionary-en, giấy phép MIT/BSD) qua nspell. Đã đo trên 5.901 từ TOEIC của app: phủ 99,7%,
// có đủ dạng chia từ (cars, walked, students) và từ hiện đại (email, online); từ điển có sẵn của macOS (/usr/share/dict/words)
// thì thiếu hết dạng chia từ nên không dùng được. Nạp mất ~90ms, 20.000 lần kiểm tra mất ~5ms.
// Hunspell phân biệt hoa thường nên tên riêng/địa danh viết thường (london, paris, vietnam…) tự bị từ chối.
const fs = require('fs');
const path = require('path');

// Vài tên/địa danh Hunspell vẫn nhận khi viết thường vì còn nghĩa khác (john, china = đồ sứ, japan = sơn mài…).
// Luật khung: không được dùng tên người, địa danh → chặn tay ở đây, thêm dần khi gặp trên live.
// (Tên trùng từ thường như bill, art, case, dawn vẫn nhận: đó là từ thật.)
const BLOCK = new Set(['john', 'google', 'china', 'japan', 'qwerty', 'barney', 'fritz', 'dieter', 'dirk']);

// Từ tục tĩu / xúc phạm: Hunspell vẫn coi là từ thật, nhưng từ người xem gõ (và chữ trong ma trận Săn từ) hiện công khai trên màn live
// của một thương hiệu giáo dục → không bao giờ được chấp nhận và không được xuất hiện trong ma trận. Thêm dần khi gặp.
// Cố ý KHÔNG đưa từ nhẹ như hell, damn (đề bài Thế chữ của người dùng có help → hell).
const OFFENSIVE = new Set(['fuck', 'fucks', 'fucked', 'fucker', 'shit', 'shits', 'shitty', 'cunt', 'cunts', 'dick', 'dicks', 'cock', 'cocks', 'piss', 'pissed',
  'slut', 'sluts', 'whore', 'whores', 'bitch', 'bitches', 'bastard', 'bastards', 'asshole', 'ass', 'arse', 'anal', 'anus', 'rape', 'raped', 'rapes', 'rapist',
  'nazi', 'nazis', 'porn', 'porno', 'sex', 'sexy', 'tits', 'tit', 'boob', 'boobs', 'penis', 'vagina', 'nigger', 'nigga', 'fag', 'fags', 'faggot', 'retard',
  'retarded', 'kike', 'spic', 'chink', 'gook', 'dyke', 'tranny', 'cum', 'jizz', 'wank', 'wanker', 'twat', 'prick', 'hooker', 'milf', 'hitler', 'dildo',
  'incest', 'molest', 'pedo', 'horny', 'wog', 'wogs', 'yid', 'yids']);
// Từ nhạy cảm nhẹ: người xem gõ vẫn được chấp nhận (không đáng loại) nhưng không để xuất hiện trong ma trận Săn từ vì ma trận do mình dựng sẵn
const MILD = new Set(['damn', 'dammit', 'crap', 'butt', 'screw', 'naked', 'nude', 'nudes']);
const BAD_IN_GRID = new Set([...OFFENSIVE, ...MILD]);

let sp = null;
function load() {
  if (sp) return sp;
  const nspell = require('nspell');
  const dir = path.join(__dirname, 'node_modules', 'dictionary-en'); // gói ESM-only nên đọc thẳng file .aff/.dic
  sp = nspell(fs.readFileSync(path.join(dir, 'index.aff')), fs.readFileSync(path.join(dir, 'index.dic')));
  return sp;
}

// w: chữ thường a–z, từ 2 chữ cái trở lên
exports.isWord = (w) => /^[a-z]{2,30}$/.test(w) && !BLOCK.has(w) && !OFFENSIVE.has(w) && load().correct(w);
exports.isOffensive = (w) => OFFENSIVE.has(w);
exports.BAD_IN_GRID = BAD_IN_GRID; // dùng khi dựng ma trận Săn từ (build_san_tu.js)
exports.load = load;
