// Tạo data/exclude.json: các từ của khoá 2800 "Từ vựng theo chủ đề" KHÔNG có trong từ điển kovi.
// Khoá này nhập tay, có từ sai chính tả (푸엌, 구만두다, 슈퍼마겟…) → không đưa lên sóng làm đáp án.
// Các khoá khác giữ nguyên (từ lạ ở đó chủ yếu là từ ghép hợp lệ).
// Chạy lại sau mỗi lần build_bank.js:  node build_exclude.js [đường/dẫn/kovi.db]
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const COURSES = new Set(['2800']);
const DB = process.argv[2] || path.join(__dirname, '../../store-assets/2026-redesign/dicts/kovi.db');
if (!fs.existsSync(DB)) throw new Error(`Không thấy từ điển ${DB}`);

const dict = new Set(
  execFileSync('sqlite3', [DB, 'select distinct c1word from kovi_content'], { maxBuffer: 1 << 28, encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim()),
);
const bank = require('./data/bank.json');
const out = bank.filter((x) => COURSES.has(x.cid) && !dict.has(x.w)).map(({ w, m, cid }) => ({ w, m, cid }));
fs.writeFileSync(path.join(__dirname, 'data', 'exclude.json'), JSON.stringify(out, null, 1));
const total = bank.filter((x) => COURSES.has(x.cid)).length;
console.log(`Từ điển ${dict.size} từ · khoá ${[...COURSES]}: loại ${out.length}/${total} từ → data/exclude.json`);
