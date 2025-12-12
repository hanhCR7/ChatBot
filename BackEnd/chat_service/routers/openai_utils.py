from openai import AsyncOpenAI
import os
import re
from langdetect import detect
from dotenv import load_dotenv

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

async def generate_title(messages: list[str]) -> str:
    """
    Tạo tiêu đề ngắn gọn kiểu ChatGPT từ hội thoại.
    Auto detect ngôn ngữ (vi/en).
    Luôn trả về cụm danh từ, ngắn gọn, tổng quát, max 6 từ.
    """
    if not messages:
        return "Cuộc trò chuyện mới"

    content = "\n".join(
        [m.get("content", "") if isinstance(m, dict) else str(m) for m in messages[:3]]
    ).strip()

    try:
        lang = detect(content)
    except Exception:
        lang = "en"

    if lang.startswith("vi"):
        default_title = "Cuộc trò chuyện mới"
        prompt = (
            "Bạn là AI chuyên tạo tiêu đề ngắn gọn, súc tích cho cuộc hội thoại.\n\n"
            "YÊU CẦU:\n"
            "- Trả về CHỈ 1 cụm từ danh từ (tối đa 6 từ)\n"
            "- KHÔNG viết câu hoàn chỉnh, KHÔNG giải thích\n"
            "- KHÔNG thêm prefix như 'Tiêu đề:', 'Title:', hoặc dấu câu\n"
            "- Tiêu đề phải tổng quát, dễ hiểu, phù hợp với nội dung chính của cuộc trò chuyện\n"
            "- Phong cách giống ChatGPT: ngắn gọn, rõ ràng\n\n"
            f"Cuộc hội thoại:\n{content}\n\n"
            "Trả về CHỈ tiêu đề (không có gì khác):"
        )
    else:
        default_title = "New Chat"
        prompt = (
            "You are an AI specialized in generating short, concise titles for chat conversations.\n\n"
            "REQUIREMENTS:\n"
            "- Output ONLY one noun phrase (maximum 6 words)\n"
            "- Do NOT write a complete sentence, do NOT explain\n"
            "- Do NOT add prefixes like 'Title:', 'Tiêu đề:', or punctuation\n"
            "- Title must be general, easy to understand, relevant to the main conversation content\n"
            "- ChatGPT style: short and clear\n\n"
            f"Conversation:\n{content}\n\n"
            "Return ONLY the title (nothing else):"
        )

    try:
        response = await client.chat.completions.create(
            model=MODEL_TITLE,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            max_tokens=16,
        )

        raw_title = response.choices[0].message.content.strip()

        # Xóa prefix, ký tự thừa
        raw_title = re.sub(r'^(Tiêu đề[:：]\s*|Title[:：]\s*)', '', raw_title, flags=re.IGNORECASE)
        clean_title = re.sub(r'[\"“”‘’\'.:;!?()\n]', '', raw_title).strip()

        # Giữ max 5 từ
        words = clean_title.split()
        if len(words) > 5:
            clean_title = " ".join(words[:6])

        return clean_title if clean_title else default_title

    except Exception as e:
        print(f"[generate_title] Error: {e}")
        return default_title
