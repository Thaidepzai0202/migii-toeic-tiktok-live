// Ngữ pháp (1/2): các thì, bị động, câu điều kiện, mệnh đề quan hệ, từ loại. Nội dung tạm cho buổi live thử 23/11/2026, chưa duyệt.
// Cách viết: xem đầu gia-su/build_bai.js. {…} = chỗ nhấn, […] = tiếng Anh. Đáp án viết ở vị trí đầu (dap: 0), lúc dựng sẽ xáo.
const TH = 'Ngữ pháp · Các thì';
const BD = 'Ngữ pháp · Câu bị động';
const DK = 'Ngữ pháp · Câu điều kiện';
const QH = 'Ngữ pháp · Mệnh đề quan hệ';
const TL = 'Ngữ pháp · Từ loại';

exports.ngu_phap = [
  {
    id: 'np-hien-tai-don', ten: 'Thì hiện tại đơn', nhom: TH,
    y: ['Dùng cho {thói quen}, {sự thật} và {lịch cố định}.'],
    ct: { hien: 'S + V(s/es)', noi: 'chủ ngữ cộng động từ; chủ ngữ số ít như [he], [she], [it] thì động từ thêm [s] hoặc [es]' },
    vd: [
      { en: 'The office {opens} at 8 a.m. every day.', vi: 'Văn phòng mở cửa lúc 8 giờ sáng mỗi ngày.', noi: 'Lịch cố định, chủ ngữ số ít nên dùng [opens].' },
      { en: 'Our team {meets} every Monday.', vi: 'Nhóm chúng tôi họp vào mỗi thứ Hai.', noi: 'Có [every Monday], là việc lặp lại.' },
    ],
    meo: { hien: 'Dấu hiệu: always, usually, often, every day.', noi: 'Gặp [always], [usually], [every day] là nghĩ ngay tới hiện tại đơn.' },
    bt: [
      { cau: 'The shuttle bus ___ the hotel every 30 minutes.', chon: ['leaves', 'leave', 'leaving', 'to leave'], dap: 0, vi_sao: 'có [every 30 minutes] là lịch cố định, chủ ngữ số ít nên dùng [leaves].' },
      { cau: 'Ms. Tran usually ___ to work by train.', chon: ['goes', 'go', 'going', 'gone'], dap: 0, vi_sao: 'có [usually], chủ ngữ số ít nên động từ thêm [es].' },
    ],
  },
  {
    id: 'np-hien-tai-tiep-dien', ten: 'Thì hiện tại tiếp diễn', nhom: TH,
    y: ['Dùng cho việc {đang diễn ra} lúc nói, hoặc {kế hoạch đã hẹn} trong tương lai gần.'],
    ct: { hien: 'S + am/is/are + V-ing', noi: 'chủ ngữ cộng [am], [is] hoặc [are], cộng động từ thêm [ing]' },
    vd: [
      { en: 'The manager {is talking} to a client right now.', vi: 'Quản lý đang nói chuyện với khách hàng.', noi: 'Có [right now], việc đang diễn ra.' },
      { en: 'We {are meeting} the supplier tomorrow.', vi: 'Ngày mai chúng tôi gặp nhà cung cấp.', noi: 'Lịch hẹn đã sắp xếp, cũng dùng tiếp diễn.' },
    ],
    meo: { hien: 'Dấu hiệu: now, right now, at the moment, currently.', noi: 'Gặp [now], [at the moment], [currently] là dùng tiếp diễn.' },
    bt: [
      { cau: 'Mr. Kim cannot answer the phone because he ___ a presentation at the moment.', chon: ['is giving', 'gives', 'gave', 'has given'], dap: 0, vi_sao: 'có [at the moment] là việc đang diễn ra.' },
      { cau: 'The company ___ its old office building this year.', chon: ['is renovating', 'renovate', 'renovating', 'to renovate'], dap: 0, vi_sao: 'việc đang diễn ra, cần [is] cộng động từ thêm [ing].' },
    ],
  },
  {
    id: 'np-hien-tai-hoan-thanh', ten: 'Thì hiện tại hoàn thành', nhom: TH,
    y: ['Dùng cho việc {bắt đầu trong quá khứ} và {kéo dài tới bây giờ}, hoặc vừa mới xong.'],
    ct: { hien: 'S + have/has + V3', noi: 'chủ ngữ cộng [have] hoặc [has], cộng động từ dạng ba' },
    vd: [
      { en: 'She {has worked} here since 2020.', vi: 'Cô ấy làm ở đây từ năm 2020.', noi: 'Có [since], việc kéo dài tới giờ.' },
      { en: 'We {have already sent} the invoice.', vi: 'Chúng tôi đã gửi hoá đơn rồi.', noi: 'Có [already], việc vừa xong.' },
    ],
    meo: { hien: 'Dấu hiệu: since, for, already, yet, so far.', noi: 'Gặp [since], [for], [already], [yet] là nghĩ tới hiện tại hoàn thành.' },
    bt: [
      { cau: 'The sales team ___ its target every month since January.', chon: ['has exceeded', 'exceeds', 'exceeded', 'will exceed'], dap: 0, vi_sao: 'có [since] nên dùng hiện tại hoàn thành.' },
      { cau: 'We have not received the shipment ___.', chon: ['yet', 'already', 'ago', 'since'], dap: 0, vi_sao: 'câu phủ định ở hiện tại hoàn thành dùng [yet] ở cuối câu.' },
    ],
  },
  {
    id: 'np-qua-khu-don', ten: 'Thì quá khứ đơn', nhom: TH,
    y: ['Dùng cho việc {đã xảy ra và kết thúc} tại {một thời điểm xác định} trong quá khứ.'],
    ct: { hien: 'S + V2 (V-ed)', noi: 'chủ ngữ cộng động từ dạng hai; động từ thường thì thêm [ed]' },
    vd: [
      { en: 'The CEO {visited} our branch last week.', vi: 'Giám đốc điều hành đã đến thăm chi nhánh tuần trước.', noi: 'Có [last week], dùng quá khứ đơn.' },
      { en: 'I {sent} the file two days ago.', vi: 'Tôi đã gửi tệp hai ngày trước.', noi: 'Có [ago], và [send] đổi thành [sent].' },
    ],
    meo: { hien: 'Dấu hiệu: yesterday, last week, ago, in 2019.', noi: 'Gặp [yesterday], [last], [ago] là dùng quá khứ đơn.' },
    bt: [
      { cau: 'The board of directors ___ the proposal last Friday.', chon: ['approved', 'approves', 'has approved', 'will approve'], dap: 0, vi_sao: 'có [last Friday] là thời điểm đã qua.' },
      { cau: 'Ms. Lee ___ the company three years ago.', chon: ['joined', 'has joined', 'joins', 'is joining'], dap: 0, vi_sao: 'có [ago] thì dùng quá khứ đơn, không dùng hiện tại hoàn thành.' },
    ],
  },
  {
    id: 'np-htht-hay-qkd', ten: 'Hiện tại hoàn thành hay quá khứ đơn', nhom: TH,
    y: ['Có {thời điểm cụ thể trong quá khứ} thì dùng quá khứ đơn.', 'Có [since], [for], hoặc {kết quả còn tới bây giờ} thì dùng hiện tại hoàn thành.'],
    vd: [
      { en: 'I {finished} the report yesterday.', vi: 'Tôi đã làm xong báo cáo hôm qua.', noi: 'Có [yesterday], dùng quá khứ đơn.' },
      { en: 'I {have finished} the report, so you can read it now.', vi: 'Tôi làm xong báo cáo rồi, bạn đọc được rồi đấy.', noi: 'Kết quả còn tới bây giờ, dùng hiện tại hoàn thành.' },
    ],
    bt: [
      { cau: 'The new software ___ installed on all computers in 2021.', chon: ['was', 'has been', 'is', 'will be'], dap: 0, vi_sao: 'có [in 2021] là thời điểm cụ thể đã qua.' },
      { cau: 'Since the merger, the company ___ two new factories.', chon: ['has opened', 'opened', 'opens', 'was opening'], dap: 0, vi_sao: 'có [since] thì dùng hiện tại hoàn thành.' },
    ],
  },
  {
    id: 'np-qua-khu-tiep-dien', ten: 'Thì quá khứ tiếp diễn', nhom: TH,
    y: ['Dùng cho việc {đang diễn ra} tại một lúc trong quá khứ, thường bị {một việc khác xen vào}.'],
    ct: { hien: 'S + was/were + V-ing', noi: 'chủ ngữ cộng [was] hoặc [were], cộng động từ thêm [ing]' },
    vd: [
      { en: 'I {was checking} my email when the power went out.', vi: 'Tôi đang kiểm tra email thì mất điện.', noi: 'Việc đang làm dùng tiếp diễn, việc xen vào dùng quá khứ đơn.' },
      { en: 'At 9 a.m. yesterday, they {were preparing} for the meeting.', vi: 'Lúc 9 giờ sáng hôm qua, họ đang chuẩn bị cho cuộc họp.', noi: 'Có giờ cụ thể trong quá khứ, việc đang diễn ra.' },
    ],
    bt: [
      { cau: 'While Ms. Ho ___ the presentation, the projector stopped working.', chon: ['was giving', 'gives', 'has given', 'give'], dap: 0, vi_sao: 'sau [while] là việc đang diễn ra trong quá khứ.' },
      { cau: 'The staff were working late when the manager ___.', chon: ['arrived', 'arrives', 'has arrived', 'arriving'], dap: 0, vi_sao: 'việc xen vào một việc đang diễn ra dùng quá khứ đơn.' },
    ],
  },
  {
    id: 'np-qua-khu-hoan-thanh', ten: 'Thì quá khứ hoàn thành', nhom: TH,
    y: ['Dùng cho việc {xảy ra trước} một việc khác {trong quá khứ}.'],
    ct: { hien: 'S + had + V3', noi: 'chủ ngữ cộng [had], cộng động từ dạng ba' },
    vd: [
      { en: 'The meeting {had started} before I arrived.', vi: 'Cuộc họp đã bắt đầu trước khi tôi đến.', noi: 'Việc xảy ra trước dùng [had started].' },
      { en: 'By the time we called, the store {had closed}.', vi: 'Lúc chúng tôi gọi thì cửa hàng đã đóng cửa.', noi: 'Có [by the time] với quá khứ, việc trước dùng [had].' },
    ],
    bt: [
      { cau: 'By the time the client arrived, the team ___ the samples.', chon: ['had prepared', 'prepares', 'has prepared', 'will prepare'], dap: 0, vi_sao: '[by the time] đi với quá khứ đơn thì việc xảy ra trước dùng [had] cộng dạng ba.' },
      { cau: 'Mr. Vu said that he ___ the contract the day before.', chon: ['had signed', 'signs', 'will sign', 'sign'], dap: 0, vi_sao: 'việc ký xảy ra trước lúc nói trong quá khứ, dùng [had signed].' },
    ],
  },
  {
    id: 'np-will-going-to', ten: 'Tương lai: [will] và [be going to]', nhom: TH,
    y: ['{[will]} dùng cho {quyết định ngay lúc nói} và dự đoán.', '{[be going to]} dùng cho {kế hoạch đã có từ trước}.'],
    ct: { hien: 'will + V · am/is/are going to + V', noi: '[will] cộng động từ nguyên mẫu, hoặc [be going to] cộng động từ nguyên mẫu' },
    vd: [
      { en: 'The phone is ringing. I {will answer} it.', vi: 'Điện thoại đang reo. Tôi sẽ nghe.', noi: 'Quyết định ngay lúc đó, dùng [will].' },
      { en: 'We {are going to open} a new branch next year.', vi: 'Chúng tôi sẽ mở chi nhánh mới vào năm sau.', noi: 'Kế hoạch đã có, dùng [going to].' },
    ],
    bt: [
      { cau: 'The new policy ___ effect next month.', chon: ['will take', 'took', 'has taken', 'taking'], dap: 0, vi_sao: 'có [next month] là tương lai, dùng [will] cộng động từ nguyên mẫu.' },
      { cau: 'Ms. Mai is going to ___ the training session on Friday.', chon: ['lead', 'leads', 'leading', 'led'], dap: 0, vi_sao: 'sau [going to] là động từ nguyên mẫu.' },
    ],
  },
  {
    id: 'np-menh-de-thoi-gian', ten: 'Mệnh đề thời gian chỉ tương lai', nhom: TH,
    y: ['Sau {[when], [before], [after], [as soon as], [until]}, nói về tương lai nhưng {dùng thì hiện tại}.'],
    ct: { hien: 'When + S + V (hiện tại), S + will + V', noi: '[when] cộng mệnh đề thì hiện tại, vế còn lại dùng [will]' },
    vd: [
      { en: 'I will call you when I {arrive} at the airport.', vi: 'Tôi sẽ gọi bạn khi tôi đến sân bay.', noi: 'Sau [when] dùng [arrive], không dùng [will arrive].' },
      { en: 'Please wait here until the manager {returns}.', vi: 'Vui lòng chờ ở đây cho tới khi quản lý quay lại.', noi: 'Sau [until] cũng dùng thì hiện tại.' },
    ],
    bt: [
      { cau: 'As soon as the shipment ___, we will contact you.', chon: ['arrives', 'will arrive', 'arrived', 'arriving'], dap: 0, vi_sao: 'sau [as soon as] dùng thì hiện tại cho tương lai.' },
      { cau: 'Before you ___ the office, please turn off the lights.', chon: ['leave', 'will leave', 'left', 'leaving'], dap: 0, vi_sao: 'sau [before] dùng thì hiện tại, không dùng [will].' },
    ],
  },
  {
    id: 'np-bi-dong-hien-tai', ten: 'Câu bị động thì hiện tại', nhom: BD,
    y: ['Dùng bị động khi {người làm không quan trọng}, ta {nhấn vào vật chịu tác động}.'],
    ct: { hien: 'S + am/is/are + V3 (+ by …)', noi: 'chủ ngữ cộng [am], [is] hoặc [are], cộng động từ dạng ba' },
    vd: [
      { en: 'All orders {are shipped} within two days.', vi: 'Mọi đơn hàng được giao trong vòng hai ngày.', noi: 'Đơn hàng không tự giao, nên dùng [are shipped].' },
      { en: 'This room {is cleaned} every evening.', vi: 'Phòng này được dọn vào mỗi tối.', noi: 'Phòng được dọn, dùng [is cleaned].' },
    ],
    bt: [
      { cau: 'Visitor badges ___ at the front desk.', chon: ['are issued', 'issue', 'are issuing', 'issuing'], dap: 0, vi_sao: 'thẻ khách được cấp, cần bị động [are issued].' },
      { cau: 'The report ___ by the finance team every quarter.', chon: ['is prepared', 'prepares', 'is preparing', 'prepare'], dap: 0, vi_sao: 'có [by the finance team] nên dùng bị động.' },
    ],
  },
  {
    id: 'np-bi-dong-qua-khu', ten: 'Câu bị động thì quá khứ', nhom: BD,
    y: ['Bị động ở quá khứ dùng {[was] hoặc [were]} cộng {động từ dạng ba}.'],
    ct: { hien: 'S + was/were + V3', noi: 'chủ ngữ cộng [was] hoặc [were], cộng động từ dạng ba' },
    vd: [
      { en: 'The contract {was signed} last week.', vi: 'Hợp đồng đã được ký tuần trước.', noi: 'Hợp đồng được ký, dùng [was signed].' },
      { en: 'Two new managers {were hired} in May.', vi: 'Hai quản lý mới đã được tuyển vào tháng Năm.', noi: 'Chủ ngữ số nhiều nên dùng [were].' },
    ],
    bt: [
      { cau: 'The conference room ___ yesterday afternoon.', chon: ['was cleaned', 'cleaned', 'is cleaning', 'cleans'], dap: 0, vi_sao: 'phòng được dọn, có [yesterday], dùng [was] cộng dạng ba.' },
      { cau: 'The winners ___ at the end of the ceremony.', chon: ['were announced', 'announced', 'was announced', 'announcing'], dap: 0, vi_sao: 'chủ ngữ số nhiều và được công bố, dùng [were announced].' },
    ],
  },
  {
    id: 'np-bi-dong-khuyet-thieu', ten: 'Bị động với [can], [must], [should], [will]', nhom: BD,
    y: ['Sau {[can], [must], [should], [will]}, bị động dùng {[be] cộng động từ dạng ba}.'],
    ct: { hien: 'modal + be + V3', noi: '[can], [must], [will] cộng [be], cộng động từ dạng ba' },
    vd: [
      { en: 'The form {must be submitted} by Friday.', vi: 'Biểu mẫu phải được nộp trước thứ Sáu.', noi: 'Biểu mẫu được nộp, dùng [must be submitted].' },
      { en: 'The results {will be posted} online.', vi: 'Kết quả sẽ được đăng trên mạng.', noi: 'Sau [will] dùng [be posted].' },
    ],
    bt: [
      { cau: 'All receipts should ___ to the accounting department.', chon: ['be sent', 'send', 'sent', 'sending'], dap: 0, vi_sao: 'hoá đơn được gửi, sau [should] dùng [be sent].' },
      { cau: 'The package can ___ at the front desk after 5 p.m.', chon: ['be picked up', 'pick up', 'picked up', 'picking up'], dap: 0, vi_sao: 'gói hàng được nhận, cần [be picked up].' },
    ],
  },
  {
    id: 'np-bi-dong-hoan-thanh', ten: 'Bị động thì hoàn thành', nhom: BD,
    y: ['Bị động ở hiện tại hoàn thành dùng {[has been] hoặc [have been]} cộng {động từ dạng ba}.'],
    ct: { hien: 'S + have/has been + V3', noi: 'chủ ngữ cộng [has been] hoặc [have been], cộng động từ dạng ba' },
    vd: [
      { en: 'The meeting {has been postponed}.', vi: 'Cuộc họp đã bị hoãn.', noi: 'Cuộc họp bị hoãn, dùng [has been postponed].' },
      { en: 'Three new stores {have been opened} this year.', vi: 'Ba cửa hàng mới đã được mở trong năm nay.', noi: 'Chủ ngữ số nhiều nên dùng [have been].' },
    ],
    bt: [
      { cau: 'The budget proposal has ___ by the director.', chon: ['been approved', 'approved', 'approving', 'be approved'], dap: 0, vi_sao: 'có [by the director], bị động hoàn thành là [has been] cộng dạng ba.' },
      { cau: 'Several complaints ___ about the delay.', chon: ['have been received', 'has been received', 'have received', 'receiving'], dap: 0, vi_sao: 'chủ ngữ số nhiều, khiếu nại được nhận nên dùng [have been received].' },
    ],
  },
  {
    id: 'np-dieu-kien-loai-0', ten: 'Câu điều kiện loại 0', nhom: DK,
    y: ['Dùng cho {sự thật luôn đúng} hoặc {quy định}: cả hai vế đều dùng hiện tại đơn.'],
    ct: { hien: 'If + S + V (hiện tại), S + V (hiện tại)', noi: 'cả hai vế đều dùng thì hiện tại đơn' },
    vd: [
      { en: 'If you {heat} ice, it {melts}.', vi: 'Nếu làm nóng đá, đá sẽ tan.', noi: 'Sự thật luôn đúng, hai vế đều ở hiện tại.' },
      { en: 'If an item {is} damaged, we {replace} it for free.', vi: 'Nếu hàng bị hỏng, chúng tôi đổi miễn phí.', noi: 'Quy định của cửa hàng, dùng loại không.' },
    ],
    bt: [
      { cau: 'If customers ___ before noon, they receive their orders the same day.', chon: ['order', 'will order', 'ordered', 'ordering'], dap: 0, vi_sao: 'quy định luôn đúng, hai vế đều dùng hiện tại đơn.' },
      { cau: 'If the printer runs out of paper, it ___ automatically.', chon: ['stops', 'stopped', 'would stop', 'stopping'], dap: 0, vi_sao: 'việc luôn xảy ra như vậy, vế sau dùng hiện tại đơn.' },
    ],
  },
  {
    id: 'np-dieu-kien-loai-1', ten: 'Câu điều kiện loại 1', nhom: DK,
    y: ['Dùng cho việc {có thể xảy ra} ở hiện tại hoặc tương lai.'],
    ct: { hien: 'If + S + V (hiện tại), S + will + V', noi: 'vế [if] dùng hiện tại đơn, vế còn lại dùng [will] cộng động từ nguyên mẫu' },
    vd: [
      { en: 'If it {rains}, the event {will be moved} indoors.', vi: 'Nếu trời mưa, sự kiện sẽ chuyển vào trong nhà.', noi: 'Vế [if] dùng [rains], vế sau dùng [will].' },
      { en: 'If you {need} help, I {will stay} late.', vi: 'Nếu bạn cần giúp, tôi sẽ ở lại muộn.', noi: 'Việc có thể xảy ra, dùng loại một.' },
    ],
    meo: { hien: 'Vế If không dùng will.', noi: 'Nhớ nhé: vế [if] không dùng [will].' },
    bt: [
      { cau: 'If the client ___ the offer, we will start the project next week.', chon: ['accepts', 'will accept', 'accepted', 'accepting'], dap: 0, vi_sao: 'vế [if] của loại một dùng hiện tại đơn.' },
      { cau: 'If you register early, you ___ a 10% discount.', chon: ['will receive', 'received', 'would have received', 'receiving'], dap: 0, vi_sao: 'vế [if] ở hiện tại thì vế sau dùng [will].' },
    ],
  },
  {
    id: 'np-dieu-kien-loai-2', ten: 'Câu điều kiện loại 2', nhom: DK,
    y: ['Dùng cho việc {không có thật} hoặc {khó xảy ra} ở hiện tại.'],
    ct: { hien: 'If + S + V2, S + would + V', noi: 'vế [if] dùng quá khứ đơn, vế còn lại dùng [would] cộng động từ nguyên mẫu' },
    vd: [
      { en: 'If I {had} more time, I {would join} the course.', vi: 'Nếu có nhiều thời gian hơn, tôi sẽ tham gia khoá học.', noi: 'Thực tế là không có thời gian, dùng loại hai.' },
      { en: 'If I {were} you, I {would accept} the offer.', vi: 'Nếu tôi là bạn, tôi sẽ nhận lời.', noi: 'Với [to be], dùng [were] cho mọi ngôi.' },
    ],
    bt: [
      { cau: 'If the office ___ closer to the station, more people would apply.', chon: ['were', 'is', 'will be', 'has been'], dap: 0, vi_sao: 'vế sau có [would], loại hai dùng [were].' },
      { cau: 'If we had a bigger budget, we ___ more staff.', chon: ['would hire', 'will hire', 'hire', 'had hired'], dap: 0, vi_sao: 'vế [if] dùng quá khứ, vế sau dùng [would] cộng nguyên mẫu.' },
    ],
  },
  {
    id: 'np-dieu-kien-loai-3', ten: 'Câu điều kiện loại 3', nhom: DK,
    y: ['Dùng cho việc {đã không xảy ra} trong quá khứ, và {kết quả chỉ là tưởng tượng}.'],
    ct: { hien: 'If + S + had + V3, S + would have + V3', noi: 'vế [if] dùng [had] cộng dạng ba, vế sau dùng [would have] cộng dạng ba' },
    vd: [
      { en: 'If we {had left} earlier, we {would have caught} the train.', vi: 'Nếu đi sớm hơn thì chúng tôi đã kịp tàu.', noi: 'Thực tế là đi muộn và lỡ tàu.' },
      { en: 'If she {had applied}, she {would have got} the job.', vi: 'Nếu cô ấy nộp đơn thì đã được nhận rồi.', noi: 'Chuyện đã qua, không thay đổi được.' },
    ],
    bt: [
      { cau: 'If the report had been ready, the manager ___ it at the meeting.', chon: ['would have presented', 'will present', 'presents', 'is presenting'], dap: 0, vi_sao: 'vế [if] dùng [had been], vế sau dùng [would have] cộng dạng ba.' },
      { cau: 'If I ___ about the sale, I would have bought more.', chon: ['had known', 'know', 'have known', 'will know'], dap: 0, vi_sao: 'vế sau có [would have] nên vế [if] dùng [had] cộng dạng ba.' },
    ],
  },
  {
    id: 'np-unless', ten: '[Unless] và [provided that]', nhom: DK,
    y: ['{[Unless]} nghĩa là {nếu không}.', '{[Provided that]} nghĩa là {với điều kiện là}.'],
    ct: { hien: 'Unless + S + V = If + S + do not + V', noi: '[unless] bằng [if] cộng phủ định' },
    vd: [
      { en: '{Unless} you hurry, you will miss the bus.', vi: 'Nếu không nhanh lên, bạn sẽ lỡ xe buýt.', noi: '[Unless] đã mang nghĩa phủ định rồi.' },
      { en: 'You can borrow the car {provided that} you return it by 6 p.m.', vi: 'Bạn được mượn xe với điều kiện trả trước 6 giờ tối.', noi: '[Provided that] nêu điều kiện.' },
    ],
    bt: [
      { cau: 'The order will be cancelled ___ payment is received by Monday.', chon: ['unless', 'if', 'because', 'so that'], dap: 0, vi_sao: 'đơn bị huỷ nếu không trả tiền, dùng [unless].' },
      { cau: 'Visitors may enter the lab ___ they wear safety glasses.', chon: ['provided that', 'unless', 'even though', 'so that'], dap: 0, vi_sao: 'được vào với điều kiện đeo kính, dùng [provided that].' },
    ],
  },
  {
    id: 'np-who-which-that', ten: 'Mệnh đề quan hệ: [who], [which], [that]', nhom: QH,
    y: ['{[who]} thay cho người, {[which]} thay cho vật.', '{[that]} thay được cho cả người lẫn vật.'],
    ct: { hien: 'N (người) + who · N (vật) + which', noi: 'danh từ chỉ người dùng [who], danh từ chỉ vật dùng [which]' },
    vd: [
      { en: 'The woman {who} called you is my manager.', vi: 'Người phụ nữ gọi cho bạn là quản lý của tôi.', noi: '[woman] là người, dùng [who].' },
      { en: 'The laptop {which} I bought is very light.', vi: 'Chiếc laptop tôi mua rất nhẹ.', noi: '[laptop] là vật, dùng [which].' },
    ],
    bt: [
      { cau: 'Applicants ___ have management experience are preferred.', chon: ['who', 'which', 'whose', 'where'], dap: 0, vi_sao: '[applicants] là người, dùng [who].' },
      { cau: 'The printer ___ is on the second floor needs repair.', chon: ['which', 'who', 'whom', 'whose'], dap: 0, vi_sao: '[printer] là vật, dùng [which].' },
    ],
  },
  {
    id: 'np-whose-where', ten: 'Mệnh đề quan hệ: [whose], [where]', nhom: QH,
    y: ['{[whose]} chỉ {sở hữu}, theo sau là danh từ.', '{[where]} chỉ {nơi chốn}, theo sau là cả một mệnh đề.'],
    ct: { hien: 'whose + N · where + S + V', noi: '[whose] cộng danh từ, [where] cộng chủ ngữ và động từ' },
    vd: [
      { en: 'This is the client {whose} order was delayed.', vi: 'Đây là khách hàng có đơn hàng bị trễ.', noi: '[whose] chỉ đơn hàng của khách.' },
      { en: 'That is the hotel {where} we held the conference.', vi: 'Đó là khách sạn nơi chúng tôi tổ chức hội nghị.', noi: '[hotel] là nơi chốn, dùng [where].' },
    ],
    bt: [
      { cau: 'We need an assistant ___ English is fluent.', chon: ['whose', 'who', 'which', 'where'], dap: 0, vi_sao: 'tiếng Anh của trợ lý, chỉ sở hữu nên dùng [whose].' },
      { cau: 'The warehouse ___ the products are stored is near the port.', chon: ['where', 'which', 'who', 'whose'], dap: 0, vi_sao: '[warehouse] là nơi chốn, theo sau là cả mệnh đề nên dùng [where].' },
    ],
  },
  {
    id: 'np-ing-ed', ten: 'Tính từ đuôi [ing] và [ed]', nhom: TL,
    y: ['Đuôi {[ing]} chỉ {tính chất của vật, của việc}.', 'Đuôi {[ed]} chỉ {cảm xúc của người}.'],
    ct: { hien: 'interesting (vật) · interested (người)', noi: '[interesting] cho vật, [interested] cho người' },
    vd: [
      { en: 'The presentation was very {interesting}.', vi: 'Bài thuyết trình rất thú vị.', noi: 'Bài thuyết trình gây thú vị, dùng [interesting].' },
      { en: 'The staff were {interested} in the new plan.', vi: 'Nhân viên quan tâm tới kế hoạch mới.', noi: 'Con người cảm thấy quan tâm, dùng [interested].' },
    ],
    bt: [
      { cau: 'Customers were ___ with the quick delivery.', chon: ['satisfied', 'satisfying', 'satisfy', 'satisfaction'], dap: 0, vi_sao: 'khách hàng cảm thấy hài lòng, dùng đuôi [ed].' },
      { cau: 'The sales figures for this quarter are ___.', chon: ['disappointing', 'disappointed', 'disappoint', 'disappointment'], dap: 0, vi_sao: 'số liệu gây thất vọng, dùng đuôi [ing].' },
    ],
  },
  {
    id: 'np-to-v-hay-v-ing', ten: 'Động từ đi với [to V] hay [V-ing]', nhom: TL,
    y: ['Sau {[want], [plan], [decide], [agree]} dùng {[to] cộng động từ}.', 'Sau {[enjoy], [avoid], [consider], [finish]} dùng {động từ thêm [ing]}.'],
    ct: { hien: 'plan to do · avoid doing', noi: '[plan to do], nhưng [avoid doing]' },
    vd: [
      { en: 'We {plan to expand} into Asia.', vi: 'Chúng tôi dự định mở rộng sang châu Á.', noi: 'Sau [plan] dùng [to expand].' },
      { en: 'Please {avoid using} your phone during the meeting.', vi: 'Vui lòng tránh dùng điện thoại trong cuộc họp.', noi: 'Sau [avoid] dùng [using].' },
    ],
    bt: [
      { cau: 'The company has decided ___ its prices next month.', chon: ['to raise', 'raising', 'raise', 'raised'], dap: 0, vi_sao: 'sau [decide] dùng [to] cộng động từ.' },
      { cau: 'Mr. Tan is considering ___ a new car.', chon: ['buying', 'to buy', 'buy', 'bought'], dap: 0, vi_sao: 'sau [consider] dùng động từ thêm [ing].' },
    ],
  },
  {
    id: 'np-gioi-tu-v-ing', ten: 'Giới từ đi với [V-ing]', nhom: TL,
    y: ['Sau {giới từ} như [in], [for], [about], [before], động từ luôn {thêm [ing]}.'],
    ct: { hien: 'preposition + V-ing', noi: 'giới từ cộng động từ thêm [ing]' },
    vd: [
      { en: 'Thank you {for attending} the seminar.', vi: 'Cảm ơn bạn đã tham dự hội thảo.', noi: 'Sau [for] dùng [attending].' },
      { en: 'She is interested {in learning} Japanese.', vi: 'Cô ấy muốn học tiếng Nhật.', noi: 'Sau [in] dùng [learning].' },
    ],
    meo: { hien: 'look forward to + V-ing: to ở đây là giới từ.', noi: 'Cẩn thận: [look forward to] cộng động từ thêm [ing], vì [to] ở đây là giới từ.' },
    bt: [
      { cau: 'Please read the instructions carefully before ___ the machine.', chon: ['operating', 'operate', 'to operate', 'operated'], dap: 0, vi_sao: 'sau giới từ [before] dùng động từ thêm [ing].' },
      { cau: 'We look forward to ___ from you soon.', chon: ['hearing', 'hear', 'heard', 'be heard'], dap: 0, vi_sao: '[to] trong [look forward to] là giới từ, nên dùng [hearing].' },
    ],
  },
  {
    id: 'np-danh-tu', ten: 'Từ loại: nhận ra chỗ cần danh từ', nhom: TL,
    y: ['Danh từ hay đứng {sau [the], [a], [an]} hoặc {sau tính từ sở hữu} như [our], [their].', 'Danh từ thường có đuôi như trong {[information], [payment], [security]}.'],
    ct: { hien: 'the / a / our + (adj) + NOUN', noi: '[the], [a] hoặc [our], có thể thêm tính từ, rồi tới danh từ' },
    vd: [
      { en: 'We appreciate your {cooperation}.', vi: 'Chúng tôi cảm ơn sự hợp tác của bạn.', noi: 'Sau [your] là danh từ [cooperation].' },
      { en: 'The {development} of the app took six months.', vi: 'Việc phát triển ứng dụng mất sáu tháng.', noi: 'Sau [the] là danh từ [development].' },
    ],
    bt: [
      { cau: 'Please send your ___ to the HR department by Friday.', chon: ['application', 'apply', 'applicable', 'applied'], dap: 0, vi_sao: 'sau [your] cần danh từ [application].' },
      { cau: 'The ___ of the new system will take two weeks.', chon: ['installation', 'install', 'installed', 'installs'], dap: 0, vi_sao: 'sau [the] và trước [of] cần danh từ.' },
    ],
  },
  {
    id: 'np-tinh-tu-trang-tu', ten: 'Tính từ hay trạng từ', nhom: TL,
    y: ['{Tính từ} bổ nghĩa cho {danh từ}.', '{Trạng từ}, thường có đuôi [ly], bổ nghĩa cho {động từ}.'],
    ct: { hien: 'adj + N · V + adv', noi: 'tính từ đứng trước danh từ, trạng từ bổ nghĩa cho động từ' },
    vd: [
      { en: 'She gave a {clear} explanation.', vi: 'Cô ấy đưa ra lời giải thích rõ ràng.', noi: '[clear] là tính từ, đứng trước danh từ.' },
      { en: 'She explained the plan {clearly}.', vi: 'Cô ấy giải thích kế hoạch rõ ràng.', noi: '[clearly] là trạng từ, bổ nghĩa cho [explained].' },
    ],
    bt: [
      { cau: 'The new manager speaks very ___ during meetings.', chon: ['confidently', 'confident', 'confidence', 'confide'], dap: 0, vi_sao: 'bổ nghĩa cho động từ [speaks] cần trạng từ.' },
      { cau: 'Our company offers ___ prices to all members.', chon: ['competitive', 'competitively', 'competition', 'compete'], dap: 0, vi_sao: 'đứng trước danh từ [prices] cần tính từ.' },
    ],
  },
];
