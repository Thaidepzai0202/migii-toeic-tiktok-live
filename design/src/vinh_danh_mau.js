#!/usr/bin/env node
// Vẽ vài phương án màn vinh danh (sau mỗi game) để người dùng chọn rồi chỉnh trong Figma (12/11/2026).
// Cùng ngôn ngữ với màn chuẩn bị đã duyệt (Figma node 46:12): nền trắng phủ teal, thanh tên app, Avenir Next, thẻ trắng bo tròn,
// thẻ tải app theo node 46:119. Mọi nội dung nằm trong y 150–1600 (trên khung bình luận TikTok). Không có câu miễn trừ ETS (người dùng bỏ).
//
//   node design/src/vinh_danh_mau.js
//
// Ghi design/out/vinh-danh-phuong-an.html (mọi phương án trên một bảng vẽ) và design/out/vinh-danh-phuong-an/<id>.html (mỗi khung một file).
// Dữ liệu là mẫu: đúng những gì server gửi cho màn vinh danh (top 3: tên, điểm, số câu đúng; người nhanh tay nhất; số câu, người chơi, lượt đúng).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'design', 'out');
const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'public', 'img', f)).toString('base64')}`;
const APP = img('appicon.png');
const NINJA = img('ninja-hero.png');

const D = {
  game: 'Word', no: 1,
  top: [{ name: 'Kim Chi', score: 16, correct: 3 }, { name: 'Bảo Ngân', score: 15, correct: 2 }, { name: 'Đức Anh', score: 14, correct: 3 }],
  fastest: { name: 'Kim Chi', first: 1 },
  stats: { questions: 5, players: 23, correct: 77 },
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MEDAL = ['#f5b400', '#a9b8b5', '#c8814a']; // vàng, bạc, đồng
const RANK = ['#ff0004', '#ddc700', '#0062ff']; // màu top 3 của bảng điểm trong Figma

// ---------- mảnh dùng chung
const crown = (w = 64, color = '#f5b400') => `<svg class="crown" width="${w}" height="${Math.round(w * .72)}" viewBox="0 0 64 46" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 14l13 11L32 5l14 20 13-11-5 28H10z" fill="${color}" stroke="#b98200" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="5" cy="13" r="4.5" fill="${color}"/><circle cx="32" cy="5" r="4.5" fill="${color}"/><circle cx="59" cy="13" r="4.5" fill="${color}"/></svg>`;
const ICON = {
  bolt: `<path d="M13.5 2.5L5 13.5h6.5L10.5 21.5 19 10.5h-6.5z"/>`,
  users: `<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.6c2.6.2 4.6 1.9 5 4.9"/>`,
  check: `<path d="M4 12.5l5 5L20 6.5"/>`,
  list: `<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".6"/><circle cx="4" cy="12" r=".6"/><circle cx="4" cy="18" r=".6"/>`,
};
const icon = (k, size = 34, color = '#1c7a6c') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${ICON[k]}</svg>`;
const av = (p, size, ring, extra = '') => `<div class="av" style="width:${size}px;height:${size}px;border-width:${Math.max(4, Math.round(size * .05))}px;border-color:${ring};font-size:${Math.round(size * .4)}px${extra}">${esc(p.name.trim()[0].toUpperCase())}</div>`;
const site = `<div class="site"><img src="${APP}" alt=""><div class="nm"><b>Migii TOEIC</b><span>Luyện thi TOEIC trên điện thoại</span></div></div><div class="live">● LIVE</div>`;
const appcard = `<div class="app"><img src="${APP}" alt=""><div class="tx"><div class="t1">📲 Ôn lại từ vừa chơi trong app</div>
  <div class="t2"><b>Migii TOEIC</b><em>:</em> Luyện thi TOEIC trên điện thoại</div></div></div>`;
const soon = `<div class="soon">Lượt ${D.no + 1} sắp bắt đầu…</div>`;
const chip = `<div class="chip">Kết thúc ${D.game} · Lượt ${D.no}</div>`;
const frame = (id, body) => `<div class="f" id="${id}">${site}<div class="col">${body}</div></div>`;

// ---------- A: bục 3 bậc, làm sạch (gần bản đang chạy nhất)
const A = frame('a', `${chip}<h1 class="ttl">Vinh danh</h1>
  <div class="pod">${[1, 0, 2].map((i) => {
    const p = D.top[i], h = [270, 214, 176][i];
    return `<div class="pc">${i === 0 ? crown(72) : ''}${av(p, i === 0 ? 176 : 136, MEDAL[i])}<div class="nm">${esc(p.name)}</div>
      <div class="sc">${p.score} điểm</div><div class="blk b${i + 1}" style="height:${h}px"><span>${i + 1}</span><small>${p.correct} câu đúng</small></div></div>`;
  }).join('')}</div>
  <div class="two">
    <div class="card mini"><div class="ic">${icon('bolt')}</div><div><div class="lb">Nhanh tay nhất</div><div class="v">${esc(D.fastest.name)}</div><div class="s">${D.fastest.first} lần trả lời đầu tiên</div></div></div>
    <div class="card mini"><div class="ic">${icon('users')}</div><div><div class="lb">Lượt này</div><div class="v">${D.stats.players} người chơi</div><div class="s">${D.stats.questions} câu · ${D.stats.correct} lượt đúng</div></div></div>
  </div>${appcard}${soon}`);

// ---------- B: quán quân đứng cạnh Ninja (cùng bố cục Ninja + vòng đếm của màn chuẩn bị), hạng 2–3 thành 2 thẻ
const B = frame('b', `${chip}
  <div class="card champ"><img class="ninja" src="${NINJA}" alt="">
    <div class="cw"><div class="badge">QUÁN QUÂN</div><div class="avc">${crown(70)}${av(D.top[0], 168, MEDAL[0])}</div>
      <div class="nm">${esc(D.top[0].name)}</div><div class="pills"><span class="pl pf">${D.top[0].score} điểm</span><span class="pl po">${D.top[0].correct} câu đúng</span></div></div></div>
  <div class="two">${[1, 2].map((i) => `<div class="card duo"><div class="md" style="background:${MEDAL[i]}">${i + 1}</div>${av(D.top[i], 84, '#e4edea')}
    <div class="nm">${esc(D.top[i].name)}</div><div class="sc">${D.top[i].score}<small>điểm</small></div></div>`).join('')}</div>
  <div class="fast">${icon('bolt', 32)}<span>Nhanh tay nhất: <b>${esc(D.fastest.name)}</b> · ${D.fastest.first} lần trả lời đầu tiên</span></div>
  <div class="three">${[[D.stats.questions, 'câu'], [D.stats.players, 'người chơi'], [D.stats.correct, 'lượt đúng']].map(([n, l]) => `<div class="card st"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
  ${appcard}${soon}`);

// ---------- C: bảng xếp hạng dạng hàng (màu top 3 giống bảng điểm trong game: đỏ, vàng, xanh dương)
const C = frame('c', `${chip}<h1 class="ttl">Bảng vinh danh</h1>
  <div class="rows">${D.top.map((p, i) => `<div class="card rw r${i + 1}" style="--c:${RANK[i]}"><div class="rk">${i + 1}</div>
    ${av(p, i === 0 ? 136 : 108, RANK[i])}<div class="who"><div class="nm">${esc(p.name)}${i === 0 ? crown(44) : ''}</div>
    <div class="s">${p.correct} câu đúng${D.fastest.name === p.name ? ` · <span class="tag">${icon('bolt', 22, '#a85600')}nhanh tay nhất</span>` : ''}</div></div>
    <div class="sc">${p.score}<small>điểm</small></div></div>`).join('')}</div>
  <div class="card sum">${icon('list', 34)}<span><b>${D.stats.questions}</b> câu · <b>${D.stats.players}</b> người chơi · <b>${D.stats.correct}</b> lượt đúng</span></div>
  ${appcard}${soon}`);

// ---------- D: thẻ chúc mừng nền teal, Ninja ở góc, hạng 2–3 và số liệu bên dưới
const rnd = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }; // ngẫu nhiên cố định, lần nào vẽ cũng như nhau
const dots = Array.from({ length: 34 }, (_, i) => {
  const x = Math.round(rnd(i + 1) * 930) + 10, y = Math.round(rnd(i + 101) * 590) + 8, c = ['#ffd34d', '#ffffff', '#ff9ab0', '#9ff0df'][i % 4], r = 10 + Math.round(rnd(i + 201) * 8);
  return `<i style="left:${x}px;top:${y}px;width:${r}px;height:${i % 2 ? r : r * 2}px;background:${c};transform:rotate(${Math.round(rnd(i + 301) * 180)}deg)"></i>`;
}).join('');
const Dd = frame('d', `<div class="hero">${dots}<img class="ninja" src="${NINJA}" alt="">
    <div class="kick">CHÚC MỪNG QUÁN QUÂN</div><div class="sub">Kết thúc ${D.game} · Lượt ${D.no}</div>
    <div class="avc">${crown(80)}${av(D.top[0], 196, '#ffffff', ';background:#fff')}</div>
    <div class="nm">${esc(D.top[0].name)}</div><div class="pl">${D.top[0].score} điểm · ${D.top[0].correct} câu đúng</div></div>
  <div class="two">${[1, 2].map((i) => `<div class="card duo"><div class="md" style="background:${MEDAL[i]}">${i + 1}</div>${av(D.top[i], 84, '#e4edea')}
    <div class="nm">${esc(D.top[i].name)}</div><div class="sc">${D.top[i].score}<small>điểm</small></div></div>`).join('')}</div>
  <div class="card strip"><div>${icon('bolt', 32)}<span>Nhanh tay nhất<b>${esc(D.fastest.name)}</b></span></div><i></i>
    <div>${icon('users', 32)}<span>${D.stats.questions} câu · ${D.stats.correct} lượt đúng<b>${D.stats.players} người chơi</b></span></div></div>
  ${appcard}${soon}`);

const OPTIONS = [
  ['a', 'A · Bục 3 bậc', 'Gần bản đang chạy nhất, làm sạch: vương miện, viền huy chương vàng/bạc/đồng, khối bục teal ghi hạng + số câu đúng; 2 thẻ nhỏ nhanh tay nhất / số liệu lượt.', A],
  ['b', 'B · Quán quân + Ninja', 'Cùng bố cục Ninja + vòng đếm của màn chuẩn bị: quán quân đứng cạnh Ninja trong thẻ lớn, hạng 2–3 thành 2 thẻ, 3 ô số liệu.', B],
  ['c', 'C · Bảng xếp hạng', 'Ba hàng xếp hạng, màu top 3 giống bảng điểm trong game (đỏ, vàng, xanh dương); nhãn nhanh tay nhất gắn vào đúng người.', C],
  ['d', 'D · Thẻ chúc mừng', 'Thẻ teal đậm nổi bật quán quân, hoa giấy tĩnh, Ninja ở góc; hạng 2–3 và số liệu gọn bên dưới.', Dd],
];

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
.f { position: relative; width: 1080px; height: 1920px; overflow: hidden; color: #10201e;
  font-family: 'Avenir Next', 'Be Vietnam Pro', system-ui, sans-serif; font-weight: 500;
  background: linear-gradient(180deg, rgba(72, 188, 170, .16) 20.5%, rgba(72, 188, 170, 0) 104.2%), #fff; }
.site { position: absolute; left: 56px; top: 146px; width: 968px; height: 80px; padding: 0 12px; display: flex; align-items: center; gap: 16px; background: #fff; border-radius: 999px; }
.site img { width: 64px; height: 64px; border-radius: 16px; }
.site .nm { display: flex; flex-direction: column; }
.site b { font-size: 36px; line-height: 37.8px; font-weight: 700; color: #1c7a6c; }
.site span { font-size: 25px; line-height: 26.25px; color: #506762; }
.live { position: absolute; right: 81.7px; top: 163px; padding: 6px 12px; border-radius: 999px; background: #d33a49; color: #fff; font-size: 24px; font-weight: 700; }
.col { position: absolute; left: 56px; right: 56px; top: 258px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
.chip { padding: 10px 28px; border-radius: 999px; background: #d3eee8; color: #1c7a6c; font-size: 28px; font-weight: 600; }
.ttl { margin-top: -8px; font-size: 88px; line-height: 92px; font-weight: 700; color: #1c7a6c; }
.card { background: #fff; border-radius: 30px; box-shadow: 2px 2px 10px rgba(28, 122, 108, .2); }
.av { flex: none; display: grid; place-items: center; border-radius: 50%; border-style: solid; background: #d3eee8; color: #1c7a6c; font-weight: 700; line-height: 1; }
.nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.two { width: 100%; display: flex; gap: 16px; }
.three { width: 100%; display: flex; gap: 16px; }
/* thẻ tải app: Figma 46:119 */
.app { width: 100%; display: flex; align-items: center; gap: 26px; padding: 22px 26px; background: #fff; border-radius: 32px; }
.app img { width: 150px; height: 150px; border-radius: 34px; flex: none; }
.app .t1 { font-size: 30px; color: #506762; }
.app .t2 { font-size: 32px; line-height: 44px; color: #10201e; }
.app .t2 b, .app .t2 em { font-size: 40px; font-weight: 600; font-style: normal; }
.app .t2 b { color: #1c7a6c; }
.soon { font-size: 34px; font-weight: 600; color: #3b524e; }

/* A */
#a .pod { width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 20px; margin-top: 8px; }
#a .pc { width: 296px; display: flex; flex-direction: column; align-items: center; }
#a .crown { margin-bottom: -10px; position: relative; z-index: 1; }
#a .pc .nm { max-width: 296px; margin-top: 12px; font-size: 36px; font-weight: 700; }
#a .pc .sc { margin: 2px 0 14px; font-size: 30px; font-weight: 600; color: #1c7a6c; }
#a .blk { width: 100%; border-radius: 30px 30px 0 0; display: flex; flex-direction: column; align-items: center; padding-top: 14px; color: #fff; }
#a .blk span { font-size: 104px; line-height: 1; font-weight: 700; }
#a .blk small { margin-top: 4px; font-size: 26px; font-weight: 600; opacity: .92; }
#a .b1 { background: linear-gradient(180deg, #48bcaa, #2f9e8d); }
#a .b2 { background: linear-gradient(180deg, #8ad3c6, #6cc3b4); }
#a .b3 { background: linear-gradient(180deg, #b4e2d9, #9ad6cb); }
#a .mini { flex: 1; display: flex; align-items: center; gap: 18px; padding: 22px 26px; }
#a .mini .ic, #c .tag svg { flex: none; }
#a .mini .ic { width: 64px; height: 64px; border-radius: 50%; background: #e4f4f1; display: grid; place-items: center; }
#a .mini .lb { font-size: 24px; color: #506762; }
#a .mini .v { font-size: 36px; line-height: 44px; font-weight: 700; color: #1c7a6c; }
#a .mini .s { font-size: 24px; color: #3b524e; }

/* B */
#b .champ { width: 100%; display: flex; align-items: center; gap: 24px; padding: 34px 40px 36px 28px; border-radius: 50px;
  background: linear-gradient(180deg, #fff6d1 0%, #fff 62%); box-shadow: 2px 2px 20px rgba(28, 122, 108, .2); }
#b .ninja { width: 258px; height: 283px; flex: none; object-fit: contain; }
#b .cw { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; }
#b .badge { padding: 8px 24px; border-radius: 999px; background: #f5b400; color: #fff; font-size: 26px; font-weight: 700; letter-spacing: 5px; }
#b .avc { margin-top: 14px; display: flex; flex-direction: column; align-items: center; }
#b .avc .crown { margin-bottom: -12px; position: relative; z-index: 1; }
#b .cw .nm { max-width: 100%; margin-top: 10px; font-size: 68px; line-height: 80px; font-weight: 700; color: #1c7a6c; }
#b .pills { margin-top: 10px; display: flex; gap: 12px; }
#b .pl { padding: 8px 22px; border-radius: 999px; font-size: 30px; font-weight: 600; }
#b .pl.pf { background: #1c7a6c; color: #fff; }
#b .pl.po { border: 2px solid #48bcaa; color: #1c7a6c; }
#b .duo, #d .duo { flex: 1; min-width: 0; display: flex; align-items: center; gap: 16px; padding: 20px 24px; }
.duo .md { flex: none; width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 30px; font-weight: 700; }
.duo .nm { flex: 1; min-width: 0; font-size: 34px; font-weight: 700; }
.duo .sc { flex: none; display: flex; flex-direction: column; align-items: flex-end; font-size: 42px; line-height: 44px; font-weight: 700; color: #1c7a6c; }
.duo .sc small { font-size: 22px; line-height: 24px; font-weight: 500; color: #506762; }
#b .fast { display: flex; align-items: center; gap: 12px; padding: 14px 30px; border-radius: 999px; background: #fff; font-size: 28px; color: #3b524e; }
#b .fast b { color: #1c7a6c; font-weight: 700; }
#b .st { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 18px 10px; }
#b .st b { font-size: 60px; line-height: 70px; font-weight: 700; color: #1c7a6c; }
#b .st span { font-size: 26px; color: #506762; }

/* C */
#c .rows { width: 100%; margin-top: 8px; display: flex; flex-direction: column; gap: 22px; }
#c .rw { position: relative; display: flex; align-items: center; gap: 24px; padding: 30px 36px 30px 28px; overflow: hidden; }
#c .rw::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 12px; background: var(--c); }
#c .rk { flex: none; width: 64px; text-align: center; font-size: 66px; font-weight: 700; color: var(--c); }
#c .r1 { padding-top: 40px; padding-bottom: 40px; background: linear-gradient(90deg, #fff1f1 0%, #fff 55%); }
#c .r1 .rk { font-size: 84px; }
#c .who { flex: 1; min-width: 0; }
#c .who .nm { display: flex; align-items: center; gap: 12px; font-size: 46px; line-height: 56px; font-weight: 700; color: var(--c); }
#c .r1 .who .nm { font-size: 56px; line-height: 66px; }
#c .who .s { margin-top: 4px; font-size: 28px; color: #506762; display: flex; align-items: center; gap: 8px; }
#c .tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 12px; border-radius: 999px; background: #fff1dc; color: #a85600; font-size: 22px; font-weight: 600; }
#c .sc { flex: none; display: flex; flex-direction: column; align-items: flex-end; font-size: 68px; line-height: 70px; font-weight: 700; color: var(--c); }
#c .r1 .sc { font-size: 84px; line-height: 86px; }
#c .sc small { font-size: 22px; line-height: 24px; font-weight: 500; color: #506762; }
#c .sum { width: 100%; display: flex; align-items: center; justify-content: center; gap: 14px; padding: 22px 26px; font-size: 30px; color: #3b524e; }
#c .sum b { color: #1c7a6c; font-weight: 700; }

/* D */
#d .hero { position: relative; width: 100%; height: 620px; overflow: hidden; border-radius: 50px; display: flex; flex-direction: column; align-items: center;
  padding-top: 40px; color: #fff; background: linear-gradient(160deg, #2f9e8d 0%, #1c7a6c 60%, #155f54 100%); }
#d .hero i { position: absolute; border-radius: 4px; opacity: .8; }
#d .hero .ninja { position: absolute; right: -6px; bottom: -14px; width: 214px; height: 235px; object-fit: contain; }
#d .kick { position: relative; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #ffe08a; }
#d .sub { position: relative; margin-top: 4px; font-size: 28px; color: rgba(255, 255, 255, .85); }
#d .avc { position: relative; margin-top: 18px; display: flex; flex-direction: column; align-items: center; }
#d .avc .crown { margin-bottom: -14px; position: relative; z-index: 1; }
#d .hero .nm { position: relative; max-width: 560px; margin-top: 12px; font-size: 80px; line-height: 92px; font-weight: 700; }
#d .hero .pl { position: relative; margin-top: 10px; padding: 10px 30px; border-radius: 999px; background: #fff; color: #1c7a6c; font-size: 32px; font-weight: 700; }
#d .strip { width: 100%; display: flex; align-items: center; padding: 20px 28px; }
#d .strip > div { flex: 1; display: flex; align-items: center; gap: 14px; min-width: 0; }
#d .strip > i { width: 1px; height: 64px; background: #d3e3df; margin: 0 22px; }
#d .strip span { display: flex; flex-direction: column; font-size: 24px; color: #506762; }
#d .strip b { font-size: 34px; line-height: 42px; font-weight: 700; color: #1c7a6c; }
`;

const BOARD = `
body.board { width: max-content; padding: 160px; background: #dfe5e3; font-family: 'Be Vietnam Pro', sans-serif; }
.head h1 { font-size: 96px; line-height: 1.1; font-weight: 800; color: #10201e; }
.head p { margin-top: 24px; max-width: 4600px; font-size: 36px; line-height: 1.5; font-weight: 500; color: #33403d; }
.opts { margin-top: 140px; display: flex; gap: 140px; }
.fr > figcaption { width: 1080px; margin-bottom: 36px; }
.fr > figcaption b { display: block; font-size: 64px; line-height: 1.2; font-weight: 800; color: #1c7a6c; }
.fr > figcaption span { display: block; margin-top: 12px; height: 108px; font-size: 32px; line-height: 1.4; font-weight: 500; color: #33403d; }
`;
const FONT = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700;800&display=swap" rel="stylesheet">`;
const page = (title, cls, body) => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>${FONT}<style>${CSS}${cls === 'board' ? BOARD : 'body { width: 1080px; height: 1920px; }'}</style></head><body class="${cls}">${body}</body></html>`;

fs.mkdirSync(path.join(OUT, 'vinh-danh-phuong-an'), { recursive: true });
const board = page('Màn vinh danh: các phương án', 'board', `<div class="head"><h1>Màn vinh danh (sau mỗi game): các phương án</h1>
  <p>Khung 1080 × 1920, nội dung nằm trong y 150–1600 (trên khung bình luận TikTok). Cùng ngôn ngữ với màn chuẩn bị đã duyệt (Figma 46:12) và thẻ tải app 46:119.
  Dữ liệu mẫu đúng những gì game có: top 3 (tên, điểm, số câu đúng), người nhanh tay nhất, số câu / người chơi / lượt đúng. Tên dài tự cắt "…". Chữ Avenir Next.
  Bản đang chạy: design/out/man-vinh-danh.html.</p></div>
  <div class="opts">${OPTIONS.map(([id, name, note, html]) => `<figure class="fr"><figcaption><b>${esc(name)}</b><span>${esc(note)}</span></figcaption>${html}</figure>`).join('')}</div>`);
fs.writeFileSync(path.join(OUT, 'vinh-danh-phuong-an.html'), board);
for (const [id, name, , html] of OPTIONS) fs.writeFileSync(path.join(OUT, 'vinh-danh-phuong-an', `${id}.html`), page(`Vinh danh ${name}`, 'one', html));
console.log(`Xong: ${OPTIONS.length} phương án → design/out/vinh-danh-phuong-an.html và design/out/vinh-danh-phuong-an/`);
