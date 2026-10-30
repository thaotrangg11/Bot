"""KV-backed storage — bỏ async để chạy đồng bộ."""
import json, time
from js import Object

def kv_get(env, key: str, default=None):
    raw = env.BOT_KV.get(key, "text").sync()
    if raw is None: return default
    try: return json.loads(raw)
    except Exception: return raw

def kv_put(env, key: str, value) -> None:
    if isinstance(value, (dict, list)): value = json.dumps(value, ensure_ascii=False)
    env.BOT_KV.put(key, str(value)).sync()

def touch_user(env, uid: int, username: str, first: str):
    key = f"user:{uid}"
    u = kv_get(env, key, {"user_id": uid})
    u["username"] = username or ""
    u["first_name"] = first or ""
    u["last_seen"] = time.time()
    kv_put(env, key, u)

def get_user(env, uid: int) -> dict:
    return kv_get(env, f"user:{uid}", {})

def is_banned(env, uid: int) -> bool:
    return (get_user(env, uid)).get("banned", False)

def ban(env, uid: int, b: bool = True):
    u = get_user(env, uid)
    u["banned"] = b
    kv_put(env, f"user:{uid}", u)

def vip_until(env, uid: int):
    rec = kv_get(env, f"vip:{uid}")
    if not rec: return None
    exp = rec.get("expires_at", 0)
    return exp if exp > time.time() else None

def activate_vip(env, uid: int, days: int) -> int:
    now = int(time.time())
    rec = kv_get(env, f"vip:{uid}", {"expires_at": 0})
    base = max(rec.get("expires_at", 0), now)
    new_exp = 4102444800 if days == -1 else base + days * 86400
    kv_put(env, f"vip:{uid}", {"expires_at": new_exp, "activated_at": now})
    return new_exp

def today_usage(env, uid: int, day: str) -> int:
    rec = kv_get(env, f"usage:{uid}:{day}", {})
    return rec.get("rounds", 0)

def bump_usage(env, uid: int, day: str, n: int):
    key = f"usage:{uid}:{day}"
    rec = kv_get(env, key, {"rounds": 0})
    rec["rounds"] = rec.get("rounds", 0) + n
    kv_put(env, key, rec)

def push_job(env, uid: int, job: dict):
    key = f"jobs:{uid}"
    lst = kv_get(env, key, [])
    lst.insert(0, job)
    kv_put(env, key, lst[:20])

def list_jobs(env, uid: int) -> list:
    return kv_get(env, f"jobs:{uid}", [])

def bump_counter(env, name: str, n: int = 1):
    cur = kv_get(env, f"counter:{name}", 0)
    kv_put(env, f"counter:{name}", int(cur) + n)

def get_counter(env, name: str) -> int:
    return int(kv_get(env, f"counter:{name}", 0))
