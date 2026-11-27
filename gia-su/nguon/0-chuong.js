// Thứ tự phát 100 bài live: 11 chương theo chủ đề. Mỗi chương: các bài từ vựng cùng chủ đề đi liền nhau, rồi tới ngữ pháp.
// Ngữ pháp đi dần từ các thì → bị động → điều kiện → … qua các chương; mỗi bài ngữ pháp có thêm phần "Theo chủ đề":
// 2 câu ví dụ dùng chính các từ vừa học trong chương (vd bên dưới). Người dùng yêu cầu 23/11/2026: bài liên kết với nhau,
// ưu tiên từ cùng chủ đề. Nội dung tạm cho live thử, chưa duyệt.
// Cách viết câu: {…} = chỗ nhấn, […] = tiếng Anh trong lời giảng (noi). Mọi bài trong nguon/ phải nằm đúng một chương.
exports.chuong = [
  {
    ten: 'Văn phòng',
    tu_vung: ['tv-van-phong', 'tv-cong-ty', 'tv-dong-tu-cong-viec', 'tv-email', 'tv-dien-thoai', 'tv-de-nham-4'],
    ngu_phap: ['np-hien-tai-don', 'np-hien-tai-tiep-dien', 'np-hien-tai-hoan-thanh'],
    vd: {
      'np-hien-tai-don': [
        { en: 'My supervisor {checks} the reports every Friday.', vi: 'Cấp trên của tôi kiểm tra báo cáo mỗi thứ Sáu.', noi: 'Việc lặp lại mỗi tuần, chủ ngữ số ít nên dùng [checks].' },
        { en: 'The sales department {replies} to emails within a day.', vi: 'Phòng kinh doanh trả lời email trong vòng một ngày.', noi: 'Thói quen của cả phòng; [reply] tận cùng là [y] nên đổi thành [replies].' },
      ],
      'np-hien-tai-tiep-dien': [
        { en: 'The director {is reading} the agenda now.', vi: 'Giám đốc đang đọc chương trình họp.', noi: 'Có [now], việc đang diễn ra.' },
        { en: 'Please hold. Ms. Lan {is talking} on another line.', vi: 'Vui lòng giữ máy. Chị Lan đang nghe một cuộc gọi khác.', noi: 'Chị Lan đang bận đúng lúc này, nên dùng [is talking].' },
      ],
      'np-hien-tai-hoan-thanh': [
        { en: 'I {have attached} the agenda to this email.', vi: 'Tôi đã đính kèm chương trình họp trong email này.', noi: 'Việc vừa làm xong, dùng [have attached].' },
        { en: 'The director {has not approved} the plan yet.', vi: 'Giám đốc vẫn chưa duyệt kế hoạch.', noi: 'Câu phủ định có [yet] ở cuối, dùng hiện tại hoàn thành.' },
      ],
    },
  },
  {
    ten: 'Họp và sự kiện',
    tu_vung: ['tv-cuoc-hop', 'tv-take', 'tv-cum-dong-tu-3', 'tv-hoi-nghi', 'tv-su-kien', 'tv-bat-quy-tac'],
    ngu_phap: ['np-qua-khu-don', 'np-htht-hay-qkd', 'np-qua-khu-tiep-dien', 'np-qua-khu-hoan-thanh'],
    vd: {
      'np-qua-khu-don': [
        { en: 'The conference {took place} in Hanoi last year.', vi: 'Hội nghị năm ngoái diễn ra ở Hà Nội.', noi: 'Có [last year], và [take] đổi thành [took].' },
        { en: 'We {celebrated} our tenth anniversary in May.', vi: 'Chúng tôi kỷ niệm mười năm thành lập vào tháng Năm.', noi: 'Việc đã xong trong quá khứ, động từ thường thêm [ed].' },
      ],
      'np-htht-hay-qkd': [
        { en: 'The meeting {began} at nine, but the director {has not arrived} yet.', vi: 'Cuộc họp bắt đầu lúc chín giờ, nhưng giám đốc vẫn chưa tới.', noi: 'Có giờ cụ thể thì dùng [began]; tới giờ vẫn chưa tới thì dùng [has not arrived].' },
        { en: 'Ms. Hoa {has won} three awards so far.', vi: 'Tới nay chị Hoa đã giành ba giải thưởng.', noi: 'Có [so far], tính tới bây giờ, dùng hiện tại hoàn thành.' },
      ],
      'np-qua-khu-tiep-dien': [
        { en: 'I {was taking notes} when the fire alarm rang.', vi: 'Tôi đang ghi chép thì chuông báo cháy reo.', noi: 'Việc đang làm dở thì có việc khác xen vào.' },
        { en: 'While the keynote speaker {was talking}, the lights went out.', vi: 'Diễn giả chính đang nói thì mất điện.', noi: 'Có [while], việc đang diễn ra dùng [was talking].' },
      ],
      'np-qua-khu-hoan-thanh': [
        { en: 'When we arrived, the banquet {had already begun}.', vi: 'Khi chúng tôi tới thì bữa tiệc đã bắt đầu rồi.', noi: 'Bữa tiệc bắt đầu trước lúc chúng tôi tới, nên dùng [had begun].' },
        { en: 'They {had called off} the event before the storm came.', vi: 'Họ đã huỷ sự kiện trước khi bão tới.', noi: 'Có [before], việc xảy ra trước dùng [had] cộng động từ dạng ba.' },
      ],
    },
  },
  {
    ten: 'Nhân sự',
    tu_vung: ['tv-tuyen-dung', 'tv-cum-dong-tu-2', 'tv-nhan-su', 'tv-de-nham-3', 'tv-ky-nang', 'tv-dao-tao'],
    ngu_phap: ['np-will-going-to', 'np-menh-de-thoi-gian', 'np-who-which-that', 'np-whose-where', 'np-used-to'],
    vd: {
      'np-will-going-to': [
        { en: 'We {are going to hire} three new engineers next month.', vi: 'Tháng sau chúng tôi sẽ tuyển ba kỹ sư mới.', noi: 'Kế hoạch đã có từ trước, dùng [be going to].' },
        { en: 'Do not worry. I {will fill out} the form for you.', vi: 'Đừng lo. Tôi sẽ điền đơn giúp bạn.', noi: 'Quyết định ngay lúc nói, dùng [will].' },
      ],
      'np-menh-de-thoi-gian': [
        { en: 'You will get a certificate when you {finish} the workshop.', vi: 'Bạn sẽ nhận chứng chỉ khi học xong buổi thực hành.', noi: 'Sau [when] dùng hiện tại đơn, không dùng [will].' },
        { en: 'Ms. Thu will lead the team after Mr. Nam {retires}.', vi: 'Chị Thu sẽ dẫn dắt nhóm sau khi anh Nam nghỉ hưu.', noi: 'Sau [after], dù là chuyện tương lai vẫn dùng [retires].' },
      ],
      'np-who-which-that': [
        { en: 'The applicant {who} has the best qualifications will get the job.', vi: 'Người ứng tuyển có bằng cấp tốt nhất sẽ được nhận.', noi: 'Thay cho người, dùng [who].' },
        { en: 'The workshop {which} you joined was very useful.', vi: 'Buổi học thực hành bạn tham gia rất hữu ích.', noi: 'Thay cho vật, dùng [which].' },
      ],
      'np-whose-where': [
        { en: 'We need an employee {whose} English is very good.', vi: 'Chúng tôi cần một nhân viên giỏi tiếng Anh.', noi: '[whose] chỉ sự sở hữu: tiếng Anh của nhân viên đó.' },
        { en: 'This is the room {where} the interviews take place.', vi: 'Đây là phòng diễn ra các buổi phỏng vấn.', noi: 'Thay cho nơi chốn, dùng [where].' },
      ],
      'np-used-to': [
        { en: 'Mr. Long {used to be} a trainee here.', vi: 'Anh Long từng là học viên ở đây.', noi: 'Trước đây đúng, giờ không còn, dùng [used to] cộng động từ nguyên mẫu.' },
        { en: 'Our trainees {are used to working} long hours.', vi: 'Học viên của chúng tôi đã quen làm việc nhiều giờ.', noi: 'Đã quen với việc gì, dùng [be used to] cộng động từ thêm [ing].' },
      ],
    },
  },
  {
    ten: 'Tài chính',
    tu_vung: ['tv-tai-chinh', 'tv-make', 'tv-de-nham-1', 'tv-ke-toan', 'tv-tien-phi', 'tv-tan-suat'],
    ngu_phap: ['np-bi-dong-hien-tai', 'np-bi-dong-qua-khu', 'np-bi-dong-khuyet-thieu', 'np-bi-dong-hoan-thanh'],
    vd: {
      'np-bi-dong-hien-tai': [
        { en: 'All travel expenses {are reimbursed} by the company.', vi: 'Mọi chi phí đi lại đều được công ty hoàn trả.', noi: 'Chi phí không tự hoàn trả được, nên dùng bị động [are reimbursed].' },
        { en: 'Invoices {are sent} on the first day of each month.', vi: 'Hoá đơn được gửi vào ngày đầu mỗi tháng.', noi: 'Việc lặp lại mỗi tháng: [are] cộng [sent].' },
      ],
      'np-bi-dong-qua-khu': [
        { en: 'The annual budget {was approved} last week.', vi: 'Ngân sách năm đã được duyệt tuần trước.', noi: 'Có [last week], bị động quá khứ: [was approved].' },
        { en: 'The invoices {were paid} on time.', vi: 'Các hoá đơn đã được thanh toán đúng hạn.', noi: 'Chủ ngữ số nhiều nên dùng [were paid].' },
      ],
      'np-bi-dong-khuyet-thieu': [
        { en: 'All receipts {must be kept} for the audit.', vi: 'Mọi biên lai phải được giữ lại cho đợt kiểm toán.', noi: 'Sau [must] là [be] cộng động từ dạng ba.' },
        { en: 'A fee {will be charged} for late payments.', vi: 'Thanh toán trễ sẽ bị tính phí.', noi: 'Sau [will] là [be charged].' },
      ],
      'np-bi-dong-hoan-thanh': [
        { en: 'The quarterly report {has been sent} to the director.', vi: 'Báo cáo quý đã được gửi cho giám đốc.', noi: 'Việc vừa xong: [has been sent].' },
        { en: 'Prices {have been raised} twice this year.', vi: 'Năm nay giá đã bị tăng hai lần.', noi: 'Tính tới giờ, dùng [have been] cộng [raised].' },
      ],
    },
  },
  {
    ten: 'Ngân hàng và cuộc sống',
    tu_vung: ['tv-ngan-hang', 'tv-de-nham-2', 'tv-thue-nha', 'tv-suc-khoe'],
    ngu_phap: ['np-dieu-kien-loai-0', 'np-dieu-kien-loai-1', 'np-dieu-kien-loai-2', 'np-dieu-kien-loai-3', 'np-unless'],
    vd: {
      'np-dieu-kien-loai-0': [
        { en: 'If you {pay} the rent late, the landlord {charges} a fee.', vi: 'Nếu trả tiền thuê trễ thì chủ nhà tính phí.', noi: 'Quy định luôn đúng, hai vế đều dùng hiện tại đơn.' },
        { en: 'If you {enter} the wrong PIN three times, the ATM {keeps} your card.', vi: 'Nếu nhập sai mã PIN ba lần, cây ATM sẽ giữ thẻ của bạn.', noi: 'Chuyện lần nào cũng xảy ra như vậy, nên cả hai vế dùng hiện tại đơn.' },
      ],
      'np-dieu-kien-loai-1': [
        { en: 'If you {deposit} the money today, it {will arrive} tomorrow.', vi: 'Nếu bạn gửi tiền hôm nay thì mai tiền sẽ vào tài khoản.', noi: 'Có thể xảy ra: vế [if] dùng hiện tại đơn, vế sau dùng [will].' },
        { en: 'If the tenant {breaks} the lease, he {will lose} his deposit.', vi: 'Nếu người thuê phá hợp đồng thì sẽ mất tiền cọc.', noi: 'Vế [if] dùng [breaks], vế sau dùng [will lose].' },
      ],
      'np-dieu-kien-loai-2': [
        { en: 'If I {had} more money, I {would buy} a house instead of paying rent.', vi: 'Nếu có nhiều tiền hơn, tôi sẽ mua nhà thay vì trả tiền thuê.', noi: 'Không có thật ở hiện tại: vế [if] dùng quá khứ đơn, vế sau dùng [would].' },
        { en: 'If the bank {lent} us the money, we {would open} a new shop.', vi: 'Nếu ngân hàng cho vay, chúng tôi sẽ mở cửa hàng mới.', noi: '[lend] ở quá khứ là [lent], vế sau dùng [would open].' },
      ],
      'np-dieu-kien-loai-3': [
        { en: 'If I {had remembered} my appointment, I {would have gone} to the dentist.', vi: 'Nếu nhớ lịch hẹn thì tôi đã đi nha sĩ rồi.', noi: 'Chuyện đã qua và không xảy ra: [had remembered], vế sau [would have gone].' },
        { en: 'If we {had read} the lease carefully, we {would have seen} the extra fees.', vi: 'Nếu đọc kỹ hợp đồng thuê thì chúng tôi đã thấy các khoản phí thêm.', noi: 'Tiếc một chuyện trong quá khứ, dùng điều kiện loại ba.' },
      ],
      'np-unless': [
        { en: 'You cannot buy this medicine {unless} you have a prescription.', vi: 'Bạn không mua được thuốc này trừ khi có đơn thuốc.', noi: '[unless] nghĩa là trừ khi, bằng [if not].' },
        { en: 'The bank will lend you money {provided that} you have a stable job.', vi: 'Ngân hàng sẽ cho vay với điều kiện bạn có việc làm ổn định.', noi: '[provided that] nghĩa là với điều kiện là.' },
      ],
    },
  },
  {
    ten: 'Marketing và sản phẩm',
    tu_vung: ['tv-marketing', 'tv-san-pham', 'tv-tinh-tu', 'tv-khao-sat'],
    ngu_phap: ['np-so-sanh-hon', 'np-so-sanh-nhat', 'np-so-sanh-bang', 'np-ing-ed', 'np-hoa-hop-chu-vi'],
    vd: {
      'np-so-sanh-hon': [
        { en: 'The new model is {lighter than} the old one.', vi: 'Mẫu mới nhẹ hơn mẫu cũ.', noi: 'Tính từ ngắn [light] thêm [er], rồi tới [than].' },
        { en: 'This campaign was {more successful than} the last one.', vi: 'Chiến dịch này thành công hơn chiến dịch trước.', noi: 'Tính từ dài nên dùng [more successful than].' },
      ],
      'np-so-sanh-nhat': [
        { en: 'This is {the most affordable} phone we sell.', vi: 'Đây là chiếc điện thoại giá phải chăng nhất chúng tôi bán.', noi: 'Tính từ dài: [the most affordable].' },
        { en: 'The camera is {the best} feature of the new model.', vi: 'Camera là tính năng tốt nhất của mẫu mới.', noi: '[good] ở so sánh nhất là [the best].' },
      ],
      'np-so-sanh-bang': [
        { en: 'Our brand is {as popular as} theirs.', vi: 'Thương hiệu của chúng tôi phổ biến ngang thương hiệu của họ.', noi: 'Ngang nhau thì dùng [as popular as].' },
        { en: 'The prototype is {not as efficient as} we hoped.', vi: 'Mẫu thử không hiệu quả như chúng tôi mong.', noi: 'Phủ định: [not as] cộng tính từ cộng [as].' },
      ],
      'np-ing-ed': [
        { en: 'The survey results were very {surprising}.', vi: 'Kết quả khảo sát rất bất ngờ.', noi: 'Kết quả gây ra cảm giác, nên dùng đuôi [ing].' },
        { en: 'Customers were {excited} about the new features.', vi: 'Khách hàng rất hào hứng với các tính năng mới.', noi: 'Người cảm thấy hào hứng, nên dùng đuôi [ed].' },
      ],
      'np-hoa-hop-chu-vi': [
        { en: 'The results of the survey {are} on your desk.', vi: 'Kết quả khảo sát ở trên bàn của bạn.', noi: 'Chủ ngữ chính là [results], số nhiều, nên dùng [are].' },
        { en: 'Each of our products {has} a two-year warranty.', vi: 'Sản phẩm nào của chúng tôi cũng được bảo hành hai năm.', noi: '[each of] đi với động từ số ít: [has].' },
      ],
    },
  },
  {
    ten: 'Bán hàng và khách hàng',
    tu_vung: ['tv-ban-hang', 'tv-hop-dong', 'tv-mua-sam', 'tv-cham-soc-khach-hang'],
    ngu_phap: ['np-danh-tu', 'np-tinh-tu-trang-tu', 'np-to-v-hay-v-ing', 'np-gioi-tu-v-ing'],
    vd: {
      'np-danh-tu': [
        { en: 'The {negotiation} with the client took three hours.', vi: 'Cuộc đàm phán với khách hàng kéo dài ba tiếng.', noi: 'Sau [the] cần danh từ: [negotiation], từ động từ [negotiate].' },
        { en: 'We will send you a {response} within 24 hours.', vi: 'Chúng tôi sẽ gửi phản hồi cho bạn trong 24 giờ.', noi: 'Sau mạo từ [a] cần danh từ [response], không dùng động từ [respond].' },
      ],
      'np-tinh-tu-trang-tu': [
        { en: 'The staff responded {quickly} to the complaint.', vi: 'Nhân viên đã phản hồi lời phàn nàn rất nhanh.', noi: 'Bổ nghĩa cho động từ [responded], cần trạng từ [quickly].' },
        { en: 'The client was very {satisfied} with the service.', vi: 'Khách hàng rất hài lòng với dịch vụ.', noi: 'Sau [was very] cần tính từ [satisfied].' },
      ],
      'np-to-v-hay-v-ing': [
        { en: 'The client {agreed to sign} the contract.', vi: 'Khách hàng đã đồng ý ký hợp đồng.', noi: '[agree] đi với [to] cộng động từ nguyên mẫu.' },
        { en: 'We {suggest reading} the terms carefully.', vi: 'Chúng tôi đề nghị đọc kỹ các điều khoản.', noi: '[suggest] đi với động từ thêm [ing].' },
      ],
      'np-gioi-tu-v-ing': [
        { en: 'Thank you {for choosing} our store.', vi: 'Cảm ơn bạn đã chọn cửa hàng của chúng tôi.', noi: 'Sau giới từ [for] dùng động từ thêm [ing].' },
        { en: 'Read the terms {before signing} the contract.', vi: 'Hãy đọc các điều khoản trước khi ký hợp đồng.', noi: 'Sau [before] dùng [signing].' },
      ],
    },
  },
  {
    ten: 'Sản xuất và giao hàng',
    tu_vung: ['tv-san-xuat', 'tv-dat-hang', 'tv-giao-hang', 'tv-trang-tu'],
    ngu_phap: ['np-in-on-at', 'np-by-until', 'np-during-while', 'np-because-because-of'],
    vd: {
      'np-in-on-at': [
        { en: 'The shipment will arrive {on} Monday.', vi: 'Lô hàng sẽ tới vào thứ Hai.', noi: 'Trước thứ trong tuần dùng [on].' },
        { en: 'The warehouse closes {at} 6 p.m.', vi: 'Nhà kho đóng cửa lúc 6 giờ chiều.', noi: 'Trước giờ cụ thể dùng [at].' },
      ],
      'np-by-until': [
        { en: 'The parts must be delivered {by} Friday.', vi: 'Phụ tùng phải được giao chậm nhất vào thứ Sáu.', noi: '[by] là hạn chót, không được muộn hơn thứ Sáu.' },
        { en: 'This item will be out of stock {until} next month.', vi: 'Mặt hàng này sẽ hết tới tận tháng sau.', noi: '[until] là kéo dài tới lúc đó.' },
      ],
      'np-during-while': [
        { en: 'Two machines broke down {during} the night shift.', vi: 'Hai máy bị hỏng trong ca đêm.', noi: 'Sau [during] là danh từ: [the night shift].' },
        { en: 'Please wear a helmet {while} you are in the factory.', vi: 'Hãy đội mũ bảo hộ khi ở trong nhà máy.', noi: 'Sau [while] là một mệnh đề có chủ ngữ và động từ.' },
      ],
      'np-because-because-of': [
        { en: 'The shipment was late {because of} bad weather.', vi: 'Lô hàng bị trễ vì thời tiết xấu.', noi: 'Sau [because of] là cụm danh từ.' },
        { en: 'We placed a big order {because} our inventory was low.', vi: 'Chúng tôi đặt một đơn lớn vì hàng tồn kho còn ít.', noi: 'Sau [because] là mệnh đề: [our inventory was low].' },
      ],
    },
  },
  {
    ten: 'Công nghệ và công trình',
    tu_vung: ['tv-cong-nghe', 'tv-cum-dong-tu-1', 'tv-sua-chua', 'tv-moi-truong'],
    ngu_phap: ['np-although-despite', 'np-so-such', 'np-both-either-neither', 'np-not-only-but-also', 'np-however-therefore'],
    vd: {
      'np-although-despite': [
        { en: '{Although} the software is new, it runs very slowly.', vi: 'Dù phần mềm còn mới nhưng chạy rất chậm.', noi: 'Sau [although] là một mệnh đề.' },
        { en: '{Despite} the rain, the construction work continued.', vi: 'Dù trời mưa, việc thi công vẫn tiếp tục.', noi: 'Sau [despite] là danh từ: [the rain].' },
      ],
      'np-so-such': [
        { en: 'The update was {so large} that it took an hour to install.', vi: 'Bản cập nhật lớn tới mức cài mất một tiếng.', noi: '[so] đi với tính từ: [so large].' },
        { en: 'It was {such a noisy} construction site that we closed the windows.', vi: 'Công trường ồn tới mức chúng tôi phải đóng cửa sổ.', noi: '[such] đi với cụm danh từ: [such a noisy construction site].' },
      ],
      'np-both-either-neither': [
        { en: '{Both} the printer {and} the scanner need repairs.', vi: 'Cả máy in và máy quét đều cần sửa.', noi: '[both] đi với [and], động từ số nhiều.' },
        { en: 'You can {either} restart the computer {or} install the update.', vi: 'Bạn có thể khởi động lại máy hoặc cài bản cập nhật.', noi: '[either] đi với [or]: chọn một trong hai.' },
      ],
      'np-not-only-but-also': [
        { en: 'The new lights {not only} save energy {but also} last longer.', vi: 'Đèn mới không chỉ tiết kiệm điện mà còn bền hơn.', noi: '[not only] đi với [but also].' },
        { en: 'Recycling {not only} reduces waste {but also} saves money.', vi: 'Tái chế không chỉ giảm rác thải mà còn tiết kiệm tiền.', noi: 'Hai lợi ích nối bằng [not only] và [but also].' },
      ],
      'np-however-therefore': [
        { en: 'The elevator is under maintenance. {Therefore}, please use the stairs.', vi: 'Thang máy đang bảo trì. Vì vậy, vui lòng đi thang bộ.', noi: '[therefore] nghĩa là vì vậy, nói về kết quả.' },
        { en: 'The renovation was expensive. {However}, the lobby looks great now.', vi: 'Việc cải tạo tốn kém. Tuy nhiên, giờ sảnh trông rất đẹp.', noi: '[however] nghĩa là tuy nhiên, nói ý trái ngược.' },
      ],
    },
  },
  {
    ten: 'Đi lại và công tác',
    tu_vung: ['tv-di-lai', 'tv-san-bay', 'tv-cong-tac'],
    ngu_phap: ['np-must-should-may', 'np-have-something-done', 'np-make-let', 'np-too-enough', 'np-in-order-to-so-that'],
    vd: {
      'np-must-should-may': [
        { en: 'Passengers {must} show their boarding pass at the gate.', vi: 'Hành khách phải xuất trình thẻ lên máy bay ở cửa.', noi: 'Quy định bắt buộc, dùng [must].' },
        { en: 'You {should} leave early because of the traffic.', vi: 'Bạn nên đi sớm vì kẹt xe.', noi: 'Lời khuyên, dùng [should].' },
      ],
      'np-have-something-done': [
        { en: 'I {had my luggage sent} to the hotel.', vi: 'Tôi nhờ người gửi hành lý tới khách sạn.', noi: 'Nhờ người khác làm: [had] cộng vật cộng động từ dạng ba.' },
        { en: 'You can {have your ticket changed} at the counter.', vi: 'Bạn có thể nhờ đổi vé ở quầy.', noi: 'Vé được nhân viên quầy đổi giúp: [have your ticket changed].' },
      ],
      'np-make-let': [
        { en: 'The delay {made us miss} our connecting flight.', vi: 'Chuyến bay trễ khiến chúng tôi lỡ chuyến nối.', noi: '[make] cộng người cộng động từ nguyên mẫu: [made us miss].' },
        { en: 'The airline {let passengers change} their seats for free.', vi: 'Hãng bay cho hành khách đổi chỗ miễn phí.', noi: '[let] cũng đi với động từ nguyên mẫu, không có [to].' },
      ],
      'np-too-enough': [
        { en: 'The bag is {too heavy} to carry on the plane.', vi: 'Túi quá nặng để mang lên máy bay.', noi: '[too] đứng trước tính từ: quá nặng.' },
        { en: 'Is there {enough time} to take the train?', vi: 'Có đủ thời gian để đi tàu không?', noi: '[enough] đứng trước danh từ: [enough time].' },
      ],
      'np-in-order-to-so-that': [
        { en: 'She left home early {in order to} avoid the traffic.', vi: 'Cô ấy rời nhà sớm để tránh kẹt xe.', noi: 'Sau [in order to] là động từ nguyên mẫu.' },
        { en: 'Keep all receipts {so that} you can write your expense report.', vi: 'Hãy giữ mọi biên lai để có thể viết báo cáo chi phí.', noi: 'Sau [so that] là mệnh đề, thường có [can].' },
      ],
    },
  },
  {
    ten: 'Khách sạn và du lịch',
    tu_vung: ['tv-khach-san', 'tv-nha-hang', 'tv-du-lich'],
    ngu_phap: ['np-much-many', 'np-few-little', 'np-each-every-all', 'np-a-an-the', 'np-dai-tu-phan-than', 'np-so-huu'],
    vd: {
      'np-much-many': [
        { en: 'How {many} rooms did you reserve?', vi: 'Bạn đã đặt bao nhiêu phòng?', noi: '[rooms] đếm được, dùng [many].' },
        { en: 'We did not spend {much} money on souvenirs.', vi: 'Chúng tôi không tiêu nhiều tiền vào quà lưu niệm.', noi: '[money] không đếm được, dùng [much].' },
      ],
      'np-few-little': [
        { en: 'The hotel still has {a few} vacancies.', vi: 'Khách sạn vẫn còn vài phòng trống.', noi: '[vacancies] đếm được, dùng [a few].' },
        { en: 'Add {a little} salt to the soup.', vi: 'Thêm một chút muối vào súp.', noi: '[salt] không đếm được, dùng [a little].' },
      ],
      'np-each-every-all': [
        { en: '{Every} room {has} a sea view.', vi: 'Phòng nào cũng nhìn ra biển.', noi: '[every] đi với danh từ số ít và động từ số ít.' },
        { en: '{All} guests {receive} a free breakfast.', vi: 'Mọi khách đều được ăn sáng miễn phí.', noi: '[all] đi với danh từ số nhiều: [guests receive].' },
      ],
      'np-a-an-the': [
        { en: 'We stayed in {a} small hotel near the beach.', vi: 'Chúng tôi ở một khách sạn nhỏ gần bãi biển.', noi: 'Nhắc tới lần đầu, chưa xác định, dùng [a].' },
        { en: '{The} hotel had {an} excellent restaurant.', vi: 'Khách sạn đó có một nhà hàng rất ngon.', noi: 'Khách sạn đã nhắc rồi nên dùng [the]; [excellent] bắt đầu bằng nguyên âm nên dùng [an].' },
      ],
      'np-dai-tu-phan-than': [
        { en: 'Please help {yourself} to the buffet.', vi: 'Xin cứ tự nhiên dùng tiệc buffet.', noi: '[help yourself] nghĩa là cứ tự nhiên lấy.' },
        { en: 'We planned the itinerary {ourselves}.', vi: 'Chúng tôi tự lên lịch trình.', noi: 'Tự mình làm, dùng [ourselves].' },
      ],
      'np-so-huu': [
        { en: 'Is this suitcase {yours}?', vi: 'Va li này là của bạn phải không?', noi: 'Đứng một mình, không có danh từ theo sau, dùng đại từ sở hữu [yours].' },
        { en: 'The guests left {their} luggage at the front desk.', vi: 'Khách để hành lý ở quầy lễ tân.', noi: 'Trước danh từ [luggage] dùng tính từ sở hữu [their].' },
      ],
    },
  },
];
