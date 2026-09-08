# Thiệp cưới Phát Tài & Mỹ Nhàn

Mở `index.html` hoặc đăng thư mục thiệp lên hosting tĩnh.

Lời chúc được lưu bằng localStorage, hiện ngay dưới biểu mẫu và còn sau khi tải lại trang. Dữ liệu chỉ có trên cùng trình duyệt và địa chỉ trang, không đồng bộ giữa thiết bị.

Album dùng Swiper 12.2.0 (MIT), lưu trực tiếp tại `assets/swiper-bundle.min.js` và `.css`. Tài liệu: https://swiperjs.com/swiper-api. Album tự chuyển khi hiển thị, có nút dừng và hỗ trợ vuốt. Font dùng Playfair Display và DM Sans từ Google Fonts.

Lịch trình tiệc trong `index.html` là lịch dự kiến, có thể chỉnh lại giờ và nội dung.

`server.mjs` là máy chủ cũ, không cần cho sổ lời chúc localStorage; có thể dùng `npm start` để xem trang tại http://localhost:3000.
