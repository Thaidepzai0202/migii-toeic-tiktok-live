// Trình phát bài học "gia sư tự động" (demo phần trình bày, chưa có hỏi đáp AI).
// Bài lấy từ /bai/<id>. Một trang chữ dùng chung cho 2 mode:
//   - Tự đọc: cả bài bày ra, người học tự đọc, tự làm bài tập.
//   - Gia sư: chạy kịch bản — mỗi bước là một câu gia sư nói + thao tác (chỉ thước, đổi màu chữ, gạch, khoanh).
//     Đọc tới đâu hiện tới đó: chỉ bày phần đang giảng, khối nào gia sư nói tới mới hiện ra.
//     Không tạm dừng thì chạy tới hết bài; tới bài tập thì dừng chờ người học chọn.
// Tham số thử (chụp màn): ?bai=<id>&che-do=doc|gia-su&buoc=<n>&tat-tieng=1&tu-chay=1&dung=1&rong=<px>
// (Chrome chạy ẩn không cho cửa sổ hẹp hơn ~500px, nên chụp ở 540 và ép khung app bằng rong=390.)
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const Q = new URLSearchParams(location.search);
const TAT_TIENG = Q.get('tat-tieng') === '1';
const LIVE = Q.get('live') === '1'; // trang phát live: bài tự chạy nối tiếp, người xem trả lời bằng bình luận (gia-su-live.js)
// Xuất video (gia-su/xuat-video.js, ?live=1&video=1&bai-so=N): khung live nhưng chạy đúng một bài, không chờ bình luận
// (câu hỏi: mời bình luận + đếm ngược ngắn rồi hiện đáp án), giữ màn ngắn hơn (người xem video tự dừng được), ghi lúc phát từng câu đọc
const VIDEO = LIVE && Q.get('video') === '1';
const TOC = [1, 1.25, 0.8];
const HANH_DONG = ['tro', 'to', 'gach', 'khoanh', 'hien'];

const S = {
  bai: null,
  khoi: {},        // id khối → khối (để tra bài tập)
  buoc: [],        // các bước của cả bài, trải phẳng; mỗi bước biết nó thuộc phần nào (phanSo)
  tro: new Set(),  // mọi id kịch bản có nhắc tới (khối nào không được nhắc thì hiện ngay khi vào phần)
  i: 0,            // bước đang ở
  cheDo: 'gia-su',
  chay: false,     // đang phát (kể cả lúc chờ người học làm bài tập)
  phien: 0,        // tăng mỗi lần dừng/chuyển bước: việc nào của phiên cũ thì bỏ
  toc: 0,          // chỉ số trong TOC
  dau: [],         // dau[i] = dấu bước i để lại trên trang (hiện khối, đổi màu, khoanh), để gỡ khi tua lại
  daApDung: -1,    // bước lớn nhất đã áp thao tác lên trang
  phanDang: -1,    // phần đang bày trên màn (chế độ Gia sư)
  choBT: null,     // id bài tập đang chờ người học chọn
  ketQua: {},      // id bài tập → { lanDau: đúng ngay lần đầu?, xong }
  hen: [],
  huy: null,       // dừng đoạn đọc đang phát
  vong: [],        // các vòng khoanh: { svg, el }
  thuocEl: null,   // chỗ cây thước đang chỉ
  thuocTf: null,   // vị trí cuối của thước (transform)
  laze: [],        // các vệt laze: { el, kieu, divs }
};
const A = new Audio();
A.preload = 'auto';
const toc = () => TOC[S.toc];

// ---------- Dựng trang ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const chu = (s) => esc(s)
  .replace(/\[\[([\w-]+)\|([^\]]+)\]\]/g, '<span class="mk" data-id="$1">$2</span>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/_{3,}/g, '<span class="trong"></span>');
const tron = (s) => String(s || '').replace(/\[\[[\w-]+\|([^\]]+)\]\]/g, '$1');
const LOA = '<svg><use href="#i-loa"/></svg>';

// "dv" = đơn vị hiện dần: mỗi khối, mỗi dòng bảng, mỗi ý trong danh sách
function khoi(k) {
  const c = ` dv${k.chi_gia_su ? ' chi-gia-su' : ''}`;
  const id = `data-id="${k.id}"`;
  switch (k.kieu) {
    case 'doan': return `<p class="doan${c}" ${id}>${chu(k.chu)}</p>`;
    case 'cong_thuc': return `<div class="cong-thuc${c}" ${id}>${chu(k.chu)}${k.chu_thich ? `<span class="chu-thich">${chu(k.chu_thich)}</span>` : ''}</div>`;
    case 'vi_du': {
      const nhan = k.sai ? 'Câu sai' : k.nhan;
      return `<div class="vi-du${k.sai ? ' sai' : ''}${c}" ${id}>${nhan ? `<span class="nhan-vd">${esc(nhan)}</span>` : ''}`
        + `<span class="en">${chu(k.en)}</span><span class="vi">${chu(k.vi)}</span>`
        + (k.sai ? '' : `<button class="loa" data-doc="${esc(tron(k.en))}" aria-label="Nghe câu">${LOA}</button>`) + '</div>';
    }
    case 'ghi_nho': return `<div class="ghi-nho${c}" ${id}><span class="nhan-gn">Ghi nhớ</span>${chu(k.chu)}</div>`;
    case 'danh_sach': return `<ul class="danh-sach${c}" ${id}>${k.y.map((y) => `<li class="dv" data-id="${y.id}">${chu(y.chu)}</li>`).join('')}</ul>`;
    case 'bang': return `<div class="bang${c}" ${id}><div class="hang dau-bang">${k.cot.map((x) => `<span>${esc(x)}</span>`).join('')}</div>`
      + k.dong.map((d) => `<div class="hang dv" data-id="${d.id}">${d.o.map((o, j) => `<span class="o"><span class="mk" data-id="${d.id}-${j}"${j < d.o.length - 1 ? ` data-doc="${esc(o)}"` : ''}>${esc(o)}</span></span>`).join('')}</div>`).join('') + '</div>';
    case 'bai_tap': return `<div class="bai-tap${c}" ${id}><span class="nhan-bt">Bài tập</span><p class="cau">${chu(k.cau)}</p>`
      + k.lua_chon.map((x, j) => `<button class="chon" data-bt="${k.id}" data-j="${j}"><b>${'ABCDEF'[j]}</b><span>${esc(x)}</span><i class="so"></i></button>`).join('')
      // live: vạch đếm giờ, tên người vừa trả lời, người đúng đầu tiên
      + '<div class="dem-gio"><i></i></div><div class="nguoi"></div>'
      + `<div class="loi-giai"></div><button class="xem" data-xem="${k.id}">Xem đáp án</button></div>`;
    // Dịch câu Việt → Anh. Live: người xem bình luận, dòng .bl chạy các câu gửi lên, chốt thì nêu bật vài câu (.noi-bat)
    case 'dich': return `<div class="dich${c}" ${id}><span class="nhan-bt">Câu tiếng Việt</span><p class="de">${esc(k.vi)}</p>`
      + `<p class="goi-y">Dùng từ <b>${esc(k.tu)}</b> · ${k.so_tu} từ</p>`
      + '<div class="dem-gio"><i></i></div><div class="bl"></div><div class="nguoi"></div>'
      + `<div class="dap-dich" hidden><span class="en">${chu(k.en)}</span></div><div class="noi-bat"></div>`
      + `<button class="xem" data-dich="${k.id}">Xem đáp án</button></div>`;
    default: return '';
  }
}

// Cây thước gỗ mảnh có vạch chia; đầu thước ở (0; 5,5)
const THUOC = (() => {
  let vach = '';
  for (let k = 1; k <= 18; k++) { const x = 6 + k * 6; vach += `<line x1="${x}" y1="1" x2="${x}" y2="${k % 5 ? 3.5 : 6}"/>`; }
  return `<div class="than"><svg viewBox="0 0 120 11" aria-hidden="true"><rect x=".5" y=".5" width="119" height="10" rx="2"/>${vach}</svg></div>`;
})();

function dungTrang() {
  const b = S.bai;
  $('#trang').innerHTML = b.phan.map((p, n) => `<section class="phan" data-id="${p.id}" data-phan="${n}">`
    + `<div class="dau-phan">${LIVE && b.chuong ? `<div class="nhan chuong">Chương ${b.chuong.so} · ${esc(b.chuong.ten)}</div>` : ''}`
    + `<div class="nhan">${LIVE && b.chuong ? `Bài ${b.chuong.bai}/${b.chuong.tong}` : LIVE && b.so ? `Bài ${b.so}` : `Phần ${n + 1}`} · ${esc(p.nhan)}</div><div class="heading">${esc(p.tieu_de)}</div></div>`
    + `${p.khoi.map(khoi).join('')}</section>`).join('')
    + `<div id="lop"></div><div id="thuoc">${THUOC}</div>`;
  // Khối không được kịch bản nhắc tới (kể cả các id bên trong nó) thì hiện ngay khi vào phần
  for (const u of $$('#trang .dv')) {
    const ids = [u.dataset.id, ...$$('[data-id]', u).map((x) => x.dataset.id)];
    if (!ids.some((x) => S.tro.has(x))) u.dataset.tuHien = '1';
  }
  $$('#trang .phan').forEach(tachTu);
  S.dau = [];
  S.daApDung = -1;
  S.phanDang = -1;
  S.vong = [];
  S.laze = [];
  S.thuocEl = null;
  S.thuocTf = null;
  S.ketQua = {};
}

// Tách chữ thành từng span.tu để làm hiệu ứng cho từng chữ (nảy khi hiện, phóng to khi thước lướt qua)
function tachTu(goc) {
  const w = document.createTreeWalker(goc, NodeFilter.SHOW_TEXT);
  const ds = [];
  while (w.nextNode()) ds.push(w.currentNode);
  for (const n of ds) {
    if (!n.nodeValue.trim() || n.parentElement.closest('svg, .loa')) continue;
    const f = document.createDocumentFragment();
    for (const p of n.nodeValue.split(/(\s+)/)) {
      if (!p) continue;
      if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(p)); continue; }
      const s = document.createElement('span');
      s.className = 'tu';
      s.textContent = p;
      f.appendChild(s);
    }
    n.replaceWith(f);
  }
}

function chuanBi() {
  S.khoi = {};
  S.buoc = [];
  S.tro = new Set();
  const nhac = (loi) => { for (const h of loi?.lam || []) { const k = HANH_DONG.find((x) => x in h); if (k) S.tro.add(h[k]); } };
  S.bai.phan.forEach((p, n) => {
    for (const k of p.khoi) S.khoi[k.id] = k;
    for (const b of p.giang || []) {
      S.buoc.push({ ...b, phanSo: n });
      nhac(b); nhac(b.dung); nhac(b.bo_qua); nhac(b.dap);
      Object.values(b.sai || {}).forEach(nhac);
      if (b.bai_tap) S.tro.add(b.bai_tap);
      if (b.dich) S.tro.add(b.dich);
    }
  });
}

const el = (id) => $(`#trang [data-id="${CSS.escape(id)}"]`);

// ---------- Hình học: chỗ thước chỉ, khung khoanh ----------
// Toạ độ trong #trang, theo đơn vị CSS của trang. Trang live phóng cả khung bằng transform scale (hệ số KH.k)
// nên khoảng cách đo trên màn phải chia lại cho hệ số đó.
const KH = { k: 1 };
function trongTrang(r, t = $('#trang').getBoundingClientRect()) {
  const k = KH.k;
  return { left: (r.left - t.left) / k, right: (r.right - t.left) / k, top: (r.top - t.top) / k, bottom: (r.bottom - t.top) / k, width: r.width / k, height: r.height / k };
}

function hop(e) {
  const t = $('#trang').getBoundingClientRect();
  const rs = [...e.getClientRects()].filter((r) => r.width || r.height);
  if (!rs.length) rs.push(e.getBoundingClientRect());
  const q = rs.map((r) => trongTrang(r, t));
  const x1 = Math.min(...q.map((r) => r.left)), y1 = Math.min(...q.map((r) => r.top));
  const x2 = Math.max(...q.map((r) => r.right)), y2 = Math.max(...q.map((r) => r.bottom));
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

// Đầu thước chạm ngay dưới chữ. Chỉ cả khối thì chỉ vào chỗ đáng nhìn nhất của khối: chỗ trống của bài tập, câu tiếng Anh,
// tiêu đề phần, hoặc dòng đầu.
function diemChi(e) {
  const t = $('#trang').getBoundingClientRect();
  if (e.tagName !== 'SPAN') e = $('.trong, .en, .heading', e) || e;
  let r;
  if (e.tagName === 'SPAN') r = trongTrang(e.getClientRects()[0] || e.getBoundingClientRect(), t);
  else { const b = trongTrang(e.getBoundingClientRect(), t); r = { left: b.left, width: 48, bottom: b.top + Math.min(b.height, 24) }; }
  return { x: r.left + Math.min(r.width / 2, 30), y: r.bottom + 5 };
}

// Đưa thước đi qua các điểm (toạ độ trong #trang). den: thời gian bay từ chỗ cũ tới điểm đầu; quet: thời gian đi hết các điểm,
// mỗi điểm có t (0–1) là lúc tới điểm đó trong khoảng quet. Chạy bằng Web Animations, vị trí cuối ghi luôn vào style.
function diThuoc(diem, den, quet) {
  const th = $('#thuoc');
  if (!th || !diem.length) return;
  // Thước dốc để thân thước đi xuống nhanh, ít đè lên dòng chữ bên dưới; chỗ thước dừng nằm bên phải thì thước chìa sang trái
  const goc = diem[diem.length - 1].x > $('#trang').clientWidth * 0.58 ? 122 : 58;
  const tf = (p) => `translate(${p.x.toFixed(1)}px, ${(p.y - 5.5).toFixed(1)}px) rotate(${goc}deg)`;
  const cu = th.classList.contains('hien') ? S.thuocTf : null;
  th.getAnimations().forEach((a) => a.cancel());
  const bay = cu ? den : 0;
  const tong = bay + quet;
  const kf = cu ? [{ transform: cu, offset: 0, easing: 'cubic-bezier(.45, .05, .2, 1)' }] : [];
  // Kẹp trong [0, 1]: cộng số thực có thể ra 1.0000000000000002 làm animate() báo lỗi, thước đứng im
  for (const p of diem) kf.push({ transform: tf(p), offset: tong ? Math.min(1, Math.max(0, (bay + p.t * quet) / tong)) : 0, easing: 'linear' });
  S.thuocTf = tf(diem[diem.length - 1]);
  th.style.transform = S.thuocTf;
  th.classList.add('hien');
  if (tong > 0 && kf.length > 1) th.animate(kf, { duration: tong / toc() });
}

// Chỉ thước vào một chỗ rồi gõ nhẹ hai cái
function chiThuoc(e) {
  const th = $('#thuoc');
  if (!th || !e.offsetParent) return;
  S.thuocEl = e;
  diThuoc([{ ...diemChi(e), t: 0 }], 600, 0);
  th.classList.remove('go');
  void th.offsetWidth;
  th.classList.add('go');
}

// Các dòng chữ của một chỗ nhấn (bỏ nhãn nhỏ như "GHI NHỚ"): mỗi dòng có x1, x2, y (đáy chữ) và các chữ trên dòng
function cacDong(e) {
  const t = $('#trang').getBoundingClientRect();
  const dong = [];
  for (const w of $$('.tu', e)) {
    if (!w.offsetParent || w.closest('.nhan-gn, .nhan-vd, .nhan-bt')) continue;
    const r = trongTrang(w.getBoundingClientRect(), t);
    let d = dong.find((x) => Math.abs(x.top - r.top) < r.height / 2);
    if (!d) dong.push((d = { top: r.top, x1: Infinity, x2: -Infinity, y: 0, tu: [] }));
    d.x1 = Math.min(d.x1, r.left);
    d.x2 = Math.max(d.x2, r.right);
    d.y = Math.max(d.y, r.bottom);
    d.tu.push({ w, cx: (r.left + r.right) / 2 });
  }
  return dong;
}

// Chữ phóng to rồi thu lại, đúng lúc tre (ms)
function nay(w, tre) {
  w.style.setProperty('--tre', `${Math.max(0, Math.round(tre / toc()))}ms`);
  w.classList.remove('nay', 'vao');
  void w.offsetWidth;
  w.classList.add('nay');
  setTimeout(() => w.classList.remove('nay'), tre / toc() + 700);
}

function taoLaze(d, kieu, tre, dai) {
  const v = document.createElement('div');
  v.className = `laze ${kieu}${tre == null ? ' tinh' : ''}`;
  Object.assign(v.style, { left: `${d.x1}px`, top: `${d.y + 1}px`, width: `${d.x2 - d.x1}px` });
  if (tre != null) { v.style.setProperty('--tre', `${Math.round(tre / toc())}ms`); v.style.setProperty('--dai-quet', `${Math.round(dai / toc())}ms`); }
  $('#lop').appendChild(v);
  return v;
}

// Thước lướt từ đầu tới cuối chỗ nhấn: chữ nào thước đi qua thì đổi màu, đậm lên, phóng to rồi thu lại; sau lưng thước là vệt laze
function quet(e, i, kieu) {
  const dong = cacDong(e);
  if (!dong.length) return chiThuoc(e);
  S.thuocEl = e;
  const tong = dong.reduce((s, d) => s + (d.x2 - d.x1), 0) || 1; // cộng đúng như da bên dưới để điểm cuối có t = 1
  const thoiGian = Math.min(1600, Math.max(450, tong * 3.6));
  const den = $('#thuoc').classList.contains('hien') ? 550 : 120;
  const diem = [];
  const rec = { el: e, kieu, divs: [] };
  let da = 0;
  for (const d of dong) {
    const dai = d.x2 - d.x1;
    diem.push({ x: d.x1, y: d.y + 4, t: da / tong }, { x: d.x2, y: d.y + 4, t: (da + dai) / tong });
    rec.divs.push(taoLaze(d, kieu, den + (da / tong) * thoiGian, (dai / tong) * thoiGian));
    for (const o of d.tu) nay(o.w, den + ((da + o.cx - d.x1) / tong) * thoiGian - 60);
    da += dai;
  }
  diThuoc(diem, den, thoiGian);
  S.laze.push(rec);
  (S.dau[i] ||= []).push({ laze: rec });
}

// Khối mới hiện: các chữ lần lượt nảy lên. Trả về thời gian (ms) tới lúc phần lớn chữ đã hiện, để thao tác sau chờ.
function nayVao(cacKhoi) {
  const tu = [...new Set(cacKhoi.flatMap((u) => $$('.tu', u)))].filter((w) => w.offsetParent);
  if (!tu.length) return 0;
  const cach = Math.min(30, 700 / tu.length);
  tu.forEach((w, k) => {
    w.style.setProperty('--tre', `${Math.round((k * cach) / toc())}ms`);
    w.classList.remove('nay');
    w.classList.add('vao');
  });
  const het = tu.length * cach + 460;
  setTimeout(() => tu.forEach((w) => w.classList.remove('vao')), het / toc() + 80);
  return Math.round(het * 0.7);
}

function veVong(v, moi) {
  const b = hop(v.el);
  const px = 8, py = 6, W = b.w + px * 2, H = b.h + py * 2;
  Object.assign(v.svg.style, { left: `${b.x - px}px`, top: `${b.y - py}px`, width: `${W}px`, height: `${H}px` });
  v.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  // vòng vẽ tay: hơi méo, đầu cuối chồng lên nhau một đoạn
  const cx = W / 2, cy = H / 2, rx = W / 2 - 1.5, ry = H / 2 - 1.5, a0 = 3.6, n = 48, pts = [];
  for (let k = 0; k <= n; k++) {
    const a = a0 + (k / n) * (Math.PI * 2 + 0.5);
    const s = 1 + 0.025 * Math.sin(3 * a) - 0.04 * (k / n);
    pts.push(`${(cx + rx * s * Math.cos(a)).toFixed(1)},${(cy + ry * s * Math.sin(a)).toFixed(1)}`);
  }
  let path = $('path', v.svg);
  if (!path) { path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); v.svg.appendChild(path); }
  path.setAttribute('d', `M${pts.join('L')}`);
  if (moi) {
    const L = path.getTotalLength();
    path.style.strokeDasharray = L;
    path.style.setProperty('--dai', L);
    path.classList.add('ve');
  }
}

// Khối mới hiện làm phần đang giảng (căn giữa màn) dịch lên: chạy fn rồi trượt êm cả trang từ chỗ cũ về chỗ mới thay vì nhảy.
// Thước, vệt laze, vòng khoanh nằm cùng lớp với trang nên được tính lại theo chỗ mới rồi trượt theo.
function giuCho(fn) {
  const p = $('#trang .phan.dang');
  const truoc = p?.getBoundingClientRect().top;
  const kq = fn();
  if (!p || S.cheDo !== 'gia-su') return kq;
  const d = (truoc - p.getBoundingClientRect().top) / KH.k;
  if (Math.abs(d) > 1) {
    veLai(true);
    $('#trang').animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 420 / toc(), easing: 'cubic-bezier(.3, .7, .2, 1)' });
  }
  return kq;
}

function veLai(nhanh) {
  // Vòng khoanh đi theo chữ của nó: chữ đang ẩn (phần khác, khối chưa hiện) thì ẩn vòng, chữ hiện thì vẽ lại đúng chỗ
  for (const v of S.vong) {
    const thay = !!v.el.offsetParent;
    v.svg.style.display = thay ? '' : 'none';
    if (thay) veVong(v, false);
  }
  // Vệt laze: dựng lại theo dòng chữ mới (giữ trạng thái cũ/mới), không chạy lại hiệu ứng
  for (const r of S.laze) {
    const lop = r.divs[0]?.className.includes(' cu') ? ' cu' : '';
    r.divs.forEach((v) => v.remove());
    r.divs = r.el.offsetParent ? cacDong(r.el).map((d) => { const v = taoLaze(d, r.kieu); if (lop) v.classList.add('cu'); return v; }) : [];
  }
  if (S.thuocEl?.offsetParent) diThuoc([{ ...diemChi(S.thuocEl), t: 0 }], nhanh ? 0 : 300, 0);
}

// Cuộn để chỗ gia sư sắp chỉ nằm trong vùng nhìn, chừa khoảng trắng bên dưới cho thân thước.
// Tính theo vị trí trong #trang (không theo khung đang trượt của giuCho) để không cuộn nhầm lúc trang đang trượt.
function chuaVao(e) {
  const c = $('#cuon'), t = $('#trang');
  const r = trongTrang(e.getBoundingClientRect());
  const viTri = r.top + t.offsetTop;
  const tren = viTri - c.scrollTop;
  if (tren >= 16 && tren + Math.min(r.height, 120) + 110 <= c.clientHeight) return;
  c.scrollTo({ top: Math.max(0, viTri - c.clientHeight * 0.3), behavior: document.body.classList.contains('tuc') ? 'auto' : 'smooth' });
}

// ---------- Thao tác của gia sư ----------
function dauMoi(i, e, cls) {
  e.classList.add(cls, 'moi');
  (S.dau[i] ||= []).push({ e, cls });
}

// Hiện e cùng các khối chứa nó (nếu chưa hiện). Trả về các khối vừa hiện.
function hienRa(e, i) {
  const moi = [];
  for (let x = e; x && x.id !== 'trang'; x = x.parentElement) {
    if (!x.classList.contains('dv') || x.classList.contains('hien')) continue;
    dauMoi(i, x, 'hien');
    x.classList.add('vua-hien'); // chỉ để chạy hiệu ứng hiện ra một lần
    moi.unshift(x);
  }
  return moi;
}

// Việc làm ngay đầu mỗi bước: vào phần mới thì hiện các khối kịch bản không nhắc tới; bước bài tập thì hiện bài tập
function batDauBuoc(i, nhanh) {
  const b = S.buoc[i];
  const moi = [];
  if (i === 0 || S.buoc[i - 1].phanSo !== b.phanSo) for (const u of $$(`#trang [data-phan="${b.phanSo}"] .dv[data-tu-hien]`)) moi.push(...hienRa(u, i));
  if (b.bai_tap) moi.push(...hienRa(el(b.bai_tap), i));
  if (!nhanh) nayVao(moi);
}
const batDauBuocEm = (i) => giuCho(() => batDauBuoc(i, false));

// Một thao tác của gia sư. Khối chứa chỗ đó chưa hiện thì hiện ra trước (chữ nảy lên), xong mới nhấn.
function lam(h, i, nhanh, ph) {
  const kieu = HANH_DONG.find((k) => k in h);
  const e = kieu && el(h[kieu]);
  if (!e) return;
  if (nhanh) { hienRa(e, i); return danhDau(kieu, e, i, true); }
  const moi = giuCho(() => hienRa(e, i));
  const cho = nayVao(moi);
  chuaVao(e);
  if (kieu === 'tro' || kieu === 'hien' || !cho) danhDau(kieu, e, i, false);
  else hen(() => danhDau(kieu, e, i, false), cho, ph);
}

function danhDau(kieu, e, i, nhanh) {
  if (kieu === 'to' || kieu === 'gach') {
    dauMoi(i, e, e.classList.contains('mk') ? kieu : 'k-to');
    if (!nhanh) return quet(e, i, kieu);
    if (kieu === 'gach') { // tua nhanh: gạch chân để lại nét tĩnh, không lướt
      const rec = { el: e, kieu, divs: cacDong(e).map((d) => taoLaze(d, kieu)) };
      S.laze.push(rec);
      (S.dau[i] ||= []).push({ laze: rec });
    }
    return;
  }
  if (kieu === 'khoanh') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('vong', 'moi');
    $('#lop').appendChild(svg);
    const v = { svg, el: e };
    S.vong.push(v);
    veVong(v, !nhanh);
    (S.dau[i] ||= []).push({ vong: v });
    if (!nhanh) $$('.tu', e).forEach((w, k) => nay(w, 520 + k * 60));
  }
  if (!nhanh) chiThuoc(e);
}

// Gỡ dấu của bước i (khi tua lại hoặc học tiếp lại từ đầu bước)
function goBuoc(i) {
  for (const d of S.dau[i] || []) {
    if (d.vong) { d.vong.svg.remove(); S.vong = S.vong.filter((v) => v !== d.vong); continue; }
    if (d.laze) { d.laze.divs.forEach((v) => v.remove()); S.laze = S.laze.filter((r) => r !== d.laze); continue; }
    const conDung = S.dau.slice(0, i).some((ds) => (ds || []).some((x) => x.e === d.e && x.cls === d.cls));
    if (!conDung) d.e.classList.remove(d.cls);
    d.e.classList.remove('moi', 'vua-hien');
  }
  S.dau[i] = [];
}

// Đưa trang về đúng trạng thái "ngay trước bước i": gỡ dấu các bước ≥ i, áp nhanh (không hiệu ứng) các bước < i chưa áp.
// Trả về true nếu trang có đổi (để tính lại chỗ thước, laze, vòng khoanh).
function denBuoc(i) {
  const doi = S.daApDung >= i || S.daApDung < i - 1;
  for (let k = S.daApDung; k >= i; k--) goBuoc(k);
  S.daApDung = Math.min(S.daApDung, i - 1);
  if (S.daApDung < i - 1) {
    document.body.classList.add('tuc');
    for (let k = S.daApDung + 1; k < i; k++) {
      S.dau[k] = [];
      batDauBuoc(k, true);
      for (const h of S.buoc[k].lam || []) lam(h, k, true);
    }
    S.daApDung = i - 1;
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('tuc')));
  }
  $$('#trang .moi, #trang .vua-hien').forEach((e) => e.classList.remove('moi', 'vua-hien'));
  return doi;
}

// ---------- Giọng đọc ----------
const uocLuong = (s) => Math.max(700, s.length * 62) / toc();
const urlAm = (d) => `/am?l=${d.l}&t=${encodeURIComponent(d.doc)}`;
const ninja = (on) => $('#ninja').classList.toggle('noi', on);

function hen(fn, ms, ph) {
  S.hen.push(setTimeout(() => ph === S.phien && fn(), ms / toc()));
}
function huyHen() { S.hen.forEach(clearTimeout); S.hen = []; }
const nghi = (ms, ph) => new Promise((r) => { S.hen.push(setTimeout(r, ms / toc())); if (ph !== S.phien) r(); });

function docMay(d) {
  return new Promise((xong) => {
    // Live: giọng máy đọc tiếng Việt bằng giọng Anh nghe rất dở trên sóng → im, chỉ chạy phụ đề đủ thời gian
    if (LIVE || !('speechSynthesis' in window)) return setTimeout(xong, uocLuong(d.doc));
    const u = new SpeechSynthesisUtterance(d.doc);
    u.lang = d.l === 'en' ? 'en-US' : 'vi-VN';
    const giong = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(d.l === 'en' ? 'en' : 'vi'));
    if (giong) u.voice = giong;
    u.rate = toc();
    let xg = false;
    const k = () => { if (!xg) { xg = true; clearTimeout(t); xong(); } };
    const t = setTimeout(k, uocLuong(d.doc) * 2 + 1500);
    u.onend = k;
    u.onerror = k;
    speechSynthesis.speak(u);
  });
}

// Đọc một đoạn: file giọng sinh sẵn trên server; lỗi thì đọc bằng giọng của trình duyệt. Dừng giữa chừng thì xong ngay.
function docDoan(d) {
  if (TAT_TIENG) return new Promise((r) => { S.huy = r; S.hen.push(setTimeout(r, uocLuong(d.doc))); });
  return new Promise((xong) => {
    let xg = false;
    const ket = () => { if (xg) return; xg = true; ninja(false); S.huy = null; xong(); };
    const may = () => { if (!xg) docMay(d).then(ket); };
    S.huy = () => { A.pause(); try { speechSynthesis.cancel(); } catch {} ket(); };
    A.onended = ket;
    A.onerror = may;
    A.src = urlAm(d);
    A.playbackRate = toc();
    ninja(true);
    A.play().then(() => { if (VIDEO) (window.__am ||= []).push({ t: Date.now(), src: A.src }); }) // xuất video: ghép tiếng đúng lúc
      .catch((e) => { if (e.name !== 'AbortError') may(); });
  });
}

function phuDe(doan, k) {
  $('#phu-de .loi').innerHTML = doan.map((d, j) => `<span class="${d.l === 'en' ? 'en ' : ''}${j < k ? 'da' : j === k ? 'dang' : ''}">${esc(d.hien)}</span>`).join('');
}

// dung(): trả true thì thôi đọc tiếp (dùng cho câu tương tác live, tối đa 5 giây)
async function noi(text, ph, dung) {
  const doan = tachLoi(text || '');
  phuDe(doan, 0);
  for (let k = 0; k < doan.length; k++) {
    if (ph !== S.phien || dung?.()) return;
    phuDe(doan, k);
    if (doan[k].l === 'nghi') { await nghi(160, ph); continue; }
    await docDoan(doan[k]);
    if (ph === S.phien && k < doan.length - 1) await nghi(80, ph);
  }
  if (ph === S.phien) phuDe(doan, doan.length);
}

// Tải trước giọng của bước sau để không khựng
function taiTruoc(i) {
  const b = S.buoc[i];
  if (!b || TAT_TIENG) return;
  for (const d of tachLoi(b.noi)) if (d.l !== 'nghi') fetch(urlAm(d)).catch(() => {});
}

// ---------- Chạy bài ----------
async function chayBuoc(i) {
  huyHen();
  S.huy?.();
  const ph = ++S.phien;
  $('#tam-dung').hidden = true;
  if (S.choBT) { el(S.choBT)?.classList.remove('cho'); S.choBT = null; }
  S.i = i;
  S.chay = true;
  const doi = denBuoc(i);
  $$('#lop .vong, #lop .laze').forEach((v) => v.classList.add('cu')); // dấu của câu trước dịu xuống
  const b = S.buoc[i];
  if (S.phanDang !== b.phanSo) { // sang phần mới: xoá bảng, bày phần mới giữa màn, tiêu đề phần nảy lên
    S.phanDang = b.phanSo;
    // Live: báo server đang phát bài / phần nào (ghi kèm bình luận và số người xem trong nhật ký)
    if (LIVE) guiWs({ t: 'phan', bai: S.bai.id, so: S.bai.so, chuong: S.bai.chuong?.so, phan: S.bai.phan[b.phanSo].id });
    $('#thuoc').classList.remove('hien');
    S.thuocEl = null;
    capNhat();
    $('#cuon').scrollTop = 0;
    veLai(true);
    nayVao([$(`#trang [data-phan="${b.phanSo}"] .dau-phan`)]);
  } else {
    capNhat();
    if (doi) veLai(true);
  }
  S.dau[i] = [];
  batDauBuocEm(i);
  for (const h of b.lam || []) hen(() => lam(h, i, false, ph), h.sau || 0, ph);
  S.daApDung = i;
  taiTruoc(i + 1);
  await noi(b.noi, ph);
  if (ph !== S.phien) return;
  if (b.bai_tap) return choBaiTap(b, ph);
  if (b.dich) return choDich(b, ph);
  const sau = S.buoc[i + 1];
  await nghi(!sau || sau.phanSo !== b.phanSo ? giuPhan(b.phanSo) : NGHI_BUOC, ph);
  if (ph === S.phien) tiepTheo();
}

// Nhịp giảng (người dùng chê 23/11/2026: chưa kịp xem đã sang phần sau). Giữa hai câu nghỉ NGHI_BUOC; hết một phần thì giữ cả phần
// trên màn thêm một lúc theo lượng chữ, để kịp đọc cả phần không đọc thành tiếng (nghĩa tiếng Việt của câu ví dụ).
const NGHI_BUOC = 800;
function giuPhan(n) {
  const p = $(`#trang [data-phan="${n}"]`);
  if (!p || $('.bai-tap', p)) return NGHI_BUOC;
  if (VIDEO) return Math.min(4500, Math.max(1800, (800 + p.innerText.length * 22) * 0.7)); // video: người xem tự dừng được
  return Math.min(6000, Math.max(2500, 800 + p.innerText.length * 22));
}

function tiepTheo() {
  if (S.i + 1 < S.buoc.length) chayBuoc(S.i + 1);
  else if (LIVE) baiTiepLive();
  else ketThuc();
}

async function phanHoi(loi, ph) {
  if (!loi) return;
  for (const h of loi.lam || []) hen(() => lam(h, S.i, false, ph), h.sau || 0, ph);
  await noi(loi.noi, ph);
}

function choBaiTap(b, ph) {
  if (LIVE) return hoiLive(b, ph);
  if (S.ketQua[b.bai_tap]?.xong) return phanHoi(b.dung, ph).then(() => ph === S.phien && tiepTheo());
  S.choBT = b.bai_tap;
  const the = el(b.bai_tap);
  the.classList.add('cho');
  $('.nhan-bt', the).textContent = 'Đến lượt bạn';
}

function tamDung(hienBang = true) {
  huyHen();
  S.huy?.();
  S.phien++;
  S.chay = false;
  ninja(false);
  if (hienBang && S.cheDo === 'gia-su') $('#tam-dung').hidden = false;
  capNhat();
}

function hocTiep() {
  $('#tam-dung').hidden = true;
  chayBuoc(S.i); // học lại từ đầu bước đang dở
}

function ketThuc() {
  S.chay = false;
  S.phien++;
  capNhat();
  const bt = Object.values(S.khoi).filter((k) => k.kieu === 'bai_tap');
  const dung = bt.filter((k) => S.ketQua[k.id]?.lanDau).length;
  $('#ket-thuc .ket-qua').textContent = `Bạn làm đúng ngay lần đầu ${dung}/${bt.length} câu bài tập.`;
  $('#ket-thuc').hidden = false;
}

// ---------- Bài tập ----------
function chon(id, j) {
  const k = S.khoi[id], the = el(id);
  const kq = (S.ketQua[id] ||= { lanDau: null, xong: false });
  if (kq.xong) return;
  const nut = $$('.chon', the);
  const dung = j === k.dap_an;
  if (kq.lanDau === null) kq.lanDau = dung;
  $('.loi-giai', the).textContent = (dung ? 'Chính xác! ' : 'Chưa đúng. ') + (k.giai_thich?.[j] || '');
  if (dung) xong(id, j);
  else { nut[j].classList.add('sai'); nut[j].disabled = true; }
  if (S.cheDo !== 'gia-su' || S.choBT !== id) return;
  // Gia sư giảng theo kịch bản: đúng thì khen rồi đi tiếp, sai thì giảng đáp án đó rồi chờ chọn lại
  huyHen();
  S.huy?.();
  const ph = ++S.phien;
  S.chay = true;
  $('#tam-dung').hidden = true;
  capNhat();
  const b = S.buoc[S.i];
  if (dung) {
    S.choBT = null;
    phanHoi(b.dung, ph).then(() => nghi(400, ph)).then(() => ph === S.phien && tiepTheo());
  } else phanHoi(b.sai?.[j] || { noi: 'Chưa đúng, bạn chọn lại nhé.' }, ph);
}

function xong(id, j) {
  const k = S.khoi[id], the = el(id);
  S.ketQua[id].xong = true;
  const nut = $$('.chon', the);
  nut[j].classList.add('dung');
  nut.forEach((n) => { n.disabled = true; });
  const o = $('.trong', the);
  if (o) { o.textContent = k.lua_chon[k.dap_an]; o.classList.add('dien'); }
  $('.xem', the).hidden = true;
  the.classList.remove('cho');
  $('.nhan-bt', the).textContent = 'Bài tập';
}

function xemDapAn(id) {
  const k = S.khoi[id], the = el(id);
  const kq = (S.ketQua[id] ||= { lanDau: null, xong: false });
  if (kq.xong) return;
  if (kq.lanDau === null) kq.lanDau = false;
  xong(id, k.dap_an);
  $('.loi-giai', the).textContent = `Đáp án: ${k.lua_chon[k.dap_an]}. ${k.giai_thich?.[k.dap_an] || ''}`;
  if (S.cheDo !== 'gia-su' || S.choBT !== id) return;
  huyHen();
  S.huy?.();
  const ph = ++S.phien;
  S.chay = true;
  S.choBT = null;
  $('#tam-dung').hidden = true;
  capNhat();
  phanHoi(S.buoc[S.i].bo_qua, ph).then(() => nghi(400, ph)).then(() => ph === S.phien && tiepTheo());
}

// ---------- Dịch câu ----------
// Ngoài live chưa có ô gõ (làm cùng phần hỏi đáp AI): người học dịch trong đầu rồi bấm "Xem đáp án"
function choDich(b, ph) {
  if (LIVE) return hoiDichLive(b, ph);
  if (S.ketQua[b.dich]?.xong) return phanHoi(b.dap, ph).then(() => nghi(NGHI_BUOC, ph)).then(() => ph === S.phien && tiepTheo());
  S.choBT = b.dich;
  const the = el(b.dich);
  the.classList.add('cho');
  $('.nhan-bt', the).textContent = 'Đến lượt bạn: dịch thử rồi xem đáp án';
}

function moDapDich(the) {
  $('.dap-dich', the).hidden = false;
  $('.xem', the).hidden = true;
  the.classList.remove('cho');
}

function xemDich(id) {
  const the = el(id);
  (S.ketQua[id] ||= { lanDau: null, xong: false }).xong = true;
  moDapDich(the);
  $('.nhan-bt', the).textContent = 'Câu tiếng Việt';
  if (S.cheDo !== 'gia-su' || S.choBT !== id) return;
  huyHen();
  S.huy?.();
  const ph = ++S.phien;
  S.chay = true;
  S.choBT = null;
  $('#tam-dung').hidden = true;
  capNhat();
  hen(() => danhDau('to', $('.dap-dich .en', the), S.i, false), 200, ph);
  phanHoi(S.buoc[S.i].dap, ph).then(() => nghi(2500, ph)).then(() => ph === S.phien && tiepTheo());
}

// ---------- Mode ----------
function datCheDo(m) {
  S.cheDo = m;
  document.body.classList.toggle('doc', m === 'doc');
  document.body.classList.toggle('gia-su', m === 'gia-su');
  $$('#che-do button').forEach((b) => b.classList.toggle('dang', b.dataset.cheDo === m));
}

function phanDangXem() {
  const top = $('#cuon').getBoundingClientRect().top + 72;
  const ds = $$('#trang .phan');
  return Number((ds.find((p) => p.getBoundingClientRect().bottom > top) || ds[ds.length - 1]).dataset.phan);
}

function doiCheDo(m) {
  if (m === S.cheDo) return;
  if (m === 'doc') {
    const n = S.buoc[S.i].phanSo;
    tamDung(false);
    datCheDo('doc');
    $('#tam-dung').hidden = true;
    // Cuộn ngay (không đợi khung hình sau): Gia sư chỉ bày một phần, sang Tự đọc cả bài bày ra nên phải giữ đúng chỗ
    $('#cuon').scrollTop = $(`#trang [data-phan="${n}"]`).offsetTop - 24;
    capNhat();
    return;
  }
  // Tự đọc → Gia sư: giảng tiếp từ phần đang xem (vẫn phần cũ thì giữ đúng câu đang dở)
  const n = phanDangXem();
  if (n !== S.buoc[S.i].phanSo) S.i = S.buoc.findIndex((b) => b.phanSo >= n);
  datCheDo('gia-su');
  S.phanDang = -1;
  chayBuoc(S.i);
}

// ---------- Giao diện ----------
function capNhat() {
  const n = S.buoc.length;
  document.body.classList.toggle('chay', S.chay); // Gia sư đang giảng: ẩn phần đầu màn
  $('#phat use').setAttribute('href', S.chay ? '#i-dung' : '#i-phat');
  $('#lui').disabled = S.i <= 0;
  $('#toi').disabled = S.i >= n - 1;
  $('#toc-do').textContent = `${toc()}×`.replace('.', ',');
  const p = S.buoc[S.i]?.phanSo ?? 0;
  $('#dem').textContent = `Phần ${p + 1}/${S.bai.phan.length}`;
  $$('#trang .phan').forEach((e) => e.classList.toggle('dang', Number(e.dataset.phan) === p));
  if (S.cheDo === 'gia-su') $('#tien-do i').style.width = `${((S.i + 1) / n) * 100}%`;
  else tienDoDoc();
}

function tienDoDoc() {
  const c = $('#cuon');
  const max = c.scrollHeight - c.clientHeight;
  $('#tien-do i').style.width = `${max > 0 ? (c.scrollTop / max) * 100 : 100}%`;
}

function nghe(t) {
  const d = { l: 'en', doc: t };
  A.onended = A.onerror = null;
  A.src = urlAm(d);
  A.playbackRate = 1;
  A.play().catch(() => docMay(d));
}

let hetToast;
function toast(t) {
  const e = $('#toast');
  e.textContent = t;
  e.hidden = false;
  clearTimeout(hetToast);
  hetToast = setTimeout(() => { e.hidden = true; }, 2600);
}

function batDau(m) {
  $('#mo-dau').hidden = true;
  try { if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch {}
  datCheDo(m);
  if (m === 'gia-su') chayBuoc(S.i); // gọi ngay trong lần chạm để điện thoại cho phát tiếng
  else capNhat();
  if (Q.get('dung') === '1') setTimeout(() => tamDung(true), 1800);
}

function batSuKien() {
  $('#ve').onclick = () => { location.search = ''; };
  $('#bai-khac').onclick = () => { location.search = ''; };
  $('#hoc-lai').onclick = () => { $('#ket-thuc').hidden = true; dungTrang(); S.i = 0; $('#cuon').scrollTop = 0; chayBuoc(0); };
  $$('[data-bat-dau]').forEach((b) => { b.onclick = () => batDau(b.dataset.batDau); });
  $$('#che-do button').forEach((b) => { b.onclick = () => doiCheDo(b.dataset.cheDo); });
  $('#phat').onclick = () => (S.chay ? tamDung(true) : hocTiep());
  $('#hoc-tiep').onclick = hocTiep;
  $('#lui').onclick = () => S.i > 0 && chayBuoc(S.i - 1);
  $('#toi').onclick = () => S.i < S.buoc.length - 1 && chayBuoc(S.i + 1);
  $('#toc-do').onclick = () => { S.toc = (S.toc + 1) % TOC.length; A.playbackRate = toc(); capNhat(); };
  $('#phu-de-nut').onclick = () => document.body.classList.toggle('tat-phu-de');
  $$('[data-hoi]').forEach((b) => { b.onclick = () => toast('Phần hỏi gia sư (nhắn tin, giọng nói) sẽ thêm sau khi chốt cách trình bày.'); });
  $('#cuon').addEventListener('scroll', () => S.cheDo === 'doc' && tienDoDoc(), { passive: true });
  $('#cuon').addEventListener('click', (e) => {
    const b = e.target.closest('button, [data-doc]');
    if (b?.dataset.bt) return chon(b.dataset.bt, Number(b.dataset.j));
    if (b?.dataset.xem) return xemDapAn(b.dataset.xem);
    if (b?.dataset.dich) return xemDich(b.dataset.dich);
    if (b?.dataset.doc) { if (S.chay) tamDung(true); return nghe(b.dataset.doc); }
    if (!b && S.cheDo === 'gia-su' && S.chay && !LIVE) tamDung(true); // chạm vào bài = tạm dừng
  });
  // Live: cửa sổ bị LIVE Studio che vẫn phải chạy tiếp
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.chay && !LIVE) tamDung(true); });
  document.addEventListener('keydown', (e) => {
    if ($('#hoc').hidden || !$('#mo-dau').hidden || S.cheDo !== 'gia-su') return;
    if (e.key === ' ') { e.preventDefault(); $('#phat').click(); }
    if (e.key === 'ArrowLeft') $('#lui').click();
    if (e.key === 'ArrowRight') $('#toi').click();
  });
  addEventListener('resize', () => requestAnimationFrame(veLai));
}

async function dsBai() {
  $('#ds-bai').hidden = false;
  const ds = await (await fetch('/bai')).json();
  $('#the-bai').innerHTML = ds.map((b) => `<button class="the-bai" data-bai="${esc(b.id)}"><span class="nhan">${esc(b.nhom || '')}</span>`
    + `<span class="heading">${esc(b.ten)}</span><span class="support">${b.so_phan} phần</span></button>`).join('');
  $$('[data-bai]').forEach((b) => { b.onclick = () => { location.search = `?bai=${encodeURIComponent(b.dataset.bai)}`; }; });
}

async function khoiDong() {
  if (Q.get('rong')) $('#app').style.maxWidth = `${Number(Q.get('rong'))}px`; // chụp thử đúng bề rộng điện thoại
  const id = Q.get('bai');
  if (!id) return dsBai();
  const r = await fetch(`/bai/${encodeURIComponent(id)}`);
  if (!r.ok) return dsBai();
  S.bai = await r.json();
  chuanBi();
  dungTrang();
  batSuKien();
  document.title = `${S.bai.ten} · Gia sư Migii`;
  $('#dau .nhom').textContent = S.bai.nhom || '';
  $('#dau .tieu-de').textContent = S.bai.ten;
  $('#mo-dau .nhom').textContent = S.bai.nhom || '';
  $('#mo-dau .tieu-de').textContent = S.bai.ten;
  const soBT = Object.values(S.khoi).filter((k) => k.kieu === 'bai_tap').length;
  const kyTu = S.buoc.reduce((n, b) => n + (b.noi || '').length, 0);
  $('#mo-dau .mo-ta').textContent = `${S.bai.phan.length} phần · ${soBT} bài tập · khoảng ${Math.max(1, Math.round(kyTu / 13 / 60))} phút với gia sư`;
  $('#hoc').hidden = false;
  S.i = Math.min(Math.max(0, Number(Q.get('buoc')) || 0), S.buoc.length - 1);
  datCheDo(Q.get('che-do') === 'doc' ? 'doc' : 'gia-su');
  capNhat();
  if (Q.get('tu-chay') === '1') batDau(S.cheDo);
  else $('#mo-dau').hidden = false;
}

if (!LIVE) khoiDong(); // trang live khởi động trong gia-su-live.js
