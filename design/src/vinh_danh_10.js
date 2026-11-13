#!/usr/bin/env node
// 10 phương án màn vinh danh để người dùng chọn (13/11/2026, người dùng chê bản đang chạy xấu).
//
//   node design/src/vinh_danh_10.js
//
// Ghi design/out/vinh-danh-10.html (cả 10 khung thu nhỏ trên một trang, bấm vào để xem cỡ thật) và design/out/vinh-danh-10/<số>.html.
// Mỗi khung 1080×1920, nội dung nằm trong y 150–1600 (mép trên bị thanh tên kênh che, dưới bị khung bình luận che). Không có câu ETS.
// Dữ liệu mẫu = đúng những gì server gửi cho màn vinh danh: top 3 (tên, điểm, số câu đúng), người nhanh tay nhất, số câu / người chơi / lượt đúng.
// Font Avenir Next lấy của máy (không nhúng). Ảnh Ninja lấy từ asset app iOS (đã chép vào design/out/linh-vat/) và public/img.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'design', 'out');
const b64 = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const IOS = '/Users/apple/StudioProjects/migii_toeic_ios/Migii Toeic/Assets.xcassets/image';
const one = (dir) => path.join(dir, fs.readdirSync(dir).find((f) => /\.png$/i.test(f)));
const IMG = {
  app: b64(path.join(ROOT, 'public/img/appicon.png')),
  hero: b64(path.join(ROOT, 'public/img/ninja-hero.png')),
  cup: b64(one(path.join(IOS, 'img_character_top_1.imageset'))), // Ninja nâng cúp số 1
  dance: b64(one(path.join(IOS, 'img_character_top_3.imageset'))), // Ninja nhảy mừng
  wink: b64(one(path.join(IOS, 'img_character_premium.imageset'))), // Ninja nháy mắt trong vòng tròn
};

const D = {
  game: 'Word', no: 1,
  top: [{ name: 'Kim Chi', score: 46, correct: 8 }, { name: 'Bảo Ngân', score: 38, correct: 7 }, { name: 'Đức Anh', score: 31, correct: 7 }],
  fastest: { name: 'Kim Chi', first: 4 },
  stats: { questions: 10, players: 23, correct: 77 },
};
const [P1, P2, P3] = D.top;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const GOLD = '#f5b400', SILVER = '#a9b8b5', BRONZE = '#c8814a', MED = [GOLD, SILVER, BRONZE];
const rnd = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); }; // giả ngẫu nhiên, lần nào chạy cũng ra cùng hình

// ---------- mảnh dùng chung
const crown = (w = 64, c = GOLD, stroke = '#b98200') => `<svg class="crown" width="${w}" height="${Math.round(w * .72)}" viewBox="0 0 64 46"><path d="M5 14l13 11L32 5l14 20 13-11-5 28H10z" fill="${c}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="5" cy="13" r="4.5" fill="${c}"/><circle cx="32" cy="5" r="4.5" fill="${c}"/><circle cx="59" cy="13" r="4.5" fill="${c}"/></svg>`;
const ICON = {
  bolt: '<path d="M13.5 2.5L5 13.5h6.5L10.5 21.5 19 10.5h-6.5z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.6c2.6.2 4.6 1.9 5 4.9"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".6"/><circle cx="4" cy="12" r=".6"/><circle cx="4" cy="18" r=".6"/>',
  star: '<path d="M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3 6.3 20.3l1.1-6.3L2.8 9.5l6.4-.9z"/>',
};
const icon = (k, size = 34, color = '#1c7a6c', fill = 'none') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`;
const av = (p, size, ring = '#fff', bg = '#d3eee8', fg = '#1c7a6c', bw) => `<div class="av" style="width:${size}px;height:${size}px;border:${bw ?? Math.max(4, Math.round(size * .05))}px solid ${ring};font-size:${Math.round(size * .42)}px;background:${bg};color:${fg}">${esc(p.name.trim()[0].toUpperCase())}</div>`;
const confetti = (n, w, h, colors, seed = 1) => [...Array(n)].map((_, i) => {
  const x = rnd(i, seed) * w, y = rnd(i, seed + 7) * h, s = 10 + rnd(i, seed + 3) * 16, r = rnd(i, seed + 5) * 360, c = colors[i % colors.length], round = i % 3 === 0;
  return `<i style="position:absolute;left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${s.toFixed(0)}px;height:${(round ? s : s * .45).toFixed(0)}px;background:${c};border-radius:${round ? '50%' : '3px'};transform:rotate(${r.toFixed(0)}deg)"></i>`;
}).join('');
const laurel = (size, color = GOLD) => { // vòng nguyệt quế: lá xếp theo hai cung hai bên, t = góc tính từ đáy vòng
  const R = size / 2 - size * .07, c = size / 2, leaves = [];
  for (const side of [-1, 1]) for (let k = 0; k < 10; k++) {
    const t = 16 + k * 15.5, rad = t * Math.PI / 180, x = c + side * R * Math.sin(rad), y = c + R * Math.cos(rad);
    leaves.push(`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(size * .03).toFixed(1)}" ry="${(size * .07).toFixed(1)}" fill="${color}" opacity="${k % 2 ? 1 : .8}" transform="rotate(${(side * (90 - t + 24)).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
  }
  return `<svg class="laurel" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${leaves.join('')}</svg>`;
};
const site = `<div class="site"><i class="mi app"></i><div class="nm"><b>Migii TOEIC</b><span>Luyện thi TOEIC trên điện thoại</span></div><div class="live">● LIVE</div></div>`;
const appcard = `<div class="appc"><i class="mi app"></i><div class="tx"><div class="t1">📲 Ôn lại từ vừa chơi trong app</div><div class="t2"><b>Migii TOEIC</b>: Luyện thi TOEIC trên điện thoại</div></div></div>`;
const soon = `<div class="soon">Lượt ${D.no + 1} sắp bắt đầu…</div>`;
const chip = (t = `Kết thúc ${D.game}`) => `<div class="chip">${esc(t)}</div>`;
const fastLine = `Nhanh tay nhất: <b>${esc(D.fastest.name)}</b> · ${D.fastest.first} lần trả lời đầu tiên`;
const statLine = `<b>${D.stats.questions}</b> câu · <b>${D.stats.players}</b> người chơi · <b>${D.stats.correct}</b> lượt đúng`;
const tiles = [[D.stats.questions, 'câu hỏi'], [D.stats.players, 'người chơi'], [D.stats.correct, 'lượt đúng']];

const BASE = `
*{box-sizing:border-box;margin:0;padding:0}
.f{position:relative;width:1080px;height:1920px;overflow:hidden;background:linear-gradient(180deg,rgba(72,188,170,.16) 20.5%,rgba(72,188,170,0) 104.2%),#fff;font-family:"Avenir Next","Avenir Next LT Pro",-apple-system,"Segoe UI",sans-serif;color:#10201e;font-weight:500}
.f b{font-weight:700}
.mi{display:block;background:center/contain no-repeat;flex:none}
.mi.app{background-image:url(${IMG.app})}.mi.hero{background-image:url(${IMG.hero})}.mi.cup{background-image:url(${IMG.cup})}.mi.dance{background-image:url(${IMG.dance})}.mi.wink{background-image:url(${IMG.wink})}
.site{position:absolute;left:56px;right:56px;top:146px;height:106px;background:#fff;border-radius:60px;display:flex;align-items:center;gap:20px;padding:0 26px;z-index:5}
.site .mi{width:74px;height:74px;border-radius:18px}
.site .nm b{display:block;font-size:38px;line-height:1.05;color:#1c7a6c}.site .nm span{font-size:26px;color:#3b524e}
.live{margin-left:auto;background:#d3eee8;color:#1c7a6c;font-weight:700;font-size:24px;padding:8px 20px;border-radius:999px}
.col{position:absolute;left:56px;right:56px;top:284px;display:flex;flex-direction:column;align-items:center;gap:24px}
.chip{background:#d3eee8;color:#1c7a6c;font-weight:700;font-size:28px;letter-spacing:.08em;text-transform:uppercase;padding:10px 30px;border-radius:999px}
.av{border-radius:50%;display:grid;place-items:center;font-weight:700;flex:none;line-height:1}
.card{background:#fff;border-radius:32px}
.appc{width:100%;color:#10201e;background:#fff;border-radius:32px;padding:22px 26px;display:flex;align-items:center;gap:26px}
.appc .mi{width:104px;height:104px;border-radius:24px}
.appc .t1{font-size:30px;color:#506762}.appc .t2{font-size:32px;line-height:44px}.appc .t2 b{font-size:40px;font-weight:600;color:#1c7a6c}
.soon{font-size:34px;font-weight:600;color:#3b524e}
.nm1{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.row{display:flex;align-items:center}
.w100{width:100%}
`;

// ============ 1 · Bục 3 bậc ============
const v1 = { name: 'Bục 3 bậc', note: 'Bục cổ điển làm sạch: vương miện, viền huy chương, khối bục ghi hạng', css: `
#v1 h1{font-size:92px;font-weight:700;color:#1c7a6c;line-height:1}
#v1 .pod{display:flex;align-items:flex-end;gap:18px;width:100%;margin-top:8px}
#v1 .pc{flex:1;display:flex;flex-direction:column;align-items:center;min-width:0}
#v1 .pc .nm1{font-size:38px;font-weight:700;margin-top:12px}
#v1 .pc .sc{font-size:30px;color:#506762;margin-bottom:12px}
#v1 .blk{width:100%;border-radius:28px 28px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff}
#v1 .blk span{font-size:96px;font-weight:700;line-height:1}#v1 .blk small{font-size:26px;opacity:.9}
#v1 .b1{background:linear-gradient(180deg,#2fa392,#1c7a6c);height:300px}#v1 .b2{background:linear-gradient(180deg,#5cc4b3,#3aa594);height:232px}#v1 .b3{background:linear-gradient(180deg,#86d6c8,#5cc4b3);height:186px}
#v1 .base{width:100%;height:16px;border-radius:0 0 16px 16px;background:#16665a;margin-top:-24px}
#v1 .two{display:flex;gap:18px;width:100%}#v1 .mini{flex:1;padding:22px 24px;display:flex;gap:18px;align-items:center}
#v1 .ic{width:68px;height:68px;border-radius:50%;background:#e4f4f1;display:grid;place-items:center;flex:none}
#v1 .lb{font-size:24px;color:#506762}#v1 .v{font-size:34px;font-weight:700}#v1 .s{font-size:24px;color:#506762}`,
  html: `${chip()}<h1>Vinh danh</h1>
  <div class="pod">${[1, 0, 2].map((i) => { const p = D.top[i]; return `<div class="pc">${i === 0 ? crown(76) : ''}${av(p, i === 0 ? 180 : 138, MED[i], '#fff', '#1c7a6c', i === 0 ? 10 : 8)}<div class="nm1">${esc(p.name)}</div><div class="sc">${p.score} điểm</div><div class="blk b${i + 1}"><span>${i + 1}</span><small>${p.correct} câu đúng</small></div></div>`; }).join('')}</div><div class="base"></div>
  <div class="two"><div class="card mini"><div class="ic">${icon('bolt')}</div><div><div class="lb">Nhanh tay nhất</div><div class="v">${esc(D.fastest.name)}</div><div class="s">${D.fastest.first} lần đầu tiên</div></div></div>
  <div class="card mini"><div class="ic">${icon('users')}</div><div><div class="lb">Lượt này</div><div class="v">${D.stats.players} người chơi</div><div class="s">${D.stats.questions} câu · ${D.stats.correct} lượt đúng</div></div></div></div>${appcard}${soon}` };

// ============ 2 · Ninja nâng cúp ============
const v2 = { name: 'Ninja nâng cúp', note: 'Ninja ôm cúp số 1 làm chủ đạo, quán quân trong thẻ lớn ngay dưới', css: `
#v2 .col{gap:20px}
#v2 .mi.cup{width:560px;height:470px;margin:-6px 0 -64px;position:relative;z-index:2}
#v2 .champ{width:100%;padding:76px 36px 30px;display:flex;align-items:center;gap:28px;box-shadow:0 0 0 5px ${GOLD}}
#v2 .champ .t{flex:1;min-width:0}#v2 .lab{font-size:26px;font-weight:700;letter-spacing:.12em;color:#a87400}
#v2 .champ .nm1{font-size:72px;font-weight:700;line-height:1.05}
#v2 .big{font-size:84px;font-weight:700;color:#1c7a6c;line-height:1;text-align:right}#v2 .big small{display:block;font-size:26px;font-weight:500;color:#506762}
#v2 .two{display:flex;gap:18px;width:100%}#v2 .duo{flex:1;padding:20px 22px;display:flex;align-items:center;gap:16px;min-width:0}
#v2 .rk{width:52px;height:52px;border-radius:50%;color:#fff;font-size:30px;font-weight:700;display:grid;place-items:center;flex:none}
#v2 .duo .nm1{font-size:34px;font-weight:700;flex:1}#v2 .duo .sc{font-size:40px;font-weight:700;color:#1c7a6c}
#v2 .strip{width:100%;padding:20px 28px;font-size:30px;display:flex;gap:16px;align-items:center}`,
  html: `${chip()}<i class="mi cup"></i>
  <div class="card champ">${av(P1, 150, GOLD, '#fff7dc', '#a87400', 8)}<div class="t"><div class="lab">QUÁN QUÂN</div><div class="nm1">${esc(P1.name)}</div></div><div class="big">${P1.score}<small>${P1.correct} câu đúng</small></div></div>
  <div class="two">${[P2, P3].map((p, i) => `<div class="card duo"><div class="rk" style="background:${MED[i + 1]}">${i + 2}</div>${av(p, 84, '#e4edea')}<div class="nm1">${esc(p.name)}</div><div class="sc">${p.score}</div></div>`).join('')}</div>
  <div class="card strip">${icon('bolt', 34)}<span>${fastLine}</span></div>${appcard}${soon}` };

// ============ 3 · Bảng xếp hạng có thanh điểm ============
const v3 = { name: 'Bảng xếp hạng', note: 'Ba hàng lớn, thanh điểm dài ngắn theo điểm, dễ so sánh', css: `
#v3 h1{font-size:84px;font-weight:700;color:#10201e;line-height:1}#v3 h1 span{color:#1c7a6c}
#v3 .rw{width:100%;padding:26px 30px;display:flex;align-items:center;gap:24px;position:relative;overflow:hidden}
#v3 .rw.r1{box-shadow:0 0 0 5px ${GOLD};padding:34px 30px}
#v3 .rk{font-size:76px;font-weight:700;width:70px;text-align:center;line-height:1}
#v3 .who{flex:1;min-width:0}#v3 .who .nm1{font-size:44px;font-weight:700}#v3 .r1 .nm1{font-size:54px}
#v3 .bar{height:18px;border-radius:9px;background:#e4edea;margin-top:12px;overflow:hidden}#v3 .bar i{display:block;height:100%;border-radius:9px}
#v3 .sub{font-size:26px;color:#506762;margin-top:8px;display:flex;gap:12px;align-items:center}
#v3 .tag{background:#fff3d6;color:#8a5a00;border-radius:999px;padding:2px 14px;font-weight:600;display:inline-flex;gap:6px;align-items:center}
#v3 .sc{font-size:72px;font-weight:700;line-height:1;text-align:right}#v3 .sc small{display:block;font-size:24px;font-weight:500;color:#506762}
#v3 .three{display:flex;gap:18px;width:100%}#v3 .st{flex:1;padding:20px;text-align:center}#v3 .st b{display:block;font-size:56px;color:#1c7a6c;line-height:1.1}#v3 .st span{font-size:26px;color:#506762}`,
  html: `${chip()}<h1>Bảng <span>vinh danh</span></h1>
  ${D.top.map((p, i) => `<div class="card rw r${i + 1}"><div class="rk" style="color:${['#d99a00', '#7f908c', '#b06a35'][i]}">${i + 1}</div>${av(p, i === 0 ? 132 : 104, MED[i], '#fff', '#1c7a6c', 7)}
    <div class="who"><div class="nm1">${esc(p.name)}</div><div class="bar"><i style="width:${Math.round(100 * p.score / P1.score)}%;background:${MED[i]}"></i></div>
    <div class="sub">${p.correct} câu đúng${p.name === D.fastest.name ? `<span class="tag">${icon('bolt', 22, '#8a5a00')}nhanh tay nhất</span>` : ''}</div></div><div class="sc">${p.score}<small>điểm</small></div></div>`).join('')}
  <div class="three">${tiles.map(([n, l]) => `<div class="card st"><b>${n}</b><span>${l}</span></div>`).join('')}</div>${appcard}${soon}` };

// ============ 4 · Thẻ quán quân teal đậm ============
const v4 = { name: 'Thẻ chúc mừng teal', note: 'Thẻ teal đậm có hoa giấy làm nổi quán quân, điểm trong viên vàng', css: `
#v4 .hero{width:100%;height:640px;border-radius:44px;background:linear-gradient(160deg,#23917f,#125a4f);position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff}
#v4 .hero .cf{position:absolute;inset:0;opacity:.85}
#v4 .hero>*:not(.cf){position:relative}
#v4 .lab{font-size:30px;font-weight:700;letter-spacing:.16em;color:#ffe08a}
#v4 .hero .nm1{font-size:88px;font-weight:700;line-height:1.1;margin-top:14px;padding:0 30px}
#v4 .pill{margin-top:16px;background:${GOLD};color:#3d2c00;font-size:40px;font-weight:700;border-radius:999px;padding:8px 36px}
#v4 .hero .c{font-size:28px;opacity:.9;margin-top:12px}
#v4 .crown{margin-bottom:-10px}
#v4 .two{display:flex;gap:18px;width:100%}#v4 .duo{flex:1;padding:22px;display:flex;align-items:center;gap:16px;min-width:0}
#v4 .rk{font-size:50px;font-weight:700;width:44px;text-align:center}#v4 .duo .t{flex:1;min-width:0}#v4 .duo .nm1{font-size:34px;font-weight:700}#v4 .duo small{font-size:24px;color:#506762}
#v4 .duo .sc{font-size:46px;font-weight:700;color:#1c7a6c}
#v4 .strip{width:100%;padding:20px 28px;font-size:29px;display:flex;gap:14px;align-items:center}`,
  html: `${chip()}<div class="hero"><div class="cf">${confetti(46, 968, 640, ['#ffd34d', '#ff9eb5', '#9ef0e0', '#fff', '#ffb347'], 4)}</div>
    <div class="lab">QUÁN QUÂN ${D.game.toUpperCase()}</div>${crown(86, '#ffd34d', '#b98200')}${av(P1, 210, '#fff', '#e4f4f1', '#1c7a6c', 10)}
    <div class="nm1">${esc(P1.name)}</div><div class="pill">${P1.score} điểm</div><div class="c">${P1.correct} câu đúng · ${D.fastest.name === P1.name ? `nhanh nhất ${D.fastest.first} lần` : ''}</div></div>
  <div class="two">${[P2, P3].map((p, i) => `<div class="card duo"><div class="rk" style="color:${['#7f908c', '#b06a35'][i]}">${i + 2}</div>${av(p, 88, MED[i + 1], '#fff', '#1c7a6c', 6)}<div class="t"><div class="nm1">${esc(p.name)}</div><small>${p.correct} câu đúng</small></div><div class="sc">${p.score}</div></div>`).join('')}</div>
  <div class="card strip">${icon('list', 32)}<span>${statLine}</span></div>${appcard}${soon}` };

// ============ 5 · Sân khấu ánh đèn (nền tối) ============
const v5 = { name: 'Sân khấu ánh đèn', note: 'Nền tối, hai luồng đèn rọi vào quán quân, nổi bật nhất trên video live', css: `
#v5{background:radial-gradient(900px 700px at 50% 34%,#1d6d60 0%,#0c2f2a 60%,#081f1c 100%);color:#fff}
#v5 .beam{position:absolute;top:120px;width:520px;height:1100px;background:linear-gradient(180deg,rgba(255,236,170,.34),rgba(255,236,170,0));clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);filter:blur(6px)}
#v5 .b1{left:120px;transform:rotate(-14deg);transform-origin:50% 0}#v5 .b2{right:120px;transform:rotate(14deg);transform-origin:50% 0}
#v5 .chip{background:rgba(255,255,255,.14);color:#bff1e7}
#v5 h1{font-size:88px;font-weight:700;line-height:1;color:#ffe08a}
#v5 .c1{display:flex;flex-direction:column;align-items:center;margin-top:10px}
#v5 .c1 .av{box-shadow:0 0 0 12px rgba(245,180,0,.25),0 0 90px 20px rgba(255,214,90,.55)}
#v5 .c1 .nm1{font-size:84px;font-weight:700;margin-top:18px;line-height:1.1}
#v5 .c1 .sc{font-size:40px;color:#ffe08a;font-weight:700}#v5 .c1 small{font-size:28px;color:#bfe3dc;font-weight:500}
#v5 .two{display:flex;gap:18px;width:100%;margin-top:6px}
#v5 .g{flex:1;background:rgba(255,255,255,.09);border:2px solid rgba(255,255,255,.16);border-radius:32px;padding:22px;display:flex;align-items:center;gap:16px;min-width:0}
#v5 .g .rk{font-size:48px;font-weight:700;width:40px;text-align:center}#v5 .g .nm1{font-size:34px;font-weight:700;flex:1}#v5 .g .sc{font-size:44px;font-weight:700;color:#8fe6d6}
#v5 .line{width:100%;background:rgba(255,255,255,.09);border-radius:28px;padding:20px 28px;font-size:29px;color:#d9f2ed;display:flex;gap:14px;align-items:center}
#v5 .soon{color:#bfe3dc}`,
  pre: '<div class="beam b1"></div><div class="beam b2"></div>',
  html: `${chip()}<h1>Vinh danh</h1>
  <div class="c1">${crown(96, '#ffd34d', '#b98200')}${av(P1, 250, GOLD, '#fff7dc', '#a87400', 12)}<div class="nm1">${esc(P1.name)}</div><div class="sc">${P1.score} điểm <small>· ${P1.correct} câu đúng</small></div></div>
  <div class="two">${[P2, P3].map((p, i) => `<div class="g"><div class="rk" style="color:${['#d5dedc', '#e2a877'][i]}">${i + 2}</div>${av(p, 88, MED[i + 1], 'rgba(255,255,255,.14)', '#fff', 5)}<div class="nm1">${esc(p.name)}</div><div class="sc">${p.score}</div></div>`).join('')}</div>
  <div class="line">${icon('bolt', 32, '#ffe08a')}<span>${fastLine}</span></div>${appcard}${soon}` };

// ============ 6 · Huy chương ============
const v6 = { name: 'Ba huy chương', note: 'Ba huy chương treo dây vàng, bạc, đồng; ảnh người chơi nằm trong huy chương', css: `
#v6 h1{font-size:84px;font-weight:700;color:#1c7a6c;line-height:1}
#v6 .mds{display:flex;justify-content:center;gap:10px;width:100%;height:640px}
#v6 .md{flex:1;display:flex;flex-direction:column;align-items:center;min-width:0}
#v6 .rb{width:86px;background:linear-gradient(90deg,var(--c1) 0 33%,#fff 33% 67%,var(--c1) 67%);clip-path:polygon(0 0,100% 0,100% 100%,50% 86%,0 100%)}
#v6 .disc{border-radius:50%;display:grid;place-items:center;margin-top:-34px;background:radial-gradient(circle at 32% 26%,var(--hi),var(--c1) 58%,var(--lo));box-shadow:0 10px 0 var(--lo),0 18px 30px rgba(16,32,30,.18);position:relative}
#v6 .num{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);width:64px;height:64px;border-radius:50%;background:#fff;color:var(--lo);font-size:38px;font-weight:700;display:grid;place-items:center;box-shadow:0 0 0 5px var(--c1)}
#v6 .md .nm1{font-size:38px;font-weight:700;margin-top:34px}#v6 .md .sc{font-size:46px;font-weight:700;color:#1c7a6c;line-height:1.1}#v6 .md small{font-size:24px;color:#506762}
#v6 .m1 .nm1{font-size:46px}#v6 .m1 .sc{font-size:60px}
#v6 .strip{width:100%;padding:20px 28px;font-size:29px;display:flex;gap:14px;align-items:center}`,
  html: `${chip()}<h1>Vinh danh</h1>
  <div class="mds">${[1, 0, 2].map((i) => { const p = D.top[i], S = [300, 232, 232][i], R = [190, 250, 290][i], c = [['#f5b400', '#ffe58a', '#b98200'], ['#b9c6c3', '#eef3f2', '#7f908c'], ['#d08b52', '#f3c59f', '#93592a']][i];
    return `<div class="md m${i + 1}" style="--c1:${c[0]};--hi:${c[1]};--lo:${c[2]}"><div class="rb" style="height:${R}px"></div><div class="disc" style="width:${S}px;height:${S}px">${av(p, S - 64, '#fff', '#fff', '#1c7a6c', 6)}<div class="num">${i + 1}</div></div>
    <div class="nm1">${esc(p.name)}</div><div class="sc">${p.score}</div><small>${p.correct} câu đúng</small></div>`; }).join('')}</div>
  <div class="card strip">${icon('bolt', 32)}<span>${fastLine}</span></div><div class="card strip">${icon('list', 32)}<span>${statLine}</span></div>${appcard}${soon}` };

// ============ 7 · Ba thẻ bài xoè ============
const v7 = { name: 'Ba thẻ bài', note: 'Ba thẻ người chơi xoè như bài, thẻ quán quân to và nằm trên cùng', css: `
#v7 h1{font-size:84px;font-weight:700;color:#10201e;line-height:1}
#v7 .fan{position:relative;width:100%;height:630px;margin-top:6px}
#v7 .tc{position:absolute;top:104px;width:360px;height:480px;border-radius:40px;background:#fff;box-shadow:0 18px 40px rgba(16,32,30,.16);display:flex;flex-direction:column;align-items:center;padding:74px 20px 0;overflow:hidden}
#v7 .tc::before{content:'';position:absolute;inset:0 0 auto 0;height:170px;background:var(--c)}
#v7 .tc>*{position:relative}
#v7 .k2{left:0;transform:rotate(-9deg);padding-right:96px}#v7 .k3{right:0;transform:rotate(9deg);padding-left:96px}
#v7 .k1{left:50%;top:0;width:440px;height:604px;margin-left:-220px;padding-top:88px;z-index:2;box-shadow:0 24px 60px rgba(16,32,30,.24),0 0 0 6px ${GOLD}}
#v7 .k1::before{height:230px}
#v7 .rib{position:absolute;top:18px;left:0;right:0;text-align:center;padding:inherit;padding-top:0;font-size:26px;font-weight:700;letter-spacing:.14em;color:#fff;white-space:nowrap}
#v7 .tc .nm1{font-size:36px;font-weight:700;margin-top:16px}#v7 .k1 .nm1{font-size:54px}
#v7 .tc .sc{font-size:76px;font-weight:700;color:#1c7a6c;line-height:1.05}#v7 .k1 .sc{font-size:104px}
#v7 .tc small{font-size:24px;color:#506762}#v7 .k1 small{font-size:28px}
#v7 .strip{width:100%;padding:20px 28px;font-size:29px;display:flex;gap:14px;align-items:center}`,
  html: `${chip()}<h1>Vinh danh</h1>
  <div class="fan">${[1, 2, 0].map((i) => { const p = D.top[i]; return `<div class="tc k${i + 1}" style="--c:${['linear-gradient(160deg,#ffcf4a,#f0a400)', 'linear-gradient(160deg,#c9d4d1,#93a5a1)', 'linear-gradient(160deg,#e0a06a,#b56f36)'][i]}"><div class="rib">${['QUÁN QUÂN', 'HẠNG 2', 'HẠNG 3'][i]}</div>${av(p, i === 0 ? 204 : 150, '#fff', '#e4f4f1', '#1c7a6c', 8)}<div class="nm1">${esc(p.name)}</div><div class="sc">${p.score}</div><small>điểm · ${p.correct} câu đúng</small></div>`; }).join('')}</div>
  <div class="card strip">${icon('bolt', 32)}<span>${fastLine}</span></div><div class="card strip">${icon('list', 32)}<span>${statLine}</span></div>${appcard}${soon}` };

// ============ 8 · Vòng nguyệt quế vàng ============
const v8 = { name: 'Nguyệt quế vàng', note: 'Tông vàng kem trang trọng: quán quân trong vòng nguyệt quế, hạng 2–3 dạng hàng', css: `
#v8{background:linear-gradient(180deg,#fff3cf 0%,#fffaf0 46%,#fff 100%)}
#v8 .col{gap:18px}
#v8 .chip{background:#ffe9a8;color:#8a5a00}
#v8 .lab{font-size:34px;font-weight:700;letter-spacing:.2em;color:#a87400}
#v8 .wr{position:relative;width:430px;height:430px;display:grid;place-items:center;margin:-8px 0 -26px}
#v8 .wr .laurel{position:absolute;inset:0}#v8 .wr .crown{position:absolute;top:14px;left:50%;transform:translateX(-50%);z-index:2}
#v8 .nm1.n1{font-size:80px;font-weight:700;line-height:1.05}
#v8 .sc1{font-size:40px;color:#a87400;font-weight:700}#v8 .sc1 small{color:#6b5a2a;font-weight:500;font-size:28px}
#v8 .rw{width:100%;padding:15px 28px;display:flex;align-items:center;gap:20px;box-shadow:0 0 0 3px #f3e3b3}
#v8 .rk{width:60px;height:60px;border-radius:50%;color:#fff;font-size:34px;font-weight:700;display:grid;place-items:center}
#v8 .rw .nm1{font-size:38px;font-weight:700;flex:1}#v8 .rw small{font-size:26px;color:#6b5a2a}#v8 .rw .sc{font-size:50px;font-weight:700;color:#10201e;width:90px;text-align:right}
#v8 .line{font-size:28px;color:#6b5a2a;display:flex;gap:12px;align-items:center}
#v8 .appc{box-shadow:0 0 0 3px #f3e3b3}`,
  html: `${chip()}<div class="lab">NHÀ VÔ ĐỊCH</div>
  <div class="wr">${laurel(430)}${crown(80)}${av(P1, 204, GOLD, '#fff', '#a87400', 10)}</div>
  <div class="nm1 n1">${esc(P1.name)}</div><div class="sc1">${P1.score} điểm <small>· ${P1.correct} câu đúng</small></div>
  ${[P2, P3].map((p, i) => `<div class="card rw"><div class="rk" style="background:${MED[i + 1]}">${i + 2}</div>${av(p, 84, MED[i + 1], '#fff', '#1c7a6c', 5)}<div class="nm1">${esc(p.name)}</div><small>${p.correct} câu đúng</small><div class="sc">${p.score}</div></div>`).join('')}
  <div class="line">${icon('bolt', 30, '#a87400')}<span>${fastLine}</span></div>${appcard}${soon}` };

// ============ 9 · Chữ lớn tối giản ============
const v9 = { name: 'Chữ lớn tối giản', note: 'Không thẻ, không bóng: số hạng khổng lồ và tên thật to, đọc được cả khi video bị nén', css: `
#v9 .col{align-items:stretch;gap:0;left:72px;right:72px}
#v9 .chip{align-self:flex-start}
#v9 .n{font-size:300px;font-weight:700;line-height:.86;color:transparent;-webkit-text-stroke:5px #48bcaa;margin-top:30px;letter-spacing:-.04em}
#v9 .nm1.n1{font-size:132px;font-weight:700;line-height:1;margin-top:10px;letter-spacing:-.02em}
#v9 .s1{font-size:44px;margin-top:14px;color:#1c7a6c;font-weight:700}#v9 .s1 small{color:#506762;font-weight:500;font-size:32px}
#v9 hr{border:0;border-top:4px solid #10201e;margin:40px 0 0}
#v9 .rw{display:flex;align-items:baseline;gap:24px;padding:26px 0;border-bottom:2px solid #c9d8d4}
#v9 .rw .k{font-size:56px;font-weight:700;color:#48bcaa;width:92px}#v9 .rw .nm1{font-size:56px;font-weight:700;flex:1}#v9 .rw .sc{font-size:56px;font-weight:700}
#v9 .rw small{font-size:28px;color:#506762}
#v9 .meta{font-size:30px;color:#3b524e;margin:30px 0 28px;line-height:1.5}
#v9 .soon{margin-top:24px;text-align:center}`,
  html: `${chip(`Kết thúc ${D.game} · Vinh danh`)}<div class="n">01</div><div class="nm1 n1">${esc(P1.name)}</div><div class="s1">${P1.score} điểm <small>· ${P1.correct} câu đúng</small></div><hr>
  ${[P2, P3].map((p, i) => `<div class="rw"><span class="k">0${i + 2}</span><span class="nm1">${esc(p.name)}</span><small>${p.correct} câu đúng</small><span class="sc">${p.score}</span></div>`).join('')}
  <div class="meta">${fastLine}<br>${statLine}</div>${appcard}${soon}` };

// ============ 10 · Sticker vui nhộn ============
const v10 = { name: 'Sticker vui nhộn', note: 'Viền đậm, bóng lệch, màu tươi, Ninja nhảy mừng: trẻ trung, hợp TikTok', css: `
#v10{background:#fff8e1}
#v10 .site,#v10 .appc{border:5px solid #10201e;box-shadow:8px 8px 0 #10201e}
#v10 .chip{background:#10201e;color:#fff}
#v10 .top{position:relative;width:100%;height:560px}
#v10 .mi.dance{position:absolute;left:-10px;top:40px;width:430px;height:470px}
#v10 .bub{position:absolute;left:300px;top:0;background:#fff;border:5px solid #10201e;border-radius:36px;padding:14px 30px;font-size:44px;font-weight:700;box-shadow:6px 6px 0 #10201e;transform:rotate(-4deg)}
#v10 .c1{position:absolute;right:0;top:110px;width:560px;background:#ffd34d;border:6px solid #10201e;border-radius:44px;box-shadow:12px 12px 0 #10201e;padding:26px 26px 28px;display:flex;flex-direction:column;align-items:center;transform:rotate(3deg)}
#v10 .c1 .st{position:absolute;top:-34px;right:-22px;background:#ff5d8f;color:#fff;border:5px solid #10201e;border-radius:50%;width:112px;height:112px;display:grid;place-items:center;font-size:42px;font-weight:700;transform:rotate(12deg)}
#v10 .c1 .nm1{font-size:66px;font-weight:700;line-height:1.1;margin-top:8px}#v10 .c1 .sc{font-size:44px;font-weight:700}#v10 .c1 small{font-size:27px;font-weight:500}
#v10 .two{display:flex;gap:26px;width:100%}
#v10 .d{flex:1;border:5px solid #10201e;border-radius:34px;box-shadow:8px 8px 0 #10201e;padding:20px;display:flex;align-items:center;gap:14px;min-width:0}
#v10 .d2{background:#9ef0e0;transform:rotate(-2deg)}#v10 .d3{background:#ffb8cc;transform:rotate(2deg)}
#v10 .d .k{font-size:54px;font-weight:700}#v10 .d .nm1{font-size:34px;font-weight:700;flex:1}#v10 .d .sc{font-size:46px;font-weight:700}
#v10 .line{width:100%;background:#fff;border:5px solid #10201e;border-radius:28px;box-shadow:8px 8px 0 #10201e;padding:18px 26px;font-size:29px;display:flex;gap:14px;align-items:center}
#v10 .col{gap:28px}`,
  html: `${chip()}<div class="top"><i class="mi dance"></i><div class="bub">Chúc mừng!</div>
    <div class="c1"><div class="st">#1</div>${av(P1, 190, '#10201e', '#fff', '#10201e', 6)}<div class="nm1">${esc(P1.name)}</div><div class="sc">${P1.score} điểm <small>· ${P1.correct} câu đúng</small></div></div></div>
  <div class="two">${[P2, P3].map((p, i) => `<div class="d d${i + 2}"><span class="k">#${i + 2}</span>${av(p, 84, '#10201e', '#fff', '#10201e', 5)}<span class="nm1">${esc(p.name)}</span><span class="sc">${p.score}</span></div>`).join('')}</div>
  <div class="line">${icon('bolt', 32, '#10201e')}<span>${fastLine}</span></div><div class="line">${icon('list', 32, '#10201e')}<span>${statLine}</span></div>${appcard}${soon}` };

const ALL = [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10];
const frame = (v, i) => `<div class="f" id="${v.id || 'v' + (i + 1)}">${v.pre || ''}${site}<div class="col">${v.html}</div></div>`;

// ---------- xuất: <slug>.html (mọi khung thu nhỏ trên một trang) + <slug>/<số>.html (từng khung cỡ lớn)
function writeSet({ slug, title, intro, list, extraCss = '' }) {
  fs.mkdirSync(path.join(OUT, slug), { recursive: true });
  list.forEach((v, i) => {
    const n = i + 1, prev = n > 1 ? n - 1 : list.length, next = n < list.length ? n + 1 : 1;
    fs.writeFileSync(path.join(OUT, slug, `${n}.html`), `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${n} · ${v.name}</title>
<style>${BASE}${extraCss}${v.css}
html,body{height:100%}body{background:#1a2422;display:flex;flex-direction:column;align-items:center;font-family:"Avenir Next",-apple-system,sans-serif}
.bar{height:52px;display:flex;align-items:center;gap:18px;color:#cfe3de;font-size:16px;flex:none}.bar a{color:#8fe6d6;text-decoration:none;font-weight:600}.bar b{color:#fff}
.stagebox{flex:1;width:100%;position:relative;overflow:hidden}.stagebox .f{position:absolute;left:50%;top:0;transform-origin:0 0}</style></head><body>
<div class="bar"><a href="${prev}.html">← trước</a><span><b>${n} · ${esc(v.name)}</b>: ${esc(v.note)}</span><a href="${next}.html">sau →</a><a href="../${slug}.html">xem tất cả</a></div>
<div class="stagebox">${frame(v, i)}</div>
<script>const f=document.querySelector('.f'),b=document.querySelector('.stagebox');function fit(){const s=Math.min(b.clientHeight/1920,b.clientWidth/1080);f.style.transform='scale('+s+')';f.style.marginLeft=(-540*s)+'px'}addEventListener('resize',fit);fit();
addEventListener('keydown',(e)=>{if(e.key==='ArrowLeft')location.href='${prev}.html';if(e.key==='ArrowRight')location.href='${next}.html'})</script></body></html>`);
  });
  const S = 0.34;
  fs.writeFileSync(path.join(OUT, `${slug}.html`), `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>${BASE}${extraCss}${list.map((v) => v.css).join('\n')}
body{background:#eef4f2;font-family:"Avenir Next",-apple-system,"Segoe UI",sans-serif;color:#10201e;padding:28px 28px 60px}
.h{max-width:1960px;margin:0 auto 22px}.h h2{font-size:28px;font-weight:700}.h p{font-size:16px;color:#506762;margin-top:6px;line-height:1.5}
.grid{display:grid;grid-template-columns:repeat(auto-fill,${Math.round(1080 * S)}px);gap:34px 26px;justify-content:center;max-width:1990px;margin:0 auto}
.cell{text-decoration:none;color:inherit;display:block}
.cap{font-size:19px;font-weight:700;margin-bottom:4px}.cap span{display:inline-grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#1c7a6c;color:#fff;margin-right:8px;font-size:17px}
.note{font-size:14px;color:#506762;line-height:1.4;height:40px;margin-bottom:10px}
.box{width:${Math.round(1080 * S)}px;height:${Math.round(1920 * S)}px;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(16,32,30,.14);position:relative;background:#fff}
.box .f{transform:scale(${S});transform-origin:0 0;position:absolute;left:0;top:0}
.box::before,.box::after{content:'';position:absolute;left:0;right:0;z-index:9;pointer-events:none;opacity:0;transition:opacity .15s;background:repeating-linear-gradient(45deg,rgba(229,72,77,.22) 0 8px,rgba(229,72,77,.10) 8px 16px)}
.box::before{top:0;height:${Math.round(150 * S)}px}.box::after{bottom:0;height:${Math.round(320 * S)}px}
body.safe .box::before,body.safe .box::after{opacity:1}
.cell:hover .box{box-shadow:0 0 0 4px #48bcaa,0 6px 24px rgba(16,32,30,.14)}
label{font-size:15px;color:#3b524e;cursor:pointer;user-select:none}</style></head><body>
<div class="h"><h2>${esc(title)}</h2>
<p>${intro}<br>
<label><input type="checkbox" onchange="document.body.classList.toggle('safe',this.checked)"> Tô vùng bị che trên TikTok (mép trên: thanh tên kênh · phía dưới: khung bình luận)</label></p></div>
<div class="grid">${list.map((v, i) => `<a class="cell" href="${slug}/${i + 1}.html"><div class="cap"><span>${i + 1}</span>${esc(v.name)}</div><div class="note">${esc(v.note)}</div><div class="box">${frame(v, i)}</div></a>`).join('')}</div>
</body></html>`);
  console.log(`Đã ghi design/out/${slug}.html và ${list.length} file trong design/out/${slug}/`);
}

module.exports = { IMG, D, P1, P2, P3, esc, GOLD, SILVER, BRONZE, MED, rnd, crown, icon, av, confetti, laurel, chip, appcard, soon, fastLine, statLine, tiles, writeSet };
if (require.main === module)
  writeSet({ slug: 'vinh-danh-10', title: '10 phương án màn vinh danh', list: ALL,
    intro: 'Mỗi khung là màn live 1080×1920 thu nhỏ. Bấm vào một khung để xem cỡ lớn (phím ← → để chuyển bản). Dữ liệu là mẫu, đúng các thông tin game đang có: top 3, người nhanh tay nhất, số câu, số người chơi, lượt đúng.' });
