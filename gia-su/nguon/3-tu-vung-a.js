// Từ vựng (1/2): văn phòng, nhân sự, tài chính, mua bán, giao hàng, đi lại, khách sạn, sự kiện, đào tạo, email.
// Nội dung tạm cho buổi live thử 23/11/2026, chưa duyệt. Mỗi từ: [từ, loại, nghĩa, câu ví dụ có {từ}, nghĩa câu ví dụ, câu ví dụ 2 (theo chủ đề chương), nghĩa câu 2].
// Cách viết: xem đầu gia-su/build_bai.js. Đáp án viết ở vị trí đầu (dap: 0), lúc dựng sẽ xáo.
exports.tu_vung = [
  {
    id: 'tv-van-phong', ten: 'Từ vựng văn phòng', nhom: 'Từ vựng · Văn phòng', chu_de: 'công việc văn phòng',
    tu: [
      ['deadline', 'n', 'hạn chót', 'The {deadline} for the report is Friday.', 'Hạn chót nộp báo cáo là thứ Sáu.', 'Can we extend the {deadline} by two days?', 'Mình lùi hạn chót thêm hai ngày được không?'],
      ['agenda', 'n', 'chương trình cuộc họp', 'Please read the {agenda} before the meeting.', 'Vui lòng đọc chương trình trước cuộc họp.', 'I have added your topic to the {agenda}.', 'Tôi đã thêm chủ đề của bạn vào chương trình họp.'],
      ['colleague', 'n', 'đồng nghiệp', 'My {colleague} will help you with the order.', 'Đồng nghiệp của tôi sẽ giúp bạn với đơn hàng.', 'She often has lunch with her {colleagues}.', 'Cô ấy thường ăn trưa cùng các đồng nghiệp.'],
      ['supervisor', 'n', 'người giám sát, cấp trên', 'Ask your {supervisor} for permission.', 'Hãy xin phép cấp trên của bạn.', 'My {supervisor} checks my work every Friday.', 'Cấp trên kiểm tra công việc của tôi mỗi thứ Sáu.'],
    ],
    dich: [
      [1, 'Chương trình họp ở trên bàn.', 'The {agenda} is on the table.', 'The agenda is on the desk.'],
      [3, 'Cấp trên của tôi rất tốt bụng.', 'My {supervisor} is very kind.', 'My supervisor is very nice.'],
    ],
    bt: [
      { cau: 'The first item on the ___ is the budget.', chon: ['agenda', 'deadline', 'colleague', 'supervisor'], dap: 0, vi_sao: '[agenda] là chương trình họp, gồm các mục cần bàn.' },
      { cau: 'We must finish the project before the ___ next Monday.', chon: ['deadline', 'agenda', 'supervisor', 'colleague'], dap: 0, vi_sao: '[deadline] là hạn chót.' },
    ],
  },
  {
    id: 'tv-cuoc-hop', ten: 'Từ vựng về cuộc họp', nhom: 'Từ vựng · Cuộc họp', chu_de: 'cuộc họp',
    tu: [
      ['postpone', 'v', 'hoãn lại', 'They {postponed} the meeting until Friday.', 'Họ đã hoãn cuộc họp tới thứ Sáu.', 'The training has been {postponed} until next week.', 'Buổi đào tạo đã bị hoãn tới tuần sau.'],
      ['attend', 'v', 'tham dự', 'All managers must {attend} the meeting.', 'Mọi quản lý phải tham dự cuộc họp.', 'Ms. Hanh cannot {attend} the meeting today.', 'Chị Hạnh không dự họp hôm nay được.'],
      ['minutes', 'n', 'biên bản cuộc họp', 'Ms. Lan took the {minutes} of the meeting.', 'Cô Lan ghi biên bản cuộc họp.', 'The {minutes} will be sent to everyone by email.', 'Biên bản sẽ được gửi cho mọi người qua email.'],
      ['schedule', 'v', 'lên lịch', 'Let us {schedule} a call for next week.', 'Hãy lên lịch một cuộc gọi vào tuần sau.', 'The meeting is {scheduled} for 2 p.m.', 'Cuộc họp được lên lịch lúc 2 giờ chiều.'],
    ],
    dich: [
      [1, 'Tôi sẽ tham dự cuộc họp.', 'I will {attend} the meeting.'],
      [3, 'Mình lên lịch họp vào thứ Hai nhé.', 'Let us {schedule} a meeting on Monday.', 'Let us schedule a meeting for Monday.'],
    ],
    bt: [
      { cau: 'The meeting was ___ because the director was sick.', chon: ['postponed', 'attended', 'minutes', 'agenda'], dap: 0, vi_sao: 'giám đốc ốm nên cuộc họp bị hoãn: [postponed].' },
      { cau: 'More than 200 people ___ the conference last year.', chon: ['attended', 'postponed', 'minutes', 'agenda'], dap: 0, vi_sao: 'hơn hai trăm người tham dự: [attended].' },
    ],
  },
  {
    id: 'tv-tuyen-dung', ten: 'Từ vựng tuyển dụng', nhom: 'Từ vựng · Tuyển dụng', chu_de: 'tuyển dụng',
    tu: [
      ['applicant', 'n', 'người ứng tuyển', 'Each {applicant} must send a cover letter.', 'Mỗi người ứng tuyển phải gửi thư xin việc.', 'Over 200 {applicants} applied for the job.', 'Hơn 200 người đã ứng tuyển vị trí này.'],
      ['qualification', 'n', 'bằng cấp, trình độ', 'She has the right {qualifications} for the job.', 'Cô ấy có bằng cấp phù hợp với công việc.', 'A degree in accounting is the main {qualification}.', 'Bằng kế toán là yêu cầu chính về trình độ.'],
      ['hire', 'v', 'tuyển, thuê', 'We plan to {hire} five new engineers.', 'Chúng tôi dự định tuyển năm kỹ sư mới.', 'We {hired} two new designers last month.', 'Tháng trước chúng tôi tuyển hai nhà thiết kế mới.'],
      ['position', 'n', 'vị trí công việc', 'The {position} requires two years of experience.', 'Vị trí này yêu cầu hai năm kinh nghiệm.', 'She applied for the {position} of sales manager.', 'Cô ấy ứng tuyển vị trí quản lý bán hàng.'],
    ],
    dich: [
      [1, 'Anh ấy có bằng cấp tốt.', 'He has good {qualifications}.', 'He has a good qualification.'],
      [3, 'Vị trí này vẫn còn trống.', 'This {position} is still open.', 'This position is still available.', 'This position is still vacant.'],
    ],
    bt: [
      { cau: 'The company will ___ ten new sales staff this month.', chon: ['hire', 'applicant', 'position', 'qualification'], dap: 0, vi_sao: 'sau [will] cần động từ, [hire] là tuyển.' },
      { cau: 'The manager will interview each ___ next week.', chon: ['applicant', 'hire', 'position', 'qualification'], dap: 0, vi_sao: 'người được phỏng vấn là [applicant], người ứng tuyển.' },
    ],
  },
  {
    id: 'tv-nhan-su', ten: 'Từ vựng nhân sự', nhom: 'Từ vựng · Nhân sự', chu_de: 'nhân sự',
    tu: [
      ['employee', 'n', 'nhân viên', 'Every {employee} gets a free lunch.', 'Mỗi nhân viên được ăn trưa miễn phí.', 'The company has about 500 {employees}.', 'Công ty có khoảng 500 nhân viên.'],
      ['promotion', 'n', 'sự thăng chức', 'He got a {promotion} after two years.', 'Anh ấy được thăng chức sau hai năm.', 'Ms. Thu is hoping for a {promotion} this year.', 'Chị Thu đang mong được thăng chức năm nay.'],
      ['salary', 'n', 'tiền lương', 'The {salary} is paid at the end of each month.', 'Lương được trả vào cuối mỗi tháng.', 'The job offers a good {salary}.', 'Công việc này có mức lương tốt.'],
      ['retire', 'v', 'nghỉ hưu', 'Mr. Nam will {retire} next year.', 'Ông Nam sẽ nghỉ hưu vào năm sau.', 'Most workers here {retire} at 60.', 'Phần lớn công nhân ở đây nghỉ hưu ở tuổi 60.'],
    ],
    dich: [
      [1, 'Anh ấy muốn được thăng chức.', 'He wants a {promotion}.', 'He wants to get a promotion.'],
      [3, 'Bố tôi đã nghỉ hưu năm ngoái.', 'My father {retired} last year.', 'My dad retired last year.'],
    ],
    bt: [
      { cau: 'After five years at the company, Ms. Thu received a ___ to manager.', chon: ['promotion', 'salary', 'employee', 'retire'], dap: 0, vi_sao: '[promotion to manager] là được thăng chức lên quản lý.' },
      { cau: 'Mr. Hoang plans to ___ at the age of 60.', chon: ['retire', 'promotion', 'salary', 'employee'], dap: 0, vi_sao: 'sau [to] cần động từ, [retire] là nghỉ hưu.' },
    ],
  },
  {
    id: 'tv-tai-chinh', ten: 'Từ vựng tài chính', nhom: 'Từ vựng · Tài chính', chu_de: 'tài chính',
    tu: [
      ['budget', 'n', 'ngân sách', 'The marketing {budget} was cut by 10%.', 'Ngân sách marketing bị cắt 10%.', 'We need to stay within the {budget}.', 'Chúng ta phải chi trong giới hạn ngân sách.'],
      ['expense', 'n', 'khoản chi phí', 'Travel {expenses} are paid by the company.', 'Chi phí đi lại do công ty trả.', 'Rent is our biggest {expense}.', 'Tiền thuê là khoản chi lớn nhất của chúng tôi.'],
      ['revenue', 'n', 'doanh thu', 'Our {revenue} grew by 20% this year.', 'Doanh thu năm nay tăng 20%.', 'Most of our {revenue} comes from online sales.', 'Phần lớn doanh thu đến từ bán hàng trực tuyến.'],
      ['profit', 'n', 'lợi nhuận', 'The company made a large {profit} last year.', 'Năm ngoái công ty lãi lớn.', 'The {profits} will be shared with all staff.', 'Lợi nhuận sẽ được chia cho mọi nhân viên.'],
    ],
    dich: [
      [1, 'Chi phí năm nay rất cao.', 'The {expenses} are very high this year.', 'Expenses are very high this year.', 'The expenses this year are very high.', 'This year the expenses are very high.'],
      [3, 'Công ty có lợi nhuận lớn.', 'The company has a big {profit}.', 'The company has a large profit.', 'The company made a big profit.', 'The company made a large profit.'],
    ],
    bt: [
      { cau: 'We must stay within the ___ for this project.', chon: ['budget', 'profit', 'revenue', 'expense'], dap: 0, vi_sao: '[stay within the budget] là giữ trong ngân sách.' },
      { cau: 'Hotel and meal ___ will be paid back to you.', chon: ['expenses', 'revenues', 'profits', 'budgets'], dap: 0, vi_sao: 'tiền khách sạn và ăn uống là [expenses], chi phí.' },
    ],
  },
  {
    id: 'tv-ke-toan', ten: 'Từ vựng kế toán', nhom: 'Từ vựng · Kế toán', chu_de: 'kế toán',
    tu: [
      ['invoice', 'n', 'hoá đơn đòi thanh toán', 'Please pay the {invoice} within 30 days.', 'Vui lòng thanh toán hoá đơn trong vòng 30 ngày.', 'The {invoice} was sent to the wrong address.', 'Hoá đơn bị gửi nhầm địa chỉ.'],
      ['receipt', 'n', 'biên lai', 'Keep your {receipt} in case you need a refund.', 'Hãy giữ biên lai phòng khi cần hoàn tiền.', 'Please attach all {receipts} to your expense report.', 'Vui lòng đính kèm mọi biên lai vào báo cáo chi phí.'],
      ['reimburse', 'v', 'hoàn trả chi phí', 'The company will {reimburse} your taxi fare.', 'Công ty sẽ hoàn lại tiền taxi cho bạn.', 'You will be {reimbursed} within two weeks.', 'Bạn sẽ được hoàn tiền trong hai tuần.'],
      ['audit', 'n', 'cuộc kiểm toán', 'The annual {audit} starts next week.', 'Cuộc kiểm toán hằng năm bắt đầu tuần sau.', 'The {audit} found no problems.', 'Cuộc kiểm toán không phát hiện vấn đề gì.'],
    ],
    dich: [
      [1, 'Đây là biên lai của bạn.', 'Here is your {receipt}.', 'This is your receipt.'],
      [3, 'Cuộc kiểm toán bắt đầu hôm nay.', 'The {audit} starts today.', 'The audit begins today.'],
    ],
    bt: [
      { cau: 'Customers need the original ___ to return an item to the store.', chon: ['receipt', 'audit', 'reimburse', 'deadline'], dap: 0, vi_sao: 'trả hàng cần [receipt], tức biên lai mua hàng.' },
      { cau: 'The company will ___ employees for their business travel costs.', chon: ['reimburse', 'audit', 'receipt', 'invoice'], dap: 0, vi_sao: '[reimburse] là hoàn trả chi phí.' },
    ],
  },
  {
    id: 'tv-mua-sam', ten: 'Từ vựng mua sắm', nhom: 'Từ vựng · Mua sắm', chu_de: 'mua sắm',
    tu: [
      ['purchase', 'v', 'mua', 'You can {purchase} tickets online.', 'Bạn có thể mua vé trên mạng.', 'Thank you for your {purchase}.', 'Cảm ơn bạn đã mua hàng.'],
      ['refund', 'n', 'tiền hoàn lại', 'You will get a full {refund} within 7 days.', 'Bạn sẽ được hoàn tiền đầy đủ trong 7 ngày.', 'The customer asked for a {refund}.', 'Khách hàng yêu cầu hoàn tiền.'],
      ['discount', 'n', 'sự giảm giá', 'Members get a 15% {discount}.', 'Thành viên được giảm giá 15%.', 'We offer a {discount} on large orders.', 'Chúng tôi giảm giá cho đơn hàng lớn.'],
      ['warranty', 'n', 'sự bảo hành', 'The laptop comes with a two-year {warranty}.', 'Laptop được bảo hành hai năm.', 'The repair is free because the phone is still under {warranty}.', 'Sửa miễn phí vì điện thoại vẫn còn bảo hành.'],
    ],
    dich: [
      [1, 'Tôi muốn được hoàn tiền.', 'I want a {refund}.', 'I would like a refund.', 'I want to get a refund.'],
      [3, 'Chiếc tivi này được bảo hành một năm.', 'This TV has a one-year {warranty}.', 'This TV comes with a one-year warranty.'],
    ],
    bt: [
      { cau: 'If the product breaks, it is covered by the ___.', chon: ['warranty', 'discount', 'refund', 'purchase'], dap: 0, vi_sao: 'hàng hỏng thì được [warranty], tức bảo hành.' },
      { cau: 'Students can get a 20% ___ on all books.', chon: ['discount', 'warranty', 'refund', 'purchase'], dap: 0, vi_sao: 'giảm hai mươi phần trăm là [discount].' },
    ],
  },
  {
    id: 'tv-giao-hang', ten: 'Từ vựng giao hàng', nhom: 'Từ vựng · Giao hàng', chu_de: 'giao hàng',
    tu: [
      ['shipment', 'n', 'lô hàng', 'The {shipment} arrived two days late.', 'Lô hàng đến trễ hai ngày.', 'The next {shipment} will leave the factory on Friday.', 'Lô hàng tiếp theo sẽ rời nhà máy vào thứ Sáu.'],
      ['deliver', 'v', 'giao hàng', 'We {deliver} orders within 24 hours.', 'Chúng tôi giao đơn hàng trong vòng 24 giờ.', 'The parts were {delivered} to the wrong factory.', 'Phụ tùng bị giao nhầm nhà máy.'],
      ['warehouse', 'n', 'nhà kho', 'The boxes are stored in the {warehouse}.', 'Các thùng hàng được cất trong nhà kho.', 'The {warehouse} is full, so we need more space.', 'Nhà kho đã đầy nên chúng tôi cần thêm chỗ.'],
      ['track', 'v', 'theo dõi đơn hàng', 'You can {track} your order online.', 'Bạn có thể theo dõi đơn hàng trên mạng.', 'The system {tracks} every shipment.', 'Hệ thống theo dõi mọi lô hàng.'],
    ],
    dich: [
      [1, 'Họ sẽ giao hàng vào ngày mai.', 'They will {deliver} the goods tomorrow.', 'They will deliver tomorrow.', 'They will deliver the order tomorrow.', 'They will deliver the products tomorrow.'],
      [3, 'Bạn có thể theo dõi đơn hàng trên điện thoại.', 'You can {track} your order on your phone.', 'You can track the order on your phone.', 'You can track your order on the phone.'],
    ],
    bt: [
      { cau: 'Enter the tracking number to ___ your package online.', chon: ['track', 'deliver', 'warehouse', 'shipment'], dap: 0, vi_sao: 'dùng mã vận đơn để [track], theo dõi gói hàng.' },
      { cau: 'All products are kept in a ___ near the port.', chon: ['warehouse', 'shipment', 'track', 'deliver'], dap: 0, vi_sao: 'nơi cất hàng là [warehouse], nhà kho.' },
    ],
  },
  {
    id: 'tv-dat-hang', ten: 'Từ vựng đặt hàng', nhom: 'Từ vựng · Đặt hàng', chu_de: 'đặt hàng',
    tu: [
      ['supplier', 'n', 'nhà cung cấp', 'We found a new {supplier} for paper.', 'Chúng tôi tìm được nhà cung cấp giấy mới.', 'Our {supplier} delivers every Monday.', 'Nhà cung cấp giao hàng vào mỗi thứ Hai.'],
      ['inventory', 'n', 'hàng tồn kho', 'We check the {inventory} every Friday.', 'Chúng tôi kiểm hàng tồn kho mỗi thứ Sáu.', 'We keep a small {inventory} of spare parts.', 'Chúng tôi giữ một ít phụ tùng tồn kho.'],
      ['out of stock', 'phr', 'hết hàng', 'This item is {out of stock} right now.', 'Mặt hàng này hiện đang hết.', 'The blue shirts are {out of stock} until May.', 'Áo sơ mi xanh hết hàng tới tháng Năm.'],
      ['place an order', 'phr', 'đặt hàng', 'I would like to {place an order} for 50 chairs.', 'Tôi muốn đặt mua 50 chiếc ghế.', 'We {placed an order} for new equipment yesterday.', 'Hôm qua chúng tôi đã đặt mua thiết bị mới.'],
    ],
    dich: [
      [1, 'Chúng tôi kiểm tra hàng tồn kho mỗi tuần.', 'We check the {inventory} every week.', 'We check inventory every week.', 'We check the inventory weekly.'],
      [3, 'Tôi muốn đặt hàng.', 'I want to {place an order}.', 'I would like to place an order.'],
    ],
    bt: [
      { cau: 'Sorry, the blue model is ___, but the black one is available.', chon: ['out of stock', 'inventory', 'supplier', 'place an order'], dap: 0, vi_sao: '[out of stock] là hết hàng, trái nghĩa với [available].' },
      { cau: 'Our ___ delivers fresh fruit every morning.', chon: ['supplier', 'inventory', 'out of stock', 'place an order'], dap: 0, vi_sao: 'bên giao hàng cho mình là [supplier], nhà cung cấp.' },
    ],
  },
  {
    id: 'tv-san-bay', ten: 'Từ vựng sân bay', nhom: 'Từ vựng · Sân bay', chu_de: 'sân bay',
    tu: [
      ['boarding pass', 'n', 'thẻ lên máy bay', 'Please show your {boarding pass} at the gate.', 'Vui lòng xuất trình thẻ lên máy bay ở cửa.', 'You can print your {boarding pass} at home.', 'Bạn có thể in thẻ lên máy bay ở nhà.'],
      ['departure', 'n', 'sự khởi hành', 'The {departure} time is 7:30 a.m.', 'Giờ khởi hành là 7 giờ 30 sáng.', 'Please arrive two hours before {departure}.', 'Vui lòng có mặt hai tiếng trước giờ khởi hành.'],
      ['luggage', 'n', 'hành lý', 'Each passenger can bring one piece of {luggage}.', 'Mỗi hành khách được mang một kiện hành lý.', 'My {luggage} did not arrive with me.', 'Hành lý của tôi không về cùng tôi.'],
      ['delay', 'n', 'sự chậm trễ', 'There is a two-hour {delay} because of the weather.', 'Chuyến bay trễ hai tiếng vì thời tiết.', 'We apologize for the {delay}.', 'Chúng tôi xin lỗi vì sự chậm trễ.'],
    ],
    dich: [
      [1, 'Vui lòng kiểm tra giờ khởi hành.', 'Please check the {departure} time.', 'Please check the time of departure.'],
      [3, 'Chuyến bay bị chậm hai tiếng.', 'The flight has a two-hour {delay}.', 'The flight is delayed by two hours.', 'The flight is delayed two hours.', 'The flight was delayed by two hours.', 'The flight was delayed two hours.'],
    ],
    bt: [
      { cau: 'Passengers must show a ___ before getting on the plane.', chon: ['boarding pass', 'luggage', 'departure', 'delay'], dap: 0, vi_sao: 'lên máy bay cần [boarding pass], thẻ lên máy bay.' },
      { cau: 'Please collect your ___ at belt number 5.', chon: ['luggage', 'boarding pass', 'departure', 'delay'], dap: 0, vi_sao: 'lấy hành lý ở băng chuyền: [luggage].' },
    ],
  },
  {
    id: 'tv-khach-san', ten: 'Từ vựng khách sạn', nhom: 'Từ vựng · Khách sạn', chu_de: 'khách sạn',
    tu: [
      ['reservation', 'n', 'sự đặt chỗ', 'I have a {reservation} for two nights.', 'Tôi đã đặt phòng hai đêm.', 'You can make a {reservation} on our website.', 'Bạn có thể đặt phòng trên trang web của chúng tôi.'],
      ['check in', 'phr', 'làm thủ tục nhận phòng', 'Guests can {check in} after 2 p.m.', 'Khách có thể nhận phòng sau 2 giờ chiều.', 'Please show your passport when you {check in}.', 'Vui lòng xuất trình hộ chiếu khi nhận phòng.'],
      ['amenities', 'n', 'tiện nghi', 'The hotel {amenities} include a pool and a gym.', 'Tiện nghi khách sạn gồm hồ bơi và phòng tập.', 'All rooms have basic {amenities} such as a fridge and a kettle.', 'Mọi phòng đều có tiện nghi cơ bản như tủ lạnh và ấm đun nước.'],
      ['vacancy', 'n', 'phòng trống', 'Sorry, we have no {vacancy} tonight.', 'Xin lỗi, tối nay chúng tôi không còn phòng trống.', 'The hotel has a few {vacancies} next week.', 'Tuần sau khách sạn còn vài phòng trống.'],
    ],
    dich: [
      [1, 'Chúng tôi nhận phòng lúc hai giờ.', 'We {check in} at two.', 'We check in at two o\'clock.', 'We will check in at two.', 'We checked in at two.'],
      [3, 'Khách sạn không còn phòng trống.', 'The hotel has no {vacancies}.', 'The hotel has no vacancy.', 'There are no vacancies at the hotel.'],
    ],
    bt: [
      { cau: 'You can ___ at the front desk from 2 p.m.', chon: ['check in', 'reservation', 'amenities', 'vacancy'], dap: 0, vi_sao: 'sau [can] cần động từ: [check in], nhận phòng.' },
      { cau: 'The hotel offers many ___, such as free Wi-Fi and a spa.', chon: ['amenities', 'vacancy', 'reservation', 'check in'], dap: 0, vi_sao: 'Wi-Fi và spa là [amenities], tiện nghi.' },
    ],
  },
  {
    id: 'tv-nha-hang', ten: 'Từ vựng nhà hàng', nhom: 'Từ vựng · Nhà hàng', chu_de: 'nhà hàng',
    tu: [
      ['cuisine', 'n', 'ẩm thực, món ăn của một vùng', 'The restaurant serves Italian {cuisine}.', 'Nhà hàng phục vụ ẩm thực Ý.', 'Hue is famous for its local {cuisine}.', 'Huế nổi tiếng với ẩm thực địa phương.'],
      ['bill', 'n', 'hoá đơn tính tiền', 'Could we have the {bill}, please?', 'Cho chúng tôi xin hoá đơn được không?', 'The {bill} includes a service charge.', 'Hoá đơn đã gồm phí phục vụ.'],
      ['reserve', 'v', 'đặt trước', 'I would like to {reserve} a table for four.', 'Tôi muốn đặt trước một bàn cho bốn người.', 'This table is {reserved} for Mr. Kim.', 'Bàn này đã được đặt cho ông Kim.'],
      ['serve', 'v', 'phục vụ món ăn', 'Breakfast is {served} from 6 to 10 a.m.', 'Bữa sáng được phục vụ từ 6 tới 10 giờ.', 'The restaurant {serves} seafood all day.', 'Nhà hàng phục vụ hải sản cả ngày.'],
    ],
    dich: [
      [1, 'Cho tôi xin hoá đơn.', 'Can I have the {bill}, please?', 'Could I have the bill, please?', 'Can I have the bill?', 'Could I have the bill?', 'The bill, please.'],
      [3, 'Nhà hàng phục vụ món Việt.', 'The restaurant {serves} Vietnamese food.', 'This restaurant serves Vietnamese food.', 'The restaurant serves Vietnamese dishes.'],
    ],
    bt: [
      { cau: 'Please call ahead to ___ a table on weekends.', chon: ['reserve', 'serve', 'bill', 'cuisine'], dap: 0, vi_sao: 'gọi trước để [reserve], đặt bàn trước.' },
      { cau: 'After dinner, the waiter brought us the ___.', chon: ['bill', 'cuisine', 'reserve', 'serve'], dap: 0, vi_sao: 'ăn xong thì mang [bill], hoá đơn tính tiền.' },
    ],
  },
  {
    id: 'tv-hoi-nghi', ten: 'Từ vựng hội nghị', nhom: 'Từ vựng · Hội nghị', chu_de: 'hội nghị',
    tu: [
      ['conference', 'n', 'hội nghị', 'The {conference} will be held in Singapore.', 'Hội nghị sẽ được tổ chức ở Singapore.', 'More than 300 people attended the {conference}.', 'Hơn 300 người đã dự hội nghị.'],
      ['venue', 'n', 'địa điểm tổ chức', 'The {venue} can hold 500 guests.', 'Địa điểm có thể chứa 500 khách.', 'We are still looking for a {venue} for the party.', 'Chúng tôi vẫn đang tìm địa điểm cho bữa tiệc.'],
      ['registration', 'n', 'sự đăng ký', 'Online {registration} closes on May 1.', 'Đăng ký trên mạng kết thúc ngày 1 tháng 5.', 'The {registration} fee is 500,000 dong.', 'Phí đăng ký là 500.000 đồng.'],
      ['keynote speaker', 'n', 'diễn giả chính', 'The {keynote speaker} is a famous economist.', 'Diễn giả chính là một nhà kinh tế học nổi tiếng.', 'The {keynote speaker} will talk about AI.', 'Diễn giả chính sẽ nói về trí tuệ nhân tạo.'],
    ],
    dich: [
      [1, 'Địa điểm rất gần khách sạn.', 'The {venue} is very close to the hotel.', 'The venue is very near the hotel.'],
      [3, 'Diễn giả chính đến từ Nhật Bản.', 'The {keynote speaker} is from Japan.', 'The keynote speaker comes from Japan.'],
    ],
    bt: [
      { cau: 'The hotel was chosen as the ___ for the awards ceremony.', chon: ['venue', 'registration', 'keynote speaker', 'conference'], dap: 0, vi_sao: 'nơi tổ chức lễ trao giải là [venue].' },
      { cau: 'Please complete your ___ online before May 1.', chon: ['registration', 'venue', 'keynote speaker', 'conference'], dap: 0, vi_sao: 'hoàn tất [registration], tức việc đăng ký.' },
    ],
  },
  {
    id: 'tv-marketing', ten: 'Từ vựng marketing', nhom: 'Từ vựng · Marketing', chu_de: 'marketing',
    tu: [
      ['advertise', 'v', 'quảng cáo', 'We {advertise} our products on social media.', 'Chúng tôi quảng cáo sản phẩm trên mạng xã hội.', 'The new phone is {advertised} on TV.', 'Điện thoại mới được quảng cáo trên tivi.'],
      ['campaign', 'n', 'chiến dịch', 'The new {campaign} starts in June.', 'Chiến dịch mới bắt đầu vào tháng Sáu.', 'The {campaign} increased sales by 30%.', 'Chiến dịch đã tăng doanh số 30%.'],
      ['brand', 'n', 'thương hiệu', 'This {brand} is popular with young people.', 'Thương hiệu này được giới trẻ yêu thích.', 'Customers trust our {brand}.', 'Khách hàng tin thương hiệu của chúng tôi.'],
      ['target', 'v', 'nhắm tới', 'The product {targets} busy office workers.', 'Sản phẩm nhắm tới dân văn phòng bận rộn.', 'The ads {target} students and young workers.', 'Quảng cáo nhắm tới sinh viên và người trẻ đi làm.'],
    ],
    dich: [
      [1, 'Chiến dịch rất thành công.', 'The {campaign} was very successful.', 'The campaign is very successful.'],
      [3, 'Sản phẩm này nhắm tới học sinh.', 'This product {targets} students.'],
    ],
    bt: [
      { cau: 'The advertising ___ increased sales by 30%.', chon: ['campaign', 'brand', 'target', 'advertise'], dap: 0, vi_sao: '[advertising campaign] là chiến dịch quảng cáo.' },
      { cau: 'We need to ___ the new service on the radio.', chon: ['advertise', 'campaign', 'brand', 'target'], dap: 0, vi_sao: 'quảng cáo trên đài là [advertise].' },
    ],
  },
  {
    id: 'tv-ban-hang', ten: 'Từ vựng bán hàng', nhom: 'Từ vựng · Bán hàng', chu_de: 'bán hàng',
    tu: [
      ['quote', 'n', 'bảng báo giá', 'Please send us a {quote} for 100 units.', 'Vui lòng gửi báo giá cho 100 sản phẩm.', 'Can you give me a {quote} for the whole order?', 'Bạn báo giá cho tôi cả đơn hàng được không?'],
      ['negotiate', 'v', 'đàm phán', 'We need to {negotiate} a better price.', 'Chúng ta cần đàm phán giá tốt hơn.', 'They {negotiated} for two hours before they agreed.', 'Họ đàm phán hai tiếng rồi mới đồng ý.'],
      ['contract', 'n', 'hợp đồng', 'Both sides signed the {contract}.', 'Hai bên đã ký hợp đồng.', 'The {contract} is valid for one year.', 'Hợp đồng có hiệu lực một năm.'],
      ['client', 'n', 'khách hàng', 'Our biggest {client} is a bank.', 'Khách hàng lớn nhất của chúng tôi là một ngân hàng.', 'We will meet a new {client} this afternoon.', 'Chiều nay chúng tôi gặp một khách hàng mới.'],
    ],
    dich: [
      [1, 'Chúng tôi sẽ đàm phán giá.', 'We will {negotiate} the price.'],
      [3, 'Khách hàng hài lòng với dịch vụ.', 'The {client} is happy with the service.', 'The client is satisfied with the service.', 'The client was happy with the service.', 'The client was satisfied with the service.'],
    ],
    bt: [
      { cau: 'The two companies ___ for weeks before they agreed on a price.', chon: ['negotiated', 'contract', 'quote', 'client'], dap: 0, vi_sao: 'hai công ty [negotiated], đàm phán nhiều tuần.' },
      { cau: 'Before ordering, ask the supplier for a price ___.', chon: ['quote', 'contract', 'client', 'negotiate'], dap: 0, vi_sao: '[price quote] là bảng báo giá.' },
    ],
  },
  {
    id: 'tv-cham-soc-khach-hang', ten: 'Từ vựng chăm sóc khách hàng', nhom: 'Từ vựng · Dịch vụ khách hàng', chu_de: 'chăm sóc khách hàng',
    tu: [
      ['complaint', 'n', 'lời phàn nàn', 'We received a {complaint} about the noise.', 'Chúng tôi nhận được lời phàn nàn về tiếng ồn.', 'Most {complaints} are about late delivery.', 'Phần lớn lời phàn nàn là về giao hàng trễ.'],
      ['inquiry', 'n', 'câu hỏi, yêu cầu thông tin', 'Thank you for your {inquiry} about our prices.', 'Cảm ơn bạn đã hỏi về giá của chúng tôi.', 'We answer all {inquiries} within 24 hours.', 'Chúng tôi trả lời mọi yêu cầu trong 24 giờ.'],
      ['respond', 'v', 'phản hồi', 'We will {respond} to your email within a day.', 'Chúng tôi sẽ phản hồi email trong vòng một ngày.', 'The manager {responded} quickly to the complaint.', 'Quản lý đã phản hồi lời phàn nàn rất nhanh.'],
      ['satisfaction', 'n', 'sự hài lòng', 'Customer {satisfaction} is our top goal.', 'Sự hài lòng của khách hàng là mục tiêu hàng đầu.', 'The survey measures customer {satisfaction}.', 'Khảo sát đo mức độ hài lòng của khách hàng.'],
    ],
    dich: [
      [1, 'Chúng tôi đã nhận được câu hỏi của bạn.', 'We received your {inquiry}.', 'We have received your inquiry.', 'We received your enquiry.', 'We have received your enquiry.'],
      [3, 'Sự hài lòng của khách hàng rất quan trọng.', 'Customer {satisfaction} is very important.', 'Customer satisfaction is really important.'],
    ],
    bt: [
      { cau: 'Our staff will ___ to all messages within 24 hours.', chon: ['respond', 'complaint', 'inquiry', 'satisfaction'], dap: 0, vi_sao: 'sau [will] cần động từ, [respond to] là phản hồi.' },
      { cau: 'A customer made a ___ about the slow service.', chon: ['complaint', 'satisfaction', 'inquiry', 'respond'], dap: 0, vi_sao: '[make a complaint] là phàn nàn, ở đây là về phục vụ chậm.' },
    ],
  },
  {
    id: 'tv-san-xuat', ten: 'Từ vựng sản xuất', nhom: 'Từ vựng · Sản xuất', chu_de: 'sản xuất',
    tu: [
      ['manufacture', 'v', 'sản xuất', 'The factory {manufactures} car parts.', 'Nhà máy sản xuất phụ tùng ô tô.', 'These shoes are {manufactured} in Vietnam.', 'Những đôi giày này được sản xuất ở Việt Nam.'],
      ['equipment', 'n', 'thiết bị', 'All {equipment} must be checked daily.', 'Mọi thiết bị phải được kiểm tra hằng ngày.', 'The factory bought new {equipment} last year.', 'Năm ngoái nhà máy đã mua thiết bị mới.'],
      ['assemble', 'v', 'lắp ráp', 'Workers {assemble} the phones by hand.', 'Công nhân lắp ráp điện thoại bằng tay.', 'The chairs are easy to {assemble}.', 'Những chiếc ghế này dễ lắp ráp.'],
      ['factory', 'n', 'nhà máy', 'The new {factory} will open in Binh Duong.', 'Nhà máy mới sẽ mở ở Bình Dương.', 'The {factory} runs 24 hours a day.', 'Nhà máy chạy 24 giờ mỗi ngày.'],
    ],
    dich: [
      [1, 'Thiết bị này rất đắt.', 'This {equipment} is very expensive.', 'The equipment is very expensive.'],
      [3, 'Nhà máy ở gần sông.', 'The {factory} is near the river.', 'The factory is close to the river.'],
    ],
    bt: [
      { cau: 'The furniture arrives in pieces, so you have to ___ it yourself.', chon: ['assemble', 'manufacture', 'equipment', 'factory'], dap: 0, vi_sao: 'đồ đến dạng rời thì phải [assemble], lắp ráp.' },
      { cau: 'Safety ___ such as helmets must be worn.', chon: ['equipment', 'factory', 'assemble', 'manufacture'], dap: 0, vi_sao: 'mũ bảo hộ là [safety equipment], thiết bị an toàn.' },
    ],
  },
  {
    id: 'tv-cong-nghe', ten: 'Từ vựng công nghệ', nhom: 'Từ vựng · Công nghệ', chu_de: 'công nghệ',
    tu: [
      ['software', 'n', 'phần mềm', 'The new {software} saves us a lot of time.', 'Phần mềm mới giúp tiết kiệm nhiều thời gian.', 'Our {software} is used by 200 companies.', 'Phần mềm của chúng tôi được 200 công ty dùng.'],
      ['install', 'v', 'cài đặt', 'Please {install} the update tonight.', 'Vui lòng cài bản cập nhật tối nay.', 'The technician {installed} new cameras in the lobby.', 'Kỹ thuật viên đã lắp camera mới ở sảnh.'],
      ['password', 'n', 'mật khẩu', 'Change your {password} every three months.', 'Hãy đổi mật khẩu ba tháng một lần.', 'Never share your {password} with anyone.', 'Đừng bao giờ chia sẻ mật khẩu với ai.'],
      ['update', 'n', 'bản cập nhật', 'The latest {update} fixes several bugs.', 'Bản cập nhật mới nhất sửa nhiều lỗi.', 'The {update} will take about ten minutes.', 'Bản cập nhật mất khoảng mười phút.'],
    ],
    dich: [
      [1, 'Tôi đã cài đặt ứng dụng.', 'I {installed} the app.', 'I have installed the app.', 'I installed the application.'],
      [3, 'Đã có bản cập nhật mới.', 'A new {update} is available.', 'The new update is available.', 'There is a new update.'],
    ],
    bt: [
      { cau: 'Never share your ___ with anyone.', chon: ['password', 'software', 'updated', 'install'], dap: 0, vi_sao: 'không chia sẻ [password], mật khẩu.' },
      { cau: 'The IT team will ___ the program on all computers.', chon: ['install', 'password', 'software', 'updated'], dap: 0, vi_sao: 'sau [will] cần động từ, [install] là cài đặt.' },
    ],
  },
  {
    id: 'tv-thue-nha', ten: 'Từ vựng thuê nhà', nhom: 'Từ vựng · Thuê nhà', chu_de: 'thuê nhà',
    tu: [
      ['rent', 'n', 'tiền thuê', 'The {rent} is due on the first of each month.', 'Tiền thuê phải trả vào ngày đầu mỗi tháng.', 'The {rent} includes water and internet.', 'Tiền thuê đã gồm nước và internet.'],
      ['lease', 'n', 'hợp đồng thuê', 'We signed a two-year {lease} for the office.', 'Chúng tôi đã ký hợp đồng thuê văn phòng hai năm.', 'The {lease} ends in December.', 'Hợp đồng thuê kết thúc vào tháng Mười Hai.'],
      ['tenant', 'n', 'người thuê nhà', 'The {tenant} must keep the apartment clean.', 'Người thuê phải giữ căn hộ sạch sẽ.', 'The new {tenants} will move in on Monday.', 'Người thuê mới sẽ dọn vào thứ Hai.'],
      ['landlord', 'n', 'chủ nhà cho thuê', 'Call the {landlord} if the heater breaks.', 'Hãy gọi chủ nhà nếu máy sưởi hỏng.', 'The {landlord} raised the rent this year.', 'Chủ nhà đã tăng tiền thuê năm nay.'],
    ],
    dich: [
      [1, 'Chúng tôi đã ký hợp đồng thuê.', 'We signed the {lease}.', 'We signed a lease.', 'We have signed the lease.'],
      [3, 'Chủ nhà rất thân thiện.', 'The {landlord} is very friendly.', 'The landlord is very nice.'],
    ],
    bt: [
      { cau: 'The ___ raised the rent for all tenants.', chon: ['landlord', 'tenant', 'lease', 'rent'], dap: 0, vi_sao: 'người tăng tiền thuê là [landlord], chủ nhà.' },
      { cau: 'The monthly ___ for this apartment is 8 million dong.', chon: ['rent', 'lease', 'tenant', 'landlord'], dap: 0, vi_sao: 'số tiền phải trả hằng tháng là [rent].' },
    ],
  },
  {
    id: 'tv-ngan-hang', ten: 'Từ vựng ngân hàng', nhom: 'Từ vựng · Ngân hàng', chu_de: 'ngân hàng',
    tu: [
      ['account', 'n', 'tài khoản', 'I opened a bank {account} last week.', 'Tôi mở tài khoản ngân hàng tuần trước.', 'Your salary will be paid into your {account}.', 'Lương sẽ được trả vào tài khoản của bạn.'],
      ['deposit', 'v', 'gửi tiền vào', 'You can {deposit} money at any branch.', 'Bạn có thể gửi tiền ở bất kỳ chi nhánh nào.', 'I {deposited} 5 million dong this morning.', 'Sáng nay tôi đã gửi 5 triệu đồng.'],
      ['withdraw', 'v', 'rút tiền', 'I need to {withdraw} some cash.', 'Tôi cần rút một ít tiền mặt.', 'You can {withdraw} money from any ATM.', 'Bạn có thể rút tiền ở bất kỳ cây ATM nào.'],
      ['loan', 'n', 'khoản vay', 'The bank approved our {loan}.', 'Ngân hàng đã duyệt khoản vay của chúng tôi.', 'They took out a {loan} to buy a house.', 'Họ vay một khoản để mua nhà.'],
    ],
    dich: [
      [1, 'Tôi muốn gửi tiền vào tài khoản.', 'I want to {deposit} money into my account.', 'I want to deposit money in my account.', 'I would like to deposit money into my account.'],
      [3, 'Họ cần một khoản vay.', 'They need a {loan}.'],
    ],
    bt: [
      { cau: 'You can ___ cash from any ATM in the city.', chon: ['withdraw', 'deposit', 'loan', 'account'], dap: 0, vi_sao: 'lấy tiền ra từ cây [ATM] là [withdraw].' },
      { cau: 'The company took out a ___ to buy new machines.', chon: ['loan', 'account', 'deposit', 'withdraw'], dap: 0, vi_sao: '[take out a loan] là vay tiền.' },
    ],
  },
  {
    id: 'tv-suc-khoe', ten: 'Từ vựng sức khoẻ', nhom: 'Từ vựng · Sức khoẻ', chu_de: 'sức khoẻ',
    tu: [
      ['appointment', 'n', 'cuộc hẹn', 'I have an {appointment} with the dentist at 3 p.m.', 'Tôi có hẹn với nha sĩ lúc 3 giờ chiều.', 'I need to change my {appointment} to Friday.', 'Tôi cần đổi lịch hẹn sang thứ Sáu.'],
      ['prescription', 'n', 'đơn thuốc', 'The doctor gave me a {prescription}.', 'Bác sĩ kê đơn thuốc cho tôi.', 'You need a {prescription} for this medicine.', 'Bạn cần đơn thuốc để mua thuốc này.'],
      ['pharmacy', 'n', 'hiệu thuốc', 'You can buy this at any {pharmacy}.', 'Bạn có thể mua thứ này ở bất kỳ hiệu thuốc nào.', 'The {pharmacy} is open 24 hours a day.', 'Hiệu thuốc mở cửa 24 giờ.'],
      ['insurance', 'n', 'bảo hiểm', 'Health {insurance} is provided for all staff.', 'Mọi nhân viên đều có bảo hiểm y tế.', 'Does your {insurance} cover dental care?', 'Bảo hiểm của bạn có chi trả nha khoa không?'],
    ],
    dich: [
      [1, 'Bác sĩ đã viết đơn thuốc.', 'The doctor wrote a {prescription}.', 'The doctor wrote the prescription.', 'The doctor has written a prescription.'],
      [3, 'Tôi cần mua bảo hiểm.', 'I need to buy {insurance}.'],
    ],
    bt: [
      { cau: 'Please call to make an ___ with Dr. Minh.', chon: ['appointment', 'insurance', 'pharmacy', 'prescription'], dap: 0, vi_sao: '[make an appointment] là đặt lịch hẹn.' },
      { cau: 'Take this ___ to the pharmacy to get your medicine.', chon: ['prescription', 'appointment', 'insurance', 'pharmacy'], dap: 0, vi_sao: 'mang [prescription], đơn thuốc, ra hiệu thuốc.' },
    ],
  },
  {
    id: 'tv-di-lai', ten: 'Từ vựng đi lại', nhom: 'Từ vựng · Đi lại', chu_de: 'đi lại',
    tu: [
      ['commute', 'v', 'đi lại giữa nhà và nơi làm', 'I {commute} to work by bus.', 'Tôi đi làm bằng xe buýt.', 'My {commute} takes about 40 minutes.', 'Đường đi làm của tôi mất khoảng 40 phút.'],
      ['fare', 'n', 'giá vé xe, tàu', 'The bus {fare} is 7,000 dong.', 'Giá vé xe buýt là 7.000 đồng.', 'Train {fares} will go up next month.', 'Giá vé tàu sẽ tăng vào tháng sau.'],
      ['passenger', 'n', 'hành khách', 'The train carries 300 {passengers}.', 'Đoàn tàu chở 300 hành khách.', '{Passengers} must wear a seat belt.', 'Hành khách phải thắt dây an toàn.'],
      ['route', 'n', 'tuyến đường', 'This is the fastest {route} to the airport.', 'Đây là đường nhanh nhất ra sân bay.', 'The bus changed its {route} because of road work.', 'Xe buýt đổi tuyến vì sửa đường.'],
    ],
    dich: [
      [1, 'Giá vé rất rẻ.', 'The {fare} is very cheap.', 'The fare is very low.'],
      [3, 'Đây là tuyến đường ngắn nhất.', 'This is the shortest {route}.'],
    ],
    bt: [
      { cau: 'The taxi ___ from the airport to the city is about 200,000 dong.', chon: ['fare', 'route', 'passenger', 'commute'], dap: 0, vi_sao: 'số tiền đi taxi là [fare], giá cước.' },
      { cau: 'All ___ must wear seat belts.', chon: ['passengers', 'fares', 'routes', 'commute'], dap: 0, vi_sao: 'người phải thắt dây an toàn là [passengers].' },
    ],
  },
  {
    id: 'tv-su-kien', ten: 'Từ vựng sự kiện công ty', nhom: 'Từ vựng · Sự kiện', chu_de: 'sự kiện công ty',
    tu: [
      ['anniversary', 'n', 'lễ kỷ niệm', 'We will celebrate our 10th {anniversary} in May.', 'Chúng tôi sẽ kỷ niệm 10 năm thành lập vào tháng Năm.', 'Every employee got a gift for the company {anniversary}.', 'Mỗi nhân viên được tặng quà nhân dịp kỷ niệm thành lập công ty.'],
      ['banquet', 'n', 'bữa tiệc lớn', 'The awards {banquet} starts at 7 p.m.', 'Tiệc trao giải bắt đầu lúc 7 giờ tối.', 'The {banquet} was held at a hotel downtown.', 'Bữa tiệc lớn được tổ chức ở một khách sạn trung tâm.'],
      ['award', 'n', 'giải thưởng', 'Ms. Hoa won the best employee {award}.', 'Cô Hoa giành giải nhân viên xuất sắc nhất.', 'Our team received an {award} for customer service.', 'Nhóm chúng tôi nhận giải thưởng về dịch vụ khách hàng.'],
      ['celebrate', 'v', 'ăn mừng, kỷ niệm', 'Let us {celebrate} our success!', 'Hãy cùng ăn mừng thành công!', 'We {celebrated} the opening of the new office.', 'Chúng tôi đã ăn mừng khai trương văn phòng mới.'],
    ],
    dich: [
      [1, 'Bữa tiệc bắt đầu lúc bảy giờ.', 'The {banquet} starts at seven.', 'The banquet begins at seven.', 'The banquet starts at seven o\'clock.'],
      [3, 'Chúng tôi ăn mừng thành công của mình.', 'We {celebrate} our success.', 'We celebrated our success.', 'We are celebrating our success.'],
    ],
    bt: [
      { cau: 'The company is planning a party to ___ its 20th anniversary.', chon: ['celebrate', 'award', 'banquet', 'anniversary'], dap: 0, vi_sao: 'sau [to] cần động từ, [celebrate] là kỷ niệm.' },
      { cau: 'Mr. Duc received an ___ for his excellent work.', chon: ['award', 'banquet', 'anniversary', 'celebrate'], dap: 0, vi_sao: 'làm việc xuất sắc thì nhận [award], giải thưởng.' },
    ],
  },
  {
    id: 'tv-dao-tao', ten: 'Từ vựng đào tạo', nhom: 'Từ vựng · Đào tạo', chu_de: 'đào tạo',
    tu: [
      ['workshop', 'n', 'buổi học thực hành', 'Join our free {workshop} on public speaking.', 'Hãy tham gia buổi thực hành miễn phí về nói trước đám đông.', 'The {workshop} is for new employees only.', 'Buổi học thực hành này chỉ dành cho nhân viên mới.'],
      ['trainee', 'n', 'người được đào tạo', 'Each {trainee} gets a handbook.', 'Mỗi học viên được phát một cuốn sổ tay.', 'The {trainees} will work in different departments.', 'Các học viên sẽ làm ở nhiều phòng ban khác nhau.'],
      ['instructor', 'n', 'người hướng dẫn', 'The {instructor} explained the rules.', 'Người hướng dẫn đã giải thích các quy tắc.', 'Our {instructor} has ten years of experience.', 'Người hướng dẫn của chúng tôi có mười năm kinh nghiệm.'],
      ['certificate', 'n', 'chứng chỉ', 'You will receive a {certificate} after the course.', 'Bạn sẽ nhận chứng chỉ sau khoá học.', 'You need a first aid {certificate} for this job.', 'Bạn cần chứng chỉ sơ cứu cho công việc này.'],
    ],
    dich: [
      [1, 'Có mười học viên trong lớp.', 'There are ten {trainees} in the class.'],
      [3, 'Tôi đã nhận được chứng chỉ.', 'I received the {certificate}.', 'I received a certificate.', 'I got the certificate.', 'I got a certificate.', 'I have received the certificate.', 'I have received a certificate.'],
    ],
    bt: [
      { cau: 'The ___ showed the trainees how to use the machine.', chon: ['instructor', 'certificate', 'workshop', 'trainee'], dap: 0, vi_sao: 'người chỉ cho học viên là [instructor].' },
      { cau: 'Participants who finish the course will receive a ___.', chon: ['certificate', 'instructor', 'trainee', 'workshop'], dap: 0, vi_sao: 'học xong thì nhận [certificate], chứng chỉ.' },
    ],
  },
  {
    id: 'tv-email', ten: 'Từ vựng email công việc', nhom: 'Từ vựng · Email', chu_de: 'email công việc',
    tu: [
      ['attach', 'v', 'đính kèm', 'I have {attached} the price list.', 'Tôi đã đính kèm bảng giá.', 'Please {attach} your CV to the email.', 'Vui lòng đính kèm CV vào email.'],
      ['forward', 'v', 'chuyển tiếp', 'Please {forward} this email to your team.', 'Vui lòng chuyển tiếp email này cho nhóm của bạn.', 'Can you {forward} me the invoice?', 'Bạn chuyển tiếp hoá đơn cho tôi được không?'],
      ['recipient', 'n', 'người nhận', 'Check the {recipient} before you send it.', 'Hãy kiểm tra người nhận trước khi gửi.', 'The email has five {recipients}.', 'Email này có năm người nhận.'],
      ['reply', 'v', 'trả lời', 'Please {reply} by Friday.', 'Vui lòng trả lời trước thứ Sáu.', 'She has not {replied} to my email yet.', 'Cô ấy vẫn chưa trả lời email của tôi.'],
    ],
    dich: [
      [1, 'Tôi sẽ chuyển tiếp email cho bạn.', 'I will {forward} the email to you.', 'I will forward you the email.'],
      [3, 'Vui lòng trả lời email này.', 'Please {reply} to this email.'],
    ],
    bt: [
      { cau: 'Please find the contract ___ to this email.', chon: ['attached', 'forwarded', 'replied', 'recipient'], dap: 0, vi_sao: '[attached to this email] là đính kèm trong email.' },
      { cau: 'Could you ___ the message to Mr. Son? He did not receive it.', chon: ['forward', 'attach', 'reply', 'recipient'], dap: 0, vi_sao: 'gửi lại thư cho người khác là [forward], chuyển tiếp.' },
    ],
  },
];
