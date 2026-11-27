// Dựng bài học gia sư từ nguồn viết gọn (gia-su/nguon/*.js) ra JSON đủ kịch bản (gia-su/bai/live/NNN-<id>.json).
//   node gia-su/build_bai.js        (npm run build:gia-su)
//
// Chữ trong nguồn:  {…} = chỗ gia sư nhấn (thước lướt qua),  […] = tiếng Anh (đọc bằng giọng Anh).
// Hai loại bài:
//   ngu_phap: { id, ten, nhom, y: [câu ý chính], ct?: { hien, noi, ghi? }, vd: [{ en, vi, noi? }], meo?: { hien, noi }, bt: [...] }
//   tu_vung:  { id, ten, nhom, chu_de, tu: [[từ, loại, nghĩa, câu ví dụ có {từ}, nghĩa, câu ví dụ 2?, nghĩa 2?]],
//               dich?: [[thứ tự từ (0–3), câu Việt, câu mẫu có {từ}, cách dịch khác…]], bt: [...] }
//             dich = mode "Dịch câu" (live: người xem bình luận câu tiếng Anh): mỗi đề thành một phần ngay sau từ nó dùng.
//             Bài từ vựng chỉ lấy câu trắc nghiệm đầu (người dùng chốt 23/11/2026: có đề dịch thì bớt trắc nghiệm cho bài khỏi dài).
//   bài tập:  { cau (có ___), chon: [2–4 lựa chọn], dap: số thứ tự đáp án, vi_sao: lý do ngắn (đọc được, có […] cho chữ Anh) }
// Thứ tự phát theo chương (nguon/0-chuong.js): mỗi chương các bài từ vựng cùng chủ đề rồi tới ngữ pháp; bài ngữ pháp có thêm
// phần "Theo chủ đề" (vd của chương: câu dùng từ vừa học). Bài nào trong nguồn cũng phải nằm đúng một chương.
//
// Bản VIDEO (gia-su/bai/video/, cho xuat-video.js) — người dùng chốt 25/11/2026: chỉ đọc tiếng Anh + tiếng Việt, xúc tích,
// bỏ mọi câu dẫn ("Nghĩa là", "Thử dịch…", "Đáp án:", giới thiệu chương, "Xong bài rồi"). Mỗi lời đọc có thể kèm `video`:
// chuỗi = lời đọc bản video, null = bỏ cả bước ở bản video; không có `video` thì hai bản đọc như nhau.
const fs = require('fs');
const path = require('path');

const NGUON = path.join(__dirname, 'nguon');
const RA = path.join(__dirname, 'bai', 'live');
const RA_VIDEO = path.join(__dirname, 'bai', 'video');
const LOAI_TU = { n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'trạng từ', phr: 'cụm từ', prep: 'giới từ', conj: 'liên từ' };

const boNgoac = (s) => String(s).replace(/[[\]{}]/g, '');
const docDuoc = (s) => String(s).replace(/[{}]/g, ''); // lời đọc: giữ […] cho giọng Anh
const hoaDau = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Một câu nguồn → chữ hiện trên trang ([[id|…]] cho chỗ nhấn), lời đọc, và các id chỗ nhấn kèm vị trí (để hẹn giờ nhấn)
function tach(s, goc) {
  const ids = [];
  let n = 0;
  const chu = String(s).replace(/\{([^}]+)\}/g, (_, x) => {
    const id = `${goc}${String.fromCharCode(97 + n++)}`;
    ids.push(id);
    return `[[${id}|${boNgoac(x)}]]`;
  }).replace(/\[(?!\[)([^\]]+)\](?!\])/g, '$1');
  // Vị trí (theo ký tự lời đọc) của từng chỗ nhấn: nhấn đúng lúc gia sư đọc tới
  const noi = docDuoc(s);
  const viTri = [];
  let k = 0;
  String(s).replace(/\{/g, (_, at) => { viTri.push(docDuoc(String(s).slice(0, at)).length); k++; return _; });
  return { chu, noi, ids, viTri };
}

// Hẹn giờ nhấn theo vị trí ký tự (~60 ms một ký tự lời đọc)
const nhanTheoLoi = (x, kieu) => x.ids.map((id, j) => ({ [kieu]: id, ...(x.viTri[j] > 12 ? { sau: Math.round(x.viTri[j] * 60) } : {}) }));

// Xáo thứ tự lựa chọn (cố định theo hạt giống) để đáp án không luôn nằm một chỗ
function xao(chon, dap, hat) {
  let h = 0;
  for (const c of hat) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  const rnd = () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = Math.imul(h ^ (h >>> 15), h | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const p = chon.map((_, i) => i);
  for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  return { chon: p.map((i) => chon[i]), dap: p.indexOf(dap) };
}

// lyDoVideo: bản video đọc câu đầy đủ rồi đọc thêm lý do (ngữ pháp); từ vựng chỉ đọc câu đầy đủ
function baiTap(bt, mo, goc, lyDoVideo) {
  const khoi = [];
  const giang = [];
  bt.map((t, n) => ({ ...t, ...xao(t.chon, t.dap, `${goc}-${n}`) })).forEach((t, n) => {
    if (!t.cau.includes('___') || t.dap < 0 || t.dap >= t.chon.length) throw new Error(`bài tập "${t.cau}" sai cấu trúc`);
    if (new Set(t.chon).size !== t.chon.length) throw new Error(`bài tập "${t.cau}" có lựa chọn trùng`);
    const id = `bt${n}`;
    const dap = t.chon[t.dap];
    const lyDo = boNgoac(t.vi_sao);
    khoi.push({
      id, kieu: 'bai_tap', cau: t.cau, lua_chon: t.chon, dap_an: t.dap,
      giai_thich: t.chon.map((_, j) => (j === t.dap ? hoaDau(lyDo) : `Đáp án là ${dap}: ${lyDo}`)),
    });
    const sai = {};
    t.chon.forEach((_, j) => { if (j !== t.dap) sai[j] = { noi: `Chưa đúng. Gợi ý: ${t.vi_sao} Bạn chọn lại nhé.` }; });
    giang.push({
      bai_tap: id,
      noi: n === 0 ? mo : 'Câu tiếp theo.',
      video: '', // video: không mời, hiện câu hỏi rồi đếm 10 giây
      lam: [{ tro: id }],
      dung: { noi: `Chính xác! ${hoaDau(t.vi_sao)}` },
      sai,
      bo_qua: { noi: `Đáp án là [${dap}], vì ${t.vi_sao}`, video: `[${t.cau.replace('___', dap)}]${lyDoVideo ? ` ${hoaDau(t.vi_sao)}` : ''}` },
      giai: { noi: `Vì ${t.vi_sao}` }, // live: đã sửa cho người xem "đáp án là …" thì chỉ nói lý do
    });
  });
  return { id: 'pbt', nhan: 'Luyện tập', tieu_de: bt.length > 1 ? `${bt.length} câu kiểu đề thi` : 'Một câu kiểu đề thi', khoi, giang };
}

// Câu gia sư mở đầu chương / nối sang phần ngữ pháp của chương
const CHU_SO = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm'];
const moChuong = (c) => `Chương ${CHU_SO[c.so] || c.so}: ${c.ten}. Chương này có ${CHU_SO[c.tong] || c.tong} bài. `;

function nguPhap(b) {
  const ten = tach(b.ten, 'ten');
  const c = b.chuong;
  const dau = c.bai === 1 ? moChuong(c) : c.dauNP ? `Xong phần từ vựng của chương. Giờ sang ngữ pháp, ví dụ dùng luôn các từ vừa học. ` : '';
  const p1 = { id: 'p1', nhan: 'Ý chính', tieu_de: boNgoac(b.ten), khoi: [], giang: [{ noi: `${dau}Bài này mình học ${ten.noi}.`, video: `${hoaDau(ten.noi)}.`, lam: [{ tro: 'p1' }] }] };
  b.y.forEach((s, n) => {
    const x = tach(s, `y${n}`);
    p1.khoi.push({ id: `y${n}`, kieu: 'doan', chu: x.chu });
    p1.giang.push({ noi: x.noi, lam: x.ids.length ? nhanTheoLoi(x, 'to') : [{ tro: `y${n}` }] });
  });
  if (b.ct) {
    p1.khoi.push({ id: 'ct', kieu: 'cong_thuc', chu: b.ct.hien, ...(b.ct.ghi ? { chu_thich: b.ct.ghi } : {}) });
    p1.giang.push({ noi: `Công thức: ${b.ct.noi}.`, lam: [{ to: 'ct' }] });
  }
  const mo = ['Ví dụ nhé:', 'Thêm một câu:', 'Câu nữa:'];
  const p2 = { id: 'p2', nhan: 'Ví dụ', tieu_de: 'Áp vào câu', khoi: [], giang: [] };
  b.vd.forEach((v, n) => {
    const id = `v${n}`;
    const x = tach(v.en, id);
    p2.khoi.push({ id, kieu: 'vi_du', en: x.chu, vi: v.vi });
    p2.giang.push({ noi: `${mo[n % mo.length]} [${boNgoac(v.en)}]`, video: `[${boNgoac(v.en)}] ${v.vi}`, lam: [{ tro: id }] });
    if (v.noi) p2.giang.push({ noi: docDuoc(v.noi), lam: x.ids.length ? x.ids.map((i) => ({ gach: i })) : [{ tro: id }] });
  });
  const phan = [p1, p2];
  // Theo chủ đề chương: câu dùng chính các từ vừa học
  if (c.vd?.length) {
    const moCd = [`Giờ áp vào chủ đề ${c.ten.toLowerCase()}:`, 'Thêm một câu:', 'Câu nữa:'];
    const pc = { id: 'p2c', nhan: 'Theo chủ đề', tieu_de: c.ten, khoi: [], giang: [] };
    c.vd.forEach((v, n) => {
      const id = `c${n}`;
      const x = tach(v.en, id);
      if (!x.ids.length) throw new Error(`ví dụ chủ đề "${v.en}" chưa đánh dấu {chỗ nhấn}`);
      pc.khoi.push({ id, kieu: 'vi_du', en: x.chu, vi: v.vi });
      pc.giang.push({ noi: `${moCd[n % moCd.length]} [${boNgoac(v.en)}]`, video: `[${boNgoac(v.en)}] ${v.vi}`, lam: [{ tro: id }] });
      if (v.noi) pc.giang.push({ noi: docDuoc(v.noi), lam: x.ids.map((i) => ({ gach: i })) });
    });
    phan.push(pc);
  }
  if (b.meo) phan.push({ id: 'p3', nhan: 'Mẹo nhớ', tieu_de: 'Ghi nhớ nhanh', khoi: [{ id: 'meo', kieu: 'ghi_nho', chu: b.meo.hien }], giang: [{ noi: b.meo.noi, lam: [{ to: 'meo' }] }] });
  phan.push(baiTap(b.bt, 'Giờ thử sức nhé. Chọn đáp án đúng.', b.id, true));
  phan[phan.length - 1].giang.push({ noi: 'Xong bài rồi, bạn nhớ ôn lại nhé!', video: null });
  return phan;
}

function tuVung(b) {
  const c = b.chuong;
  const phan = b.tu.map(([tu, loai, nghia, en, vi, en2, vi2], n) => {
    const khoi = [{ id: `m${n}`, kieu: 'doan', chu: `**${LOAI_TU[loai] || loai}** · [[m${n}a|${nghia}]]` }];
    const giang = [];
    if (n === 0) giang.push({ noi: `${c.bai === 1 ? moChuong(c) : `Tiếp chủ đề ${c.ten.toLowerCase()}. `}Bài này mình học ${b.tu.length} từ về ${b.chu_de}.`, video: null, lam: [{ tro: `w${n}` }] });
    giang.push({ noi: `[${tu}]. Nghĩa là ${nghia}.`, video: `[${tu}]. ${hoaDau(nghia)}.`, lam: [{ to: `m${n}a` }] });
    // Mỗi từ một hoặc hai câu ví dụ (e: câu 1, f: câu 2)
    [[en, vi, 'e'], [en2, vi2, 'f']].forEach(([cau, nghiaCau, k]) => {
      if (!cau) return;
      if (!/\{[^}]+\}/.test(cau)) throw new Error(`${b.id}: câu ví dụ "${cau}" của "${tu}" chưa đánh dấu {từ}`);
      const x = tach(cau, `${k}${n}`);
      khoi.push({ id: `${k}${n}`, kieu: 'vi_du', en: x.chu, vi: nghiaCau });
      giang.push({ noi: `[${boNgoac(cau)}]`, video: `[${boNgoac(cau)}] ${nghiaCau}`, lam: [{ tro: `${k}${n}` }, ...x.ids.map((i) => ({ gach: i, sau: 700 }))] });
    });
    return { id: `w${n}`, nhan: `Từ ${n + 1}/${b.tu.length}`, tieu_de: tu, khoi, giang };
  });
  // Đề dịch Việt → Anh: chèn ngay sau phần của từ mà đề dùng (đi từ cuối để chỉ số phần không lệch)
  const dich = (b.dich || []).map(([i, vi, en, ...khac], k) => {
    if (!b.tu[i]) throw new Error(`${b.id}: đề dịch "${vi}" trỏ tới từ thứ ${i} không có`);
    const x = tach(en, `d${k}`);
    if (!x.ids.length) throw new Error(`${b.id}: câu mẫu "${en}" chưa đánh dấu {từ}`);
    const tu = b.tu[i][0];
    const mau = boNgoac(en);
    const khoi = {
      id: `d${k}`, kieu: 'dich', vi, tu, so_tu: mau.split(/\s+/).length, en: x.chu,
      dap: [mau, ...khac], nhan: [...en.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]),
    };
    const giang = [{
      dich: `d${k}`, noi: `Thử dịch sang tiếng Anh nhé: ${vi} Nhớ dùng từ [${tu.split(',')[0].trim()}].`, video: vi, lam: [{ tro: `d${k}` }],
      dap: { noi: `Đáp án: [${mau}]`, video: `[${mau}]` },
    }];
    return { sau: i, phan: { id: `pd${k}`, nhan: 'Dịch câu', tieu_de: 'Dịch sang tiếng Anh', khoi: [khoi], giang } };
  });
  for (const d of [...dich].reverse()) phan.splice(d.sau + 1, 0, d.phan);
  phan.push(baiTap(b.dich?.length ? b.bt.slice(0, 1) : b.bt, 'Giờ kiểm tra nhanh nhé. Chọn từ đúng.', b.id, false));
  phan[phan.length - 1].giang.push({ noi: 'Xong bài rồi, bạn nhớ ôn lại nhé!', video: null });
  return phan;
}

// Lời đọc tiếng Việt: số nhỏ đọc thành chữ ("4 từ" → "bốn từ", "loại 0" → "loại không"), "…" thành dấu phẩy.
// Chỉ đổi phần tiếng Việt, phần [tiếng Anh] để nguyên cho giọng Anh đọc. Chữ hiện trên trang không đổi.
const SO = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
const docSo = (noi) => noi.split(/(\[[^\]]*\])/).map((x) => (x.startsWith('[') ? x
  : x.replace(/(^|[^\d.,])(\d{1,2})(?!\d|[.,]\d|%)/g, (m, a, n) => (Number(n) <= 10 ? a + SO[Number(n)] : m)).replace(/\s*…\s*/g, ', '))).join('');

// ---------- Chạy ----------
const nguon = fs.readdirSync(NGUON).filter((f) => f.endsWith('.js')).sort().map((f) => require(path.join(NGUON, f)));
const np = nguon.flatMap((m) => m.ngu_phap || []);
const tv = nguon.flatMap((m) => m.tu_vung || []);
const chuong = nguon.flatMap((m) => m.chuong || []);
const theoId = new Map();
for (const [ds, loai] of [[np, 'np'], [tv, 'tv']]) {
  for (const b of ds) {
    if (theoId.has(b.id)) throw new Error(`trùng id ${b.id}`);
    theoId.set(b.id, { ...b, loai });
  }
}
// Xếp theo chương: từ vựng trước, ngữ pháp sau; kiểm mỗi bài nằm đúng một chương, ví dụ chủ đề trỏ đúng bài ngữ pháp của chương
const ds = [];
chuong.forEach((c, ci) => {
  const cac = [...c.tu_vung, ...c.ngu_phap];
  for (const id of Object.keys(c.vd || {})) if (!c.ngu_phap.includes(id)) throw new Error(`chương "${c.ten}": vd cho "${id}" nhưng bài này không thuộc ngữ pháp của chương`);
  cac.forEach((id, k) => {
    const b = theoId.get(id);
    if (!b) throw new Error(`chương "${c.ten}": không có bài "${id}" trong nguồn`);
    if (b.chuong) throw new Error(`bài "${id}" nằm ở hai chương`);
    if ((b.loai === 'tv') !== (k < c.tu_vung.length)) throw new Error(`chương "${c.ten}": "${id}" đặt nhầm danh sách từ vựng / ngữ pháp`);
    b.chuong = { so: ci + 1, ten: c.ten, bai: k + 1, tong: cac.length, dauNP: k === c.tu_vung.length, vd: c.vd?.[id] };
    if (b.loai === 'np' && !b.chuong.vd) console.warn(`⚠️  ${id}: chưa có ví dụ theo chủ đề "${c.ten}"`);
    ds.push(b);
  });
});
const ngoai = [...theoId.values()].filter((b) => !b.chuong).map((b) => b.id);
if (ngoai.length) throw new Error(`bài chưa xếp vào chương nào (nguon/0-chuong.js): ${ngoai.join(', ')}`);

// Tách hai bản từ cùng một kịch bản: live đọc `noi`; video đọc `video` thay cho `noi` (null: bỏ bước)
const cacLoi = (g) => [g, g.dung, g.bo_qua, g.giai, g.dap, ...Object.values(g.sai || {})].filter(Boolean);
function ban(bai, video) {
  const v = structuredClone(bai);
  for (const p of v.phan) {
    if (video) p.giang = p.giang.filter((g) => g.video !== null);
    for (const g of p.giang) {
      for (const l of cacLoi(g)) {
        if (video && 'video' in l) l.noi = l.video;
        delete l.video;
        if (l.noi) l.noi = docSo(l.noi);
      }
    }
  }
  return v;
}

for (const d of [RA, RA_VIDEO]) { fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); }
let loi = 0;
ds.forEach((b, k) => {
  try {
    const { so, ten: tenChuong, bai: thu, tong } = b.chuong;
    const bai = {
      id: b.id, ten: boNgoac(b.ten), nhom: b.nhom, so: k + 1, chuong: { so, ten: tenChuong, bai: thu, tong },
      phan: b.loai === 'np' ? nguPhap(b) : tuVung(b),
    };
    const ten = `${String(k + 1).padStart(3, '0')}-${b.id}.json`;
    fs.writeFileSync(path.join(RA, ten), JSON.stringify(ban(bai, false), null, 1));
    fs.writeFileSync(path.join(RA_VIDEO, ten), JSON.stringify(ban(bai, true), null, 1));
  } catch (e) {
    loi++;
    console.error(`❌ ${b.id}: ${e.message}`);
  }
});
console.log(`Đã dựng ${ds.length - loi} bài (${chuong.length} chương, ${np.length} ngữ pháp, ${tv.length} từ vựng) vào ${path.relative(process.cwd(), RA)} (live) và ${path.relative(process.cwd(), RA_VIDEO)} (video)${loi ? `, ${loi} bài lỗi` : ''}`);
process.exitCode = loi ? 1 : 0;
