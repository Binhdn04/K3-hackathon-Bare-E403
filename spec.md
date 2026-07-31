# AI SPEC — Một học viên đang đọc tài liệu trong buổi học · bôi đen một đoạn và hỏi · AI quyết định đoạn đó có căn cứ trả lời hay không · trả về câu trả lời kèm số trang, hoặc nói rõ "đoạn này không đề cập". Nhóm Bare
Hướng: [ ] A — VLearn  [x] B — Trợ lý Học viên  [ ] C — Làn mở  
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

## §1. User & Job




- **Job executor + workflow (worksheet JTBD / sơ đồ):** Học viên đang học hoặc ôn một bộ slide: (1) mở file và chuyển tới trang cần học; (2) chọn phạm vi “Trang hiện tại” hoặc “Toàn bộ file”; (3) hỏi một câu / tạo quiz / tạo flashcard; (4) kiểm tra câu trả lời và bấm citation để quay lại trang nguồn;  
  ```mermaid
  graph TD
      %% Định nghĩa phong cách chung cho các hộp
      classDef default fill:#f9f9f9,stroke:#333,stroke-width:1px,color:#333;
      classDef highlight fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;

      Start([Người học mở AI Tutor]) --> Upload[Chọn / Upload học liệu<br><i>.pdf, .md, .txt</i>]
      Upload --> Process[Hệ thống xử lý tài liệu<br><small>Tách trang ➔ Lưu ➔ Sẵn sàng</small>]
      Process --> OpenDoc[Mở tài liệu để học]

      %% Bước chọn phạm vi
      OpenDoc --> Scope{Chọn phạm vi học}
      Scope -->|Tùy chọn 1| S1[Trang hiện tại]
      Scope -->|Tùy chọn 2| S2[Toàn bộ file]
      Scope -->|Tùy chọn 3| S3[Đoạn bôi đen]

      %% Bước chọn chức năng
      S1 & S2 & S3 --> Action{Chọn chức năng}
      Action -->|Feature 1| A1[Hỏi AI]
      Action -->|Feature 2| A2[Tạo Quiz]
      Action -->|Feature 3| A3[Tạo Flashcard]

      %% Bước xử lý của AI
      A1 & A2 & A3 --> RAG[AI truy xuất nội dung<br>trong phạm vi đã chọn]
      
      %% Sinh kết quả và tương tác ngược
      RAG --> Output[Sinh kết quả<br><small>Câu trả lời / Quiz / Flashcard</small><br><b>+ Kèm Citation</b>]
      Output --> ClickCite[Người học bấm Citation]
      ClickCite -.->|Quay lại đúng trang| OpenDoc

      %% Áp dụng highlight cho điểm đầu và cuối luồng
      class Start,ClickCite highlight;
- **Core JTBD:** Khi đang học một file slide nhiều trang, tôi muốn hỏi và ôn tập dựa trên đúng file đang mở, để không phải tự tìm từng trang hoặc dán nội dung sang công cụ khác.
- **Problem statement:** Học viên phải chuyển qua lại giữa nhiều trang và tự gom nội dung để đặt câu hỏi/ôn tập; việc này làm mất thời gian, dễ dùng nhầm tài liệu và khó kiểm tra câu trả lời có căn cứ ở đâu.
- **Evidence (chuẩn A/B — log đầy đủ trong repo):** Hiện có bằng chứng B ở mức 122/1621 câu trả lời chứa "không tìm thấy".
  - **Số liệu mining / khảo sát: Bằng chứng A 10/24 người khảo sát google form chọn "Bị lỗi "không tìm thấy nội dung trong tài liệu" với câu hỏi "Lần gần nhất đặt câu hỏi, AI Tutor trả lời có giải quyết được thắc mắc của bạn không?"  
  - **≥5 quote/ví dụ nguyên văn + nguồn (artifact, không phải quote user):**
    1. “tóm tắt. chi. tiết. bài học cảu tất cả slide hôm nay” 
    2. “Bôi đen nội dung trong slide và hỏi \"Cái này dùng để làm gì?\"” 
    3. “giải thích slide ư3” 
    4. “giải thích giúp tôi” —
    5. “Theo bài giảng, hệ chuyên gia ra đời năm nào?” 
  - Các câu trên chứng minh dạng input cần xử lý (toàn file, selected text, lỗi gõ, câu hỏi thiếu ngữ cảnh, ngoài phạm vi), **không chứng minh tần suất hay mức đau**.



## §2. Impact & quyết định chọn

| Ứng viên                         | Bao nhiêu người | Tần suất              | Tốn gì mỗi lần                                         | Khả thi trong prototype                  | Chọn?                        |
| -------------------------------- | --------------: | --------------------- | ------------------------------------------------------ | ---------------------------------------- | ---------------------------- |
| Hỏi đáp theo trang hiện tại      |   **1/3 người** | Mỗi lần học một trang | Tốn thao tác chuyển trang, dễ mất mạch                 | Đã có retrieval + citation               | Không chọn làm lát cắt chính |
| Hỏi đáp theo selected text       |   **2/3 người** | Khi gặp đoạn khó      | Tốn copy/dán hoặc bôi đen lại                          | Đã có selection + citation               | Giữ làm nhánh phụ            |
| Toàn bộ file đang mở làm context |   **3/3 người** | Mỗi buổi ôn file      | Tốn thời gian gom nội dung, nguy cơ dùng nhầm tài liệu | Đã triển khai scope, retrieval, citation | **Chọn**                     |
| Sinh quiz/flashcard từ file      |   **2/3 người** | Cuối mỗi buổi ôn      | Tốn thời gian tự soạn câu hỏi/thẻ                      | Đã có API AI và UI                       | Giữ làm kết quả liền kề      |


- **Ứng viên đã loại:** Full-course/all-uploaded-material context: loại vì làm loãng phạm vi, khó truy nguồn và có nguy cơ trộn tài liệu; transcript/audio context: loại khỏi lát cắt vì parser hiện chỉ xử lý PDF/Markdown/TXT và không có timestamp transcript thực.
- **Ứng viên chọn:** “Toàn bộ file đang mở” vì phù hợp đúng artifact cần demo, reuse được ingestion/retrieval hiện có, không cần thêm data model; quyết định là **tạm thời** cho tới khi có số liệu `số người × tần suất × phút/lần` trong evidence.

## §3. Giải pháp tương tự đã nghiên cứu

- **NotebookLM:** Flow: nạp nguồn → hỏi trên nguồn → câu trả lời đi kèm citation. Đáng học: citation cạnh câu trả lời giúp kiểm tra nhanh. Đáng né: người dùng phải nạp/chọn nguồn trước, phạm vi có thể không rõ khi có nhiều nguồn. Mình khác: file đang mở được chọn trực tiếp bằng nút “Toàn bộ file”, và citation chỉ trả các trang được câu trả lời nhắc tới.
- **ChatGPT Study mode:** Flow: đặt mục tiêu → hỏi gợi mở → kiểm tra hiểu. Đáng học: hội thoại tự nhiên và cảnh báo giới hạn. Đáng né: nếu không khóa nguồn thì câu trả lời dễ vượt tài liệu đang học. Mình khác: retrieval bị khóa theo file/trang đã chọn, có đường fallback Internet được thông báo.
- **Quizlet/Quiz AI:** Flow: đưa tài liệu → sinh bộ câu hỏi/thẻ → người học làm và xem đáp án. Đáng học: chuyển tài liệu thành hoạt động ôn tập. Đáng né: hiển thị đáp án/citation quá sớm làm mất tác dụng tự kiểm. Mình khác: quiz chỉ Multiple Choice, chấm ngay `0/1` hoặc `1/1`, ẩn reference/citation cho tới Grade.

## §4. Thiết kế

- **Lát cắt MỘT CÂU:** Một học viên đang mở một file slide chọn “Toàn bộ file”, hỏi một câu học tập, hệ thống trả lời chỉ từ file đó kèm các trang được trích dẫn thực tế để học viên kiểm tra.
- **Non-goals:**
  1. Không xây authentication, phân quyền hoặc chia sẻ tài liệu.
  2. Không xử lý PPTX gốc, audio/video hoặc OCR slide scan trong lát cắt hiện tại.
  3. Không cho AI tự thay đổi nội dung slide, chấm điểm học kỳ hoặc quyết định thay giảng viên.
  4. Không dùng toàn bộ course/Internet làm nguồn im lặng khi user đã chọn một file.
  5. Không xây flashcard spaced-repetition; các nút “Chưa nhớ/Khó/Đã nhớ” không thuộc MVP.
- **Mức prototype:** [ ] Sketch  [ ] Mock  [x] Working
  - **Thật:** upload và parse PDF/Markdown/TXT; lưu pages/chunks; chọn file/trang; selected text; scope current slide/entire document; OpenAI chat/quiz/flashcard; citation mở đúng trang; web fallback có thông báo.
  - **Mock/giới hạn:** local JSON store thay production DB; embedding có lexical fallback; không có user account; validation người dùng và golden-set formal chưa được log trong repo.
- **Automation:** [ ] augment  [x] conditional  [ ] automate. Khi có context/citation đủ thì trả lời; khi không đủ thì nói không thể kết luận hoặc thông báo Internet fallback. Cost-of-error cao vì câu trả lời sai làm học viên học sai và mất niềm tin; user luôn có thể kiểm tra citation, đổi scope hoặc hỏi lại.
- **§4b. Nguyên tắc đã áp dụng:**

  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|
  | G1 — Làm rõ khả năng | Context bar hiển thị “Trang hiện tại”, “Đoạn đã chọn” hoặc “Toàn bộ file đang mở”. |
  | G2 — Làm rõ độ tin cậy | Citation mở đúng trang; khi thiếu tài liệu, câu trả lời nói rõ và gắn nhãn nguồn Internet. |
  | G10 — Thu hẹp phạm vi khi nghi ngờ | Scope entire document chỉ đọc document thuộc đúng `courseId`; không trộn tài liệu khác. |
  | G8 — Gạt bỏ dễ dàng | User đổi scope, đổi trang, bỏ selected text hoặc không dùng quiz/flashcard. |
  | G9 — Sửa dễ dàng | User chọn lại đáp án rồi Grade lại; đổi phạm vi và hỏi lại trong cùng flow. |
  | G11 — Giải thích vì sao | Tutor dùng nhãn `[Trang N]`; citation list chỉ hiện trang được câu trả lời nhắc tới trong whole-file mode. |
  | PAIR — Explainability + Trust | Nguồn được hiển thị dạng citation có thể click, thay vì yêu cầu tin câu trả lời mù. |

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản

| # | Lớp | Tình huống | Hành vi mong muốn | Nguyên tắc |
|---:|---|---|---|---|
| 1 | ① Nguồn sự thật | Hỏi chi tiết không xuất hiện trong file | Nói “không thể kết luận từ học liệu”; không bịa citation; cho phép đổi nguồn | G2, G10 |
| 2 | ① Nguồn sự thật | Model gắn `[Trang 3]` dù nội dung nằm trang 7 | Không hiển thị citation không được model nhắc; user có thể hỏi lại | G11 |
| 3 | ② Mơ hồ | “giải thích slide ư3” | Hỏi lại slide 3 hay 13 thay vì tự chọn | G10, G9 |
| 4 | ② Mơ hồ | “giải thích giúp tôi” không có câu trước | Hỏi user muốn giải thích trang/đoạn nào | G10 |
| 5 | ② Mơ hồ | File không có chunk hoặc chưa Ready | Hiển thị empty/loading/error; disable action cần document | G1, Graceful Failure |
| 6 | ③ Ngoài phạm vi | Hỏi 2+2 hoặc chuyện ngoại hình | Từ chối/nhắc phạm vi học tập; không giả vờ có nguồn | G8, G10 |
| 7 | ③ Ngoài phạm vi | Đòi system prompt/mã nguồn/cấu hình | Từ chối tiết lộ; không trích nội dung ngoài context | G2, PAIR Safety |
| 8 | ③ Ngoài phạm vi | Đòi làm hộ Problem Statement để copy nộp | Không làm thay; đưa khung hướng dẫn người học tự điền | G8 |
| 9 | ④ Đặc thù domain | AI trả lời đúng ý nhưng không có citation | Không đạt quality bar; yêu cầu citation hoặc nói thiếu căn cứ | G2, G11 |
| 10 | ④ Đặc thù domain | Quiz lộ reference/citation trước khi làm | Ẩn reference/citation; chỉ hiện sau Grade; score đúng `1/1` hoặc `0/1` | G8, G9 |
| 11 | ④ Đặc thù domain | Câu hỏi quiz sinh đáp án không nằm trong options | Reject/regenerate câu hỏi; không cho chấm câu malformed | G10 |
| 12 | ④ Đặc thù domain | File có nhiều trang, câu trả lời đưa toàn bộ citation | Lọc/dedupe chỉ trang được nhắc tới | G11, Explainability |

## §6. Bốn đường đi của trải nghiệm

- **Happy path:** Upload/ chọn file Ready → chọn “Toàn bộ file” → nhập câu hỏi → hệ thống đọc chunks của file → trả lời tiếng Việt + citation theo trang → click citation để quay lại reader.
- **Low-confidence (②):** Câu hỏi mơ hồ/thiếu thông tin → không đoán im lặng; hỏi lại hoặc nói phần nào chưa thể kết luận; giữ context để user sửa.
- **Failure/không căn cứ (①):** Không có chunk, file không thuộc course, hoặc retrieval rỗng → hiện lỗi/empty state; không tạo citation giả. Với câu hỏi không có trong học liệu, chỉ fallback Internet khi đang ở flow tutor và gắn thông báo rõ.
- **Correction (user sửa):** User đổi Trang hiện tại ↔ Toàn bộ file, chọn lại file/trang, bôi đen đoạn khác, hoặc hỏi lại; kết quả quiz bị xóa khi tạo bộ mới và grade bị xóa khi đổi lựa chọn.
- **Khi bị đòi ngoài phạm vi (③):** Từ chối ngắn gọn, nhắc hệ thống chỉ hỗ trợ học từ tài liệu; không tiết lộ prompt, mã nguồn hay dữ liệu riêng.
- **Case đặc thù domain (④):** Quiz chỉ Multiple Choice thang 1; reference/rubric/citation ẩn cho tới Grade; answer đúng `1/1`, sai `0/1`; citation whole-file được lọc theo trang câu trả lời thực sự nhắc.

## §7. Kiểm thử

- **Chiều chất lượng + định nghĩa kiểm chứng được:**
  - Groundedness: mọi mệnh đề kiến thức phải trace được tới chunk/page hoặc được nói rõ là không có căn cứ; pass/fail.
  - Citation precision: citation UI chỉ chứa trang được câu trả lời nhắc; không trả toàn bộ deck; pass/fail.
  - Scope isolation: whole-file không đọc document khác course; pass/fail.
  - Ambiguity/error handling: 100% case mơ hồ/ngoài phạm vi phải hỏi lại hoặc từ chối phù hợp, không đoán/bịa; pass/fail.
  - Quiz safety: chỉ Multiple Choice; reference/citation ẩn trước Grade; đúng `1/1`, sai `0/1`; pass/fail.
  - UX: happy path hoàn thành trong ≤5 thao tác chính sau khi file Ready; đo bằng checklist thao tác.
- **Golden set (≥20 case):** `eval/golden-set.md` chứa 20 case, trong đó có ≥2 case cho mỗi lớp ①–④, 8–10 case thường/luồng chính và case hiếm/red-team; các case được giữ nhãn **Thực tế/Tự nghĩ**.
- **Quality bar (chốt từ 23:59):** “Đạt khi ≥90% toàn bộ golden set pass tất cả chiều groundedness/citation/scope/error, và **100% case không căn cứ không được bịa nguồn**, **100% quiz trước Grade không lộ reference/citation**.” Bar này phải giữ nguyên sau khi có kết quả.
- **Kết quả các lượt chạy:**

  | Lượt | Dataset | Kết quả | Trạng thái |
  |---|---|---|---|
  | Baseline hiện có | `../eval/golden-set.md` + `model-answer-run-01.md`, 20 case | **18/20 case pass (90%)** theo rubric; còn 2 case fail chủ yếu do citation/groundedness | **Đạt quality bar** |
  | CP3 formal | `eval/` | **13/20 case pass (65%)**; lỗi tập trung ở groundedness, scope isolation và ambiguity handling | **Chưa đạt, cần sửa trước CP4** |
  | CP5 user validation | `validation/` | Chưa có log | Cần ≥5 người ngoài nhóm |

## §8. Phân công & kế hoạch

- **Phân công có tên:** `spec: [Bình] · evidence: [Hiếu] · prompt [Hiếu]· golden set: [Hải] · code: [Bình] · demo: [Hải]`. Repo hiện thể hiện code boundaries ở `components/`, `app/api/`, `lib/services/`.
- **Willing users (≥3):** Học viên khóa học: Linh, Thu, Bảo. Kế hoạch CP5: mời ít nhất 3 học viên đang học slide + thêm 2 người ngoài nhóm; giao task “mở file, chọn toàn bộ file, hỏi một câu và kiểm tra citation”, quan sát im lặng 10 phút, hỏi đúng 3 câu: (1) điều gì khó hiểu/khó chịu nhất? (2) bạn có tin kết quả không, vì sao? (3) có dùng thật không, vì sao? Người phụ trách evidence log nguyên văn vào `validation/`.
- **Multi-prototype:**
  - Phương án A — context chủ động: luôn gửi trang hiện tại, user không chọn phạm vi. Ưu: ít UI; nhược: không giải được câu hỏi cần toàn deck.
  - Phương án B — context có kiểm soát: nút “Trang hiện tại / Toàn bộ file”, selected text là nhánh rõ ràng. Ưu: user biết phạm vi và sửa được; nhược: thêm một quyết định UI.
  - **Chọn B** vì cost-of-error của dùng nhầm nguồn cao hơn một click thêm; đây là quyết định đã phản ánh vào `ChatContext.scope` và context switcher.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| 2026-07-30 | Tạo spec cho lát cắt toàn bộ file đang mở | Repo chưa có `spec.md`; chốt phạm vi theo implementation hiện tại và template chương trình. |
| 2026-07-30 | Thêm scope `entire_document`, lọc citation theo trang được nhắc | Feedback của Linh: citation còn thừa, chưa thật sự chuẩn; đồng thời đáp ứng case trong `../eval/golden-set.md`. |
| 2026-07-30 | Quiz chỉ Multiple Choice; Grade local `1/1` hoặc `0/1`; ẩn reference/citation trước Grade | Feedback của Việt Anh: đáp án đúng quá dễ đoán; điều chỉnh prompt sinh quiz và ẩn căn cứ trước khi chấm để tăng chất lượng trải nghiệm. |
| 2026-07-30 | Bổ sung chế độ hỏi đáp theo slide đang chọn hoặc nhóm slide chỉ định | Feedback của Huy: chatbot chưa hỗ trợ ngữ cảnh theo các slide chỉ định. |
| 2026-07-30 | Bỏ nút Chưa nhớ/Khó/Đã nhớ khỏi Flashcard | Giữ MVP đơn giản, tập trung vào tính năng được người dùng đánh giá hữu ích (feedback của Bảo); spaced-repetition không thuộc non-goals MVP. |


