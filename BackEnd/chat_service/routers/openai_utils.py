from openai import AsyncOpenAI
import os
import re
import logging
from langdetect import detect
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL_RESPONSE = os.getenv("MODEL_AI")
MODEL_TITLE = os.getenv("MODEL_TITLE")

# Gọi OpenAI API để lấy phản hồi từ mô hình (stream)
async def generate_response(chatlog):
    return await client.chat.completions.create(
        model=MODEL_RESPONSE,
        messages=chatlog,
        temperature=0.7,
        max_tokens=1500,
        stream=True
    )

async def generate_title(messages: list[dict]) -> str:
    """
    Generate a natural ChatGPT-style conversation title (vi/en).
    - No word-splitting
    - No technical-word filtering
    - No broken Vietnamese
    """
    DEFAULT_TITLE_VI = "Cuộc trò chuyện mới"
    DEFAULT_TITLE_EN = "New Chat"

    if not messages:
        return DEFAULT_TITLE_VI

    # Lấy message đầu tiên của user
    user_message = None
    for m in messages:
        if isinstance(m, dict) and m.get("role") == "user":
            content = m.get("content", "").strip()
            if content:
                user_message = content
                break

    if not user_message:
        return DEFAULT_TITLE_VI

    # Lấy dòng đầu + giới hạn độ dài context
    context = user_message.split("\n")[0].strip()
    context = context[:200]

    # Detect language
    try:
        lang = detect(context)
    except Exception:
        lang = "vi"

    if lang.startswith("vi"):
        default_title = DEFAULT_TITLE_VI
        prompt = (
            "Bạn là ChatGPT.\n\n"
            "Hãy đặt một tiêu đề NGẮN GỌN (3–6 từ), TỰ NHIÊN, "
            "giống cách người dùng đặt tên cuộc trò chuyện.\n\n"
            "YÊU CẦU:\n"
            "- Phản ánh CHỦ ĐỀ CHÍNH\n"
            "- Ngôn ngữ đời thường\n"
            "- Không mang tính kỹ thuật\n"
            "- Không dùng các từ như: lỗi, bug, database, API\n\n"
            f"Nội dung:\n{context}\n\n"
            "Chỉ trả về TIÊU ĐỀ, không giải thích:"
        )
    else:
        default_title = DEFAULT_TITLE_EN
        prompt = (
            "You are ChatGPT.\n\n"
            "Create a SHORT (3–6 words), NATURAL conversation title, "
            "like how a user would name a chat.\n\n"
            "REQUIREMENTS:\n"
            "- Reflect the MAIN TOPIC\n"
            "- Everyday language\n"
            "- Avoid technical terms\n\n"
            f"Content:\n{context}\n\n"
            "Return ONLY the title:"
        )

    try:
        response = await client.chat.completions.create(
            model=MODEL_TITLE,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=20,
        )

        title = response.choices[0].message.content.strip()

        # Clean nhẹ – KHÔNG phá nghĩa
        title = title.replace("\n", " ").strip()
        title = title.strip('"“”')

        # Giới hạn theo KÝ TỰ (an toàn cho tiếng Việt)
        if len(title) > 40:
            title = title[:40].rstrip()

        return title if len(title) >= 3 else default_title

    except Exception as e:
        logger.error(f"generate_title error: {e}")
        return default_title

