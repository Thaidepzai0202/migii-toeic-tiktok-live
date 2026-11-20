// KỊCH BẢN LỜI DẪN của Ninja trên live Migii TOEIC (giọng đọc; không hiện chữ lên màn).
//
// Mỗi mục là một danh sách câu. Game đọc hết danh sách theo thứ tự xáo ngẫu nhiên rồi mới quay lại câu cũ,
// nên mục nào nghe lặp thì thêm câu vào mục đó. Sửa lời ngay trong file này, không cần đụng index.html.
//
// Chỗ game tự điền: {ten} tên người chơi · {ds} vài tên nối bằng "và" · {n} con số · {d} số điểm · {qua} tên quà
//   {k} số người · {khung} tên khung chơi · {x} đáp án · {m} nghĩa tiếng Việt · {app} tên app · {toeic} chữ TOEIC
//   {chu_de} tên chủ đề của bảng Hái từ
//   ({app}, {toeic} viết theo cách đọc, đặt ở SAY_APP / SAY_TOEIC trong index.html.)
//
// Luật nội dung (CLAUDE.md, thuong-hieu.md): nói về điểm thi thì dùng "ước tính"; phần luyện miễn phí là Part 1, 2, 5;
//   không nói app được ETS xác nhận; không hứa kết quả; không gọi tên người chơi ảo.
window.KB = {
  // ---------- 1. Vào khung chơi (màn nghỉ giữa hai lượt) ----------
  // Lần đầu một khung xuất hiện (và cứ 5 lần một lần) Ninja đọc đủ luật — lời đủ nằm ở SEG_INTRO trong index.html.
  // Các lần còn lại: một câu "sang_khung" + một câu luật gọn của khung đó.
  sang_khung: [
    'Đến giờ {khung}!',
    'Tiếp theo là {khung}!',
    'Mình sang {khung} nào cả nhà!',
    'Lượt mới: {khung}!',
    '{khung} quay lại rồi đây!',
    'Chuẩn bị nhé, {khung} sắp bắt đầu!',
    'Ai sẵn sàng cho {khung} chưa?',
    'Giờ mình chơi {khung} nha!',
  ],
  // ten: tên khung khi đọc · gon: luật gọn · chao: câu chỉ cách chơi cho người mới vào · moi: câu mời khi lâu không ai trả lời
  khung: {
    word: {
      ten: 'Word',
      gon: ['Gõ A, B, C hoặc D, ai nhanh nhất thì phi cơ tăng tốc nhiều nhất!', 'Chọn nghĩa, chọn từ, đồng nghĩa, trái nghĩa. Gõ chữ cái đáp án nha!', 'Thấy đáp án là gõ A, B, C hay D liền nhé!', 'Trả lời đúng để phi cơ của bạn tăng tốc nha!', 'Sai là hỏng động cơ đó, cẩn thận nhé! Câu cuối là chặng về đích!'],
      chao: ['Gõ A, B, C hoặc D vào bình luận để chơi cùng nha!', 'Vào chơi luôn nè, gõ chữ cái đáp án nhé!'],
      moi: ['Mọi người đang xem ơi, gõ A, B, C hoặc D vào bình luận để chơi cùng nha!', 'Ai đang xem thì thử một câu đi nào, chỉ cần gõ một chữ cái thôi!'],
    },
    scramble: {
      ten: 'ghép chữ',
      gon: ['Ghép các chữ cái lại rồi gõ từ tiếng Anh nhé!', 'Chữ bị xáo hết rồi, ai xếp lại được nào?', 'Gõ sai thì gõ lại được, cứ thử nha!'],
      chao: ['Ghép chữ trên màn hình rồi gõ từ tiếng Anh để chơi cùng nha!', 'Vào chơi luôn nè, gõ từ bạn ghép được nhé!'],
      moi: ['Mọi người đang xem ơi, ghép chữ lại rồi gõ từ tiếng Anh vào bình luận nhé!', 'Ai ghép được từ này không? Gõ thử đi nào!'],
    },
    emoji: {
      ten: 'đoán emoji',
      gon: ['Nhìn emoji, đoán từ tiếng Anh rồi gõ vào bình luận nhé!', 'Mỗi câu vài emoji, ghép nghĩa lại là ra từ tiếng Anh!', 'Chữ cái gợi ý sẽ mở dần, gõ sai thì gõ lại được nha!'],
      chao: ['Nhìn emoji trên màn hình rồi gõ từ tiếng Anh để chơi cùng nha!', 'Vào chơi luôn nè, đoán được từ nào gõ từ đó nhé!'],
      moi: ['Mọi người đang xem ơi, mấy emoji này là từ tiếng Anh nào? Gõ thử vào bình luận nhé!', 'Ai đoán ra chưa? Gõ từ tiếng Anh vào bình luận nha!'],
    },
    irrfill: {
      ten: 'chia động từ bất quy tắc',
      gon: ['Bảng ba cột đang khuyết một ô, gõ từ còn thiếu vào bình luận nhé!', 'Nguyên mẫu, quá khứ, phân từ hai: ô nào trống thì gõ từ đó nha!', 'Chữ cái gợi ý sẽ mở dần, gõ sai thì gõ lại được nha!'],
      chao: ['Nhìn ô đang trống trên bảng rồi gõ từ còn thiếu để chơi cùng nha!', 'Vào chơi luôn nè, gõ dạng động từ còn thiếu nhé!'],
      moi: ['Mọi người đang xem ơi, ô trống này là từ gì? Gõ thử vào bình luận nhé!', 'Ai còn nhớ bảng động từ bất quy tắc không? Gõ từ còn thiếu nha!'],
    },
    haitu: {
      ten: 'Hái từ',
      gon: ['Nhìn hình, gõ tên tiếng Anh để hái từ nhé!', 'Mỗi từ ai gõ đúng trước thì được hai điểm, hái nhiều nhất thêm năm điểm!', 'Mười sáu từ đang chờ, ai nhanh tay thì hái được nhiều!'],
      chao: ['Thấy hình nào biết tên tiếng Anh thì gõ vào bình luận để hái nha!', 'Vào hái từ luôn nè, gõ tên tiếng Anh của hình nhé!'],
      moi: ['Mọi người đang xem ơi, hình nào bạn biết tên tiếng Anh? Gõ thử vào bình luận nhé!', 'Còn nhiều từ chưa ai hái kìa, gõ tên tiếng Anh là hái được liền!'],
    },
    bricky: {
      ten: 'Bricky',
      gon: ['Ghép các chữ cái thành từ tiếng Anh rồi gõ vào bình luận nhé!', 'Mỗi từ đúng một điểm, ai điền đủ bảng đầu tiên thêm mười điểm!', 'Từ ngoài bảng mà đúng vẫn được điểm nha!'],
      chao: ['Ghép chữ trên màn hình thành từ tiếng Anh rồi gõ vào bình luận để chơi cùng nha!', 'Vào chơi luôn nè, ghép được từ nào gõ từ đó nhé!'],
      moi: ['Mọi người đang xem ơi, mấy chữ cái này ghép được từ gì? Gõ thử vào bình luận nhé!', 'Ai ghép được từ nào chưa? Từ ba chữ cái là có điểm rồi!'],
    },
    oneletter: {
      ten: 'thêm bớt một chữ',
      gon: ['Thêm hoặc bớt đúng một chữ cái để thành từ có nghĩa, rồi gõ cả từ nhé!', 'Lệnh thêm thì thêm một chữ, lệnh bớt thì bớt một chữ nha!', 'Gõ sai thì gõ lại được, ba câu cuối là chặng về đích, điểm nhân đôi!'],
      chao: ['Nhìn chữ trên màn hình, thêm hoặc bớt một chữ cái rồi gõ cả từ để chơi cùng nha!', 'Vào chơi luôn nè, sửa chữ viết sai rồi gõ từ đúng nhé!'],
      moi: ['Mọi người đang xem ơi, chữ này thêm hay bớt một chữ là thành từ gì? Gõ thử vào bình luận nhé!', 'Ai sửa được chữ này chưa? Gõ cả từ đúng vào bình luận nha!'],
    },
    irrfind: {
      ten: 'tìm động từ bất quy tắc',
      gon: ['Bốn động từ, chỉ một từ bất quy tắc. Gõ A, B, C hoặc D nhé!', 'Từ nào quá khứ không thêm đuôi e đê? Gõ chữ cái đáp án nha!', 'Thấy từ bất quy tắc là gõ A, B, C hay D liền nhé!'],
      chao: ['Gõ A, B, C hoặc D vào bình luận để chơi cùng nha!', 'Vào chơi luôn nè, chọn động từ bất quy tắc nhé!'],
      moi: ['Mọi người đang xem ơi, từ nào là động từ bất quy tắc? Gõ A, B, C hoặc D nhé!', 'Ai đang xem thì thử một câu đi nào, chỉ cần gõ một chữ cái thôi!'],
    },
    startend: {
      ten: 'Start or End',
      gon: ['Gõ năm từ tiếng Anh bắt đầu hoặc kết thúc bằng chữ trên màn hình!', 'Năm từ trong một bình luận, cách nhau bằng dấu cách nhé!', 'Nghĩ nhanh năm từ, ai gõ trước được nhiều điểm hơn!'],
      chao: ['Gõ năm từ tiếng Anh vào bình luận để chơi cùng nha!', 'Vào chơi luôn nè, năm từ trong một bình luận nhé!'],
      moi: ['Ai đang xem thì thử sức đi nào, gõ năm từ tiếng Anh vào bình luận nhé!', 'Mọi người đang xem ơi, nghĩ được từ nào cứ gõ vào nha!'],
    },
    listenmean: {
      ten: 'nghe và chọn nghĩa',
      gon: ['Ninja đọc một lần thôi, nghe kỹ rồi chọn nghĩa nha!', 'Chữ cái hiện dần, ai nghe ra trước thì chọn nghĩa liền!', 'Nghe xong gõ A, B, C hoặc D nhé!'],
      chao: ['Nghe từ tiếng Anh rồi gõ A, B, C hoặc D để chơi cùng nha!', 'Vào chơi luôn nè, nghe rồi chọn nghĩa nhé!'],
      moi: ['Mọi người đang xem ơi, nghe rồi gõ A, B, C hoặc D vào bình luận nha!', 'Ai nghe ra từ này không? Chọn nghĩa đi nào!'],
    },
    hunt: {
      ten: 'săn từ',
      gon: ['Tìm từ giấu trong ma trận, đủ năm từ trước là ăn điểm cao nhất!', 'Thấy từ nào gõ từ đó vào bình luận nhé!', 'Mười từ đang nấp trong ma trận, ai tinh mắt nào?'],
      chao: ['Gõ các từ bạn tìm được trong ma trận để chơi cùng nha!', 'Vào chơi luôn nè, thấy từ nào gõ từ đó nhé!'],
      moi: ['Mọi người đang xem ơi, tìm từ trong ma trận rồi gõ vào bình luận nhé!', 'Ai thấy từ nào chưa? Gõ vào để ghi điểm nha!'],
    },
    chain: {
      ten: 'Thế chữ',
      gon: ['Đổi một chữ cái để ra từ mới, ai nhanh tay thì giữ từ!', 'Mười hai giây không ai thế được thì người giữ từ thắng, cộng mười điểm!', 'Chuỗi đủ bốn mươi từ thì người vừa thế được thắng luôn!', 'Ván cuối tăng tốc với từ năm chữ cái, đổi được tới hai chữ!'],
      chao: ['Đổi một chữ cái của từ trên màn hình rồi gõ từ mới để chơi cùng nha!', 'Vào chơi luôn nè, đổi một chữ cái ra từ mới là giữ từ nhé!'],
      moi: ['Mọi người đang xem ơi, đổi một chữ cái của từ trên màn hình rồi gõ từ mới nhé!', 'Ai thế được chữ nào không? Gõ từ mới vào bình luận nha!'],
    },
    fillin: {
      ten: 'điền từ',
      gon: ['Chọn từ điền vào chỗ trống, gõ A, B, C hoặc D!', 'Sau mỗi câu Ninja giải thích vì sao đúng nha!', 'Đọc cả câu rồi chọn từ hợp nhất nhé!'],
      chao: ['Gõ A, B, C hoặc D vào bình luận để chơi cùng nha!', 'Vào chơi luôn nè, chọn từ điền vào chỗ trống nhé!'],
      moi: ['Mọi người đang xem ơi, gõ A, B, C hoặc D vào bình luận để chơi cùng nha!', 'Chỗ trống này điền từ gì? Ai thử nào!'],
    },
    errhunt: {
      ten: 'săn lỗi',
      gon: ['Mỗi câu sai một từ. Gõ từ sai, dấu gạch, rồi từ đúng nhé!', 'Tìm từ viết sai rồi sửa lại giúp Ninja nha!', 'Soi kỹ từng từ, ai sửa trước được nhiều điểm hơn!'],
      chao: ['Gõ từ sai, dấu gạch, rồi từ đúng để chơi cùng nha!', 'Vào chơi luôn nè, tìm từ sai trong câu rồi sửa lại nhé!'],
      moi: ['Mọi người đang xem ơi, tìm từ sai trong câu rồi gõ từ sai gạch từ đúng nhé!', 'Ai thấy lỗi chưa? Gõ vào bình luận nha!'],
    },
    crossword: {
      ten: 'giải ô chữ',
      gon: ['Gõ chữ thường để giải từng hàng, gõ chữ hoa để đoán từ khoá!', 'Giải hơn nửa số hàng là được đoán từ khoá, thưởng năm mươi điểm!', 'Đọc gợi ý rồi gõ từ tiếng Anh vào bình luận nhé!'],
      chao: ['Gõ từ tiếng Anh theo gợi ý để giải ô chữ cùng nha!', 'Vào chơi luôn nè, giải được hàng nào gõ hàng đó nhé!'],
      moi: ['Mọi người đang xem ơi, gõ từ tiếng Anh theo nghĩa để điền ô chữ nhé!', 'Hàng này ai giải được không? Gõ thử đi nào!'],
    },
    speedread: {
      ten: 'đọc nhanh',
      gon: ['Đọc bài ngắn, tìm chi tiết rồi gõ A, B, C hoặc D!', 'Đọc lướt thôi nha, đáp án nằm ngay trong bài!', 'Ai tìm đúng nhanh nhất được mười điểm!'],
      chao: ['Đọc nhanh văn bản rồi gõ A, B, C hoặc D để ghi điểm nha!', 'Vào chơi luôn nè, đáp án nằm ngay trong bài nhé!'],
      moi: ['Mọi người đang xem ơi, đọc văn bản trên màn hình rồi gõ A, B, C hoặc D nhé!', 'Ai tìm ra chi tiết này chưa? Chọn đáp án đi nào!'],
    },
    dictate: {
      ten: 'nghe chép',
      gon: ['Nghe câu tiếng Anh rồi gõ lại cả câu, chữ cái sẽ hiện dần!', 'Nghe được chữ nào gõ chữ đó, đúng cả câu là ghi điểm!', 'Câu sẽ phát lại vài lần, cứ bình tĩnh nghe nhé!'],
      chao: ['Nghe câu tiếng Anh rồi gõ lại cả câu để ghi điểm nha!', 'Vào chơi luôn nè, nghe rồi chép lại cả câu nhé!'],
      moi: ['Mọi người đang xem ơi, nghe câu tiếng Anh rồi gõ lại cả câu vào bình luận nhé!', 'Ai nghe ra câu này chưa? Gõ thử đi nào!'],
    },
    // Các khung chưa nằm trong chương trình của kênh nào: chỉ cần tên và luật gọn.
    class: { ten: 'học từ mới', gon: ['Nghe Ninja dạy từ mới, lát nữa kiểm tra nhé!', 'Học xong là Ninja gọi tên từng bạn đó!'] },
    quiz: { ten: 'đố nhanh', gon: ['Gõ số một đến bốn, càng nhanh càng nhiều điểm!', 'Thấy đáp án là gõ số liền nha!'] },
    reverse: { ten: 'chọn từ tiếng Anh', gon: ['Ninja đọc nghĩa tiếng Việt, mọi người gõ số chọn từ nha!', 'Nghe nghĩa, chọn đúng từ tiếng Anh nhé!'] },
    listen: { ten: 'luyện tai', gon: ['Không hiện chữ đâu, nghe kỹ rồi chọn nghĩa nhé!', 'Chỉ nghe thôi nha, gõ số chọn nghĩa đúng!'] },
    team: { ten: 'so găng hai đội', gon: ['Gõ tên đội để chọn phe, trả lời đúng để kéo điểm cho đội!', 'Chọn phe đi nào, đội nào thắng đây?'] },
    type: { ten: 'nghe và gõ chính tả', gon: ['Nghe Ninja đọc rồi gõ từ tiếng Anh vào bình luận nhé!', 'Nhìn nghĩa, nghe đọc, gõ lại cho đúng chính tả nha!'] },
  },
  // Khung không có câu riêng ở trên thì dùng hai mục này.
  chao_cach_choi: ['Gõ số từ một đến bốn vào bình luận để chơi cùng nha!', 'Vào chơi luôn nè, gõ số một, hai, ba hoặc bốn nhé!', 'Trả lời đúng nhanh nhất được mười điểm đó!'],
  moi_choi: ['Mọi người đang xem ơi, gõ số một đến bốn vào bình luận để chơi cùng nha!', 'Ai đang xem thì thử sức đi nào, chỉ cần gõ một con số thôi!'],

  // ---------- 2. Trong lượt chơi ----------
  cau_dau: ['Lượt {n} bắt đầu!', 'Vào lượt {n} nào!', 'Lượt {n}, câu đầu tiên!', 'Bắt đầu lượt {n} nhé!'],
  cau_cuoi: ['Câu cuối cùng rồi!', 'Câu chót của lượt này!', 'Còn đúng một câu nữa thôi!', 'Câu cuối, cơ hội lật kèo đây!'],
  // Câu nhắc cách gõ: chỉ đọc ở câu 1, câu 2 và mỗi ba câu một lần (màn hình luôn có hướng dẫn).
  nhac_abcd: ['Gõ A, B, C hoặc D!', 'Chọn A, B, C hay D nhé!', 'Gõ chữ cái đáp án vào bình luận nha!', 'A, B, C hay D đây?'],
  nhac_errhunt: ['Gõ từ sai, dấu gạch, rồi từ đúng!', 'Nhớ gõ từ sai trước, từ đúng sau nha!'],
  nhac_hunt: ['Gõ từ bạn thấy vào bình luận nhé!', 'Thấy từ nào gõ từ đó nha!'],
  nhac_startend: ['Gõ cả năm từ trong một bình luận nhé!', 'Năm từ, cách nhau bằng dấu cách nha!'],
  // Lời vào câu hỏi theo từng kiểu câu.
  hoi_w2m: ['Câu tiếp theo nè!', 'Từ này nghĩa là gì?', 'Nghe nè!', 'Ai biết nghĩa từ này?', 'Từ này quen không cả nhà?', 'Từ tiếp theo đây!'],
  hoi_m2w: ['Tiếng Anh là từ nào?', 'Từ nào mang nghĩa này?', 'Ai chọn được từ đúng nào?', 'Nghĩa này là từ nào nhỉ?', 'Chọn từ tiếng Anh đúng nha!'],
  hoi_fill: ['Điền từ còn thiếu nào!', 'Từ nào điền vào chỗ trống đây?', 'Chỗ trống này cần từ gì?', 'Chọn từ hợp nhất với câu nha!', 'Câu này thiếu từ nào nhỉ?'],
  hoi_read: ['Đọc nhanh nào! Tìm chi tiết trong bài nhé!', 'Đọc lướt, tìm đúng chỗ rồi chọn nha!', 'Ai tìm ra trước nào?', 'Đáp án nằm trong bài đó, tìm nhé!', 'Bài mới đây, đọc nhanh nào!'],
  hoi_errhunt: ['Tìm từ sai trong câu nhé!', 'Câu này sai ở đâu nhỉ?', 'Từ nào viết sai đây?', 'Soi kỹ từng từ nào!', 'Lỗi nằm ở đâu ta?'],
  hoi_hunt: ['Săn từ nào! Ma trận có mười từ giấu, tìm đủ năm từ trước để ăn điểm!', 'Ai tìm được từ nào? Đọc xuôi hay ngược đều được!', 'Mắt tinh lên nào, từ nấp khắp ma trận đó!', 'Dò từng hàng, từng cột xem nào!'],
  hoi_startend: ['Tìm năm từ tiếng Anh, bắt đầu hoặc kết thúc bằng chữ trên màn hình!', 'Ai tìm được năm từ nào?', 'Năm từ, bắt đầu hoặc kết thúc bằng chữ này nhé!', 'Nghĩ nhanh năm từ nào!'],
  hoi_chain: ['Đổi một chữ cái để giành từ nhé!', 'Ai thế được chữ nào trước?', 'Đổi một chữ thôi, ra từ mới là giữ từ!', 'Nhanh tay đổi chữ nào!'],
  // Thế chữ, ván cuối tăng tốc (từ 5 chữ, được đổi 1 hoặc 2 chữ)
  tang_toc: ['Ván cuối, tăng tốc! Từ năm chữ cái, mọi người được đổi một hoặc hai chữ nhé!', 'Tăng tốc nào cả nhà! Ván này từ năm chữ, đổi được tới hai chữ cái!', 'Ván quyết định đây! Từ năm chữ cái, đổi một hoặc hai chữ để giành từ!'],
  // Thế chữ: {ten} tặng quà đổi sang từ mới và thành người giữ từ · hệ thống tự ra từ mới khi chuỗi đã dài
  chain_qua_doi_tu: ['{ten} đổi sang từ mới và đang giữ từ!', 'Từ mới của {ten} đây, ai thế được nào?', '{ten} vừa ra từ mới, mọi người thế thử xem!'],
  chain_tu_moi: ['Chuỗi dài quá rồi, Ninja đổi từ mới nhé!', 'Đổi gió chút nào, từ mới đây!', 'Chuỗi này dài ghê! Ninja ra từ mới nha!'],
  nhac_emoji: ['Gõ từ tiếng Anh vào bình luận nhé!', 'Đoán ra thì gõ liền nha!'],
  hoi_emoji: ['Mấy emoji này là từ gì?', 'Đoán xem đây là từ tiếng Anh nào!', 'Nhìn emoji, đoán từ nào!', 'Ai đoán ra trước nào?', 'Ghép nghĩa các emoji lại xem!', 'Từ nào đây cả nhà?', 'Emoji này nói gì nhỉ?'],
  dap_an_emoji: ['Đáp án là', 'Đáp án đúng là', 'Chính là'],
  nhac_haitu: ['Gõ tên tiếng Anh của hình nhé!', 'Biết từ nào gõ từ đó nha!'],
  // Hái từ: {chu_de} = tên chủ đề của bảng (Trường học, Động vật hoang dã…)
  hoi_haitu: ['Chủ đề {chu_de}! Hái từ nào cả nhà!', 'Bảng mới, chủ đề {chu_de}. Ai hái được nhiều nhất nào?', 'Chủ đề {chu_de} nè, hình nào bạn biết tên tiếng Anh?', 'Nhanh tay hái từ nào, chủ đề {chu_de}!'],
  het_gio_haitu: ['Hết giờ! Cùng học các từ chưa ai hái nhé!', 'Hết giờ rồi! Học nhanh mấy từ mới nào!', 'Hết giờ! Nhìn thẻ, nghe Ninja đọc và nhớ từ mới nha!'],
  // Hái từ: {ten} là người thật hái nhiều nhất bảng ({n} từ), được thưởng năm điểm
  haitu_top: ['{ten} hái nhiều nhất, {n} từ, thưởng năm điểm!', 'Vua hái từ bảng này là {ten} với {n} từ! Cộng năm điểm!', '{ten} hái được {n} từ, nhiều nhất bảng! Thêm năm điểm nhé!'],
  nhac_bricky: ['Ghép được từ nào gõ từ đó nhé!', 'Từ ba chữ cái trở lên nha!'],
  hoi_bricky: ['Mấy chữ này ghép được những từ gì?', 'Ghép chữ thành từ nào!', 'Ai điền đủ bảng trước nào?', 'Bảng mới đây, ghép từ nào cả nhà!', 'Tìm càng nhiều từ càng nhiều điểm nhé!'],
  het_gio_bricky: ['Hết giờ! Từ dài nhất là', 'Hết giờ rồi! Từ dùng hết các chữ cái là'],
  // Bricky: {ten} là người thật đầu tiên tự gõ đủ mọi từ trên bảng (bảng vẫn chạy tới hết giờ)
  bricky_du: ['{ten} điền đủ bảng đầu tiên, cộng mười điểm!', 'Wow, {ten} điền đủ cả bảng rồi! Thưởng mười điểm!', '{ten} xong bảng đầu tiên! Mọi người vẫn ghi điểm tiếp được nha!'],
  // Bricky, bảng cuối của lượt (về đích): 6 chữ cái, nhiều từ hơn, thời gian dài hơn, mọi điểm nhân đôi
  bricky_cuoi: ['Bảng cuối! Sáu chữ cái, nhiều từ hơn, và mọi điểm nhân đôi!', 'Bảng cuối đây cả nhà! Khó hơn nhưng điểm nhân đôi, cơ hội lật kèo nhé!', 'Bảng quyết định! Sáu chữ cái, mỗi từ hai điểm, điền đủ bảng thưởng hai mươi điểm!'],
  bricky_du_cuoi: ['{ten} điền đủ bảng cuối đầu tiên, cộng hai mươi điểm!', 'Wow, {ten} điền đủ cả bảng cuối rồi! Thưởng hai mươi điểm!'],
  // Thêm bớt 1 chữ: hỏi theo lệnh trên màn (sau câu hỏi Ninja đọc "Nghĩa là …"), mot_chu_do = mở chặng về đích, mot_chu_nham = công bố cặp từ dễ nhầm ("Đáp án là X. Đừng nhầm với Y là …")
  hoi_mot_chu_them: ['Thêm một chữ cái để thành từ đúng!', 'Chữ này đang thiếu một chữ cái!', 'Thiếu một chữ, ai thêm được nào?', 'Thêm một chữ là ra từ gì đây?', 'Chữ nào bị mất nhỉ?'],
  hoi_mot_chu_bot: ['Bớt một chữ cái để thành từ đúng!', 'Chữ này đang thừa một chữ cái!', 'Thừa một chữ, ai bớt được nào?', 'Bớt một chữ là ra từ gì đây?', 'Chữ nào bị thừa nhỉ?'],
  nhac_mot_chu: ['Gõ cả từ đúng vào bình luận nhé!', 'Sai thì gõ lại được nha!'],
  // chặng về đích dùng chung cho các khung chưa có cách riêng (server.js markFinish): {x} = "câu cuối" / "bảng cuối" / "hàng cuối" / "vòng từ khoá"
  ve_dich: ['Về đích rồi cả nhà! {x}, mọi điểm nhân đôi nhé!', 'Chặng về đích! {x} này điểm nhân đôi, cơ hội lật kèo đây!', 'Vào chặng về đích! {x}, ai đúng là được điểm gấp đôi!'],
  mot_chu_do: ['Về đích! Ba câu cuối toàn từ rất dễ nhầm, điểm nhân đôi nhé!', 'Vào chặng về đích rồi cả nhà! Từ dễ nhầm lắm đó, mỗi câu điểm nhân đôi!', 'Chặng về đích đây! Cẩn thận kẻo nhầm, đúng là được điểm gấp đôi!'],
  mot_chu_nham: ['Đừng nhầm với', 'Còn chữ trên màn', 'Khác với'],
  nhac_irrfill: ['Gõ từ còn thiếu vào bình luận nhé!', 'Nhớ ra thì gõ liền nha!'],
  hoi_irrfill: ['Ô trống này là từ gì?', 'Điền từ còn thiếu nào!', 'Dạng nào còn thiếu đây?', 'Ai nhớ bảng động từ nào?', 'Từ nào điền vào ô trống nhỉ?', 'Chia động từ này thế nào?'],
  hoi_irrfind: ['Từ nào là động từ bất quy tắc?', 'Tìm động từ bất quy tắc nào!', 'Từ nào quá khứ không thêm đuôi e đê?', 'Bốn từ này, từ nào bất quy tắc?', 'Ai tìm ra từ bất quy tắc trước nào?'],
  hoi_scramble_nghia: ['{m}.', 'Từ có nghĩa là {m}.', 'Gợi ý: {m}.'],
  hoi_scramble: ['Ghép lại rồi gõ từ nào!', 'Ai ghép được không? Gõ từ tiếng Anh nhé!', 'Xếp thẻ cho đúng nha!', 'Chữ nào đứng trước nhỉ?', 'Ghép nhanh nào cả nhà!'],
  // Người thật trả lời đúng đầu tiên trong câu.
  dung_dau: [
    'Chính xác! {ten} trả lời đúng đầu tiên!',
    'Wow, {ten} nhanh quá!',
    '{ten} đã có đáp án đúng! Còn ai nữa không nào?',
    '{ten} mở điểm rồi!',
    'Nhanh như chớp, {ten} ơi!',
    '{ten} đúng rồi, ai theo kịp không?',
    'Có người đúng rồi, là {ten}!',
    '{ten} gõ nhanh ghê!',
  ],

  // ---------- 3. Công bố đáp án ----------
  dap_an: ['Đáp án là {x}', 'Đáp án đúng là {x}', 'Chính là {x}', 'Câu này chọn {x}'],
  het_gio_hunt: ['Hết giờ! Đây là các từ giấu trong ma trận.', 'Hết giờ rồi! Cùng xem các từ nấp ở đâu nhé.', 'Dừng tay nào! Đáp án hiện trên ma trận đây.'],
  het_gio_startend: ['Hết giờ! Ví dụ đáp án nè.', 'Hết giờ rồi! Vài từ gợi ý nhé.', 'Dừng tay nào! Ninja đọc vài đáp án nha.'],
  chain_thang: ['{ten} thắng ván! Cộng mười điểm!', '{ten} giữ được từ đến cùng, cộng mười điểm!', 'Ván này thuộc về {ten}! Cộng mười điểm!'],
  chain_thang_x2: ['{ten} thắng ván, điểm nhân đôi! Cộng hai mươi điểm!', '{ten} giữ được từ đến cùng, nhân đôi thành hai mươi điểm!', 'Ván này thuộc về {ten}! Nhân đôi, cộng hai mươi điểm!'],
  chain_hoa: ['Ván này chưa ai thế được từ!', 'Chưa ai đổi được chữ nào, ván sau nhé!'],
  // Gọi tên người thật sau mỗi câu.
  khen: ['Chúc mừng {ds}!', 'Giỏi lắm {ds}!', '{ds} đúng rồi nha!', 'Điểm về tay {ds}!', 'Chuẩn luôn {ds}!', 'Hay quá {ds}!'],
  khen_dong: ['{n} bạn đã đúng, chúc mừng {ds}!', '{n} bạn trả lời đúng, trong đó có {ds}!', 'Tới {n} bạn đúng luôn, giỏi lắm {ds}!'],
  nhanh_nhat: ['{ten} nhanh nhất!', 'Nhanh nhất câu này là {ten}!', '{ten} gõ nhanh nhất câu này!'],
  tiec: ['Tiếc quá {ds}, câu sau cố lên nhé!', '{ds} suýt đúng rồi, câu sau nha!', 'Không sao nha {ds}, câu sau gỡ lại!', '{ds} ơi, nhớ từ này nhé!'],
  chuoi: ['Quá đỉnh! {ten} đã đúng {n} câu liên tiếp!', '{ten} đúng liền {n} câu, ghê thật!', '{n} câu liên tiếp rồi {ten} ơi!', 'Chuỗi {n} câu đúng của {ten}, ai cản được đây?'],
  // Nhiều người cùng đạt chuỗi trong một câu: đọc một câu chung ({k} = số người)
  chuoi_nhieu: ['{ds} cùng đúng {n} câu liên tiếp!', 'Tới {k} bạn đúng liền {n} câu, có {ds}!', '{ds} đều đang có chuỗi {n} câu đúng!'],
  dan_dau: ['{ten} đã vươn lên dẫn đầu với {d} điểm!', '{ten} vượt lên dẫn đầu, {d} điểm!', 'Ngôi đầu đổi chủ! {ten} đang có {d} điểm!', 'Dẫn đầu bây giờ là {ten} với {d} điểm!'],

  // ---------- 4. Vinh danh cuối lượt ----------
  vo_dich: [
    'Xin chúc mừng! {ten} vô địch lượt {n} với {d} điểm!',
    'Quán quân lượt {n} là {ten}, {d} điểm!',
    '{ten} về nhất lượt {n} với {d} điểm, quá giỏi!',
    'Lượt {n} gọi tên {ten}! {d} điểm!',
    'Vỗ tay cho {ten} nào! {d} điểm, đứng đầu lượt {n}!',
  ],
  buc_trong: ['Bục vinh danh đang chờ bạn đấy!', 'Lượt này chưa ai lên bục, lượt sau là của bạn!', 'Bục còn trống, ai lên trước nào?'],
  luot_sau: [
    'Lượt mới sắp bắt đầu rồi, chuẩn bị tinh thần nào!',
    'Nghỉ một chút rồi chơi tiếp nha!',
    'Ở lại chơi lượt sau nhé cả nhà!',
    'Lượt sau sắp tới rồi, đừng đi đâu nha!',
    'Ai chưa lên bục thì lượt sau phục thù nhé!',
  ],
  // Lời mời tải app: mỗi lần vinh danh đọc một câu.
  quang_cao: [
    'Muốn ôn lại các từ vừa chơi? Tải app {app}, luyện thi {toeic} trên điện thoại, có trên App Store và Google Play nhé!',
    'Các từ vừa rồi đều có trong app {app}. Tải về để ôn mỗi ngày nha!',
    'Thích học kiểu này thì tải app {app} nhé, luyện {toeic} ngay trên điện thoại!',
    'Trong app {app}, Part một, Part hai và Part năm được luyện miễn phí đó. Tải về thử nha!',
    'Mỗi ngày vài phút ôn từ với app {app} nhé. Có trên App Store và Google Play!',
    'Chơi xong nhớ tải app {app} để ôn lại từ vựng nha cả nhà!',
  ],

  // ---------- 5. Quà và người mới vào ----------
  qua_nho: [
    'Cảm ơn {ten} đã tặng {qua}!',
    'Cảm ơn {ten} nha, {qua} đẹp quá!',
    '{ten} vừa tặng {qua}, cảm ơn bạn!',
    'Ninja nhận được {qua} từ {ten} rồi, cảm ơn nhé!',
    'Cảm ơn {qua} của {ten}!',
  ],
  qua_to: [
    'Ôi! Cảm ơn {ten} đã tặng {qua}! Cảm ơn bạn rất nhiều!',
    'Trời ơi, {qua}! Cảm ơn {ten} nhiều lắm!',
    '{ten} chơi lớn quá! Cảm ơn {qua} của bạn!',
    'Cả nhà ơi, {ten} vừa tặng {qua}! Cảm ơn bạn rất nhiều!',
  ],
  // Chào người mới (gom 6 giây, tối đa một lần mỗi 20 giây); câu chỉ cách chơi đi kèm cách nhau ít nhất 45 giây.
  chao: ['Chào {ds}!', 'Xin chào {ds}!', 'Chào mừng {ds}!', '{ds} vào rồi kìa, xin chào!', 'Hello {ds}!', 'Chào {ds} nha!'],

  // ---------- 6. Mở đầu và kết thúc phiên ----------
  ket_thuc: [
    'Cảm ơn mọi người đã chơi cùng {app} hôm nay. Hẹn gặp lại các bạn ở phiên sau nhé!',
    'Phiên hôm nay tới đây thôi. Cảm ơn cả nhà đã chơi cùng {app}, hẹn gặp lại nhé!',
    'Cảm ơn cả nhà đã ở lại tới cuối! {app} hẹn mọi người phiên sau nha!',
  ],
};
