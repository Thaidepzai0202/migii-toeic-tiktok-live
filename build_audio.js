// Tạo sẵn phát âm tiếng Anh cho cả kho (data/bank.json) vào data/en-audio/ — chạy 1 lần trước buổi live để lúc phát
// không phải gọi dịch vụ đọc. Chạy lại an toàn: từ đã có file thì bỏ qua.
//   node build_audio.js            (cả kho)
//   node build_audio.js 50         (thử 50 từ đầu)
//   node build_audio.js --words data/word-500.json   (thêm từ của một mốc: từ trong `words` và đáp án các câu trong `questions` nếu có)
//   node build_audio.js --words data/word-500.json --fill data/dien-tu-500.json   (cả các phương án trong câu Điền từ)
//   node build_audio.js --sentences data/nghe-chep-700.json   (cả các câu của khung Nghe – chép, mốc 700)
const fs = require('fs');
const enAudio = require('./en_audio');
const bank = require('./data/bank.json');

const args = process.argv.slice(2);
const opts = (n) => args.flatMap((a, i) => (a === `--${n}` ? [args[i + 1]] : []));
const limit = Number(args.find((a) => /^\d+$/.test(a))) || bank.length;
const extra = [];
for (const f of opts('words')) extra.push(...JSON.parse(fs.readFileSync(f, 'utf8')).words.map((x) => x.w));
for (const f of opts('fill')) for (const q of JSON.parse(fs.readFileSync(f, 'utf8')).questions) extra.push(...q.o);
const sentences = [];
for (const f of opts('sentences')) sentences.push(...JSON.parse(fs.readFileSync(f, 'utf8')).questions.map((q) => q.s));
enAudio.allowText(sentences); // câu dài chỉ đọc được khi đã đăng ký
extra.push(...sentences);
const onlyExtra = opts('words').length + opts('fill').length + opts('sentences').length > 0;
const words = [...new Set([...(onlyExtra ? [] : bank.slice(0, limit).map((x) => x.w)), ...extra])].filter(enAudio.valid);
const CONCURRENCY = 3; // nhẹ tay với dịch vụ đọc

(async () => {
  let i = 0, ok = 0, fail = 0;
  const worker = async () => {
    while (i < words.length) {
      const w = words[i++];
      try {
        await enAudio.get(w);
        ok++;
      } catch (e) {
        fail++;
        console.warn(`✗ ${w}: ${e.message}`);
      }
      if ((ok + fail) % 100 === 0) console.log(`${ok + fail}/${words.length}…`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Xong: ${ok} từ/câu có phát âm, ${fail} lỗi (lỗi thì lúc live trang tự đọc bằng giọng trình duyệt).`);
})();
