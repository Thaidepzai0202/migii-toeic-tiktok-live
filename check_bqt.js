// Kiểm kho hai khung Động từ bất quy tắc: node check_bqt.js [file]   (mặc định data/dong-tu-bqt.json)
// Báo lỗi và thoát mã 1 nếu: thiếu trường, có ký tự lạ, từ dài quá ô trên màn, trùng từ, động từ nằm ở cả hai danh sách,
// hoặc động từ có quy tắc mà dạng quá khứ không kết thúc bằng "ed".
const fs = require('fs');
const path = require('path');
const irr = require('./irregular');

const file = path.resolve(process.argv[2] || path.join(__dirname, 'data', 'dong-tu-bqt.json'));
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const errs = [];
const word = /^[a-z]+$/;
const MAX = 10; // chữ cái: ô V1/V2/V3 trên màn rộng 300px

const seen = new Set();
for (const [i, x] of (d.irregular || []).entries()) {
  const tag = `irregular[${i}] ${x.v1 || '?'}`;
  if (!word.test(x.v1 || '')) errs.push(`${tag}: v1 phải là chữ thường a–z`);
  for (const k of ['v2', 'v3']) {
    const forms = String(x[k] || '').split('/');
    if (!forms.every((f) => word.test(f))) errs.push(`${tag}: ${k} phải là chữ thường a–z (hai dạng cách nhau dấu /)`);
    if (forms.length > 2) errs.push(`${tag}: ${k} tối đa hai dạng`);
    if (String(x[k] || '').length > 12) errs.push(`${tag}: ${k} "${x[k]}" dài quá 12 ký tự`);
    if (forms.some((f) => f.length > MAX)) errs.push(`${tag}: ${k} có dạng dài quá ${MAX} chữ cái`);
  }
  for (const k of ['alt2', 'alt3']) if (x[k] && !(Array.isArray(x[k]) && x[k].every((f) => word.test(f)))) errs.push(`${tag}: ${k} phải là mảng chữ thường`);
  if ((x.v1 || '').length > MAX) errs.push(`${tag}: v1 dài quá ${MAX} chữ cái`);
  if (!x.m || x.m.length > 24) errs.push(`${tag}: nghĩa (m) trống hoặc dài quá 24 ký tự`);
  if (seen.has(x.v1)) errs.push(`${tag}: trùng động từ`);
  seen.add(x.v1);
}
const reg = new Set();
for (const [i, x] of (d.regular || []).entries()) {
  const tag = `regular[${i}] ${x.v1 || '?'}`;
  if (!word.test(x.v1 || '') || !word.test(x.v2 || '')) errs.push(`${tag}: v1, v2 phải là chữ thường a–z`);
  if (!/ed$/.test(x.v2 || '')) errs.push(`${tag}: v2 "${x.v2}" không kết thúc bằng ed`);
  if ((x.v2 || '').length > 11) errs.push(`${tag}: v2 dài quá 11 chữ cái`);
  if (seen.has(x.v1)) errs.push(`${tag}: đã có trong danh sách bất quy tắc`);
  if (reg.has(x.v1)) errs.push(`${tag}: trùng động từ`);
  reg.add(x.v1);
}
if (reg.size < 3) errs.push('regular: cần ít nhất 3 động từ có quy tắc');

const I = irr.create(d);
const cols = [0, 0, 0];
for (const v of I.fillable) for (const c of irr.blankCols(v)) cols[c]++;
console.log(`${d.irregular.length} động từ bất quy tắc · ${d.regular.length} động từ có quy tắc`);
console.log(`Chia động từ dùng được ${I.fillable.length} từ (ô có thể khuyết: V1 ${cols[0]} · V2 ${cols[1]} · V3 ${cols[2]}); ${d.irregular.length - I.fillable.length} từ ba dạng giống nhau chỉ ra ở Tìm bất quy tắc`);
if (errs.length) {
  console.log(`\n${errs.length} lỗi:`);
  for (const e of errs) console.log(' - ' + e);
  process.exit(1);
}
console.log('Không có lỗi.');
