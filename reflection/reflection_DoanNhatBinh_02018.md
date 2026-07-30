# Reflection cá nhân — Đoàn Nhật Bình

## Vai trò

Mình là leader của nhóm Bare. Mình phụ trách định hình ý tưởng sản phẩm, chốt lát cắt, viết `spec.md` và tham gia code prototype. Trong quá trình làm, mình cũng phối hợp với Hiếu ở phần evidence/prompt và với Hải ở phần golden set, dữ liệu test và demo.

## Phần mình đã làm

- Chuyển vấn đề “học viên phải chuyển qua lại giữa các trang và khó biết câu trả lời có căn cứ ở đâu” thành lát cắt: học viên chọn **Toàn bộ file**, hỏi một câu, rồi nhận câu trả lời kèm citation theo trang.
- Viết các phần chính của `spec.md`: user/job, impact, non-goals, automation conditional, các lớp chỗ khó, kịch bản rủi ro, bốn đường đi trải nghiệm và quality bar.
- Tham gia xây prototype Working: upload/parse tài liệu, chọn scope, truy xuất nội dung, gọi AI, hiển thị citation và các nhánh xử lý thiếu căn cứ hoặc ngoài phạm vi.
- Đưa các quyết định về cái giá khi sai vào sản phẩm: khi không đủ context thì không đoán; citation phải kiểm tra được; user có thể đổi phạm vi và hỏi lại.

## AI đã hỗ trợ thế nào

AI giúp nhóm brainstorm các tình huống người học có thể gặp, rà soát lát cắt và biến các ý tưởng chung thành bảng kịch bản có hành vi mong muốn. AI cũng hỗ trợ viết và chỉnh sửacode/UI, gợi ý prompt có cấu trúc cho câu trả lời kèm nguồn, tạo các case kiểm thử và phát hiện những chỗ dễ bịa citation hoặc trộn nguồn.

Tuy vậy, AI không thay thế việc mình hiểu phần đã nhận. Mình phải đọc lại code, kiểm tra flow end-to-end và đối chiếu kết quả với quality bar.

## Bài học từ case fail của chính nhóm

Ở lượt kiểm thử formal CP3, nhóm chỉ đạt **13/20 case pass (65%)**. Các lỗi tập trung ở groundedness, scope isolation và ambiguity handling; trong khi đó lượt baseline trước đó là 18/20. Case này cho mình thấy một prototype có thể trông chạy được nhưng vẫn chưa đáng tin nếu chưa kiểm soát chặt dữ liệu đầu vào, phạm vi truy xuất và câu hỏi mơ hồ.

Bài học của mình là phải kiểm thử các đường failure cùng lúc với happy path, ngay từ khi chốt kiến trúc. Sau case này, mình ưu tiên khóa context theo đúng file/course, không tạo citation khi retrieval rỗng, và yêu cầu hệ thống hỏi lại thay vì tự đoán khi câu hỏi thiếu thông tin. Lần sau mình sẽ đưa các case khó vào vòng đo đầu tiên và dùng kết quả fail để sửa thiết kế trước khi mở rộng thêm tính năng.
