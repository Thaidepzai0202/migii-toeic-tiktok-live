// Thống kê tương tác của live (13/11/2026): lúc chạy ghi từng sự kiện ra data/stats/<ngày>.jsonl, trang /stats dựng báo cáo
// theo game, theo khung giờ, game × giờ và theo phiên live → biết game nào giữ người ở lại, game nào nhiều tương tác, giờ nào đông.
//
// Mỗi dòng một sự kiện { t, k, e, s, p, g, q, v, c, … }:
//   t giờ (ms) · k mã tiến trình server · e loại · s game đang chơi (id khung, null lúc nghỉ) · p pha (break/question/reveal/teach/podium/outro)
//   g số lượt · q số câu trong lượt · v số người xem TikTok lúc đó · c 1 = đang phát (đã nối TikTok, hoặc chạy thử --sim)
//   e: start · phase · tick (mỗi 30 giây) · live (nối/mất TikTok, r = roomId) · game / gameEnd (đầu/cuối lượt)
//      chat · gift (d kim cương, n số quà) · like (n) · follow · share · join — kèm u = mã người (băm)
// Không ghi tên hay nội dung bình luận. Mã TikTok băm kèm muối riêng của máy (data/stats/.salt): vẫn đếm được người khác nhau,
// không đọc ngược ra tài khoản. Bot (bots.js) không được ghi. Chạy thử --sim ghi file riêng (sim-…) để không lẫn số liệu live thật.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = path.join(__dirname, 'data', 'stats');
const VN = 7 * 3600e3; // giờ Việt Nam (UTC+7, không đổi giờ mùa hè)
const dayOf = (t) => new Date(t + VN).toISOString().slice(0, 10);
const hourOf = (t) => new Date(t + VN).getUTCHours();
const hm = (t) => new Date(t + VN).toISOString().slice(11, 16);
const TICK = 30e3;
const GAP = 90e3; // hai sự kiện liền nhau cách quá xa (server treo / tắt máy): chỉ tính tối đa ngần này thời lượng
const PLAY = new Set(['question', 'reveal', 'teach']);
const KENH = { 'word,emoji,irrfill,scramble,startend,irrfind,bricky,haitu,listenmean,oneletter,hunt,chain': 'Dưới 450', 'word,emoji,irrfill,scramble,startend,irrfind,bricky,listenmean,oneletter,hunt,chain': 'Dưới 450', 'word,emoji,irrfill,scramble,startend,irrfind,bricky,listenmean,hunt,chain': 'Dưới 450', 'word,emoji,irrfill,scramble,startend,irrfind,listenmean,hunt,chain': 'Dưới 450', 'word,emoji,scramble,startend,listenmean,hunt,chain': 'Dưới 450', 'word,scramble,startend,listenmean,hunt,chain': 'Dưới 450', 'word,startend,hunt,chain': 'Dưới 450', 'word,fillin,listenmean,errhunt,crossword': '450–650', 'word,speedread,dictate': '650–800', 'word,speedread': '800+' };

function loadSalt() {
  const f = path.join(DIR, '.salt');
  try {
    return fs.readFileSync(f, 'utf8').trim();
  } catch {
    const s = crypto.randomBytes(16).toString('hex');
    fs.writeFileSync(f, s);
    return s;
  }
}

// ---------- ghi ----------
function create({ sim, tag = '', program = [], ctx, room = () => null, off = false }) {
  const handler = (req, res, url, names) => handle(req, res, url, names, sim);
  if (off) return { rec() {}, user() {}, flush() {}, handle: handler }; // không ghi (cổng chạy thử 25 game, script xuất ảnh): trang /stats vẫn xem được
  fs.mkdirSync(DIR, { recursive: true });
  const salt = loadSalt();
  const k = Date.now().toString(36);
  const prefix = `${sim ? 'sim-' : ''}${tag ? tag + '-' : ''}`;
  const hash = (uid) => crypto.createHash('sha256').update(salt + uid).digest('base64url').slice(0, 10);
  let buf = [];
  function rec(e, data) {
    let c = {};
    try {
      c = ctx();
    } catch {}
    buf.push(JSON.stringify({ t: Date.now(), k, e, ...c, ...data }));
    if (buf.length >= 500) flush();
  }
  function user(e, u, data) {
    const uid = u?.uid;
    if (uid == null || u.bot || /^bot:/.test(uid) || (!sim && /^test:/.test(uid))) return; // bot, bình luận thử từ màn điều khiển
    rec(e, { u: hash(String(uid)), ...data });
  }
  function flush() {
    if (!buf.length) return;
    const lines = buf.join('\n') + '\n';
    buf = [];
    try {
      fs.appendFileSync(path.join(DIR, `${prefix}${dayOf(Date.now())}.jsonl`), lines);
    } catch (err) {
      console.warn('Thống kê: không ghi được file', err.message);
    }
  }
  setInterval(flush, 2000).unref();
  setInterval(() => rec('tick', { r: room() || undefined }), TICK).unref();
  // Chỉ bắt SIGTERM (./go_live.sh stop). Không bắt SIGINT/SIGHUP: go_live chạy server dưới nohup (bỏ qua 2 tín hiệu này),
  // gắn handler sẽ ghi đè → đóng Terminal là server thoát rồi bật lại giữa live. Bị ngắt kiểu khác thì mất tối đa 2 giây sự kiện.
  process.on('exit', flush);
  process.once('SIGTERM', () => (flush(), process.exit(0)));
  const prog = program.join(',');
  rec('start', { sim: sim ? 1 : 0, tag, prog, kenh: KENH[prog] || prog });
  return { rec, user, flush, handle: handler };
}

// ---------- đọc + tính ----------
function load(sim, from, to) {
  let names = [];
  try {
    names = fs.readdirSync(DIR);
  } catch {}
  const evs = [];
  for (const n of names) {
    const m = n.match(/^(sim-)?(?:(.+)-)?(\d{4}-\d{2}-\d{2})\.jsonl$/);
    if (!m || !!m[1] !== !!sim || m[3] < from || m[3] > addDay(to, 1)) continue; // file theo ngày lúc ghi: lấy dư 1 ngày, lọc lại theo từng sự kiện
    for (const line of fs.readFileSync(path.join(DIR, n), 'utf8').split('\n')) {
      if (!line) continue;
      try {
        const x = JSON.parse(line);
        const d = dayOf(x.t);
        if (d >= from && d <= to) evs.push(x);
      } catch {}
    }
  }
  return evs.sort((a, b) => a.t - b.t);
}
const addDay = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

const agg = () => ({ ms: 0, vms: 0, vmax: 0, chat: 0, gift: 0, dia: 0, like: 0, follow: 0, share: 0, join: 0, users: new Set(), days: new Set(), slots: new Map(), games: 0 });
const get = (o, key) => (o[key] ??= agg());

function analyze(all, kenh) {
  const meta = {};
  for (const x of all) if (x.e === 'start') meta[x.k] = { kenh: x.kenh, prog: x.prog };
  const kenhs = [...new Set(Object.values(meta).map((m) => m.kenh).filter(Boolean))];
  const evs = kenh ? all.filter((x) => meta[x.k]?.kenh === kenh) : all;

  const tot = agg(), segs = {}, hours = {}, cells = {}, sess = {}, games = {}, order = {};
  const last = {}, room = {}, gkey = {};
  let seq = 0;
  const bucket = (x) => (x.s && PLAY.has(x.p) ? x.s : '_break');
  const skey = (x) => (room[x.k] ? 'r' + room[x.k] : 'k' + x.k);
  for (const x of evs) {
    // thời lượng phát: từ sự kiện trước tới sự kiện này, tính theo trạng thái của sự kiện trước
    const pv = last[x.k];
    if (pv?.c) {
      const dt = Math.min(x.t - pv.t, GAP);
      if (dt > 0) {
        const b = bucket(pv), h = hourOf(pv.t), v = pv.v || 0;
        const S = get(sess, skey(pv));
        for (const a of [tot, get(segs, b), get(hours, h), get(cells, b + '|' + h), S]) {
          a.ms += dt;
          a.vms += v * dt;
        }
        hours[h].days.add(dayOf(pv.t));
        S.t0 ??= pv.t;
        S.t1 = x.t;
        S.kenh ??= meta[pv.k]?.kenh;
        const G = pv.g && PLAY.has(pv.p) && games[gkey[pv.k + ':' + pv.g]];
        if (G) {
          G.ms += dt;
          G.vms += v * dt;
        }
      }
    }
    last[x.k] = x;
    if (x.e === 'live' && x.on && x.r) room[x.k] = x.r;
    if (x.e === 'tick' && x.r) room[x.k] = x.r;
    if (x.c) {
      tot.vmax = Math.max(tot.vmax, x.v || 0);
      const S = get(sess, skey(x));
      S.vmax = Math.max(S.vmax, x.v || 0);
    }
    if (x.e === 'game') {
      const key = x.k + ':' + ++seq; // "Chơi lại từ đầu" đếm lượt lại từ 1 → không dùng số lượt làm khoá
      gkey[x.k + ':' + x.g] = key;
      games[key] = { key, k: x.k, g: x.g, s: x.s, t0: x.t, v0: x.v || 0, c: x.c, n: x.n, ms: 0, vms: 0, chat: 0, dia: 0, like: 0, join: 0, follow: 0, share: 0, pl: new Map(), sk: skey(x) };
      (order[x.k] ??= []).push(key);
      continue;
    }
    if (x.e === 'gameEnd') {
      const G = games[gkey[x.k + ':' + x.g]];
      if (G) Object.assign(G, { t1: x.t, v1: x.v || 0, qs: x.qs });
      continue;
    }
    if (!x.u || !x.c || !['chat', 'gift', 'like', 'follow', 'share', 'join'].includes(x.e)) continue;
    const b = bucket(x), h = hourOf(x.t);
    for (const a of [tot, get(segs, b), get(hours, h), get(cells, b + '|' + h), get(sess, skey(x))]) {
      if (x.e === 'gift') {
        a.gift += x.n || 1;
        a.dia += x.d || 0;
      } else if (x.e === 'like') a.like += x.n || 1;
      else a[x.e]++;
      if (x.e !== 'join') a.users.add(x.u);
    }
    if (x.e !== 'join') {
      const sl = hours[h].slots, d = dayOf(x.t);
      (sl.get(d) || sl.set(d, new Set()).get(d)).add(x.u);
    }
    const G = x.g && PLAY.has(x.p) && games[gkey[x.k + ':' + x.g]];
    if (G) {
      if (x.e === 'gift') G.dia += x.d || 0;
      else if (x.e === 'like') G.like += x.n || 1;
      else G[x.e]++;
      if (x.e === 'chat') (G.pl.get(x.u) || G.pl.set(x.u, new Set()).get(x.u)).add(x.q || 0);
    }
  }

  // từng lượt: chơi đến cuối (người chơi nửa đầu còn chơi ở nửa sau) · sang game sau (người chơi lượt này còn chơi lượt kế)
  const list = Object.values(games).filter((G) => G.c || G.ms > 0);
  for (const keys of Object.values(order)) {
    for (let i = 0; i < keys.length; i++) {
      const G = games[keys[i]], N = games[keys[i + 1]];
      const qs = G.qs || G.n || 0;
      if (G.t1 && qs >= 2 && G.pl.size) {
        const half = qs / 2;
        const first = [...G.pl.values()].filter((qq) => [...qq].some((q) => q >= 1 && q <= half));
        G.stay = [first.filter((qq) => [...qq].some((q) => q > half)).length, first.length];
      }
      if (G.t1 && N && N.g === G.g + 1 && G.pl.size) G.carry = [[...G.pl.keys()].filter((u) => N.pl.has(u)).length, G.pl.size];
    }
  }
  for (const G of list) {
    const A = get(segs, G.s);
    A.games++;
    A.pl = (A.pl || 0) + G.pl.size;
    if (G.stay) (A.stay = A.stay || [0, 0]), (A.stay[0] += G.stay[0]), (A.stay[1] += G.stay[1]);
    if (G.carry) (A.carry = A.carry || [0, 0]), (A.carry[0] += G.carry[0]), (A.carry[1] += G.carry[1]);
    if (G.t1) (A.v0 = (A.v0 || 0) + G.v0), (A.v1 = (A.v1 || 0) + G.v1), (A.vn = (A.vn || 0) + 1);
    const S = sess[G.sk];
    if (S) S.games++;
    tot.games++;
  }
  return { kenhs, tot, segs, hours, cells, sess, games: list.sort((a, b) => b.t0 - a.t0) };
}

// ---------- hiển thị ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const nf = (n, d = 1) => (n == null || !Number.isFinite(n) ? '—' : n.toLocaleString('vi-VN', { maximumFractionDigits: d }));
const pct = (r) => (r == null || !Number.isFinite(r) ? '—' : `${Math.round(r * 100)}%`);
const ratio = (p) => (p && p[1] ? p[0] / p[1] : null);
const mins = (a) => a.ms / 60e3;
const per = (n, a) => (mins(a) >= 0.5 ? n / mins(a) : null);
const avgV = (a) => (a.ms ? a.vms / a.ms : null);
const hourLabel = (h) => `${String(h).padStart(2, '0')}:00–${String((h + 1) % 24).padStart(2, '0')}:00`;

function segRows(R, names) {
  return Object.entries(R.segs)
    .filter(([, a]) => a.ms > 0 || a.games)
    .map(([id, a]) => {
      const pl = a.games ? a.pl / a.games : null;
      const v = avgV(a);
      return {
        id, name: names[id] || id, games: a.games, min: mins(a), v, dv: a.vn ? (a.v1 - a.v0) / a.vn : null, dvp: a.vn && a.v0 ? (a.v1 - a.v0) / a.v0 : null,
        pl, part: pl != null && v ? pl / v : null, chat: per(a.chat, a), like: per(a.like, a), join: per(a.join, a), dia: a.dia, follow: a.follow, share: a.share,
        users: a.users.size, stay: ratio(a.stay), carry: ratio(a.carry),
      };
    })
    .sort((x, y) => (x.id === '_break') - (y.id === '_break') || (y.chat ?? -1) - (x.chat ?? -1));
}
function hourRows(R) {
  return Object.entries(R.hours)
    .filter(([, a]) => a.ms > 0)
    .map(([h, a]) => {
      const sl = [...a.slots.values()];
      return { h: +h, days: a.days.size, min: mins(a), v: avgV(a), users: sl.length ? sl.reduce((s, x) => s + x.size, 0) / Math.max(sl.length, a.days.size) : 0,
        chat: per(a.chat, a), like: per(a.like, a), join: per(a.join, a), dia: a.dia, follow: a.follow, share: a.share };
    })
    .sort((x, y) => x.h - y.h);
}
function sessRows(R) {
  return Object.values(R.sess)
    .filter((a) => a.ms > 0)
    .map((a) => ({ day: dayOf(a.t0), from: hm(a.t0), to: hm(a.t1), kenh: a.kenh || '', min: mins(a), vmax: a.vmax, v: avgV(a), users: a.users.size,
      chat: a.chat, like: a.like, dia: a.dia, follow: a.follow, share: a.share, join: a.join, games: a.games }))
    .sort((x, y) => (y.day + y.from).localeCompare(x.day + x.from));
}
function gameRows(R, names) {
  return R.games.map((G) => ({ day: dayOf(G.t0), at: hm(G.t0), name: names[G.s] || G.s, min: G.ms / 60e3, v0: G.v0, v1: G.t1 ? G.v1 : null, players: G.pl.size,
    chat: G.chat, like: G.like, dia: G.dia, join: G.join, stay: ratio(G.stay), carry: ratio(G.carry), done: !!G.t1 }));
}

const COLS = {
  segs: [['name', 'Game'], ['games', 'Số lượt'], ['min', 'Phút phát'], ['v', 'Người xem TB'], ['dv', 'Người xem đổi / lượt'], ['dvp', 'Người xem đổi (%)'], ['pl', 'Người chơi / lượt'],
    ['part', 'Tỉ lệ tham gia'], ['chat', 'Bình luận / phút'], ['like', 'Like / phút'], ['join', 'Người vào / phút'], ['dia', 'Kim cương'], ['follow', 'Follow'], ['share', 'Share'],
    ['users', 'Người tương tác'], ['stay', 'Chơi đến cuối'], ['carry', 'Sang game sau']],
  hours: [['h', 'Khung giờ'], ['days', 'Số ngày'], ['min', 'Phút phát'], ['v', 'Người xem TB'], ['users', 'Người tương tác / giờ'], ['chat', 'Bình luận / phút'],
    ['like', 'Like / phút'], ['join', 'Người vào / phút'], ['dia', 'Kim cương'], ['follow', 'Follow'], ['share', 'Share']],
  sessions: [['day', 'Ngày'], ['from', 'Từ'], ['to', 'Đến'], ['kenh', 'Kênh'], ['min', 'Phút phát'], ['vmax', 'Người xem cao nhất'], ['v', 'Người xem TB'], ['users', 'Người tương tác'],
    ['chat', 'Bình luận'], ['like', 'Like'], ['dia', 'Kim cương'], ['follow', 'Follow'], ['share', 'Share'], ['join', 'Lượt vào phòng'], ['games', 'Số lượt game']],
  games: [['day', 'Ngày'], ['at', 'Bắt đầu'], ['name', 'Game'], ['min', 'Phút'], ['v0', 'Người xem đầu lượt'], ['v1', 'Người xem cuối lượt'], ['players', 'Người chơi'],
    ['chat', 'Bình luận'], ['like', 'Like'], ['dia', 'Kim cương'], ['join', 'Người vào'], ['stay', 'Chơi đến cuối'], ['carry', 'Sang game sau']],
};
const PCT = new Set(['dvp', 'part', 'stay', 'carry']);

function csv(rows, cols) {
  const cell = (v) => (v == null || (typeof v === 'number' && !Number.isFinite(v)) ? '' : typeof v === 'number' ? String(Math.round(v * 1000) / 1000) : `"${String(v).replace(/"/g, '""')}"`);
  return '﻿' + [cols.map(([, t]) => `"${t}"`).join(','), ...rows.map((r) => cols.map(([k]) => cell(k === 'h' ? hourLabel(r.h) : r[k])).join(','))].join('\r\n');
}

function handle(req, res, url, names, sim) {
  const q = url.searchParams;
  const today = dayOf(Date.now());
  const okDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  const to = okDay(q.get('to')) ? q.get('to') : today;
  const from = okDay(q.get('from')) ? q.get('from') : addDay(to, -6);
  const src = q.get('src') === 'sim' ? 'sim' : q.get('src') === 'live' ? 'live' : sim ? 'sim' : 'live';
  const kenh = q.get('kenh') || '';
  const R = analyze(load(src === 'sim', from, to), kenh);
  const N = { ...names, _break: '⏸ Nghỉ, vinh danh, màn cuối' };
  if (url.pathname.endsWith('.csv')) {
    const t = Object.hasOwn(COLS, q.get('t')) ? q.get('t') : 'segs';
    const rows = { segs: () => segRows(R, N), hours: () => hourRows(R), sessions: () => sessRows(R), games: () => gameRows(R, N) }[t]();
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="thong-ke-${t}-${from}_${to}.csv"`, 'Cache-Control': 'no-store' });
    return res.end(csv(rows, COLS[t]));
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(page(R, N, { from, to, src, kenh, key: q.get('key') || '' }));
}

function table(rows, cols, { best = [], bars = [], fmt = {} } = {}) {
  const max = {};
  for (const k of [...best, ...bars]) max[k] = Math.max(0, ...rows.filter((r) => r.id !== '_break').map((r) => r[k] ?? 0));
  const show = (r, k) => {
    const v = r[k];
    if (fmt[k]) return fmt[k](v, r);
    if (PCT.has(k)) return pct(v);
    if (typeof v === 'number') return nf(v, ['dv', 'pl', 'chat', 'like', 'join', 'v', 'min', 'users'].includes(k) ? 1 : 0);
    return esc(v ?? '—');
  };
  const td = (r, k) => {
    const v = r[k], cls = [typeof v === 'number' || v == null ? 'n' : '', best.includes(k) && r.id !== '_break' && v != null && v > 0 && v === max[k] ? 'best' : ''].filter(Boolean).join(' ');
    const bar = bars.includes(k) && max[k] > 0 && v > 0 && r.id !== '_break' ? `<i class="bar" style="width:${Math.round((v / max[k]) * 100)}%"></i>` : '';
    return `<td${cls ? ` class="${cls}"` : ''}>${bar}<span>${show(r, k)}</span></td>`;
  };
  if (!rows.length) return '<p class="empty">Chưa có số liệu trong khoảng này.</p>';
  return `<div class="tw"><table><thead><tr>${cols.map(([, t]) => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr${r.id === '_break' ? ' class="muted"' : ''}>${cols.map(([k]) => td(r, k)).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}

function heat(R, names, title, val, fmt) {
  const hs = Object.keys(R.hours).map(Number).filter((h) => R.hours[h].ms > 0).sort((a, b) => a - b);
  const ids = Object.keys(R.segs).filter((id) => id !== '_break' && R.segs[id].ms > 0);
  if (!hs.length || !ids.length) return '';
  const v = (id, h) => {
    const a = R.cells[id + '|' + h];
    return a && mins(a) >= 1 ? val(a) : null; // dưới 1 phút phát: ít quá, không tô
  };
  const mx = Math.max(0, ...ids.flatMap((id) => hs.map((h) => v(id, h) ?? 0)));
  return `<h3>${esc(title)}</h3><div class="tw"><table class="heat"><thead><tr><th>Game</th>${hs.map((h) => `<th>${String(h).padStart(2, '0')}h</th>`).join('')}</tr></thead><tbody>${ids
    .map(
      (id) =>
        `<tr><td>${esc(names[id] || id)}</td>${hs
          .map((h) => {
            const x = v(id, h), a = R.cells[id + '|' + h];
            const tip = a ? `${names[id] || id} · ${hourLabel(h)} · ${nf(mins(a))} phút phát` : 'không phát';
            return x == null ? `<td class="n off" title="${esc(tip)}">${a ? '·' : ''}</td>` : `<td class="n" style="--a:${mx ? (0.08 + 0.72 * x / mx).toFixed(2) : 0}" title="${esc(tip)}">${fmt(x)}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('')}</tbody></table></div>`;
}

function insights(segs, hours) {
  const ok = segs.filter((r) => r.id !== '_break' && r.min >= 3);
  const top = (arr, k) => arr.filter((r) => r[k] != null).sort((a, b) => b[k] - a[k])[0];
  const out = [];
  const a = top(ok, 'chat'), b = top(ok, 'stay'), c = top(ok, 'carry'), d = top(ok, 'dvp'), e = top(ok, 'part');
  if (a) out.push(`Nhiều bình luận nhất: <b>${esc(a.name)}</b> (${nf(a.chat)} bình luận/phút)`);
  if (e) out.push(`Người xem tham gia chơi nhiều nhất: <b>${esc(e.name)}</b> (${pct(e.part)} so với người xem)`);
  if (b) out.push(`Giữ người chơi đến cuối lượt tốt nhất: <b>${esc(b.name)}</b> (${pct(b.stay)})`);
  if (c) out.push(`Người chơi ở lại sang game sau nhiều nhất: <b>${esc(c.name)}</b> (${pct(c.carry)})`);
  if (d && d.dvp > 0) out.push(`Người xem tăng trong lượt nhiều nhất: <b>${esc(d.name)}</b> (${d.dvp > 0 ? '+' : ''}${pct(d.dvp)})`);
  const hv = top(hours.filter((r) => r.min >= 5), 'v'), hc = top(hours.filter((r) => r.min >= 5), 'chat');
  if (hv) out.push(`Khung giờ đông người xem nhất: <b>${hourLabel(hv.h)}</b> (${nf(hv.v)} người xem trung bình)`);
  if (hc) out.push(`Khung giờ bình luận sôi nhất: <b>${hourLabel(hc.h)}</b> (${nf(hc.chat)} bình luận/phút)`);
  return out;
}

function page(R, names, { from, to, src, kenh, key }) {
  const segs = segRows(R, names), hours = hourRows(R), sessions = sessRows(R), games = gameRows(R, names).slice(0, 40);
  const T = R.tot;
  const qs = (extra) => {
    const p = new URLSearchParams({ from, to, src, ...(kenh && { kenh }), ...(key && { key }), ...extra });
    return p.toString();
  };
  const tiles = [
    ['Thời gian phát', mins(T) < 60 ? `${nf(mins(T), 0)} phút` : `${nf(mins(T) / 60, 1)} giờ`], ['Người xem trung bình', nf(avgV(T))], ['Người xem cao nhất', nf(T.vmax, 0)], ['Người tương tác', nf(T.users.size, 0)],
    ['Bình luận', nf(T.chat, 0)], ['Like', nf(T.like, 0)], ['Kim cương', nf(T.dia, 0)], ['Follow', nf(T.follow, 0)], ['Share', nf(T.share, 0)], ['Số lượt game', nf(T.games, 0)],
  ];
  const tips = insights(segs, hours);
  const dl = (t, label) => `<a class="dl" href="stats.csv?${esc(qs({ t }))}">⬇ ${label} (CSV)</a>`;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thống kê live</title><style>
:root { --bg: #f4f8f7; --card: #fff; --ink: #10201e; --muted: #5d716d; --line: #dde8e5; --teal: #1c7a6c; --teal2: #48bcaa; --red: #c93a48; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.45 "Avenir Next", -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 1280px; margin: 0 auto; padding: 20px 16px 60px; }
h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 17px; margin: 30px 0 8px; } h3 { font-size: 15px; margin: 18px 0 6px; }
.sub { color: var(--muted); margin: 0 0 14px; }
form { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; }
label { display: grid; gap: 3px; font-size: 12px; color: var(--muted); }
input, select, button { font: inherit; padding: 6px 10px; border: 1px solid var(--line); border-radius: 9px; background: #fff; color: var(--ink); }
button { background: var(--teal); color: #fff; border-color: var(--teal); font-weight: 600; cursor: pointer; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 16px; }
.tile { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 10px 14px; }
.tile b { display: block; font-size: 22px; } .tile span { color: var(--muted); font-size: 12px; }
.tips { background: #e8f5f2; border: 1px solid #c4e5de; border-radius: 14px; padding: 10px 16px; margin-top: 14px; }
.tips li { margin: 3px 0; }
.tw { overflow-x: auto; background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { padding: 7px 10px; border-bottom: 1px solid var(--line); text-align: left; white-space: nowrap; }
th { background: #f0f6f4; color: var(--muted); font-weight: 600; font-size: 12px; position: sticky; top: 0; }
td.n { text-align: right; font-variant-numeric: tabular-nums; position: relative; }
td .bar { position: absolute; left: 0; top: 4px; bottom: 4px; background: rgba(72, 188, 170, .18); border-radius: 0 4px 4px 0; }
td span { position: relative; }
td.best { font-weight: 700; color: var(--teal); }
tr.muted td { color: var(--muted); background: #fafcfb; }
.heat td.n { background: rgba(72, 188, 170, var(--a, 0)); text-align: center; }
.heat td.off { color: #b9c8c4; background: #fafcfb; }
.dl { display: inline-block; margin: 8px 12px 0 0; color: var(--teal); font-weight: 600; text-decoration: none; }
.note { color: var(--muted); font-size: 13px; } .note li { margin: 4px 0; }
.empty { color: var(--muted); background: var(--card); border: 1px dashed var(--line); border-radius: 14px; padding: 16px; }
.badge { display: inline-block; background: #fff3d6; color: #8a5a00; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; margin-left: 6px; vertical-align: middle; }
</style></head><body><main>
<h1>📊 Thống kê live${src === 'sim' ? '<span class="badge">số liệu chạy thử</span>' : ''}</h1>
<p class="sub">Từ ${esc(from)} đến ${esc(to)} · giờ Việt Nam · ${kenh ? `kênh ${esc(kenh)}` : 'mọi kênh'}. Chỉ tính lúc đang phát (đã nối TikTok), không tính bot.</p>
<form method="get" action="stats">
  <label>Từ ngày<input type="date" name="from" value="${esc(from)}"></label>
  <label>Đến ngày<input type="date" name="to" value="${esc(to)}"></label>
  <label>Kênh<select name="kenh"><option value="">Mọi kênh</option>${R.kenhs.map((x) => `<option${x === kenh ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
  <label>Nguồn<select name="src"><option value="live"${src === 'live' ? ' selected' : ''}>Live thật</option><option value="sim"${src === 'sim' ? ' selected' : ''}>Chạy thử</option></select></label>
  ${key ? `<input type="hidden" name="key" value="${esc(key)}">` : ''}<button>Xem</button>
</form>
<div class="tiles">${tiles.map(([t, v]) => `<div class="tile"><b>${v}</b><span>${t}</span></div>`).join('')}</div>
${tips.length ? `<ul class="tips">${tips.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}

<h2>Theo game</h2>
${table(segs, COLS.segs, { best: ['v', 'dv', 'dvp', 'pl', 'part', 'chat', 'like', 'join', 'dia', 'stay', 'carry'], bars: ['chat', 'stay'] })}
${dl('segs', 'Bảng theo game')}

<h2>Theo khung giờ</h2>
${table(hours.map((r) => ({ ...r })), COLS.hours, { best: ['v', 'users', 'chat', 'like', 'join'], bars: ['v', 'chat'], fmt: { h: (h) => hourLabel(h) } })}
${dl('hours', 'Bảng theo khung giờ')}

<h2>Game × khung giờ</h2>
${heat(R, names, 'Bình luận mỗi phút', (a) => a.chat / mins(a), (x) => nf(x)) || '<p class="empty">Chưa có số liệu.</p>'}
${heat(R, names, 'Người xem trung bình', (a) => avgV(a), (x) => nf(x, 0))}
${heat(R, names, 'Like mỗi phút', (a) => a.like / mins(a), (x) => nf(x))}

<h2>Các phiên live</h2>
${table(sessions, COLS.sessions)}
${dl('sessions', 'Bảng phiên live')}

<h2>40 lượt game gần nhất</h2>
${table(games, COLS.games, { fmt: { v1: (v, r) => (r.done ? nf(v, 0) : 'chưa xong') } })}
${dl('games', 'Mọi lượt game')}

<h2>Cách tính</h2>
<ul class="note">
<li><b>Phút phát</b>: thời gian màn đang ở game đó (câu hỏi + công bố đáp án) trong lúc đã nối TikTok. Nghỉ giữa game, vinh danh, màn cuối gộp vào dòng "Nghỉ, vinh danh, màn cuối".</li>
<li><b>Người xem TB</b>: số người xem TikTok báo về, lấy trung bình theo thời gian. <b>Người xem đổi / lượt</b>: người xem cuối lượt trừ đầu lượt, trung bình các lượt (dương là người xem tăng trong lúc chơi game đó).</li>
<li><b>Người chơi / lượt</b>: số người khác nhau bình luận trong một lượt. <b>Tỉ lệ tham gia</b> = người chơi / lượt chia người xem TB (có thể quá 100% vì người xem ra vào liên tục).</li>
<li><b>Chơi đến cuối</b>: trong những người bình luận ở nửa đầu lượt, bao nhiêu phần trăm còn bình luận ở nửa sau. <b>Sang game sau</b>: người chơi lượt này còn bình luận ở lượt kế tiếp bao nhiêu phần trăm (đo game nào giữ người ở lại sau khi kết thúc).</li>
<li><b>Người tương tác</b>: người khác nhau đã bình luận, tặng quà, like, follow hoặc share. Theo khung giờ là trung bình mỗi giờ phát.</li>
<li>Bảng game × giờ chỉ tô ô có từ 1 phút phát trở lên; ô "·" là có phát nhưng chưa đủ 1 phút. Like ít khi TikTok không gửi đủ sự kiện like ở phòng đông.</li>
<li>Số liệu gốc: <code>data/stats/*.jsonl</code> (mỗi dòng một sự kiện, không có tên hay nội dung bình luận).</li>
</ul>
</main></body></html>`;
}

module.exports = { create, analyze, load, segRows, hourRows, sessRows, gameRows };
