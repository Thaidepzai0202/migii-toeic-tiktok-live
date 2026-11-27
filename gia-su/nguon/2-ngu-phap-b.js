// Ngữ pháp (2/2): so sánh, giới từ, liên từ, lượng từ, mạo từ, động từ khuyết thiếu, cấu trúc hay gặp.
// Nội dung tạm cho buổi live thử 23/11/2026, chưa duyệt. Cách viết: xem đầu gia-su/build_bai.js.
const SS = 'Ngữ pháp · So sánh';
const GT = 'Ngữ pháp · Giới từ';
const LT = 'Ngữ pháp · Liên từ';
const LU = 'Ngữ pháp · Lượng từ và đại từ';
const CT = 'Ngữ pháp · Cấu trúc hay gặp';

exports.ngu_phap = [
  {
    id: 'np-so-sanh-hon', ten: 'So sánh hơn', nhom: SS,
    y: ['Tính từ ngắn {thêm [er]}, tính từ dài {dùng [more]}, rồi tới [than].'],
    ct: { hien: 'adj-er than · more + adj than', noi: 'tính từ ngắn thêm [er], tính từ dài dùng [more], sau đó là [than]' },
    vd: [
      { en: 'This model is {cheaper than} the old one.', vi: 'Mẫu này rẻ hơn mẫu cũ.', noi: '[cheap] là tính từ ngắn nên thêm [er].' },
      { en: 'The new system is {more efficient than} the old one.', vi: 'Hệ thống mới hiệu quả hơn hệ thống cũ.', noi: '[efficient] là tính từ dài nên dùng [more].' },
    ],
    bt: [
      { cau: 'The second proposal is ___ than the first one.', chon: ['more practical', 'practical', 'most practical', 'practically'], dap: 0, vi_sao: 'có [than] và tính từ dài, dùng [more practical].' },
      { cau: 'Sales this year are ___ than last year.', chon: ['higher', 'high', 'highest', 'more high'], dap: 0, vi_sao: '[high] là tính từ ngắn, so sánh hơn thì thêm [er].' },
    ],
  },
  {
    id: 'np-so-sanh-nhat', ten: 'So sánh nhất', nhom: SS,
    y: ['Tính từ ngắn {thêm [est]}, tính từ dài {dùng [most]}, và luôn có [the] đứng trước.'],
    ct: { hien: 'the + adj-est · the most + adj', noi: '[the] cộng tính từ thêm [est], hoặc [the most] cộng tính từ dài' },
    vd: [
      { en: 'This is {the largest} hotel in the city.', vi: 'Đây là khách sạn lớn nhất thành phố.', noi: '[large] ngắn nên thêm [est].' },
      { en: 'She is {the most experienced} member of the team.', vi: 'Cô ấy là người giàu kinh nghiệm nhất nhóm.', noi: '[experienced] dài nên dùng [the most].' },
    ],
    bt: [
      { cau: 'This is the ___ product we have ever launched.', chon: ['most successful', 'more successful', 'successful', 'successfully'], dap: 0, vi_sao: 'có [the] và [ever], dùng so sánh nhất [most successful].' },
      { cau: 'Friday is the ___ day of the week for our store.', chon: ['busiest', 'busier', 'busy', 'most busy'], dap: 0, vi_sao: '[busy] là tính từ ngắn, so sánh nhất là [busiest].' },
    ],
  },
  {
    id: 'np-so-sanh-bang', ten: 'So sánh bằng [as … as]', nhom: SS,
    y: ['{[as] cộng tính từ cộng [as]} nghĩa là {bằng}.', '{[not as] … [as]} nghĩa là {không bằng}.'],
    ct: { hien: 'as + adj/adv + as', noi: '[as] cộng tính từ hoặc trạng từ, cộng [as]' },
    vd: [
      { en: 'The new phone is {as fast as} a laptop.', vi: 'Điện thoại mới nhanh ngang một chiếc laptop.', noi: 'Giữa hai chữ [as] là tính từ nguyên mẫu.' },
      { en: 'This road is {not as busy as} the highway.', vi: 'Con đường này không đông bằng đường cao tốc.', noi: '[not as] … [as] là không bằng.' },
    ],
    bt: [
      { cau: 'Please reply as ___ as possible.', chon: ['quickly', 'quick', 'quicker', 'quickest'], dap: 0, vi_sao: 'bổ nghĩa cho động từ [reply] cần trạng từ, giữ nguyên mẫu giữa hai chữ [as].' },
      { cau: 'The rent here is not as ___ as in the city center.', chon: ['expensive', 'more expensive', 'expensively', 'most expensive'], dap: 0, vi_sao: 'giữa [as] và [as] dùng tính từ nguyên mẫu.' },
    ],
  },
  {
    id: 'np-in-on-at', ten: 'Giới từ thời gian: [in], [on], [at]', nhom: GT,
    y: ['{[at]} cho giờ, {[on]} cho ngày và thứ, {[in]} cho tháng, năm và mùa.'],
    ct: { hien: 'at 9 a.m. · on Monday · in May', noi: '[at 9 a.m.], [on Monday], [in May]' },
    vd: [
      { en: 'The meeting starts {at} 10 a.m.', vi: 'Cuộc họp bắt đầu lúc 10 giờ sáng.', noi: 'Giờ cụ thể dùng [at].' },
      { en: 'The store is closed {on} Sundays.', vi: 'Cửa hàng đóng cửa vào các ngày Chủ nhật.', noi: 'Thứ trong tuần dùng [on].' },
    ],
    bt: [
      { cau: 'The annual sale will begin ___ July 1.', chon: ['on', 'in', 'at', 'for'], dap: 0, vi_sao: 'ngày cụ thể dùng [on].' },
      { cau: 'Our company was founded ___ 2015.', chon: ['in', 'on', 'at', 'for'], dap: 0, vi_sao: 'năm thì dùng [in].' },
    ],
  },
  {
    id: 'np-by-until', ten: '[By] và [until]', nhom: GT,
    y: ['{[by]} nghĩa là {không muộn hơn} một mốc.', '{[until]} nghĩa là {kéo dài cho tới} một mốc.'],
    ct: { hien: 'by Friday (trước hạn) · until Friday (kéo dài tới)', noi: '[by Friday] là xong trước thứ Sáu, [until Friday] là kéo dài tới thứ Sáu' },
    vd: [
      { en: 'Please submit the form {by} Friday.', vi: 'Vui lòng nộp biểu mẫu trước thứ Sáu.', noi: 'Hạn chót dùng [by].' },
      { en: 'The store is open {until} 9 p.m.', vi: 'Cửa hàng mở tới 9 giờ tối.', noi: 'Mở liên tục tới 9 giờ, dùng [until].' },
    ],
    bt: [
      { cau: 'All reports must be completed ___ the end of the month.', chon: ['by', 'until', 'since', 'during'], dap: 0, vi_sao: 'hạn hoàn thành dùng [by].' },
      { cau: 'The road will be closed ___ next Monday.', chon: ['until', 'by', 'since', 'at'], dap: 0, vi_sao: 'việc đóng đường kéo dài tới thứ Hai, dùng [until].' },
    ],
  },
  {
    id: 'np-during-while', ten: '[During] và [while]', nhom: GT,
    y: ['{[during]} đi với {danh từ}.', '{[while]} đi với {cả một mệnh đề}.'],
    ct: { hien: 'during + N · while + S + V', noi: '[during] cộng danh từ, [while] cộng chủ ngữ và động từ' },
    vd: [
      { en: 'Please keep quiet {during} the meeting.', vi: 'Vui lòng giữ trật tự trong suốt cuộc họp.', noi: '[the meeting] là danh từ, dùng [during].' },
      { en: 'He called {while} I was driving.', vi: 'Anh ấy gọi khi tôi đang lái xe.', noi: 'Sau [while] là mệnh đề [I was driving].' },
    ],
    bt: [
      { cau: 'Mobile phones must be turned off ___ the performance.', chon: ['during', 'while', 'when', 'as'], dap: 0, vi_sao: '[the performance] là danh từ, dùng [during].' },
      { cau: '___ the manager was away, Ms. Nga handled all requests.', chon: ['While', 'During', 'Despite', 'Because of'], dap: 0, vi_sao: 'theo sau là mệnh đề có chủ ngữ và động từ, dùng [while].' },
    ],
  },
  {
    id: 'np-although-despite', ten: '[Although] và [despite]', nhom: LT,
    y: ['{[although]} cộng {mệnh đề}.', '{[despite]} cộng {danh từ hoặc động từ thêm [ing]}.'],
    ct: { hien: 'although + S + V · despite + N / V-ing', noi: '[although] cộng mệnh đề, [despite] cộng danh từ' },
    vd: [
      { en: '{Although} it rained, the event continued.', vi: 'Dù trời mưa, sự kiện vẫn tiếp tục.', noi: 'Sau [although] là mệnh đề [it rained].' },
      { en: '{Despite} the rain, the event continued.', vi: 'Dù mưa, sự kiện vẫn tiếp tục.', noi: 'Sau [despite] là danh từ [the rain].' },
    ],
    bt: [
      { cau: '___ the high price, the product sold well.', chon: ['Despite', 'Although', 'Even though', 'Because'], dap: 0, vi_sao: '[the high price] là danh từ, dùng [despite].' },
      { cau: '___ he was tired, he finished the report.', chon: ['Although', 'Despite', 'In spite of', 'Because of'], dap: 0, vi_sao: 'sau chỗ trống là mệnh đề, dùng [although].' },
    ],
  },
  {
    id: 'np-because-because-of', ten: '[Because] và [because of]', nhom: LT,
    y: ['{[because]} cộng {mệnh đề}.', '{[because of]} cộng {danh từ}.'],
    ct: { hien: 'because + S + V · because of + N', noi: '[because] cộng mệnh đề, [because of] cộng danh từ' },
    vd: [
      { en: 'The flight was delayed {because of} the storm.', vi: 'Chuyến bay bị hoãn vì cơn bão.', noi: '[the storm] là danh từ.' },
      { en: 'The flight was delayed {because} the weather was bad.', vi: 'Chuyến bay bị hoãn vì thời tiết xấu.', noi: 'Sau [because] là mệnh đề.' },
    ],
    bt: [
      { cau: 'The meeting was cancelled ___ the director was ill.', chon: ['because', 'because of', 'due to', 'despite'], dap: 0, vi_sao: 'sau chỗ trống là mệnh đề, dùng [because].' },
      { cau: 'Sales increased ___ the new advertising campaign.', chon: ['because of', 'because', 'although', 'so'], dap: 0, vi_sao: 'sau chỗ trống là cụm danh từ, dùng [because of].' },
    ],
  },
  {
    id: 'np-so-such', ten: '[So] và [such]', nhom: LT,
    y: ['{[so]} cộng {tính từ hoặc trạng từ}.', '{[such]} cộng {cụm danh từ}.'],
    ct: { hien: 'so + adj + that · such + a + adj + N + that', noi: '[so] cộng tính từ, [such] cộng cụm danh từ, rồi tới [that]' },
    vd: [
      { en: 'The demand was {so high} that we ran out of stock.', vi: 'Nhu cầu cao tới mức chúng tôi hết hàng.', noi: '[high] là tính từ, dùng [so].' },
      { en: 'It was {such a long meeting} that everyone was tired.', vi: 'Cuộc họp dài tới mức ai cũng mệt.', noi: 'Có danh từ [meeting], dùng [such].' },
    ],
    bt: [
      { cau: 'The instructions were ___ clear that nobody had questions.', chon: ['so', 'such', 'too', 'very'], dap: 0, vi_sao: 'sau chỗ trống là tính từ [clear] và có [that], dùng [so].' },
      { cau: 'It was ___ a successful event that we will repeat it next year.', chon: ['such', 'so', 'too', 'enough'], dap: 0, vi_sao: 'sau chỗ trống là cụm danh từ [a successful event], dùng [such].' },
    ],
  },
  {
    id: 'np-both-either-neither', ten: '[Both], [either], [neither]', nhom: LT,
    y: ['{[both] … [and]}: cả hai.', '{[either] … [or]}: một trong hai.', '{[neither] … [nor]}: không cái nào.'],
    vd: [
      { en: 'You can pay {either} by card {or} in cash.', vi: 'Bạn có thể trả bằng thẻ hoặc tiền mặt.', noi: '[either] đi với [or].' },
      { en: '{Neither} the manager {nor} the assistant was available.', vi: 'Cả quản lý lẫn trợ lý đều không rảnh.', noi: '[neither] đi với [nor].' },
    ],
    bt: [
      { cau: 'The position requires both experience ___ good communication skills.', chon: ['and', 'or', 'nor', 'but'], dap: 0, vi_sao: '[both] đi với [and].' },
      { cau: 'Neither the printer ___ the scanner is working today.', chon: ['nor', 'or', 'and', 'but'], dap: 0, vi_sao: '[neither] đi với [nor].' },
    ],
  },
  {
    id: 'np-not-only-but-also', ten: '[Not only … but also]', nhom: LT,
    y: ['{[not only] … [but also]} nghĩa là {không những … mà còn}.'],
    ct: { hien: 'not only A but also B', noi: '[not only] A, [but also] B' },
    vd: [
      { en: 'The hotel is {not only} cheap {but also} comfortable.', vi: 'Khách sạn không những rẻ mà còn thoải mái.', noi: 'Hai vế cùng loại: đều là tính từ.' },
      { en: 'She speaks {not only} English {but also} Korean.', vi: 'Cô ấy nói không những tiếng Anh mà còn cả tiếng Hàn.', noi: 'Hai vế đều là danh từ.' },
    ],
    bt: [
      { cau: 'The software is not only fast ___ easy to use.', chon: ['but also', 'and also', 'or', 'so'], dap: 0, vi_sao: '[not only] đi với [but also].' },
      { cau: 'The new policy will benefit not only employees but ___ customers.', chon: ['also', 'too', 'either', 'neither'], dap: 0, vi_sao: 'cặp đúng là [not only] … [but also].' },
    ],
  },
  {
    id: 'np-however-therefore', ten: '[However], [therefore], [moreover]', nhom: LT,
    y: ['{[however]} là tuy nhiên, {[therefore]} là vì vậy, {[moreover]} là hơn nữa.', 'Các từ này thường {đứng đầu câu}, rồi tới {dấu phẩy}.'],
    vd: [
      { en: 'The plan is good. {However}, it is expensive.', vi: 'Kế hoạch tốt. Tuy nhiên, nó tốn kém.', noi: 'Hai ý trái ngược, dùng [however].' },
      { en: 'Sales fell. {Therefore}, we cut costs.', vi: 'Doanh số giảm. Vì vậy, chúng tôi cắt giảm chi phí.', noi: 'Ý sau là kết quả, dùng [therefore].' },
    ],
    bt: [
      { cau: 'The hotel is near the beach. ___, it offers free breakfast.', chon: ['Moreover', 'However', 'Therefore', 'Although'], dap: 0, vi_sao: 'thêm một điểm tốt nữa, dùng [moreover].' },
      { cau: 'Our flight was cancelled. ___, we had to stay one more night.', chon: ['Therefore', 'However', 'Moreover', 'Although'], dap: 0, vi_sao: 'ở lại thêm một đêm là kết quả, dùng [therefore].' },
    ],
  },
  {
    id: 'np-dai-tu-phan-than', ten: 'Đại từ phản thân', nhom: LU,
    y: ['Dùng {[myself], [himself], [themselves]} khi {người làm và người chịu là một}, hoặc để nhấn mạnh {tự mình làm}.'],
    ct: { hien: 'by myself = một mình, tự mình', noi: '[by myself] nghĩa là tự mình làm, một mình' },
    vd: [
      { en: 'Ms. Ha introduced {herself} to the guests.', vi: 'Cô Hà tự giới thiệu với khách.', noi: 'Người giới thiệu và người được giới thiệu là một.' },
      { en: 'I fixed the printer {by myself}.', vi: 'Tôi tự sửa máy in.', noi: '[by myself] là tự mình làm.' },
    ],
    bt: [
      { cau: 'Mr. Long prefers to check the figures ___.', chon: ['himself', 'him', 'his', 'he'], dap: 0, vi_sao: 'nhấn mạnh anh ấy tự làm, dùng [himself].' },
      { cau: 'The new employees introduced ___ at the meeting.', chon: ['themselves', 'them', 'their', 'they'], dap: 0, vi_sao: 'người làm và người chịu là một, dùng [themselves].' },
    ],
  },
  {
    id: 'np-so-huu', ten: 'Tính từ sở hữu và đại từ sở hữu', nhom: LU,
    y: ['{Tính từ sở hữu} như [my], [their] {luôn đi kèm danh từ}.', '{Đại từ sở hữu} như [mine], [theirs] {đứng một mình}.'],
    ct: { hien: 'my book = mine · their car = theirs', noi: '[my book] bằng [mine], [their car] bằng [theirs]' },
    vd: [
      { en: 'This is {my} desk.', vi: 'Đây là bàn của tôi.', noi: '[my] đi với danh từ [desk].' },
      { en: 'This desk is {mine}.', vi: 'Cái bàn này là của tôi.', noi: '[mine] đứng một mình.' },
    ],
    bt: [
      { cau: 'The clients thanked us for ___ quick response.', chon: ['our', 'ours', 'us', 'we'], dap: 0, vi_sao: 'trước danh từ [response] cần tính từ sở hữu [our].' },
      { cau: 'That umbrella is not mine; it is ___.', chon: ['hers', 'her', 'she', 'herself'], dap: 0, vi_sao: 'đứng một mình, không có danh từ theo sau, dùng [hers].' },
    ],
  },
  {
    id: 'np-much-many', ten: '[Much] và [many]', nhom: LU,
    y: ['{[many]} đi với {danh từ đếm được số nhiều}.', '{[much]} đi với {danh từ không đếm được}.'],
    ct: { hien: 'many + N số nhiều · much + N không đếm được', noi: '[many] cộng danh từ số nhiều, [much] cộng danh từ không đếm được' },
    vd: [
      { en: 'We received {many} applications.', vi: 'Chúng tôi nhận được nhiều đơn ứng tuyển.', noi: '[applications] đếm được, dùng [many].' },
      { en: 'We do not have {much} time.', vi: 'Chúng tôi không có nhiều thời gian.', noi: '[time] không đếm được, dùng [much].' },
    ],
    bt: [
      { cau: 'How ___ information do you need for the report?', chon: ['much', 'many', 'few', 'a few'], dap: 0, vi_sao: '[information] không đếm được, dùng [much].' },
      { cau: 'There were not ___ visitors at the trade show this year.', chon: ['many', 'much', 'little', 'a little'], dap: 0, vi_sao: '[visitors] đếm được, số nhiều, dùng [many].' },
    ],
  },
  {
    id: 'np-few-little', ten: '[A few] và [a little]', nhom: LU,
    y: ['{[a few]} đi với {danh từ đếm được}; {[a little]} đi với {danh từ không đếm được}.', 'Bỏ chữ [a] thì nghĩa thành {rất ít, gần như không có}.'],
    ct: { hien: 'a few + N số nhiều · a little + N không đếm được', noi: '[a few] cộng danh từ số nhiều, [a little] cộng danh từ không đếm được' },
    vd: [
      { en: 'We still have {a few} seats left.', vi: 'Chúng tôi vẫn còn vài chỗ trống.', noi: '[seats] đếm được, vẫn còn một ít.' },
      { en: 'There is {little} time before the deadline.', vi: 'Còn rất ít thời gian trước hạn chót.', noi: '[time] không đếm được, gần như hết.' },
    ],
    bt: [
      { cau: 'Could you give me ___ advice about the interview?', chon: ['a little', 'a few', 'many', 'several'], dap: 0, vi_sao: '[advice] không đếm được, dùng [a little].' },
      { cau: 'Only ___ employees attended the optional training.', chon: ['a few', 'a little', 'much', 'little'], dap: 0, vi_sao: '[employees] đếm được, số nhiều, dùng [a few].' },
    ],
  },
  {
    id: 'np-each-every-all', ten: '[Each], [every] và [all]', nhom: LU,
    y: ['{[each]} và {[every]} đi với {danh từ số ít}.', '{[all]} đi với {danh từ số nhiều}.'],
    ct: { hien: 'each / every + N số ít · all + N số nhiều', noi: '[each] và [every] cộng danh từ số ít, [all] cộng danh từ số nhiều' },
    vd: [
      { en: '{Every} employee {has} a parking card.', vi: 'Mỗi nhân viên đều có thẻ đỗ xe.', noi: 'Sau [every] là số ít, động từ dùng [has].' },
      { en: '{All} employees {have} a parking card.', vi: 'Tất cả nhân viên đều có thẻ đỗ xe.', noi: 'Sau [all] là số nhiều, động từ dùng [have].' },
    ],
    bt: [
      { cau: 'Each participant ___ a certificate at the end of the course.', chon: ['receives', 'receive', 'are receiving', 'have received'], dap: 0, vi_sao: 'sau [each] là số ít, động từ thêm [s].' },
      { cau: '___ the documents are stored in the shared folder.', chon: ['All', 'Every', 'Each', 'Much'], dap: 0, vi_sao: '[documents] số nhiều và động từ [are], dùng [all].' },
    ],
  },
  {
    id: 'np-a-an-the', ten: 'Mạo từ [a], [an], [the]', nhom: LU,
    y: ['{[a]} và {[an]} dùng cho thứ {nhắc lần đầu, chưa xác định}.', '{[the]} dùng cho thứ {đã xác định}, hai bên cùng biết.'],
    ct: { hien: 'a + âm phụ âm · an + âm nguyên âm', noi: '[a] trước âm phụ âm, [an] trước âm nguyên âm, như [an hour]' },
    vd: [
      { en: 'I need {an} umbrella.', vi: 'Tôi cần một cái ô.', noi: '[umbrella] bắt đầu bằng âm nguyên âm, dùng [an].' },
      { en: 'Please close {the} door.', vi: 'Vui lòng đóng cửa lại.', noi: 'Cái cửa mà cả hai đều biết, dùng [the].' },
    ],
    meo: { hien: 'Xét âm đọc, không xét chữ cái: an hour, an MBA, a university.', noi: 'Nhớ xét âm đọc: [an hour], [an MBA], nhưng [a university].' },
    bt: [
      { cau: 'The interview will take about ___ hour.', chon: ['an', 'a', 'many', 'much'], dap: 0, vi_sao: '[hour] đọc bắt đầu bằng âm nguyên âm, dùng [an].' },
      { cau: 'Ms. Lan has ___ MBA from a top business school.', chon: ['an', 'a', 'many', 'much'], dap: 0, vi_sao: '[MBA] đọc bắt đầu bằng âm nguyên âm, dùng [an].' },
    ],
  },
  {
    id: 'np-must-should-may', ten: '[Must], [should], [may]', nhom: CT,
    y: ['{[must]} là bắt buộc, {[should]} là nên, {[may]} là có thể hoặc được phép.', 'Sau các từ này luôn là {động từ nguyên mẫu}.'],
    ct: { hien: 'must / should / may + V', noi: '[must], [should], [may] cộng động từ nguyên mẫu' },
    vd: [
      { en: 'Visitors {must} sign in at the front desk.', vi: 'Khách phải đăng ký ở quầy lễ tân.', noi: 'Quy định bắt buộc, dùng [must].' },
      { en: 'You {should} back up your files regularly.', vi: 'Bạn nên sao lưu tệp thường xuyên.', noi: 'Lời khuyên, dùng [should].' },
    ],
    bt: [
      { cau: 'All employees must ___ their ID badges at all times.', chon: ['wear', 'wearing', 'wears', 'to wear'], dap: 0, vi_sao: 'sau [must] là động từ nguyên mẫu.' },
      { cau: 'Passengers ___ not use mobile phones during takeoff.', chon: ['may', 'are', 'has', 'will be'], dap: 0, vi_sao: '[may not] là không được phép, sau đó là động từ nguyên mẫu.' },
    ],
  },
  {
    id: 'np-hoa-hop-chu-vi', ten: 'Hoà hợp chủ ngữ và động từ', nhom: CT,
    y: ['{Chủ ngữ số ít} đi với {động từ số ít}, kể cả khi có cụm [of] chen giữa.', '{[the number of]} đi với số ít, {[a number of]} đi với số nhiều.'],
    vd: [
      { en: 'The list of participants {is} on the table.', vi: 'Danh sách người tham dự ở trên bàn.', noi: 'Chủ ngữ chính là [the list], số ít.' },
      { en: 'A number of customers {have} complained.', vi: 'Một số khách hàng đã phàn nàn.', noi: '[a number of] nghĩa là nhiều, đi với số nhiều.' },
    ],
    bt: [
      { cau: 'The quality of our products ___ improved significantly.', chon: ['has', 'have', 'are', 'were'], dap: 0, vi_sao: 'chủ ngữ chính là [the quality], số ít.' },
      { cau: 'The number of applicants ___ increasing every year.', chon: ['is', 'are', 'have', 'were'], dap: 0, vi_sao: '[the number of] đi với động từ số ít.' },
    ],
  },
  {
    id: 'np-have-something-done', ten: 'Cấu trúc [have something done]', nhom: CT,
    y: ['{[have] cộng vật cộng động từ dạng ba} nghĩa là {nhờ người khác làm} việc gì đó.'],
    ct: { hien: 'have / get + something + V3', noi: '[have] hoặc [get], cộng vật, cộng động từ dạng ba' },
    vd: [
      { en: 'I {had my car repaired} yesterday.', vi: 'Hôm qua tôi đã mang xe đi sửa.', noi: 'Tôi không tự sửa, người khác sửa giúp.' },
      { en: 'We will {have the documents translated}.', vi: 'Chúng tôi sẽ thuê người dịch các tài liệu.', noi: 'Tài liệu được dịch, dùng dạng ba [translated].' },
    ],
    bt: [
      { cau: 'Ms. Kim had the contract ___ by a lawyer.', chon: ['reviewed', 'review', 'reviewing', 'to review'], dap: 0, vi_sao: '[have] cộng vật cộng động từ dạng ba.' },
      { cau: 'We need to get the air conditioner ___ before summer.', chon: ['fixed', 'fix', 'fixing', 'to fix'], dap: 0, vi_sao: '[get] cộng vật cộng dạng ba: nhờ người sửa.' },
    ],
  },
  {
    id: 'np-make-let', ten: '[Make] và [let] cộng động từ nguyên mẫu', nhom: CT,
    y: ['{[make] cộng người cộng động từ}: {bắt ai đó làm}.', '{[let] cộng người cộng động từ}: {để ai đó làm}.'],
    ct: { hien: 'make / let + sb + V', noi: '[make] hoặc [let], cộng người, cộng động từ nguyên mẫu không có [to]' },
    vd: [
      { en: 'The manager {made us redo} the report.', vi: 'Quản lý bắt chúng tôi làm lại báo cáo.', noi: 'Sau [made us] là [redo], không có [to].' },
      { en: 'Please {let me know} if you have questions.', vi: 'Vui lòng cho tôi biết nếu bạn có câu hỏi.', noi: 'Sau [let me] là [know].' },
    ],
    bt: [
      { cau: 'The new software lets users ___ files quickly.', chon: ['share', 'to share', 'sharing', 'shared'], dap: 0, vi_sao: 'sau [let] cộng người là động từ nguyên mẫu.' },
      { cau: 'Our supervisor made everyone ___ the safety rules.', chon: ['review', 'to review', 'reviewing', 'reviewed'], dap: 0, vi_sao: 'sau [make] cộng người là động từ nguyên mẫu, không có [to].' },
    ],
  },
  {
    id: 'np-used-to', ten: '[Used to] và [be used to]', nhom: CT,
    y: ['{[used to] cộng động từ}: {thói quen trong quá khứ}, nay không còn.', '{[be used to] cộng động từ thêm [ing]}: {đã quen với} việc gì.'],
    ct: { hien: 'used to + V · be used to + V-ing', noi: '[used to] cộng động từ nguyên mẫu, [be used to] cộng động từ thêm [ing]' },
    vd: [
      { en: 'I {used to work} in Da Nang.', vi: 'Tôi từng làm việc ở Đà Nẵng.', noi: 'Trước kia làm, giờ không còn.' },
      { en: 'She {is used to working} late.', vi: 'Cô ấy đã quen làm việc muộn.', noi: 'Đã quen rồi, dùng [working].' },
    ],
    bt: [
      { cau: 'Mr. Bao used to ___ for a bank before he started his own business.', chon: ['work', 'working', 'works', 'worked'], dap: 0, vi_sao: 'sau [used to] là động từ nguyên mẫu.' },
      { cau: 'The staff are used to ___ with international clients.', chon: ['dealing', 'deal', 'dealt', 'deals'], dap: 0, vi_sao: 'sau [be used to] là động từ thêm [ing].' },
    ],
  },
  {
    id: 'np-too-enough', ten: '[Too] và [enough]', nhom: CT,
    y: ['{[too] đứng trước tính từ}: {quá}, tới mức không làm được.', '{[enough] đứng sau tính từ}: {đủ} để làm được.'],
    ct: { hien: 'too + adj (+ to V) · adj + enough (+ to V)', noi: '[too] đứng trước tính từ, [enough] đứng sau tính từ' },
    vd: [
      { en: 'The box is {too heavy} to lift.', vi: 'Cái hộp nặng quá, không nâng nổi.', noi: '[too] đứng trước [heavy].' },
      { en: 'The room is {big enough} for 50 people.', vi: 'Căn phòng đủ rộng cho 50 người.', noi: '[enough] đứng sau [big].' },
    ],
    bt: [
      { cau: 'The meeting room is not ___ for the whole team.', chon: ['large enough', 'enough large', 'too large', 'largely'], dap: 0, vi_sao: '[enough] đứng sau tính từ.' },
      { cau: 'The price was ___ high for most customers.', chon: ['too', 'enough', 'so much', 'very much'], dap: 0, vi_sao: 'giá quá cao, [too] đứng trước tính từ.' },
    ],
  },
  {
    id: 'np-in-order-to-so-that', ten: '[In order to] và [so that]', nhom: CT,
    y: ['{[in order to] cộng động từ}: {để} làm gì.', '{[so that] cộng mệnh đề}: cũng là {để}, thường có [can] hoặc [will].'],
    ct: { hien: 'in order to + V · so that + S + can + V', noi: '[in order to] cộng động từ, [so that] cộng chủ ngữ và [can]' },
    vd: [
      { en: 'We hired more staff {in order to} reduce waiting time.', vi: 'Chúng tôi tuyển thêm người để giảm thời gian chờ.', noi: 'Sau [in order to] là động từ [reduce].' },
      { en: 'Speak clearly {so that} everyone can hear you.', vi: 'Hãy nói rõ để mọi người đều nghe được.', noi: 'Sau [so that] là mệnh đề.' },
    ],
    bt: [
      { cau: 'Please arrive early in order to ___ a good seat.', chon: ['get', 'getting', 'got', 'gets'], dap: 0, vi_sao: 'sau [in order to] là động từ nguyên mẫu.' },
      { cau: 'The manual was rewritten ___ customers can understand it easily.', chon: ['so that', 'in order to', 'because of', 'despite'], dap: 0, vi_sao: 'theo sau là mệnh đề có [can], dùng [so that].' },
    ],
  },
];
