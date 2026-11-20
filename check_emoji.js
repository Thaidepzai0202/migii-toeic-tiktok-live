// Kiểm kho câu khung Đoán emoji (data/emoji-400.json) sau khi sửa tay: node check_emoji.js [file]
// Báo lỗi và thoát mã 1 khi: thiếu trường, đáp án có ký tự lạ, trùng đáp án (kể cả với alt của câu khác), trùng bộ emoji,
// từ đơn dài quá 12 chữ cái hoặc cụm từ dài quá 20 chữ cái (không vừa hàng ô chữ trên màn live).
const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, process.argv[2] || 'data/emoji-400.json');
const qs = JSON.parse(fs.readFileSync(file, 'utf8')).questions;
const norm = (s) => String(s).toLowerCase().replace(/[\s\-'’.,!?~"]/g, ''); // giống norm() trong server.js
const errs = [];
const byAns = new Map(), byEmoji = new Map(), count = {};

qs.forEach((q, i) => {
  const at = `câu ${i + 1} (${q.a})`;
  if (!['ghep', 'mota', 'cum'].includes(q.t)) errs.push(`${at}: t phải là ghep | mota | cum`);
  if (!q.e || !q.m) errs.push(`${at}: thiếu e hoặc m`);
  if (!/^[a-z]+( [a-z]+)*$/.test(q.a || '')) errs.push(`${at}: đáp án chỉ gồm chữ thường a–z và dấu cách đơn`);
  for (const x of q.alt || []) if (!/^[a-z]+( [a-z]+)*$/.test(x)) errs.push(`${at}: alt "${x}" có ký tự lạ`);
  const words = String(q.a).split(' '), n = norm(q.a).length;
  if (words.length === 1 && n > 12) errs.push(`${at}: từ đơn dài ${n} chữ cái (tối đa 12)`);
  if (n > 20) errs.push(`${at}: dài ${n} chữ cái (tối đa 20)`);
  if (words.some((w) => w.length > 12)) errs.push(`${at}: có từ dài hơn 12 chữ cái`);
  if (q.t === 'cum' && words.length < 2) errs.push(`${at}: t = cum nhưng chỉ có 1 từ`);
  if (q.t !== 'cum' && words.length > 1) errs.push(`${at}: nhiều từ thì t phải là cum`);
  if ((q.m || '').length > 30) errs.push(`${at}: nghĩa dài ${q.m.length} ký tự (tối đa 30, để vừa một dòng trên màn)`);
  if (byEmoji.has(q.e)) errs.push(`${at}: trùng emoji với "${byEmoji.get(q.e)}"`);
  byEmoji.set(q.e, q.a);
  for (const x of [q.a, ...(q.alt || [])]) {
    const k = norm(x);
    if (byAns.has(k) && byAns.get(k) !== i) errs.push(`${at}: "${x}" trùng với câu ${byAns.get(k) + 1} (${qs[byAns.get(k)].a})`);
    byAns.set(k, i);
  }
  count[q.t] = (count[q.t] || 0) + 1;
});

console.log(`${qs.length} câu · ${Object.entries(count).map(([t, n]) => `${t} ${n}`).join(' · ')}`);
if (errs.length) {
  console.error(errs.join('\n'));
  process.exit(1);
}
console.log('Không có lỗi.');
