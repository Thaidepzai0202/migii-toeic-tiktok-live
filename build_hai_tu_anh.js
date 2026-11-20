#!/usr/bin/env node
// Sinh ảnh cho khung 🍎 Hái từ bằng AI, qua cổng AI của công ty (llm.eup.ai, cùng cổng repo migii_gen_sound dùng sinh ảnh Part 1).
//
//   node build_hai_tu_anh.js                         xem sẽ sinh bao nhiêu ảnh, hết bao nhiêu tiền (KHÔNG gọi API)
//   node build_hai_tu_anh.js --chu-de truonghoc --mau 16 --dong-y     sinh thử 16 ảnh của một chủ đề
//   node build_hai_tu_anh.js --dong-y --toi-da 1400  sinh hết ảnh còn thiếu (dừng khi đủ --toi-da lần gọi)
//
// Tuỳ chọn: --chu-de a,b (mặc định mọi chủ đề) · --mau N (mỗi chủ đề tối đa N ảnh) · --model gemini-2.5-flash-image | gpt-image-2
//           --toi-da N (số lần gọi tối đa một lượt, mặc định 30) · --song-song N (mặc định 4) · --dong-y (thật sự gọi API, có tính tiền)
//           --luoi K: mỗi lần gọi vẽ K×K vật trong một ảnh (lưới, nền trắng) rồi cắt ra từng ô (người dùng 20/11: ảnh đơn giản, vẽ nhiều vật
//             một lần cho rẻ; K=3 → 9 vật/ảnh, ô ~340 px). Mặc định 1 (một vật một ảnh).
//           --tron: cho phép một ảnh lưới chứa vật của nhiều chủ đề (dùng khi sinh lại vài ảnh lẻ ở nhiều chủ đề: ít lần gọi hơn)
//           --thu: bản thử, ảnh ra data/hai-tu-goc/thu/<chủ đề>/<id>.jpg (không đụng ảnh trên màn, không ghi nguồn) · --ca-co-anh: sinh cả
//             mục đã có ảnh (để so với ảnh chụp thật; chỉ dùng cùng --thu)
// Key: biến LLM_EUP_KEY trong môi trường hoặc trong .env của repo này. Không ghi key ra log hay file.
//
// Mục nào đã có ảnh ở public/img/hai-tu/<chủ đề>/<id>.jpg thì bỏ qua (ảnh chụp thật của Trái cây, Rau củ giữ nguyên), nên chạy lại
// sau khi bị dừng chỉ sinh phần còn thiếu. Muốn sinh lại một ảnh: xoá file .jpg đó rồi chạy lại.
// Ảnh gốc model trả về lưu ở data/hai-tu-goc/<chủ đề>/<id>.png (ngoài git), ảnh dùng trên màn thu về 360×360 JPEG bằng sips (macOS).
// Mỗi ảnh sinh xong ghi nguồn vào data/hai-tu-anh.json: source "ai", model, prompt, ngày. Trang duyệt: data/hai-tu-goc/xem.html.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const DIR = path.join(ROOT, 'data', 'hai-tu');
const IMG = path.join(ROOT, 'public', 'img', 'hai-tu');
const GOC = path.join(ROOT, 'data', 'hai-tu-goc');
const ANH = path.join(ROOT, 'data', 'hai-tu-anh.json');
const URL_GEMINI = 'https://llm.eup.ai/gemini/v1beta/models/{model}:generateContent';
const URL_OPENAI = 'https://llm.eup.ai/openai/v1/images/generations';
const GIA_USD = { gemini: 0.039, 'gpt-image': 0.042 }; // giá mỗi ảnh theo anh-p1/README.md của migii_gen_sound (PM đã đo)

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[i + 1]; };
const MODEL = String(opt('model', 'gpt-image-2')); // 20/11: key cổng hiện có không được dùng Gemini (403 provider_not_allowed)
const TOI_DA = Number(opt('toi-da', 30));
const SONG_SONG = Math.max(1, Number(opt('song-song', 4)));
const MAU = opt('mau', null) == null ? Infinity : Number(opt('mau'));
const CHU_DE = opt('chu-de', null) ? String(opt('chu-de')).split(',') : null;
const DONG_Y = !!opt('dong-y', false);
const LUOI = Math.max(1, Math.min(4, Number(opt('luoi', 1))));
const THU = !!opt('thu', false);
const CA_CO_ANH = THU && !!opt('ca-co-anh', false);
const OUT_DIR = THU ? path.join(GOC, 'thu') : IMG;
const TRON = !!opt('tron', false);
const gia = () => GIA_USD[MODEL.startsWith('gpt-image') ? 'gpt-image' : 'gemini'];

// Phong cách chung để ảnh AI đứng cạnh ảnh chụp thật của Trái cây / Rau củ: ảnh chụp kiểu sản phẩm, một vật, nền trắng, không chữ.
const STYLE = 'Realistic studio photograph, the subject centered and filling most of the square frame, isolated on a plain pure white background, ' +
  'soft even lighting, sharp focus, natural colors. No text, no letters, no numbers, no logos, no flags, no watermark, no border: every sign, card, paper, label and screen must be blank. ';
const STYLE_NGUOI = 'If a person is shown, show one adult (or the family members named) in a friendly neutral pose, modest everyday clothing, ' +
  'with the telling uniform or prop clearly visible. ';
const prompt = (topic, x) => `${STYLE}${/người|nghề|gia đình/i.test(topic.name) ? STYLE_NGUOI : ''}Subject: ${x.p}.`;
// Lưới K×K: mỗi ô một vật, đánh số theo hàng từ trái sang phải; ô thừa để trắng. Đường kẻ xám rất nhạt giúp model chia ô đều (lúc cắt chừa lề).
const ROW = ['top', 'middle', 'bottom'];
function promptLuoi(topic, list) { // list: mục { p } (khi --tron, topic = null: luôn kèm luật vẽ người)
  const K = LUOI, rowName = (r) => (K === 3 ? ROW[r] : K === 2 ? ['top', 'bottom'][r] : `row ${r + 1}`);
  const cells = [];
  for (let r = 0; r < K; r++) for (let c = 0; c < K; c++) {
    const x = list[r * K + c];
    cells.push(`${rowName(r)} row, ${['left', K === 2 ? 'right' : 'center', 'right', 'far right'][c]}: ${x ? x.p : 'leave this cell completely empty and white'}`);
  }
  return `A ${K}x${K} grid of ${K * K} equal square cells on a plain pure white background, separated by very thin faint light-gray lines. ` +
    `Each cell contains exactly one subject, centered and filling about 80% of its cell, never crossing into another cell. ` +
    `Realistic studio photograph style, soft even lighting, sharp focus, natural colors, consistent scale and lighting across cells. ` +
    `${!topic || /người|nghề|gia đình/i.test(topic.name) ? STYLE_NGUOI : ''}No text, no letters, no numbers, no labels, no logos, no flags, no watermark: every sign, card, paper, book cover, label and screen must be completely blank. ` +
    `Cells, row by row: ${cells.join('; ')}.`;
}
// Cắt ô (r, c) của ảnh lưới thành ảnh vuông 360×360. Chừa lề 5% mỗi phía để bỏ đường kẻ.
function catO(goc, r, c, out) {
  const info = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', goc]).toString();
  const W = +info.match(/pixelWidth: (\d+)/)[1], H = +info.match(/pixelHeight: (\d+)/)[1];
  const cw = W / LUOI, ch = H / LUOI, m = 0.05, side = Math.floor(Math.min(cw, ch) * (1 - 2 * m));
  const x = Math.round(c * cw + (cw - side) / 2), y = Math.round(r * ch + (ch - side) / 2);
  const tmp = out + '.tmp.png';
  execFileSync('sips', ['-c', String(side), String(side), '--cropOffset', String(y), String(x), goc, '--out', tmp], { stdio: 'ignore' });
  execFileSync('sips', ['-z', '360', '360', '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', tmp, '--out', out], { stdio: 'ignore' });
  fs.unlinkSync(tmp);
}

function loadKey() {
  if (process.env.LLM_EUP_KEY) return process.env.LLM_EUP_KEY.trim();
  try {
    const m = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^LLM_EUP_KEY=(.*)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch {}
  return '';
}

async function sinh(p, key) {
  const openai = MODEL.startsWith('gpt-image');
  const url = openai ? URL_OPENAI : URL_GEMINI.replace('{model}', MODEL);
  const headers = { 'Content-Type': 'application/json', 'User-Agent': 'hai-tu-image/1.0', ...(openai ? { Authorization: `Bearer ${key}` } : { 'x-goog-api-key': key }) };
  const body = openai ? { model: MODEL, prompt: p, n: 1, size: '1024x1024', quality: 'medium' }
    : { contents: [{ parts: [{ text: p }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } };
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(240000) });
  const txt = await r.text();
  if (!r.ok) {
    const e = new Error(`HTTP ${r.status}: ${txt.slice(0, 300).split(key).join('***')}`);
    e.fatal = r.status === 401 || r.status === 403; // sai key / không có quyền: gọi tiếp cũng vậy
    throw e;
  }
  const d = JSON.parse(txt);
  if (openai && d.data?.[0]?.b64_json) return Buffer.from(d.data[0].b64_json, 'base64');
  for (const c of d.candidates || []) for (const part of c.content?.parts || []) if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
  throw new Error('cổng không trả ảnh: ' + txt.slice(0, 200));
}

function xemHtml(anh) {
  const byTopic = {};
  for (const [k, v] of Object.entries(anh.items)) if (v.source === 'ai') (byTopic[k.split('/')[0]] ||= []).push([k, v]);
  const cell = ([k, v]) => `<figure><img src="../../public/${v.file}"><figcaption><b>${k.split('/')[1]}</b><small>${v.w || ''} · ${v.vi || ''}</small></figcaption></figure>`;
  fs.writeFileSync(path.join(GOC, 'xem.html'), `<!doctype html><meta charset=utf-8><title>Ảnh AI Hái từ</title><style>body{margin:0;padding:16px;background:#eef6f4;font:14px system-ui,sans-serif}h2{color:#1c7a6c}.g{display:grid;grid-template-columns:repeat(auto-fill,170px);gap:10px}figure{margin:0;background:#fff;border-radius:12px;padding:8px;text-align:center}img{width:154px;height:154px;object-fit:contain}figcaption b{display:block}figcaption small{color:#506762}</style>` +
    Object.entries(byTopic).map(([t, list]) => `<h2>${t} (${list.length})</h2><div class=g>${list.map(cell).join('')}</div>`).join(''));
}

// Trang duyệt bản thử: mỗi mục một hàng gồm ảnh AI (bản thử) và ảnh đang dùng trên màn (nếu có) để so.
function xemThu(topics) {
  const rows = [];
  for (const t of topics) for (const x of t.items) {
    const ai = path.join(GOC, 'thu', t.id, `${x.id}.jpg`);
    if (!fs.existsSync(ai)) continue;
    const cur = path.join(IMG, t.id, `${x.id}.jpg`);
    rows.push(`<figure><div class=p><img src="file://${ai}">${fs.existsSync(cur) ? `<img class=cur src="file://${cur}">` : ''}</div><figcaption><b>${x.w}</b><small>${x.vi}</small></figcaption></figure>`);
  }
  const f = path.join(GOC, 'thu', 'xem.html');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, `<!doctype html><meta charset=utf-8><title>Ảnh AI thử · Hái từ</title><style>body{margin:0;padding:16px;background:#eef6f4;font:14px system-ui,sans-serif}h1{font-size:18px;color:#1c7a6c}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}figure{margin:0;background:#fff;border-radius:12px;padding:8px;text-align:center}.p{display:flex;gap:6px;justify-content:center}img{width:140px;height:140px;object-fit:contain;border-radius:8px}img.cur{outline:2px dashed #9fd3c9}figcaption b{display:block}figcaption small{color:#506762}</style>` +
    `<h1>Ảnh AI bản thử (${rows.length}) · bên trái: ảnh AI · bên phải viền đứt: ảnh chụp đang dùng (nếu có)</h1><div class=g>${rows.join('')}</div>`);
  return f;
}

(async () => {
  const topics = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
    .filter((t) => !CHU_DE || CHU_DE.includes(t.id));
  const todo = [];
  for (const t of topics) {
    const miss = t.items.filter((x) => CA_CO_ANH || !fs.existsSync(path.join(OUT_DIR, t.id, `${x.id}.jpg`))).slice(0, MAU);
    // mỗi lần gọi = một nhóm LUOI² mục cùng chủ đề (--tron: gom mọi chủ đề rồi mới chia nhóm, xem bên dưới)
    if (TRON) for (const x of miss) todo.push({ t, list: [x] });
    else for (let i = 0; i < miss.length; i += LUOI * LUOI) todo.push({ t, list: miss.slice(i, i + LUOI * LUOI) });
  }
  if (TRON && LUOI > 1) {
    const flat = todo.splice(0).map((a) => ({ t: a.t, x: a.list[0] }));
    for (let i = 0; i < flat.length; i += LUOI * LUOI) {
      const g = flat.slice(i, i + LUOI * LUOI);
      todo.push({ t: null, list: g.map((e) => ({ ...e.x, _t: e.t })) });
    }
  }
  const nAnh = todo.reduce((a, b) => a + b.list.length, 0), n = Math.min(todo.length, TOI_DA), nLuot = todo.slice(0, n).reduce((a, b) => a + b.list.length, 0);
  console.log(`Hái từ${THU ? ' (bản thử)' : ''}: ${nAnh} ảnh cần sinh${CHU_DE ? ` (chủ đề ${CHU_DE.join(', ')})` : ''}${LUOI > 1 ? `, ${LUOI * LUOI} vật mỗi lần gọi` : ''} · lượt này ` +
    `${n} lần gọi (${nLuot} ảnh) × ${gia()} USD ≈ ${(n * gia()).toFixed(2)} USD (model ${MODEL})` + (todo.length > n ? ` · còn ${todo.length - n} lần gọi cho lượt sau (tăng --toi-da)` : ''));
  if (!DONG_Y || !n) { if (n) console.log('Chưa gọi API. Được đồng ý chi phí rồi chạy lại kèm --dong-y.'); return; }
  const key = loadKey();
  if (!key) { console.error('Thiếu key: đặt LLM_EUP_KEY trong .env của repo này.'); process.exit(1); }
  const anh = JSON.parse(fs.readFileSync(ANH, 'utf8'));
  let ok = 0, loi = 0, calls = 0, stop = false, i = 0;
  const work = async () => {
    while (!stop && i < n) {
      const { t, list } = todo[i++];
      const p = LUOI > 1 ? promptLuoi(t, list) : prompt(t || list[0]._t, list[0]);
      const goc = path.join(GOC, THU ? 'thu' : '', t ? t.id : '_tron', LUOI > 1 ? `luoi-${list.map((x) => x.id).join('_').slice(0, 120)}.png` : `${list[0].id}.png`);
      try {
        const buf = await sinh(p, key);
        calls++;
        fs.mkdirSync(path.dirname(goc), { recursive: true });
        fs.writeFileSync(goc, buf);
        list.forEach((x, k) => {
          const tt = t || x._t, out = path.join(OUT_DIR, tt.id, `${x.id}.jpg`);
          fs.mkdirSync(path.dirname(out), { recursive: true });
          if (LUOI > 1) catO(goc, Math.floor(k / LUOI), k % LUOI, out);
          else execFileSync('sips', ['-z', '360', '360', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', goc, '--out', out], { stdio: 'ignore' });
          if (!THU) anh.items[`${tt.id}/${x.id}`] = { file: `img/hai-tu/${tt.id}/${x.id}.jpg`, source: 'ai', model: MODEL, prompt: p, ...(LUOI > 1 && { cell: k }), date: new Date().toISOString().slice(0, 10), w: x.w, vi: x.vi };
          ok++;
        });
        process.stdout.write(`  ✓ ${t ? t.id + ': ' : ''}${list.map((x) => (t ? '' : x._t.id + '/') + x.id).join(', ')}\n`);
      } catch (e) {
        loi++;
        calls++;
        console.error(`  ✗ ${t ? t.id : 'trộn'} (${list.map((x) => x.id).join(', ')}): ${e.message}`);
        if (e.fatal) { stop = true; console.error('Cổng từ chối key: dừng.'); }
      }
    }
  };
  await Promise.all(Array.from({ length: SONG_SONG }, work));
  if (!THU) fs.writeFileSync(ANH, JSON.stringify(anh, null, 1));
  fs.mkdirSync(GOC, { recursive: true });
  const trang = THU ? xemThu(topics) : (xemHtml(anh), path.join(GOC, 'xem.html'));
  console.log(`Xong: ${ok} ảnh từ ${calls - loi} lần gọi, ${loi} lần lỗi · chi phí ước tính ${(calls * gia()).toFixed(2)} USD · trang duyệt ${trang}`);
})();
