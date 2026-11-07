const major = [
['The Fool','Kẻ Khờ','khởi đầu, tự do, niềm tin'],['The Magician','Nhà Ảo Thuật','ý chí, kỹ năng, chủ động'],['The High Priestess','Nữ Tư Tế','trực giác, bí mật, tĩnh lặng'],['The Empress','Hoàng Hậu','nuôi dưỡng, sáng tạo, sung túc'],['The Emperor','Hoàng Đế','cấu trúc, kỷ luật, trách nhiệm'],['The Hierophant','Giáo Hoàng','truyền thống, học hỏi, niềm tin'],['The Lovers','Tình Nhân','lựa chọn, kết nối, hòa hợp'],['The Chariot','Cỗ Xe','quyết tâm, tiến lên, kiểm soát'],['Strength','Sức Mạnh','can đảm, dịu dàng, nội lực'],['The Hermit','Ẩn Sĩ','chiêm nghiệm, tìm đường, trí tuệ'],['Wheel of Fortune','Bánh Xe Số Phận','chu kỳ, bước ngoặt, cơ hội'],['Justice','Công Lý','cân bằng, sự thật, hệ quả'],['The Hanged Man','Người Treo Ngược','buông bỏ, góc nhìn mới, chờ đợi'],['Death','Cái Chết','kết thúc, chuyển hóa, tái sinh'],['Temperance','Tiết Chế','điều độ, chữa lành, hòa hợp'],['The Devil','Ác Quỷ','ràng buộc, cám dỗ, lệ thuộc'],['The Tower','Tòa Tháp','đổ vỡ, thức tỉnh, giải phóng'],['The Star','Ngôi Sao','hy vọng, cảm hứng, hồi phục'],['The Moon','Mặt Trăng','mơ hồ, tiềm thức, trực giác'],['The Sun','Mặt Trời','niềm vui, rõ ràng, thành công'],['Judgement','Phán Xét','thức tỉnh, tiếng gọi, nhìn lại'],['The World','Thế Giới','hoàn tất, thành tựu, trọn vẹn']
];
const suits = [
 {en:'Wands',vi:'Gậy',theme:'đam mê, hành động, sáng tạo',words:['tia lửa','khởi sự','mở rộng','ổn định','thử thách','ghi nhận','kiên định','tin tức','bền bỉ','quá tải','người truyền cảm hứng','người khám phá','người dẫn đường','người làm chủ']},
 {en:'Cups',vi:'Cốc',theme:'cảm xúc, tình yêu, kết nối',words:['cảm xúc mới','lựa chọn','sum vầy','chiêm nghiệm','mất mát','hoài niệm','ảo ảnh','buông tay','ước nguyện','viên mãn','người mơ mộng','người chữa lành','người nuôi dưỡng','người thấu cảm']},
 {en:'Swords',vi:'Kiếm',theme:'tư duy, sự thật, giao tiếp',words:['ý tưởng sáng rõ','phân vân','đau lòng','nghỉ ngơi','xung đột','dịch chuyển','chiến lược','bế tắc','lo âu','kết thúc đau đớn','người quan sát','người phân tích','người quyết đoán','người trí tuệ']},
 {en:'Pentacles',vi:'Tiền',theme:'vật chất, công việc, nền tảng',words:['cơ hội vật chất','lập kế hoạch','hợp tác','ổn định','thiếu hụt','cho và nhận','kiên nhẫn','rèn luyện','tự chủ','di sản','người học việc','người tận tâm','người vun trồng','người thành đạt']}
];
const ranks = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Page','Knight','Queen','King'];
const rankVi = ['Át','Hai','Ba','Bốn','Năm','Sáu','Bảy','Tám','Chín','Mười','Tiểu Đồng','Kỵ Sĩ','Hoàng Hậu','Nhà Vua'];
export const deck = [
 ...major.map((x,i)=>({id:`m${i}`,name:x[0],vi:x[1],arcana:'Major Arcana',keywords:x[2].split(', '),imgName:x[0]})),
 ...suits.flatMap((s,si)=>ranks.map((r,ri)=>({id:`${si}-${ri}`,name:`${r} of ${s.en}`,vi:`${rankVi[ri]} ${s.vi}`,arcana:`${s.en} · ${s.theme}`,keywords:[s.theme,s.words[ri]],imgName:`${r} of ${s.en}`})))
];
export const spreads = {
 1: ['Thông điệp dành cho bạn'],
 3: ['Quá khứ','Hiện tại','Tương lai gần'],
 5: ['Năng lượng hiện tại','Thử thách','Điều bạn chưa thấy','Lời khuyên','Xu hướng sắp tới'],
 7: ['Bạn đang ở đâu','Điều trái tim mong muốn','Điều đang cản trở','Ảnh hưởng bên ngoài','Điều cần buông bỏ','Lời khuyên','Xu hướng tương lai'],
 10: ['Hiện trạng','Thử thách','Gốc rễ vấn đề','Quá khứ gần','Mục tiêu ý thức','Tương lai gần','Thái độ của bạn','Ảnh hưởng môi trường','Hy vọng và nỗi sợ','Kết quả tiềm năng']
};
