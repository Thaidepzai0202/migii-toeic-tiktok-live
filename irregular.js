// Dựng câu hỏi cho hai khung Động từ bất quy tắc từ data/dong-tu-bqt.json. Không đụng tới trạng thái game nên thử riêng được:
//   node -e "const I=require('./irregular').create(require('./data/dong-tu-bqt.json'));console.log(I.pickFill(),I.pickFind())"
// irrfill (Chia động từ): bảng 3 hàng V1–V2–V3, hàng đố khuyết 1 ô, hai hàng còn lại đủ chữ để người xem nhìn là hiểu đề.
// irrfind (Tìm bất quy tắc): 4 động từ nguyên mẫu, 1 bất quy tắc + 3 có quy tắc; công bố kèm dạng quá khứ của cả 4 để so sánh.
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const forms = (s) => String(s).split('/');

// show = chữ hiện trên màn từng cột (v2/v3 có thể là "was/were"); ok = mọi dạng được chấm đúng ở từng cột (kể cả alt không hiện)
const prep = (x) => ({ v1: x.v1, m: x.m, show: [x.v1, x.v2, x.v3], ok: [[x.v1], [...forms(x.v2), ...(x.alt2 || [])], [...forms(x.v3), ...(x.alt3 || [])]] });

// Cột có thể để khuyết: đáp án không được nằm sẵn ở hai ô còn lại của hàng (buy – ? – bought thì chỉ việc chép lại).
// Vì vậy buy/bought/bought chỉ khuyết V1, come/came/come chỉ khuyết V2, cut/cut/cut không dùng cho khung Chia động từ.
function blankCols(v) {
  return [0, 1, 2].filter((c) => {
    const vis = new Set([0, 1, 2].filter((k) => k !== c).flatMap((k) => forms(v.show[k])));
    return !v.ok[c].some((f) => vis.has(f));
  });
}

function create(data) {
  const verbs = data.irregular.map(prep);
  const regular = data.regular.map((x) => ({ v1: x.v1, v2: x.v2 }));
  const fillable = verbs.filter((v) => blankCols(v).length);
  let fillBag = [], findBag = [];

  function pickFill() {
    if (!fillBag.length) fillBag = shuffle(fillable);
    const v = fillBag.pop(), cols = blankCols(v), past = cols.filter((c) => c > 0);
    // ưu tiên khuyết V2/V3 (phần cần nhớ) khi động từ cho phép; 1 phần 5 số câu hỏi ngược lại V1
    const col = past.length && (past.length === cols.length || Math.random() < 0.8) ? pick(past) : 0;
    const ok = v.ok[col];
    // Hai hàng ví dụ: động từ khác, không chứa và không nằm trong đáp án (rise/arise, stand/understand… sẽ lộ đáp án)
    const clash = (x) => x.show.flatMap(forms).some((f) => ok.some((a) => f.includes(a) || a.includes(f)));
    const ex = shuffle(verbs.filter((x) => x !== v && !clash(x))).slice(0, 2);
    const at = Math.floor(Math.random() * 3);
    const rows = ex.map((x) => x.show);
    rows.splice(at, 0, v.show);
    const first = (c) => forms(v.show[c])[0];
    return { v, col, at, rows, ok, say: [first(0), first(1), first(2)] };
  }

  function pickFind() {
    if (!findBag.length) findBag = shuffle(verbs);
    const v = findBag.pop();
    const opts = shuffle([{ v1: v.v1, irr: true, v2: v.show[1], v3: v.show[2] }, ...shuffle(regular).slice(0, 3).map((x) => ({ v1: x.v1, irr: false, v2: x.v2, v3: x.v2 }))]);
    const same = v.show[0] === v.show[1] && v.show[1] === v.show[2];
    // ba dạng giống nhau (cut, read…) chỉ đọc 1 lần: máy đọc không phân biệt được read /riːd/ và read /red/
    return { v, options: opts.map((o) => o.v1), answerIdx: opts.findIndex((o) => o.irr), forms: opts.map(({ irr, v2, v3 }) => ({ irr, v2, v3 })),
      say: same ? [v.v1] : [v.v1, forms(v.show[1])[0], forms(v.show[2])[0]] };
  }

  return { verbs, regular, fillable, pickFill, pickFind };
}

module.exports = { create, blankCols };
