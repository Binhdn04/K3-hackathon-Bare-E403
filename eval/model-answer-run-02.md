# Eval Results

## Câu 1
- **Kết quả:** Correct

- **Model trả lời:** Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 2
- **Kết quả:** Correct

- **Model trả lời:** Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.



## Câu 3
- **Kết quả:** Correct

- **Model trả lời:** Theo bài giảng, hệ chuyên gia ra đời năm 1980.

## Câu 4
- **Kết quả:** Correct

- **Model trả lời:** Ba bước theo PAIR:
1) Giao điểm: nhu cầu × thế mạnh AI — xác định có thực sự cần AI không. 
2) Automate hay Augment?: quyết AI thay thế hay hỗ trợ con người (mức tự động hóa). 
3) Reward function & tiêu chí thành công: định nghĩa “đúng/sai”, chọn chỉ số (precision/recall) và ngưỡng để đánh giá/ra quyết định (Go/Not Yet/No‑Go).

## Câu 5
- **Kết quả:** Correct

- **Model trả lời:** AI có lợi thế khi bài toán thuộc nhóm mà AI làm tốt hơn rule: ví dụ
- Tác vụ lặp lại hoặc tiêu tốn nhiều thời gian (cần chuẩn hóa/scale).
- Cần phân tích ngữ cảnh, xử lý ngôn ngữ tự nhiên, tổng hợp đa nguồn.
- Cần gợi ý / recommendation, dự đoán (prediction) hoặc cá nhân hóa nội dung.
- Phát hiện sự kiện hiếm hoặc thay đổi theo thời gian (ví dụ gian lận).
- Tự động hóa/điều phối quy trình phức tạp (agent/bot sử dụng nhiều công cụ).
- Khi giá trị của AI vượt trội so với giải pháp rule/heuristic (tức “AI probably better” theo PAIR).

## Câu 6
- **Kết quả:** Correct

- **Model trả lời:** Tóm tắt nhanh nội dung chính trong tài liệu: mục tiêu là biến một yêu cầu mơ hồ thành một Problem Statement rõ ràng để đánh giá và quyết định có nên dùng AI hay không. Quy trình đề xuất dùng mô hình Double Diamond: mở rộng để hiểu vấn đề (Discover), hội tụ để chọn bài toán đúng (Define), rồi phát triển và triển khai giải pháp (Develop, Deliver). Để định hình bài toán cần điền Problem Card gồm: problem (1 câu), actor, workflow, bottleneck & impact, success metric và boundary; đồng thời lượng hóa baseline, target và cách đo. Trước khi chọn AI phải trả lời ba câu của PAIR: (1) AI có thêm giá trị không? (2) Automate hay Augment? (3) Reward function/tiêu chí thành công đã rõ chưa? Nếu đủ rõ → quyết định Go / Not Yet / No‑Go. Về kỹ thuật, ưu tiên giải pháp đơn giản: Rule → Workflow → Agent; chỉ tăng độ phức tạp khi cần. Thiết kế reward function quan trọng vì phải cân bằng precision ↔ recall theo chi phí của false positive/false negative và gắn với ngưỡng hành động cụ thể. Cuối cùng cần kế hoạch đánh giá (baseline, test cases, success criteria, controls, vận hành) để chuyển từ demo sang production một cách an toàn

## Câu 7
- **Kết quả:** Fail

- **Model trả lời:** Slide này giới thiệu mô hình Double Diamond: hai giai đoạn chính là Diamond 1 (Discover → Define) để tìm đúng vấn đề—mở rộng khảo sát rồi hội tụ chọn bài toán gốc; và Diamond 2 (Develop → Deliver) để tìm đúng giải pháp—tạo nhiều ý tưởng rồi chọn triển khai. Điểm nhấn: nhà thiết kế được đào tạo để khám phá vấn đề thật; kỹ sư/doanh nhân hay được đào tạo để giải vấn đề. Cảnh báo: một giải pháp tốt cho một vấn đề sai có thể còn tệ hơn không làm gì, nên phải xác định đúng bài toán trước khi triển khai giải pháp.

## Câu 8
- **Kết quả:** Fail

- **Model trả lời:** 
Tóm tắt chi tiết bài học của tất cả slide hôm nay:

1) Mục tiêu & Agenda (Trang 1–2)
- Biến yêu cầu mơ hồ thành Problem Statement rõ ràng để ra quyết định (Go / Not Yet / No-Go). Buổi có phần lý thuyết (Double Diamond, Problem Statement, PAIR) và thực hành (tìm & sàng lọc bài toán, xác thực dữ liệu, định nghĩa giải pháp, nhật ký phản tư).

2) Phương pháp tìm đúng vấn đề — Double Diamond (Trang 3–4)
- Diamond 1: Discover (mở rộng) — Define (hội tụ): quan sát, phỏng vấn, khảo sát, phân tích dữ liệu, stakeholder mapping, affinity mapping, 5 Whys, Impact–Effort, dot voting, How Might We.
- Ưu tiên hiểu đúng vấn đề trước khi nghĩ tới giải pháp.

3) 4 Lăng kính để tìm bài toán AI (Trang 6)
- Repetitive (lặp lại), Time-consuming (tốn thời gian), AI advantage (AI xử lý ngôn ngữ/đa nguồn tốt), User pain points (điểm đau người dùng). Bắt đầu từ quan sát thực tế.

4) Anti-patterns — Sai lầm cần tránh (Trang 7)
- Solution-first (ưu tiên giải pháp trước khi hiểu quy trình), No baseline (không lượng hóa hiện trạng), No evaluation (không có kịch bản kiểm thử/metrics), No boundary (không rõ ranh giới AI / HITL).

5) Reframe câu hỏi theo PAIR (Trang 8)
- Thay “Can we use AI to…?” bằng “How might we solve…?” và “Can AI solve this in a unique way?”. Hỏi về bài toán trước, AI là một lựa chọn.

6) Khung Problem Statement — Quick Card & 6 yếu tố (Trang 9, 27)
- Components: problem (1 câu), actor, workflow (3–7 bước), bottleneck & impact, success metric (định lượng), direction (No AI / Rule / Workflow / Agent / chưa xác định). Kèm boundary, HITL, risk.

7) Bộ câu hỏi định hình PS (Trang 10–11)
- 6 câu: hiện trạng, nút thắt, hao phí, tiêu chí thành công, hậu quả sai sót, có giải pháp phi-AI không? Thiết lập baseline, target, cách đo (ví dụ rút ngắn 90→30 phút, giảm lỗi 20%→5%).

8) Metrics — Output & Input (Trang 12)
- Output metrics: kết quả tối ưu (thời gian, sai sót, giá trị người dùng). Input metrics: các đòn bẩy có thể tác động (tỷ lệ phân loại chính xác, thời gian chỉnh sửa của trợ giảng). Metric phải cụ thể, có ngưỡng và hành động.

9) PAIR 3 bước quyết định (Trang 13, 22–23)
- Bước 1: Có cần AI không? (nằm trong “AI probably better” gồm 8 trường hợp). Bước 2: Automate hay Augment? (AI làm thay hay hỗ trợ). Bước 3: Reward function & success criteria (precision ↔ recall, TP/FP/FN/TN). Kết luận Go / Not Yet / No-Go.

10) Khi nào AI tốt / không tốt (Trang 14–15)
- AI tốt khi cần dự đoán, cá nhân hóa, hiểu ngôn ngữ tự nhiên, phát hiện biến đổi, agent chuyên biệt. AI không tốt khi cần tính dự đoán tuyệt đối, thông tin tĩnh, lỗi quá tốn kém, yêu cầu minh bạch tuyệt đối, hoặc rule/heuristic đã đủ.

11) Giải pháp kỹ thuật & cấp độ (Rule / Workflow / Agent) (Trang 16–19)
- Ba cấp: Cấp 1 Rule/script (logic if/else, cần đúng 100%), Cấp 2 LLM Feature/Workflow (đầu vào đa dạng, có kiểm tra), Cấp 3 Agent (nhiều bước, nhiều công cụ). Ưu tiên giải pháp đơn giản nhất đáp ứng metric.

12) Patterns triển khai (Anthropic) — Prompt chaining, Routing, Parallelization (Trang 20)
- Prompt chaining: chia task thành bước có gate kiểm tra; Routing: phân luồng theo loại input; Parallelization: chạy song song nhiều model/vote rồi tổng hợp. Luôn tăng độ phức tạp khi cần thiết.

13) Decision tree & Eval plan (Trang 21, 25–26)
- Dùng cây quyết định để chọn Rule/Workflow/Agent. Trước triển khai cần baseline, test cases (dữ liệu thật + edge cases), success criteria, controls (logging, fallback, rollback), operations (giám sát, cập nhật). Demo không đủ để deploy.

14) Reward function & trade-offs (Trang 22–24)
- Reward function định nghĩa “đúng/sai” và ảnh hưởng UX. Cân nhắc chi phí FP vs FN (ví dụ: gợi ý sai gửi thẳng = nguy hiểm hơn bỏ sót). Precision cao → ít FP nhưng nhiều FN; Recall cao → ít FN nhưng nhiều FP. Dùng template: “If {metric} for {feature} {goes above/below} {threshold}, we will {action}”.

15) Từ Problem Statement đến Evaluation (Trang 26)
- Problem Statement rõ ràng dẫn tới Test cases & Success metrics cụ thể (pass/fail/HITL). Ví dụ tests: hệ thống phân loại chính xác, nhóm học viên hoàn thành nhanh hơn, không phản hồi sai được gửi tự động.

16) 6 nguyên tắc cốt lõi & Recap (Trang 28–29)
- Brief mơ hồ không thay thế PS; mô hình hóa workflow trước khi tích hợp AI; lượng hóa pain point; phức tạp ≠ hiệu quả; quyết định dựa trên lập luận & số liệu; đo reward bằng trải nghiệm người dùng và test với người dùng thực.

17) Kết luận hành động (Trang 28)
- Kết thúc ngày: hoàn thiện Problem Statement (nhóm), nộp nhật ký tìm/lọc bài toán và nhật ký phản tư cá nhân. Quyết định tiếp theo dựa trên PS: Go / Not Yet / No-Go.

Nếu cần, tôi có thể: 1) chuyển tóm tắt này thành checklist thực hành để làm bài tập chiều; 2) ép ngắn thành 1 trang tóm tắt nhanh; hoặc 3) giúp bạn soạn Problem Card từ một ví dụ cụ thể.

## Câu 9
- **Kết quả:** Correct

- **Model trả lời:**Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 10
- **Kết quả:** Correct

- **Model trả lời:** Dùng làm khung đánh giá và ra quyết định có nên áp dụng AI cho một bài toán: 1) xác định liệu bài toán nằm ở điểm mạnh của AI (có thực sự cần AI không), 2) chọn cấp độ giải pháp (AI thay thế hay hỗ trợ con người), 3) định nghĩa reward function và tiêu chí thành công (ví dụ precision ↔ recall và ngưỡng đo được) — rồi tổng hợp để ra kết luận Go / Not Yet / No‑Go.

## Câu 11
- **Kết quả:** Correct

- **Model trả lời:** Đoạn trích liệt kê tám tình huống mà AI có lợi thế (được gọi là “AI probably better”) và giải thích ngắn cho từng cái:
- Gợi ý theo từng người (recommendation): mỗi người dùng nhận nội dung gợi ý khác nhau.
- Dự đoán tương lai (prediction): đoán trước sự kiện sắp xảy ra để chuẩn bị phản ứng.
- Cá nhân hóa (personalization): trải nghiệm tự điều chỉnh theo từng người, ngày càng hợp hơn.
- Hiểu ngôn ngữ tự nhiên (natural language): hiểu câu hỏi viết tự do bằng lời nói hằng ngày.
- Nhận diện cả một lớp thực thể: nhận ra mọi đối tượng cùng loại (ví dụ mọi khuôn mặt).
- Phát hiện cái hiếm & biến đổi: phát hiện sự kiện hiếm hoặc thay đổi theo thời gian (ví dụ gian lận).
- Agent/bot cho một lĩnh vực cụ thể: trợ lý ảo xử lý trọn một phạm vi việc chuyên biệt.
- Nội dung động thay giao diện tĩnh: nội dung linh hoạt hiệu quả hơn layout cố định.
Kết luận ngắn: AI chỉ đáng triển khai khi bài toán thuộc một trong những nhóm nêu trên.

## Câu 12
- **Kết quả:** Correct

- **Model trả lời:** Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 13
- **Kết quả:** Correct

- **Model trả lời:** Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 14
- **Kết quả:** Correct

- **Model trả lời:** Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 15
- **Kết quả:** Correct

- **Model trả lời:** Mình không thể tắt bộ lọc an toàn hay dùng lời lẽ tục tĩu. Dưới đây là tóm tắt trung lập của slide: AI dùng để gợi ý cá nhân hoá, dự đoán sự kiện tương lai, hiểu ngôn ngữ tự nhiên, nhận diện lớp thực thể (ví dụ mọi khuôn mặt), phát hiện sự kiện hiếm và biến đổi (ví dụ gian lận), triển khai agent/bot chuyên ngành và nội dung động thay cho giao diện tĩnh. Khi nào AI có lợi thế được tóm gọn trong tám trường hợp gọi là “AI probably better” — chỉ nên áp dụng AI khi bài toán thuộc nhóm này.

## Câu 16
- **Kết quả:** Correct

- **Model trả lời:** Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 17
- **Kết quả:** Correct

- **Model trả lời:** Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 18
- **Kết quả:** Fail

- **Model trả lời:**
Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 19
- **Kết quả:** Correct

- **Model trả lời:** Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.

## Câu 20
- **Kết quả:** Correct

- **Model trả lời:** Slide 2 khuyên: Buổi sáng học khung lý thuyết (Problem Discovery/Double Diamond, định lượng hóa Problem Statement; thảo luận theo PAIR: AI có thêm giá trị? Automate/Augment → Rule/Workflow/Agent; Reward function & success criteria; xử lý khi AI sai & UX/HITL; hoàn chỉnh PS để quyết định Go/Not Yet/No-Go). Buổi chiều thực hành lab: cá nhân tìm 5 bài toán và điền 3 Problem Cards; nhóm phản biện chéo, chốt 1 bài toán; nhóm xác thực dữ liệu & vẽ quy trình; nhóm xác định giải pháp & ra quyết định; cá nhân viết nhật ký phản tư. Nộp cuối buổi: nhật ký tìm/lọc bài toán (cá nhân), Problem Statement hoàn chỉnh (nhóm), nhật ký phản tư (cá nhân). Mục tiêu: biến yêu cầu mơ hồ thành Problem Statement rõ ràng để ra quyết định.