// Trang phát live của gia sư tự động (?live=1): các bài live chạy nối tiếp, không cần ai bấm. Mở bằng gia-su/live.sh.
// Tới câu hỏi: mở 12 giây cho người xem bình luận A/B/C/D (hoặc gõ đáp án), nhận thêm 3 giây bù độ trễ của TikTok,
// rồi tương tác tối đa 5 giây: cảm ơn người đúng đầu tiên, sửa cho một người sai. Sau đó gia sư nói lý do và chạy tiếp.
// Dịch câu (bài từ vựng): 25 giây cho người xem bình luận câu tiếng Anh, câu gửi lên chạy trên màn; chốt thì hiện câu mẫu
// và nêu bật tối đa 3 bình luận (đúng đầu tiên, đúng cách khác, gần đúng kèm chữ sửa) trong tối đa 10 giây.
// Khung 450×800 (9:16) phóng vừa cửa sổ; nội dung nằm trong vùng TikTok không che (trên 63, dưới 667 — tức y 150–1600 của 1080×1920).
// Thử từ bài bất kỳ: ?live=1&bai-so=12 · thêm người xem ảo: bật server với --sim.
'use strict';
const CHO_TRA_LOI = 12000; // mở câu hỏi (có đồng hồ)
const BU_TRE = 3000; // nhận thêm sau khi hết giờ: bình luận TikTok tới trễ vài giây
const TUONG_TAC = 5000; // tương tác với người xem không quá 5 giây
const LOI_MOI = 'Bạn bình luận đáp án nhé!'; // trùng LOI_LIVE.moi ở server.js (giọng sinh sẵn)
// Mode dịch câu (bài từ vựng): gõ cả câu lâu hơn chọn A/B/C; nêu bật bình luận tối đa 10 giây (người dùng chốt 23/11/2026,
// riêng mode này; trắc nghiệm vẫn 5 giây)
const CHO_DICH = 25000;
const TUONG_TAC_DICH = 10000;
const LOI_DICH = 'Bình luận câu tiếng Anh của bạn nhé!'; // trùng LOI_LIVE.dich ở server.js
const LW = { ws: null, choKet: null, nhuong: false, ds: [], i: 0, ten: [], tong: 0 };
const nghiThat = (ms) => new Promise((r) => setTimeout(r, ms));

function coKhung() {
  // Xem trước video: chừa chỗ cho bảng chọn bên trái (khung vẫn canh giữa cửa sổ)
  KH.k = Math.max(0.4, Math.min((innerWidth - (XEM ? 2 * 264 : 0)) / 450, innerHeight / 800));
  document.documentElement.style.setProperty('--k', KH.k);
}

// ---------- Nối server ----------
function noiWs() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  LW.ws = ws;
  ws.onopen = () => ws.send(JSON.stringify({ t: 'chao' }));
  ws.onmessage = (e) => {
    let m;
    try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'tl') nhanTraLoi(m);
    else if (m.t === 'bl') nhanBinhLuan(m);
    else if (m.t === 'ket') LW.choKet?.(m);
    else if (m.t === 'thay') nhuong();
    else if (m.t === 'phien') {
      // Server vừa bật lại (mã phiên đổi): tải lại trang để nhận code mới; bài học tiếp từ đầu bài đang dở (vị trí lưu ở server)
      if (LW.phienServer && m.id !== LW.phienServer && !LW.nhuong) location.reload();
      LW.phienServer = m.id;
    }
  };
  ws.onclose = () => { if (!LW.nhuong) setTimeout(noiWs, 2000); };
}
const guiWs = (m) => { try { if (LW.ws?.readyState === 1) LW.ws.send(JSON.stringify(m)); } catch {} };

// Một trang live khác vừa mở: trang này dừng hẳn để không phát trùng tiếng
function nhuong() {
  LW.nhuong = true;
  huyHen();
  S.huy?.();
  S.phien++;
  clearTimeout(hetToast);
  $('#toast').textContent = 'Trang live đã mở ở cửa sổ khác, cửa sổ này dừng.';
  $('#toast').hidden = false;
}

// ---------- Câu hỏi ----------
function nhanTraLoi(m) {
  const the = S.choBT && el(S.choBT);
  if (!the) return;
  const so = $$('.chon .so', the)[m.j];
  if (so) {
    so.textContent = String((Number(so.textContent) || 0) + 1);
    so.classList.remove('nay');
    void so.offsetWidth;
    so.classList.add('nay');
  }
  LW.ten = [m.ten, ...LW.ten.filter((t) => t !== m.ten)];
  LW.tong++;
  const ds = LW.ten.slice(0, 3);
  $('.nguoi', the).textContent = `${ds.join(', ')}${LW.tong > ds.length ? ` và ${LW.tong - ds.length} bạn khác` : ''} đã trả lời`;
}

function chotLive() {
  return new Promise((r) => {
    const t = setTimeout(() => { LW.choKet = null; r({}); }, 1500);
    LW.choKet = (m) => { clearTimeout(t); LW.choKet = null; r(m); };
    guiWs({ t: 'dong' });
  });
}

// Đọc một câu nhưng không quá ms (hết giờ thì cắt ngang)
function noiToiDa(text, ph, ms) {
  let het = false;
  const t = setTimeout(() => { het = true; S.huy?.(); }, ms);
  return noi(text, ph, () => het).finally(() => clearTimeout(t));
}

// ---------- Xuất video ----------
// Không có người xem trả lời trực tiếp: hiện câu hỏi, đếm 10 giây, rồi hiện đáp án. Không đọc câu mời bình luận
// (người dùng chốt 25/11/2026: bỏ "bình luận nhé", cho chạy 10 giây rồi hiện đáp án).
const DEM_VIDEO = 10000;
async function hoiVideo(b, ph, kieu) {
  const id = kieu === 'tn' ? b.bai_tap : b.dich;
  const k = S.khoi[id];
  const the = el(id);
  const nhan = $('.nhan-bt', the);
  const gio = $('.dem-gio i', the);
  S.ketQua[id] ||= { lanDau: null, xong: false };
  the.classList.add('cho', 'live-mo');
  const goc = nhan.textContent; // "Bài tập" / "Câu tiếng Việt"
  gio.style.width = '100%';
  const tong = DEM_VIDEO;
  const het = Date.now() + tong;
  while (Date.now() < het && ph === S.phien) {
    const con = het - Date.now();
    nhan.textContent = `${goc} · ${Math.ceil(con / 1000)}`;
    gio.style.width = `${(con / tong) * 100}%`;
    await nghiThat(100);
  }
  if (ph !== S.phien) return;
  the.classList.remove('live-mo');
  nhan.textContent = 'Đáp án';
  if (kieu === 'tn') {
    xong(id, k.dap_an);
    $('.loi-giai', the).textContent = k.giai_thich?.[k.dap_an] || '';
    await noi(b.bo_qua.noi, ph);
  } else {
    S.ketQua[id].xong = true;
    giuCho(() => { the.classList.add('da-chot'); moDapDich(the); });
    const cho = nayVao([$('.dap-dich', the)]);
    hen(() => danhDau('to', $('.dap-dich .en', the), S.i, false), cho, ph);
    await noi(b.dap.noi, ph);
  }
  if (ph !== S.phien) return;
  await nghi(1800, ph);
  if (ph === S.phien) tiepTheo();
}

async function hoiLive(b, ph) {
  if (VIDEO) return hoiVideo(b, ph, 'tn');
  const id = b.bai_tap;
  const k = S.khoi[id];
  const the = el(id);
  const nhan = $('.nhan-bt', the);
  const gio = $('.dem-gio i', the);
  S.choBT = id;
  LW.ten = [];
  LW.tong = 0;
  the.classList.add('cho', 'live-mo');
  guiWs({ t: 'mo', id: `${S.bai.id}/${id}`, chon: k.lua_chon, dap: k.dap_an });
  const chu = k.lua_chon.map((_, j) => 'ABCDEF'[j]).join(' · ');
  const het = Date.now() + CHO_TRA_LOI;
  const dem = () => {
    const con = Math.max(0, het - Date.now());
    nhan.textContent = `Bình luận ${chu} · ${Math.ceil(con / 1000)} giây`;
    gio.style.width = `${(con / CHO_TRA_LOI) * 100}%`;
  };
  dem();
  const dongHo = setInterval(dem, 250);
  await noi(LOI_MOI, ph);
  while (Date.now() < het && ph === S.phien) await nghiThat(200);
  clearInterval(dongHo);
  if (ph !== S.phien) return;
  nhan.textContent = 'Đang chốt đáp án…';
  await nghiThat(BU_TRE);
  if (ph !== S.phien) return;
  const ket = await chotLive();
  if (ph !== S.phien) return;
  S.choBT = null;
  S.ketQua[id] ||= { lanDau: null, xong: false };
  xong(id, k.dap_an);
  the.classList.remove('live-mo');
  nhan.textContent = 'Đáp án';
  $('.loi-giai', the).textContent = k.giai_thich?.[k.dap_an] || '';
  if (ket.cam_on) $('.nguoi', the).textContent = `Đúng đầu tiên: ${ket.cam_on.ten}`;
  // Tương tác với người xem: tối đa 5 giây cho cả lời cảm ơn lẫn lời sửa
  const t0 = Date.now();
  for (const x of [ket.cam_on, ket.sua].filter(Boolean)) {
    const con = TUONG_TAC - (Date.now() - t0);
    if (con < 900) break;
    await noiToiDa(x.noi, ph, con);
    if (ph !== S.phien) return;
  }
  // Lời sửa đã nói "đáp án là …" thì gia sư chỉ nói lý do
  await noi(ket.sua && b.giai ? b.giai.noi : b.bo_qua.noi, ph);
  if (ph !== S.phien) return;
  await nghi(1500, ph); // để người xem kịp nhìn đáp án và lời giải trước khi sang câu sau
  if (ph === S.phien) tiepTheo();
}

// ---------- Dịch câu ----------
// Một câu bình luận: chữ của từ vựng cần dùng tô màu; câu gần đúng thì gạch chữ sai, ghi chữ đúng ngay bên cạnh
function cauBl(cac) {
  return (cac || []).map((x) => {
    if (x.k === 'sai') return `<s>${esc(x.w)}</s> <ins>${esc(x.dung)}</ins>`;
    if (x.k === 'them') return `<ins>${esc(x.w)}</ins>`;
    if (x.k === 'bo') return `<s>${esc(x.w)}</s>`;
    return x.n ? `<b>${esc(x.w)}</b>` : esc(x.w);
  }).join(' ');
}

// Câu người xem gửi lên trong lúc chờ (server chỉ gửi câu giống đáp án): 3 câu mới nhất, chưa cho biết đúng sai
function nhanBinhLuan(m) {
  const the = S.choBT && el(S.choBT);
  if (!the?.classList.contains('dich')) return;
  if (m.moi) LW.tong++;
  const bl = $('.bl', the);
  const p = document.createElement('p');
  p.className = 'dong-bl';
  p.innerHTML = `<span class="ten">${esc(m.ten)}</span> ${cauBl(m.cac)}`;
  bl.prepend(p);
  while (bl.children.length > 3) bl.lastElementChild.remove();
  $('.nguoi', the).textContent = `${LW.tong} bạn đã gửi câu`;
}

const NHAN_BL = { cam_on: 'Đúng đầu tiên', khac: 'Cũng đúng', sua: 'Gần đúng' };

async function hoiDichLive(b, ph) {
  if (VIDEO) return hoiVideo(b, ph, 'dich');
  const id = b.dich;
  const k = S.khoi[id];
  const the = el(id);
  const nhan = $('.nhan-bt', the);
  const gio = $('.dem-gio i', the);
  S.choBT = id;
  LW.tong = 0;
  $('.bl', the).innerHTML = '';
  $('.nguoi', the).textContent = '';
  the.classList.add('cho', 'live-mo');
  guiWs({ t: 'mo', kieu: 'dich', id: `${S.bai.id}/${id}`, dap: k.dap, nhan: k.nhan });
  const het = Date.now() + CHO_DICH;
  const dem = () => {
    const con = Math.max(0, het - Date.now());
    nhan.textContent = `Bình luận câu tiếng Anh · ${Math.ceil(con / 1000)} giây`;
    gio.style.width = `${(con / CHO_DICH) * 100}%`;
  };
  dem();
  const dongHo = setInterval(dem, 250);
  await noi(LOI_DICH, ph);
  while (Date.now() < het && ph === S.phien) await nghiThat(200);
  clearInterval(dongHo);
  if (ph !== S.phien) return;
  nhan.textContent = 'Đang chốt…';
  await nghiThat(BU_TRE);
  if (ph !== S.phien) return;
  const ket = await chotLive();
  if (ph !== S.phien) return;
  S.choBT = null;
  (S.ketQua[id] ||= { lanDau: null, xong: false }).xong = true;
  // Hiện câu mẫu (thước lướt qua) và nêu bật tối đa 3 bình luận: đúng đầu tiên, một câu đúng khác, một câu gần đúng
  const so = Number(ket.dem) || 0;
  nhan.textContent = so ? `Đáp án · ${so} bạn đã gửi câu` : 'Đáp án';
  const ds = ['cam_on', 'khac', 'sua'].filter((x) => ket[x]);
  giuCho(() => {
    the.classList.remove('live-mo');
    the.classList.add('da-chot');
    moDapDich(the);
  });
  const cho = nayVao([$('.dap-dich', the)]);
  hen(() => danhDau('to', $('.dap-dich .en', the), S.i, false), cho, ph);
  await noi(b.dap.noi, ph);
  if (ph !== S.phien) return;
  // Đọc xong câu mẫu: cất thước (thân thước đè lên chỗ bình luận) rồi mới hiện các bình luận được nêu bật
  $('#thuoc').classList.remove('hien');
  S.thuocEl = null;
  const hoa = (cac) => cac.map((x, j) => (j ? x : { ...x, w: x.w.charAt(0).toUpperCase() + x.w.slice(1) })); // câu đã chuẩn hoá (chữ thường)
  giuCho(() => {
    $('.noi-bat', the).innerHTML = ds.map((x, j) => `<div class="the-bl ${x}" data-k="${x}" style="--tre:${j * 180}ms">`
      + `<span class="ten">${esc(ket[x].ten)} · ${NHAN_BL[x]}</span><span class="cau">${cauBl(x === 'sua' ? hoa(ket[x].cac) : ket[x].cac)}</span></div>`).join('');
  });
  const t0 = Date.now();
  for (const x of ds) {
    const con = TUONG_TAC_DICH - (Date.now() - t0);
    if (con < 900) break;
    $$('.the-bl', the).forEach((e) => e.classList.toggle('dang', e.dataset.k === x));
    await noiToiDa(ket[x].noi, ph, con);
    if (ph !== S.phien) return;
  }
  $$('.the-bl', the).forEach((e) => e.classList.remove('dang'));
  await nghi(2000, ph); // để người xem kịp nhìn câu mẫu và các câu được nêu bật
  if (ph === S.phien) tiepTheo();
}

// ---------- Video: màn kết (người dùng yêu cầu 25/11/2026; làm lại lần 2: nền trắng, đơn giản, follow kiểu TikTok) ----------
// Bài xong: Ninja lướt qua trên lớp trắng (hiệu ứng đổi màn của game live, img/ninja-dash.gif 1,9 giây); lớp trắng tan thì avatar kênh,
// tên kênh, "Nhớ follow kênh nhé!" bay vào; chạm chấm "+" đỏ dưới avatar: "+" xoay thành dấu tích rồi thu lại (như nút follow trên
// TikTok). Lúc gia sư nói câu thứ hai thì thẻ app Migii TOEIC + App Store / Google Play bay vào. Tên kênh từ ?kenh= (xuat-video.js).
// Hai câu đọc tách riêng để thẻ app hiện đúng lúc gia sư nói tới; trùng LOI_KET ở xuat-video.js (để sinh sẵn giọng).
const LOI_KET = ['Bạn nhớ [follow] kênh để học bài tiếp theo nhé.', 'Và tải app Mi gi Tô ích để luyện thi mỗi ngày!'];
const KENH = (Q.get('kenh') || '').trim().replace(/^@*/, '@').replace(/^@$/, '');
let soLanLuot = 0;

function datLaiKet() {
  $('#ket-video').className = '';
  document.body.classList.remove('ket');
  $('#dash-gs').classList.remove('on');
}

async function doanKet() {
  const ph = S.phien;
  const kv = $('#ket-video');
  datLaiKet();
  $('.k-ten', kv).textContent = KENH || 'Migii TOEIC';
  // Ninja lướt qua: đổi src kèm số đếm để GIF chạy lại từ khung đầu; dưới lớp trắng thì đổi sang màn kết
  const dash = $('#dash-gs');
  $('img', dash).src = `img/ninja-dash.gif?n=${++soLanLuot}`;
  void dash.offsetWidth;
  dash.classList.add('on');
  hen(() => dash.classList.remove('on'), 1950, ph);
  hen(() => document.body.classList.add('ket'), 350, ph);
  const lop = (cls, ms) => hen(() => kv.classList.add(cls), ms, ph);
  lop('b1', 1450); // lớp trắng bắt đầu tan: avatar, tên, tiêu đề bay vào
  lop('b2', 2700); // chạm chấm "+"
  lop('b3', 2830); // "+" xoay thành dấu tích
  lop('b4', 3700); // chấm thu lại
  await nghi(1500, ph);
  if (ph !== S.phien) return;
  await noi(LOI_KET[0], ph);
  if (ph !== S.phien) return;
  lop('b5', 0);
  await noi(LOI_KET[1], ph);
  await nghi(2500, ph);
}

// ---------- Xem trước video (?live=1&video=1&xem=1) ----------
// Mở bằng: node gia-su/xuat-video.js --xem [số bài]. Chạy như lúc xuất video nhưng có tiếng, chọn được bài / phần bắt đầu / chỉ màn kết.
const XEM = VIDEO && Q.get('xem') === '1';
// Nhạc nền lúc xem trước: chọn trong danh sách (server /nhac: public/audio/*.m4a), mức gần như video xuất ra
// (thấp hơn giọng ~12 dB; file nhạc đã chuẩn về cùng độ to; video còn hạ nhạc thêm lúc gia sư đọc)
const NHAC_XEM_TO = 0.14;
const nhacXem = Object.assign(new Audio(), { loop: true, volume: NHAC_XEM_TO, preload: 'none' });
let xemT0 = 0;
let xemDem = 0;
let nhacGiam = 0;

function chonNhac() {
  clearInterval(nhacGiam);
  const f = $('#xt-nhac').value;
  if (!f) { nhacXem.pause(); return; }
  const src = new URL(`audio/${f}`, location.href).href;
  if (nhacXem.src !== src) nhacXem.src = src;
  nhacXem.volume = NHAC_XEM_TO;
  if (S.chay || document.body.classList.contains('ket')) nhacXem.play().catch(() => {});
}

function lenhXuat() {
  const f = $('#xt-nhac').value;
  $('#xt-lenh').textContent = `node gia-su/xuat-video.js ${S.bai.so}${KENH ? ` --kenh ${KENH.slice(1)}` : ''}${f ? ` --nhac ${f}` : ' --khong-nhac'}`;
}

function dienPhanXem() {
  $('#xt-tu').innerHTML = `<option value="0">Đầu bài</option>${S.bai.phan.map((p, n) => n ? `<option value="${n}">Phần ${n + 1}: ${esc(p.tieu_de)}</option>` : '').join('')}<option value="ket">Màn kết</option>`;
  lenhXuat();
}

function dungXem() {
  huyHen();
  S.huy?.();
  S.phien++;
  S.chay = false;
  datLaiKet();
  clearInterval(xemDem);
}

async function xemTu(tu) {
  dungXem();
  if (S.bai?.id !== LW.ds[LW.i].id) { await taiBaiLive(); dienPhanXem(); } else { chuanBi(); dungTrang(); S.i = 0; S.phanDang = -1; }
  S.chay = true;
  nhacXem.currentTime = 0;
  chonNhac();
  xemT0 = Date.now();
  const trang = $('#xt-trang');
  xemDem = setInterval(() => {
    const s = Math.round((Date.now() - xemT0) / 1000);
    const b = S.buoc[S.i];
    trang.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · ${document.body.classList.contains('ket') ? 'màn kết' : `phần ${(b?.phanSo ?? 0) + 1}/${S.bai.phan.length}`}`;
  }, 250);
  if (tu === 'ket') return baiTiepLive();
  const i = Math.max(0, S.buoc.findIndex((b) => b.phanSo === Number(tu)));
  chayBuoc(i);
}

function xemXong() {
  clearInterval(xemDem);
  const s = Math.round((Date.now() - xemT0) / 1000);
  $('#xt-trang').textContent = `Hết · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}. Bấm Xem để xem lại.`;
  clearInterval(nhacGiam);
  nhacGiam = setInterval(() => {
    nhacXem.volume = Math.max(0, nhacXem.volume - 0.01);
    if (!nhacXem.volume) { clearInterval(nhacGiam); nhacXem.pause(); }
  }, 80);
}

async function khoiDongXem() {
  $('#xem-truoc').hidden = false;
  $('#xt-bai').innerHTML = LW.ds.map((b, i) => `<option value="${i}">${b.so}. ${esc(b.ten)}</option>`).join('');
  $('#xt-bai').value = LW.i;
  const ds = await (await fetch('/nhac')).json().catch(() => []);
  $('#xt-nhac').innerHTML = ds.map((n) => `<option value="${esc(n.file)}">${esc(n.ten)}</option>`).join('') + '<option value="">Không nhạc</option>';
  if (Q.get('nhac') != null) $('#xt-nhac').value = Q.get('nhac');
  await taiBaiLive();
  dienPhanXem();
  $('#xt-bai').onchange = async (e) => { dungXem(); nhacXem.pause(); LW.i = Number(e.target.value); await taiBaiLive(); dienPhanXem(); $('#xt-trang').textContent = 'Bấm Xem để chạy (có tiếng).'; };
  $('#xt-xem').onclick = () => xemTu($('#xt-tu').value);
  $('#xt-ket').onclick = () => xemTu('ket');
  $('#xt-nhac').onchange = () => { chonNhac(); lenhXuat(); };
  if (Q.get('tu')) xemTu(Q.get('tu')); // chụp thử: ?tu=ket
}

// ---------- Bài nối tiếp ----------
function baiTiepLive() {
  S.chay = false;
  if (VIDEO) { // xuất video: một bài, rồi màn kết (follow kênh + tải app) là xong
    const ph = S.phien;
    doanKet().then(() => {
      if (ph !== S.phien) return;
      window.__xongVideo = Date.now();
      if (XEM) xemXong();
    });
    return;
  }
  LW.i = (LW.i + 1) % LW.ds.length;
  setTimeout(moBaiLive, 1500);
}

async function taiBaiLive() {
  const b = LW.ds[LW.i];
  const r = await fetch(`/bai/${encodeURIComponent(b.id)}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  S.bai = await r.json();
  chuanBi();
  dungTrang();
  S.i = 0;
  S.phanDang = -1;
  document.title = `${S.bai.ten} · Gia sư Migii`;
}

async function moBaiLive() {
  if (LW.nhuong) return;
  guiWs({ t: 'vi_tri', i: LW.i });
  try {
    await taiBaiLive();
  } catch (e) {
    console.warn('Không mở được bài', LW.ds[LW.i].id, e);
    LW.i = (LW.i + 1) % LW.ds.length;
    return setTimeout(moBaiLive, 2000);
  }
  if (VIDEO) { // xuất video: bày xong trang thì chờ bên ghi hình báo bắt đầu
    window.__sanSang = true;
    while (!window.__batDau) await nghiThat(50);
  }
  chayBuoc(0);
}

async function khoiDongLive() {
  document.body.classList.add('live');
  if (VIDEO) document.body.classList.add('video'); // video: không phụ đề, bài chiếm chỗ dock
  coKhung();
  addEventListener('resize', coKhung);
  datCheDo('gia-su');
  $('#hoc').hidden = false;
  batSuKien();
  if (!VIDEO) noiWs(); // xuất video không nối server live (không mở phiên câu hỏi, không giành quyền dẫn bài)
  const ds = (await (await fetch('/bai')).json()).filter((b) => b.live).sort((a, b) => a.so - b.so);
  if (!ds.length) return toast('Chưa có bài live: chạy npm run build:gia-su');
  LW.ds = ds;
  const tu = Number(Q.get('bai-so')) ? Number(Q.get('bai-so')) - 1 : (await (await fetch('/live/vi-tri')).json()).i || 0;
  LW.i = ((tu % ds.length) + ds.length) % ds.length;
  if (XEM) return khoiDongXem();
  moBaiLive();
}

if (LIVE) khoiDongLive();
