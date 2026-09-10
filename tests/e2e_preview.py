import sys
from playwright.sync_api import sync_playwright

BASE = "https://dc375305-e939-4d45-b6c8-3ebf7022a650.preview.emergentagent.com"


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        page = browser.new_page()
        page.goto(f"{BASE}/auth", wait_until="domcontentloaded")
        try:
            page.wait_for_selector('[data-testid="login-usuario-input"]', timeout=35000, state="visible")
            print("PASS: preview render OK (login form visible via preview URL)")
        except Exception as e:
            print("FAIL: preview render blank:", e)
            body = page.evaluate("() => document.body.innerText")
            print("BODY:", body[:200])
            browser.close()
            sys.exit(1)
        # quick login sanity through preview
        page.fill('[data-testid="login-usuario-input"]', "flow")
        page.fill('[data-testid="login-pin-input"]', "9999")
        page.click('[data-testid="login-submit-button"]')
        page.wait_for_timeout(5000)
        print("URL after login:", page.url)
        browser.close()


if __name__ == "__main__":
    run()
