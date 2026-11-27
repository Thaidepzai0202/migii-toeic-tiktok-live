// Từ vựng (2/2): điện thoại, cụm động từ, cụm từ cố định, từ dễ nhầm, tính từ/trạng từ hay gặp, hợp đồng, du lịch, công ty…
// Nội dung tạm cho buổi live thử 23/11/2026, chưa duyệt. Mỗi từ: [từ, loại, nghĩa, câu ví dụ có {từ}, nghĩa câu ví dụ, câu ví dụ 2 (theo chủ đề chương), nghĩa câu 2].
// Cách viết: xem đầu gia-su/build_bai.js. Đáp án viết ở vị trí đầu (dap: 0), lúc dựng sẽ xáo.
const CDT = 'Từ vựng · Cụm động từ';
const DN = 'Từ vựng · Từ dễ nhầm';

exports.tu_vung = [
  {
    id: 'tv-dien-thoai', ten: 'Từ vựng gọi điện', nhom: 'Từ vựng · Điện thoại', chu_de: 'gọi điện công việc',
    tu: [
      ['extension', 'n', 'số máy lẻ', 'Please call me at {extension} 205.', 'Vui lòng gọi tôi theo số máy lẻ 205.', 'The front desk is {extension} 100.', 'Lễ tân là số máy lẻ 100.'],
      ['voicemail', 'n', 'hộp thư thoại', 'I left a message on her {voicemail}.', 'Tôi đã để lại lời nhắn trong hộp thư thoại của cô ấy.', 'Please check your {voicemail} after lunch.', 'Hãy kiểm tra hộp thư thoại sau giờ trưa.'],
      ['hold', 'v', 'giữ máy', 'Please {hold} while I transfer your call.', 'Vui lòng giữ máy trong lúc tôi chuyển cuộc gọi.', 'Could you {hold} for a moment, please?', 'Bạn vui lòng giữ máy một chút nhé?'],
      ['transfer', 'v', 'chuyển cuộc gọi', 'I will {transfer} you to the sales department.', 'Tôi sẽ chuyển bạn tới phòng kinh doanh.', 'Your call has been {transferred} to Ms. Lan.', 'Cuộc gọi của bạn đã được chuyển cho chị Lan.'],
    ],
    dich: [
      [1, 'Tôi sẽ kiểm tra hộp thư thoại.', 'I will check my {voicemail}.', 'I will check the voicemail.'],
      [3, 'Tôi sẽ chuyển cuộc gọi của bạn.', 'I will {transfer} your call.'],
    ],
    bt: [
      { cau: 'If no one answers, please leave a message on my ___.', chon: ['voicemail', 'extension', 'hold', 'transfer'], dap: 0, vi_sao: 'để lại lời nhắn trong [voicemail], hộp thư thoại.' },
      { cau: 'Let me ___ your call to the manager.', chon: ['transfer', 'hold', 'voicemail', 'extension'], dap: 0, vi_sao: 'chuyển cuộc gọi cho người khác là [transfer].' },
    ],
  },
  {
    id: 'tv-cum-dong-tu-1', ten: 'Cụm động từ hay gặp (1)', nhom: CDT, chu_de: 'cụm động từ',
    tu: [
      ['look into', 'phr', 'xem xét, tìm hiểu', 'We will {look into} your complaint.', 'Chúng tôi sẽ xem xét khiếu nại của bạn.', 'The IT team is {looking into} the problem.', 'Nhóm IT đang xem xét sự cố.'],
      ['set up', 'phr', 'lắp đặt, thiết lập', 'Can you {set up} the projector?', 'Bạn lắp máy chiếu giúp được không?', 'We need to {set up} the new computers before Monday.', 'Phải lắp đặt máy tính mới trước thứ Hai.'],
      ['carry out', 'phr', 'thực hiện', 'The team will {carry out} a survey.', 'Nhóm sẽ thực hiện một cuộc khảo sát.', 'Engineers will {carry out} safety checks tomorrow.', 'Ngày mai kỹ sư sẽ kiểm tra an toàn.'],
      ['put off', 'phr', 'trì hoãn', 'Let us {put off} the meeting until Monday.', 'Hãy dời cuộc họp sang thứ Hai.', 'The system update was {put off} until the weekend.', 'Việc cập nhật hệ thống bị lùi tới cuối tuần.'],
    ],
    dich: [
      [1, 'Anh ấy đang lắp đặt máy in.', 'He is {setting up} the printer.', 'He is setting the printer up.'],
      [3, 'Đừng trì hoãn công việc của bạn.', 'Do not {put off} your work.', 'Do not put your work off.'],
    ],
    bt: [
      { cau: 'The manager promised to ___ the problem right away.', chon: ['look into', 'put off', 'set up', 'carry out'], dap: 0, vi_sao: 'hứa [look into], xem xét vấn đề ngay.' },
      { cau: 'Because of the storm, we had to ___ the outdoor event.', chon: ['put off', 'look into', 'set up', 'carry out'], dap: 0, vi_sao: 'vì bão nên phải [put off], hoãn sự kiện.' },
    ],
  },
  {
    id: 'tv-cum-dong-tu-2', ten: 'Cụm động từ hay gặp (2)', nhom: CDT, chu_de: 'cụm động từ',
    tu: [
      ['fill out', 'phr', 'điền đơn', 'Please {fill out} this form.', 'Vui lòng điền vào mẫu đơn này.', 'Applicants must {fill out} the form online.', 'Người ứng tuyển phải điền đơn trực tuyến.'],
      ['turn down', 'phr', 'từ chối', 'She {turned down} the job offer.', 'Cô ấy đã từ chối lời mời làm việc.', 'The company {turned down} his request for leave.', 'Công ty đã từ chối đơn xin nghỉ của anh ấy.'],
      ['figure out', 'phr', 'tìm ra, hiểu ra', 'We need to {figure out} why sales dropped.', 'Chúng ta cần tìm ra vì sao doanh số giảm.', 'New staff need time to {figure out} the system.', 'Nhân viên mới cần thời gian để hiểu hệ thống.'],
      ['run out of', 'phr', 'hết, cạn', 'The printer has {run out of} paper.', 'Máy in hết giấy rồi.', 'We have {run out of} application forms.', 'Chúng tôi hết mẫu đơn ứng tuyển rồi.'],
    ],
    dich: [
      [1, 'Cô ấy đã từ chối lời mời làm việc.', 'She {turned down} the job offer.', 'She turned the job offer down.'],
      [3, 'Chúng tôi hết cà phê rồi.', 'We have {run out of} coffee.', 'We ran out of coffee.'],
    ],
    bt: [
      { cau: 'Applicants must ___ the application form in black ink.', chon: ['fill out', 'turn down', 'figure out', 'run out of'], dap: 0, vi_sao: 'mẫu đơn thì [fill out], điền vào.' },
      { cau: 'We have ___ printer ink, so please order some more.', chon: ['run out of', 'filled out', 'turned down', 'figured out'], dap: 0, vi_sao: 'phải đặt thêm vì đã [run out of], hết mực.' },
    ],
  },
  {
    id: 'tv-cum-dong-tu-3', ten: 'Cụm động từ hay gặp (3)', nhom: CDT, chu_de: 'cụm động từ',
    tu: [
      ['call off', 'phr', 'huỷ bỏ', 'They {called off} the trip because of the rain.', 'Họ huỷ chuyến đi vì trời mưa.', 'The outdoor party was {called off} because of the storm.', 'Bữa tiệc ngoài trời bị huỷ vì bão.'],
      ['take over', 'phr', 'tiếp quản', 'Ms. Thao will {take over} the project next month.', 'Cô Thảo sẽ tiếp quản dự án vào tháng sau.', 'Mr. Tuan will {take over} as event manager.', 'Anh Tuấn sẽ tiếp quản vị trí quản lý sự kiện.'],
      ['go over', 'phr', 'xem lại kỹ', 'Let us {go over} the contract once more.', 'Hãy xem kỹ lại hợp đồng thêm một lần.', 'Let us {go over} the agenda before we start.', 'Mình cùng xem lại chương trình họp trước khi bắt đầu.'],
      ['drop off', 'phr', 'đưa tới, để lại', 'Please {drop off} the documents at reception.', 'Vui lòng để tài liệu ở quầy lễ tân.', 'I will {drop off} the name cards at the hall.', 'Tôi sẽ để thẻ tên ở hội trường.'],
    ],
    dich: [
      [1, 'Chị Lan sẽ tiếp quản dự án.', 'Ms. Lan will {take over} the project.', 'Lan will take over the project.', 'Miss Lan will take over the project.', 'Mrs. Lan will take over the project.'],
      [3, 'Tôi sẽ để tài liệu ở lễ tân.', 'I will {drop off} the documents at reception.', 'I will drop off the documents at the reception.', 'I will drop the documents off at reception.'],
    ],
    bt: [
      { cau: 'When Mr. Hai retires, his daughter will ___ the business.', chon: ['take over', 'call off', 'drop off', 'go over'], dap: 0, vi_sao: 'con gái [take over], tiếp quản việc kinh doanh.' },
      { cau: 'Before signing, please ___ the terms carefully.', chon: ['go over', 'take over', 'call off', 'drop off'], dap: 0, vi_sao: 'trước khi ký thì [go over], xem kỹ điều khoản.' },
    ],
  },
  {
    id: 'tv-make', ten: 'Cụm từ đi với [make]', nhom: 'Từ vựng · Cụm từ cố định', chu_de: 'cụm từ đi với [make]',
    tu: [
      ['make a decision', 'phr', 'đưa ra quyết định', 'We must {make a decision} today.', 'Chúng ta phải quyết định trong hôm nay.', 'The board will {make a decision} on the budget next week.', 'Tuần sau hội đồng sẽ quyết định về ngân sách.'],
      ['make an effort', 'phr', 'nỗ lực, cố gắng', 'Please {make an effort} to arrive on time.', 'Vui lòng cố gắng đến đúng giờ.', 'We must {make an effort} to cut costs.', 'Chúng ta phải cố gắng cắt giảm chi phí.'],
      ['make a profit', 'phr', 'có lãi', 'The store {made a profit} in its first year.', 'Cửa hàng có lãi ngay năm đầu.', 'The new branch has not {made a profit} yet.', 'Chi nhánh mới chưa có lãi.'],
      ['make a call', 'phr', 'gọi điện', 'I need to {make a call} before the meeting.', 'Tôi cần gọi một cuộc điện thoại trước cuộc họp.', 'Let me {make a call} to the bank.', 'Để tôi gọi cho ngân hàng.'],
    ],
    dich: [
      [1, 'Tôi sẽ cố gắng.', 'I will {make an effort}.'],
      [3, 'Tôi cần gọi một cuộc điện thoại.', 'I need to {make a call}.', 'I need to make a phone call.'],
    ],
    bt: [
      { cau: 'The company sold more than it spent, so it made a ___.', chon: ['profit', 'decision', 'call', 'effort'], dap: 0, vi_sao: 'thu nhiều hơn chi là [make a profit], có lãi.' },
      { cau: 'I will make a quick ___ to the client and come back.', chon: ['call', 'profit', 'decision', 'effort'], dap: 0, vi_sao: 'gọi nhanh cho khách là [make a call].' },
    ],
  },
  {
    id: 'tv-take', ten: 'Cụm từ đi với [take]', nhom: 'Từ vựng · Cụm từ cố định', chu_de: 'cụm từ đi với [take]',
    tu: [
      ['take part in', 'phr', 'tham gia', 'Ten companies will {take part in} the fair.', 'Mười công ty sẽ tham gia hội chợ.', 'All staff are invited to {take part in} the sports day.', 'Mọi nhân viên được mời tham gia ngày hội thể thao.'],
      ['take place', 'phr', 'diễn ra', 'The meeting will {take place} in Room 3.', 'Cuộc họp sẽ diễn ra ở phòng 3.', 'The conference {took place} in Da Nang last year.', 'Hội nghị năm ngoái diễn ra ở Đà Nẵng.'],
      ['take notes', 'phr', 'ghi chép', 'Please {take notes} during the lecture.', 'Vui lòng ghi chép trong buổi giảng.', 'Mr. Duc will {take notes} at the meeting.', 'Anh Đức sẽ ghi chép trong cuộc họp.'],
      ['take a break', 'phr', 'nghỉ giải lao', 'Let us {take a break} for ten minutes.', 'Hãy nghỉ giải lao mười phút.', 'We {took a break} after the first speaker.', 'Chúng tôi nghỉ giải lao sau diễn giả đầu tiên.'],
    ],
    dich: [
      [1, 'Buổi tiệc diễn ra tối nay.', 'The party {takes place} tonight.', 'The party will take place tonight.', 'The party is taking place tonight.'],
      [3, 'Mình nghỉ giải lao nhé.', 'Let us {take a break}.'],
    ],
    bt: [
      { cau: 'The annual festival will ___ in the city park.', chon: ['take place', 'take part in', 'take notes', 'take a break'], dap: 0, vi_sao: 'lễ hội [take place], diễn ra ở công viên.' },
      { cau: 'All employees are invited to ___ the charity run.', chon: ['take part in', 'take place', 'take notes', 'take a break'], dap: 0, vi_sao: 'mời nhân viên [take part in], tham gia cuộc chạy.' },
    ],
  },
  {
    id: 'tv-de-nham-1', ten: 'Từ dễ nhầm: [affect], [effect], [raise], [rise]', nhom: DN, chu_de: 'các từ dễ nhầm',
    tu: [
      ['affect', 'v', 'ảnh hưởng tới', 'The weather may {affect} our sales.', 'Thời tiết có thể ảnh hưởng tới doanh số.', 'High costs {affected} our profit this year.', 'Chi phí cao đã ảnh hưởng tới lợi nhuận năm nay.'],
      ['effect', 'n', 'tác động, hiệu quả', 'The new rule had a good {effect}.', 'Quy định mới có tác động tốt.', 'The price cut had a big {effect} on sales.', 'Việc giảm giá tác động lớn tới doanh số.'],
      ['raise', 'v', 'nâng, tăng, cần có tân ngữ', 'The company will {raise} prices in May.', 'Công ty sẽ tăng giá vào tháng Năm.', 'The bank {raised} its interest rate.', 'Ngân hàng đã tăng lãi suất.'],
      ['rise', 'v', 'tự tăng lên, không cần tân ngữ', 'Prices {rise} every year.', 'Giá cả tăng lên mỗi năm.', 'Our revenue {rose} by 5% last quarter.', 'Doanh thu quý trước tăng 5%.'],
    ],
    dich: [
      [1, 'Cơn mưa tác động lớn tới doanh số.', 'The rain had a big {effect} on sales.', 'The rain has a big effect on sales.', 'Rain had a big effect on sales.', 'Rain has a big effect on sales.'],
      [3, 'Giá nhà tăng mỗi năm.', 'House prices {rise} every year.', 'Housing prices rise every year.', 'Home prices rise every year.', 'The price of houses rises every year.'],
    ],
    bt: [
      { cau: 'The new law will ___ many small businesses.', chon: ['affect', 'effect', 'rise', 'risen'], dap: 0, vi_sao: 'sau [will] cần động từ, [affect] là ảnh hưởng tới.' },
      { cau: 'Sales have ___ by 10% since January.', chon: ['risen', 'raised', 'affected', 'effect'], dap: 0, vi_sao: '[rise] không cần tân ngữ, dạng ba là [risen].' },
    ],
  },
  {
    id: 'tv-de-nham-2', ten: 'Từ dễ nhầm: [lend], [borrow], [remind], [remember]', nhom: DN, chu_de: 'các từ dễ nhầm',
    tu: [
      ['lend', 'v', 'cho mượn', 'Can you {lend} me your pen?', 'Bạn cho tôi mượn bút được không?', 'The bank will {lend} us the money.', 'Ngân hàng sẽ cho chúng tôi vay tiền.'],
      ['borrow', 'v', 'mượn', 'May I {borrow} your charger?', 'Tôi mượn sạc của bạn được không?', 'We {borrowed} 200 million dong from the bank.', 'Chúng tôi đã vay ngân hàng 200 triệu đồng.'],
      ['remind', 'v', 'nhắc nhở', 'Please {remind} me about the meeting.', 'Vui lòng nhắc tôi về cuộc họp.', 'The app {reminds} you when a bill is due.', 'Ứng dụng nhắc bạn khi hoá đơn tới hạn.'],
      ['remember', 'v', 'nhớ', 'I cannot {remember} his name.', 'Tôi không nhớ tên anh ấy.', 'Please {remember} to pay the electricity bill.', 'Nhớ trả tiền điện nhé.'],
    ],
    dich: [
      [1, 'Tôi mượn bút của bạn được không?', 'Can I {borrow} your pen?', 'May I borrow your pen?', 'Could I borrow your pen?'],
      [3, 'Tôi không nhớ mật khẩu.', 'I do not {remember} the password.', 'I do not remember my password.', 'I cannot remember the password.', 'I cannot remember my password.'],
    ],
    bt: [
      { cau: 'Could I ___ your laptop for an hour?', chon: ['borrow', 'lend', 'remind', 'remember'], dap: 0, vi_sao: 'người nói mượn của người khác: [borrow].' },
      { cau: 'Please ___ all staff to submit their timesheets.', chon: ['remind', 'remember', 'lend', 'borrow'], dap: 0, vi_sao: '[remind] ai đó làm gì là nhắc nhở.' },
    ],
  },
  {
    id: 'tv-de-nham-3', ten: 'Từ dễ nhầm: [personal], [personnel], [economic], [economical]', nhom: DN, chu_de: 'các từ dễ nhầm',
    tu: [
      ['personal', 'adj', 'cá nhân', 'Do not use the office phone for {personal} calls.', 'Đừng dùng điện thoại văn phòng cho việc cá nhân.', 'Please keep your {personal} items in the locker.', 'Vui lòng để đồ cá nhân trong tủ khoá.'],
      ['personnel', 'n', 'nhân sự, nhân viên', 'Only authorized {personnel} may enter.', 'Chỉ nhân viên có thẩm quyền mới được vào.', 'The {personnel} department handles all new hires.', 'Phòng nhân sự lo toàn bộ người mới tuyển.'],
      ['economic', 'adj', 'thuộc về kinh tế', 'The {economic} situation is improving.', 'Tình hình kinh tế đang cải thiện.', 'The {economic} crisis made hiring difficult.', 'Khủng hoảng kinh tế khiến việc tuyển người khó khăn.'],
      ['economical', 'adj', 'tiết kiệm', 'This car is very {economical} on fuel.', 'Chiếc xe này rất tiết kiệm xăng.', 'Online interviews are more {economical} than face-to-face ones.', 'Phỏng vấn trực tuyến tiết kiệm hơn phỏng vấn trực tiếp.'],
    ],
    dich: [
      [1, 'Phòng nhân sự ở tầng hai.', 'The {personnel} department is on the second floor.', 'The personnel office is on the second floor.'],
      [3, 'Chiếc xe này rất tiết kiệm.', 'This car is very {economical}.'],
    ],
    bt: [
      { cau: 'Please contact the ___ department about your contract.', chon: ['personnel', 'personal', 'economic', 'economical'], dap: 0, vi_sao: 'phòng nhân sự là [personnel department].' },
      { cau: 'This printer uses very little ink, so it is very ___.', chon: ['economical', 'economic', 'personal', 'personnel'], dap: 0, vi_sao: 'tốn ít mực là [economical], tiết kiệm.' },
    ],
  },
  {
    id: 'tv-de-nham-4', ten: 'Từ dễ nhầm: [advice], [advise], [stationery], [stationary]', nhom: DN, chu_de: 'các từ dễ nhầm',
    tu: [
      ['advice', 'n', 'lời khuyên', 'Thank you for your {advice}.', 'Cảm ơn lời khuyên của bạn.', 'My supervisor gave me some good {advice}.', 'Cấp trên cho tôi vài lời khuyên hay.'],
      ['advise', 'v', 'khuyên', 'I {advise} you to book early.', 'Tôi khuyên bạn nên đặt sớm.', 'We {advise} all staff to save their files often.', 'Chúng tôi khuyên mọi nhân viên lưu tệp thường xuyên.'],
      ['stationery', 'n', 'văn phòng phẩm', 'Please order more {stationery} for the office.', 'Vui lòng đặt thêm văn phòng phẩm cho văn phòng.', 'Pens and paper are kept in the {stationery} cabinet.', 'Bút và giấy để trong tủ văn phòng phẩm.'],
      ['stationary', 'adj', 'đứng yên', 'The car was {stationary} at the red light.', 'Chiếc xe đứng yên ở đèn đỏ.', 'Keep the cart {stationary} while you load the boxes.', 'Giữ xe đẩy đứng yên khi bạn chất hộp lên.'],
    ],
    dich: [
      [1, 'Tôi khuyên bạn nên nghỉ ngơi.', 'I {advise} you to rest.', 'I advise you to take a rest.', 'I advise you to have a rest.'],
      [3, 'Chiếc xe buýt đang đứng yên.', 'The bus is {stationary}.'],
    ],
    bt: [
      { cau: 'The doctor ___ him to rest for a week.', chon: ['advised', 'advice', 'stationery', 'stationary'], dap: 0, vi_sao: 'cần động từ: [advised], đã khuyên.' },
      { cau: 'Pens, paper and envelopes are kept in the ___ cupboard.', chon: ['stationery', 'stationary', 'advice', 'advise'], dap: 0, vi_sao: 'bút, giấy, phong bì là [stationery], văn phòng phẩm.' },
    ],
  },
  {
    id: 'tv-tinh-tu', ten: 'Tính từ hay gặp trong đề', nhom: 'Từ vựng · Tính từ', chu_de: 'tính từ hay gặp',
    tu: [
      ['efficient', 'adj', 'hiệu quả, năng suất', 'The new machine is very {efficient}.', 'Máy mới hoạt động rất hiệu quả.', 'This printer is more {efficient} than the old one.', 'Máy in này năng suất hơn máy cũ.'],
      ['reliable', 'adj', 'đáng tin cậy', 'We need a {reliable} supplier.', 'Chúng tôi cần một nhà cung cấp đáng tin cậy.', 'Our products are known for being {reliable}.', 'Sản phẩm của chúng tôi nổi tiếng là đáng tin cậy.'],
      ['available', 'adj', 'có sẵn, rảnh', 'Is Mr. Kim {available} this afternoon?', 'Chiều nay ông Kim có rảnh không?', 'The new model is {available} in three colors.', 'Mẫu mới có sẵn ba màu.'],
      ['affordable', 'adj', 'giá phải chăng', 'The hotel offers {affordable} rooms.', 'Khách sạn có phòng giá phải chăng.', 'We want to make our phones more {affordable}.', 'Chúng tôi muốn điện thoại có giá phải chăng hơn.'],
    ],
    dich: [
      [1, 'Anh ấy là người đáng tin cậy.', 'He is a {reliable} person.', 'He is reliable.'],
      [3, 'Giá rất phải chăng.', 'The price is very {affordable}.', 'The prices are very affordable.'],
    ],
    bt: [
      { cau: 'Ms. Hanh is not ___ today because she is on vacation.', chon: ['available', 'affordable', 'reliable', 'efficient'], dap: 0, vi_sao: 'đang nghỉ phép nên không [available], không rảnh.' },
      { cau: 'This car rarely breaks down; it is very ___.', chon: ['reliable', 'affordable', 'available', 'efficient'], dap: 0, vi_sao: 'hiếm khi hỏng là [reliable], đáng tin cậy.' },
    ],
  },
  {
    id: 'tv-trang-tu', ten: 'Trạng từ hay gặp trong đề', nhom: 'Từ vựng · Trạng từ', chu_de: 'trạng từ hay gặp',
    tu: [
      ['approximately', 'adv', 'khoảng chừng', 'The trip takes {approximately} two hours.', 'Chuyến đi mất khoảng hai tiếng.', 'The factory makes {approximately} 1,000 chairs a day.', 'Nhà máy làm khoảng 1.000 chiếc ghế mỗi ngày.'],
      ['immediately', 'adv', 'ngay lập tức', 'Please call me {immediately}.', 'Vui lòng gọi cho tôi ngay.', 'Damaged items should be returned {immediately}.', 'Hàng hỏng nên được trả lại ngay.'],
      ['currently', 'adv', 'hiện tại', 'Mr. Long is {currently} on a business trip.', 'Ông Long hiện đang đi công tác.', 'The item is {currently} out of stock.', 'Mặt hàng này hiện đang hết.'],
      ['recently', 'adv', 'gần đây', 'We {recently} opened a new store.', 'Gần đây chúng tôi vừa mở một cửa hàng mới.', 'The warehouse was {recently} moved to Long An.', 'Nhà kho vừa chuyển về Long An.'],
    ],
    dich: [
      [1, 'Gọi cho tôi ngay lập tức.', 'Call me {immediately}.', 'Please call me immediately.'],
      [3, 'Gần đây tôi mới chuyển nhà.', 'I {recently} moved house.', 'I moved house recently.', 'I have recently moved house.', 'I recently moved.', 'I moved recently.'],
    ],
    bt: [
      { cau: 'The repair will cost ___ 2 million dong.', chon: ['approximately', 'immediately', 'currently', 'recently'], dap: 0, vi_sao: 'trước một con số thì dùng [approximately], khoảng chừng.' },
      { cau: 'Ms. Ngoc has ___ joined our team as a designer.', chon: ['recently', 'approximately', 'immediately', 'currently'], dap: 0, vi_sao: 'hiện tại hoàn thành hay đi với [recently], gần đây.' },
    ],
  },
  {
    id: 'tv-dong-tu-cong-viec', ten: 'Động từ công việc hay gặp', nhom: 'Từ vựng · Động từ', chu_de: 'động từ trong công việc',
    tu: [
      ['announce', 'v', 'thông báo, công bố', 'The CEO will {announce} the results tomorrow.', 'Giám đốc điều hành sẽ công bố kết quả vào ngày mai.', 'The company {announced} a new office in Da Nang.', 'Công ty đã công bố văn phòng mới ở Đà Nẵng.'],
      ['confirm', 'v', 'xác nhận', 'Please {confirm} your booking by email.', 'Vui lòng xác nhận đặt chỗ qua email.', 'Could you {confirm} the meeting time?', 'Bạn xác nhận giúp tôi giờ họp được không?'],
      ['approve', 'v', 'phê duyệt', 'The director {approved} the budget.', 'Giám đốc đã phê duyệt ngân sách.', 'Your leave request has been {approved}.', 'Đơn xin nghỉ phép của bạn đã được duyệt.'],
      ['cancel', 'v', 'huỷ', 'We had to {cancel} the order.', 'Chúng tôi phải huỷ đơn hàng.', 'Please {cancel} my appointment at 3 p.m.', 'Vui lòng huỷ lịch hẹn lúc 3 giờ chiều của tôi.'],
    ],
    dich: [
      [1, 'Vui lòng xác nhận đơn hàng của bạn.', 'Please {confirm} your order.'],
      [3, 'Chúng tôi đã huỷ cuộc họp.', 'We {canceled} the meeting.', 'We cancelled the meeting.', 'We have canceled the meeting.', 'We have cancelled the meeting.'],
    ],
    bt: [
      { cau: 'The company will ___ the winner of the contest on its website.', chon: ['announce', 'approve', 'cancel', 'confirm'], dap: 0, vi_sao: 'công bố người thắng cuộc là [announce].' },
      { cau: 'The flight was ___ because of the typhoon.', chon: ['cancelled', 'approved', 'announced', 'confirmed'], dap: 0, vi_sao: 'vì bão nên chuyến bay bị [cancelled], huỷ.' },
    ],
  },
  {
    id: 'tv-sua-chua', ten: 'Từ vựng xây dựng và sửa chữa', nhom: 'Từ vựng · Sửa chữa', chu_de: 'xây dựng và sửa chữa',
    tu: [
      ['renovate', 'v', 'cải tạo, sửa sang', 'They are {renovating} the lobby.', 'Họ đang sửa sang sảnh.', 'The old building will be {renovated} next year.', 'Toà nhà cũ sẽ được cải tạo vào năm sau.'],
      ['construction', 'n', 'việc xây dựng', 'The {construction} of the bridge took two years.', 'Việc xây cầu mất hai năm.', 'The road is closed because of {construction}.', 'Con đường bị đóng vì đang thi công.'],
      ['maintenance', 'n', 'việc bảo trì', 'The elevator is closed for {maintenance}.', 'Thang máy tạm dừng để bảo trì.', 'Regular {maintenance} keeps the machines working well.', 'Bảo trì định kỳ giúp máy chạy tốt.'],
      ['repair', 'v', 'sửa chữa', 'A technician will {repair} the printer.', 'Một kỹ thuật viên sẽ sửa máy in.', 'The {repairs} will cost about 10 million dong.', 'Việc sửa chữa tốn khoảng 10 triệu đồng.'],
    ],
    dich: [
      [1, 'Việc xây dựng sẽ mất một năm.', 'The {construction} will take one year.', 'The construction will take a year.', 'Construction will take one year.', 'Construction will take a year.'],
      [3, 'Tôi cần sửa máy tính.', 'I need to {repair} my computer.', 'I need to repair the computer.'],
    ],
    bt: [
      { cau: 'The swimming pool is closed today for regular ___.', chon: ['maintenance', 'construction', 'renovate', 'repaired'], dap: 0, vi_sao: 'đóng cửa để [regular maintenance], bảo trì định kỳ.' },
      { cau: 'The ___ of the new stadium will be finished next year.', chon: ['construction', 'maintenance', 'renovate', 'repair'], dap: 0, vi_sao: 'sân vận động mới thì nói về [construction], việc xây dựng.' },
    ],
  },
  {
    id: 'tv-moi-truong', ten: 'Từ vựng môi trường', nhom: 'Từ vựng · Môi trường', chu_de: 'môi trường',
    tu: [
      ['recycle', 'v', 'tái chế', 'Please {recycle} plastic bottles.', 'Vui lòng tái chế chai nhựa.', 'This bag is made from {recycled} paper.', 'Túi này làm từ giấy tái chế.'],
      ['reduce', 'v', 'giảm', 'We want to {reduce} paper use.', 'Chúng tôi muốn giảm dùng giấy.', 'The new system {reduces} energy use by 20%.', 'Hệ thống mới giảm 20% lượng điện dùng.'],
      ['energy', 'n', 'năng lượng', 'Turn off the lights to save {energy}.', 'Hãy tắt đèn để tiết kiệm năng lượng.', 'Solar {energy} powers the whole building.', 'Năng lượng mặt trời cấp điện cho cả toà nhà.'],
      ['waste', 'n', 'rác thải, sự lãng phí', 'The factory produces less {waste} now.', 'Nhà máy giờ thải ra ít rác hơn.', 'Building work creates a lot of {waste}.', 'Việc xây dựng tạo ra nhiều rác thải.'],
    ],
    dich: [
      [1, 'Chúng ta cần giảm rác thải nhựa.', 'We need to {reduce} plastic waste.', 'We must reduce plastic waste.'],
      [3, 'Đây là sự lãng phí thời gian.', 'This is a {waste} of time.', 'It is a waste of time.'],
    ],
    bt: [
      { cau: 'Solar panels help the building save ___.', chon: ['energy', 'waste', 'recycle', 'reduce'], dap: 0, vi_sao: 'pin mặt trời giúp tiết kiệm [energy], năng lượng.' },
      { cau: 'Old paper can be ___ and used again.', chon: ['recycled', 'reduced', 'energy', 'waste'], dap: 0, vi_sao: 'giấy cũ được dùng lại là [recycled], tái chế.' },
    ],
  },
  {
    id: 'tv-hop-dong', ten: 'Từ vựng hợp đồng', nhom: 'Từ vựng · Hợp đồng', chu_de: 'hợp đồng',
    tu: [
      ['agreement', 'n', 'thoả thuận', 'The two firms reached an {agreement}.', 'Hai công ty đã đạt được thoả thuận.', 'Both sides signed the {agreement} today.', 'Hôm nay hai bên đã ký thoả thuận.'],
      ['terms', 'n', 'điều khoản', 'Please read the {terms} carefully.', 'Vui lòng đọc kỹ các điều khoản.', 'The {terms} of payment are 30 days.', 'Điều khoản thanh toán là 30 ngày.'],
      ['sign', 'v', 'ký', 'Please {sign} at the bottom of the page.', 'Vui lòng ký ở cuối trang.', 'The client {signed} the contract this morning.', 'Sáng nay khách hàng đã ký hợp đồng.'],
      ['expire', 'v', 'hết hạn', 'Your contract will {expire} in June.', 'Hợp đồng của bạn sẽ hết hạn vào tháng Sáu.', 'The special offer {expires} on Sunday.', 'Ưu đãi đặc biệt hết hạn vào Chủ nhật.'],
    ],
    dich: [
      [1, 'Tôi đồng ý với các điều khoản.', 'I agree with the {terms}.', 'I agree to the terms.'],
      [3, 'Thẻ của tôi đã hết hạn.', 'My card has {expired}.', 'My card expired.', 'My card is expired.'],
    ],
    bt: [
      { cau: 'My passport will ___ next month, so I need a new one.', chon: ['expire', 'sign', 'terms', 'agreement'], dap: 0, vi_sao: 'cần hộ chiếu mới vì sắp [expire], hết hạn.' },
      { cau: 'Please ___ the form and return it to us.', chon: ['sign', 'expire', 'terms', 'agreement'], dap: 0, vi_sao: 'ký vào đơn rồi gửi lại: [sign].' },
    ],
  },
  {
    id: 'tv-du-lich', ten: 'Từ vựng du lịch', nhom: 'Từ vựng · Du lịch', chu_de: 'du lịch',
    tu: [
      ['itinerary', 'n', 'lịch trình', 'The {itinerary} includes three cities.', 'Lịch trình gồm ba thành phố.', 'Please check the {itinerary} before the trip.', 'Vui lòng xem lịch trình trước chuyến đi.'],
      ['destination', 'n', 'điểm đến', 'Da Lat is a popular {destination}.', 'Đà Lạt là điểm đến được yêu thích.', 'Our first {destination} is Hoi An.', 'Điểm đến đầu tiên là Hội An.'],
      ['souvenir', 'n', 'quà lưu niệm', 'I bought a {souvenir} for my mother.', 'Tôi mua quà lưu niệm cho mẹ.', 'This shop sells {souvenirs} and postcards.', 'Cửa hàng này bán quà lưu niệm và bưu thiếp.'],
      ['forecast', 'n', 'dự báo thời tiết', 'The weather {forecast} says it will rain.', 'Dự báo thời tiết nói trời sẽ mưa.', 'The {forecast} says it will be sunny tomorrow.', 'Dự báo nói mai trời nắng.'],
    ],
    dich: [
      [1, 'Đà Nẵng là điểm đến yêu thích của tôi.', 'Da Nang is my favorite {destination}.', 'Da Nang is my favourite destination.', 'Danang is my favorite destination.', 'Danang is my favourite destination.'],
      [3, 'Tôi luôn xem dự báo thời tiết.', 'I always check the weather {forecast}.', 'I always watch the weather forecast.', 'I always look at the weather forecast.'],
    ],
    bt: [
      { cau: 'Please check the ___ for the times of all tours.', chon: ['itinerary', 'destination', 'souvenir', 'forecast'], dap: 0, vi_sao: 'giờ của các tour nằm trong [itinerary], lịch trình.' },
      { cau: 'According to the weather ___, tomorrow will be sunny.', chon: ['forecast', 'itinerary', 'souvenir', 'destination'], dap: 0, vi_sao: '[weather forecast] là dự báo thời tiết.' },
    ],
  },
  {
    id: 'tv-khao-sat', ten: 'Từ vựng khảo sát và phân tích', nhom: 'Từ vựng · Khảo sát', chu_de: 'khảo sát và phân tích',
    tu: [
      ['survey', 'n', 'cuộc khảo sát', 'Please complete our short {survey}.', 'Vui lòng làm bài khảo sát ngắn của chúng tôi.', 'The {survey} shows that customers like the new design.', 'Khảo sát cho thấy khách hàng thích thiết kế mới.'],
      ['analyze', 'v', 'phân tích', 'The team will {analyze} the data.', 'Nhóm sẽ phân tích dữ liệu.', 'We {analyzed} the feedback from 300 users.', 'Chúng tôi đã phân tích phản hồi của 300 người dùng.'],
      ['result', 'n', 'kết quả', 'The {results} will be shared on Friday.', 'Kết quả sẽ được chia sẻ vào thứ Sáu.', 'The {results} of the campaign were better than expected.', 'Kết quả chiến dịch tốt hơn dự kiến.'],
      ['data', 'n', 'dữ liệu', 'We collected {data} from 500 customers.', 'Chúng tôi thu thập dữ liệu từ 500 khách hàng.', 'The {data} shows a rise in online sales.', 'Dữ liệu cho thấy doanh số trực tuyến tăng.'],
    ],
    dich: [
      [1, 'Chúng tôi sẽ phân tích kết quả.', 'We will {analyze} the results.', 'We will analyse the results.'],
      [3, 'Dữ liệu này rất hữu ích.', 'This {data} is very useful.', 'These data are very useful.'],
    ],
    bt: [
      { cau: 'More than 1,000 customers took part in the ___.', chon: ['survey', 'data', 'result', 'analyze'], dap: 0, vi_sao: 'khách hàng tham gia [survey], cuộc khảo sát.' },
      { cau: 'Our experts will ___ the sales figures and report back.', chon: ['analyze', 'data', 'result', 'results'], dap: 0, vi_sao: 'sau [will] cần động từ, [analyze] là phân tích.' },
    ],
  },
  {
    id: 'tv-cong-ty', ten: 'Từ vựng tổ chức công ty', nhom: 'Từ vựng · Công ty', chu_de: 'tổ chức công ty',
    tu: [
      ['headquarters', 'n', 'trụ sở chính', 'Our {headquarters} is in Hanoi.', 'Trụ sở chính của chúng tôi ở Hà Nội.', 'The {headquarters} will move to a new building next year.', 'Trụ sở chính sẽ chuyển sang toà nhà mới vào năm sau.'],
      ['branch', 'n', 'chi nhánh', 'The bank has a new {branch} near my house.', 'Ngân hàng có chi nhánh mới gần nhà tôi.', 'We have three {branches} in Ho Chi Minh City.', 'Chúng tôi có ba chi nhánh ở Thành phố Hồ Chí Minh.'],
      ['department', 'n', 'phòng ban', 'She works in the sales {department}.', 'Cô ấy làm ở phòng kinh doanh.', 'The IT {department} is on the fifth floor.', 'Phòng IT ở tầng năm.'],
      ['director', 'n', 'giám đốc', 'The {director} will visit the factory.', 'Giám đốc sẽ đến thăm nhà máy.', 'The sales {director} approved the new plan.', 'Giám đốc kinh doanh đã duyệt kế hoạch mới.'],
    ],
    dich: [
      [1, 'Chúng tôi sẽ mở một chi nhánh mới.', 'We will open a new {branch}.', 'We are going to open a new branch.'],
      [3, 'Giám đốc đang ở trong văn phòng.', 'The {director} is in the office.', 'The director is in his office.', 'The director is in her office.'],
    ],
    bt: [
      { cau: 'The company has its ___ in Tokyo and branches in ten countries.', chon: ['headquarters', 'department', 'director', 'branch'], dap: 0, vi_sao: 'nơi đặt trụ sở chính là [headquarters].' },
      { cau: 'Please send your invoice to the accounting ___.', chon: ['department', 'branch', 'headquarters', 'director'], dap: 0, vi_sao: 'phòng kế toán là [accounting department].' },
    ],
  },
  {
    id: 'tv-tan-suat', ten: 'Từ chỉ tần suất: [daily], [weekly], [annual]', nhom: 'Từ vựng · Thời gian', chu_de: 'tần suất',
    tu: [
      ['daily', 'adj', 'hằng ngày', 'We have a {daily} meeting at 9 a.m.', 'Chúng tôi họp hằng ngày lúc 9 giờ sáng.', 'The accountant checks the bank balance {daily}.', 'Kế toán kiểm tra số dư ngân hàng hằng ngày.'],
      ['weekly', 'adj', 'hằng tuần', 'The {weekly} report is due on Friday.', 'Báo cáo hằng tuần nộp vào thứ Sáu.', 'Sales figures are updated {weekly}.', 'Số liệu bán hàng được cập nhật hằng tuần.'],
      ['quarterly', 'adj', 'hằng quý', 'The {quarterly} results look good.', 'Kết quả hằng quý trông khả quan.', 'Taxes are paid {quarterly}.', 'Thuế được nộp theo quý.'],
      ['annual', 'adj', 'hằng năm', 'The {annual} party is in December.', 'Tiệc thường niên tổ chức vào tháng Mười hai.', 'Our {annual} budget is 2 billion dong.', 'Ngân sách hằng năm của chúng tôi là 2 tỷ đồng.'],
    ],
    dich: [
      [1, 'Chúng tôi có cuộc họp hằng tuần.', 'We have a {weekly} meeting.', 'We have weekly meetings.'],
      [3, 'Bữa tiệc thường niên vào tháng Mười Hai.', 'The {annual} party is in December.'],
    ],
    bt: [
      { cau: 'The company holds its ___ meeting once a year in March.', chon: ['annual', 'daily', 'weekly', 'quarterly'], dap: 0, vi_sao: 'một năm một lần là [annual], hằng năm.' },
      { cau: 'Results are reported every three months in a ___ report.', chon: ['quarterly', 'annual', 'weekly', 'daily'], dap: 0, vi_sao: 'ba tháng một lần là [quarterly], hằng quý.' },
    ],
  },
  {
    id: 'tv-cong-tac', ten: 'Từ vựng đi công tác', nhom: 'Từ vựng · Công tác', chu_de: 'đi công tác',
    tu: [
      ['business trip', 'n', 'chuyến công tác', 'Mr. Phong is on a {business trip} to Seoul.', 'Ông Phong đang đi công tác ở Seoul.', 'She goes on a {business trip} every month.', 'Tháng nào cô ấy cũng đi công tác.'],
      ['accommodation', 'n', 'chỗ ở', 'The company will pay for your {accommodation}.', 'Công ty sẽ trả tiền chỗ ở cho bạn.', 'The {accommodation} is near the client office.', 'Chỗ ở gần văn phòng khách hàng.'],
      ['transportation', 'n', 'phương tiện đi lại', 'Public {transportation} is cheap here.', 'Phương tiện công cộng ở đây rẻ.', 'The hotel offers free {transportation} to the airport.', 'Khách sạn đưa đón sân bay miễn phí.'],
      ['expense report', 'n', 'báo cáo chi phí', 'Submit your {expense report} after the trip.', 'Hãy nộp báo cáo chi phí sau chuyến đi.', 'Your {expense report} must include all receipts.', 'Báo cáo chi phí phải kèm mọi biên lai.'],
    ],
    dich: [
      [1, 'Công ty trả tiền chỗ ở.', 'The company pays for the {accommodation}.', 'The company pays for accommodation.', 'The company will pay for the accommodation.', 'The company will pay for accommodation.'],
      [3, 'Tôi đã nộp báo cáo chi phí.', 'I submitted my {expense report}.', 'I submitted the expense report.', 'I have submitted my expense report.', 'I have submitted the expense report.'],
    ],
    bt: [
      { cau: 'The hotel is close to the station, so getting ___ is easy.', chon: ['transportation', 'accommodation', 'expense report', 'business trip'], dap: 0, vi_sao: 'gần ga nên dễ tìm [transportation], phương tiện đi lại.' },
      { cau: 'Please list your hotel and taxi costs in the ___.', chon: ['expense report', 'business trip', 'accommodation', 'transportation'], dap: 0, vi_sao: 'liệt kê chi phí vào [expense report].' },
    ],
  },
  {
    id: 'tv-san-pham', ten: 'Từ vựng sản phẩm mới', nhom: 'Từ vựng · Sản phẩm', chu_de: 'sản phẩm mới',
    tu: [
      ['launch', 'v', 'ra mắt', 'We will {launch} the new phone in May.', 'Chúng tôi sẽ ra mắt điện thoại mới vào tháng Năm.', 'The company {launched} two new products this year.', 'Năm nay công ty ra mắt hai sản phẩm mới.'],
      ['feature', 'n', 'tính năng', 'The camera is the best {feature} of this phone.', 'Camera là tính năng tốt nhất của chiếc điện thoại này.', 'The new model has many useful {features}.', 'Mẫu mới có nhiều tính năng hữu ích.'],
      ['prototype', 'n', 'mẫu thử', 'Engineers are testing the {prototype}.', 'Các kỹ sư đang thử nghiệm mẫu thử.', 'The {prototype} will be ready next month.', 'Mẫu thử sẽ xong vào tháng sau.'],
      ['demand', 'n', 'nhu cầu', 'There is high {demand} for electric cars.', 'Nhu cầu về xe điện đang cao.', 'The {demand} for the new model is very high.', 'Nhu cầu với mẫu mới rất cao.'],
    ],
    dich: [
      [1, 'Điện thoại này có nhiều tính năng.', 'This phone has many {features}.', 'This phone has a lot of features.', 'This phone has lots of features.'],
      [3, 'Nhu cầu đang tăng.', 'The {demand} is rising.', 'Demand is rising.', 'Demand is increasing.', 'The demand is increasing.', 'Demand is growing.', 'The demand is growing.'],
    ],
    bt: [
      { cau: 'Because of strong ___, the product sold out in two days.', chon: ['demand', 'feature', 'prototype', 'launch'], dap: 0, vi_sao: 'bán hết trong hai ngày vì [demand], nhu cầu cao.' },
      { cau: 'The new app has a useful ___ that translates text.', chon: ['feature', 'prototype', 'demand', 'launch'], dap: 0, vi_sao: 'chức năng dịch chữ là một [feature], tính năng.' },
    ],
  },
  {
    id: 'tv-ky-nang', ten: 'Từ vựng kỹ năng làm việc', nhom: 'Từ vựng · Kỹ năng', chu_de: 'kỹ năng làm việc',
    tu: [
      ['cooperate', 'v', 'hợp tác', 'All departments must {cooperate}.', 'Mọi phòng ban phải hợp tác với nhau.', 'New staff should {cooperate} with their team.', 'Nhân viên mới nên hợp tác với nhóm.'],
      ['responsible', 'adj', 'chịu trách nhiệm', 'Ms. Yen is {responsible} for training.', 'Cô Yến phụ trách việc đào tạo.', 'Who is {responsible} for hiring?', 'Ai chịu trách nhiệm tuyển dụng?'],
      ['flexible', 'adj', 'linh hoạt', 'We offer {flexible} working hours.', 'Chúng tôi có giờ làm việc linh hoạt.', 'We are looking for someone {flexible} and friendly.', 'Chúng tôi tìm người linh hoạt và thân thiện.'],
      ['punctual', 'adj', 'đúng giờ', 'Please be {punctual} for the interview.', 'Vui lòng đến phỏng vấn đúng giờ.', 'Mr. Dung is always {punctual} for meetings.', 'Anh Dũng luôn đến họp đúng giờ.'],
    ],
    dich: [
      [1, 'Tôi chịu trách nhiệm về dự án này.', 'I am {responsible} for this project.'],
      [3, 'Cô ấy luôn đúng giờ.', 'She is always {punctual}.'],
    ],
    bt: [
      { cau: 'Mr. Tung is ___ for checking all invoices.', chon: ['responsible', 'flexible', 'punctual', 'cooperate'], dap: 0, vi_sao: '[responsible for] là chịu trách nhiệm về việc gì.' },
      { cau: 'Our ___ schedule lets staff start work between 7 and 10 a.m.', chon: ['flexible', 'punctual', 'responsible', 'cooperate'], dap: 0, vi_sao: 'được chọn giờ bắt đầu là lịch [flexible], linh hoạt.' },
    ],
  },
  {
    id: 'tv-tien-phi', ten: 'Từ vựng các khoản tiền', nhom: 'Từ vựng · Tiền', chu_de: 'các khoản tiền',
    tu: [
      ['fee', 'n', 'phí, lệ phí', 'There is no {fee} for this service.', 'Dịch vụ này không mất phí.', 'The bank charges a small {fee} for transfers.', 'Ngân hàng thu một khoản phí nhỏ khi chuyển tiền.'],
      ['fine', 'n', 'tiền phạt', 'He paid a {fine} for parking there.', 'Anh ấy bị phạt vì đỗ xe ở đó.', 'Late payments will result in a {fine}.', 'Trả chậm sẽ bị phạt tiền.'],
      ['tax', 'n', 'thuế', 'The price includes {tax}.', 'Giá đã bao gồm thuế.', 'The company paid more {tax} this year.', 'Năm nay công ty đóng thuế nhiều hơn.'],
      ['payment', 'n', 'khoản thanh toán', 'We accept {payment} by card.', 'Chúng tôi nhận thanh toán bằng thẻ.', 'The first {payment} is due on March 1.', 'Khoản thanh toán đầu tiên đến hạn ngày 1 tháng 3.'],
    ],
    dich: [
      [1, 'Anh ấy phải trả tiền phạt.', 'He has to pay a {fine}.', 'He must pay a fine.', 'He had to pay a fine.'],
      [3, 'Chúng tôi đã nhận được khoản thanh toán.', 'We received the {payment}.', 'We have received the payment.', 'We received your payment.', 'We have received your payment.'],
    ],
    bt: [
      { cau: 'You will get a ___ if you drive too fast.', chon: ['fine', 'fee', 'tax', 'payment'], dap: 0, vi_sao: 'lái xe quá nhanh thì bị [fine], phạt tiền.' },
      { cau: 'There is a small booking ___ of 20,000 dong.', chon: ['fee', 'fine', 'tax', 'salary'], dap: 0, vi_sao: '[booking fee] là phí đặt chỗ.' },
    ],
  },
  {
    id: 'tv-bat-quy-tac', ten: 'Động từ bất quy tắc hay gặp', nhom: 'Từ vựng · Động từ bất quy tắc', chu_de: 'động từ bất quy tắc',
    tu: [
      ['begin, began, begun', 'v', 'bắt đầu', 'The meeting has already {begun}.', 'Cuộc họp đã bắt đầu rồi.', 'The meeting {began} at 9 a.m.', 'Cuộc họp bắt đầu lúc 9 giờ sáng.'],
      ['bring, brought, brought', 'v', 'mang tới', 'She {brought} the samples yesterday.', 'Hôm qua cô ấy đã mang mẫu tới.', 'Have you {brought} the name cards?', 'Bạn đã mang thẻ tên tới chưa?'],
      ['write, wrote, written', 'v', 'viết', 'The report was {written} by Mr. Hai.', 'Báo cáo do ông Hải viết.', 'Ms. Lan {wrote} the minutes of the meeting.', 'Chị Lan đã viết biên bản cuộc họp.'],
      ['leave, left, left', 'v', 'rời đi', 'The train {left} at 6 a.m.', 'Tàu đã rời ga lúc 6 giờ sáng.', 'The guests have {left} the hall.', 'Khách đã rời hội trường.'],
    ],
    dich: [
      [1, 'Anh ấy đã mang bánh tới văn phòng.', 'He {brought} cakes to the office.', 'He brought a cake to the office.', 'He brought cake to the office.'],
      [3, 'Cô ấy đã rời văn phòng lúc năm giờ.', 'She {left} the office at five.', 'She left the office at five o\'clock.'],
    ],
    bt: [
      { cau: 'The new manual was ___ by our technical team.', chon: ['written', 'wrote', 'write', 'writing'], dap: 0, vi_sao: 'bị động dùng dạng ba [written].' },
      { cau: 'Ms. Linh ___ the office early yesterday.', chon: ['left', 'leaved', 'leaves', 'leaving'], dap: 0, vi_sao: 'có [yesterday], quá khứ của [leave] là [left].' },
    ],
  },
];
