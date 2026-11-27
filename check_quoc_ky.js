// Kiểm kho khung Đoán quốc kỳ sau khi sửa tay data/quoc-ky.json: node check_quoc_ky.js
// Báo: thiếu ảnh, trùng mã, hai nước trùng cách gõ, tên không đọc được bằng /api/say, sim trỏ tới mã lạ, cách gọi tiếng Việt trùng tên tiếng Anh.
const fs = require('fs');
const path = require('path');
const { enKeys, viKeys } = require('./quoc-ky');
const enAudio = require('./en_audio');

const file = path.resolve(__dirname, process.argv[2] || 'data/quoc-ky.json');
const list = JSON.parse(fs.readFileSync(file, 'utf8')).countries;
const img = path.join(__dirname, 'public', 'img', 'co');
const err = [], codes = new Set(), names = new Map();
for (const x of list) {
  if (!x.c || !x.en || !x.vi) err.push(`${x.c || '?'}: thiếu c / en / vi`);
  if (codes.has(x.c)) err.push(`${x.c}: trùng mã`);
  codes.add(x.c);
  if (!fs.existsSync(path.join(img, `${x.c}.svg`))) err.push(`${x.c} (${x.en}): chưa có ảnh public/img/co/${x.c}.svg`);
  if (!['as', 'eu', 'am', 'af', 'oc'].includes(x.r)) err.push(`${x.c}: khu vực "${x.r}" lạ`);
  if (![1, 2].includes(x.lv)) err.push(`${x.c}: lv phải là 1 hoặc 2`);
  if (!enAudio.valid(x.en)) err.push(`${x.c}: "${x.en}" không đọc được bằng /api/say (chỉ nhận chữ a–z, dấu cách, dấu nháy, tối đa 40 ký tự)`);
  const en = enKeys(x);
  for (const k of en) {
    if (names.has(k) && names.get(k) !== x.c) err.push(`${x.c}: cách gõ "${k}" trùng với ${names.get(k)}`);
    names.set(k, x.c);
  }
  for (const k of viKeys(x)) if (en.includes(k) && (x.vx || []).length) {
    const dup = (x.vx || []).find((v) => enKeys({ en: v }).includes(k));
    if (dup) err.push(`${x.c}: vx "${dup}" trùng tên tiếng Anh (gõ vậy đã được tính đúng), bỏ đi`);
  }
}
for (const x of list) for (const s of x.sim || []) if (!codes.has(s)) err.push(`${x.c}: sim "${s}" không có trong kho`);
const lv1 = list.filter((x) => x.lv === 1).length;
console.log(`${list.length} nước (${lv1} quen thuộc, ${list.length - lv1} khó hơn) từ ${path.relative(__dirname, file)}`);
if (err.length) {
  console.log(`\n${err.length} lỗi:\n- ${[...new Set(err)].join('\n- ')}`);
  process.exit(1);
}
console.log('Không có lỗi.');
