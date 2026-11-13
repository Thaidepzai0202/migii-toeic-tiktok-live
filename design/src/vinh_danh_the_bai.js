#!/usr/bin/env node
// 5 biến thể của phương án 7 "Ba thẻ bài" (13/11/2026: người dùng chọn bản 7 trong vinh_danh_10.js, muốn xem 5 bản làm kỹ).
//
//   node design/src/vinh_danh_the_bai.js
//
// Ghi design/out/vinh-danh-the-bai.html + design/out/vinh-danh-the-bai/<số>.html. Dùng chung khung, dữ liệu mẫu và mảnh ghép của vinh_danh_10.js.
// Cả 5 bản cùng bố cục: nhãn "Kết thúc <game>", tiêu đề, BA THẺ (quán quân ở giữa, to, nằm trên), 2 ô thông tin (nhanh tay nhất, lượt này),
// thẻ tải app, dòng "Lượt sau sắp bắt đầu". Nội dung nằm trong y 150–1600.
const K = require('./vinh_danh_10.js');
const { IMG, D, P1, esc, GOLD, MED, rnd, crown, icon, av, confetti, chip, appcard, soon, writeSet } = K;

const LAB = ['QUÁN QUÂN', 'HẠNG 2', 'HẠNG 3'];
const DARK = ['#b98200', '#7f908c', '#93592a']; // màu đậm của vàng, bạc, đồng (chữ, viền)
const spark = (size, color = GOLD, style = '') => `<svg class="sp" style="${style}" width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z" fill="${color}"/></svg>`;
const stars = (n, size = 30, color = '#fff') => [...Array(n)].map(() => icon('star', size, color, color)).join('');
// 2 ô thông tin dùng chung dưới ba thẻ
const info = `<div class="info">
  <div class="card mini"><div class="ic">${icon('bolt')}</div><div class="tx"><div class="lb">Nhanh tay nhất</div><div class="v nm1">${esc(D.fastest.name)}</div><div class="s">${D.fastest.first} lần trả lời đầu tiên</div></div></div>
  <div class="card mini"><div class="ic">${icon('users')}</div><div class="tx"><div class="lb">Lượt này</div><div class="v">${D.stats.players} người chơi</div><div class="s">${D.stats.questions} câu · ${D.stats.correct} lượt đúng</div></div></div></div>`;
const tail = `${info}${appcard}${soon}`;
const EXTRA = `
.info{display:flex;gap:18px;width:100%}.info .mini{flex:1;min-width:0;padding:22px 24px;display:flex;gap:18px;align-items:center}
.info .ic{width:68px;height:68px;border-radius:50%;background:#e4f4f1;display:grid;place-items:center;flex:none}.info .tx{min-width:0}
.info .lb{font-size:24px;color:#506762}.info .v{font-size:34px;font-weight:700}.info .s{font-size:24px;color:#506762}
.ttl{font-size:88px;font-weight:700;line-height:1;color:#10201e}.ttl span{color:#1c7a6c}
.fan{position:relative;width:100%}
.sp{position:absolute}
`;
// thứ tự vẽ: hạng 2, hạng 3 rồi quán quân (nằm trên cùng)
const three = (fn) => [1, 2, 0].map((i) => fn(D.top[i], i)).join('');

// ============ 1 · Cổ điển tinh chỉnh ============
const a = { id: 'ta', name: 'Cổ điển tinh chỉnh', note: 'Bản 7 gốc làm kỹ: dải màu bo cong, ảnh đè lên dải, hàng sao theo hạng', css: `
#ta .fan{height:640px}
#ta .cd{position:absolute;top:110px;width:352px;height:486px;border-radius:44px;background:#fff;box-shadow:0 20px 44px rgba(16,32,30,.16);display:flex;flex-direction:column;align-items:center;overflow:hidden}
#ta .band{width:100%;height:150px;flex:none;border-radius:0 0 50% 50%/0 0 34% 34%;background:var(--g);position:relative;display:flex;justify-content:center;padding-top:22px}
#ta .band::after{content:'';position:absolute;inset:0;border-radius:inherit;background:radial-gradient(rgba(255,255,255,.28) 2.5px,transparent 3.5px) 0 0/24px 24px}
#ta .lab{position:relative;z-index:1;font-size:25px;font-weight:700;letter-spacing:.16em;color:#fff}
#ta .cd .av{margin-top:-74px;position:relative;z-index:2;box-shadow:0 0 0 6px var(--c)}
#ta .cd .nm1{font-size:36px;font-weight:700;margin-top:16px;padding:0 16px}
#ta .cd .sc{font-size:76px;font-weight:700;color:#1c7a6c;line-height:1.05}
#ta .cd small{font-size:24px;color:#506762}
#ta .foot{margin-top:auto;width:100%;height:58px;background:var(--g);display:flex;align-items:center;justify-content:center;gap:6px}
#ta .c2{left:0;transform:rotate(-8deg)}#ta .c3{right:0;transform:rotate(8deg)}
#ta .c2>*:not(.band):not(.foot){margin-right:84px}#ta .c3>*:not(.band):not(.foot){margin-left:84px}
#ta .c2 .lab{margin-right:84px}#ta .c3 .lab{margin-left:84px}
#ta .c1{left:50%;top:0;width:444px;height:620px;margin-left:-222px;z-index:3;box-shadow:0 26px 64px rgba(16,32,30,.24),0 0 0 6px ${GOLD}}
#ta .c1 .band{height:196px}#ta .c1 .lab{font-size:30px}#ta .c1 .av{margin-top:-104px}
#ta .c1 .nm1{font-size:54px;margin-top:14px}#ta .c1 .sc{font-size:112px}#ta .c1 small{font-size:28px}#ta .c1 .foot{height:70px}
#ta .c1 .crown{position:absolute;top:66px;z-index:3}`,
  html: `${chip()}<h1 class="ttl">Vinh danh</h1><div class="fan">${three((p, i) => `<div class="cd c${i + 1}" style="--c:${MED[i]};--g:${['linear-gradient(160deg,#ffd45c,#eea200)', 'linear-gradient(160deg,#cdd8d5,#8fa29e)', 'linear-gradient(160deg,#e3a672,#b06a35)'][i]}">
    <div class="band"><span class="lab">${LAB[i]}</span></div>${i === 0 ? crown(72, '#fff', '#b98200') : ''}${av(p, i === 0 ? 196 : 140, '#fff', '#e4f4f1', '#1c7a6c', 8)}
    <div class="nm1">${esc(p.name)}</div><div class="sc">${p.score}</div><small>điểm · ${p.correct} câu đúng</small><div class="foot">${stars(3 - i, i === 0 ? 34 : 26)}</div></div>`)}</div>${tail}` };

// ============ 2 · Thẻ sưu tầm ánh kim ============
const b = { id: 'tb', name: 'Thẻ sưu tầm ánh kim', note: 'Viền ánh kim vàng, bạc, đồng có vệt sáng chéo; ô số liệu như thẻ cầu thủ', css: `
#tb .fan{height:640px}
#tb .cd{position:absolute;top:112px;width:352px;height:484px;border-radius:40px;padding:14px;background:var(--foil);box-shadow:0 20px 44px rgba(16,32,30,.2);overflow:hidden}
#tb .cd::after{content:'';position:absolute;top:-30%;left:-60%;width:60%;height:160%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:rotate(18deg)}
#tb .in{position:relative;z-index:1;height:100%;border-radius:28px;background:linear-gradient(180deg,#fff 60%,var(--tint));display:flex;flex-direction:column;align-items:center;padding:20px 14px 14px}
#tb .hd{width:100%;display:flex;align-items:center;justify-content:space-between;padding:0 4px}
#tb .no{width:58px;height:58px;border-radius:50%;background:var(--foil);color:#fff;font-size:34px;font-weight:700;display:grid;place-items:center;text-shadow:0 2px 0 rgba(0,0,0,.18)}
#tb .lab{font-size:22px;font-weight:700;letter-spacing:.14em;color:var(--d)}
#tb .cd .av{margin-top:6px;box-shadow:0 0 0 5px #fff,0 0 0 11px var(--c)}
#tb .cd .nm1{font-size:36px;font-weight:700;margin-top:20px}
#tb .stat{margin-top:auto;width:100%;display:flex;gap:10px}
#tb .stat div{flex:1;border-radius:18px;background:#fff;box-shadow:inset 0 0 0 3px var(--tint2);text-align:center;padding:8px 0 10px}
#tb .stat b{display:block;font-size:50px;line-height:1.05;color:#10201e}#tb .stat span{font-size:20px;font-weight:700;letter-spacing:.1em;color:var(--d)}
#tb .c2{left:0;transform:rotate(-8deg)}#tb .c3{right:0;transform:rotate(8deg)}
#tb .c2 .in{padding-right:92px}#tb .c3 .in{padding-left:92px}
#tb .c1{left:50%;top:0;width:448px;height:624px;margin-left:-224px;z-index:3;padding:18px;box-shadow:0 26px 64px rgba(16,32,30,.28)}
#tb .c1 .in{padding:26px 22px 20px}#tb .c1 .no{width:76px;height:76px;font-size:44px}#tb .c1 .lab{font-size:28px}
#tb .c1 .nm1{font-size:56px;margin-top:22px}#tb .c1 .stat b{font-size:84px}#tb .c1 .stat span{font-size:24px}#tb .c1 .stat{gap:14px}
#tb .c1 .crown{margin-top:-6px;margin-bottom:-12px;position:relative;z-index:2}`,
  html: `${chip()}<h1 class="ttl">Vinh danh</h1><div class="fan">${three((p, i) => `<div class="cd c${i + 1}" style="--c:${MED[i]};--d:${DARK[i]};--tint:${['#fff6d6', '#eef3f2', '#fbe9da'][i]};--tint2:${['#ffe9a8', '#dbe4e2', '#f3d2b8'][i]};--foil:${['linear-gradient(135deg,#ffe58a,#f5b400 38%,#fff1b8 55%,#d99a00)', 'linear-gradient(135deg,#f1f5f4,#a9b8b5 38%,#f7faf9 55%,#8a9c98)', 'linear-gradient(135deg,#f6cfae,#c8814a 38%,#fbe0c8 55%,#a8622c)'][i]}">
    <div class="in"><div class="hd"><span class="no">${i + 1}</span><span class="lab">${LAB[i]}</span></div>${i === 0 ? crown(70) : ''}${av(p, i === 0 ? 190 : 132, '#fff', '#e4f4f1', '#1c7a6c', 0)}
    <div class="nm1">${esc(p.name)}</div><div class="stat"><div><b>${p.score}</b><span>ĐIỂM</span></div><div><b>${p.correct}</b><span>CÂU ĐÚNG</span></div></div></div></div>`)}</div>${tail}` };

// ============ 3 · Lá bài tây ============
const c = { id: 'tc', name: 'Lá bài tây', note: 'Lá bài trắng có số hạng ở hai góc, xoè từ một điểm như đang cầm bài trên tay', css: `
#tc .fan{height:650px}
#tc .cd{position:absolute;top:84px;left:50%;width:372px;height:520px;margin-left:-186px;border-radius:36px;background:#fff;box-shadow:0 18px 40px rgba(16,32,30,.18),inset 0 0 0 4px var(--tint);display:flex;flex-direction:column;align-items:center;justify-content:center;transform-origin:50% 100%}
#tc .ix{position:absolute;display:flex;flex-direction:column;align-items:center;line-height:1;color:var(--d);font-weight:700;font-size:54px}
#tc .ix.tl{top:20px;left:24px}#tc .ix.br{bottom:20px;right:24px;transform:rotate(180deg)}
#tc .cd .av{box-shadow:0 0 0 6px var(--c)}
#tc .cd .nm1{font-size:36px;font-weight:700;margin-top:18px;padding:0 20px}
#tc .cd .sc{margin-top:8px;background:var(--tint);color:var(--d);font-size:36px;font-weight:700;border-radius:999px;padding:4px 26px}
#tc .cd small{font-size:24px;color:#506762;margin-top:8px}
#tc .c2{transform:translateX(-236px) rotate(-11deg)}#tc .c3{transform:translateX(236px) rotate(11deg)}
#tc .c2>.av,#tc .c2>.nm1,#tc .c2>.sc,#tc .c2>small{margin-right:150px}#tc .c3>.av,#tc .c3>.nm1,#tc .c3>.sc,#tc .c3>small{margin-left:150px}
#tc .c2 .nm1,#tc .c3 .nm1{max-width:220px;padding:0;font-size:34px}
#tc .c2 .ix.br,#tc .c3 .ix.tl{display:none}#tc .c3 .ix.tr{top:20px;right:24px;display:flex}#tc .ix.tr{display:none}
#tc .c1{top:0;width:448px;height:630px;margin-left:-224px;z-index:3;box-shadow:0 26px 64px rgba(16,32,30,.26),inset 0 0 0 7px ${GOLD}}
#tc .c1 .ix{font-size:76px}#tc .c1 .ix.tl{top:28px;left:34px}#tc .c1 .ix.br{bottom:28px;right:34px}
#tc .c1 .nm1{font-size:58px}#tc .c1 .sc{font-size:54px;padding:6px 40px;background:${GOLD};color:#3d2c00}#tc .c1 small{font-size:28px}
#tc .c1 .crown{margin-bottom:-8px}`,
  html: `${chip()}<h1 class="ttl">Vinh danh</h1><div class="fan">${three((p, i) => { const ix = `<span>${i + 1}</span>${icon('star', i === 0 ? 40 : 30, DARK[i], MED[i])}`;
    return `<div class="cd c${i + 1}" style="--c:${MED[i]};--d:${DARK[i]};--tint:${['#fff1c4', '#e7eeec', '#f8dcc6'][i]}"><div class="ix tl">${ix}</div><div class="ix tr">${ix}</div><div class="ix br">${ix}</div>
    ${i === 0 ? crown(84) : ''}${av(p, i === 0 ? 216 : 150, '#fff', '#e4f4f1', '#1c7a6c', 8)}<div class="nm1">${esc(p.name)}</div><div class="sc">${p.score} điểm</div><small>${p.correct} câu đúng</small></div>`; })}</div>${tail}` };

// ============ 4 · Thẻ teal có Ninja ============
const d = { id: 'td', name: 'Thẻ teal có Ninja', note: 'Thẻ quán quân teal đậm có hoa giấy, Ninja ôm cúp ngồi trên thẻ; đúng màu thương hiệu', css: `
#td .col{gap:20px}
#td .fan{height:700px}
#td .mi.cup{position:absolute;left:50%;top:0;width:330px;height:278px;margin-left:-150px;z-index:4}
#td .cd{position:absolute;top:300px;width:330px;height:372px;border-radius:40px;background:#fff;box-shadow:0 18px 40px rgba(16,32,30,.15);display:flex;flex-direction:column;align-items:center;overflow:hidden}
#td .hd{width:100%;height:64px;flex:none;background:var(--g);color:#fff;font-size:24px;font-weight:700;letter-spacing:.14em;display:grid;place-items:center}
#td .cd .av{margin-top:18px;box-shadow:0 0 0 5px var(--c)}
#td .cd .nm1{font-size:34px;font-weight:700;margin-top:14px;padding:0 14px}
#td .cd .sc{font-size:62px;font-weight:700;color:#1c7a6c;line-height:1.05}#td .cd small{font-size:23px;color:#506762}
#td .c2{left:0;transform:rotate(-6deg)}#td .c3{right:0;transform:rotate(6deg)}
#td .c2>*:not(.hd){margin-right:70px}#td .c3>*:not(.hd){margin-left:70px}#td .c2 .hd{padding-right:70px}#td .c3 .hd{padding-left:70px}
#td .c1{left:50%;top:222px;width:452px;height:470px;margin-left:-226px;z-index:3;background:linear-gradient(165deg,#25988a,#115a4f);color:#fff;box-shadow:0 26px 64px rgba(16,32,30,.3),0 0 0 6px ${GOLD};justify-content:flex-end;padding-bottom:26px}
#td .c1 .cf{position:absolute;inset:0;opacity:.8}
#td .c1>*:not(.cf){position:relative}
#td .c1 .lab{font-size:28px;font-weight:700;letter-spacing:.16em;color:#ffe08a}
#td .c1 .row{gap:22px;margin-top:10px;padding:0 26px;max-width:100%}
#td .c1 .av{margin:0;box-shadow:0 0 0 6px ${GOLD}}
#td .c1 .nm1{font-size:58px;margin:0;padding:0;text-align:left}
#td .c1 .pill{margin-top:14px;background:${GOLD};color:#3d2c00;font-size:44px;font-weight:700;border-radius:999px;padding:6px 40px}
#td .c1 small{color:#cdeee7;font-size:26px;margin-top:8px}`,
  html: `${chip()}<h1 class="ttl">Vinh danh</h1><div class="fan"><i class="mi cup"></i>
    ${[1, 2].map((i) => { const p = D.top[i]; return `<div class="cd c${i + 1}" style="--c:${MED[i]};--g:${['', 'linear-gradient(160deg,#b7c5c2,#8a9c98)', 'linear-gradient(160deg,#dc9c66,#b06a35)'][i]}"><div class="hd">${LAB[i]}</div>${av(p, 124, '#fff', '#e4f4f1', '#1c7a6c', 6)}<div class="nm1">${esc(p.name)}</div><div class="sc">${p.score}</div><small>điểm · ${p.correct} câu đúng</small></div>`; }).join('')}
    <div class="cd c1"><div class="cf">${confetti(22, 452, 150, ['#ffd34d', '#ff9eb5', '#9ef0e0', '#fff', '#ffb347'], 9)}</div><div class="lab">QUÁN QUÂN</div>
      <div class="row">${av(P1, 120, '#fff', '#e4f4f1', '#1c7a6c', 6)}<div class="nm1">${esc(P1.name)}</div></div><div class="pill">${P1.score} điểm</div><small>${P1.correct} câu đúng</small></div></div>${tail}` };

// ============ 5 · Hào quang ============
const e = { id: 'te', name: 'Hào quang', note: 'Tia sáng vàng toả sau thẻ quán quân, hai thẻ bên nghiêng 3D, dải băng "Quán quân" vắt ngang', css: `
#te .fan{height:660px;perspective:1600px}
#te .rays{position:absolute;left:50%;top:-70px;width:1000px;height:1000px;margin-left:-500px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(245,180,0,.30) 0 7deg,transparent 7deg 15deg);-webkit-mask:radial-gradient(circle,#000 12%,transparent 60%);mask:radial-gradient(circle,#000 12%,transparent 60%)}
#te .cd{position:absolute;top:120px;width:338px;height:460px;border-radius:40px;background:#fff;box-shadow:0 20px 44px rgba(16,32,30,.18);display:flex;flex-direction:column;align-items:center;padding-top:64px}
#te .mdl{position:absolute;top:-38px;left:50%;margin-left:-44px;width:88px;height:88px;border-radius:50%;background:radial-gradient(circle at 32% 28%,var(--hi),var(--c) 60%,var(--d));color:#fff;font-size:46px;font-weight:700;display:grid;place-items:center;box-shadow:0 0 0 6px #fff,0 8px 16px rgba(16,32,30,.2);text-shadow:0 2px 0 rgba(0,0,0,.2)}
#te .cd .av{box-shadow:0 0 0 6px var(--c)}
#te .cd .nm1{font-size:36px;font-weight:700;margin-top:18px;padding:0 16px}
#te .cd .sc{font-size:74px;font-weight:700;color:#1c7a6c;line-height:1.05}#te .cd small{font-size:24px;color:#506762}
#te .c2{left:0;transform:rotateY(24deg) rotate(-3deg)}#te .c3{right:0;transform:rotateY(-24deg) rotate(3deg)}
#te .c2>*:not(.mdl){margin-right:60px}#te .c3>*:not(.mdl){margin-left:60px}#te .c2 .mdl{margin-left:-74px}#te .c3 .mdl{margin-left:-14px}
#te .c1{left:50%;top:20px;width:452px;height:590px;margin-left:-226px;z-index:3;padding-top:34px;border:8px solid transparent;background:linear-gradient(#fff,#fffaf0) padding-box,linear-gradient(140deg,#ffe58a,#f5b400 40%,#fff1b8 55%,#d99a00) border-box;box-shadow:0 26px 64px rgba(16,32,30,.24),0 0 110px rgba(245,180,0,.55)}
#te .c1 .nm1{font-size:56px;margin-top:14px}#te .c1 .sc{font-size:100px}#te .c1 small{font-size:28px}
#te .c1 .crown{margin-bottom:-10px}
#te .rib{position:absolute;left:-34px;right:-34px;bottom:-34px;height:76px;background:linear-gradient(180deg,#ffcf4a,#eea200);color:#3d2c00;font-size:34px;font-weight:700;letter-spacing:.18em;display:grid;place-items:center;border-radius:8px;box-shadow:0 8px 16px rgba(16,32,30,.18)}
#te .rib::before,#te .rib::after{content:'';position:absolute;bottom:-20px;border:10px solid #a86f00;border-bottom-color:transparent}
#te .rib::before{left:0;border-left-color:transparent}#te .rib::after{right:0;border-right-color:transparent}
#te .c1 .sc{margin-bottom:0}#te .c1 small{margin-bottom:auto}`,
  html: `${chip()}<h1 class="ttl">Vinh danh</h1><div class="fan"><div class="rays"></div>
    ${spark(54, GOLD, 'left:150px;top:10px')}${spark(34, '#ffd34d', 'right:170px;top:46px')}${spark(40, '#ffd34d', 'left:236px;top:600px;z-index:4')}${spark(28, GOLD, 'right:226px;top:628px;z-index:4')}
    ${[1, 2].map((i) => { const p = D.top[i]; return `<div class="cd c${i + 1}" style="--c:${MED[i]};--d:${DARK[i]};--hi:${['', '#f1f5f4', '#f6cfae'][i]}"><div class="mdl">${i + 1}</div>${av(p, 142, '#fff', '#e4f4f1', '#1c7a6c', 8)}<div class="nm1">${esc(p.name)}</div><div class="sc">${p.score}</div><small>điểm · ${p.correct} câu đúng</small></div>`; }).join('')}
    <div class="cd c1" style="--c:${GOLD}">${crown(80)}${av(P1, 184, '#fff', '#fff7dc', '#a87400', 8)}<div class="nm1">${esc(P1.name)}</div><div class="sc">${P1.score}</div><small>điểm · ${P1.correct} câu đúng</small><div class="rib">QUÁN QUÂN</div></div></div>${tail}` };

void IMG; void rnd;
writeSet({ slug: 'vinh-danh-the-bai', title: 'Ba thẻ bài: 5 biến thể', list: [a, b, c, d, e], extraCss: EXTRA,
  intro: 'Năm cách làm kỹ phương án 7 "Ba thẻ bài". Bấm vào một khung để xem cỡ lớn (phím ← → để chuyển bản). Dữ liệu là mẫu, đúng các thông tin game đang có.' });
