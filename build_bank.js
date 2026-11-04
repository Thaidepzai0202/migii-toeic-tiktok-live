// Tạo kho câu đố data/bank.json từ khoá học thật của app (CDN data.jaemy.net).
// Chạy: node build_bank.js   (chạy lại khi muốn cập nhật)
const fs = require('fs');
const path = require('path');

const CDN = 'https://data.jaemy.net/study/vi';
// Khoá từ vựng sơ cấp/trung cấp + Sejong 1–6 + TOPIK; "Bảng chữ cái" (1000) bỏ qua.
const SKIP = new Set(['1000']);

const isHangul = (s) => /^[가-힣]{2,6}$/.test(s);

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

(async () => {
  const courses = await getJson(`${CDN}/courses.json`);
  const seen = new Map();
  for (const c of courses) {
    if (SKIP.has(String(c.id))) continue;
    let data;
    try {
      data = await getJson(`${CDN}/courses/${c.id}.json`);
    } catch (e) {
      console.warn('bỏ qua', c.id, e.message);
      continue;
    }
    let n = 0;
    for (const lesson of data.contents || []) {
      for (const it of lesson.content || []) {
        const w = (it.w || '').trim();
        const m = (it.m || '').trim().replace(/\s+/g, ' ');
        if (!isHangul(w) || !m || m.length > 26 || seen.has(w)) continue;
        // nghĩa kiểu "(ngữ pháp) …" hoặc nhiều nghĩa dài dòng khó đoán → bỏ
        if (/[()\/;]/.test(m)) continue;
        seen.set(w, { w, m, r: (it.r || '').trim(), cid: String(c.id), course: c.title, lesson: lesson.name });
        n++;
      }
    }
    console.log(`${c.id} ${c.title}: +${n}`);
  }
  const out = path.join(__dirname, 'data', 'bank.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify([...seen.values()], null, 0));
  console.log(`=> ${seen.size} từ → ${out}`);
})();
