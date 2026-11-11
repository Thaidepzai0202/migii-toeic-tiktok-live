// Chuẩn hoá và so khớp câu cho khung Nghe – chép. Người xem gõ theo tai nên nhiều cách viết cùng đúng:
//   hoa/thường, dấu câu, dấu nháy, dấu gạch nối (e-mail), chữ có dấu (café), viết liền/tách (check out / checkout, cannot / can not),
//   chữ số thay cho số viết bằng chữ (10 = ten, 3rd = third), viết tắt (don't = do not, can't = cannot),
//   và biến thể Anh–Mỹ (colour = color, centre = center, practised = practiced).
// Câu mẫu trong kho viết theo chính tả Mỹ, nên chỉ cần đổi chữ Anh của NGƯỜI GÕ sang Mỹ.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORD = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth', 13: 'thirteenth', 14: 'fourteenth', 15: 'fifteenth', 16: 'sixteenth', 17: 'seventeenth', 18: 'eighteenth', 19: 'nineteenth', 20: 'twentieth', 30: 'thirtieth', 40: 'fortieth', 50: 'fiftieth' };
const numWords = (n) => (n < 20 ? [ONES[n]] : n < 100 ? [TENS[Math.floor(n / 10)], ...(n % 10 ? [ONES[n % 10]] : [])] : n === 100 ? ['one', 'hundred'] : null);

// Anh → Mỹ: danh sách rõ ràng (không dùng luật chung kiểu -our → -or vì sẽ nhầm four/for, hour…)
const UK2US = {};
const add = (uk, us) => { UK2US[uk] = us; };
const forms = (ukBase, usBase, suffixes) => { for (const s of suffixes) add(ukBase + s, usBase + s); };
for (const [uk, us] of [['colour', 'color'], ['favour', 'favor'], ['behaviour', 'behavior'], ['neighbour', 'neighbor'], ['honour', 'honor'], ['labour', 'labor'], ['harbour', 'harbor'], ['flavour', 'flavor'], ['humour', 'humor'], ['rumour', 'rumor'], ['odour', 'odor'], ['endeavour', 'endeavor']])
  forms(uk, us, ['', 's', 'ed', 'ing', 'ful', 'ite', 'able', 'less', 'ist', 'ists']);
for (const [uk, us] of [['centre', 'center'], ['metre', 'meter'], ['litre', 'liter'], ['theatre', 'theater'], ['fibre', 'fiber'], ['kilometre', 'kilometer'], ['millimetre', 'millimeter'], ['centimetre', 'centimeter']]) forms(uk, us, ['', 's']);
for (const stem of ['organ', 'real', 'recogn', 'apolog', 'emphas', 'summar', 'special', 'custom', 'author', 'critic', 'minim', 'maxim', 'priorit', 'util', 'standard', 'modern', 'memor', 'final', 'general', 'local', 'visual', 'legal', 'digit', 'capital', 'central', 'normal', 'mobil', 'harmon', 'item', 'sanit', 'character', 'optim', 'person', 'social', 'subsid', 'synchron', 'urban', 'colon', 'categor', 'financ', 'popular', 'private', 'real', 'stabil', 'sympath', 'theor', 'civil', 'equal', 'fertil', 'hospital', 'initial', 'itemis', 'jeopard', 'magnet', 'monopol', 'neutral', 'pasteur', 'penal', 'plagiar', 'polar', 'randomi', 'revolution', 'scrutin', 'sensit', 'trauma', 'vandal', 'womaniz'])
  forms(stem + 'is', stem + 'iz', ['e', 'es', 'ed', 'ing', 'ation', 'ations', 'er', 'ers']);
for (const [uk, us] of [['analyse', 'analyze'], ['analysed', 'analyzed'], ['analyses', 'analyzes'], ['analysing', 'analyzing'], ['practise', 'practice'], ['practised', 'practiced'], ['practising', 'practicing'], ['catalogue', 'catalog'], ['catalogues', 'catalogs'], ['programme', 'program'], ['programmes', 'programs'], ['grey', 'gray'], ['greyer', 'grayer'], ['licence', 'license'], ['defence', 'defense'], ['offence', 'offense'], ['pretence', 'pretense'], ['jewellery', 'jewelry'], ['aluminium', 'aluminum'], ['tyre', 'tire'], ['tyres', 'tires'], ['sceptical', 'skeptical'], ['ageing', 'aging'], ['judgement', 'judgment'], ['acknowledgement', 'acknowledgment'], ['learnt', 'learned'], ['spelt', 'spelled'], ['burnt', 'burned'], ['towards', 'toward'], ['afterwards', 'afterward'], ['amongst', 'among'], ['whilst', 'while'], ['leapt', 'leaped'], ['dreamt', 'dreamed'], ['mould', 'mold'], ['plough', 'plow'], ['draught', 'draft'], ['cosy', 'cozy'], ['pyjamas', 'pajamas'], ['sulphur', 'sulfur'], ['storey', 'story'], ['storeys', 'stories'], ['manoeuvre', 'maneuver'], ['paediatric', 'pediatric'], ['anaemia', 'anemia'], ['encyclopaedia', 'encyclopedia'], ['enrol', 'enroll'], ['enrolment', 'enrollment'], ['fulfil', 'fulfill'], ['fulfilment', 'fulfillment'], ['instalment', 'installment'], ['skilful', 'skillful'], ['wilful', 'willful'], ['cheque', 'check'], ['cheques', 'checks'], ['kerb', 'curb'], ['gaol', 'jail'], ['aeroplane', 'airplane'], ['mum', 'mom']]) add(uk, us);
for (const stem of ['travel', 'cancel', 'label', 'model', 'level', 'fuel', 'counsel', 'signal', 'total', 'channel', 'quarrel', 'tunnel', 'marshal', 'equal', 'dial', 'pedal', 'rival', 'duel', 'jewel', 'refuel', 'panel', 'libel'])
  forms(stem + 'l', stem, ['ed', 'ing', 'er', 'ers', 'ist', 'ists']);

// Viết tắt → dạng đầy đủ (câu mẫu không có dấu nháy). Dạng bỏ nháy chỉ đổi khi không trùng từ thật (không đổi wont, lets, ill, well, its, were, wed, id).
const CONTR = { "n't": ' not', "'m": ' am', "'re": ' are', "'ve": ' have', "'ll": ' will' };
const SPECIAL = { "can't": 'cannot', "won't": 'will not', "shan't": 'shall not', "let's": 'let us', "it's": 'it is', "that's": 'that is', "there's": 'there is', "what's": 'what is', "he's": 'he is', "she's": 'she is', "who's": 'who is', "here's": 'here is', "where's": 'where is' };
const NOAPOS = { dont: 'do not', doesnt: 'does not', didnt: 'did not', cant: 'cannot', isnt: 'is not', arent: 'are not', wasnt: 'was not', werent: 'were not', havent: 'have not', hasnt: 'has not', hadnt: 'had not', shouldnt: 'should not', wouldnt: 'would not', couldnt: 'could not', mustnt: 'must not', im: 'i am', youre: 'you are', ive: 'i have', youve: 'you have', weve: 'we have', theyve: 'they have', thats: 'that is', theres: 'there is', whats: 'what is' };
const expand = (t) => t.replace(/[’`]/g, "'").replace(/\b[a-z]+'[a-z]+\b/g, (w) => SPECIAL[w] || w.replace(/(n't|'m|'re|'ve|'ll)$/, (e) => CONTR[e]));

function tokens(text) {
  let t = expand(String(text).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')).replace(/'/g, '').replace(/-/g, '');
  t = t.replace(/(\d+)(st|nd|rd|th)\b/g, (m, d) => ` ${ORD[+d] || m} `);
  t = t.replace(/\d+/g, (d) => ` ${(numWords(+d) || [d]).join(' ')} `);
  return t.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).flatMap((w) => (NOAPOS[w] || UK2US[w] || w).split(' '));
}
const joined = (text) => tokens(text).join('');
// Đúng khi chuỗi chữ cái (bỏ dấu cách) giống nhau: nhận cả viết liền / tách
const same = (typed, target) => joined(typed) === joined(target);
// Số từ đúng đúng vị trí (để báo "k/n từ đúng")
const goodWords = (typed, target) => { const g = tokens(typed), w = tokens(target); return g.filter((x, i) => x === w[i]).length; };
// Bình luận đủ dài mới tính là một lần thử (ngắn hơn nửa câu coi như tán gẫu)
const isAttempt = (typed, target) => joined(typed).length >= joined(target).length * 0.5;

module.exports = { tokens, joined, same, goodWords, isAttempt, UK2US };
