# 🤖 ChatBot AI — Trợ Lý Lập Trình Thông Minh

> Một hệ thống chatbot AI chuyên hỗ trợ học tập và làm việc trong lĩnh vực lập trình, xây dựng theo kiến trúc **microservices** với backend FastAPI và frontend React.

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt & Chạy dự án](#-cài-đặt--chạy-dự-án)
- [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)
- [API Endpoints](#-api-endpoints)

---

## 🌟 Giới thiệu

**ChatBot AI** là một ứng dụng hỗ trợ lập trình viên — từ người mới đến chuyên gia — với vai trò:

- 🎓 **Giảng viên lập trình**: Giải thích khái niệm, cú pháp, best practices
- 🔍 **Code Reviewer**: Đánh giá và đề xuất cải thiện code
- 🐛 **Debugging Assistant**: Hỗ trợ tìm và sửa lỗi
- 🏗️ **Tư vấn kỹ thuật**: Đề xuất giải pháp, công nghệ, kiến trúc

AI hỗ trợ đa ngôn ngữ lập trình: **Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust**, v.v., và phản hồi bằng Tiếng Việt hoặc Tiếng Anh tùy ngữ cảnh.

---

## ✨ Tính năng

### 💬 Chat AI
- Chat thời gian thực với **streaming response** (WebSocket)
- Lịch sử trò chuyện được lưu trữ theo phiên (session)
- Tự động đặt tên tiêu đề cho mỗi cuộc trò chuyện bằng AI
- Hỗ trợ render **Markdown**, **syntax highlighting**, **LaTeX/KaTeX**

### 🔐 Xác thực & Phân quyền
- Đăng ký / Đăng nhập bằng JWT
- Xác thực 2 bước qua **Email OTP**
- Phân quyền theo **Role** (Admin / User)
- Giới hạn tốc độ request (**Rate Limiting**) với Redis
- Blacklist token khi đăng xuất

### 🛡️ Kiểm duyệt nội dung
- Lọc **từ khóa bị cấm** (Banned Keywords)
- Ghi nhận **vi phạm** và tính điểm vi phạm (Violation Strike)
- Gửi **email cảnh báo** khi tài khoản bị khóa

### 🖼️ Quản lý hình ảnh
- Upload và lưu trữ ảnh do người dùng gửi trong chat

### 👤 Quản lý người dùng
- CRUD người dùng
- Cache thông tin user bằng **Redis**
- Giao diện Admin quản lý hệ thống

---

## 🏛️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                  │
│              http://localhost:5173                  │
└────────────────────────┬────────────────────────────┘
                         │ HTTP / WebSocket
         ┌───────────────┼───────────────┐
         │               │               │
  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
  │  Identity   │ │    User     │ │    Chat     │
  │  Service    │ │   Service   │ │   Service   │
  │  :9001      │ │   :9000     │ │   :9003     │
  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
                  ┌──────▼──────┐
                  │    Email    │
                  │   Service   │
                  │   :9002     │
                  └─────────────┘

  Tất cả services dùng chung: PostgreSQL + Redis
  Chat Service gọi: OpenAI API (GPT streaming)
```

### Giao tiếp giữa các Services:

| Từ Service | Gọi tới | Mục đích |
|---|---|---|
| Chat | Identity | Validate JWT token |
| Chat | User | Lấy thông tin người dùng |
| Chat | Email | Gửi email cảnh báo vi phạm |
| Identity | Email | Gửi OTP xác thực |
| User | Identity | Xác thực token |

---

## 🛠️ Công nghệ sử dụng

### Backend (Python)

| Thành phần | Công nghệ |
|---|---|
| Framework | FastAPI 0.110 |
| Server | Uvicorn (ASGI) |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL |
| Cache / Session | Redis + aioredis |
| Migrations | Alembic |
| Auth | JWT (python-jose, PyJWT, passlib/bcrypt) |
| Rate Limiting | SlowAPI (Redis-based) |
| HTTP Client | httpx |
| Config | python-dotenv, pydantic-settings |

### AI Model

| Tính năng | Model |
|---|---|
| Chat chính (streaming) | OpenAI GPT (cấu hình qua `MODEL_AI`) |
| Tự động đặt tiêu đề | OpenAI GPT (cấu hình qua `MODEL_TITLE`) |

> Model được cấu hình linh hoạt qua biến môi trường, có thể dùng `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`, v.v.

### Frontend (JavaScript)

| Thành phần | Công nghệ |
|---|---|
| Framework | React 18 + Vite |
| State Management | Redux Toolkit |
| Routing | React Router DOM v6 |
| Styling | TailwindCSS + shadcn/ui |
| Animations | Framer Motion |
| Markdown rendering | react-markdown, marked, github-markdown-css |
| Code Highlighting | highlight.js, react-syntax-highlighter |
| Math Rendering | KaTeX, remark-math |
| HTTP Client | Axios |
| AI Client (Frontend) | @google/generative-ai |

---

## 📁 Cấu trúc thư mục

```
ChatBot/
├── BackEnd/
│   ├── identity_service/      # Xác thực, phân quyền, JWT
│   │   ├── routers/           # role, permission, auth, user_role, ...
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── rate_limiter.py
│   │   └── requirements_identity.txt
│   │
│   ├── user_service/          # Quản lý thông tin người dùng
│   │   ├── routers/
│   │   ├── models.py
│   │   └── requirements_user.txt
│   │
│   ├── email_service/         # Gửi email OTP, cảnh báo
│   │   ├── routers/
│   │   ├── templates/         # HTML email templates
│   │   └── requirements_email.txt
│   │
│   └── chat_service/          # Chat AI, kiểm duyệt, upload ảnh
│       ├── routers/
│       │   ├── chat.py        # WebSocket + REST chat endpoints
│       │   ├── openai_utils.py # Gọi OpenAI API
│       │   ├── baned_keyword.py
│       │   ├── image.py
│       │   └── violation_log.py
│       ├── service/
│       │   ├── prompts.py     # System prompt cho AI
│       │   ├── violation_handler.py
│       │   └── redis_client.py
│       ├── models.py
│       └── connect_service.py # Giao tiếp với các service khác
│
├── FrontEnd/
│   └── chat-ai-master/        # React + Vite SPA
│       ├── src/
│       ├── public/
│       └── package.json
│
├── start_all_services.bat     # Script khởi động nhanh (Windows)
├── README_START_SERVICES.md   # Hướng dẫn chạy services
└── README.md
```

---

## ⚙️ Yêu cầu hệ thống

- **Python** 3.10+
- **Node.js** 18+ và npm
- **PostgreSQL** 14+
- **Redis** 7+
- **OpenAI API Key**

---

## 🚀 Cài đặt & Chạy dự án

### 1. Clone repository

```bash
git clone <repository-url>
cd ChatBot
```

### 2. Cài đặt Backend (mỗi service)

```bash
# Ví dụ cho identity_service
cd BackEnd/identity_service
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements_identity.txt
```

Lặp lại cho `user_service`, `email_service`, `chat_service`.

### 3. Cài đặt Frontend

```bash
cd FrontEnd/chat-ai-master
npm install
```

### 4. Cấu hình `.env` (xem mục bên dưới)

### 5. Chạy tất cả Services

**Cách đơn giản nhất (Windows):**

```bash
start_all_services.bat
```

Hoặc chạy từng service thủ công:

```bash
# Identity Service — port 9001
cd BackEnd/identity_service
uvicorn main:app --port 9001 --reload

# User Service — port 9000
cd BackEnd/user_service
uvicorn main:app --port 9000 --reload

# Email Service — port 9002
cd BackEnd/email_service
uvicorn main:app --port 9002 --reload

# Chat Service — port 9003
cd BackEnd/chat_service
uvicorn main:app --port 9003 --reload
```

### 6. Chạy Frontend

```bash
cd FrontEnd/chat-ai-master
npm run dev
# Truy cập: http://localhost:5173
```

---

## 🔧 Cấu hình biến môi trường

Mỗi service cần file `.env` riêng. Dưới đây là các biến quan trọng:

### `identity_service/.env`

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/identity_db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_URL=redis://localhost:6379
SERVICE_KEY=your_internal_service_key
EMAIL_SERVICE_URL=http://localhost:9002/
```

### `user_service/.env`

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/user_db
REDIS_URL=redis://localhost:6379
IDENTITY_SERVICE_URL=http://localhost:9001/
SERVICE_KEY=your_internal_service_key
```

### `email_service/.env`

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/email_db
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### `chat_service/.env`

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/chat_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
MODEL_AI=gpt-4o-mini
MODEL_TITLE=gpt-4o-mini
IDENTITY_SERVICE_URL=http://localhost:9001/
USER_SERVICE_URL=http://localhost:9000/
EMAIL_SERVICE_URL=http://localhost:9002/
SERVICE_KEY=your_internal_service_key
LOGIN=http://localhost:9001/auth/login
```

---

## 📡 API Endpoints

| Service | Base URL | Swagger UI |
|---|---|---|
| Identity Service | `http://localhost:9001` | `http://localhost:9001/docs` |
| User Service | `http://localhost:9000` | `http://localhost:9000/docs` |
| Email Service | `http://localhost:9002` | `http://localhost:9002/docs` |
| Chat Service | `http://localhost:9003` | `http://localhost:9003/docs` |

### Một số endpoint chính

#### Identity Service
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/auth/login` | Đăng nhập, trả về JWT |
| `POST` | `/auth/register` | Đăng ký tài khoản |
| `GET` | `/auth/validate-token` | Kiểm tra JWT hợp lệ |
| `GET` | `/role/` | Danh sách roles |

#### Chat Service
| Method | Endpoint | Mô tả |
|---|---|---|
| `WS` | `/ws/chat/{session_id}` | WebSocket chat realtime |
| `GET` | `/api/chatbot_service/chat/sessions` | Lịch sử phiên chat |
| `DELETE` | `/api/chatbot_service/chat/{session_id}` | Xóa phiên chat |
| `GET` | `/api/chatbot_service/violation-log/` | Danh sách vi phạm |
| `POST` | `/api/chatbot_service/banned-keywords/` | Thêm từ khóa cấm |

