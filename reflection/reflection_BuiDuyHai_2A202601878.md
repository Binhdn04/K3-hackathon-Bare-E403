# Reflection cá nhân — Bùi Duy Hải

## Vai trò
Trong project, mình đảm nhận vị trí Data & Testing. Mình phụ trách check data trực tiếp từ file chatlog thực tế, tạo dựng bộ dữ liệu kiểm thử (Golden Set) và chuẩn bị kịch bản để chạy Demo sản phẩm ở chặng cuối.

## Phần mình đã làm
- **Check data chatlog:** Mình đào sâu vào file `chat_history_anonymized_for_hackathon.csv` để đọc cách sinh viên thực sự nhắn tin. Mình lọc ra các pattern lỗi phổ biến như: viết sai chính tả, câu hỏi cụt lủn thiếu bối cảnh, hoặc các câu hỏi không liên quan đến bài học.
- **Tạo data test (Golden Set):** Dựa vào data từ chatlog, mình xây dựng bộ 25 câu test bao gồm 4 kiểu tình huống khó. Thay vì tự nghĩ ra các câu hỏi quá "sạch đẹp", mình nhúng trực tiếp các câu văn lộn xộn từ thực tế vào bộ test để đo lường độ chịu đựng của AI.
- **Demo:** Chuẩn bị kịch bản thuyết trình thực chiến, chọn lọc 1 case "Happy Path" để thể hiện tính năng cốt lõi (format cấu trúc chuẩn) và 1 case rủi ro lấy từ chatlog để biểu diễn khả năng từ chối khéo léo của AI.

## AI đã hỗ trợ thế nào
File chatlog có hàng ngàn dòng, mình đã dùng công cụ AI (như trình thông dịch Python) để nhanh chóng lọc ra các tin nhắn của sinh viên (student role) và bóc tách những câu không dùng format chuẩn. Đồng thời, mình dùng AI (đóng vai Red Team) để từ 1 câu hỏi gốc sinh ra nhiều biến thể sai chính tả, mơ hồ nhằm làm phong phú bộ Golden Set.

Dù vậy, AI không thể tự đánh giá được liệu câu trả lời của hệ thống có giữ đúng 100% ý nghĩa học thuật gốc hay không. Phần đo lường (Eval) và đối chiếu kết quả đầu ra với Quality Bar vẫn do mình kiểm tra thủ công.

## Bài học từ case fail của chính nhóm
Lúc đầu, mình tự nghĩ ra toàn bộ bộ câu test. Các câu hỏi đều đúng ngữ pháp, rõ ràng chủ ngữ vị ngữ. Kết quả test lượt 1 rất cao. Nhưng khi mình bắt đầu ghép các câu thật từ chatlog (ví dụ: "giải thích slide ư3", "tóm tắt. chi. tiết.") vào hệ thống, model lập tức vỡ trận: có lúc AI từ chối format, có lúc tự đoán bừa nội dung sai lệch hoàn toàn.

Case fail này dạy cho mình một bài học sâu sắc đúng như hướng dẫn của Trợ giảng: "Câu thử tự nghĩ thường quá sạch, đo ra điểm cao nhưng gặp user thật là gãy". Việc đưa dữ liệu thô (raw data) vào kiểm thử ngay từ sớm là bắt buộc. Sau vố đó, mình đã ép nhóm phải tinh chỉnh lại prompt để xử lý được các văn bản lộn xộn, và lấy chính các case fail đó làm điểm nhấn cho bài Demo.