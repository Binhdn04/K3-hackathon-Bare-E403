# Reflection cá nhân — Lê Trung Hiếu

## Vai trò

Trong nhóm Bare, mình phụ trách chính phần **evidence** và **prompt**. Mình thực hiện khảo sát học viên để xác định vấn đề thực tế, tổng hợp kết quả đưa vào `spec.md`, đồng thời xây dựng và điều chỉnh prompt cho AI Tutor, Quiz và Flashcard. Ngoài hai nhiệm vụ chính, mình cũng tham gia hoàn thiện giao diện prototype để luồng sử dụng gần với VLearn và dễ kiểm tra hơn khi demo.

## Phần mình đã làm

- Xây dựng câu hỏi khảo sát, thu thập và tổng hợp phản hồi của 24 học viên. Kết quả có **10/24 người** phản ánh tình huống AI Tutor không tìm thấy nội dung, giúp nhóm có bằng chứng để xác định pain point thay vì chỉ dựa vào giả định.
- Chọn lọc các câu hỏi thực tế như “giải thích giúp tôi”, “giải thích slide ư3” và yêu cầu tóm tắt toàn bộ slide để nhận diện các trường hợp thiếu ngữ cảnh, lỗi gõ và nhu cầu hỏi trên toàn bộ file.
- Điều chỉnh prompt để câu trả lời chỉ dựa trên `SOURCE CONTEXT`, phân biệt rõ trường hợp có thể trả lời và không đủ căn cứ, đồng thời chỉ cho phép trả về `sourceIds` thực sự tồn tại trong nội dung truy xuất.
- Bổ sung ràng buộc cho Quiz và Flashcard: câu hỏi phải sinh từ học liệu, citation phải ánh xạ tới nguồn thật, mỗi lần tạo tối đa 10 câu Quiz và đúng 5 Flashcard.
- Tham gia chỉnh UI và luồng tương tác: giao diện sáng/tối theo VLearn, đọc và điều hướng PDF, công cụ ghi chú, nhập trang, zoom, tải/in tài liệu, xóa PDF đã tải lên và nút Internet fallback khi học liệu không đủ thông tin.

## AI đã hỗ trợ thế nào

AI giúp mình rà soát bộ câu hỏi khảo sát để giảm câu hỏi dẫn dắt, nhóm các phản hồi có nội dung gần nhau và gợi ý cách trình bày evidence ngắn gọn trong `spec.md`. Trong phần prompt, AI hỗ trợ tạo các phiên bản instruction, schema đầu ra có cấu trúc và các test case để kiểm tra groundedness, citation, câu hỏi mơ hồ và thông tin cần cập nhật từ Internet. AI cũng hỗ trợ hiện thực hóa và kiểm tra một số thay đổi UI.

Tuy nhiên, mình vẫn phải trực tiếp thu thập phản hồi, đối chiếu số liệu với dữ liệu gốc và quyết định bằng chứng nào đủ sức hỗ trợ bài toán. Với prompt và giao diện, mình kiểm tra lại từng luồng trên prototype, đọc kết quả thực tế và yêu cầu sửa khi AI trả lời không hợp lý hoặc gắn citation sai. AI giúp tăng tốc, còn trách nhiệm xác nhận kết quả cuối cùng vẫn thuộc về mình.

## Bài học từ case fail của chính nhóm

Ở lượt kiểm thử formal CP3, nhóm chỉ đạt **13/20 case pass (65%)**, thấp hơn quality bar 90%. Một lỗi mình trực tiếp quan sát là prompt ban đầu cho model tự viết citation dạng `[Trang N]`. Vì vậy, model có thể trả lời một câu xã giao hoặc câu hỏi không liên quan nhưng vẫn gắn trang bất kỳ; thậm chí nội dung trả lời đúng ý chung nhưng citation không thực sự chứng minh cho câu trả lời.

Từ case fail này, mình hiểu rằng chỉ viết “hãy trả lời dựa trên tài liệu và trích nguồn” là chưa đủ. Prompt cần đi cùng một output contract có thể kiểm tra bằng code. Mình chuyển sang yêu cầu model trả về `answerable`, `answer` và `sourceIds`; `sourceIds` chỉ được chọn từ danh sách nguồn thật do hệ thống cung cấp. Nếu học liệu không đủ căn cứ, hệ thống không đoán mà đề xuất liên hệ Lab Coach hoặc giảng viên, sau đó mới cho người học chủ động chọn tìm bằng AI với Internet.

Bài học lớn nhất của mình là prompt không chỉ là câu chữ hướng dẫn model, mà còn là một phần của thiết kế an toàn. Với sản phẩm giáo dục, citation sai có thể khiến người học tin nhầm kiến thức, nên mọi nguồn hiển thị phải truy vết và kiểm chứng được. Lần sau, mình sẽ đưa các case không căn cứ, câu hỏi xã giao, câu hỏi mơ hồ và câu hỏi cần dữ liệu mới vào vòng test đầu tiên, thay vì chỉ kiểm tra happy path.
