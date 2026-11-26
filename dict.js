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

// Thứ Hunspell nhận nhưng không phải "từ có nghĩa" để chấm điểm: chữ viết tắt (etc, amt, govt), dạng cổ / phương ngữ (hast, nae), mảnh từ chỉ
// đi trong cụm (situ). Dùng chung cho Bricky (build_bricky.js) và Săn từ (san-tu.js). Nhóm đầu soát từ các bộ chữ của Bricky 19/11/2026; nhóm sau
// soát 26/11/2026 từ mọi mục 3–4 chữ cái của Hunspell không có trong từ điển hệ thống (bảng Săn từ 16×16 mọc ra chuỗi ngắn bất kỳ).
// Chữ viết tắt không có nguyên âm (bbl, mph, bldg) và số La Mã (xiv) do isPlayable chặn bằng luật, không cần liệt kê. Thêm dần khi gặp trên live.
const BO = new Set(('attn cert ctn def enc furn ind inf rehi thru wot adv amt cal cir cor ctr diam div dob ecu ecus est etc ext fer gen hast hes hist hon hrs idem int lbw med meg nae neg nos obs org ' +
  'rec reg rel res rte sen situ tel tho thous trad tron twas wast yer yest ' +
  'adj ans arr aux ave avg cis cit col com deg doz dpi eds emf ens esp exp fem fol fut fwy gov hwy isl jun lav lib liq mes mos mun mus mys obj opp qty rem riv sci seq sim soc sqq syn ' +
  'uhf ult usu val var veg viz vol xor yrs abbr acct advt asap assn asst atty avdp biog biol capt chem chge comm comp cons cont corr dded dict dist dost eccl ecol econ educ elem elev encl ency ' +
  'erst excl foll freq geog geom govt hosp incl inst ital mach masc mdse meas misc mtge natl neut orig phys pkwy pref pres prov ques recd secy shew subj supp supt terr xref ' +
  'assoc contd equiv illus instr suppl treas abbrev approx colloq imperf interj specif transl canst hadst mayst saith').split(' '));
// Từ thô / nhạy cảm nhẹ: là từ thật nhưng không cộng điểm và không hiện trên màn live của thương hiệu giáo dục (từ tục nặng đã ở OFFENSIVE).
const THO = new Set(('fart hos hots nob nobs nuder prat teat teats tush ' +
  'poo poos poop poops pee pees peed peeing pis turd turds wop wops gyp gyps gypped perv pervs barf barfs narc wino winos honky dago dagoes darkie whitey pinko nympho bimbo bimbos busty ' +
  'balls arsed arsing bitchy crappy condom condoms sexpot sexily niggaz nookie boink tarty spliff homo homos coon coons fanny boner boners pimp pimps puke pukes puked snot fatso pissy').split(' '));
const ROMAN = /^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/; // 'mix' trùng dạng số La Mã nhưng là từ thật

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
// Săn từ: "từ có nghĩa" để chấm điểm = từ điển nhận, từ 3 chữ cái, có nguyên âm, không phải chữ viết tắt / số La Mã / từ thô.
exports.isPlayable = (w) => w.length >= 3 && /[aeiouy]/.test(w) && !BO.has(w) && !THO.has(w) && !MILD.has(w) && (w === 'mix' || !ROMAN.test(w)) && exports.isWord(w);
exports.BO = BO;
exports.THO = THO;
exports.isOffensive = (w) => OFFENSIVE.has(w);
exports.BAD_IN_GRID = BAD_IN_GRID; // từ không được mọc ra trên bảng chữ Săn từ (san-tu.js) và trong các bộ đề dựng sẵn
exports.load = load;
