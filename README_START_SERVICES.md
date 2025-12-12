# Hướng dẫn chạy tất cả Services

Có 2 cách để chạy tất cả 4 service cùng lúc:

## Cách 1: Sử dụng file Batch (Windows) - Đơn giản nhất

Chỉ cần double-click vào file `start_all_services.bat` hoặc chạy trong Command Prompt:

```bash
start_all_services.bat
```

File này sẽ:
- Mở 4 cửa sổ Command Prompt riêng biệt, mỗi cửa sổ chạy một service
- Mỗi service chạy trên port riêng:
  - Identity Service: http://localhost:9001
  - User Service: http://localhost:9000
  - Email Service: http://localhost:9002
  - Chat Service: http://localhost:9003

**Lưu ý:** Để dừng các service, bạn cần đóng từng cửa sổ Command Prompt.

## Cách 2: Sử dụng Python Script - Dễ quản lý hơn

Chạy lệnh:

```bash
python start_all_services.py
```

Script này sẽ:
- Chạy tất cả 4 service trong background
- Hiển thị thông tin về các service đang chạy
- Cho phép dừng tất cả service bằng cách nhấn `Ctrl+C`

## Yêu cầu

- Python 3.7+
- uvicorn đã được cài đặt: `pip install uvicorn[standard]`
- Các dependencies của từng service đã được cài đặt

## Cấu hình Port

Nếu bạn muốn thay đổi port, có thể chỉnh sửa trong:
- `start_all_services.bat`: Thay đổi số port trong các lệnh uvicorn
- `start_all_services.py`: Thay đổi trong dictionary `SERVICES`

## Troubleshooting

### Lỗi "uvicorn is not installed"
Cài đặt uvicorn:
```bash
pip install uvicorn[standard]
```

### Lỗi "Port already in use"
Một trong các port đã được sử dụng. Bạn có thể:
1. Đóng ứng dụng đang sử dụng port đó
2. Thay đổi port trong script

### Service không khởi động được
Kiểm tra:
- Đã cài đặt đầy đủ dependencies cho service đó chưa?
- Database và Redis đã được cấu hình và chạy chưa?
- File `.env` đã được cấu hình đúng chưa?

