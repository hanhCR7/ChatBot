from typing import Dict, List
from fastapi import WebSocket
from collections import defaultdict
import asyncio
from starlette.websockets import WebSocketState
import datetime

class ConnectionManager:
    def __init__(self):
        # Cấu trúc: {chat_id: {user_id: [WebSocket, ...]}}
        self.active_connections: Dict[str, Dict[int, List[WebSocket]]] = defaultdict(lambda: defaultdict(list))
        self.lock = asyncio.Lock()  # Lock để tránh race condition

    async def connect(self, websocket: WebSocket, chat_id: str, user_id: int):
        async with self.lock:
            self.active_connections[str(chat_id)][user_id].append(websocket)

    async def disconnect(self, websocket: WebSocket, chat_id: str, user_id: int):
        async with self.lock:
            try:
                self.active_connections[str(chat_id)][user_id].remove(websocket)
                if not self.active_connections[str(chat_id)][user_id]:
                    del self.active_connections[str(chat_id)][user_id]
                if not self.active_connections[str(chat_id)]:
                    del self.active_connections[str(chat_id)]
            except (KeyError, ValueError):
                pass

    async def broadcast(self, chat_id: str, message: dict, skip_user_id: int = None):
        async with self.lock:
            for user_id, connections in self.active_connections.get(str(chat_id), {}).items():
                if user_id == skip_user_id:
                    continue
                for socket in connections:
                    if socket.client_state == WebSocketState.CONNECTED:
                        try:
                            await socket.send_json(message)
                        except Exception:
                            pass

    async def broadcast_stream(
        self, chat_id: str, content_generator, skip_user_id: int = None, interval: float = 0.5
    ):
        """
        Gửi dữ liệu dạng stream buffer từ generator (hoặc async generator) cho tất cả user
        ngoại trừ `skip_user_id`.
        - content_generator: yield từng đoạn text
        - interval: gửi buffer mỗi `interval` giây nếu buffer chưa kết thúc câu
        """
        buffer = ""
        last_send_time = datetime.datetime.now()
        async for chunk in content_generator:
            buffer += chunk
            now = datetime.datetime.now()
            if any(buffer.endswith(punct) for punct in [".", "!", "?", "…", "。", "！", "？"]) \
               or (now - last_send_time).total_seconds() > interval \
               or len(buffer) >= 20:
                # Gửi buffer đến tất cả user
                async with self.lock:
                    for user_id, connections in self.active_connections.get(str(chat_id), {}).items():
                        if user_id == skip_user_id:
                            continue
                        for socket in connections:
                            if socket.client_state == WebSocketState.CONNECTED:
                                try:
                                    await socket.send_json({
                                        "role": "assistant",
                                        "content": buffer,
                                        "timestamp": now.isoformat()
                                    })
                                except Exception:
                                    pass
                buffer = ""
                last_send_time = now
        # Gửi buffer còn lại
        if buffer.strip():
            async with self.lock:
                for user_id, connections in self.active_connections.get(str(chat_id), {}).items():
                    if user_id == skip_user_id:
                        continue
                    for socket in connections:
                        if socket.client_state == WebSocketState.CONNECTED:
                            try:
                                await socket.send_json({
                                    "role": "assistant",
                                    "content": buffer,
                                    "timestamp": datetime.datetime.now().isoformat()
                                })
                            except Exception:
                                pass
