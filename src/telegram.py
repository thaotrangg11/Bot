"""Telegram Bot API wrapper — đồng bộ hoàn toàn."""
from pyodide.http import pyfetch
import json

API = "https://api.telegram.org/bot"

def _post(token: str, method: str, payload: dict) -> dict:
    try:
        resp = pyfetch(
            f"{API}{token}/{method}",
            method="POST",
            headers={"Content-Type": "application/json"},
            body=json.dumps(payload)
        ).sync()  # Gọi đồng bộ, không dùng async/await
        return resp.json()
    except Exception as e:
        return {"ok": False, "error": str(e)}

def send_message(token: str, chat_id: int, text: str,
                 parse_mode: str = "HTML",
                 reply_markup: dict = None,
                 reply_to: int = None) -> dict:
    payload = {"chat_id": chat_id, "text": text[:4096]}
    if parse_mode: payload["parse_mode"] = parse_mode
    if reply_markup: payload["reply_markup"] = reply_markup
    if reply_to: payload["reply_to_message_id"] = reply_to
    return _post(token, "sendMessage", payload)

def edit_message(token: str, chat_id: int, message_id: int,
                 text: str, parse_mode: str = "HTML") -> dict:
    return _post(token, "editMessageText", {
        "chat_id": chat_id, "message_id": message_id,
        "text": text[:4096], "parse_mode": parse_mode,
    })
