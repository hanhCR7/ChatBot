import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

#Gọi OpenAI API để lấy phản hồi từ mô hình
async def generate_response(chatlog):
    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=chatlog,
        temperature=0.7,
        max_tokens=1500,
        n=1,
        stop=None,
        stream=True,
    )
#Gọi OpenAI để tự tạo tiêu đề từ tin nhăn đầu tiên
async def generate_title(first_user_message: str) -> str:
    system_prompt = {
        "role": "system",
        "content": "You are a helpful assistant that replies clearly and concisely."
    }
    message = [
        system_prompt,
        {
            "role": "user",
            "content": first_user_message
        }
    ]
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=message,
            temperature=0.7,
            max_tokens=1500,
            n=1,
            stop=None
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating title: {e}")
        return "New Chat"
