# III. PHÁC HỌA THIẾT KẾ

## 1. Thiết kế tổng quan: 5 nhiệm vụ quan trọng nhất

### Nhiệm vụ 1: Quản lý tài liệu
Cho phép người dùng tải lên, quản lý và chia sẻ tài liệu trong hệ thống. Tài liệu được phân loại theo danh mục, phòng ban và có thể được đặt là công khai hoặc nội bộ.

### Nhiệm vụ 2: Duyệt nội dung
Admin có quyền kiểm duyệt nội dung (tài liệu, bài viết) trước khi công khai. Hệ thống cho phép xem chi tiết, tải xuống, phê duyệt hoặc từ chối nội dung.

### Nhiệm vụ 3: Tạo bài đăng và thông báo
Người dùng có thể tạo bài viết và thông báo với trình soạn thảo rich text, thêm hình ảnh, tags và đặt quyền xem cho từng đối tượng.

### Nhiệm vụ 4: Quản lý sự kiện
Cho phép tạo và quản lý các sự kiện với thông tin về thời gian, địa điểm, mô tả và người tham gia. Sự kiện có thể được gán cho các phòng ban cụ thể.

### Nhiệm vụ 5: Tìm kiếm trong hệ thống
Cung cấp chức năng tìm kiếm toàn diện cho phép người dùng nhanh chóng tìm kiếm tài liệu, bài viết, thông báo và sự kiện trong toàn hệ thống.

## 2. Thiết kế kịch bản mẫu

### Nhiệm vụ 1: Quản lý tài liệu

#### Cửa sổ danh sách tài liệu
- **Thanh tìm kiếm**: Cho phép tìm kiếm tài liệu theo từ khóa
- **Bộ lọc**: Lọc theo danh mục (Báo cáo, Hợp đồng, Hướng dẫn, Biểu mẫu, Khác)
- **Bảng tài liệu**: Hiển thị danh sách với các cột: Tên tài liệu, Phân loại, Phòng ban, Ngày tạo
- **Các nút tác vụ**: Icon bút chì (sửa), icon tải xuống, icon thùng rác (xóa)
- **Nút "Thêm tài liệu"**: Nút nổi bật ở góc phải trên cùng

#### Cửa sổ thêm/sửa tài liệu
- **Form nhập liệu**: Các trường thông tin (tiêu đề, mô tả, phân loại)
- **Dropdown chọn phòng ban**: Danh sách phòng ban trong hệ thống
- **Radio button tính chất**: Lựa chọn công khai/nội bộ
- **Vùng kéo thả tệp tin**: Cho phép kéo thả hoặc chọn tệp tin từ máy tính
- **Nút "Tải lên"**: Gửi tài liệu lên hệ thống
- **Nút "Hủy"**: Quay lại màn hình danh sách

#### Thông báo xác nhận/lỗi
- **Thông báo thành công**: Hiển thị khi tải lên/sửa/xóa thành công
- **Thông báo lỗi**: Hiển thị khi tệp tin không hợp lệ hoặc có lỗi xảy ra

### Nhiệm vụ 2: Duyệt nội dung

#### Cửa sổ kiểm duyệt nội dung
- **Tab chọn loại nội dung**: Chuyển đổi giữa Tài liệu và Bài viết
- **Bộ lọc**: Lọc theo trạng thái, phòng ban, loại nội dung
- **Bảng nội dung**: Hiển thị danh sách nội dung chờ duyệt với các thông tin cơ bản
- **Các nút tác vụ**: Icon xem chi tiết, icon bút chì (sửa), icon thùng rác (xóa)

#### Cửa sổ xem chi tiết nội dung
- **Thông tin chi tiết**: Hiển thị đầy đủ thông tin của nội dung
- **Trình xem trước**: Hiển thị nội dung tài liệu hoặc bài viết
- **Nút "Phê duyệt"**: Chấp thuận và công khai nội dung
- **Nút "Từ chối"**: Từ chối với lý do
- **Nút "Chỉnh sửa"**: Cho phép chỉnh sửa trước khi duyệt

### Nhiệm vụ 3: Tạo bài đăng và thông báo

#### Cửa sổ danh sách bài viết
- **Thanh tìm kiếm**: Tìm kiếm bài viết theo từ khóa
- **Bộ lọc**: Lọc theo trạng thái, phòng ban, thẻ
- **Lưới bài viết**: Hiển thị dạng thẻ với hình ảnh, tiêu đề, tóm tắt
- **Nút "Thêm bài viết"**: Nút nổi bật ở góc phải trên cùng

#### Cửa sổ soạn thảo bài viết
- **Trường tiêu đề**: Nhập tiêu đề bài viết
- **Trình soạn thảo rich text**: Cho phép định dạng văn bản phong phú
- **Tải lên hình ảnh**: Nút và vùng kéo thả để thêm hình ảnh
- **Thêm tags**: Nhập và chọn các thẻ liên quan
- **Dropdown chọn phòng ban**: Chọn phòng ban liên quan
- **Radio button tính chất**: Lựa chọn công khai/nội bộ
- **Nút "Xem trước"**: Xem trước bài viết trước khi gửi
- **Nút "Gửi"**: Gửi bài viết để duyệt hoặc đăng trực tiếp
- **Nút "Hủy bỏ"**: Quay lại danh sách bài viết

### Nhiệm vụ 4: Quản lý sự kiện

#### Cửa sổ danh sách sự kiện
- **Thanh tìm kiếm**: Tìm kiếm sự kiện theo từ khóa
- **Bộ lọc**: Lọc theo thời gian, phòng ban
- **Lịch/Danh sách**: Chuyển đổi giữa chế độ xem lịch và danh sách
- **Các nút tác vụ**: Icon thông tin (xem chi tiết), icon bút chì (sửa), icon thùng rác (xóa)
- **Nút "Thêm sự kiện"**: Nút nổi bật ở góc phải trên cùng

#### Cửa sổ thêm/sửa sự kiện
- **Form nhập liệu**: Các trường thông tin (tiêu đề, mô tả, địa điểm)
- **Chọn thời gian**: Bộ chọn ngày giờ cho thời gian bắt đầu và kết thúc
- **Dropdown chọn phòng ban**: Chọn phòng ban liên quan
- **Thêm người tham gia**: Tìm kiếm và chọn người tham gia từ danh sách
- **Nút "Tạo sự kiện"**: Lưu và tạo sự kiện
- **Nút "Hủy"**: Quay lại danh sách sự kiện

#### Cửa sổ xem chi tiết sự kiện
- **Thông tin chi tiết**: Hiển thị đầy đủ thông tin sự kiện
- **Danh sách người tham gia**: Hiển thị và quản lý người tham gia
- **Nút "Chỉnh sửa"**: Chuyển đến chế độ chỉnh sửa
- **Nút "Xóa"**: Xóa sự kiện với xác nhận

### Nhiệm vụ 5: Tìm kiếm trong hệ thống

#### Modal tìm kiếm toàn cục
- **Thanh tìm kiếm**: Nhập từ khóa tìm kiếm với phím tắt Ctrl+K
- **Tabs phân loại**: Chuyển đổi giữa Tất cả, Tài liệu, Bài viết, Thông báo, Sự kiện
- **Kết quả tìm kiếm**: Hiển thị kết quả theo danh mục với thông tin tóm tắt
- **Phân trang**: Điều hướng giữa các trang kết quả
- **Thông báo không có kết quả**: Hiển thị khi không tìm thấy kết quả phù hợp

# IV. XÂY DỰNG STORYBOARD

## Kịch bản 1: Quản lý tài liệu

Khi người dùng đăng nhập vào hệ thống, họ thấy giao diện Dashboard với menu điều hướng bên trái. Trong menu này có mục "Quản lý tài liệu" mà người dùng có thể nhấn vào. Khi nhấn vào, hệ thống hiển thị trang danh sách tài liệu với bảng hiển thị các tài liệu hiện có, thanh tìm kiếm và các bộ lọc ở phía trên.

Ở góc phải trên của trang có nút "Thêm tài liệu" màu cam nổi bật. Khi người dùng nhấn vào nút này, hệ thống mở ra một form nhập liệu với các trường thông tin như tiêu đề, mô tả, dropdown chọn phân loại (Báo cáo, Hợp đồng, Hướng dẫn, Biểu mẫu, Khác), dropdown chọn phòng ban, radio button chọn tính chất (công khai/nội bộ), và vùng kéo thả để tải tệp tin lên.

Người dùng điền đầy đủ thông tin vào form, chọn phân loại "Báo cáo", chọn phòng ban "Phòng Kỹ thuật", đặt tính chất "Nội bộ", sau đó kéo thả tệp PDF vào vùng tải lên. Khi tệp được kéo vào, hệ thống hiển thị thanh tiến trình tải lên với phần trăm hoàn thành.

Sau khi tải lên hoàn tất, người dùng nhấn nút "Tải lên" màu xanh ở cuối form. Hệ thống xử lý và hiển thị thông báo thành công "Tài liệu đã được tải lên thành công" ở góc phải trên màn hình. Sau đó, người dùng được chuyển về trang danh sách tài liệu, nơi tài liệu mới xuất hiện ở đầu danh sách với đầy đủ thông tin và các nút tác vụ bên cạnh.

Nếu người dùng muốn chỉnh sửa tài liệu, họ có thể nhấn vào icon bút chì bên cạnh tài liệu trong danh sách. Khi nhấn vào, hệ thống hiển thị form chỉnh sửa với thông tin đã điền sẵn. Người dùng có thể thay đổi các thông tin cần thiết như mô tả, phân loại hoặc tính chất, sau đó nhấn "Lưu thay đổi". Hệ thống sẽ cập nhật thông tin và hiển thị thông báo thành công.

## Kịch bản 2: Duyệt nội dung

Khi Admin đăng nhập vào hệ thống, họ có quyền truy cập vào mục "Kiểm duyệt nội dung" trong menu "Quản lý hệ thống" ở sidebar bên trái. Khi nhấn vào mục này, hệ thống hiển thị trang kiểm duyệt với hai tab chính ở phía trên: "Tài liệu" và "Bài viết". Mặc định, tab "Tài liệu" được chọn và hiển thị danh sách các tài liệu đang chờ duyệt.

Trang kiểm duyệt hiển thị bảng danh sách với các cột thông tin: tiêu đề, người tải lên, phòng ban, thời gian tải lên và các nút tác vụ ở cột cuối cùng. Các nút tác vụ bao gồm icon xem chi tiết (biểu tượng con mắt), icon chỉnh sửa (biểu tượng bút chì) và icon xóa (biểu tượng thùng rác). Phía trên bảng có bộ lọc cho phép Admin lọc theo trạng thái, phòng ban hoặc loại tài liệu.

Khi Admin nhấn vào icon xem chi tiết của một tài liệu, hệ thống mở ra một cửa sổ modal hiển thị thông tin chi tiết về tài liệu đó. Modal này hiển thị đầy đủ thông tin như tiêu đề, mô tả, phân loại, phòng ban, người tải lên, thời gian tải lên và có nút tải xuống để Admin có thể xem nội dung tài liệu trước khi quyết định duyệt.

Sau khi xem xét tài liệu, Admin có thể quay lại cửa sổ chi tiết và nhấn nút "Phê duyệt" màu xanh lá. Hệ thống sẽ hiển thị hộp thoại xác nhận "Bạn có chắc chắn muốn phê duyệt tài liệu này không?". Khi Admin nhấn "Xác nhận", hệ thống hiển thị thông báo "Tài liệu đã được phê duyệt thành công" và tài liệu được chuyển sang trạng thái công khai, hiển thị trong danh sách tài liệu công khai cho người dùng phù hợp.

Admin có thể chuyển sang tab "Bài viết" để duyệt các bài viết bằng cách nhấn vào tab đó. Khi chuyển tab, hệ thống hiển thị danh sách các bài viết đang chờ duyệt với giao diện tương tự. Quy trình duyệt bài viết cũng tương tự như duyệt tài liệu.

## Kịch bản 3: Tạo bài đăng và thông báo

Khi người dùng có quyền (như Trưởng phòng) muốn tạo bài viết mới, họ truy cập vào mục "Quản lý bài viết" từ sidebar bên trái. Khi nhấn vào, hệ thống hiển thị trang danh sách bài viết với các bài viết đã tạo trước đó. Các bài viết được hiển thị dưới dạng lưới các thẻ, mỗi thẻ có hình ảnh đại diện, tiêu đề, tóm tắt nội dung và thông tin về tác giả, thời gian đăng.

Ở góc phải trên của trang có nút "Thêm bài viết" màu cam nổi bật. Khi người dùng nhấn vào nút này, hệ thống chuyển đến trang soạn thảo bài viết với giao diện đầy đủ các công cụ. Trang này bao gồm trường nhập tiêu đề ở trên cùng, tiếp theo là trình soạn thảo rich text cho phép định dạng văn bản (đậm, nghiêng, gạch chân, danh sách, tiêu đề), nút tải lên hình ảnh, trường nhập tags, dropdown chọn phòng ban và radio button chọn tính chất (công khai/nội bộ).

Người dùng nhập tiêu đề "Thông báo kế hoạch quý 3", sau đó soạn nội dung chi tiết trong trình soạn thảo. Họ có thể sử dụng các công cụ định dạng để tạo văn bản có cấu trúc rõ ràng với các đề mục, danh sách và đoạn văn được định dạng phù hợp. Người dùng cũng có thể tải lên một hình ảnh biểu đồ kế hoạch bằng cách nhấn vào nút "Tải lên hình ảnh" và chọn file từ máy tính. Sau khi tải lên, hình ảnh được hiển thị trong bài viết. Người dùng thêm các tags "kế hoạch", "quý 3" vào trường tags để dễ dàng tìm kiếm sau này.

Sau khi hoàn thành soạn thảo, người dùng có thể nhấn nút "Xem trước" để kiểm tra bài viết trước khi gửi. Hệ thống hiển thị bản xem trước với đầy đủ định dạng và hình ảnh như khi được xuất bản. Nếu hài lòng với kết quả, người dùng nhấn nút "Gửi" để gửi bài viết đi duyệt. Hệ thống hiển thị thông báo "Bài viết đã được gửi để duyệt" và chuyển người dùng về trang danh sách bài viết, nơi bài viết mới xuất hiện với trạng thái "Chờ duyệt".

Trong trang danh sách bài viết, người dùng có thể theo dõi trạng thái của bài viết mình đã tạo. Ban đầu, bài viết có trạng thái "Chờ duyệt". Sau khi Admin duyệt, trạng thái sẽ chuyển thành "Đã duyệt" và bài viết sẽ xuất hiện trong mục tin tức công ty cho những người dùng có quyền xem.

## Kịch bản 4: Quản lý sự kiện

Khi người dùng có quyền (như Trưởng phòng) muốn quản lý sự kiện, họ truy cập vào mục "Quản lý sự kiện" từ sidebar bên trái. Khi nhấn vào, hệ thống hiển thị trang quản lý sự kiện với chế độ xem lịch mặc định. Lịch hiển thị các sự kiện trong tháng hiện tại với các ô ngày được đánh dấu màu sắc khác nhau nếu có sự kiện. Phía trên lịch có các nút chuyển tháng và nút chuyển đổi giữa chế độ xem lịch và danh sách.

Ở góc phải trên của trang có nút "Thêm sự kiện" màu cam nổi bật. Khi người dùng nhấn vào nút này, hệ thống hiển thị form tạo sự kiện với các trường thông tin cần thiết. Form này bao gồm trường nhập tiêu đề, trường mô tả (có thể nhập nhiều dòng), trường địa điểm, bộ chọn ngày giờ cho thời gian bắt đầu và kết thúc (hiển thị lịch và đồng hồ), dropdown chọn phòng ban liên quan và vùng thêm người tham gia.

Người dùng nhập tiêu đề "Họp tổng kết quý", thêm mô tả chi tiết về nội dung cuộc họp, nhập địa điểm "Phòng họp A". Tiếp theo, họ chọn thời gian bắt đầu là 9:00 và thời gian kết thúc là 11:00 ngày 15/07/2023 từ bộ chọn thời gian. Người dùng chọn phòng ban "Phòng Kỹ thuật" từ dropdown và thêm 5 người tham gia bằng cách tìm kiếm tên trong hệ thống và chọn từ danh sách hiển thị.

Sau khi điền đầy đủ thông tin, người dùng nhấn nút "Tạo sự kiện" ở cuối form. Hệ thống xử lý và hiển thị thông báo "Sự kiện đã được tạo thành công". Người dùng được chuyển về trang quản lý sự kiện, nơi sự kiện mới xuất hiện trên lịch vào ngày đã chọn với màu sắc tương ứng với phòng ban.

Khi người dùng nhấn vào sự kiện trên lịch, hệ thống hiển thị modal với đầy đủ thông tin về sự kiện đó. Modal này hiển thị tiêu đề, mô tả, địa điểm, thời gian bắt đầu và kết thúc, phòng ban và danh sách người tham gia. Trong modal này có các nút tác vụ như icon bút chì để chỉnh sửa và icon thùng rác để xóa sự kiện.

Nếu người dùng muốn chỉnh sửa sự kiện, họ nhấn icon bút chì và hệ thống hiển thị form chỉnh sửa với thông tin đã điền sẵn. Người dùng có thể thay đổi thông tin cần thiết, ví dụ như thay đổi thời gian kết thúc từ 11:00 thành 12:00, sau đó nhấn "Lưu thay đổi". Hệ thống cập nhật thông tin và hiển thị thông báo thành công.

## Kịch bản 5: Tìm kiếm trong hệ thống

Khi người dùng cần tìm kiếm thông tin trong hệ thống, họ có thể sử dụng chức năng tìm kiếm toàn cục. Từ bất kỳ trang nào trong hệ thống, người dùng có thể nhấn tổ hợp phím Ctrl+K để mở modal tìm kiếm. Modal này hiển thị ở trung tâm màn hình với thanh tìm kiếm ở trên cùng, các tab phân loại (Tất cả, Tài liệu, Bài viết, Thông báo, Sự kiện) bên dưới thanh tìm kiếm và vùng hiển thị kết quả chiếm phần lớn modal.

Khi modal hiển thị, con trỏ tự động được đặt trong thanh tìm kiếm để người dùng có thể bắt đầu gõ ngay lập tức. Người dùng nhập từ khóa "báo cáo tài chính" vào thanh tìm kiếm. Khi người dùng gõ, hệ thống tự động hiển thị các gợi ý tìm kiếm dựa trên từ khóa đã nhập, hiển thị ngay bên dưới thanh tìm kiếm. Các gợi ý này có thể bao gồm các tìm kiếm phổ biến hoặc các kết quả gần đây liên quan đến từ khóa.

Sau khi nhập xong từ khóa và nhấn Enter, hệ thống thực hiện tìm kiếm và hiển thị kết quả phân loại theo danh mục trong vùng hiển thị kết quả. Kết quả tìm kiếm hiển thị với 3 tài liệu, 2 bài viết và 1 sự kiện liên quan đến "báo cáo tài chính". Mỗi kết quả hiển thị tiêu đề, loại nội dung (với icon tương ứng), phòng ban liên quan và thời gian tạo. Tab "Tất cả" được chọn mặc định, hiển thị tất cả các loại kết quả cùng một lúc.

Nếu người dùng muốn lọc kết quả theo một loại cụ thể, họ có thể nhấn vào tab tương ứng. Ví dụ, khi nhấn vào tab "Tài liệu", hệ thống chỉ hiển thị 3 tài liệu liên quan đến từ khóa "báo cáo tài chính". Các tab khác cũng hoạt động tương tự, giúp người dùng dễ dàng tìm thấy đúng loại nội dung họ cần.

Khi người dùng nhấn vào một kết quả tìm kiếm, ví dụ như nhấn vào một tài liệu trong danh sách kết quả, hệ thống đóng modal tìm kiếm và chuyển đến trang xem chi tiết của tài liệu đó. Trang chi tiết hiển thị đầy đủ thông tin về tài liệu bao gồm tiêu đề, mô tả, phân loại, phòng ban, người tải lên, thời gian tải lên và có nút tải xuống để người dùng có thể xem hoặc tải tài liệu xuống máy của mình. 