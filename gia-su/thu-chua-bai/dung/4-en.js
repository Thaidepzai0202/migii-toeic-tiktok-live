// Bước 4: câu tiếng Anh của bài đọc bằng dịch vụ đọc của Migii (en_audio.js, cùng nguồn với demo gia sư).
//   node gia-su/thu-chua-bai/dung/4-en.js <bài.json> <thư mục am>
const fs = require('fs');
const path = require('path');
const en = require('../../../en_audio');
(async () => {
  const bai = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const cau = bai.buoc.map((b, i) => ({ ...b, i })).filter((b) => b.l === 'en');
  en.allowText(cau.map((b) => b.t));
  for (const b of cau) {
    const f = await en.get(b.t);
    fs.copyFileSync(f, path.join(process.argv[3], `${String(b.i).padStart(2, '0')}.mp3`));
    console.log(b.i, b.t);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
